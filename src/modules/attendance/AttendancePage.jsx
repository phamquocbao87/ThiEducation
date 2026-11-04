import React from 'react';
import { Tabs, Space, Typography } from 'antd';
import { StarOutlined, FormOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useAttendanceController } from './hooks/useAttendanceController';
import { ActiveClassCards } from './components/ActiveClassCards';
import { SessionEvaluationTable } from './components/SessionEvaluationTable';
import { SessionEvaluationModal } from './components/SessionEvaluationModal';
import { StudentProfileDrawer } from './components/StudentProfileDrawer';
import { HomeworkAssignmentPanel } from './components/HomeworkAssignmentPanel';

const { Title, Text } = Typography;

export const AttendancePage = () => {
  const { t, translateLabel } = useLanguage();
  const {
    currentUser,
    scopedClasses,
    scopedAttendances,
    scopedHomeworks,
    studentsInSelectedClass,
    selectedClass,
    studentRoster,
    permissions,
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('pages.attendanceTitle')} ({translateLabel(currentUser.roleLabel)})
        </Title>
        <Text type="secondary">{t('pages.attendanceSub')}</Text>
      </div>

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
