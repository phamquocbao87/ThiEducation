import React from 'react';
import { Table, Tag, Space, Rate, Button, Typography } from 'antd';
import {
  GlobalOutlined,
  SoundOutlined,
  TranslationOutlined,
  CheckOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export const SessionEvaluationTable = ({ attendances }) => {
  const columns = [
    { title: 'Ngày Học', dataIndex: 'date', key: 'date', render: (text) => <Text strong>{text}</Text> },
    {
      title: 'Lớp Học Trực Tuyến',
      dataIndex: 'className',
      key: 'className',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: 'Giáo Viên Bản Xứ',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (t) => <Tag color="geekblue"><GlobalOutlined /> {t}</Tag>,
    },
    {
      title: 'Điểm Danh Phòng Zoom',
      key: 'attendance',
      render: (_, record) => (
        <Space>
          <Tag color="green">Có mặt: {record.presentCount}</Tag>
          <Tag color={record.absentCount > 0 ? 'volcano' : 'default'}>Vắng: {record.absentCount}</Tag>
        </Space>
      ),
    },
    {
      title: 'Đánh Giá 4 Kỹ Năng (⭐ 1-5 Sao)',
      key: 'scores',
      render: (_, record) => (
        <Space orientation="vertical" size={2} style={{ fontSize: 12 }}>
          <div><Text type="secondary"><SoundOutlined /> Pronunciation:</Text> <Rate disabled defaultValue={record.pronunciationScore || 5} style={{ fontSize: 12 }} /></div>
          <div><Text type="secondary"><TranslationOutlined /> Spelling:</Text> <Rate disabled defaultValue={record.spellingScore || 5} style={{ fontSize: 12 }} /></div>
          <div><Text type="secondary"><CheckOutlined /> Seriousness:</Text> <Rate disabled defaultValue={record.seriousnessScore || 5} style={{ fontSize: 12 }} /></div>
        </Space>
      ),
    },
    {
      title: 'Nhận Xét Của Giáo Viên (English Feedback)',
      dataIndex: 'teacherFeedback',
      key: 'teacherFeedback',
      render: (text) => <Text style={{ fontSize: 13, fontStyle: 'italic' }}>"{text}"</Text>,
    },
    {
      title: 'Video Ghi Hình',
      key: 'recording',
      render: (_, record) =>
        record.recordingUrl ? (
          <Button
            size="small"
            type="primary"
            ghost
            icon={<PlayCircleOutlined />}
            onClick={() => window.open(record.recordingUrl, '_blank')}
          >
            Xem Video
          </Button>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={attendances}
      rowKey="id"
      scroll={{ x: 920 }}
      pagination={{ pageSize: 5 }}
    />
  );
};

