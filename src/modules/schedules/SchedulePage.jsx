import React, { useState } from 'react';
import { Row, Col, Button, Typography, Segmented, Card, Space } from 'antd';
import { PlusOutlined, CalendarOutlined, TableOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useScheduleController } from './hooks/useScheduleController';
import { ScheduleFilterBar } from './components/ScheduleFilterBar';
import { ScheduleTable } from './components/ScheduleTable';
import { ScheduleFormModal } from './components/ScheduleFormModal';
import { ScheduleWeeklyCalendar } from './components/ScheduleWeeklyCalendar';

const { Title, Text } = Typography;

export const SchedulePage = () => {
  const { isEnglish, translateLabel } = useLanguage();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'

  const {
    currentUser,
    teachers,
    classes,
    scopedTimetable,
    selectedDayFilter,
    setSelectedDayFilter,
    permissions,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    handleAddScheduleSlot,
    handleCheckInSession,
  } = useScheduleController();

  return (
    <div>
      {/* 1. Header Tiêu Đề & Nút Xếp Lịch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            <VideoCameraOutlined style={{ marginRight: 8, color: '#722ed1' }} />
            {isEnglish ? 'Live Online Zoom Schedules' : 'Thời Khóa Biểu & Phòng Zoom Trực Tuyến'}
          </Title>
          <Text type="secondary">
            {isEnglish
              ? 'Real-time schedule of live classes, teacher check-in status, and 1-tap Zoom meeting access.'
              : 'Theo dõi ca dạy trực tuyến thời gian thực, trạng thái check-in của giáo viên và truy cập phòng Zoom 1-chạm.'}
          </Text>
        </div>

        <Space size={10}>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                value: 'calendar',
                icon: <CalendarOutlined />,
                label: isEnglish ? 'Weekly Calendar' : 'Lịch Tuần',
              },
              {
                value: 'table',
                icon: <TableOutlined />,
                label: isEnglish ? 'Table View' : 'Bảng Danh Sách',
              },
            ]}
            style={{ borderRadius: 8, background: '#f1f5f9' }}
          />

          {permissions.canManageCoursesAndSchedules && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsScheduleModalOpen(true)}
              style={{ borderRadius: 8, backgroundColor: '#1890ff' }}
            >
              {isEnglish ? 'New Schedule Slot' : 'Xếp Ca Dạy Mới'}
            </Button>
          )}
        </Space>
      </div>

      {/* 2. Nội dung hiển thị theo View Mode */}
      {viewMode === 'calendar' ? (
        <ScheduleWeeklyCalendar
          timetable={scopedTimetable}
          canCheckIn={permissions.canCheckInClass}
          onCheckIn={handleCheckInSession}
        />
      ) : (
        <Card
          bordered={false}
          style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <ScheduleFilterBar
            selectedDayFilter={selectedDayFilter}
            onChangeDayFilter={setSelectedDayFilter}
          />
          <ScheduleTable
            timetable={scopedTimetable}
            canCheckIn={permissions.canCheckInClass}
            onCheckIn={handleCheckInSession}
          />
        </Card>
      )}

      {/* 3. Modal xếp ca dạy mới */}
      <ScheduleFormModal
        open={isScheduleModalOpen}
        teachers={teachers}
        classes={classes}
        onCancel={() => setIsScheduleModalOpen(false)}
        onSubmit={handleAddScheduleSlot}
      />
    </div>
  );
};
