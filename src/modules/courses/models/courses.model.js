/**
 * Domain Model & Enums for Courses & Classes Management
 * Lak Education ERP
 */

/**
 * CỜ BẬT / TẮT CHỨC NĂNG HỌC VIÊN TỰ ĐĂNG KÝ LỚP HỌC TRỰC TUYẾN
 * - true: Cho phép học viên tự nhấn đăng ký vào các lớp học còn chỗ
 * - false: Tạm thời đóng tính năng tự đăng ký trực tuyến, học viên liên hệ Giáo vụ để được xếp lớp
 */
export const IS_STUDENT_ENROLLMENT_ENABLED = false;

export const COURSE_LEVELS = {
  GK: 'GK (Kindergarten)',
  G1: 'Grade 1 (Primary)',
  G2: 'Grade 2 (Primary)',
  G3: 'Grade 3 (Primary)',
  G4: 'Grade 4 (Primary)',
  G5: 'Grade 5 (Primary)',
  IELTS: 'IELTS Intensive',
  COMMUNICATION: 'English Communication',
};

export const COURSE_LEVEL_OPTIONS = [
  { value: 'GK (Kindergarten)', label: 'Wonders GK (Mầm non / Kindergarten)' },
  { value: 'Grade 1 (Primary)', label: 'Wonders G1 (Lớp 1 Tiểu học)' },
  { value: 'Grade 2 (Primary)', label: 'Wonders G2 (Lớp 2 Tiểu học)' },
  { value: 'Grade 3 (Primary)', label: 'Wonders G3 (Lớp 3 Tiểu học)' },
  { value: 'Grade 4 (Primary)', label: 'Wonders G4 (Lớp 4 Tiểu học)' },
  { value: 'Grade 5 (Primary)', label: 'Wonders G5 (Lớp 5 Tiểu học)' },
  { value: 'IELTS Intensive', label: 'IELTS Intensive 6.5+ (Native Teachers)' },
  { value: 'English Communication', label: 'Giao Tiếp Bản Ngữ (Speaking Mastery)' },
];

export const CLASS_OPERATION_STATUS = {
  STABLE: 'Đang học ổn định',
  NEED_SUPPORT: 'Cần trợ giảng hỗ trợ',
  EXAM_WEEK: 'Tuần ôn tập & Thi thử',
  PENDING_START: 'Chuẩn bị khai giảng',
};

export const CLASS_STATUS_COLORS = {
  'Đang học ổn định': 'success',
  'Cần trợ giảng hỗ trợ': 'warning',
  'Tuần ôn tập & Thi thử': 'purple',
  'Chuẩn bị khai giảng': 'cyan',
};

