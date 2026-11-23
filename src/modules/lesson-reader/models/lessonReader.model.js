/**
 * Domain Model & Constants for Lesson Reader, Active Reading Timer & Pre-Class Preparation
 * Spec: docs/specs/SPEC_LESSON_READER_QA_AND_CONDUCT_SCORE.md (SPEC-10)
 */

export const PREP_STATUS = {
  PREPARED: 'PREPARED',
  SKIMMED: 'SKIMMED',
  POST_READ: 'POST_READ',
  NOT_STARTED: 'NOT_STARTED',
};

export const NOTE_TAGS = {
  KEY_IDEA: {
    key: 'KEY_IDEA',
    icon: '💡',
    labelVi: 'Ý chính',
    labelEn: 'Key Idea',
    color: 'purple',
    bg: '#faf5ff',
    border: '#d8b4fe',
  },
  VOCAB: {
    key: 'VOCAB',
    icon: '📖',
    labelVi: 'Từ vựng mới',
    labelEn: 'Vocabulary',
    color: 'blue',
    bg: '#eff6ff',
    border: '#93c5fd',
  },
  REVIEW: {
    key: 'REVIEW',
    icon: '⚠️',
    labelVi: 'Cần ôn lại',
    labelEn: 'Review Again',
    color: 'orange',
    bg: '#fff7ed',
    border: '#fdba74',
  },
};

export const QUESTION_STATUS = {
  OPEN: 'OPEN',
  ANSWERED: 'ANSWERED',
};

export const QUESTION_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  CLASS_SHARED: 'CLASS_SHARED',
};

export const COMPACT_PREVIEW_ROWS = {
  DESKTOP: 4,
  MOBILE: 3,
};

export const ACTIVE_TIMER_CONFIG = {
  IDLE_TIMEOUT_MS: 60 * 1000, // 60 giây không tương tác -> Pause (chống treo máy)
  HEARTBEAT_INTERVAL_MS: 30 * 1000, // Đồng bộ Firestore mỗi 30 giây (tối ưu quota)
  MIN_HEARTBEAT_DELTA_SECONDS: 5, // Chỉ ghi heartbeat khi có ít nhất 5 giây mới
  MIN_SCROLL_COVERAGE_PERCENT: 80, // Phải cuộn >= 80% nội dung bài học
  SKIMMED_THRESHOLD_SECONDS: 30, // >= 30s nhưng chưa đủ chuẩn -> SKIMMED
  MIN_DYNAMIC_SECONDS: 90, // Sàn tối thiểu: 90 giây
  MAX_DYNAMIC_SECONDS: 300, // Trần tối đa: 300 giây (5 phút)
  SECONDS_PER_OBJECTIVE: 8, // 8 giây / mục tiêu bài học
};

export const MATERIAL_TIMER_CONFIG = {
  PDF_REQUIRED_SECONDS: 60, // Ngưỡng mặc định 60 giây cho PDF / Slides / Practice / Image / Drive iframe
  MEDIA_REQUIRED_PROGRESS_PERCENT: 60, // Ngưỡng 60% thời lượng thực xem cho HTML5 Video / Audio trực tiếp
  MEDIA_MAX_CAP_SECONDS: 60, // Với video/audio rất dài (> 10 phút), >= 60s thực phát cũng có thể đạt chuẩn nếu >= 60% hoặc đủ mốc
  IFRAME_IDLE_TIMEOUT_MS: 120 * 1000, // 2 phút không tương tác ngoài iframe -> hiện thanh check-in nhẹ
  HEARTBEAT_INTERVAL_MS: 20 * 1000, // Đồng bộ Firestore mỗi 20 giây khi đang xem tài liệu
  MIN_HEARTBEAT_DELTA_SECONDS: 3, // Ghi khi có ít nhất 3 giây mới
};

export const READER_FONT_SIZES = [14, 16, 18, 20];

