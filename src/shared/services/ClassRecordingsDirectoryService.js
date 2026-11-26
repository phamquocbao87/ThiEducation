import { BaseModuleService } from './BaseModuleService';
import { generateClassSessionDates } from '../utils/classSessionUtils';
import { sortClassesSmartly } from '../utils/scheduleUtils';
import { downloadXlsxFile } from '../utils/xlsxExportUtils';

const PLACEHOLDER_RECORDING_URLS = new Set([
  'https://drive.google.com/drive/folders/zoom-recordings',
  '#',
  '',
]);

/**
 * Shared Service for Master Class Recordings Directory ("File Tổng Recording Của Lớp")
 * Used across both Schedules (/zoom-schedules) and Classroom (/classroom/:classId)
 * without violating module isolation.
 */
export class ClassRecordingsDirectoryService extends BaseModuleService {
  static normalizeIsoDate(rawDate = '') {
    if (!rawDate) return '';
    const str = String(rawDate).trim();
    const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      return `${ymd[1]}-${String(ymd[2]).padStart(2, '0')}-${String(ymd[3]).padStart(2, '0')}`;
    }
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
    }
    const parsed = new Date(str);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  static extractIsoDateFromTitle(title = '') {
    if (!title) return '';
    const dmyInParens = String(title).match(/\((\d{1,2})\/(\d{1,2})\/(\d{4})\)/);
    if (dmyInParens) {
      return `${dmyInParens[3]}-${String(dmyInParens[2]).padStart(2, '0')}-${String(dmyInParens[1]).padStart(2, '0')}`;
    }
    return '';
  }

  static formatIsoToDmy(isoDate = '') {
    const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return isoDate || '';
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  static getScopedClasses(classes = [], currentUser = null) {
    if (!Array.isArray(classes) || !currentUser) return [];
    const active = classes.filter((c) => c && !c.isDeleted && c.status !== 'Deleted');
    const role = String(currentUser.role || '').toLowerCase();

    if (['admin', 'director', 'academic'].includes(role)) {
      return sortClassesSmartly(active);
    }
    if (role === 'teacher') {
      const uid = String(currentUser.id || currentUser.code || '').trim();
      return sortClassesSmartly(active.filter((c) => String(c.teacherId || '').trim() === uid));
    }
    if (role === 'student') {
      const uid = String(currentUser.id || currentUser.code || '').trim();
      const enrolled = new Set([
        ...(Array.isArray(currentUser.enrolledClassIds) ? currentUser.enrolledClassIds : []),
        ...(Array.isArray(currentUser.classesEnrolled) ? currentUser.classesEnrolled : []),
      ].map(String));
      return sortClassesSmartly(
        active.filter(
          (c) =>
            enrolled.has(String(c.id)) ||
            (Array.isArray(c.studentIds) && c.studentIds.map(String).includes(uid))
        )
      );
    }
    return [];
  }

  static canManageClassRecordings(currentUser, cls) {
    if (!currentUser || !cls) return false;
    const role = String(currentUser.role || '').toLowerCase();
    if (['admin', 'director', 'academic'].includes(role)) return true;
    if (role === 'teacher') {
      const uid = String(currentUser.id || currentUser.code || '').trim();
      return Boolean(uid && String(cls.teacherId || '').trim() === uid);
    }
    return false;
  }

  static canViewRecordingForClass(rec, currentUser, classId) {
    if (!rec || rec.isDeleted || !rec.isSessionRecording) return false;
    const cleanUrl = String(rec.url || '').trim();
    if (PLACEHOLDER_RECORDING_URLS.has(cleanUrl)) return false;

    const targetIds = new Set(
      [
        rec.classId,
        rec.targetId,
        ...(Array.isArray(rec.sharedClassIds) ? rec.sharedClassIds : []),
      ]
        .filter(Boolean)
        .map((id) => String(id).trim())
    );
    if (classId && !targetIds.has(String(classId).trim())) return false;

    const role = String(currentUser?.role || 'student').toLowerCase();
    if (role === 'student') {
      if (
        rec.shareScope === 'STAFF_ONLY' ||
        rec.visibility === 'TEACHERS_ONLY' ||
        rec.visibility === 'TEACHER_ONLY'
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Xây dựng bảng tổng hợp Recording của 1 lớp học:
   * - Mặc định (includeMissing = false): Chỉ liệt kê gọn các recordings ĐÃ CÓ của lớp (mới nhất lên đầu).
   * - Khi bật includeMissing = true (dành cho Giáo vụ / Giáo viên): Ghép thêm các buổi đã học trong quá khứ nhưng chưa có video để kiểm soát & upload bù.
   */
  static buildClassRecordingsLedger({
    cls,
    allRecordings = [],
    currentUser = null,
    includeMissing = false,
    isEnglish = false,
    now = Date.now(),
  } = {}) {
    if (!cls?.id) {
      return { rows: [], recordedCount: 0, recordedSessionDatesCount: 0, missingPastSessionsCount: 0 };
    }

    const totalSessions = Number(cls.totalSessions) || Number(cls.courseTotalSessions) || 24;
    const scheduleSessions = generateClassSessionDates(cls, totalSessions, isEnglish);
    const sessionByIso = new Map();
    scheduleSessions.forEach((s) => {
      const iso = this.normalizeIsoDate(s.date);
      if (iso) sessionByIso.set(iso, s);
    });

    const classRecordings = (allRecordings || [])
      .filter((r) => this.canViewRecordingForClass(r, currentUser, cls.id))
      .map((r) => {
        const isoDate = this.normalizeIsoDate(r.sessionDate) || this.extractIsoDateFromTitle(r.title);
        const matchedSession = isoDate ? sessionByIso.get(isoDate) : null;
        return {
          ...r,
          isoDate: isoDate || '',
          dateFormatted: matchedSession?.date || this.formatIsoToDmy(isoDate) || r.sessionDate || '—',
          sessionIndex: matchedSession?.sessionIndex || null,
          dayName: matchedSession?.dayName || '',
          timeRange: matchedSession?.timeRange || cls.schedule || '',
        };
      })
      .sort((a, b) => {
        const dateCmp = String(b.isoDate || '').localeCompare(String(a.isoDate || ''));
        if (dateCmp !== 0) return dateCmp;
        return (
          new Date(b.uploadedAt || b.updatedAt || 0).getTime() -
          new Date(a.uploadedAt || a.updatedAt || 0).getTime()
        );
      });

    const recordedIsoSet = new Set(classRecordings.map((r) => r.isoDate).filter(Boolean));
    const pastScheduledSessions = scheduleSessions.filter((s) => s.endMs <= now);
    const missingSessions = pastScheduledSessions.filter((s) => {
      const iso = this.normalizeIsoDate(s.date);
      return iso && !recordedIsoSet.has(iso);
    });

    const recordedRows = classRecordings.map((rec) => ({
      key: `REC_${rec.id}`,
      rowType: 'RECORDED',
      hasRecording: true,
      recording: rec,
      classId: cls.id,
      className: cls.name,
      isoDate: rec.isoDate,
      dateFormatted: rec.dateFormatted,
      sessionIndex: rec.sessionIndex,
      sessionLabel: rec.sessionIndex
        ? (isEnglish ? `Session ${rec.sessionIndex}` : `Buổi ${rec.sessionIndex}`)
        : (isEnglish ? 'Extra / Makeup' : 'Buổi bổ sung'),
      title: rec.title || `${cls.name} (${rec.dateFormatted})`,
      url: rec.url || '',
      uploadedBy: rec.uploadedBy || rec.authorName || 'LAK Academic',
      uploadedAt: rec.uploadedAt || rec.updatedAt || '',
    }));

    if (!includeMissing) {
      return {
        rows: recordedRows,
        recordedCount: recordedRows.length,
        recordedSessionDatesCount: recordedIsoSet.size,
        missingPastSessionsCount: missingSessions.length,
      };
    }

    const missingRows = missingSessions.map((s) => {
      const iso = this.normalizeIsoDate(s.date);
      return {
        key: `MISSING_${cls.id}_${iso}`,
        rowType: 'MISSING',
        hasRecording: false,
        recording: null,
        classId: cls.id,
        className: cls.name,
        isoDate: iso,
        dateFormatted: s.date,
        sessionIndex: s.sessionIndex,
        sessionLabel: isEnglish ? `Session ${s.sessionIndex}` : `Buổi ${s.sessionIndex}`,
        title: isEnglish ? 'No recording uploaded yet' : 'Chưa tải lên video buổi học',
        url: '',
        uploadedBy: '—',
        uploadedAt: '',
      };
    });

    const combined = [...recordedRows, ...missingRows].sort((a, b) =>
      String(b.isoDate || '').localeCompare(String(a.isoDate || ''))
    );

    return {
      rows: combined,
      recordedCount: recordedRows.length,
      recordedSessionDatesCount: recordedIsoSet.size,
      missingPastSessionsCount: missingSessions.length,
    };
  }

  static exportClassRecordingsXlsx({ cls, rows = [], isEnglish = false } = {}) {
    const classCode = String(cls?.name || cls?.id || 'Class')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32);
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Tong_Hop_Recording_${classCode}_${todayStr}.xlsx`;

    const headers = isEnglish
      ? ['No.', 'Class Name', 'Session', 'Session Date', 'Status', 'Recording Title', 'Video Link', 'Uploaded By']
      : ['STT', 'Lớp Học', 'Buổi Học', 'Ngày Học', 'Trạng Thái', 'Tiêu Đề Bản Ghi Hình', 'Đường Dẫn Video', 'Người Tải Lên'];

    const dataRows = (rows || []).map((r, idx) => [
      idx + 1,
      r.className || cls?.name || '',
      r.sessionLabel || '',
      r.dateFormatted || '',
      r.hasRecording
        ? (isEnglish ? 'Recorded' : 'Đã có video')
        : (isEnglish ? 'Missing' : 'Chưa có video'),
      r.title || '',
      r.url || '',
      r.uploadedBy || '',
    ]);

    return downloadXlsxFile({
      filename,
      sheetName: cls?.id || 'Recordings',
      headers,
      rows: dataRows,
    });
  }
}
