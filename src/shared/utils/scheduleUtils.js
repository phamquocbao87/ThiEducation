import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * Schedule Parsing, Formatting, Multi-Timezone Conversion,
 * Effective-Dated Schedule History & Real-time Conflict Detection Engine
 */

export const DAY_OPTIONS = [
  { value: 1, shortVi: 'T2', fullVi: 'Thứ 2', shortEn: 'Mon', fullEn: 'Monday' },
  { value: 2, shortVi: 'T3', fullVi: 'Thứ 3', shortEn: 'Tue', fullEn: 'Tuesday' },
  { value: 3, shortVi: 'T4', fullVi: 'Thứ 4', shortEn: 'Wed', fullEn: 'Wednesday' },
  { value: 4, shortVi: 'T5', fullVi: 'Thứ 5', shortEn: 'Thu', fullEn: 'Thursday' },
  { value: 5, shortVi: 'T6', fullVi: 'Thứ 6', shortEn: 'Fri', fullEn: 'Friday' },
  { value: 6, shortVi: 'T7', fullVi: 'Thứ 7', shortEn: 'Sat', fullEn: 'Saturday' },
  { value: 0, shortVi: 'CN', fullVi: 'Chủ nhật', shortEn: 'Sun', fullEn: 'Sunday' },
];

export const WEEKLY_DAY_PRESETS = [
  { key: '2-4', labelVi: 'T2 - T4', labelEn: 'Mon - Wed', days: [1, 3] },
  { key: '3-5', labelVi: 'T3 - T5', labelEn: 'Tue - Thu', days: [2, 4] },
  { key: '2-4-6', labelVi: 'T2 - T4 - T6', labelEn: 'Mon - Wed - Fri', days: [1, 3, 5] },
  { key: '3-5-7', labelVi: 'T3 - T5 - T7', labelEn: 'Tue - Thu - Sat', days: [2, 4, 6] },
  {
    key: '2-3-4-5-6',
    labelVi: 'T2 đến T6 (5 buổi)',
    labelEn: 'Mon to Fri (5 days)',
    days: [1, 2, 3, 4, 5],
  },
  { key: '7-CN', labelVi: 'T7 - CN (Cuối tuần)', labelEn: 'Sat - Sun (Weekend)', days: [6, 0] },
];

export const TIME_SLOT_PRESETS = [
  { label: '07:20 - 08:20', startTime: '07:20', endTime: '08:20' },
  { label: '08:00 - 09:30', startTime: '08:00', endTime: '09:30' },
  { label: '10:00 - 11:00', startTime: '10:00', endTime: '11:00' },
  { label: '10:30 - 12:00', startTime: '10:30', endTime: '12:00' },
  { label: '17:30 - 19:00', startTime: '17:30', endTime: '19:00' },
  { label: '18:00 - 19:30', startTime: '18:00', endTime: '19:30' },
  { label: '19:10 - 20:10', startTime: '19:10', endTime: '20:10' },
  { label: '19:30 - 21:00', startTime: '19:30', endTime: '21:00' },
];

export const TIMEZONE_OPTIONS = [
  {
    key: 'VN',
    offset: 7,
    code: 'GMT+7',
    iana: 'Asia/Ho_Chi_Minh',
    labelVi: '🇻🇳 Giờ Việt Nam (GMT+7)',
    labelEn: '🇻🇳 Vietnam Time (GMT+7)',
  },
  {
    key: 'PH',
    offset: 8,
    code: 'GMT+8',
    iana: 'Asia/Manila',
    labelVi: '🇵🇭 Giờ Philippines / Singapore (GMT+8)',
    labelEn: '🇵🇭 Philippines / Manila Time (GMT+8)',
  },
  {
    key: 'AU',
    offset: 10,
    code: 'GMT+10',
    iana: 'Australia/Sydney',
    labelVi: '🇦🇺 Giờ Úc - Sydney (GMT+10)',
    labelEn: '🇦🇺 Australia - Sydney (GMT+10)',
  },
  {
    key: 'UK',
    offset: 0,
    code: 'GMT+0',
    iana: 'Europe/London',
    labelVi: '🇬🇧 Giờ Anh Quốc - London (GMT+0)',
    labelEn: '🇬🇧 UK Time - London (GMT+0)',
  },
  {
    key: 'US_NY',
    offset: -5,
    code: 'GMT-5',
    iana: 'America/New_York',
    labelVi: '🇺🇸 Giờ Mỹ - New York EST (GMT-5)',
    labelEn: '🇺🇸 US Eastern - New York (GMT-5)',
  },
];

