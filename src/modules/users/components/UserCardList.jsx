import React from 'react';
import {
  Card,
  Avatar,
  Tag,
  Space,
  Typography,
  Switch,
  Button,
  Popconfirm,
  Badge,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  GoogleOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { ROLE_COLORS, USER_STATUS, ROLE_LABELS, isGmailAddress } from '../models/user.model';
import { PermissionService } from '../../../core/services/PermissionService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

const { Text, Title } = Typography;

export const UserCardList = ({
  users = [],
  loading = false,
  currentUser,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <Spin size="large" description="Đang tải danh sách tài khoản..." />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Empty
        description="Không tìm thấy tài khoản người dùng nào phù hợp"
        style={{ padding: '32px 16px' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {users.map((user) => {
        const roleColor = ROLE_COLORS[user.role] || 'blue';
        const isActive = user.status === USER_STATUS.ACTIVE;
        const isRootAdmin = user.id === 'ADM001' || user.email === 'phamquocbao87@gmail.com';
        const canChangeStatus = PermissionService.canChangeUserStatus(currentUser, user);
        const canDelete = PermissionService.canDeleteUser(currentUser, user);
        const canEdit = PermissionService.canEditUser(currentUser, user);

        return (
          <Card
            key={user.id || user.code || user.email}
            hoverable
            style={{
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
            styles={{
              body: { padding: '16px' },
            }}
          >
            {/* 1. Phần Đầu Card: Avatar + Tên + Role Tag + Nút Xem Chi Tiết */}
            <div
              onClick={() => onEditUser(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              <Badge
                dot
                color={isActive ? '#52c41a' : '#ff4d4f'}
                offset={[-2, 38]}
              >
                <Avatar
                  key={user.avatar || user.id}
                  size={48}
                  src={DriveStorageService.formatAvatarUrl(user.avatar, 200)}
                  style={{
                    backgroundColor: '#e6f7ff',
                    border: `2px solid ${roleColor === 'red' ? '#ff4d4f' : '#1890ff'}`,
                  }}
                >
                  {user.name ? user.name.substring(0, 2).toUpperCase() : 'LK'}
                </Avatar>
              </Badge>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                    {user.name}
                  </Text>
                  <Tag color="geekblue" style={{ fontSize: 11, padding: '1px 6px', margin: 0 }}>
                    {user.code || user.id}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Tag color={roleColor} style={{ fontSize: 11, margin: 0 }}>
                    {user.roleLabel || ROLE_LABELS.vi[user.role] || user.role}
                  </Tag>
                  <Tag
                    color={isActive ? 'success' : 'error'}
                    style={{ fontSize: 11, margin: 0 }}
                  >
                    {isActive ? 'Hoạt Động' : 'Đã Khóa'}
                  </Tag>
                </div>
              </div>

              <RightOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
            </div>

            {/* 2. Phần Thân Card: Email & Số điện thoại & Ghi chú */}
            <div
              style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', marginBottom: 4 }}>
                <MailOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                <span style={{ wordBreak: 'break-all' }}>{user.email || 'Chưa cập nhật'}</span>
              </div>
              {user.phoneNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', marginBottom: 4 }}>
                  <PhoneOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
              {user.extraInfo && (
                <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                  {user.extraInfo}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Đăng nhập:</Text>
                {isGmailAddress(user.email) ? (
                  <>
                    <Tag icon={<GoogleOutlined />} color="orange" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                      Google
                    </Tag>
                    <Tag icon={<KeyOutlined />} color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                      Mật khẩu
                    </Tag>
                  </>
                ) : (
                  <Tag icon={<KeyOutlined />} color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                    Mật khẩu
                  </Tag>
                )}
              </div>
            </div>

            {/* 3. Phần Chân Card: Quick Actions (Kích hoạt, Sửa, Xóa) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 4,
                borderTop: '1px solid #f1f5f9',
                gap: 8,
              }}
            >
              {/* Công tắc Kích hoạt / Khóa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tooltip
                  title={
                    isRootAdmin
                      ? 'Root Admin không thể bị khóa'
                      : !canChangeStatus
                      ? 'Bạn không có quyền khóa tài khoản này'
                      : isActive
                      ? 'Gạt để khóa'
                      : 'Gạt để kích hoạt'
                  }
                >
                  <Switch
                    checked={isActive}
                    disabled={isRootAdmin || !canChangeStatus}
                    size="small"
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<CloseCircleOutlined />}
                    onChange={(checked) => onToggleStatus(user, checked)}
                    style={{ backgroundColor: isActive ? '#52c41a' : '#ff4d4f' }}
                  />
                </Tooltip>
                <Text style={{ fontSize: 12, color: isActive ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                  {isActive ? 'BẬT' : 'KHÓA'}
                </Text>
              </div>

              {/* Nhóm nút Chỉnh sửa & Xóa */}
              <Space size={8}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditUser(user)}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  Chi tiết
                </Button>

                {canDelete && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteUser(user)}
                    style={{ borderRadius: 6, fontSize: 12 }}
                  >
                    Xóa
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
