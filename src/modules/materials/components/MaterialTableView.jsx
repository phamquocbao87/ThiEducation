import React from 'react';
import { Button, Card, Empty, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import {
  BookOutlined,
  CloudUploadOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LinkOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { MATERIAL_TYPES, SHARE_SCOPES, VISIBILITY_TYPES } from '../models/material.model';

const { Text } = Typography;

export const MaterialTableView = ({
  materials = [],
  loading = false,
  canManage = false,
  onEdit,
  onDelete,
  onPreview,
  onOpenShare,
}) => {
  const { isEnglish } = useLanguage();

  const getFormatIcon = (type) => {
    switch (type) {
      case 'AUDIO':
        return <CustomerServiceOutlined style={{ color: '#fa8c16' }} />;
      case 'SLIDES':
        return <DesktopOutlined style={{ color: '#52c41a' }} />;
      case 'VIDEO':
        return <VideoCameraOutlined style={{ color: '#8b5cf6' }} />;
      case 'PRACTICE':
        return <BookOutlined style={{ color: '#13c2c2' }} />;
      case 'TEACHER_GUIDE':
        return <SafetyCertificateOutlined style={{ color: '#722ed1' }} />;
      default:
        return <FilePdfOutlined style={{ color: '#1677ff' }} />;
    }
  };

  const columns = [
    {
      title: isEnglish ? 'Material & Format' : 'Tên Tài Liệu & Định Dạng',
      key: 'title',
      render: (_, record) => {
        const meta = MATERIAL_TYPES[record.type] || MATERIAL_TYPES.PDF;
        return (
          <Space orientation="horizontal" size="middle" align="start">
            <span style={{ fontSize: 22, marginTop: 2 }}>{getFormatIcon(record.type)}</span>
            <div>
              <div
                style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', cursor: 'pointer' }}
                onClick={() => onPreview?.(record)}
                data-testid={`btn-title-preview-${record.id}`}
              >
                <span style={{ color: '#0958d9' }}>{record.title}</span>
              </div>
              <Space size={6} wrap style={{ marginTop: 4 }}>
                <Tag color={meta.badgeColor} style={{ borderRadius: 4, fontSize: 11 }}>
                  {isEnglish ? meta.labelEn : meta.labelVi}
                </Tag>
                {record.firebaseFolder && (
                  <Tag color="magenta" style={{ borderRadius: 4, fontSize: 10 }}>
                    📁 {record.firebaseFolder}
                  </Tag>
                )}
                {record.fileSize && (
                  <Tag style={{ borderRadius: 4, fontSize: 10, backgroundColor: '#f1f5f9' }}>
                    {record.fileSize}
                  </Tag>
                )}
                {record.description && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    • {record.description}
                  </Text>
                )}
              </Space>
            </div>
          </Space>
        );
      },
    },
    {
      title: isEnglish ? 'Assigned Course' : 'Khóa Học Áp Dụng',
      key: 'course',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0958d9', fontSize: 13 }}>
            {record.courseName || (isEnglish ? 'All Courses' : 'Toàn Trung Tâm')}
          </div>
          {record.courseLevel && record.courseLevel !== 'All' && (
            <Tag color="purple" style={{ marginTop: 2, borderRadius: 4, fontSize: 11 }}>
              {record.courseLevel}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Sharing & Scope' : 'Phạm Vi & Chia Sẻ',
      key: 'sharingScope',
      width: 220,
      render: (_, record) => {
        const isStaffOnly = record.shareScope === SHARE_SCOPES.STAFF_ONLY.key || record.visibility === VISIBILITY_TYPES.TEACHERS_ONLY.key;
        const isCustom = record.shareScope === SHARE_SCOPES.CUSTOM.key || (Array.isArray(record.shares) && record.shares.length > 0);
        const sharesCount = (record.shares || []).length;
        const studentCount = (record.sharedStudentIds || []).length;
        const classCount = (record.sharedClassIds || []).length;

        if (isStaffOnly) {
          return (
            <Tag color="volcano" icon={<LockOutlined />} style={{ borderRadius: 6, fontWeight: 500 }}>
              {isEnglish ? '🔒 Staff Only' : '🔒 Nội bộ Giáo Viên'}
            </Tag>
          );
        }

        if (isCustom && (sharesCount > 0 || studentCount > 0 || classCount > 0)) {
          return (
            <Space size={4} wrap>
              <Tag color="purple" icon={<ShareAltOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                {isEnglish ? 'Custom' : 'Chọn lọc'}
              </Tag>
              {classCount > 0 && (
                <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>
                  🏫 {classCount} {isEnglish ? (classCount > 1 ? 'classes' : 'class') : 'lớp'}
                </Tag>
              )}
              {studentCount > 0 && (
                <Tag color="cyan" style={{ borderRadius: 4, fontSize: 11 }}>
                  🎒 {studentCount} {isEnglish ? (studentCount > 1 ? 'students' : 'student') : 'HV'}
                </Tag>
              )}
            </Space>
          );
        }

        return (
          <Tag color="green" icon={<GlobalOutlined />} style={{ borderRadius: 6, fontWeight: 500 }}>
            {isEnglish ? '🟢 Public (All)' : '🟢 Công Khai Toàn Trường'}
          </Tag>
        );
      },
    },
    {
      title: isEnglish ? 'View & Download' : 'Xem & Tải Về',
      key: 'link',
      width: 180,
      render: (_, record) => (
        <Space size={6} wrap={false}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onPreview?.(record)}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              backgroundColor: '#722ed1',
              borderColor: '#722ed1',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            data-testid={`btn-preview-material-${record.id}`}
          >
            <span style={{ whiteSpace: 'nowrap' }}>{isEnglish ? 'Preview' : 'Xem Trước'}</span>
          </Button>
          <Tooltip title={isEnglish ? 'Open in new tab' : 'Mở trong tab mới'}>
            <Button
              size="small"
              icon={<ExportOutlined style={{ color: '#64748b' }} />}
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderRadius: 6, flexShrink: 0 }}
              data-testid={`btn-open-drive-${record.id}`}
            />
          </Tooltip>
        </Space>
      ),
    },
    ...(canManage
      ? [
          {
            title: isEnglish ? 'Actions' : 'Thao Tác',
            key: 'actions',
            width: 140,
            render: (_, record) => (
              <Space size={6}>
                <Tooltip title={isEnglish ? 'Manage Sharing & Access' : 'Phân Quyền & Chia Sẻ'}>
                  <Button
                    size="small"
                    icon={<ShareAltOutlined style={{ color: '#722ed1' }} />}
                    onClick={() => onOpenShare?.(record)}
                    data-testid={`btn-share-material-${record.id}`}
                    style={{ borderRadius: 6, borderColor: '#d8b4fe' }}
                  />
                </Tooltip>
                <Tooltip title={isEnglish ? 'Edit' : 'Chỉnh sửa'}>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit?.(record)}
                    data-testid={`btn-edit-material-${record.id}`}
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>
                <Popconfirm
                  title={isEnglish ? 'Delete this material?' : 'Xác nhận xóa tài liệu này?'}
                  description={
                    isEnglish
                      ? 'Material will be removed from all linked classrooms.'
                      : 'Tài liệu sẽ được gỡ khỏi kho học liệu của các lớp học.'
                  }
                  okText={isEnglish ? 'Delete' : 'Xóa'}
                  cancelText={isEnglish ? 'Cancel' : 'Hủy'}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete?.(record)}
                >
                  <Tooltip title={isEnglish ? 'Delete' : 'Xóa'}>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      data-testid={`btn-delete-material-${record.id}`}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  if (!loading && materials.length === 0) {
    return (
      <Card
        style={{
          borderRadius: 12,
          border: '1px dashed #cbd5e1',
          textAlign: 'center',
          padding: '40px 20px',
        }}
        data-testid="empty-materials-card"
      >
        <FolderOpenOutlined style={{ fontSize: 44, color: '#94a3b8', marginBottom: 12 }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: '#334155', marginBottom: 6 }}>
          {isEnglish ? 'No learning materials found' : 'Chưa có tài liệu học tập nào'}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
          {isEnglish
            ? 'Uploaded textbooks, listening audio, and slide presentations will appear here.'
            : 'Nhấn nút "Tải Lên Học Liệu Mới" để đồng bộ giáo trình từ Google Drive vào hệ thống.'}
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0',
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Table
        dataSource={materials}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 750 }}
        data-testid="materials-table"
      />
    </Card>
  );
};

