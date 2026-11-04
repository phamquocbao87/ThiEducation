import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { HOMEWORK_STATUS } from '../models/attendance.model';

/**
 * Sub-Feature Class 4 (Attendance Module): Student Homework Assignment & Submission
 * Used by Students to view/submit assignments and by Teachers/Academic to review & assign.
 */
export class HomeworkAssignmentService extends BaseModuleService {
  static getScopedHomeworks(homeworks, currentUser) {
    return this.scopeByRole(homeworks, currentUser, {
      teacherIdField: 'teacherId',
      studentIdField: 'studentId',
      classIdField: 'classId',
    });
  }

  static submitHomework(homeworks, homeworkId) {
    return homeworks.map((hw) =>
      hw.id === homeworkId
        ? {
            ...hw,
            status: HOMEWORK_STATUS.SUBMITTED,
            score: hw.score || 'Đang chấm',
          }
        : hw
    );
  }
}

