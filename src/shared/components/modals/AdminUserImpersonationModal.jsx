import React, { useState, useMemo } from 'react';
import {
  Modal,
  Input,
  Segmented,
  List,
  Avatar,
  Tag,
  Button,
  Typography,
  Space,
  Empty,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  SwapOutlined,
  UserOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { matchesMultiFields } from '../../utils/searchUtils';
import { DriveStorageService } from '../../../core/services/DriveStorageService';
import { PermissionService } from '../../../core/services/PermissionService';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

const ROLE_FILTER_KEYS = {
  ALL: 'all',
  DIRECTOR: 'director',
  ACADEMIC: 'academic',
  TEACHER: 'teacher',
  ACCOUNTANT: 'accountant',
  STUDENT: 'student',
};

const USER_SEARCH_FIELDS = [
  'name',
  'englishName',
  'code',
  'id',
  'email',
  'phoneNumber',
  'role',
  'roleLabel',
  'enrolledClassIds',
  'assignedClassIds',
];

export const AdminUserImpersonationModal = ({
  open,
  onClose,
  users = [],
  currentUser,
  authenticatedUser,
  isImpersonating,
  onImpersonate,
  onExitImpersonation,
}) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLE_FILTER_KEYS.ALL);

  // Mỗi khi mở modal, tự động reset từ khóa và đưa về tab Tất Cả để tìm kiếm thuận tiện nhất
  React.useEffect(() => {
    if (open) {
      setKeyword('');
      setSelectedRole(ROLE_FILTER_KEYS.ALL);
    }
  }, [open]);

  // Lọc danh sách người dùng theo từ khóa (tiếng Việt 2 chiều + %like%) và theo role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.isDeleted || u.status === 'deleted') return false;

      // Lọc theo Role
      if (selectedRole !== ROLE_FILTER_KEYS.ALL) {
        if ((u.role || '').toLowerCase() !== selectedRole.toLowerCase()) {
          return false;
        }
      }

      // Lọc theo Từ khóa tìm kiếm
      if (keyword && keyword.trim()) {
        const matches = matchesMultiFields(u, keyword, USER_SEARCH_FIELDS);
        if (!matches) return false;
      }

      return true;
    });
  }, [users, selectedRole, keyword]);

  const handleSelectUser = (user) => {
    if (onImpersonate) {
      onImpersonate(user);
    }
    if (onClose) {
      onClose();
    }
  };

  const roleOptions = [
    { label: isEnglish ? 'All Roles' : 'Tất Cả', value: ROLE_FILTER_KEYS.ALL },
    { label: isEnglish ? 'Director' : 'Giám Đốc', value: ROLE_FILTER_KEYS.DIRECTOR },
    { label: isEnglish ? 'Academic' : 'Giáo Vụ', value: ROLE_FILTER_KEYS.ACADEMIC },
    { label: isEnglish ? 'Teacher' : 'Giáo Viên', value: ROLE_FILTER_KEYS.TEACHER },
    { label: isEnglish ? 'Accountant' : 'Kế Toán', value: ROLE_FILTER_KEYS.ACCOUNTANT },
    { label: isEnglish ? 'Student' : 'Học Viên', value: ROLE_FILTER_KEYS.STUDENT },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {isEnglish
                ? 'Search & Switch User View (Admin Test)'
                : 'Tìm Kiếm & Đóng Vai Người Dùng Thực Tế'}
            </div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              {isEnglish
                ? 'Select any user to test screen layout, permissions and student/teacher view'
                : 'Chọn bất kỳ tài khoản nào để mô phỏng chính xác giao diện, dữ liệu và quyền hạn của họ'}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        isImpersonating && (
          <Button
            key="exit"
            danger
            icon={<UndoOutlined />}
            onClick={() => {
              if (onExitImpersonation) onExitImpersonation();
              if (onClose) onClose();
            }}
            style={{ float: 'left', borderRadius: 6 }}
          >
            {isEnglish
              ? `Back to Admin (${authenticatedUser?.name || 'ADM001'})`
              : `Quay Về Quyền Admin Gốc (${authenticatedUser?.name || 'ADM001'})`}
          </Button>
        ),
        <Button key="close" onClick={onClose} style={{ borderRadius: 6 }}>
          {isEnglish ? 'Close' : 'Đóng'}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '14px 0 8px' }}>
        {/* Ô Tìm Kiếm Người Dùng */}
        <Input
          prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
          placeholder={
            isEnglish
              ? 'Search by name, english name, code, email, phone (e.g., DIR505, Cowboy, Michael...)'
              : 'Tìm theo họ tên, tên tiếng Anh, mã NV/HV, email, SĐT (VD: DIR505, Bảo Lâm, Cowboy...)'
          }
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ height: 40, borderRadius: 8, fontSize: 14 }}
          autoFocus
        />

        {/* Bộ Lọc Theo Role */}
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <Segmented
            options={roleOptions}
            value={selectedRole}
            onChange={(val) => setSelectedRole(val)}
            style={{ fontWeight: 600 }}
          />
        </div>

        {/* Thống kê số lượng */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isEnglish
              ? `Showing ${filteredUsers.length} user(s)`
              : `Hiển thị ${filteredUsers.length} tài khoản phù hợp`}
          </Text>
          {isImpersonating && (
            <Badge
              status="processing"
              text={
                <Text type="warning" style={{ fontSize: 12, fontWeight: 600 }}>
                  {isEnglish
                    ? `Currently viewing: ${currentUser?.name} (${currentUser?.role})`
                    : `Đang đóng vai: ${currentUser?.name} (${currentUser?.role})`}
                </Text>
              }
            />
          )}
        </div>
      </div>

      {/* Danh Sách Kết Quả */}
      <div
        style={{
          maxHeight: 380,
          overflowY: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          padding: '4px 10px',
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={filteredUsers}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  isEnglish ? 'No matching users found' : 'Không tìm thấy tài khoản phù hợp'
                }
              />
            ),
          }}
          renderItem={(user) => {
            const isCurrentActive =
              (user.id || user.code) === (currentUser?.id || currentUser?.code);
            const roleMeta = PermissionService.ROLE_METADATA[user.role] || {
              color: 'blue',
              shortLabel: (user.role || '').toUpperCase(),
            };

            const enrolledInfo =
              Array.isArray(user.enrolledClassIds) && user.enrolledClassIds.length > 0
                ? `${user.enrolledClassIds.length} ${isEnglish ? 'class(es)' : 'lớp'}`
                : null;

            return (
              <List.Item
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  marginBottom: 4,
                  background: isCurrentActive ? '#fffbe6' : 'transparent',
                  border: isCurrentActive ? '1px solid #ffe58f' : '1px solid transparent',
                  transition: 'background 0.2s',
                }}
                actions={[
                  isCurrentActive ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontWeight: 600 }}>
                      {isEnglish ? 'Current View' : 'Đang Xem'}
                    </Tag>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      icon={<SwapOutlined />}
                      onClick={() => handleSelectUser(user)}
                      style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        backgroundColor: '#1890ff',
                      }}
                    >
                      {isEnglish ? 'Switch View' : 'Đóng Vai'}
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={DriveStorageService.formatAvatarUrl(user.avatar, 80)}
                      icon={<UserOutlined />}
                      size={40}
                      style={{
                        backgroundColor: isCurrentActive ? '#fa8c16' : '#1890ff',
                        flexShrink: 0,
                      }}
                    />
                  }
                  title={
                    <Space size={6} wrap>
                      <Text strong style={{ fontSize: 14 }}>
                        {user.name}
                      </Text>
                      {user.englishName && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({user.englishName})
                        </Text>
                      )}
                      <Tag color={roleMeta.color} style={{ fontWeight: 600, fontSize: 11 }}>
                        {roleMeta.shortLabel}
                      </Tag>
                      <Tag style={{ fontSize: 11 }}>{user.code || user.id}</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                      <Space size={12} wrap>
                        {user.phoneNumber && <span>📞 {user.phoneNumber}</span>}
                        {user.email && <span>✉️ {user.email}</span>}
                        {enrolledInfo && <span>📚 {enrolledInfo}</span>}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>
    </Modal>
  );
};
