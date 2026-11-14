import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';

export class ExerciseAssignmentService extends BaseModuleService {
  static COLLECTION_NAME = 'exercise_assignments';

  static async getAll() {
    if (!IS_FIREBASE_ENABLED || !db) return [];
    const snap = await getDocs(collection(db, this.COLLECTION_NAME));
    return snap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => !item.isDeleted);
  }

  static async assign(exercise, classItem, students, actor, extra = {}) {
    const id = `asg_${Date.now()}`;
    const targetStudents = (students || []).map((s) => ({
      id: s.id || s.code,
      code: s.code || s.id,
      name: s.name || s.englishName || s.id,
      englishName: s.englishName || '',
      avatar: s.avatar || '',
    }));

    const payload = {
      id,
      exerciseId: exercise.id,
      title: exercise.title || 'English Exercise',
      scopeType: extra.scopeType || (classItem ? 'class' : 'students'),
      classId: classItem?.id || '',
      className: classItem?.name || '',
      targetStudentIds: targetStudents.map((s) => s.id),
      targetStudentNames: targetStudents.map((s) => s.name),
      targetStudents,
      assignedBy: actor?.name || actor?.englishName || actor?.id || 'Teacher',
      assignedById: actor?.id || '',
      assignedByRole: actor?.role || '',
      dueAt: extra.dueAt || exercise.dueAt || '',
      attemptsAllowed: Number(extra.attemptsAllowed || exercise.attemptsAllowed || 1),
      notes: extra.notes || '',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    if (IS_FIREBASE_ENABLED && db) {
      await setDoc(doc(db, this.COLLECTION_NAME, id), payload);
    }
    return payload;
  }

  static async softDelete(id) {
    if (IS_FIREBASE_ENABLED && db && id) {
      await setDoc(
        doc(db, this.COLLECTION_NAME, id),
        { isDeleted: true, deletedAt: new Date().toISOString() },
        { merge: true }
      );
    }
  }

  static scope(records, user) {
    if (!records || !Array.isArray(records)) return [];
    if (user?.role === 'student') {
      const studentId = user.id;
      const studentCode = user.code;
      const classId = user.classId;
      return records.filter((item) => {
        if (item.targetStudentIds?.includes(studentId) || item.targetStudentIds?.includes(studentCode)) {
          return true;
        }
        if (classId && item.classId === classId) {
          return true;
        }
        return false;
      });
    }
    if (user?.role === 'teacher') {
      return records.filter(
        (item) =>
          item.assignedById === user.id ||
          item.assignedBy === user.id ||
          item.assignedBy === user.name
      );
    }
    return records;
  }
}
