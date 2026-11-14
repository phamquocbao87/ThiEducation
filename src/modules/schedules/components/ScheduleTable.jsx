import React, { useMemo, useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Typography, Empty, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../models/schedules.model';
import { useLanguage } from '../../../core/context/LanguageContext';
import { detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';
import { TimetableSlotService } from '../services/TimetableSlotService';

const { Text } = Typography;

export const ScheduleTable = ({ timetable, canCheckIn, onCheckIn }) => {
  const { isEnglish } = useLanguage();

  // 1. Đồng hồ ticking mỗi 15 giây để tự động cập nhật trạng thái mở khóa 15 phút thời gian thực
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // 2. Tính danh sách ngày trong tuần hiện tại
  const currentWeekDays = useMemo(() => {
    return TimetableSlotService.getWeekDays(0);
  }, []);

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Day & Date' : 'Thứ & Ngày Học',
        dataIndex: 'day',
        key: 'day',
        width: 140,
        render: (day, record) => {
          const matchedDay = currentWeekDays.find((d) => d.dayKey === day);
          return (
            <div>
              <Tag
                color={matchedDay?.isToday ? 'blue' : 'default'}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  marginBottom: 3,
                }}
              >
                {day} {matchedDay?.isToday ? (isEnglish ? '• Today' : '• Hôm nay') : ''}
              </Tag>
              {matchedDay && (
                <div style={{ fontSize: 11, color: matchedDay.isToday ? '#0958d9' : '#64748b', fontWeight: matchedDay.isToday ? 600 : 400 }}>
                  📅 {matchedDay.dateFormatted}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: isEnglish ? 'Time Slot' : 'Khung Giờ',
        dataIndex: 'timeSlot',
        key: 'timeSlot',
        render: (timeSlot) => (
          <Space>
            <ClockCircleOutlined style={{ color: '#1890ff' }} />
            <Text strong>{timeSlot}</Text>
          </Space>
        ),
      },
      {
        title: isEnglish ? 'Online Class' : 'Lớp Học Trực Tuyến',
        dataIndex: 'className',
        key: 'className',
        render: (text) => <Text strong style={{ color: '#722ed1' }}>{text}</Text>,
      },
      {
        title: isEnglish ? 'Subject / Skills' : 'Môn Học / Kỹ Năng',
        dataIndex: 'subject',
        key: 'subject',
      },
      {
        title: isEnglish ? 'Teacher in Charge' : 'Giáo Viên Phụ Trách',
        dataIndex: 'teacherName',
        key: 'teacherName',
        render: (text) => (
          <Space>
            <UserOutlined />
            <Text>{text}</Text>
          </Space>
        ),
      },
      {
        title: isEnglish ? 'Platform' : 'Nền Tảng',
        dataIndex: 'platform',
        key: 'platform',
        render: (platform) => (
          <Space>
            <VideoCameraOutlined style={{ color: '#722ed1' }} />
            <Tag color="purple">{platform}</Tag>
          </Space>
        ),
      },
      {
        title: isEnglish ? 'Session Timing Status' : 'Trạng Thái Ca Học',
        dataIndex: 'status',
        key: 'status',
        render: (status, record) => {
          const matchedDay = currentWeekDays.find((d) => d.dayKey === record.day);
          const timeState = TimetableSlotService.getSessionTimingState(
            matchedDay?.dateObj,
            record.startTime,
            record.endTime,
            now
          );

          if (record.status === SESSION_STATUS.CHECKED_IN) {
            return (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {isEnglish ? 'Checked In' : 'Đã điểm danh'}
              </Tag>
            );
          }

          if (timeState.state === 'LIVE') {
            return (
              <Tag color="error" style={{ fontWeight: 700 }}>
                🔴 {isEnglish ? 'LIVE NOW' : 'ĐANG HỌC'}
              </Tag>
            );
          }

          if (timeState.state === 'STARTING_SOON') {
            return (
              <Tag color="warning" style={{ fontWeight: 600 }}>
                ⏳ {isEnglish ? `In ${timeState.startsInMins}m` : `Còn ${timeState.startsInMins}p`}
              </Tag>
            );
          }

          if (timeState.state === 'FINISHED') {
            return (
              <Tag color="default">
                {isEnglish ? 'Finished' : 'Đã kết thúc'}
              </Tag>
            );
          }

          return (
            <Tag color="blue">
              {isEnglish ? 'Upcoming' : 'Sắp tới'}
            </Tag>
          );
        },
      },
      {
        title: isEnglish ? 'Classroom Actions' : 'Thao Tác Phòng Học',
        key: 'action',
        render: (_, record) => {
          const matchedDay = currentWeekDays.find((d) => d.dayKey === record.day);
          const timeState = TimetableSlotService.getSessionTimingState(
            matchedDay?.dateObj,
            record.startTime,
            record.endTime,
            now
          );

          return (
            <Space wrap>
              {/* Nút Vào Meet: Khóa nếu chưa đến 15 phút trước giờ học */}
              {record.meetingLink && (() => {
                const platform = detectMeetingPlatform(record.meetingLink);
                const isMeet = platform.type === 'google_meet';

                if (timeState.canAccess) {
                  // Mở Meet
                  return (
                    <Tooltip
                      title={
                        timeState.state === 'LIVE'
                          ? isEnglish ? 'Class is live! Click to join Meet.' : 'Lớp đang diễn ra! Bấm để vào Meet ngay.'
                          : isEnglish ? 'Class starts in 15 minutes. Meet is open!' : 'Lớp sắp diễn ra trong 15 phút. Phòng Meet đã mở!'
                      }
                    >
                      <Button
                        type="primary"
                        size="small"
                        icon={platform.iconSmall || <LinkOutlined />}
                        style={{
                          background: isMeet ? '#0f9d58' : '#1890ff',
                          borderColor: isMeet ? '#0f9d58' : '#1890ff',
                          borderRadius: 6,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: timeState.state === 'LIVE' ? '0 2px 6px rgba(15,157,88,0.35)' : 'none',
                        }}
                        onClick={() => window.open(record.meetingLink, '_blank')}
                      >
                        {timeState.state === 'LIVE' ? '🔴 ' : ''}
                        {isEnglish ? (isMeet ? 'Google Meet' : 'Join Classroom') : (isMeet ? 'Vào Meet' : 'Vào Lớp')}
                      </Button>
                    </Tooltip>
                  );
                }

                if (timeState.state === 'FINISHED') {
                  return (
                    <Tooltip title={isEnglish ? 'Session has ended' : 'Ca học đã kết thúc'}>
                      <span>
                        <Button
                          size="small"
                          disabled
                          icon={<VideoCameraOutlined />}
                          style={{
                            borderRadius: 6,
                            color: '#94a3b8',
                            backgroundColor: '#f1f5f9',
                            borderColor: '#e2e8f0',
                          }}
                        >
                          {isEnglish ? 'Finished' : 'Đã kết thúc'}
                        </Button>
                      </span>
                    </Tooltip>
                  );
                }

                // Khóa Meet (< 15p)
                return (
                  <Tooltip
                    title={
                      isEnglish
                        ? `Google Meet opens 15m before class (opens at ${timeState.unlockTimeStr} on ${matchedDay?.shortDate})`
                        : `Link Google Meet chỉ mở trước giờ học 15 phút (mở lúc ${timeState.unlockTimeStr} ngày ${matchedDay?.shortDate})`
                    }
                  >
                    <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                      <Button
                        size="small"
                        disabled
                        icon={<LockOutlined />}
                        style={{
                          borderRadius: 6,
                          color: '#94a3b8',
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          pointerEvents: 'none',
                        }}
                      >
                        {isEnglish ? 'Meet (Locked)' : 'Meet (Khóa)'}
                      </Button>
                    </span>
                  </Tooltip>
                );
              })()}

              {/* Nút Điểm danh: Khóa nếu chưa đến 15 phút trước giờ học */}
              {canCheckIn && (() => {
                if (record.status === SESSION_STATUS.CHECKED_IN) {
                  return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      {isEnglish ? 'Checked In' : 'Đã điểm danh'}
                    </Tag>
                  );
                }

                if (timeState.canAccess) {
                  return (
                    <Tooltip
                      title={
                        isEnglish
                          ? 'Classroom is open! Click to check in and record attendance.'
                          : 'Đã đến giờ! Nhấn để điểm danh ca dạy.'
                      }
                    >
                      <Button
                        size="small"
                        type="default"
                        icon={<CheckCircleOutlined />}
                        onClick={() => onCheckIn(record.id)}
                        style={{
                          borderColor: '#52c41a',
                          color: '#52c41a',
                          backgroundColor: '#f6ffed',
                          fontWeight: 600,
                          borderRadius: 6,
                        }}
                      >
                        {isEnglish ? 'Check-in Class' : 'Điểm danh'}
                      </Button>
                    </Tooltip>
                  );
                }

                if (timeState.state === 'FINISHED') {
                  return null;
                }

                return (
                  <Tooltip
                    title={
                      isEnglish
                        ? `Attendance check-in opens 15m before class (opens at ${timeState.unlockTimeStr} on ${matchedDay?.shortDate})`
                        : `Chỉ cho phép điểm danh trước giờ học 15 phút (mở lúc ${timeState.unlockTimeStr} ngày ${matchedDay?.shortDate})`
                    }
                  >
                    <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                      <Button
                        size="small"
                        disabled
                        icon={<LockOutlined />}
                        style={{
                          borderRadius: 6,
                          color: '#94a3b8',
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          pointerEvents: 'none',
                        }}
                      >
                        {isEnglish ? 'Check-in (Locked)' : 'Điểm danh (Khóa)'}
                      </Button>
                    </span>
                  </Tooltip>
                );
              })()}
            </Space>
          );
        },
      },
    ],
    [isEnglish, canCheckIn, onCheckIn, currentWeekDays, now]
  );

  return (
    <Table
      columns={columns}
      dataSource={timetable}
      rowKey="id"
      scroll={{ x: 900 }}
      pagination={{
        pageSize: 6,
        showTotal: (total) =>
          isEnglish ? `Total ${total} sessions` : `Tổng cộng ${total} ca học`,
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isEnglish
                ? 'No scheduled sessions found. Create classes to set up schedules.'
                : 'Không có ca học nào trong thời khóa biểu. Hãy mở lớp học để xếp lịch dạy.'
            }
          />
        ),
      }}
    />
  );
};
