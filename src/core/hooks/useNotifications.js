import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService, DEFAULT_NOTIFICATION_LIMIT } from '../services/NotificationService';

/**
 * useNotifications — Realtime Notification Controller Hook
 *
 * Features:
 * 1. Subscribes to Firestore `onSnapshot` via `NotificationService.subscribeToUserNotifications`
 *    using indexed `targetKeys` + `limit(20)` so the Bell badge updates in <1s without page reload.
 * 2. Page Visibility Lifecycle: Automatically pauses subscription when browser tab is hidden for
 *    extended periods and resumes immediately when tab becomes visible to optimize resources.
 * 3. 0ms Optimistic State Updates for Mark as Read, Mark All as Read, and Delete.
 */
export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState(() =>
    currentUser?.id ? NotificationService.getLocalCache(currentUser.id) : []
  );
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const list = await NotificationService.getNotificationsForUser(
        currentUser,
        DEFAULT_NOTIFICATION_LIMIT
      );
      setNotifications(list);
    } catch (err) {
      console.warn('[useNotifications] Lỗi fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return undefined;
    }

    // 1. Khởi tạo ngay từ cache của đúng user (0ms paint)
    const cached = NotificationService.getLocalCache(currentUser.id);
    if (cached.length > 0) {
      setNotifications(cached);
    }

    // 2. Hàm khởi chạy Realtime Listener (`onSnapshot`)
    const startRealtimeSubscription = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      unsubscribeRef.current = NotificationService.subscribeToUserNotifications(
        currentUser,
        (liveList) => {
          setNotifications(liveList);
          setLoading(false);
        },
        { maxItems: DEFAULT_NOTIFICATION_LIMIT }
      );
    };

    startRealtimeSubscription();

    // 3. Quản lý vòng đời theo trạng thái hiển thị của Tab (Page Visibility Lifecycle)
    let hiddenTimer = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Nếu người dùng ẩn tab quá 5 phút thì tạm ngắt listener để tiết kiệm kết nối
        hiddenTimer = setTimeout(() => {
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
        }, 5 * 60 * 1000);
      } else if (document.visibilityState === 'visible') {
        if (hiddenTimer) {
          clearTimeout(hiddenTimer);
          hiddenTimer = null;
        }
        // Khôi phục listener nếu đã tạm ngắt
        if (!unsubscribeRef.current) {
          startRealtimeSubscription();
        }
      }
    };

    // 4. Lắng nghe sự kiện nội bộ trong cùng cửa sổ trình duyệt để phản hồi tức thì
    const handleLocalDispatched = (e) => {
      const created = e?.detail;
      if (created && NotificationService.isNotificationForUser(created, currentUser)) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === created.id);
          if (exists) return prev;
          return [created, ...prev].slice(0, DEFAULT_NOTIFICATION_LIMIT);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('lak_notification_dispatched', handleLocalDispatched);

    return () => {
      if (hiddenTimer) clearTimeout(hiddenTimer);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('lak_notification_dispatched', handleLocalDispatched);
    };
  }, [currentUser?.id, currentUser?.role]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId) => {
    if (!currentUser?.id || !notificationId) return;

    // Cập nhật UI tức thì 0ms
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
          if (!readBy.includes(currentUser.id)) readBy.push(currentUser.id);
          return { ...n, isRead: true, readBy };
        }
        return n;
      })
    );

    await NotificationService.markAsRead(notificationId, currentUser);
  };

  const markAllAsRead = async () => {
    if (!currentUser?.id) return;

    const snapshotBefore = [...notifications];
    // Cập nhật UI tức thì 0ms
    setNotifications((prev) =>
      prev.map((n) => {
        const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
        if (!readBy.includes(currentUser.id)) readBy.push(currentUser.id);
        return { ...n, isRead: true, readBy };
      })
    );

    await NotificationService.markAllAsRead(currentUser, snapshotBefore);
  };

  const deleteNotification = async (notificationId) => {
    if (!notificationId) return;
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    await NotificationService.deleteNotification(notificationId, currentUser);
  };

  const dispatchNotification = async (notiPayload) => {
    const payloadWithActor = {
      ...notiPayload,
      createdBy: notiPayload?.createdBy || currentUser?.id || 'system',
      createdByName: notiPayload?.createdByName || currentUser?.name || 'LAK System',
      createdByRole: notiPayload?.createdByRole || currentUser?.role || 'system',
    };
    const created = await NotificationService.sendNotification(payloadWithActor);
    window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: created }));
    return created;
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dispatchNotification,
    refreshNotifications: fetchNotifications,
  };
};
