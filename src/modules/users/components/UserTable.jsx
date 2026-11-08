import React from 'react';
import {
  Table,
  Tag,
  Switch,
  Avatar,
  Space,
  Typography,
  Tooltip,
  Badge,
  Button,
  Popconfirm,
} from 'antd';
import {
  GoogleOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { ROLE_COLORS, USER_STATUS, isGmailAddress } from '../models/user.model';
import { PermissionService } from '../../../core/services/PermissionService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

const { Text } = Typography;

export const UserTable = ({
  users,
  loading,
  currentUser,
  onToggleStatus,
  onEditUser,
  onDeleteUser,
  language = 'vi',
}) => {
  const columns = [
    {
      title: 'Thành viên & Avatar',
      key: 'userProfile',
      width: 250,
      render: (_, record) => {
        const roleColor = ROLE_COLORS[record.role] || 'blue';
        return (
          <Space align="center" size={12}>
            <Badge
              dot
              color={record.status === USER_STATUS.ACTIVE ? '#52c41a' : '#ff4d4f'}
              offset={[-4, 32]}
            >
              <Avatar
                key={record.avatar || record.id}
                size={42}
                src={DriveStorageService.formatAvatarUrl(record.avatar, 200)}
                style={{
                  border: `2px solid ${roleColor === 'red' ? '#ff4d4f' : '#1890ff'}`,
                  backgroundColor: '#f0f2f5',
                }}
              >
                {record.name ? record.name.substring(0, 2).toUpperCase() : 'LK'}
              </Avatar>
            </Badge>
            <div>
              <Text strong style={{ fontSize: 14, display: 'block', color: '#1e293b' }}>
                {record.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.extraInfo || (record.role === 'student' ? 'Học viên trực tuyến' : 'Cán bộ LAK EDUCATION')}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Liên hệ & Mã',
      key: 'contactInfo',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Tag color="geekblue" style={{ fontSize: 11, fontWeight: 600 }}>
              {record.code || record.id}
            </Tag>
            {record.isRootAdmin && (
              <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>
                ROOT ADMIN
              </Tag>
            )}
          </div>
          <Text style={{ fontSize: 13, display: 'block', color: '#334155' }}>
            {record.email}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.phoneNumber ? `SĐT: ${record.phoneNumber}` : 'Chưa cập nhật SĐT'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Vai trò (Role)',
      dataIndex: 'role',
      key: 'role',
      width: 170,
      render: (role, record) => {
        const color = ROLE_COLORS[role] || 'default';
        return (
          <Tag color={color} style={{ padding: '3px 8px', fontSize: 12, borderRadius: 4 }}>
            {record.roleLabel || role.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Đăng nhập',
      key: 'authProviders',
      width: 140,
      render: (_, record) => {
        const isGmail = isGmailAddress(record.email);
        return (
          <Space size={4}>
            {isGmail && (
              <Tooltip title="Gmail: Đăng nhập Google">
                <Tag icon={<GoogleOutlined />} color="orange" style={{ margin: 0, fontSize: 11 }}>
                  Google
                </Tag>
              </Tooltip>
            )}
            <Tooltip title="Đăng nhập Mật khẩu">
              <Tag icon={<KeyOutlined />} color="default" style={{ margin: 0, fontSize: 11 }}>
                Pass
              </Tag>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Kích Hoạt / Khóa',
      key: 'status',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const isActive = record.status === USER_STATUS.ACTIVE;
        const canChange = PermissionService.canChangeUserStatus(currentUser, record);
        const isRootAdmin = record.id === 'ADM001' || record.email === 'phamquocbao87@gmail.com';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Tooltip
              title={
                isRootAdmin
                  ? 'Tài khoản Root Admin tối cao không thể bị khóa'
                  : !canChange
                  ? 'Bạn không có quyền thay đổi trạng thái của tài khoản này'
                  : isActive
                  ? 'Gạt sang trái để Khóa tài khoản này'
                  : 'Gạt sang phải để Kích hoạt tài khoản này'
              }
            >
              <Switch
                checked={isActive}
                disabled={isRootAdmin || !canChange}
                checkedChildren={<CheckCircleOutlined />}
                unCheckedChildren={<CloseCircleOutlined />}
                onChange={(checked) => onToggleStatus(record, checked)}
                style={{
                  backgroundColor: isActive ? '#52c41a' : '#ff4d4f',
                }}
              />
            </Tooltip>
            <Text
              style={{
                fontSize: 11,
                color: isActive ? '#52c41a' : '#ff4d4f',
                fontWeight: 600,
              }}
            >
              {isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const canDelete = PermissionService.canDeleteUser(currentUser, record);
        const canEdit = PermissionService.canEditUser(currentUser, record);

        return (
          <Space size={6}>
            <Tooltip title={canEdit ? 'Xem chi tiết & chỉnh sửa hồ sơ đầy đủ' : 'Xem thông tin chi tiết'}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditUser(record)}
                style={{ borderRadius: 6 }}
              >
                Chi tiết
              </Button>
            </Tooltip>

            {canDelete && (
              <Tooltip title="Xóa tài khoản này (Yêu cầu nhập lý do)">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDeleteUser(record)}
                  style={{ borderRadius: 6 }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey={(r) => r.id || r.code || r.email}
      loading={loading}
      onRow={(record) => ({
        onClick: (e) => {
          // Tránh trigger khi bấm vào nút sửa, nút xóa hoặc switch
          if (
            e.target.closest('button') ||
            e.target.closest('.ant-switch') ||
            e.target.closest('.ant-popover') ||
            e.target.closest('.ant-popconfirm')
          ) {
            return;
          }
          if (onEditUser) onEditUser(record);
        },
        style: { cursor: 'pointer' },
      })}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng cộng ${total} tài khoản trong hệ thống`,
      }}
      scroll={{ x: 1000 }}
    />
  );
};
