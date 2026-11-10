import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Typography, Empty } from 'antd';
import { CheckOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { PAYROLL_STATUS } from '../models/contracts.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const TeacherPayrollTable = ({
  payrolls,
  canApprove,
  canDisburse,
  onApprove,
  onDisburse,
  onShowPaySlip,
}) => {
  const { isEnglish, language, t } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: t('contracts.table.colContractCode'),
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: t('contracts.table.colTeacherName'),
        dataIndex: 'teacherName',
        key: 'teacherName',
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: t('contracts.table.colPayrollMonth'),
        dataIndex: 'month',
        key: 'month',
      },
      {
        title: t('contracts.table.colTotalSessions'),
        dataIndex: 'totalSessions',
        key: 'totalSessions',
        render: (v) => <Tag color="geekblue">{v} {t('contracts.table.unitSessions')}</Tag>,
      },
      {
        title: t('contracts.table.colRatePerSession'),
        dataIndex: 'ratePerSession',
        key: 'ratePerSession',
        render: (v) => formatCurrency(v),
      },
      {
        title: t('contracts.table.colBonus'),
        dataIndex: 'bonus',
        key: 'bonus',
        render: (v) => <Text type="success">+{formatCurrency(v)}</Text>,
      },
      {
        title: t('contracts.table.colNetSalary'),
        dataIndex: 'totalSalary',
        key: 'totalSalary',
        render: (v) => (
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#722ed1' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
      {
        title: t('contracts.table.colStatus'),
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          let text = status;
          let color = 'default';
          if (status === PAYROLL_STATUS.PENDING) {
            text = t('contracts.table.statusPending');
            color = 'gold';
          } else if (status === PAYROLL_STATUS.APPROVED) {
            text = t('contracts.table.statusApproved');
            color = 'blue';
          } else if (status === PAYROLL_STATUS.PAID) {
            text = t('contracts.table.statusDisbursed');
            color = 'green';
          }
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: t('contracts.table.colActions'),
        key: 'action',
        render: (_, record) => (
          <Space wrap>
            {canApprove && record.status === PAYROLL_STATUS.PENDING && (
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => onApprove(record.id)}
              >
                {t('contracts.table.btnApprove')}
              </Button>
            )}
            {canDisburse && record.status === PAYROLL_STATUS.APPROVED && (
              <Button
                size="small"
                type="primary"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                icon={<DollarOutlined />}
                onClick={() => onDisburse(record.id)}
              >
                {t('contracts.table.btnDisburse')}
              </Button>
            )}
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => onShowPaySlip(record)}
            >
              {t('contracts.table.btnPaySlip')}
            </Button>
          </Space>
        ),
      },
    ],
    [isEnglish, language, t, canApprove, canDisburse, onApprove, onDisburse, onShowPaySlip]
  );

  return (
    <Table
      columns={columns}
      dataSource={payrolls}
      rowKey="id"
      scroll={{ x: 850 }}
      pagination={{ pageSize: 5 }}
      locale={{
        emptyText: (
          <Empty
            description={t('contracts.table.emptyPayrolls')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
    />
  );
};

export default TeacherPayrollTable;
