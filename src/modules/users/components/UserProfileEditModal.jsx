import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  Avatar,
  Divider,
  Popconfirm,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  DeleteOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StopOutlined,
  GoogleOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import {
  USER_ROLES,
  USER_STATUS,
  ROLE_LABELS,
  ROLE_COLORS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
} from '../models/user.model';
import { PermissionService } from '../../../core/services/PermissionService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const UserProfileEditModal = ({
  open,
  onCancel,
  onSubmit,
  onDelete,
  user,
  currentUser,
}) => {
  const [form] = Form.useForm();
  const currentEmail = Form.useWatch('email', form) || user?.email || '';
  const isGmail = isGmailAddress(currentEmail);

  const canEdit = user ? PermissionService.canEditUser(currentUser, user) : false;
  const canDelete = user ? PermissionService.canDeleteUser(currentUser, user) : false;
  const canChangeStatus = user ? PermissionService.canChangeUserStatus(currentUser, user) : false;
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        role: user.role,
        status: user.status || USER_STATUS.ACTIVE,
        extraInfo: user.extraInfo || '',
      });
    }
  }, [user, open, form]);

  if (!user) return null;

  const handleFinish = (values) => {
    onSubmit(user, values);
  };

  const roleColor = ROLE_COLORS[user.role] || 'blue';
  const isActive = user.status === USER_STATUS.ACTIVE;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={560}
      centered
      styles={{
        body: { padding: '20px 24px 16px' },
      }}
    >
      {/* 1. Header Card với Avatar & Thông tin cơ bản */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <Badge
          dot
          color={isActive ? '#52c41a' : '#ff4d4f'}
          offset={[-4, 44]}
        >
          <Avatar
            key={user.avatar || user.id}
            size={56}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
              {user.name}
            </Title>
            <Tag color="geekblue" style={{ fontWeight: 600 }}>
              {user.code || user.id}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <Tag color={roleColor} style={{ margin: 0 }}>
              {ROLE_LABELS.vi[user.role] || user.role}
            </Tag>
            <Tag
              icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
              color={isActive ? 'success' : 'error'}
              style={{ margin: 0 }}
            >
              {isActive ? 'Đang Hoạt Động' : 'Đã Khóa'}
            </Tag>
          </div>
        </div>
      </div>

      {/* 2. Form chỉnh sửa thông tin hồ sơ */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={!canEdit}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={<Text strong>Họ và Tên</Text>}
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Nhập họ và tên..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label={<Text strong>Địa Chỉ Email</Text>}
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="email@lakeducation.com"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="phoneNumber"
              label={<Text strong>Số Điện Thoại</Text>}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                placeholder="0909 509 116"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="role"
              label={<Text strong>Vai Trò Hệ Thống (Role)</Text>}
              tooltip={isAdmin ? 'Chỉ IT Admin được phép đổi vai trò' : 'Bạn không có quyền đổi vai trò'}
            >
              <Select
                disabled={!isAdmin || user.id === 'ADM001'}
                style={{ borderRadius: 8 }}
              >
                {Object.values(USER_ROLES).map((role) => (
                  <Option key={role} value={role}>
                    {ROLE_LABELS.vi[role]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="status"
              label={<Text strong>Trạng Thái Tài Khoản</Text>}
              tooltip={canChangeStatus ? 'Kích hoạt hoặc Khóa tài khoản' : 'Bạn không có quyền đổi trạng thái'}
            >
              <Select disabled={!canChangeStatus} style={{ borderRadius: 8 }}>
                <Option value={USER_STATUS.ACTIVE}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span>Đang Hoạt Động (Active)</span>
                  </Space>
                </Option>
                <Option value={USER_STATUS.DISABLED}>
                  <Space>
                    <StopOutlined style={{ color: '#ff4d4f' }} />
                    <span>Đã Khóa / Vô Hiệu Hóa (Disabled)</span>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={<Text strong>Phương Thức Đăng Nhập</Text>}>
              <div style={{ paddingTop: 4 }}>
                {isGmail ? (
                  <>
                    <Space size={6}>
                      <Tag icon={<GoogleOutlined />} color="orange">
                        Google OAuth
                      </Tag>
                      <Tag icon={<KeyOutlined />} color="default">
                        Mật khẩu
                      </Tag>
                    </Space>
                    <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>
                      ✨ Gmail: Đăng nhập Google hoặc Mật khẩu
                    </div>
                  </>
                ) : (
                  <>
                    <Space size={6}>
                      <Tag icon={<KeyOutlined />} color="default">
                        Email / Mật khẩu
                      </Tag>
                    </Space>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      🔒 Email công vụ: Đăng nhập bằng Mật khẩu
                    </div>
                  </>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="extraInfo"
          label={<Text strong>Ghi Chú Nghiệp Vụ / Lớp Học / KPI</Text>}
        >
          <TextArea
            rows={2}
            placeholder="Ghi chú trình độ học viên, đơn giá giáo viên hoặc phân công lớp..."
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        {/* Thông tin Meta: Ngày tạo, đăng nhập lần cuối */}
        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            background: '#f1f5f9',
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span>
            <CalendarOutlined style={{ marginRight: 4 }} />
            Tạo ngày: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mặc định'}
          </span>
          <span>
            <SafetyCertificateOutlined style={{ marginRight: 4 }} />
            Đăng nhập cuối: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa có'}
          </span>
        </div>

        {/* Nút hành động ở Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            {canDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(user)}
                style={{ borderRadius: 8 }}
              >
                Xóa Tài Khoản
              </Button>
            )}
          </div>

          <Space>
            <Button onClick={onCancel} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
            {canEdit && (
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                style={{
                  borderRadius: 8,
                  backgroundColor: '#1890ff',
                }}
              >
                Lưu Thay Đổi
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

