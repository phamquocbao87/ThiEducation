import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { NotificationService, NOTIFICATION_TYPES } from '../../../core/services/NotificationService';

/**
 * Service quản lý đơn báo vắng mặt trực tuyến của Học viên & Giáo viên
 * Kết nối thời gian thực đến Cloud Firestore (`class_absence_requests`)
 * Đồng bộ chuông thông báo Realtime đa Role (Học viên -> Giáo vụ duyệt -> Giáo viên thấy)
 */
export class AbsenceRequestService extends BaseModuleService {
  static COLLECTION_NAME = 'class_absence_requests';
  static STORAGE_KEY = 'lak_absence_requests';

  /**
   * Đọc danh sách fallback từ localStorage
   */
  static _getLocalRequests() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu vào localStorage
   */
  static _saveLocalRequests(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Lỗi lưu local absence requests:', e);
    }
  }

  /**
   * Đọc toàn bộ đơn báo vắng từ Firestore
   */
  static async getAllRequests() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          this._saveLocalRequests(docs);
          return docs;
        }
      } catch (err) {
        console.warn('[AbsenceRequestService] Đọc Firestore lỗi, chuyển fallback:', err.message);
      }
    }
    return this._getLocalRequests();
  }

  /**
   * Lấy danh sách đơn của một học viên cụ thể
   */
  static async getMyRequests(userId) {
    if (!userId) return [];
    const all = await this.getAllRequests();
    return all.filter((r) => r.userId === userId);
  }

  /**
   * Lấy danh sách học viên có đơn vắng được duyệt cho một lớp học (và ngày cụ thể nếu truyền)
   */
  static async getApprovedAbsencesForClass(classId, dateStr = null) {
    if (!classId) return [];
    const all = await this.getAllRequests();
    return all.filter((r) => {
      const isMatchClass = r.classId === classId;
      const isApproved = r.status === 'APPROVED' || r.status === 'ACKNOWLEDGED';
      if (!isMatchClass || !isApproved) return false;
      if (dateStr) {
        return r.absenceDate === dateStr || r.date === dateStr;
      }
      return true;
    });
  }

  /**
   * Tạo đơn báo vắng mới (Học viên hoặc Giáo viên gửi)
   * Tự động gửi thông báo Realtime đến Giáo Vụ (Academic & Director)
   */
  static async createRequest({
    classId,
    className,
    userId,
    userName,
    userRole = 'student',
    teacherId = '',
    teacherName = '',
    absenceDate,
    sessionTime = '',
    reason = '',
    note = '',
  }) {
    const id = `ABS_${Date.now()}`;
    const newRecord = {
      id,
      classId,
      className,
      userId,
      userName,
      userRole, // 'student' | 'teacher'
      teacherId,
      teacherName,
      absenceDate, // DD/MM/YYYY
      date: absenceDate,
      sessionTime,
      reason: reason || 'Lý do cá nhân',
      note: note || '',
      status: 'PENDING', // PENDING | APPROVED | REJECTED | ACKNOWLEDGED
      createdAt: new Date().toISOString(),
    };

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, id);
        await setDoc(docRef, newRecord);
      } catch (err) {
        console.warn('[AbsenceRequestService] Lưu Firestore lỗi, lưu local:', err.message);
      }
    }

    const currentList = this._getLocalRequests();
    currentList.unshift(newRecord);
    this._saveLocalRequests(currentList);

    // Bắn Realtime Notification đến Giáo vụ (Academic & Director)
    try {
      if (userRole === 'student') {
        await NotificationService.sendNotification({
          recipientRole: 'academic',
          type: NOTIFICATION_TYPES.ABSENCE_REQUEST_SUBMITTED,
          title: `Học viên xin nghỉ phép: ${userName}`,
          message: `${userName} xin nghỉ buổi học ngày ${absenceDate} lớp ${className}. Lý do: ${reason || 'Không nêu'}.`,
          actionUrl: '/dashboard',
          metadata: {
            requestId: id,
            studentId: userId,
            studentName: userName,
            classId,
            className,
            absenceDate,
            teacherId,
          },
          createdBy: userId,
          createdByName: userName,
          createdByRole: userRole,
        });
      }
    } catch (notifErr) {
      console.warn('[AbsenceRequestService] Lỗi gửi realtime notification đến giáo vụ:', notifErr);
    }

    return newRecord;
  }

  /**
   * Giáo vụ tiếp nhận hoặc phê duyệt đơn báo vắng
   * Tự động gửi thông báo phản hồi cho Học viên và thông báo cho Giáo viên bản xứ
   */
  static async updateRequestStatus(
    requestId,
    status = 'APPROVED',
    staffInfo = {}
  ) {
    const staffId = typeof staffInfo === 'string' ? staffInfo : (staffInfo.id || 'ACA001');
    const staffName = staffInfo.name || 'Academic Advisor';

    const updatedPayload = {
      status,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: staffId,
      acknowledgedByName: staffName,
    };

    if (IS_FIREBASE_ENABLED && db && requestId) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, requestId);
        await setDoc(docRef, updatedPayload, { merge: true });
      } catch (err) {
        console.warn('[AbsenceRequestService] Update Firestore lỗi:', err.message);
      }
    }

    const currentList = this._getLocalRequests();
    let targetRecord = null;
    const updatedList = currentList.map((item) => {
      if (item.id === requestId) {
        targetRecord = { ...item, ...updatedPayload };
        return targetRecord;
      }
      return item;
    });
    this._saveLocalRequests(updatedList);

    // Bắn thông báo phản hồi
    if (targetRecord && (status === 'APPROVED' || status === 'ACKNOWLEDGED')) {
      try {
        // 1. Gửi thông báo đến Học viên
        if (targetRecord.userId) {
          await NotificationService.sendNotification({
            recipientId: targetRecord.userId,
            recipientRole: 'student',
            type: NOTIFICATION_TYPES.ABSENCE_REQUEST_APPROVED,
            title: 'Đơn xin nghỉ phép đã được duyệt',
            message: `Đơn xin nghỉ buổi học ngày ${targetRecord.absenceDate} lớp ${targetRecord.className} của em đã được Giáo vụ phê duyệt.`,
            actionUrl: '/dashboard',
            metadata: {
              requestId,
              classId: targetRecord.classId,
              absenceDate: targetRecord.absenceDate,
            },
            createdBy: staffId,
            createdByName: staffName,
            createdByRole: 'academic',
          });
        }

        // 2. Gửi thông báo đến Giáo viên đảm nhiệm lớp
        if (targetRecord.teacherId) {
          await NotificationService.sendNotification({
            recipientId: targetRecord.teacherId,
            recipientRole: 'teacher',
            type: NOTIFICATION_TYPES.STUDENT_ABSENCE_EXCUSED,
            title: `Excused Absence: ${targetRecord.userName}`,
            message: `Student ${targetRecord.userName} has an approved excused absence for class ${targetRecord.className} on ${targetRecord.absenceDate}.`,
            actionUrl: '/dashboard',
            metadata: {
              requestId,
              classId: targetRecord.classId,
              studentId: targetRecord.userId,
              absenceDate: targetRecord.absenceDate,
            },
            createdBy: staffId,
            createdByName: staffName,
            createdByRole: 'academic',
          });
        }
      } catch (err) {
        console.warn('[AbsenceRequestService] Lỗi gửi notification sau khi duyệt đơn:', err);
      }
    }

    return targetRecord || { id: requestId, ...updatedPayload };
  }
}
