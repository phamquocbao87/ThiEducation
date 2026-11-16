/**
 * StudentNoteService — Quản lý Tin Nhắn & Yêu Cầu Trao Đổi Phụ Huynh Từ Giáo Viên Đến Giáo Vụ
 * Backed 100% by Cloud Firestore (`student_teacher_notes` collection trong `lakeducationdb`)
 *
 * Nghiệp vụ cốt lõi:
 * 1. Giáo viên không thấy SĐT và không nhắn trực tiếp phụ huynh (tránh rào cản ngôn ngữ, bảo mật thông tin).
 * 2. Giáo viên gửi tin nhắn / ghi chú qua form chuẩn đến Giáo vụ.
 * 3. Tự động kích hoạt NotificationService gửi thông báo Realtime chuông đến Cán bộ Giáo vụ (academic, director, admin).
 * 4. Giáo vụ tiếp nhận, gọi điện / nhắn tin truyền đạt cho phụ huynh, sau đó đánh dấu hoàn tất (Audit Trail).
 */

import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { NotificationService, NOTIFICATION_TYPES } from '../../../core/services/NotificationService';

export const NOTE_CATEGORIES = {
  ACADEMIC_PROGRESS: 'ACADEMIC_PROGRESS',
  ATTENDANCE_ABSENCE: 'ATTENDANCE_ABSENCE',
  HOMEWORK_MATERIALS: 'HOMEWORK_MATERIALS',
  CLASS_ENGAGEMENT: 'CLASS_ENGAGEMENT',
  URGENT_PARENT_CALL: 'URGENT_PARENT_CALL',
  OTHER: 'OTHER',
};

export const NOTE_CATEGORY_LABELS = {
  vi: {
    ACADEMIC_PROGRESS: '📚 Học tập & Tiến độ',
    ATTENDANCE_ABSENCE: '⏰ Chuyên cần & Vắng học',
    HOMEWORK_MATERIALS: '📝 Nhắc bài tập & Sách vở',
    CLASS_ENGAGEMENT: '🌟 Tương tác & Thái độ',
    URGENT_PARENT_CALL: '📞 Cần gọi gấp phụ huynh',
    OTHER: '💬 Khác',
  },
  en: {
    ACADEMIC_PROGRESS: '📚 Academic & Progress',
    ATTENDANCE_ABSENCE: '⏰ Attendance & Absence',
    HOMEWORK_MATERIALS: '📝 Homework & Materials',
    CLASS_ENGAGEMENT: '🌟 Engagement & Attitude',
    URGENT_PARENT_CALL: '📞 Urgent Parent Call Request',
    OTHER: '💬 Other',
  },
};

export const NOTE_STATUS = {
  PENDING: 'PENDING',
  COMMUNICATED: 'COMMUNICATED',
};

const LOCAL_STORAGE_KEY = 'lak_erp_student_teacher_notes';

export class StudentNoteService extends BaseModuleService {
  static COLLECTION_NAME = 'student_teacher_notes';

