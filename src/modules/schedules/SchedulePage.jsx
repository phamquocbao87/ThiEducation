import React, { useState } from 'react';
import { Button, Typography, Segmented, Card, Space, Tag } from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  TableOutlined,
  VideoCameraOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../../shared/hooks/useIsMobile';
import { useScheduleController } from './hooks/useScheduleController';
import { ScheduleFilterBar } from './components/ScheduleFilterBar';
import { ScheduleTable } from './components/ScheduleTable';
import { ScheduleFormModal } from './components/ScheduleFormModal';
import { ScheduleWeeklyCalendar } from './components/ScheduleWeeklyCalendar';
import { ClassRecordingsDirectoryCard } from '../../shared/components/ClassRecordingsDirectoryCard';
import { SessionRecordingUploadModal } from '../materials/components/SessionRecordingUploadModal';
import { MaterialPreviewModal } from '../materials/components/MaterialPreviewModal';

const { Title, Text } = Typography;

export const SchedulePage = () => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [uploadTarget, setUploadTarget] = useState(null); // { classData, isoDate }
  const [previewRecording, setPreviewRecording] = useState(null);

  const {
    currentUser,
    courses,
    teachers,
    classes,
    scopedTimetable,
    weekOffset,
    setWeekOffset,
    weekDays,
    sessionRecordings,
    slotRecordingsMap,
    canManageSlotRecording,
    handleRecordingUploaded,
    handleDeleteSlotRecording,
    selectedDayFilter,
    setSelectedDayFilter,
    permissions,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    handleAddScheduleSlot,
    handleCheckInSession,
  } = useScheduleController();

  const handleOpenUploadRecording = (slotItem, isoDate) => {
    const matchedClass = (classes || []).find((c) => c.id === slotItem?.classId);
    setUploadTarget({
      classData: {
        id: slotItem?.classId,
        name: slotItem?.className || matchedClass?.name || 'Online Class',
        courseId: slotItem?.courseId || matchedClass?.courseId || 'ALL',
        courseName: slotItem?.courseName || matchedClass?.courseName || '',
        courseLevel: slotItem?.courseLevel || matchedClass?.courseLevel || matchedClass?.level || '',
        teacherId: slotItem?.teacherId || matchedClass?.teacherId || '',
        teacherName: slotItem?.teacherName || matchedClass?.teacherName || '',
      },
      isoDate,
    });
  };

  return (
    <div>
      {/* 1. Header Tiêu Đề & Nút Xếp Lịch */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? 20 : undefined }}>
            <VideoCameraOutlined style={{ marginRight: 8, color: '#722ed1' }} />
            {isEnglish ? 'Live Online Class Schedules' : 'Thời Khóa Biểu Lớp Học Trực Tuyến'}
          </Title>
          <Text type="secondary">
            {isEnglish
              ? 'Real-time live class schedule, session recordings by date, and 1-tap classroom access.'
              : 'Theo dõi ca dạy trực tuyến, xem lại video ghi hình từng buổi học và truy cập phòng học 1-chạm.'}
          </Text>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 10,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <Segmented
            block={isMobile}
            value={viewMode}
            onChange={setViewMode}
            data-testid="segmented-schedule-view-mode"
            options={[
              {
                value: 'calendar',
                icon: <CalendarOutlined />,
                label: isMobile
                  ? isEnglish
                    ? 'Calendar'
                    : 'Lịch Tuần'
                  : isEnglish
                    ? 'Weekly Calendar'
                    : 'Lịch Tuần',
              },
              {
                value: 'table',
                icon: <TableOutlined />,
                label: isMobile
                  ? isEnglish
                    ? 'Table'
                    : 'Danh Sách'
                  : isEnglish
                    ? 'Table View'
                    : 'Bảng Danh Sách',
              },
              {
                value: 'recordings',
                icon: <VideoCameraOutlined />,
                label: isMobile
                  ? isEnglish
                    ? 'Videos'
                    : 'Video'
                  : isEnglish
                  ? 'Class Recordings'
                  : 'Tổng Hợp Recording',
              },
            ]}
            style={{ borderRadius: 8, background: '#f1f5f9', width: isMobile ? '100%' : 'auto' }}
          />

          {permissions.canManageCoursesAndSchedules && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsScheduleModalOpen(true)}
              style={{
                borderRadius: 8,
                backgroundColor: '#1890ff',
                minHeight: 40,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {isEnglish ? 'New Schedule Slot' : 'Xếp Ca Dạy Mới'}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Nội dung hiển thị theo View Mode */}
      {viewMode === 'recordings' ? (
        <ClassRecordingsDirectoryCard
          classes={classes}
          allRecordings={sessionRecordings}
          currentUser={currentUser}
          onWatchRecording={(rec) => setPreviewRecording(rec)}
          onOpenUploadRecording={(clsObj, isoDate) =>
            handleOpenUploadRecording(
              {
                classId: clsObj?.id,
                className: clsObj?.name,
                courseId: clsObj?.courseId,
                courseName: clsObj?.courseName,
                courseLevel: clsObj?.courseLevel || clsObj?.level,
                teacherId: clsObj?.teacherId,
                teacherName: clsObj?.teacherName,
              },
              isoDate
            )
          }
          onDeleteRecording={handleDeleteSlotRecording}
          testIdPrefix="schedule-recordings-dir"
        />
      ) : viewMode === 'calendar' ? (
        <ScheduleWeeklyCalendar
          timetable={scopedTimetable}
          canCheckIn={permissions.canCheckInClass}
          onCheckIn={handleCheckInSession}
          weekOffset={weekOffset}
          onChangeWeekOffset={setWeekOffset}
          slotRecordingsMap={slotRecordingsMap}
          canManageSlotRecording={canManageSlotRecording}
          onWatchRecording={(rec) => setPreviewRecording(rec)}
          onOpenUploadRecording={handleOpenUploadRecording}
          onDeleteRecording={handleDeleteSlotRecording}
        />
      ) : (
        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
          }}
          styles={{ body: { padding: isMobile ? '12px' : '16px 20px' } }}
        >
          {/* Thanh chuyển tuần đồng bộ ngay trên Bảng Danh Sách */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <Space size={8} wrap>
              <Button
                size="middle"
                icon={<LeftOutlined />}
                data-testid="btn-table-prev-week"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                style={{ borderRadius: 8 }}
              >
                {isEnglish ? 'Previous Week' : 'Tuần Trước'}
              </Button>
              <Button
                size="middle"
                type={weekOffset === 0 ? 'primary' : 'default'}
                data-testid="btn-table-current-week"
                onClick={() => setWeekOffset(0)}
                style={{ borderRadius: 8, fontWeight: weekOffset === 0 ? 600 : 400 }}
              >
                {isEnglish ? 'Current Week' : 'Tuần Hiện Tại'}
              </Button>
              <Button
                size="middle"
                data-testid="btn-table-next-week"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                style={{ borderRadius: 8 }}
              >
                {isEnglish ? 'Next Week' : 'Tuần Kế Tiếp'} <RightOutlined />
              </Button>
            </Space>

            <Space size={8} wrap>
              <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                📅 {isEnglish ? 'Week' : 'Tuần'}: {weekDays[0]?.dateFormatted} – {weekDays[6]?.dateFormatted}
              </Text>
              {weekOffset !== 0 && (
                <Tag color={weekOffset > 0 ? 'purple' : 'orange'} style={{ margin: 0, borderRadius: 6 }}>
                  {weekOffset > 0 ? `+${weekOffset}` : weekOffset} {isEnglish ? 'Week(s)' : 'Tuần'}
                </Tag>
              )}
            </Space>
          </div>

          <ScheduleFilterBar
            selectedDayFilter={selectedDayFilter}
            onChangeDayFilter={setSelectedDayFilter}
          />
          <ScheduleTable
            timetable={scopedTimetable}
            canCheckIn={permissions.canCheckInClass}
            onCheckIn={handleCheckInSession}
            weekOffset={weekOffset}
            slotRecordingsMap={slotRecordingsMap}
            canManageSlotRecording={canManageSlotRecording}
            onWatchRecording={(rec) => setPreviewRecording(rec)}
            onOpenUploadRecording={handleOpenUploadRecording}
            onDeleteRecording={handleDeleteSlotRecording}
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

      {/* 4. Modal Upload / Gắn Recording cho đúng Ngày & Lớp học trên Thời Khóa Biểu */}
      <SessionRecordingUploadModal
        open={Boolean(uploadTarget)}
        classData={uploadTarget?.classData || {}}
        initialSessionDate={uploadTarget?.isoDate || null}
        currentUser={currentUser}
        onClose={() => setUploadTarget(null)}
        onSuccess={(savedRec) => {
          handleRecordingUploaded(savedRec);
          setUploadTarget(null);
        }}
      />

      {/* 5. Modal Xem Lại Video Ghi Hình Toàn Màn Hình Trực Tiếp Trong Ứng Dụng */}
      <MaterialPreviewModal
        open={Boolean(previewRecording)}
        material={previewRecording}
        courses={courses}
        onClose={() => setPreviewRecording(null)}
        zIndex={1250}
      />
    </div>
  );
};
