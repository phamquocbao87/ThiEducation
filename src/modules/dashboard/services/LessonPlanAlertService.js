/**
 * LessonPlanAlertService — Dịch Vụ Quét & Cảnh Báo Soạn Giáo Án Trước 24H & Báo Thiếu Giáo Trình
 * LAK EDUCATION ERP (lakeducation.com)
 *
 * Chức năng:
 * 1. TẦNG 1: Cảnh báo khẩn cấp các ca học diễn ra trong 24h tới (T - 24h) chưa có giáo án hoặc thiếu giáo trình.
 * 2. TẦNG 2: Tổng hợp hồ sơ tồn đọng (Backlog) các buổi học cũ trong quá khứ chưa hoàn thiện giáo án.
 * 3. Tính toán chỉ số KPI sẵn sàng bài học 24h cho Giám đốc và Giáo vụ.
 * 4. Hỗ trợ cô lập dữ liệu 6 Roles (Giáo viên chỉ thấy lớp mình; Giáo vụ / Giám đốc thấy toàn trường).
 */

import { generateClassSessionDates, findClassSession } from '../../../shared/utils/classSessionUtils';

export const LESSON_PLAN_ISSUE_TYPE = {
  MISSING_PLAN: 'MISSING_PLAN', // Thiếu giáo án
  MISSING_CURRICULUM: 'MISSING_CURRICULUM', // Thiếu giáo trình Wonders
  MISSING_BOTH: 'MISSING_BOTH', // Thiếu cả giáo án lẫn giáo trình
};

