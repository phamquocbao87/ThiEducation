import React from 'react';
import { Card, Tag, Button, Space, Typography, Badge } from 'antd';
import {
  EditOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

export const TeacherLessonPlanAlertCard = ({
  alerts = [],
  pastMissingCount = 0,
  onPlanSession,
  onViewPastMissing,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  if ((!alerts || alerts.length === 0) && (!pastMissingCount || pastMissingCount === 0)) {
    return null;
  }

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
      data-testid="teacher-lesson-plan-alert-card"
    >
      {/* 1. Header Khẩn Cấp Mốc 24H */}
      {alerts.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <Space size={8}>
              <Badge count={alerts.length} overflowCount={99}>
                <ClockCircleOutlined style={{ color: '#d46b08', fontSize: 16 }} />
              </Badge>
              <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#873800' }}>
                {isEnglish
                  ? `Action Required: Lesson Plan Needed Before Class (${alerts.length} session${alerts.length > 1 ? 's' : ''} in < 24h)`
                  : `Nhiệm Vụ Giáo Viên: Cần Soạn Giáo Án Trước Giờ Học (${alerts.length} ca dạy trong 24h)`}
              </Text>
            </Space>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  padding: '10px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  border: alert.isUrgent12h ? '1px solid #ffa39e' : '1px solid #ffd591',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Tag color="orange" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                      {alert.className}
                    </Tag>
                    <Tag color="blue" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                      {isEnglish ? `Session ${alert.sessionIndex}` : `Buổi ${alert.sessionIndex}`}
                    </Tag>
                    <Tag
                      color={alert.isUrgent12h ? 'error' : 'warning'}
                      style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}
                    >
                      {isEnglish
                        ? `⏰ ${alert.diffHours}h ${alert.diffMinutes}m remaining`
                        : `⏰ Còn ${alert.diffHours}h ${alert.diffMinutes}p`}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                    <span style={{ fontWeight: 600 }}>{alert.unitWeek}</span>
                    {' • '}
                    <span>{alert.dayName}, {alert.sessionDate} ({alert.timeRange})</span>
                  </div>
                  {!alert.hasCurriculum && (
                    <div style={{ marginTop: 2, fontSize: 11, color: '#d46b08' }}>
                      ⚠️ {isEnglish ? 'Textbook: Please assign Wonders textbook' : 'Giáo trình: Chưa gán sách Wonders'}
                    </div>
                  )}
                </div>

                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size={isMobile ? 'middle' : 'small'}
                  style={{
                    backgroundColor: '#fa8c16',
                    borderColor: '#fa8c16',
                    fontWeight: 700,
                    borderRadius: 6,
                    width: isMobile ? '100%' : 'auto',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onClick={() => onPlanSession?.(alert)}
                  data-testid={`btn-plan-session-${alert.sessionIndex}`}
                >
                  {isEnglish ? 'Plan Lesson Now' : 'Soạn Giáo Án Ngay'}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 2. TẦNG 2: Nhắc Nhở Hồ Sơ Buổi Cũ Quá Khứ (Gom gọn 1 dòng nhẹ nhàng) */}
      {pastMissingCount > 0 && (
        <div
          style={{
            marginTop: alerts.length > 0 ? 12 : 0,
            paddingTop: alerts.length > 0 ? 10 : 0,
            borderTop: alerts.length > 0 ? '1px dashed #ffd591' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: '#7c2d12', display: 'flex', alignItems: 'center', gap: 6 }}>
            <InfoCircleOutlined style={{ color: '#d97706' }} />
            <span>
              {isEnglish
                ? `Academic Note: You have ${pastMissingCount} past teaching session(s) with incomplete lesson plans.`
                : `Lưu ý học thuật: Bạn có ${pastMissingCount} buổi dạy trong quá khứ chưa hoàn tất giáo án lưu trữ.`}
            </span>
          </div>
          {onViewPastMissing && (
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', fontSize: 12, color: '#b45309', fontWeight: 600 }}
              onClick={onViewPastMissing}
            >
              {isEnglish ? 'Review past records →' : 'Xem danh sách buổi cũ →'}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
