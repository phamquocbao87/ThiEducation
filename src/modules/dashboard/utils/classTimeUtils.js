/**
 * Utility xác định trạng thái thời gian thực, màu sắc thẻ Card
 * và thuật toán sắp xếp ưu tiên lớp học trên Dashboard:
 * 
 * 1. Mức 1 (Ưu tiên số 1 - Đẩy lên đầu trang): Lớp đang học + CẢNH BÁO ĐỎ (Chưa điểm danh) 🚨
 * 2. Mức 2: Lớp đang học ổn định (Xanh lá 🟢)
 * 3. Mức 3: Lớp hôm nay sắp vào học (Sắp xếp theo giờ bắt đầu sớm nhất)
 * 4. Mức 4: Lớp hôm nay đã kết thúc ca học
 * 5. Mức 5: Lớp chưa học (Chuẩn bị khai giảng hoặc Không có ca hôm nay) -> VIỀN XÁM, xếp theo ngày khai giảng
 */

/**
 * Phân tích chuỗi ngày sang đối tượng Date chuẩn (hỗ trợ DD/MM/YYYY, YYYY-MM-DD, Firestore Timestamp)
 */
export const parseClassDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal?.toDate === 'function') {
    try {
      return dateVal.toDate();
    } catch {
      return null;
    }
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Khớp định dạng DD/MM/YYYY hoặc D/M/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10) - 1;
      const y = parseInt(dmyMatch[3], 10);
      return new Date(y, m, d);
    }
    // Khớp định dạng YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const y = parseInt(ymdMatch[1], 10);
      const m = parseInt(ymdMatch[2], 10) - 1;
      const d = parseInt(ymdMatch[3], 10);
      return new Date(y, m, d);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

/**
 * Trích xuất danh sách các thứ trong tuần (0: CN, 1: T2, 2: T3, ..., 6: T7)
 */
export const parseDaysOfWeek = (scheduleStr = '', scheduleData = null) => {
  if (scheduleData && Array.isArray(scheduleData.days) && scheduleData.days.length > 0) {
    return scheduleData.days.map(Number);
  }

  const str = String(scheduleStr).toLowerCase();
  const days = new Set();

  // Nhận diện cụm lịch học phổ biến
  if (str.includes('2-4-6') || str.includes('246') || str.includes('thứ 2, thứ 4, thứ 6') || str.includes('t2, t4, t6')) {
    days.add(1); days.add(3); days.add(5);
  }
  if (str.includes('3-5-7') || str.includes('357') || str.includes('thứ 3, thứ 5, thứ 7') || str.includes('t3, t5, t7')) {
    days.add(2); days.add(4); days.add(6);
  }
  if (str.includes('t2 đến t6') || str.includes('thứ 2 đến thứ 6') || str.includes('mon to fri')) {
    days.add(1); days.add(2); days.add(3); days.add(4); days.add(5);
  }

  // Quét từng thứ tiếng Việt & tiếng Anh
  if (str.includes('thứ 2') || /\bt2\b/.test(str) || str.includes('mon')) days.add(1);
  if (str.includes('thứ 3') || /\bt3\b/.test(str) || str.includes('tue')) days.add(2);
  if (str.includes('thứ 4') || /\bt4\b/.test(str) || str.includes('wed')) days.add(3);
  if (str.includes('thứ 5') || /\bt5\b/.test(str) || str.includes('thu')) days.add(4);
  if (str.includes('thứ 6') || /\bt6\b/.test(str) || str.includes('fri')) days.add(5);
  if (str.includes('thứ 7') || /\bt7\b/.test(str) || str.includes('sat')) days.add(6);
  if (str.includes('chủ nhật') || /\bcn\b/.test(str) || str.includes('sun')) days.add(0);

  return Array.from(days);
};

/**
 * Kiểm tra toàn diện xem lớp có lịch học trong một ngày cụ thể hay không
 */
