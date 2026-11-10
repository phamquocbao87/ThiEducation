/**
 * Taxonomy and Localization Utilities for Curriculum Specs & Staff Roles
 * LAK EDUCATION ERP System
 */

export const POSITION_TAXONOMY = {
  // Academic Staff
  'Điều phối viên giáo vụ': { en: 'Academic Coordinator', vi: 'Điều phối viên giáo vụ' },
  'Điều phối viên giáo vụ & Đào tạo': { en: 'Academic & Operations Coordinator', vi: 'Điều phối viên giáo vụ & Đào tạo' },
  'Trưởng nhóm Giáo vụ': { en: 'Head of Academic Operations', vi: 'Trưởng nhóm Giáo vụ' },
  'Chuyên viên Giáo vụ & Xếp lịch': { en: 'Scheduling & Academic Specialist', vi: 'Chuyên viên Giáo vụ & Xếp lịch' },
  'Giáo vụ Quản lý Chất lượng & CSKH': { en: 'Academic QA & Student Care', vi: 'Giáo vụ Quản lý Chất lượng & CSKH' },

  // Leadership & Administration
  'Giám đốc Điều hành (CEO)': { en: 'Chief Executive Officer (CEO)', vi: 'Giám đốc Điều hành (CEO)' },
  'Trưởng phòng Hạ tầng IT & Bảo mật': { en: 'Head of IT & System Security', vi: 'Trưởng phòng Hạ tầng IT & Bảo mật' },
  'Kế toán tổng hợp & Đối soát học phí': { en: 'General Accountant & Tuition Auditor', vi: 'Kế toán tổng hợp & Đối soát học phí' },

  // Teaching
  'Giáo viên bản xứ': { en: 'Native English Teacher', vi: 'Giáo viên bản xứ' },
  'Giáo viên nước ngoài': { en: 'Foreign Native Teacher', vi: 'Giáo viên nước ngoài' },
};

export const DEPARTMENT_TAXONOMY = {
  'Phòng Đào Tạo': { en: 'Academic Operations Department', vi: 'Phòng Đào Tạo' },
  'Ban Giám Đốc Điều Hành': { en: 'Executive Board', vi: 'Ban Giám Đốc Điều Hành' },
  'Phòng Tài Chính - Kế Toán': { en: 'Finance & Accounting Department', vi: 'Phòng Tài Chính - Kế Toán' },
  'Phòng Quản Trị Hệ Thống IT': { en: 'IT & Systems Administration Department', vi: 'Phòng Quản Trị Hệ Thống IT' },
  'Tổ Giáo Viên Bản Xứ': { en: 'Native Teaching Faculty', vi: 'Tổ Giáo Viên Bản Xứ' },
};

/**
 * Format localized age range and grade level string.
 * Example inputs:
 *  - "7 - 8 tuổi (Lớp 2 Tiểu học)" -> EN: "Ages 7 - 8 (Grade 2 Primary)" | VI: "7 - 8 tuổi (Lớp 2 Tiểu học)"
 *  - "4 - 6 tuổi" -> EN: "Ages 4 - 6" | VI: "4 - 6 tuổi"
 *  - "6 - 7 tuổi (Lớp 1 Tiểu học)" -> EN: "Ages 6 - 7 (Grade 1 Primary)" | VI: "6 - 7 tuổi (Lớp 1 Tiểu học)"
 *  - "11 - 15 tuổi (Lớp 6 - 9)" -> EN: "Ages 11 - 15 (Grades 6 - 9)" | VI: "11 - 15 tuổi (Lớp 6 - 9)"
 */
export const formatLocalizedAgeRange = (rawStr, isEnglish = false) => {
  if (!rawStr) return isEnglish ? 'All Ages' : 'Mọi độ tuổi';
  if (!isEnglish) return rawStr;

  // If already in English
  if (/Ages|years old|Grade/i.test(rawStr)) return rawStr;

  let result = rawStr;
  result = result.replace(/(\d+)\s*-\s*(\d+)\s*tuổi/i, 'Ages $1 - $2');
  result = result.replace(/(\d+)\s*tuổi/i, 'Age $1');

  result = result.replace(/\(Lớp\s*(\d+)\s*Tiểu\s*học\)/gi, '(Grade $1 Primary)');
  result = result.replace(/Lớp\s*(\d+)\s*Tiểu\s*học/gi, 'Grade $1 Primary');
  result = result.replace(/Lớp\s*(\d+\s*-\s*\d+)/gi, 'Grades $1');
  result = result.replace(/Lớp\s*(\d+)/gi, 'Grade $1');

  return result;
};

/**
 * Format localized recommended duration string.
 * Example inputs:
 *  - "6 - 9 tháng (48 - 72 buổi)" -> EN: "6 - 9 months (48 - 72 sessions)" | VI: "6 - 9 tháng (48 - 72 buổi)"
 *  - "9 tháng (72 buổi)" -> EN: "9 months (72 sessions)" | VI: "9 tháng (72 buổi)"
 *  - "6 tháng (48 buổi)" -> EN: "6 months (48 sessions)" | VI: "6 tháng (48 buổi)"
 */
export const formatLocalizedDuration = (rawStr, isEnglish = false) => {
  if (!rawStr) return isEnglish ? 'N/A' : 'Chưa cập nhật';
  if (!isEnglish) return rawStr;

  if (/month|session/i.test(rawStr)) return rawStr;

  let result = rawStr;
  result = result.replace(/(\d+)\s*-\s*(\d+)\s*tháng/gi, '$1 - $2 months');
  result = result.replace(/(\d+)\s*tháng/gi, '$1 months');

  result = result.replace(/(\d+)\s*-\s*(\d+)\s*buổi/gi, '$1 - $2 sessions');
  result = result.replace(/(\d+)\s*buổi/gi, '$1 sessions');

  return result;
};

/**
 * Localize staff position based on standard taxonomy.
 * Preserves custom user input if not found in taxonomy.
 */
export const localizePosition = (position, isEnglish = false) => {
  if (!position) {
    return isEnglish ? 'Academic Coordinator' : 'Điều phối viên giáo vụ';
  }
  const match = POSITION_TAXONOMY[position];
  if (match) {
    return isEnglish ? match.en : match.vi;
  }
  // Check if position was stored in English
  for (const item of Object.values(POSITION_TAXONOMY)) {
    if (item.en.toLowerCase() === position.toLowerCase()) {
      return isEnglish ? item.en : item.vi;
    }
  }
  // Preserve custom user data
  return position;
};

/**
 * Localize department based on standard taxonomy.
 * Preserves custom user input if not found in taxonomy.
 */
export const localizeDepartment = (department, isEnglish = false) => {
  if (!department) {
    return isEnglish ? 'Academic Operations Department' : 'Phòng Đào Tạo';
  }
  const match = DEPARTMENT_TAXONOMY[department];
  if (match) {
    return isEnglish ? match.en : match.vi;
  }
  // Check if department was stored in English
  for (const item of Object.values(DEPARTMENT_TAXONOMY)) {
    if (item.en.toLowerCase() === department.toLowerCase()) {
      return isEnglish ? item.en : item.vi;
    }
  }
  // Preserve custom user data
  return department;
};

