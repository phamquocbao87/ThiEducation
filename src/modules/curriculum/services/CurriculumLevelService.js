/**
 * CurriculumLevelService — Sub-feature Class for Curriculum Levels Management
 * Extends BaseModuleService to inherit search, filter & validation primitives
 */

import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import {
  LEVEL_STATUS,
  DEFAULT_CURRICULUM_LEVELS,
} from '../models/curriculumLevel.model';

const STORAGE_KEY = 'lak_erp_curriculum_levels';
const VERSION_KEY = 'lak_erp_curriculum_version';
const DELETED_CODES_KEY = 'lak_deleted_curriculum_codes';
const CURRENT_VERSION = 'v2_wonders_g6';

export class CurriculumLevelService extends BaseModuleService {
  /**
   * Đọc danh sách các mã cấp độ đã bị người dùng chủ động xóa
   */
  static getDeletedCodes() {
    try {
      const raw = localStorage.getItem(DELETED_CODES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Đọc danh sách cấp độ giáo trình (kèm khôi phục mặc định nếu rỗng)
   */
  static getAllLevels() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CURRICULUM_LEVELS));
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return [...DEFAULT_CURRICULUM_LEVELS];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CURRICULUM_LEVELS));
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return [...DEFAULT_CURRICULUM_LEVELS];
      }

      // Đọc danh sách các mã đã bị xóa thủ công
      const deletedCodes = this.getDeletedCodes().map((c) => String(c).toUpperCase());

      // Chỉ di chuyển/đồng bộ 1 lần duy nhất cho phiên bản mới (nếu chưa từng di chuyển và chưa bị người dùng xóa)
      const currentVersion = localStorage.getItem(VERSION_KEY);
      if (currentVersion !== CURRENT_VERSION) {
        let hasNewDefaults = false;
        DEFAULT_CURRICULUM_LEVELS.forEach((defLvl) => {
          const upperCode = defLvl.code?.toUpperCase();
          if (!deletedCodes.includes(upperCode) && !parsed.some((item) => item.code?.toUpperCase() === upperCode)) {
            parsed.push(defLvl);
            hasNewDefaults = true;
          }
        });
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        if (hasNewDefaults) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }

      // Đảm bảo không trả về các mục đã bị xóa
      const cleanList = parsed.filter((l) => !deletedCodes.includes(l.code?.toUpperCase()) && !deletedCodes.includes(l.id?.toUpperCase()));

      return cleanList.sort((a, b) => (Number(a.orderIndex) || 99) - (Number(b.orderIndex) || 99));
    } catch (err) {
      console.warn('[CurriculumLevelService] Lỗi đọc storage, trả về mặc định:', err);
      return [...DEFAULT_CURRICULUM_LEVELS];
    }
  }

  /**
   * Lưu mảng danh sách vào storage
   */
  static saveAllLevels(levels) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
      return true;
    } catch (err) {
      console.error('[CurriculumLevelService] Lỗi lưu storage:', err);
      return false;
    }
  }

  /**
   * Lấy chi tiết cấp độ theo ID hoặc Code
   */
  static getLevelById(idOrCode) {
    if (!idOrCode) return null;
    const all = this.getAllLevels();
    const clean = String(idOrCode).trim().toLowerCase();
    return all.find((l) => l.id?.toLowerCase() === clean || l.code?.toLowerCase() === clean) || null;
  }

  /**
   * Thêm cấp độ giáo trình mới
   */
  static createLevel(newLevelData) {
    const all = this.getAllLevels();
    const cleanCode = String(newLevelData.code || '').trim().toUpperCase();

    if (!cleanCode) {
      throw new Error('Mã cấp độ (Code) không được để trống');
    }

    if (all.some((l) => l.code?.toUpperCase() === cleanCode)) {
      throw new Error(`Mã cấp độ "${cleanCode}" đã tồn tại trên hệ thống`);
    }

    const newRecord = {
      id: cleanCode,
      code: cleanCode,
      name: newLevelData.name?.trim() || cleanCode,
      series: newLevelData.series || 'McGraw-Hill Wonders (USA)',
      ageRange: newLevelData.ageRange?.trim() || '6 - 10 tuổi',
      targetBand: newLevelData.targetBand?.trim() || 'A1',
      skillsFocus: Array.isArray(newLevelData.skillsFocus)
        ? newLevelData.skillsFocus
        : String(newLevelData.skillsFocus || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      totalUnits: Number(newLevelData.totalUnits) || 6,
      recommendedDuration: newLevelData.recommendedDuration?.trim() || '9 tháng (72 buổi)',
      orderIndex: Number(newLevelData.orderIndex) || all.length + 1,
      status: newLevelData.status || LEVEL_STATUS.ACTIVE,
      description: newLevelData.description?.trim() || '',
      coverColor: newLevelData.coverColor || '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.push(newRecord);
    this.saveAllLevels(all);
    return newRecord;
  }

  /**
   * Cập nhật thông tin cấp độ giáo trình
   */
  static updateLevel(id, updatedData) {
    const all = this.getAllLevels();
    const idx = all.findIndex((l) => l.id === id || l.code === id);
    if (idx === -1) {
      throw new Error(`Không tìm thấy cấp độ giáo trình với mã: ${id}`);
    }

    const current = all[idx];
    const skills = Array.isArray(updatedData.skillsFocus)
      ? updatedData.skillsFocus
      : typeof updatedData.skillsFocus === 'string'
      ? updatedData.skillsFocus.split(',').map((s) => s.trim()).filter(Boolean)
      : current.skillsFocus;

    const merged = {
      ...current,
      ...updatedData,
      id: current.id, // Bảo toàn ID gốc
      code: updatedData.code ? String(updatedData.code).trim().toUpperCase() : current.code,
      skillsFocus: skills,
      totalUnits: Number(updatedData.totalUnits) || current.totalUnits,
      orderIndex: Number(updatedData.orderIndex) || current.orderIndex,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = merged;
    this.saveAllLevels(all);
    return merged;
  }

  /**
   * Đổi trạng thái Kích hoạt / Tạm ngưng (Quick Toggle Status)
   */
  static toggleLevelStatus(id) {
    const all = this.getAllLevels();
    const target = all.find((l) => l.id === id || l.code === id);
    if (!target) {
      throw new Error(`Không tìm thấy cấp độ với mã: ${id}`);
    }

    target.status = target.status === LEVEL_STATUS.ACTIVE ? LEVEL_STATUS.INACTIVE : LEVEL_STATUS.ACTIVE;
    target.updatedAt = new Date().toISOString();
    this.saveAllLevels(all);
    return target;
  }

  /**
   * Xóa cấp độ giáo trình (lưu danh sách đã xóa để chống khôi phục ngầm)
   */
  static deleteLevel(id) {
    const all = this.getAllLevels();
    const cleanId = String(id || '').trim();
    const target = all.find((l) => l.id === cleanId || l.code === cleanId);
    const filtered = all.filter((l) => l.id !== cleanId && l.code !== cleanId);

    if (filtered.length === all.length) {
      throw new Error(`Không tìm thấy cấp độ giáo trình: ${id}`);
    }

    // Ghi nhớ mã đã bị xóa để không bao giờ tự ý khôi phục lại
    try {
      const deletedCodes = this.getDeletedCodes();
      const codeToAdd = (target?.code || cleanId).toUpperCase();
      if (!deletedCodes.includes(codeToAdd)) {
        deletedCodes.push(codeToAdd);
        localStorage.setItem(DELETED_CODES_KEY, JSON.stringify(deletedCodes));
      }
    } catch (e) {
      console.warn('[CurriculumLevelService] Lỗi ghi nhận mã đã xóa:', e);
    }

    this.saveAllLevels(filtered);
    return true;
  }

  /**
   * Khôi phục toàn bộ danh mục mặc định ban đầu
   */
  static resetToDefaults() {
    try {
      localStorage.removeItem(DELETED_CODES_KEY);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } catch (e) {
      console.warn('[CurriculumLevelService] Lỗi dọn dẹp mã đã xóa:', e);
    }
    this.saveAllLevels(DEFAULT_CURRICULUM_LEVELS);
    return [...DEFAULT_CURRICULUM_LEVELS];
  }
}

