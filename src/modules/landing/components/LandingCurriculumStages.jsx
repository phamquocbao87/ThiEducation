import React from 'react';
import { Row, Col, Card, Tag, Space, Typography, Divider } from 'antd';
import { CheckCircleTwoTone, StarFilled } from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

export const LandingCurriculumStages = ({ content }) => {
  const { kindergartenSection, primarySection } = content;

  return (
    <div>
      {/* Stage 1: Kindergarten (Wonders GK) — 4 Pillar Cards with WebP Illustrations */}
      <div id="section-kindergarten" style={{ padding: '48px 24px 64px', background: '#f7fbff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 40px' }}>
            <Tag color="geekblue" style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 12 }}>
              🌱 {kindergartenSection.badge}
            </Tag>
            <Title level={2} style={{ color: '#122B4D', marginTop: 0, marginBottom: 12, fontWeight: 800 }}>
              {kindergartenSection.title}
            </Title>
            <Paragraph style={{ fontSize: 16, color: '#4a5568', margin: 0 }}>
              {kindergartenSection.subtitle}
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {kindergartenSection.pillars.map((pillar) => (
              <Col xs={24} md={12} key={pillar.number}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderRadius: 18,
                    border: '1px solid #d6e8ff',
                    boxShadow: '0 8px 24px rgba(18, 43, 77, 0.06)',
                  }}
                >
                  <Row gutter={[18, 16]} align="middle">
                    <Col xs={24} sm={8}>
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e6f4ff',
                          borderRadius: 14,
                          padding: 10,
                          textAlign: 'center',
                        }}
                      >
                        <img
                          src={pillar.image}
                          alt={pillar.title}
                          style={{
                            width: '100%',
                            maxHeight: 155,
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                          }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} sm={16}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Space>
                          <span style={{ fontSize: 20 }}>{pillar.icon}</span>
                          <Tag color="blue" style={{ fontWeight: 700 }}>
                            {pillar.badge}
                          </Tag>
                        </Space>
                        <Text style={{ fontSize: 24, fontWeight: 900, color: '#bae0ff' }}>
                          {pillar.number}
                        </Text>
                      </div>

                      <Title level={4} style={{ color: '#122B4D', marginTop: 0, marginBottom: 10, fontSize: 17.5 }}>
                        {pillar.title}
                      </Title>

                      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        {pillar.highlights.map((pt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircleTwoTone twoToneColor="#1890ff" style={{ marginTop: 4, fontSize: 15 }} />
                            <Text style={{ fontSize: 13.8, color: '#2d3748', lineHeight: 1.6 }}>
                              {pt}
                            </Text>
                          </div>
                        ))}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Visual Reference Banner (web-landing.webp) + Stage 2: Primary (Grades 1-5) */}
      <div id="section-primary" style={{ padding: '64px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Row gutter={[32, 32]} align="middle" style={{ marginBottom: 44 }}>
            <Col xs={24} lg={14}>
              <Tag color="purple" style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 12 }}>
                🎓 {primarySection.badge}
              </Tag>
              <Title level={2} style={{ color: '#122B4D', marginTop: 0, marginBottom: 12, fontWeight: 800 }}>
                {primarySection.title}
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#4a5568', margin: 0, lineHeight: 1.7 }}>
                {primarySection.subtitle}
              </Paragraph>
            </Col>
            <Col xs={24} lg={10}>
              <div
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '2px solid #bae0ff',
                  boxShadow: '0 12px 28px rgba(18,43,77,0.08)',
                }}
              >
                <img
                  src={LANDING_ASSETS.learningBanner}
                  alt="Learning Beyond Boundaries"
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                />
              </div>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            {primarySection.pillars.map((item, idx) => (
              <Col xs={24} lg={8} key={idx}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        background: '#f8fbff',
                        padding: '18px 24px 10px',
                        textAlign: 'center',
                        borderBottom: '1px solid #f0f5ff',
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          height: 170,
                          width: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  }
                  style={{
                    height: '100%',
                    borderRadius: 18,
                    overflow: 'hidden',
                    borderTop: `4px solid ${item.color}`,
                    boxShadow: '0 8px 24px rgba(18, 43, 77, 0.06)',
                  }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 22, marginRight: 8 }}>{item.icon}</span>
                    <Title level={4} style={{ display: 'inline', color: '#122B4D', margin: 0, fontSize: 17.5 }}>
                      {item.title}
                    </Title>
                  </div>

                  <Paragraph strong style={{ color: item.color, fontSize: 14, marginBottom: 14 }}>
                    {item.subtitle}
                  </Paragraph>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    {item.bullets.map((b, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <StarFilled style={{ color: item.color, marginTop: 4, fontSize: 14 }} />
                        <Text style={{ fontSize: 13.8, color: '#2d3748', lineHeight: 1.65 }}>
                          {b}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};
