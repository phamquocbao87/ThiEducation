import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { SESSION_STATUS } from '../models/schedules.model';

/**
 * Sub-Feature Class 2 (Schedules Module): Timetable Slot Filtering, Scoping & Creation
 */
export class TimetableSlotService extends BaseModuleService {
  static getScopedTimetable(timetable, currentUser, selectedDayFilter = 'ALL') {
    const roleScoped = this.scopeByRole(timetable, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
      classIdField: 'classId',
    });
    return this.filterByField(roleScoped, selectedDayFilter, 'day');
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

