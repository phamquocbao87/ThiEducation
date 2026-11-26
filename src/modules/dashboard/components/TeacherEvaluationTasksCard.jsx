import React from 'react';
import { Card, Tag, Button, Space, Typography, Badge } from 'antd';
import {
  AlertOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

export const TeacherEvaluationTasksCard = ({ tasks = [] }) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!tasks || tasks.length === 0) return null;

  const handleOpenEvaluation = (classId, sessionDateMs) => {
    navigate(`/classroom/${encodeURIComponent(classId)}?tab=evaluation&sessionDateMs=${sessionDateMs}`);
  };

  const totalPendingAllClasses = tasks.reduce((sum, t) => sum + (t.totalMissed || 0), 0);
  const totalOverdueAllClasses = tasks.reduce((sum, t) => sum + (t.overdueCount || 0), 0);
  const hasAnyOverdue = totalOverdueAllClasses > 0;

  return (
    <Card
      variant="borderless"
      style={{
        marginBottom: isMobile ? 12 : 20,
        borderRadius: 12,
        borderLeft: `4px solid ${hasAnyOverdue ? '#ff4d4f' : '#fa8c16'}`,
        backgroundColor: hasAnyOverdue ? '#fff2f0' : '#fffbe6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
      data-testid="teacher-evaluation-tasks-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <Space size={8} wrap>
          <Badge count={totalPendingAllClasses} overflowCount={99} color={hasAnyOverdue ? '#ff4d4f' : '#fa8c16'}>
            {hasAnyOverdue ? (
              <AlertOutlined style={{ color: '#cf1322', fontSize: 16 }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: '#d46b08', fontSize: 16 }} />
            )}
          </Badge>
          <Text strong style={{ fontSize: isMobile ? 13 : 15, color: hasAnyOverdue ? '#a8071a' : '#873800' }}>
            {hasAnyOverdue
              ? (isEnglish
                ? `Action Required: ${totalOverdueAllClasses} overdue (>18h) & ${totalPendingAllClasses} incomplete session(s) — Retroactive open`
                : `Cảnh Báo Giảng Dạy: ${totalOverdueAllClasses} buổi quá hạn 18h / tổng ${totalPendingAllClasses} buổi chưa đủ nhận xét (Vẫn mở chấm bù)`)
              : (isEnglish
                ? `18h Feedback Window: Please complete feedback for ${totalPendingAllClasses} recent session(s)`
                : `Trong Hạn 18 Tiếng: Vui lòng hoàn tất nhận xét cho ${totalPendingAllClasses} buổi học vừa kết thúc`)}
          </Text>
        </Space>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((task) => {
          const overdueCount = task.overdueCount || 0;
          const withinCount = task.withinWindowCount || 0;
          return (
            <div
              key={task.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                background: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${overdueCount > 0 ? '#ffccc7' : '#ffd591'}`,
                gap: 10,
              }}
              data-testid={`teacher-task-item-${task.classId}`}
            >
              <div style={{ minWidth: 0, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  <Text strong style={{ fontSize: 14, color: '#0958d9' }}>
                    {task.className}
                  </Text>
                  {overdueCount > 0 && (
                    <Tag color="error" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }} data-testid={`teacher-overdue-badge-${task.classId}`}>
                      {isEnglish ? `🔒 Locked >18h: ${overdueCount}` : `🔒 Đã khóa >18h: ${overdueCount} buổi`}
                    </Tag>
                  )}
                  {(task.unlockRequestCount || 0) > 0 && (
                    <Tag color="purple" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }} data-testid={`teacher-request-badge-${task.classId}`}>
                      {isEnglish ? `📨 Requested: ${task.unlockRequestCount}` : `📨 Chờ mở khóa: ${task.unlockRequestCount}`}
                    </Tag>
                  )}
                  {withinCount > 0 && (
                    <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }} data-testid={`teacher-window-badge-${task.classId}`}>
                      {isEnglish ? `Open Window: ${withinCount}` : `Đang mở (18h): ${withinCount} buổi`}
                    </Tag>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span>{isEnglish ? 'Sessions:' : 'Chi tiết:'}</span>
                  {task.missedSessions.slice(0, 5).map((s) => {
                    const missingRatio = s.requiredCount > 0
                      ? (s.missingCount > 0
                          ? (isEnglish ? `Missing ${s.missingCount}/${s.requiredCount}` : `Thiếu ${s.missingCount}/${s.requiredCount} HS`)
                          : (isEnglish ? `Re-eval` : `Đánh giá lại`))
                      : (isEnglish ? 'Pending' : 'Chưa ĐG');
                    const pillColor = s.isTemporarilyUnlocked
                      ? 'success'
                      : s.isUnlockRequested
                      ? 'purple'
                      : s.isLockedAfter18h
                      ? 'error'
                      : 'orange';
                    const pillLabel = s.isTemporarilyUnlocked
                      ? (isEnglish
                          ? `🔓 S${s.sessionIndex} (${s.date}) • ${s.unlockCountdownText} left • ${missingRatio}`
                          : `🔓 Buổi ${s.sessionIndex} (${s.date}) • Còn ${s.unlockCountdownText} • ${missingRatio}`)
                      : s.isUnlockRequested
                      ? (isEnglish
                          ? `📨 S${s.sessionIndex} (${s.date}) • Pending Approval • ${missingRatio}`
                          : `📨 Buổi ${s.sessionIndex} (${s.date}) • Chờ duyệt mở khóa • ${missingRatio}`)
                      : s.isLockedAfter18h
                      ? (isEnglish
                          ? `🔒 S${s.sessionIndex} (${s.date}) • Locked >18h • ${missingRatio}`
                          : `🔒 Buổi ${s.sessionIndex} (${s.date}) • Đã khóa >18h • ${missingRatio}`)
                      : (isEnglish
                        ? `⏳ S${s.sessionIndex} (${s.date}) • ${s.countdownText} left • ${missingRatio}`
                        : `⏳ Buổi ${s.sessionIndex} (${s.date}) • Còn ${s.countdownText} • ${missingRatio}`);
                    return (
                      <Tag
                        key={s.dateMs}
                        color={pillColor}
                        style={{
                          cursor: 'pointer',
                          margin: 0,
                          whiteSpace: isMobile ? 'normal' : 'nowrap',
                          maxWidth: '100%',
                          fontSize: 11,
                          lineHeight: '18px',
                          padding: '2px 7px',
                        }}
                        onClick={() => handleOpenEvaluation(task.classId, s.dateMs)}
                        title={isEnglish ? 'Click to open session (submit feedback or request unlock)' : 'Bấm để mở buổi học (nhận xét hoặc gửi yêu cầu mở khóa)'}
                        data-testid={`teacher-session-pill-${task.classId}-${s.sessionIndex}`}
                      >
                        {pillLabel}
                      </Tag>
                    );
                  })}
                  {task.missedSessions.length > 5 && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      +{task.missedSessions.length - 5} {isEnglish ? 'more' : 'buổi nữa'}
                    </Text>
                  )}
                </div>
              </div>

              <Button
                type="primary"
                size="middle"
                danger={overdueCount > 0}
                icon={<EditOutlined />}
                style={{
                  borderRadius: 8,
                  fontWeight: 700,
                  minHeight: 40,
                  backgroundColor: overdueCount > 0 ? undefined : '#fa8c16',
                  borderColor: overdueCount > 0 ? undefined : '#fa8c16',
                  whiteSpace: 'nowrap',
                  width: isMobile ? '100%' : 'auto',
                }}
                onClick={() => handleOpenEvaluation(task.classId, task.missedSessions[0]?.dateMs)}
                data-testid={`btn-teacher-evaluate-${task.classId}`}
              >
                {isEnglish ? 'Complete Feedback ↗' : 'Vào Nhận Xét Ngay ↗'}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
