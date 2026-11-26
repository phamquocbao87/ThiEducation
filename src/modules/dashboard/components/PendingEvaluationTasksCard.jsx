import React, { useState } from 'react';
import { Card, Tag, Button, Space, Typography, Badge, message } from 'antd';
import {
  AlertOutlined,
  BellOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';

const { Text } = Typography;

export const PendingEvaluationTasksCard = ({ tasks = [], onTaskReminded }) => {
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [remindedMap, setRemindedMap] = useState({});
  const [unlockedKeys, setUnlockedKeys] = useState({});
  const [unlockingKey, setUnlockingKey] = useState(null);

  if (!tasks || tasks.length === 0) return null;

  const canUnlock = ['academic', 'director', 'admin'].includes(currentUser?.role);

  const handleQuickUnlockSession = async (task, sessionItem) => {
    if (!canUnlock || !sessionItem) return;
    const key = `${task.classId}_${sessionItem.dateMs}`;
    setUnlockingKey(key);
    // 0ms Optimistic State Update
    setUnlockedKeys((prev) => ({ ...prev, [key]: true }));
    try {
      await ClassroomRealtimeService.unlockSessionEvaluation(
        task.classId,
        sessionItem.sessionDocId || `LIVE_${task.classId}_${sessionItem.dateMs}`,
        {
          sessionStart: sessionItem.dateMs,
          sessionEnd: sessionItem.endMs,
          date: sessionItem.date,
        },
        currentUser
      );
      message.success(
        isEnglish
          ? `Unlocked ${task.className} (${sessionItem.date}) for 18 hours and notified ${task.teacherName}!`
          : `Đã mở khóa 18 tiếng cho buổi ${sessionItem.date} (${task.className}) và gửi thông báo cho ${task.teacherName}!`
      );
    } catch (err) {
      setUnlockedKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      message.error(err.message || (isEnglish ? 'Failed to unlock session' : 'Lỗi mở khóa buổi học'));
    } finally {
      setUnlockingKey(null);
    }
  };

  const handleRemindTeacher = (task) => {
    setRemindedMap((prev) => ({ ...prev, [task.id]: true }));
    message.success(
      isEnglish
        ? `Reminder sent to ${task.teacherName} for class ${task.className}!`
        : `Đã gửi thông báo nhắc nhở tới giáo viên ${task.teacherName} (Lớp ${task.className})!`
    );
    onTaskReminded?.(task);
  };

  const handleOpenClassroom = (task, sessionDateMs) => {
    const targetMs = sessionDateMs || task.missedSessions[0]?.dateMs;
    navigate(`/classroom/${encodeURIComponent(task.classId)}?tab=evaluation&sessionDateMs=${targetMs}`);
  };

  const totalOverdueSessions = tasks.reduce((sum, t) => sum + (t.overdueCount || 0), 0);
  const hasAnyOverdue = totalOverdueSessions > 0;

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
      data-testid="academic-pending-evaluation-tasks-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <Space size={8} wrap>
          <Badge count={tasks.length} overflowCount={99} color={hasAnyOverdue ? '#ff4d4f' : '#fa8c16'}>
            {hasAnyOverdue ? (
              <AlertOutlined style={{ color: '#cf1322', fontSize: 16 }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: '#d46b08', fontSize: 16 }} />
            )}
          </Badge>
          <Text strong style={{ fontSize: isMobile ? 13 : 15, color: hasAnyOverdue ? '#a8071a' : '#873800' }}>
            {hasAnyOverdue
              ? (isEnglish
                ? `Academic Alert: ${totalOverdueSessions} Overdue (>18h) Teacher Feedback Session(s) across ${tasks.length} class(es)`
                : `Cảnh Báo Giáo Vụ: Có ${totalOverdueSessions} buổi quá hạn 18 tiếng chưa đủ nhận xét (${tasks.length} lớp)`)
              : (isEnglish
                ? `18h Feedback Window: Monitoring ${tasks.length} class(es) pending teacher feedback`
                : `Theo Dõi Hạn 18 Tiếng: ${tasks.length} lớp đang trong thời gian chờ giáo viên nhận xét`)}
          </Text>
        </Space>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((task) => {
          const isReminded = remindedMap[task.id];
          const enrichedSessions = (task.missedSessions || []).map((s) => {
            const k = `${task.classId}_${s.dateMs}`;
            if (unlockedKeys[k]) {
              return {
                ...s,
                isTemporarilyUnlocked: true,
                isLockedAfter18h: false,
                isUnlockRequested: false,
                unlockCountdownText: isEnglish ? '18h' : '18g',
              };
            }
            return s;
          });
          const overdueCount = enrichedSessions.filter((s) => s.isLockedAfter18h).length;
          const withinCount = enrichedSessions.filter((s) => s.isWithin18h || s.isTemporarilyUnlocked).length;
          const requestSessions = enrichedSessions.filter((s) => s.isUnlockRequested);
          const firstUnlockTarget = requestSessions[0] || enrichedSessions.find((s) => s.isLockedAfter18h) || null;

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
                border: `1px solid ${requestSessions.length > 0 ? '#d3adf7' : overdueCount > 0 ? '#ffccc7' : '#ffd591'}`,
                gap: 10,
              }}
              data-testid={`task-eval-item-${task.classId}`}
            >
              <div style={{ minWidth: 0, width: '100%' }}>
                <Space size={6} wrap style={{ marginBottom: 6 }}>
                  <Tag color="purple" style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                    <UserOutlined /> {task.teacherName}
                  </Tag>
                  <Tag color="blue" style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                    {task.className}
                  </Tag>
                  {requestSessions.length > 0 && (
                    <Tag color="magenta" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }} data-testid={`academic-unlock-req-badge-${task.classId}`}>
                      {isEnglish ? `📨 Unlock Request: ${requestSessions.length}` : `📨 Yêu cầu mở khóa: ${requestSessions.length} buổi`}
                    </Tag>
                  )}
                  {overdueCount > 0 && (
                    <Tag color="error" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }} data-testid={`academic-overdue-badge-${task.classId}`}>
                      {isEnglish ? `🔒 Locked >18h: ${overdueCount}` : `🔒 Đã khóa >18h: ${overdueCount} buổi`}
                    </Tag>
                  )}
                  {withinCount > 0 && (
                    <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }} data-testid={`academic-window-badge-${task.classId}`}>
                      {isEnglish ? `Open (18h): ${withinCount}` : `Đang mở (18h): ${withinCount} buổi`}
                    </Tag>
                  )}
                </Space>

                {requestSessions.length > 0 && requestSessions[0]?.unlockState?.requestReason && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#531dab',
                      backgroundColor: '#f9f0ff',
                      border: '1px solid #efdbff',
                      borderRadius: 6,
                      padding: '4px 8px',
                      marginBottom: 6,
                    }}
                    data-testid={`academic-unlock-reason-${task.classId}`}
                  >
                    💬 <strong>{isEnglish ? 'Teacher Reason:' : 'Lý do GV xin mở khóa:'}</strong>{' '}
                    {requestSessions[0].unlockState.requestReason}
                  </div>
                )}

                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span>{isEnglish ? 'Sessions:' : 'Các buổi:'}</span>
                  {enrichedSessions.slice(0, 4).map((s) => {
                    const missingRatio = s.requiredCount > 0
                      ? (s.missingCount > 0
                          ? (isEnglish ? `Missing ${s.missingCount}/${s.requiredCount}` : `Thiếu ${s.missingCount}/${s.requiredCount} HS`)
                          : (isEnglish ? 'Re-eval' : 'Đánh giá lại'))
                      : (isEnglish ? 'Pending' : 'Chưa ĐG');
                    const pillColor = s.isTemporarilyUnlocked
                      ? 'success'
                      : s.isUnlockRequested
                      ? 'magenta'
                      : s.isLockedAfter18h
                      ? 'error'
                      : 'orange';
                    const pillLabel = s.isTemporarilyUnlocked
                      ? (isEnglish
                          ? `🔓 S${s.sessionIndex} (${s.date}) • Unlocked (${s.unlockCountdownText})`
                          : `🔓 Buổi ${s.sessionIndex} (${s.date}) • Đã mở khóa (${s.unlockCountdownText})`)
                      : s.isUnlockRequested
                      ? (isEnglish
                          ? `📨 S${s.sessionIndex} (${s.date}) • Unlock Requested • ${missingRatio}`
                          : `📨 Buổi ${s.sessionIndex} (${s.date}) • Xin mở khóa • ${missingRatio}`)
                      : s.isLockedAfter18h
                      ? (isEnglish
                          ? `🔒 S${s.sessionIndex} (${s.date}) • Locked >18h • ${missingRatio}`
                          : `🔒 Buổi ${s.sessionIndex} (${s.date}) • Khóa >18h • ${missingRatio}`)
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
                        onClick={() => handleOpenClassroom(task, s.dateMs)}
                        title={isEnglish ? 'Click to open this session evaluation' : 'Bấm để mở đánh giá buổi này'}
                        data-testid={`academic-session-pill-${task.classId}-${s.sessionIndex}`}
                      >
                        {pillLabel}
                      </Tag>
                    );
                  })}
                  {enrichedSessions.length > 4 && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      +{enrichedSessions.length - 4} {isEnglish ? 'more' : 'buổi nữa'}
                    </Text>
                  )}
                </div>
              </div>

              <Space
                size={8}
                wrap
                style={{
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: isMobile ? 'space-between' : 'flex-end',
                }}
              >
                {canUnlock && firstUnlockTarget && (
                  <Button
                    size={isMobile ? 'middle' : 'small'}
                    type="primary"
                    icon={<UnlockOutlined />}
                    loading={unlockingKey === `${task.classId}_${firstUnlockTarget.dateMs}`}
                    style={{
                      borderRadius: 6,
                      fontWeight: 700,
                      minHeight: isMobile ? 38 : undefined,
                      flex: isMobile ? 1 : undefined,
                      backgroundColor: '#52c41a',
                      borderColor: '#52c41a',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => handleQuickUnlockSession(task, firstUnlockTarget)}
                    data-testid={`btn-quick-unlock-${task.classId}`}
                  >
                    {requestSessions.length > 0
                      ? (isEnglish ? `🔓 Approve Unlock (${firstUnlockTarget.date})` : `🔓 Duyệt Mở Khóa (${firstUnlockTarget.date})`)
                      : (isEnglish ? `🔓 Unlock 18h (${firstUnlockTarget.date})` : `🔓 Mở Khóa 18h (${firstUnlockTarget.date})`)}
                  </Button>
                )}

                <Button
                  size={isMobile ? 'middle' : 'small'}
                  icon={<BellOutlined />}
                  style={{
                    borderRadius: 6,
                    fontWeight: 600,
                    minHeight: isMobile ? 38 : undefined,
                    flex: isMobile ? 1 : undefined,
                    borderColor: isReminded ? '#52c41a' : '#d46b08',
                    color: isReminded ? '#52c41a' : '#d46b08',
                    whiteSpace: 'nowrap',
                  }}
                  disabled={isReminded}
                  onClick={() => handleRemindTeacher(task)}
                  data-testid={`btn-remind-teacher-${task.classId}`}
                >
                  {isReminded
                    ? (isEnglish ? '✓ Reminded' : '✓ Đã Nhắc')
                    : (isEnglish ? '🔔 Remind' : '🔔 Nhắc GV')}
                </Button>

                <Button
                  size={isMobile ? 'middle' : 'small'}
                  type="primary"
                  danger={overdueCount > 0 && !firstUnlockTarget}
                  icon={<EditOutlined />}
                  style={{
                    borderRadius: 6,
                    fontWeight: 600,
                    minHeight: isMobile ? 38 : undefined,
                    flex: isMobile ? 1 : undefined,
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => handleOpenClassroom(task, firstUnlockTarget?.dateMs)}
                  data-testid={`btn-review-eval-${task.classId}`}
                >
                  {isEnglish ? 'Open Session ↗' : 'Xem Buổi Học ↗'}
                </Button>
              </Space>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
