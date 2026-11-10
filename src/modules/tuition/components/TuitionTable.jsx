import React, { useMemo } from 'react';
import { Table, Tag, Space, Button, Badge, Typography, Empty } from 'antd';
import { PhoneOutlined, CreditCardOutlined, BellOutlined, FileTextOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { TUITION_STATUS, getTuitionStatusMeta } from '../models/tuition.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const TuitionTable = ({
  students,
  loading = false,
  canConfirmPayment,
  canSendReminder,
  onSelectForPayment,
  onSendReminder,
}) => {
  const { isEnglish, t } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Student / Invoice' : 'Mã HV & Hóa Đơn',
        key: 'id',
        width: 140,
        render: (_, record) => (
          <div>
            <Text strong style={{ color: '#0f172a' }}>
              {record.studentCode || record.studentId || record.id}
            </Text>
            {record.id && record.id.startsWith('HP-') && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                <FileTextOutlined style={{ marginRight: 3 }} />
                {record.id}
              </Text>
            )}
          </div>
        ),
      },
      {
        title: isEnglish ? 'Student Full Name' : 'Họ và Tên Học Viên',
        dataIndex: 'name',
        key: 'name',
        render: (name, record) => (
          <div>
            <Text strong style={{ color: '#1890ff' }}>
              {name}
            </Text>
            {record.englishName && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                ({record.englishName})
              </Text>
            )}
          </div>
        ),
      },
      {
        title: isEnglish ? 'Enrolled Classroom' : 'Lớp Đang Tham Gia',
        dataIndex: 'className',
        key: 'className',
        render: (className) => (
          <Text style={{ fontSize: 13, color: '#334155' }}>
            {className || (isEnglish ? 'Not assigned' : 'Chưa phân lớp')}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Tuition Fee Due' : 'Học Phí Tháng',
        dataIndex: 'amountDue',
        key: 'amountDue',
        render: (val, record) => (
          <div>
            <Text strong style={{ color: '#722ed1', fontSize: 14 }}>
              {formatCurrency(val)}
            </Text>
            {record.month && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {isEnglish ? `Period: ${record.month}` : `Kỳ: ${record.month}`}
              </Text>
            )}
          </div>
        ),
      },
      {
        title: isEnglish ? 'Parent & Phone' : 'Phụ Huynh & SĐT',
        key: 'parent',
        render: (_, record) => (
          <div>
            <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>
              {record.parentName || (isEnglish ? 'Parent' : 'Phụ huynh')}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone || '—'}
            </Text>
          </div>
        ),
      },
      {
        title: isEnglish ? 'Tuition Status' : 'Trạng Thái Đóng Phí',
        dataIndex: 'tuitionStatus',
        key: 'tuitionStatus',
        render: (status, record) => {
          const meta = getTuitionStatusMeta(status, isEnglish);
          return (
            <div>
              <Tag color={meta.color} style={{ fontWeight: 600 }}>
                {meta.text}
              </Tag>
              {record.receiptCode && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                  {record.receiptCode}
                </Text>
              )}
            </div>
          );
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
    [isEnglish, t, canConfirmPayment, canSendReminder, onSelectForPayment, onSendReminder]
  );

  return (
    <Table
      columns={columns}
      dataSource={students}
      loading={loading}
      rowKey={(r) => r.id || r.studentCode || r.studentId}
      scroll={{ x: 880 }}
      pagination={{ pageSize: 10 }}
      locale={{
        emptyText: (
          <Empty
            description={
              isEnglish
                ? 'No tuition billing records in Cloud Firestore'
                : 'Chưa có dữ liệu học phí trên Cloud Firestore'
            }
          />
        ),
      }}
    />
  );
};
