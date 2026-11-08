import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Typography, Empty } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../models/schedules.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const ScheduleTable = ({ timetable, canCheckIn, onCheckIn }) => {
  const { isEnglish } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Day' : 'Thứ',
        dataIndex: 'day',
        key: 'day',
        render: (day) => <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>{day}</Tag>,
      },
      {
        title: isEnglish ? 'Time Slot' : 'Khung Giờ',
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
        title: isEnglish ? 'Online Class' : 'Lớp Học Trực Tuyến',
        dataIndex: 'className',
        key: 'className',
        render: (text) => <Text strong style={{ color: '#722ed1' }}>{text}</Text>,
      },
      {
        title: isEnglish ? 'Subject / Skills' : 'Môn Học / Kỹ Năng',
        dataIndex: 'subject',
        key: 'subject',
      },
      {
        title: isEnglish ? 'Teacher in Charge' : 'Giáo Viên Phụ Trách',
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
        title: isEnglish ? 'Platform' : 'Nền Tảng',
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
        title: isEnglish ? 'Status' : 'Trạng Thái Ca Dạy',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const meta = SESSION_STATUS_LABELS[status] || { text: status, color: 'default' };
          return <Tag color={meta.color}>{meta.text}</Tag>;
        },
      },
      {
        title: isEnglish ? 'Classroom Actions' : 'Thao Tác Phòng Học',
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
                {isEnglish ? 'Check-in Class' : 'Check-in Lớp'}
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              icon={<LinkOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => window.open(record.meetingLink, '_blank')}
            >
              {isEnglish ? 'Join Zoom' : 'Vào Phòng Zoom'}
            </Button>
          </Space>
        ),
      },
    ],
    [isEnglish, canCheckIn, onCheckIn]
  );

  return (
    <Table
      columns={columns}
      dataSource={timetable}
      rowKey="id"
      scroll={{ x: 900 }}
      pagination={{
        pageSize: 6,
        showTotal: (total) =>
          isEnglish ? `Total ${total} sessions` : `Tổng cộng ${total} ca học`,
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isEnglish
                ? 'No scheduled sessions found. Create classes to set up schedules.'
                : 'Không có ca học nào trong thời khóa biểu. Hãy mở lớp học để xếp lịch dạy.'
            }
          />
        ),
      }}
    />
  );
};
