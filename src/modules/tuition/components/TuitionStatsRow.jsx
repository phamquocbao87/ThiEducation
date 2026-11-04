import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';

export const TuitionStatsRow = ({ summary }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Tổng Học Phí Đã Thu"
            value={summary.collected}
            formatter={(val) => formatCurrency(val)}
            styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Học Phí Còn Nợ"
            value={summary.pending}
            formatter={(val) => formatCurrency(val)}
            styles={{ content: { color: '#fa8c16', fontWeight: 'bold' } }}
            prefix={<DollarOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Tỷ Lệ Hoàn Thành"
            value={summary.completionRate}
            suffix="%"
            styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
    </Row>
  );
};

