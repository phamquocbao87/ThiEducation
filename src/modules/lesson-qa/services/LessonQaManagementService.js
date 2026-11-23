import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { ClassService } from '../../courses/services/ClassService';
import {
  LessonQuestionService,
  QUESTION_STATUS,
  QUESTION_VISIBILITY,
} from '../../lesson-reader';
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from '../../../core/services/NotificationService';

/**
 * LessonQaManagementService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * Cung cấp dữ liệu Q&A được làm giàu đầy đủ ngữ cảnh (Lớp học, Buổi học, Tên Bài học, Đoạn trích dẫn)
 * và áp dụng cô lập quyền chặt chẽ theo 6 Roles RBAC:
 * - student: Chỉ câu của mình + câu `CLASS_SHARED` thuộc các lớp đang học.
 * - teacher: Chỉ câu thuộc các lớp giáo viên phụ trách (ẩn 100% Zalo & SĐT PH).
 * - academic / director / admin: Toàn bộ câu hỏi toàn trường để giám sát & hỗ trợ giải đáp.
 * - accountant: Không được phép truy cập.
 */
export class LessonQaManagementService extends BaseModuleService {
  static OVERDUE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

  /**
   * Chuẩn hóa & làm giàu ngữ cảnh Lớp + Buổi học + Tên bài học cho từng câu hỏi
   */
  static enrichQuestion(q, classMap) {
    const cls = classMap.get(String(q.classId)) || null;
    const sessionIdx = Number(q.sessionIndex) || 1;
    const plan = cls?.lessonPlans?.[String(sessionIdx)] || cls?.lessonPlans?.[sessionIdx] || null;

    const lessonTitle =
      q.lessonTitle ||
      plan?.lessonTitle ||
      plan?.unitWeek ||
      `Buổi ${sessionIdx}`;

    const createdMs = q.createdAt ? new Date(q.createdAt).getTime() : 0;
    const isOverdue24h =
      q.status === QUESTION_STATUS.OPEN &&
      createdMs > 0 &&
      Date.now() - createdMs > this.OVERDUE_THRESHOLD_MS;

    return {
      ...q,
      className: q.className || cls?.name || q.classId || 'Lớp học',
      courseLevel: cls?.courseLevel || '',
      teacherId: q.teacherId || cls?.teacherId || '',
      teacherName: q.teacherName || cls?.teacherName || 'Teacher',
      sessionIndex: sessionIdx,
      lessonTitle,
      lessonKey: `${q.classId}__S${sessionIdx}`,
      isOverdue24h,
    };
  }

