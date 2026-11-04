import React from 'react';
import { Table, Tag, Button, Space, Typography } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../models/schedules.model';

const { Text } = Typography;

export const ScheduleTable = ({ timetable, canCheckIn, onCheckIn }) => {
  const columns = [
    {
      title: 'Thứ',
      dataIndex: 'day',
      key: 'day',
      render: (day) => <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>{day}</Tag>,
    },
    {
      title: 'Khung Giờ',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      render: (timeSlot) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <Text strong>{timeSlot}</Text>
        </Space>
      ),
    },
    {
      title: 'Lớp Học Trực Tuyến',
      dataIndex: 'className',
      key: 'className',
      render: (text) => <Text strong style={{ color: '#722ed1' }}>{text}</Text>,
    },
    { title: 'Môn Học / Kỹ Năng', dataIndex: 'subject', key: 'subject' },
    {
      title: 'Giáo Viên Phụ Trách',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Nền Tảng',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Space>
          <VideoCameraOutlined style={{ color: '#722ed1' }} />
          <Tag color="purple">{platform}</Tag>
        </Space>
      ),
    },
    {
      title: 'Trạng Thái Ca Dạy',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const meta = SESSION_STATUS_LABELS[status] || { text: status, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: 'Thao Tác Phòng Học',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          {canCheckIn && record.status === SESSION_STATUS.UPCOMING && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onCheckIn(record.id)}
            >
              Check-in Lớp
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<LinkOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => window.open(record.meetingLink, '_blank')}
          >
            Vào Phòng Zoom
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={timetable}
      rowKey="id"
      scroll={{ x: 900 }}
      pagination={{ pageSize: 6 }}
    />
  );
};

