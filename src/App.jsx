import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './core/context/AuthContext';
import { AppLayout } from './core/layout/AppLayout';
import { MODULE_SLUGS, getModuleFromSlug, getSlugFromModule } from './shared/utils/slug';

// Independent Domain Modules
import DashboardModule from './modules/dashboard';
import ContractsModule from './modules/contracts';
import SchedulesModule from './modules/schedules';
import AttendanceModule from './modules/attendance';
import TuitionModule from './modules/tuition';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current module key from URL pathname slug
  const currentPath = location.pathname.substring(1) || MODULE_SLUGS.dashboard;
  const activeTab = getModuleFromSlug(currentPath);

  const handleTabChange = (key) => {
    const slug = getSlugFromModule(key);
    navigate(`/${slug}`);
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${MODULE_SLUGS.dashboard}`} replace />} />
        <Route path={`/${MODULE_SLUGS.dashboard}`} element={<DashboardModule setActiveTab={handleTabChange} />} />
        <Route path={`/${MODULE_SLUGS.contracts}`} element={<ContractsModule />} />
        <Route path={`/${MODULE_SLUGS.schedules}`} element={<SchedulesModule />} />
        <Route path={`/${MODULE_SLUGS.attendance}`} element={<AttendanceModule />} />
        <Route path={`/${MODULE_SLUGS.tuition}`} element={<TuitionModule />} />
        <Route path="*" element={<Navigate to={`/${MODULE_SLUGS.dashboard}`} replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
