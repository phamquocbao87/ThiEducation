import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button, Space, Typography, Segmented, message } from 'antd';
import { GlobalOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './core/context/AuthContext';
import { LanguageProvider, useLanguage } from './core/context/LanguageContext';
import { AppLayout } from './core/layout/AppLayout';
import { ProtectedRoute } from './core/router/ProtectedRoute';
import {
  SITE_DOMAINS,
  APP_BUILD_VERSION_LABEL,
  enforceCanonicalDomain,
  isBackupErpDomain,
  isDevErpDomain,
} from './core/config/siteConfig';
import { MODULE_SLUGS, getModuleFromSlug, getSlugFromModule } from './shared/utils/slug';
import { SystemLoginModal } from './modules/landing/components/SystemLoginModal';
import { LocalDevelopmentBanner } from './core/layout/LocalDevelopmentBanner';

// Independent Domain Modules for Internal ERP (erp.lakeducation.edu.vn)
import DashboardModule from './modules/dashboard';
import ClassroomModule from './modules/classroom';
import CoursesModule from './modules/courses';
import StudentsModule from './modules/students';
import MaterialsModule from './modules/materials';
import ExercisesModule from './modules/exercises';
import LessonQaModule from './modules/lesson-qa';
import PreClassPrepModule from './modules/pre-class-prep';
import CurriculumModule from './modules/curriculum';
import SchedulesModule from './modules/schedules';
import AttendanceModule from './modules/attendance';
import ContractsModule from './modules/contracts';
import TuitionModule from './modules/tuition';
import UsersModule from './modules/users';

const { Title, Text } = Typography;

function ErpPortalLoginGate({ onLoginSuccess }) {
  const { language, setLanguage } = useLanguage();
  const isEnglish = language === 'en';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <Space size={10}>
          <SafetyCertificateOutlined style={{ fontSize: 26, color: '#38bdf8' }} />
          <div>
            <Title level={4} style={{ color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
              LAK EDUCATION — ERP PORTAL
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              erp.lakeducation.edu.vn
            </Text>
          </div>
        </Space>

        <Space size={12}>
          <Segmented
            size="small"
            value={language}
            onChange={(val) => setLanguage(val)}
            options={[
              { label: '🇬🇧 EN', value: 'en' },
              { label: '🇻🇳 VI', value: 'vi' },
            ]}
            style={{ fontWeight: 600 }}
          />
          <Button
            ghost
            icon={<GlobalOutlined />}
            onClick={() => {
              const target = isBackupErpDomain()
                ? SITE_DOMAINS.LANDING_BACKUP
                : isDevErpDomain()
                  ? SITE_DOMAINS.LANDING_DEV
                  : SITE_DOMAINS.LANDING_PRODUCTION;
              window.location.href = target;
            }}
            style={{ borderRadius: 8, color: '#ffffff', borderColor: 'rgba(255,255,255,0.45)' }}
          >
            {isEnglish ? 'Landing Page' : 'Trang Chủ'}
          </Button>
        </Space>
      </div>

      <SystemLoginModal
        open={true}
        language={language}
        onCancel={() => {
          const target = isBackupErpDomain()
            ? SITE_DOMAINS.LANDING_BACKUP
            : isDevErpDomain()
              ? SITE_DOMAINS.LANDING_DEV
              : SITE_DOMAINS.LANDING_PRODUCTION;
          window.location.href = target;
        }}
        onLoginSuccess={onLoginSuccess}
      />

      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, maxWidth: 800, margin: '16px auto 0' }}>
        <div style={{ fontWeight: 600, color: '#ffffff' }}>
          {isEnglish ? 'LAK EDUCATION JSC — Internal Educational Management ERP Portal' : 'CÔNG TY CỔ PHẦN LAK EDUCATION — Cổng Thông Tin Quản Lý Đào Tạo & Khảo Thí'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {isEnglish ? 'Official Domain: erp.lakeducation.edu.vn • McGraw-Hill Wonders ELA Curriculum' : 'Tên miền chính thức: erp.lakeducation.edu.vn • Giáo trình chuẩn McGraw-Hill Wonders ELA'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          LAK EDUCATION (lakeducation.com) ©2026 • {APP_BUILD_VERSION_LABEL}
        </div>
      </div>
    </div>
  );
}

function ErpRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentUser, loginWithAccount } = useAuth();
  const { language } = useLanguage();

  const currentPath = location.pathname.substring(1) || MODULE_SLUGS.dashboard;
  const activeTab = getModuleFromSlug(currentPath);

  const handleTabChange = (key) => {
    const slug = getSlugFromModule(key);
    navigate(`/${slug}`);
  };

  const handlePortalLoginSuccess = (authResultOrId) => {
    const res =
      authResultOrId && typeof authResultOrId === 'object' && authResultOrId.success
        ? authResultOrId
        : loginWithAccount(authResultOrId);

    if (res && res.success) {
      message.success(
        language === 'en' ? `Welcome back, ${res.user.name}!` : `Xin chào, ${res.user.name}!`
      );
      // Deep Linking & Intended Redirect:
      // Nếu người dùng truy cập một route cụ thể (ví dụ /zoom-schedules, /classroom/LH004...)
      // thì ưu tiên chuyển vào đúng route đó thay vì luôn ép về defaultRoute (dashboard)
      const currentPathname = location.pathname;
      const isDirectRoute = currentPathname && currentPathname !== '/' && currentPathname !== '/login';
      const intendedUrl = isDirectRoute
        ? (currentPathname + location.search + location.hash)
        : null;

      navigate(intendedUrl || `/${res.defaultRoute || MODULE_SLUGS.dashboard}`, { replace: true });
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <ErpPortalLoginGate onLoginSuccess={handlePortalLoginSuccess} />;
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      <Routes>
        <Route path="/classroom/:classId" element={<ProtectedRoute moduleKey="classroom"><ClassroomModule /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={`/${MODULE_SLUGS.dashboard}`} replace />} />
        <Route
          path={`/${MODULE_SLUGS.dashboard}`}
          element={
            <ProtectedRoute moduleKey="dashboard">
              <DashboardModule setActiveTab={handleTabChange} />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.courses}`}
          element={
            <ProtectedRoute moduleKey="courses">
              <CoursesModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.courses}/:action`}
          element={
            <ProtectedRoute moduleKey="coursesManage">
              <CoursesModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.students}`}
          element={
            <ProtectedRoute moduleKey="students">
              <StudentsModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.materials}`}
          element={
            <ProtectedRoute moduleKey="materials">
              <MaterialsModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.exercises}`}
          element={
            <ProtectedRoute moduleKey="exercises">
              <ExercisesModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.lessonQa}`}
          element={
            <ProtectedRoute moduleKey="lessonQa">
              <LessonQaModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.preClassPrep}`}
          element={
            <ProtectedRoute moduleKey="preClassPrep">
              <PreClassPrepModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.curriculum}`}
          element={<Navigate to={`/${MODULE_SLUGS.courses}?tab=curriculum`} replace />}
        />
        <Route
          path={`/${MODULE_SLUGS.curriculum}/new`}
          element={
            <ProtectedRoute moduleKey="curriculumManage">
              <CurriculumModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.curriculum}/:levelId`}
          element={
            <ProtectedRoute moduleKey="curriculum">
              <CurriculumModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.curriculum}/:levelId/:action`}
          element={
            <ProtectedRoute moduleKey="curriculumManage">
              <CurriculumModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.schedules}`}
          element={
            <ProtectedRoute moduleKey="schedules">
              <SchedulesModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.attendance}`}
          element={
            <ProtectedRoute moduleKey="attendance">
              <AttendanceModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.contracts}`}
          element={
            <ProtectedRoute moduleKey="contracts">
              <ContractsModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.tuition}`}
          element={
            <ProtectedRoute moduleKey="tuition">
              <TuitionModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.users}`}
          element={
            <ProtectedRoute moduleKey="users">
              <UsersModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.users}/:userId`}
          element={
            <ProtectedRoute moduleKey="users">
              <UsersModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.users}/:userId/:action`}
          element={
            <ProtectedRoute moduleKey="users">
              <UsersModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.profile}`}
          element={
            <ProtectedRoute moduleKey="profile">
              <UsersModule isSelfProfile={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.profile}/:action`}
          element={
            <ProtectedRoute moduleKey="profile">
              <UsersModule isSelfProfile={true} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={`/${MODULE_SLUGS.dashboard}`} replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function ErpApp() {
  React.useEffect(() => {
    enforceCanonicalDomain();
  }, []);

  return (
    <>
      <LocalDevelopmentBanner />
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErpRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </>
  );
}

