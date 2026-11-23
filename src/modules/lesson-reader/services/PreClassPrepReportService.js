import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from '../../../core/services/NotificationService';
import { StudentDashboardService } from '../../dashboard/services/StudentDashboardService';
import { UserService } from '../../users/services/UserService';
import { LessonReadingTrackerService } from './LessonReadingTrackerService';
import { LessonQuestionService } from './LessonQuestionService';
import { ConductScoreService } from './ConductScoreService';
import {
  PREP_STATUS,
  QUESTION_STATUS,
  computeMinRequiredSeconds,
  evaluatePrepStatus,
  summarizeMaterialsProgress,
} from '../models/lessonReader.model';

/**
 * PreClassPrepReportService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * Tổng hợp Báo Cáo Chuẩn Bị Bài Trước Giờ Học & Điểm Rèn Luyện cho 3 cấp quản lý:
 * - Giáo viên (`teacher`): Chỉ lớp GV phụ trách, TUYỆT ĐỐI ẨN SĐT Phụ huynh & Zalo.
 * - Giáo vụ (`academic`): Toàn trường, kèm SĐT Phụ huynh + nút gửi nhắc nhở đọc bài.
 * - Giám đốc (`director` / `admin`): KPI Toàn trường + Đối soát theo lớp & học viên cần lưu ý.
 */
export class PreClassPrepReportService extends BaseModuleService {
  /**
   * Đọc toàn bộ `lesson_reading_logs` từ Cloud Firestore (1 truy vấn batch duy nhất)
   */
  static async fetchAllReadingLogs() {
    if (!IS_FIREBASE_ENABLED || !db) return [];
    try {
      const snap = await getDocs(collection(db, LessonReadingTrackerService.COLLECTION_NAME));
      const list = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      return list;
    } catch (err) {
      console.warn('[PreClassPrepReportService] Lỗi tải lesson_reading_logs:', err.message);
      return [];
    }
  }