export const checkClassDateAndSchedule = (cls = {}, checkDate = new Date()) => {
  const currentDayOfWeek = checkDate.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const startOfCheckDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate(), 0, 0, 0);
  const endOfCheckDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate(), 23, 59, 59);

  // 1. Kiểm tra ngày bắt đầu (startDate)
  let isStarted = true;
  let startDateObj = parseClassDate(cls.startDate);
  if (startDateObj) {
    if (startOfCheckDate < startDateObj) {
      isStarted = false;
    }
  } else if (cls.status === 'Chuẩn bị khai giảng' || cls.status === 'Preparing') {
    isStarted = false;
  }

  // 2. Kiểm tra ngày kết thúc (endDate)
  let isEnded = false;
  let endDateObj = parseClassDate(cls.endDate);
  if (endDateObj) {
    if (endOfCheckDate > endDateObj) {
      isEnded = true;
    }
  } else if (cls.status === 'Completed' || cls.status === 'Đã hoàn thành') {
    isEnded = true;
  }

  // 3. Kiểm tra thứ trong tuần
  const scheduledDays = parseDaysOfWeek(cls.schedule, cls.scheduleData);
  const isScheduledToday = scheduledDays.length > 0 ? scheduledDays.includes(currentDayOfWeek) : true;

  // Lớp hôm nay có buổi học hợp lệ khi: Đã bắt đầu VÀ Chưa kết thúc VÀ Đúng thứ hôm nay
  const isLiveSessionToday = isStarted && !isEnded && isScheduledToday;

  return {
    isStarted,
    isEnded,
    isScheduledToday,
    isLiveSessionToday,
    startDateObj,
    endDateObj,
    scheduledDays,
  };
};

/**
 * Tự động giải quyết trạng thái vận hành theo thời gian thực:
 * - Khi chưa tới ngày bắt đầu (today < startDate) -> 'Chuẩn bị khai giảng'
 * - Khi tới ngày bắt đầu (startDate <= today <= endDate) -> Tự động chuyển 'Đang học ổn định'
 * - Khi đã qua ngày kết thúc (today > endDate) -> 'Đã hoàn thành'
 */
export const resolveEffectiveClassStatus = (cls = {}, checkDate = new Date()) => {
  if (cls.isDeleted || cls.status === 'Deleted' || cls.status === 'Đã xóa') {
    return 'Đã xóa';
  }
  const { isStarted, isEnded } = checkClassDateAndSchedule(cls, checkDate);
  if (!isStarted) {
    return 'Chuẩn bị khai giảng';
  }
  if (isEnded) {
    return 'Đã hoàn thành';
  }
  return cls.operationStatus === 'Tạm hoãn' ? 'Tạm hoãn' : 'Đang học ổn định';
};

/**
 * Trích xuất khung giờ bắt đầu - kết thúc
 */
export const parseClassTimeRange = (scheduleStr = '', scheduleData = null) => {
  let startTime = '18:00';
  let endTime = '19:30';

  if (scheduleData?.startTime && scheduleData?.endTime) {
    startTime = scheduleData.startTime;
    endTime = scheduleData.endTime;
  } else {
    // Regex tìm khung giờ HH:mm - HH:mm
    const match = String(scheduleStr).match(/(\d{1,2}:\d{2})\s*[-–~tođến]+\s*(\d{1,2}:\d{2})/i);
    if (match) {
      startTime = match[1];
      endTime = match[2];
    }
  }

  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);

  return {
    startTime,
    endTime,
    startMinutes: (sH || 18) * 60 + (sM || 0),
    endMinutes: (eH || 19) * 60 + (eM || 30),
  };
};

/**
 * Tính toán trạng thái thời gian thực và cấu hình màu sắc thẻ Card:
 * - Lớp chưa học (chuẩn bị khai giảng, không có ca hôm nay): VIỀN XÁM (#d9d9d9), nền dịu
 * - Lớp đang học chưa điểm danh: VIỀN ĐỎ NHẤP NHÁY (#ff4d4f)
 * - Lớp đang học ổn định: VIỀN XANH LÁ (#52c41a)
 */
