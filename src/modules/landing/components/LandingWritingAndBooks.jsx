import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Space, Typography, Divider, Button, Modal, Form, Input, Select, Tooltip, message } from 'antd';
import {
  EditOutlined,
  ApartmentOutlined,
  BookOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CalendarOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

const renderGenreSvg = (idx) => {
  if (idx === 0) {
    // Purple Speech Bubble (Opinion Writing)
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="15" rx="5" fill="#F3E8FF" stroke="#722ED1" strokeWidth="1.8" />
        <path d="M9 20L6 24V20" fill="#F3E8FF" stroke="#722ED1" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="9.5" cy="12.5" r="1.5" fill="#722ED1" />
        <circle cx="14" cy="12.5" r="1.5" fill="#722ED1" />
        <circle cx="18.5" cy="12.5" r="1.5" fill="#722ED1" />
      </svg>
    );
  }
  if (idx === 1) {
    // Blue Layered Stack (Informative / Explanatory)
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 5L4 10L14 15L24 10L14 5Z" fill="#BAE0FF" stroke="#1890FF" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 14.5L14 19.5L24 14.5" stroke="#1890FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19L14 24L24 19" stroke="#0958D9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Purple Open Book (Narrative Writing)
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 7.5C11.2 6 7.5 5.8 4.5 6.8V21C7.5 20 11.2 20.2 14 21.8C16.8 20.2 20.5 20 23.5 21V6.8C20.5 5.8 16.8 6 14 7.5Z" fill="#F3E8FF" stroke="#722ED1" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 7.5V21.8" stroke="#722ED1" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

const renderOrganizerMiniSvg = (idx) => {
  if (idx === 0) {
    // Venn Diagram SVG
    return (
      <svg width="76" height="44" viewBox="0 0 76 44" fill="none">
        <circle cx="28" cy="22" r="16" fill="#7EC8F8" fillOpacity="0.55" stroke="#1890ff" strokeWidth="2" />
        <circle cx="48" cy="22" r="16" fill="#FFD666" fillOpacity="0.6" stroke="#d48806" strokeWidth="2" />
      </svg>
    );
  }
  if (idx === 1) {
    // Sequence Chart SVG
    return (
      <svg width="88" height="44" viewBox="0 0 88 44" fill="none">
        <rect x="4" y="11" width="20" height="22" rx="5" fill="#bae0ff" stroke="#1890ff" strokeWidth="2" />
        <path d="M27 22H33" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" />
        <rect x="34" y="11" width="20" height="22" rx="5" fill="#d6e4ff" stroke="#2f54eb" strokeWidth="2" />
        <path d="M57 22H63" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" />
        <rect x="64" y="11" width="20" height="22" rx="5" fill="#d9f7be" stroke="#52c41a" strokeWidth="2" />
      </svg>
    );
  }
  // Concept Web SVG
  return (
    <svg width="76" height="44" viewBox="0 0 76 44" fill="none">
      <line x1="38" y1="22" x2="16" y2="10" stroke="#1890ff" strokeWidth="1.8" />
      <line x1="38" y1="22" x2="60" y2="10" stroke="#1890ff" strokeWidth="1.8" />
      <line x1="38" y1="22" x2="16" y2="34" stroke="#1890ff" strokeWidth="1.8" />
      <line x1="38" y1="22" x2="60" y2="34" stroke="#1890ff" strokeWidth="1.8" />
      <circle cx="38" cy="22" r="9" fill="#FFD666" stroke="#d48806" strokeWidth="2" />
      <circle cx="16" cy="10" r="6" fill="#7EC8F8" stroke="#1890ff" strokeWidth="1.8" />
      <circle cx="60" cy="10" r="6" fill="#ffadd2" stroke="#eb2f96" strokeWidth="1.8" />
      <circle cx="16" cy="34" r="6" fill="#b7eb8f" stroke="#52c41a" strokeWidth="1.8" />
      <circle cx="60" cy="34" r="6" fill="#d3adf7" stroke="#722ed1" strokeWidth="1.8" />
    </svg>
  );
};

const renderBookSuiteSvg = (idx) => {
  if (idx === 0) {
    // Open Book
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 7C10.5 5.5 7 5.3 4 6.2V19.5C7 18.6 10.5 18.8 13 20.3C15.5 18.8 19 18.6 22 19.5V6.2C19 5.3 15.5 5.5 13 7Z" stroke="#FFCC66" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M13 7V20.3" stroke="#FFCC66" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (idx === 1) {
    // Stacked Anthology Books
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="4" y="6" width="18" height="4.5" rx="1.5" fill="#7EC8F8" fillOpacity="0.3" stroke="#7EC8F8" strokeWidth="1.6" />
        <rect x="5" y="11.5" width="17" height="4.5" rx="1.5" fill="#FFCC66" fillOpacity="0.3" stroke="#FFCC66" strokeWidth="1.6" />
        <rect x="4" y="17" width="18" height="4.5" rx="1.5" fill="#52C41A" fillOpacity="0.3" stroke="#73D13D" strokeWidth="1.6" />
      </svg>
    );
  }
  if (idx === 2) {
    // ABC Phonics Blocks
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="4" y="13" width="8" height="8" rx="2" fill="#7EC8F8" fillOpacity="0.25" stroke="#7EC8F8" strokeWidth="1.6" />
        <rect x="14" y="13" width="8" height="8" rx="2" fill="#FFCC66" fillOpacity="0.25" stroke="#FFCC66" strokeWidth="1.6" />
        <rect x="9" y="4.5" width="8" height="8" rx="2" fill="#FFCC66" fillOpacity="0.35" stroke="#FFCC66" strokeWidth="1.6" />
      </svg>
    );
  }
  // Bar Chart & Assessment
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="5" y="14" width="4" height="7" rx="1" fill="#7EC8F8" />
      <rect x="11" y="10" width="4" height="11" rx="1" fill="#FFCC66" />
      <rect x="17" y="6" width="4" height="15" rx="1" fill="#73D13D" />
    </svg>
  );
};

