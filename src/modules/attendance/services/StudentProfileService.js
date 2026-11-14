import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 2 (Attendance Module): Student & Teacher Profile Management
 * Allows Teachers and Academic Staff to view individual student profiles and update per-student feedback.
 */
export class StudentProfileService extends BaseModuleService {
  /**
   * Lọc học viên theo lớp:
   * 1. Ưu tiên kiểm tra `studentIds` của lớp
   * 2. Hoặc `enrolledClassIds` của học viên
   * 3. Hoặc `s.classId === classId`
   */
  static getStudentsByClass(students = [], classId, currentUser, targetClass = null) {
    let filtered = students;
    if (classId) {
      const classStudentIds = new Set(
        Array.isArray(targetClass?.studentIds) ? targetClass.studentIds : []
      );

      filtered = students.filter((s) => {
        if (classStudentIds.has(s.id) || classStudentIds.has(s.code)) return true;
        if (Array.isArray(s.enrolledClassIds) && s.enrolledClassIds.includes(classId)) return true;
        if (s.classId === classId) return true;
        return false;
      });
    }

    return this.scopeByRole(filtered, currentUser, {
      teacherIdField: 'teacherId',
      studentIdField: 'id',
      classIdField: 'classId',
    });
  }

  static updateStudentIndividualNote(students, studentId, note, scores = {}) {
    return students.map((st) =>
      st.id === studentId || st.code === studentId
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