export const getClassLiveStatus = (cls = {}, role = 'academic', checkDate = new Date(), session = null) => {
  let { isStarted, isEnded, isScheduledToday, isLiveSessionToday } = checkClassDateAndSchedule(cls, checkDate);
  if (session) {
    // Dashboard timers supply absolute instants so status and countdown agree in every timezone.
    isStarted = true;
    isEnded = false;
    isScheduledToday = true;
    isLiveSessionToday = true;
  }
  const { startTime, endTime, startMinutes, endMinutes } = parseClassTimeRange(cls.schedule, cls.scheduleData);

  const now = checkDate;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Khởi tạo mặc định
  let timeStatus = 'UPCOMING';
  let cardBg = '#ffffff';
  let borderColor = '#d9d9d9'; // Viền màu xám theo yêu cầu
  let pulseClass = '';
  let statusTagColor = 'default';
  let statusLabelVi = 'Chưa vào giờ học';
  let statusLabelEn = 'Upcoming Session';

  // TRƯỜNG HỢP 1: Lớp CHƯA ĐẾN NGÀY KHAI GIẢNG -> VIỀN MÀU XÁM (#d9d9d9)
  if (!isStarted) {
    timeStatus = 'NOT_STARTED';
    cardBg = '#fafafa';
    borderColor = '#d9d9d9'; // VIỀN XÁM
    pulseClass = '';
    statusTagColor = 'default';
    const startStr = cls.startDate ? ` (Bắt đầu: ${cls.startDate})` : '';
    const startStrEn = cls.startDate ? ` (Starts: ${cls.startDate})` : '';
    statusLabelVi = `Chuẩn bị khai giảng${startStr}`;
    statusLabelEn = `Preparing to start${startStrEn}`;
    return {
      timeStatus,
      startTime,
      endTime,
      cardBg,
      borderColor,
      pulseClass,
      statusTagColor,
      statusLabelVi,
      statusLabelEn,
      isLiveSessionToday: false,
    };
  }

  // TRƯỜNG HỢP 2: Lớp ĐÃ KẾT THÚC KHÓA HỌC -> VIỀN MÀU XÁM
  if (isEnded) {
    timeStatus = 'FINISHED_COURSE';
    cardBg = '#fafafa';
    borderColor = '#d9d9d9'; // VIỀN XÁM
    pulseClass = '';
    statusTagColor = 'default';
    statusLabelVi = 'Đã hoàn thành khóa học';
    statusLabelEn = 'Course Completed';
    return {
      timeStatus,
      startTime,
      endTime,
      cardBg,
      borderColor,
      pulseClass,
      statusTagColor,
      statusLabelVi,
      statusLabelEn,
      isLiveSessionToday: false,
    };
  }

  // TRƯỜNG HỢP 3: HÔM NAY KHÔNG PHẢI NGÀY HỌC CỦA LỚP -> VIỀN MÀU XÁM
  if (!isScheduledToday) {
    timeStatus = 'NOT_TODAY';
    cardBg = '#fafafa';
    borderColor = '#d9d9d9'; // VIỀN XÁM
    pulseClass = '';
    statusTagColor = 'default';
    statusLabelVi = 'Không có ca hôm nay';
    statusLabelEn = 'No Session Today';
    return {
      timeStatus,
      startTime,
      endTime,
      cardBg,
      borderColor,
      pulseClass,
      statusTagColor,
      statusLabelVi,
      statusLabelEn,
      isLiveSessionToday: false,
    };
  }

  // TRƯỜNG HỢP 4: HÔM NAY LÀ NGÀY HỌC HỢP LỆ -> SO SÁNH GIỜ THỰC
  if (session ? checkDate.getTime() < session.start : currentMinutes < startMinutes) {
    // Chưa đến giờ học -> VIỀN MÀU XÁM
    timeStatus = 'UPCOMING';
    cardBg = '#fafafa';
    borderColor = '#d9d9d9'; // VIỀN XÁM
    statusTagColor = 'default';
    statusLabelVi = `Chưa vào học (${startTime})`;
    statusLabelEn = `Upcoming (${startTime})`;
  } else if (session ? checkDate.getTime() < session.end : currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    // ĐANG TRONG GIỜ HỌC
    timeStatus = 'IN_PROGRESS';

    const isAttendanceDone =
      cls.checkInStatus === 'CHECKED_IN' ||
      cls.liveAttendance?.checkInStatus === 'CHECKED_IN' ||
      cls.liveAttendance?.teacherCheckIn?.status === 'CHECKED_IN' ||
      cls.attendanceTaken === true ||
      cls.isAttendanceDone === true;

    if (role === 'academic') {
      if (!isAttendanceDone) {
        // VIEW GIÁO VỤ: Lớp ĐANG HỌC THẬT SỰ nhưng CHƯA ĐIỂM DANH -> Viền ĐỎ NHẤP NHÁY
        cardBg = '#fff2f0';
        borderColor = '#ff4d4f';
        pulseClass = 'lak-card-pulse-red';
        statusTagColor = 'error';
        statusLabelVi = '⚠️ ĐANG HỌC — CHƯA ĐIỂM DANH!';
        statusLabelEn = '⚠️ LIVE — ATTENDANCE PENDING!';
      } else {
        cardBg = '#f6ffed';
        borderColor = '#52c41a';
        pulseClass = 'lak-card-pulse-green';
        statusTagColor = 'success';
        statusLabelVi = '🟢 Đang Học Ổn Định';
        statusLabelEn = '🟢 Live In Progress';
      }
    } else if (role === 'teacher') {
      // VIEW GIÁO VIÊN: Lớp ĐANG GIẢNG DẠY THẬT SỰ -> Viền XANH DƯƠNG NHẤP NHÁY
      cardBg = '#e6f4ff';
      borderColor = '#1890ff';
      pulseClass = 'lak-card-pulse-blue';
      statusTagColor = 'processing';
      statusLabelVi = '🚀 Đang Trong Giờ Dạy';
      statusLabelEn = '🚀 Live Teaching Now';
    } else {
      cardBg = '#f6ffed';
      borderColor = '#52c41a';
      statusTagColor = 'success';
      statusLabelVi = '🟢 Đang Diễn Ra';
      statusLabelEn = '🟢 Live In Progress';
    }
  } else {
    // Đã xong ca học -> VIỀN MÀU XÁM
    timeStatus = 'FINISHED';
    cardBg = '#fafafa';
    borderColor = '#d9d9d9'; // VIỀN XÁM
    statusTagColor = 'default';
    statusLabelVi = `Đã xong ca học (${endTime})`;
    statusLabelEn = `Finished (${endTime})`;
  }

  return {
    timeStatus,
    startTime,
    endTime,
    cardBg,
    borderColor,
    pulseClass,
    statusTagColor,
    statusLabelVi,
    statusLabelEn,
    isLiveSessionToday: true,
  };
};

