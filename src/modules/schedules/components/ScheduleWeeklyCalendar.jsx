import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Typography, Button, Space, Badge, Tooltip, Empty } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../models/schedules.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

const DAYS = [
  { key: 'Thứ 2', en: 'Monday', vi: 'Thứ Hai' },
  { key: 'Thứ 3', en: 'Tuesday', vi: 'Thứ Ba' },
  { key: 'Thứ 4', en: 'Wednesday', vi: 'Thứ Tư' },
  { key: 'Thứ 5', en: 'Thursday', vi: 'Thứ Năm' },
  { key: 'Thứ 6', en: 'Friday', vi: 'Thứ Sáu' },
  { key: 'Thứ 7', en: 'Saturday', vi: 'Thứ Bảy' },
  { key: 'Chủ Nhật', en: 'Sunday', vi: 'Chủ Nhật' },
];

export const ScheduleWeeklyCalendar = ({ timetable, canCheckIn, onCheckIn }) => {
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();

  if (!timetable || timetable.length === 0) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          padding: '48px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          marginTop: 12,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ padding: '8px 0' }}>
              <Text strong style={{ fontSize: 16, display: 'block', color: '#334155', marginBottom: 6 }}>
                {isEnglish ? 'No Scheduled Zoom Classes' : 'Chưa Có Thời Khóa Biểu Lớp Học Nào'}
              </Text>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.6 }}>
                {isEnglish
                  ? 'There are currently no active classes in the system. Create a course program and open classes in Courses & Classes to set up weekly live Zoom timetables.'
                  : 'Hệ thống hiện chưa có lớp học nào được mở. Vui lòng tạo khóa học và mở lớp tại Quản Lý Khóa Học & Lớp Học để phân công lịch dạy trực tuyến Zoom.'}
              </Text>
              <Button
                type="primary"
                icon={<BookOutlined />}
                onClick={() => navigate('/courses-classes')}
                style={{
                  borderRadius: 8,
                  backgroundColor: '#1890ff',
                  height: 38,
                  boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                  fontWeight: 600,
                }}
              >
                {isEnglish ? 'Go to Courses & Classes' : 'Đến Quản Lý Khóa Học & Lớp Học'}
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <Row gutter={[12, 12]}>
        {DAYS.map((day) => {
          const sessions = timetable.filter((s) => s.day === day.key);
          const hasSessions = sessions.length > 0;

          return (
            <Col xs={24} sm={12} md={8} lg={24 / 7} key={day.key} style={{ minWidth: 155 }}>
              <div
                style={{
                  background: hasSessions ? '#ffffff' : '#f8fafc',
                  border: hasSessions ? '1px solid #cbd5e1' : '1px dashed #e2e8f0',
                  borderRadius: 12,
                  padding: 10,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: hasSessions ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                {/* Header Ngày */}
                <div
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    backgroundColor: hasSessions ? '#e6f4ff' : '#f1f5f9',
                    marginBottom: 10,
                    textAlign: 'center',
                  }}
                >
                  <Text strong style={{ color: hasSessions ? '#1677ff' : '#64748b', fontSize: 13 }}>
                    {isEnglish ? day.en : day.vi}
                  </Text>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {sessions.length} {isEnglish ? 'sessions' : 'ca học'}
                  </div>
                </div>

                {/* Danh sách các ca học trong ngày */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {sessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 12 }}>
                      {isEnglish ? 'No classes' : 'Không có ca'}
                    </div>
                  ) : (
                    sessions.map((item) => {
                      const statusMeta = SESSION_STATUS_LABELS[item.status] || { text: item.status, color: 'default' };
                      const isUpcoming = item.status === SESSION_STATUS.UPCOMING;

                      return (
                        <Card
                          key={item.id}
                          size="small"
                          style={{
                            borderRadius: 8,
                            borderColor: item.status === SESSION_STATUS.CHECKED_IN ? '#86efac' : '#e2e8f0',
                            backgroundColor: item.status === SESSION_STATUS.CHECKED_IN ? '#f0fdf4' : '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                          styles={{ body: { padding: '10px 8px' } }}
                        >
                          {/* Khung giờ & Trạng thái */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Tag color="blue" style={{ fontSize: 11, margin: 0, padding: '0 4px' }}>
                              <ClockCircleOutlined style={{ marginRight: 2 }} />
                              {item.timeSlot}
                            </Tag>
                            <Tag color={statusMeta.color} style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>
                              {item.status === 'CHECKED_IN' ? (isEnglish ? 'Checked-In' : 'Đã vào') : item.status === 'UPCOMING' ? (isEnglish ? 'Upcoming' : 'Sắp tới') : (isEnglish ? 'Finished' : 'Xong')}
                            </Tag>
                          </div>

                          {/* Tên lớp */}
                          <Text strong style={{ color: '#0f172a', fontSize: 12, display: 'block', marginTop: 4 }}>
                            {item.className}
                          </Text>

                          {/* Giáo viên */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#475569' }}>
                            <UserOutlined style={{ color: '#1890ff' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.teacherName}
                            </span>
                          </div>

                          {/* Nút hành động nhanh */}
                          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {item.meetingLink && (
                              <Button
                                size="small"
                                type="primary"
                                icon={<VideoCameraOutlined />}
                                onClick={() => window.open(item.meetingLink, '_blank')}
                                style={{
                                  fontSize: 11,
                                  height: 24,
                                  padding: '0 6px',
                                  backgroundColor: '#722ed1',
                                  borderRadius: 4,
                                }}
                              >
                                {isEnglish ? 'Zoom' : 'Vào Zoom'}
                              </Button>
                            )}

                            {canCheckIn && isUpcoming && (
                              <Button
                                size="small"
                                type="default"
                                icon={<CheckCircleOutlined />}
                                onClick={() => onCheckIn(item.id)}
                                style={{
                                  fontSize: 11,
                                  height: 24,
                                  padding: '0 6px',
                                  borderColor: '#52c41a',
                                  color: '#52c41a',
                                  borderRadius: 4,
                                }}
                              >
                                {isEnglish ? 'Check-in' : 'Điểm danh'}
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

