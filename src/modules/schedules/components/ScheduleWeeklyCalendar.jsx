import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Typography, Button, Space, Tooltip, Empty } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { SESSION_STATUS } from '../models/schedules.model';
import { useLanguage } from '../../../core/context/LanguageContext';
import { detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';
import { TimetableSlotService } from '../services/TimetableSlotService';

const { Text } = Typography;

export const ScheduleWeeklyCalendar = ({ timetable, canCheckIn, onCheckIn }) => {
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();

  // 1. Quản lý trạng thái tuần (offset = 0: Tuần hiện tại)
  const [weekOffset, setWeekOffset] = useState(0);

  // 2. Đồng hồ ticking mỗi 15 giây để tự động cập nhật trạng thái mở khóa 15 phút thời gian thực
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // 3. Tính toán 7 ngày trong tuần theo offset đã chọn
  const weekDays = useMemo(() => {
    return TimetableSlotService.getWeekDays(weekOffset);
  }, [weekOffset]);

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
                {isEnglish ? 'No Scheduled Classes' : 'Chưa Có Thời Khóa Biểu Lớp Học Nào'}
              </Text>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.6 }}>
                {isEnglish
                  ? 'There are currently no active classes in the system. Create a course program and open classes in Courses & Classes to set up weekly live timetables.'
                  : 'Hệ thống hiện chưa có lớp học nào được mở. Vui lòng tạo khóa học và mở lớp tại Quản Lý Khóa Học & Lớp Học để phân công lịch dạy trực tuyến.'}
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
      {/* 1. Thanh Điều Hướng Tuần & Phạm Vi Ngày Dương Lịch */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '12px 16px',
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Space size={8} wrap>
          <Button
            size="middle"
            icon={<LeftOutlined />}
            onClick={() => setWeekOffset((prev) => prev - 1)}
            style={{ borderRadius: 8 }}
          >
            {isEnglish ? 'Previous Week' : 'Tuần Trước'}
          </Button>

          <Button
            size="middle"
            type={weekOffset === 0 ? 'primary' : 'default'}
            onClick={() => setWeekOffset(0)}
            style={{ borderRadius: 8, fontWeight: weekOffset === 0 ? 600 : 400 }}
          >
            {isEnglish ? 'Current Week' : 'Tuần Hiện Tại'}
          </Button>

          <Button
            size="middle"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            style={{ borderRadius: 8 }}
          >
            {isEnglish ? 'Next Week' : 'Tuần Kế Tiếp'} <RightOutlined />
          </Button>
        </Space>

        <Space size={10} wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
              {isEnglish ? 'Week' : 'Tuần'}: {weekDays[0]?.dateFormatted} – {weekDays[6]?.dateFormatted}
            </Text>
          </div>

          {weekOffset === 0 ? (
            <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
              {isEnglish ? 'This Week' : 'Tuần Này'}
            </Tag>
          ) : weekOffset > 0 ? (
            <Tag color="purple" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6 }}>
              {isEnglish ? `+${weekOffset} Week(s)` : `+${weekOffset} Tuần`}
            </Tag>
          ) : (
            <Tag color="orange" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6 }}>
              {isEnglish ? `${weekOffset} Week(s)` : `${weekOffset} Tuần`}
            </Tag>
          )}

          {/* Quy định khóa 15 phút */}
          <Tag color="cyan" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
            ⏰ {isEnglish ? 'Meet & Check-in opens 15m before class' : 'Mở Meet & Điểm danh trước giờ học 15p'}
          </Tag>
        </Space>
      </div>

      {/* 2. Lưới 7 Ngày Trong Tuần Với Ngày Dương Lịch & Khóa 15 Phút */}
      <Row gutter={[12, 12]}>
        {weekDays.map((day) => {
          const sessions = timetable.filter((s) => s.day === day.dayKey);
          const hasSessions = sessions.length > 0;

          return (
            <Col xs={24} sm={12} md={8} lg={24 / 7} key={day.dayKey} style={{ minWidth: 155 }}>
              <div
                style={{
                  background: day.isToday ? '#f0f9ff' : hasSessions ? '#ffffff' : '#f8fafc',
                  border: day.isToday ? '1.5px solid #69b1ff' : hasSessions ? '1px solid #cbd5e1' : '1px dashed #e2e8f0',
                  borderRadius: 12,
                  padding: 10,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: day.isToday
                    ? '0 3px 10px rgba(24,144,255,0.1)'
                    : hasSessions
                    ? '0 2px 6px rgba(0,0,0,0.03)'
                    : 'none',
                }}
              >
                {/* Header Cột: Thứ & Ngày Dương Lịch Cụ Thể */}
                <div
                  style={{
                    padding: '8px 8px',
                    borderRadius: 8,
                    backgroundColor: day.isToday
                      ? '#bae0ff'
                      : hasSessions
                      ? '#e6f4ff'
                      : '#f1f5f9',
                    marginBottom: 10,
                    textAlign: 'center',
                    border: day.isToday ? '1px solid #91caff' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                    <Text
                      strong
                      style={{
                        color: day.isToday ? '#0958d9' : hasSessions ? '#1677ff' : '#64748b',
                        fontSize: 13,
                      }}
                    >
                      {isEnglish ? day.enDayName : day.viDayName}
                    </Text>
                    {day.isToday && (
                      <Tag
                        color="blue"
                        style={{
                          fontSize: 10,
                          padding: '0 4px',
                          margin: 0,
                          lineHeight: '16px',
                          fontWeight: 700,
                          borderRadius: 3,
                        }}
                      >
                        {isEnglish ? 'Today' : 'Hôm nay'}
                      </Tag>
                    )}
                  </div>

                  {/* Ngày tháng năm của cột */}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: day.isToday ? '#0958d9' : '#334155',
                      marginTop: 2,
                    }}
                  >
                    📅 {day.shortDate}
                  </div>

                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
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
                      const timeState = TimetableSlotService.getSessionTimingState(
                        day.dateObj,
                        item.startTime,
                        item.endTime,
                        now
                      );

                      return (
                        <Card
                          key={item.id}
                          size="small"
                          style={{
                            borderRadius: 10,
                            borderColor:
                              timeState.state === 'LIVE'
                                ? '#ff7875'
                                : item.status === SESSION_STATUS.CHECKED_IN
                                ? '#86efac'
                                : '#e2e8f0',
                            backgroundColor:
                              timeState.state === 'LIVE'
                                ? '#fff1f0'
                                : item.status === SESSION_STATUS.CHECKED_IN
                                ? '#f0fdf4'
                                : '#ffffff',
                            boxShadow:
                              timeState.state === 'LIVE'
                                ? '0 0 0 1px #ff4d4f, 0 2px 8px rgba(255,77,79,0.15)'
                                : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s ease',
                          }}
                          styles={{ body: { padding: '10px 8px' } }}
                        >
                          {/* 1. Header Card: Ngày Học (Hiển thị rõ trên từng Card theo yêu cầu Sếp Bảo) */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 6,
                              gap: 4,
                            }}
                          >
                            <Tag
                              color={day.isToday ? 'cyan' : 'default'}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                margin: 0,
                                padding: '1px 6px',
                                borderRadius: 4,
                                border: day.isToday ? '1px solid #13c2c2' : '1px solid #cbd5e1',
                                background: day.isToday ? '#e6fffb' : '#f8fafc',
                                color: day.isToday ? '#006d75' : '#334155',
                              }}
                            >
                              📅 {day.dateFormatted}
                            </Tag>

                            {/* Badge trạng thái thời gian buổi học */}
                            {timeState.state === 'LIVE' ? (
                              <Tag
                                color="error"
                                style={{
                                  fontSize: 10,
                                  margin: 0,
                                  padding: '0 5px',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                }}
                              >
                                🔴 {isEnglish ? 'LIVE NOW' : 'ĐANG HỌC'}
                              </Tag>
                            ) : timeState.state === 'STARTING_SOON' ? (
                              <Tag
                                color="warning"
                                style={{
                                  fontSize: 10,
                                  margin: 0,
                                  padding: '0 5px',
                                  fontWeight: 600,
                                  borderRadius: 4,
                                }}
                              >
                                ⏳ {isEnglish ? `In ${timeState.startsInMins}m` : `Còn ${timeState.startsInMins}p`}
                              </Tag>
                            ) : timeState.state === 'FINISHED' ? (
                              <Tag
                                color="default"
                                style={{ fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}
                              >
                                {isEnglish ? 'Finished' : 'Đã kết thúc'}
                              </Tag>
                            ) : (
                              <Tag
                                color="blue"
                                style={{ fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}
                              >
                                {isEnglish ? 'Upcoming' : 'Sắp tới'}
                              </Tag>
                            )}
                          </div>

                          {/* 2. Khung giờ học */}
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                            <Tag
                              color="blue"
                              style={{
                                fontSize: 11,
                                margin: 0,
                                padding: '1px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: 4,
                              }}
                            >
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {item.timeSlot}
                            </Tag>
                            {day.isToday && (
                              <Tag
                                color="gold"
                                style={{
                                  fontSize: 10,
                                  margin: '0 0 0 4px',
                                  padding: '0 4px',
                                  fontWeight: 600,
                                  borderRadius: 4,
                                }}
                              >
                                {isEnglish ? 'Today' : 'Hôm nay'}
                              </Tag>
                            )}
                          </div>

                          {/* 3. Tên lớp học */}
                          <Text
                            strong
                            style={{
                              color: '#0f172a',
                              fontSize: 12,
                              display: 'block',
                              marginTop: 4,
                              lineHeight: 1.4,
                            }}
                          >
                            {item.className}
                          </Text>

                          {/* 4. Giáo viên phụ trách */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 4,
                              fontSize: 11,
                              color: '#475569',
                            }}
                          >
                            <UserOutlined style={{ color: '#1890ff' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.teacherName}
                            </span>
                          </div>

                          {/* 5. Nút Thao tác: Khóa 15 phút Meet & Điểm danh theo quy định */}
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: '1px dashed #e2e8f0',
                              display: 'flex',
                              gap: 5,
                              flexWrap: 'wrap',
                              alignItems: 'center',
                            }}
                          >
                            {/* Nút Vào Meet */}
                            {item.meetingLink && (() => {
                              const platform = detectMeetingPlatform(item.meetingLink);
                              const isMeet = platform.type === 'google_meet';

                              if (timeState.canAccess) {
                                // Trong vòng 15p trước giờ học hoặc đang học -> CHO PHÉP VÀO MEET
                                return (
                                  <Tooltip
                                    title={
                                      timeState.state === 'LIVE'
                                        ? isEnglish
                                          ? 'Class is live! Click to enter Meet now.'
                                          : 'Lớp đang diễn ra! Bấm để vào phòng Meet ngay.'
                                        : isEnglish
                                        ? 'Class starts within 15 minutes. Meet is open!'
                                        : 'Lớp sắp bắt đầu trong 15 phút. Phòng Meet đã mở!'
                                    }
                                  >
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={platform.iconSmall || <VideoCameraOutlined />}
                                      onClick={() => window.open(item.meetingLink, '_blank')}
                                      style={{
                                        fontSize: 11,
                                        height: 26,
                                        padding: '0 8px',
                                        backgroundColor: isMeet ? '#0f9d58' : '#1890ff',
                                        borderColor: isMeet ? '#0f9d58' : '#1890ff',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                        boxShadow:
                                          timeState.state === 'LIVE'
                                            ? '0 2px 6px rgba(15,157,88,0.4)'
                                            : 'none',
                                      }}
                                    >
                                      {timeState.state === 'LIVE' ? '🔴 ' : ''}
                                      {isEnglish ? (isMeet ? 'Join Meet' : 'Join') : (isMeet ? 'Vào Meet' : 'Vào Lớp')}
                                    </Button>
                                  </Tooltip>
                                );
                              }

                              if (timeState.state === 'FINISHED') {
                                // Ca học đã kết thúc
                                return (
                                  <Tooltip
                                    title={isEnglish ? 'Class session has ended' : 'Ca học đã kết thúc'}
                                  >
                                    <span>
                                      <Button
                                        size="small"
                                        disabled
                                        icon={<VideoCameraOutlined />}
                                        style={{
                                          fontSize: 11,
                                          height: 26,
                                          padding: '0 6px',
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

                              // Chưa đến giờ (< 15p): KHÓA NÚT MEET
                              return (
                                <Tooltip
                                  title={
                                    isEnglish
                                      ? `Google Meet opens 15m before class (opens at ${timeState.unlockTimeStr} on ${day.shortDate})`
                                      : `Link Google Meet chỉ mở trước giờ học 15 phút (mở lúc ${timeState.unlockTimeStr} ngày ${day.shortDate})`
                                  }
                                >
                                  <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                                    <Button
                                      size="small"
                                      disabled
                                      icon={<LockOutlined />}
                                      style={{
                                        fontSize: 11,
                                        height: 26,
                                        padding: '0 6px',
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

                            {/* Nút Điểm danh / Check-in của Giáo viên */}
                            {canCheckIn && (() => {
                              if (item.status === SESSION_STATUS.CHECKED_IN) {
                                return (
                                  <Tag
                                    color="success"
                                    icon={<CheckCircleOutlined />}
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      margin: 0,
                                      borderRadius: 6,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {isEnglish ? 'Checked In' : 'Đã điểm danh'}
                                  </Tag>
                                );
                              }

                              if (timeState.canAccess) {
                                // Trong vòng 15p hoặc đang học -> CHO PHÉP ĐIỂM DANH
                                return (
                                  <Tooltip
                                    title={
                                      isEnglish
                                        ? 'Classroom is open! Click to check in and record attendance.'
                                        : 'Đã đến giờ! Nhấn để điểm danh và ghi nhận ca dạy.'
                                    }
                                  >
                                    <Button
                                      size="small"
                                      type="default"
                                      icon={<CheckCircleOutlined />}
                                      onClick={() => onCheckIn(item.id)}
                                      style={{
                                        fontSize: 11,
                                        height: 26,
                                        padding: '0 8px',
                                        borderColor: '#52c41a',
                                        color: '#52c41a',
                                        backgroundColor: '#f6ffed',
                                        fontWeight: 600,
                                        borderRadius: 6,
                                      }}
                                    >
                                      {isEnglish ? 'Check-in' : 'Điểm danh'}
                                    </Button>
                                  </Tooltip>
                                );
                              }

                              if (timeState.state === 'FINISHED') {
                                return null;
                              }

                              // Chưa đến giờ (< 15p): KHÓA ĐIỂM DANH
                              return (
                                <Tooltip
                                  title={
                                    isEnglish
                                      ? `Attendance check-in opens 15m before class (opens at ${timeState.unlockTimeStr} on ${day.shortDate})`
                                      : `Chỉ cho phép điểm danh trước giờ học 15 phút (mở lúc ${timeState.unlockTimeStr} ngày ${day.shortDate})`
                                  }
                                >
                                  <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                                    <Button
                                      size="small"
                                      disabled
                                      icon={<LockOutlined />}
                                      style={{
                                        fontSize: 11,
                                        height: 26,
                                        padding: '0 6px',
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
