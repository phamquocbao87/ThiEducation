import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Avatar,
  Badge,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  Spin,
  Alert,
  Divider,
  Timeline,
  DatePicker,
  InputNumber,
  message,
  Tooltip,
  Upload,
  Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  HomeOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  HistoryOutlined,
  GoogleOutlined,
  KeyOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  TrophyOutlined,
  CameraOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
  LinkOutlined,
  EyeOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { UserService } from './services/UserService';
import { UserAuditService } from './services/UserAuditService';
import { DriveStorageService } from '../../core/services/DriveStorageService';
import {
  USER_ROLES,
  USER_STATUS,
  ROLE_LABELS,
  ROLE_COLORS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
} from './models/user.model';
import { PermissionService } from '../../core/services/PermissionService';
import { UserDeleteModal } from './components/UserDeleteModal';
import { ImageOptimizerService } from '../../shared/services/ImageOptimizerService';
import { AvatarCropModal } from '../../shared/components/AvatarCropModal';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// Chuyển chuỗi ngày ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD') sang đối tượng dayjs cho DatePicker
const parseDateToDayjs = (str) => {
  if (!str) return null;
  if (dayjs.isDayjs(str)) return str;
  const d = dayjs(str, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY'], true);
  if (d.isValid()) return d;
  const fallback = dayjs(str);
  return fallback.isValid() ? fallback : null;
};

// Định dạng đối tượng dayjs sang chuỗi chuẩn 'DD/MM/YYYY' lưu Firestore
const formatDateToStr = (val) => {
  if (!val) return '';
  if (dayjs.isDayjs(val)) return val.format('DD/MM/YYYY');
  return String(val);
};

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const UserDetailPage = () => {
  const { userId, action } = useParams();
  const isEditMode = action === 'edit';
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isEnglish, language } = useLanguage();
  const [form] = Form.useForm();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userAuditLogs, setUserAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropFileName, setCropFileName] = useState('avatar.jpg');
  const [rawSelectedFile, setRawSelectedFile] = useState(null);

  // Theo dõi email nhập vào trong form để nhận diện loại tài khoản thời gian thực
  const watchedEmail = Form.useWatch('email', form) || user?.email || '';
  const isGmail = isGmailAddress(watchedEmail);

  // Tải chi tiết User
  const loadUserDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await UserService.getUserById(userId);
      if (!data) {
        message.error(`Không tìm thấy tài khoản với mã: ${userId}`);
        navigate('/user-management');
        return;
      }
      setUser(data);
      form.setFieldsValue({
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        gender: data.gender || 'Nam',
        dateOfBirth: parseDateToDayjs(data.dateOfBirth),
        joinDate: parseDateToDayjs(data.joinDate),
        idCardNumber: data.idCardNumber || '',
        address: data.address || '',
        city: data.city || 'TP. Hồ Chí Minh',
        role: data.role || USER_ROLES.STUDENT,
        status: data.status === USER_STATUS.ACTIVE,
        extraInfo: data.extraInfo || '',
        // Trường nghiệp vụ theo Role
        className: data.className || '',
        level: data.level || 'G1',
        parentName: data.parentName || '',
        parentPhone: data.parentPhone || '',
        attendanceRate: data.attendanceRate !== undefined ? data.attendanceRate : 96,
        tuitionStatus: data.tuitionStatus || 'Đã đóng đủ',
        academicNotes: data.academicNotes || '',
        nationality: data.nationality || 'Mỹ (US)',
        certificate: data.certificate || 'TESOL / CELTA',
        hourlyRate: data.hourlyRate || 450000,
        assignedClasses: data.assignedClasses || 'GK-A, G1-B',
        bio: data.bio || '',
        position: data.position || 'Điều phối viên giáo vụ',
        department: data.department || 'Phòng Đào Tạo',
      });
    } catch (err) {
      message.error(`Lỗi tải thông tin tài khoản: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [userId, navigate, form]);

  useEffect(() => {
    loadUserDetail();
  }, [loadUserDetail]);

  // Tải Audit Logs riêng của tài khoản này (Chỉ nạp khi tài khoản đang đăng nhập là Admin)
  const loadUserAuditLogs = useCallback(async () => {
    if (!userId || currentUser?.role !== 'admin') return;
    setAuditLoading(true);
    try {
      const logs = await UserAuditService.getAuditLogs(100);
      const filtered = logs.filter((l) => {
        const target = l.target || {};
        return (
          target.code === userId ||
          target.id === userId ||
          (user && target.email && target.email.toLowerCase() === user.email?.toLowerCase())
        );
      });
      setUserAuditLogs(filtered);
    } catch (err) {
      console.warn('Lỗi tải audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [userId, user, currentUser?.role]);

  useEffect(() => {
    if (user) {
      loadUserAuditLogs();
    }
  }, [user, loadUserAuditLogs]);

  // Quyền hạn RBAC
  const canEdit = user ? PermissionService.canEditUser(currentUser, user) : false;
  const canDelete = user ? PermissionService.canDeleteUser(currentUser, user) : false;
  const canChangeStatus = user ? PermissionService.canChangeUserStatus(currentUser, user) : false;
  const canUploadAvatar = PermissionService.canUploadAvatar(currentUser?.role || '');
  const isAdmin = currentUser?.role === 'admin';
  const isRootAdmin = user?.id === 'ADM001' || user?.email === 'phamquocbao87@gmail.com';

  // Điều hướng an toàn: nếu đang ở chế độ /edit nhưng không có quyền sửa -> Tự động chuyển về chế độ view
  useEffect(() => {
    if (!loading && user && isEditMode && !canEdit) {
      message.warning(isEnglish ? 'You do not have permission to edit this profile' : 'Bạn không có quyền chỉnh sửa tài khoản này');
      navigate('/user-management/' + userId, { replace: true });
    }
  }, [loading, user, isEditMode, canEdit, navigate, userId, isEnglish]);

  // 1. Bước 1: Khi người dùng chọn file ảnh từ máy tính
  // - Kiểm tra định dạng & giới hạn cứng 5MB
  // - Mở Modal Crop ảnh tròn (Avatar Cropper) chuẩn phong cách Facebook / Google
  const handleSelectAvatarFile = (file) => {
    if (!canUploadAvatar) {
      message.error('Chỉ Giáo vụ, Giám đốc và Admin mới có quyền cập nhật ảnh đại diện');
      return false;
    }

    if (!user) return false;

    // Kiểm tra tính hợp lệ & giới hạn 5MB
    const validation = ImageOptimizerService.validateAvatarFile(file);
    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }

    // Lưu lại file gốc nguyên vẹn được chọn từ máy
    setRawSelectedFile(file);

    // Đọc ảnh sang DataURL để hiển thị trên AvatarCropModal
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCropFileName(file.name || 'avatar.jpg');
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    return false; // Chặn Antd tự động upload ngầm
  };

  const fileInputRef = useRef(null);

  // Mở lại Crop Modal từ ảnh gốc đầy đủ đã lưu trên hệ thống (không cần chọn lại file)
  const handleReCropExistingAvatar = () => {
    if (!user?.avatarOriginal && !user?.avatar) {
      message.info('Tài khoản này chưa có ảnh gốc để cắt lại. Vui lòng chọn ảnh mới từ máy.');
      return;
    }
    setCropImageSrc(user.avatarOriginal || user.avatar);
    setCropFileName(`avatar_${user.code || user.id}.jpg`);
    setRawSelectedFile(null); // Sử dụng lại ảnh gốc đã lưu trên Drive
    setCropModalOpen(true);
  };

  // Nhấn trực tiếp vào icon avatar:
  // - Nếu đã có ảnh -> Mở ngay Modal để căn chỉnh / crop lại!
  // - Nếu là ảnh mặc định -> Mở hộp thoại chọn ảnh mới từ máy tính
  const handleAvatarClick = () => {
    if (!canUploadAvatar) return;

    const hasCustomAvatar = Boolean(
      (user?.avatarOriginal && !user.avatarOriginal.includes('dicebear.com')) ||
      (user?.avatar && !user.avatar.includes('dicebear.com'))
    );

    if (hasCustomAvatar) {
      handleReCropExistingAvatar();
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // 2. Bước 2: Khi người dùng kéo chỉnh khung tròn xong và bấm "Áp Dụng & Lưu Ảnh"
  // - Lưu cả HÌNH ĐẦY ĐỦ NGUYÊN VẸN (avatarOriginal) và HÌNH ĐÃ CROP (avatar) lên Google Drive
  // - Hiển thị dạng hình đã crop (chuẩn Facebook/Google)
  const handleApplyCropAndUpload = async (croppedFile, cropMetadata) => {
    setCropModalOpen(false);

    // Hiển thị xem trước ảnh đã cắt ngay lập tức để người dùng thấy ảnh mới tức thì
    const localPreviewUrl = URL.createObjectURL(croppedFile);
    setAvatarPreview(localPreviewUrl);
    setUploadingAvatar(true);

    let hideLoading = null;

    try {
      const userCode = user.code || user.id;
      const timestamp = Date.now();

      // --- PHẦN 1: Chuẩn bị file ảnh đã crop (<= 1MB) ---
      let cropFileToUpload = croppedFile;
      const cropValidation = ImageOptimizerService.validateAvatarFile(croppedFile);
      if (cropValidation.needsCompression) {
        hideLoading = message.loading('Đang tối ưu dung lượng ảnh cắt (< 1MB)...', 0);
        const optCrop = await ImageOptimizerService.optimizeAvatar(croppedFile, {
          maxSizeMB: 0.98,
          maxWidthOrHeight: 1200,
          initialQuality: 0.90,
        });
        cropFileToUpload = optCrop.file;
        if (typeof hideLoading === 'function') hideLoading();
      }

      const cropFileNameFormatted = `avatar_cropped_${userCode}_${timestamp}.jpg`;
      const cropFileRenamed = new File([cropFileToUpload], cropFileNameFormatted, { type: 'image/jpeg' });

      // --- PHẦN 2: Chuẩn bị file ảnh đầy đủ nguyên gốc (Full Original) ---
      let fullOriginalFile = rawSelectedFile;
      let fullFileToUpload = null;
      if (fullOriginalFile) {
        const fullValidation = ImageOptimizerService.validateAvatarFile(fullOriginalFile);
        if (fullValidation.needsCompression) {
          hideLoading = message.loading('Đang tối ưu dung lượng ảnh gốc (< 1MB)...', 0);
          const optFull = await ImageOptimizerService.optimizeAvatar(fullOriginalFile, {
            maxSizeMB: 0.98,
            maxWidthOrHeight: 1920, // Giữ độ phân giải cao sắc nét cho ảnh gốc
            initialQuality: 0.92,
          });
          fullFileToUpload = optFull.file;
          if (typeof hideLoading === 'function') hideLoading();
        } else {
          fullFileToUpload = fullOriginalFile;
        }
      }

      hideLoading = message.loading('Đang lưu trữ ảnh lên Google Drive...', 0);

      // --- PHẦN 3: Upload song song lên Google Drive (Zero-Egress) ---
      const uploadTasks = [];

      // Task 1: Upload ảnh đã crop (phục vụ hiển thị trên toàn hệ thống)
      uploadTasks.push(
        DriveStorageService.uploadFile(cropFileRenamed, {
          folderPath: DriveStorageService.FOLDERS.AVATARS,
          tag: 'avatar,cropped,display',
          title: `Avatar Cropped - ${user.name} (${userCode})`,
          notes: `Ảnh đại diện đã crop của ${userCode}`,
          purpose: 'user_avatar_crop',
          key: `${userCode}_crop`,
        })
      );

      // Task 2: Upload ảnh đầy đủ nguyên gốc (nếu là ảnh mới tải lên từ máy)
      if (fullFileToUpload) {
        const fullFileNameFormatted = `avatar_full_${userCode}_${timestamp}.jpg`;
        const fullFileRenamed = new File([fullFileToUpload], fullFileNameFormatted, {
          type: fullFileToUpload.type || 'image/jpeg',
        });
        uploadTasks.push(
          DriveStorageService.uploadFile(fullFileRenamed, {
            folderPath: DriveStorageService.FOLDERS.AVATARS,
            tag: 'avatar,original,full',
            title: `Avatar Full - ${user.name} (${userCode})`,
            notes: `Ảnh đại diện đầy đủ nguyên vẹn của ${userCode}`,
            purpose: 'user_avatar_full',
            key: `${userCode}_full`,
          })
        );
      }

      const uploadResults = await Promise.all(uploadTasks);
      const cropUploadResult = uploadResults[0];
      const fullUploadResult = uploadResults[1] || null;

      // Link CDN ảnh đã crop
      const cropFileId = cropUploadResult.id || cropUploadResult.fileId;
      const avatarUrl = cropFileId
        ? DriveStorageService.getImageCdnUrl(cropFileId, 400)
        : DriveStorageService.formatAvatarUrl(cropUploadResult.cdnUrl || cropUploadResult.downloadUrl || cropUploadResult.driveUrl, 400);

      // Link CDN ảnh đầy đủ nguyên vẹn
      let avatarOriginalUrl = user.avatarOriginal || avatarUrl;
      let originalFileId = user.avatarOriginalDriveFileId || '';
      if (fullUploadResult) {
        originalFileId = fullUploadResult.id || fullUploadResult.fileId;
        avatarOriginalUrl = originalFileId
          ? `https://lh3.googleusercontent.com/d/${originalFileId}=w1200`
          : (fullUploadResult.cdnUrl || fullUploadResult.downloadUrl || fullUploadResult.driveUrl);
      }

      // Cập nhật Firestore lakeducationdb: lưu cả bản đầy đủ và bản crop
      const updatedUser = await UserService.updateAvatar(currentUser, user, avatarUrl, {
        id: cropFileId,
        cropFileId,
        originalFileId,
        avatarOriginal: avatarOriginalUrl,
        avatarCropData: cropMetadata,
      });

      setUser(updatedUser);
      setAvatarPreview(null);
      setRawSelectedFile(null);
      message.success('Cập nhật thành công! Đã lưu ảnh đầy đủ và hiển thị bản crop.');
      loadUserAuditLogs();
    } catch (err) {
      setAvatarPreview(null);
      console.error('[handleAvatarUpload Error]:', err);
      message.error(`Lỗi cập nhật ảnh đại diện: ${err.message || 'Không thể kết nối'}`);
    } finally {
      if (typeof hideLoading === 'function') {
        hideLoading();
      }
      setUploadingAvatar(false);
    }
  };

  // Lưu thông tin chi tiết
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updatePayload = {
        ...values,
        dateOfBirth: formatDateToStr(values.dateOfBirth),
        joinDate: formatDateToStr(values.joinDate),
        status: user?.status || USER_STATUS.ACTIVE,
        authProviders: resolveAuthProvidersByEmail(values.email),
      };
      if (values.newPassword && values.newPassword.trim()) {
        updatePayload.password = values.newPassword.trim();
      }
      delete updatePayload.newPassword;

      const updated = await UserService.updateUserProfile(currentUser, user, updatePayload);
      form.setFieldValue('newPassword', '');
      setUser(updated);
      message.success(isEnglish ? `Profile of ${updated.name} updated successfully` : `Đã lưu thành công thông tin hồ sơ của ${updated.name}`);
      loadUserAuditLogs();
      navigate('/user-management/' + userId);
    } catch (err) {
      if (err.errorFields) {
        message.warning('Vui lòng kiểm tra lại các trường thông tin bắt buộc');
      } else {
        message.error(err.message || 'Lỗi lưu thông tin');
      }
    } finally {
      setSaving(false);
    }
  };

  // Kích hoạt hoặc Tạm khóa tài khoản bằng Switch độc lập
  const handleToggleStatus = async (checked) => {
    try {
      setSaving(true);
      const newStatus = checked ? USER_STATUS.ACTIVE : USER_STATUS.DISABLED;
      const updated = await UserService.toggleUserStatus(currentUser, user, newStatus);
      setUser(updated);
      form.setFieldValue('status', checked);
      message.success(`Đã ${checked ? 'kích hoạt' : 'tạm khóa'} tài khoản ${updated.name} thành công`);
      loadUserAuditLogs();
    } catch (err) {
      message.error(err.message || 'Lỗi thay đổi trạng thái hoạt động');
    } finally {
      setSaving(false);
    }
  };

  // Xác nhận Xóa Mềm kèm lý do
  const handleConfirmDelete = async (targetUser, deleteReason) => {
    setDeleteLoading(true);
    try {
      await UserService.deleteUser(currentUser, targetUser, deleteReason);
      message.success(`Đã xóa tài khoản: ${targetUser.name} (${targetUser.code || targetUser.id})`);
      setIsDeleteModalOpen(false);
      navigate('/user-management');
    } catch (err) {
      message.error(err.message || 'Không thể xóa tài khoản này');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 16px' }}>
        <Spin size="large" description="Đang tải thông tin chi tiết tài khoản..." />
      </div>
    );
  }

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] || 'blue';
  const isActive = user.status === USER_STATUS.ACTIVE;
  const hasCustomAvatar = Boolean(
    (user?.avatarOriginal && !user.avatarOriginal.includes('dicebear.com')) ||
    (user?.avatar && !user.avatar.includes('dicebear.com'))
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px 32px' }}>
      {/* 1. Header Navigation & Thanh Thao Tác */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size={10}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (isEditMode) {
                navigate('/user-management/' + userId);
              } else {
                navigate('/user-management');
              }
            }}
            style={{ borderRadius: 8 }}
          >
            {isEditMode
              ? (isEnglish ? 'Cancel & Return to View' : 'Hủy & Quay Lại Xem')
              : (isEnglish ? 'Back to List' : 'Quay Lại Danh Sách')}
          </Button>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {isEnglish
              ? (isEditMode ? 'User Management / Edit Profile' : 'User Management / Account Details')
              : (isEditMode ? 'Quản Trị Người Dùng / Chỉnh Sửa Hồ Sơ' : 'Quản Trị Người Dùng / Chi Tiết Tài Khoản')}
          </Text>
        </Space>

        <Space size={10}>
          {!isEditMode && canDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setIsDeleteModalOpen(true)}
              style={{ borderRadius: 8 }}
            >
              {isEnglish ? 'Delete Account' : 'Xóa Tài Khoản'}
            </Button>
          )}

          {!isEditMode && canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate('/user-management/' + userId + '/edit')}
              style={{
                borderRadius: 8,
                backgroundColor: '#1890ff',
                boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                fontWeight: 600,
              }}
            >
              {isEnglish ? 'Edit Profile' : 'Chỉnh Sửa Hồ Sơ'}
            </Button>
          )}

          {isEditMode && (
            <>
              <Button
                onClick={() => navigate('/user-management/' + userId)}
                style={{ borderRadius: 8 }}
              >
                {isEnglish ? 'Cancel' : 'Hủy'}
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
                style={{
                  borderRadius: 8,
                  backgroundColor: '#1890ff',
                  boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                  fontWeight: 600,
                }}
              >
                {isEnglish ? 'Save Changes' : 'Lưu Thay Đổi'}
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 2. Hero Profile Card Tổng Quan */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          marginBottom: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} sm={16} md={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Badge
                  dot
                  color={isActive ? '#52c41a' : '#ff4d4f'}
                  offset={[-6, 56]}
                >
                  <Tooltip title={canUploadAvatar ? (hasCustomAvatar ? 'Nhấn vào avatar để căn chỉnh / cắt lại khung tròn' : 'Nhấn vào avatar để chọn ảnh đại diện') : undefined}>
                    <div
                      onClick={handleAvatarClick}
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        cursor: canUploadAvatar ? 'pointer' : 'default',
                        borderRadius: '50%',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (canUploadAvatar) e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (canUploadAvatar) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Avatar
                        key={avatarPreview || user.avatar || 'avatar-header'}
                        size={72}
                        src={avatarPreview || DriveStorageService.formatAvatarUrl(user.avatar, 400)}
                        style={{
                          backgroundColor: '#e6f7ff',
                          border: `3px solid ${roleColor === 'red' ? '#ff4d4f' : '#1890ff'}`,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                        }}
                      >
                        {user.name ? user.name.substring(0, 2).toUpperCase() : 'LK'}
                      </Avatar>
                    </div>
                  </Tooltip>
                </Badge>

                {canUploadAvatar && (
                  <Upload
                    showUploadList={false}
                    beforeUpload={handleSelectAvatarFile}
                    accept="image/*"
                    disabled={uploadingAvatar}
                  >
                    <Tooltip title="Đổi ảnh đại diện">
                      <Button
                        type="primary"
                        shape="circle"
                        size="small"
                        icon={uploadingAvatar ? <LoadingOutlined /> : <CameraOutlined />}
                        loading={uploadingAvatar}
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          backgroundColor: '#1890ff',
                          borderColor: '#ffffff',
                          borderWidth: 2,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      />
                    </Tooltip>
                  </Upload>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
                    {user.name}
                  </Title>
                  <Tag color="geekblue" style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', margin: 0 }}>
                    {user.code || user.id}
                  </Tag>
                  {user.isRootAdmin && (
                    <Tag color="gold" style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>
                      ROOT IT ADMIN
                    </Tag>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <Tag color={roleColor} style={{ fontSize: 12, padding: '2px 8px', margin: 0 }}>
                    {isEnglish ? (ROLE_LABELS.en?.[user.role] || user.role) : (ROLE_LABELS.vi?.[user.role] || user.role)}
                  </Tag>
                  <Tag
                    color={isActive ? 'success' : 'error'}
                    style={{ fontSize: 12, padding: '2px 8px', margin: 0 }}
                  >
                    {isActive ? (isEnglish ? 'Active' : 'Đang Hoạt Động') : (isEnglish ? 'Disabled' : 'Đã Vô Hiệu Hóa')}
                  </Tag>
                  <span style={{ color: '#64748b', fontSize: 13, marginLeft: 6 }}>
                    <MailOutlined style={{ marginRight: 4 }} />
                    {user.email}
                  </span>
                  {user.phoneNumber && (
                    <span style={{ color: '#64748b', fontSize: 13, marginLeft: 6 }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      {user.phoneNumber}
                    </span>
                  )}
                </div>

                {/* Phím tắt Cắt Lại & Xem Ảnh Gốc (nhỏ gọn cạnh thông tin) */}
                {hasCustomAvatar && canUploadAvatar && (
                  <div style={{ marginTop: 8 }}>
                    <Space size={8}>
                      <Tooltip title={isEnglish ? 'Adjust circular crop from original photo' : 'Căn chỉnh & cắt lại khung tròn từ ảnh gốc'}>
                        <Button
                          size="small"
                          icon={<ScissorOutlined />}
                          onClick={handleReCropExistingAvatar}
                          style={{ borderRadius: 6, fontSize: 12 }}
                        >
                          {isEnglish ? 'Re-crop' : 'Cắt Lại'}
                        </Button>
                      </Tooltip>
                      <Tooltip title={isEnglish ? 'View full original photo in new tab' : 'Xem ảnh đầy đủ nguyên gốc trên tab mới'}>
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(user.avatarOriginal || user.avatar, '_blank')}
                          style={{ borderRadius: 6, fontSize: 12 }}
                        >
                          {isEnglish ? 'View Original' : 'Xem Ảnh Gốc'}
                        </Button>
                      </Tooltip>
                    </Space>
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* Quick Status Toggle */}
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <Text strong style={{ fontSize: 12, color: '#475569' }}>
                {isEnglish ? 'ACCOUNT STATUS' : 'TRẠNG THÁI TÀI KHOẢN'}
              </Text>
              <Tooltip
                title={
                  isRootAdmin
                    ? (isEnglish ? 'Supreme Root Admin cannot be disabled' : 'Root Admin tối cao không thể bị khóa')
                    : !canChangeStatus
                    ? (isEnglish ? 'You do not have permission to change status for this account' : 'Bạn không có quyền thay đổi trạng thái của tài khoản này')
                    : isActive
                    ? (isEnglish ? 'Toggle to temporarily disable this account' : 'Gạt để tạm khóa tài khoản này')
                    : (isEnglish ? 'Toggle to reactivate this account' : 'Gạt để kích hoạt lại tài khoản')
                }
              >
                <Switch
                  checked={isActive}
                  disabled={isRootAdmin || !canChangeStatus}
                  checkedChildren={<CheckCircleOutlined />}
                  unCheckedChildren={<CloseCircleOutlined />}
                  onChange={handleToggleStatus}
                  style={{ backgroundColor: isActive ? '#52c41a' : '#ff4d4f' }}
                />
              </Tooltip>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 3. CHẾ ĐỘ VIEW (XEM HỒ SƠ) HOẶC CHẾ ĐỘ EDIT (CHỈNH SỬA HỒ SƠ) */}
      {!isEditMode ? (
        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
          }}
          styles={{ body: { padding: '8px 20px 24px' } }}
        >
          <Tabs
            defaultActiveKey="overview"
            items={[
              // ================= TAB 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ (VIEW ONLY) =================
              {
                key: 'overview',
                label: (
                  <Space>
                    <UserOutlined />
                    <span>{isEnglish ? 'Personal Info & Contact' : 'Thông Tin Cá Nhân & Liên Hệ'}</span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Descriptions
                      bordered
                      size="middle"
                      column={{ xs: 1, sm: 2, md: 3 }}
                      styles={{ label: { fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }, content: { color: '#0f172a' } }}
                    >
                      <Descriptions.Item label={isEnglish ? 'Full Name' : 'Họ và Tên'}>
                        <Text strong style={{ fontSize: 15 }}>{user.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'Account Code' : 'Mã Tài Khoản'}>
                        <Tag color="geekblue" style={{ fontWeight: 700 }}>{user.code || user.id}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'RBAC Role' : 'Vai Trò Phân Quyền'}>
                        <Tag color={roleColor} style={{ fontWeight: 600 }}>
                          {isEnglish ? (ROLE_LABELS.en?.[user.role] || user.role) : (ROLE_LABELS.vi?.[user.role] || user.role)}
                        </Tag>
                      </Descriptions.Item>

                      <Descriptions.Item label={isEnglish ? 'Email Address' : 'Địa Chỉ Email'}>
                        <Space direction="vertical" size={2}>
                          <span>{user.email}</span>
                          {isGmail ? (
                            <span style={{ fontSize: 11, color: '#d97706' }}>
                              <GoogleOutlined /> {isEnglish ? 'Google Auth & Password' : 'Đăng nhập Google / Mật khẩu'}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#475569' }}>
                              <LockOutlined /> {isEnglish ? 'Official Password' : 'Mật khẩu công vụ'}
                            </span>
                          )}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'Phone Number' : 'Số Điện Thoại'}>
                        {user.phoneNumber ? (
                          <a href={'tel:' + user.phoneNumber} style={{ color: '#0284c7' }}>
                            <PhoneOutlined style={{ marginRight: 6 }} />
                            {user.phoneNumber}
                          </a>
                        ) : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'Gender' : 'Giới Tính'}>
                        {user.gender || '—'}
                      </Descriptions.Item>

                      <Descriptions.Item label={isEnglish ? 'Date of Birth' : 'Ngày Sinh'}>
                        {user.dateOfBirth || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'Citizen ID / Passport' : 'Số CCCD / Hộ Chiếu'}>
                        {user.idCardNumber || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'Join Date' : 'Ngày Gia Nhập'}>
                        {user.joinDate || '—'}
                      </Descriptions.Item>

                      <Descriptions.Item label={isEnglish ? 'Permanent Address' : 'Địa Chỉ Thường Trú'} span={2}>
                        {user.address || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={isEnglish ? 'Province / City' : 'Tỉnh / Thành Phố'}>
                        {user.city || 'TP. Hồ Chí Minh'}
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Nút Chỉnh Sửa Nhanh cuối Tab (nếu có quyền) */}
                    {canEdit && (
                      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={() => navigate('/user-management/' + userId + '/edit')}
                          style={{
                            borderRadius: 8,
                            backgroundColor: '#1890ff',
                            boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                            fontWeight: 600,
                          }}
                        >
                          {isEnglish ? 'Edit Personal Information' : 'Chỉnh Sửa Thông Tin Cá Nhân'}
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },

              // ================= TAB 2: NGHIỆP VỤ & PHÂN QUYỀN (VIEW ONLY) =================
              {
                key: 'business',
                label: (
                  <Space>
                    <BookOutlined />
                    <span>
                      {isEnglish
                        ? `Professional Details (${ROLE_LABELS.en?.[user.role] || user.role})`
                        : `Nghiệp Vụ & Phân Quyền (${ROLE_LABELS.vi?.[user.role] || user.role})`}
                    </span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    {/* DÀNH CHO GIÁO VIÊN BẢN XỨ (Teacher, ví dụ GV004) */}
                    {user.role === 'teacher' && (
                      <div>
                        {/* 3 Metric Highlight Cards */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                          <Col xs={24} sm={8}>
                            <Card
                              size="small"
                              style={{
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                                border: '1px solid #bbf7d0',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <GlobalOutlined style={{ fontSize: 26, color: '#16a34a' }} />
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {isEnglish ? 'Nationality' : 'Quốc Tịch'}
                                  </Text>
                                  <Title level={5} style={{ margin: 0, color: '#15803d' }}>
                                    {user.nationality || 'Australia 🇦🇺'}
                                  </Title>
                                </div>
                              </div>
                            </Card>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Card
                              size="small"
                              style={{
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <TrophyOutlined style={{ fontSize: 26, color: '#2563eb' }} />
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {isEnglish ? 'Teaching Certificate' : 'Bằng Cấp Sư Phạm'}
                                  </Text>
                                  <Title level={5} style={{ margin: 0, color: '#1d4ed8' }}>
                                    {user.certificate || 'TESOL / CELTA'}
                                  </Title>
                                </div>
                              </div>
                            </Card>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Card
                              size="small"
                              style={{
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)',
                                border: '1px solid #fef08a',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <SafetyCertificateOutlined style={{ fontSize: 26, color: '#ca8a04' }} />
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {isEnglish ? 'Rate per Session' : 'Đơn Giá Tiết Dạy'}
                                  </Text>
                                  <Title level={5} style={{ margin: 0, color: '#a16207' }}>
                                    {user.hourlyRate ? `${Number(user.hourlyRate).toLocaleString('vi-VN')} ₫ / tiết` : '420.000 ₫ / tiết'}
                                  </Title>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        </Row>

                        <Descriptions
                          bordered
                          size="middle"
                          column={{ xs: 1, sm: 2 }}
                          styles={{ label: { fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }, content: { color: '#0f172a' } }}
                        >
                          <Descriptions.Item label={isEnglish ? 'Assigned Classes' : 'Các Lớp Đang Phụ Trách'}>
                            {user.assignedClasses ? (
                              <Space size={6} wrap>
                                {user.assignedClasses.split(',').map((cls) => (
                                  <Tag key={cls.trim()} color="blue">{cls.trim()}</Tag>
                                ))}
                              </Space>
                            ) : (
                              <Text type="secondary">{isEnglish ? 'None assigned' : 'Chưa phân công lớp'}</Text>
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label={isEnglish ? 'Operational Notes' : 'Ghi Chú Phân Công'}>
                            {user.extraInfo || '—'}
                          </Descriptions.Item>
                          <Descriptions.Item label={isEnglish ? 'Teacher Bio / Introduction' : 'Tiểu Sử & Giới Thiệu Bản Thân'} span={2}>
                            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#475569' }}>
                              {user.bio || (isEnglish ? 'No introduction written yet.' : 'Chưa cập nhật tiểu sử giới thiệu giáo viên.')}
                            </Paragraph>
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    )}

                    {/* DÀNH CHO HỌC VIÊN (Student) */}
                    {user.role === 'student' && (
                      <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                          <Col xs={24} sm={8}>
                            <Card size="small" style={{ borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Curriculum Level' : 'Cấp Độ Giáo Trình'}</Text>
                              <Title level={4} style={{ margin: 0, color: '#15803d' }}>Wonders {user.level || 'G1'}</Title>
                            </Card>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Card size="small" style={{ borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Attendance Rate' : 'Tỷ Lệ Chuyên Cần'}</Text>
                              <Title level={4} style={{ margin: 0, color: '#1d4ed8' }}>{user.attendanceRate !== undefined ? `${user.attendanceRate}%` : '96%'}</Title>
                            </Card>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Card size="small" style={{ borderRadius: 10, background: '#fdf4ff', border: '1px solid #f5d0fe' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Tuition Status' : 'Tình Trạng Học Phí'}</Text>
                              <Tag color="green" style={{ fontSize: 13, padding: '2px 8px', marginTop: 4 }}>
                                {user.tuitionStatus || (isEnglish ? 'Paid in Full' : 'Đã đóng đủ')}
                              </Tag>
                            </Card>
                          </Col>
                        </Row>

                        <Descriptions bordered size="middle" column={{ xs: 1, sm: 2 }} styles={{ label: { fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }, content: { color: '#0f172a' } }}>
                          <Descriptions.Item label={isEnglish ? 'Enrolled Class' : 'Lớp Học Đang Tham Gia'}>
                            <Tag color="cyan">{user.className || 'Wonders G1-A'}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label={isEnglish ? 'Parent Contact' : 'Phụ Huynh Liên Hệ'}>
                            {user.parentName ? `${user.parentName} (${user.parentPhone || '—'})` : '—'}
                          </Descriptions.Item>
                          <Descriptions.Item label={isEnglish ? 'Academic Notes' : 'Nhận Xét Sư Phạm'} span={2}>
                            {user.academicNotes || '—'}
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    )}

                    {/* DÀNH CHO GIÁO VỤ (Academic) */}
                    {user.role === 'academic' && (
                      <Descriptions bordered size="middle" column={{ xs: 1, sm: 2 }} styles={{ label: { fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }, content: { color: '#0f172a' } }}>
                        <Descriptions.Item label={isEnglish ? 'Position' : 'Chức Danh Giáo Vụ'}>
                          {user.position || 'Điều phối viên giáo vụ'}
                        </Descriptions.Item>
                        <Descriptions.Item label={isEnglish ? 'Department' : 'Phòng Ban'}>
                          {user.department || 'Phòng Đào Tạo'}
                        </Descriptions.Item>
                        <Descriptions.Item label={isEnglish ? 'Managed Classes' : 'Số Lớp Điều Phối'}>
                          {user.managedClasses || 8} {isEnglish ? 'classes' : 'lớp'}
                        </Descriptions.Item>
                        <Descriptions.Item label={isEnglish ? 'KPI Performance' : 'KPI Hoàn Thành'}>
                          <Tag color="blue">{user.completedTasks || 95}%</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    )}

                    {/* Các vai trò khác (Admin, Director, Accountant) */}
                    {!['teacher', 'student', 'academic'].includes(user.role) && (
                      <Descriptions bordered size="middle" column={{ xs: 1, sm: 2 }} styles={{ label: { fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }, content: { color: '#0f172a' } }}>
                        <Descriptions.Item label={isEnglish ? 'System RBAC Role' : 'Vai Trò Phân Quyền'}>
                          <Tag color={roleColor}>{isEnglish ? ROLE_LABELS.en?.[user.role] : ROLE_LABELS.vi?.[user.role]}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={isEnglish ? 'Operational Notes' : 'Ghi Chú Nghiệp Vụ'}>
                          {user.extraInfo || '—'}
                        </Descriptions.Item>
                      </Descriptions>
                    )}

                    {/* Nút Chỉnh Sửa Nhanh cuối Tab (nếu có quyền) */}
                    {canEdit && (
                      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={() => navigate('/user-management/' + userId + '/edit')}
                          style={{
                            borderRadius: 8,
                            backgroundColor: '#1890ff',
                            boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                            fontWeight: 600,
                          }}
                        >
                          {isEnglish ? 'Edit Professional Details' : 'Chỉnh Sửa Thông Tin Nghiệp Vụ'}
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },

              // ================= TAB 3: AUDIT LOGS (CHỈ ADMIN) =================
              ...(isAdmin ? [{
                key: 'audit',
                label: (
                  <Space>
                    <HistoryOutlined />
                    <span>
                      {isEnglish
                        ? `Activity & Audit Logs (${userAuditLogs.length})`
                        : `Nhật Ký Hoạt Động & Kiểm Toán (${userAuditLogs.length})`}
                    </span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">
                        {isEnglish
                          ? 'Full timeline of logins, profile updates, and status changes for this account:'
                          : 'Lịch sử toàn bộ các lần đăng nhập, cập nhật hồ sơ và thay đổi trạng thái của tài khoản này:'}
                      </Text>
                    </div>

                    {auditLoading ? (
                      <div style={{ textAlign: 'center', padding: 24 }}>
                        <Spin description={isEnglish ? 'Loading audit logs...' : 'Đang tải lịch sử kiểm toán...'} />
                      </div>
                    ) : userAuditLogs.length === 0 ? (
                      <Alert
                        type="info"
                        showIcon
                        message={isEnglish ? 'No activity logs found' : 'Chưa có nhật ký ghi nhận riêng'}
                        description={isEnglish ? 'This account has no recorded profile updates or logins recently.' : 'Tài khoản này chưa có thao tác cập nhật hoặc lần đăng nhập nào được ghi nhận gần đây.'}
                      />
                    ) : (
                      <Timeline
                        mode="left"
                        items={userAuditLogs.map((log) => ({
                          color:
                            log.action === 'CREATE_USER'
                              ? 'blue'
                              : log.action === 'ACTIVATE_USER'
                              ? 'green'
                              : log.action === 'DISABLE_USER'
                              ? 'red'
                              : log.action === 'LOGIN_SUCCESS'
                              ? 'cyan'
                              : 'gold',
                          label: (
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              {new Date(log.createdAt).toLocaleString(isEnglish ? 'en-US' : 'vi-VN')}
                            </span>
                          ),
                          children: (
                            <div>
                              <Text strong style={{ fontSize: 13 }}>
                                {log.actionLabel || log.action}
                              </Text>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {log.details}
                              </div>
                              {log.actor && (
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                  Thực hiện bởi: {log.actor.name} ({log.actor.role})
                                </div>
                              )}
                            </div>
                          ),
                        }))}
                      />
                    )}
                  </div>
                ),
              }] : []),
            ]}
          />
        </Card>
      ) : (
        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
          }}
          styles={{ body: { padding: '8px 20px 24px' } }}
        >
        <Form
          form={form}
          layout="vertical"
          disabled={false}
          onFinish={handleSave}
        >
          <Tabs
            defaultActiveKey="basic"
            items={[
              // ================= TAB 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ =================
              {
                key: 'basic',
                label: (
                  <Space>
                    <UserOutlined />
                    <span>{isEnglish ? 'Personal Info & Contact' : 'Thông Tin Cá Nhân & Liên Hệ'}</span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Row gutter={20}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          name="name"
                          label={<Text strong>{isEnglish ? 'Full Name' : 'Họ và Tên'}</Text>}
                          rules={[{ required: true, message: isEnglish ? 'Please enter full name' : 'Vui lòng nhập họ và tên' }]}
                        >
                          <Input
                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isEnglish ? 'Enter full name...' : 'Nhập họ và tên...'}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          name="email"
                          label={<Text strong>{isEnglish ? 'Email Address' : 'Địa Chỉ Email'}</Text>}
                          rules={[
                            { required: true, message: isEnglish ? 'Please enter email' : 'Vui lòng nhập email' },
                            { type: 'email', message: isEnglish ? 'Invalid email format' : 'Email không hợp lệ' },
                          ]}
                          extra={
                            watchedEmail ? (
                              isGmail ? (
                                <span style={{ color: '#d97706', fontSize: 12 }}>
                                  ✨ <b>Gmail:</b> {isEnglish ? 'Sign in with Google or Password' : 'Đăng nhập Google hoặc Mật khẩu'}
                                </span>
                              ) : (
                                <span style={{ color: '#475569', fontSize: 12 }}>
                                  🔒 <b>{isEnglish ? 'Official Email:' : 'Email công vụ:'}</b> {isEnglish ? 'Sign in with Password' : 'Đăng nhập bằng Mật khẩu'}
                                </span>
                              )
                            ) : null
                          }
                        >
                          <Input
                            prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="email@lakeducation.com"
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          name="phoneNumber"
                          label={<Text strong>{isEnglish ? 'Phone Number' : 'Số Điện Thoại Cá Nhân'}</Text>}
                        >
                          <Input
                            prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="0909 509 116"
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={20}>
                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="gender"
                          label={<Text strong>{isEnglish ? 'Gender' : 'Giới Tính'}</Text>}
                        >
                          <Select style={{ borderRadius: 8 }}>
                            <Option value="Nam">{isEnglish ? 'Male' : 'Nam'}</Option>
                            <Option value="Nữ">{isEnglish ? 'Female' : 'Nữ'}</Option>
                            <Option value="Khác">{isEnglish ? 'Other' : 'Khác'}</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="dateOfBirth"
                          label={<Text strong>{isEnglish ? 'Date of Birth' : 'Ngày Sinh'}</Text>}
                        >
                          <DatePicker
                            format={isEnglish ? ['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'] : ['DD/MM/YYYY', 'YYYY-MM-DD']}
                            placeholder={isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                            style={{ width: '100%', borderRadius: 8 }}
                            allowClear
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="idCardNumber"
                          label={<Text strong>{isEnglish ? 'Citizen ID / Passport' : 'Số CCCD / Hộ Chiếu / Mã Định Danh'}</Text>}
                        >
                          <Input
                            prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isEnglish ? 'Enter ID number or passport...' : 'Nhập số CCCD hoặc Passport...'}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={20}>
                      <Col xs={24} sm={16} md={16}>
                        <Form.Item
                          name="address"
                          label={<Text strong>{isEnglish ? 'Permanent / Current Address' : 'Địa Chỉ Thường Trú / Tạm Trú'}</Text>}
                        >
                          <Input
                            prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isEnglish ? 'Street address, ward, district...' : 'Số nhà, tên đường, phường/xã, quận/huyện...'}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="city"
                          label={<Text strong>{isEnglish ? 'City / Province' : 'Tỉnh / Thành Phố'}</Text>}
                        >
                          <Input
                            placeholder={isEnglish ? 'Ho Chi Minh City' : 'TP. Hồ Chí Minh'}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0 20px' }} />

                    {/* Phương thức đăng nhập và Bảo mật */}
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <Title level={5} style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
                        <SafetyCertificateOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                        {isEnglish ? 'Authentication & Login Methods' : 'Phương Thức Xác Thực Đăng Nhập'}
                      </Title>
                      <Row gutter={20} align="middle">
                        <Col xs={24} sm={12}>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            {isEnglish ? 'Allowed login methods by system policy:' : 'Các phương thức được phép theo quy chuẩn hệ thống:'}
                          </Text>
                          {isGmail ? (
                            <Space size={8}>
                              <Tag icon={<GoogleOutlined />} color="orange" style={{ padding: '3px 8px', fontSize: 12 }}>
                                {isEnglish ? 'Google OAuth (1-Tap)' : 'Google OAuth (1 chạm)'}
                              </Tag>
                              <Tag icon={<KeyOutlined />} color="default" style={{ padding: '3px 8px', fontSize: 12 }}>
                                {isEnglish ? 'Email + Password' : 'Email + Mật Khẩu'}
                              </Tag>
                            </Space>
                          ) : (
                            <Tag icon={<KeyOutlined />} color="default" style={{ padding: '3px 8px', fontSize: 12 }}>
                              {isEnglish ? 'Email + Password (Official)' : 'Email + Mật Khẩu (Email công vụ)'}
                            </Tag>
                          )}
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="newPassword"
                            label={<Text strong>{isEnglish ? 'Reset Password (Leave blank to keep unchanged)' : 'Đặt Lại Mật Khẩu Mới (Để trống nếu không đổi)'}</Text>}
                            style={{ margin: 0 }}
                          >
                            <Input.Password
                              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                              placeholder={isEnglish ? 'Enter new password (min 6 characters)...' : 'Nhập mật khẩu mới (tối thiểu 6 ký tự)...'}
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },

              // ================= TAB 2: NGHIỆP VỤ & PHÂN QUYỀN THEO ROLE =================
              {
                key: 'business',
                label: (
                  <Space>
                    <BookOutlined />
                    <span>
                      {isEnglish
                        ? `Professional & Role (${ROLE_LABELS.en?.[user.role] || user.role})`
                        : `Nghiệp Vụ & Phân Quyền (${ROLE_LABELS.vi?.[user.role] || user.role})`}
                    </span>
                  </Space>
                ),
                children: (
                  <div style={{ paddingTop: 12 }}>
                    {/* Phần Phân Quyền Hệ Thống */}
                    <Row gutter={20}>
                      <Col xs={24} sm={12} md={12}>
                        <Form.Item
                          name="role"
                          label={<Text strong>{isEnglish ? 'System RBAC Role' : 'Vai Trò Hệ Thống (RBAC Role)'}</Text>}
                          tooltip={
                            isAdmin
                              ? (isEnglish ? 'Only IT Admin is permitted to change roles' : 'Chỉ IT Admin được phép thay đổi vai trò')
                              : (isEnglish ? 'You do not have permission to change roles' : 'Bạn không có quyền đổi vai trò')
                          }
                        >
                          <Select
                            disabled={!isAdmin || user.id === 'ADM001'}
                            style={{ borderRadius: 8 }}
                          >
                            {Object.values(USER_ROLES).map((role) => (
                              <Option key={role} value={role}>
                                <Tag color={ROLE_COLORS[role]} style={{ marginRight: 6 }}>
                                  {role.toUpperCase()}
                                </Tag>
                                {isEnglish ? (ROLE_LABELS.en?.[role] || role) : (ROLE_LABELS.vi?.[role] || role)}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={12}>
                        <Form.Item
                          name="extraInfo"
                          label={<Text strong>{isEnglish ? 'Operational Notes / Position' : 'Ghi Chú Nghiệp Vụ / Chức Danh'}</Text>}
                        >
                          <Input
                            placeholder={isEnglish ? 'Assignment notes, department or quota...' : 'Ghi chú phân công, phòng ban hoặc định mức...'}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '10px 0 20px' }}>
                      <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                        {isEnglish ? 'Role-Specific Details:' : 'Thông tin chi tiết đặc thù cho vai trò:'}{' '}
                        {isEnglish ? (ROLE_LABELS.en?.[user.role] || user.role) : (ROLE_LABELS.vi?.[user.role] || user.role)}
                      </Text>
                    </Divider>

                    {/* Dynamic Fields: DÀNH CHO HỌC VIÊN (Student) */}
                    {user.role === 'student' && (
                      <Row gutter={20}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="className" label={<Text strong>{isEnglish ? 'Enrolled Class' : 'Lớp Học Đang Tham Gia'}</Text>}>
                            <Input placeholder={isEnglish ? 'E.g. Wonders Primary G3-A' : 'VD: Wonders Primary G3-A'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="level" label={<Text strong>{isEnglish ? 'Curriculum Level' : 'Cấp Độ Chương Trình (Level)'}</Text>}>
                            <Select style={{ borderRadius: 8 }}>
                              <Option value="GK">{isEnglish ? 'Wonders GK (Kindergarten)' : 'Wonders GK (Mầm non / Kindergarten)'}</Option>
                              <Option value="G1">{isEnglish ? 'Wonders G1 (Grade 1)' : 'Wonders G1 (Lớp 1)'}</Option>
                              <Option value="G2">{isEnglish ? 'Wonders G2 (Grade 2)' : 'Wonders G2 (Lớp 2)'}</Option>
                              <Option value="G3">{isEnglish ? 'Wonders G3 (Grade 3)' : 'Wonders G3 (Lớp 3)'}</Option>
                              <Option value="G4">{isEnglish ? 'Wonders G4 (Grade 4)' : 'Wonders G4 (Lớp 4)'}</Option>
                              <Option value="G5">{isEnglish ? 'Wonders G5 (Grade 5)' : 'Wonders G5 (Lớp 5)'}</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="tuitionStatus" label={<Text strong>{isEnglish ? 'Tuition Status' : 'Tình Trạng Học Phí'}</Text>}>
                            <Select style={{ borderRadius: 8 }}>
                              <Option value="Đã đóng đủ">{isEnglish ? 'Paid in Full' : 'Đã đóng đủ (Hoàn tất)'}</Option>
                              <Option value="Còn nợ đợt 2">{isEnglish ? 'Installment 2 Due' : 'Còn nợ đợt 2'}</Option>
                              <Option value="Học bổng / Miễn giảm">{isEnglish ? 'Scholarship / Waived' : 'Học bổng / Miễn giảm'}</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="parentName" label={<Text strong>{isEnglish ? 'Parent / Guardian Name' : 'Họ Tên Phụ Huynh / Người Giám Hộ'}</Text>}>
                            <Input placeholder={isEnglish ? 'E.g. Mr. Tuan / Ms. Mai' : 'VD: Anh Tuấn / Chị Mai'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="parentPhone" label={<Text strong>{isEnglish ? 'Parent Phone Number' : 'Số Điện Thoại Phụ Huynh'}</Text>}>
                            <Input placeholder="0912 345 678" style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="attendanceRate" label={<Text strong>{isEnglish ? 'Attendance Rate (%)' : 'Tỷ Lệ Chuyên Cần (%)'}</Text>}>
                            <InputNumber min={0} max={100} style={{ width: '100%', borderRadius: 8 }} addonAfter="%" />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item name="academicNotes" label={<Text strong>{isEnglish ? 'Learning Progress & Teacher Feedback' : 'Nhận Xét Tiến Độ Học Tập / Đánh Giá Giáo Viên'}</Text>}>
                            <TextArea rows={3} placeholder={isEnglish ? 'Reading fluency, phonics, vocabulary and homework submission...' : 'Ghi nhận khả năng đọc hiểu, phát âm, từ vựng và bài tập về nhà...'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    {/* Dynamic Fields: DÀNH CHO GIÁO VIÊN BẢN XỨ (Teacher) */}
                    {user.role === 'teacher' && (
                      <Row gutter={20}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="nationality" label={<Text strong>{isEnglish ? 'Nationality' : 'Quốc Tịch'}</Text>}>
                            <Input prefix={<GlobalOutlined style={{ color: '#94a3b8' }} />} placeholder={isEnglish ? 'USA, UK, Canada...' : 'Mỹ (US), Anh (UK)...'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="certificate" label={<Text strong>{isEnglish ? 'Teaching Certificate' : 'Bằng Cấp / Chứng Chỉ Sư Phạm'}</Text>}>
                            <Input prefix={<TrophyOutlined style={{ color: '#94a3b8' }} />} placeholder="TESOL, CELTA, TEFL..." style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="hourlyRate" label={<Text strong>{isEnglish ? 'Session Rate (VND / Session)' : 'Đơn Giá Tiết Dạy (VNĐ / Tiết)'}</Text>}>
                            <InputNumber
                              min={100000}
                              step={50000}
                              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={(v) => v.replace(/\$\s?|(,*)/g, '')}
                              style={{ width: '100%', borderRadius: 8 }}
                              addonAfter={isEnglish ? 'VND' : 'VNĐ'}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item name="assignedClasses" label={<Text strong>{isEnglish ? 'Assigned Classes' : 'Các Lớp Đang Phụ Trách'}</Text>}>
                            <Input placeholder="GK-A, G1-B, G3-Online..." style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item name="bio" label={<Text strong>{isEnglish ? 'Teacher Bio / Introduction' : 'Giới Thiệu Bản Thân / Profile Giáo Viên'}</Text>}>
                            <Input placeholder={isEnglish ? 'Over 5 years experience teaching Wonders ELA for young learners...' : 'Hơn 5 năm kinh nghiệm giảng dạy Wonders ELA cho lứa tuổi mầm non và tiểu học...'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    {/* Dynamic Fields: DÀNH CHO GIÁO VỤ (Academic) */}
                    {user.role === 'academic' && (
                      <Row gutter={20}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="position" label={<Text strong>{isEnglish ? 'Academic Position' : 'Chức Danh Giáo Vụ'}</Text>}>
                            <Input placeholder={isEnglish ? 'Academic coordinator, Zoom room supervisor...' : 'Điều phối viên học vụ, Quản lý lớp Zoom...'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="managedClasses" label={<Text strong>{isEnglish ? 'Managed Classes' : 'Số Lớp Đang Điều Phối'}</Text>}>
                            <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} placeholder={isEnglish ? '8 classes' : '8 lớp'} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="completedTasks" label={<Text strong>{isEnglish ? 'Academic KPI Score (%)' : 'KPI Hoàn Thành Học Vụ (%)'}</Text>}>
                            <InputNumber min={0} max={100} style={{ width: '100%', borderRadius: 8 }} addonAfter="%" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    {/* Dynamic Fields: DÀNH CHO KẾ TOÁN / GIÁM ĐỐC / ADMIN */}
                    {['accountant', 'director', 'admin'].includes(user.role) && (
                      <Row gutter={20}>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item name="department" label={<Text strong>{isEnglish ? 'Department / Unit' : 'Phòng Ban / Đơn Vị Công Tác'}</Text>}>
                            <Input placeholder={isEnglish ? 'Finance & Accounting / Executive Board...' : 'Phòng Kế Toán & Tài Chính / Ban Giám Đốc...'} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item name="joinDate" label={<Text strong>{isEnglish ? 'Start / Join Date' : 'Ngày Bắt Đầu Làm Việc'}</Text>}>
                            <DatePicker
                              format={isEnglish ? ['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'] : ['DD/MM/YYYY', 'YYYY-MM-DD']}
                              placeholder={isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                              style={{ width: '100%', borderRadius: 8 }}
                              allowClear
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  </div>
                ),
              },

              // ================= TAB 3: LỊCH SỬ HOẠT ĐỘNG & AUDIT TRAIL (CHỈ HIỂN THỊ KHI ROLE LÀ ADMIN) =================
              ...(isAdmin
                ? [
                    {
                      key: 'audit',
                      label: (
                        <Space>
                          <HistoryOutlined />
                          <span>
                            {isEnglish
                              ? `Activity & Audit Logs (${userAuditLogs.length})`
                              : `Nhật Ký Hoạt Động & Kiểm Toán (${userAuditLogs.length})`}
                          </span>
                        </Space>
                      ),
                      children: (
                        <div style={{ paddingTop: 16 }}>
                          <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">
                              {isEnglish
                                ? 'Full timeline of logins, profile updates, and status changes for this account:'
                                : 'Lịch sử toàn bộ các lần đăng nhập, cập nhật hồ sơ và thay đổi trạng thái của tài khoản này:'}
                            </Text>
                          </div>

                          {auditLoading ? (
                            <div style={{ textAlign: 'center', padding: 24 }}>
                              <Spin description={isEnglish ? 'Loading audit logs...' : 'Đang tải lịch sử kiểm toán...'} />
                            </div>
                          ) : userAuditLogs.length === 0 ? (
                            <Alert
                              type="info"
                              showIcon
                              message={isEnglish ? 'No activity logs found' : 'Chưa có nhật ký ghi nhận riêng'}
                              description={isEnglish ? 'This account has no recorded profile updates or logins recently.' : 'Tài khoản này chưa có thao tác cập nhật hoặc lần đăng nhập nào được ghi nhận gần đây.'}
                            />
                          ) : (
                            <Timeline
                              mode="left"
                              items={userAuditLogs.map((log) => ({
                                color:
                                  log.action === 'CREATE_USER'
                                    ? 'blue'
                                    : log.action === 'ACTIVATE_USER'
                                    ? 'green'
                                    : log.action === 'DISABLE_USER'
                                    ? 'red'
                                    : log.action === 'LOGIN_SUCCESS'
                                    ? 'cyan'
                                    : 'gold',
                                label: (
                                  <span style={{ fontSize: 12, color: '#64748b' }}>
                                    {new Date(log.createdAt).toLocaleString(isEnglish ? 'en-US' : 'vi-VN')}
                                  </span>
                                ),
                                children: (
                                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                                        {log.actionLabel || log.action}
                                      </Tag>
                                      <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                                        {isEnglish ? 'Performed by:' : 'Thực hiện bởi:'} {log.actor?.name || (isEnglish ? 'System' : 'Hệ thống')} ({log.actor?.role || 'admin'})
                                      </Text>
                                    </div>
                                    <Text style={{ fontSize: 13, color: '#334155', display: 'block' }}>
                                      {log.description}
                                    </Text>
                                  </div>
                                ),
                              }))}
                            />
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />

          <div
            className="lak-form-bottom-actions"
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Button
              size="large"
              onClick={() => navigate('/user-management/' + userId)}
              style={{ borderRadius: 8, minWidth: 120, height: 42, fontWeight: 500 }}
            >
              {isEnglish ? 'Cancel & Return to View' : 'Hủy & Quay Lại Xem'}
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              style={{
                borderRadius: 8,
                backgroundColor: '#1890ff',
                boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                fontWeight: 600,
                minWidth: 170,
                height: 42,
              }}
            >
              {isEnglish ? 'Save Profile Changes' : 'Lưu Thay Đổi Hồ Sơ'}
            </Button>
          </div>
        </Form>
      </Card>
      )}

      {/* 4. Modal Xác Nhận Xóa Mềm Kèm Nhập Lý Do */}
      <UserDeleteModal
        open={isDeleteModalOpen}
        user={user}
        loading={deleteLoading}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* 5. Modal Cắt Ảnh Đại Diện Hình Tròn (Avatar Cropper chuẩn Facebook / Google) */}
      <AvatarCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        fileName={cropFileName}
        initialCropData={user?.avatarCropData}
        onCancel={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
          setRawSelectedFile(null);
        }}
        onApplyCrop={handleApplyCropAndUpload}
      />

      {/* Input File ẩn hỗ trợ khi tap/click trực tiếp vào avatar để chọn ảnh */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleSelectAvatarFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
};

