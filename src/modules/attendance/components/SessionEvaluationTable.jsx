import React, { useMemo } from 'react';
import { Table, Tag, Space, Rate, Button, Typography, Empty, Popover } from 'antd';
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
        title: isEnglish ? 'Class Attendance' : 'Điểm Danh Lớp Học',
        key: 'attendance',
        render: (_, record) => (
          <Space>
            <Tag color="green">
              {isEnglish ? `Present: ${record.presentCount}` : `Có mặt: ${record.presentCount}`}
            </Tag>
            <Tag color={record.absentCount > 0 ? 'volcano' : 'default'}>
              {isEnglish ? `Absent: ${record.absentCount}` : `Vắng: ${record.absentCount}`}
            </Tag>
            {record.unmarkedCount > 0 && <Tag>{t('classroom.unmarkedCount', { count: record.unmarkedCount })}</Tag>}
          </Space>
        ),
      },
      {
        title: isEnglish ? '4 Skills Evaluation (⭐ 1-5 Stars)' : 'Đánh Giá 4 Kỹ Năng (⭐ 1-5 Sao)',
        key: 'scores',
        render: (_, record) => record.sessionId && record.pronunciationScore == null ? <Text type="secondary">—</Text> : (
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
        width: 260,
        render: (text) => {
          if (!text) return <Text type="secondary">—</Text>;
          const isLong = text.length > 70;
          if (!isLong) {
            return <Text style={{ fontSize: 13, fontStyle: 'italic' }}>"{text}"</Text>;
          }
          return (
            <Popover
              title={isEnglish ? "Teacher's Detailed Feedback" : 'Nhận Xét Chi Tiết Của Giáo Viên'}
              content={
                <div style={{ maxWidth: 360, lineHeight: 1.6, fontStyle: 'italic', padding: '4px 0' }}>
                  "{text}"
                </div>
              }
              trigger="click"
            >
              <div style={{ cursor: 'pointer' }} title={isEnglish ? 'Click to read full feedback' : 'Bấm để đọc toàn bộ nhận xét'}>
                <Text style={{ fontSize: 13, fontStyle: 'italic' }}>"{text.slice(0, 65)}..."</Text>
                <div style={{ color: '#1890ff', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                  {isEnglish ? '🔍 Click for more details' : '🔍 Bấm để xem đầy đủ'}
                </div>
              </div>
            </Popover>
          );
        },
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
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isEnglish
                ? 'No session evaluations recorded yet. Teachers can take attendance and evaluate live sessions above.'
                : 'Chưa có buổi học nào được điểm danh. Giáo viên hoặc Giáo vụ có thể bấm "Điểm Danh" ở thẻ lớp phía trên.'
            }
          />
        ),
      }}
    />
  );
};
