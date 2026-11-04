import React from 'react';
import { Table, Tag, Button, Space, Typography } from 'antd';
import { CheckOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { PAYROLL_STATUS, PAYROLL_STATUS_LABELS } from '../models/contracts.model';

const { Text } = Typography;

export const TeacherPayrollTable = ({
  payrolls,
  canApprove,
  canDisburse,
  onApprove,
  onDisburse,
  onShowPaySlip,
}) => {
  const columns = [
    { title: 'Mã Phiếu', dataIndex: 'id', key: 'id' },
    { title: 'Giáo Viên', dataIndex: 'teacherName', key: 'teacherName', render: (v) => <Text strong>{v}</Text> },
    { title: 'Tháng', dataIndex: 'month', key: 'month' },
    {
      title: 'Số Tiết Dạy',
      dataIndex: 'totalSessions',
      key: 'totalSessions',
      render: (v) => <Tag color="geekblue">{v} tiết</Tag>,
    },
    { title: 'Đơn Giá Tiết', dataIndex: 'ratePerSession', key: 'ratePerSession', render: (v) => formatCurrency(v) },
    { title: 'Thưởng', dataIndex: 'bonus', key: 'bonus', render: (v) => <Text type="success">+{formatCurrency(v)}</Text> },
    {
      title: 'Tổng Thực Lĩnh',
      dataIndex: 'totalSalary',
      key: 'totalSalary',
      render: (v) => <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#722ed1' }}>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const meta = PAYROLL_STATUS_LABELS[status] || { text: status, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          {canApprove && record.status === PAYROLL_STATUS.PENDING && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => onApprove(record.id)}>
              Duyệt Lương
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
              Kế Toán Chi Trả
            </Button>
          )}
          <Button size="small" icon={<PrinterOutlined />} onClick={() => onShowPaySlip(record)}>
            Phiếu Lương
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={payrolls}
      rowKey="id"
      scroll={{ x: 920 }}
      pagination={{ pageSize: 5 }}
    />
  );
};

