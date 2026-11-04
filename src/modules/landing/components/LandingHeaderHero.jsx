import React from 'react';
import { Row, Col, Card, Button, Tag, Space, Typography, Segmented } from 'antd';
import {
  LoginOutlined,
  RocketOutlined,
  CheckCircleFilled,
  BookOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

export const LandingHeaderHero = ({
  content,
  language,
  onChangeLanguage,
  onOpenLoginModal,
}) => {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Sticky Top Navbar — DUY NHẤT 1 NÚT LOGIN Ở GÓC TRÊN CÙNG */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(18, 43, 77, 0.96)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(126, 200, 248, 0.25)',
          padding: '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space size={10} style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src={LANDING_ASSETS.iconLaptopCap}
              alt="LAK EDUCATION"
              style={{ width: 38, height: 38, objectFit: 'contain' }}
            />
            <div>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: 800, letterSpacing: '0.5px', display: 'block', lineHeight: 1.1 }}>
                LAK EDUCATION
              </Text>
              <Text style={{ color: '#7EC8F8', fontSize: 11, fontWeight: 600 }}>
                McGraw-Hill Wonders ELA • GK – Grade 5
              </Text>
            </div>
          </Space>

          <Space size={18} wrap>
            <Button type="link" style={{ color: '#e6f7ff', padding: 0 }} onClick={() => scrollToSection('section-kindergarten')}>
              {content.nav.kindergarten}
            </Button>
            <Button type="link" style={{ color: '#e6f7ff', padding: 0 }} onClick={() => scrollToSection('section-primary')}>
              {content.nav.primary}
            </Button>
            <Button type="link" style={{ color: '#e6f7ff', padding: 0 }} onClick={() => scrollToSection('section-writing')}>
              {content.nav.writingAndThinking}
            </Button>
            <Button type="link" style={{ color: '#e6f7ff', padding: 0 }} onClick={() => scrollToSection('section-books')}>
              {content.nav.curriculumInside}
            </Button>

            <Segmented
              size="small"
              value={language}
              onChange={onChangeLanguage}
              options={[
                { label: '🇬🇧 EN', value: 'en' },
                { label: '🇻🇳 VI', value: 'vi' },
              ]}
              style={{ fontWeight: 600 }}
            />

            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={onOpenLoginModal}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: '1px solid #7EC8F8',
                fontWeight: 700,
                borderRadius: 20,
                padding: '0 20px',
                height: 38,
                boxShadow: '0 4px 14px rgba(24,144,255,0.4)',
              }}
            >
              {language === 'en' ? 'Login' : 'Đăng Nhập'}
            </Button>
          </Space>
        </div>
      </div>

      {/* Hero Section inspired by web-landing.jpg & McGraw-Hill Wonders Books */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #122B4D 0%, #1E4477 52%, #2B5B9E 100%)',
          padding: '64px 24px 72px',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} lg={13}>
              <Tag
                color="cyan"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 20,
                  marginBottom: 16,
                }}
              >
                ✨ {content.hero.badge}
              </Tag>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Text
                  style={{
                    color: '#7EC8F8',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  {content.hero.slogan}
                </Text>
              </div>

              <Title
                level={1}
                style={{
                  color: '#ffffff',
                  fontSize: 38,
                  lineHeight: 1.22,
                  fontWeight: 800,
                  marginTop: 0,
                  marginBottom: 20,
                }}
              >
                {content.hero.title}
              </Title>

              <Paragraph
                style={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  fontSize: 16,
                  lineHeight: 1.75,
                  marginBottom: 28,
                }}
              >
                {content.hero.subtitle}
              </Paragraph>

              <Space size={16} wrap style={{ marginBottom: 36 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => scrollToSection('section-kindergarten')}
                  style={{
                    height: 48,
                    padding: '0 28px',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 24,
                    background: 'linear-gradient(135deg, #40a9ff 0%, #1890ff 100%)',
                    boxShadow: '0 6px 20px rgba(24,144,255,0.45)',
                  }}
                >
                  {content.hero.ctaSecondary}
                </Button>
                <Button
                  size="large"
                  ghost
                  icon={<BookOutlined />}
                  onClick={() => scrollToSection('section-books')}
                  style={{
                    height: 48,
                    padding: '0 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 24,
                    color: '#fff',
                    borderColor: '#7EC8F8',
                  }}
                >
                  {content.nav.curriculumInside}
                </Button>
              </Space>

              <Row gutter={[16, 16]}>
                {content.hero.stats.map((st, idx) => (
                  <Col xs={12} sm={6} key={idx}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(126,200,248,0.28)',
                        borderRadius: 12,
                        padding: '12px 14px',
                      }}
                    >
                      <Text style={{ color: '#7EC8F8', fontSize: 22, fontWeight: 800, display: 'block' }}>
                        {st.value}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12 }}>
                        {st.label}
                      </Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>

            {/* Right Column: Featured McGraw-Hill Wonders Image 2HGb6FKlyyCslUn63A4RrLUafXrjw8La7U4e.jpg */}
            <Col xs={24} lg={11}>
              <div
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  padding: 12,
                  borderRadius: 20,
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
                  border: '3px solid #7EC8F8',
                }}
              >
                <img
                  src={LANDING_ASSETS.wondersBooksHero}
                  alt="McGraw-Hill Wonders ELA Curriculum Books"
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    display: 'block',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: '#f0f8ff',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <Space>
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                    <Text strong style={{ color: '#122B4D', fontSize: 13 }}>
                      McGraw-Hill Wonders ELA (Kindergarten GK – Grade 5)
                    </Text>
                  </Space>
                  <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                    U.S. Common Core Standard
                  </Tag>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 3 Core Values Strip using 1.png, 2.png, 3.png */}
      <div style={{ maxWidth: 1240, margin: '-36px auto 40px', padding: '0 24px', position: 'relative', zIndex: 5 }}>
        <Row gutter={[24, 24]}>
          {content.threeCoreValues.map((item, index) => (
            <Col xs={24} md={8} key={index}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 16,
                  border: '1px solid #d6ecff',
                  boxShadow: '0 10px 28px rgba(18, 43, 77, 0.08)',
                }}
              >
                <Space align="start" size={16}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 16,
                      background: '#f0f8ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      flexShrink: 0,
                    }}
                  >
                    <img src={item.icon} alt={item.title} style={{ width: 52, height: 52, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <Tag color="blue" style={{ marginBottom: 6, fontWeight: 600 }}>
                      {item.tag}
                    </Tag>
                    <Title level={4} style={{ margin: '0 0 8px 0', color: '#122B4D', fontSize: 17 }}>
                      {item.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                      {item.desc}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};
