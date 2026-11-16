import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';

export class PendingEvaluationTaskService {
  /**
   * Quét và phát hiện các buổi học trong quá khứ bị sót đánh giá (Pending Evaluation Tasks)
   * Phân quyền cho:
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
        // Chỉ xét các buổi học đã kết thúc
        const pastSessions = allSessions.filter((s) => s.endMs <= now);
        if (!pastSessions.length) continue;

        const evalHistory = await ClassroomRealtimeService.getEvaluationHistory(cls.id);
        const evaluatedMap = new Set();
        (evalHistory || []).forEach((doc) => {
          const evals = doc.studentEvaluations || {};
          const hasEvals = Object.values(evals).some((e) => e?.stars || e?.comment);
          if (hasEvals) {
            if (doc.sessionStart) evaluatedMap.add(doc.sessionStart);
            if (doc.id) evaluatedMap.add(doc.id);
            if (doc.date) evaluatedMap.add(doc.date);
          }
        });

        const missedSessions = pastSessions.filter((s) => {
          const docId = `LIVE_${cls.id}_${s.dateMs}`;
          return !evaluatedMap.has(s.dateMs) && !evaluatedMap.has(docId) && !evaluatedMap.has(s.date);
        });

        if (missedSessions.length > 0) {
          tasks.push({
            id: `TASK_EVAL_${cls.id}`,
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName || (isEnglish ? 'Native Teacher' : 'Giáo viên bản xứ'),
            schedule: cls.schedule || '',
            missedSessions,
            totalMissed: missedSessions.length,
            latestMissedDate: missedSessions[missedSessions.length - 1]?.date,
          });
        }
      } catch (err) {
        console.warn(`[PendingEvaluationTaskService] Lỗi quét task lớp ${cls.id}:`, err);
      }
    }

    return tasks;
  }
}
