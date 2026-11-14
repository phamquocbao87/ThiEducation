import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { AUTO_GRADED_TYPES, QUESTION_TYPES } from '../models/exercise.model';

const normalized = (value) => String(value || '').trim().toLocaleLowerCase();

export class ExerciseAttemptService extends BaseModuleService {
  static COLLECTION_NAME = 'exercise_attempts';
  static async getAll() {
    if (!IS_FIREBASE_ENABLED || !db) return [];
    const snap = await getDocs(collection(db, this.COLLECTION_NAME));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => !item.isDeleted);
  }
  static async softDelete(id) {
    if (IS_FIREBASE_ENABLED && db && id) {
      await setDoc(doc(db, this.COLLECTION_NAME, id), { isDeleted: true, deletedAt: new Date().toISOString() }, { merge: true });
    }
  }
  static grade(exercise, answers) {
    return exercise.questions.reduce((result, question) => {
      if (!AUTO_GRADED_TYPES.has(question.type)) return result;
      const answer = answers[question.id];
      const correct = [QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.AUDIO_IMAGE].includes(question.type)
        ? answer === question.correctOptionId
        : question.type === 'MATCHING'
          ? (question.pairs || []).every((pair) => answer?.[pair.left] === pair.right)
        : question.acceptedAnswers?.map(normalized).includes(normalized(answer));
      return { ...result, autoScore: result.autoScore + (correct ? Number(question.points || 0) : 0), autoTotal: result.autoTotal + Number(question.points || 0) };
    }, { autoScore: 0, autoTotal: 0 });
  }
  static async submit(assignment, exercise, answers, student) {
    const id = `att_${assignment.id}_${student.id}_${Date.now()}`;
    const grade = this.grade(exercise, answers);
    const needsReview = exercise.questions.some((q) => !AUTO_GRADED_TYPES.has(q.type));
    const completionRate = grade.autoTotal ? grade.autoScore / grade.autoTotal : 0;
    const rewards = { xp: Math.round(10 + (grade.autoScore * 10)), stars: completionRate >= 0.9 ? 3 : completionRate >= 0.6 ? 2 : 1, badge: completionRate === 1 && grade.autoTotal ? 'Perfect practice' : 'Practice completed' };
    const payload = { id, assignmentId: assignment.id, exerciseId: exercise.id, studentId: student.id, studentName: student.name || '', answers, ...grade, rewards, status: needsReview ? 'NEEDS_REVIEW' : 'GRADED', submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (IS_FIREBASE_ENABLED && db) await setDoc(doc(db, this.COLLECTION_NAME, id), payload, { merge: true });
    return payload;
  }
  static async gradeManual(attempt, manualScore, teacherComment, teacher) {
    const payload = { ...attempt, manualScore: Number(manualScore || 0), teacherComment: teacherComment || '', gradedBy: teacher?.id || '', gradedByName: teacher?.name || '', gradedAt: new Date().toISOString(), status: 'GRADED', updatedAt: new Date().toISOString() };
    if (IS_FIREBASE_ENABLED && db) await setDoc(doc(db, this.COLLECTION_NAME, payload.id), payload, { merge: true });
    return payload;
  }

  static scope(attempts = [], user, { classes = [], assignments = [], exercises = [] } = {}) {
    if (!user) return [];
    // Student: chỉ thấy bài nộp của chính mình
    if (user.role === 'student') {
      return attempts.filter((item) => item.studentId === user.id);
    }
    // Admin, Director, Academic: toàn quyền xem và quản lý bài nộp toàn trường
    if (['admin', 'director', 'academic'].includes(user.role)) {
      return attempts;
    }
    // Teacher: chỉ thấy bài nộp thuộc các lớp mình dạy hoặc do chính mình giao/tạo đề
    if (user.role === 'teacher') {
      const teacherClassIds = new Set(
        classes
          .filter((c) => c.teacherId === user.id || c.teacherName === user.name)
          .map((c) => c.id)
      );
      const teacherAssignmentIds = new Set(
        assignments
          .filter((a) => a.assignedBy === user.id || teacherClassIds.has(a.classId))
          .map((a) => a.id)
      );
      const teacherExerciseIds = new Set(
        exercises
          .filter((e) => e.createdBy === user.id || e.teacherId === user.id)
          .map((e) => e.id)
      );

      return attempts.filter(
        (att) =>
          teacherAssignmentIds.has(att.assignmentId) ||
          teacherExerciseIds.has(att.exerciseId)
      );
    }
    return [];
  }
}
