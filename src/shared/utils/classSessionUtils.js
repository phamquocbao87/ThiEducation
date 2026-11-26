const parseDaysOfWeek = (schedule = '', data) => {
  if (Array.isArray(data?.days) && data.days.length) return data.days.map(Number);
  const text = String(schedule).toLowerCase();
  if (/t2 đến t6|thứ 2 đến thứ 6|mon to fri/.test(text)) return [1, 2, 3, 4, 5];
  if (/2-4-6|246/.test(text)) return [1, 3, 5];
  if (/3-5-7|357/.test(text)) return [2, 4, 6];
  return [/chủ nhật|\bcn\b|sun/, /thứ 2|\bt2\b|mon/, /thứ 3|\bt3\b|tue/,
    /thứ 4|\bt4\b|wed/, /thứ 5|\bt5\b|thu/, /thứ 6|\bt6\b|fri/,
    /thứ 7|\bt7\b|sat/].flatMap((pattern, day) => pattern.test(text) ? [day] : []);
};

const DAY = 86400000;
export const POST_SESSION_FEEDBACK_WINDOW_HOURS = 18;
export const POST_SESSION_FEEDBACK_WINDOW_MS = POST_SESSION_FEEDBACK_WINDOW_HOURS * 3600 * 1000;

const dateKey = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') value = value.toDate();
  if (value instanceof Date) value = value.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const text = String(value);
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parts = dmy ? [+dmy[3], +dmy[2], +dmy[1]] : ymd ? [+ymd[1], +ymd[2], +ymd[3]] : null;
  if (!parts) return null;
  const [y, m, d] = parts;
  const result = Date.UTC(y, m - 1, d);
  const check = new Date(result);
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d ? result : null;
};

