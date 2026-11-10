import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en';
import viTranslation from './locales/vi';

export const STORAGE_LANG_KEY = 'lak_app_language';
export const DEFAULT_LANGUAGE = 'en'; // Mặc định là Tiếng Anh (English)

/**
 * Từ điển đối chiếu 2 chiều (Bi-directional UI Label Dictionary)
 * Chỉ áp dụng cho các Label giao diện (Menu, Header, Table Column, Card Title, Button, Status Badge, Form Label).
 * Dữ liệu người dùng nhập vào (Tên HV, Tên GV, Tên khóa học, Mã lớp, Email, SĐT, Ghi chú...) được giữ nguyên 100%.
 */
export const VI_TO_EN_UI_LABELS = {
  // 1. Sidebar & Navigation Menus
  'Tổng Quan (Dashboard)': 'Dashboard Overview',
  'Hợp Đồng & Bảng Lương': 'Contracts & Payroll',
  'Khóa Học & Thời Khóa Biểu': 'Courses & Schedule',
  'Lớp Học, Hồ Sơ & Đánh Giá': 'Classes, Profiles & Evaluation',
  'Quản Lý Đóng Học Phí': 'Tuition & Billing',

  // 2. Roles & Header Controls
  'IT Quản Trị Hệ Thống (System Admin)': 'IT System Administrator',
  'Giám Đốc Điều Hành (Director)': 'Executive Director',
  'Giáo Vụ Đào Tạo (Academic)': 'Academic Coordinator',
  'Trưởng bộ phận Giáo vụ': 'Head of Academic Affairs',
  'Giáo vụ ca Tối & Cuối tuần': 'Evening & Weekend Academic Coordinator',
  'Giáo vụ CSKH & Học phí': 'Student Care & Tuition Coordinator',
  'Giáo Viên Bản Xứ (Native Teacher)': 'Native Foreign Teacher',
  'Kế Toán Tài Chính (Accountant)': 'Finance & Payroll Accountant',
  'Học Viên (Student)': 'Student / Learner',
  'Admin Xem Dưới Tên User: ': 'Admin View-As: ',
  'Thoát xem hộ → Về IT Admin': 'Exit View-As → Back to IT Admin',
  'Đổi sang tài khoản khác': 'Switch to another account',
  'Quay về màn hình IT Admin': 'Return to IT Admin View',
  'Đang xem': 'Currently Viewing',
  'Xem màn hình này': 'View This Screen',
  'Tất cả 6 Vai trò (Roles)': 'All 6 System Roles',
  '🛠️ IT Admin (Quản trị hệ thống)': '🛠️ IT Admin (System Administrator)',
  '👑 Director (Giám đốc điều hành)': '👑 Director (Executive Director)',
  '🎓 Giáo vụ (Academic Staff)': '🎓 Academic Coordinator (Staff)',
  '🌎 Giáo viên bản xứ (Teachers)': '🌎 Foreign / Native Teachers',
  '💰 Kế toán (Accountant)': '💰 Finance & Accountant',
  '🧑‍🎓 Học viên (Students)': '🧑‍🎓 Students / Learners',

  // 3. Dashboard Labels & Table Headers
  'Uptime Hệ Thống': 'System Uptime',
  'Tải CPU & RAM': 'CPU & Memory Load',
  'Mở Thư Mục Gốc Dự Án Trên Drive →': 'Open Project Root Folder on Drive →',
  'Cơ Chế Sao Lưu (Backup) & Cắt Dữ Liệu Năm Cũ Theo Yêu Cầu (On-Demand Year Cut-off)':
    'On-Demand Database Backup & Yearly Data Cut-off Archive',
  'Tải Trọn Bộ Thư Mục Gốc Trên Google Drive': 'Download Full Root Folder on Google Drive',
  '1. Backup Toàn Bộ Database Hiện Tại Lên Drive': '1. Backup Full Current Database to Google Drive',
  '2. Chọn năm cần cắt dữ liệu:': '2. Select Year to Cut-off & Archive:',
  'Dữ liệu năm 2024': 'Year 2024 Data',
  'Dữ liệu năm 2025': 'Year 2025 Data',
  'Dữ liệu năm 2026': 'Year 2026 Data',
  'Tải File JSON': 'Download JSON',
  'Xem trên Drive': 'View on Drive',
  'Đường Dẫn Thư Mục Con Trên Google Drive': 'Google Drive Subfolder Path',
  'Mục Đích Lưu Trữ & Phân Loại File': 'Storage Purpose & File Category',
  'Truy Cập Nhanh': 'Quick Access',
  'Mở Thư Mục Drive': 'Open Drive Folder',
  'Trạng Thái Sức Khỏe Hạ Tầng & Dịch Vụ (System Health Check)':
    'Infrastructure & Cloud Services Health Check',
  'Quét Sức Khỏe Hệ Thống': 'Run System Diagnostics',
  'Mã Dịch Vụ': 'Service ID',
  'Hạ Tầng / Dịch Vụ Kết Nối': 'Infrastructure / Connected Service',
  'Trạng Thái': 'Status',
  'Độ Trễ': 'Latency',
  'Kiểm Tra Gần Nhất': 'Last Checked',
  'Tổng Học Viên & Lớp Học': 'Total Students & Active Classes',
  'Đội Ngũ GV & Giáo Vụ': 'Foreign Teachers & Academic Staff',
  'Thu Học Phí Tháng Này': 'Monthly Tuition Collected',
  'Tổng Chi Lương (GV & Giáo Vụ)': 'Total Monthly Payroll (Teachers & Staff)',
  'Danh Mục Khóa Học & Tình Trạng Vận Hành Các Lớp': 'Course Catalog & Class Operations Status',
  'Quản Lý Khóa Học & TKB': 'Manage Courses & Schedule',
  'Giám Sát Lớp Học & Điểm Danh': 'Monitor Classes & Attendance',
  'Mã KH': 'Course ID',
  'Tên Khóa Học': 'Course Name',
  'Trình Độ': 'Proficiency Level',
  'Số Lớp Đang Mở': 'Active Classes',
  'Học Viên': 'Student',
  'Học Phí / Tháng': 'Monthly Tuition Fee',
  'Hoạt Động Vận Hành & Bảng Lương Đội Ngũ Nhân Viên Giáo Vụ':
    'Academic Operations & Staff Payroll Overview',
  'Đối Soát Lương Giáo Vụ & GV': 'Reconcile Staff & Teacher Payroll',
  'Mã NV': 'Staff ID',
  'Nhân Viên Giáo Vụ': 'Academic Staff',
  'Vị Trí Phụ Trách': 'Assigned Role',
  'Lớp Quản Lý': 'Managed Classes',
  'Học Viên Phụ Trách': 'Managed Students',
  'Tỷ Lệ Hoàn Thành KPI': 'KPI Completion Rate',
  'Tổng Lương Tháng': 'Total Monthly Salary',
  'Lớp Đang Tham Gia': 'Enrolled Class',
  'Chuyên Cần & Bài Tập': 'Attendance & Homework',
  'Xem & Nộp bài tập về nhà →': 'View & Submit Homework →',
  'Thông Tin Đóng Học Phí': 'Tuition Payment Status',
  'ĐÃ HOÀN TẤT HỌC PHÍ': 'TUITION PAID IN FULL',
  'CẦN THANH TOÁN': 'PAYMENT DUE',
  'Hồ Sơ Cá Nhân & Đánh Giá Của Giáo Viên': 'My Student Profile & Native Teacher Evaluation',
  'Họ và Tên': 'Full Name',
  'Mã Học Viên': 'Student ID',
  'Phụ Huynh': 'Parent / Guardian',
  'Nhận Xét Mới Nhất Từ GV Bản Xứ': 'Latest Native Teacher Feedback',
  'Bài Tập Của Tôi & Lịch Học Trực Tuyến': 'My Homework & Online Class Schedule',
  'Nộp Bài Tập': 'Submit Homework',
  'Danh sách Bài tập được giao:': 'Assigned Homeworks:',
  'Vào Lớp Zoom': 'Join Zoom Class',

  // 4. Contracts & Payroll Module Labels
  'Hợp Đồng Đang Hiệu Lực': 'Active Teacher Contracts',
  'Quỹ Lương Giáo Viên (T8/2026)': 'Teacher Payroll Fund (Aug 2026)',
  'Quỹ Lương Nhân Viên Giáo Vụ': 'Academic Staff Payroll Fund',
  'Trạng Thái Đối Soát': 'Reconciliation Status',
  '100% Minh bạch': '100% Verified',
  'Tạo Hợp Đồng Giáo Viên': 'Create Teacher Contract',
  'Mã Phiếu': 'Slip ID',
  'Giáo Viên': 'Teacher',
  'Tháng': 'Month',
  'Số Tiết Dạy': 'Sessions Taught',
  'Đơn Giá Tiết': 'Rate / Session',
  'Thưởng': 'Bonus',
  'Tổng Thực Lĩnh': 'Net Total Salary',
  'Thao Tác': 'Actions',
  'Duyệt Lương': 'Approve Payroll',
  'Kế Toán Chi Trả': 'Disburse Payment',
  'Phiếu Lương': 'Pay Slip',
  'Mã HĐ': 'Contract ID',
  'Giáo Viên Bản Xứ': 'Native Teacher',
  'Loại Hợp Đồng': 'Contract Type',
  'Đơn Giá / Tiết Dạy': 'Rate per Session',
  'Định Mức Tiết/Tháng': 'Min Sessions / Month',
  'Ngày Bắt Đầu': 'Start Date',
  'Ngày Kết Thúc': 'End Date',
  'Chức Vụ': 'Position',
  'Lớp & HV Quản Lý': 'Classes & Students',
  'KPI Hoàn Thành': 'KPI Score',
  'Lương Cứng': 'Base Salary',
  'Thưởng KPI': 'KPI Bonus',
  'Trạng Thái Chi Lương': 'Payroll Status',
  'Duyệt': 'Approve',
  'Chi Lương': 'Disburse',
  'Đã chi trả': 'Paid / Disbursed',
  'Đã duyệt chi': 'Approved',
  'Chờ duyệt': 'Pending Approval',

  // 5. Courses & Schedule Module Labels
  'Xếp Lịch Lớp Học Mới': 'Schedule New Class Slot',
  'Tạo Khóa Học Mới': 'Create New Course',
  'Thứ': 'Day of Week',
  'Khung Giờ': 'Time Slot',
  'Lớp Học Trực Tuyến': 'Online Class',
  'Môn Học / Kỹ Năng': 'Subject / Skill Focus',
  'Giáo Viên Phụ Trách': 'Assigned Teacher',
  'Nền Tảng': 'Platform',
  'Trạng Thái Ca Dạy': 'Session Status',
  'Thao Tác Phòng Học': 'Classroom Actions',
  'Check-in Lớp': 'Check-in Class',
  'Vào Phòng Zoom': 'Launch Zoom Room',
  'Tất cả các thứ': 'All Days of Week',
  'Lọc theo ngày học:': 'Filter by Day:',
  'Đã Check-in': 'Checked-In',
  'Sắp diễn ra': 'Upcoming',
  'Đã hoàn thành': 'Completed',

  // 6. Attendance, Student Profiles & Homework Labels
  'GV Đã Check-in': 'Teacher Checked-In',
  'Vào Zoom': 'Join Zoom',
  'Hồ Sơ HV': 'Student Profiles',
  'Điểm Danh': 'Attendance & Eval',
  'Xem danh sách & nhận xét từng học viên trong lớp →':
    'View student roster & per-student evaluations →',
  'Ngày Học': 'Session Date',
  'Điểm Danh Phòng Zoom': 'Zoom Room Attendance',
  'Đánh Giá 4 Kỹ Năng (⭐ 1-5 Sao)': '4-Skill Evaluation (⭐ 1-5 Stars)',
  'Nhận Xét Của Giáo Viên (English Feedback)': 'Native Teacher Feedback',
  'Video Ghi Hình': 'Class Recording',
  'Xem Video': 'Watch Recording',
  'Mã BT': 'HW ID',
  'Lớp Học': 'Class',
  'Nội Dung Bài Tập': 'Homework Title',
  'Hạn Nộp': 'Due Date',
  'Điểm & Nhận Xét': 'Score & Teacher Feedback',
  'Đang chờ': 'Pending',
  'Đã nộp': 'Submitted',
  'Chưa nộp': 'Assigned / Pending',
  'Đã chấm điểm': 'Graded',

  // 7. Tuition & Billing Module Labels
  'Tổng Học Phí Đã Thu': 'Total Tuition Collected',
  'Học Phí Còn Nợ': 'Outstanding Tuition Due',
  'Tỷ Lệ Hoàn Thành': 'Collection Rate',
  'Mã HV': 'Student ID',
  'Họ và Tên Học Viên': 'Student Full Name',
  'Học Phí Tháng': 'Monthly Tuition',
  'Phụ Huynh & SĐT': 'Parent & Phone',
  'Trạng Thái Đóng Phí': 'Payment Status',
  'Xác Nhận Đã Thu': 'Confirm Payment',
  'Nhắc Học Phí': 'Send Reminder',
  'Đã hoàn tất': 'Paid in Full',
  'Đã đóng đủ': 'Paid in Full',
  'Chờ đóng phí': 'Pending Payment',
  'Quá hạn': 'Overdue',
  'Tất cả trạng thái': 'All Payment Statuses',

  // 8. User Management & RBAC Module Labels
  'Quản Trị Người Dùng & Phân Quyền RBAC': 'User Management & RBAC Permissions',
  'Quản lý tài khoản 6 Roles, cấp quyền, kích hoạt/khóa và nhật ký kiểm toán LAK EDUCATION':
    'Manage 6-role accounts, permissions, account status toggle, and audit logs',
  'Nhật Ký Kiểm Toán': 'Audit Log',
  '+ Tạo & Đăng Ký Tài Khoản Mới': '+ Add & Register New User',
  'Tổng Tài Khoản': 'Total Users',
  'Đang Hoạt Động': 'Active',
  'Đã Khóa': 'Disabled',
  'Học Viên (HV)': 'Students (HV)',
  'Cán Bộ & Giáo Viên': 'Staff & Teachers',
  'Tìm theo Tên, Mã (HV001, GV002...), Email hoặc SĐT...':
    'Search by Name, Code (HV001, GV002...), Email or Phone...',
  'Tất Cả Vai Trò (6 Roles)': 'All Roles (6 Roles)',
  'Tất Cả Trạng Thái': 'All Statuses',
  'Đã Khóa / Vô Hiệu Hóa': 'Disabled / Suspended',
  'Thành viên & Avatar': 'Member & Avatar',
  'Liên hệ & Mã': 'Contact & Code',
  'Vai trò (Role)': 'Role',
  'Đăng nhập': 'Sign-In',
  'Kích Hoạt / Khóa': 'Active / Disabled',
  'Hành động': 'Actions',
  'Chi tiết': 'Details',
  'HOẠT ĐỘNG': 'ACTIVE',
  'TẠM KHÓA': 'DISABLED',
  'Học viên trực tuyến': 'Online Student',
  'Cán bộ LAK EDUCATION': 'LAK Staff',
  'Đăng nhập bằng SĐT': 'Sign in via Phone',
  'Chưa cập nhật SĐT': 'Phone not updated',
  'SĐT:': 'Phone:',
  'Gmail: Đăng nhập Google': 'Gmail: Google Sign-in',
  'Đăng nhập Mật khẩu': 'Password Sign-in',
  'Học viên: Đăng nhập bằng Số điện thoại + Mật khẩu': 'Student: Phone + Password Sign-in',
  'Tài khoản Root Admin tối cao không thể bị khóa': 'Root Admin account cannot be locked',
  'Bạn không có quyền thay đổi trạng thái của tài khoản này':
    'You do not have permission to change this account status',
  'Xác nhận khóa tài khoản': 'Confirm Lock Account',
  'Xác nhận kích hoạt tài khoản': 'Confirm Activate Account',
  'Bạn có chắc chắn muốn khóa tài khoản này?': 'Are you sure you want to lock this account?',
  'Bạn có chắc chắn muốn kích hoạt tài khoản này?': 'Are you sure you want to activate this account?',
  'Đang tải danh sách tài khoản...': 'Loading users directory...',
  'Không tìm thấy tài khoản người dùng nào phù hợp': 'No matching users found',
  'Nhật Ký Kiểm Toán & Phân Quyền (Audit Logs)': 'Audit Logs & RBAC Permissions',
  'Ghi nhận toàn bộ thao tác Tạo mới, Cập nhật thông tin, Kích hoạt và Vô hiệu hóa tài khoản trong hệ thống.':
    'Full history of user creation, updates, activation, and suspension across the system.',
  'Đang tải nhật ký kiểm toán...': 'Loading audit logs...',
  'Chưa có nhật ký thao tác nào': 'No audit logs recorded yet',
  'Xác Nhận Xóa Tài Khoản': 'Confirm User Account Deletion',
  'Tài khoản này sẽ bị xóa và ngừng quyền truy cập vào hệ thống':
    'This user account will be permanently removed and access revoked.',
  'Vui lòng nhập lý do xóa tài khoản.': 'Please enter a reason for deletion.',
  'Lý do xóa cần tối thiểu 3 ký tự.': 'Reason must be at least 3 characters.',
  'Lý do xóa tài khoản...': 'Reason for deleting account...',
  'Hủy Bỏ': 'Cancel',
  'Xác Nhận Xóa': 'Confirm Delete',
  'Xóa': 'Delete',
  'Sửa': 'Edit',
  'Lưu': 'Save',
  'Đóng': 'Close',

  // 9. Authentication & System Alerts
  'Tài khoản hoặc mật khẩu không đúng.': 'Incorrect email or password.',
  'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.': 'Sign in failed. Please check your credentials.',
  'Đăng nhập thất bại': 'Sign in failed',
  'Đăng nhập Google thất bại': 'Google sign-in failed',
  'Không thể đăng nhập bằng Google. Vui lòng thử lại.': 'Unable to sign in with Google. Please try again.',
  'Vui lòng nhập địa chỉ email của bạn.': 'Please enter your email address.',
  'Vui lòng nhập mật khẩu.': 'Please enter your password.',
  'Vui lòng nhập email của bạn': 'Please enter your email',
  'Cập nhật thành công!': 'Updated successfully!',
  'Lưu thay đổi thành công': 'Changes saved successfully',
};

