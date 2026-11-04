import React from 'react';
import { Table, Tag, Space, Button, Badge, Typography } from 'antd';
import { PhoneOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { TUITION_STATUS, TUITION_STATUS_LABELS } from '../models/tuition.model';

const { Text } = Typography;

export const TuitionTable = ({
  students,
  canConfirmPayment,
  canSendReminder,
  onSelectForPayment,
  onSendReminder,
}) => {
  const columns = [
    { title: 'Mã HV', dataIndex: 'id', key: 'id', render: (id) => <Text strong>{id}</Text> },
    {
      title: 'Họ và Tên Học Viên',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong style={{ color: '#1890ff' }}>{name}</Text>,
    },
    { title: 'Lớp Đang Tham Gia', dataIndex: 'className', key: 'className' },
    {
      title: 'Học Phí Tháng',
      dataIndex: 'amountDue',
      key: 'amountDue',
      render: (val) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Phụ Huynh & SĐT',
      key: 'parent',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 13, display: 'block' }}>{record.parentName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Trạng Thái Đóng Phí',
      dataIndex: 'tuitionStatus',
      key: 'tuitionStatus',
      render: (status) => {
        const meta = TUITION_STATUS_LABELS[status] || { text: status, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          {record.tuitionStatus !== TUITION_STATUS.PAID ? (
            <>
              {canConfirmPayment && (
                <Button
                  type="primary"
                  size="small"
                  icon={<CreditCardOutlined />}
                  onClick={() => onSelectForPayment(record)}
                >
                  Xác Nhận Đã Thu
                </Button>
              )}
              {canSendReminder && (
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  onClick={() => onSendReminder(record)}
                >
                  Nhắc Học Phí
                </Button>
              )}
            </>
          ) : (
            <Badge status="success" text="Đã hoàn tất" />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={students}
      rowKey="id"
      scroll={{ x: 820 }}
      pagination={{ pageSize: 5 }}
    />
  );
};

