import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 3 (Attendance Module): Session Attendance & 4-Skill English Evaluation
 */
export class SessionEvaluationService extends BaseModuleService {
  static getScopedAttendances(attendances, currentUser) {
    return this.scopeByRole(attendances, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
      classIdField: 'classId',
    });
  }

  static createSessionEvaluation(attendances, selectedClass, studentRoster, formValues, currentUser) {
    const presentCount = studentRoster.filter((s) => s.present).length;
    const absentCount = studentRoster.length - presentCount;

    const newRecord = {
      id: this.generateId('AT-0', attendances),
      date: new Date().toISOString().split('T')[0],
      classId: selectedClass.id,
      className: selectedClass.name,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      totalStudents: selectedClass.totalStudents,
      presentCount: presentCount + Math.max(0, selectedClass.totalStudents - studentRoster.length),
      absentCount,
      pronunciationScore: formValues.pronunciationScore || 5,
      spellingScore: formValues.spellingScore || 5,
      seriousnessScore: formValues.seriousnessScore || 5,
      listeningScore: formValues.listeningScore || 5,
      teacherFeedback:
        formValues.teacherFeedback ||
        'Students participated actively in Zoom session and completed pronunciation drills.',
      recordingUrl: formValues.recordingUrl || selectedClass.recordingUrl,
    };

    return [newRecord, ...attendances];
  }
}

