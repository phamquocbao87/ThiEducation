import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { SESSION_STATUS } from '../models/schedules.model';

/**
 * Sub-Feature Class 2 (Schedules Module): Timetable Slot Filtering, Scoping & Creation
 */
export class TimetableSlotService extends BaseModuleService {
  static getScopedTimetable(timetable, currentUser, selectedDayFilter = 'ALL') {
    if (!Array.isArray(timetable) || timetable.length === 0) return [];
    const roleScoped = this.scopeByRole(timetable, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
      classIdField: 'classId',
    });
    return this.filterByField(roleScoped, selectedDayFilter, 'day');
  }

  /**
   * Tự động đồng bộ ca học từ danh sách Lớp học thực tế trong hệ thống
   */
  static generateSlotsFromClasses(classes = []) {
    if (!Array.isArray(classes) || classes.length === 0) {
      return [];
    }

    const dayNumToVi = {
      1: 'Thứ 2',
      2: 'Thứ 3',
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7',
      0: 'Chủ Nhật',
    };

    const slots = [];
    classes.forEach((cls, index) => {
      const scheduleStr = cls.schedule || '';
      const timeMatch = scheduleStr.match(/\((.*?)\)/);
      const timeSlot =
        cls.scheduleData?.startTime && cls.scheduleData?.endTime
          ? `${cls.scheduleData.startTime} - ${cls.scheduleData.endTime}`
          : timeMatch
          ? timeMatch[1]
          : '18:00 - 19:30';
      const daysPart = scheduleStr.replace(/\(.*?\)/, '').trim();

      const timeParts = String(timeSlot).match(/(\d{1,2}:\d{2})\s*[-–~]\s*(\d{1,2}:\d{2})/);
      const startTime = cls.scheduleData?.startTime || (timeParts ? timeParts[1] : '18:00');
      const endTime = cls.scheduleData?.endTime || (timeParts ? timeParts[2] : '19:30');

      let daysToUse = [];
      if (Array.isArray(cls.scheduleData?.days) && cls.scheduleData.days.length > 0) {
        daysToUse = cls.scheduleData.days
          .map((d) => (typeof d === 'number' ? dayNumToVi[d] : d))
          .filter(Boolean);
      }
      if (daysToUse.length === 0) {
        const allDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
        const matchedDays = allDays.filter((d) => daysPart.includes(d));
        daysToUse = matchedDays.length > 0 ? matchedDays : ['Thứ 2', 'Thứ 4'];
      }

      daysToUse.forEach((day, dIdx) => {
        slots.push({
          id: `T-${cls.id || index + 1}-${dIdx + 1}`,
          day,
          dayNum: day === 'Chủ Nhật' ? 0 : Number(day.replace(/\D/g, '')) - 1,
          timeSlot,
          startTime,
          endTime,
          classId: cls.id,
          className: cls.name,
          courseId: cls.courseId || 'ALL',
          courseName: cls.courseName || '',
          courseLevel: cls.courseLevel || cls.level || '',
          subject: cls.subject || 'Wonders English ELA',
          teacherId: cls.teacherId,
          teacherName: cls.teacherName || 'Chưa phân công',
          studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : [],
          platform: cls.platform || 'Zoom Meeting',
          meetingLink: cls.zoomStudentLink || cls.meetingLink || 'https://zoom.us/j/888999111',
          status: SESSION_STATUS.UPCOMING,
        });
      });
    });

    return slots;
  }

  /**
   * Tính toán danh sách 7 ngày trong tuần với ngày dương lịch thực tế (hỗ trợ điều hướng tuần)
   */
  static getWeekDays(offset = 0) {
    const now = new Date();
    const vnStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnDate = new Date(vnStr);

    const currentDay = vnDate.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(vnDate);
    monday.setDate(vnDate.getDate() + diffToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const viDayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const enDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayNum = d.getDay();
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const yearStr = d.getFullYear();
      const dateFormatted = `${dayStr}/${monthStr}/${yearStr}`;
      const shortDate = `${dayStr}/${monthStr}`;
      const isoDate = `${yearStr}-${monthStr}-${dayStr}`;

      const isToday = d.toDateString() === vnDate.toDateString();

      days.push({
        dateObj: d,
        dateFormatted,
        shortDate,
        isoDate,
        dayNum,
        isToday,
        dayKey: dayNum === 0 ? 'Chủ Nhật' : `Thứ ${dayNum + 1}`,
        viDayName: viDayNames[dayNum],
        enDayName: enDayNames[dayNum],
      });
    }
    return days;
  }

  /**
   * Tính toán trạng thái thời gian và kiểm soát khóa vào Meet / Điểm danh
   * leadMinutes: Số phút mở trước giờ học (mặc định 15p cho giáo viên, 10p cho học viên)
   */
  static getSessionTimingState(dateObj, startTimeStr, endTimeStr, now = new Date(), leadMinutes = 15) {
    if (!dateObj) {
      return { state: 'UPCOMING', canAccess: false, unlockTimeStr: '--:--', leadMinutes };
    }
    const [startH, startM] = (startTimeStr || '18:00').split(':').map(Number);
    const [endH, endM] = (endTimeStr || '19:30').split(':').map(Number);

    const start = new Date(dateObj);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(dateObj);
    end.setHours(endH, endM, 0, 0);

    // Mở trước leadMinutes phút (học viên 10 phút, giáo viên/cán bộ 15 phút)
    const unlock = new Date(start.getTime() - leadMinutes * 60 * 1000);

    const nowMs = now.getTime();
    const startMs = start.getTime();
    const endMs = end.getTime();
    const unlockMs = unlock.getTime();

    const unlockTimeStr = `${String(unlock.getHours()).padStart(2, '0')}:${String(unlock.getMinutes()).padStart(2, '0')}`;

    if (nowMs < unlockMs) {
      const diffMs = unlockMs - nowMs;
      const diffMins = Math.ceil(diffMs / 60000);
      return {
        state: 'LOCKED',
        canAccess: false,
        unlockTimeStr,
        unlockMs,
        diffMins,
        startMs,
        endMs,
        leadMinutes,
      };
    } else if (nowMs >= unlockMs && nowMs < startMs) {
      const startsInMins = Math.ceil((startMs - nowMs) / 60000);
      return {
        state: 'STARTING_SOON',
        canAccess: true,
        startsInMins,
        unlockTimeStr,
        startMs,
        endMs,
        leadMinutes,
      };
    } else if (nowMs >= startMs && nowMs <= endMs) {
      const remainingMins = Math.ceil((endMs - nowMs) / 60000);
      return {
        state: 'LIVE',
        canAccess: true,
        remainingMins,
        startMs,
        endMs,
        leadMinutes,
      };
    } else {
      return {
        state: 'FINISHED',
        canAccess: false,
        startMs,
        endMs,
        leadMinutes,
      };
    }
  }

  static createScheduleSlot(timetable, values, teachers = []) {
    const matchedTeacher = teachers.find((t) => t.name === values.teacherName);
    const newSlot = {
      id: this.generateId('T', timetable),
      day: values.day,
      timeSlot: values.timeSlot,
      classId: values.classId || 'LH10A1',
      className: values.className,
      subject: values.subject,
      teacherId: matchedTeacher ? matchedTeacher.id : 'GV001',
      teacherName: values.teacherName,
      platform: values.platform || 'Zoom Meeting',
      meetingLink: values.meetingLink || 'https://zoom.us/j/888999111',
      status: SESSION_STATUS.UPCOMING,
    };
    return [...timetable, newSlot];
  }
}

