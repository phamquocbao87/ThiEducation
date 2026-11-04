import { PermissionService } from '../../core/services/PermissionService';

/**
 * Common Base Class for all Module Sub-Feature Services in ThiEducation
 * Provides reusable data scoping (6 Roles), multi-field search, filtering, and ID generation.
 */
export class BaseModuleService {
  /**
   * Automatically scopes records based on the logged-in user's Role:
   * - teacher: Only sees records matching their teacherId or teacherName
   * - student: Only sees records matching their studentId or enrolled classId
   * - admin / director / academic / accountant: Sees all records
   */
  static scopeByRole(records, currentUser, options = {}) {
    if (!Array.isArray(records) || !currentUser) return [];

    const {
      teacherIdField = 'teacherId',
      teacherNameField = 'teacherName',
      studentIdField = 'id',
      classIdField = 'classId',
    } = options;

    if (currentUser.role === PermissionService.ROLES.TEACHER) {
      return records.filter((item) => {
        const matchId = item[teacherIdField] && item[teacherIdField] === currentUser.id;
        const matchName =
          item[teacherNameField] &&
          item[teacherNameField].toLowerCase().includes(currentUser.name.toLowerCase());
        return matchId || matchName;
      });
    }

    if (currentUser.role === PermissionService.ROLES.STUDENT) {
      return records.filter((item) => {
        if (item[studentIdField] === currentUser.id || item.studentId === currentUser.id) {
          return true;
        }
        if (currentUser.classId && item[classIdField] === currentUser.classId) {
          return true;
        }
        if (currentUser.classCode && item.className && item.className.includes(currentUser.classCode)) {
          return true;
        }
        return false;
      });
    }

    return records;
  }

  /**
   * Case-insensitive keyword search across multiple fields
   */
  static searchByKeyword(records, keyword, fields = []) {
    if (!keyword || !keyword.trim()) return records;
    const normalized = keyword.trim().toLowerCase();
    return records.filter((item) =>
      fields.some((field) =>
        String(item[field] || '')
          .toLowerCase()
          .includes(normalized)
      )
    );
  }

  /**
   * Filter records by a specific field value ('ALL' returns unfiltered)
   */
  static filterByField(records, filterValue, fieldName) {
    if (!filterValue || filterValue === 'ALL') return records;
    return records.filter((item) => item[fieldName] === filterValue);
  }

  /**
   * Generate standardized sequential ERP ID
   */
  static generateId(prefix, currentList = []) {
    const nextNumber = String(currentList.length + 1).padStart(2, '0');
    return `${prefix}-${nextNumber}`;
  }
}

