import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  Button,
  Typography,
  Avatar,
  Tag,
} from 'antd';
import {
  ExclamationCircleFilled,
  DeleteOutlined,
} from '@ant-design/icons';
import { ROLE_COLORS, ROLE_LABELS } from '../models/user.model';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

const { Text, Title } = Typography;
const { TextArea } = Input;

export const UserDeleteModal = ({
  open,
  user,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setErrorMsg('');
    }
  }, [open, user]);

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] || 'blue';
  const isValidReason = reason.trim().length >= 3;

  const handleConfirm = () => {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setErrorMsg('Vui lòng nhập lý do xóa tài khoản.');
      return;
    }
    if (cleanReason.length < 3) {
      setErrorMsg('Lý do xóa cần tối thiểu 3 ký tự.');
      return;
    }
    onConfirm(user, cleanReason);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
      centered
      styles={{
        body: { padding: '24px 24px 20px' },
      }}
    >
      {/* 1. Tiêu đề Xác Nhận Xóa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <ExclamationCircleFilled style={{ color: '#ff4d4f', fontSize: 24 }} />
        <div>
          <Title level={4} style={{ margin: 0, color: '#dc2626' }}>
            Xác Nhận Xóa Tài Khoản
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tài khoản này sẽ bị xóa và ngừng quyền truy cập vào hệ thống
          </Text>
        </div>
      </div>

      {/* 2. Thẻ tóm tắt tài khoản mục tiêu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <Avatar
          key={user.avatar || user.id}
          size={48}
          src={DriveStorageService.formatAvatarUrl(user.avatar, 200)}
          style={{
            border: '2px solid #ef4444',
            backgroundColor: '#fee2e2',
          }}
        >
          {user.name ? user.name.substring(0, 2).toUpperCase() : 'LK'}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: 15, color: '#991b1b' }}>
              {user.name}
            </Text>
            <Tag color="geekblue" style={{ margin: 0, fontWeight: 600 }}>
              {user.code || user.id}
            </Tag>
          </div>
          <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 2 }}>
            {user.email}
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag color={roleColor} style={{ margin: 0 }}>
              {ROLE_LABELS.vi[user.role] || user.role}
            </Tag>
          </div>
        </div>
      </div>

      {/* 3. Textbox Nhập Lý Do Xóa */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 6 }}>
          <Text strong style={{ color: '#1e293b' }}>
            Lý do xóa tài khoản <span style={{ color: '#ef4444' }}>*</span>
          </Text>
        </div>
        <TextArea
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder="Nhập lý do xóa (ví dụ: Học viên đã thôi học / hoàn tất khóa, Nhân sự nghỉ việc, Tạo nhầm...)"
          style={{ borderRadius: 8 }}
          maxLength={300}
          showCount
        />
        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* 4. Nút Hành Động Ở Chân Modal */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button onClick={onCancel} style={{ borderRadius: 8 }}>
          Hủy Bỏ
        </Button>
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          loading={loading}
          disabled={!isValidReason}
          onClick={handleConfirm}
          style={{ borderRadius: 8 }}
        >
          Xác Nhận Xóa
        </Button>
      </div>
    </Modal>
  );
};
