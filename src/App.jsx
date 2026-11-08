import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './core/context/AuthContext';
import { LanguageProvider } from './core/context/LanguageContext';
import { AppLayout } from './core/layout/AppLayout';
import { MODULE_SLUGS, getModuleFromSlug, getSlugFromModule } from './shared/utils/slug';
import { ProtectedRoute } from './core/router/ProtectedRoute';

// Independent Domain Modules
import LandingModule from './modules/landing';
import DashboardModule from './modules/dashboard';
import CoursesModule from './modules/courses';
import CurriculumModule from './modules/curriculum';
import ContractsModule from './modules/contracts';
import SchedulesModule from './modules/schedules';
import AttendanceModule from './modules/attendance';
import TuitionModule from './modules/tuition';
import UsersModule from './modules/users';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;
  const isLandingRoute = pathname === '/' || pathname === '/landing' || pathname === '/home';

  // Extract current ERP module key from URL pathname slug
  const currentPath = pathname.substring(1) || MODULE_SLUGS.dashboard;
  const activeTab = getModuleFromSlug(currentPath);

  const handleTabChange = (key) => {
    const slug = getSlugFromModule(key);
    navigate(`/${slug}`);
  };

  if (isLandingRoute) {
    return (
      <Routes>
        <Route path="/" element={<LandingModule />} />
        <Route path="/landing" element={<LandingModule />} />
        <Route path="/home" element={<LandingModule />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
        <Routes>
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
            path={`/${MODULE_SLUGS.contracts}`}
            element={
              <ProtectedRoute moduleKey="contracts">
                <ContractsModule />
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
          <Route path="*" element={<Navigate to={`/${MODULE_SLUGS.dashboard}`} replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
