import React from 'react';
import { Alert, Spin } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useDashboardController } from './hooks/useDashboardController';
import { AdminSystemHealthPanel } from './components/AdminSystemHealthPanel';
import { DirectorOverviewPanel } from './components/DirectorOverviewPanel';
import { AcademicOperationsPanel } from './components/AcademicOperationsPanel';
import { AccountantTreasuryPanel } from './components/AccountantTreasuryPanel';
import { TeacherWorkspacePanel } from './components/TeacherWorkspacePanel';
import { StudentPortalPanel } from './components/StudentPortalPanel';
import { ClassMonitoringPanel } from './components/ClassMonitoringPanel';

export const DashboardPage = () => {
  const { t } = useLanguage();
  const {
    currentUser,
    role,
    loading,
    classroomError,
    bannerInfo,
    healthData,
    adminDemographics,
    directorData,
    academicData,
    accountantData,
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

  const localizedBannerTitle = t(`banners.${role}Title`, { defaultValue: bannerInfo?.title || 'LAK EDUCATION' });
  const localizedBannerDesc = t(`banners.${role}Desc`, { defaultValue: bannerInfo?.description || 'Hệ thống Quản Trị Đào Tạo & ERP' });

  return (
    <div>
      <Alert
        message={`${localizedBannerTitle} — ${t('banners.hello', { defaultValue: 'Xin chào' })}, ${currentUser?.name || 'Thành viên'}!`}
        description={localizedBannerDesc}
        type={bannerInfo?.type || 'info'}
        showIcon
        icon={<GlobalOutlined />}
        style={{ marginBottom: 20, borderRadius: 10, border: '1px solid #bae0ff', backgroundColor: '#e6f4ff' }}
      />

      <Spin spinning={loading} tip="Đang tải dữ liệu thực tế từ Cloud Firestore...">
        {classroomError && <Alert type="error" showIcon title={t('classroom.loadError')} />}
        {/* 1. VIEW DÀNH CHO IT ADMIN */}
        {role === 'admin' && (
          <AdminSystemHealthPanel
            healthData={healthData}
            adminDemographics={adminDemographics}
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

        {/* 2. VIEW DÀNH CHO GIÁM ĐỐC ĐIỀU HÀNH (DIRECTOR) */}
        {role === 'director' && (
          <DirectorOverviewPanel directorData={directorData} />
        )}

        {/* 3. VIEW DÀNH CHO GIÁO VỤ ĐÀO TẠO (ACADEMIC) */}
        {role === 'academic' && (
          <AcademicOperationsPanel academicData={academicData} />
        )}

        {/* 4. VIEW DÀNH CHO KẾ TOÁN TÀI CHÍNH (ACCOUNTANT) */}
        {role === 'accountant' && (
          <AccountantTreasuryPanel accountantData={accountantData} />
        )}

        {/* 5. VIEW DÀNH CHO GIÁO VIÊN BẢN XỨ (TEACHER) */}
        {role === 'teacher' && (
          <TeacherWorkspacePanel workspaceData={teacherWorkspaceData} />
        )}

        {/* 6. VIEW DÀNH CHO HỌC VIÊN & PHỤ HUYNH (STUDENT) */}
        {role === 'student' && (
          <StudentPortalPanel portalData={studentPortalData} />
        )}
        {['director', 'admin'].includes(role) && <ClassMonitoringPanel classes={academicData.allActiveClasses} role={role} />}
      </Spin>
    </div>
  );
};
