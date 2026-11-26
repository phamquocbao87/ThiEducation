import {
  POST_SESSION_FEEDBACK_WINDOW_MS,
  findClassSession,
  getSessionFeedbackWindowState,
  resolveSessionEndMs,
} from '../utils/classSessionUtils.js';

export const PRESENCE = Object.freeze({ ONLINE: 'ONLINE', OFFLINE: 'OFFLINE', UNMARKED: 'UNMARKED' });
export const ATTENTION_STATUS = Object.freeze({ FOCUSED: 'FOCUSED', DISTRACTED: 'DISTRACTED' });

export const classroomSessionId = (classId, session) => (session ? `LIVE_${classId}_${session.start}` : null);

export const classroomDate = (time) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(time);

export const currentAttendance = (cls, now) => {
  const session = findClassSession(cls, now);
  const saved = cls.liveAttendance;
  return session && saved?.sessionId === classroomSessionId(cls.id, session) ? saved : null;
};

export const buildAttendance = (cls, old = {}, changes, actor, now = Date.now(), attentionChanges = null) => {
  const session = findClassSession(cls, now);
  if (!session || now < session.start || now >= session.end) throw new Error('SESSION_CLOSED');
  const sessionId = classroomSessionId(cls.id, session);
  const ids = [...new Set(cls.studentIds || [])];
  if (!Object.keys(changes).length || Object.keys(changes).some((id) => !ids.includes(id))) throw new Error('INVALID_ROSTER');
  if (Object.values(changes).some((status) => ![PRESENCE.ONLINE, PRESENCE.OFFLINE].includes(status))) throw new Error('INVALID_STATUS');
  const previous = old.sessionId === sessionId ? old.presence || {} : {};
  const presence = Object.fromEntries(ids.map((id) => [id, previous[id] || PRESENCE.UNMARKED]));
  Object.assign(presence, changes);
  const presentIds = ids.filter((id) => presence[id] === PRESENCE.ONLINE);
  const absentIds = ids.filter((id) => presence[id] === PRESENCE.OFFLINE);
  const unmarkedIds = ids.filter((id) => presence[id] === PRESENCE.UNMARKED);

  // Preserve or update attention flags alongside presence
  const previousAttention = old.sessionId === sessionId ? old.attentionFlags || {} : {};
  const attentionFlags = Object.fromEntries(ids.map((id) => [id, previousAttention[id] || ATTENTION_STATUS.FOCUSED]));
  if (attentionChanges && Object.keys(attentionChanges).length) {
    Object.assign(attentionFlags, attentionChanges);
  }
  const attentionIds = ids.filter((id) => attentionFlags[id] === ATTENTION_STATUS.DISTRACTED);

  // Teacher Auto Check-In: teacher taking attendance proves teacher presence
  const isTeacherActor = actor.role === 'teacher' || actor.id === cls.teacherId;
  const previousCheckIn = old.sessionId === sessionId ? old.teacherCheckIn : null;
  const teacherCheckIn = previousCheckIn?.status === 'CHECKED_IN'
    ? previousCheckIn
    : isTeacherActor
    ? {
        status: 'CHECKED_IN',
        checkedInAt: new Date(now).toISOString(),
        method: 'AUTO_ATTENDANCE',
        confirmedBy: actor.id,
      }
    : previousCheckIn || { status: 'PENDING', checkedInAt: null, method: null, confirmedBy: null };

  return {
    sessionId, classId: cls.id, sessionStart: session.start, sessionEnd: session.end,
    date: classroomDate(session.start), presence, presentIds, absentIds, unmarkedIds,
    presentCount: presentIds.length, absentCount: absentIds.length, unmarkedCount: unmarkedIds.length,
    attentionFlags, attentionIds, attentionCount: attentionIds.length,
    teacherCheckIn,
    totalStudents: ids.length, updatedAt: new Date(now).toISOString(),
    auditTrail: {
      actorId: actor.id, actorName: actor.name || '', actorRole: actor.role,
      action: 'ATTENDANCE_UPDATED', createdAt: new Date(now).toISOString(),
    },
  };
};

