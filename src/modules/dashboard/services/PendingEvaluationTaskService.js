import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';
import {
  POST_SESSION_FEEDBACK_WINDOW_MS,
  evaluateSessionFeedbackCompleteness,
  formatFeedbackCountdown,
  generateClassSessionDates,
  getSessionFeedbackWindowState,
  mergeSessionEvaluationDocs,
  normalizeSessionDateKey,
} from '../../../shared/utils/classSessionUtils';

export class PendingEvaluationTaskService {
  /**
   * Quét và phát hiện các buổi học đã kết thúc nhưng chưa hoàn tất nhận xét 100% học sinh có mặt:
   * - Trong hạn 18 tiếng sau giờ học (isWithin18h): hiển thị đếm ngược nhắc nhẹ
   * - Quá hạn 18 tiếng sau giờ học (isOverdue18h): cảnh báo đỏ Quá hạn 18h (vẫn mở chấm bù)
   * Phân quyền:
   * - Giáo viên: chỉ thấy các buổi của lớp mình phụ trách
   * - Giáo vụ / Giám đốc / Admin: thấy tất cả các lớp của mọi giáo viên
   */
  static async getPendingEvaluations({
    classes = [],
    userRole = 'academic',
    userId = null,
    isEnglish = false,
    now = Date.now(),
  } = {}) {
    const isTeacher = userRole === 'teacher';
    const targetClasses = (classes || []).filter((cls) => {
      if (cls.isDeleted || cls.status === 'Deleted') return false;
      if (isTeacher) {
        return cls.teacherId === userId;
      }
      return true;
    });

    if (!targetClasses.length) return [];

    const tasks = [];

    for (const cls of targetClasses) {
      try {
        const totalSessions = Number(cls.totalSessions) || Number(cls.courseTotalSessions) || 24;
        const allSessions = generateClassSessionDates(cls, totalSessions, isEnglish);
        const pastSessions = allSessions.filter((s) => s.endMs <= now);
        if (!pastSessions.length) continue;

        const rosterIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
        const evalHistory = await ClassroomRealtimeService.getEvaluationHistory(cls.id);

        const byStartMs = new Map();
        const byDocId = new Map();
        const byDateKey = new Map();

        (evalHistory || []).forEach((doc) => {
          if (doc.sessionStart) {
            byStartMs.set(Number(doc.sessionStart), mergeSessionEvaluationDocs(byStartMs.get(Number(doc.sessionStart)), doc));
          }
          if (doc.id) {
            byDocId.set(String(doc.id), mergeSessionEvaluationDocs(byDocId.get(String(doc.id)), doc));
          }
          const dKey = normalizeSessionDateKey(doc.date);
          if (dKey) {
            byDateKey.set(dKey, mergeSessionEvaluationDocs(byDateKey.get(dKey), doc));
          }
        });

        const resolveSessionDoc = (s) => {
          const docId = `LIVE_${cls.id}_${s.dateMs}`;
          const dKey = normalizeSessionDateKey(s.date);
          let merged = null;
          if (byStartMs.has(s.dateMs)) merged = mergeSessionEvaluationDocs(merged, byStartMs.get(s.dateMs));
          if (byDocId.has(docId)) merged = mergeSessionEvaluationDocs(merged, byDocId.get(docId));
          if (dKey && byDateKey.has(dKey)) merged = mergeSessionEvaluationDocs(merged, byDateKey.get(dKey));
          return merged;
        };

        const pendingSessions = pastSessions
          .map((s) => {
            const mergedDoc = resolveSessionDoc(s);
            const comp = evaluateSessionFeedbackCompleteness(mergedDoc, rosterIds);
            const win = getSessionFeedbackWindowState(
              s.endMs,
              now,
              POST_SESSION_FEEDBACK_WINDOW_MS,
              mergedDoc?.unlockState || null
            );
            return {
              ...s,
              sessionDocId: `LIVE_${cls.id}_${s.dateMs}`,
              requiredCount: comp.requiredCount,
              completedCount: comp.completedCount,
              missingCount: comp.missingCount,
              isComplete: comp.isComplete,
              isPartial: comp.isPartial,
              deadlineMs: win.deadlineMs,
              remainingMs: win.remainingMs,
              overdueMs: win.overdueMs,
              isWithin18h: win.isWithinWindow,
              isOverdue18h: win.isOverdue,
              isLockedAfter18h: win.isLockedAfter18h,
              isTemporarilyUnlocked: win.isTemporarilyUnlocked,
              isUnlockRequested: win.isUnlockRequested,
              unlockedUntilMs: win.unlockedUntilMs,
              unlockRemainingMs: win.unlockRemainingMs,
              unlockState: win.unlockState,
              countdownText: win.isWithinWindow ? formatFeedbackCountdown(win.remainingMs, isEnglish) : '',
              unlockCountdownText: win.isTemporarilyUnlocked ? formatFeedbackCountdown(win.unlockRemainingMs, isEnglish) : '',
            };
          })
          .filter((item) => !item.isComplete || item.isUnlockRequested);

        if (pendingSessions.length > 0) {
          const overdueCount = pendingSessions.filter((s) => s.isLockedAfter18h).length;
          const withinWindowCount = pendingSessions.filter((s) => s.isWithin18h || s.isTemporarilyUnlocked).length;
          const unlockRequestCount = pendingSessions.filter((s) => s.isUnlockRequested).length;
          tasks.push({
            id: `TASK_EVAL_${cls.id}`,
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName || (isEnglish ? 'Native Teacher' : 'Giáo viên bản xứ'),
            schedule: cls.schedule || '',
            missedSessions: pendingSessions,
            totalMissed: pendingSessions.length,
            overdueCount,
            withinWindowCount,
            unlockRequestCount,
            hasUnlockRequests: unlockRequestCount > 0,
            hasOverdue: overdueCount > 0,
            latestMissedDate: pendingSessions[pendingSessions.length - 1]?.date,
          });
        }
      } catch (err) {
        console.warn(`[PendingEvaluationTaskService] Lỗi quét task lớp ${cls.id}:`, err);
      }
    }

    return tasks.sort(
      (a, b) =>
        Number(b.hasUnlockRequests) - Number(a.hasUnlockRequests)
        || Number(b.hasOverdue) - Number(a.hasOverdue)
        || b.overdueCount - a.overdueCount
    );
  }
}
