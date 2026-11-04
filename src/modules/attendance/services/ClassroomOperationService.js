import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { CLASS_CHECKIN_STATUS } from '../models/attendance.model';

/**
 * Sub-Feature Class 1 (Attendance Module): Classroom Operations & Live Check-in
 * Scopes classes for teachers/students and manages live classroom check-in state.
 */
export class ClassroomOperationService extends BaseModuleService {
  static getScopedClasses(classes, currentUser) {
    return this.scopeByRole(classes, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
      classIdField: 'id',
    });
  }

  static checkInClassroom(classes, classId) {
    return classes.map((cls) =>
      cls.id === classId
        ? { ...cls, checkInStatus: CLASS_CHECKIN_STATUS.CHECKED_IN, operationStatus: 'GV đã vào phòng Zoom' }
        : cls
    );
  }
}