  /**
   * Đọc cache cục bộ
   */
  static getLocalNotes() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu cache cục bộ
   */
  static setLocalNotes(list) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list || []));
    } catch (err) {
      console.warn('[StudentNoteService] Lỗi ghi cache cục bộ:', err);
    }
  }

  /**
   * Lấy toàn bộ danh sách tin nhắn từ Firestore
   */
  static async getAllNotes() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const allDocs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          const list = allDocs.filter((n) => !n.isDeleted);
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          this.setLocalNotes(list);
          return list;
        }
      } catch (err) {
        console.warn('[StudentNoteService] Lỗi đọc Firestore notes:', err.message);
      }
    }
    return this.getLocalNotes();
  }

  /**
   * Lấy danh sách tin nhắn theo từng học viên
   */
  static async getNotesByStudent(studentId) {
    if (!studentId) return [];
    const all = await this.getAllNotes();
    const cleanId = String(studentId).toUpperCase();
    return all.filter(
      (n) =>
        String(n.studentId || '').toUpperCase() === cleanId ||
        String(n.studentCode || '').toUpperCase() === cleanId
    );
  }

  /**
   * Giáo viên gửi tin nhắn / yêu cầu mới đến Giáo vụ
   */
  static async sendNote({
    student,
    teacher,
    category = NOTE_CATEGORIES.ACADEMIC_PROGRESS,
    priority = 'NORMAL', // 'NORMAL' | 'URGENT'
    content = '',
    classId = '',
    className = '',
  }) {
    if (!student || !teacher || !content.trim()) {
      throw new Error('Vui lòng nhập đầy đủ thông tin học viên, giáo viên và nội dung tin nhắn!');
    }

    const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    const notePayload = {
      id: noteId,
      studentId: student.id || student.code,
      studentCode: student.code || student.id,
      studentName: student.name || 'Học viên',
      studentEnglishName: student.englishName || student.name || '',
      studentPhone: student.phone || student.phoneNumber || '',
      parentName: student.parentName || 'Phụ huynh',
      teacherId: teacher.id || teacher.code,
      teacherName: teacher.name || 'Giáo viên',
      teacherEnglishName: teacher.englishName || teacher.name || '',
      category,
      priority: priority === 'URGENT' ? 'URGENT' : 'NORMAL',
      content: content.trim(),
      classId: classId || '',
      className: className || '',
      status: NOTE_STATUS.PENDING,
      createdAt: nowIso,
      communicatedAt: null,
      communicatedBy: null,
      communicatedByName: null,
      communicatedNote: null,
      isDeleted: false,
    };

    // 1. Lưu vào Firestore
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, noteId);
        await setDoc(docRef, notePayload);
      } catch (err) {
        console.warn('[StudentNoteService] Lỗi ghi Firestore:', err.message);
      }
    }

    // 2. Cập nhật cache cục bộ
    const local = this.getLocalNotes();
    this.setLocalNotes([notePayload, ...local]);

    // 3. Phát thông báo Realtime đến Giáo vụ qua NotificationService
    try {
      const isUrgent = priority === 'URGENT';
      const categoryText = NOTE_CATEGORY_LABELS.vi[category] || category;
      await NotificationService.sendNotification({
        recipientRole: 'academic',
        type: NOTIFICATION_TYPES.GENERAL,
        title: `${isUrgent ? '🚨 [KHẨN CẤP] ' : '📬 '}GV ${teacher.name} nhắn về HV ${student.name}`,
        message: `${categoryText}: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`,
        actionUrl: `/students?studentId=${student.code || student.id}&openNotes=true`,
        metadata: {
          noteId,
          studentId: student.id || student.code,
          studentName: student.name,
          teacherId: teacher.id || teacher.code,
          teacherName: teacher.name,
          category,
          priority,
          targetRole: 'academic',
        },
        createdBy: teacher.id || teacher.code,
        createdByName: teacher.name,
        createdByRole: 'teacher',
      });
    } catch (err) {
      console.warn('[StudentNoteService] Lỗi gửi realtime notification:', err.message);
    }

    return notePayload;
  }

  /**
   * Giáo vụ đánh dấu đã truyền đạt thông tin cho phụ huynh
   */
  static async markAsCommunicated(noteId, academicUser, communicatedNote = '') {
    if (!noteId || !academicUser) {
      throw new Error('Thiếu thông tin mã tin nhắn hoặc cán bộ giáo vụ!');
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      status: NOTE_STATUS.COMMUNICATED,
      communicatedAt: nowIso,
      communicatedBy: academicUser.id || academicUser.code,
      communicatedByName: academicUser.name || 'Giáo vụ',
      communicatedNote: (communicatedNote || '').trim(),
    };

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, noteId);
        await updateDoc(docRef, updateData);
      } catch (err) {
        console.warn('[StudentNoteService] Lỗi cập nhật Firestore:', err.message);
      }
    }

    // Cập nhật local cache
    const local = this.getLocalNotes();
    const updated = local.map((n) => (n.id === noteId ? { ...n, ...updateData } : n));
    this.setLocalNotes(updated);

    return updateData;
  }
}

export default StudentNoteService;
