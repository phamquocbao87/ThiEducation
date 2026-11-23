import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  computeMinRequiredSeconds,
  evaluateMaterialCompletion,
  evaluatePrepStatus,
  summarizeMaterialsProgress,
} from '../models/lessonReader.model';
import { findClassSession } from '../../../shared/utils/classSessionUtils';

const LOCAL_CACHE_PREFIX = 'lak_lesson_reading_logs_v1';

/**
 * LessonReadingTrackerService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * Quản lý nhật ký thời gian đọc thực tế (Active Reading Time) trên Cloud Firestore (`lesson_reading_logs`)
 * - Cô lập dữ liệu theo từng học viên (studentId).
 * - Hỗ trợ cache LocalStorage 0ms Optimistic UI & bảo toàn qua F5.
 * - Tính toán trạng thái chuẩn bị bài bằng ngưỡng động `max(90, min(300, objectivesCount * 8))` + cuộn >= 80%.
 */
export class LessonReadingTrackerService extends BaseModuleService {
  static COLLECTION_NAME = 'lesson_reading_logs';

  // Hàng đợi tuần tự hóa theo từng logId — chống 100% race condition khi Book Reader và Material Preview cùng flush
  static _writeQueues = new Map();

  static _enqueueWrite(logId, taskFn) {
    const prev = this._writeQueues.get(logId) || Promise.resolve();
    const next = prev.then(taskFn, taskFn);
    const cleanup = next.finally(() => {
      if (this._writeQueues.get(logId) === cleanup) {
        this._writeQueues.delete(logId);
      }
    });
    this._writeQueues.set(logId, cleanup);
    return next;
  }

  static _mergeLogRecords(base, incoming) {
    if (!base) return incoming || null;
    if (!incoming) return base;
    const mergedMaterialLogs = this.mergeMaterialLogs(base.materialLogs, incoming.materialLogs);
    const materialActiveSeconds = Object.values(mergedMaterialLogs).reduce(
      (sum, item) => sum + (Number(item?.activeSeconds) || 0),
      0
    );
    const materialsOpenedCount = Object.values(mergedMaterialLogs).filter(
      (item) => (Number(item?.openCount) || 0) > 0 || (Number(item?.activeSeconds) || 0) > 0
    ).length;
    const materialsCompletedCount = Object.values(mergedMaterialLogs).filter((item) =>
      Boolean(item?.completed)
    ).length;
    const preClassActiveSeconds = Math.max(
      Number(base.preClassActiveSeconds) || 0,
      Number(incoming.preClassActiveSeconds) || 0
    );
    const postClassActiveSeconds = Math.max(
      Number(base.postClassActiveSeconds) || 0,
      Number(incoming.postClassActiveSeconds) || 0
    );
    return {
      ...base,
      ...incoming,
      preClassActiveSeconds,
      postClassActiveSeconds,
      totalActiveSeconds: preClassActiveSeconds + postClassActiveSeconds,
      maxScrollPercent: Math.max(
        Number(base.maxScrollPercent) || 0,
        Number(incoming.maxScrollPercent) || 0
      ),
      openCount: Math.max(Number(base.openCount) || 0, Number(incoming.openCount) || 0),
      materialLogs: mergedMaterialLogs,
      materialActiveSeconds: Math.max(
        materialActiveSeconds,
        Number(base.materialActiveSeconds) || 0,
        Number(incoming.materialActiveSeconds) || 0
      ),
      materialsOpenedCount: Math.max(
        materialsOpenedCount,
        Number(base.materialsOpenedCount) || 0,
        Number(incoming.materialsOpenedCount) || 0
      ),
      materialsCompletedCount: Math.max(
        materialsCompletedCount,
        Number(base.materialsCompletedCount) || 0,
        Number(incoming.materialsCompletedCount) || 0
      ),
      materialsTotalCount: Math.max(
        Number(base.materialsTotalCount) || 0,
        Number(incoming.materialsTotalCount) || 0
      ),
    };
  }

  static buildLogId(classId, sessionIndex, studentId) {
    const cleanClass = String(classId || 'UNKNOWN').trim();
    const cleanSession = Number(sessionIndex) || 1;
    const cleanStudent = String(studentId || 'UNKNOWN').trim();
    return `READ_${cleanClass}_S${cleanSession}_${cleanStudent}`;
  }

