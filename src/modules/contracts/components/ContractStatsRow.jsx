import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';

export const ContractStatsRow = ({
  contractsCount,
  teacherPayrollTotal,
  staffPayrollTotal,
  showStaffPayroll,
}) => {
  const { t } = useLanguage();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title={t('contracts.stats.activeContracts')}
            value={contractsCount}
            suffix={t('contracts.table.unitContracts')}
            styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title={t('contracts.stats.monthlyTeacherPayroll')}
            value={teacherPayrollTotal}
            formatter={(val) => formatCurrency(val)}
            styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card styles={{ body: { padding: 16 } }}>
          <Statistic
            title={showStaffPayroll ? t('contracts.stats.monthlyStaffPayroll') : t('contracts.stats.disbursedRate')}
            value={showStaffPayroll ? staffPayrollTotal : t('contracts.stats.transparentStatus')}
            formatter={(val) => (typeof val === 'number' ? formatCurrency(val) : val)}
            styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ContractStatsRow;
