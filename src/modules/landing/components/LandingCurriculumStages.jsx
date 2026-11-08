import React from 'react';
import { Row, Col, Card, Space, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

const SunburstLeftSvg = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
    <line x1="28" y1="8" x2="14" y2="3" stroke="#FAAD14" strokeWidth="3" strokeLinecap="round" />
    <line x1="26" y1="18" x2="8" y2="18" stroke="#FAAD14" strokeWidth="3" strokeLinecap="round" />
    <line x1="28" y1="28" x2="14" y2="33" stroke="#FAAD14" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SunburstRightSvg = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
    <line x1="8" y1="8" x2="22" y2="3" stroke="#FAAD14" strokeWidth="3" strokeLinecap="round" />
    <line x1="10" y1="18" x2="28" y2="18" stroke="#FAAD14" strokeWidth="3" strokeLinecap="round" />
    <line x1="8" y1="28" x2="22" y2="33" stroke="#FAAD14" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const LandingCurriculumStages = ({ content }) => {
  const { kindergartenSection, primarySection } = content;

  return (
    <div>
      {/* Stage 1: Kindergarten (Wonders GK) — 100% Matched to ChatGPT Mockup */}
      <div
        id="section-kindergarten"
        style={{
          padding: '52px 24px 60px',
          background: 'linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)',
        }}
      >
        <div style={{ maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto 40px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#e6f4ff',
                border: '1px solid #91caff',
                color: '#0958d9',
                padding: '5px 16px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: '0.4px',
                marginBottom: 14,
              }}
            >
              <span>🌱</span>
              <span>{kindergartenSection.badge}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                marginBottom: 10,
              }}
            >
              <SunburstLeftSvg />
              <Title
                level={2}
                className="lak-display-font"
                style={{
                  color: '#122B4D',
                  margin: 0,
                  fontWeight: 800,
                  fontSize: 31,
                  lineHeight: 1.25,
                }}
              >
                {kindergartenSection.title}
              </Title>
              <SunburstRightSvg />
            </div>

            <Paragraph
              style={{
                fontSize: 15.5,
                color: '#4a5568',
                margin: '0 auto',
                maxWidth: 740,
                lineHeight: 1.65,
              }}
            >
              {kindergartenSection.subtitle}
            </Paragraph>
          </div>

          {/* 2x2 Illustration-Led Pillar Grid (Seamless White Card Backdrop) */}
          <Row gutter={[24, 24]}>
            {kindergartenSection.pillars.map((pillar) => (
              <Col xs={24} md={12} key={pillar.number}>
                <Card
                  hoverable
                  className="lak-pillar-card"
                  style={{
                    height: '100%',
                    background: '#ffffff',
                  }}
                  styles={{ body: { padding: '22px 24px' } }}
                >
                  <Row gutter={[20, 16]} align="middle">
                    <Col xs={24} sm={10}>
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="lak-float-img"
                        style={{
                          width: '100%',
                          height: 185,
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />
                    </Col>

                    <Col xs={24} sm={14}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#e6f4ff',
                            border: '1px solid #bae0ff',
                            borderRadius: 16,
                            padding: '3px 12px',
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{pillar.icon}</span>
                          <Text style={{ fontSize: 12, fontWeight: 700, color: '#0958d9' }}>
                            {pillar.badge}
                          </Text>
                        </div>

                        <Text
                          className="lak-display-font"
                          style={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: '#69b1ff',
                            lineHeight: 1,
                          }}
                        >
                          {pillar.number}
                        </Text>
                      </div>

                      <Title
                        level={4}
                        className="lak-display-font"
                        style={{
                          color: '#122B4D',
                          marginTop: 0,
                          marginBottom: 10,
                          fontSize: 18.5,
                          fontWeight: 800,
                          lineHeight: 1.3,
                        }}
                      >
                        {pillar.title}
                      </Title>

                      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        {pillar.highlights.map((pt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircleFilled
                              style={{ color: '#52c41a', marginTop: 4, fontSize: 14, flexShrink: 0 }}
                            />
                            <Text style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.58 }}>
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

      {/* Stage 2: Primary (Grades 1–5) — 100% Matched to ChatGPT Mockup */}
      <div id="section-primary" style={{ padding: '48px 24px 64px', background: '#ffffff' }}>
        <div
          style={{
            maxWidth: 1260,
            margin: '0 auto',
            background: 'linear-gradient(180deg, #eaf4ff 0%, #f7fbff 100%)',
            borderRadius: 28,
            border: '1px solid #bae0ff',
            padding: '40px 32px 44px',
            boxShadow: '0 16px 40px rgba(18, 43, 77, 0.06)',
          }}
        >
          {/* Split Header with Seamless Learning Beyond Boundaries Artwork */}
          <Row gutter={[32, 24]} align="middle" style={{ marginBottom: 32 }}>
            <Col xs={24} lg={13}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f9f0ff',
                  border: '1px solid #d3adf7',
                  color: '#531dab',
                  padding: '5px 16px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                <span>🎓</span>
                <span>{primarySection.badge}</span>
              </div>

              <Title
                level={2}
                className="lak-display-font"
                style={{
                  color: '#122B4D',
                  marginTop: 0,
                  marginBottom: 12,
                  fontWeight: 800,
                  fontSize: 31,
                  lineHeight: 1.24,
                }}
              >
                {primarySection.title}
              </Title>

              <Paragraph style={{ fontSize: 15.5, color: '#4a5568', margin: 0, lineHeight: 1.65 }}>
                {primarySection.subtitle}
              </Paragraph>
            </Col>

            <Col xs={24} lg={11}>
              <img
                src={LANDING_ASSETS.learningBanner}
                alt="Learning Beyond Boundaries"
                style={{
                  width: '100%',
                  maxHeight: 205,
                  objectFit: 'contain',
                  display: 'block',
                  mixBlendMode: 'multiply',
                }}
              />
            </Col>
          </Row>

          {/* 3 Visual-First Primary Pillar Cards with Inset Sky-Blue Illustration Frame */}
          <Row gutter={[24, 24]}>
            {primarySection.pillars.map((item, idx) => (
              <Col xs={24} lg={8} key={idx}>
                <Card
                  hoverable
                  className="lak-pillar-card"
                  style={{
                    height: '100%',
                    background: '#ffffff',
                  }}
                  styles={{ body: { padding: '18px 20px 24px' } }}
                >
                  {/* Inset Rounded Illustration Frame */}
                  <div
                    style={{
                      background: 'linear-gradient(180deg, #e6f4ff 0%, #ffffff 100%)',
                      border: '1.5px solid #91caff',
                      borderRadius: 16,
                      padding: '12px 16px 6px',
                      textAlign: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="lak-float-img"
                      style={{
                        height: 175,
                        width: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, lineHeight: 1.2 }}>{item.icon}</span>
                    <Title
                      level={4}
                      className="lak-display-font"
                      style={{
                        color: '#122B4D',
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </Title>
                  </div>

                  <Paragraph
                    strong
                    style={{
                      color: item.color,
                      fontSize: 13.5,
                      marginBottom: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    {item.subtitle}
                  </Paragraph>

                  <Space orientation="vertical" size={9} style={{ width: '100%' }}>
                    {item.bullets.map((b, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <CheckCircleFilled
                          style={{ color: '#52c41a', marginTop: 4, fontSize: 14, flexShrink: 0 }}
                        />
                        <Text style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.58 }}>
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
