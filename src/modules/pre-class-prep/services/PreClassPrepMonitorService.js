import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { ClassService } from '../../courses/services/ClassService';
import { UserService } from '../../users/services/UserService';
import { PreClassPrepReportService, PREP_STATUS } from '../../lesson-reader';

/**
 * PreClassPrepMonitorService — Dedicated Sub-Feature Service (1 Sub-Feature = 1 Class)
 * - Nạp báo cáo chuẩn bị bài trước giờ học đã cô lập chặt chẽ theo 6 Roles RBAC:
 *   + academic / director / admin: Toàn trường, kèm SĐT Phụ huynh + quyền nhắc cá nhân & hàng loạt.
 *   + teacher: Chỉ các lớp GV phụ trách, TUYỆT ĐỐI ẨN 100% SĐT Phụ huynh, Zalo và Học phí.
 *   + student / accountant: Không có quyền truy cập (trả về dữ liệu rỗng).
 */
export class PreClassPrepMonitorService extends BaseModuleService {
  static async getScopedPrepDataset(currentUser, isEnglish = false) {
    if (!currentUser) {
      return this.buildEmptyDataset();
    }

    const role = String(currentUser.role || '').toLowerCase();
    const uid = String(currentUser.id || currentUser.code || '');

    if (!['academic', 'director', 'admin', 'teacher'].includes(role)) {
      return this.buildEmptyDataset();
    }

    const [allClasses, allUsers] = await Promise.all([
      ClassService.getAllClasses().catch(() => []),
      UserService.getAllUsers().catch(() => []),
    ]);

    const activeClasses = (allClasses || []).filter(
      (c) => c && !c.isDeleted && c.status !== 'Deleted'
    );

    let scopedClasses = activeClasses;
    if (role === 'teacher') {
      scopedClasses = activeClasses.filter(
        (c) =>
          String(c.teacherId || '') === uid ||
          (currentUser.name && c.teacherName && String(c.teacherName) === String(currentUser.name))
      );
    }

    const report = await PreClassPrepReportService.buildPrepReport({
      classes: scopedClasses,
      users: allUsers || [],
      userRole: role,
      isEnglish,
    });

    const plannedClasses = (report?.classReports || []).filter(
      (c) => c.hasLessonPlan && c.totalStudents > 0
    );

    const studentRows = [];
    plannedClasses.forEach((cls) => {
      (cls.students || []).forEach((st) => {
        studentRows.push({
          ...st,
          rowKey: `${cls.classId}_${st.studentId}`,
          courseLevel: cls.courseLevel || 'Wonders ELA',
          schedule: cls.schedule || '',
        });
      });
    });

    // Sắp xếp ưu tiên: Chưa đọc -> Đọc lướt -> Đọc sau giờ -> Đã đọc tốt; cùng nhóm ưu tiên điểm rèn luyện thấp lên trước
    const statusPriority = {
      [PREP_STATUS.NOT_STARTED]: 0,
      [PREP_STATUS.SKIMMED]: 1,
      [PREP_STATUS.POST_READ]: 2,
      [PREP_STATUS.PREPARED]: 3,
    };
    studentRows.sort((a, b) => {
      const diff = (statusPriority[a.prepStatus] ?? 9) - (statusPriority[b.prepStatus] ?? 9);
      if (diff !== 0) return diff;
      return (a.conductScore || 0) - (b.conductScore || 0);
    });

    return {
      summary: report?.summary || this.buildEmptyDataset().summary,
      plannedClasses,
      allClassReports: report?.classReports || [],
      studentRows,
      needsAttentionStudents: report?.needsAttentionStudents || [],
    };
  }

  static buildEmptyDataset() {
    return {
      summary: {
        totalClassesMonitored: 0,
        totalActiveClasses: 0,
        totalStudentsMonitored: 0,
        totalPrepared: 0,
        totalSkimmed: 0,
        totalNotStarted: 0,
        overallReadinessRate: 0,
        overallEngagedRate: 0,
        avgConductScore: 0,
        totalOpenQuestions: 0,
      },
      plannedClasses: [],
      allClassReports: [],
      studentRows: [],
      needsAttentionStudents: [],
    };
  }

  static async sendSingleReminder({ studentRow, senderUser, isEnglish = false }) {
    if (!studentRow?.studentId || !studentRow?.classId) return null;
    return PreClassPrepReportService.sendPreClassPrepReminder({
      studentId: studentRow.studentId,
      studentName: studentRow.studentName,
      classId: studentRow.classId,
      className: studentRow.className,
      sessionIndex: studentRow.sessionIndex,
      senderUser,
      isEnglish,
    });
  }

  /**
   * Gửi nhắc hàng loạt cho danh sách học viên chưa chuẩn bị bài (chạy theo batch an toàn)
   */
  static async sendBulkReminders({ studentRows = [], senderUser, isEnglish = false }) {
    const targets = (studentRows || []).filter(
      (r) => r && r.prepStatus !== PREP_STATUS.PREPARED && r.studentId && r.classId
    );
    if (targets.length === 0) return { sentCount: 0, failedCount: 0, sentKeys: [] };

    const results = await Promise.allSettled(
      targets.map((row) =>
        this.sendSingleReminder({
          studentRow: row,
          senderUser,
          isEnglish,
        }).then(() => `${row.classId}_${row.studentId}`)
      )
    );

    const sentKeys = [];
    let failedCount = 0;
    results.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        sentKeys.push(res.value);
      } else {
        failedCount += 1;
      }
    });

    return {
      sentCount: sentKeys.length,
      failedCount,
      sentKeys,
    };
  }
}

export default PreClassPrepMonitorService;
