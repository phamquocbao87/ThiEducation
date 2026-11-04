import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Space, Typography, Segmented, Drawer, Menu } from 'antd';
import {
  LoginOutlined,
  RocketOutlined,
  CheckCircleFilled,
  BookOutlined,
  MenuOutlined,
  CloseOutlined,
  ReadOutlined,
  EditOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

export const LandingHeaderHero = ({
  content,
  language,
  onChangeLanguage,
  onOpenLoginModal,
}) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const navItems = [
    { key: 'section-kindergarten', icon: <StarOutlined />, label: content.nav.kindergarten },
    { key: 'section-primary', icon: <ReadOutlined />, label: content.nav.primary },
    { key: 'section-writing', icon: <EditOutlined />, label: content.nav.writingAndThinking },
    { key: 'section-books', icon: <BookOutlined />, label: content.nav.curriculumInside },
  ];

  return (
    <div>
      {/* Sticky Top Navbar — Responsive Desktop Bar & Mobile Slide Menu Trigger */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(18, 43, 77, 0.96)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(126, 200, 248, 0.25)',
          padding: isMobile ? '10px 16px' : '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Brand Logo */}
          <Space
            size={10}
            style={{ cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src={LANDING_ASSETS.iconLaptopCap}
              alt="LAK EDUCATION"
              style={{ width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, objectFit: 'contain' }}
            />
            <div>
              <Text
                style={{
                  color: '#fff',
                  fontSize: isMobile ? 16 : 19,
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  display: 'block',
                  lineHeight: 1.1,
                }}
              >
                LAK EDUCATION
              </Text>
              <Text style={{ color: '#7EC8F8', fontSize: isMobile ? 10 : 11, fontWeight: 600 }}>
                McGraw-Hill Wonders ELA • GK – G5
              </Text>
            </div>
          </Space>

          {/* Desktop Navigation Menu */}
          {!isMobile && (
            <Space size={18} wrap>
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  type="link"
                  style={{ color: '#e6f7ff', padding: 0, fontWeight: 500 }}
                  onClick={() => scrollToSection(item.key)}
                >
                  {item.label}
                </Button>
              ))}

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
          )}

          {/* Mobile Controls: Language Switcher + Hamburger Slide Menu Button */}
          {isMobile && (
            <Space size={8}>
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
                ghost
                icon={<MenuOutlined style={{ fontSize: 18, color: '#fff' }} />}
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  borderColor: 'rgba(126, 200, 248, 0.5)',
                  borderRadius: 8,
                  width: 38,
                  height: 36,
                }}
              />
            </Space>
          )}
        </div>
      </div>

      {/* Mobile Slide-Out Drawer Menu */}
      <Drawer
        placement="right"
        width={290}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 16 }} />}
        styles={{
          header: {
            background: '#122B4D',
            borderBottom: '1px solid rgba(126, 200, 248, 0.2)',
          },
          body: {
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#f8fbff',
          },
        }}
        title={
          <Space size={10}>
            <img
              src={LANDING_ASSETS.iconLaptopCap}
              alt="LAK EDUCATION"
              style={{ width: 30, height: 30, objectFit: 'contain' }}
            />
            <div>
              <Text style={{ color: '#fff', fontWeight: 800, fontSize: 15, display: 'block', lineHeight: 1.1 }}>
                LAK EDUCATION
              </Text>
              <Text style={{ color: '#7EC8F8', fontSize: 11 }}>
                McGraw-Hill Wonders ELA
              </Text>
            </div>
          </Space>
        }
      >
        <div>
          <Menu
            mode="vertical"
            selectable={false}
            onClick={(e) => scrollToSection(e.key)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 15,
              fontWeight: 600,
            }}
            items={navItems}
          />
        </div>

        <div style={{ padding: '16px 8px 8px', borderTop: '1px solid #d6e8ff' }}>
          <Button
            type="primary"
            size="large"
            block
            icon={<LoginOutlined />}
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLoginModal();
            }}
            style={{
              height: 44,
              borderRadius: 22,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              boxShadow: '0 6px 16px rgba(24,144,255,0.35)',
            }}
          >
            {language === 'en' ? 'Login' : 'Đăng Nhập'}
          </Button>
        </div>
      </Drawer>

      {/* Hero Section inspired by web-landing.jpg & McGraw-Hill Wonders Books */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #122B4D 0%, #1E4477 52%, #2B5B9E 100%)',
          padding: isMobile ? '36px 16px 56px' : '64px 24px 72px',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Row gutter={[40, 32]} align="middle">
            <Col xs={24} lg={13}>
              <Tag
                color="cyan"
                style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 20,
                  marginBottom: 14,
                  whiteSpace: 'normal',
                }}
              >
                ✨ {content.hero.badge}
              </Tag>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Text
                  style={{
                    color: '#7EC8F8',
                    fontSize: isMobile ? 13 : 16,
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
                  fontSize: isMobile ? 26 : 38,
                  lineHeight: 1.25,
                  fontWeight: 800,
                  marginTop: 0,
                  marginBottom: 18,
                }}
              >
                {content.hero.title}
              </Title>

              <Paragraph
                style={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  fontSize: isMobile ? 14.5 : 16,
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                {content.hero.subtitle}
              </Paragraph>

              <Space size={12} wrap style={{ marginBottom: 32 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => scrollToSection('section-kindergarten')}
                  style={{
                    height: 46,
                    padding: '0 24px',
                    fontSize: 15,
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
                    height: 46,
                    padding: '0 22px',
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

              <Row gutter={[12, 12]}>
                {content.hero.stats.map((st, idx) => (
                  <Col xs={12} sm={6} key={idx}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(126,200,248,0.28)',
                        borderRadius: 12,
                        padding: '10px 12px',
                        height: '100%',
                      }}
                    >
                      <Text style={{ color: '#7EC8F8', fontSize: isMobile ? 19 : 22, fontWeight: 800, display: 'block' }}>
                        {st.value}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 11.5 }}>
                        {st.label}
                      </Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>

            {/* Right Column: Featured McGraw-Hill Wonders Image */}
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

      {/* 3 Core Values Strip using WebP icons */}
      <div style={{ maxWidth: 1240, margin: '-32px auto 40px', padding: isMobile ? '0 16px' : '0 24px', position: 'relative', zIndex: 5 }}>
        <Row gutter={[20, 20]}>
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
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: '#f0f8ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      flexShrink: 0,
                    }}
                  >
                    <img src={item.icon} alt={item.title} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <Tag color="blue" style={{ marginBottom: 6, fontWeight: 600 }}>
                      {item.tag}
                    </Tag>
                    <Title level={4} style={{ margin: '0 0 8px 0', color: '#122B4D', fontSize: 16.5 }}>
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
