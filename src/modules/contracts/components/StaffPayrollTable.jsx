import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Typography, Progress, Empty } from 'antd';
import { CheckOutlined, DollarOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { PAYROLL_STATUS } from '../models/contracts.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const StaffPayrollTable = ({
  staffList,
  canApprove,
  canDisburse,
  onApproveStaff,
  onDisburseStaff,
}) => {
  const { isEnglish, language, t } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: t('contracts.table.colStaffCode'),
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: t('contracts.table.colStaffName'),
        dataIndex: 'name',
        key: 'name',
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: t('contracts.table.colStaffPosition'),
        dataIndex: 'position',
        key: 'position',
      },
      {
        title: t('contracts.table.colWorkload'),
        key: 'workload',
        render: (_, r) =>
          `${r.managedClasses} ${t('contracts.table.unitClasses')} (${r.managedStudents} ${t('contracts.table.unitStudents')})`,
      },
      {
        title: t('contracts.table.colKpiRate'),
        dataIndex: 'completedTasks',
        key: 'completedTasks',
        render: (v) => <Progress percent={v} size="small" />,
      },
      {
        title: t('contracts.table.colBaseSalary'),
        dataIndex: 'baseSalary',
        key: 'baseSalary',
        render: (v) => formatCurrency(v),
      },
      {
        title: t('contracts.table.colKpiBonus'),
        dataIndex: 'kpiBonus',
        key: 'kpiBonus',
        render: (v) => <Text type="success">+{formatCurrency(v)}</Text>,
      },
      {
        title: t('contracts.table.colTotalSalary'),
        dataIndex: 'totalSalary',
        key: 'totalSalary',
        render: (v) => (
          <Text strong style={{ color: '#722ed1' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
      {
        title: t('contracts.table.colPaymentStatus'),
        dataIndex: 'payrollStatus',
        key: 'payrollStatus',
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
          <Space>
            {canApprove && record.payrollStatus === PAYROLL_STATUS.PENDING && (
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => onApproveStaff(record.id)}
              >
                {t('contracts.table.btnStaffApprove')}
              </Button>
            )}
            {canDisburse && record.payrollStatus === PAYROLL_STATUS.APPROVED && (
              <Button
                size="small"
                type="primary"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                icon={<DollarOutlined />}
                onClick={() => onDisburseStaff(record.id)}
              >
                {t('contracts.table.btnStaffDisburse')}
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [isEnglish, language, t, canApprove, canDisburse, onApproveStaff, onDisburseStaff]
  );

  return (
    <Table
      columns={columns}
      dataSource={staffList}
      rowKey="id"
      scroll={{ x: 900 }}
      pagination={{ pageSize: 5 }}
      locale={{
        emptyText: (
          <Empty
            description={t('contracts.table.emptyStaff')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
    />
  );
};

export default StaffPayrollTable;
