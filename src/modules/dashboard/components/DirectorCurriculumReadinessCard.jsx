import React, { useState } from 'react';
import { Card, Statistic, Tag, Progress, Typography, Drawer, List, Space, Button } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

export const DirectorCurriculumReadinessCard = ({
  alerts = [],
  complianceRate = 100,
  readyCount = 0,
  totalUpcoming24h = 0,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasUrgent = alerts.length > 0;
  const statusColor = complianceRate >= 90 ? '#52c41a' : complianceRate >= 70 ? '#fa8c16' : '#ff4d4f';

  return (
    <>
      <Card
        hoverable
        onClick={() => setDrawerOpen(true)}
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          borderTop: `3px solid ${statusColor}`,
          backgroundColor: hasUrgent ? '#fffbe6' : '#ffffff',
          height: '100%',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
        data-testid="kpi-director-curriculum-readiness"
      >
        <Statistic
          title={
            <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3, color: '#1e293b' }}>
              {isEnglish ? '24h Lesson Readiness' : 'Chuẩn Bị Bài Học 24H'}
            </Text>
          }
          value={complianceRate}
          suffix="%"
          prefix={<BookOutlined style={{ color: statusColor, fontSize: isMobile ? 14 : 18 }} />}
          styles={{ content: { color: statusColor, fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
        />

        <div style={{ marginTop: 6 }}>
          <Progress
            percent={complianceRate}
            size="small"
            strokeColor={statusColor}
            showInfo={false}
            style={{ marginBottom: 4 }}
          />
          <div style={{ fontSize: isMobile ? 10 : 12, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {isEnglish ? 'Ready:' : 'Sẵn sàng:'}{' '}
              <Text strong style={{ color: '#52c41a' }}>{readyCount}/{totalUpcoming24h || readyCount}</Text>
            </span>
            {hasUrgent ? (
              <Tag color="error" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                ⚠️ {alerts.length} {isEnglish ? 'Pending' : 'Chưa xong'}
              </Tag>
            ) : (
              <Tag color="success" style={{ margin: 0, fontSize: 10, fontWeight: 600 }}>
                ✓ {isEnglish ? 'All Ready' : 'Đạt 100%'}
              </Tag>
            )}
          </div>
        </div>
      </Card>

      {/* Drawer Chi Tiết Đối Soát Ca Học Sắp Tới Cho Giám Đốc */}
      <Drawer
        title={
          <Space>
            <BookOutlined style={{ color: '#1890ff' }} />
            <span>
              {isEnglish
                ? 'Academic Readiness Audit — Next 24h Sessions'
                : 'Đối Soát Sẵn Sàng Học Thuật — Các Ca Dạy Trong 24H'}
            </span>
          </Space>
        }
        placement="right"
        width={isMobile ? '100%' : 540}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {isEnglish
              ? 'Monitoring Native Teachers lesson planning status 24 hours prior to Zoom live sessions.'
              : 'Theo dõi tiến độ soạn giáo án và gán sách Wonders của Giáo viên Bản Xứ trước giờ học 24 tiếng.'}
          </Text>
        </div>

        {alerts.length > 0 ? (
          <List
            dataSource={alerts}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  marginBottom: 10,
                  border: '1px solid #e2e8f0',
                }}
                actions={[
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(`/classroom/${encodeURIComponent(item.classId)}?tab=curriculum&sessionIndex=${item.sessionIndex}`);
                    }}
                  >
                    {isEnglish ? 'Inspect →' : 'Kiểm tra →'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={6} wrap>
                      <Text strong style={{ fontSize: 14 }}>{item.className}</Text>
                      <Tag color="geekblue">👨‍🏫 {item.teacherName}</Tag>
                      <Tag color={item.isUrgent12h ? 'error' : 'warning'}>
                        ⏰ Còn {item.diffHours}h {item.diffMinutes}p
                      </Tag>
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <div>📅 {item.dayName}, {item.sessionDate} ({item.timeRange})</div>
                      <div style={{ color: '#475569' }}>📖 {item.unitWeek}</div>
                      <div style={{ marginTop: 4 }}>
                        {!item.hasPlan && <Tag color="red">Chưa có giáo án</Tag>}
                        {!item.hasCurriculum && <Tag color="orange">Thiếu sách Wonders</Tag>}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#52c41a' }}>
            <CheckCircleOutlined style={{ fontSize: 36, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {isEnglish ? '100% Curriculum & Lesson Plans Ready!' : '100% Ca Dạy Đã Có Giáo Án & Giáo Trình!'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {isEnglish
                ? 'All sessions in the next 24 hours are fully prepared by Native Teachers.'
                : 'Tất cả các ca học trong 24 giờ tới đều đã được giáo viên chuẩn bị chu đáo.'}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};
