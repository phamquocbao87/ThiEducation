import React, { useState, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Alert,
  Space,
  Tag,
  Typography,
  Divider,
  Avatar,
} from 'antd';
import {
  LoginOutlined,
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import {
  ROLE_DEFAULT_ERP_ROUTE,
  ROLE_WORKSPACE_DESCRIPTIONS,
  SITE_DOMAINS,
} from '../../../core/config/siteConfig';

const { Text } = Typography;

export const SystemLoginModal = ({
  open,
  language,
  onCancel,
  onLoginSuccess,
}) => {
  const { allSystemUsers, authenticatedUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(authenticatedUser?.id || 'ADM001');

  const selectedAccount = useMemo(() => {
    return allSystemUsers.find((u) => u.id === selectedUserId) || allSystemUsers[0];
  }, [allSystemUsers, selectedUserId]);

  const roleMeta = PermissionService.ROLE_METADATA[selectedAccount.role] || {
    color: 'blue',
    shortLabel: selectedAccount.role.toUpperCase(),
  };

  const targetSlug = ROLE_DEFAULT_ERP_ROUTE[selectedAccount.role] || 'dashboard';
  const workspaceDesc =
    (ROLE_WORKSPACE_DESCRIPTIONS[language] || ROLE_WORKSPACE_DESCRIPTIONS.en)[
      selectedAccount.role
    ] || '';

  const handleFinishLogin = () => {
    onLoginSuccess(selectedAccount.id);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={540}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 20 }} />
          <Text strong style={{ fontSize: 16 }}>
            {language === 'en'
              ? 'Login to LAK EDUCATION ERP Portal (erp.lakeducation.edu.vn)'
              : 'Đăng Nhập Hệ Thống Vận Hành Nội Bộ (erp.lakeducation.edu.vn)'}
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
            ? 'After signing in, the system automatically identifies your Role (Admin, Director, Academic, Teacher, Accountant, or Student) and directs you to your corresponding ERP workspace.'
            : 'Sau khi đăng nhập thành công, hệ thống tự động xác định Vai trò (Role) của tài khoản và chuyển thẳng vào màn hình nghiệp vụ tương ứng bên hệ thống ERP nội bộ.'
        }
      />

      <Form layout="vertical" onFinish={handleFinishLogin}>
        <Form.Item
          label={
            <Text strong>
              {language === 'en'
                ? 'Select Account to Sign In (All 16 System Users across 6 Roles)'
                : 'Chọn Tài Khoản Đăng Nhập (16 Tài khoản thuộc 6 Vai trò)'}
            </Text>
          }
        >
          <Select
            size="large"
            showSearch
            optionFilterProp="searchLabel"
            value={selectedUserId}
            onChange={setSelectedUserId}
            options={allSystemUsers.map((u) => {
              const meta = PermissionService.ROLE_METADATA[u.role] || {
                color: 'blue',
                shortLabel: u.role.toUpperCase(),
              };
              return {
                value: u.id,
                searchLabel: `${u.name} ${u.id} ${u.email} ${u.role} ${u.roleLabel}`,
                label: (
                  <Space>
                    <Tag color={meta.color} style={{ minWidth: 82, textAlign: 'center', margin: 0 }}>
                      {meta.shortLabel}
                    </Tag>
                    <Text strong>{u.name}</Text>
                    <Tag style={{ margin: 0 }}>{u.id}</Tag>
                  </Space>
                ),
              };
            })}
          />
        </Form.Item>

        <Form.Item label={language === 'en' ? 'Email / Account ID' : 'Email / Mã đăng nhập'}>
          <Input
            size="large"
            prefix={<UserOutlined />}
            value={`${selectedAccount.email} (${selectedAccount.id})`}
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

        {/* Preview Box: Role Resolution & Target ERP Screen */}
        <div
          style={{
            background: '#f0f8ff',
            border: '1px solid #91caff',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <Space align="start" size={12}>
            <Avatar src={selectedAccount.avatar} size={42} icon={<UserOutlined />} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <Text strong style={{ color: '#122B4D' }}>{selectedAccount.name}</Text>
                <Tag color={roleMeta.color} style={{ margin: 0, fontWeight: 700 }}>
                  ROLE: {roleMeta.shortLabel}
                </Tag>
              </div>
              <Text style={{ fontSize: 12.5, color: '#1d39c4', display: 'block', marginBottom: 4 }}>
                <ArrowRightOutlined /> {workspaceDesc}
              </Text>
              <Text type="secondary" style={{ fontSize: 11.5 }}>
                {language === 'en' ? 'Target ERP Route:' : 'Đích chuyển hướng ERP:'}{' '}
                <code>{`${SITE_DOMAINS.ERP_PRODUCTION}/${targetSlug}`}</code>
              </Text>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          icon={<LoginOutlined />}
          style={{
            height: 46,
            fontWeight: 700,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          }}
        >
          {language === 'en'
            ? `Sign In as ${selectedAccount.name} (${roleMeta.shortLabel}) → Enter ERP`
            : `Đăng Nhập (${selectedAccount.name} — ${roleMeta.shortLabel}) → Vào Hệ Thống ERP`}
        </Button>
      </Form>
    </Modal>
  );
};
