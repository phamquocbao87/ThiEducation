import React from 'react';
import { Table, Tag, Typography } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';

const { Text } = Typography;

export const TeacherContractTable = ({ contracts }) => {
  const columns = [
    { title: 'Mã HĐ', dataIndex: 'id', key: 'id', render: (text) => <Text strong>{text}</Text> },
    {
      title: 'Giáo Viên Bản Xứ',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: 'Loại Hợp Đồng',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type.includes('Full-time') ? 'blue' : type.includes('Part-time') ? 'cyan' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Đơn Giá / Tiết Dạy',
      dataIndex: 'ratePerSession',
      key: 'ratePerSession',
      render: (val) => <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Định Mức Tiết/Tháng',
      dataIndex: 'minSessionsPerMonth',
      key: 'minSessionsPerMonth',
      render: (val) => `${val} tiết`,
    },
    { title: 'Ngày Bắt Đầu', dataIndex: 'startDate', key: 'startDate' },
    { title: 'Ngày Kết Thúc', dataIndex: 'endDate', key: 'endDate' },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="green">{status}</Tag>,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={contracts}
      rowKey="id"
      scroll={{ x: 800 }}
      pagination={{ pageSize: 5 }}
    />
  );
};

