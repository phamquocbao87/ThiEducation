import React, { useMemo } from 'react';
import { Table, Tag, Space, Rate, Button, Typography } from 'antd';
import {
  GlobalOutlined,
  SoundOutlined,
  TranslationOutlined,
  CheckOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const SessionEvaluationTable = ({ attendances }) => {
  const { isEnglish, t } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Session Date' : 'Ngày Học',
        dataIndex: 'date',
        key: 'date',
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: isEnglish ? 'Online Classroom' : 'Lớp Học Trực Tuyến',
        dataIndex: 'className',
        key: 'className',
        render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
      },
      {
        title: isEnglish ? 'Native Teacher' : 'Giáo Viên Bản Xứ',
        dataIndex: 'teacherName',
        key: 'teacherName',
        render: (tName) => (
          <Tag color="geekblue">
            <GlobalOutlined /> {tName}
          </Tag>
        ),
      },
      {
        title: isEnglish ? 'Zoom Attendance' : 'Điểm Danh Phòng Zoom',
        key: 'attendance',
        render: (_, record) => (
          <Space>
            <Tag color="green">
              {isEnglish ? `Present: ${record.presentCount}` : `Có mặt: ${record.presentCount}`}
            </Tag>
            <Tag color={record.absentCount > 0 ? 'volcano' : 'default'}>
              {isEnglish ? `Absent: ${record.absentCount}` : `Vắng: ${record.absentCount}`}
            </Tag>
          </Space>
        ),
      },
      {
        title: isEnglish ? '4 Skills Evaluation (⭐ 1-5 Stars)' : 'Đánh Giá 4 Kỹ Năng (⭐ 1-5 Sao)',
        key: 'scores',
        render: (_, record) => (
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            <div>
              <Text type="secondary"><SoundOutlined /> {isEnglish ? 'Pronunciation:' : 'Phát âm:'}</Text>{' '}
              <Rate disabled defaultValue={record.pronunciationScore || 5} style={{ fontSize: 12 }} />
            </div>
            <div>
              <Text type="secondary"><TranslationOutlined /> {isEnglish ? 'Spelling:' : 'Chính tả:'}</Text>{' '}
              <Rate disabled defaultValue={record.spellingScore || 5} style={{ fontSize: 12 }} />
            </div>
            <div>
              <Text type="secondary"><CheckOutlined /> {isEnglish ? 'Seriousness:' : 'Thái độ:'}</Text>{' '}
              <Rate disabled defaultValue={record.seriousnessScore || 5} style={{ fontSize: 12 }} />
            </div>
          </Space>
        ),
      },
      {
        title: isEnglish ? "Teacher's Feedback" : 'Nhận Xét Của Giáo Viên (English Feedback)',
        dataIndex: 'teacherFeedback',
        key: 'teacherFeedback',
        render: (text) => <Text style={{ fontSize: 13, fontStyle: 'italic' }}>"{text}"</Text>,
      },
      {
        title: isEnglish ? 'Recorded Video' : 'Video Ghi Hình',
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
              {isEnglish ? 'Watch Video' : 'Xem Video'}
            </Button>
          ) : (
            <Text type="secondary">N/A</Text>
          ),
      },
    ],
    [isEnglish, t]
  );

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
