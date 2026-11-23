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
import { LessonReadingTrackerService } from './LessonReadingTrackerService';

const NOTES_CACHE_PREFIX = 'lak_lesson_student_notes_v1';
const NOTES_TOMBSTONE_PREFIX = 'lak_lesson_student_notes_deleted_v1';

/**
 * LessonStudentNoteService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * Quản lý Ghi chú học tập cá nhân (`lesson_student_notes`) gắn với từng buổi học / đoạn mục tiêu.
 * - Quyền riêng tư tuyệt đối: chỉ học viên sở hữu `studentId` mới xem/sửa/xóa được ghi chú của mình.
 * - 0ms Optimistic State Update + Tombstone chống dữ liệu xóa sống lại qua F5.
 */
export class LessonStudentNoteService extends BaseModuleService {
  static COLLECTION_NAME = 'lesson_student_notes';

  static getCacheKey(studentId) {
    return `${NOTES_CACHE_PREFIX}_${studentId || 'guest'}`;
  }

  static getTombstoneKey(studentId) {
    return `${NOTES_TOMBSTONE_PREFIX}_${studentId || 'guest'}`;
  }

  static getTombstoneSet(studentId) {
    try {
      const raw = localStorage.getItem(this.getTombstoneKey(studentId));
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  static addTombstone(studentId, noteId) {
    try {
      const set = this.getTombstoneSet(studentId);
      set.add(noteId);
      localStorage.setItem(this.getTombstoneKey(studentId), JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }

  static getLocalCache(studentId) {
    try {
      const raw = localStorage.getItem(this.getCacheKey(studentId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static setLocalCache(studentId, list) {
    try {
      localStorage.setItem(this.getCacheKey(studentId), JSON.stringify(list || []));
    } catch {
      // ignore
    }
  }

  /**
   * Đọc danh sách ghi chú cá nhân của 1 học viên trong 1 buổi học
   */
  static async getNotesForLesson({ classId, sessionIndex, studentId }) {
    if (!classId || !studentId) return [];
    const sessionNum = Number(sessionIndex) || 1;
    const deletedIds = this.getTombstoneSet(studentId);
    const localList = this.getLocalCache(studentId).filter(
      (n) => !n.isDeleted && !deletedIds.has(n.id)
    );

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('studentId', '==', String(studentId))
        );
        const snap = await getDocs(q);
        const byId = new Map();
        localList.forEach((n) => byId.set(n.id, n));
        snap.forEach((d) => {
          const item = { id: d.id, ...d.data() };
          if (item.isDeleted || deletedIds.has(item.id)) {
            byId.delete(item.id);
          } else {
            byId.set(item.id, item);
          }
        });
        const mergedAll = Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        this.setLocalCache(studentId, mergedAll);
        return mergedAll.filter(
          (n) => n.classId === classId && Number(n.sessionIndex) === sessionNum
        );
      } catch (err) {
        console.warn('[LessonStudentNoteService] Lỗi tải ghi chú từ Firestore:', err.message);
      }
    }

    return localList
      .filter((n) => n.classId === classId && Number(n.sessionIndex) === sessionNum)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  /**
   * Tạo ghi chú mới (0ms Optimistic + Firestore + đồng bộ notesCount sang reading log)
   */
  static async createNote({
    classItem,
    lessonPrep,
    studentUser,
    content,
    tag = 'KEY_IDEA',
    anchorIndex = null,
    anchorText = '',
  }) {
    const classId = classItem?.id || classItem?.code;
    const sessionIndex = Number(lessonPrep?.sessionIndex) || 1;
    const studentId = studentUser?.id || studentUser?.code;
    const trimmed = String(content || '').trim();
    if (!classId || !studentId || !trimmed) {
      throw new Error('Nội dung ghi chú không được để trống.');
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const id = `NOTE_${classId}_S${sessionIndex}_${studentId}_${nowMs}`;

    const record = {
      id,
      classId,
      className: classItem?.name || '',
      sessionIndex,
      studentId,
      studentName: studentUser?.name || '',
      anchorIndex: anchorIndex != null ? Number(anchorIndex) : null,
      anchorText: String(anchorText || '').replace(/<[^>]+>/g, '').trim().slice(0, 240),
      tag: tag || 'KEY_IDEA',
      content: trimmed,
      isDeleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const existing = this.getLocalCache(studentId);
    const updatedAll = [record, ...existing.filter((n) => n.id !== id)];
    this.setLocalCache(studentId, updatedAll);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, this.COLLECTION_NAME, id), record);
        // Cập nhật đếm notesCount trên lesson_reading_logs (non-blocking)
        const sessionNotesCount = updatedAll.filter(
          (n) => !n.isDeleted && n.classId === classId && Number(n.sessionIndex) === sessionIndex
        ).length;
        const logId = LessonReadingTrackerService.buildLogId(classId, sessionIndex, studentId);
        setDoc(
          doc(db, LessonReadingTrackerService.COLLECTION_NAME, logId),
          { notesCount: sessionNotesCount, updatedAt: nowIso },
          { merge: true }
        ).catch(() => {});
      } catch (err) {
        console.warn('[LessonStudentNoteService] Lỗi lưu ghi chú lên Firestore:', err.message);
      }
    }

    return record;
  }

  /**
   * Cập nhật nội dung / nhãn ghi chú
   */
  static async updateNote({ noteId, studentId, content, tag }) {
    const trimmed = String(content || '').trim();
    if (!noteId || !studentId || !trimmed) return null;
    const nowIso = new Date().toISOString();

    const existing = this.getLocalCache(studentId);
    let updatedRecord = null;
    const nextList = existing.map((n) => {
      if (n.id !== noteId) return n;
      updatedRecord = { ...n, content: trimmed, tag: tag || n.tag, updatedAt: nowIso };
      return updatedRecord;
    });
    this.setLocalCache(studentId, nextList);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(
          doc(db, this.COLLECTION_NAME, noteId),
          { content: trimmed, ...(tag ? { tag } : {}), updatedAt: nowIso },
          { merge: true }
        );
      } catch (err) {
        console.warn('[LessonStudentNoteService] Lỗi cập nhật ghi chú:', err.message);
      }
    }

    return updatedRecord;
  }

  /**
   * Xóa ghi chú (0ms + Tombstone + Soft Delete trên Firestore)
   */
  static async deleteNote({ noteId, studentId, classId = null, sessionIndex = null }) {
    if (!noteId || !studentId) return;
    const nowIso = new Date().toISOString();

    this.addTombstone(studentId, noteId);
    const existing = this.getLocalCache(studentId);
    const nextList = existing.filter((n) => n.id !== noteId);
    this.setLocalCache(studentId, nextList);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(
          doc(db, this.COLLECTION_NAME, noteId),
          { isDeleted: true, deletedAt: nowIso, updatedAt: nowIso },
          { merge: true }
        );
        if (classId && sessionIndex) {
          const sessionNotesCount = nextList.filter(
            (n) => !n.isDeleted && n.classId === classId && Number(n.sessionIndex) === Number(sessionIndex)
          ).length;
          const logId = LessonReadingTrackerService.buildLogId(classId, sessionIndex, studentId);
          setDoc(
            doc(db, LessonReadingTrackerService.COLLECTION_NAME, logId),
            { notesCount: sessionNotesCount, updatedAt: nowIso },
            { merge: true }
          ).catch(() => {});
        }
      } catch (err) {
        console.warn('[LessonStudentNoteService] Lỗi xóa ghi chú trên Firestore:', err.message);
      }
    }
  }

  /**
   * Hard delete phục vụ Zero-Residue Teardown
   */
  static async hardDeleteNote(noteId, studentId) {
    if (!noteId) return;
    if (studentId) {
      this.setLocalCache(
        studentId,
        this.getLocalCache(studentId).filter((n) => n.id !== noteId)
      );
    }
    if (IS_FIREBASE_ENABLED && db) {
      try {
        await deleteDoc(doc(db, this.COLLECTION_NAME, noteId));
      } catch {
        // ignore
      }
    }
  }
}

export default LessonStudentNoteService;