export const buildAttention = (cls, old = {}, attentionChanges, actor, now = Date.now()) => {
  const session = findClassSession(cls, now);
  if (!session || now < session.start || now >= session.end) throw new Error('SESSION_CLOSED');
  const sessionId = classroomSessionId(cls.id, session);
  const ids = [...new Set(cls.studentIds || [])];
  if (!Object.keys(attentionChanges).length || Object.keys(attentionChanges).some((id) => !ids.includes(id))) {
    throw new Error('INVALID_ROSTER');
  }
  if (Object.values(attentionChanges).some((status) => ![ATTENTION_STATUS.FOCUSED, ATTENTION_STATUS.DISTRACTED].includes(status))) {
    throw new Error('INVALID_STATUS');
  }

  const previousAttention = old.sessionId === sessionId ? old.attentionFlags || {} : {};
  const attentionFlags = Object.fromEntries(ids.map((id) => [id, previousAttention[id] || ATTENTION_STATUS.FOCUSED]));
  Object.assign(attentionFlags, attentionChanges);
  const attentionIds = ids.filter((id) => attentionFlags[id] === ATTENTION_STATUS.DISTRACTED);

  // Teacher Auto Check-In: teacher flagging attention proves teacher presence
  const isTeacherActor = actor.role === 'teacher' || actor.id === cls.teacherId;
  const previousCheckIn = old.sessionId === sessionId ? old.teacherCheckIn : null;
  const teacherCheckIn = previousCheckIn?.status === 'CHECKED_IN'
    ? previousCheckIn
    : isTeacherActor
    ? {
        status: 'CHECKED_IN',
        checkedInAt: new Date(now).toISOString(),
        method: 'AUTO_ATTENDANCE',
        confirmedBy: actor.id,
      }
    : previousCheckIn || { status: 'PENDING', checkedInAt: null, method: null, confirmedBy: null };

  return {
    ...old,
    sessionId,
    classId: cls.id,
    sessionStart: session.start,
    sessionEnd: session.end,
    date: classroomDate(session.start),
    attentionFlags,
    attentionIds,
    attentionCount: attentionIds.length,
    teacherCheckIn,
    updatedAt: new Date(now).toISOString(),
    auditTrail: {
      actorId: actor.id,
      actorName: actor.name || '',
      actorRole: actor.role,
      action: 'ATTENTION_UPDATED',
      createdAt: new Date(now).toISOString(),
    },
  };
};

export const buildTeacherCheckIn = (cls, old = {}, actor, method = 'AUTO_HOST_OPEN', now = Date.now()) => {
  const session = findClassSession(cls, now);
  if (!session || now < session.start || now >= session.end) throw new Error('SESSION_CLOSED');
  const sessionId = classroomSessionId(cls.id, session);

  const teacherCheckIn = {
    status: 'CHECKED_IN',
    checkedInAt: new Date(now).toISOString(),
    method,
    confirmedBy: actor.id,
    confirmedByName: actor.name || '',
    confirmedByRole: actor.role,
  };

  return {
    ...old,
    sessionId,
    classId: cls.id,
    sessionStart: session.start,
    sessionEnd: session.end,
    date: classroomDate(session.start),
    teacherCheckIn,
    updatedAt: new Date(now).toISOString(),
    auditTrail: {
      actorId: actor.id,
      actorName: actor.name || '',
      actorRole: actor.role,
      action: 'TEACHER_CHECKIN_CONFIRMED',
      method,
      createdAt: new Date(now).toISOString(),
    },
  };
};

export const LESSON_PLAN_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  READY: 'READY',
});

export const QUICK_NOTE_DEFAULT_TAGS = Object.freeze([
  '🌟 Clear Reading',
  '🗣️ Active Speaking',
  '🔤 Phonics Error',
  '🧩 S-V-O Sentence',
  '⚠️ Needs Focus',
]);

export const buildQuickNote = (cls, old = {}, studentId, noteData = {}, actor, now = Date.now()) => {
  const session = findClassSession(cls, now);
  if (!session || now < session.start || now >= session.end) throw new Error('SESSION_CLOSED');
  const sessionId = classroomSessionId(cls.id, session);
  const ids = [...new Set(cls.studentIds || [])];
  if (!ids.includes(studentId)) throw new Error('INVALID_ROSTER');

  const previousNotes = old.sessionId === sessionId ? old.quickNotes || {} : {};
  const quickNotes = {
    ...previousNotes,
    [studentId]: {
      text: String(noteData.text || '').trim(),
      tags: Array.isArray(noteData.tags) ? noteData.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      updatedAt: new Date(now).toISOString(),
      authorId: actor.id,
      authorName: actor.name || '',
      authorRole: actor.role || 'teacher',
    },
  };

  return {
    ...old,
    sessionId,
    classId: cls.id,
    sessionStart: session.start,
    sessionEnd: session.end,
    date: classroomDate(session.start),
    quickNotes,
    updatedAt: new Date(now).toISOString(),
    auditTrail: {
      actorId: actor.id,
      actorName: actor.name || '',
      actorRole: actor.role,
      action: 'QUICK_NOTE_SAVED',
      studentId,
      createdAt: new Date(now).toISOString(),
    },
  };
};

