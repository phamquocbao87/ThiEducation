import React from 'react';
import { Table, Tag, Button, Typography, Empty } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { HOMEWORK_STATUS, HOMEWORK_STATUS_LABELS } from '../models/attendance.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const HomeworkAssignmentPanel = ({ homeworks, isStudent, onSubmitHomework }) => {
  const { isEnglish } = useLanguage();

  const getStatusMeta = (status) => {
    const meta = HOMEWORK_STATUS_LABELS[status] || { text: status, color: 'default' };
    if (!isEnglish) return meta;
    const enMap = {
      [HOMEWORK_STATUS.ASSIGNED]: 'Assigned',
      [HOMEWORK_STATUS.SUBMITTED]: 'Submitted',
      [HOMEWORK_STATUS.GRADED]: 'Graded',
      [HOMEWORK_STATUS.LATE]: 'Late',
    };
    return {
      text: enMap[status] || meta.text,
      color: meta.color,
    };
  };

  const columns = [
    { title: isEnglish ? 'ID' : 'Mã BT', dataIndex: 'id', key: 'id' },
    { title: isEnglish ? 'Class' : 'Lớp Học', dataIndex: 'className', key: 'className' },
    { title: isEnglish ? 'Student' : 'Học Viên', dataIndex: 'studentName', key: 'studentName', render: (v) => <Text strong>{v}</Text> },
    { title: isEnglish ? 'Assignment Title' : 'Nội Dung Bài Tập', dataIndex: 'title', key: 'title', render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text> },
    { title: isEnglish ? 'Due Date' : 'Hạn Nộp', dataIndex: 'dueDate', key: 'dueDate' },
    {
      title: isEnglish ? 'Status' : 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const meta = getStatusMeta(status);
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    { title: isEnglish ? 'Score & Teacher Comment' : 'Điểm & Nhận Xét', dataIndex: 'teacherComment', key: 'teacherComment' },
    {
      title: isEnglish ? 'Action' : 'Thao Tác',
      key: 'action',
      render: (_, record) =>
        isStudent && record.status === HOMEWORK_STATUS.ASSIGNED ? (
          <Button
            size="small"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => onSubmitHomework(record.id)}
          >
            {isEnglish ? 'Submit' : 'Nộp Bài Tập'}
          </Button>
        ) : (
          <Tag color="cyan">{record.score || (isEnglish ? 'Pending' : 'Đang chờ')}</Tag>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={homeworks}
      rowKey="id"
      scroll={{ x: 850 }}
      pagination={{ pageSize: 5 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isEnglish
                ? 'No homework assignments assigned yet. Assignments will appear here once given by teacher.'
                : 'Chưa có bài tập nào được giao. Khi giáo viên giao bài, bài tập sẽ hiển thị tại đây.'
            }
          />
        ),
      }}
    />
  );
};