// Tự động sinh bảng đảo ngược EN -> VI để chuyển qua lại tức thời
export const EN_TO_VI_UI_LABELS = Object.entries(VI_TO_EN_UI_LABELS).reduce((acc, [vi, en]) => {
  acc[en] = vi;
  return acc;
}, {});

/**
 * Chuẩn hóa và bản địa hóa thông báo lỗi / thông báo hệ thống theo ngôn ngữ đang chọn
 */
export const localizeSystemMessage = (rawMessage, targetLanguage = 'en') => {
  if (!rawMessage) return '';
  const isEn = targetLanguage === 'en';
  const msg = String(rawMessage).trim();

  // Tra cứu trực tiếp từ điển UI Labels trước
  if (isEn && VI_TO_EN_UI_LABELS[msg]) {
    return VI_TO_EN_UI_LABELS[msg];
  }
  if (!isEn && EN_TO_VI_UI_LABELS[msg]) {
    return EN_TO_VI_UI_LABELS[msg];
  }

  // Tra cứu theo ngữ cảnh xác thực (Auth & Security messages)
  if (
    msg.includes('mật khẩu') ||
    msg.includes('password') ||
    msg.includes('Tài khoản hoặc mật khẩu') ||
    msg.includes('không chính xác') ||
    msg.includes('invalid-credential') ||
    msg.includes('wrong-password') ||
    msg.includes('user-not-found')
  ) {
    return isEn ? 'Incorrect email or password.' : 'Tài khoản hoặc mật khẩu không đúng.';
  }

  if (msg.includes('chưa được đăng ký') || msg.includes('not registered') || msg.includes('UNREGISTERED')) {
    return isEn
      ? 'This account is not registered in the LAK EDUCATION system. Please contact the Academic staff or Administrator.'
      : 'Tài khoản này chưa được đăng ký trong hệ thống LAK EDUCATION. Vui lòng liên hệ Giáo vụ hoặc Quản trị viên.';
  }

  if (msg.includes('vô hiệu hóa') || msg.includes('tạm khóa') || msg.includes('disabled')) {
    return isEn
      ? 'Your account has been disabled or suspended. Please contact the IT Administrator.'
      : 'Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa. Vui lòng liên hệ IT Admin.';
  }

  if (msg.includes('bị xóa') || msg.includes('deleted')) {
    return isEn
      ? 'Your account has been deleted from the system. Please contact the IT Administrator.'
      : 'Tài khoản của bạn đã bị xóa khỏi hệ thống. Vui lòng liên hệ IT Admin.';
  }

  if (msg.includes('không hỗ trợ đăng nhập qua Google') || msg.includes('email công vụ')) {
    return isEn
      ? 'This official organization email does not support Google Sign-In. Please sign in with Email and Password.'
      : 'Tài khoản này là email công vụ, không hỗ trợ đăng nhập qua Google. Vui lòng đăng nhập bằng Email và Mật khẩu.';
  }

  if (msg.includes('đóng cửa sổ') || msg.includes('popup-closed-by-user')) {
    return isEn
      ? 'Google sign-in window was closed before completion.'
      : 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
  }

  if (msg.includes('mạng') || msg.includes('network')) {
    return isEn ? 'Network connection error. Please try again.' : 'Lỗi kết nối mạng. Vui lòng thử lại.';
  }

  return msg;
};

export const resources = {
  en: {
    translation: enTranslation,
  },
  vi: {
    translation: viTranslation,
  },
};

const savedLanguage =
  typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_LANG_KEY) || DEFAULT_LANGUAGE
    : DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

