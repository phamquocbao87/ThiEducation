import React, { useState } from 'react';
import { AuthProvider } from './core/context/AuthContext';
import { AppLayout } from './core/layout/AppLayout';

// Independent Domain Modules
import DashboardModule from './modules/dashboard';
import ContractsModule from './modules/contracts';
import SchedulesModule from './modules/schedules';
import AttendanceModule from './modules/attendance';
import TuitionModule from './modules/tuition';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardModule setActiveTab={setActiveTab} />;
      case 'contracts':
        return <ContractsModule />;
      case 'schedules':
        return <SchedulesModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'tuition':
        return <TuitionModule />;
      default:
        return <DashboardModule setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderModule()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
