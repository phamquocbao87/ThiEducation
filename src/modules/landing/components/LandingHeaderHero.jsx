import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Space, Typography, Segmented, Drawer, Menu, Tooltip } from 'antd';
import {
  LoginOutlined,
  RocketOutlined,
  BookOutlined,
  MenuOutlined,
  CloseOutlined,
  ReadOutlined,
  EditOutlined,
  StarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

const renderHeroStatSvg = (idx) => {
  if (idx === 0) {
    // Graduation Cap SVG
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 5L3 10.5L14 16L25 10.5L14 5Z" fill="#7EC8F8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7.5 13V19.5C7.5 21.2 10.4 22.8 14 22.8C17.6 22.8 20.5 21.2 20.5 19.5V13" stroke="#7EC8F8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 11V18.5" stroke="#FFCC66" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (idx === 1) {
    // Stacked Science/Social Books SVG
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 18.5L14 23L23 18.5" stroke="#FFCC66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14L14 18.5L23 14" stroke="#7EC8F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 5L5 9.5L14 14L23 9.5L14 5Z" fill="#7EC8F8" fillOpacity="0.4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (idx === 2) {
    // Qualified Native Teachers & Specialists SVG
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="11" cy="10" r="3.8" fill="#7EC8F8" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M4.5 21.5C4.5 18.2 7.4 16 11 16C14.6 16 17.5 18.2 17.5 21.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="19.5" cy="11.5" r="2.8" fill="#FFCC66" />
        <path d="M16.5 21.5C16.8 19 18.4 17.5 20.8 17.5C22.4 17.5 23.6 18.4 24 20" stroke="#7EC8F8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  // 9 Pillars Grid SVG
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="4" y="4" width="7.5" height="7.5" rx="2" fill="#7EC8F8" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="14.5" y="4" width="7.5" height="7.5" rx="2" fill="#FFCC66" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="4" y="14.5" width="7.5" height="7.5" rx="2" fill="#FFFFFF" fillOpacity="0.25" stroke="#7EC8F8" strokeWidth="1.5" />
      <rect x="14.5" y="14.5" width="7.5" height="7.5" rx="2" fill="#7EC8F8" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
};

const renderCoreValueSvg = (idx) => {
  if (idx === 0) {
    // Open Book Icon (Native ELA Standard)
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 9C14.5 7 9.5 6.8 5.5 8V26.5C9.5 25.3 14.5 25.5 18 27.5C21.5 25.5 26.5 25.3 30.5 26.5V8C26.5 6.8 21.5 7 18 9Z" fill="#E6F4FF" stroke="#1890FF" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M18 9V27.5" stroke="#1890FF" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (idx === 1) {
    // Glowing Lightbulb Icon (Critical Inquiry)
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="15.5" r="8.5" fill="#FFF1B8" stroke="#FAAD14" strokeWidth="2.2" />
        <path d="M14.5 24H21.5M15.5 27.5H20.5" stroke="#D48806" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 3.5V5.5M6.5 15.5H8.5M27.5 15.5H29.5M9.8 7.5L11.2 9M26.2 7.5L24.8 9" stroke="#FAAD14" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // Layered Diamond Stack (Structured Thinking)
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 6L6 12L18 18L30 12L18 6Z" fill="#BAE0FF" stroke="#1890FF" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 18L18 24L30 18" stroke="#1890FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 23.5L18 29.5L30 23.5" stroke="#0958D9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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

  const renderHighlightedTitle = (rawTitle) => {
    const highlightPhrase =
      language === 'en' ? 'True Native' : 'Năng Lực Ngôn Ngữ Bản Ngữ (ELA)';
    if (!rawTitle.includes(highlightPhrase)) return rawTitle;
    const parts = rawTitle.split(highlightPhrase);
    return (
      <>
        {parts[0]}
        <span
          style={{
            color: '#FFCC66',
            textShadow: '0 4px 18px rgba(255, 204, 102, 0.35)',
          }}
        >
          {highlightPhrase}
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div>
      {/* Sticky Top Navbar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(13, 33, 63, 0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(126, 200, 248, 0.22)',
          padding: isMobile ? '10px 16px' : '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1260,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Left Group: Mobile Hamburger Button (Top-Left) + Brand Logo */}
          <Space size={10}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 20, color: '#fff' }} />}
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  width: 38,
                  height: 38,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            )}

            <Space
              size={10}
              style={{ cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img
                src={LANDING_ASSETS.iconLaptopCap}
                alt="LAK EDUCATION"
                style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, objectFit: 'contain' }}
              />
              <div>
                <Text
                  className="lak-display-font"
                  style={{
                    color: '#fff',
                    fontSize: isMobile ? 15.5 : 19,
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    display: 'block',
                    lineHeight: 1.1,
                  }}
                >
                  LAK EDUCATION
                </Text>
                <Text style={{ color: '#7EC8F8', fontSize: isMobile ? 10 : 11.5, fontWeight: 600 }}>
                  McGraw-Hill Wonders ELA • GK – G5
                </Text>
              </div>
            </Space>
          </Space>

          {/* Desktop Navigation Menu */}
          {!isMobile && (
            <Space size={20} wrap>
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  type="link"
                  style={{ color: '#e6f7ff', padding: 0, fontWeight: 600, fontSize: 14 }}
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
                style={{ fontWeight: 700 }}
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
                  padding: '0 22px',
                  height: 38,
                  boxShadow: '0 4px 14px rgba(24,144,255,0.4)',
                }}
              >
                {language === 'en' ? 'Login' : 'Đăng Nhập'}
              </Button>
            </Space>
          )}

          {/* Right Group on Mobile: Language Switcher + Compact Login Button */}
          {isMobile && (
            <Space size={6}>
              <Segmented
                size="small"
                value={language}
                onChange={onChangeLanguage}
                options={[
                  { label: 'EN', value: 'en' },
                  { label: 'VI', value: 'vi' },
                ]}
                style={{ fontWeight: 700 }}
              />
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                onClick={onOpenLoginModal}
                style={{
                  borderRadius: 16,
                  fontWeight: 700,
                  padding: '0 10px',
                  height: 30,
                }}
              >
                {language === 'en' ? 'Login' : 'Đăng nhập'}
              </Button>
            </Space>
          )}
        </div>
      </div>

      {/* Mobile Slide-Out Drawer Menu (Placement Left) */}
      <Drawer
        placement="left"
        width={285}
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

      {/* Hero Section — 100% Matched to ChatGPT Plus Mockup */}
      <div
        style={{
          position: 'relative',
          background:
            'radial-gradient(circle at 75% 32%, rgba(78, 168, 255, 0.34) 0%, transparent 52%), linear-gradient(135deg, #0D2240 0%, #15396B 48%, #21559C 100%)',
          padding: isMobile ? '28px 16px 36px' : '44px 24px 48px',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1260, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Row 1: Left Copy & CTA + Right Seamless 3D Wonders Books & Kids Artwork */}
          <Row gutter={[32, 28]} align="middle" style={{ marginBottom: 28 }}>
            <Col xs={24} lg={12}>
              {/* U.S. Flag Pill Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#122B4D',
                  padding: '6px 16px',
                  borderRadius: 24,
                  fontSize: isMobile ? 10.5 : 11.5,
                  fontWeight: 800,
                  marginBottom: 14,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span style={{ fontSize: 16 }}>🇺🇸</span>
                <span>{content.hero.badge}</span>
              </div>

              {/* Slogan with Horizontal Line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Text
                  style={{
                    color: '#BCE6FF',
                    fontSize: isMobile ? 12 : 13.5,
                    fontWeight: 800,
                    letterSpacing: '2.2px',
                    textTransform: 'uppercase',
                  }}
                >
                  {content.hero.slogan}
                </Text>
                <div
                  style={{
                    flex: 1,
                    maxWidth: 90,
                    height: 1.5,
                    background: 'linear-gradient(90deg, #7EC8F8 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Display Headline with Golden Highlight */}
              <Title
                level={1}
                className="lak-display-font"
                style={{
                  color: '#ffffff',
                  fontSize: isMobile ? 26 : 39,
                  lineHeight: 1.18,
                  fontWeight: 800,
                  marginTop: 0,
                  marginBottom: 16,
                }}
              >
                {renderHighlightedTitle(content.hero.title)}
              </Title>

              <Paragraph
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: isMobile ? 14 : 15,
                  lineHeight: 1.68,
                  marginBottom: 24,
                }}
              >
                {content.hero.subtitle}
              </Paragraph>

              {/* CTA Buttons */}
              <Space size={14} wrap>
                <Button
                  size="large"
                  className="lak-gold-cta-btn"
                  icon={<RocketOutlined />}
                  onClick={() => scrollToSection('section-kindergarten')}
                  style={{
                    height: 46,
                    padding: '0 24px',
                    fontSize: 14.5,
                    borderRadius: 24,
                  }}
                >
                  {content.hero.ctaSecondary} <ArrowRightOutlined style={{ marginLeft: 4 }} />
                </Button>
                <Button
                  size="large"
                  ghost
                  icon={<BookOutlined />}
                  onClick={() => scrollToSection('section-books')}
                  style={{
                    height: 46,
                    padding: '0 22px',
                    fontSize: 14.5,
                    fontWeight: 700,
                    borderRadius: 24,
                    color: '#fff',
                    borderColor: 'rgba(126, 200, 248, 0.7)',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {content.nav.curriculumInside}
                </Button>
              </Space>
            </Col>

            {/* Right Column: Seamless 3D Wonders Books + Happy Students on Golden Arc */}
            <Col xs={24} lg={12}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 24,
                  overflow: 'hidden',
                  boxShadow: '0 22px 48px rgba(4, 15, 35, 0.45)',
                  border: '1.5px solid rgba(126, 200, 248, 0.38)',
                }}
              >
                <img
                  src={LANDING_ASSETS.heroKidsShowcase}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = LANDING_ASSETS.wondersBooksHero;
                  }}
                  alt="McGraw-Hill Wonders ELA Curriculum & Students"
                  style={{
                    width: '100%',
                    maxHeight: 370,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </Col>
          </Row>

          {/* Row 2: Full-Width 4 Horizontal Frosted Glass Stat Cards (Matched to ChatGPT Mockup) */}
          <Row gutter={[16, 14]} style={{ marginBottom: 22 }}>
            {content.hero.stats.map((st, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <div
                  style={{
                    background: 'rgba(19, 52, 99, 0.68)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(126, 200, 248, 0.38)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(126, 200, 248, 0.15)',
                      border: '1px solid rgba(126, 200, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {renderHeroStatSvg(idx)}
                  </div>
                  <div>
                    <Text
                      className="lak-display-font"
                      style={{
                        color: '#ffffff',
                        fontSize: 20,
                        fontWeight: 800,
                        display: 'block',
                        lineHeight: 1.15,
                        marginBottom: 2,
                      }}
                    >
                      {st.value}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255, 255, 255, 0.86)',
                        fontSize: 12,
                        lineHeight: 1.35,
                        display: 'block',
                      }}
                    >
                      {st.label}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Row 3: Sleek White 3 Core Values Dock Bar Inside Hero Bottom */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.97)',
              borderRadius: 18,
              padding: isMobile ? '16px 16px' : '18px 24px',
              border: '1px solid rgba(186, 224, 255, 0.9)',
              boxShadow: '0 16px 40px rgba(7, 22, 44, 0.28)',
            }}
          >
            <Row gutter={[20, 16]} align="middle">
              {content.threeCoreValues.map((item, index) => (
                <Col
                  xs={24}
                  md={8}
                  key={index}
                  style={{
                    borderRight:
                      !isMobile && index < content.threeCoreValues.length - 1
                        ? '1px solid #d6e8ff'
                        : 'none',
                  }}
                >
                  <Tooltip title={item.desc} placement="bottom">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        paddingRight: !isMobile ? 10 : 0,
                        cursor: 'default',
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: '#f4f9ff',
                          border: '1px solid #d6e8ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {renderCoreValueSvg(index)}
                      </div>
                      <div>
                        <Text
                          className="lak-display-font"
                          style={{
                            color: '#122B4D',
                            fontSize: 16,
                            fontWeight: 800,
                            display: 'block',
                            lineHeight: 1.25,
                            marginBottom: 2,
                          }}
                        >
                          {item.shortTitle || item.title}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: '#334155',
                            lineHeight: 1.4,
                            display: 'block',
                          }}
                        >
                          {item.shortDesc || item.desc}
                        </Text>
                      </div>
                    </div>
                  </Tooltip>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
};
