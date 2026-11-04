import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Space, Typography, Divider } from 'antd';
import {
  EditOutlined,
  ApartmentOutlined,
  BookOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';

const { Title, Text, Paragraph } = Typography;

export const LandingWritingAndBooks = ({
  content,
  language,
}) => {
  const { writingAndOrganizerSection, bookShowcaseSection } = content;
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Tự động chạy hiệu ứng chuyển bước tuần tự 1 -> 2 -> 3 -> 4 để người xem thấy rõ luồng quy trình
  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % writingAndOrganizerSection.writingSteps.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [isPaused, writingAndOrganizerSection.writingSteps.length]);

  return (
    <div>
      {/* Section: Academic Writing Process & Graphic Organizers */}
      <div id="section-writing" style={{ padding: '64px 24px', background: '#f0f7ff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 40px' }}>
            <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 12 }}>
              ✍️ {writingAndOrganizerSection.badge}
            </Tag>
            <Title level={2} style={{ color: '#122B4D', marginTop: 0, fontWeight: 800 }}>
              {writingAndOrganizerSection.title}
            </Title>
          </div>

          {/* Card 1: 4-Step Academic Writing Process with 3D Depth & Motion */}
          <Card
            style={{
              borderRadius: 22,
              marginBottom: 32,
              border: '1px solid #bae0ff',
              boxShadow: '0 16px 40px rgba(18, 43, 77, 0.08)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
            }}
            styles={{ body: { padding: '28px 28px 32px' } }}
          >
            {/* Header Row with Floating WebP Illustration & Live Pipeline Ribbon */}
            <Row gutter={[24, 20]} align="middle" style={{ marginBottom: 28 }}>
              <Col xs={24} lg={15}>
                <Space align="center" size={10} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(24,144,255,0.35)',
                    }}
                  >
                    <EditOutlined style={{ fontSize: 20 }} />
                  </div>
                  <Title level={3} style={{ margin: 0, color: '#122B4D', fontSize: 22, fontWeight: 800 }}>
                    {language === 'en'
                      ? '🌺 Structured 4-Step Academic Writing Process'
                      : '🌺 Quy Trình Viết Học Thuật Có Cấu Trúc (4 Bước Chuẩn Quốc Tế)'}
                  </Title>
                </Space>
                <Paragraph style={{ margin: '0 0 14px 0', color: '#4a5568', fontSize: 15 }}>
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
                            padding: '6px 14px',
                            borderRadius: 20,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease',
                            background: isActive ? st.accent : '#f0f5ff',
                            color: isActive ? '#ffffff' : '#122B4D',
                            boxShadow: isActive ? `0 4px 14px ${st.accent}66` : 'none',
                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {st.icon} {st.name}
                        </div>
                        {idx < writingAndOrganizerSection.writingSteps.length - 1 && (
                          <span className="lak-arrow-flow" style={{ color: '#1890ff', fontWeight: 800 }}>
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
                    background: '#ffffff',
                    border: '2px solid #d6e8ff',
                    borderRadius: 18,
                    padding: '12px 16px',
                    textAlign: 'center',
                    boxShadow: 'inset 0 2px 10px rgba(24,144,255,0.06), 0 8px 20px rgba(18,43,77,0.06)',
                  }}
                >
                  <img
                    src={writingAndOrganizerSection.writingImage}
                    alt="4-Step Academic Writing Process"
                    className="lak-float-img"
                    style={{ width: '100%', maxHeight: 135, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  />
                </div>
              </Col>
            </Row>

            {/* 4 Full-Width 3D Step Cards — KHÔNG BAO GIỜ RỚT DÒNG XẤU */}
            <Row gutter={[18, 24]} style={{ marginBottom: 36 }}>
              {writingAndOrganizerSection.writingSteps.map((st, idx) => {
                const isActive = idx === activeStepIdx;
                return (
                  <Col xs={24} sm={12} lg={6} key={st.step}>
                    <div
                      className="lak-writing-step-card"
                      onMouseEnter={() => {
                        setIsPaused(true);
                        setActiveStepIdx(idx);
                      }}
                      onMouseLeave={() => setIsPaused(false)}
                      onClick={() => setActiveStepIdx(idx)}
                      style={{
                        background: isActive ? st.lightBg : '#ffffff',
                        border: isActive ? `2px solid ${st.accent}` : '1px solid #d6e8ff',
                        boxShadow: isActive
                          ? `0 16px 32px -8px ${st.accent}40, 0 4px 12px rgba(18,43,77,0.08)`
                          : '0 6px 16px rgba(18,43,77,0.04)',
                        transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
                      }}
                    >
                      {/* Top Color Accent Bar */}
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 11.5,
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            background: isActive ? st.accent : '#e6f4ff',
                            color: isActive ? '#fff' : '#1890ff',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {st.step}
                        </span>

                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: '#ffffff',
                            border: `1px solid ${st.accent}55`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                          }}
                        >
                          {st.icon}
                        </div>
                      </div>

                      {/* English Step Title — Single Clean Line */}
                      <div
                        style={{
                          fontSize: 17.5,
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

                      {/* Subtitle */}
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: st.accent,
                          marginBottom: 10,
                        }}
                      >
                        {st.viTitle}
                      </div>

                      <Text style={{ fontSize: 13.5, color: '#4a5568', lineHeight: 1.6, display: 'block' }}>
                        {st.desc}
                      </Text>
                    </div>
                  </Col>
                );
              })}
            </Row>

            <Divider style={{ margin: '28px 0 24px' }}>
              <Tag color="blue" style={{ fontSize: 12.5, fontWeight: 700, padding: '4px 14px', borderRadius: 16, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {language === 'en'
                  ? '✨ 3 Core Academic Writing Genres Mastered by Students'
                  : '✨ 3 Thể Loại Viết Học Thuật Trọng Tâm Học Sinh Được Rèn Luyện'}
              </Tag>
            </Divider>

            <Row gutter={[20, 20]}>
              {writingAndOrganizerSection.writingGenres.map((g, idx) => (
                <Col xs={24} md={8} key={idx}>
                  <div
                    className="lak-genre-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d6e8ff',
                      borderRadius: 14,
                      padding: '18px 20px',
                      height: '100%',
                      boxShadow: '0 4px 14px rgba(18, 43, 77, 0.04)',
                    }}
                  >
                    <Tag color="purple" style={{ fontWeight: 700, marginBottom: 8, fontSize: 12.5 }}>
                      {g.name}
                    </Tag>
                    <Title level={5} style={{ margin: '0 0 6px 0', color: '#122B4D', fontSize: 16 }}>
                      {g.viName}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                      {g.desc}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Card 2: Graphic Organizers */}
          <Card
            style={{
              borderRadius: 20,
              border: '1px solid #bae0ff',
              background: 'linear-gradient(135deg, #ffffff 0%, #f4faff 100%)',
              boxShadow: '0 12px 32px rgba(18, 43, 77, 0.06)',
            }}
          >
            <Row gutter={[28, 28]} align="middle">
              <Col xs={24} lg={8} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d6e8ff',
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    boxShadow: '0 6px 18px rgba(18,43,77,0.05)',
                  }}
                >
                  <img
                    src={writingAndOrganizerSection.organizerImage}
                    alt="Graphic Organizers"
                    className="lak-float-img"
                    style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }}
                  />
                </div>
                <Title level={4} style={{ color: '#122B4D', margin: 0 }}>
                  Graphic Organizers
                </Title>
                <Text type="secondary">Venn Diagram • Sequence Chart • Concept Web</Text>
              </Col>
              <Col xs={24} lg={16}>
                <Title level={4} style={{ color: '#122B4D', marginTop: 0 }}>
                  <ApartmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                  {writingAndOrganizerSection.graphicOrganizers.title}
                </Title>
                <Paragraph style={{ fontSize: 15, color: '#4a5568' }}>
                  {writingAndOrganizerSection.graphicOrganizers.desc}
                </Paragraph>
                <Row gutter={[16, 16]}>
                  {writingAndOrganizerSection.graphicOrganizers.tools.map((tool, tIdx) => (
                    <Col xs={24} md={8} key={tIdx}>
                      <div
                        className="lak-genre-card"
                        style={{
                          background: '#fff',
                          border: '1px solid #d6e8ff',
                          borderRadius: 12,
                          padding: 14,
                          height: '100%',
                        }}
                      >
                        <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: 4 }}>
                          {tool.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#4a5568' }}>{tool.purpose}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Card>
        </div>
      </div>

      {/* Section: Full Book Suite Showcase (wonders-books-hero.webp) */}
      <div
        id="section-books"
        style={{
          padding: '72px 24px',
          background: 'linear-gradient(135deg, #0F2544 0%, #1C3E6E 100%)',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} lg={11}>
              <div
                style={{
                  background: '#fff',
                  padding: 12,
                  borderRadius: 20,
                  boxShadow: '0 20px 44px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={LANDING_ASSETS.wondersBooksHero}
                  alt="McGraw-Hill Wonders Full Curriculum"
                  style={{ width: '100%', borderRadius: 14, display: 'block' }}
                />
              </div>
            </Col>
            <Col xs={24} lg={13}>
              <Tag color="gold" style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 14 }}>
                📚 {bookShowcaseSection.badge}
              </Tag>
              <Title level={2} style={{ color: '#fff', marginTop: 0, marginBottom: 12, fontWeight: 800 }}>
                {bookShowcaseSection.title}
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15.5, marginBottom: 24 }}>
                {bookShowcaseSection.subtitle}
              </Paragraph>

              <Row gutter={[16, 16]}>
                {bookShowcaseSection.books.map((bk, idx) => (
                  <Col xs={24} sm={12} key={idx}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(126,200,248,0.28)',
                        borderRadius: 14,
                        padding: 16,
                        height: '100%',
                      }}
                    >
                      <Space style={{ marginBottom: 6 }}>
                        <CheckCircleFilled style={{ color: '#52c41a' }} />
                        <Text strong style={{ color: '#7EC8F8', fontSize: 15 }}>
                          {bk.name}
                        </Text>
                      </Space>
                      <Paragraph style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, margin: 0 }}>
                        {bk.desc}
                      </Paragraph>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </div>
      </div>

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
      </div>
    </div>
  );
};