export const normalizeSessionDateKey = (value) => {
  const ms = dateKey(value);
  if (ms === null) return '';
  const dt = new Date(ms);
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dt.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const stripFeedbackHtml = (raw = '') =>
  String(raw || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const mergeSessionEvaluationDocs = (existingDoc = null, incomingDoc = null) => {
  if (!existingDoc) return incomingDoc ? { ...incomingDoc } : null;
  if (!incomingDoc) return { ...existingDoc };

  const mergedPresence = {
    ...(existingDoc.presence || {}),
    ...(incomingDoc.presence || {}),
  };

  const prevEvals = existingDoc.studentEvaluations || {};
  const nextEvals = incomingDoc.studentEvaluations || {};
  const allStudentIds = new Set([...Object.keys(prevEvals), ...Object.keys(nextEvals)]);
  const mergedEvals = {};

  allStudentIds.forEach((sid) => {
    const prevItem = prevEvals[sid];
    const nextItem = nextEvals[sid];
    if (!prevItem) {
      mergedEvals[sid] = nextItem;
      return;
    }
    if (!nextItem) {
      mergedEvals[sid] = prevItem;
      return;
    }
    const prevComment = stripFeedbackHtml(prevItem.comment);
    const nextComment = stripFeedbackHtml(nextItem.comment);
    if (nextComment.length > 0 && prevComment.length === 0) {
      mergedEvals[sid] = { ...prevItem, ...nextItem };
    } else if (prevComment.length > 0 && nextComment.length === 0) {
      mergedEvals[sid] = { ...nextItem, ...prevItem, comment: prevItem.comment };
    } else {
      mergedEvals[sid] = { ...prevItem, ...nextItem };
    }
  });

  const prevUpdated = String(existingDoc.updatedAt || existingDoc.createdAt || '');
  const nextUpdated = String(incomingDoc.updatedAt || incomingDoc.createdAt || '');

  const getUnlockStamp = (u) => {
    if (!u || typeof u !== 'object') return 0;
    const relockMs = u.relockedAt ? (Date.parse(u.relockedAt) || 0) : 0;
    return Math.max(Number(u.requestedAtMs) || 0, Number(u.unlockedAtMs) || 0, relockMs);
  };
  const prevUnlock = existingDoc.unlockState || null;
  const nextUnlock = incomingDoc.unlockState || null;
  const mergedUnlockState = getUnlockStamp(nextUnlock) >= getUnlockStamp(prevUnlock)
    ? (nextUnlock || prevUnlock)
    : prevUnlock;

  return {
    ...existingDoc,
    ...incomingDoc,
    presence: mergedPresence,
    studentEvaluations: mergedEvals,
    ...(mergedUnlockState ? { unlockState: mergedUnlockState } : {}),
    updatedAt: nextUpdated >= prevUpdated ? (incomingDoc.updatedAt || existingDoc.updatedAt) : existingDoc.updatedAt,
  };
};

/**
 * Đánh giá mức độ hoàn tất nhận xét buổi học:
 * Bắt buộc 100% học sinh có mặt (không vắng mặt OFFLINE) trong danh sách lớp có lời nhận xét thực tế (không rỗng).
 */
export const evaluateSessionFeedbackCompleteness = (sessionDoc = null, rosterIds = []) => {
  const uniqueRoster = [...new Set((Array.isArray(rosterIds) ? rosterIds : []).filter(Boolean))];
  const presence = sessionDoc?.presence || {};
  const evals = sessionDoc?.studentEvaluations || {};
  const baseIds = uniqueRoster.length > 0
    ? uniqueRoster
    : [...new Set([...Object.keys(presence), ...Object.keys(evals)].filter(Boolean))];

  const isStudentAbsent = (sid) =>
    presence[sid] === 'OFFLINE'
    || evals[sid]?.presence === 'OFFLINE'
    || evals[sid]?.attendanceStatus === 'OFFLINE';

  const requiredStudentIds = baseIds.filter((sid) => !isStudentAbsent(sid));
  const hasExplicitAllAbsent = baseIds.length > 0 && requiredStudentIds.length === 0 && baseIds.every((sid) => isStudentAbsent(sid));

  const completedStudentIds = requiredStudentIds.filter((sid) => stripFeedbackHtml(evals[sid]?.comment).length > 0);
  const missingStudentIds = requiredStudentIds.filter((sid) => stripFeedbackHtml(evals[sid]?.comment).length === 0);

  const requiredCount = requiredStudentIds.length;
  const completedCount = completedStudentIds.length;
  const missingCount = missingStudentIds.length;
  const isComplete = hasExplicitAllAbsent || (requiredCount > 0 && missingCount === 0);
  const isPartial = completedCount > 0 && missingCount > 0;

  const totalStars = completedStudentIds.reduce((sum, sid) => sum + (Number(evals[sid]?.stars) || 5), 0);
  const avgStars = completedCount > 0 ? (totalStars / completedCount).toFixed(1) : null;

  return {
    requiredCount,
    completedCount,
    missingCount,
    requiredStudentIds,
    completedStudentIds,
    missingStudentIds,
    isComplete,
    isPartial,
    hasExplicitAllAbsent,
    avgStars,
  };
};

export const getSessionFeedbackWindowState = (
  endMs,
  now = Date.now(),
  graceWindowMs = POST_SESSION_FEEDBACK_WINDOW_MS,
  unlockState = null
) => {
  const numericEnd = Number(endMs);
  if (!Number.isFinite(numericEnd)) {
    return {
      isEnded: false,
      isWithinWindow: false,
      isOverdue: false,
      isLockedAfter18h: false,
      isTemporarilyUnlocked: false,
      isUnlockExpired: false,
      isUnlockRequested: false,
      deadlineMs: null,
      remainingMs: 0,
      overdueMs: 0,
      unlockedUntilMs: null,
      unlockRemainingMs: 0,
      unlockState: unlockState || null,
    };
  }
  const deadlineMs = numericEnd + graceWindowMs;
  const isEnded = numericEnd <= now;
  const isWithinWindow = isEnded && now <= deadlineMs;
  const isOverdue = isEnded && now > deadlineMs;

  const unlockedUntilMs = Number(unlockState?.unlockedUntilMs) || 0;
  const isTemporarilyUnlocked = Boolean(
    isOverdue && unlockState?.status === 'UNLOCKED' && unlockedUntilMs > now
  );
  const isUnlockExpired = Boolean(
    isOverdue && unlockState?.status === 'UNLOCKED' && unlockedUntilMs > 0 && unlockedUntilMs <= now
  );
  const isUnlockRequested = Boolean(
    isOverdue && !isTemporarilyUnlocked && unlockState?.status === 'REQUESTED'
  );
  const isLockedAfter18h = Boolean(isOverdue && !isTemporarilyUnlocked);

  return {
    isEnded,
    isWithinWindow,
    isOverdue,
    isLockedAfter18h,
    isTemporarilyUnlocked,
    isUnlockExpired,
    isUnlockRequested,
    deadlineMs,
    remainingMs: isWithinWindow ? Math.max(0, deadlineMs - now) : 0,
    overdueMs: isOverdue ? Math.max(0, now - deadlineMs) : 0,
    unlockedUntilMs: unlockedUntilMs || null,
    unlockRemainingMs: isTemporarilyUnlocked ? Math.max(0, unlockedUntilMs - now) : 0,
    unlockState: unlockState || null,
  };
};

export const resolveSessionEndMs = (cls, sessionMeta = {}, expectedSessionId = '') => {
  const explicitEnd = Number(sessionMeta?.sessionEnd || sessionMeta?.end || sessionMeta?.endMs);
  if (Number.isFinite(explicitEnd) && explicitEnd > 0) return explicitEnd;

  let startMs = Number(sessionMeta?.sessionStart || sessionMeta?.start || sessionMeta?.dateMs);
  if (!Number.isFinite(startMs) || startMs <= 0) {
    const idMatch = String(expectedSessionId || '').match(/_(\d{11,15})$/);
    if (idMatch) startMs = Number(idMatch[1]);
  }

  const data = cls?.scheduleData || {};
  const range = String(cls?.schedule || '').match(/(\d{1,2}:\d{2})\s*(?:[-–~]|to|đến)\s*(\d{1,2}:\d{2})/i);
  const sMin = minutes(data.startTime || range?.[1]);
  const eMin = minutes(data.endTime || range?.[2]);
  const durationMs = (sMin !== null && eMin !== null && eMin !== sMin)
    ? ((eMin + (eMin < sMin ? 1440 : 0) - sMin) * 60000)
    : (2 * 3600 * 1000);

  if (Number.isFinite(startMs) && startMs > 0) {
    return startMs + durationMs;
  }
  return null;
};

export const formatFeedbackCountdown = (ms, isEnglish = false) => {
  const totalMinutes = Math.max(1, Math.ceil(Math.max(0, Number(ms) || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours <= 0) return isEnglish ? `${mins}m` : `${mins}p`;
  if (mins === 0) return isEnglish ? `${hours}h` : `${hours}g`;
  return isEnglish ? `${hours}h ${mins}m` : `${hours}g ${mins}p`;
};

const minutes = (value) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  return match && +match[1] < 24 && +match[2] < 60 ? +match[1] * 60 + +match[2] : null;
};

/** Resolve an actual session from configured weekly schedules, in their stored timezone. */
export const findClassSession = (cls, now = Date.now(), options = {}) => {
  if (!cls || cls.isDeleted || ['Deleted', 'Đã xóa', 'Completed', 'Đã hoàn thành', 'Cancelled', 'Tạm hoãn'].includes(cls.status)
    || cls.operationStatus === 'Tạm hoãn') return null;
  const allowRecentEnded = options.allowRecentEnded ?? false;
  const graceWindowMs = options.graceWindowMs ?? POST_SESSION_FEEDBACK_WINDOW_MS; // 18 hours post-session evaluation window
  const classStart = dateKey(cls.startDate);
  const classEnd = dateKey(cls.endDate);
  const history = Array.isArray(cls.scheduleHistory) ? cls.scheduleHistory : [];
  const periods = history.length ? history : [{ schedule: cls.schedule, scheduleData: cls.scheduleData }];
  const liveOrUpcoming = [];
  const recentEnded = [];
  const lookbackMs = Math.max(DAY, Math.ceil(graceWindowMs / DAY) * DAY);
  for (const period of periods) {
    const data = period.scheduleData || {};
    const range = String(period.schedule || '').match(/(\d{1,2}:\d{2})\s*(?:[-–~]|to|đến)\s*(\d{1,2}:\d{2})/i);
    const startMinutes = minutes(data.startTime || range?.[1]);
    const endMinutes = minutes(data.endTime || range?.[2]);
    const days = parseDaysOfWeek(period.schedule, data);
    if (startMinutes === null || endMinutes === null || !days.length || startMinutes === endMinutes) continue;
    const offset = Number.isFinite(Number(data.baseTimezoneOffset)) ? Number(data.baseTimezoneOffset) : 7;
    const today = Math.floor((now + offset * 3600000) / DAY) * DAY;
    const from = Math.max(classStart ?? -Infinity, dateKey(period.effectiveFrom) ?? -Infinity);
    const to = Math.min(classEnd ?? Infinity, dateKey(period.effectiveTo) ?? Infinity);
    const first = Math.max(today - lookbackMs, from);
    // At most one week of candidates per period, including lookback window for overnight/18h post-session grace.
    for (let day = first; day <= Math.min(first + 8 * DAY + lookbackMs, to); day += DAY) {
      if (!days.includes(new Date(day).getUTCDay())) continue;
      const start = day + startMinutes * 60000 - offset * 3600000;
      const end = day + (endMinutes + (endMinutes < startMinutes ? 1440 : 0)) * 60000 - offset * 3600000;
      if (end > now) {
        liveOrUpcoming.push({ start, end });
      } else if (allowRecentEnded && end <= now && (now - end) <= graceWindowMs) {
        recentEnded.push({ start, end, isEnded: true });
      }
    }
  }

  // Ưu tiên 1: Phiên đang diễn ra trực tiếp (Live)
  const live = liveOrUpcoming.find((s) => now >= s.start && now < s.end);
  if (live) return live;

  // Ưu tiên 2: Phiên vừa kết thúc trong cửa sổ hậu buổi học (Recent Ended) nếu cho phép
  if (allowRecentEnded && recentEnded.length > 0) {
    return recentEnded.sort((a, b) => b.end - a.end)[0];
  }

  // Ưu tiên 3: Phiên sắp diễn ra (Upcoming)
  return liveOrUpcoming.sort((a, b) => a.start - b.start)[0] || null;
};

export const getSessionTimer = (session, now) => {
  if (!session) return null;
  if (now < session.start) return { state: 'upcoming', startsIn: Math.ceil((session.start - now) / 1000) };
  if (now < session.end) return {
    state: 'live', elapsed: Math.floor((now - session.start) / 1000), remaining: Math.ceil((session.end - now) / 1000),
  };
  return null;
};

export const formatTimerDuration = (seconds, t) => {
  let rest = Math.max(0, Math.floor(seconds));
  return [['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]].flatMap(([unit, size]) => {
    const count = Math.floor(rest / size);
    rest %= size;
    return count || unit === 'seconds' ? [t(`dashboard.classTimer.${unit}`, { count })] : [];
  }).join(' ');
};

const VI_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Tự động tính toán danh sách N buổi học thực tế của lớp học dựa trên thời khóa biểu & ngày bắt đầu
 */
export const generateClassSessionDates = (cls, totalCount = null, isEnglish = false) => {
  if (!cls) return [];
  const effectiveTotal = Math.max(1, Number(totalCount) || Number(cls?.totalSessions) || 12);
  const classStart = dateKey(cls.startDate) || Date.now();
  const classEnd = dateKey(cls.endDate) || (classStart + 365 * DAY);
  const data = cls.scheduleData || {};
  const range = String(cls.schedule || '').match(/(\d{1,2}:\d{2})\s*(?:[-–~]|to|đến)\s*(\d{1,2}:\d{2})/i);
  const startMinutes = minutes(data.startTime || range?.[1]) ?? (19 * 60);
  const endMinutes = minutes(data.endTime || range?.[2]) ?? (21 * 60);
  const days = parseDaysOfWeek(cls.schedule, data);
  const activeDays = days.length ? days : [1, 3, 5];
  const offset = Number.isFinite(Number(data.baseTimezoneOffset)) ? Number(data.baseTimezoneOffset) : 7;

  const result = [];
  let currentDay = classStart;
  const maxDay = classStart + 365 * DAY;
  let sessionIndex = 1;

  while (result.length < effectiveTotal && currentDay <= maxDay && currentDay <= classEnd) {
    const checkDate = new Date(currentDay);
    const dayOfWeek = checkDate.getUTCDay();
    if (activeDays.includes(dayOfWeek)) {
      const startMs = currentDay + startMinutes * 60000 - offset * 3600000;
      const endMs = currentDay + endMinutes * 60000 - offset * 3600000;
      const dayStr = String(checkDate.getUTCDate()).padStart(2, '0');
      const monthStr = String(checkDate.getUTCMonth() + 1).padStart(2, '0');
      const yearStr = checkDate.getUTCFullYear();
      const dateFormatted = `${dayStr}/${monthStr}/${yearStr}`;
      const dayName = isEnglish ? EN_DAYS[dayOfWeek] : VI_DAYS[dayOfWeek];

      const savedPlan = cls?.lessonPlans?.[sessionIndex];
      const unitWeek = savedPlan?.unitWeek || '';

      result.push({
        sessionIndex,
        date: dateFormatted,
        dateMs: startMs,
        endMs,
        dayOfWeek,
        dayName,
        timeRange: `${data.startTime || '19:00'} - ${data.endTime || '21:00'}`,
        unitWeek,
        label: isEnglish
          ? `Session ${sessionIndex}: ${dayName}, ${dateFormatted}${savedPlan?.lessonTitle ? ` — ${savedPlan.lessonTitle}` : ''}`
          : `Buổi ${sessionIndex}: ${dayName}, ${dateFormatted}${savedPlan?.lessonTitle ? ` — ${savedPlan.lessonTitle}` : ''}`,
      });
      sessionIndex += 1;
    }
    currentDay += DAY;
  }
  return result;
};