export const READER_THEMES = {
  light: {
    key: 'light',
    labelVi: 'Sáng',
    labelEn: 'Light',
    icon: '☀️',
    pageBg: '#f8fafc',
    canvasBg: '#ffffff',
    canvasBorder: '#e2e8f0',
    headerBg: '#ffffff',
    headerBorder: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    cardBg: '#faf5ff',
    cardBorder: '#e9d5ff',
    cardAccent: '#7e22ce',
    prepBg: '#f0fdf4',
    prepBorder: '#bbf7d0',
    prepText: '#166534',
    hwBg: '#fff7ed',
    hwBorder: '#fed7aa',
    hwText: '#9a3412',
    sidebarBg: '#ffffff',
  },
  sepia: {
    key: 'sepia',
    labelVi: 'Giấy sách',
    labelEn: 'Sepia',
    icon: '📜',
    pageBg: '#f4ecd8',
    canvasBg: '#faf6ed',
    canvasBorder: '#e5d9be',
    headerBg: '#f7f1e1',
    headerBorder: '#e5d9be',
    textPrimary: '#3b2f2f',
    textSecondary: '#6b5b4b',
    cardBg: '#f4ebd9',
    cardBorder: '#decba8',
    cardAccent: '#7c4a1d',
    prepBg: '#eef5e6',
    prepBorder: '#c5dbb2',
    prepText: '#2c5222',
    hwBg: '#fbf0e1',
    hwBorder: '#e8c9a1',
    hwText: '#854516',
    sidebarBg: '#f7f1e1',
  },
  dark: {
    key: 'dark',
    labelVi: 'Ban đêm',
    labelEn: 'Night',
    icon: '🌙',
    pageBg: '#0b1120',
    canvasBg: '#111827',
    canvasBorder: '#1f2937',
    headerBg: '#0f172a',
    headerBorder: '#1f2937',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    cardBg: '#1e1b4b',
    cardBorder: '#312e81',
    cardAccent: '#c084fc',
    prepBg: '#052e16',
    prepBorder: '#166534',
    prepText: '#86efac',
    hwBg: '#431407',
    hwBorder: '#9a3412',
    hwText: '#fdba74',
    sidebarBg: '#0f172a',
  },
};

/**
 * Công thức ngưỡng động đã chốt với Sếp Bảo:
 * minRequiredSeconds = max(90, min(300, objectivesCount * 8))
 */
export function computeMinRequiredSeconds(objectivesCount = 0) {
  const count = Math.max(0, Number(objectivesCount) || 0);
  return Math.max(
    ACTIVE_TIMER_CONFIG.MIN_DYNAMIC_SECONDS,
    Math.min(ACTIVE_TIMER_CONFIG.MAX_DYNAMIC_SECONDS, count * ACTIVE_TIMER_CONFIG.SECONDS_PER_OBJECTIVE)
  );
}

/**
 * Đánh giá 1 tài liệu đính kèm đã xem đạt chuẩn hay chưa
 * - PDF / Slides / Practice / Image / Drive iframe: activeSeconds >= 60s
 * - HTML5 Video / Audio trực tiếp: mediaProgressPercent >= 60% (hoặc đã xem >= 60s nếu duration > 600s)
 */
export function evaluateMaterialCompletion({
  type = 'PDF',
  activeSeconds = 0,
  mediaProgressPercent = 0,
  mediaDurationSeconds = 0,
  isDirectMedia = false,
}) {
  const sec = Math.max(0, Number(activeSeconds) || 0);
  const pct = Math.max(0, Math.min(100, Number(mediaProgressPercent) || 0));
  const dur = Math.max(0, Number(mediaDurationSeconds) || 0);
  const upperType = String(type || 'PDF').toUpperCase();

  if (isDirectMedia && (upperType === 'VIDEO' || upperType === 'AUDIO')) {
    const reachedPercent = pct >= MATERIAL_TIMER_CONFIG.MEDIA_REQUIRED_PROGRESS_PERCENT;
    const reachedLongCap = dur > 600 && sec >= MATERIAL_TIMER_CONFIG.PDF_REQUIRED_SECONDS;
    const completed = reachedPercent || reachedLongCap;
    const ratio = completed
      ? 1
      : Math.min(0.99, pct / MATERIAL_TIMER_CONFIG.MEDIA_REQUIRED_PROGRESS_PERCENT);
    return {
      completed,
      requiredSeconds: dur > 0 ? Math.min(Math.ceil(dur * 0.6), dur) : MATERIAL_TIMER_CONFIG.PDF_REQUIRED_SECONDS,
      progressPercent: Math.round(ratio * 100),
    };
  }

  const req = MATERIAL_TIMER_CONFIG.PDF_REQUIRED_SECONDS;
  const completed = sec >= req;
  return {
    completed,
    requiredSeconds: req,
    progressPercent: Math.min(100, Math.round((sec / req) * 100)),
  };
}

/**
 * Tổng hợp tiến độ xem toàn bộ tài liệu đính kèm của 1 buổi học
 */