export const LandingWritingAndBooks = ({
  content,
  language,
}) => {
  const { writingAndOrganizerSection, bookShowcaseSection, assessmentCtaSection } = content;
  const [activeStepIdx, setActiveStepIdx] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 992 : true
  );
  const [form] = Form.useForm();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % writingAndOrganizerSection.writingSteps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPaused, writingAndOrganizerSection.writingSteps.length]);

  const handleAssessmentSubmit = (values) => {
    message.success(
      assessmentCtaSection?.successMsg ||
        (language === 'en'
          ? `Booking confirmed for ${values.parentName}!`
          : `Đã ghi nhận đăng ký kiểm tra năng lực cho phụ huynh ${values.parentName}!`)
    );
    form.resetFields();
    setAssessmentModalOpen(false);
  };

  return (
    <div>
      {/* Section: Academic Writing Process & Graphic Organizers */}
      <div
        id="section-writing"
        style={{
          padding: '64px 24px',
          background: 'linear-gradient(180deg, #eef6ff 0%, #f7fbff 100%)',
        }}
      >
        <div style={{ maxWidth: 1260, margin: '0 auto' }}>
          {/* Master Container Card: 4-Step Academic Writing + 3 Genres + Graphic Organizers */}
          <Card
            style={{
              borderRadius: 28,
              border: '1px solid rgba(126, 200, 248, 0.5)',
              boxShadow: '0 20px 52px rgba(18, 43, 77, 0.08)',
              background: '#ffffff',
            }}
            styles={{ body: { padding: '32px 30px 34px' } }}
          >
            {/* Header Row with Interactive Stepper Pills & Floating Illustration */}
            <Row gutter={[24, 20]} align="middle" style={{ marginBottom: 28 }}>
              <Col xs={24} lg={15}>
                <Space align="center" size={12} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 6px 16px rgba(24,144,255,0.35)',
                    }}
                  >
                    <EditOutlined style={{ fontSize: 21 }} />
                  </div>
                  <Title
                    level={3}
                    className="lak-display-font"
                    style={{ margin: 0, color: '#122B4D', fontSize: 24, fontWeight: 800 }}
                  >
                    {language === 'en'
                      ? 'Structured 4-Step Academic Writing Process'
                      : 'Quy Trình Viết Học Thuật Có Cấu Trúc (4 Bước Chuẩn Quốc Tế)'}
                  </Title>
                </Space>

                <Paragraph style={{ margin: '0 0 16px 0', color: '#4a5568', fontSize: 15 }}>
                  {language === 'en'
                    ? 'Students master a systematic composition workflow — from initial brainstorming to polished publication:'
                    : 'Học viên rèn luyện tư duy viết bài bản theo lộ trình 4 bước khép kín — từ lúc hình thành ý tưởng đến khi hoàn thiện tác phẩm:'}
                </Paragraph>

                {/* Interactive Flow Pills */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  {writingAndOrganizerSection.writingSteps.map((st, idx) => {
                    const isActive = idx === activeStepIdx;
                    return (
                      <React.Fragment key={st.step}>
                        <div
                          onMouseEnter={() => {
                            setIsPaused(true);
                            setActiveStepIdx(idx);
                          }}
                          onMouseLeave={() => setIsPaused(false)}
                          onClick={() => setActiveStepIdx(idx)}
                          style={{
                            padding: '6px 15px',
                            borderRadius: 20,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease',
                            background: isActive ? st.accent : '#f0f5ff',
                            color: isActive ? '#ffffff' : '#122B4D',
                            boxShadow: isActive ? `0 6px 16px ${st.accent}55` : 'none',
                            transform: isActive ? 'scale(1.04)' : 'scale(1)',
                          }}
                        >
                          {st.icon} {st.name}
                        </div>
                        {idx < writingAndOrganizerSection.writingSteps.length - 1 && (
                          <span className="lak-arrow-flow" style={{ color: '#94a3b8', fontWeight: 700, fontSize: 12 }}>
                            <ArrowRightOutlined />
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </Col>

              <Col xs={24} lg={9}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
                    border: '1px solid #d6e8ff',
                    borderRadius: 18,
                    padding: '12px 16px',
                    textAlign: 'center',
                    boxShadow: '0 8px 22px rgba(18, 43, 77, 0.05)',
                  }}
                >
                  <img
                    src={writingAndOrganizerSection.writingImage}
                    alt="4-Step Academic Writing Process"
                    className="lak-float-img"
                    style={{
                      width: '100%',
                      maxHeight: 125,
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </div>
              </Col>
            </Row>

            {/* 4 Step Cards Connected with Circular Arrow Badges */}
            <Row gutter={[22, 24]} style={{ marginBottom: 32 }}>
              {writingAndOrganizerSection.writingSteps.map((st, idx) => {
                const isActive = idx === activeStepIdx;
                return (
                  <Col xs={24} sm={12} lg={6} key={st.step} style={{ position: 'relative' }}>
                    <div
                      className="lak-writing-step-card"
                      onMouseEnter={() => {
                        setIsPaused(true);
                        setActiveStepIdx(idx);
                      }}
                      onMouseLeave={() => setIsPaused(false)}
                      onClick={() => setActiveStepIdx(idx)}
                      style={{
                        background: st.lightBg,
                        border: isActive ? `2px solid ${st.accent}` : `1.5px solid ${st.accent}55`,
                        boxShadow: isActive
                          ? `0 18px 36px -8px ${st.accent}40, 0 4px 12px rgba(18,43,77,0.08)`
                          : '0 6px 16px rgba(18,43,77,0.04)',
                        transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: isActive ? 5 : 3,
                          background: st.accent,
                          transition: 'all 0.3s ease',
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 11px',
                            borderRadius: 12,
                            fontSize: 11.5,
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            background: isActive ? st.accent : '#ffffff',
                            color: isActive ? '#fff' : '#122B4D',
                            border: `1px solid ${st.accent}55`,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {st.step}
                        </span>

                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: '#ffffff',
                            border: `1px solid ${st.accent}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 19,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                          }}
                        >
                          {st.icon}
                        </div>
                      </div>

                      <div
                        className="lak-display-font"
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: '#122B4D',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: 4,
                        }}
                      >
                        {st.name}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: st.accent,
                          marginBottom: 8,
                        }}
                      >
                        {st.viTitle}
                      </div>

                      <Text style={{ fontSize: 13, color: '#334155', lineHeight: 1.56, display: 'block' }}>
                        {st.desc}
                      </Text>
                    </div>

                    {/* Circular Connector Arrow Between Step Cards on Desktop (100% Matched to ChatGPT Mockup) */}
                    {isDesktop && idx < writingAndOrganizerSection.writingSteps.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          right: -13,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 6,
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: '#e6f4ff',
                          border: '1.5px solid #69b1ff',
                          color: '#0958d9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          boxShadow: '0 4px 10px rgba(24,144,255,0.2)',
                        }}
                      >
                        <ArrowRightOutlined />
                      </div>
                    )}
                  </Col>
                );
              })}
            </Row>

            {/* 3 Core Academic Writing Genres Mastered by Students */}
            <Divider style={{ margin: '24px 0 22px' }}>
              <div
                style={{
                  background: '#e6f4ff',
                  border: '1px solid #91caff',
                  color: '#0958d9',
                  fontSize: 11.5,
                  fontWeight: 800,
                  padding: '5px 18px',
                  borderRadius: 16,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                {language === 'en'
                  ? '• 3 CORE ACADEMIC WRITING GENRES MASTERED BY STUDENTS •'
                  : '• 3 THỂ LOẠI VIẾT HỌC THUẬT TRỌNG TÂM HỌC SINH ĐƯỢC RÈN LUYỆN •'}
              </div>
            </Divider>

            <Row gutter={[18, 18]} style={{ marginBottom: 26 }}>
              {writingAndOrganizerSection.writingGenres.map((g, idx) => (
                <Col xs={24} md={8} key={idx}>
                  <div
                    className="lak-genre-card"
                    style={{
                      background: '#f8fbff',
                      border: '1px solid #d6e8ff',
                      borderRadius: 18,
                      padding: '16px 18px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1px solid #d6e8ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.08)',
                      }}
                    >
                      {renderGenreSvg(idx)}
                    </div>
                    <div>
                      <Tag
                        color={idx === 1 ? 'blue' : 'purple'}
                        style={{ fontWeight: 700, marginBottom: 5, fontSize: 11.5, borderRadius: 10 }}
                      >
                        {g.name}
                      </Tag>
                      <Title
                        level={5}
                        className="lak-display-font"
                        style={{ margin: '0 0 4px 0', color: '#122B4D', fontSize: 15.5, fontWeight: 800 }}
                      >
                        {g.viName}
                      </Title>
                      <Text style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.52, display: 'block' }}>
                        {g.desc}
                      </Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Graphic Organizers Visual Bar (100% Matched to ChatGPT Mockup) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eef7ff 0%, #f7fbff 100%)',
                border: '1px solid #bae0ff',
                borderRadius: 18,
                padding: '16px 22px',
              }}
            >
              <Row gutter={[20, 16]} align="middle">
                <Col xs={24} lg={13}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#ffffff',
                        border: '1px solid #91caff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1890ff',
                        fontSize: 22,
                        flexShrink: 0,
                      }}
                    >
                      <ApartmentOutlined />
                    </div>
                    <div>
                      <Title
                        level={4}
                        className="lak-display-font"
                        style={{ color: '#122B4D', margin: '0 0 2px 0', fontSize: 17.5, fontWeight: 800 }}
                      >
                        {writingAndOrganizerSection.graphicOrganizers.title.replace('🌺 ', '')}
                      </Title>
                      <Text style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.45, display: 'block' }}>
                        {writingAndOrganizerSection.graphicOrganizers.desc}
                      </Text>
                    </div>
                  </div>
                </Col>

                <Col xs={24} lg={11}>
                  <Row gutter={[12, 12]}>
                    {writingAndOrganizerSection.graphicOrganizers.tools.map((tool, tIdx) => (
                      <Col xs={24} sm={8} key={tIdx}>
                        <Tooltip title={tool.purpose} placement="top">
                          <div
                            className="lak-genre-card"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #d6e8ff',
                              borderRadius: 14,
                              padding: '10px 8px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(18, 43, 77, 0.04)',
                            }}
                          >
                            <div
                              style={{
                                height: 42,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 4,
                              }}
                            >
                              {renderOrganizerMiniSvg(tIdx)}
                            </div>
                            <Text
                              className="lak-display-font"
                              strong
                              style={{ color: '#122B4D', display: 'block', fontSize: 12.5 }}
                            >
                              {tool.name.split(' (')[0]}
                            </Text>
                          </div>
                        </Tooltip>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </div>

      {/* Section: Full Book Suite Showcase (Bottom-Left of ChatGPT Mockup) */}
      <div
        id="section-books"
        style={{
          padding: '64px 24px',
          background: 'linear-gradient(135deg, #0B1D36 0%, #153661 100%)',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 1260, margin: '0 auto' }}>
          <Row gutter={[40, 32]} align="middle">
            <Col xs={24} lg={10}>
              <div
                style={{
                  background: '#ffffff',
                  padding: 10,
                  borderRadius: 20,
                  boxShadow: '0 22px 46px rgba(0, 0, 0, 0.45)',
                  borderBottom: '4px solid #FFCC66',
                }}
              >
                <img
                  src={LANDING_ASSETS.wondersBooksHero}
                  alt="McGraw-Hill Wonders Full Curriculum"
                  style={{ width: '100%', borderRadius: 14, display: 'block' }}
                />
              </div>
            </Col>

            <Col xs={24} lg={14}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #FFD666 0%, #FAAD14 100%)',
                  color: '#122B4D',
                  padding: '4px 14px',
                  borderRadius: 16,
                  fontSize: 11.5,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                <span>{bookShowcaseSection.badge}</span>
              </div>

              <Title
                level={2}
                className="lak-display-font"
                style={{ color: '#fff', marginTop: 0, marginBottom: 10, fontWeight: 800, fontSize: 30, lineHeight: 1.24 }}
              >
                {bookShowcaseSection.title}
              </Title>

              <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14.5, marginBottom: 22, lineHeight: 1.6 }}>
                {bookShowcaseSection.subtitle}
              </Paragraph>

              <Row gutter={[14, 14]}>
                {bookShowcaseSection.books.map((bk, idx) => (
                  <Col xs={24} sm={12} key={idx}>
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.07)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(126, 200, 248, 0.28)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: 'rgba(126, 200, 248, 0.14)',
                          border: '1px solid rgba(126, 200, 248, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {renderBookSuiteSvg(idx)}
                      </div>
                      <div>
                        <Text
                          className="lak-display-font"
                          strong
                          style={{ color: '#ffffff', fontSize: 14.5, display: 'block', marginBottom: 3 }}
                        >
                          {bk.name}
                        </Text>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12.5, margin: 0, lineHeight: 1.48 }}>
                          {bk.desc}
                        </Paragraph>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </div>
      </div>

      {/* High-Converting Assessment & Roadmap CTA Banner (Bottom-Right of ChatGPT Mockup) */}
      {assessmentCtaSection && (
        <div
          style={{
            padding: '44px 24px 52px',
            background: '#eaf4ff',
          }}
        >
          <div
            style={{
              maxWidth: 1260,
              margin: '0 auto',
              borderRadius: 26,
              padding: '28px 36px',
              background:
                'radial-gradient(circle at 85% 22%, rgba(255, 204, 102, 0.28) 0%, transparent 45%), linear-gradient(135deg, #133B73 0%, #1D56A3 52%, #2970CC 100%)',
              boxShadow: '0 22px 48px rgba(18, 43, 77, 0.18)',
              border: '2px solid rgba(126, 200, 248, 0.55)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative Paper Plane & Stars SVG in Top-Right Background */}
            <svg
              width="140"
              height="90"
              viewBox="0 0 140 90"
              fill="none"
              style={{ position: 'absolute', top: 10, right: 36, opacity: 0.9, pointerEvents: 'none' }}
            >
              <circle cx="24" cy="24" r="3" fill="#FFCC66" />
              <circle cx="62" cy="14" r="2.5" fill="#FFFFFF" />
              <path d="M95 18L128 8L114 38L106 26L95 18Z" fill="#FFCC66" />
              <path d="M106 26L114 38L102 33L106 26Z" fill="#D48806" />
              <path d="M40 52C58 48 78 38 96 24" stroke="#7EC8F8" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            <Row gutter={[28, 20]} align="middle">
              {/* Left 3D Clipboard & Golden Pen Artwork (from ChatGPT Plus) */}
              <Col xs={24} md={5} style={{ textAlign: 'center' }}>
                <div
                  className="lak-float-img"
                  style={{
                    width: 130,
                    height: 120,
                    margin: '0 auto',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 14px 30px rgba(5, 18, 38, 0.35)',
                    border: '1.5px solid rgba(126, 200, 248, 0.45)',
                    background: '#184785',
                  }}
                >
                  <img
                    src={LANDING_ASSETS.ctaClipboard}
                    alt="ELA Placement Assessment"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </Col>

              {/* Center Persuasive Assessment Copy */}
              <Col xs={24} md={13}>
                <Title
                  level={2}
                  className="lak-display-font"
                  style={{
                    color: '#ffffff',
                    margin: '0 0 8px 0',
                    fontSize: 28,
                    fontWeight: 800,
                    lineHeight: 1.22,
                  }}
                >
                  {assessmentCtaSection.title}
                </Title>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
                  {assessmentCtaSection.subtitle}
                </Paragraph>
              </Col>

              {/* Right Warm Golden Pill CTA Button */}
              <Col xs={24} md={6} style={{ textAlign: 'center' }}>
                <Button
                  size="large"
                  className="lak-gold-cta-btn"
                  onClick={() => setAssessmentModalOpen(true)}
                  style={{
                    height: 52,
                    padding: '0 26px',
                    fontSize: 15.5,
                    borderRadius: 26,
                    width: '100%',
                    maxWidth: 270,
                  }}
                >
                  {assessmentCtaSection.buttonText} <ArrowRightOutlined style={{ marginLeft: 6 }} />
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      )}

      {/* 1-on-1 ELA Placement Assessment Registration Modal */}
      {assessmentCtaSection && (
        <Modal
          open={assessmentModalOpen}
          onCancel={() => setAssessmentModalOpen(false)}
          footer={null}
          centered
          width={480}
          title={
            <Space>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              <span className="lak-display-font" style={{ fontWeight: 800, color: '#122B4D' }}>
                {assessmentCtaSection.modalTitle}
              </span>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ marginBottom: 20, fontSize: 13.5 }}>
            {assessmentCtaSection.modalDesc}
          </Paragraph>
          <Form form={form} layout="vertical" onFinish={handleAssessmentSubmit}>
            <Form.Item
              name="parentName"
              label={assessmentCtaSection.parentNameLabel}
              rules={[{ required: true }]}
            >
              <Input size="large" placeholder="Nguyen Van A" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={assessmentCtaSection.phoneLabel}
              rules={[{ required: true }]}
            >
              <Input size="large" placeholder="0909 xxx xxx" />
            </Form.Item>
            <Form.Item
              name="grade"
              label={assessmentCtaSection.studentAgeLabel}
              initialValue="gk"
            >
              <Select
                size="large"
                options={[
                  { value: 'gk', label: 'Kindergarten (Wonders GK • 5–6 tuổi)' },
                  { value: 'g1_g2', label: 'Primary Grades 1–2 (6–8 tuổi)' },
                  { value: 'g3_g5', label: 'Primary Grades 3–5 (8–11 tuổi)' },
                ]}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              className="lak-gold-cta-btn"
              icon={<CheckCircleFilled />}
              style={{ height: 46, borderRadius: 23, marginTop: 8 }}
            >
              {assessmentCtaSection.submitBtn}
            </Button>
          </Form>
        </Modal>
      )}

      {/* Footer */}
      <div
        style={{
          background: '#081528',
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
          padding: '24px 16px',
          fontSize: 13.5,
        }}
      >
        <Space>
          <BookOutlined style={{ color: '#7EC8F8' }} />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            LAK EDUCATION (lakeducation.com) ©2026
          </Text>
        </Space>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {typeof __APP_VERSION__ !== 'undefined' && typeof __BUILD_TIME__ !== 'undefined'
            ? `Version ${__APP_VERSION__} • build ${__BUILD_TIME__}`
            : 'Version 1.2.1 • build 2026110801v'}
        </div>
      </div>
    </div>
  );
};
