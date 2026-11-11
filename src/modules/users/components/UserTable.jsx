import React, { useMemo } from 'react';
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
  PhoneOutlined,
} from '@ant-design/icons';
import { USER_ROLES, ROLE_COLORS, USER_STATUS, ROLE_LABELS, isGmailAddress, toEnglishName } from '../models/user.model';
import { PermissionService } from '../../../core/services/PermissionService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';
import { AdminAuditInfo } from '../../../shared/components/AdminAuditInfo';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const UserTable = ({
  users,
  loading,
  currentUser,
  onToggleStatus,
  onEditUser,
  onDeleteUser,
  language: propLanguage,
  isEnglish: propIsEnglish,
}) => {
  const contextLanguage = useLanguage();
  const isEnglish = propIsEnglish !== undefined ? propIsEnglish : contextLanguage?.isEnglish;
  const t = contextLanguage?.t || ((key) => key);

  const columns = useMemo(() => [
    {
      title: t('users.table.colMember'),
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                  {record.name}
                </Text>
                {(record.englishName || toEnglishName(record.name)) && (
                  <Tag color="cyan" style={{ fontSize: 11, padding: '1px 6px', margin: 0 }}>
                    🇬🇧 {record.englishName || toEnglishName(record.name)}
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.extraInfo || (record.role === 'student' ? t('users.table.onlineStudent') : t('users.table.lakStaff'))}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: t('users.table.colContact'),
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
                {t('users.table.rootAdminTag')}
              </Tag>
            )}
          </div>
          {record.email ? (
            <Text style={{ fontSize: 13, display: 'block', color: '#334155' }}>
              {record.email}
            </Text>
          ) : (
            <Tag color="cyan" style={{ fontSize: 11, margin: '2px 0' }}>
              📱 {t('users.table.loginViaPhone')}
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.phoneNumber ? `${t('users.table.phonePrefix')}${record.phoneNumber}` : t('users.table.phoneNotUpdated')}
          </Text>
        </div>
      ),
    },
    {
      title: t('users.table.colRole'),
      dataIndex: 'role',
      key: 'role',
      width: 170,
      render: (role, record) => {
        const color = ROLE_COLORS[role] || 'default';
        const isStudent = role === USER_ROLES.STUDENT;
        const localizedRole = ROLE_LABELS[isEnglish ? 'en' : 'vi']?.[role] || record.roleLabel || role.toUpperCase();
        return (
          <div>
            <Tag color={color} style={{ padding: '3px 8px', fontSize: 12, borderRadius: 4 }}>
              {localizedRole}
            </Tag>
            {isStudent && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.isArray(record.enrolledClassIds) && record.enrolledClassIds.length > 0 ? (
                  <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>
                    {record.enrolledClassIds.join(', ')}
                  </Tag>
                ) : record.className ? (
                  <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>
                    {record.className}
                  </Tag>
                ) : null}
                <Tag
                  color={record.tuitionStatus === 'Đã đóng đủ' ? 'green' : 'gold'}
                  style={{ fontSize: 10, margin: 0, width: 'fit-content' }}
                >
                  {record.tuitionStatus === 'Đã đóng đủ'
                    ? (isEnglish ? 'Paid in Full' : 'Đã đóng đủ')
                    : (isEnglish ? 'Pending' : (record.tuitionStatus || 'Chờ đối soát'))}
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t('users.table.colAuth'),
      key: 'authProviders',
      width: 140,
      render: (_, record) => {
        const isGmail = isGmailAddress(record.email);
        return (
          <Space size={4}>
            {isGmail && (
              <Tooltip title={t('users.table.gmailTooltip')}>
                <Tag icon={<GoogleOutlined />} color="orange" style={{ margin: 0, fontSize: 11 }}>
                  Google
                </Tag>
              </Tooltip>
            )}
            {record.email ? (
              <Tooltip title={t('users.table.passwordTooltip')}>
                <Tag icon={<KeyOutlined />} color="default" style={{ margin: 0, fontSize: 11 }}>
                  Pass
                </Tag>
              </Tooltip>
            ) : (
              <Tooltip title={t('users.table.phonePasswordTooltip')}>
                <Tag icon={<PhoneOutlined />} color="cyan" style={{ margin: 0, fontSize: 11 }}>
                  SĐT & Pass
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: t('users.table.colStatus'),
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
                  ? t('users.table.rootAdminNoLockTooltip')
                  : !canChange
                  ? t('users.table.noPermissionTooltip')
                  : isActive
                  ? (isEnglish ? 'Switch left to Lock this account' : 'Gạt sang trái để Khóa tài khoản này')
                  : (isEnglish ? 'Switch right to Activate this account' : 'Gạt sang phải để Kích hoạt tài khoản này')
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
              {isActive ? t('users.table.statusActiveLabel') : t('users.table.statusDisabledLabel')}
            </Text>
          </div>
        );
      },
    },
    ...(currentUser?.role === 'admin'
      ? [
          {
            title: isEnglish ? 'Audit Trail' : 'Người Tạo / Cập Nhật',
            key: 'auditTrail',
            width: 190,
            render: (_, record) => (
              <AdminAuditInfo record={record} currentUser={currentUser} mode="table" />
            ),
          },
        ]
      : []),
    {
      title: t('users.table.colActions'),
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const canDelete = PermissionService.canDeleteUser(currentUser, record);
        const canEdit = PermissionService.canEditUser(currentUser, record);

        return (
          <Space size={6}>
            <Tooltip title={canEdit ? (isEnglish ? 'View details & edit full profile' : 'Xem chi tiết & chỉnh sửa hồ sơ đầy đủ') : (isEnglish ? 'View details' : 'Xem thông tin chi tiết')}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditUser(record)}
                style={{ borderRadius: 6 }}
              >
                {t('users.table.btnDetails')}
              </Button>
            </Tooltip>

            {canDelete && (
              <Tooltip title={isEnglish ? 'Delete this account (Reason required)' : 'Xóa tài khoản này (Yêu cầu nhập lý do)'}>
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
  ], [isEnglish, currentUser, onToggleStatus, onEditUser, onDeleteUser, t]);

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
        showTotal: (total) =>
          isEnglish
            ? `Total ${total} accounts in system`
            : `Tổng cộng ${total} tài khoản trong hệ thống`,
      }}
      scroll={{ x: 1000 }}
    />
  );
};
