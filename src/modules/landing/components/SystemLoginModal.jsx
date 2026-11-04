import React, { useState } from 'react';
import { Modal, Form, Input, Button, Select, Alert, Space, Tag, Typography, Divider } from 'antd';
import {
  LoginOutlined,
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { CORE_ROLE_USERS } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';

const { Text } = Typography;

export const SystemLoginModal = ({
  open,
  language,
  onCancel,
  onLoginSuccess,
}) => {
  const [selectedRoleKey, setSelectedRoleKey] = useState('admin');
  const selectedDemoAccount = CORE_ROLE_USERS[selectedRoleKey] || CORE_ROLE_USERS.admin;

  const handleQuickLogin = () => {
    onLoginSuccess(selectedDemoAccount.id);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 20 }} />
          <Text strong style={{ fontSize: 16 }}>
            {language === 'en'
              ? 'Login to LAK EDUCATION ERP Portal'
              : 'Đăng Nhập Hệ Thống Quản Trị & Đào Tạo LAK EDUCATION'}
          </Text>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          language === 'en'
            ? 'Select your portal role or use your account credentials to enter the LAK EDUCATION ERP System.'
            : 'Chọn tài khoản vai trò hoặc bấm Đăng nhập ngay để vào hệ thống quản trị & học tập LAK EDUCATION.'
        }
      />

      <Form layout="vertical" onFinish={handleQuickLogin}>
        <Form.Item
          label={
            language === 'en'
              ? 'Select System Account / Role (Quick Access)'
              : 'Chọn Tài Khoản Đăng Nhập (Truy Cập Nhanh)'
          }
        >
          <Select
            size="large"
            value={selectedRoleKey}
            onChange={setSelectedRoleKey}
            options={Object.entries(CORE_ROLE_USERS).map(([roleKey, u]) => {
              const meta = PermissionService.ROLE_METADATA[roleKey] || {
                color: 'blue',
                shortLabel: roleKey.toUpperCase(),
              };
              return {
                value: roleKey,
                label: (
                  <Space>
                    <Tag color={meta.color}>{meta.shortLabel}</Tag>
                    <Text strong>{u.name}</Text>
                    <Text type="secondary">({u.email})</Text>
                  </Space>
                ),
              };
            })}
          />
        </Form.Item>

        <Form.Item label="Email / Account ID">
          <Input
            size="large"
            prefix={<UserOutlined />}
            value={selectedDemoAccount.email}
            readOnly
          />
        </Form.Item>

        <Form.Item label={language === 'en' ? 'Password' : 'Mật khẩu'}>
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            defaultValue="lakeducation2026"
          />
        </Form.Item>

        <Divider style={{ margin: '12px 0' }} />

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          icon={<LoginOutlined />}
          style={{
            height: 44,
            fontWeight: 700,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          }}
        >
          {language === 'en'
            ? `Login as ${selectedDemoAccount.name} → Enter ERP`
            : `Đăng Nhập Với Tên ${selectedDemoAccount.name} → Vào Hệ Thống`}
        </Button>
      </Form>
    </Modal>
  );
};

