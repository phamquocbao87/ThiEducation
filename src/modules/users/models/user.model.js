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
  return isGmailAddress(email) ? ['google', 'password'] : ['password'];
};


