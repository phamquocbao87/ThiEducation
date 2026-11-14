/* global __APP_VERSION__, __BUILD_TIME__ */
import { MODULE_SLUGS } from '../../shared/utils/slug';

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.1';
export const APP_BUILD_TIME =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '2026110801v';
export const APP_BUILD_VERSION_LABEL = `Version ${APP_VERSION} • build ${APP_BUILD_TIME}`;

export const SITE_DOMAINS = {
  LANDING_PRODUCTION: 'https://lakeducation.edu.vn',
  ERP_PRODUCTION: 'https://erp.lakeducation.edu.vn',
  LANDING_PRODUCTION_FIREBASE: 'https://lakeducation.web.app',
  ERP_PRODUCTION_FIREBASE: 'https://lakeducation-erp-portal.web.app',
  LANDING_DEV: 'https://lakeducation-dev.web.app',
  ERP_DEV: 'https://lakeducation-dev-erp.web.app',
};

/**
 * Ánh xạ từng Role sang Màn hình ERP mặc định ngay sau khi Đăng nhập thành công
 */
export const ROLE_DEFAULT_ERP_ROUTE = {
  admin: MODULE_SLUGS.dashboard, // /dashboard (System Health, Backup & Cut-off)
  director: MODULE_SLUGS.dashboard, // /dashboard (Executive Director Overview)
  academic: MODULE_SLUGS.dashboard, // /dashboard (Academic Operations Hub)
  teacher: MODULE_SLUGS.dashboard, // /dashboard (Native Teacher Workspace & Zoom Check-in)
  accountant: MODULE_SLUGS.contracts, // /contracts-and-payroll (Đối soát Lương & Tài chính)
  student: MODULE_SLUGS.dashboard, // /dashboard (Student Portal: Bài tập, Lịch học & Học phí)
};

export const ROLE_WORKSPACE_DESCRIPTIONS = {
  vi: {
    admin: 'Trung tâm Quản trị Kỹ thuật IT, Backup Google Drive & Giả lập kiểm tra 16 tài khoản',
    director: 'Bảng Điều hành Giám đốc (520 Học viên, 68 Giáo viên, Khóa học & Tài chính)',
    academic: 'Trung tâm Điều phối Giáo vụ (Khóa học, Thời khóa biểu, Điểm danh & Học phí)',
    teacher: 'Cổng Giảng dạy Giáo viên Bản xứ (Lịch dạy cá nhân, Check-in Zoom & Đánh giá HV)',
    accountant: 'Trung tâm Kiểm soát Tài chính & Kế toán (Đối soát Bảng lương GV/Giáo vụ & Học phí)',
    student: 'Cổng Học tập Học viên (Hồ sơ cá nhân, Bài tập về nhà, Nhận xét GV & Học phí)',
  },
  en: {
    admin: 'IT System Administration, Google Drive Backup & 16-Account Inspector',
    director: 'Executive Director Dashboard (520 Students, 68 Teachers, Courses & Finance)',
    academic: 'Academic Operations Hub (Courses, Schedules, Attendance & Tuition)',
    teacher: 'Native Teacher Portal (Personal Timetable, Zoom Check-in & Student Evaluations)',
    accountant: 'Finance & Accounting Control (Teacher/Staff Payroll & Tuition Reconciliation)',
    student: 'Student Learning Portal (Personal Profile, Homework, Teacher Feedback & Tuition)',
  },
};

/**
 * Kiểm tra xem ứng dụng đang chạy trên tên miền Production (lakeducation.edu.vn) hay Localhost
 */
export const isProductionLandingDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'lakeducation.edu.vn' ||
    host === 'www.lakeducation.edu.vn' ||
    host === 'lakeducation.com' ||
    host === 'lakeducation.web.app' ||
    host === 'lakeducation.firebaseapp.com'
  );
};

export const isProductionErpDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'erp.lakeducation.edu.vn' ||
    host === 'erp.lakeducation.com' ||
    host === 'lakeducation-erp-portal.web.app' ||
    host === 'lakeducation-erp-portal.firebaseapp.com'
  );
};

export const isDevLandingDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'lakeducation-dev.web.app' || host === 'lakeducation-dev.firebaseapp.com';
};

export const isDevErpDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'lakeducation-dev-erp.web.app' || host === 'lakeducation-dev-erp.firebaseapp.com';
};

/**
 * Tạo đường dẫn đích sau khi người dùng Login thành công trên Landing Page
 * - Nếu đang ở trên domain thật lakeducation.edu.vn -> Chuyển hướng sang https://erp.lakeducation.edu.vn/<route>?sso_uid=<id>&lang=<lang>
 * - Nếu đang ở trên domain production firebase lakeducation.web.app -> Chuyển hướng sang https://lakeducation-erp-portal.web.app/<route>?sso_uid=<id>&lang=<lang>
 * - Nếu đang ở trên domain dev lakeducation-dev.web.app -> Chuyển hướng sang https://lakeducation-dev-erp.web.app/<route>?sso_uid=<id>&lang=<lang>
 * - Nếu đang ở trên localhost (hoặc cùng domain) -> Trả về path nội bộ /<route>
 */
export const resolveErpTargetAfterLogin = (user, lang = 'en') => {
  const targetSlug = ROLE_DEFAULT_ERP_ROUTE[user?.role] || MODULE_SLUGS.dashboard;

  if (isProductionLandingDomain()) {
    const params = new URLSearchParams({
      sso_uid: user.id || user.code,
      lang,
    });
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const erpBase =
      host.includes('web.app') || host.includes('firebaseapp.com')
        ? SITE_DOMAINS.ERP_PRODUCTION_FIREBASE
        : SITE_DOMAINS.ERP_PRODUCTION;

    return {
      isExternalRedirect: true,
      url: `${erpBase}/${targetSlug}?${params.toString()}`,
      path: `/${targetSlug}`,
    };
  }

  if (isDevLandingDomain()) {
    const params = new URLSearchParams({
      sso_uid: user.id || user.code,
      lang,
    });
    return {
      isExternalRedirect: true,
      url: `${SITE_DOMAINS.ERP_DEV}/${targetSlug}?${params.toString()}`,
      path: `/${targetSlug}`,
    };
  }

  return {
    isExternalRedirect: false,
    url: `/${targetSlug}`,
    path: `/${targetSlug}`,
  };
};

