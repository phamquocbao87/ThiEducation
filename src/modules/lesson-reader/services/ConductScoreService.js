import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import {
  PREP_STATUS,
  computeMinRequiredSeconds,
  evaluatePrepStatus,
} from '../models/lessonReader.model';
import { StudentDashboardService } from '../../dashboard/services/StudentDashboardService';

/**
 * ConductScoreService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * Engine tính Điểm Rèn Luyện Học Viên (Student Conduct & Diligence Score — Thang 100):
 *   ConductScore = 0.35 * S_prep + 0.15 * S_engage + 0.25 * S_attend + 0.25 * S_hw
 *
 * Nguồn dữ liệu 100% thực tế từ Cloud Firestore (Zero Mock Data):
 * - lesson_reading_logs (chuẩn bị bài & thời gian đọc thực tế)
 * - lesson_student_notes + lesson_questions (tương tác chủ động)
 * - session_evaluations (chuyên cần & đúng giờ)
 * - exercise_assignments + exercise_attempts + homeworks (hoàn thành bài tập)
 */
export class ConductScoreService extends BaseModuleService {
  static WEIGHTS = {
    PREP: 0.35,
    ENGAGE: 0.15,
    ATTEND: 0.25,
    HOMEWORK: 0.25,
  };

  /**
   * Xếp loại Rèn Luyện theo thang 100 điểm (SPEC-10 §4.2)
   */
  static getConductRank(score, isEnglish = false) {
    const val = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
    if (val >= 90) {
      return {
        key: 'EXEMPLARY',
        icon: '🏆',
        label: isEnglish ? 'Exemplary' : 'Xuất sắc',
        color: '#16a34a',
        tagColor: 'success',
        bg: '#f0fdf4',
        border: '#86efac',
      };
    }
    if (val >= 75) {
      return {
        key: 'GOOD',
        icon: '🌟',
        label: isEnglish ? 'Good' : 'Tốt',
        color: '#2563eb',
        tagColor: 'processing',
        bg: '#eff6ff',
        border: '#93c5fd',
      };
    }
    if (val >= 60) {
      return {
        key: 'SATISFACTORY',
        icon: '👍',
        label: isEnglish ? 'Satisfactory' : 'Khá',
        color: '#d97706',
        tagColor: 'warning',
        bg: '#fffbeb',
        border: '#fcd34d',
      };
    }
    return {
      key: 'NEEDS_ATTENTION',
      icon: '⚠️',
      label: isEnglish ? 'Needs Attention' : 'Cần đôn đốc',
      color: '#dc2626',
      tagColor: 'error',
      bg: '#fef2f2',
      border: '#fca5a5',
    };
  }

