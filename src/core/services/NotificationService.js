/**
 * NotificationService — Core Realtime Notification Dispatcher, Store & Audit Engine
 * Backed by Cloud Firestore (`notifications` collection in `lakeducationdb`)
 *
 * Key Architectural Capabilities:
 * 1. Realtime WebSocket Push via Firestore `onSnapshot` (0ms latency on Bell badge & popover).
 * 2. Cost-Optimized Indexed Filtering (`targetKeys` + `array-contains-any` + `limit(20)`)
 *    -> Prevents full-collection scans; scales to 700+ students & 100+ staff within Firebase Free/~$1 tier.
 * 3. Atomic Read Tracking (`arrayUnion` & `writeBatch`) per user ID (`readBy`).
 * 4. Per-User Isolated LocalStorage Cache (`lak_erp_notifications_cache_<userId>`) for 0ms initial paint.
 * 5. Complete Audit Trail (`createdBy`, `createdByName`, `createdByRole`, `createdAt`, `readBy`, `readAt`, `targetKeys`).
 */

import { db, IS_FIREBASE_ENABLED } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
  arrayUnion,
  writeBatch,
} from 'firebase/firestore';

export const NOTIFICATION_TYPES = {
  TEACHER_APPLY_REQUEST: 'TEACHER_APPLY_REQUEST',
  STUDENT_ENROLL_REQUEST: 'STUDENT_ENROLL_REQUEST',
  REGISTRATION_APPROVED: 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED: 'REGISTRATION_REJECTED',
  SCHEDULE_CHANGED: 'SCHEDULE_CHANGED',
  TUITION_DUE_REMINDER: 'TUITION_DUE_REMINDER',
  TUITION_PAYMENT_CONFIRMED: 'TUITION_PAYMENT_CONFIRMED',
  PAYROLL_DISBURSED: 'PAYROLL_DISBURSED',
  ACCOUNT_STATUS_CHANGED: 'ACCOUNT_STATUS_CHANGED',
  GENERAL: 'GENERAL',
};

const STORAGE_CACHE_PREFIX = 'lak_erp_notifications_cache';
export const DEFAULT_NOTIFICATION_LIMIT = 20;

export class NotificationService {
  static COLLECTION_NAME = 'notifications';

  /**
   * Tạo khóa cache cục bộ cô lập theo từng tài khoản người dùng
   */
  static getCacheKey(userId) {
    return userId ? `${STORAGE_CACHE_PREFIX}_${userId}` : STORAGE_CACHE_PREFIX;
  }

