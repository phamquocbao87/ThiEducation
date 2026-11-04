import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
};

// Tự động sinh bảng đảo ngược EN -> VI để chuyển qua lại tức thời
export const EN_TO_VI_UI_LABELS = Object.entries(VI_TO_EN_UI_LABELS).reduce((acc, [vi, en]) => {
  acc[en] = vi;
  return acc;
}, {});

export const resources = {
  en: {
    translation: {
      appTitle: 'LAK EDUCATION',
      footerText: 'LAK EDUCATION (lakeducation.com) ©2026',
      langSwitchLabel: 'Language',
      langEn: '🇬🇧 English (Default)',
      langVi: '🇻🇳 Tiếng Việt',
      menuHeaderPrefix: 'WORKSPACE MENU FOR',
      adminViewAsBtn: 'Admin View-As:',
      exitViewAsBtn: 'Exit View-As → Back to IT Admin',
      impersonationBannerPrefix:
        '[Admin Account Inspector] You ({{adminName}} - IT Admin) are viewing the exact screen & data of:',
      switchAnotherAccountBtn: 'Switch to another account',
      returnToAdminBtn: 'Return to IT Admin View',
      impersonateModalTitle:
        'IT Admin Privilege: Impersonate & Inspect Any User Account ({{count}} Accounts)',
      impersonateModalAlert:
        'This tool is strictly visible only to IT Admin (admin). It allows inspecting the exact UI, scoped data, and permissions of any Director, Academic Staff, Accountant, Foreign Teacher, or Student without their password.',
      impersonateSearchPlaceholder: 'Search by Name, ID (GV001, HV003, ACA002...) or Email...',
      menus: {
        dashboard: 'Dashboard Overview',
        contracts: 'Contracts & Payroll',
        schedules: 'Courses & Schedule',
        attendance: 'Classes, Profiles & Evaluation',
        tuition: 'Tuition & Billing',
      },
      roles: {
        admin: 'IT System Administrator',
        director: 'Executive Director',
        academic: 'Academic Coordinator',
        teacher: 'Native Foreign Teacher',
        accountant: 'Finance & Accountant',
        student: 'Student / Learner',
      },
      banners: {
        hello: 'Welcome',
        adminTitle: 'IT System Administration & Security Center',
        adminDesc:
          'Monitor server health (System Health), domain configuration (lakeducation.com), Firebase/Google Drive API status, and on-demand database backups.',
        directorTitle: 'Executive Director Dashboard',
        directorDesc:
          'Full visibility across the center: 520 Students, 68 Foreign Teachers, Academic Staff KPIs, active courses, and monthly Tuition & Payroll summary.',
        academicTitle: 'Academic Operations Hub',
        academicDesc:
          'Manage courses, class schedules, live classroom operations, teacher/student profiles, attendance, tuition reminders, and teacher timesheets.',
        teacherTitle: 'Native Teacher Portal — Classroom, Check-in & Student Evaluation',
        teacherDesc:
          'Check in to your assigned Zoom classes, view student profiles, take attendance, and write per-student evaluations & homework feedback.',
        accountantTitle: 'Finance & Payroll Reconciliation Center',
        accountantDesc:
          'Monitor and reconcile foreign teacher payrolls, academic staff salaries, and student tuition payments.',
        studentTitle: 'Student Learning Portal',
        studentDesc:
          'View your personal profile, enrolled classes, homework assignments, native teacher evaluations, and personal tuition status.',
      },
      pages: {
        contractsTitle: 'Teacher Contracts & Payroll Management',
        contractsSub:
          'Manage foreign teacher contracts, reconcile monthly teaching sessions, and process payroll disbursements for Teachers and Academic Staff.',
        createContractBtn: 'Create Teacher Contract',
        tabTeacherPayrolls: 'Teacher Payrolls',
        tabTeacherContracts: 'Teacher Contracts',
        tabStaffPayrolls: 'Academic Staff Payrolls',
        schedulesTitle: 'Course Catalog & Online Class Schedule',
        schedulesSub:
          'Manage active training courses, Zoom teaching timetables, and live classroom check-in status.',
        scheduleNewSlotBtn: 'Schedule New Class Slot',
        attendanceTitle: 'Classroom Operations, Student Profiles & Evaluations',
        attendanceSub:
          'Check in to live classes, manage individual student profiles, take attendance, rate 4 skills, and review homework.',
        tabEvaluations: 'Attendance & Session Evaluations',
        tabHomeworks: 'Homework Assignments',
        tuitionTitleManager: 'Tuition Collection & Billing Reconciliation',
        tuitionTitleStudent: 'My Personal Tuition & Billing Status',
        tuitionSub:
          'Track monthly tuition collection progress, send automated payment reminders, and confirm student payments.',
      },
    },
  },
  vi: {
    translation: {
      appTitle: 'LAK EDUCATION',
      footerText: 'LAK EDUCATION (lakeducation.com) ©2026',
      langSwitchLabel: 'Ngôn ngữ',
      langEn: '🇬🇧 English (Default)',
      langVi: '🇻🇳 Tiếng Việt',
      menuHeaderPrefix: 'MENU CỦA',
      adminViewAsBtn: 'Admin Xem Dưới Tên User:',
      exitViewAsBtn: 'Thoát xem hộ → Về IT Admin',
      impersonationBannerPrefix:
        '[Chế Độ Admin Kiểm Tra Tài Khoản] Bạn ({{adminName}} - IT Admin) đang xem màn hình chính xác của tài khoản:',
      switchAnotherAccountBtn: 'Đổi sang tài khoản khác',
      returnToAdminBtn: 'Quay về màn hình IT Admin',
      impersonateModalTitle:
        'Đặc Quyền IT Admin: Chuyển Sang Xem Màn Hình Của Bất Kỳ Tài Khoản Nào ({{count}} tài khoản)',
      impersonateModalAlert:
        'Tính năng này chỉ hiển thị cho duy nhất Role IT Admin (admin). Giúp Admin kiểm tra trực tiếp màn hình, dữ liệu và phân quyền của bất kỳ Giám đốc, Giáo vụ, Kế toán, Giáo viên hay Học viên nào mà không cần mật khẩu.',
      impersonateSearchPlaceholder: 'Tìm theo Tên, Mã (GV001, HV003, ACA002...) hoặc Email...',
      menus: {
        dashboard: 'Tổng Quan (Dashboard)',
        contracts: 'Hợp Đồng & Bảng Lương',
        schedules: 'Khóa Học & Thời Khóa Biểu',
        attendance: 'Lớp Học, Hồ Sơ & Đánh Giá',
        tuition: 'Quản Lý Đóng Học Phí',
      },
      roles: {
        admin: 'IT Quản Trị Hệ Thống',
        director: 'Giám Đốc Điều Hành',
        academic: 'Giáo Vụ Đào Tạo',
        teacher: 'Giáo Viên Bản Xứ',
        accountant: 'Kế Toán Tài Chính',
        student: 'Học Viên',
      },
      banners: {
        hello: 'Xin chào',
        adminTitle: 'Trung Tâm Quản Trị Kỹ Thuật & Bảo Mật Hệ Thống (IT System Admin)',
        adminDesc:
          'Theo dõi sức khỏe máy chủ (System Health), cấu hình tên miền lakeducation.com, trạng thái kết nối Firebase/Google Drive API và sao lưu dữ liệu theo yêu cầu.',
        directorTitle: 'Bảng Điều Hành Giám Đốc (Executive Director Dashboard)',
        directorDesc:
          'Toàn cảnh hoạt động trung tâm: 520 Học viên, 68 Giáo viên bản xứ, hiệu suất đội ngũ Giáo vụ, thông tin các khóa học và tổng hợp Thu học phí - Chi lương.',
        academicTitle: 'Trung Tâm Điều Phối Giáo Vụ (Academic Operations Hub)',
        academicDesc:
          'Quản lý khóa học, xếp thời khóa biểu, giám sát tình trạng vận hành các lớp học, quản lý hồ sơ GV/HV, điểm danh và theo dõi đóng học phí & chấm công lương GV.',
        teacherTitle: 'Cổng Giảng Dạy Giáo Viên Bản Xứ — Lớp Học, Check-in & Đánh Giá Học Viên',
        teacherDesc:
          'Check-in phòng học Zoom được phân công, xem hồ sơ học viên, điểm danh và chấm điểm nhận xét từng học viên sau buổi học.',
        accountantTitle: 'Trung Tâm Kiểm Soát Tài Chính & Kế Toán (Finance & Payroll Control)',
        accountantDesc:
          'Theo dõi và đối soát toàn bộ quá trình trả lương Giáo viên bản xứ, trả lương nhân viên Giáo vụ và thu học phí Học viên.',
        studentTitle: 'Cổng Thông Tin Học Viên (Student Learning Portal)',
        studentDesc:
          'Xem hồ sơ cá nhân, các lớp đang tham gia, bài tập về nhà, nhận xét đánh giá từ Giáo viên nước ngoài và thông tin đóng học phí cá nhân.',
      },
      pages: {
        contractsTitle: 'Quản Lý Hợp Đồng & Đối Soát Lương',
        contractsSub:
          'Quản lý hợp đồng giảng dạy, đối soát chi trả lương Giáo viên bản xứ và đội ngũ Giáo vụ.',
        createContractBtn: 'Tạo Hợp Đồng Giáo Viên',
        tabTeacherPayrolls: 'Bảng Lương Giáo Viên',
        tabTeacherContracts: 'Hợp Đồng Giáo Viên',
        tabStaffPayrolls: 'Bảng Lương Nhân Viên Giáo Vụ',
        schedulesTitle: 'Khóa Học & Thời Khóa Biểu Trực Tuyến',
        schedulesSub:
          'Quản lý danh mục khóa học, lịch giảng dạy Zoom và trạng thái Check-in phòng học.',
        scheduleNewSlotBtn: 'Xếp Lịch Lớp Học Mới',
        attendanceTitle: 'Vận Hành Lớp Học, Hồ Sơ Học Viên & Điểm Danh Đánh Giá',
        attendanceSub:
          'Check-in lớp học, quản lý hồ sơ từng học viên, điểm danh, nhận xét sau buổi học và quản lý bài tập.',
        tabEvaluations: 'Nhật Ký Điểm Danh & Đánh Giá Buổi Học',
        tabHomeworks: 'Bài Tập Về Nhà',
        tuitionTitleManager: 'Quản Lý & Đối Soát Thu Học Phí',
        tuitionTitleStudent: 'Thông Tin Đóng Học Phí Cá Nhân',
        tuitionSub:
          'Theo dõi tiến độ đóng học phí, gửi nhắc phí tự động và đối soát thanh toán.',
      },
    },
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