export function summarizeMaterialsProgress(attachedMaterials = [], materialLogs = {}) {
  const list = Array.isArray(attachedMaterials) ? attachedMaterials.filter((m) => m && m.id) : [];
  const logsObj = materialLogs && typeof materialLogs === 'object' ? materialLogs : {};

  let materialActiveSeconds = 0;
  let materialsOpenedCount = 0;
  let materialsCompletedCount = 0;
  let partialRatioSum = 0;

  const items = list.map((mat) => {
    const log = logsObj[String(mat.id)] || null;
    const sec = Number(log?.activeSeconds) || 0;
    const openCount = Number(log?.openCount) || 0;
    const mediaPct = Number(log?.mediaProgressPercent) || 0;
    const mediaDur = Number(log?.mediaDurationSeconds) || 0;
    const isDirect = Boolean(log?.isDirectMedia);

    const evalRes = evaluateMaterialCompletion({
      type: mat.type,
      activeSeconds: sec,
      mediaProgressPercent: mediaPct,
      mediaDurationSeconds: mediaDur,
      isDirectMedia: isDirect,
    });
    const completed = Boolean(log?.completed) || evalRes.completed;

    materialActiveSeconds += sec;
    if (openCount > 0 || sec > 0) materialsOpenedCount += 1;
    if (completed) {
      materialsCompletedCount += 1;
      partialRatioSum += 1;
    } else {
      partialRatioSum += (evalRes.progressPercent || 0) / 100;
    }

    return {
      materialId: String(mat.id),
      title: mat.title || log?.title || 'Learning Material',
      type: mat.type || log?.type || 'PDF',
      pageLocation: mat.pageLocation || log?.pageLocation || '',
      activeSeconds: sec,
      openCount,
      mediaProgressPercent: mediaPct,
      mediaDurationSeconds: mediaDur,
      isDirectMedia: isDirect,
      completed,
      requiredSeconds: evalRes.requiredSeconds,
      progressPercent: completed ? 100 : evalRes.progressPercent,
      lastViewedAt: log?.lastViewedAt || null,
    };
  });

  // Cộng thêm giây từ các materialLogs cũ không còn nằm trong attachedMaterials (bảo toàn lịch sử)
  Object.entries(logsObj).forEach(([mid, log]) => {
    if (!list.some((m) => String(m.id) === String(mid))) {
      materialActiveSeconds += Number(log?.activeSeconds) || 0;
    }
  });

  const materialsTotalCount = list.length;
  const materialRatio = materialsTotalCount > 0 ? partialRatioSum / materialsTotalCount : 1;

  return {
    materialsTotalCount,
    materialsOpenedCount,
    materialsCompletedCount,
    materialActiveSeconds,
    materialRatio,
    allMaterialsCompleted: materialsTotalCount === 0 || materialsCompletedCount >= materialsTotalCount,
    items,
  };
}

/**
 * Tính trạng thái & điểm chuẩn bị bài (prepStatus & prepScore)
 * - Khi giáo án KHÔNG có tài liệu đính kèm (materialsTotalCount === 0): giữ nguyên 100% công thức cũ.
 * - Khi giáo án CÓ tài liệu đính kèm (materialsTotalCount > 0):
 *   + 60% trọng số đọc giáo án + 40% trọng số xem tài liệu đính kèm.
 *   + Đạt PREPARED (100) khi hoàn thành đọc giáo án (đủ thời gian + cuộn >= 80%) VÀ xem đạt chuẩn 100% tài liệu đính kèm.
 */
