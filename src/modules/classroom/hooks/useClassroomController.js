import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { useClassroomClock } from '../../../shared/hooks/useClassroomClock';
import {
  POST_SESSION_FEEDBACK_WINDOW_MS,
  findClassSession,
  getSessionFeedbackWindowState,
} from '../../../shared/utils/classSessionUtils';
import { classroomSessionId } from '../models/classroom.model';
import { ClassroomService } from '../services/ClassroomService';
import { CourseService } from '../../courses/services/CourseService';
import { MaterialService } from '../../materials/services/MaterialService';

export const useClassroomController = () => {
  const { classId } = useParams();
  const { currentUser } = useAuth();
  const now = useClassroomClock();
  const [state, setState] = useState({ id: null, cls: null, loaded: false });
  const [rosterState, setRosterState] = useState({ key: '', students: [], ready: false });
  const [recordState, setRecordState] = useState({ key: null, record: null, ready: false });
  const [error, setError] = useState('');
  const [writeError, setWriteError] = useState('');
  const [pendingChanges, setPendingChanges] = useState({});
  const [pendingAttentionChanges, setPendingAttentionChanges] = useState({});
  const [isMarkAllPending, setIsMarkAllPending] = useState(false);
  const pendingIdsRef = useRef(new Set());
  const pendingAttentionIdsRef = useRef(new Set());
  const generation = useRef(0);
  const userId = currentUser?.id;
  const role = currentUser?.role;

  const [selectedSessionOverride, setSelectedSessionOverride] = useState(null);

  useEffect(() => {
    generation.current += 1;
    setState({ id: classId, cls: null, loaded: false });
    setSelectedSessionOverride(null);
    setError('');
    setWriteError('');
    setPendingChanges({});
    setPendingAttentionChanges({});
    setIsMarkAllPending(false);
    pendingIdsRef.current.clear();
    pendingAttentionIdsRef.current.clear();
    return ClassroomService.subscribeClass(
      classId,
      (cls) => setState({ id: classId, cls, loaded: true }),
      (failure) => {
        if (failure.code === 'permission-denied') setState({ id: classId, cls: null, loaded: true, denied: true });
        else { setError('loadError'); setState({ id: classId, cls: null, loaded: true }); }
      },
    );
  }, [classId, userId, role]);

  const cls = state.id === classId ? state.cls : null;
  const allowed = ClassroomService.canView(currentUser, cls);
  const defaultSession = cls && allowed ? findClassSession(cls, now, { allowRecentEnded: true }) : null;
  const session = selectedSessionOverride || defaultSession;
  const sessionId = session?.id || classroomSessionId(classId, session);
  const rosterIds = allowed ? JSON.stringify(cls.studentIds || []) : '';
  const rosterKey = allowed ? `${classId}:${rosterIds}` : '';

  useEffect(() => {
    let active = true;
    setRosterState({ key: rosterKey, students: [], ready: false });
    if (rosterKey) {
      ClassroomService.loadRoster({ studentIds: JSON.parse(rosterIds) })
        .then((students) => {
          if (active) setRosterState({ key: rosterKey, students, ready: true });
        })
        .catch(() => {
          if (active) setError('loadError');
        });
    }
    return () => { active = false; };
  }, [rosterKey, rosterIds]);

  useEffect(() => {
    setRecordState({ key: sessionId, record: null, ready: false });
    if (!sessionId || !allowed) return undefined;
    return ClassroomService.subscribeSession(
      sessionId,
      (record) => setRecordState({ key: sessionId, record, ready: true }),
      () => setError('loadError'),
    );
  }, [sessionId, allowed]);

  const students = rosterState.key === rosterKey ? rosterState.students : [];
  const record = recordState.key === sessionId ? recordState.record : null;
  const canEdit = allowed && ClassroomService.canEdit(currentUser, cls) && session
    && now >= session.start && now < session.end && !error && rosterState.ready
    && rosterState.key === rosterKey && recordState.ready && recordState.key === sessionId;

  const isSessionUpcoming = Boolean(session && !selectedSessionOverride && !session.isEnded && now < session.start);
  const isSessionLive = Boolean(session && now >= session.start && now < session.end);
  const isSessionEnded = Boolean(session && (session.isEnded || now >= session.end));

  const sessionWindowState = useMemo(
    () => getSessionFeedbackWindowState(
      session?.end,
      now,
      POST_SESSION_FEEDBACK_WINDOW_MS,
      record?.unlockState || null
    ),
    [session?.end, now, record?.unlockState]
  );

  const canEvaluate = Boolean(
    allowed
    && (role === 'teacher' ? cls?.teacherId === userId : ['admin', 'director', 'academic'].includes(role))
    && session
    && (now >= session.start || session.isEnded || Boolean(selectedSessionOverride))
    && !sessionWindowState.isLockedAfter18h
  );

  const presence = useMemo(() => {
    return { ...(record?.presence || {}), ...pendingChanges };
  }, [record?.presence, pendingChanges]);

  const attentionFlags = useMemo(() => {
    return { ...(record?.attentionFlags || {}), ...pendingAttentionChanges };
  }, [record?.attentionFlags, pendingAttentionChanges]);

  const attentionCount = useMemo(() => {
    return Object.values(attentionFlags).filter((s) => s === 'DISTRACTED').length;
  }, [attentionFlags]);

  const attentionIds = useMemo(() => {
    return Object.keys(attentionFlags).filter((id) => attentionFlags[id] === 'DISTRACTED');
  }, [attentionFlags]);

  const mark = useCallback(async (changes) => {
    if (!canEdit || !changes || !Object.keys(changes).length) return;
    const targetIds = Object.keys(changes);
    // Disallow duplicate requests for the same student while in-flight
    if (targetIds.some((id) => pendingIdsRef.current.has(id))) return;
    targetIds.forEach((id) => pendingIdsRef.current.add(id));

    const isBulk = targetIds.length > 1;
    if (isBulk) setIsMarkAllPending(true);
    setPendingChanges((prev) => ({ ...prev, ...changes }));
    setWriteError('');

    const revision = generation.current;
    try {
      const result = await ClassroomService.mark(classId, sessionId, changes, currentUser);
      if (revision === generation.current) {
        setRecordState({ key: sessionId, record: result, ready: true });
      }
    } catch {
      if (revision === generation.current) setWriteError('saveError');
    } finally {
      targetIds.forEach((id) => pendingIdsRef.current.delete(id));
      if (revision === generation.current) {
        setPendingChanges((prev) => {
          const next = { ...prev };
          targetIds.forEach((id) => delete next[id]);
          return next;
        });
        if (isBulk) setIsMarkAllPending(false);
      }
    }
  }, [canEdit, classId, sessionId, currentUser]);

  const markAttention = useCallback(async (studentId, attentionStatus) => {
    if (!canEdit || !studentId || !attentionStatus) return;
    if (pendingAttentionIdsRef.current.has(studentId)) return;
    pendingAttentionIdsRef.current.add(studentId);

    setPendingAttentionChanges((prev) => ({ ...prev, [studentId]: attentionStatus }));
    setWriteError('');

    const revision = generation.current;
    try {
      const result = await ClassroomService.markAttention(classId, sessionId, studentId, attentionStatus, currentUser);
      if (revision === generation.current) {
        setRecordState({ key: sessionId, record: result, ready: true });
      }
    } catch {
      if (revision === generation.current) setWriteError('saveError');
    } finally {
      pendingAttentionIdsRef.current.delete(studentId);
      if (revision === generation.current) {
        setPendingAttentionChanges((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }
    }
  }, [canEdit, classId, sessionId, currentUser]);

  const markAll = useCallback(() => {
    if (!students.length) return;
    mark(Object.fromEntries(students.map((s) => [s.id, 'ONLINE'])));
  }, [mark, students]);

  const [isCheckInPending, setIsCheckInPending] = useState(false);

  const markTeacherCheckIn = useCallback(
    async (method = 'AUTO_HOST_OPEN') => {
      if (!cls || !sessionId) return;
      setIsCheckInPending(true);
      setWriteError('');
      try {
        await ClassroomService.markTeacherCheckIn(classId, sessionId, currentUser, method);
      } catch (err) {
        console.warn('[useClassroomController] markTeacherCheckIn error:', err);
        setWriteError('saveError');
      } finally {
        setIsCheckInPending(false);
      }
    },
    [cls, sessionId, classId, currentUser]
  );

  const [courseMaterials, setCourseMaterials] = useState([]);
  const [parentCourse, setParentCourse] = useState(null);
  const [classRecordings, setClassRecordings] = useState([]);

  useEffect(() => {
    let active = true;
    if (cls?.courseId) {
      Promise.all([
        CourseService.getCourseMaterials(cls.courseId),
        CourseService.getCourseById(cls.courseId),
      ])
        .then(([materials, cDoc]) => {
          if (active) {
            setCourseMaterials(materials || []);
            setParentCourse(cDoc || null);
          }
        })
        .catch((err) => {
          console.warn('[useClassroomController] getCourseMaterials error:', err);
        });
    } else {
      setParentCourse(null);
    }
    return () => { active = false; };
  }, [cls?.courseId]);

  useEffect(() => {
    let active = true;
    if (cls?.id) {
      MaterialService.getAllMaterials()
        .then((allMats) => {
          if (!active) return;
          const recs = (allMats || []).filter((m) => m && !m.isDeleted && Boolean(m.isSessionRecording));
          setClassRecordings(recs);
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [cls?.id]);

  const resolvedCourseLevel = parentCourse?.level || cls?.courseLevel || cls?.level || '';

  const addClassRecording = useCallback((newRec) => {
    if (!newRec) return;
    setClassRecordings((prev) => [
      newRec,
      ...(prev || []).filter((r) => r && r.id !== newRec.id && !r.isDeleted),
    ]);
  }, []);

  const deleteClassRecording = useCallback(async (rec) => {
    if (!rec?.id) return;
    const prevList = classRecordings;
    setClassRecordings((prev) => (prev || []).filter((r) => r && r.id !== rec.id));
    try {
      await MaterialService.deleteMaterial(rec.id, rec.courseId || cls?.courseId, currentUser);
    } catch (err) {
      setClassRecordings(prevList);
      throw err;
    }
  }, [classRecordings, cls?.courseId, currentUser]);

  const saveQuickNote = useCallback(async (studentId, noteData) => {
    if (!cls || !sessionId || !studentId) return;
    setWriteError('');
    try {
      const result = await ClassroomService.saveQuickNote(classId, sessionId, studentId, noteData, currentUser);
      setRecordState((prev) => (prev.key === sessionId ? { ...prev, record: { ...prev.record, ...result } } : prev));
      return result;
    } catch (err) {
      console.warn('[useClassroomController] saveQuickNote error:', err);
      setWriteError('saveError');
      throw err;
    }
  }, [cls, sessionId, classId, currentUser]);

  const saveStudentEvaluation = useCallback(async (studentId, evalData) => {
    if (!cls || !sessionId || !studentId) return;
    if (session && !selectedSessionOverride && !session.isEnded && now < session.start) {
      console.warn('[useClassroomController] saveStudentEvaluation rejected: session not started');
      setWriteError('sessionNotStartedError');
      throw new Error('SESSION_NOT_STARTED');
    }
    if (sessionWindowState.isLockedAfter18h) {
      throw new Error('EVALUATION_WINDOW_LOCKED');
    }
    setWriteError('');
    try {
      const payload = {
        ...evalData,
        sessionStart: session?.start,
        sessionEnd: session?.end,
        date: session?.date,
      };
      const result = await ClassroomService.saveStudentEvaluation(classId, sessionId, studentId, payload, currentUser);
      setRecordState((prev) => (prev.key === sessionId ? { ...prev, record: { ...prev.record, ...result } } : prev));
      return result;
    } catch (err) {
      console.warn('[useClassroomController] saveStudentEvaluation error:', err);
      setWriteError(err.message === 'SESSION_NOT_STARTED' ? 'sessionNotStartedError' : 'saveError');
      throw err;
    }
  }, [cls, sessionId, classId, currentUser, session, now, selectedSessionOverride, sessionWindowState.isLockedAfter18h]);

  const saveAllEvaluations = useCallback(async (evaluationsMap) => {
    if (!cls || !sessionId || !evaluationsMap) return;
    if (session && !selectedSessionOverride && !session.isEnded && now < session.start) {
      console.warn('[useClassroomController] saveAllEvaluations rejected: session not started');
      setWriteError('sessionNotStartedError');
      throw new Error('SESSION_NOT_STARTED');
    }
    if (sessionWindowState.isLockedAfter18h) {
      throw new Error('EVALUATION_WINDOW_LOCKED');
    }
    setWriteError('');
    try {
      const payloadMap = {};
      Object.entries(evaluationsMap || {}).forEach(([sId, eData]) => {
        payloadMap[sId] = {
          ...eData,
          sessionStart: session?.start,
          sessionEnd: session?.end,
          date: session?.date,
        };
      });
      const result = await ClassroomService.saveAllEvaluations(classId, sessionId, payloadMap, currentUser);
      setRecordState((prev) => (prev.key === sessionId ? { ...prev, record: { ...prev.record, ...result } } : prev));
      return result;
    } catch (err) {
      console.warn('[useClassroomController] saveAllEvaluations error:', err);
      setWriteError(err.message === 'SESSION_NOT_STARTED' ? 'sessionNotStartedError' : 'saveError');
      throw err;
    }
  }, [cls, sessionId, classId, currentUser, session, now, selectedSessionOverride, sessionWindowState.isLockedAfter18h]);

  const requestEvaluationUnlock = useCallback(async (reason = '') => {
    if (!cls || !sessionId || !session) return null;
    const nowTs = Date.now();
    const optimisticUnlock = {
      ...(record?.unlockState || {}),
      status: 'REQUESTED',
      requestedAt: new Date(nowTs).toISOString(),
      requestedAtMs: nowTs,
      requestedBy: currentUser?.id,
      requestedByName: currentUser?.name || cls?.teacherName || 'Teacher',
      requestReason: String(reason || '').trim(),
    };
    setRecordState((prev) => (
      prev.key === sessionId
        ? { ...prev, record: { ...(prev.record || {}), id: sessionId, sessionId, unlockState: optimisticUnlock } }
        : prev
    ));
    const saved = await ClassroomService.requestSessionEvaluationUnlock(
      classId,
      sessionId,
      { reason, sessionStart: session.start, sessionEnd: session.end, date: session.date },
      currentUser
    );
    setRecordState((prev) => (prev.key === sessionId ? { ...prev, record: { ...(prev.record || {}), ...saved } } : prev));
    return saved;
  }, [cls, sessionId, session, record?.unlockState, currentUser, classId]);

  const unlockEvaluation = useCallback(async () => {
    if (!cls || !sessionId || !session) return null;
    const nowTs = Date.now();
    const optimisticUnlock = {
      ...(record?.unlockState || {}),
      status: 'UNLOCKED',
      unlockedAt: new Date(nowTs).toISOString(),
      unlockedAtMs: nowTs,
      unlockedUntilMs: nowTs + POST_SESSION_FEEDBACK_WINDOW_MS,
      unlockedBy: currentUser?.id,
      unlockedByName: currentUser?.name || currentUser?.role || 'Academic',
      unlockedByRole: currentUser?.role || 'academic',
      relockedAt: null,
      relockedBy: null,
    };
    setRecordState((prev) => (
      prev.key === sessionId
        ? { ...prev, record: { ...(prev.record || {}), id: sessionId, sessionId, unlockState: optimisticUnlock } }
        : prev
    ));
    const saved = await ClassroomService.unlockSessionEvaluation(
      classId,
      sessionId,
      { sessionStart: session.start, sessionEnd: session.end, date: session.date },
      currentUser
    );
    setRecordState((prev) => (prev.key === sessionId ? { ...prev, record: { ...(prev.record || {}), ...saved } } : prev));
    return saved;
  }, [cls, sessionId, session, record?.unlockState, currentUser, classId]);

  const relockEvaluation = useCallback(async () => {
    if (!cls || !sessionId || !session) return null;
    const nowTs = Date.now();
    const optimisticUnlock = {
      ...(record?.unlockState || {}),
      status: 'LOCKED',
      unlockedUntilMs: nowTs - 1,
      relockedAt: new Date(nowTs).toISOString(),
      relockedBy: currentUser?.id,
      relockedByName: currentUser?.name || currentUser?.role || 'Academic',
    };
    setRecordState((prev) => (
      prev.key === sessionId
        ? { ...prev, record: { ...(prev.record || {}), id: sessionId, sessionId, unlockState: optimisticUnlock } }
        : prev
    ));
    const saved = await ClassroomService.relockSessionEvaluation(
      classId,
      sessionId,
      { sessionStart: session.start, sessionEnd: session.end, date: session.date },
      currentUser
    );
    setRecordState((prev) => (prev.key === sessionId ? { ...prev, record: { ...(prev.record || {}), ...saved } } : prev));
    return saved;
  }, [cls, sessionId, session, record?.unlockState, currentUser, classId]);

  const saveLessonPlan = useCallback(async (sessionIndex, planData) => {
    if (!cls || !sessionIndex) return;
    setWriteError('');
    try {
      const savedPlan = await ClassroomService.saveLessonPlan(classId, sessionIndex, planData, currentUser);
      setState((prev) => (prev.id === classId && prev.cls ? {
        ...prev,
        cls: {
          ...prev.cls,
          lessonPlans: {
            ...(prev.cls.lessonPlans || {}),
            [sessionIndex]: savedPlan,
          },
        },
      } : prev));
      return savedPlan;
    } catch (err) {
      console.warn('[useClassroomController] saveLessonPlan error:', err);
      setWriteError('saveError');
      throw err;
    }
  }, [cls, classId, currentUser]);

  const courseId = cls?.courseId;
  const saveCourseMaterial = useCallback(async (newMaterial) => {
    if (!courseId || !newMaterial) return;
    const prevList = courseMaterials || [];
    const isStaffOnly =
      newMaterial.visibility === 'TEACHER_ONLY' ||
      newMaterial.visibility === 'TEACHERS_ONLY' ||
      newMaterial.shareScope === 'STAFF_ONLY' ||
      newMaterial.type === 'TEACHER_GUIDE' ||
      newMaterial.type === 'TEACHER';

    const normalizedNew = {
      ...newMaterial,
      id: newMaterial.id || `mat_${Date.now()}`,
      courseId,
      courseName: cls?.courseName || cls?.name || '',
      courseLevel: cls?.courseLevel || cls?.level || '',
      visibility: isStaffOnly ? 'TEACHERS_ONLY' : 'ALL',
      shareScope: isStaffOnly ? 'STAFF_ONLY' : 'CUSTOM',
      sharedCourseIds: [courseId],
      isSessionRecording: false,
      uploadedAt: newMaterial.uploadedAt || new Date().toISOString(),
    };

    // 0ms Optimistic State Update
    const optimisticList = [
      normalizedNew,
      ...prevList.filter((m) => m && m.id !== normalizedNew.id && !m.isDeleted && !m.isSessionRecording),
    ];
    setCourseMaterials(optimisticList);

    try {
      const saved = await MaterialService.saveMaterial(normalizedNew, currentUser);
      const syncedList = [
        saved,
        ...prevList.filter((m) => m && m.id !== saved.id && !m.isDeleted && !m.isSessionRecording),
      ];
      setCourseMaterials(syncedList);
      return syncedList;
    } catch (err) {
      setCourseMaterials(prevList);
      console.warn('[useClassroomController] saveCourseMaterial error:', err);
      throw err;
    }
  }, [courseId, courseMaterials, cls?.courseName, cls?.name, cls?.courseLevel, cls?.level, currentUser]);

  const deleteCourseMaterial = useCallback(async (materialId) => {
    if (!materialId) return;
    const prevList = courseMaterials || [];
    // 0ms Optimistic State Removal
    const updatedList = prevList.filter((m) => m && m.id !== materialId);
    setCourseMaterials(updatedList);

    try {
      await MaterialService.deleteMaterial(materialId, courseId, currentUser);
      return updatedList;
    } catch (err) {
      setCourseMaterials(prevList);
      console.warn('[useClassroomController] deleteCourseMaterial error:', err);
      throw err;
    }
  }, [courseId, courseMaterials, currentUser]);

  return {
    cls,
    students,
    record,
    presence,
    attentionFlags,
    attentionCount,
    attentionIds,
    quickNotes: record?.quickNotes || {},
    studentEvaluations: record?.studentEvaluations || {},
    lessonPlans: cls?.lessonPlans || {},
    courseMaterials,
    parentCourse,
    resolvedCourseLevel,
    classRecordings,
    addClassRecording,
    deleteClassRecording,
    teacherCheckIn: record?.teacherCheckIn || null,
    isCheckInPending,
    session,
    now,
    allowed,
    canEdit: Boolean(canEdit),
    isSessionUpcoming,
    isSessionLive,
    isSessionEnded,
    sessionWindowState,
    canEvaluate,
    selectedSessionOverride,
    setSelectedSession: setSelectedSessionOverride,
    loading: !state.loaded || state.id !== classId,
    pending: Object.keys(pendingChanges).length > 0 || isMarkAllPending,
    pendingChanges,
    pendingAttentionChanges,
    isMarkAllPending,
    error,
    writeError,
    denied: Boolean(state.denied),
    rosterLoading: allowed && !rosterState.ready,
    mark,
    markAll,
    markAttention,
    markTeacherCheckIn,
    saveQuickNote,
    saveStudentEvaluation,
    saveAllEvaluations,
    requestEvaluationUnlock,
    unlockEvaluation,
    relockEvaluation,
    saveLessonPlan,
    saveCourseMaterial,
    deleteCourseMaterial,
  };
};