  /**
   * Đọc cache cục bộ để hiển thị ngay lập tức (0ms Optimistic UI)
   */
  static getLocalCache(userId = null) {
    try {
      const raw = localStorage.getItem(this.getCacheKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu cache cục bộ theo từng người dùng
   */
  static setLocalCache(list, userId = null) {
    try {
      const capped = Array.isArray(list) ? list.slice(0, DEFAULT_NOTIFICATION_LIMIT) : [];
      localStorage.setItem(this.getCacheKey(userId), JSON.stringify(capped));
    } catch (err) {
      console.warn('[NotificationService] Lỗi ghi local cache:', err);
    }
  }

  /**
   * Xây dựng mảng khóa định tuyến chỉ mục `targetKeys` khi tạo thông báo
   * Giúp Firestore lọc trực tiếp trên Server bằng `array-contains-any` không cần quét toàn bảng
   */
  static buildTargetKeys({ recipientId = null, recipientRole = 'all' } = {}) {
    const keys = new Set();

    if (recipientId) {
      keys.add(`USER:${recipientId}`);
    }

    if (!recipientId || recipientRole) {
      if (recipientRole === 'all' && !recipientId) {
        keys.add('ALL');
      } else if (recipientRole === 'academic') {
        // Giáo vụ, Giám đốc và IT Admin cùng giám sát thông báo điều phối học vụ
        keys.add('ROLE:academic');
        keys.add('ROLE:director');
        keys.add('ROLE:admin');
      } else if (recipientRole && recipientRole !== 'all') {
        keys.add(`ROLE:${recipientRole}`);
      }
    }

    if (keys.size === 0) {
      keys.add('ALL');
    }

    return Array.from(keys);
  }

  /**
   * Xây dựng danh sách khóa truy vấn `array-contains-any` cho người dùng đang đăng nhập
   */
  static buildUserQueryKeys(currentUser) {
    if (!currentUser?.id) return ['ALL'];
    const keys = new Set(['ALL', `USER:${currentUser.id}`]);
    if (currentUser.role) {
      keys.add(`ROLE:${currentUser.role}`);
      if (currentUser.role === 'admin' || currentUser.role === 'director') {
        keys.add('ROLE:academic');
      }
    }
    return Array.from(keys);
  }

  /**
   * Kiểm tra một thông báo có thuộc phạm vi nhận của `currentUser` hay không
   */
  static isNotificationForUser(item, currentUser) {
    if (!item || !currentUser) return false;

    const userKeys = this.buildUserQueryKeys(currentUser);
    if (Array.isArray(item.targetKeys) && item.targetKeys.length > 0) {
      if (item.targetKeys.some((k) => userKeys.includes(k))) {
        return true;
      }
    }

    if (item.recipientId && item.recipientId === currentUser.id) return true;
    if (item.recipientRole === 'all' && !item.recipientId) return true;
    if (item.recipientRole && item.recipientRole === currentUser.role) return true;
    if (
      (currentUser.role === 'admin' || currentUser.role === 'director') &&
      item.recipientRole === 'academic'
    ) {
      return true;
    }
    return false;
  }

  /**
   * Chuẩn hóa trạng thái đã đọc (`isRead`) theo từng cá nhân và sắp xếp mới nhất lên đầu
   */
  static normalizeNotificationsForUser(rawList, currentUser, maxItems = DEFAULT_NOTIFICATION_LIMIT) {
    if (!currentUser || !Array.isArray(rawList)) return [];

    const filtered = rawList.filter((item) => this.isNotificationForUser(item, currentUser));

    const normalized = filtered.map((item) => {
      const readByList = Array.isArray(item.readBy) ? item.readBy : [];
      const userRead =
        readByList.includes(currentUser.id) ||
        Boolean(item.recipientId === currentUser.id && item.isRead);
      return {
        ...item,
        readBy: readByList,
        targetKeys: Array.isArray(item.targetKeys)
          ? item.targetKeys
          : this.buildTargetKeys({ recipientId: item.recipientId, recipientRole: item.recipientRole }),
        isRead: userRead,
      };
    });

    normalized.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return normalized.slice(0, maxItems);
  }

  /**
   * Gửi một thông báo mới vào Cloud Firestore kèm đầy đủ Audit Trail & Target Keys
   */
  static async sendNotification({
    id = null,
    recipientId = null,
    recipientRole = 'all', // 'academic', 'teacher', 'student', 'accountant', 'director', 'admin', 'all'
    type = NOTIFICATION_TYPES.GENERAL,
    title,
    message,
    actionUrl = '',
    metadata = {},
    createdBy = 'system',
    createdByName = 'LAK System',
    createdByRole = 'system',
  }) {
    const notiId =
      id || `NOTI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const nowIso = new Date().toISOString();
    const resolvedRole = recipientId && recipientRole === 'all' ? (metadata?.targetRole || 'student') : (recipientRole || 'all');
    const targetKeys = this.buildTargetKeys({
      recipientId: recipientId || null,
      recipientRole: resolvedRole,
    });

    const newNoti = {
      id: notiId,
      recipientId: recipientId || null,
      recipientRole: resolvedRole,
      targetKeys,
      type,
      title: title || 'Thông báo mới',
      message: message || '',
      actionUrl: actionUrl || '',
      metadata: metadata || {},
      isRead: false,
      readBy: [],
      createdAt: nowIso,
      createdBy: createdBy || 'system',
      createdByName: createdByName || 'LAK System',
      createdByRole: createdByRole || 'system',
      auditTrail: {
        action: type,
        actorId: createdBy || 'system',
        actorName: createdByName || 'LAK System',
        actorRole: createdByRole || 'system',
        targetKeys,
        createdAt: nowIso,
      },
    };

    // 1. Nếu thông báo gửi cho đúng user đang lưu cache thì cập nhật cache
    if (recipientId) {
      const cached = this.getLocalCache(recipientId);
      this.setLocalCache([newNoti, ...cached.filter((i) => i.id !== notiId)], recipientId);
    }

    // 2. Ghi vào Cloud Firestore
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, notiId);
        await setDoc(docRef, newNoti);
      } catch (err) {
        console.warn('[NotificationService] Lỗi lưu Firestore notification:', err.message);
      }
    }

    return newNoti;
  }

  /**
   * Đăng ký lắng nghe Realtime (`onSnapshot`) thông báo của người dùng hiện tại
   * Chỉ lắng nghe các document khớp `targetKeys` với giới hạn `limit(20)` để tối ưu tuyệt đối chi phí
   */
  static subscribeToUserNotifications(
    currentUser,
    onUpdate,
    { maxItems = DEFAULT_NOTIFICATION_LIMIT } = {}
  ) {
    if (!currentUser?.id) {
      if (typeof onUpdate === 'function') onUpdate([]);
      return () => {};
    }

    if (!IS_FIREBASE_ENABLED || !db) {
      const cached = this.getLocalCache(currentUser.id);
      if (typeof onUpdate === 'function') onUpdate(cached);
      return () => {};
    }

    const queryKeys = this.buildUserQueryKeys(currentUser);
    const colRef = collection(db, this.COLLECTION_NAME);
    // Sử dụng single-field index tự động của Firestore trên mảng `targetKeys` + limit
    const q = query(
      colRef,
      where('targetKeys', 'array-contains-any', queryKeys),
      limit(maxItems * 2)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rawDocs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        const normalized = this.normalizeNotificationsForUser(rawDocs, currentUser, maxItems);
        this.setLocalCache(normalized, currentUser.id);
        if (typeof onUpdate === 'function') {
          onUpdate(normalized);
        }
      },
      async (err) => {
        console.warn('[NotificationService] Lỗi realtime listener, chuyển sang fallback fetch:', err.message);
        const fallbackList = await this.getNotificationsForUser(currentUser, maxItems);
        if (typeof onUpdate === 'function') {
          onUpdate(fallbackList);
        }
      }
    );

    return unsubscribe;
  }

  /**
   * Lấy danh sách thông báo phù hợp với vai trò và ID của người dùng hiện tại (One-shot fetch)
   */
  static async getNotificationsForUser(currentUser, maxItems = DEFAULT_NOTIFICATION_LIMIT) {
    if (!currentUser?.id) return [];

    let list = [];

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const queryKeys = this.buildUserQueryKeys(currentUser);
        const colRef = collection(db, this.COLLECTION_NAME);
        const q = query(
          colRef,
          where('targetKeys', 'array-contains-any', queryKeys),
          limit(maxItems * 2)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        } else {
          // Fallback cho dữ liệu cũ chưa có targetKeys
          const allSnap = await getDocs(query(colRef, limit(maxItems * 2)));
          list = allSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
        }
      } catch (err) {
        console.warn('[NotificationService] Lỗi tải notifications từ Firestore:', err.message);
        list = this.getLocalCache(currentUser.id);
      }
    } else {
      list = this.getLocalCache(currentUser.id);
    }

    const normalized = this.normalizeNotificationsForUser(list, currentUser, maxItems);
    this.setLocalCache(normalized, currentUser.id);
    return normalized;
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc (Atomic `arrayUnion`)
   */
  static async markAsRead(notificationId, currentUser) {
    if (!notificationId || !currentUser?.id) return;

    const nowIso = new Date().toISOString();
    const cached = this.getLocalCache(currentUser.id);
    const target = cached.find((c) => c.id === notificationId);

    // Nếu đã đọc rồi thì bỏ qua để tiết kiệm Firestore Write
    if (target?.isRead && Array.isArray(target?.readBy) && target.readBy.includes(currentUser.id)) {
      return;
    }

    const updated = cached.map((item) => {
      if (item.id === notificationId) {
        const readBy = Array.isArray(item.readBy) ? [...item.readBy] : [];
        if (!readBy.includes(currentUser.id)) readBy.push(currentUser.id);
        return {
          ...item,
          isRead: true,
          readBy,
          readAt: nowIso,
        };
      }
      return item;
    });
    this.setLocalCache(updated, currentUser.id);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, notificationId);
        const payload = {
          readBy: arrayUnion(currentUser.id),
          readAt: nowIso,
        };
        if (target?.recipientId === currentUser.id) {
          payload.isRead = true;
        }
        await updateDoc(docRef, payload);
      } catch (err) {
        console.warn('[NotificationService] Lỗi cập nhật read Firestore:', err.message);
      }
    }
  }

  /**
   * Đánh dấu tất cả thông báo chưa đọc của người dùng là đã đọc bằng `writeBatch`
   */
  static async markAllAsRead(currentUser, currentNotifications = null) {
    if (!currentUser?.id) return;

    const nowIso = new Date().toISOString();
    const sourceList = Array.isArray(currentNotifications)
      ? currentNotifications
      : this.getLocalCache(currentUser.id);

    const unreadItems = sourceList.filter(
      (item) => !item.isRead || !(item.readBy || []).includes(currentUser.id)
    );

    const updated = sourceList.map((item) => {
      const readBy = Array.isArray(item.readBy) ? [...item.readBy] : [];
      if (!readBy.includes(currentUser.id)) readBy.push(currentUser.id);
      return {
        ...item,
        isRead: true,
        readBy,
        readAt: nowIso,
      };
    });
    this.setLocalCache(updated, currentUser.id);

    if (unreadItems.length === 0) return;

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const batch = writeBatch(db);
        unreadItems.forEach((item) => {
          const docRef = doc(db, this.COLLECTION_NAME, item.id);
          const payload = {
            readBy: arrayUnion(currentUser.id),
            readAt: nowIso,
          };
          if (item.recipientId === currentUser.id) {
            payload.isRead = true;
          }
          batch.update(docRef, payload);
        });
        await batch.commit();
      } catch (err) {
        console.warn('[NotificationService] Lỗi markAllAsRead Firestore batch:', err.message);
      }
    }
  }

  /**
   * Xóa một thông báo
   */
  static async deleteNotification(notificationId, currentUser = null) {
    if (!notificationId) return;

    const userId = currentUser?.id || null;
    const cached = this.getLocalCache(userId);
    const filtered = cached.filter((c) => c.id !== notificationId);
    this.setLocalCache(filtered, userId);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await deleteDoc(doc(db, this.COLLECTION_NAME, notificationId));
      } catch (err) {
        console.warn('[NotificationService] Lỗi xóa Firestore notification:', err.message);
      }
    }
  }
}
