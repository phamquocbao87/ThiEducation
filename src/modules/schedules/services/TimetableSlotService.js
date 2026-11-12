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
          timeSlot,
          classId: cls.id,
          className: cls.name,
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