  /**
   * Tổng hợp báo cáo chuẩn bị bài theo danh sách lớp & phân quyền vai trò
   */
  static async buildPrepReport({
    classes = [],
    users = [],
    userRole = 'teacher',
    isEnglish = false,
  }) {
    const canViewParentContacts = ['academic', 'director', 'admin'].includes(
      String(userRole || '').toLowerCase()
    );

    const [allLogs, allQuestions, resolvedUsers] = await Promise.all([
      this.fetchAllReadingLogs(),
      LessonQuestionService.getAllQuestions().catch(() => []),
      Array.isArray(users) && users.length > 0
        ? Promise.resolve(users)
        : UserService.getAllUsers().catch(() => []),
    ]);

    const userMap = new Map();
    (resolvedUsers || []).forEach((u) => {
      if (u?.id) userMap.set(String(u.id), u);
      if (u?.code) userMap.set(String(u.code), u);
    });

    const logMap = new Map();
    allLogs.forEach((l) => {
      if (l?.id) logMap.set(l.id, l);
    });

    const activeClasses = (classes || []).filter((c) => c && !c.isDeleted && c.status !== 'Deleted');
    const classReports = [];
    const allStudentRows = [];

    activeClasses.forEach((cls) => {
      const classId = cls.id || cls.code;
      const studentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
      const lessonPrep = StudentDashboardService.getLessonPreparationGuide(cls);
      const sessionIndex = Number(lessonPrep?.sessionIndex) || 1;
      const objectivesCount = Array.isArray(lessonPrep?.objectives) ? lessonPrep.objectives.length : 0;
      const minRequiredSeconds = computeMinRequiredSeconds(objectivesCount);

      const classQuestions = allQuestions.filter(
        (q) => !q.isDeleted && String(q.classId) === String(classId)
      );
      const openQuestionsCount = classQuestions.filter(
        (q) => q.status === QUESTION_STATUS.OPEN
      ).length;

      const studentRows = studentIds.map((sid) => {
        const u = userMap.get(String(sid)) || {};
        const logId = LessonReadingTrackerService.buildLogId(classId, sessionIndex, sid);
        const log = logMap.get(logId) || null;

        const preSec = Number(log?.preClassActiveSeconds) || 0;
        const postSec = Number(log?.postClassActiveSeconds) || 0;
        const totalSec = Number(log?.totalActiveSeconds) || preSec + postSec;
        const scrollPct = Number(log?.maxScrollPercent) || 0;

        const attachedMaterials = Array.isArray(lessonPrep?.attachedMaterials)
          ? lessonPrep.attachedMaterials
          : [];
        const matSummary = summarizeMaterialsProgress(attachedMaterials, log?.materialLogs || {});

        const { prepStatus, prepScore } = lessonPrep
          ? evaluatePrepStatus({
              preClassActiveSeconds: preSec,
              postClassActiveSeconds: postSec,
              maxScrollPercent: scrollPct,
              minRequiredSeconds: log?.minRequiredSeconds || minRequiredSeconds,
              materialsTotalCount: matSummary.materialsTotalCount,
              materialsCompletedCount: matSummary.materialsCompletedCount,
              materialActiveSeconds: matSummary.materialActiveSeconds,
              materialRatio: matSummary.materialRatio,
            })
          : { prepStatus: PREP_STATUS.NOT_STARTED, prepScore: 0 };

        const qCount = classQuestions.filter(
          (q) => String(q.studentId) === String(sid) && Number(q.sessionIndex) === sessionIndex
        ).length;
        const notesCount = Number(log?.notesCount) || 0;

        // Tính điểm rèn luyện nhanh theo dữ liệu sẵn có của học viên
        const conductSummary = ConductScoreService.computeStudentConductSummary({
          studentId: sid,
          classes: [cls],
          readingLogs: log ? [log] : [],
          questions: classQuestions,
          isEnglish,
        });

        const baseRow = {
          studentId: String(sid),
          studentCode: u.code || String(sid),
          studentName: u.name || log?.studentName || String(sid),
          englishName: u.englishName || '',
          classId,
          className: cls.name || classId,
          teacherId: cls.teacherId || '',
          teacherName: cls.teacherName || 'Teacher',
          sessionIndex,
          hasLessonPlan: Boolean(lessonPrep),
          lessonTitle: lessonPrep?.lessonTitle || '',
          minRequiredSeconds,
          preClassActiveSeconds: preSec,
          totalActiveSeconds: totalSec,
          maxScrollPercent: scrollPct,
          materialActiveSeconds: matSummary.materialActiveSeconds,
          materialsOpenedCount: matSummary.materialsOpenedCount,
          materialsCompletedCount: matSummary.materialsCompletedCount,
          materialsTotalCount: matSummary.materialsTotalCount,
          materialItems: matSummary.items,
          prepStatus,
          prepScore,
          notesCount,
          questionsCount: Math.max(qCount, Number(log?.questionsCount) || 0),
          lastReadAt: log?.lastReadAt || null,
          completedConfirmedAt: log?.completedConfirmedAt || null,
          conductScore: conductSummary.overallScore,
          conductRank: conductSummary.rank,
        };

        // KỶ LUẬT BẢO MẬT PII: Chỉ Giáo vụ / Giám đốc / Admin mới nhận thông tin liên hệ Phụ huynh
        if (canViewParentContacts) {
          baseRow.parentName = u.parentName || '';
          baseRow.parentPhone = u.parentPhone || u.phoneNumber || '';
        }

        allStudentRows.push(baseRow);
        return baseRow;
      });

      // Sắp xếp học viên: Chưa đọc lên trước (hoặc theo điểm tăng dần để dễ đôn đốc)
      const statusOrder = {
        [PREP_STATUS.NOT_STARTED]: 0,
        [PREP_STATUS.SKIMMED]: 1,
        [PREP_STATUS.POST_READ]: 2,
        [PREP_STATUS.PREPARED]: 3,
      };
      studentRows.sort((a, b) => (statusOrder[a.prepStatus] ?? 9) - (statusOrder[b.prepStatus] ?? 9));

      const totalStudents = studentRows.length;
      const preparedCount = studentRows.filter((r) => r.prepStatus === PREP_STATUS.PREPARED).length;
      const skimmedCount = studentRows.filter((r) => r.prepStatus === PREP_STATUS.SKIMMED).length;
      const postReadCount = studentRows.filter((r) => r.prepStatus === PREP_STATUS.POST_READ).length;
      const notStartedCount = studentRows.filter((r) => r.prepStatus === PREP_STATUS.NOT_STARTED).length;

      const readinessRate =
        totalStudents > 0 ? Math.round((preparedCount / totalStudents) * 100) : 0;
      const engagedRate =
        totalStudents > 0
          ? Math.round(((preparedCount + skimmedCount + postReadCount) / totalStudents) * 100)
          : 0;
      const avgConductScore =
        totalStudents > 0
          ? Math.round(studentRows.reduce((acc, r) => acc + r.conductScore, 0) / totalStudents)
          : 0;

      classReports.push({
        classId,
        className: cls.name || classId,
        courseLevel: cls.courseLevel || 'Wonders ELA',
        schedule: cls.schedule || '',
        teacherId: cls.teacherId || '',
        teacherName: cls.teacherName || 'Teacher',
        hasLessonPlan: Boolean(lessonPrep),
        sessionIndex,
        lessonTitle: lessonPrep?.lessonTitle || '',
        minRequiredSeconds,
        totalStudents,
        preparedCount,
        skimmedCount,
        postReadCount,
        notStartedCount,
        readinessRate,
        engagedRate,
        avgConductScore,
        openQuestionsCount,
        students: studentRows,
      });
    });

    // Ưu tiên lớp đã có giáo án lên đầu
    classReports.sort((a, b) => {
      if (a.hasLessonPlan !== b.hasLessonPlan) return a.hasLessonPlan ? -1 : 1;
      return b.totalStudents - a.totalStudents;
    });

    const plannedRows = allStudentRows.filter((r) => r.hasLessonPlan);
    const totalMonitored = plannedRows.length;
    const totalPrepared = plannedRows.filter((r) => r.prepStatus === PREP_STATUS.PREPARED).length;
    const totalSkimmed = plannedRows.filter((r) => r.prepStatus === PREP_STATUS.SKIMMED).length;
    const totalNotStarted = plannedRows.filter((r) => r.prepStatus === PREP_STATUS.NOT_STARTED).length;

    const overallReadinessRate =
      totalMonitored > 0 ? Math.round((totalPrepared / totalMonitored) * 100) : 0;
    const overallEngagedRate =
      totalMonitored > 0
        ? Math.round(((totalPrepared + totalSkimmed) / totalMonitored) * 100)
        : 0;
    const avgConductScore =
      totalMonitored > 0
        ? Math.round(plannedRows.reduce((acc, r) => acc + r.conductScore, 0) / totalMonitored)
        : 0;

    const totalOpenQuestions = allQuestions.filter(
      (q) => !q.isDeleted && q.status === QUESTION_STATUS.OPEN
    ).length;

    const needsAttentionStudents = plannedRows.filter(
      (r) => r.prepStatus === PREP_STATUS.NOT_STARTED || r.conductScore < 60
    );

    return {
      summary: {
        totalClassesMonitored: classReports.filter((c) => c.hasLessonPlan).length,
        totalActiveClasses: classReports.length,
        totalStudentsMonitored: totalMonitored,
        totalPrepared,
        totalSkimmed,
        totalNotStarted,
        overallReadinessRate,
        overallEngagedRate,
        avgConductScore,
        totalOpenQuestions,
      },
      classReports,
      needsAttentionStudents,
    };
  }

