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
  GlobalOutlined,
  TeamOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { PermissionService } from '../../core/services/PermissionService';
import { UserService } from './services/UserService';
import { findScheduleConflictsInClassList } from '../../shared/utils/scheduleUtils';
import {
  USER_ROLES,
  USER_STATUS,
  ROLE_LABELS,
  ROLE_COLORS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
  toEnglishName,
  generateFamilyId,
  normalizePhoneNumber,
} from './models/user.model';

export const DEFAULT_ACTIVE_CLASSES = [
  {
    id: 'LH001',
    name: 'Wonders G1 - Lớp Khởi Động Sáng Tạo (Zoom)',
    courseId: 'KH-WONDERS-G1',
    courseLevel: 'WONDERS-G1',
    schedule: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
    teacherName: 'Mr. David Smith (USA 🇺🇸)',
    studentIds: [],
  },
  {
    id: 'LH002',
    name: 'Wonders G1 - Lớp Nâng Cao Buổi Chiều (Zoom)',
    courseId: 'KH-WONDERS-G1',
    courseLevel: 'WONDERS-G1',
    schedule: 'Thứ 3, Thứ 5 (18:00 - 19:30)',
    teacherName: 'Ms. Sarah Connor (UK 🇬🇧)',
    studentIds: [],
  },
  {
    id: 'LH003',
    name: 'Wonders G2 - Khám Phá Thế Giới (Zoom)',
    courseId: 'KH-WONDERS-G2',
    courseLevel: 'WONDERS-G2',
    schedule: 'Thứ 6, Chủ Nhật (19:30 - 21:00)',
    teacherName: 'Mr. John Williams (Canada 🇨🇦)',
    studentIds: [],
  },
  {
    id: 'LH004',
    name: 'Wonders G4 - Đọc Sâu & Viết Luận (Zoom)',
    courseId: 'KH-WONDERS-G4',
    courseLevel: 'WONDERS-G4',
    schedule: 'Thứ 7, Chủ Nhật (09:00 - 10:30)',
    teacherName: 'Ms. Emma Watson (UK 🇬🇧)',
    studentIds: [],
  },
  {
    id: 'LH005',
    name: 'Wonders G1 - Lớp Tăng Tốc (Zoom Trùng Giờ LH001)',
    courseId: 'KH-WONDERS-G1',
    courseLevel: 'WONDERS-G1',
    schedule: 'Thứ 2, Thứ 4 (18:30 - 20:00)',
    teacherName: 'Mr. Robert Brown (Australia 🇦🇺)',
    studentIds: [],
  },
];

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const UserRegistrationPage = () => {
  const navigate = useNavigate();
  const { currentUser, allSystemUsers } = useAuth();
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

  // Danh sách các lớp học đang hoạt động trong hệ thống
  const [availableClasses] = useState(() => {
    try {
      const saved = localStorage.getItem('lak_erp_classes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ACTIVE_CLASSES;
  });

  // Theo dõi giá trị realtime của form
  const watchedEmail = Form.useWatch('email', form) || '';
  const watchedRole = Form.useWatch('role', form) || defaultRole;
  const watchedPhone = Form.useWatch('phoneNumber', form) || '';
  const watchedSecondaryPhone = Form.useWatch('secondaryPhone', form) || '';
  const watchedEnrolledClassIds = Form.useWatch('enrolledClassIds', form) || [];
  const isTargetStudent = watchedRole === USER_ROLES.STUDENT;
  const isGmail = isGmailAddress(watchedEmail);

  // Kiểm tra trùng lịch học online thời gian thực
  const scheduleConflictInfo = useMemo(() => {
    return findScheduleConflictsInClassList(watchedEnrolledClassIds, availableClasses);
  }, [watchedEnrolledClassIds, availableClasses]);

  // Cấp độ tự động nhận diện theo các lớp học đã chọn
  const derivedLevels = useMemo(() => {
    if (!watchedEnrolledClassIds || watchedEnrolledClassIds.length === 0) return [];
    const set = new Set();
    watchedEnrolledClassIds.forEach((clsId) => {
      const cls = availableClasses.find((c) => c.id === clsId || c.classId === clsId);
      if (cls) {
        const lvl = cls.courseLevel || cls.level || cls.courseName || 'Wonders G1';
        set.add(lvl);
      }
    });
    return Array.from(set);
  }, [watchedEnrolledClassIds, availableClasses]);

  // Tự động đồng bộ Số Điện Thoại Phụ Huynh mặc định bằng Số Điện Thoại 1 chính
  useEffect(() => {
    if (isTargetStudent && watchedPhone) {
      const currentParent = form.getFieldValue('parentPhone');
      if (!currentParent || currentParent === watchedPhone) {
        form.setFieldsValue({ parentPhone: watchedPhone });
      }
    }
  }, [watchedPhone, isTargetStudent, form]);

  // Tự động nhận diện Cụm gia đình (anh/chị/em ruột) qua SĐT chính & SĐT phụ
  const [detectedSiblings, setDetectedSiblings] = useState([]);
  useEffect(() => {
    let active = true;
    const checkSiblings = async () => {
      const p1 = normalizePhoneNumber(watchedPhone);
      const p2 = normalizePhoneNumber(watchedSecondaryPhone);
      if (!isTargetStudent || (!p1 && !p2)) {
        if (active) setDetectedSiblings([]);
        return;
      }
      try {
        const found = [];
        if (p1) {
          const list1 = await UserService.findStudentsByParentPhone(p1);
          found.push(...list1);
        }
        if (p2) {
          const list2 = await UserService.findStudentsByParentPhone(p2);
          found.push(...list2);
        }
        const unique = [];
        const seen = new Set();
        for (const s of found) {
          const sid = s.firestoreDocId || s.id || s.code;
          if (sid && !seen.has(sid)) {
            seen.add(sid);
            unique.push(s);
          }
        }
        if (active) setDetectedSiblings(unique);
      } catch {
        if (active) setDetectedSiblings([]);
      }
    };
    const t = setTimeout(checkSiblings, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [watchedPhone, watchedSecondaryPhone, isTargetStudent]);

  // Chốt chặn an ninh: Phát hiện SĐT thuộc Cán bộ / Lãnh đạo khi người tạo không phải Admin
  const detectedStaffOwner = useMemo(() => {
    const p1 = normalizePhoneNumber(watchedPhone);
    if (!p1 || !allSystemUsers) return null;
    const actorId = (currentUser?.id || currentUser?.code || '').toUpperCase();
    const isActorAdmin = currentUser?.role === 'admin' || actorId === 'ADM001';
    if (isActorAdmin) return null; // Admin tối cao được phép

    const staffMatch = allSystemUsers.find((u) => {
      if (u.isDeleted || u.role === USER_ROLES.STUDENT) return false;
      const uPhone = normalizePhoneNumber(u.phoneNumber);
      return uPhone && uPhone === p1;
    });

    if (staffMatch) {
      const staffId = (staffMatch.id || staffMatch.code || '').toUpperCase();
      if (actorId && actorId === staffId) return null; // Chính Cán bộ đó được phép
      return staffMatch;
    }
    return null;
  }, [watchedPhone, allSystemUsers, currentUser]);

  // Giá trị mặc định ban đầu (Khởi tạo 1 lần qua initialValues của Ant Design Form)
  const initialValues = useMemo(() => ({
    role: defaultRole,
    status: true,
    password: 'LakEducation@2026',
    gender: 'Nam',
    city: 'TP. Hồ Chí Minh',
    enrolledClassIds: [],
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
      const cleanEmail = values.email ? values.email.trim().toLowerCase() : '';
      const cleanPhone = normalizePhoneNumber(values.phoneNumber);
      const cleanSecondary = normalizePhoneNumber(values.secondaryPhone);
      const cleanEnglish = (values.englishName || toEnglishName(values.name)).trim();

      // 0. Chốt chặn bảo mật: Nếu SĐT thuộc Cán bộ mà người tạo không có thẩm quyền
      if (detectedStaffOwner) {
        throw new Error(
          `CẢNH BÁO BẢO MẬT: Số điện thoại '${cleanPhone}' thuộc về Cán bộ/Lãnh đạo ${detectedStaffOwner.name} (${detectedStaffOwner.roleLabel || detectedStaffOwner.role}). Bạn không có quyền sử dụng số điện thoại của Cán bộ để đăng ký tài khoản.`
        );
      }

      // 1. Kiểm tra Số điện thoại 1 (Chính) bắt buộc cho mọi tài khoản
      if (!cleanPhone) {
        throw new Error('Số điện thoại 1 (Chính) là thông tin bắt buộc đối với tất cả các tài khoản.');
      }

      // 2. Tên Tiếng Anh (English Name) là BẮT BUỘC cho tất cả các tài khoản
      if (!cleanEnglish) {
        throw new Error('Tên tiếng Anh (English Name) là thông tin bắt buộc.');
      }

      // 3. Cán bộ / GV bắt buộc Email, Học viên cho phép để trống nếu đã có SĐT
      if (targetRole !== USER_ROLES.STUDENT && !cleanEmail) {
        throw new Error(`Tài khoản vai trò '${ROLE_LABELS.vi[targetRole] || targetRole}' bắt buộc phải có địa chỉ Email công vụ.`);
      }

      // 4. Chốt chặn va chạm lịch học: Không cho phép đăng ký nếu có lớp trùng khung giờ học online
      if (targetRole === USER_ROLES.STUDENT && scheduleConflictInfo.hasConflict) {
        throw new Error(
          `Không thể tạo tài khoản do trùng khung giờ học online giữa các lớp đã chọn: ${scheduleConflictInfo.conflicts.map((c) => c.message).join(' | ')}`
        );
      }

      // 5. Xác định Cụm Gia Đình (Family Cluster):
      // Ưu tiên liên kết với familyId của anh/chị/em ruột đã có trong hệ thống
      let resolvedFamilyId = '';
      if (targetRole === USER_ROLES.STUDENT) {
        const siblingWithFamily = detectedSiblings.find((s) => s.familyId);
        resolvedFamilyId = siblingWithFamily ? siblingWithFamily.familyId : generateFamilyId(cleanPhone);
      }

      const enrolledClasses = targetRole === USER_ROLES.STUDENT ? watchedEnrolledClassIds : [];
      const resolvedClassName = targetRole === USER_ROLES.STUDENT
        ? enrolledClasses
            .map((cid) => {
              const c = availableClasses.find((cls) => cls.id === cid || cls.classId === cid);
              return c ? c.name : cid;
            })
            .join(', ') || ''
        : values.className || '';
      const resolvedLevel = targetRole === USER_ROLES.STUDENT
        ? (derivedLevels.join(', ') || 'Wonders ELA')
        : (values.level || 'G1');

      const payload = {
        name: values.name.trim(),
        englishName: cleanEnglish,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        secondaryPhone: cleanSecondary || '',
        familyId: resolvedFamilyId,
        parentUserId: values.parentUserId || '',
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
        className: resolvedClassName,
        enrolledClassIds: enrolledClasses,
        level: resolvedLevel,
        parentName: values.parentName || '',
        parentPhone: values.parentPhone || cleanPhone,
        tuitionStatus: targetRole === USER_ROLES.STUDENT ? 'Chờ đối soát' : (values.tuitionStatus || 'Đã đóng đủ'),
        academicNotes: '',
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
              disabled={submitting || Boolean(detectedStaffOwner)}
              onClick={handleSubmit}
              style={{
                borderRadius: 8,
                backgroundColor: detectedStaffOwner ? '#d9d9d9' : '#1890ff',
                boxShadow: detectedStaffOwner ? 'none' : '0 2px 8px rgba(24,144,255,0.35)',
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
          {/* Hàng 1: Vai Trò + Họ và Tên */}
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label={<Text strong>Vai Trò Phân Quyền (Role RBAC)</Text>}
                rules={[{ required: true, message: 'Vui lòng chọn vai trò phân quyền' }]}
                style={{ marginBottom: 14 }}
              >
                <Select
                  placeholder="Chọn vai trò"
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
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
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="VD: Nguyễn Văn An"
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  onChange={(e) => {
                    const val = e.target.value;
                    const currentEng = form.getFieldValue('englishName');
                    if (!currentEng || currentEng === toEnglishName(form.getFieldValue('name'))) {
                      form.setFieldsValue({ englishName: toEnglishName(val) });
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Hàng 2: Tên Tiếng Anh + Số Điện Thoại 1 (Chính - Bắt Buộc) */}
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="englishName"
                label={<Text strong>Tên Tiếng Anh (English Name)</Text>}
                rules={[{ required: true, message: 'Vui lòng nhập tên tiếng Anh' }]}
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<GlobalOutlined style={{ color: '#0284c7' }} />}
                  placeholder="VD: Bao Thu, Leo, Cowboy, Anna..."
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="phoneNumber"
                label={<Text strong>Số Điện Thoại 1 (Chính - Bắt Buộc)</Text>}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại chính' },
                  { pattern: /^[0-9+\s\-().]{8,15}$/, message: 'Số điện thoại không hợp lệ' },
                ]}
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                  placeholder="0989 557 230"
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Hàng 3: Số Điện Thoại 2 (Phụ - Tùy Chọn) + Địa Chỉ Email */}
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="secondaryPhone"
                label={<Text strong>Số Điện Thoại 2 (Phụ - Tùy Chọn, Không Dùng Đăng Nhập)</Text>}
                rules={[]}
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#16a34a' }} />}
                  placeholder="VD: 0989 557 230 (SĐT Bố/Mẹ 2)"
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                dependencies={['role']}
                label={
                  <Text strong>
                    {isTargetStudent ? 'Địa Chỉ Email (Không bắt buộc)' : 'Địa Chỉ Email Đăng Nhập (Bắt Buộc)'}
                  </Text>
                }
                rules={[
                  ...(isTargetStudent ? [] : [{ required: true, message: 'Vui lòng nhập địa chỉ email' }]),
                  {
                    validator: (_, value) => {
                      if (!value || !value.trim()) return Promise.resolve();
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(value.trim())) {
                        return Promise.reject(new Error('Email không hợp lệ'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                style={{ marginBottom: 14 }}
                extra={
                  isTargetStudent ? (
                    <span style={{ color: '#16a34a', fontSize: 12 }}>
                      💡 Học viên có thể để trống Email nếu đã có Số điện thoại (dùng SĐT + Mật khẩu đăng nhập).
                    </span>
                  ) : watchedEmail ? (
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
                  prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={isTargetStudent ? 'hocvien@gmail.com (hoặc để trống)' : 'email@gmail.com hoặc staff@lakeducation.com'}
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* CẢNH BÁO BẢO MẬT: NẾU SĐT THUỘC CÁN BỘ / LÃNH ĐẠO */}
          {detectedStaffOwner && (
            <Alert
              type="error"
              showIcon
              style={{
                marginBottom: 16,
                borderRadius: 8,
                backgroundColor: '#fff2f0',
                border: '1.5px solid #ff4d4f',
              }}
              message={
                <div>
                  <Text strong style={{ color: '#cf1322', fontSize: 13 }}>
                    ⛔ CẢNH BÁO BẢO MẬT (CHẶN ĐỨNG LEO THANG ĐẶC QUYỀN):
                  </Text>
                  <div style={{ marginTop: 4, color: '#434343', fontSize: 13, lineHeight: '1.5' }}>
                    Số điện thoại này thuộc về Cán bộ/Lãnh đạo <b>{detectedStaffOwner.name}</b> ({detectedStaffOwner.roleLabel || detectedStaffOwner.role}).
                    Giáo vụ không có quyền sử dụng số điện thoại của Cán bộ để tạo tài khoản mới. Vui lòng sử dụng số điện thoại chính thức của phụ huynh học viên.
                  </div>
                </div>
              }
            />
          )}

          {/* Sibling detection alert */}
          {detectedSiblings.length > 0 && !detectedStaffOwner && (
            <Alert
              type="success"
              showIcon
              icon={<TeamOutlined style={{ color: '#16a34a' }} />}
              style={{
                marginBottom: 16,
                borderRadius: 8,
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
              }}
              message={
                <div>
                  <Text strong style={{ color: '#16a34a' }}>
                    Phát hiện Cụm Gia Đình có anh/chị/em:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {detectedSiblings.map((s) => (
                      <Tag key={s.id || s.code} color="cyan" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {s.name} ({s.code || s.id})
                      </Tag>
                    ))}
                    <span style={{ fontSize: 12, color: '#475569', marginLeft: 6 }}>
                      Tài khoản mới sẽ tự động được liên kết vào Cụm Gia Đình và dùng chung SĐT & Mật khẩu phụ huynh.
                    </span>
                  </div>
                </div>
              }
            />
          )}

          {/* Hàng 4: Mật Khẩu + Trạng Thái */}
          <Row gutter={[16, 12]} align="middle">
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
                style={{ marginBottom: 14 }}
                extra={<span style={{ color: '#94a3b8', fontSize: 12 }}>Mặc định khuyến nghị: LakEducation@2026</span>}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="LakEducation@2026"
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label={<Text strong>Trạng Thái Tài Khoản</Text>}
                valuePropName="checked"
                style={{ marginBottom: 14 }}
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
                <span style={{ fontWeight: 700 }}>3. Thông Tin Học Vụ & Lớp Học Trực Tuyến</span>
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
            {/* Lớp Học Online Ghi Danh (Nhiều Lớp - Chống Trùng Khung Giờ) */}
            <Row gutter={[16, 12]}>
              <Col span={24}>
                <Form.Item
                  name="enrolledClassIds"
                  label={
                    <Space size={6}>
                      <Text strong>Lớp Học Online Ghi Danh (Enrolled Classes)</Text>
                      <Tag color="blue" style={{ fontSize: 11, fontWeight: 600 }}>Nhiều Lớp</Tag>
                    </Space>
                  }
                  rules={[]}
                  style={{ marginBottom: 14 }}
                  extra={
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      💡 Mỗi học viên có thể đăng ký nhiều lớp học online. Hệ thống sẽ tự động phát hiện và chặn trùng khung giờ học trực tuyến Zoom.
                    </span>
                  }
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn 1 hoặc nhiều lớp học Zoom tham gia..."
                    style={{ width: '100%', minHeight: 40, borderRadius: 8 }}
                    allowClear
                    optionLabelProp="label"
                  >
                    {availableClasses.map((cls) => (
                      <Option
                        key={cls.id}
                        value={cls.id}
                        label={`${cls.id} — ${cls.name}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                          <Space size={8}>
                            <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>{cls.id}</Tag>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{cls.name}</span>
                          </Space>
                          <Space size={6}>
                            <Tag color="cyan" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                              {cls.schedule}
                            </Tag>
                            <Tag color="purple" style={{ margin: 0 }}>
                              {cls.teacherName || 'GV Bản Xứ'}
                            </Tag>
                          </Space>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* CẢNH BÁO TRÙNG KHUNG GIỜ HỌC ONLINE */}
            {scheduleConflictInfo.hasConflict && (
              <Alert
                type="error"
                showIcon
                icon={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  backgroundColor: '#fff2f0',
                  border: '1.5px solid #ff4d4f',
                }}
                message={
                  <div>
                    <Text strong style={{ color: '#cf1322', fontSize: 13 }}>
                      ⛔ PHÁT HIỆN TRÙNG KHUNG GIỜ HỌC ONLINE:
                    </Text>
                    <ul style={{ margin: '6px 0 0 18px', padding: 0, color: '#434343', fontSize: 13 }}>
                      {scheduleConflictInfo.conflicts.map((c, idx) => (
                        <li key={idx} style={{ marginTop: 2 }}>{c.message}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#cf1322', fontWeight: 500 }}>
                      Vui lòng bỏ chọn một trong hai lớp trùng giờ ở trên trước khi hoàn tất đăng ký tài khoản.
                    </div>
                  </div>
                }
              />
            )}

            {/* Cấp Độ & Tình Trạng Học Phí: TỰ ĐỘNG (READ-ONLY) */}
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text strong>Cấp Độ Chương Trình (Tự Động Theo Lớp Học)</Text>}
                  style={{ marginBottom: 14 }}
                  extra={<span style={{ fontSize: 12, color: '#64748b' }}>Cấp độ đi liền với lớp học đã chọn, không cần chọn thủ công.</span>}
                >
                  <div
                    style={{
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 11px',
                      background: '#f8fafc',
                      border: '1px solid #d9d9d9',
                      borderRadius: 8,
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {derivedLevels.length > 0 ? (
                      derivedLevels.map((lvl) => (
                        <Tag key={lvl} color="purple" style={{ margin: 0, fontWeight: 600, padding: '2px 8px' }}>
                          {lvl}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Chưa chọn lớp (Hệ thống sẽ tự nhận diện theo lớp ghi danh)
                      </Text>
                    )}
                  </div>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text strong>Tình Trạng Học Phí (Hệ Thống Kế Toán Tự Động Tính)</Text>}
                  style={{ marginBottom: 14 }}
                  extra={<span style={{ fontSize: 12, color: '#64748b' }}>Trạng thái sẽ được đối soát tự động từ phân hệ Thu Học Phí.</span>}
                >
                  <div
                    style={{
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 11px',
                      background: '#f8fafc',
                      border: '1px solid #d9d9d9',
                      borderRadius: 8,
                    }}
                  >
                    <Tag color="gold" style={{ margin: 0, fontWeight: 600, padding: '2px 8px' }}>
                      Chờ đối soát
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Khởi tạo mặc định
                    </Text>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            {/* Họ Tên Phụ Huynh & SĐT Phụ Huynh (Mặc định SĐT 1) */}
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="parentName"
                  label={<Text strong>Họ Tên Phụ Huynh / Người Giám Hộ</Text>}
                  style={{ marginBottom: 14 }}
                >
                  <Input placeholder="VD: Trần Thị Mai (Phụ huynh)" style={{ width: '100%', height: 40, borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="parentPhone"
                  label={<Text strong>Số Điện Thoại Phụ Huynh (Mặc Định Là SĐT 1)</Text>}
                  style={{ marginBottom: 14 }}
                  extra={<span style={{ fontSize: 12, color: '#16a34a' }}>Tự động đồng bộ với Số Điện Thoại 1 chính.</span>}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                    placeholder="0989 557 230"
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                  />
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
            flexWrap: 'wrap',
            gap: 12,
            padding: '16px 0',
          }}
        >
          <Button
            size="large"
            onClick={() => navigate('/user-management')}
            style={{ borderRadius: 8, flex: '1 1 110px', maxWidth: 160 }}
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
              flex: '2 1 180px',
              maxWidth: 260,
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

