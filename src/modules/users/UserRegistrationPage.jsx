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
  Upload,
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
  PaperClipOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { PermissionService } from '../../core/services/PermissionService';
import { UserService } from './services/UserService';
import { ClassService } from '../courses/services/ClassService';
import { DriveStorageService } from '../../core/services/DriveStorageService';
import { findScheduleConflictsInClassList } from '../../shared/utils/scheduleUtils';
import {
  USER_ROLES,
  USER_STATUS,
  ROLE_LABELS,
  ROLE_COLORS,
  NATIONALITY_OPTIONS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
  toEnglishName,
  generateFamilyId,
  normalizePhoneNumber,
} from './models/user.model';

export const DEFAULT_ACTIVE_CLASSES = [];

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const UserRegistrationPage = () => {
  const navigate = useNavigate();
  const { currentUser, allSystemUsers } = useAuth();
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);

  const handleCertificateFileSelect = (file) => {
    setCertificateFile(file);
    if (file) {
      const curCert = form.getFieldValue('certificate');
      if (!curCert || curCert === 'TESOL / CELTA') {
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        form.setFieldsValue({ certificate: baseName });
      }
    }
  };

  // Phân quyền tạo tài khoản (memoized để tránh tạo array mới mỗi lần render)
  const allowedRoles = useMemo(
    () => PermissionService.getAllowedCreatableRoles(currentUser?.role || ''),
    [currentUser?.role]
  );
  const canManage = PermissionService.canManageUsers(currentUser?.role || '');

  // Vai trò mặc định ban đầu
  const defaultRole = allowedRoles[allowedRoles.length - 1] || USER_ROLES.STUDENT;

  // Danh sách các lớp học đang hoạt động trong hệ thống (Đọc trực tiếp từ Cloud Firestore qua ClassService)
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const list = await ClassService.getAllClasses();
        if (isMounted) {
          setAvailableClasses(list || []);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Tự động chọn mặc định Quốc tịch Philippines khi chọn Giáo viên, hoặc Việt Nam cho Học viên
  useEffect(() => {
    if (watchedRole === USER_ROLES.TEACHER) {
      const cur = form.getFieldValue('nationality');
      if (!cur || cur === 'Việt Nam' || cur === 'Vietnam') {
        form.setFieldsValue({ nationality: 'Philippines' });
      }
    } else if (watchedRole === USER_ROLES.STUDENT) {
      const cur = form.getFieldValue('nationality');
      if (!cur || cur === 'Philippines') {
        form.setFieldsValue({ nationality: 'Việt Nam' });
      }
    }
  }, [watchedRole, form]);

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
    nationality: defaultRole === USER_ROLES.TEACHER ? 'Philippines' : 'Việt Nam',
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

      let certificateUrl = '';
      if (certificateFile) {
        try {
          message.loading({ content: isEnglish ? 'Uploading teaching certificate...' : 'Đang tải tệp chứng chỉ sư phạm...', key: 'uploadCert' });
          const uploadRes = await DriveStorageService.uploadFile(certificateFile, {
            folderPath: 'teacher_certificates',
            userId: currentUser?.id || currentUser?.code,
          });
          certificateUrl = uploadRes?.url || uploadRes?.downloadUrl || uploadRes?.fileUrl || uploadRes?.cdnUrl || '';
          message.success({ content: isEnglish ? 'Teaching certificate uploaded successfully' : 'Tải chứng chỉ sư phạm thành công', key: 'uploadCert' });
        } catch (uploadErr) {
          console.warn('Certificate upload failed, saving filename instead:', uploadErr);
        }
      }

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
        nationality: values.nationality || (targetRole === USER_ROLES.TEACHER ? 'Philippines' : 'Việt Nam'),
        certificate: values.certificate || (certificateFile ? certificateFile.name : 'TESOL / CELTA'),
        certificateUrl: certificateUrl,
        certificateFileName: certificateFile ? certificateFile.name : '',
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
            { title: <a onClick={() => navigate('/user-management')}>{isEnglish ? 'User Management' : 'Quản Trị Người Dùng'}</a> },
            { title: isEnglish ? 'Register & Issue New Account' : 'Tạo & Đăng Ký Tài Khoản Mới' },
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
              {isEnglish ? 'Back to Directory' : 'Quay Lại Danh Sách'}
            </Button>
            <div>
              <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserAddOutlined style={{ color: '#1890ff' }} />
                <span>{isEnglish ? 'Register & Issue New Account' : 'Tạo & Đăng Ký Tài Khoản Mới'}</span>
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {isEnglish
                  ? 'Register accounts and configure system access permissions across 6 RBAC roles'
                  : 'Đăng ký tài khoản và phân quyền truy cập hệ thống LAK EDUCATION theo 6 Role RBAC'}
              </Text>
            </div>
          </Space>

          <Space size={10}>
            <Button
              onClick={() => navigate('/user-management')}
              style={{ borderRadius: 8 }}
            >
              {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
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
              {isEnglish ? 'Create & Activate Account' : 'Tạo & Kích Hoạt Tài Khoản'}
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
            ? (isEnglish
                ? 'IT Administrator Privilege: You have full authority to issue accounts for all roles (Director, Admin, Academic, Teacher, Accountant, Student).'
                : 'Đặc quyền IT Admin: Bạn có toàn quyền cấp tài khoản cho mọi vị trí trong hệ thống (Giám đốc, Admin, Giáo vụ, Giáo viên, Kế toán, Học viên).')
            : (isEnglish
                ? 'Academic Leadership Privilege: You are authorized to issue accounts for Academic staff, Teachers, and new Students.'
                : 'Đặc quyền Ban Điều Hành / Giáo Vụ: Bạn được phép cấp tài khoản cho Giáo vụ, Giáo viên và Học viên mới.')
        }
      />

      <Form form={form} layout="vertical" initialValues={initialValues} scrollToFirstError>
        {/* 3. Khối 1: Thông Tin Tài Khoản & Đăng Nhập */}
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 700 }}>
                {isEnglish ? '1. Account Credentials & Role Permissions (Required)' : '1. Thông Tin Tài Khoản & Phân Quyền (Bắt Buộc)'}
              </span>
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
                label={<Text strong>{isEnglish ? 'Role-based Access Control (Role RBAC)' : 'Vai Trò Phân Quyền (Role RBAC)'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please select a system role' : 'Vui lòng chọn vai trò phân quyền' }]}
                style={{ marginBottom: 14 }}
              >
                <Select
                  placeholder={isEnglish ? 'Select Role' : 'Chọn vai trò'}
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  options={allowedRoles.map((role) => ({
                    value: role,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={ROLE_COLORS[role]} style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
                          {role.toUpperCase()}
                        </Tag>
                        <span>{ROLE_LABELS[isEnglish ? 'en' : 'vi']?.[role] || role}</span>
                      </div>
                    ),
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label={<Text strong>{isEnglish ? 'Full Name' : 'Họ và Tên Đầy Đủ'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please enter full name' : 'Vui lòng nhập họ và tên' }]}
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={isEnglish ? 'e.g. John Doe, Nguyen Van An' : 'VD: Nguyễn Văn An'}
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
                label={<Text strong>{isEnglish ? 'English Name (Auto-generated)' : 'Tên Tiếng Anh (English Name)'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please enter English name' : 'Vui lòng nhập tên tiếng Anh' }]}
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<GlobalOutlined style={{ color: '#0284c7' }} />}
                  placeholder={isEnglish ? 'e.g. Liam, Leo, Cowboy, Anna...' : 'VD: Bao Thu, Leo, Cowboy, Anna...'}
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="phoneNumber"
                label={<Text strong>{isEnglish ? 'Primary Phone 1 (Required - Student Login)' : 'Số Điện Thoại 1 (Chính - Bắt Buộc)'}</Text>}
                rules={[
                  { required: true, message: isEnglish ? 'Please enter primary phone number' : 'Vui lòng nhập số điện thoại chính' },
                  { pattern: /^[0-9+\s\-().]{8,15}$/, message: isEnglish ? 'Invalid phone number format' : 'Số điện thoại không hợp lệ' },
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
                label={<Text strong>{isEnglish ? 'Secondary Phone 2 (Optional - Backup)' : 'Số Điện Thoại 2 (Phụ - Tùy Chọn, Không Dùng Đăng Nhập)'}</Text>}
                rules={[]}
                style={{ marginBottom: 14 }}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#16a34a' }} />}
                  placeholder={isEnglish ? 'e.g. 0989 557 230 (Parent 2 / Backup)' : 'VD: 0989 557 230 (SĐT Bố/Mẹ 2)'}
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
                    {isTargetStudent
                      ? (isEnglish ? 'Email Address (Optional for Students)' : 'Địa Chỉ Email (Không bắt buộc)')
                      : (isEnglish ? 'Login Email Address (Required)' : 'Địa Chỉ Email Đăng Nhập (Bắt Buộc)')}
                  </Text>
                }
                rules={[
                  ...(isTargetStudent ? [] : [{ required: true, message: isEnglish ? 'Please enter email address' : 'Vui lòng nhập địa chỉ email' }]),
                  {
                    validator: (_, value) => {
                      if (!value || !value.trim()) return Promise.resolve();
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(value.trim())) {
                        return Promise.reject(new Error(isEnglish ? 'Invalid email address format' : 'Email không hợp lệ'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                style={{ marginBottom: 14 }}
                extra={
                  isTargetStudent ? (
                    <span style={{ color: '#16a34a', fontSize: 12 }}>
                      {isEnglish
                        ? '💡 Students can leave Email blank if phone number is provided (Login with Phone + Password).'
                        : '💡 Học viên có thể để trống Email nếu đã có Số điện thoại (dùng SĐT + Mật khẩu đăng nhập).'}
                    </span>
                  ) : watchedEmail ? (
                    isGmail ? (
                      <span style={{ color: '#d97706', fontSize: 12 }}>
                        ✨ <b>Gmail:</b> {isEnglish ? 'Sign in with Google OAuth or Password' : 'Đăng nhập Google hoặc Mật khẩu'}
                      </span>
                    ) : (
                      <span style={{ color: '#475569', fontSize: 12 }}>
                        🔒 <b>{isEnglish ? 'Work Email:' : 'Email công vụ:'}</b> {isEnglish ? 'Sign in with Password' : 'Đăng nhập bằng Mật khẩu'}
                      </span>
                    )
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>
                      {isEnglish
                        ? 'Gmail: Google or Password • Work Email: Password only'
                        : 'Gmail: Google hoặc Mật khẩu • Email khác: Mật khẩu'}
                    </span>
                  )
                }
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={
                    isTargetStudent
                      ? (isEnglish ? 'student@gmail.com (or leave blank)' : 'hocvien@gmail.com (hoặc để trống)')
                      : (isEnglish ? 'email@gmail.com or staff@lakeducation.com' : 'email@gmail.com hoặc staff@lakeducation.com')
                  }
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
                    {isEnglish ? '⛔ SECURITY ALERT (PRIVILEGE ESCALATION BLOCKED):' : '⛔ CẢNH BÁO BẢO MẬT (CHẶN ĐỨNG LEO THANG ĐẶC QUYỀN):'}
                  </Text>
                  <div style={{ marginTop: 4, color: '#434343', fontSize: 13, lineHeight: '1.5' }}>
                    {isEnglish
                      ? `This phone number belongs to staff/executive ${detectedStaffOwner.name} (${detectedStaffOwner.roleLabel || detectedStaffOwner.role}). Academic coordinators are not allowed to use staff phone numbers to register accounts.`
                      : `Số điện thoại này thuộc về Cán bộ/Lãnh đạo ${detectedStaffOwner.name} (${detectedStaffOwner.roleLabel || detectedStaffOwner.role}). Giáo vụ không có quyền sử dụng số điện thoại của Cán bộ để tạo tài khoản mới.`}
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
                    {isEnglish ? 'Detected Family Siblings Cluster:' : 'Phát hiện Cụm Gia Đình có anh/chị/em:'}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {detectedSiblings.map((s) => (
                      <Tag key={s.id || s.code} color="cyan" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {s.name} ({s.code || s.id})
                      </Tag>
                    ))}
                    <span style={{ fontSize: 12, color: '#475569', marginLeft: 6 }}>
                      {isEnglish
                        ? 'New account will automatically be linked to this Family Cluster and share parent login credentials.'
                        : 'Tài khoản mới sẽ tự động được liên kết vào Cụm Gia Đình và dùng chung SĐT & Mật khẩu phụ huynh.'}
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
                    <Text strong>{isEnglish ? 'Initial Password' : 'Mật Khẩu Khởi Tạo'}</Text>
                    <a
                      onClick={handleGeneratePassword}
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ReloadOutlined /> {isEnglish ? 'Generate random' : 'Sinh ngẫu nhiên'}
                    </a>
                  </div>
                }
                rules={[
                  { required: true, message: isEnglish ? 'Please enter initial password' : 'Vui lòng nhập mật khẩu khởi tạo' },
                  { min: 6, message: isEnglish ? 'Password must be at least 6 characters' : 'Mật khẩu tối thiểu 6 ký tự' },
                ]}
                style={{ marginBottom: 14 }}
                extra={<span style={{ color: '#94a3b8', fontSize: 12 }}>{isEnglish ? 'Default recommendation: LakEducation@2026' : 'Mặc định khuyến nghị: LakEducation@2026'}</span>}
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
                label={<Text strong>{isEnglish ? 'Account Status' : 'Trạng Thái Tài Khoản'}</Text>}
                valuePropName="checked"
                style={{ marginBottom: 14 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                  <Switch defaultChecked />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {isEnglish ? 'Activate immediately upon creation' : 'Kích hoạt ngay sau khi tạo'}
                  </Text>
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
              <span style={{ fontWeight: 700 }}>
                {isEnglish ? '2. Personal Profile & Contact Information' : '2. Thông Tin Cá Nhân & Liên Lạc'}
              </span>
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
              <Form.Item name="gender" label={<Text strong>{isEnglish ? 'Gender' : 'Giới Tính'}</Text>}>
                <Select placeholder={isEnglish ? 'Select gender' : 'Chọn giới tính'} style={{ borderRadius: 8 }}>
                  <Option value="Nam">{isEnglish ? 'Male' : 'Nam'}</Option>
                  <Option value="Nữ">{isEnglish ? 'Female' : 'Nữ'}</Option>
                  <Option value="Khác">{isEnglish ? 'Other' : 'Khác'}</Option>
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
              <Form.Item
                name="nationality"
                label={<Text strong>{isEnglish ? 'Nationality' : 'Quốc Tịch'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please select nationality' : 'Vui lòng chọn quốc tịch' }]}
              >
                <Select
                  placeholder={isEnglish ? 'Select nationality' : 'Chọn quốc tịch'}
                  style={{ width: '100%', borderRadius: 8 }}
                  optionLabelProp="label"
                >
                  {NATIONALITY_OPTIONS.map((item) => {
                    const displayLabel = isEnglish ? item.labelEn : item.labelVi;
                    return (
                      <Select.Option
                        key={item.value}
                        value={item.value}
                        label={displayLabel}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{item.flag}</span>
                          <span>{displayLabel.replace(/^[^\s]+\s/, '')}</span>
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} sm={8}>
              <Form.Item name="idCardNumber" label={<Text strong>{isEnglish ? 'National ID / Citizen ID' : 'Số CMND / CCCD / Mã Định Danh'}</Text>}>
                <Input
                  prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={isEnglish ? 'e.g. 079201004567' : '079201004567'}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="city" label={<Text strong>{isEnglish ? 'Province / City' : 'Tỉnh / Thành Phố'}</Text>}>
                <Input placeholder={isEnglish ? 'Ho Chi Minh City' : 'TP. Hồ Chí Minh'} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="address" label={<Text strong>{isEnglish ? 'Permanent Residential Address' : 'Địa Chỉ Thường Trú'}</Text>}>
                <Input
                  prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={isEnglish ? 'e.g. 123 Nguyen Thi Minh Khai, Ben Nghe Ward, District 1' : 'VD: 123 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1'}
                  style={{ borderRadius: 8 }}
                />
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
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? '3. Academic Information & Online Classes' : '3. Thông Tin Học Vụ & Lớp Học Trực Tuyến'}
                </span>
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
                      <Text strong>{isEnglish ? 'Enrolled Online Classes' : 'Lớp Học Online Ghi Danh (Enrolled Classes)'}</Text>
                      <Tag color="blue" style={{ fontSize: 11, fontWeight: 600 }}>{isEnglish ? 'Multiple Classes' : 'Nhiều Lớp'}</Tag>
                    </Space>
                  }
                  rules={[]}
                  style={{ marginBottom: 14 }}
                  extra={
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {isEnglish
                        ? '💡 Students can enroll in multiple online classes. The system automatically detects and prevents Zoom schedule conflicts.'
                        : '💡 Mỗi học viên có thể đăng ký nhiều lớp học online. Hệ thống sẽ tự động phát hiện và chặn trùng khung giờ học trực tuyến Zoom.'}
                    </span>
                  }
                >
                  <Select
                    mode="multiple"
                    placeholder={isEnglish ? 'Select 1 or more online Zoom classes to enroll...' : 'Chọn 1 hoặc nhiều lớp học Zoom tham gia...'}
                    style={{ width: '100%', minHeight: 40, borderRadius: 8 }}
                    allowClear
                    optionLabelProp="label"
                    notFoundContent={
                      <div style={{ padding: '8px 0', textAlign: 'center', color: '#64748b' }}>
                        {isEnglish ? 'No online classes available in system' : 'Chưa có lớp học trực tuyến nào trong hệ thống'}
                      </div>
                    }
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
                              {cls.teacherName || (isEnglish ? 'Teacher' : 'Giáo Viên')}
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
                      {isEnglish ? '⛔ ONLINE CLASS SCHEDULE CONFLICT DETECTED:' : '⛔ PHÁT HIỆN TRÙNG KHUNG GIỜ HỌC ONLINE:'}
                    </Text>
                    <ul style={{ margin: '6px 0 0 18px', padding: 0, color: '#434343', fontSize: 13 }}>
                      {scheduleConflictInfo.conflicts.map((c, idx) => (
                        <li key={idx} style={{ marginTop: 2 }}>{c.message}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#cf1322', fontWeight: 500 }}>
                      {isEnglish
                        ? 'Please deselect one of the conflicting classes above before completing registration.'
                        : 'Vui lòng bỏ chọn một trong hai lớp trùng giờ ở trên trước khi hoàn tất đăng ký tài khoản.'}
                    </div>
                  </div>
                }
              />
            )}

            {/* Cấp Độ & Tình Trạng Học Phí: TỰ ĐỘNG (READ-ONLY) */}
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text strong>{isEnglish ? 'Curriculum Level (Auto-detected from Classes)' : 'Cấp Độ Chương Trình (Tự Động Theo Lớp Học)'}</Text>}
                  style={{ marginBottom: 14 }}
                  extra={<span style={{ fontSize: 12, color: '#64748b' }}>{isEnglish ? 'Levels are linked to enrolled classes automatically.' : 'Cấp độ đi liền với lớp học đã chọn, không cần chọn thủ công.'}</span>}
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
                        {isEnglish ? 'No classes selected (System will auto-detect from enrolled classes)' : 'Chưa chọn lớp (Hệ thống sẽ tự nhận diện theo lớp ghi danh)'}
                      </Text>
                    )}
                  </div>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text strong>{isEnglish ? 'Tuition Status (Auto-calculated by Billing System)' : 'Tình Trạng Học Phí (Hệ Thống Kế Toán Tự Động Tính)'}</Text>}
                  style={{ marginBottom: 14 }}
                  extra={<span style={{ fontSize: 12, color: '#64748b' }}>{isEnglish ? 'Status will be automatically verified from Tuition Module.' : 'Trạng thái sẽ được đối soát tự động từ phân hệ Thu Học Phí.'}</span>}
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
                      {isEnglish ? 'Pending Verification' : 'Chờ đối soát'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {isEnglish ? 'Default Initialization' : 'Khởi tạo mặc định'}
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
                  label={<Text strong>{isEnglish ? 'Parent / Guardian Full Name' : 'Họ Tên Phụ Huynh / Người Giám Hộ'}</Text>}
                  style={{ marginBottom: 14 }}
                >
                  <Input placeholder={isEnglish ? 'e.g. Mary Jane (Parent)' : 'VD: Trần Thị Mai (Phụ huynh)'} style={{ width: '100%', height: 40, borderRadius: 8 }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="parentPhone"
                  label={<Text strong>{isEnglish ? 'Parent Phone Number (Default to Phone 1)' : 'Số Điện Thoại Phụ Huynh (Mặc Định Là SĐT 1)'}</Text>}
                  style={{ marginBottom: 14 }}
                  extra={<span style={{ fontSize: 12, color: '#16a34a' }}>{isEnglish ? 'Automatically synchronized with primary Phone 1.' : 'Tự động đồng bộ với Số Điện Thoại 1 chính.'}</span>}
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
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? '3. Teaching Credentials & Contract (For Teachers)' : '3. Chuyên Môn Giảng Dạy & Hợp Đồng (Dành Cho Giáo Viên)'}
                </span>
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
              <Col xs={24} sm={12}>
                <Form.Item
                  name="hourlyRate"
                  label={<Text strong>{isEnglish ? 'Hourly Teaching Rate (VND)' : 'Đơn Giá Dạy / Giờ (VNĐ)'}</Text>}
                >
                  <InputNumber
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                    placeholder="450,000"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="assignedClasses"
                  label={<Text strong>{isEnglish ? 'Assigned Classes' : 'Các Lớp Phân Công'}</Text>}
                >
                  <Input
                    placeholder="VD: GK-A, G1-B"
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="bio"
              label={<Text strong>{isEnglish ? 'Teaching Experience & Bio Summary' : 'Tóm Tắt Kinh Nghiệm Giảng Dạy (Bio)'}</Text>}
              style={{ marginBottom: 16 }}
            >
              <TextArea
                rows={2}
                placeholder={isEnglish ? 'Teaching experience, graduated university, certifications...' : 'Kinh nghiệm giảng dạy, trường đại học đã tốt nghiệp...'}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            {/* Khung Riêng Biệt: Bằng Cấp & Chứng Chỉ Sư Phạm (Dedicated Upload Box) */}
            <div
              style={{
                marginTop: 12,
                padding: '16px 18px',
                borderRadius: 10,
                border: '1.5px dashed #1890ff',
                backgroundColor: '#f0f7ff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Space size={8}>
                  <TrophyOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  <Text strong style={{ fontSize: 14, color: '#0958d9' }}>
                    {isEnglish ? 'Teaching Certificate & Pedagogical Qualifications' : 'Bằng Cấp & Chứng Chỉ Sư Phạm (Teaching Certificate)'}
                  </Text>
                </Space>
                <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                  {isEnglish ? 'Upload Scan / PDF' : 'Tải Lên Chứng Chỉ'}
                </Tag>
              </div>

              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="certificate"
                    label={<Text strong>{isEnglish ? 'Certificate Title / Type' : 'Tên Bằng Cấp / Loại Chứng Chỉ'}</Text>}
                    extra={<span style={{ fontSize: 12, color: '#64748b' }}>{isEnglish ? 'e.g. TESOL 120h, CELTA Cambridge, TEFL, B.Ed' : 'VD: TESOL 120h, CELTA Cambridge, TEFL, Cử Nhân Sư Phạm'}</span>}
                    style={{ marginBottom: 8 }}
                  >
                    <Input
                      prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
                      placeholder="TESOL / CELTA / TEFL"
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<Text strong>{isEnglish ? 'Attach Certificate File (PDF / Images)' : 'Đính Kèm Tệp Chứng Chỉ (PDF / Hình Ảnh)'}</Text>}
                    style={{ marginBottom: 8 }}
                  >
                    <Upload.Dragger
                      name="certificateFile"
                      multiple={false}
                      maxCount={1}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      beforeUpload={(file) => {
                        handleCertificateFileSelect(file);
                        return false;
                      }}
                      onRemove={() => setCertificateFile(null)}
                      fileList={certificateFile ? [certificateFile] : []}
                      style={{
                        padding: '12px 10px',
                        background: '#ffffff',
                        borderRadius: 8,
                        borderColor: '#91caff',
                      }}
                    >
                      <p className="ant-upload-drag-icon" style={{ margin: '0 0 6px' }}>
                        <PaperClipOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      </p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1d39c4' }}>
                        {certificateFile
                          ? certificateFile.name
                          : (isEnglish ? 'Click or drag certificate scan here to upload' : 'Nhấp hoặc kéo thả tệp chứng chỉ vào đây để tải lên')}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#8c8c8c' }}>
                        {isEnglish ? 'Supports PDF, JPG, PNG, DOCX (Max 25MB)' : 'Hỗ trợ định dạng PDF, JPG, PNG, DOCX (Tối đa 25MB)'}
                      </p>
                    </Upload.Dragger>
                  </Form.Item>
                </Col>
              </Row>
            </div>
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
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? '3. Organizational Position & Division (Staff & Faculty)' : '3. Vị Trí Công Tác & Tổ Chức (Cán Bộ / Nhân Sự)'}
                </span>
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
                <Form.Item
                  name="position"
                  label={<Text strong>{isEnglish ? 'Job Title / Position' : 'Chức Danh / Vị Trí Công Tác'}</Text>}
                >
                  <Input
                    placeholder={isEnglish ? 'e.g. Academic Coordinator, Chief Accountant...' : 'VD: Điều phối viên học vụ, Kế toán trưởng...'}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="department"
                  label={<Text strong>{isEnglish ? 'Department / Division' : 'Phòng Ban Trực Thuộc'}</Text>}
                >
                  <Input
                    placeholder={isEnglish ? 'e.g. Academic Affairs, Executive Board, Accounting...' : 'VD: Phòng Đào Tạo, Ban Giám Đốc, Phòng Kế Toán...'}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                  />
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
              <span style={{ fontWeight: 700 }}>
                {isEnglish ? '4. General Operational Notes' : '4. Ghi Chú Nghiệp Vụ Chung'}
              </span>
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
            label={<Text strong>{isEnglish ? 'Internal Notes / Special Conditions' : 'Ghi Chú Nội Bộ / KPI / Điều Kiện Đặc Biệt'}</Text>}
          >
            <TextArea
              rows={3}
              placeholder={isEnglish ? 'Enter special notes regarding tuition commitment, parent preferences, or staff notes...' : 'Nhập các lưu ý đặc biệt về học phí, cam kết phụ huynh hoặc ghi chú nhân sự...'}
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
            {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
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
            {isEnglish ? 'Create & Activate Account' : 'Tạo & Kích Hoạt Tài Khoản'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