  /**
   * Giáo vụ / Admin gửi thông báo nhắc nhở học viên đọc bài trước giờ học (0ms Realtime Push)
   */
  static async sendPreClassPrepReminder({
    studentId,
    studentName,
    classId,
    className,
    sessionIndex,
    senderUser,
    isEnglish = false,
  }) {
    if (!studentId || !classId) return null;

    return NotificationService.sendNotification({
      recipientId: String(studentId),
      recipientRole: 'student',
      type: NOTIFICATION_TYPES.PRE_CLASS_PREP_REMINDER,
      title: isEnglish
        ? `📖 Reminder: Read Lesson Overview before class (${className})`
        : `📖 Nhắc nhở chuẩn bị bài trước giờ học (${className} • Buổi ${sessionIndex})`,
      message: isEnglish
        ? `Hi ${studentName}! Please open the Lesson Book Reader for Session ${sessionIndex} before class to earn full Pre-Class Conduct Points.`
        : `Chào ${studentName}! Con nhớ mở Chế độ Đọc Sách bài học Buổi ${sessionIndex} trước giờ lên lớp để nắm vững bài và tích điểm Rèn luyện nhé!`,
      actionUrl: `/dashboard?openReader=1&classId=${encodeURIComponent(classId)}`,
      metadata: {
        classId,
        sessionIndex,
        studentId,
      },
      createdBy: senderUser?.id || 'academic',
      createdByName: senderUser?.name || 'Giáo Vụ Đào Tạo',
      createdByRole: senderUser?.role || 'academic',
    });
  }
}

export default PreClassPrepReportService;
