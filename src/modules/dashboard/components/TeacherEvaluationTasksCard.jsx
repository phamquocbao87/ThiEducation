import React from 'react';
import { Card, Tag, Button, Space, Typography, Badge } from 'antd';
import {
  EditOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
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

  const totalMissedAllClasses = tasks.reduce((sum, t) => sum + t.totalMissed, 0);

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
      data-testid="teacher-evaluation-tasks-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <Space size={8}>
          <Badge count={totalMissedAllClasses} overflowCount={99}>
            <ExclamationCircleOutlined style={{ color: '#d46b08', fontSize: 16 }} />
          </Badge>
          <Text strong style={{ fontSize: isMobile ? 14 : 15, color: '#873800' }}>
            {isEnglish
              ? `Action Required: Please complete student evaluations for ${totalMissedAllClasses} past session(s)`
              : `Nhiệm Vụ Giảng Dạy: Vui lòng hoàn tất đánh giá học viên cho ${totalMissedAllClasses} buổi học đã qua`}
          </Text>
        </Space>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((task) => (
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
            data-testid={`teacher-task-item-${task.classId}`}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text strong style={{ fontSize: 14, color: '#0958d9' }}>
                  {task.className}
                </Text>
                <Tag color="error" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                  {isEnglish ? `${task.totalMissed} pending session(s)` : `Còn thiếu: ${task.totalMissed} buổi`}
                </Tag>
              </div>

              <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span>{isEnglish ? 'Sessions requiring evaluation:' : 'Buổi cần nhận xét:'}</span>
                {task.missedSessions.slice(0, 5).map((s) => (
                  <Tag
                    key={s.dateMs}
                    color="orange"
                    style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap', fontSize: 11 }}
                    onClick={() => handleOpenEvaluation(task.classId, s.dateMs)}
                    title={isEnglish ? 'Click to evaluate this session' : 'Bấm để đánh giá buổi này'}
                  >
                    {isEnglish ? `Session ${s.sessionIndex} (${s.date})` : `Buổi ${s.sessionIndex} (${s.date})`}
                  </Tag>
                ))}
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
              icon={<EditOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                backgroundColor: '#fa8c16',
                borderColor: '#fa8c16',
                whiteSpace: 'nowrap',
                width: isMobile ? '100%' : 'auto',
              }}
              onClick={() => handleOpenEvaluation(task.classId, task.missedSessions[0]?.dateMs)}
              data-testid={`btn-teacher-evaluate-${task.classId}`}
            >
              {isEnglish ? 'Evaluate Now ↗' : 'Đánh Giá Ngay ↗'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