export class LessonPlanAlertService {
  /**
   * Quét và phát hiện các ca học cần chuẩn bị giáo án & giáo trình
   * @param {Object} params
   * @param {Array} params.classes - Danh sách lớp học
   * @param {string} params.userRole - Vai trò (teacher | academic | director | admin)
   * @param {string} params.userId - Mã định danh người dùng (để lọc lớp cho GV)
   * @param {boolean} params.isEnglish - Ngôn ngữ hiển thị
   * @param {number} params.now - Thời điểm quét (mặc định Date.now())
   * @param {number} params.windowHours - Khung giờ cảnh báo (mặc định 24h)
   */
  static getLessonPlanAlerts({
    classes = [],
    userRole = 'academic',
    userId = null,
    isEnglish = false,
    now = Date.now(),
    windowHours = 24,
  } = {}) {
    const isTeacher = userRole === 'teacher';
    const windowMs = windowHours * 60 * 60 * 1000;
    const windowEnd = now + windowMs;

    // 1. Lọc lớp hợp lệ
    const targetClasses = (classes || []).filter((cls) => {
      if (!cls || cls.isDeleted || ['Deleted', 'Đã xóa', 'Completed', 'Đã hoàn thành', 'Cancelled', 'Tạm hoãn'].includes(cls.status)) {
        return false;
      }
      if (isTeacher) {
        return cls.teacherId === userId;
      }
      return true;
    });

    if (!targetClasses.length) {
      return {
        urgentAlerts: [],
        readyCount: 0,
        totalUpcoming24h: 0,
        complianceRate: 100,
        pastMissingCount: 0,
        pastMissingSessions: [],
      };
    }

    const urgentAlerts = [];
    let readyCount = 0;
    let totalUpcoming24h = 0;
    const pastMissingSessions = [];

    for (const cls of targetClasses) {
      const totalSessions = Number(cls.totalSessions) || Number(cls.courseTotalSessions) || 24;
      const allSessions = generateClassSessionDates(cls, totalSessions, isEnglish);
      const plansMap = cls.lessonPlans || {};

      // Kiểm tra có giáo trình / sách giáo khoa Wonders được gán không
      const hasCurriculum = Boolean(
        cls.curriculumId || cls.curriculumSeries || cls.curriculumTextbooks || cls.courseLevel || cls.courseName
      );

      // A. Quét các ca học sắp tới trong vòng windowHours (T - 24h)
      const upcoming24hSessions = allSessions.filter(
        (s) => s.dateMs > now && s.dateMs <= windowEnd
      );

      // Nếu không có trong allSessions nhưng findClassSession trả về một ca sắp diễn ra trong 24h
      if (!upcoming24hSessions.length) {
        const nextSession = findClassSession(cls, now);
        if (nextSession && nextSession.start > now && nextSession.start <= windowEnd) {
          upcoming24hSessions.push({
            sessionIndex: nextSession.sessionIndex || 1,
            dateMs: nextSession.start,
            endMs: nextSession.end,
            date: new Date(nextSession.start).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN'),
            timeRange: nextSession.timeRange || cls.schedule || '',
            unitWeek: cls.currentUnitWeek || 'Unit 1 Week 1 · Lesson 1',
            dayName: isEnglish ? 'Upcoming Session' : 'Buổi Học Sắp Tới',
          });
        }
      }

      for (const session of upcoming24hSessions) {
        totalUpcoming24h += 1;
        const plan = plansMap[session.sessionIndex] || plansMap[session.date] || null;
        const hasPlan = Boolean(
          plan && (plan.lessonTitle || plan.objectives || plan.studentPrep || plan.status === 'READY')
        );

        if (hasPlan && hasCurriculum) {
          readyCount += 1;
        } else {
          // Xác định loại thiếu sót
          let issueType = LESSON_PLAN_ISSUE_TYPE.MISSING_PLAN;
          if (!hasPlan && !hasCurriculum) issueType = LESSON_PLAN_ISSUE_TYPE.MISSING_BOTH;
          else if (!hasCurriculum) issueType = LESSON_PLAN_ISSUE_TYPE.MISSING_CURRICULUM;

          const diffMs = session.dateMs - now;
          const diffHours = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)));
          const diffMinutes = Math.max(0, Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000)));

          urgentAlerts.push({
            id: `ALERT_24H_${cls.id}_${session.sessionIndex}`,
            classId: cls.id,
            className: cls.name || cls.code || 'Lớp Học',
            courseLevel: cls.courseLevel || cls.courseName || 'McGraw-Hill Wonders',
            teacherId: cls.teacherId,
            teacherName: cls.teacherName || (isEnglish ? 'Native Teacher' : 'Giáo Viên Bản Xứ'),
            sessionIndex: session.sessionIndex,
            sessionDate: session.date,
            sessionDateMs: session.dateMs,
            timeRange: session.timeRange,
            unitWeek: session.unitWeek,
            dayName: session.dayName,
            diffHours,
            diffMinutes,
            isUrgent12h: diffHours < 12,
            hasPlan,
            hasCurriculum,
            issueType,
            existingPlan: plan,
            cls,
          });
        }
      }

      // B. Quét các ca học cũ trong quá khứ (TẦNG 2: Hồ sơ tồn đọng / Backlog)
      const pastSessions = allSessions.filter((s) => s.endMs <= now);
      for (const session of pastSessions) {
        const plan = plansMap[session.sessionIndex] || plansMap[session.date] || null;
        const hasPlan = Boolean(
          plan && (plan.lessonTitle || plan.objectives || plan.studentPrep || plan.status === 'READY')
        );

        if (!hasPlan) {
          pastMissingSessions.push({
            id: `PAST_MISSING_${cls.id}_${session.sessionIndex}`,
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName,
            sessionIndex: session.sessionIndex,
            sessionDate: session.date,
            sessionDateMs: session.dateMs,
            unitWeek: session.unitWeek,
            cls,
          });
        }
      }
    }

    // Sắp xếp ca khẩn cấp: Ca nào gần giờ học nhất (< 12h) lên đầu
    urgentAlerts.sort((a, b) => a.sessionDateMs - b.sessionDateMs);

    const complianceRate = totalUpcoming24h > 0
      ? Math.round((readyCount / totalUpcoming24h) * 100)
      : 100;

    return {
      urgentAlerts,
      readyCount,
      totalUpcoming24h,
      complianceRate,
      pastMissingCount: pastMissingSessions.length,
      pastMissingSessions,
    };
  }
}
