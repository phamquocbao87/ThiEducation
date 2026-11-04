import React from 'react';
import { Row, Col, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useScheduleController } from './hooks/useScheduleController';
import { CourseCatalogSection } from './components/CourseCatalogSection';
import { CourseFormModal } from './components/CourseFormModal';
import { ScheduleFilterBar } from './components/ScheduleFilterBar';
import { ScheduleTable } from './components/ScheduleTable';
import { ScheduleFormModal } from './components/ScheduleFormModal';

const { Title, Text } = Typography;

export const SchedulePage = () => {
  const { t, translateLabel } = useLanguage();
  const {
    currentUser,
    courses,
    teachers,
    scopedTimetable,
    selectedDayFilter,
    setSelectedDayFilter,
    permissions,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isCourseModalOpen,
    setIsCourseModalOpen,
    handleCreateCourse,
    handleAddScheduleSlot,
    handleCheckInSession,
  } = useScheduleController();

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            {t('pages.schedulesTitle')} ({translateLabel(currentUser.roleLabel)})
          </Title>
          <Text type="secondary">{t('pages.schedulesSub')}</Text>
        </Col>
        {permissions.canManageCoursesAndSchedules && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsScheduleModalOpen(true)}>
              {t('pages.scheduleNewSlotBtn')}
            </Button>
          </Col>
        )}
      </Row>

      {permissions.showCourseCatalog && (
        <CourseCatalogSection
          courses={courses}
          canManage={permissions.canManageCoursesAndSchedules}
          onOpenCreateCourse={() => setIsCourseModalOpen(true)}
        />
      )}

      <ScheduleFilterBar
        selectedDayFilter={selectedDayFilter}
        onChangeDayFilter={setSelectedDayFilter}
      />

      <ScheduleTable
        timetable={scopedTimetable}
        canCheckIn={permissions.canCheckInClass}
        onCheckIn={handleCheckInSession}
      />

      <ScheduleFormModal
        open={isScheduleModalOpen}
        teachers={teachers}
        onCancel={() => setIsScheduleModalOpen(false)}
        onSubmit={handleAddScheduleSlot}
      />

      <CourseFormModal
        open={isCourseModalOpen}
        onCancel={() => setIsCourseModalOpen(false)}
        onSubmit={handleCreateCourse}
      />
    </div>
  );
};
