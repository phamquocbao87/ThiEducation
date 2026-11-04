import React from 'react';
import { Table, Tag, Button, Space, Typography, Progress } from 'antd';
import { CheckOutlined, DollarOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { PAYROLL_STATUS, PAYROLL_STATUS_LABELS } from '../models/contracts.model';

const { Text } = Typography;

export const StaffPayrollTable = ({
  staffList,
  canApprove,
  canDisburse,
  onApproveStaff,
  onDisburseStaff,
}) => {
  const columns = [
    { title: 'Mã NV', dataIndex: 'id', key: 'id' },
    { title: 'Nhân Viên Giáo Vụ', dataIndex: 'name', key: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: 'Chức Vụ', dataIndex: 'position', key: 'position' },
    {
      title: 'Lớp & HV Quản Lý',
      key: 'workload',
      render: (_, r) => `${r.managedClasses} lớp (${r.managedStudents} HV)`,
    },
    {
      title: 'KPI Hoàn Thành',
      dataIndex: 'completedTasks',
      key: 'completedTasks',
      render: (v) => <Progress percent={v} size="small" />,
    },
    { title: 'Lương Cứng', dataIndex: 'baseSalary', key: 'baseSalary', render: (v) => formatCurrency(v) },
    { title: 'Thưởng KPI', dataIndex: 'kpiBonus', key: 'kpiBonus', render: (v) => <Text type="success">+{formatCurrency(v)}</Text> },
    {
      title: 'Tổng Thực Lĩnh',
      dataIndex: 'totalSalary',
      key: 'totalSalary',
      render: (v) => <Text strong style={{ color: '#722ed1' }}>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Trạng Thái Chi Lương',
      dataIndex: 'payrollStatus',
      key: 'payrollStatus',
      render: (status) => {
        const meta = PAYROLL_STATUS_LABELS[status] || { text: status, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {canApprove && record.payrollStatus === PAYROLL_STATUS.PENDING && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => onApproveStaff(record.id)}>
              Duyệt
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
              Chi Lương
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={staffList}
      rowKey="id"
      scroll={{ x: 920 }}
      pagination={{ pageSize: 5 }}
    />
  );
};