export const buildLessonPlan = (cls, planData = {}, actor, now = Date.now()) => {
  if (!cls?.id) throw new Error('INVALID_CLASS');
  const sessionIndex = Math.max(1, Number(planData.sessionIndex) || 1);
  const status = planData.status === LESSON_PLAN_STATUS.DRAFT ? LESSON_PLAN_STATUS.DRAFT : LESSON_PLAN_STATUS.READY;

  const attachedMaterials = Array.isArray(planData.attachedMaterials)
    ? planData.attachedMaterials
        .filter((m) => m && m.id && m.title)
        .map((m) => ({
          id: String(m.id).trim(),
          title: String(m.title).trim(),
          type: String(m.type || 'PDF').trim(),
          url: String(m.url || '').trim(),
          matchScope: String(m.matchScope || 'CLASS').trim(),
          pageLocation: String(m.pageLocation || '').trim(),
        }))
    : [];

  return {
    id: `LP_${cls.id}_SESSION_${sessionIndex}`,
    classId: cls.id,
    sessionIndex,
    date: planData.date || classroomDate(now),
    unitWeek: String(planData.unitWeek || '').trim(),
    lessonTitle: String(planData.lessonTitle || '').trim(),
    objectives: Array.isArray(planData.objectives)
      ? planData.objectives.map((o) => String(o).trim()).filter(Boolean)
      : typeof planData.objectives === 'string'
      ? planData.objectives.split('\n').map((o) => o.trim()).filter(Boolean)
      : [],
    studentPrep: String(planData.studentPrep || '').trim(),
    homework: String(planData.homework || '').trim(),
    readingDailyTime: String(planData.readingDailyTime || '60+ mins').trim(),
    writingDailyTime: String(planData.writingDailyTime || '30+ mins').trim(),
    slideLink: String(planData.slideLink || '').trim(),
    attachedMaterials,
    teacherNotes: String(planData.teacherNotes || '').trim(),
    status,
    authorId: actor.id,
    authorName: actor.name || '',
    authorRole: actor.role || 'teacher',
    updatedAt: new Date(now).toISOString(),
    auditTrail: {
      actorId: actor.id,
      actorName: actor.name || '',
      actorRole: actor.role,
      action: 'LESSON_PLAN_SAVED',
      sessionIndex,
      createdAt: new Date(now).toISOString(),
    },
  };
};

export const buildStudentEvaluation = (cls, old = {}, studentId, evalData = {}, actor, now = Date.now()) => {
  const session = findClassSession(cls, now, { allowRecentEnded: true });
  const sessionId = evalData.sessionId || old.sessionId || classroomSessionId(cls.id, session);
  if (!sessionId) throw new Error('SESSION_NOT_FOUND');
  if (session && sessionId === classroomSessionId(cls.id, session) && now < session.start) {
    throw new Error('SESSION_NOT_STARTED');
  }

  const resolvedEndMs = resolveSessionEndMs(
    cls,
    {
      sessionStart: old.sessionStart || evalData.sessionStart || session?.start,
      sessionEnd: old.sessionEnd || evalData.sessionEnd || session?.end,
    },
    sessionId
  );
  if (!evalData.bypassWindowLock && resolvedEndMs) {
    const win = getSessionFeedbackWindowState(
      resolvedEndMs,
      now,
      POST_SESSION_FEEDBACK_WINDOW_MS,
      old.unlockState
    );
    if (win.isLockedAfter18h) {
      throw new Error('EVALUATION_WINDOW_LOCKED');
    }
  }

  const ids = [...new Set(cls.studentIds || [])];
  if (!ids.includes(studentId)) throw new Error('INVALID_ROSTER');

  const previousEvals = old.sessionId === sessionId ? old.studentEvaluations || {} : {};
  const stars = Math.max(1, Math.min(5, Math.round(Number(evalData.stars) || 5)));

  const studentEvaluations = {
    ...previousEvals,
    [studentId]: {
      ...(previousEvals[studentId] || {}),
      stars,
      ...(evalData.listeningScore !== undefined ? { listeningScore: Number(evalData.listeningScore) || stars } : {}),
      ...(evalData.speakingScore !== undefined ? { speakingScore: Number(evalData.speakingScore) || stars } : {}),
      ...(evalData.readingScore !== undefined ? { readingScore: Number(evalData.readingScore) || stars } : {}),
      ...(evalData.writingScore !== undefined ? { writingScore: Number(evalData.writingScore) || stars } : {}),
      comment: String(evalData.comment || '').trim(),
      tags: Array.isArray(evalData.tags) ? evalData.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      evaluatedAt: new Date(now).toISOString(),
      evaluatedBy: actor.id,
      evaluatedByName: actor.name || '',
      evaluatedByRole: actor.role || 'teacher',
    },
  };

  return {
    ...old,
    sessionId,
    classId: cls.id,
    sessionStart: old.sessionStart || evalData.sessionStart || session?.start,
    sessionEnd: old.sessionEnd || evalData.sessionEnd || resolvedEndMs || session?.end,
    date: old.date || evalData.date || (session?.start ? classroomDate(session.start) : classroomDate(now)),
    studentEvaluations,
    updatedAt: new Date(now).toISOString(),
    auditTrail: {
      actorId: actor.id,
      actorName: actor.name || '',
      actorRole: actor.role,
      action: 'STUDENT_EVALUATION_SAVED',
      studentId,
      createdAt: new Date(now).toISOString(),
    },
  };
};

