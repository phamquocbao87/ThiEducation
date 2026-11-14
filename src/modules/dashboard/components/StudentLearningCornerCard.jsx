import React from 'react';
import { Card, Row, Col, Typography, Tag, Button, Space } from 'antd';
import { ExportOutlined, RocketOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { StudentDashboardService } from '../services/StudentDashboardService';

const { Title, Text, Paragraph } = Typography;

export const StudentLearningCornerCard = () => {
  const { isEnglish } = useLanguage();
  const platforms = StudentDashboardService.getLearningCornerPlatforms();

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        marginBottom: 20,
        backgroundColor: '#ffffff',
      }}
      styles={{ body: { padding: '18px 20px' } }}
      data-testid="student-learning-corner-card"
    >
      {/* 1. Header Khối Learning Corner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Space size={8}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#eff6ff',
              color: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            <RocketOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>
              {isEnglish ? 'Learning Corner' : 'Góc Học Tập Quốc Tế'}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isEnglish
                ? 'Top 4 US & international accredited ESL learning platforms'
                : 'Top 4 nền tảng học tập bổ trợ ELA, STEM & Đọc hiểu chuẩn Mỹ'}
            </Text>
          </div>
        </Space>
      </div>

      {/* 2. Danh Sách 4 Nền Tảng Học Tập */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {platforms.map((p) => (
          <div
            key={p.id}
            data-testid={`learning-platform-${p.id}`}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space size={8}>
                <span style={{ fontSize: 20 }}>{p.iconEmoji}</span>
                <div>
                  <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                    {p.name}
                  </Text>
                  <Tag color={p.badgeColor} style={{ marginLeft: 8, fontSize: 11, lineHeight: '18px', padding: '0 6px', borderRadius: 4 }}>
                    {p.badge}
                  </Tag>
                </div>
              </Space>

              <Button
                type="primary"
                ghost
                size="small"
                icon={<ExportOutlined />}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  borderColor: p.accentColor,
                  color: p.accentColor,
                }}
                data-testid={`btn-launch-${p.id}`}
              >
                {isEnglish ? 'Open' : 'Mở'}
              </Button>
            </div>

            <Paragraph
              style={{
                margin: 0,
                fontSize: 12,
                color: '#64748b',
                lineHeight: 1.4,
              }}
              ellipsis={{ rows: 2 }}
            >
              {isEnglish ? p.taglineEn : p.tagline}
            </Paragraph>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StudentLearningCornerCard;

