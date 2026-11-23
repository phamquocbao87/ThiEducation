import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import {
  QuestionCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

/**
 * QaSummaryKpiRow — Hàng 4 chỉ số tổng quan cho màn hình Quản Lý Hỏi & Đáp (/lesson-qa)
 */
export const QaSummaryKpiRow = ({ summary = {}, userRole = 'student' }) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  const isStaff = ['teacher', 'academic', 'director', 'admin'].includes(userRole);

  const cards = [
    {
      key: 'total',
      title: isEnglish ? 'Total Questions' : 'Tổng Câu Hỏi',
      value: summary.total || 0,
      suffix: isEnglish ? 'Q&A' : 'câu',
      color: '#1890ff',
      icon: <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: isMobile ? 14 : 18 }} />,
    },
    {
      key: 'open',
      title: isEnglish ? 'New / Pending' : 'Mới • Chờ Giải Đáp',
      value: summary.openCount || 0,
      suffix: isEnglish ? 'new' : 'mới',
      color: '#fa8c16',
      icon: <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: isMobile ? 14 : 18 }} />,
    },
    {
      key: 'answered',
      title: isEnglish ? 'Answered / Resolved' : 'Đã Giải Quyết',
      value: summary.answeredCount || 0,
      suffix: isEnglish ? 'done' : 'đã xong',
      color: '#16a34a',
      icon: <CheckCircleOutlined style={{ color: '#16a34a', fontSize: isMobile ? 14 : 18 }} />,
    },
    isStaff
      ? {
          key: 'rate',
          title: isEnglish ? 'Response Rate' : 'Tỷ Lệ Giải Đáp',
          value: summary.responseRate ?? 100,
          suffix: '%',
          color: '#7e22ce',
          icon: <GlobalOutlined style={{ color: '#7e22ce', fontSize: isMobile ? 14 : 18 }} />,
        }
      : {
          key: 'shared',
          title: isEnglish ? 'Shared With Class' : 'Chia Sẻ Cả Lớp',
          value: summary.sharedCount || 0,
          suffix: isEnglish ? 'shared' : 'câu chung',
          color: '#7e22ce',
          icon: <GlobalOutlined style={{ color: '#7e22ce', fontSize: isMobile ? 14 : 18 }} />,
        },
  ];

  return (
    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 18 }}>
      {cards.map((c) => (
        <Col xs={12} sm={12} lg={6} key={c.key}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              borderTop: `3px solid ${c.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '14px 18px' } }}
            data-testid={`qa-kpi-${c.key}`}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>
                  {c.title}
                </Text>
              }
              value={c.value}
              prefix={c.icon}
              suffix={<span style={{ fontSize: isMobile ? 11 : 12 }}>{c.suffix}</span>}
              styles={{ content: { color: c.color, fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default QaSummaryKpiRow;
