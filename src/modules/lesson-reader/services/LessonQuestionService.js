import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from '../../../core/services/NotificationService';
import {
  QUESTION_STATUS,
  QUESTION_VISIBILITY,
} from '../models/lessonReader.model';
import { LessonReadingTrackerService } from './LessonReadingTrackerService';

const QA_CACHE_KEY = 'lak_lesson_questions_cache_v1';

/**
 * LessonQuestionService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * Quản lý luồng Hỏi – Đáp 2 chiều Học viên <-> Giáo viên (`lesson_questions`):
 * - Mặc định riêng tư 1-1 (`PRIVATE`: Học viên + Giáo viên + Giáo vụ).
 * - Cho phép Giáo viên bật chia sẻ câu hỏi hay cho cả lớp (`CLASS_SHARED`).
 * - Tự động bắn Realtime Notification 2 chiều qua NotificationService.
 * - 100% in-app, tuyệt đối KHÔNG dùng Zalo đối với Giáo viên bản xứ.
 */
export class LessonQuestionService extends BaseModuleService {
  static COLLECTION_NAME = 'lesson_questions';

  static getLocalCache() {
    try {
      const raw = localStorage.getItem(QA_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static setLocalCache(list) {
    try {
      localStorage.setItem(QA_CACHE_KEY, JSON.stringify((list || []).slice(0, 200)));
    } catch {
      // ignore
    }
  }

  static upsertLocalCache(record) {
    const cur = this.getLocalCache();
    this.setLocalCache([record, ...cur.filter((q) => q.id !== record.id)]);
  }

  /**
   * Đọc câu hỏi Q&A cho Học Viên trong 1 buổi học (Strict Student Privacy Guard):
   * Chỉ trả về câu hỏi của chính học viên đó HOẶC câu đã được GV bật `CLASS_SHARED`.
   * TUYỆT ĐỐI KHÔNG trả về câu `PRIVATE` của học viên khác!
   */
  static async getQuestionsForStudent({ classId, sessionIndex, studentId }) {
    if (!classId || !studentId) return [];
    const sessionNum = Number(sessionIndex) || 1;
    let items = [];

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('classId', '==', String(classId))
        );
        const snap = await getDocs(q);
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() });
        });
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi đọc câu hỏi cho học viên:', err.message);
        items = this.getLocalCache().filter((x) => x.classId === classId);
      }
    } else {
      items = this.getLocalCache().filter((x) => x.classId === classId);
    }

    return items
      .filter((item) => {
        if (item.isDeleted) return false;
        if (Number(item.sessionIndex) !== sessionNum) return false;
        // Kỷ luật bảo mật: chỉ câu của chính học viên HOẶC câu đã chia sẻ cho cả lớp
        const isOwn = item.studentId === studentId;
        const isShared = item.visibility === QUESTION_VISIBILITY.CLASS_SHARED;
        return isOwn || isShared;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  /**
   * Đọc danh sách câu hỏi gửi tới Giáo viên (lọc theo các lớp GV phụ trách)
   */
  static async getQuestionsForTeacher({ teacherId, classIds = [] }) {
    const allowedSet = new Set((classIds || []).map(String));
    let items = [];

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const snap = await getDocs(collection(db, this.COLLECTION_NAME));
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() });
        });
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi đọc câu hỏi cho giáo viên:', err.message);
        items = this.getLocalCache();
      }
    } else {
      items = this.getLocalCache();
    }

    return items
      .filter((item) => {
        if (item.isDeleted) return false;
        if (allowedSet.size > 0 && allowedSet.has(String(item.classId))) return true;
        if (teacherId && item.teacherId === teacherId) return true;
        return false;
      })
      .sort((a, b) => {
        // Ưu tiên câu OPEN (chưa trả lời) lên đầu, sau đó mới nhất trước
        if (a.status !== b.status) {
          return a.status === QUESTION_STATUS.OPEN ? -1 : 1;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }

  /**
   * Đọc toàn bộ câu hỏi toàn trường (cho Giáo vụ / Giám đốc / Admin giám sát SLA)
   */
  static async getAllQuestions() {
    let items = [];
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const snap = await getDocs(collection(db, this.COLLECTION_NAME));
        snap.forEach((d) => {
          const item = { id: d.id, ...d.data() };
          if (!item.isDeleted) items.push(item);
        });
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi đọc toàn bộ câu hỏi:', err.message);
        items = this.getLocalCache().filter((i) => !i.isDeleted);
      }
    } else {
      items = this.getLocalCache().filter((i) => !i.isDeleted);
    }
    return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  /**
   * Học viên đặt câu hỏi mới gửi tới Giáo viên (Mặc định PRIVATE 1-1 + Bắn Realtime Notification)
   */
  static async createQuestion({
    classItem,
    lessonPrep,
    studentUser,
    questionText,
    anchorIndex = null,
    anchorText = '',
  }) {
    const classId = classItem?.id || classItem?.code;
    const sessionIndex = Number(lessonPrep?.sessionIndex) || 1;
    const studentId = studentUser?.id || studentUser?.code;
    const trimmed = String(questionText || '').trim();

    if (!classId || !studentId || !trimmed) {
      throw new Error('Nội dung câu hỏi không được để trống.');
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const id = `QA_${classId}_S${sessionIndex}_${studentId}_${nowMs}`;
    const cleanAnchor = String(anchorText || '').replace(/<[^>]+>/g, '').trim().slice(0, 240);

    const record = {
      id,
      classId,
      className: classItem?.name || '',
      sessionIndex,
      lessonTitle: lessonPrep?.lessonTitle || '',
      studentId,
      studentName: studentUser?.name || '',
      studentEnglishName: studentUser?.englishName || '',
      teacherId: classItem?.teacherId || '',
      teacherName: classItem?.teacherName || 'Teacher',
      anchorIndex: anchorIndex != null ? Number(anchorIndex) : null,
      anchorText: cleanAnchor,
      questionText: trimmed,
      status: QUESTION_STATUS.OPEN,
      visibility: QUESTION_VISIBILITY.PRIVATE,
      answerText: '',
      answeredBy: null,
      answeredByName: '',
      answeredAt: null,
      resolvedByStudent: false,
      isDeleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.upsertLocalCache(record);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, this.COLLECTION_NAME, id), record);

        // Cập nhật đếm questionsCount trên lesson_reading_logs (non-blocking)
        const logId = LessonReadingTrackerService.buildLogId(classId, sessionIndex, studentId);
        const existingLog = await LessonReadingTrackerService.getReadingLog({
          classId,
          sessionIndex,
          studentId,
        });
        setDoc(
          doc(db, LessonReadingTrackerService.COLLECTION_NAME, logId),
          { questionsCount: (Number(existingLog?.questionsCount) || 0) + 1, updatedAt: nowIso },
          { merge: true }
        ).catch(() => {});
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi lưu câu hỏi lên Firestore:', err.message);
      }
    }

    // Bắn Realtime Notification tới Giáo viên phụ trách lớp
    const displayStudent = studentUser?.englishName
      ? `${studentUser.name} (${studentUser.englishName})`
      : studentUser?.name || studentId;

    if (record.teacherId) {
      NotificationService.sendNotification({
        recipientId: record.teacherId,
        recipientRole: 'teacher',
        type: NOTIFICATION_TYPES.STUDENT_LESSON_QUESTION,
        title: `🙋 New Student Question (${record.className} - Session ${sessionIndex})`,
        message: `${displayStudent} asked: "${trimmed.slice(0, 120)}${trimmed.length > 120 ? '...' : ''}"`,
        actionUrl: `/lesson-qa?qaId=${encodeURIComponent(id)}`,
        metadata: {
          questionId: id,
          classId,
          sessionIndex,
          studentId,
        },
        createdBy: studentId,
        createdByName: displayStudent,
        createdByRole: 'student',
      }).catch((err) => console.warn('[LessonQuestionService] Lỗi gửi notification cho GV:', err?.message));
    }

    // Đồng thời thông báo cho Giáo vụ theo dõi chất lượng phản hồi
    NotificationService.sendNotification({
      recipientId: null,
      recipientRole: 'academic',
      type: NOTIFICATION_TYPES.STUDENT_LESSON_QUESTION,
      title: `🙋 Câu hỏi mới từ học viên (${record.className} • Buổi ${sessionIndex})`,
      message: `${displayStudent} hỏi GV ${record.teacherName}: "${trimmed.slice(0, 120)}${trimmed.length > 120 ? '...' : ''}"`,
      actionUrl: `/dashboard?qaId=${encodeURIComponent(id)}`,
      metadata: {
        questionId: id,
        classId,
        sessionIndex,
        studentId,
        teacherId: record.teacherId,
      },
      createdBy: studentId,
      createdByName: displayStudent,
      createdByRole: 'student',
    }).catch(() => {});

    return record;
  }

  /**
   * Giáo viên trả lời câu hỏi của học viên + tùy chọn chia sẻ cả lớp (`CLASS_SHARED`)
   */
  static async answerQuestion({
    question,
    answerText,
    teacherUser,
    shareWithClass = false,
  }) {
    const trimmed = String(answerText || '').trim();
    if (!question?.id || !trimmed) {
      throw new Error('Nội dung câu trả lời không được để trống.');
    }

    const nowIso = new Date().toISOString();
    const visibility = shareWithClass
      ? QUESTION_VISIBILITY.CLASS_SHARED
      : QUESTION_VISIBILITY.PRIVATE;

    const updated = {
      ...question,
      status: QUESTION_STATUS.ANSWERED,
      visibility,
      answerText: trimmed,
      answeredBy: teacherUser?.id || teacherUser?.code || question.teacherId || 'teacher',
      answeredByName: teacherUser?.name || question.teacherName || 'Teacher',
      answeredAt: nowIso,
      updatedAt: nowIso,
    };

    this.upsertLocalCache(updated);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, this.COLLECTION_NAME, question.id), updated, { merge: true });
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi lưu câu trả lời lên Firestore:', err.message);
      }
    }

    // Bắn Realtime Notification ngược lại cho Học Viên
    if (question.studentId) {
      NotificationService.sendNotification({
        recipientId: question.studentId,
        recipientRole: 'student',
        type: NOTIFICATION_TYPES.TEACHER_QUESTION_ANSWERED,
        title: `✅ ${updated.answeredByName} đã trả lời câu hỏi của con!`,
        message: `"${trimmed.slice(0, 120)}${trimmed.length > 120 ? '...' : ''}"`,
        actionUrl: `/dashboard?openReader=1&classId=${encodeURIComponent(question.classId)}&qaId=${encodeURIComponent(question.id)}`,
        metadata: {
          questionId: question.id,
          classId: question.classId,
          sessionIndex: question.sessionIndex,
          visibility,
        },
        createdBy: updated.answeredBy,
        createdByName: updated.answeredByName,
        createdByRole: teacherUser?.role || 'teacher',
      }).catch((err) => console.warn('[LessonQuestionService] Lỗi gửi notification cho HV:', err?.message));
    }

    return updated;
  }

  /**
   * Giáo viên bật / tắt chia sẻ câu hỏi cho cả lớp cùng học (`PRIVATE` <-> `CLASS_SHARED`)
   */
  static async toggleVisibility({ question, shareWithClass }) {
    if (!question?.id) return null;
    const nowIso = new Date().toISOString();
    const visibility = shareWithClass
      ? QUESTION_VISIBILITY.CLASS_SHARED
      : QUESTION_VISIBILITY.PRIVATE;

    const updated = { ...question, visibility, updatedAt: nowIso };
    this.upsertLocalCache(updated);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(
          doc(db, this.COLLECTION_NAME, question.id),
          { visibility, updatedAt: nowIso },
          { merge: true }
        );
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi cập nhật visibility:', err.message);
      }
    }

    return updated;
  }

  /**
   * Học viên bấm xác nhận "Con đã hiểu rồi"
   */
  static async markResolvedByStudent({ question, resolved = true }) {
    if (!question?.id) return null;
    const nowIso = new Date().toISOString();
    const updated = { ...question, resolvedByStudent: Boolean(resolved), updatedAt: nowIso };
    this.upsertLocalCache(updated);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(
          doc(db, this.COLLECTION_NAME, question.id),
          { resolvedByStudent: Boolean(resolved), updatedAt: nowIso },
          { merge: true }
        );
      } catch (err) {
        console.warn('[LessonQuestionService] Lỗi cập nhật resolvedByStudent:', err.message);
      }
    }

    return updated;
  }

  /**
   * Hard delete phục vụ Zero-Residue Teardown
   */
  static async hardDeleteQuestion(questionId) {
    if (!questionId) return;
    this.setLocalCache(this.getLocalCache().filter((q) => q.id !== questionId));
    if (IS_FIREBASE_ENABLED && db) {
      try {
        await deleteDoc(doc(db, this.COLLECTION_NAME, questionId));
      } catch {
        // ignore
      }
    }
  }
}

export default LessonQuestionService;
