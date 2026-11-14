import { collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../../core/services/firebase';
import { PermissionService } from '../../core/services/PermissionService';
import { BaseModuleService } from './BaseModuleService';
import {
  buildAttendance,
  buildAttention,
  buildTeacherCheckIn,
  buildQuickNote,
  buildLessonPlan,
  buildStudentEvaluation,
  classroomSessionId,
} from '../models/classroom.model';
import { findClassSession } from '../utils/classSessionUtils';

/** Shared read/write boundary for classroom details and Dashboard monitoring. */
export class ClassroomRealtimeService extends BaseModuleService {
  static subscribeClass(id, next, error) {
    return onSnapshot(doc(db, 'classes', id), (snap) => next(snap.exists() ? { ...snap.data(), id: snap.id } : null), error);
  }

  static subscribeClasses(user, next, error) {
    if (!user || !PermissionService.canAccessModule(user.role, 'classroom')) return () => {};
    const ref = collection(db, 'classes');
    const source = user.role === 'teacher' ? query(ref, where('teacherId', '==', user.id)) : ref;
    return onSnapshot(source, (snap) => next(snap.docs.map((d) => ({ ...d.data(), id: d.id }))
      .filter((c) => !c.isDeleted && c.status !== 'Deleted')), error);
  }

  static subscribeSession(id, next, error) {
    return onSnapshot(doc(db, 'session_evaluations', id), (snap) => next(snap.exists() ? snap.data() : null), error);
  }

  /**
   * Đọc danh sách lịch sử đánh giá thực tế của lớp học từ Firestore `session_evaluations`
   */
  static async getEvaluationHistory(classId) {
    if (!classId) return [];
    try {
      const ref = collection(db, 'session_evaluations');
      const q = query(ref, where('classId', '==', classId));
      const snap = await getDocs(q);
      if (snap.empty) return [];
      return snap.docs
        .map((d) => ({ ...d.data(), id: d.id }))
        .sort((a, b) => {
          const timeA = a.sessionStart || new Date(a.date || a.createdAt || 0).getTime();
          const timeB = b.sessionStart || new Date(b.date || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
    } catch (err) {
      console.warn('[ClassroomRealtimeService] Error loading evaluation history:', err.message);
      return [];
    }
  }

  static subscribeAttendance(user, next, error) {
    const ref = collection(db, 'classroom_live');
    const source = user.role === 'teacher' ? query(ref, where('teacherId', '==', user.id)) : ref;
    return onSnapshot(source, (snap) => next(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))), error);
  }

  static async loadRoster(cls) {
    return Promise.all([...new Set(cls.studentIds || [])].map(async (id) => {
      const snapshot = await getDoc(doc(db, 'users', id));
      if (!snapshot.exists()) return { id, name: id, avatar: '', missingProfile: true, phone: '', parentPhone: '' };
      const data = snapshot.data();
      return {
        id,
        name: data.name || data.englishName || id,
        avatar: data.avatar || '',
        englishName: data.englishName || '',
        phone: data.phone || data.parentPhone || '',
        parentPhone: data.parentPhone || data.phone || '',
        parentName: data.parentName || '',
      };
    }));
  }

  static async mark(classId, expectedSessionId, changes, user) {
    if (!user?.id || !PermissionService.canTakeClassroomAttendance(user.role)) throw new Error('ATTENDANCE_FORBIDDEN');
    return runTransaction(db, async (transaction) => {
      const classRef = doc(db, 'classes', classId);
      const profileRef = doc(db, 'users', user.id);
      const [snapshot, profileSnapshot] = await Promise.all([transaction.get(classRef), transaction.get(profileRef)]);
      if (!snapshot.exists() || !profileSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
      const cls = { ...snapshot.data(), id: snapshot.id };
      const profile = profileSnapshot.data();
      if (profile.role !== 'teacher' || profile.status !== 'active'
        || cls.teacherId !== user.id || cls.isDeleted) throw new Error('ATTENDANCE_FORBIDDEN');
      if (auth.currentUser && profile.uid && profile.uid !== auth.currentUser.uid) {
        throw new Error('ATTENDANCE_FORBIDDEN');
      }
      const now = Date.now();
      const session = findClassSession(cls, now);
      if (classroomSessionId(classId, session) !== expectedSessionId) throw new Error('SESSION_CLOSED');
      const sessionRef = doc(db, 'session_evaluations', expectedSessionId);
      const previous = await transaction.get(sessionRef);
      const old = previous.exists() ? previous.data() : {};
      const studentSnapshots = await Promise.all((cls.studentIds || []).map((id) => transaction.get(doc(db, 'users', id))));
      const attendance = buildAttendance(cls, old, changes, user, now);
      const roster = (cls.studentIds || []).map((id, index) => ({ ...(old.roster || []).find((s) => s.id === id), id,
        name: studentSnapshots[index].data()?.name || (old.roster || []).find((s) => s.id === id)?.name || id,
        present: attendance.presence[id] === 'UNMARKED' ? null : attendance.presence[id] === 'ONLINE' }));
      transaction.set(sessionRef, {
        ...old,
        ...attendance,
        id: expectedSessionId,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || '',
        className: cls.name || classId,
        roster,
        checkInStatus: attendance.teacherCheckIn?.status || 'CHECKED_IN',
        checkInAt: attendance.teacherCheckIn?.checkedInAt || new Date(now).toISOString(),
        createdAt: old.createdAt || attendance.updatedAt,
      });
      transaction.set(doc(db, 'classroom_live', classId), {
        ...(old || {}),
        ...attendance,
        teacherId: cls.teacherId,
        checkInStatus: attendance.teacherCheckIn?.status || 'CHECKED_IN',
        checkInAt: attendance.teacherCheckIn?.checkedInAt || new Date(now).toISOString(),
      });
      return attendance;
    });
  }

  static async markAttention(classId, expectedSessionId, studentId, attentionStatus, user) {
    if (!user?.id || !PermissionService.canTakeClassroomAttendance(user.role)) throw new Error('ATTENDANCE_FORBIDDEN');
    return runTransaction(db, async (transaction) => {
      const classRef = doc(db, 'classes', classId);
      const profileRef = doc(db, 'users', user.id);
      const [snapshot, profileSnapshot] = await Promise.all([transaction.get(classRef), transaction.get(profileRef)]);
      if (!snapshot.exists() || !profileSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
      const cls = { ...snapshot.data(), id: snapshot.id };
      const profile = profileSnapshot.data();
      if (profile.role !== 'teacher' || profile.status !== 'active'
        || cls.teacherId !== user.id || cls.isDeleted) throw new Error('ATTENDANCE_FORBIDDEN');
      if (auth.currentUser && profile.uid && profile.uid !== auth.currentUser.uid) {
        throw new Error('ATTENDANCE_FORBIDDEN');
      }
      const now = Date.now();
      const session = findClassSession(cls, now);
      if (classroomSessionId(classId, session) !== expectedSessionId) throw new Error('SESSION_CLOSED');
      const sessionRef = doc(db, 'session_evaluations', expectedSessionId);
      const previous = await transaction.get(sessionRef);
      const old = previous.exists() ? previous.data() : {};
      const updated = buildAttention(cls, old, { [studentId]: attentionStatus }, user, now);
      transaction.set(sessionRef, {
        ...old,
        ...updated,
        id: expectedSessionId,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || '',
        className: cls.name || classId,
        checkInStatus: updated.teacherCheckIn?.status || 'CHECKED_IN',
        checkInAt: updated.teacherCheckIn?.checkedInAt || new Date(now).toISOString(),
        createdAt: old.createdAt || updated.updatedAt,
      });
      transaction.set(doc(db, 'classroom_live', classId), {
        ...(old || {}),
        ...updated,
        teacherId: cls.teacherId,
        checkInStatus: updated.teacherCheckIn?.status || 'CHECKED_IN',
        checkInAt: updated.teacherCheckIn?.checkedInAt || new Date(now).toISOString(),
      });
      return updated;
    });
  }

  static async markTeacherCheckIn(classId, expectedSessionId, user, method = 'AUTO_HOST_OPEN') {
    if (!user?.id || !PermissionService.canAccessModule(user.role, 'classroom')) throw new Error('FORBIDDEN');
    return runTransaction(db, async (transaction) => {
      const classRef = doc(db, 'classes', classId);
      const actorRef = doc(db, 'users', user.id);
      const [snapshot, actorSnapshot] = await Promise.all([transaction.get(classRef), transaction.get(actorRef)]);
      if (!snapshot.exists() || !actorSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
      const cls = { ...snapshot.data(), id: snapshot.id };
      const actor = actorSnapshot.data();
      const isTeacher = user.role === 'teacher' && cls.teacherId === user.id;
      const isAcademicOrAdmin = ['admin', 'director', 'academic'].includes(user.role);
      if (!isTeacher && !isAcademicOrAdmin) throw new Error('FORBIDDEN');

      const now = Date.now();
      const session = findClassSession(cls, now);
      if (classroomSessionId(classId, session) !== expectedSessionId) throw new Error('SESSION_CLOSED');
      const sessionRef = doc(db, 'session_evaluations', expectedSessionId);
      const previous = await transaction.get(sessionRef);
      const old = previous.exists() ? previous.data() : {};

      const checkInRecord = buildTeacherCheckIn(cls, old, user, method, now);
      transaction.set(sessionRef, {
        ...old,
        ...checkInRecord,
        id: expectedSessionId,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || '',
        className: cls.name || classId,
        checkInStatus: 'CHECKED_IN',
        checkInAt: checkInRecord.teacherCheckIn.checkedInAt,
        createdAt: old.createdAt || checkInRecord.updatedAt,
      });
      transaction.set(doc(db, 'classroom_live', classId), {
        ...(old || {}),
        ...checkInRecord,
        teacherId: cls.teacherId,
        checkInStatus: 'CHECKED_IN',
        checkInAt: checkInRecord.teacherCheckIn.checkedInAt,
      });
      return checkInRecord;
    });
  }

  /**
   * Lưu ghi chú nhanh (1-chạm / short text) cho một học viên trong giờ học
   */
  static async saveQuickNote(classId, expectedSessionId, studentId, noteData, user) {
    if (!user?.id || !PermissionService.canAccessModule(user.role, 'classroom')) throw new Error('FORBIDDEN');
    return runTransaction(db, async (transaction) => {
      const classRef = doc(db, 'classes', classId);
      const actorRef = doc(db, 'users', user.id);
      const [snapshot, actorSnapshot] = await Promise.all([transaction.get(classRef), transaction.get(actorRef)]);
      if (!snapshot.exists() || !actorSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
      const cls = { ...snapshot.data(), id: snapshot.id };
      const isTeacher = user.role === 'teacher' && cls.teacherId === user.id;
      const isAcademicOrAdmin = ['admin', 'director', 'academic'].includes(user.role);
      if (!isTeacher && !isAcademicOrAdmin) throw new Error('FORBIDDEN');

      const now = Date.now();
      const session = findClassSession(cls, now);
      if (classroomSessionId(classId, session) !== expectedSessionId) throw new Error('SESSION_CLOSED');
      const sessionRef = doc(db, 'session_evaluations', expectedSessionId);
      const previous = await transaction.get(sessionRef);
      const old = previous.exists() ? previous.data() : {};

      const updatedRecord = buildQuickNote(cls, old, studentId, noteData, user, now);
      transaction.set(sessionRef, {
        ...old,
        ...updatedRecord,
        id: expectedSessionId,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || '',
        className: cls.name || classId,
        updatedAt: updatedRecord.updatedAt,
      }, { merge: true });

      transaction.set(doc(db, 'classroom_live', classId), {
        ...(old || {}),
        ...updatedRecord,
        teacherId: cls.teacherId,
      }, { merge: true });

      return updatedRecord;
    });
  }

  /**
   * Lưu đánh giá chi tiết (số sao, nhận xét) cho học viên sau buổi học
   */
  static async saveStudentEvaluation(classId, expectedSessionId, studentId, evalData, user) {
    if (!user?.id || !PermissionService.canEvaluateStudents(user.role)) throw new Error('EVALUATION_FORBIDDEN');
    return runTransaction(db, async (transaction) => {
      const classRef = doc(db, 'classes', classId);
      const [snapshot] = await Promise.all([transaction.get(classRef)]);
      if (!snapshot.exists()) throw new Error('CLASS_NOT_FOUND');
      const cls = { ...snapshot.data(), id: snapshot.id };
      const isTeacher = user.role === 'teacher' && cls.teacherId === user.id;
      const isAcademicOrAdmin = ['admin', 'director', 'academic'].includes(user.role);
      if (!isTeacher && !isAcademicOrAdmin) throw new Error('EVALUATION_FORBIDDEN');

      const now = Date.now();
      const session = findClassSession(cls, now);
      const sessionRef = doc(db, 'session_evaluations', expectedSessionId);
      const previous = await transaction.get(sessionRef);
      const old = previous.exists() ? previous.data() : {};

      const updatedRecord = buildStudentEvaluation(cls, old, studentId, evalData, user, now);
      transaction.set(sessionRef, {
        ...old,
        ...updatedRecord,
        id: expectedSessionId,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || '',
        className: cls.name || classId,
        updatedAt: updatedRecord.updatedAt,
      }, { merge: true });

      transaction.set(doc(db, 'classroom_live', classId), {
        ...(old || {}),
        ...updatedRecord,
        teacherId: cls.teacherId,
      }, { merge: true });

      return updatedRecord;
    });
  }

  /**
   * Lưu toàn bộ đánh giá của buổi học (batch) trong một transaction
   */
  static async saveAllEvaluations(classId, expectedSessionId, evaluationsMap, user) {
    if (!user?.id || !PermissionService.canEvaluateStudents(user.role)) throw new Error('EVALUATION_FORBIDDEN');
    return runTransaction(db, async (transaction) => {
      const classRef = doc(db, 'classes', classId);
      const [snapshot] = await Promise.all([transaction.get(classRef)]);
      if (!snapshot.exists()) throw new Error('CLASS_NOT_FOUND');
      const cls = { ...snapshot.data(), id: snapshot.id };
      const isTeacher = user.role === 'teacher' && cls.teacherId === user.id;
      const isAcademicOrAdmin = ['admin', 'director', 'academic'].includes(user.role);
      if (!isTeacher && !isAcademicOrAdmin) throw new Error('EVALUATION_FORBIDDEN');

      const now = Date.now();
      const sessionRef = doc(db, 'session_evaluations', expectedSessionId);
      const previous = await transaction.get(sessionRef);
      const old = previous.exists() ? previous.data() : {};

      let currentRecord = { ...old };
      for (const [studentId, evalData] of Object.entries(evaluationsMap || {})) {
        currentRecord = buildStudentEvaluation(cls, currentRecord, studentId, evalData, user, now);
      }

      transaction.set(sessionRef, {
        ...old,
        ...currentRecord,
        id: expectedSessionId,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || '',
        className: cls.name || classId,
        updatedAt: currentRecord.updatedAt,
      }, { merge: true });

      transaction.set(doc(db, 'classroom_live', classId), {
        ...(old || {}),
        ...currentRecord,
        teacherId: cls.teacherId,
      }, { merge: true });

      return currentRecord;
    });
  }

  /**
   * Lưu giáo án buổi học (hỗ trợ soạn trước đa buổi cho giáo viên)
   * Lưu trực tiếp vào doc classes/{classId} (map lessonPlans) và sub-collection lesson_plans
   */
  static async saveLessonPlan(classId, sessionIndex, planData, user) {
    if (!user?.id || !PermissionService.canAccessModule(user.role, 'classroom')) throw new Error('FORBIDDEN');
    const classRef = doc(db, 'classes', classId);
    const snapshot = await getDoc(classRef);
    if (!snapshot.exists()) throw new Error('CLASS_NOT_FOUND');
    const cls = { ...snapshot.data(), id: snapshot.id };

    const isTeacher = user.role === 'teacher' && cls.teacherId === user.id;
    const isAcademicOrAdmin = ['admin', 'director', 'academic'].includes(user.role);
    if (!isTeacher && !isAcademicOrAdmin) throw new Error('FORBIDDEN');

    const now = Date.now();
    const plan = buildLessonPlan(cls, { ...planData, sessionIndex }, user, now);

    // 1. Lưu vào doc classes/{classId} map lessonPlans để realtime không tốn read
    await setDoc(classRef, {
      lessonPlans: {
        [sessionIndex]: plan,
      },
      updatedAt: new Date(now).toISOString(),
    }, { merge: true });

    // 2. Lưu vào sub-collection classes/{classId}/lesson_plans/SESSION_{sessionIndex}
    const subColRef = doc(db, 'classes', classId, 'lesson_plans', `SESSION_${sessionIndex}`);
    await setDoc(subColRef, plan, { merge: true });

    return plan;
  }
}
