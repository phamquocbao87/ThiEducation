import React from 'react';
import { Row, Col, Card, Statistic, Progress, Typography } from 'antd';
import {
  ReadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PREP_STATUS } from '../../lesson-reader';

const { Text } = Typography;

/**
 * PrepSummaryKpiRow — Hàng 4 Thẻ KPI Tổng Quan Chuẩn Bị Bài (Scale-Proof xs=12 xl=6)
 * - Bấm trực tiếp vào từng thẻ trạng thái để lọc nhanh danh sách học viên bên dưới.
 */
export const PrepSummaryKpiRow = ({
  summary = {},
  statusFilter = 'ALL',
  onSelectStatus,
  isEnglish = false,
  isMobile = false,
}) => {
  const rate = Number(summary.overallReadinessRate) || 0;
  const rateColor = rate >= 70 ? '#16a34a' : rate >= 35 ? '#d97706' : '#7e22ce';

  const cards = [
    {
      key: 'ALL',
      testId: 'prep-kpi-overall-rate',
      title: isEnglish ? 'Overall Readiness' : 'Tỷ Lệ Đạt Chuẩn',
      value: rate,
      suffix: '%',
      icon: <ReadOutlined style={{ color: rateColor, fontSize: isMobile ? 14 : 18 }} />,
      color: rateColor,
      borderTop: rateColor,
      bg: statusFilter === 'ALL' ? '#faf5ff' : '#ffffff',
      footer: (
        <div style={{ marginTop: 4 }}>
          <Progress percent={rate} size="small" strokeColor={rateColor} showInfo={false} style={{ marginBottom: 2 }} />
          <Text style={{ fontSize: isMobile ? 10 : 12, color: '#64748b' }}>
            {isEnglish ? 'Avg Conduct:' : 'Rèn luyện TB:'} <Text strong>{summary.avgConductScore || 0}/100</Text>
          </Text>
        </div>
      ),
    },
    {
      key: PREP_STATUS.PREPARED,
      testId: 'prep-kpi-prepared',
      title: isEnglish ? 'Prepared Before Class' : 'Đã Chuẩn Bị Tốt',
      value: summary.totalPrepared || 0,
      suffix: `/ ${summary.totalStudentsMonitored || 0}`,
      icon: <CheckCircleOutlined style={{ color: '#16a34a', fontSize: isMobile ? 14 : 18 }} />,
      color: '#16a34a',
      borderTop: '#16a34a',
      bg: statusFilter === PREP_STATUS.PREPARED ? '#f0fdf4' : '#ffffff',
      footer: (
        <Text style={{ fontSize: isMobile ? 10 : 12, color: '#15803d', display: 'block', marginTop: 4 }}>
          🟢 {isEnglish ? 'Met reading & scroll goal' : 'Đạt thời gian & ≥ 80% cuộn'}
        </Text>
      ),
    },
    {
      key: PREP_STATUS.SKIMMED,
      testId: 'prep-kpi-skimmed',
      title: isEnglish ? 'Reading In Progress' : 'Đang Đọc Dở / Lướt',
      value: summary.totalSkimmed || 0,
      suffix: isEnglish ? 'std' : 'HV',
      icon: <ClockCircleOutlined style={{ color: '#d97706', fontSize: isMobile ? 14 : 18 }} />,
      color: '#d97706',
      borderTop: '#f59e0b',
      bg: statusFilter === PREP_STATUS.SKIMMED ? '#fffbeb' : '#ffffff',
      footer: (
        <Text style={{ fontSize: isMobile ? 10 : 12, color: '#b45309', display: 'block', marginTop: 4 }}>
          🟡 {isEnglish ? 'Opened, not completed yet' : 'Đã mở bài, chưa đủ ngưỡng'}
        </Text>
      ),
    },
    {
      key: PREP_STATUS.NOT_STARTED,
      testId: 'prep-kpi-not-started',
      title: isEnglish ? 'Not Read Yet' : 'Chưa Đọc Bài',
      value: summary.totalNotStarted || 0,
      suffix: isEnglish ? 'std' : 'HV',
      icon: <WarningOutlined style={{ color: '#dc2626', fontSize: isMobile ? 14 : 18 }} />,
      color: '#dc2626',
      borderTop: '#dc2626',
      bg: statusFilter === PREP_STATUS.NOT_STARTED ? '#fef2f2' : '#ffffff',
      footer: (
        <Text style={{ fontSize: isMobile ? 10 : 12, color: '#b91c1c', display: 'block', marginTop: 4 }}>
          🔴 {isEnglish ? 'Priority for reminder' : 'Ưu tiên đôn đốc trước giờ'}
        </Text>
      ),
    },
  ];

  return (
    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 18 }}>
      {cards.map((c) => {
        const isActive = statusFilter === c.key;
        return (
          <Col xs={12} sm={12} md={12} lg={12} xl={6} key={c.key}>
            <Card
              hoverable
              bordered={false}
              onClick={() => onSelectStatus && onSelectStatus(c.key)}
              data-testid={c.testId}
              style={{
                borderRadius: 12,
                boxShadow: isActive
                  ? `0 0 0 2px ${c.borderTop}, 0 4px 12px rgba(0,0,0,0.06)`
                  : '0 2px 8px rgba(0,0,0,0.04)',
                borderTop: `3px solid ${c.borderTop}`,
                backgroundColor: c.bg,
                height: '100%',
                cursor: 'pointer',
              }}
              styles={{ body: { padding: isMobile ? '12px 10px' : '16px 18px' } }}
            >
              <Statistic
                title={
                  <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>
                    {c.title}
                  </Text>
                }
                value={c.value}
                prefix={c.icon}
                suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{c.suffix}</span>}
                styles={{
                  content: {
                    color: c.color,
                    fontWeight: 800,
                    fontSize: isMobile ? 18 : 'clamp(18px, 1.6vw, 24px)',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
              {c.footer}
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default PrepSummaryKpiRow;
