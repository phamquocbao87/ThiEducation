import React, { useState } from 'react';
import { Card, Tag, Button, Space, Typography, Badge, message } from 'antd';
import {
  BellOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

export const PendingEvaluationTasksCard = ({ tasks = [], onTaskReminded }) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [remindedMap, setRemindedMap] = useState({});

  if (!tasks || tasks.length === 0) return null;

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

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: isMobile ? 12 : 20,
        borderRadius: 12,
        borderLeft: '4px solid #fa8c16',
        backgroundColor: '#fffbe6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
      data-testid="academic-pending-evaluation-tasks-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <Space size={8}>
          <Badge count={tasks.length} overflowCount={99}>
            <ExclamationCircleOutlined style={{ color: '#d46b08', fontSize: 16 }} />
          </Badge>
          <Text strong style={{ fontSize: isMobile ? 14 : 15, color: '#873800' }}>
            {isEnglish
              ? `Academic Action Required: Teachers Pending Session Evaluations (${tasks.length} classes)`
              : `Nhiệm Vụ Giáo Vụ: Giáo Viên Chưa Hoàn Tất Đánh Giá Buổi Học (${tasks.length} lớp)`}
          </Text>
        </Space>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((task) => {
          const isReminded = remindedMap[task.id];
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
                border: '1px solid #ffd591',
                gap: 10,
              }}
              data-testid={`task-eval-item-${task.classId}`}
            >
              <div>
                <Space size={6} wrap style={{ marginBottom: 4 }}>
                  <Tag color="purple" style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                    <UserOutlined /> {task.teacherName}
                  </Tag>
                  <Tag color="blue" style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                    {task.className}
                  </Tag>
                  <Tag color="error" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                    {isEnglish ? `${task.totalMissed} missed sessions` : `Chưa ĐG: ${task.totalMissed} buổi`}
                  </Tag>
                </Space>

                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span>{isEnglish ? 'Sessions:' : 'Các buổi:'}</span>
                  {task.missedSessions.slice(0, 4).map((s) => (
                    <Tag
                      key={s.dateMs}
                      color="orange"
                      style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap', fontSize: 11 }}
                      onClick={() => handleOpenClassroom(task, s.dateMs)}
                      title={isEnglish ? 'Click to open this session evaluation' : 'Bấm để mở đánh giá buổi này'}
                    >
                      {isEnglish ? `Session ${s.sessionIndex} (${s.date})` : `Buổi ${s.sessionIndex} (${s.date})`}
                    </Tag>
                  ))}
                  {task.missedSessions.length > 4 && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      +{task.missedSessions.length - 4} {isEnglish ? 'more' : 'buổi nữa'}
                    </Text>
                  )}
                </div>
              </div>

              <Space size={8} wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-end' }}>
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  style={{
                    borderRadius: 6,
                    fontWeight: 600,
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
                    : (isEnglish ? '🔔 Remind Teacher' : '🔔 Nhắc Giáo Viên')}
                </Button>

                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  style={{ borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}
                  onClick={() => handleOpenClassroom(task)}
                  data-testid={`btn-review-eval-${task.classId}`}
                >
                  {isEnglish ? 'Review / Evaluate ↗' : 'Xem & Đánh Giá Hộ ↗'}
                </Button>
              </Space>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