/**
 * Tính điểm ưu tiên sắp xếp cho từng lớp học:
 * - 1000 điểm: Đang học + CẢNH BÁO ĐỎ (Chưa điểm danh) 🚨 -> Ưu tiên cao nhất
 * - 800 điểm: Đang học + Ổn định xanh lá 🟢
 * - 600 - X điểm: Hôm nay sắp vào học (Ca sớm hơn xếp trước)
 * - 400 điểm: Hôm nay đã học xong
 * - 200 điểm: Lớp chuẩn bị khai giảng (Viền xám, xếp theo ngày khai giảng gần nhất)
 * - 100 điểm: Lớp không có ca hôm nay (Viền xám)
 */
export const getClassPriorityScore = (cls = {}, role = 'academic', checkDate = new Date()) => {
  const liveStatus = getClassLiveStatus(cls, role, checkDate);
  const { isLiveSessionToday } = checkClassDateAndSchedule(cls, checkDate);
  const { startMinutes } = parseClassTimeRange(cls.schedule, cls.scheduleData);

  // Mức 1: ĐANG HỌC + CẢNH BÁO ĐỎ (Chưa điểm danh) -> Ưu tiên số 1, luôn nằm đầu tiên!
  if (liveStatus.timeStatus === 'IN_PROGRESS' && liveStatus.pulseClass === 'lak-card-pulse-red') {
    return 1000;
  }

  // Mức 2: ĐANG HỌC + XANH LÁ (Đang học ổn định hoặc Giờ dạy)
  if (liveStatus.timeStatus === 'IN_PROGRESS') {
    return 800;
  }

  // Mức 3: Ca học hôm nay sắp tới (Sắp vào giờ học, ca sớm hơn xếp trước)
  if (isLiveSessionToday && liveStatus.timeStatus === 'UPCOMING') {
    return 600 - (startMinutes / 1440) * 100;
  }

  // Mức 4: Ca học hôm nay đã xong
  if (isLiveSessionToday && liveStatus.timeStatus === 'FINISHED') {
    return 400;
  }

  // Mức 5: Chuẩn bị khai giảng (Chưa đến ngày học, xếp theo ngày bắt đầu gần nhất)
  if (liveStatus.timeStatus === 'NOT_STARTED') {
    const startObj = parseClassDate(cls.startDate);
    const timeDiffDays = startObj ? Math.max(0, Math.ceil((startObj - checkDate) / 86400000)) : 99;
    return 200 - Math.min(50, timeDiffDays);
  }

  // Mức 6: Không có ca hôm nay
  return 100;
};

/**
 * Sắp xếp danh sách lớp học theo thứ tự ưu tiên:
 * Đang học viền đỏ (chưa điểm danh) -> Đang học xanh -> Sắp vào học -> Viền xám
 */
export const sortClassesByLivePriority = (classes = [], role = 'academic', checkDate = new Date()) => {
  return [...classes].sort((a, b) => {
    const scoreA = getClassPriorityScore(a, role, checkDate);
    const scoreB = getClassPriorityScore(b, role, checkDate);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return (a.code || a.id || '').localeCompare(b.code || b.id || '');
  });
};
