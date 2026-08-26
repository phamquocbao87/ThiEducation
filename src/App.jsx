import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ContractPayrollManager } from './components/contracts/ContractPayrollManager';
import { TimetableManager } from './components/schedules/TimetableManager';
import { ClassAttendanceManager } from './components/classes/ClassAttendanceManager';
import { TuitionManager } from './components/tuition/TuitionManager';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case 'contracts':
        return <ContractPayrollManager />;
      case 'timetable':
        return <TimetableManager />;
      case 'classes':
        return <ClassAttendanceManager />;
      case 'tuition':
        return <TuitionManager />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
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
