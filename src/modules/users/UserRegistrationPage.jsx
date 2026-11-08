import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Tag,
  Switch,
  Divider,
  message,
  InputNumber,
  Breadcrumb,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  BookOutlined,
  BankOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  ReloadOutlined,
  HomeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { PermissionService } from '../../core/services/PermissionService';
import { UserService } from './services/UserService';
import {
  USER_ROLES,
  USER_STATUS,
  ROLE_LABELS,
  ROLE_COLORS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
} from './models/user.model';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const UserRegistrationPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Phân quyền tạo tài khoản (memoized để tránh tạo array mới mỗi lần render)
  const allowedRoles = useMemo(
    () => PermissionService.getAllowedCreatableRoles(currentUser?.role || ''),
    [currentUser?.role]
  );
  const canManage = PermissionService.canManageUsers(currentUser?.role || '');

  // Vai trò mặc định ban đầu
  const defaultRole = allowedRoles[allowedRoles.length - 1] || USER_ROLES.STUDENT;

  // Theo dõi giá trị realtime của form
  const watchedEmail = Form.useWatch('email', form) || '';
  const watchedRole = Form.useWatch('role', form) || defaultRole;
  const isGmail = isGmailAddress(watchedEmail);

  // Giá trị mặc định ban đầu (Khởi tạo 1 lần qua initialValues của Ant Design Form)
  const initialValues = useMemo(() => ({
    role: defaultRole,
    status: true,
    password: 'LakEducation@2026',
    gender: 'Nam',
    city: 'TP. Hồ Chí Minh',
    level: 'G1',
    className: 'G1-A',
    tuitionStatus: 'Đã đóng đủ',
    nationality: 'Việt Nam',
    certificate: 'TESOL / CELTA',
    hourlyRate: 450000,
    department: 'Phòng Đào Tạo',
    position: 'Điều phối viên giáo vụ',
  }), [defaultRole]);

  // Kiểm tra quyền truy cập vào trang
  useEffect(() => {
    if (!canManage) {
      message.error('Bạn không có quyền truy cập trang đăng ký tài khoản mới');
      navigate('/user-management');
    }
  }, [canManage, navigate]);

  // Sinh mật khẩu ngẫu nhiên an toàn
  const handleGeneratePassword = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newPass = `LakEdu#${randomSuffix}`;
    form.setFieldsValue({ password: newPass });
    message.info(`Đã tạo mật khẩu ngẫu nhiên: ${newPass}`);
  };

  // Xử lý tạo và đăng ký tài khoản
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const targetRole = values.role;
      const cleanEmail = values.email.trim().toLowerCase();

      const payload = {
        name: values.name.trim(),
        email: cleanEmail,
        phoneNumber: values.phoneNumber?.trim() || '',
        role: targetRole,
        roleLabel: ROLE_LABELS.vi[targetRole] || targetRole,
        password: values.password || 'LakEducation@2026',
        status: values.status ? USER_STATUS.ACTIVE : USER_STATUS.DISABLED,
        authProviders: resolveAuthProvidersByEmail(cleanEmail),
        extraInfo: values.extraInfo || '',
        // Thông tin cá nhân
        gender: values.gender || 'Nam',
        dateOfBirth: values.dateOfBirth ? (typeof values.dateOfBirth.format === 'function' ? values.dateOfBirth.format('DD/MM/YYYY') : String(values.dateOfBirth)) : '',
        idCardNumber: values.idCardNumber || '',
        address: values.address || '',
        city: values.city || 'TP. Hồ Chí Minh',
        // Nghiệp vụ theo role
        className: values.className || '',
        level: values.level || 'G1',
        parentName: values.parentName || '',
        parentPhone: values.parentPhone || '',
        tuitionStatus: values.tuitionStatus || 'Đã đóng đủ',
        academicNotes: values.academicNotes || '',
        nationality: values.nationality || 'Việt Nam',
        certificate: values.certificate || 'TESOL / CELTA',
        hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : 450000,
        assignedClasses: values.assignedClasses || '',
        bio: values.bio || '',
        position: values.position || '',
        department: values.department || '',
      };

      const newUser = await UserService.createUser(currentUser, payload);
      message.success(`Đã tạo & đăng ký tài khoản mới thành công: ${newUser.name} (${newUser.code})`);
      navigate('/user-management');
    } catch (err) {
      if (err.errorFields) {
        message.warning('Vui lòng hoàn thiện đầy đủ các trường thông tin bắt buộc');
      } else {
        message.error(err.message || 'Lỗi khi đăng ký tài khoản mới');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 8px 36px' }}>
      {/* 1. Header Navigation & Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/user-management')}>Quản Trị Người Dùng</a> },
            { title: 'Tạo & Đăng Ký Tài Khoản Mới' },
          ]}
          style={{ marginBottom: 12 }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space size={10}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/user-management')}
              style={{ borderRadius: 8 }}
            >
              Quay Lại Danh Sách
            </Button>
            <div>
              <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserAddOutlined style={{ color: '#1890ff' }} />
                <span>Tạo & Đăng Ký Tài Khoản Mới</span>
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Đăng ký tài khoản và phân quyền truy cập hệ thống LAK EDUCATION theo 6 Role RBAC
              </Text>
            </div>
          </Space>

          <Space size={10}>
            <Button
              onClick={() => navigate('/user-management')}
              style={{ borderRadius: 8 }}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={submitting}
              onClick={handleSubmit}
              style={{
                borderRadius: 8,
                backgroundColor: '#1890ff',
                boxShadow: '0 2px 8px rgba(24,144,255,0.35)',
                fontWeight: 600,
              }}
            >
              Tạo & Kích Hoạt Tài Khoản
            </Button>
          </Space>
        </div>
      </div>

      {/* 2. Thông Báo Đặc Quyền RBAC */}
      <Alert
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined style={{ color: '#1890ff' }} />}
        style={{
          marginBottom: 20,
          borderRadius: 10,
          border: '1px solid #bae0ff',
          backgroundColor: '#e6f4ff',
        }}
        message={
          currentUser?.role === 'admin'
            ? 'Đặc quyền IT Admin: Bạn có toàn quyền cấp tài khoản cho mọi vị trí trong hệ thống (Giám đốc, Admin, Giáo vụ, Giáo viên, Kế toán, Học viên).'
            : 'Đặc quyền Ban Điều Hành / Giáo Vụ: Bạn được phép cấp tài khoản cho Giáo vụ, Giáo viên và Học viên mới.'
        }
      />

      <Form form={form} layout="vertical" initialValues={initialValues} scrollToFirstError>
        {/* 3. Khối 1: Thông Tin Tài Khoản & Đăng Nhập */}
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 700 }}>1. Thông Tin Tài Khoản & Phân Quyền (Bắt Buộc)</span>
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label={<Text strong>Vai Trò Phân Quyền (Role RBAC)</Text>}
                rules={[{ required: true, message: 'Vui lòng chọn vai trò phân quyền' }]}
              >
                <Select
                  size="large"
                  placeholder="Chọn vai trò"
                  style={{ width: '100%', borderRadius: 8 }}
                  options={allowedRoles.map((role) => ({
                    value: role,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={ROLE_COLORS[role]} style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
                          {role.toUpperCase()}
                        </Tag>
                        <span>{ROLE_LABELS.vi[role] || role}</span>
                      </div>
                    ),
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label={<Text strong>Họ và Tên Đầy Đủ</Text>}
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="VD: Nguyễn Văn An"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label={<Text strong>Địa Chỉ Email Đăng Nhập</Text>}
                rules={[
                  { required: true, message: 'Vui lòng nhập địa chỉ email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
                extra={
                  watchedEmail ? (
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
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>
                      Gmail: Google hoặc Mật khẩu • Email khác: Mật khẩu
                    </span>
                  )
                }
              >
                <Input
                  size="large"
                  prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="email@gmail.com hoặc staff@lakeducation.com"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>Mật Khẩu Khởi Tạo</Text>
                    <a
                      onClick={handleGeneratePassword}
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ReloadOutlined /> Sinh ngẫu nhiên
                    </a>
                  </div>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu khởi tạo' },
                  { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                ]}
                extra={<span style={{ color: '#94a3b8', fontSize: 12 }}>Mặc định khuyến nghị: LakEducation@2026</span>}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="LakEducation@2026"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="phoneNumber"
                label={<Text strong>Số Điện Thoại Liên Hệ</Text>}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="0909 509 116"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="status"
                label={<Text strong>Trạng Thái Tài Khoản</Text>}
                valuePropName="checked"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                  <Switch defaultChecked />
                  <Text type="secondary" style={{ fontSize: 13 }}>Kích hoạt ngay sau khi tạo</Text>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 4. Khối 2: Thông Tin Cá Nhân & Căn Cước */}
        <Card
          title={
            <Space>
              <IdcardOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontWeight: 700 }}>2. Thông Tin Cá Nhân & Liên Lạc</span>
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={8}>
              <Form.Item name="gender" label={<Text strong>Giới Tính</Text>}>
                <Select placeholder="Chọn giới tính" style={{ borderRadius: 8 }}>
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="dateOfBirth" label={<Text strong>{isEnglish ? 'Date of Birth' : 'Ngày Sinh'}</Text>}>
                <DatePicker
                  format={isEnglish ? ['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'] : ['DD/MM/YYYY', 'YYYY-MM-DD']}
                  placeholder={isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                  style={{ width: '100%', borderRadius: 8 }}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="idCardNumber" label={<Text strong>Số CMND / CCCD / Mã Định Danh</Text>}>
                <Input
                  prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="079201004567"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} sm={16}>
              <Form.Item name="address" label={<Text strong>Địa Chỉ Thường Trú</Text>}>
                <Input
                  prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="VD: 123 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="city" label={<Text strong>Tỉnh / Thành Phố</Text>}>
                <Input placeholder="TP. Hồ Chí Minh" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 5. Khối 3: Nghiệp Vụ Chuyên Biệt Theo Vai Trò (Dynamic) */}
        {watchedRole === USER_ROLES.STUDENT && (
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: 700 }}>3. Thông Tin Học Vụ & Phụ Huynh (Dành Cho Học Viên)</span>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #52c41a',
            }}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="className" label={<Text strong>Lớp Học Dự Kiến</Text>}>
                  <Input placeholder="VD: G1-A, G2-B" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="level" label={<Text strong>Cấp Độ (Level)</Text>}>
                  <Select placeholder="Chọn Level" style={{ borderRadius: 8 }}>
                    <Option value="GK">GK (Mầm non)</Option>
                    <Option value="G1">G1 (Lớp 1)</Option>
                    <Option value="G2">G2 (Lớp 2)</Option>
                    <Option value="G3">G3 (Lớp 3)</Option>
                    <Option value="G4">G4 (Lớp 4)</Option>
                    <Option value="G5">G5 (Lớp 5)</Option>
                    <Option value="IELTS">IELTS Foundation</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="parentName" label={<Text strong>Họ Tên Phụ Huynh</Text>}>
                  <Input placeholder="VD: Trần Thị Mai" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="parentPhone" label={<Text strong>SĐT Phụ Huynh</Text>}>
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="0918 123 456"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item name="tuitionStatus" label={<Text strong>Trạng Thái Học Phí Khởi Tạo</Text>}>
                  <Select style={{ borderRadius: 8 }}>
                    <Option value="Đã đóng đủ">Đã đóng đủ học phí</Option>
                    <Option value="Chờ đối soát">Chờ đối soát kế toán</Option>
                    <Option value="Chưa hoàn thành">Chưa hoàn thành</Option>
                    <Option value="Miễn giảm">Học bổng / Miễn giảm</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="academicNotes" label={<Text strong>Ghi Chú Học Vụ Ban Đầu</Text>}>
                  <Input placeholder="VD: Cần hỗ trợ thêm kỹ năng Speaking..." style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {watchedRole === USER_ROLES.TEACHER && (
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 700 }}>3. Chuyên Môn Giảng Dạy & Hợp Đồng (Dành Cho Giáo Viên)</span>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
            }}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="nationality" label={<Text strong>Quốc Tịch</Text>}>
                  <Input placeholder="VD: Mỹ (US), Việt Nam" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="certificate" label={<Text strong>Bằng Cấp / Chứng Chỉ</Text>}>
                  <Input placeholder="VD: TESOL, CELTA, DELTA" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="hourlyRate" label={<Text strong>Đơn Giá Dạy / Giờ (VNĐ)</Text>}>
                  <InputNumber
                    style={{ width: '100%', borderRadius: 8 }}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                    placeholder="450,000"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="assignedClasses" label={<Text strong>Các Lớp Phân Công</Text>}>
                  <Input placeholder="VD: GK-A, G1-B" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="bio" label={<Text strong>Tóm Tắt Kinh Nghiệm Giảng Dạy (Bio)</Text>}>
              <TextArea rows={2} placeholder="Kinh nghiệm giảng dạy, trường đại học đã tốt nghiệp..." style={{ borderRadius: 8 }} />
            </Form.Item>
          </Card>
        )}

        {(watchedRole === USER_ROLES.ACADEMIC ||
          watchedRole === USER_ROLES.ACCOUNTANT ||
          watchedRole === USER_ROLES.DIRECTOR ||
          watchedRole === USER_ROLES.ADMIN) && (
          <Card
            title={
              <Space>
                <BankOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 700 }}>3. Vị Trí Công Tác & Tổ Chức (Cán Bộ / Nhân Sự)</span>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #722ed1',
            }}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item name="position" label={<Text strong>Chức Danh / Vị Trí Công Tác</Text>}>
                  <Input placeholder="VD: Điều phối viên học vụ, Kế toán trưởng..." style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="department" label={<Text strong>Phòng Ban Trực Thuộc</Text>}>
                  <Input placeholder="VD: Phòng Đào Tạo, Ban Giám Đốc, Phòng Kế Toán..." style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {/* 6. Khối 4: Ghi Chú & Điều Khoản Nội Bộ */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: '#fa8c16' }} />
              <span style={{ fontWeight: 700 }}>4. Ghi Chú Nghiệp Vụ Chung</span>
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Form.Item
            name="extraInfo"
            label={<Text strong>Ghi Chú Nội Bộ / KPI / Điều Kiện Đặc Biệt</Text>}
          >
            <TextArea
              rows={3}
              placeholder="Nhập các lưu ý đặc biệt về học phí, cam kết phụ huynh hoặc ghi chú nhân sự..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Card>

        {/* 7. Bottom Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 0',
          }}
        >
          <Button
            size="large"
            onClick={() => navigate('/user-management')}
            style={{ borderRadius: 8, minWidth: 120 }}
          >
            Hủy Bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            onClick={handleSubmit}
            style={{
              borderRadius: 8,
              minWidth: 200,
              backgroundColor: '#1890ff',
              boxShadow: '0 4px 12px rgba(24,144,255,0.4)',
              fontWeight: 700,
            }}
          >
            Tạo & Kích Hoạt Tài Khoản
          </Button>
        </div>
      </Form>
    </div>
  );
};

