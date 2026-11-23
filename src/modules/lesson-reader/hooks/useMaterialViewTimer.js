import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MATERIAL_TIMER_CONFIG,
  evaluateMaterialCompletion,
} from '../models/lessonReader.model';
import { LessonReadingTrackerService } from '../services/LessonReadingTrackerService';

/**
 * useMaterialViewTimer — Dedicated Hook đo thời gian xem tài liệu đính kèm trong MaterialPreviewModal
 * - Hỗ trợ 2 chế độ theo đúng bản chất tệp:
 *   1) HTML5 Direct Media (<video> / <audio>): Chỉ cộng giây khi media đang phát (!paused && !ended),
 *      đo % tiến độ thực xem bằng tập mốc giây đã đi qua (`watchedBucketsRef` — chống kéo thanh tua).
 *   2) Iframe / PDF / Slides / Image: Nhận diện focus bên trong iframe (`document.activeElement?.tagName === 'IFRAME'`)
 *      là tương tác hợp lệ; hiện thanh nhắc nhẹ sau 120s không có tương tác ngoài iframe để chống treo máy.
 * - Visibility API Guard: Rời tab / thu nhỏ cửa sổ -> tạm dừng & flush ngay.
 * - Heartbeat 20s + Flush ngay khi đóng Modal.
 */