  /**
   * Nạp toàn bộ danh sách câu hỏi & lớp học đã cô lập chuẩn theo Role của `currentUser`
   */
  static async getScopedQaDataset(currentUser) {
    if (!currentUser) {
      return { questions: [], classes: [], summary: this.buildSummary([]) };
    }

    const role = String(currentUser.role || '').toLowerCase();
    const uid = String(currentUser.id || currentUser.code || '');

    const [allClasses, allQuestions] = await Promise.all([
      ClassService.getAllClasses().catch(() => []),
      LessonQuestionService.getAllQuestions().catch(() => []),
    ]);

    const activeClasses = (allClasses || []).filter(
      (c) => c && !c.isDeleted && c.status !== 'Deleted'
    );
    const classMap = new Map();
    activeClasses.forEach((c) => {
      if (c.id) classMap.set(String(c.id), c);
      if (c.code) classMap.set(String(c.code), c);
    });

    // Cô lập lớp theo Role
    let scopedClasses = activeClasses;
    if (role === 'student') {
      const enrolledIds = new Set([
        ...(Array.isArray(currentUser.enrolledClassIds) ? currentUser.enrolledClassIds : []),
        ...(Array.isArray(currentUser.classesEnrolled) ? currentUser.classesEnrolled : []),
      ].map(String));
      scopedClasses = activeClasses.filter(
        (c) =>
          enrolledIds.has(String(c.id)) ||
          (Array.isArray(c.studentIds) && c.studentIds.map(String).includes(uid))
      );
    } else if (role === 'teacher') {
      scopedClasses = activeClasses.filter(
        (c) => String(c.teacherId) === uid || (currentUser.name && c.teacherName === currentUser.name)
      );
    } else if (role === 'accountant') {
      scopedClasses = [];
    }

    const scopedClassIds = new Set(scopedClasses.map((c) => String(c.id || c.code)));

    // Cô lập câu hỏi theo Role (Strict Privacy Guard)
    const enriched = (allQuestions || [])
      .filter((q) => !q.isDeleted)
      .map((q) => this.enrichQuestion(q, classMap));

    let scopedQuestions = [];
    if (role === 'student') {
      scopedQuestions = enriched.filter((q) => {
        const isOwn = String(q.studentId) === uid;
        const isSharedInMyClass =
          q.visibility === QUESTION_VISIBILITY.CLASS_SHARED && scopedClassIds.has(String(q.classId));
        return isOwn || isSharedInMyClass;
      });
    } else if (role === 'teacher') {
      scopedQuestions = enriched.filter(
        (q) => scopedClassIds.has(String(q.classId)) || String(q.teacherId) === uid
      );
    } else if (['academic', 'director', 'admin'].includes(role)) {
      scopedQuestions = enriched;
    }

    // Sắp xếp: Câu mới (OPEN) lên đầu, trong cùng trạng thái ưu tiên mới nhất lên trước
    scopedQuestions.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === QUESTION_STATUS.OPEN ? -1 : 1;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return {
      questions: scopedQuestions,
      classes: scopedClasses,
      summary: this.buildSummary(scopedQuestions),
    };
  }

  /**
   * Tính các chỉ số tổng quan Q&A
   */
  static buildSummary(questions = []) {
    const total = questions.length;
    const openCount = questions.filter((q) => q.status === QUESTION_STATUS.OPEN).length;
    const answeredCount = questions.filter((q) => q.status === QUESTION_STATUS.ANSWERED).length;
    const sharedCount = questions.filter((q) => q.visibility === QUESTION_VISIBILITY.CLASS_SHARED).length;
    const overdueCount = questions.filter((q) => q.isOverdue24h).length;
    const responseRate = total > 0 ? Math.round((answeredCount / total) * 100) : 100;

    return {
      total,
      openCount,
      answeredCount,
      sharedCount,
      overdueCount,
      responseRate,
    };
  }

  /**
   * Giáo vụ / Giám đốc / Admin gửi nhắc nhở Giáo viên trả lời câu hỏi tồn đọng
   */
  static async remindTeacherToAnswer({ question, senderUser, isEnglish = false }) {
    if (!question?.teacherId) return null;
    return NotificationService.sendNotification({
      recipientId: String(question.teacherId),
      recipientRole: 'teacher',
      type: NOTIFICATION_TYPES.STUDENT_LESSON_QUESTION,
      title: isEnglish
        ? `⏰ Reminder: Student question pending (${question.className} - Session ${question.sessionIndex})`
        : `⏰ Nhắc nhở: Câu hỏi học viên đang chờ trả lời (${question.className} • Buổi ${question.sessionIndex})`,
      message: isEnglish
        ? `${question.studentName} asked: "${(question.questionText || '').slice(0, 120)}"`
        : `Học viên ${question.studentName} đang chờ giải đáp: "${(question.questionText || '').slice(0, 120)}"`,
      actionUrl: `/lesson-qa?qaId=${encodeURIComponent(question.id)}`,
      metadata: {
        questionId: question.id,
        classId: question.classId,
        sessionIndex: question.sessionIndex,
      },
      createdBy: senderUser?.id || 'academic',
      createdByName: senderUser?.name || 'Giáo Vụ Đào Tạo',
      createdByRole: senderUser?.role || 'academic',
    });
  }
}

export default LessonQaManagementService;
