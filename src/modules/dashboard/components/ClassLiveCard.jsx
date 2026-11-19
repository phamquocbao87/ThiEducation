import React, { useMemo } from 'react';
import { Card, Tag, Space, Typography, Progress } from 'antd';
import {
  ClockCircleOutlined,
  TeamOutlined,
  GlobalOutlined,
  CalendarOutlined,
  ReadOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { getClassLiveStatus } from '../utils/classTimeUtils';
import { ClassCardActions } from './ClassCardActions';
import { useClassTimer } from '../hooks/useClassTimer';
import { ClassSessionTimer } from './ClassSessionTimer';
import { ClassTimerService } from '../services/ClassTimerService';
import { ClassAttendanceSummary } from '../../../shared/components/ClassAttendanceSummary';
import { currentAttendance } from '../../../shared/models/classroom.model';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';

const { Text } = Typography;

export const ClassLiveCard = ({ cls, role = 'academic', excusedAbsences = [], onClick }) => {
  const { isEnglish } = useLanguage();
  const now = useClassTimer();
  const attendance = currentAttendance(cls, now);
  const liveStatus = getClassLiveStatus({ ...cls, attendanceTaken: attendance ? attendance.unmarkedCount === 0 : false },
    role, new Date(now), ClassTimerService.getSession(cls, now));

  const timer = ClassTimerService.getTimer(cls, now);
  const isLive = timer?.state === 'live';
  const isStartingSoon =
    timer?.state === 'upcoming' &&
    typeof timer?.startsIn === 'number' &&
    timer?.startsIn <= 1800; // <= 30 phút
  const isHeartbeatActive = isLive || isStartingSoon;
  const isUrgent = liveStatus.pulseClass === 'lak-card-pulse-red';

  const studentsCount = Array.isArray(cls.studentIds)
    ? cls.studentIds.length
    : (Number(cls.totalStudents) || 0);
  const maxStudents = Number(cls.maxStudents) || 12;

  // Tính toán số buổi đã học trên tổng số buổi của khóa học
  const totalSessions = Number(cls.totalSessions) || Number(cls.courseTotalSessions) || 24;
  const sessions = useMemo(() => {
    return generateClassSessionDates(cls, totalSessions, isEnglish);
  }, [cls, totalSessions, isEnglish]);
  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.endMs <= now).length;
  }, [sessions, now]);
  const progressPercent = Math.min(100, Math.round((completedSessions / totalSessions) * 100));

  return (
    <Card
      hoverable
      onClick={() => onClick && onClick(cls)}
      className={liveStatus.pulseClass}
      style={{
        borderRadius: 12,
        backgroundColor: liveStatus.cardBg,
        borderColor: liveStatus.borderColor,
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        boxShadow: liveStatus.timeStatus === 'IN_PROGRESS'
          ? '0 4px 16px rgba(0,0,0,0.08)'
          : '0 2px 8px rgba(0,0,0,0.03)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      styles={{
        body: { padding: '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }
      }}
    >
      <div>
        {/* Hàng 1: Mã lớp & Tag trạng thái Real-time */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
          <Tag color="blue" style={{ fontWeight: 700, fontSize: 12, margin: 0, whiteSpace: 'nowrap' }}>
            {cls.id}
          </Tag>
          <Tag
            color={liveStatus.statusTagColor}
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {isEnglish ? liveStatus.statusLabelEn : liveStatus.statusLabelVi}
          </Tag>
        </div>

        {/* Hàng 2: Tên lớp & Cấp độ */}
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 15, color: '#0958d9', display: 'block', lineHeight: 1.3 }}>
            {cls.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {cls.courseLevel || cls.courseName || 'Wonders ELA'}
          </Text>
        </div>

        {/* Huy hiệu Học Viên Vắng Có Phép (Excused Leave) */}
        {excusedAbsences.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <Tag
              color="orange"
              icon={<UserDeleteOutlined />}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 11,
                padding: '2px 8px',
                margin: 0,
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={excusedAbsences.map((a) => `${a.userName}: ${a.reason || 'Personal'}`).join('\n')}
            >
              {isEnglish
                ? `${excusedAbsences.length} Excused Leave: ${excusedAbsences.map((a) => a.userName).join(', ')}`
                : `${excusedAbsences.length} Vắng có phép: ${excusedAbsences.map((a) => a.userName).join(', ')}`}
            </Tag>
          </div>
        )}

        <ClassSessionTimer cls={cls} now={now} isUrgent={isUrgent} />
        <ClassAttendanceSummary cls={cls} now={now} />

        {/* Hàng: Tiến độ số buổi đã học */}
        <div
          data-testid={`class-progress-${cls.id}`}
          style={{
            marginTop: 4,
            marginBottom: 10,
            padding: '6px 10px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              {isEnglish ? 'Sessions Completed:' : 'Số buổi đã học:'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0958d9', whiteSpace: 'nowrap' }}>
              {completedSessions}/{totalSessions} {isEnglish ? 'sessions' : 'buổi'} ({progressPercent}%)
            </span>
          </div>
          <Progress percent={progressPercent} size="small" strokeColor="#1890ff" showInfo={false} />
        </div>
        {/* Hàng 3: Thời gian học, Ngày bắt đầu & Giáo viên */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155' }}>
            <ClockCircleOutlined
              className={isHeartbeatActive ? 'lak-heartbeat-icon' : ''}
              style={{
                color: isLive
                  ? (isUrgent ? '#ff4d4f' : '#52c41a')
                  : (isStartingSoon ? '#1890ff' : '#0284c7'),
              }}
            />
            <span>
              <Text
                strong
                style={{
                  color: isLive
                    ? (isUrgent ? '#cf1322' : '#237804')
                    : (isStartingSoon ? '#0958d9' : 'inherit'),
                }}
              >
                {liveStatus.startTime} — {liveStatus.endTime}
              </Text>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>({cls.schedule || 'Lịch học'})</span>
            </span>
          </div>

          {cls.startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <CalendarOutlined style={{ color: '#fa8c16' }} />
              <span>
                {isEnglish ? 'Start Date:' : 'Ngày bắt đầu:'}{' '}
                <Text strong style={{ color: '#d46b08' }}>{cls.startDate}</Text>
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <Space size={6}>
              <GlobalOutlined style={{ color: '#722ed1' }} />
              <Text style={{ color: '#475569' }}>
                {cls.teacherName || (isEnglish ? 'Unassigned' : 'Chưa phân công')}
              </Text>
            </Space>

            <Space size={4}>
              <TeamOutlined style={{ color: '#64748b' }} />
              <Text strong style={{ color: studentsCount >= maxStudents ? '#cf1322' : '#16a34a', fontSize: 12 }}>
                {studentsCount}/{maxStudents}
              </Text>
            </Space>
          </div>
        </div>
      </div>

      <ClassCardActions cls={cls} role={role} onClick={onClick} />
    </Card>
  );
};

