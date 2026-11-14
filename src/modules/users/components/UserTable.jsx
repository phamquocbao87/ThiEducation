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
      width: 230,
      render: (role, record) => {
        const color = ROLE_COLORS[role] || 'default';
        const isStudent = role === USER_ROLES.STUDENT;
        const isTeacher = role === USER_ROLES.TEACHER;
        const localizedRole = ROLE_LABELS[isEnglish ? 'en' : 'vi']?.[role] || record.roleLabel || role.toUpperCase();
        
        const hasEnrolledClasses = Array.isArray(record.enrolledClasses) && record.enrolledClasses.length > 0;
        const hasTeachingClasses = Array.isArray(record.teachingClasses) && record.teachingClasses.length > 0;

        return (
          <div>
            <Tag color={color} style={{ padding: '3px 8px', fontSize: 12, borderRadius: 4 }}>
              {localizedRole}
            </Tag>

            {/* Thông tin Lớp học của Học viên */}
            {isStudent && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {hasEnrolledClasses ? (
                  record.enrolledClasses.map((cls) => (
                    <Tooltip
                      key={cls.id}
                      placement="topLeft"
                      title={
                        <div style={{ fontSize: 12, lineHeight: 1.5, padding: '2px 4px' }}>
                          <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: 2 }}>
                            {cls.id}: {cls.name}
                          </div>
                          {cls.courseName && (
                            <div>📖 {t('users.table.courseLabel') || (isEnglish ? 'Course:' : 'Khóa học:')} {cls.courseName}</div>
                          )}
                          {cls.teacherName && (
                            <div>👨‍🏫 {t('users.table.teacherLabel') || (isEnglish ? 'Teacher:' : 'Giáo viên:')} {cls.teacherName}</div>
                          )}
                          {cls.schedule && (
                            <div>🕒 {t('users.table.scheduleLabel') || (isEnglish ? 'Schedule:' : 'Lịch học:')} {cls.schedule}</div>
                          )}
                        </div>
                      }
                    >
                      <Tag
                        color="processing"
                        style={{
                          fontSize: 11,
                          margin: 0,
                          borderRadius: 4,
                          maxWidth: 215,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          border: '1px solid #91caff',
                          background: '#e6f4ff',
                          color: '#0958d9',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <span>📚</span>
                        <span style={{ fontWeight: 700 }}>{cls.id}:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</span>
                      </Tag>
                    </Tooltip>
                  ))
                ) : Array.isArray(record.enrolledClassIds) && record.enrolledClassIds.length > 0 ? (
                  <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>
                    {record.enrolledClassIds.join(', ')}
                  </Tag>
                ) : record.className ? (
                  <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>
                    {record.className}
                  </Tag>
                ) : (
                  <Tag
                    style={{
                      fontSize: 10,
                      margin: 0,
                      borderRadius: 4,
                      color: '#64748b',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      width: 'fit-content',
                      fontWeight: 500,
                    }}
                  >
                    {t('users.table.notEnrolled') || (isEnglish ? 'Not Enrolled' : 'Chưa phân lớp')}
                  </Tag>
                )}

                {/* Trạng thái học phí */}
                <Tag
                  color={record.tuitionStatus === 'Đã đóng đủ' ? 'green' : 'gold'}
                  style={{ fontSize: 10, margin: 0, width: 'fit-content', borderRadius: 4 }}
                >
                  {record.tuitionStatus === 'Đã đóng đủ'
                    ? (isEnglish ? 'Paid in Full' : 'Đã đóng đủ')
                    : (isEnglish ? 'Pending' : (record.tuitionStatus || (isEnglish ? 'Pending Audit' : 'Chờ đối soát')))}
                </Tag>
              </div>
            )}

            {/* Thông tin Lớp phân công giảng dạy của Giáo viên */}
            {isTeacher && hasTeachingClasses && (
              <div style={{ marginTop: 6 }}>
                <Tooltip
                  placement="topLeft"
                  title={
                    <div style={{ fontSize: 12, lineHeight: 1.5, padding: '2px 4px' }}>
                      <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: 2 }}>
                        {isEnglish ? 'Assigned Teaching Classes:' : 'Lớp phân công giảng dạy:'}
                      </div>
                      {record.teachingClasses.map((tc) => (
                        <div key={tc.id}>
                          • <strong>{tc.id}</strong>: {tc.name} ({tc.schedule || (isEnglish ? 'No schedule' : 'Chưa có lịch')})
                        </div>
                      ))}
                    </div>
                  }
                >
                  <Tag
                    color="purple"
                    style={{
                      fontSize: 10,
                      margin: 0,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: '1px solid #d3adf7',
                      fontWeight: 500,
                    }}
                  >
                    👨‍🏫 {record.teachingClasses.length} {isEnglish ? (record.teachingClasses.length > 1 ? 'classes' : 'class') : 'lớp phụ trách'}
                  </Tag>
                </Tooltip>
              </div>
            )}
          </div>
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
      width: 90,
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
              />
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
      scroll={{ x: 960 }}
    />
  );
};
