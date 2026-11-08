import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Alert,
  Row,
  Col,
  Space,
  Tag,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
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

const { Option } = Select;

export const UserFormModal = ({
  open,
  onCancel,
  onSubmit,
  currentUser,
}) => {
  const [form] = Form.useForm();
  const emailValue = Form.useWatch('email', form);
  const isGmail = isGmailAddress(emailValue);

  // Lọc danh sách Role được phép tạo dựa theo quyền của người đăng nhập (memoized)
  const allowedRoles = useMemo(
    () => PermissionService.getAllowedCreatableRoles(currentUser?.role || ''),
    [currentUser?.role]
  );

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        role: allowedRoles[allowedRoles.length - 1] || USER_ROLES.STUDENT,
        status: true,
      });
    }
  }, [open]);

  const handleFinish = async (values) => {
    const payload = {
      name: values.name,
      email: values.email,
      phoneNumber: values.phoneNumber,
      role: values.role,
      password: values.password || 'LakEducation@2026',
      status: values.status ? USER_STATUS.ACTIVE : USER_STATUS.DISABLED,
      authProviders: resolveAuthProvidersByEmail(values.email),
      extraInfo: values.extraInfo || '',
    };
    const success = await onSubmit(payload);
    if (success) {
      form.resetFields();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span>Tạo & Đăng Ký Tài Khoản Mới</span>
        </Space>
      }
      okText="Xác Nhận Tạo Tài Khoản"
      cancelText="Hủy"
      width={560}
      centered
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message={
          currentUser.role === 'admin'
            ? 'Đặc quyền Admin: Bạn có thể tạo tài khoản cho mọi vị trí (Giám đốc, Admin, Giáo vụ, Giáo viên, Kế toán, Học viên).'
            : 'Đặc quyền Giáo vụ: Bạn được phép tạo tài khoản Giáo vụ, Giáo viên và Học viên (Không thể tạo Admin/Giám đốc).'
        }
      />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={14}>
            <Form.Item
              name="name"
              label="Họ và Tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="VD: Nguyễn Văn An"
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="role"
              label="Vai Trò (Role Phân Quyền)"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
            >
              <Select placeholder="Chọn vai trò">
                {allowedRoles.map((role) => (
                  <Option key={role} value={role}>
                    <Tag color={ROLE_COLORS[role]} style={{ marginRight: 6 }}>
                      {role.toUpperCase()}
                    </Tag>
                    {ROLE_LABELS.vi[role] || role}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={14}>
            <Form.Item
              name="email"
              label="Email Đăng Nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không đúng định dạng' },
              ]}
              extra={
                emailValue ? (
                  isGmail ? (
                    <span style={{ color: '#d97706', fontSize: 12 }}>
                      ✨ <b>Gmail:</b> Đăng nhập Google hoặc Mật khẩu
                    </span>
                  ) : (
                    <span style={{ color: '#475569', fontSize: 12 }}>
                      🔒 <b>Email công vụ:</b> Đăng nhập bằng Mật khẩu
                    </span>
                  )
                ) : (
                  'Gmail: Google hoặc Mật khẩu • Email khác: Mật khẩu'
                )
              }
            >
              <Input
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="VD: an.student@gmail.com hoặc staff@lakeducation.com"
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="phoneNumber" label="Số Điện Thoại">
              <Input
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="0909 509 116"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={14}>
            <Form.Item
              name="password"
              label="Mật Khẩu Khởi Tạo"
              extra="Mặc định: LakEducation@2026 (Người dùng có thể đổi sau)"
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="LakEducation@2026"
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="status"
              label="Trạng Thái Tài Khoản"
              valuePropName="checked"
            >
              <Switch checkedChildren="Kích Hoạt Ngay" unCheckedChildren="Tạm Khóa" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="extraInfo" label="Thông Tin Bổ Sung / Lớp Học / Chức Vụ">
          <Input placeholder="VD: Lớp IELTS Foundation K02 | Phụ huynh: Anh Tuấn" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

