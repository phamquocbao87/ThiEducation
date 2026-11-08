import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { AUDIT_ACTIONS } from '../models/user.model';

const LOCAL_AUDIT_LOGS_KEY = 'lak_user_audit_logs_cache';

/**
 * Loại bỏ đệ quy các trường undefined để không bao giờ gây lỗi Firestore
 */
const sanitizeFirestoreData = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeFirestoreData);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = typeof val === 'object' && val !== null ? sanitizeFirestoreData(val) : val;
    }
  }
  return clean;
};

export class UserAuditService {
  static COLLECTION_NAME = 'user_audit_logs';

  /**
   * Ghi nhận 1 hành động kiểm toán (Audit Log)
   */
  static async logAction({
    actor, // { id/code, name, role, email }
    action, // CREATE_USER, ACTIVATE_USER, DISABLE_USER, UPDATE_USER
    target, // { id/code, name, role, email }
    description,
    changes = {},
  }) {
    const logEntry = {
      action,
      actionLabel: this.getActionLabel(action),
      actor: {
        code: actor?.id || actor?.code || 'SYSTEM',
        name: actor?.name || 'System User',
        role: actor?.role || 'admin',
        email: actor?.email || '',
      },
      target: {
        code: target?.id || target?.code || 'UNKNOWN',
        name: target?.name || 'Target User',
        role: target?.role || 'student',
        email: target?.email || '',
      },
      description: description || `${actor?.name || 'Ai đó'} đã thực hiện ${action} lên ${target?.name || ''}`,
      changes,
      createdAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    };

    // 1. Lưu vào Firestore Database lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const cleanPayload = sanitizeFirestoreData(logEntry);
        const docRef = await addDoc(colRef, cleanPayload);
        logEntry.id = docRef.id;
      } catch (err) {
        console.warn('[UserAuditService] Chưa thể ghi Firestore, lưu local cache:', err.message);
      }
    }

    // 2. Lưu vào LocalStorage cache phòng khi offline
    try {
      const cached = JSON.parse(localStorage.getItem(LOCAL_AUDIT_LOGS_KEY) || '[]');
      cached.unshift({ ...logEntry, id: logEntry.id || `LOG_${Date.now()}` });
      localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(cached.slice(0, 100)));
    } catch {
      // Ignore local storage error
    }

    return logEntry;
  }

  /**
   * Lấy danh sách lịch sử Audit Logs (Mới nhất lên đầu)
   */
  static async getAuditLogs(maxCount = 50) {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[UserAuditService] Đọc Firestore lỗi, fallback local cache:', err.message);
      }
    }

    // Fallback Local Cache
    try {
      const cached = JSON.parse(localStorage.getItem(LOCAL_AUDIT_LOGS_KEY) || '[]');
      return cached;
    } catch {
      return [];
    }
  }

  static getActionLabel(action) {
    switch (action) {
      case AUDIT_ACTIONS.CREATE_USER:
        return 'Tạo tài khoản mới';
      case AUDIT_ACTIONS.ACTIVATE_USER:
        return 'Kích hoạt tài khoản';
      case AUDIT_ACTIONS.DISABLE_USER:
        return 'Khóa / Vô hiệu tài khoản';
      case AUDIT_ACTIONS.UPDATE_USER:
        return 'Cập nhật thông tin';
      case AUDIT_ACTIONS.DELETE_USER:
        return 'Xóa tài khoản người dùng';
      case AUDIT_ACTIONS.LOGIN_SUCCESS:
        return 'Đăng nhập thành công';
      case AUDIT_ACTIONS.LOGIN_REJECTED:
        return 'Từ chối đăng nhập (Chưa cấp quyền)';
      default:
        return action;
    }
  }
}

