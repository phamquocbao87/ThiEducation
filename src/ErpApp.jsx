import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button, Space, Typography, Segmented, message } from 'antd';
import { GlobalOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './core/context/AuthContext';
import { LanguageProvider, useLanguage } from './core/context/LanguageContext';
import { AppLayout } from './core/layout/AppLayout';
import { ProtectedRoute } from './core/router/ProtectedRoute';
import { SITE_DOMAINS, APP_BUILD_VERSION_LABEL } from './core/config/siteConfig';
import { MODULE_SLUGS, getModuleFromSlug, getSlugFromModule } from './shared/utils/slug';
import { SystemLoginModal } from './modules/landing/components/SystemLoginModal';

// Independent Domain Modules for Internal ERP (erp.lakeducation.edu.vn)
import DashboardModule from './modules/dashboard';
import CoursesModule from './modules/courses';
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
              window.location.href = SITE_DOMAINS.LANDING_PRODUCTION;
            }}
            style={{ borderRadius: 8, color: '#ffffff', borderColor: 'rgba(255,255,255,0.45)' }}
          >
            {isEnglish ? 'Landing Page (lakeducation.edu.vn)' : 'Trang Chủ (lakeducation.edu.vn)'}
          </Button>
        </Space>
      </div>

      <SystemLoginModal
        open={true}
        language={language}
        onCancel={() => {
          window.location.href = SITE_DOMAINS.LANDING_PRODUCTION;
        }}
        onLoginSuccess={onLoginSuccess}
      />

      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
        <div>LAK EDUCATION (lakeducation.com) ©2026</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
          {APP_BUILD_VERSION_LABEL}
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
      navigate(`/${res.defaultRoute || MODULE_SLUGS.dashboard}`);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <ErpPortalLoginGate onLoginSuccess={handlePortalLoginSuccess} />;
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      <Routes>
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
            <ProtectedRoute moduleKey="courses">
              <CoursesModule />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${MODULE_SLUGS.curriculum}`}
          element={
            <ProtectedRoute moduleKey="curriculum">
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
            <ProtectedRoute moduleKey="curriculum">
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
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErpRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

