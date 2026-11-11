import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  Badge,
  Button,
  Typography,
  List,
  Tag,
  Space,
  Segmented,
  Empty,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  UserAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NOTIFICATION_TYPES } from '../services/NotificationService';

const { Text, Paragraph } = Typography;

const formatRelativeTime = (isoDate, isEnglish) => {
  if (!isoDate) return '';
  const now = new Date();
  const date = new Date(isoDate);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return isEnglish ? 'Just now' : 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isEnglish ? `${diffMin}m ago` : `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return isEnglish ? `${diffHour}h ago` : `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return isEnglish ? 'Yesterday' : 'Hôm qua';
  if (diffDay < 7) return isEnglish ? `${diffDay}d ago` : `${diffDay} ngày trước`;

  return date.toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN');
};

const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.TEACHER_APPLY_REQUEST:
      return <UserAddOutlined style={{ color: '#d97706', fontSize: 16 }} />;
    case NOTIFICATION_TYPES.STUDENT_ENROLL_REQUEST:
      return <TeamOutlined style={{ color: '#0284c7', fontSize: 16 }} />;
    case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
      return <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 16 }} />;
    case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
      return <CloseCircleOutlined style={{ color: '#dc2626', fontSize: 16 }} />;
    case NOTIFICATION_TYPES.SCHEDULE_CHANGED:
      return <ClockCircleOutlined style={{ color: '#7c3aed', fontSize: 16 }} />;
    case NOTIFICATION_TYPES.TUITION_DUE_REMINDER:
    case NOTIFICATION_TYPES.TUITION_PAYMENT_CONFIRMED:
      return <DollarOutlined style={{ color: '#ea580c', fontSize: 16 }} />;
    case NOTIFICATION_TYPES.PAYROLL_DISBURSED:
      return <CalendarOutlined style={{ color: '#2563eb', fontSize: 16 }} />;
    default:
      return <InfoCircleOutlined style={{ color: '#64748b', fontSize: 16 }} />;
  }
};

export const NotificationBellPopover = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread'
  const isAdmin = currentUser?.role === 'admin';

  const displayedList =
    filterMode === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setOpen(false);

    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const popoverContent = (
    <div
      data-testid="notification-popover-list"
      style={{ width: isMobile ? 320 : 390, maxHeight: 540, display: 'flex', flexDirection: 'column' }}
    >
      {/* 1. Header Popover */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 10,
          borderBottom: '1px solid #f1f5f9',
          marginBottom: 10,
        }}
      >
        <Space size={6}>
          <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
            {isEnglish ? 'Notifications' : 'Thông Báo'}
          </Text>
          {unreadCount > 0 && (
            <Tag color="red" style={{ borderRadius: 10, fontWeight: 700, margin: 0, fontSize: 11 }}>
              {unreadCount} {isEnglish ? 'new' : 'mới'}
            </Tag>
          )}
        </Space>

        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            data-testid="notification-mark-all-read"
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
            style={{ fontSize: 12, padding: 0, fontWeight: 500 }}
          >
            {isEnglish ? 'Mark all as read' : 'Đã đọc tất cả'}
          </Button>
        )}
      </div>

      {/* 2. Bộ Lọc: Tất cả vs Chưa đọc */}
      <Segmented
        size="small"
        value={filterMode}
        onChange={(val) => setFilterMode(val)}
        options={[
          { label: isEnglish ? 'All' : 'Tất cả', value: 'all' },
          {
            label: isEnglish ? `Unread (${unreadCount})` : `Chưa đọc (${unreadCount})`,
            value: 'unread',
          },
        ]}
        style={{ marginBottom: 10, width: '100%' }}
        block
      />

      {/* 3. Danh Sách Thông Báo Cuộn */}
      <div style={{ overflowY: 'auto', maxHeight: 400, paddingRight: 4 }}>
        {displayedList.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {filterMode === 'unread'
                    ? (isEnglish ? 'No unread notifications' : 'Không có thông báo chưa đọc')
                    : (isEnglish ? 'No notifications yet' : 'Chưa có thông báo nào')}
                </Text>
              }
            />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={displayedList}
            renderItem={(item) => (
              <div
                key={item.id}
                data-testid={`notification-item-${item.id}`}
                onClick={() => handleNotificationClick(item)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 6,
                  background: item.isRead ? '#ffffff' : '#f0f9ff',
                  border: item.isRead ? '1px solid #f1f5f9' : '1px solid #bae6fd',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  position: 'relative',
                }}
              >
                <div style={{ marginTop: 2 }}>{getNotificationIcon(item.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Text
                      strong={!item.isRead}
                      style={{
                        fontSize: 13,
                        color: item.isRead ? '#334155' : '#0369a1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </Text>
                    {!item.isRead && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ margin: '2px 0 4px', fontSize: 12, lineHeight: 1.4, color: '#475569' }}
                  >
                    {item.message}
                  </Paragraph>

                  {/* 4. Dòng Audit Trail dành riêng cho IT Admin */}
                  {isAdmin && (
                    <div
                      data-testid="notification-admin-audit"
                      style={{
                        fontSize: 10.5,
                        color: '#64748b',
                        background: '#f8fafc',
                        border: '1px dashed #e2e8f0',
                        borderRadius: 4,
                        padding: '2px 6px',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <SafetyCertificateOutlined style={{ color: '#0284c7', marginRight: 4 }} />
                        {isEnglish ? 'From:' : 'Khởi tạo:'}{' '}
                        <strong>{item.createdByName || 'Hệ thống'}</strong> ({item.createdBy || 'SYS'})
                      </span>
                      <span style={{ flexShrink: 0 }}>
                        • {isEnglish ? 'Read:' : 'Đã đọc:'} {(item.readBy || []).length}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 11, color: '#94a3b8' }}>
                      {formatRelativeTime(item.createdAt, isEnglish)}
                    </Text>
                    <Tooltip title={isEnglish ? 'Delete' : 'Xóa'}>
                      <DeleteOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayStyle={{ zIndex: 1050 }}
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        size="small"
        offset={[-4, 4]}
        data-testid="notification-bell-badge"
      >
        <Button
          type="text"
          shape="circle"
          data-testid="notification-bell-trigger"
          icon={<BellOutlined style={{ fontSize: isMobile ? 18 : 19, color: unreadCount > 0 ? '#38bdf8' : '#ffffff' }} />}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: unreadCount > 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
          }}
          title={isEnglish ? 'Notifications' : 'Thông báo hệ thống'}
        />
      </Badge>
    </Popover>
  );
};
