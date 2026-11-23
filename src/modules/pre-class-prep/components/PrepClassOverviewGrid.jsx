import React from 'react';
import { Row, Col, Card, Tag, Progress, Button, Space, Typography, Empty } from 'antd';
import {
  TeamOutlined,
  VideoCameraOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatHumanDuration } from '../../lesson-reader';

const { Text } = Typography;

/**
 * PrepClassOverviewGrid — Tab Tổng Quan Chuẩn Bị Bài Theo Từng Lớp Học
 * - Scale-Proof grid: xs=24, sm=12, lg=12, xl=8
 * - Bấm `Xem Danh Sách HV` tự chuyển sang Tab Học viên và lọc đúng lớp đó.
 */
export const PrepClassOverviewGrid = ({
  classes = [],
  onInspectClass,
  isEnglish = false,
  isMobile = false,
}) => {
  const navigate = useNavigate();

  if (!classes || classes.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          isEnglish
            ? 'No planned classes match the current filter.'
            : 'Không có lớp học có giáo án nào khớp với bộ lọc hiện tại.'
        }
      />
    );
  }

  return (
    <Row gutter={[16, 16]} data-testid="prep-class-overview-grid">
      {classes.map((cls) => {
        const barColor =
          cls.readinessRate >= 70 ? '#16a34a' : cls.readinessRate >= 35 ? '#f59e0b' : '#dc2626';
        return (
          <Col xs={24} sm={12} md={12} lg={12} xl={8} key={cls.classId}>
            <Card
              bordered={false}
              data-testid={`prep-class-card-${cls.classId}`}
              style={{
                borderRadius: 12,
                border: `1px solid ${cls.notStartedCount > 0 ? '#e9d5ff' : '#bbf7d0'}`,
                borderTop: `3px solid ${barColor}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
              }}
              styles={{
                body: {
                  padding: isMobile ? '12px 14px' : '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  gap: 10,
                },
              }}
            >
              {/* Header lớp */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <Tag color="purple" style={{ margin: 0, fontWeight: 800 }}>
                    {cls.classId}
                  </Tag>
                  <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                    {isEnglish ? `Session ${cls.sessionIndex}` : `Buổi ${cls.sessionIndex}`}
                  </Tag>
                  {cls.openQuestionsCount > 0 && (
                    <Tag color="processing" icon={<QuestionCircleOutlined />} style={{ margin: 0, fontSize: 11 }}>
                      {cls.openQuestionsCount} Q&A
                    </Tag>
                  )}
                </div>

                <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
                  {cls.className}
                </Text>

                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  👨‍🏫 {cls.teacherName} • {cls.courseLevel || 'Wonders ELA'}
                </div>

                {cls.lessonTitle && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b21a8',
                      fontWeight: 600,
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={cls.lessonTitle}
                  >
                    📖 {cls.lessonTitle}
                  </div>
                )}
              </div>

              {/* Thanh tiến độ & phân bố 3 trạng thái */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    {isEnglish ? 'Pre-Class Readiness' : 'Tỷ lệ chuẩn bị bài'}
                  </Text>
                  <Text strong style={{ fontSize: 13, color: barColor }}>
                    {cls.readinessRate}% ({cls.preparedCount}/{cls.totalStudents})
                  </Text>
                </div>
                <Progress percent={cls.readinessRate} size="small" strokeColor={barColor} showInfo={false} />
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 6, fontSize: 12 }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>
                    <CheckCircleOutlined /> {cls.preparedCount} {isEnglish ? 'Ready' : 'Đạt'}
                  </span>
                  <span style={{ color: '#b45309', fontWeight: 600 }}>
                    <ClockCircleOutlined /> {cls.skimmedCount} {isEnglish ? 'Skimmed' : 'Đọc lướt'}
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>
                    <WarningOutlined /> {cls.notStartedCount} {isEnglish ? 'Not Read' : 'Chưa đọc'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <span>⏱ {isEnglish ? 'Goal:' : 'Ngưỡng:'} {formatHumanDuration(cls.minRequiredSeconds, isEnglish)}</span>
                  <span>🏅 {isEnglish ? 'Avg Conduct:' : 'Rèn luyện TB:'} <strong>{cls.avgConductScore}/100</strong></span>
                </div>
              </div>

              {/* Nút hành động chân thẻ */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={() => onInspectClass && onInspectClass(cls.classId)}
                  data-testid={`btn-prep-inspect-class-${cls.classId}`}
                  style={{
                    flex: 1,
                    backgroundColor: '#7e22ce',
                    borderColor: '#7e22ce',
                    fontWeight: 700,
                    borderRadius: 8,
                    minHeight: 38,
                  }}
                >
                  {isEnglish ? `Students (${cls.totalStudents})` : `Xem HV (${cls.totalStudents})`}
                </Button>
                <Button
                  icon={<VideoCameraOutlined />}
                  onClick={() => navigate(`/classroom/${encodeURIComponent(cls.classId)}`)}
                  style={{ borderRadius: 8, minHeight: 38, fontWeight: 600 }}
                >
                  {isEnglish ? 'Room' : 'Phòng học'}
                </Button>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default PrepClassOverviewGrid;
