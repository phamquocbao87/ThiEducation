import React from 'react';
import { Alert } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useDashboardController } from './hooks/useDashboardController';
import { AdminSystemHealthPanel } from './components/AdminSystemHealthPanel';
import { ExecutiveOverviewPanel } from './components/ExecutiveOverviewPanel';
import { TeacherWorkspacePanel } from './components/TeacherWorkspacePanel';
import { StudentPortalPanel } from './components/StudentPortalPanel';

export const DashboardPage = ({ setActiveTab }) => {
  const { t } = useLanguage();
  const {
    currentUser,
    role,
    bannerInfo,
    healthData,
    executiveSummary,
    teacherWorkspaceData,
    studentPortalData,
    selectedCutoffYear,
    setSelectedCutoffYear,
    isBackingUp,
    isCuttingOff,
    recentDriveArchives,
    handleRunDiagnostic,
    handleBackupToDrive,
    handleCutoffYearToDrive,
  } = useDashboardController();

  const localizedBannerTitle = t(`banners.${role}Title`, { defaultValue: bannerInfo.title });
  const localizedBannerDesc = t(`banners.${role}Desc`, { defaultValue: bannerInfo.description });

  return (
    <div>
      <Alert
        message={`${localizedBannerTitle} — ${t('banners.hello')}, ${currentUser.name}!`}
        description={localizedBannerDesc}
        type={bannerInfo.type}
        showIcon
        icon={<GlobalOutlined />}
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      {role === 'admin' && (
        <AdminSystemHealthPanel
          healthData={healthData}
          selectedCutoffYear={selectedCutoffYear}
          onChangeCutoffYear={setSelectedCutoffYear}
          isBackingUp={isBackingUp}
          isCuttingOff={isCuttingOff}
          recentDriveArchives={recentDriveArchives}
          onRunDiagnostic={handleRunDiagnostic}
          onBackupToDrive={handleBackupToDrive}
          onCutoffYearToDrive={handleCutoffYearToDrive}
        />
      )}

      {(role === 'director' || role === 'academic' || role === 'accountant') && (
        <ExecutiveOverviewPanel
          summary={executiveSummary}
          role={role}
          setActiveTab={setActiveTab}
        />
      )}

      {role === 'teacher' && (
        <TeacherWorkspacePanel
          workspaceData={teacherWorkspaceData}
          setActiveTab={setActiveTab}
        />
      )}

      {role === 'student' && (
        <StudentPortalPanel
          portalData={studentPortalData}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};
