import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 2 (Attendance Module): Student & Teacher Profile Management
 * Allows Teachers and Academic Staff to view individual student profiles and update per-student feedback.
 */
export class StudentProfileService extends BaseModuleService {
  static getStudentsByClass(students, classId, currentUser) {
    const classFiltered = classId
      ? students.filter((s) => s.classId === classId)
      : students;
    return this.scopeByRole(classFiltered, currentUser, {
      teacherIdField: 'teacherId',
      studentIdField: 'id',
      classIdField: 'classId',
    });
  }

  static updateStudentIndividualNote(students, studentId, note, scores = {}) {
    return students.map((st) =>
      st.id === studentId
        ? {
            ...st,
            latestTeacherNote: note || st.latestTeacherNote,
            pronunciationScore: scores.pronunciation ?? st.pronunciationScore,
            spellingScore: scores.spelling ?? st.spellingScore,
            seriousnessScore: scores.seriousness ?? st.seriousnessScore,
            listeningScore: scores.listening ?? st.listeningScore,
          }
        : st
    );
  }
}

