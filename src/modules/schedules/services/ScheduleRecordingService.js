import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 4 (Schedules Module):
 * Session Recording Scoping, Date-Slot Indexing & RBAC Guard for Live Class Schedules
 */
export class ScheduleRecordingService extends BaseModuleService {
  static PLACEHOLDER_RECORDING_URLS = new Set([
    'https://drive.google.com/drive/folders/zoom-recordings',
    '#',
    '',
  ]);

  /**
   * Chuẩn hóa chuỗi ngày ('2026-11-19', '19/11/2026', ISO...) sang khóa chuẩn 'YYYY-MM-DD'
   */
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

  /**
   * Trích xuất ngày học dự phòng từ tiêu đề nếu bản ghi cũ thiếu trường sessionDate
   * Ví dụ: "... (19/11/2026)" -> "2026-11-19"
   */
  static extractIsoDateFromTitle(title = '') {
    if (!title) return '';
    const str = String(title);
    const dmyInParens = str.match(/\((\d{1,2})\/(\d{1,2})\/(\d{4})\)/);
    if (dmyInParens) {
      return `${dmyInParens[3]}-${String(dmyInParens[2]).padStart(2, '0')}-${String(dmyInParens[1]).padStart(2, '0')}`;
    }
    return '';
  }

  /**
   * Kiểm tra quyền Upload / Thay thế / Xoá Recording của một ca dạy trên Live Class Schedules (A3):
   * - Admin, Director, Academic: Toàn quyền trên các lớp.
   * - Teacher: Được quyền trên các lớp do chính giáo viên đó phụ trách.
   * - Student / Accountant: Chỉ xem (false).
   */
  static canManageSlotRecording(currentUser, slotItem) {
    if (!currentUser || !slotItem) return false;
    const role = String(currentUser.role || '').toLowerCase();
    if (['admin', 'director', 'academic'].includes(role)) {
      return true;
    }
    if (role === 'teacher') {
      const uid = String(currentUser.id || currentUser.code || '').trim();
      return Boolean(
        uid &&
          (String(slotItem.teacherId || '').trim() === uid ||
            String(slotItem.teacherCode || '').trim() === uid)
      );
    }
    return false;
  }

  /**
   * Kiểm tra quyền xem Recording của người dùng hiện tại (Bảo vệ cô lập lớp học & ẩn STAFF_ONLY với học viên)
   */
  static canViewSlotRecording(recording, currentUser, slotClassId) {
    if (!recording || recording.isDeleted) return false;
    const cleanUrl = String(recording.url || '').trim();
    if (this.PLACEHOLDER_RECORDING_URLS.has(cleanUrl)) return false;

    const targetClassIds = new Set(
      [
        recording.classId,
        recording.targetId,
        ...(Array.isArray(recording.sharedClassIds) ? recording.sharedClassIds : []),
      ]
        .filter(Boolean)
        .map((id) => String(id).trim())
    );

    if (slotClassId && !targetClassIds.has(String(slotClassId).trim())) {
      return false;
    }

    const role = String(currentUser?.role || 'student').toLowerCase();
    if (role === 'student') {
      if (
        recording.shareScope === 'STAFF_ONLY' ||
        recording.visibility === 'TEACHERS_ONLY' ||
        recording.visibility === 'TEACHER_ONLY'
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Xây dựng bảng băm khóa `${classId}_${isoDate}` -> Danh sách các bản ghi Recording của buổi học đó
   */
  static buildSlotRecordingsMap(allMaterials = [], currentUser = null) {
    const map = new Map();
    if (!Array.isArray(allMaterials) || allMaterials.length === 0) return map;

    allMaterials.forEach((item) => {
      if (!item || item.isDeleted || !item.isSessionRecording) return;
      const cleanUrl = String(item.url || '').trim();
      if (this.PLACEHOLDER_RECORDING_URLS.has(cleanUrl)) return;

      const isoDate =
        this.normalizeIsoDate(item.sessionDate) || this.extractIsoDateFromTitle(item.title);
      if (!isoDate) return;

      const classIds = Array.from(
        new Set(
          [
            item.classId,
            ...(Array.isArray(item.sharedClassIds) ? item.sharedClassIds : []),
          ]
            .filter(Boolean)
            .map((id) => String(id).trim())
        )
      );

      classIds.forEach((cid) => {
        if (!this.canViewSlotRecording(item, currentUser, cid)) return;
        const key = `${cid}_${isoDate}`;
        const existing = map.get(key) || [];
        if (!existing.some((r) => r.id === item.id)) {
          existing.push(item);
        }
        map.set(key, existing);
      });
    });

    // Sắp xếp bản mới tải lên nhất lên đầu trong mỗi buổi học
    map.forEach((list, key) => {
      list.sort(
        (a, b) =>
          new Date(b.uploadedAt || b.updatedAt || 0).getTime() -
          new Date(a.uploadedAt || a.updatedAt || 0).getTime()
      );
      map.set(key, list);
    });

    return map;
  }
}
