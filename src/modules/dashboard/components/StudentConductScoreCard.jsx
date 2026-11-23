import React from 'react';
import { Card, Progress, Tag, Space, Typography } from 'antd';
import { TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { formatHumanDuration } from '../../lesson-reader';

const { Title, Text } = Typography;

/**
 * StudentConductScoreCard — Thẻ Điểm Rèn Luyện Cá Nhân Của Học Viên trên /dashboard
 * - Chỉ hiển thị điểm của chính học viên đang đăng nhập (Student Privacy Invariant).
 * - Phân rã minh bạch 4 tiêu chí theo SPEC-10 (35% Chuẩn bị bài, 15% Ghi chú/Hỏi GV, 25% Chuyên cần, 25% Bài tập).
 */
export const StudentConductScoreCard = ({ conductSummary = null }) => {
  const { isEnglish } = useLanguage();

  if (!conductSummary) return null;

  const { overallScore = 0, rank = {}, breakdown = {}, totals = {} } = conductSummary;

  const pillars = [
    {
      key: 'prep',
      icon: '📖',
      label: isEnglish ? 'Pre-Class Lesson Reading' : 'Đọc chuẩn bị bài trước giờ',
      weight: breakdown.prep?.weight || 35,
      score: breakdown.prep?.score ?? 0,
      color: '#7e22ce',
    },
    {
      key: 'engage',
      icon: '💡',
      label: isEnglish ? 'Study Notes & Asking Teacher' : 'Ghi chú & Đặt câu hỏi GV',
      weight: breakdown.engage?.weight || 15,
      score: breakdown.engage?.score ?? 0,
      color: '#2563eb',
    },
    {
      key: 'attend',
      icon: '✅',
      label: isEnglish ? 'Attendance & Punctuality' : 'Chuyên cần & Đúng giờ',
      weight: breakdown.attend?.weight || 25,
      score: breakdown.attend?.score ?? 100,
      color: '#16a34a',
    },
    {
      key: 'homework',
      icon: '📝',
      label: isEnglish ? 'Homework Completion' : 'Hoàn thành bài tập về nhà',
      weight: breakdown.homework?.weight || 25,
      score: breakdown.homework?.score ?? 100,
      color: '#ea580c',
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        border: `1.5px solid ${rank.border || '#e2e8f0'}`,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        marginBottom: 20,
        backgroundColor: '#ffffff',
      }}
      styles={{ body: { padding: '16px 18px' } }}
      data-testid="student-conduct-score-card"
    >
      {/* Header Điểm Rèn Luyện */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
        <Space size={8}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: rank.bg || '#faf5ff',
              color: rank.color || '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <TrophyOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
              {isEnglish ? 'My Conduct & Diligence Score' : 'Điểm Rèn Luyện Của Con'}
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {isEnglish
                ? 'Calculated automatically from pre-class study & class habits'
                : 'Tính tự động từ chuẩn bị bài, chuyên cần & bài tập'}
            </Text>
          </div>
        </Space>

        <div style={{ textAlign: 'right' }}>
          <div
            data-testid="student-conduct-overall-score"
            style={{ fontSize: 22, fontWeight: 800, color: rank.color || '#7e22ce', lineHeight: 1.1 }}
          >
            {overallScore}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>/100</span>
          </div>
          <Tag
            color={rank.tagColor || 'purple'}
            style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, borderRadius: 4 }}
          >
            {rank.icon} {rank.label}
          </Tag>
        </div>
      </div>

      {/* 4 Thanh Phân Rã Tiêu Chí */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {pillars.map((p) => (
          <div key={p.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>
                {p.icon} {p.label} <Text type="secondary" style={{ fontSize: 11 }}>({p.weight}%)</Text>
              </span>
              <Text strong style={{ color: p.color, fontSize: 12 }}>
                {p.score}%
              </Text>
            </div>
            <Progress percent={p.score} size="small" strokeColor={p.color} showInfo={false} style={{ margin: 0 }} />
          </div>
        ))}
      </div>

      {/* Tổng thời gian tự đọc & số ghi chú/câu hỏi */}
      <div
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
          fontSize: 11,
          color: '#475569',
        }}
      >
        <span>
          <ClockCircleOutlined style={{ color: '#7e22ce', marginRight: 4 }} />
          {isEnglish ? 'Self-study reading:' : 'Thời gian tự đọc:'}{' '}
          <Text strong>{formatHumanDuration(totals.totalReadingSeconds || 0, isEnglish)}</Text>
        </span>
        <span>
          📝 {totals.totalNotes || 0} {isEnglish ? 'notes' : 'ghi chú'} • 🙋 {totals.totalQuestions || 0} Q&A
        </span>
      </div>
    </Card>
  );
};

export default StudentConductScoreCard;