export function useMaterialViewTimer({
  open = false,
  enabled = false,
  isDirectMedia = false,
  classItem = null,
  lessonPrep = null,
  studentUser = null,
  material = null,
  initialMaterialLog = null,
  onLogUpdated = null,
}) {
  const materialId = String(material?.id || '');

  const [baseSeconds, setBaseSeconds] = useState(Number(initialMaterialLog?.activeSeconds) || 0);
  const [sessionDelta, setSessionDelta] = useState(0);
  const [mediaProgressPercent, setMediaProgressPercent] = useState(
    Number(initialMaterialLog?.mediaProgressPercent) || 0
  );
  const [mediaDurationSeconds, setMediaDurationSeconds] = useState(
    Number(initialMaterialLog?.mediaDurationSeconds) || 0
  );
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [isIdleCheckinNeeded, setIsIdleCheckinNeeded] = useState(false);

  const unsyncedSecondsRef = useRef(0);
  const mediaProgressRef = useRef(Number(initialMaterialLog?.mediaProgressPercent) || 0);
  const mediaDurationRef = useRef(Number(initialMaterialLog?.mediaDurationSeconds) || 0);
  const watchedBucketsRef = useRef(new Set());
  const isMediaPlayingRef = useRef(false);
  const activeKeyRef = useRef('');
  const lastActivityTsRef = useRef(Date.now());
  const hasRecordedOpenRef = useRef(false);
  const isFlushingRef = useRef(false);

  // Giữ props mới nhất qua Refs để flushNow luôn stable, không bị re-trigger effect khi parent re-render
  const latestPropsRef = useRef({});
  latestPropsRef.current = {
    enabled,
    classItem,
    lessonPrep,
    studentUser,
    material,
    materialId,
    isDirectMedia,
    onLogUpdated,
  };

  // Chỉ reset hoàn toàn khi mở modal mới hoặc chuyển sang tài liệu khác; tránh reset isMediaPlaying khi chính flushNow cập nhật initialMaterialLog!
  useEffect(() => {
    const key = open && materialId ? `OPEN_${materialId}` : 'CLOSED';
    const initSec = Number(initialMaterialLog?.activeSeconds) || 0;
    const initPct = Number(initialMaterialLog?.mediaProgressPercent) || 0;
    const initDur = Number(initialMaterialLog?.mediaDurationSeconds) || 0;

    if (activeKeyRef.current !== key) {
      activeKeyRef.current = key;
      setBaseSeconds(initSec);
      setSessionDelta(0);
      setMediaProgressPercent(initPct);
      setMediaDurationSeconds(initDur);
      setIsMediaPlaying(false);
      setIsIdleCheckinNeeded(false);

      unsyncedSecondsRef.current = 0;
      mediaProgressRef.current = initPct;
      mediaDurationRef.current = initDur;
      watchedBucketsRef.current = new Set();
      isMediaPlayingRef.current = false;
      lastActivityTsRef.current = Date.now();
      hasRecordedOpenRef.current = false;
    } else {
      // Cùng 1 phiên mở tài liệu: chỉ nâng lên nếu dữ liệu server lớn hơn, KHÔNG bao giờ hạ hay tắt isMediaPlaying
      setBaseSeconds((prev) => Math.max(prev, initSec));
      if (initPct > mediaProgressRef.current) {
        mediaProgressRef.current = initPct;
        setMediaProgressPercent(initPct);
      }
      if (initDur > mediaDurationRef.current) {
        mediaDurationRef.current = initDur;
        setMediaDurationSeconds(initDur);
      }
    }
  }, [
    open,
    materialId,
    initialMaterialLog?.activeSeconds,
    initialMaterialLog?.mediaProgressPercent,
    initialMaterialLog?.mediaDurationSeconds,
  ]);

  const flushNow = useCallback(async ({ incrementOpenCount = false, force = false } = {}) => {
    const {
      enabled: en,
      classItem: clsItem,
      lessonPrep: lPrep,
      studentUser: sUser,
      material: mat,
      materialId: mId,
      isDirectMedia: direct,
      onLogUpdated: onUpdated,
    } = latestPropsRef.current;

    if (!en || !clsItem || !lPrep || !sUser || !mId) return null;
    const pendingDelta = unsyncedSecondsRef.current;

    if (!force && !incrementOpenCount && pendingDelta <= 0) return null;
    if (isFlushingRef.current && !force) return null;

    isFlushingRef.current = true;
    unsyncedSecondsRef.current = 0;

    try {
      const updated = await LessonReadingTrackerService.recordMaterialViewProgress({
        classItem: clsItem,
        lessonPrep: lPrep,
        studentUser: sUser,
        material: mat,
        deltaSeconds: pendingDelta,
        mediaProgressPercent: mediaProgressRef.current,
        mediaDurationSeconds: mediaDurationRef.current,
        isDirectMedia: direct,
        incrementOpenCount,
      });

      if (updated) {
        const updatedMat = updated.materialLogs?.[mId];
        if (updatedMat) {
          setBaseSeconds(Number(updatedMat.activeSeconds) || 0);
          // Chỉ trừ đúng phần pendingDelta vừa sync thành công, bảo toàn 100% các giây mới phát sinh trong lúc chờ mạng
          setSessionDelta((prev) => Math.max(0, prev - pendingDelta));
          const mergedPct = Math.max(
            Number(updatedMat.mediaProgressPercent) || 0,
            mediaProgressRef.current
          );
          mediaProgressRef.current = mergedPct;
          setMediaProgressPercent(mergedPct);
        }
        onUpdated?.(updated);
      }
      return updated;
    } catch (err) {
      unsyncedSecondsRef.current += pendingDelta;
      console.warn('[useMaterialViewTimer] Flush lỗi:', err?.message);
      return null;
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  // Ghi nhận sự kiện mở tài liệu khi modal bật lên
  useEffect(() => {
    if (!open || !enabled || !materialId) return;
    lastActivityTsRef.current = Date.now();
    setIsIdleCheckinNeeded(false);
    setIsVisible(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);

    if (!hasRecordedOpenRef.current) {
      hasRecordedOpenRef.current = true;
      flushNow({ incrementOpenCount: true, force: true });
    }
  }, [open, enabled, materialId, flushNow]);

  // Flush an toàn khi đóng modal hoặc unmount
  useEffect(() => {
    if (!open || !enabled) return undefined;
    return () => {
      if (unsyncedSecondsRef.current > 0) {
        flushNow({ force: true });
      }
    };
  }, [open, enabled, flushNow]);

  // Visibility API + Iframe Focus Awareness (không pause oan khi người dùng click vào PDF Google Drive iframe!)
  useEffect(() => {
    if (!open || !enabled) return undefined;

    const handleVisibility = () => {
      const visibleNow = document.visibilityState === 'visible';
      setIsVisible(visibleNow);
      if (!visibleNow) {
        flushNow({ force: true });
      } else {
        lastActivityTsRef.current = Date.now();
        setIsIdleCheckinNeeded(false);
      }
    };

    const handleBlur = () => {
      // Nếu focus rơi vào chính thẻ <iframe> trong modal Preview -> học viên đang thao tác PDF/Drive!
      setTimeout(() => {
        const activeTag = document.activeElement?.tagName;
        if (document.visibilityState === 'visible' && activeTag === 'IFRAME') {
          lastActivityTsRef.current = Date.now();
          setIsIdleCheckinNeeded(false);
          setIsVisible(true);
          return;
        }
        if (document.visibilityState !== 'visible') {
          setIsVisible(false);
          flushNow({ force: true });
        }
      }, 60);
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        setIsVisible(true);
        lastActivityTsRef.current = Date.now();
        setIsIdleCheckinNeeded(false);
      }
    };

    const handlePageHide = () => {
      flushNow({ force: true });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [open, enabled, flushNow]);

  const confirmActive = useCallback(() => {
    lastActivityTsRef.current = Date.now();
    setIsIdleCheckinNeeded(false);
  }, []);

  // Ghi nhận tương tác ngoài iframe để reset đồng hồ Idle 120s
  useEffect(() => {
    if (!open || !enabled || isDirectMedia) return undefined;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];
    events.forEach((evt) => window.addEventListener(evt, confirmActive, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, confirmActive));
    };
  }, [open, enabled, isDirectMedia, confirmActive]);

  // Tick từng giây
  const isTracking = Boolean(
    open &&
      enabled &&
      isVisible &&
      (isDirectMedia ? isMediaPlaying : !isIdleCheckinNeeded)
  );

  useEffect(() => {
    if (!open || !enabled) return undefined;

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || !isVisible) return;

      if (isDirectMedia) {
        if (isMediaPlayingRef.current) {
          unsyncedSecondsRef.current += 1;
          setSessionDelta((prev) => prev + 1);
        }
        return;
      }

      const idleMs = Date.now() - lastActivityTsRef.current;
      if (idleMs >= MATERIAL_TIMER_CONFIG.IFRAME_IDLE_TIMEOUT_MS) {
        setIsIdleCheckinNeeded(true);
        return;
      }

      unsyncedSecondsRef.current += 1;
      setSessionDelta((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, enabled, isVisible, isDirectMedia]);

  // Heartbeat mỗi 20 giây
  useEffect(() => {
    if (!open || !enabled) return undefined;
    const hb = setInterval(() => {
      if (unsyncedSecondsRef.current >= MATERIAL_TIMER_CONFIG.MIN_HEARTBEAT_DELTA_SECONDS) {
        flushNow();
      }
    }, MATERIAL_TIMER_CONFIG.HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(hb);
  }, [open, enabled, flushNow]);

  // Callbacks dành cho HTML5 <video> / <audio> (đo % thực phát & chống tua nhanh)
  const handleMediaPlay = useCallback(() => {
    isMediaPlayingRef.current = true;
    setIsMediaPlaying(true);
    lastActivityTsRef.current = Date.now();
  }, []);

  const handleMediaPauseOrEnded = useCallback(() => {
    isMediaPlayingRef.current = false;
    setIsMediaPlaying(false);
    flushNow({ force: true });
  }, [flushNow]);

  const handleMediaTimeUpdate = useCallback((el) => {
    if (!el) return;
    const dur = Number(el.duration) || 0;
    const cur = Number(el.currentTime) || 0;
    if (dur > 0 && Number.isFinite(dur)) {
      const roundedDur = Math.round(dur);
      if (roundedDur > mediaDurationRef.current) {
        mediaDurationRef.current = roundedDur;
        setMediaDurationSeconds(roundedDur);
      }
      // Chia thành từng giây đã phát thực tế (chống kéo thanh tua 1 phát lên 95%)
      if (!el.paused && !el.ended) {
        const secBucket = Math.floor(cur);
        watchedBucketsRef.current.add(secBucket);
        const realPct = Math.min(100, Math.round((watchedBucketsRef.current.size / Math.max(1, roundedDur)) * 100));
        if (realPct > mediaProgressRef.current) {
          mediaProgressRef.current = realPct;
          setMediaProgressPercent(realPct);
        }
      }
    }
  }, []);

  const activeSeconds = baseSeconds + sessionDelta;
  const evalRes = evaluateMaterialCompletion({
    type: material?.type || 'PDF',
    activeSeconds,
    mediaProgressPercent,
    mediaDurationSeconds,
    isDirectMedia,
  });

  return {
    activeSeconds,
    mediaProgressPercent,
    mediaDurationSeconds,
    requiredSeconds: evalRes.requiredSeconds,
    progressPercent: evalRes.progressPercent,
    completed: Boolean(initialMaterialLog?.completed) || evalRes.completed,
    isTracking,
    isIdleCheckinNeeded,
    isMediaPlaying,
    confirmActive,
    flushNow,
    handleMediaPlay,
    handleMediaPauseOrEnded,
    handleMediaTimeUpdate,
  };
}

export default useMaterialViewTimer;
