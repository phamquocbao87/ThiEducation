import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import {
  MOCK_TIMETABLE,
  MOCK_CLASSES,
  MOCK_STUDENTS,
  MOCK_HOMEWORKS,
  MOCK_PAYROLLS,
} from '../../../shared/data/mockData';

/**
 * Sub-Feature Class 3 (Dashboard): Scoped Teacher Workspace & Student Personal Portal
 * Dedicated to roles: `teacher` and `student`
 */
export class PersonalPortalService extends BaseModuleService {
  static getTeacherWorkspaceData(currentUser) {
    const myClasses = this.scopeByRole(MOCK_CLASSES, currentUser);
    const myTimetable = this.scopeByRole(MOCK_TIMETABLE, currentUser);
    const myPayrolls = this.scopeByRole(MOCK_PAYROLLS, currentUser);
    const myStudents = this.scopeByRole(MOCK_STUDENTS, currentUser);

    const currentPayroll = myPayrolls[0] || {
      totalSessions: 46,
      totalSalary: 22700000,
      ratePerSession: 450000,
    };

    return {
      myClasses,
      myTimetable,
      myStudents,
      currentPayroll,
    };
  }

  static getStudentPortalData(currentUser) {
    const studentProfile =
      MOCK_STUDENTS.find((s) => s.id === currentUser.id) || MOCK_STUDENTS[0];
    const myClasses = MOCK_CLASSES.filter((c) => c.id === studentProfile.classId);
    const myTimetable = MOCK_TIMETABLE.filter((t) => t.classId === studentProfile.classId);
    const myHomeworks = MOCK_HOMEWORKS.filter((h) => h.studentId === studentProfile.id);

    return {
      studentProfile,
      myClasses,
      myTimetable,
      myHomeworks,
    };
  }
}