export const buildEvaluationUnlockState = (
  cls,
  old = {},
  mode = 'REQUEST',
  payload = {},
  actor = {},
  now = Date.now()
) => {
  const sessionId = payload.sessionId || old.sessionId;
  if (!sessionId) throw new Error('SESSION_NOT_FOUND');
  const nowIso = new Date(now).toISOString();
  const prevUnlock = old.unlockState || {};
  const resolvedStart = old.sessionStart || payload.sessionStart || null;
  const resolvedEnd = resolveSessionEndMs(cls, { ...old, ...payload }, sessionId);

  let nextUnlockState;
  let auditAction;

  if (mode === 'REQUEST') {
    nextUnlockState = {
      ...prevUnlock,
      status: 'REQUESTED',
      requestedAt: nowIso,
      requestedAtMs: now,
      requestedBy: actor.id,
      requestedByName: actor.name || cls.teacherName || 'Teacher',
      requestReason: String(payload.reason || '').trim(),
    };
    auditAction = 'EVALUATION_UNLOCK_REQUESTED';
  } else if (mode === 'UNLOCK') {
    const durationMs = Number(payload.durationMs) || POST_SESSION_FEEDBACK_WINDOW_MS;
    nextUnlockState = {
      ...prevUnlock,
      status: 'UNLOCKED',
      unlockedAt: nowIso,
      unlockedAtMs: now,
      unlockedUntilMs: now + durationMs,
      unlockedBy: actor.id,
      unlockedByName: actor.name || actor.role || 'Academic',
      unlockedByRole: actor.role || 'academic',
      relockedAt: null,
      relockedBy: null,
      relockedByName: null,
    };
    auditAction = 'EVALUATION_UNLOCK_APPROVED';
  } else {
    nextUnlockState = {
      ...prevUnlock,
      status: 'LOCKED',
      unlockedUntilMs: now - 1,
      relockedAt: nowIso,
      relockedBy: actor.id,
      relockedByName: actor.name || actor.role || 'Academic',
    };
    auditAction = 'EVALUATION_RELOCKED';
  }

  return {
    ...old,
    id: sessionId,
    sessionId,
    classId: cls.id,
    className: cls.name || cls.id,
    teacherId: cls.teacherId || old.teacherId || '',
    teacherName: cls.teacherName || old.teacherName || '',
    ...(resolvedStart ? { sessionStart: resolvedStart } : {}),
    ...(resolvedEnd ? { sessionEnd: resolvedEnd } : {}),
    date: old.date || payload.date || (resolvedStart ? classroomDate(resolvedStart) : classroomDate(now)),
    unlockState: nextUnlockState,
    updatedAt: nowIso,
    auditTrail: {
      actorId: actor.id,
      actorName: actor.name || '',
      actorRole: actor.role,
      action: auditAction,
      createdAt: nowIso,
    },
  };
};
