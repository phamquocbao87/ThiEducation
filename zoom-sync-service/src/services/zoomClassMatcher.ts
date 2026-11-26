import { ZoomOAuthClient } from '../clients/zoomOAuthClient';

const PLACEHOLDER_MEETING_IDS = new Set([
  '888999111',
  '888999101',
  '888999105',
  '000000000',
  '123456789',
]);

export function normalizeZoomMeetingId(raw?: string | number | null): string {
  if (raw === undefined || raw === null) return '';
  const str = String(raw);
  // Extract from URL if full URL was passed
  const urlMatch = str.match(/zoom\.us\/[js]\/(\d{9,12})/i);
  const digits = urlMatch ? urlMatch[1] : str.replace(/\D/g, '');
  if (!digits || digits.length < 9 || PLACEHOLDER_MEETING_IDS.has(digits)) {
    return '';
  }
  return digits;
}

export function formatZoomMeetingIdPretty(digits: string): string {
  const clean = normalizeZoomMeetingId(digits);
  if (clean.length === 11) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return clean;
}

/**
 * Chuyển chuỗi thời gian UTC của Zoom sang ngày chuẩn Việt Nam (UTC+7) 'YYYY-MM-DD'
 */
export function toVietnamDateParts(utcIso?: string | null) {
  const base = utcIso ? new Date(utcIso) : new Date();
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  // Cộng +7 giờ sang UTC+7 rồi đọc theo getUTC* để không phụ thuộc timezone máy chủ US
  const vnMs = safe.getTime() + 7 * 3600 * 1000;
  const vn = new Date(vnMs);
  const year = vn.getUTCFullYear();
  const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vn.getUTCDate()).padStart(2, '0');
  const hours = vn.getUTCHours();
  const minutes = vn.getUTCMinutes();
  const jsDayOfWeek = vn.getUTCDay(); // 0=Sun..6=Sat

  return {
    isoDate: `${year}-${month}-${day}`,
    dmyDate: `${day}/${month}/${year}`,
    timeHm: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    minutesOfDay: hours * 60 + minutes,
    jsDayOfWeek,
  };
}

