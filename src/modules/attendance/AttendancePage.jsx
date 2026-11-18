import React from 'react';
import { Tabs, Space, Typography, Spin } from 'antd';
import { StarOutlined, FormOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useAttendanceController } from './hooks/useAttendanceController';
import { ActiveClassCards } from './components/ActiveClassCards';
import { SessionEvaluationTable } from './components/SessionEvaluationTable';
import { SessionEvaluationModal } from './components/SessionEvaluationModal';
import { StudentProfileDrawer } from './components/StudentProfileDrawer';
import { HomeworkAssignmentPanel } from './components/HomeworkAssignmentPanel';
import { StudentAttendancePersonalView } from './components/StudentAttendancePersonalView';

const { Title, Text } = Typography;

export const AttendancePage = () => {
  const { t, translateLabel } = useLanguage();
  const {
    currentUser,
    loading,
    scopedClasses,
    scopedAttendances,
    scopedHomeworks,
    studentsInSelectedClass,
    selectedClass,
    studentRoster,
    permissions,
    isStudentRole,
    myClass,
    myPersonalAttendances,
    personalStats,
    isEvaluationModalOpen,
    setIsEvaluationModalOpen,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    handleCheckInClass,
    handleOpenEvaluateModal,
    handleOpenProfileDrawer,
    handleToggleStudentPresence,
    handleSubmitEvaluation,
    handleSaveStudentNote,
    handleSubmitHomework,
  } = useAttendanceController();

  // 1. VIEW HỌC VIÊN: CỔNG NHẬT KÝ RÈN LUYỆN & CHUYÊN CẦN CÁ NHÂN
  if (permissions.isStudent) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            {t('pages.studentAttendanceTitle')}
          </Title>
          <Text type="secondary">{t('pages.studentAttendanceSub')}</Text>
        </div>

        <Spin spinning={loading} tip={t('common.loading', { defaultValue: 'Đang tải dữ liệu từ Cloud Firestore...' })}>
          <StudentAttendancePersonalView
            currentUser={currentUser}
            myClass={myClass}
            myPersonalAttendances={myPersonalAttendances}
            scopedHomeworks={scopedHomeworks}
            personalStats={personalStats}
            onSubmitHomework={handleSubmitHomework}
          />
        </Spin>
      </div>
    );
  }

  // 2. VIEW GIÁO VIÊN / CÁN BỘ QUẢN LÝ: ĐIỀU HÀNH CA DẠY VÀ ĐÁNH GIÁ CHUNG
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('pages.attendanceTitle')} ({translateLabel(currentUser.roleLabel)})
        </Title>
        <Text type="secondary">{t('pages.attendanceSub')}</Text>
      </div>

      <Spin spinning={loading} tip={t('common.loading', { defaultValue: 'Đang tải dữ liệu từ Cloud Firestore...' })}>
        <ActiveClassCards
          classes={scopedClasses}
          canCheckIn={permissions.canCheckIn}
          canEvaluate={permissions.canEvaluate}
          onCheckIn={handleCheckInClass}
          onOpenEvaluate={handleOpenEvaluateModal}
          onOpenStudentProfiles={handleOpenProfileDrawer}
        />

        <Tabs
          defaultActiveKey="evaluations"
          items={[
            {
              key: 'evaluations',
              label: (
                <Space>
                  <StarOutlined />
                  <span>{`${t('pages.tabEvaluations')} (${scopedAttendances.length})`}</span>
                </Space>
              ),
              children: <SessionEvaluationTable attendances={scopedAttendances} />,
            },
            {
              key: 'homeworks',
              label: (
                <Space>
                  <FormOutlined />
                  <span>{`${t('pages.tabHomeworks')} (${scopedHomeworks.length})`}</span>
                </Space>
              ),
              children: (
                <HomeworkAssignmentPanel
                  homeworks={scopedHomeworks}
                  isStudent={permissions.isStudent}
                  onSubmitHomework={handleSubmitHomework}
                />
              ),
            },
          ]}
        />
      </Spin>

      <SessionEvaluationModal
        open={isEvaluationModalOpen}
        selectedClass={selectedClass}
        studentRoster={studentRoster}
        onToggleStudentPresence={handleToggleStudentPresence}
        onCancel={() => setIsEvaluationModalOpen(false)}
        onSubmit={handleSubmitEvaluation}
      />

      <StudentProfileDrawer
        open={isProfileDrawerOpen}
        selectedClass={selectedClass}
        students={studentsInSelectedClass}
        canEditNote={permissions.canEvaluate}
        onClose={() => setIsProfileDrawerOpen(false)}
        onSaveStudentNote={handleSaveStudentNote}
      />
    </div>
  );
};