  /**
   * Tính Điểm Rèn Luyện tổng hợp cho 1 Học Viên
   */
  static computeStudentConductSummary({
    studentId,
    classes = [],
    readingLogs = [],
    evaluations = [],
    homeworks = [],
    questions = [],
    isEnglish = false,
  }) {
    const uid = String(studentId || '');
    const studentLogs = (Array.isArray(readingLogs) ? readingLogs : Object.values(readingLogs || {})).filter(
      (l) => l && String(l.studentId) === uid
    );
    const studentQuestions = (questions || []).filter((q) => !q.isDeleted && String(q.studentId) === uid);

    // 1. S_prep (35%): Chuẩn bị bài trước giờ học trên tất cả các buổi có giáo án sẵn sàng
    const plannedSessions = [];
    (classes || []).forEach((cls) => {
      if (!cls || cls.isDeleted) return;
      const plans = cls.lessonPlans || {};
      const readyPlans = Object.values(plans).filter(
        (p) => p && p.status !== 'DRAFT' && (p.lessonTitle || p.objectives || p.studentPrep)
      );
      if (readyPlans.length > 0) {
        // Lấy buổi giáo án mới nhất của lớp (hoặc tất cả buổi sẵn sàng)
        const latestPlan = StudentDashboardService.getLessonPreparationGuide(cls);
        if (latestPlan) {
          plannedSessions.push({
            classId: cls.id || cls.code,
            sessionIndex: Number(latestPlan.sessionIndex) || 1,
            objectivesCount: Array.isArray(latestPlan.objectives) ? latestPlan.objectives.length : 0,
          });
        }
      }
    });

    let prepScoreSum = 0;
    let preparedSessions = 0;
    let engagedSessions = 0;

    plannedSessions.forEach((ps) => {
      const log = studentLogs.find(
        (l) => l.classId === ps.classId && Number(l.sessionIndex) === ps.sessionIndex
      );
      const minReq = computeMinRequiredSeconds(ps.objectivesCount);
      const evalRes = log
        ? evaluatePrepStatus({
            preClassActiveSeconds: log.preClassActiveSeconds,
            postClassActiveSeconds: log.postClassActiveSeconds,
            maxScrollPercent: log.maxScrollPercent,
            minRequiredSeconds: log.minRequiredSeconds || minReq,
          })
        : { prepStatus: PREP_STATUS.NOT_STARTED, prepScore: 0 };

      prepScoreSum += evalRes.prepScore;
      if (evalRes.prepStatus === PREP_STATUS.PREPARED) {
        preparedSessions += 1;
      }

      const qCount = studentQuestions.filter(
        (q) => q.classId === ps.classId && Number(q.sessionIndex) === ps.sessionIndex
      ).length;
      const nCount = Number(log?.notesCount) || 0;
      if (nCount > 0 || qCount > 0 || Number(log?.questionsCount) > 0) {
        engagedSessions += 1;
      }
    });

    const totalPlanned = plannedSessions.length;
    const prepScore = totalPlanned > 0 ? Math.round(prepScoreSum / totalPlanned) : 100;

    // 2. S_engage (15%): Đạt 100 điểm nếu có Note hoặc Q&A ở >= 50% số buổi có giáo án
    const engageScore =
      totalPlanned > 0
        ? Math.min(100, Math.round((engagedSessions / Math.max(1, totalPlanned * 0.5)) * 100))
        : 0;

    // 3. S_attend (25%): Chuyên cần & Đúng giờ từ evaluations
    let attendScore = 100;
    if (Array.isArray(evaluations) && evaluations.length > 0) {
      let sum = 0;
      evaluations.forEach((ev) => {
        if (ev.isOffline || ev.attendance === 'Absent') {
          sum += 0;
        } else if (
          String(ev.teacherComment || '').toLowerCase().startsWith('late') ||
          String(ev.attendance || '').toLowerCase().includes('late')
        ) {
          sum += 70;
        } else {
          sum += 100;
        }
      });
      attendScore = Math.round(sum / evaluations.length);
    }

    // 4. S_hw (25%): Hoàn thành bài tập được giao
    let homeworkScore = 100;
    if (Array.isArray(homeworks) && homeworks.length > 0) {
      const doneCount = homeworks.filter((h) =>
        ['submitted', 'graded', 'completed'].includes(String(h.status || '').toLowerCase())
      ).length;
      homeworkScore = Math.round((doneCount / homeworks.length) * 100);
    }

    const overallScore = Math.round(
      this.WEIGHTS.PREP * prepScore +
        this.WEIGHTS.ENGAGE * engageScore +
        this.WEIGHTS.ATTEND * attendScore +
        this.WEIGHTS.HOMEWORK * homeworkScore
    );

    const totalReadingSeconds = studentLogs.reduce(
      (acc, l) => acc + (Number(l.totalActiveSeconds) || 0),
      0
    );
    const totalNotes = studentLogs.reduce((acc, l) => acc + (Number(l.notesCount) || 0), 0);
    const totalQuestions = Math.max(
      studentQuestions.length,
      studentLogs.reduce((acc, l) => acc + (Number(l.questionsCount) || 0), 0)
    );

    return {
      overallScore,
      rank: this.getConductRank(overallScore, isEnglish),
      breakdown: {
        prep: { score: prepScore, weight: 35 },
        engage: { score: engageScore, weight: 15 },
        attend: { score: attendScore, weight: 25 },
        homework: { score: homeworkScore, weight: 25 },
      },
      totals: {
        totalReadingSeconds,
        preparedSessions,
        totalPlannedSessions: totalPlanned,
        totalNotes,
        totalQuestions,
        evaluationsCount: evaluations?.length || 0,
        homeworksCount: homeworks?.length || 0,
      },
    };
  }
}

export default ConductScoreService;
