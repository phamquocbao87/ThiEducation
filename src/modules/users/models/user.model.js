/**
 * Domain Models, Schema & Enums for Users & RBAC Module — LAK EDUCATION (lakeducation.com)
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  ACADEMIC: 'academic',
  TEACHER: 'teacher',
  ACCOUNTANT: 'accountant',
  STUDENT: 'student',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DELETED: 'deleted',
  PENDING: 'pending',
};

export const AUDIT_ACTIONS = {
  CREATE_USER: 'CREATE_USER',
  ACTIVATE_USER: 'ACTIVATE_USER',
  DISABLE_USER: 'DISABLE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_REJECTED: 'LOGIN_REJECTED',
};

export const ROLE_LABELS = {
  vi: {
    admin: 'IT Quản Trị Hệ Thống (System Admin)',
    director: 'Giám Đốc Điều Hành (Director)',
    academic: 'Giáo Vụ Đào Tạo (Academic)',
    teacher: 'Giáo Viên Bản Xứ (Teacher)',
    accountant: 'Kế Toán Tài Chính (Accountant)',
    student: 'Học Viên (Student)',
  },
  en: {
    admin: 'IT System Administrator',
    director: 'Executive Director',
    academic: 'Academic Coordinator',
    teacher: 'Native Foreign Teacher',
    accountant: 'Finance & Accountant',
    student: 'Student / Learner',
  },
};

export const ROLE_COLORS = {
  admin: 'red',
  director: 'purple',
  academic: 'cyan',
  teacher: 'blue',
  accountant: 'gold',
  student: 'green',
};

export const STATUS_LABELS = {
  vi: {
    active: 'Đang Hoạt Động',
    disabled: 'Đã Khóa / Vô Hiệu',
    deleted: 'Đã Xóa (Lưu trữ)',
    pending: 'Chờ Kích Hoạt',
  },
  en: {
    active: 'Active',
    disabled: 'Disabled',
    deleted: 'Deleted (Archived)',
    pending: 'Pending',
  },
};

/**
 * Kiểm tra xem một địa chỉ email có phải là tài khoản Gmail hay không
 */
export const isGmailAddress = (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return clean.endsWith('@gmail.com') || clean.endsWith('@googlemail.com');
};

/**
 * Tự động phân loại phương thức đăng nhập theo chuẩn hệ thống:
 * - Email là Gmail: Hỗ trợ cả 2 phương thức ['google', 'password']
 * - Email công vụ / Non-Gmail: CHỈ hỗ trợ mật khẩu ['password']
 */
export const resolveAuthProvidersByEmail = (email) => {
  if (!email) return ['password'];
  return isGmailAddress(email) ? ['google', 'password'] : ['password'];
};

/**
 * Chuẩn hóa số điện thoại: Loại bỏ khoảng trắng, dấu chấm, gạch ngang, ngoặc đơn
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone).trim().replace(/[\s\-\.\(\)]/g, '');
};

/**
 * Nhận diện loại định danh người dùng nhập vào ô Đăng nhập:
 * - 'email': Chứa ký tự '@'
 * - 'phone': Bắt đầu bằng '0' hoặc '+', chứa chữ số (độ dài >= 8)
 * - 'code': Khớp tiền tố ID tài khoản (ADM, DIR, ACA, GV, ACC, HV...)
 * - 'unknown'
 */
export const detectLoginIdentifierType = (input) => {
  if (!input) return 'unknown';
  const clean = String(input).trim();
  if (clean.includes('@')) return 'email';
  const normalizedPhone = normalizePhoneNumber(clean);
  if (/^(\+?84|0)[35789]\d{8}$/.test(normalizedPhone) || /^(\+?\d{8,14})$/.test(normalizedPhone)) {
    return 'phone';
  }
  if (/^(ADM|DIR|ACA|GV|ACC|HV)\d+$/i.test(clean)) {
    return 'code';
  }
  return 'unknown';
};

/**
 * Chuyển đổi Họ và Tên tiếng Việt thành Tên Tiếng Anh (English Name) không dấu chuẩn quốc tế
 * Ví dụ: "Bảo Thư" -> "Bao Thu", "Nguyễn Minh Tuấn" -> "Nguyen Minh Tuan"
 */
export const toEnglishName = (name) => {
  if (!name) return '';
  let text = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  text = text.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return text.trim();
};

/**
 * Tạo mã định danh Cụm Gia Đình chuẩn từ SĐT chính
 * Ví dụ: "0989557230" -> "FAM_0989557230"
 */
export const generateFamilyId = (phone) => {
  const clean = normalizePhoneNumber(phone);
  if (!clean) return '';
  return `FAM_${clean}`;
};

export const TUITION_STATUS = {
  PAID: 'Đã đóng đủ',
  PARTIAL: 'Còn nợ đợt 2',
  PENDING: 'Chờ đối soát',
  UNPAID: 'Chưa hoàn thành',
  SCHOLARSHIP: 'Học bổng / Miễn giảm',
};

export const TUITION_STATUS_CONFIG = {
  'Đã đóng đủ': { color: 'green', labelEn: 'Paid in Full' },
  'Còn nợ đợt 2': { color: 'orange', labelEn: 'Installment 2 Due' },
  'Chờ đối soát': { color: 'gold', labelEn: 'Pending Verification' },
  'Chưa hoàn thành': { color: 'red', labelEn: 'Unpaid / Overdue' },
  'Học bổng / Miễn giảm': { color: 'purple', labelEn: 'Scholarship / Waived' },
};



