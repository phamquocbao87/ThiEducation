import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';

/**
 * Service quản lý đơn báo vắng mặt trực tuyến của Học viên & Giáo viên
 * Kết nối thời gian thực đến Cloud Firestore (`class_absence_requests`)
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
   * Tạo đơn báo vắng mới (Học viên hoặc Giáo viên gửi)
   */
  static async createRequest({
    classId,
    className,
    userId,
    userName,
    userRole,
    absenceDate,
    sessionTime = '',
    reason = 'Bị ốm',
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
      absenceDate, // DD/MM/YYYY
      sessionTime,
      reason,
      note,
      status: 'PENDING', // PENDING | ACKNOWLEDGED | RESOLVED
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

    return newRecord;
  }

  /**
   * Giáo vụ tiếp nhận hoặc xử lý đơn báo vắng
   */
  static async updateRequestStatus(requestId, status = 'ACKNOWLEDGED', academicStaffId = '') {
    const updatedPayload = {
      status,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: academicStaffId,
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
    const updatedList = currentList.map((item) =>
      item.id === requestId ? { ...item, ...updatedPayload } : item
    );
    this._saveLocalRequests(updatedList);

    return { id: requestId, ...updatedPayload };
  }
}

