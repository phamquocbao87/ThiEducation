import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ACTIVE_TIMER_CONFIG,
  computeMinRequiredSeconds,
  evaluatePrepStatus,
  summarizeMaterialsProgress,
} from '../models/lessonReader.model';
import { LessonReadingTrackerService } from '../services/LessonReadingTrackerService';

/**
 * Custom Hook: Đo Thời Gian Đọc Thực Tế (Active Reading Time) với 3 lớp Anti-Cheat
 * 1. Visibility API Guard: Chuyển tab / thu nhỏ cửa sổ -> Tạm dừng ngay lập tức.
 * 2. Idle Detector (60s): Không cuộn/chạm/di chuột trong 60s -> Tạm dừng & hiện nhắc.
 * 3. Scroll Coverage Depth: Theo dõi % nội dung bài học đã cuộn qua.
 * 4. Heartbeat Sync: Đồng bộ Firestore mỗi 30s + Flush ngay khi đóng Reader / rời trang.
 */
export function useActiveReadingTimer({
  open = false,
  enabled = false,
  pausedExternally = false,
  classItem = null,
  lessonPrep = null,
  studentUser = null,
  initialLog = null,
  onLogUpdated = null,
}) {
  const objectivesCount = Array.isArray(lessonPrep?.objectives) ? lessonPrep.objectives.length : 0;
  const minRequiredSeconds = computeMinRequiredSeconds(objectivesCount);

  const [basePreSeconds, setBasePreSeconds] = useState(Number(initialLog?.preClassActiveSeconds) || 0);
  const [basePostSeconds, setBasePostSeconds] = useState(Number(initialLog?.postClassActiveSeconds) || 0);
  const [sessionDeltaSeconds, setSessionDeltaSeconds] = useState(0);
  const [maxScrollPercent, setMaxScrollPercent] = useState(Number(initialLog?.maxScrollPercent) || 0);
  const [completedConfirmedAt, setCompletedConfirmedAt] = useState(initialLog?.completedConfirmedAt || null);

  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [isIdle, setIsIdle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(initialLog?.updatedAt || null);

  // Refs giữ giá trị mới nhất để flush an toàn không bị stale closure và không làm re-trigger effects
  const unsyncedSecondsRef = useRef(0);
  const maxScrollRef = useRef(Number(initialLog?.maxScrollPercent) || 0);
  const lastActivityTsRef = useRef(Date.now());
  const hasRecordedOpenRef = useRef(false);
  const isFlushingRef = useRef(false);
  const prevPausedExternallyRef = useRef(Boolean(pausedExternally));

  const latestPropsRef = useRef({});
  latestPropsRef.current = {
    open,
    enabled,
    pausedExternally,
    classItem,
    lessonPrep,
    studentUser,
    onLogUpdated,
  };

  const activeLogKeyRef = useRef(null);

  // Đồng bộ lại state khi đổi lớp / đổi buổi / nạp log mới (không bao giờ hạ thấp maxScrollRef đang đọc)
  useEffect(() => {
    const incomingKey = `${classItem?.id || classItem?.code || ''}_${lessonPrep?.sessionIndex || ''}_${studentUser?.id || studentUser?.code || ''}`;
    const incomingScroll = Number(initialLog?.maxScrollPercent) || 0;

    setBasePreSeconds(Number(initialLog?.preClassActiveSeconds) || 0);
    setBasePostSeconds(Number(initialLog?.postClassActiveSeconds) || 0);
    setCompletedConfirmedAt(initialLog?.completedConfirmedAt || null);
    setLastSavedAt(initialLog?.updatedAt || null);

    if (activeLogKeyRef.current !== incomingKey) {
      activeLogKeyRef.current = incomingKey;
      maxScrollRef.current = incomingScroll;
      setMaxScrollPercent(incomingScroll);
    } else if (incomingScroll > maxScrollRef.current) {
      maxScrollRef.current = incomingScroll;
      setMaxScrollPercent(incomingScroll);
    }
  }, [
    classItem?.id,
    classItem?.code,
    lessonPrep?.sessionIndex,
    studentUser?.id,
    studentUser?.code,
    initialLog?.id,
    initialLog?.preClassActiveSeconds,
    initialLog?.postClassActiveSeconds,
    initialLog?.maxScrollPercent,
    initialLog?.completedConfirmedAt,
    initialLog?.updatedAt,
  ]);

  // Hàm flush tiến trình lên Firestore + LocalStorage (100% stable callback, không re-run effects khi parent re-render)
  const flushNow = useCallback(
    async ({ incrementOpenCount = false, markCompleted = false, force = false } = {}) => {
      const {
        enabled: en,
        classItem: clsItem,
        lessonPrep: lPrep,
        studentUser: sUser,
        onLogUpdated: onUpdated,
      } = latestPropsRef.current;

      if (!en || !clsItem || !lPrep || !sUser) return null;
      const pendingDelta = unsyncedSecondsRef.current;

      if (!force && !incrementOpenCount && !markCompleted && pendingDelta <= 0) {
        return null;
      }
      if (isFlushingRef.current && !force) return null;

      isFlushingRef.current = true;
      setIsSaving(true);
      // Trừ trước để không bị cộng đúp nếu flush kế tiếp chạy song song
      unsyncedSecondsRef.current = 0;

      try {
        const updated = await LessonReadingTrackerService.recordReadingProgress({
          classItem: clsItem,
          lessonPrep: lPrep,
          studentUser: sUser,
          deltaSeconds: pendingDelta,
          maxScrollPercent: maxScrollRef.current,
          incrementOpenCount,
          markCompleted,
        });

        if (updated) {
          setBasePreSeconds(Number(updated.preClassActiveSeconds) || 0);
          setBasePostSeconds(Number(updated.postClassActiveSeconds) || 0);
          setSessionDeltaSeconds((prev) => Math.max(0, prev - pendingDelta));
          const mergedScroll = Math.max(Number(updated.maxScrollPercent) || 0, maxScrollRef.current);
          maxScrollRef.current = mergedScroll;
          setMaxScrollPercent(mergedScroll);
          setCompletedConfirmedAt(updated.completedConfirmedAt || null);
          setLastSavedAt(updated.updatedAt || new Date().toISOString());
          onUpdated?.({ ...updated, maxScrollPercent: mergedScroll });
        }
        return updated;
      } catch (err) {
        // Hoàn lại delta nếu lỗi bất ngờ
        unsyncedSecondsRef.current += pendingDelta;
        console.warn('[useActiveReadingTimer] Flush lỗi:', err?.message);
        return null;
      } finally {
        isFlushingRef.current = false;
        setIsSaving(false);
      }
    },
    []
  );

  // Ghi nhận sự kiện mở Reader (incrementOpenCount = 1) mỗi khi modal mở lên
  useEffect(() => {
    if (!open || !enabled) {
      hasRecordedOpenRef.current = false;
      return;
    }
    lastActivityTsRef.current = Date.now();
    setIsIdle(false);
    setIsVisible(document.visibilityState === 'visible');

    if (!hasRecordedOpenRef.current) {
      hasRecordedOpenRef.current = true;
      flushNow({ incrementOpenCount: true, force: true });
    }
  }, [open, enabled, flushNow]);

  // Lắng nghe Visibility API & Window Focus/Blur (Lớp chống gian lận 1)
  useEffect(() => {
    if (!open || !enabled) return;

    const handleVisibilityChange = () => {
      const visibleNow = document.visibilityState === 'visible';
      setIsVisible(visibleNow);
      if (!visibleNow) {
        if (!latestPropsRef.current.pausedExternally) {
          flushNow({ force: true });
        }
      } else {
        lastActivityTsRef.current = Date.now();
        setIsIdle(false);
      }
    };

    const handleWindowBlur = () => {
      if (latestPropsRef.current.pausedExternally) return;
      setIsVisible(false);
      flushNow({ force: true });
    };

    const handleWindowFocus = () => {
      if (document.visibilityState === 'visible') {
        setIsVisible(true);
        lastActivityTsRef.current = Date.now();
        setIsIdle(false);
      }
    };

    const handlePageHide = () => {
      flushNow({ force: true });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [open, enabled, flushNow]);

  // Lắng nghe tương tác người dùng (Lớp chống gian lận 2: Idle 60s Detector)
  const markUserActive = useCallback(() => {
    lastActivityTsRef.current = Date.now();
    setIsIdle((prev) => (prev ? false : prev));
  }, []);

  useEffect(() => {
    if (!open || !enabled) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];
    events.forEach((evt) => window.addEventListener(evt, markUserActive, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, markUserActive));
    };
  }, [open, enabled, markUserActive]);

  // Hand-Off chống cộng đúp giờ: Khi mở MaterialPreviewModal từ bên trong Book Reader -> chỉ flush đúng 1 lần khi chuyển false -> true
  useEffect(() => {
    const wasPaused = prevPausedExternallyRef.current;
    prevPausedExternallyRef.current = Boolean(pausedExternally);

    if (open && enabled && pausedExternally && !wasPaused) {
      flushNow({ force: true });
    } else if (open && enabled && !pausedExternally && wasPaused) {
      lastActivityTsRef.current = Date.now();
      setIsIdle(false);
    }
  }, [open, enabled, pausedExternally, flushNow]);

  // Đồng hồ đếm từng giây khi đang thực sự đọc (isVisible && !isIdle && !pausedExternally)
  const isTracking = Boolean(open && enabled && isVisible && !isIdle && !pausedExternally);

  useEffect(() => {
    if (!open || !enabled || pausedExternally) return;

    const tickInterval = setInterval(() => {
      const now = Date.now();
      const idleElapsed = now - lastActivityTsRef.current;

      if (idleElapsed >= ACTIVE_TIMER_CONFIG.IDLE_TIMEOUT_MS) {
        setIsIdle(true);
        return;
      }

      if (document.visibilityState === 'visible' && isVisible) {
        unsyncedSecondsRef.current += 1;
        setSessionDeltaSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [open, enabled, isVisible, pausedExternally]);

  // Heartbeat định kỳ mỗi 30 giây (tối ưu số lần ghi Firestore)
  useEffect(() => {
    if (!open || !enabled) return;

    const hbInterval = setInterval(() => {
      if (unsyncedSecondsRef.current >= ACTIVE_TIMER_CONFIG.MIN_HEARTBEAT_DELTA_SECONDS) {
        flushNow();
      }
    }, ACTIVE_TIMER_CONFIG.HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(hbInterval);
  }, [open, enabled, flushNow]);

  // Theo dõi % cuộn trang (Lớp kiểm soát 3: Scroll Depth Coverage)
  const handleScrollElement = useCallback(
    (el) => {
      if (!el) return;
      markUserActive();
      const { scrollTop, clientHeight, scrollHeight } = el;
      let pct = 100;
      if (scrollHeight > clientHeight + 20) {
        pct = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);
      }
      const clamped = Math.max(0, Math.min(100, pct));
      if (clamped > maxScrollRef.current) {
        maxScrollRef.current = clamped;
        setMaxScrollPercent(clamped);
      }
    },
    [markUserActive]
  );

  // Xác nhận hoàn tất đọc bài
  const confirmCompleted = useCallback(async () => {
    maxScrollRef.current = Math.max(maxScrollRef.current, 100);
    setMaxScrollPercent(maxScrollRef.current);
    return flushNow({ markCompleted: true, force: true });
  }, [flushNow]);

  // Tính live metrics tức thì (0ms) bao gồm cả tiến độ tài liệu đính kèm (nếu có)
  const effectivePreSeconds = basePreSeconds + sessionDeltaSeconds;
  const totalSeconds = effectivePreSeconds + basePostSeconds;
  const attachedMaterials = Array.isArray(lessonPrep?.attachedMaterials)
    ? lessonPrep.attachedMaterials
    : [];
  const matSummary = summarizeMaterialsProgress(attachedMaterials, initialLog?.materialLogs || {});

  const { prepStatus, prepScore } = evaluatePrepStatus({
    preClassActiveSeconds: effectivePreSeconds,
    postClassActiveSeconds: basePostSeconds,
    maxScrollPercent,
    minRequiredSeconds,
    materialsTotalCount: matSummary.materialsTotalCount,
    materialsCompletedCount: matSummary.materialsCompletedCount,
    materialActiveSeconds: matSummary.materialActiveSeconds,
    materialRatio: matSummary.materialRatio,
  });

  const progressPercent = Math.min(100, Math.round((effectivePreSeconds / minRequiredSeconds) * 100));

  return {
    totalSeconds,
    preClassSeconds: effectivePreSeconds,
    postClassSeconds: basePostSeconds,
    minRequiredSeconds,
    maxScrollPercent,
    progressPercent,
    prepStatus,
    prepScore,
    completedConfirmedAt,
    isTracking,
    isIdle,
    isVisible,
    isSaving,
    lastSavedAt,
    resumeFromIdle: markUserActive,
    handleScrollElement,
    flushNow,
    confirmCompleted,
  };
}

export default useActiveReadingTimer;