export function evaluatePrepStatus({
  preClassActiveSeconds = 0,
  postClassActiveSeconds = 0,
  maxScrollPercent = 0,
  minRequiredSeconds = ACTIVE_TIMER_CONFIG.MIN_DYNAMIC_SECONDS,
  materialsTotalCount = 0,
  materialsCompletedCount = 0,
  materialActiveSeconds = 0,
  materialRatio = null,
}) {
  const preSec = Math.max(0, Number(preClassActiveSeconds) || 0);
  const postSec = Math.max(0, Number(postClassActiveSeconds) || 0);
  const scrollPct = Math.max(0, Math.min(100, Number(maxScrollPercent) || 0));
  const reqSec = Math.max(ACTIVE_TIMER_CONFIG.MIN_DYNAMIC_SECONDS, Number(minRequiredSeconds) || 90);
  const totalMats = Math.max(0, Number(materialsTotalCount) || 0);
  const doneMats = Math.max(0, Math.min(totalMats, Number(materialsCompletedCount) || 0));
  const matSec = Math.max(0, Number(materialActiveSeconds) || 0);

  const lessonPreMet = preSec >= reqSec && scrollPct >= ACTIVE_TIMER_CONFIG.MIN_SCROLL_COVERAGE_PERCENT;
  const lessonPostMet = postSec >= reqSec && scrollPct >= ACTIVE_TIMER_CONFIG.MIN_SCROLL_COVERAGE_PERCENT;

  // Trường hợp 1: Giáo án KHÔNG có tài liệu đính kèm -> Giữ nguyên 100% logic cũ
  if (totalMats === 0) {
    if (lessonPreMet) {
      return { prepStatus: PREP_STATUS.PREPARED, prepScore: 100 };
    }
    if (preSec >= ACTIVE_TIMER_CONFIG.SKIMMED_THRESHOLD_SECONDS) {
      return { prepStatus: PREP_STATUS.SKIMMED, prepScore: 50 };
    }
    if (lessonPostMet) {
      return { prepStatus: PREP_STATUS.POST_READ, prepScore: 40 };
    }
    if (preSec + postSec >= ACTIVE_TIMER_CONFIG.SKIMMED_THRESHOLD_SECONDS) {
      return { prepStatus: PREP_STATUS.SKIMMED, prepScore: 30 };
    }
    return { prepStatus: PREP_STATUS.NOT_STARTED, prepScore: 0 };
  }

  // Trường hợp 2: Giáo án CÓ tài liệu đính kèm (60% đọc giáo án + 40% xem tài liệu)
  const effectiveMatRatio =
    materialRatio != null ? Math.max(0, Math.min(1, Number(materialRatio))) : doneMats / totalMats;
  const allMaterialsDone = doneMats >= totalMats;

  if (lessonPreMet && allMaterialsDone) {
    return { prepStatus: PREP_STATUS.PREPARED, prepScore: 100 };
  }

  const lessonRatio = lessonPreMet
    ? 1
    : Math.min(0.95, (Math.min(1, preSec / reqSec) * 0.7 + Math.min(1, scrollPct / 80) * 0.3));

  if (lessonPreMet && !allMaterialsDone) {
    const score = Math.min(95, Math.max(60, Math.round(60 + effectiveMatRatio * 40)));
    return { prepStatus: PREP_STATUS.SKIMMED, prepScore: score };
  }

  if (preSec + matSec >= ACTIVE_TIMER_CONFIG.SKIMMED_THRESHOLD_SECONDS || doneMats > 0) {
    const score = Math.min(85, Math.max(30, Math.round(lessonRatio * 60 + effectiveMatRatio * 40)));
    return { prepStatus: PREP_STATUS.SKIMMED, prepScore: score };
  }

  if (lessonPostMet) {
    const score = Math.round(25 + effectiveMatRatio * 20);
    return { prepStatus: PREP_STATUS.POST_READ, prepScore: score };
  }

  if (preSec + postSec + matSec >= ACTIVE_TIMER_CONFIG.SKIMMED_THRESHOLD_SECONDS) {
    return { prepStatus: PREP_STATUS.SKIMMED, prepScore: 30 };
  }

  return { prepStatus: PREP_STATUS.NOT_STARTED, prepScore: 0 };
}

/**
 * Hiển thị bộ đếm đồng hồ chuẩn MM:SS (VD: 02:15)
 */
export function formatClockDuration(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Hiển thị thời lượng đọc dễ hiểu (VD: 3p 20s / 3m 20s)
 */
export function formatHumanDuration(totalSeconds = 0, isEnglish = false) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (safe < 60) {
    return isEnglish ? `${safe}s` : `${safe} giây`;
  }
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (secs === 0) {
    return isEnglish ? `${mins}m` : `${mins} phút`;
  }
  return isEnglish ? `${mins}m ${secs}s` : `${mins}p ${secs}s`;
}

/**
 * Trả về cấu hình hiển thị Badge trạng thái chuẩn bị bài
 */
export function getPrepStatusMeta(prepStatus, isEnglish = false) {
  switch (prepStatus) {
    case PREP_STATUS.PREPARED:
      return {
        color: 'success',
        bg: '#f0fdf4',
        border: '#86efac',
        textColor: '#15803d',
        icon: '🟢',
        label: isEnglish ? 'Prepared Before Class' : 'Đã chuẩn bị bài tốt',
      };
    case PREP_STATUS.SKIMMED:
      return {
        color: 'warning',
        bg: '#fffbeb',
        border: '#fcd34d',
        textColor: '#b45309',
        icon: '🟡',
        label: isEnglish ? 'Reading In Progress' : 'Đang đọc dở / Xem lướt',
      };
    case PREP_STATUS.POST_READ:
      return {
        color: 'processing',
        bg: '#eff6ff',
        border: '#93c5fd',
        textColor: '#1d4ed8',
        icon: '🔵',
        label: isEnglish ? 'Reviewed After Class' : 'Đã ôn lại sau buổi học',
      };
    default:
      return {
        color: 'default',
        bg: '#f8fafc',
        border: '#cbd5e1',
        textColor: '#475569',
        icon: '⚪',
        label: isEnglish ? 'Not Read Yet' : 'Chưa đọc bài trước giờ học',
      };
  }
}

/**
 * Kiểm tra mục tiêu có phải là tiêu đề phân nhóm (VD: <strong>READING</strong>, WRITING)
 */
export function isObjectiveSectionHeading(rawText = '') {
  const str = String(rawText || '').trim();
  if (/^<(strong|b)[^>]*>[^<]+<\/(strong|b)>$/i.test(str)) return true;
  const plain = str.replace(/<[^>]+>/g, '').trim();
  if (plain.length > 0 && plain.length <= 28 && plain === plain.toUpperCase() && /[A-Z]/.test(plain)) {
    return true;
  }
  return false;
}