export const HOLIDAY_PRESETS = [
  {
    key: 'NEW_YEAR',
    labelVi: 'Tết Dương Lịch (01/01)',
    labelEn: "New Year's Day (Jan 1)",
  },
  {
    key: 'LUNAR_NEW_YEAR',
    labelVi: 'Nghỉ Tết Nguyên Đán (7 - 9 ngày)',
    labelEn: 'Lunar New Year Holiday (Tet)',
  },
  {
    key: 'HUNG_KINGS',
    labelVi: 'Giỗ Tổ Hùng Vương (10/03 ÂL)',
    labelEn: "Hung Kings' Commemoration",
  },
  {
    key: 'REUNIFICATION_LABOR',
    labelVi: 'Lễ 30/04 & Quốc Tế Lao Động 01/05',
    labelEn: 'Reunification & Labor Day (Apr 30 - May 1)',
  },
  {
    key: 'NATIONAL_DAY',
    labelVi: 'Quốc Khánh (02/09)',
    labelEn: 'National Day (Sep 2)',
  },
  {
    key: 'CHRISTMAS',
    labelVi: 'Lễ Giáng Sinh (24/12 - 25/12)',
    labelEn: 'Christmas Break (Dec 24 - 25)',
  },
];

export const normalizeTimeStr = (raw = '18:00') => {
  const cleaned = String(raw).trim().replace(/h/gi, ':').replace(/::+/g, ':');
  const match = cleaned.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return '18:00';
  const h = Math.max(0, Math.min(23, parseInt(match[1], 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt(match[2], 10) || 0));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const timeToMinutes = (timeStr = '18:00') => {
  const norm = normalizeTimeStr(timeStr);
  const parts = norm.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

export const minutesToTime = (totalMinutes) => {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Convert HH:mm from baseOffset (default GMT+7 Vietnam) to targetOffset (e.g. GMT+8 Philippines)
 * Returns { time: 'HH:mm', dayShift: -1 | 0 | 1 }
 */
export const convertTimeBetweenOffsets = (
  timeStr = '10:30',
  fromOffset = 7,
  toOffset = 8
) => {
  const baseMins = timeToMinutes(timeStr);
  const diffMins = (toOffset - fromOffset) * 60;
  const targetTotalMins = baseMins + diffMins;
  const dayShift = Math.floor(targetTotalMins / 1440);
  return {
    time: minutesToTime(targetTotalMins),
    dayShift,
  };
};

/**
 * Convert a range (startTime - endTime) from Vietnam GMT+7 to any target UTC offset
 */
export const convertRangeFromVietnam = (
  startTime = '10:30',
  endTime = '12:00',
  targetOffset = 8,
  baseOffset = 7
) => {
  const s = convertTimeBetweenOffsets(startTime, baseOffset, targetOffset);
  const e = convertTimeBetweenOffsets(endTime, baseOffset, targetOffset);
  return {
    startTime: s.time,
    endTime: e.time,
    dayShift: s.dayShift,
  };
};

/**
 * Parse schedule string or object into structured recurring schedule object:
 * { days: number[], startTime: 'HH:mm', endTime: 'HH:mm', baseTimezoneOffset: 7, holidays: string[] }
 */
export const parseScheduleToStructured = (input) => {
  if (!input) {
    return {
      days: [1, 3],
      startTime: '18:00',
      endTime: '19:30',
      baseTimezoneOffset: 7,
      holidays: ['Tết Dương Lịch (01/01)', 'Nghỉ Tết Nguyên Đán (7 - 9 ngày)'],
    };
  }

  if (typeof input === 'object' && Array.isArray(input.days)) {
    return {
      days: input.days.length > 0 ? input.days : [1, 3],
      startTime: normalizeTimeStr(input.startTime || '18:00'),
      endTime: normalizeTimeStr(input.endTime || '19:30'),
      baseTimezoneOffset:
        typeof input.baseTimezoneOffset === 'number' ? input.baseTimezoneOffset : 7,
      holidays: Array.isArray(input.holidays) ? input.holidays : [],
    };
  }

  const str = String(input);
  const days = [];

  if (/thứ\s*2\s*[-–đến]+\s*thứ\s*6|t2\s*[-–đến]+\s*t6|mon\s*[-–to]+\s*fri/i.test(str)) {
    days.push(1, 2, 3, 4, 5);
  } else {
    if (/thứ\s*2|\bt2\b|\bmon/i.test(str)) days.push(1);
    if (/thứ\s*3|\bt3\b|\btue/i.test(str)) days.push(2);
    if (/thứ\s*4|\bt4\b|\bwed/i.test(str)) days.push(3);
    if (/thứ\s*5|\bt5\b|\bthu/i.test(str)) days.push(4);
    if (/thứ\s*6|\bt6\b|\bfri/i.test(str)) days.push(5);
    if (/thứ\s*7|\bt7\b|\bsat/i.test(str)) days.push(6);
    if (/chủ\s*nhật|\bcn\b|\bsun/i.test(str)) days.push(0);
  }

  const timeMatch = str.match(
    /(\d{1,2}[:h]\d{2})\s*[-–~tođến]+\s*(\d{1,2}[:h]\d{2})/i
  );
  const startTime = timeMatch ? normalizeTimeStr(timeMatch[1]) : '18:00';
  const endTime = timeMatch ? normalizeTimeStr(timeMatch[2]) : '19:30';

  return {
    days: days.length > 0 ? days : [1, 3],
    startTime,
    endTime,
    baseTimezoneOffset: 7,
    holidays: ['Tết Dương Lịch (01/01)', 'Nghỉ Tết Nguyên Đán (7 - 9 ngày)'],
  };
};

/**
 * Format structured schedule object into human-readable string (in base GMT+7 or target timezone)
 */
export const formatStructuredSchedule = (
  structured,
  isEnglish = false,
  targetTimezoneOffset = null
) => {
  const parsed = parseScheduleToStructured(structured);
  const orderedDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => parsed.days.includes(d));
  const dayNames = orderedDays.map((d) => {
    const found = DAY_OPTIONS.find((opt) => opt.value === d);
    return isEnglish ? found?.shortEn : found?.fullVi;
  });

  const dayStr =
    dayNames.length > 0
      ? dayNames.join(', ')
      : isEnglish
      ? 'Mon, Wed'
      : 'Thứ 2, Thứ 4';

  const baseOffset = parsed.baseTimezoneOffset ?? 7;
  if (targetTimezoneOffset !== null && targetTimezoneOffset !== baseOffset) {
    const converted = convertRangeFromVietnam(
      parsed.startTime,
      parsed.endTime,
      targetTimezoneOffset,
      baseOffset
    );
    return `${dayStr} (${converted.startTime} - ${converted.endTime})`;
  }

  return `${dayStr} (${parsed.startTime} - ${parsed.endTime})`;
};

/**
 * Automatically detect the viewer's UTC offset from user profile or browser/OS timezone
 * (e.g., Vietnam = 7, Philippines = 8)
 */
export const getViewerUtcOffset = (user = null) => {
  if (typeof window !== 'undefined' && typeof window.__LAK_VIEWER_UTC_OFFSET__ === 'number') {
    return window.__LAK_VIEWER_UTC_OFFSET__;
  }
  if (user && typeof user.utcOffset === 'number') {
    return user.utcOffset;
  }
  if (typeof Date !== 'undefined') {
    const offsetHours = -new Date().getTimezoneOffset() / 60;
    if (Number.isFinite(offsetHours)) {
      return offsetHours;
    }
  }
  return 7;
};

/**
 * Format schedule automatically converted into the viewer's timezone behind the scenes
 */
export const formatScheduleForViewer = (
  scheduleInput,
  isEnglish = false,
  user = null
) => {
  const viewerOffset = getViewerUtcOffset(user);
  return formatStructuredSchedule(scheduleInput, isEnglish, viewerOffset);
};

/**
 * Subtract 1 day from DD/MM/YYYY date string to close previous schedule period cleanly
 */
export const getPreviousDayStr = (dateStr = '09/10/2026') => {
  const parsed = dayjs(dateStr, ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'], true);
  if (parsed.isValid()) {
    return parsed.subtract(1, 'day').format('DD/MM/YYYY');
  }
  return dateStr;
};

/**
 * Build & append effective-dated schedule history when a class changes its timetable
 * Preserves all past schedule periods (e.g. 04/02/2026 -> 08/10/2026, then 09/10/2026 -> Present)
 */
export const buildUpdatedScheduleHistory = ({
  existingClass,
  newScheduleStr,
  newScheduleData,
  effectiveFromDate,
  changeReason = '',
}) => {
  const currentHistory = Array.isArray(existingClass?.scheduleHistory)
    ? [...existingClass.scheduleHistory]
    : [];

  const oldScheduleStr = existingClass?.schedule || '';
  const classStartDate = existingClass?.startDate || '04/02/2026';

  // Nếu lớp chưa có lịch sử nào, khởi tạo giai đoạn gốc từ ngày khai giảng lớp (startDate)
  if (currentHistory.length === 0 && oldScheduleStr) {
    currentHistory.push({
      version: 1,
      effectiveFrom: classStartDate,
      effectiveTo: null, // Đang áp dụng
      schedule: oldScheduleStr,
      scheduleData:
        existingClass?.scheduleData || parseScheduleToStructured(oldScheduleStr),
      status: 'ACTIVE',
      note: 'Lịch học khởi tạo từ ngày khai giảng lớp',
      updatedAt: existingClass?.createdAt || new Date().toISOString(),
    });
  }

  // Nếu lịch học không thay đổi thì giữ nguyên lịch sử
  if (!newScheduleStr || newScheduleStr.trim() === oldScheduleStr.trim()) {
    return currentHistory;
  }

  const effFrom =
    effectiveFromDate?.trim() || dayjs().format('DD/MM/YYYY');
  const prevEndDate = getPreviousDayStr(effFrom);

  // Đóng giai đoạn lịch hiện hành (chuyển sang ARCHIVED với effectiveTo = ngày liền trước)
  const closedHistory = currentHistory.map((item, idx) => {
    if (idx === currentHistory.length - 1 || item.status === 'ACTIVE') {
      return {
        ...item,
        effectiveTo: prevEndDate,
        status: 'ARCHIVED',
      };
    }
    return item;
  });

  // Thêm giai đoạn lịch mới có hiệu lực từ effectiveFromDate
  const nextVersion = closedHistory.length + 1;
  closedHistory.push({
    version: nextVersion,
    effectiveFrom: effFrom,
    effectiveTo: null, // Đang áp dụng hiện hành
    schedule: newScheduleStr.trim(),
    scheduleData: newScheduleData || parseScheduleToStructured(newScheduleStr),
    status: 'ACTIVE',
    note:
      changeReason?.trim() ||
      `Điều chỉnh thời khóa biểu áp dụng từ ngày ${effFrom}`,
    updatedAt: new Date().toISOString(),
  });

  return closedHistory;
};

/**
 * Check if two schedules overlap on any day of the week and time range
 */
export const hasScheduleOverlap = (schedA, schedB) => {
  if (!schedA || !schedB) return false;
  const a = parseScheduleToStructured(schedA);
  const b = parseScheduleToStructured(schedB);

  const commonDays = a.days.filter((d) => b.days.includes(d));
  if (commonDays.length === 0) return false;

  const startA = timeToMinutes(a.startTime);
  const endA = timeToMinutes(a.endTime);
  const startB = timeToMinutes(b.startTime);
  const endB = timeToMinutes(b.endTime);

  return startA < endB && startB < endA;
};

/**
 * Find all classes where a teacher has a schedule conflict
 */
export const findTeacherScheduleConflicts = (
  teacherId,
  targetSchedule,
  allClasses = [],
  excludeClassId = null
) => {
  if (!teacherId || !targetSchedule) return [];
  return allClasses.filter((cls) => {
    if (excludeClassId && cls.id === excludeClassId) return false;
    if (cls.teacherId !== teacherId) return false;
    return hasScheduleOverlap(targetSchedule, cls.scheduleData || cls.schedule);
  });
};

/**
 * Find all classes where a student has a timetable conflict
 */
export const findStudentScheduleConflicts = (
  studentId,
  targetSchedule,
  allClasses = [],
  excludeClassId = null
) => {
  if (!studentId || !targetSchedule) return [];
  return allClasses.filter((cls) => {
    if (excludeClassId && cls.id === excludeClassId) return false;
    const inRoster =
      (Array.isArray(cls.studentIds) && cls.studentIds.includes(studentId)) ||
      cls.classId === studentId;
    if (!inRoster) return false;
    return hasScheduleOverlap(targetSchedule, cls.scheduleData || cls.schedule);
  });
};

/**
 * Check if a list of selected class IDs has any timetable conflicts with each other
 * Returns { hasConflict: boolean, conflicts: Array<{ classA, classB, message }> }
 */
export const findScheduleConflictsInClassList = (classIds = [], allClasses = []) => {
  if (!Array.isArray(classIds) || classIds.length < 2) {
    return { hasConflict: false, conflicts: [] };
  }

  const selectedClasses = classIds
    .map((id) => allClasses.find((c) => c.id === id || c.classId === id))
    .filter(Boolean);

  const conflicts = [];
  const seenPair = new Set();

  for (let i = 0; i < selectedClasses.length; i++) {
    for (let j = i + 1; j < selectedClasses.length; j++) {
      const classA = selectedClasses[i];
      const classB = selectedClasses[j];
      const pairKey = [classA.id, classB.id].sort().join('__');

      if (seenPair.has(pairKey)) continue;

      const schedA = classA.scheduleData || classA.schedule;
      const schedB = classB.scheduleData || classB.schedule;

      if (hasScheduleOverlap(schedA, schedB)) {
        seenPair.add(pairKey);
        conflicts.push({
          classA,
          classB,
          message: `Lớp [${classA.id} - ${classA.name}] và [${classB.id} - ${classB.name}] bị trùng khung giờ học online! (${classA.schedule || ''} vs ${classB.schedule || ''})`,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
};
