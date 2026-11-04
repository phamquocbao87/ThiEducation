import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';

export const ContractStatsRow = ({
  contractsCount,
  teacherPayrollTotal,
  staffPayrollTotal,
  showStaffPayroll,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Hợp Đồng Đang Hiệu Lực"
            value={contractsCount}
            suffix="HĐ"
            styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Quỹ Lương Giáo Viên (T8/2026)"
            value={teacherPayrollTotal}
            formatter={(val) => formatCurrency(val)}
            styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title={showStaffPayroll ? 'Quỹ Lương Nhân Viên Giáo Vụ' : 'Trạng Thái Đối Soát'}
            value={showStaffPayroll ? staffPayrollTotal : '100% Minh bạch'}
            formatter={(val) => (typeof val === 'number' ? formatCurrency(val) : val)}
            styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
    </Row>
  );
};

