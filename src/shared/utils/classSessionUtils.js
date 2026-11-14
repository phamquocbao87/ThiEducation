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
const minutes = (value) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  return match && +match[1] < 24 && +match[2] < 60 ? +match[1] * 60 + +match[2] : null;
};

/** Resolve an actual session from configured weekly schedules, in their stored timezone. */
export const findClassSession = (cls, now = Date.now()) => {
  if (!cls || cls.isDeleted || ['Deleted', 'Đã xóa', 'Completed', 'Đã hoàn thành', 'Cancelled', 'Tạm hoãn'].includes(cls.status)
    || cls.operationStatus === 'Tạm hoãn') return null;
  const classStart = dateKey(cls.startDate);
  const classEnd = dateKey(cls.endDate);
  const history = Array.isArray(cls.scheduleHistory) ? cls.scheduleHistory : [];
  const periods = history.length ? history : [{ schedule: cls.schedule, scheduleData: cls.scheduleData }];
  const sessions = [];
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
    const first = Math.max(today - DAY, from);
    // At most one week of candidates per period, including yesterday's overnight session.
    for (let day = first; day <= Math.min(first + 8 * DAY, to); day += DAY) {
      if (!days.includes(new Date(day).getUTCDay())) continue;
      const start = day + startMinutes * 60000 - offset * 3600000;
      const end = day + (endMinutes + (endMinutes < startMinutes ? 1440 : 0)) * 60000 - offset * 3600000;
      if (end > now) sessions.push({ start, end });
    }
  }
  return sessions.sort((a, b) => a.start - b.start)[0] || null;
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
export const generateClassSessionDates = (cls, totalCount = 20, isEnglish = false) => {
  if (!cls) return [];
  const classStart = dateKey(cls.startDate) || Date.now();
  const classEnd = dateKey(cls.endDate) || (classStart + 365 * DAY);
  const data = cls.scheduleData || {};
  const range = String(cls.schedule || '').match(/(\d{1,2}:\d{2})\s*(?:[-–~]|to|đến)\s*(\d{1,2}:\d{2})/i);
  const startMinutes = minutes(data.startTime || range?.[1]) ?? (19 * 60);
  const endMinutes = minutes(data.endTime || range?.[2]) ?? (21 * 60 + 10);
  const days = parseDaysOfWeek(cls.schedule, data);
  const activeDays = days.length ? days : [1, 3, 5];
  const offset = Number.isFinite(Number(data.baseTimezoneOffset)) ? Number(data.baseTimezoneOffset) : 7;

  const result = [];
  let currentDay = classStart;
  const maxDay = classStart + 365 * DAY;
  let sessionIndex = 1;

  while (result.length < totalCount && currentDay <= maxDay && currentDay <= classEnd) {
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

      const weekNum = Math.ceil(sessionIndex / 2);
      const unitNum = Math.ceil(sessionIndex / 6);
      const unitWeek = `Unit ${unitNum} Week ${weekNum} · Lesson ${sessionIndex}`;

      result.push({
        sessionIndex,
        date: dateFormatted,
        dateMs: startMs,
        endMs,
        dayOfWeek,
        dayName,
        timeRange: `${data.startTime || '19:00'} - ${data.endTime || '21:10'}`,
        unitWeek,
        label: isEnglish
          ? `Session ${sessionIndex}: ${dayName}, ${dateFormatted} — ${unitWeek}`
          : `Buổi ${sessionIndex}: ${dayName}, ${dateFormatted} — ${unitWeek}`,
      });
      sessionIndex += 1;
    }
    currentDay += DAY;
  }
  return result;
};
