import React, { useMemo } from 'react';
import { Table, Tag, Space, Button, Badge, Typography } from 'antd';
import { PhoneOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { TUITION_STATUS, getTuitionStatusMeta } from '../models/tuition.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const TuitionTable = ({
  students,
  canConfirmPayment,
  canSendReminder,
  onSelectForPayment,
  onSendReminder,
}) => {
  const { isEnglish, t } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Student ID' : 'Mã HV',
        dataIndex: 'id',
        key: 'id',
        render: (id) => <Text strong>{id}</Text>,
      },
      {
        title: isEnglish ? 'Student Full Name' : 'Họ và Tên Học Viên',
        dataIndex: 'name',
        key: 'name',
        render: (name) => <Text strong style={{ color: '#1890ff' }}>{name}</Text>,
      },
      {
        title: isEnglish ? 'Enrolled Classroom' : 'Lớp Đang Tham Gia',
        dataIndex: 'className',
        key: 'className',
      },
      {
        title: isEnglish ? 'Monthly Tuition' : 'Học Phí Tháng',
        dataIndex: 'amountDue',
        key: 'amountDue',
        render: (val) => <Text strong>{formatCurrency(val)}</Text>,
      },
      {
        title: isEnglish ? 'Parent & Phone' : 'Phụ Huynh & SĐT',
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
        title: isEnglish ? 'Tuition Status' : 'Trạng Thái Đóng Phí',
        dataIndex: 'tuitionStatus',
        key: 'tuitionStatus',
        render: (status) => {
          const meta = getTuitionStatusMeta(status, isEnglish);
          return <Tag color={meta.color}>{meta.text}</Tag>;
        },
      },
      {
        title: isEnglish ? 'Actions' : 'Thao Tác',
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
                    {isEnglish ? 'Confirm Payment' : 'Xác Nhận Đã Thu'}
                  </Button>
                )}
                {canSendReminder && (
                  <Button
                    size="small"
                    icon={<BellOutlined />}
                    onClick={() => onSendReminder(record)}
                  >
                    {isEnglish ? 'Send Reminder' : 'Nhắc Học Phí'}
                  </Button>
                )}
              </>
            ) : (
              <Badge status="success" text={isEnglish ? 'Paid in Full' : 'Đã hoàn tất'} />
            )}
          </Space>
        ),
      },
    ],
    [isEnglish, t, canConfirmPayment, canSendReminder]
  );

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
