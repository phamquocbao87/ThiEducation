import React from 'react';
import { Table, Tag, Button, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { HOMEWORK_STATUS, HOMEWORK_STATUS_LABELS } from '../models/attendance.model';

const { Text } = Typography;

export const HomeworkAssignmentPanel = ({ homeworks, isStudent, onSubmitHomework }) => {
  const columns = [
    { title: 'Mã BT', dataIndex: 'id', key: 'id' },
    { title: 'Lớp Học', dataIndex: 'className', key: 'className' },
    { title: 'Học Viên', dataIndex: 'studentName', key: 'studentName', render: (v) => <Text strong>{v}</Text> },
    { title: 'Nội Dung Bài Tập', dataIndex: 'title', key: 'title', render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text> },
    { title: 'Hạn Nộp', dataIndex: 'dueDate', key: 'dueDate' },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const meta = HOMEWORK_STATUS_LABELS[status] || { text: status, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    { title: 'Điểm & Nhận Xét', dataIndex: 'teacherComment', key: 'teacherComment' },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) =>
        isStudent && record.status === HOMEWORK_STATUS.ASSIGNED ? (
          <Button
            size="small"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => onSubmitHomework(record.id)}
          >
            Nộp Bài Tập
          </Button>
        ) : (
          <Tag color="cyan">{record.score || 'Đang chờ'}</Tag>
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
    />
  );
};