  static getCacheKey(studentId) {
    return `${LOCAL_CACHE_PREFIX}_${studentId || 'guest'}`;
  }

  static getLocalCacheMap(studentId) {
    try {
      const raw = localStorage.getItem(this.getCacheKey(studentId));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static setLocalCacheItem(studentId, logId, record) {
    try {
      const current = this.getLocalCacheMap(studentId);
      current[logId] = record;
      localStorage.setItem(this.getCacheKey(studentId), JSON.stringify(current));
    } catch {
      // Ignore storage quota errors
    }
  }

  static removeLocalCacheItem(studentId, logId) {
    try {
      const current = this.getLocalCacheMap(studentId);
      if (current[logId]) {
        delete current[logId];
        localStorage.setItem(this.getCacheKey(studentId), JSON.stringify(current));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Xác định mốc bắt đầu buổi học (sessionStartMs) để phân biệt đọc TRƯỚC giờ học hay SAU giờ học.
   * Ưu tiên ca học sắp tới của lớp (`findClassSession`) nếu giáo án đang là giáo án hiện hành.
   */
  static resolveEffectiveSessionStartMs(classItem, lessonPrep) {
    if (lessonPrep?.sessionStartMs && Number(lessonPrep.sessionStartMs) > 0) {
      return Number(lessonPrep.sessionStartMs);
    }
    if (classItem) {
      try {
        const upcoming = findClassSession(classItem, Date.now());
        if (upcoming?.start && upcoming.start > 0) {
          return upcoming.start;
        }
      } catch {
        // Fallback below
      }
    }
    return null;
  }

  /**
   * Merge an toàn 2 map `materialLogs` (local cache vs Firestore) theo nguyên tắc đơn điệu tăng (không bao giờ ghi đè mất giây)
   */
  static mergeMaterialLogs(mapA = {}, mapB = {}) {
    const out = {};
    const keys = new Set([
      ...Object.keys(mapA && typeof mapA === 'object' ? mapA : {}),
      ...Object.keys(mapB && typeof mapB === 'object' ? mapB : {}),
    ]);
    keys.forEach((k) => {
      const a = mapA?.[k] || {};
      const b = mapB?.[k] || {};
      out[k] = {
        materialId: k,
        title: b.title || a.title || 'Learning Material',
        type: b.type || a.type || 'PDF',
        pageLocation: b.pageLocation || a.pageLocation || '',
        activeSeconds: Math.max(Number(a.activeSeconds) || 0, Number(b.activeSeconds) || 0),
        openCount: Math.max(Number(a.openCount) || 0, Number(b.openCount) || 0),
        mediaProgressPercent: Math.max(Number(a.mediaProgressPercent) || 0, Number(b.mediaProgressPercent) || 0),
        mediaDurationSeconds: Math.max(Number(a.mediaDurationSeconds) || 0, Number(b.mediaDurationSeconds) || 0),
        isDirectMedia: Boolean(a.isDirectMedia || b.isDirectMedia),
        completed: Boolean(a.completed || b.completed),
        lastViewedAt: b.lastViewedAt || a.lastViewedAt || null,
      };
    });
    return out;
  }

  /**
   * Lấy bản ghi đọc bài của 1 học viên cho 1 buổi học cụ thể (ưu tiên merge đơn điệu với LocalCache để chống race condition)
   */
  static async getReadingLog({ classId, sessionIndex, studentId }) {
    if (!classId || !studentId) return null;
    const logId = this.buildLogId(classId, sessionIndex, studentId);
    const cached = this.getLocalCacheMap(studentId)[logId] || null;

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const snap = await getDoc(doc(db, this.COLLECTION_NAME, logId));
        if (snap.exists()) {
          const remote = { id: snap.id, ...snap.data() };
          const merged = cached ? this._mergeLogRecords(remote, cached) : remote;
          this.setLocalCacheItem(studentId, logId, merged);
          return merged;
        }
      } catch (err) {
        console.warn('[LessonReadingTrackerService] Lỗi đọc log từ Firestore:', err.message);
      }
    }

    return cached;
  }

  /**
   * Tải toàn bộ nhật ký đọc bài của 1 học viên (để hiển thị badge trên Dashboard cho mọi lớp đang học)
   */
  static async getStudentReadingLogs(studentId) {
    if (!studentId) return {};
    const cacheMap = this.getLocalCacheMap(studentId);

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('studentId', '==', String(studentId))
        );
        const snap = await getDocs(q);
        const merged = { ...cacheMap };
        snap.forEach((d) => {
          const item = { id: d.id, ...d.data() };
          merged[d.id] = merged[d.id] ? this._mergeLogRecords(item, merged[d.id]) : item;
        });
        try {
          localStorage.setItem(this.getCacheKey(studentId), JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      } catch (err) {
        console.warn('[LessonReadingTrackerService] Lỗi tải danh sách reading logs:', err.message);
      }
    }

    return cacheMap;
  }

  /**
   * Lưu / cộng dồn tiến trình đọc bài thực tế (Heartbeat 30s & Flush khi đóng Reader)
   */
  static async recordReadingProgress({
    classItem,
    lessonPrep,
    studentUser,
    deltaSeconds = 0,
    maxScrollPercent = 0,
    incrementOpenCount = false,
    markCompleted = false,
  }) {
    const classId = classItem?.id || classItem?.code;
    const sessionIndex = Number(lessonPrep?.sessionIndex) || 1;
    const studentId = studentUser?.id || studentUser?.code;

    if (!classId || !studentId) return null;

    const logId = this.buildLogId(classId, sessionIndex, studentId);

    return this._enqueueWrite(logId, async () => {
      const existing = await this.getReadingLog({ classId, sessionIndex, studentId });
      const latestLocal = this.getLocalCacheMap(studentId)[logId] || null;
      const base = this._mergeLogRecords(existing, latestLocal);

      const nowIso = new Date().toISOString();
      const nowMs = Date.now();
      const sessionStartMs =
        base?.sessionStartMs || this.resolveEffectiveSessionStartMs(classItem, lessonPrep);

      const objectivesCount = Array.isArray(lessonPrep?.objectives) ? lessonPrep.objectives.length : 0;
      const minRequiredSeconds = computeMinRequiredSeconds(objectivesCount);

      const safeDelta = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
      const isBeforeSession = !sessionStartMs || nowMs <= sessionStartMs;

      const prevPre = Number(base?.preClassActiveSeconds) || 0;
      const prevPost = Number(base?.postClassActiveSeconds) || 0;

      const preClassActiveSeconds = prevPre + (isBeforeSession ? safeDelta : 0);
      const postClassActiveSeconds = prevPost + (isBeforeSession ? 0 : safeDelta);
      const totalActiveSeconds = preClassActiveSeconds + postClassActiveSeconds;

      const bestScrollPercent = Math.max(
        Number(base?.maxScrollPercent) || 0,
        Math.min(100, Math.round(Number(maxScrollPercent) || 0))
      );

      const existingMaterialLogs =
        base?.materialLogs && typeof base.materialLogs === 'object' ? base.materialLogs : {};
      const attachedMaterials = Array.isArray(lessonPrep?.attachedMaterials)
        ? lessonPrep.attachedMaterials
        : [];
      const matSummary = summarizeMaterialsProgress(attachedMaterials, existingMaterialLogs);

      const { prepStatus, prepScore } = evaluatePrepStatus({
        preClassActiveSeconds,
        postClassActiveSeconds,
        maxScrollPercent: bestScrollPercent,
        minRequiredSeconds,
        materialsTotalCount: matSummary.materialsTotalCount,
        materialsCompletedCount: matSummary.materialsCompletedCount,
        materialActiveSeconds: matSummary.materialActiveSeconds,
        materialRatio: matSummary.materialRatio,
      });

      const payload = {
        id: logId,
        classId,
        className: classItem?.name || base?.className || '',
        sessionIndex,
        sessionDate: lessonPrep?.date || base?.sessionDate || '',
        lessonTitle: lessonPrep?.lessonTitle || base?.lessonTitle || '',
        sessionStartMs: sessionStartMs || null,
        studentId,
        studentName: studentUser?.name || base?.studentName || '',
        studentCode: studentUser?.code || studentId,
        teacherId: classItem?.teacherId || base?.teacherId || '',
        teacherName: classItem?.teacherName || base?.teacherName || '',
        objectivesCount,
        minRequiredSeconds,
        totalActiveSeconds,
        preClassActiveSeconds,
        postClassActiveSeconds,
        maxScrollPercent: bestScrollPercent,
        materialLogs: existingMaterialLogs,
        materialActiveSeconds: matSummary.materialActiveSeconds,
        materialsOpenedCount: matSummary.materialsOpenedCount,
        materialsCompletedCount: matSummary.materialsCompletedCount,
        materialsTotalCount: matSummary.materialsTotalCount,
        openCount: (Number(base?.openCount) || 0) + (incrementOpenCount ? 1 : 0),
        firstOpenedAt: base?.firstOpenedAt || nowIso,
        lastReadAt: nowIso,
        completedConfirmedAt: markCompleted
          ? nowIso
          : base?.completedConfirmedAt || null,
        prepStatus,
        prepScore,
        notesCount: Number(base?.notesCount) || 0,
        questionsCount: Number(base?.questionsCount) || 0,
        updatedAt: nowIso,
      };

      // 1. Cập nhật cache 0ms Optimistic UI ngay lập tức
      this.setLocalCacheItem(studentId, logId, payload);

      // 2. Đồng bộ Cloud Firestore tuần tự trong hàng đợi
      if (IS_FIREBASE_ENABLED && db) {
        try {
          await setDoc(doc(db, this.COLLECTION_NAME, logId), payload, { merge: true });
        } catch (err) {
          console.warn('[LessonReadingTrackerService] Lỗi lưu reading log lên Firestore:', err.message);
        }
      }

      return payload;
    });
  }

  /**
   * Lưu / cộng dồn tiến trình XEM TÀI LIỆU ĐÍNH KÈM vào ngay cùng bản ghi `lesson_reading_logs`
   * - Không cộng đúp vào `preClassActiveSeconds` của giáo án; lưu tách bạch trong `materialLogs[materialId]`
   *   và tổng hợp vào `materialActiveSeconds`, `materialsCompletedCount`, `materialsTotalCount`.
   */
  static async recordMaterialViewProgress({
    classItem,
    lessonPrep,
    studentUser,
    material,
    deltaSeconds = 0,
    mediaProgressPercent = 0,
    mediaDurationSeconds = 0,
    isDirectMedia = false,
    incrementOpenCount = false,
  }) {
    const classId = classItem?.id || classItem?.code;
    const sessionIndex = Number(lessonPrep?.sessionIndex) || 1;
    const studentId = studentUser?.id || studentUser?.code;
    const materialId = String(material?.id || '').trim();

    if (!classId || !studentId || !materialId) return null;

    const logId = this.buildLogId(classId, sessionIndex, studentId);

    return this._enqueueWrite(logId, async () => {
      const existing = await this.getReadingLog({ classId, sessionIndex, studentId });
      const latestLocal = this.getLocalCacheMap(studentId)[logId] || null;
      const base = this._mergeLogRecords(existing, latestLocal);

      const nowIso = new Date().toISOString();
      const sessionStartMs =
        base?.sessionStartMs || this.resolveEffectiveSessionStartMs(classItem, lessonPrep);

      const objectivesCount = Array.isArray(lessonPrep?.objectives) ? lessonPrep.objectives.length : 0;
      const minRequiredSeconds = computeMinRequiredSeconds(objectivesCount);

      const existingMaterialLogs =
        base?.materialLogs && typeof base.materialLogs === 'object'
          ? { ...base.materialLogs }
          : {};
      const prevMat = existingMaterialLogs[materialId] || {};

      const safeDelta = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
      const nextMatSeconds = (Number(prevMat.activeSeconds) || 0) + safeDelta;
      const nextMediaProgress = Math.max(
        Number(prevMat.mediaProgressPercent) || 0,
        Math.min(100, Math.round(Number(mediaProgressPercent) || 0))
      );
      const nextMediaDuration = Math.max(
        Number(prevMat.mediaDurationSeconds) || 0,
        Math.round(Number(mediaDurationSeconds) || 0)
      );
      const effectiveDirectMedia = Boolean(isDirectMedia || prevMat.isDirectMedia);

      const matEval = evaluateMaterialCompletion({
        type: material?.type || prevMat.type || 'PDF',
        activeSeconds: nextMatSeconds,
        mediaProgressPercent: nextMediaProgress,
        mediaDurationSeconds: nextMediaDuration,
        isDirectMedia: effectiveDirectMedia,
      });

      existingMaterialLogs[materialId] = {
        materialId,
        title: String(material?.title || prevMat.title || 'Learning Material').trim(),
        type: String(material?.type || prevMat.type || 'PDF').trim(),
        pageLocation: String(material?.pageLocation || prevMat.pageLocation || '').trim(),
        activeSeconds: nextMatSeconds,
        openCount: (Number(prevMat.openCount) || 0) + (incrementOpenCount ? 1 : 0),
        mediaProgressPercent: nextMediaProgress,
        mediaDurationSeconds: nextMediaDuration,
        isDirectMedia: effectiveDirectMedia,
        completed: Boolean(prevMat.completed) || matEval.completed,
        lastViewedAt: nowIso,
      };

      const attachedMaterials = Array.isArray(lessonPrep?.attachedMaterials)
        ? lessonPrep.attachedMaterials
        : [];
      const matSummary = summarizeMaterialsProgress(attachedMaterials, existingMaterialLogs);

      const preClassActiveSeconds = Number(base?.preClassActiveSeconds) || 0;
      const postClassActiveSeconds = Number(base?.postClassActiveSeconds) || 0;
      const totalActiveSeconds = preClassActiveSeconds + postClassActiveSeconds;
      const maxScrollPercent = Number(base?.maxScrollPercent) || 0;

      const { prepStatus, prepScore } = evaluatePrepStatus({
        preClassActiveSeconds,
        postClassActiveSeconds,
        maxScrollPercent,
        minRequiredSeconds,
        materialsTotalCount: matSummary.materialsTotalCount,
        materialsCompletedCount: matSummary.materialsCompletedCount,
        materialActiveSeconds: matSummary.materialActiveSeconds,
        materialRatio: matSummary.materialRatio,
      });

      const payload = {
        id: logId,
        classId,
        className: classItem?.name || base?.className || '',
        sessionIndex,
        sessionDate: lessonPrep?.date || base?.sessionDate || '',
        lessonTitle: lessonPrep?.lessonTitle || base?.lessonTitle || '',
        sessionStartMs: sessionStartMs || null,
        studentId,
        studentName: studentUser?.name || base?.studentName || '',
        studentCode: studentUser?.code || studentId,
        teacherId: classItem?.teacherId || base?.teacherId || '',
        teacherName: classItem?.teacherName || base?.teacherName || '',
        objectivesCount,
        minRequiredSeconds,
        totalActiveSeconds,
        preClassActiveSeconds,
        postClassActiveSeconds,
        maxScrollPercent,
        materialLogs: existingMaterialLogs,
        materialActiveSeconds: matSummary.materialActiveSeconds,
        materialsOpenedCount: matSummary.materialsOpenedCount,
        materialsCompletedCount: matSummary.materialsCompletedCount,
        materialsTotalCount: matSummary.materialsTotalCount,
        openCount: Number(base?.openCount) || 0,
        firstOpenedAt: base?.firstOpenedAt || nowIso,
        lastReadAt: nowIso,
        completedConfirmedAt: base?.completedConfirmedAt || null,
        prepStatus,
        prepScore,
        notesCount: Number(base?.notesCount) || 0,
        questionsCount: Number(base?.questionsCount) || 0,
        updatedAt: nowIso,
      };

      // 1. Cập nhật cache 0ms Optimistic UI ngay lập tức
      this.setLocalCacheItem(studentId, logId, payload);

      // 2. Đồng bộ Cloud Firestore tuần tự trong hàng đợi (đảm bảo 100% đồng bộ trước khi đóng / chuyển trang)
      if (IS_FIREBASE_ENABLED && db) {
        try {
          await setDoc(doc(db, this.COLLECTION_NAME, logId), payload, { merge: true });
        } catch (err) {
          console.warn('[LessonReadingTrackerService] Lỗi lưu materialLogs lên Firestore:', err.message);
        }
      }

      return payload;
    });
  }

  /**
   * Xóa bản ghi đọc bài (dùng cho Zero-Residue Teardown / Admin cleanup)
   */
  static async deleteReadingLog({ classId, sessionIndex, studentId }) {
    const logId = this.buildLogId(classId, sessionIndex, studentId);
    this.removeLocalCacheItem(studentId, logId);
    if (IS_FIREBASE_ENABLED && db) {
      try {
        await deleteDoc(doc(db, this.COLLECTION_NAME, logId));
      } catch (err) {
        console.warn('[LessonReadingTrackerService] Lỗi xóa reading log:', err.message);
      }
    }
  }
}

export default LessonReadingTrackerService;