export function parseHmToMinutes(hm?: string | null): number | null {
  if (!hm) return null;
  const m = String(hm).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function extractClassCodeTokens(name = ''): string[] {
  const matches = String(name).toUpperCase().match(/\b(WP\d{2}|HS\d{2}|LH\d{3}|G[1-6])\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export interface ZoomMappingSuggestion {
  classId: string;
  className: string;
  teacherName: string;
  schedule: string;
  studentCount: number;
  currentMeetingId: string;
  isAlreadyLinked: boolean;
  zoomConfig: any | null;
  suggestedRoom: any | null;
  confidenceScore: number;
  matchReasons: string[];
  candidateRooms: Array<{
    roomId: string;
    topic: string;
    hostEmail: string;
    autoRecording: string;
    score: number;
    reasons: string[];
  }>;
}

/**
 * Yêu cầu #2: Chấm điểm gợi ý Mapping thông minh (0 - 100%) giữa Lớp LAK Active và Phòng Zoom
 */
export function computeMappingSuggestions(lakClasses: any[], zoomRooms: any[]): ZoomMappingSuggestion[] {
  const activeClasses = (lakClasses || []).filter(
    (c) => c && !c.isDeleted && c.status !== 'Deleted'
  );

  return activeClasses.map((cls) => {
    const existingZoomId =
      normalizeZoomMeetingId(cls.zoomConfig?.zoomMeetingId) ||
      normalizeZoomMeetingId(cls.meetingId) ||
      normalizeZoomMeetingId(cls.zoomStudentLink) ||
      normalizeZoomMeetingId(cls.meetingLink);

    const classTokens = extractClassCodeTokens(cls.name || '');
    const classDays: number[] = Array.isArray(cls.scheduleData?.days) ? cls.scheduleData.days : [];
    const classStartMin = parseHmToMinutes(cls.scheduleData?.startTime);

    const scoredCandidates = (zoomRooms || [])
      .filter((r) => r.type === 8 || r.type === 3 || r.type === 2)
      .map((room) => {
        let score = 0;
        const reasons: string[] = [];
        const roomDigits = normalizeZoomMeetingId(room.id);

        if (existingZoomId && roomDigits === existingZoomId) {
          score += 60;
          reasons.push(`Khớp chính xác Meeting ID (${formatZoomMeetingIdPretty(roomDigits)})`);
        }

        const roomTokens = extractClassCodeTokens(room.topic || '');
        const sharedCodes = classTokens.filter((t) => t.startsWith('WP') || t.startsWith('HS')).filter((t) => roomTokens.includes(t));
        if (sharedCodes.length > 0) {
          score += 20;
          reasons.push(`Khớp mã lớp ${sharedCodes.join(', ')} trong tiêu đề Zoom`);
        } else if (
          cls.name &&
          room.topic &&
          String(cls.name).trim().toLowerCase() === String(room.topic).trim().toLowerCase()
        ) {
          score += 20;
          reasons.push('Trùng khớp 100% tên lớp & chủ đề phòng Zoom');
        }

        // So khớp thứ trong tuần (Zoom weekly_days: 1=CN..7=T7 -> trừ 1 ra JS 0..6)
        if (room.recurrence?.weekly_days && classDays.length > 0) {
          const zoomJsDays = String(room.recurrence.weekly_days)
            .split(',')
            .map((x: string) => Number(x.trim()) - 1)
            .filter((n: number) => !Number.isNaN(n));
          const sameDays =
            zoomJsDays.length === classDays.length &&
            classDays.every((d) => zoomJsDays.includes(d));
          if (sameDays) {
            score += 10;
            reasons.push('Trùng khớp các thứ học hàng tuần');
          }
        }

        // So khớp khung giờ bắt đầu (±30 phút)
        if (room.nextOccurrence?.start_time && classStartMin !== null) {
          const occParts = toVietnamDateParts(room.nextOccurrence.start_time);
          if (Math.abs(occParts.minutesOfDay - classStartMin) <= 30) {
            score += 10;
            reasons.push(`Trùng khung giờ dạy (${occParts.timeHm})`);
          }
        }

        return {
          room,
          roomId: roomDigits,
          topic: room.topic,
          hostEmail: room.hostEmail,
          autoRecording: room.autoRecording,
          score: Math.min(100, score),
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = scoredCandidates[0] && scoredCandidates[0].score > 0 ? scoredCandidates[0] : null;

    return {
      classId: cls.id,
      className: cls.name || cls.id,
      teacherName: cls.teacherName || 'Chưa phân công',
      schedule: cls.schedule || '',
      studentCount: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,
      currentMeetingId: existingZoomId ? formatZoomMeetingIdPretty(existingZoomId) : (cls.meetingId || ''),
      isAlreadyLinked: Boolean(cls.zoomConfig?.isLinked && existingZoomId),
      zoomConfig: cls.zoomConfig || null,
      suggestedRoom: best ? best.room : null,
      confidenceScore: best ? best.score : 0,
      matchReasons: best ? best.reasons : [],
      candidateRooms: scoredCandidates.map(({ room: _r, ...rest }) => rest),
    };
  });
}

/**
 * Định tuyến 4 Chốt Chặn (4-Gate Deterministic Class Matcher) cho Webhook & Backfill
 */
export function matchZoomEventToLakClass(
  zoomMeetingId: string | number,
  topic: string,
  startTimeUtc: string | undefined,
  lakClasses: any[]
): {
  matchedClass: any | null;
  confidence: number;
  sessionDate: string;
  dmyDate: string;
  vnTimeHm: string;
  reason: string;
} {
  const digits = normalizeZoomMeetingId(zoomMeetingId);
  const vnParts = toVietnamDateParts(startTimeUtc);

  // Chốt 0: Loại trừ 100% lớp Deleted
  const activeClasses = (lakClasses || []).filter(
    (c) => c && !c.isDeleted && c.status !== 'Deleted'
  );

  // Chốt 1: Khớp theo Meeting ID chuẩn
  const byMeetingId = digits
    ? activeClasses.filter((c) => {
        const cid =
          normalizeZoomMeetingId(c.zoomConfig?.zoomMeetingId) ||
          normalizeZoomMeetingId(c.meetingId) ||
          normalizeZoomMeetingId(c.zoomStudentLink) ||
          normalizeZoomMeetingId(c.meetingLink);
        return cid === digits;
      })
    : [];

  if (byMeetingId.length === 1) {
    return {
      matchedClass: byMeetingId[0],
      confidence: 100,
      sessionDate: vnParts.isoDate,
      dmyDate: vnParts.dmyDate,
      vnTimeHm: vnParts.timeHm,
      reason: `EXACT_MEETING_ID:${digits}`,
    };
  }

  // Chốt 2: Nếu 2 lớp dùng chung 1 phòng PMI -> phân biệt bằng Mã Lớp trong Topic hoặc Thứ/Giờ dạy
  const pool = byMeetingId.length > 1 ? byMeetingId : [];
  if (pool.length > 1) {
    const topicTokens = extractClassCodeTokens(topic);
    const byTopic = pool.filter((c) => {
      const cTokens = extractClassCodeTokens(c.name || '');
      return cTokens.some((t) => (t.startsWith('WP') || t.startsWith('HS')) && topicTokens.includes(t));
    });
    if (byTopic.length === 1) {
      return {
        matchedClass: byTopic[0],
        confidence: 95,
        sessionDate: vnParts.isoDate,
        dmyDate: vnParts.dmyDate,
        vnTimeHm: vnParts.timeHm,
        reason: 'SHARED_ROOM_RESOLVED_BY_TOPIC_CODE',
      };
    }

    const byDay = pool.filter((c) =>
      Array.isArray(c.scheduleData?.days) && c.scheduleData.days.includes(vnParts.jsDayOfWeek)
    );
    if (byDay.length === 1) {
      return {
        matchedClass: byDay[0],
        confidence: 90,
        sessionDate: vnParts.isoDate,
        dmyDate: vnParts.dmyDate,
        vnTimeHm: vnParts.timeHm,
        reason: 'SHARED_ROOM_RESOLVED_BY_WEEKDAY',
      };
    }
  }

  // Chốt 3: Mơ hồ (< 100% độ tin cậy) -> Cách ly vào UNASSIGNED, tuyệt đối không đoán mò gắn nhầm lớp!
  return {
    matchedClass: null,
    confidence: 0,
    sessionDate: vnParts.isoDate,
    dmyDate: vnParts.dmyDate,
    vnTimeHm: vnParts.timeHm,
    reason: 'UNASSIGNED_AMBIGUOUS_OR_UNLINKED_ROOM',
  };
}

/**
 * Yêu cầu #1: Tự động tạo phòng Zoom định kỳ (type=8, auto_recording="cloud") khi tạo lớp mới trên LAK
 */
export async function provisionRecurringZoomRoomForClass(params: {
  className: string;
  courseName?: string;
  teacherName?: string;
  startDateDmy?: string;
  totalSessions?: number;
  scheduleData?: {
    days?: number[];
    startTime?: string;
    endTime?: string;
  };
  passcode?: string;
}) {
  const jsDays =
    Array.isArray(params.scheduleData?.days) && params.scheduleData!.days!.length > 0
      ? params.scheduleData!.days!
      : [1, 3, 5];

  // Bẫy #3: Quy đổi JS Day (0=CN..6=T7) sang Zoom weekly_days (1=CN..7=T7)
  const weeklyDaysZoom = jsDays
    .map((d) => Number(d) + 1)
    .filter((d) => d >= 1 && d <= 7)
    .sort((a, b) => a - b)
    .join(',');

  const startMin = parseHmToMinutes(params.scheduleData?.startTime) ?? 19 * 60 + 20;
  const endMin = parseHmToMinutes(params.scheduleData?.endTime) ?? startMin + 120;
  const durationMinutes = Math.max(15, endMin > startMin ? endMin - startMin : 120);

  const startH = String(Math.floor(startMin / 60)).padStart(2, '0');
  const startM = String(startMin % 60).padStart(2, '0');
  const endH = String(Math.floor((startMin + durationMinutes) / 60) % 24).padStart(2, '0');
  const endM = String((startMin + durationMinutes) % 60).padStart(2, '0');

  // Kiểm tra đụng độ khung giờ với các phòng định kỳ đang có sẵn trên cùng tài khoản Host Zoom
  const overlappingZoomRooms: Array<{ id: string; topic: string; timeRange: string }> = [];
  try {
    const existingAccount = await ZoomOAuthClient.listAllAccountRooms();
    const reqZoomDays = new Set(weeklyDaysZoom.split(',').filter(Boolean));

    for (const rm of existingAccount.rooms || []) {
      const rmDaysStr = String(rm.recurrence?.weekly_days || rm.weeklyDays || '');
      let dayOverlap = false;
      if (rmDaysStr) {
        dayOverlap = rmDaysStr.split(',').some((d: string) => reqZoomDays.has(d.trim()));
      } else {
        const topicStr = String(rm.topic || '');
        if (topicStr.includes('246') && [2, 4, 6].some((d) => reqZoomDays.has(String(d)))) {
          dayOverlap = true;
        }
        if (topicStr.includes('357') && [3, 5, 7].some((d) => reqZoomDays.has(String(d)))) {
          dayOverlap = true;
        }
      }

      if (!dayOverlap) continue;

      let rmStartMin: number | null = null;
      let rmEndMin: number | null = null;
      const rawStartIso = rm.nextOccurrence?.start_time || rm.startTime;
      const rawDur = Number(rm.nextOccurrence?.duration || rm.duration) || 120;

      if (rawStartIso) {
        const vnRm = toVietnamDateParts(rawStartIso);
        rmStartMin = vnRm.minutesOfDay;
        rmEndMin = rmStartMin + rawDur;
      } else {
        const tmMatch = String(rm.topic || '').match(
          /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i
        );
        if (tmMatch) {
          let h1 = Number(tmMatch[1]);
          const m1 = Number(tmMatch[2]);
          let h2 = Number(tmMatch[3]);
          const m2 = Number(tmMatch[4]);
          const ampm = (tmMatch[5] || '').toLowerCase();
          if (ampm === 'pm') {
            if (h1 < 12) h1 += 12;
            if (h2 < 12) h2 += 12;
          }
          rmStartMin = h1 * 60 + m1;
          rmEndMin = h2 * 60 + m2;
        }
      }

      if (rmStartMin !== null && rmEndMin !== null) {
        const isTimeOverlap = startMin < rmEndMin && startMin + durationMinutes > rmStartMin;
        if (isTimeOverlap) {
          const rSH = String(Math.floor(rmStartMin / 60)).padStart(2, '0');
          const rSM = String(rmStartMin % 60).padStart(2, '0');
          const rEH = String(Math.floor(rmEndMin / 60) % 24).padStart(2, '0');
          const rEM = String(rmEndMin % 60).padStart(2, '0');
          overlappingZoomRooms.push({
            id: String(rm.id),
            topic: rm.topic || 'Zoom Room',
            timeRange: `${rSH}:${rSM} - ${rEH}:${rEM}`,
          });
        }
      }
    }
  } catch {
    // Không chặn việc tạo phòng nếu bước quét cảnh báo gặp lỗi mạng tạm thời
  }

  // Parse DD/MM/YYYY hoặc YYYY-MM-DD cho ngày bắt đầu
  let ymd = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const rawDate = String(params.startDateDmy || '').trim();
  const dmyMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const ymdMatch = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dmyMatch) {
    ymd = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  } else if (ymdMatch) {
    ymd = `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }

  // Nếu startDate ở quá khứ, dịch sang ngày hôm nay theo giờ VN để Zoom tạo chuỗi tương lai hợp lệ
  const todayVn = toVietnamDateParts().isoDate;
  const effectiveStartYmd = ymd < todayVn ? todayVn : ymd;

  // Giữ chuẩn xác 1:1 tổng số buổi học mà người dùng nhập (1 - 60 buổi, mặc định 12)
  const endTimes = Math.min(Math.max(Number(params.totalSessions) || 12, 1), 60);

  const agendaParts = [
    params.courseName ? `Khóa học: ${params.courseName}` : '',
    params.teacherName ? `Giáo viên: ${params.teacherName}` : '',
    `Khung giờ: ${startH}:${startM} - ${endH}:${endM} (GMT+7)`,
    params.startDateDmy ? `Khai giảng: ${params.startDateDmy}` : '',
    `Tổng số buổi: ${endTimes}`,
  ].filter(Boolean);

  const zoomBody = {
    topic: params.className.slice(0, 190),
    agenda: agendaParts.join(' | ').slice(0, 1900),
    type: 8, // Recurring meeting with fixed time
    start_time: `${effectiveStartYmd}T${startH}:${startM}:00`,
    duration: durationMinutes,
    timezone: 'Asia/Bangkok',
    password: (params.passcode || '123456').slice(0, 10),
    recurrence: {
      type: 2, // Weekly
      repeat_interval: 1,
      weekly_days: weeklyDaysZoom || '2,4,6',
      end_times: endTimes,
    },
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      jbh_time: 0,
      mute_upon_entry: true,
      waiting_room: false,
      auto_recording: 'cloud', // KHÓA CỨNG GHI HÌNH CLOUD 100% NGAY TỪ LÚC TẠO PHÒNG!
      audio: 'both',
    },
  };

  const created = await ZoomOAuthClient.request<any>('/users/me/meetings', {
    method: 'POST',
    body: JSON.stringify(zoomBody),
  });

  const cleanDigits = normalizeZoomMeetingId(created.id);
  const prettyId = formatZoomMeetingIdPretty(cleanDigits);

  return {
    zoomMeetingId: cleanDigits,
    prettyMeetingId: prettyId,
    topic: created.topic,
    agenda: created.agenda || zoomBody.agenda,
    startTime: created.start_time || zoomBody.start_time,
    timezone: created.timezone || 'Asia/Bangkok',
    joinUrl: created.join_url,
    hostUrl: created.join_url,
    passcode: created.password || params.passcode || '123456',
    autoRecording: created.settings?.auto_recording || 'cloud',
    weeklyDaysZoom,
    durationMinutes,
    endTimes,
    occurrencesCount: Array.isArray(created.occurrences) ? created.occurrences.length : endTimes,
    firstOccurrenceStart: created.occurrences?.[0]?.start_time || null,
    lastOccurrenceStart:
      Array.isArray(created.occurrences) && created.occurrences.length > 0
        ? created.occurrences[created.occurrences.length - 1]?.start_time
        : null,
    hostEmail: created.host_email || 'lakvietnam@lakeducation.com',
    overlappingZoomRooms,
  };
}
