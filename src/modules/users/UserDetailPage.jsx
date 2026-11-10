import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  StarFilled,
  WarningOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { UserService } from './services/UserService';
import { UserAuditService } from './services/UserAuditService';
import { DriveStorageService } from '../../core/services/DriveStorageService';
import { formatScheduleForViewer, findScheduleConflictsInClassList } from '../../shared/utils/scheduleUtils';
import { DEFAULT_ACTIVE_CLASSES } from './UserRegistrationPage';
import {
  USER_ROLES,
  USER_STATUS,
  ROLE_LABELS,
  ROLE_COLORS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
  toEnglishName,
  generateFamilyId,
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

export const UserDetailPage = ({ isSelfProfile = false }) => {
  const { userId: paramUserId, action } = useParams();
  const isEditMode = action === 'edit';
  const navigate = useNavigate();
  const { currentUser, syncCurrentUserProfile } = useAuth();
  const { isEnglish, language, t } = useLanguage();
  const [form] = Form.useForm();

  const userId = isSelfProfile ? (currentUser?.id || currentUser?.code) : paramUserId;
  const baseProfilePath = isSelfProfile ? '/my-profile' : `/user-management/${userId}`;
  const backListPath = isSelfProfile ? '/dashboard' : '/user-management';

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
  const [linkedClasses, setLinkedClasses] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);

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

  // Theo dõi email, sđt và vai trò nhập vào trong form để nhận diện loại tài khoản thời gian thực
  const watchedEmail = Form.useWatch('email', form) ?? user?.email ?? '';
  const watchedPhone = Form.useWatch('phoneNumber', form) ?? user?.phoneNumber ?? '';
  const watchedRole = Form.useWatch('role', form) || user?.role || USER_ROLES.STUDENT;
  const watchedEditEnrolledClassIds = Form.useWatch('enrolledClassIds', form) || [];
  const isTargetStudent = watchedRole === USER_ROLES.STUDENT;
  const isGmail = isGmailAddress(watchedEmail);

  // Kiểm tra trùng lịch học online thời gian thực trong chế độ Chỉnh sửa
  const editConflictInfo = useMemo(() => {
    return findScheduleConflictsInClassList(watchedEditEnrolledClassIds, availableClasses);
  }, [watchedEditEnrolledClassIds, availableClasses]);

  // Cấp độ tự động nhận diện theo các lớp học đã chọn
  const editDerivedLevels = useMemo(() => {
    if (!watchedEditEnrolledClassIds || watchedEditEnrolledClassIds.length === 0) return [];
    const set = new Set();
    watchedEditEnrolledClassIds.forEach((clsId) => {
      const cls = availableClasses.find((c) => c.id === clsId || c.classId === clsId);
      if (cls) {
        const lvl = cls.courseLevel || cls.level || cls.courseName || 'Wonders G1';
        set.add(lvl);
      }
    });
    return Array.from(set);
  }, [watchedEditEnrolledClassIds, availableClasses]);

  // Tải chi tiết User & danh sách Lớp học thực tế liên kết (cho Giáo viên & Học viên)
  const loadUserDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await UserService.getUserById(userId);
      if (!data) {
        message.error(`Không tìm thấy tài khoản với mã: ${userId}`);
        navigate(backListPath);
        return;
      }
      const normalizedData = {
        ...data,
        englishName: data.englishName || toEnglishName(data.name) || '',
        secondaryPhone: data.secondaryPhone || '',
        familyId: data.familyId || (data.role === 'student' ? generateFamilyId(data.phoneNumber) : ''),
        parentUserId: data.parentUserId || '',
      };
      setUser(normalizedData);

      // Đọc danh sách lớp học thực tế từ localStorage ('lak_erp_classes') để gắn vào Profile của GV / HV
      try {
        const rawClasses = localStorage.getItem('lak_erp_classes');
        const parsedClasses = rawClasses ? JSON.parse(rawClasses) : [];
        const allClasses = Array.isArray(parsedClasses) && parsedClasses.length > 0 ? parsedClasses : DEFAULT_ACTIVE_CLASSES;
        const targetCode = data.id || data.code;
        if (data.role === 'teacher') {
          setLinkedClasses(allClasses.filter((c) => c.teacherId === targetCode));
        } else if (data.role === 'student') {
          const studentClassIds = Array.isArray(data.enrolledClassIds) ? data.enrolledClassIds : [];
          setLinkedClasses(allClasses.filter((c) => 
            (Array.isArray(c.studentIds) && c.studentIds.includes(targetCode)) ||
            studentClassIds.includes(c.id) ||
            studentClassIds.includes(c.classId)
          ));
        } else {
          setLinkedClasses(allClasses);
        }
      } catch {
        setLinkedClasses([]);
      }

      // Đọc danh sách anh chị em cùng cụm gia đình (nếu có familyId)
      const targetFamily = normalizedData.familyId;
      if (targetFamily) {
        try {
          const siblings = await UserService.getFamilyMembers(targetFamily);
          setFamilyMembers(siblings.filter((s) => (s.id || s.code) !== (data.id || data.code)));
        } catch {
          setFamilyMembers([]);
        }
      } else {
        setFamilyMembers([]);
      }

      const initialEnrolled = Array.isArray(data.enrolledClassIds) && data.enrolledClassIds.length > 0
        ? data.enrolledClassIds
        : (data.classId ? [data.classId] : []);

      form.setFieldsValue({
        name: data.name || '',
        englishName: data.englishName || toEnglishName(data.name) || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        secondaryPhone: data.secondaryPhone || '',
        familyId: normalizedData.familyId || '',
        parentUserId: data.parentUserId || '',
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
        enrolledClassIds: initialEnrolled,
        className: data.className || '',
        level: data.level || 'G1',
        parentName: data.parentName || '',
        parentPhone: data.parentPhone || data.phoneNumber || '',
        attendanceRate: data.attendanceRate !== undefined ? data.attendanceRate : 96,
        tuitionStatus: data.tuitionStatus || 'Chờ đối soát',
        academicNotes: data.academicNotes || '',
        nationality: data.nationality || 'Mỹ (US)',
        certificate: data.certificate || 'TESOL / CELTA',
        hourlyRate: data.hourlyRate || 450000,
        assignedClasses: data.assignedClasses || 'GK-A, G1-B',
        bio: data.bio || '',
        position: data.position || (data.role === 'accountant' ? 'Kế toán tổng hợp & Đối soát học phí' : data.role === 'director' ? 'Giám đốc Điều hành (CEO)' : data.role === 'admin' ? 'Trưởng phòng Hạ tầng IT & Bảo mật' : 'Điều phối viên giáo vụ'),
        department: data.department || (data.role === 'accountant' ? 'Phòng Tài Chính - Kế Toán' : data.role === 'director' ? 'Ban Giám Đốc Điều Hành' : data.role === 'admin' ? 'Phòng Quản Trị Hệ Thống IT' : 'Phòng Đào Tạo'),
      });
    } catch (err) {
      message.error(`Lỗi tải thông tin tài khoản: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [userId, backListPath, navigate, form]);

  useEffect(() => {
    loadUserDetail();
  }, [loadUserDetail]);

  // Tải Audit Logs riêng của tài khoản này (Khi Admin xem hoặc chính chủ xem trên /my-profile)
  const loadUserAuditLogs = useCallback(async () => {
    if (!userId || (currentUser?.role !== 'admin' && !isSelfProfile)) return;
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
  }, [userId, user, currentUser?.role, isSelfProfile]);

  useEffect(() => {
    if (user) {
      loadUserAuditLogs();
    }
  }, [user, loadUserAuditLogs]);

  // Quyền hạn RBAC
  const canEdit = user ? PermissionService.canEditUser(currentUser, user) : false;
  const canEditSensitive = PermissionService.canEditSensitiveFields(currentUser?.role);
  const canDelete = user && !isSelfProfile ? PermissionService.canDeleteUser(currentUser, user) : false;
  const canChangeStatus = user ? PermissionService.canChangeUserStatus(currentUser, user) : false;
  const canUploadAvatar = user ? PermissionService.canUploadAvatar(currentUser, user) : false;
  const isAdmin = currentUser?.role === 'admin';
  const canViewAuditLogs = isAdmin || isSelfProfile;
  const isRootAdmin = user?.id === 'ADM001' || user?.email === 'phamquocbao87@gmail.com';

  // Điều hướng an toàn: nếu đang ở chế độ /edit nhưng không có quyền sửa -> Tự động chuyển về chế độ view
  useEffect(() => {
    if (!loading && user && isEditMode && !canEdit) {
      message.warning(isEnglish ? 'You do not have permission to edit this profile' : 'Bạn không có quyền chỉnh sửa tài khoản này');
      navigate(baseProfilePath, { replace: true });
    }
  }, [loading, user, isEditMode, canEdit, navigate, baseProfilePath, isEnglish]);

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
      if (typeof syncCurrentUserProfile === 'function') {
        syncCurrentUserProfile(updatedUser);
      }
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
      const cleanEnglishName = values.englishName?.trim() || toEnglishName(values.name);

      // Chặn nếu học viên bị trùng khung giờ học online giữa các lớp
      if (user?.role === USER_ROLES.STUDENT && editConflictInfo.hasConflict) {
        throw new Error(
          `Không thể lưu do trùng khung giờ học online giữa các lớp đã chọn: ${editConflictInfo.conflicts.map((c) => c.message).join(' | ')}`
        );
      }

      const updatePayload = {
        ...values,
        englishName: cleanEnglishName,
        secondaryPhone: values.secondaryPhone ? values.secondaryPhone.trim() : '',
        familyId: values.familyId || user?.familyId || (user?.role === USER_ROLES.STUDENT ? generateFamilyId(values.phoneNumber) : ''),
        parentUserId: values.parentUserId || user?.parentUserId || '',
        dateOfBirth: formatDateToStr(values.dateOfBirth),
        joinDate: formatDateToStr(values.joinDate),
        status: user?.status || USER_STATUS.ACTIVE,
        authProviders: resolveAuthProvidersByEmail(values.email),
      };

      if (user?.role === USER_ROLES.STUDENT) {
        const editEnrolled = Array.isArray(values.enrolledClassIds) ? values.enrolledClassIds : [];
        updatePayload.enrolledClassIds = editEnrolled;
        updatePayload.className = editEnrolled
          .map((cid) => {
            const c = availableClasses.find((cls) => cls.id === cid || cls.classId === cid);
            return c ? c.name : cid;
          })
          .join(', ') || '';
        updatePayload.level = editDerivedLevels.join(', ') || user?.level || 'Wonders ELA';
        updatePayload.tuitionStatus = user?.tuitionStatus || 'Chờ đối soát';
        updatePayload.parentPhone = values.parentPhone || values.phoneNumber || user?.parentPhone || '';
      }

      if (values.newPassword && values.newPassword.trim()) {
        updatePayload.password = values.newPassword.trim();
      }
      delete updatePayload.newPassword;

      const updated = await UserService.updateUserProfile(currentUser, user, updatePayload);
      form.setFieldValue('newPassword', '');
      setUser(updated);
      if (typeof syncCurrentUserProfile === 'function') {
        syncCurrentUserProfile(updated);
      }
      if (user?.role === USER_ROLES.STUDENT && Array.isArray(updatePayload.enrolledClassIds)) {
        UserService.syncStudentClasses(user.id || user.code, updatePayload.enrolledClassIds);
      }
      message.success(isEnglish ? `Profile of ${updated.name} updated successfully` : `Đã lưu thành công thông tin hồ sơ của ${updated.name}`);
      loadUserAuditLogs();
      navigate(baseProfilePath);
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
      navigate(backListPath);
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
                navigate(baseProfilePath);
              } else {
                navigate(backListPath);
              }
            }}
            style={{ borderRadius: 8 }}
          >
            {isEditMode
              ? t('userDetail.cancelReturn')
              : isSelfProfile
              ? t('userDetail.backToDashboard')
              : t('userDetail.backToList')}
          </Button>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {isSelfProfile
              ? (isEditMode ? `${t('menus.profile')} / ${t('userDetail.btnEdit')}` : `${t('menus.profile')} / ${t('common.details')}`)
              : (isEditMode ? `${t('menus.users')} / ${t('userDetail.btnEdit')}` : `${t('menus.users')} / ${t('common.details')}`)}
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
              {t('userDetail.btnDelete')}
            </Button>
          )}

          {!isEditMode && canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`${baseProfilePath}/edit`)}
              style={{
                borderRadius: 8,
                backgroundColor: '#1890ff',
                boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                fontWeight: 600,
              }}
            >
              {t('userDetail.btnEdit')}
            </Button>
          )}

          {isEditMode && (
            <>
              <Button
                onClick={() => navigate(baseProfilePath)}
                style={{ borderRadius: 8 }}
              >
                {t('common.cancel')}
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
                {t('userDetail.btnSave')}
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
                  {(user.englishName || toEnglishName(user.name)) && (
                    <Tag color="cyan" style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', margin: 0 }}>
                      🇬🇧 {user.englishName || toEnglishName(user.name)}
                    </Tag>
                  )}
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
                      <Tooltip title={t('userDetail.recropTooltip')}>
                        <Button
                          size="small"
                          icon={<ScissorOutlined />}
                          onClick={handleReCropExistingAvatar}
                          style={{ borderRadius: 6, fontSize: 12 }}
                        >
                          {t('userDetail.recrop')}
                        </Button>
                      </Tooltip>
                      <Tooltip title={t('userDetail.viewOriginalTooltip')}>
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(user.avatarOriginal || user.avatar, '_blank')}
                          style={{ borderRadius: 6, fontSize: 12 }}
                        >
                          {t('userDetail.viewOriginal')}
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
                {t('userDetail.accountStatus')}
              </Text>
              <Tooltip
                title={
                  isRootAdmin
                    ? t('userDetail.rootAdminNoLock')
                    : !canChangeStatus
                    ? t('userDetail.noPermStatus')
                    : isActive
                    ? t('userDetail.lockAccountPrompt')
                    : t('userDetail.unlockAccountPrompt')
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
                    <span>{t('userDetail.sections.personal')}</span>
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
                      <Descriptions.Item label={t('userDetail.fields.fullName')}>
                        <Text strong style={{ fontSize: 15 }}>{user.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('userDetail.fields.englishName')}>
                        <Text strong style={{ fontSize: 14, color: '#0284c7' }}>
                          {user.englishName || toEnglishName(user.name)}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('userDetail.fields.code')}>
                        <Tag color="geekblue" style={{ fontWeight: 700 }}>{user.code || user.id}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('userDetail.fields.role')}>
                        <Tag color={roleColor} style={{ fontWeight: 600 }}>
                          {isEnglish ? (ROLE_LABELS.en?.[user.role] || user.role) : (ROLE_LABELS.vi?.[user.role] || user.role)}
                        </Tag>
                      </Descriptions.Item>

                      <Descriptions.Item label={t('userDetail.fields.email')}>
                        <Space direction="vertical" size={2}>
                          <span>{user.email}</span>
                          {isGmail ? (
                            <span style={{ fontSize: 11, color: '#d97706' }}>
                              <GoogleOutlined /> {t('userDetail.fields.googleAuthAndPassword')}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#475569' }}>
                              <LockOutlined /> {t('userDetail.fields.officialPassword')}
                            </span>
                          )}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('userDetail.fields.phone1')}>
                        {user.phoneNumber ? (
                          <a href={'tel:' + user.phoneNumber} style={{ color: '#0284c7' }}>
                            <PhoneOutlined style={{ marginRight: 6 }} />
                            {user.phoneNumber}
                          </a>
                        ) : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('userDetail.fields.phone2')}>
                        {user.secondaryPhone ? (
                          <a href={'tel:' + user.secondaryPhone} style={{ color: '#16a34a' }}>
                            <PhoneOutlined style={{ marginRight: 6 }} />
                            {user.secondaryPhone}
                          </a>
                        ) : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('userDetail.fields.family')}>
                        {user.familyId ? (
                          <Space size={6} wrap>
                            <Tag color="cyan" style={{ fontWeight: 600 }}>{user.familyId}</Tag>
                            {familyMembers.map((m) => (
                              <Tag
                                key={m.id || m.code}
                                color="blue"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/user-management/${m.id || m.code}`)}
                              >
                                {m.name}
                              </Tag>
                            ))}
                          </Space>
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
                          onClick={() => navigate(`${baseProfilePath}/edit`)}
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
                    {/* DÀNH CHO GIÁO VIÊN BẢN XỨ (Teacher, ví dụ GV001..GV007) */}
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
                            {linkedClasses.length > 0 ? (
                              <Space size={6} wrap>
                                {linkedClasses.map((cls) => (
                                  <Tag key={cls.id} color="blue" style={{ fontWeight: 600 }}>
                                    {cls.id} — {cls.name}
                                  </Tag>
                                ))}
                              </Space>
                            ) : user.assignedClasses ? (
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

                        {/* Danh sách Lớp Học Thực Tế Đang Giảng Dạy */}
                        {linkedClasses.length > 0 && (
                          <div style={{ marginTop: 20 }}>
                            <Title level={5} style={{ marginBottom: 12, color: '#0f172a' }}>
                              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                              {isEnglish
                                ? `Active Teaching Classes (${linkedClasses.length})`
                                : `Lịch Giảng Dạy & Lớp Học Thực Tế Đang Đảm Nhiệm (${linkedClasses.length} lớp)`}
                            </Title>
                            <Row gutter={[16, 16]}>
                              {linkedClasses.map((cls) => (
                                <Col xs={24} md={12} key={cls.id}>
                                  <Card
                                    size="small"
                                    style={{ borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc' }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                                      <div>
                                        <Tag color="geekblue" style={{ fontWeight: 700 }}>{cls.id}</Tag>
                                        <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{cls.name}</Text>
                                      </div>
                                      <Tag color="green">{(cls.studentIds || []).length || cls.totalStudents || 0} {isEnglish ? 'students' : 'học viên'}</Tag>
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}>
                                      <div>
                                        <ClockCircleOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                                        <b>{isEnglish ? 'Schedule:' : 'Lịch dạy:'}</b> {formatScheduleForViewer(cls.schedule, isEnglish)}
                                      </div>
                                      {cls.zoomHostLink && (
                                        <div style={{ marginTop: 4 }}>
                                          <LinkOutlined style={{ marginRight: 6, color: '#16a34a' }} />
                                          <a href={cls.zoomHostLink} target="_blank" rel="noreferrer">
                                            {isEnglish ? 'Open Host Zoom Room' : 'Mở Phòng Zoom Giảng Dạy (Host)'}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DÀNH CHO HỌC VIÊN (Student) */}
                    {user.role === 'student' && (
                      <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                          <Col xs={24} sm={8}>
                            <Card size="small" style={{ borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Curriculum Level' : 'Cấp Độ Giáo Trình'}</Text>
                              <Title level={4} style={{ margin: '2px 0 0', color: '#15803d' }}>
                                {linkedClasses.length > 0
                                  ? Array.from(new Set(linkedClasses.map((c) => c.courseLevel || c.level || c.courseName || 'Wonders ELA'))).join(', ')
                                  : (user.level ? (user.level.startsWith('Wonders') ? user.level : `Wonders ${user.level}`) : 'Wonders ELA (Chưa xếp lớp)')}
                              </Title>
                              <Text type="secondary" style={{ fontSize: 11, color: '#16a34a' }}>
                                {isEnglish ? 'Tied to active enrolled classes' : 'Tự động xác định theo lớp ghi danh'}
                              </Text>
                            </Card>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Card size="small" style={{ borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Attendance Rate' : 'Tỷ Lệ Chuyên Cần'}</Text>
                              <Title level={4} style={{ margin: '2px 0 0', color: '#1d4ed8' }}>
                                {user.attendanceRate !== undefined ? `${user.attendanceRate}%` : '100%'}
                              </Title>
                              <Text type="secondary" style={{ fontSize: 11, color: '#2563eb' }}>
                                {isEnglish ? 'Calculated from Zoom sessions' : 'Tự động tính từ số buổi điểm danh Zoom'}
                              </Text>
                            </Card>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Card size="small" style={{ borderRadius: 10, background: '#fdf4ff', border: '1px solid #f5d0fe' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Tuition Status' : 'Tình Trạng Học Phí'}</Text>
                              <div>
                                <Tag
                                  color={user.tuitionStatus === 'Đã đóng đủ' ? 'green' : user.tuitionStatus === 'Chờ đối soát' ? 'gold' : 'blue'}
                                  style={{ fontSize: 13, padding: '2px 8px', marginTop: 4, fontWeight: 600 }}
                                >
                                  {user.tuitionStatus || (isEnglish ? 'Pending Audit' : 'Chờ đối soát')}
                                </Tag>
                              </div>
                              <Text type="secondary" style={{ fontSize: 11, color: '#7c3aed' }}>
                                {isEnglish ? 'Automated accounting sync' : 'Đối soát tự động từ phân hệ Kế toán'}
                              </Text>
                            </Card>
                          </Col>
                        </Row>

                        <Descriptions bordered size="middle" column={{ xs: 1, sm: 2 }} styles={{ label: { fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }, content: { color: '#0f172a' } }}>
                          <Descriptions.Item label={isEnglish ? 'Enrolled Classes' : 'Lớp Học Đang Tham Gia'}>
                            {linkedClasses.length > 0 ? (
                              <Space size={6} wrap>
                                {linkedClasses.map((cls) => (
                                  <Tag key={cls.id} color="cyan" style={{ fontWeight: 600, padding: '3px 8px' }}>
                                    {cls.id} — {cls.name}
                                  </Tag>
                                ))}
                              </Space>
                            ) : (
                              <Tag color="cyan">{user.className || 'Wonders G1-A'}</Tag>
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label={isEnglish ? 'Parent Contact' : 'Phụ Huynh Liên Hệ'}>
                            {user.parentName ? `${user.parentName} (${user.parentPhone || user.phoneNumber || '—'})` : (user.parentPhone || user.phoneNumber || '—')}
                          </Descriptions.Item>
                        </Descriptions>

                        {/* Đánh Giá & Nhận Xét Tiến Độ Học Tập Từ Giáo Viên Bản Xứ */}
                        <div style={{ marginTop: 20 }}>
                          <Title level={5} style={{ marginBottom: 12, color: '#0f172a' }}>
                            <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
                            {isEnglish
                              ? 'Native Teacher Learning Evaluation & 4-Skill Progress'
                              : 'Nhận Xét Tiến Độ Học Tập / Đánh Giá Giáo Viên Bản Xứ'}
                          </Title>

                          {linkedClasses.length > 0 ? (
                            <Card
                              size="small"
                              style={{
                                borderRadius: 12,
                                border: '1px solid #fed7aa',
                                background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
                                boxShadow: '0 2px 8px rgba(251,191,36,0.08)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                <Space size={8}>
                                  <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                                  <div>
                                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                                      {linkedClasses[0]?.teacherName || 'Mr. David Smith (USA 🇺🇸)'}
                                    </Text>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                      Giáo viên Bản Xứ • Lớp {linkedClasses[0]?.name || 'Wonders ELA'}
                                    </div>
                                  </div>
                                </Space>
                                <Tag color="gold" style={{ fontWeight: 600 }}>
                                  Đánh giá định kỳ Zoom
                                </Tag>
                              </div>

                              {/* Bảng điểm 4 kỹ năng chuẩn sư phạm */}
                              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                                <Col xs={12} sm={6}>
                                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #fde68a' }}>
                                    <div style={{ fontSize: 11, color: '#78350f', fontWeight: 600 }}>Phát âm Phonics</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      <StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>5.0 / 5.0</span>
                                    </div>
                                  </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #fde68a' }}>
                                    <div style={{ fontSize: 11, color: '#78350f', fontWeight: 600 }}>Chính tả & Từ vựng</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      <StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>5.0 / 5.0</span>
                                    </div>
                                  </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #fde68a' }}>
                                    <div style={{ fontSize: 11, color: '#78350f', fontWeight: 600 }}>Mức độ tập trung</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      <StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>5.0 / 5.0</span>
                                    </div>
                                  </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #fde68a' }}>
                                    <div style={{ fontSize: 11, color: '#78350f', fontWeight: 600 }}>Nghe hiểu tiếng Anh</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      <StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>4.5 / 5.0</span>
                                    </div>
                                  </div>
                                </Col>
                              </Row>

                              <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                                <Text italic style={{ color: '#334155', fontSize: 13, lineHeight: '1.6' }}>
                                  "{user.academicNotes || 'Học viên tích cực tương tác qua Zoom breakout rooms, phát âm chuẩn các âm đuôi và cụm phụ âm. Tiếp thu nhanh từ vựng bài học McGraw-Hill Wonders và hoàn thành tốt bài tập trên lớp.'}"
                                </Text>
                              </div>
                            </Card>
                          ) : (
                            <Alert
                              type="info"
                              showIcon
                              message="Chưa có đánh giá từ giáo viên"
                              description="Học viên chưa tham gia buổi học nào. Sau mỗi buổi học Zoom, giáo viên bản xứ sẽ trực tiếp chấm điểm 4 kỹ năng và cập nhật nhận xét chi tiết vào đây."
                              style={{ borderRadius: 10 }}
                            />
                          )}
                        </div>

                        {/* Danh sách Lớp Học Thực Tế & Thời Khóa Biểu Của Học Viên */}
                        {linkedClasses.length > 0 && (
                          <div style={{ marginTop: 20 }}>
                            <Title level={5} style={{ marginBottom: 12, color: '#0f172a' }}>
                              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                              {isEnglish
                                ? `My Enrolled Classes & Live Timetable (${linkedClasses.length})`
                                : `Lớp Học & Thời Khóa Biểu Trực Tuyến Của Học Viên (${linkedClasses.length} lớp)`}
                            </Title>
                            <Row gutter={[16, 16]}>
                              {linkedClasses.map((cls) => (
                                <Col xs={24} md={12} key={cls.id}>
                                  <Card
                                    size="small"
                                    style={{ borderRadius: 10, border: '1px solid #bae6fd', background: '#f0f9ff' }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                                      <div>
                                        <Tag color="blue" style={{ fontWeight: 700 }}>{cls.id}</Tag>
                                        <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{cls.name}</Text>
                                      </div>
                                      <Tag color="purple">{cls.teacherName || 'Native Teacher'}</Tag>
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}>
                                      <div>
                                        <ClockCircleOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                                        <b>{isEnglish ? 'Class Schedule:' : 'Lịch học:'}</b> {formatScheduleForViewer(cls.schedule, isEnglish)}
                                      </div>
                                      {(cls.zoomStudentLink || cls.meetingLink) && (
                                        <div style={{ marginTop: 4 }}>
                                          <LinkOutlined style={{ marginRight: 6, color: '#16a34a' }} />
                                          <a href={cls.zoomStudentLink || cls.meetingLink} target="_blank" rel="noreferrer">
                                            {isEnglish ? 'Join Zoom Classroom' : 'Vào Phòng Học Zoom Trực Tuyến'}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
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
                        <Descriptions.Item label={isEnglish ? 'Department / Unit' : 'Phòng Ban / Đơn Vị Công Tác'}>
                          {user.department || (user.role === 'accountant' ? 'Phòng Tài Chính - Kế Toán' : user.role === 'director' ? 'Ban Giám Đốc Điều Hành' : 'Phòng Quản Trị Hệ Thống IT')}
                        </Descriptions.Item>
                        <Descriptions.Item label={isEnglish ? 'Position / Title' : 'Chức Danh Đảm Nhiệm'}>
                          {user.position || (user.role === 'accountant' ? 'Kế toán tổng hợp & Đối soát học phí' : user.role === 'director' ? 'Giám đốc Điều hành (CEO)' : 'Trưởng phòng Hạ tầng IT & Bảo mật')}
                        </Descriptions.Item>
                        <Descriptions.Item label={isEnglish ? 'Operational Notes' : 'Ghi Chú Nghiệp Vụ & Thẩm Quyền'}>
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
                          onClick={() => navigate(`${baseProfilePath}/edit`)}
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

              // ================= TAB 3: AUDIT LOGS (ADMIN HOẶC CHÍNH CHỦ TRÊN /my-profile) =================
              ...(canViewAuditLogs ? [{
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
                  <div style={{ paddingTop: 12 }}>
                    {/* Hiển thị Cụm Gia Đình nếu có anh chị em liên kết */}
                    {familyMembers.length > 0 && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 8, marginBottom: 14 }}>
                        <Space wrap size={8}>
                          <Text strong style={{ color: '#166534' }}>👨‍👩‍👧 {isEnglish ? 'Family Cluster:' : 'Cùng Cụm Gia Đình:'}</Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {isEnglish ? `Sharing parent phone with ${familyMembers.length} sibling(s):` : `Đang chia sẻ SĐT phụ huynh với ${familyMembers.length} anh/chị/em:`}
                          </Text>
                          {familyMembers.map((m) => (
                            <Tag
                              key={m.id || m.code}
                              color="cyan"
                              style={{ cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => navigate(`/user-management/${m.id || m.code}`)}
                            >
                              {m.name} ({m.code || m.id})
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* Hàng 1: Họ và Tên + Tên Tiếng Anh (English Name) */}
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="name"
                          label={<Text strong>{isEnglish ? 'Full Name (Vietnamese)' : 'Họ và Tên'}</Text>}
                          rules={[{ required: true, message: isEnglish ? 'Please enter full name' : 'Vui lòng nhập họ và tên' }]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isEnglish ? 'Enter full name...' : 'Nhập họ và tên...'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
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

                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="englishName"
                          label={<Text strong>{isEnglish ? 'English Name' : 'Tên Tiếng Anh (English Name)'}</Text>}
                          rules={[{ required: true, message: isEnglish ? 'Please enter English name' : 'Vui lòng nhập tên tiếng Anh' }]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<GlobalOutlined style={{ color: '#0284c7' }} />}
                            placeholder={isEnglish ? 'e.g. Bao Thu, Leo, Anna...' : 'VD: Bao Thu, Leo, Anna...'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hàng 2: Số Điện Thoại 1 (Chính - Bắt buộc) + Số Điện Thoại 2 (Phụ - Tùy chọn) */}
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phoneNumber"
                          label={<Text strong>{isEnglish ? 'Primary Phone (Required)' : 'Số Điện Thoại 1 (Chính - Bắt Buộc)'}</Text>}
                          rules={[
                            { required: true, message: isEnglish ? 'Please enter primary phone' : 'Vui lòng nhập số điện thoại chính' },
                            { pattern: /^[0-9+\s\-().]{8,15}$/, message: isEnglish ? 'Invalid phone number' : 'Số điện thoại không hợp lệ' },
                          ]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                            placeholder="0909 509 116"
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="secondaryPhone"
                          label={<Text strong>{isEnglish ? 'Secondary Phone (Optional, No Login)' : 'Số Điện Thoại 2 (Phụ - Tùy Chọn, Không Dùng Đăng Nhập)'}</Text>}
                          rules={[]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<PhoneOutlined style={{ color: '#16a34a' }} />}
                            placeholder={isEnglish ? 'e.g. 0989 557 230 (Parent 2)' : 'VD: 0989 557 230 (SĐT Bố/Mẹ 2)'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hàng 3: Địa Chỉ Email + Cụm Gia Đình */}
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="email"
                          dependencies={['role']}
                          label={
                            <Text strong>
                              {isTargetStudent
                                ? (isEnglish ? 'Email Address (Optional)' : 'Địa Chỉ Email (Không bắt buộc)')
                                : (isEnglish ? 'Email Address (Required)' : 'Địa Chỉ Email Đăng Nhập (Bắt Buộc)')}
                            </Text>
                          }
                          rules={[
                            ...(isTargetStudent ? [] : [{ required: true, message: isEnglish ? 'Please enter email' : 'Vui lòng nhập email công vụ' }]),
                            {
                              validator: (_, value) => {
                                if (!value || !value.trim()) return Promise.resolve();
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                if (!emailRegex.test(value.trim())) {
                                  return Promise.reject(new Error(isEnglish ? 'Invalid email format' : 'Email không hợp lệ'));
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isTargetStudent ? (isEnglish ? 'student@gmail.com (optional)' : 'hocvien@gmail.com (hoặc để trống)') : 'email@lakeducation.com'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="familyId"
                          label={<Text strong>{isEnglish ? 'Family Cluster ID' : 'Mã Cụm Gia Đình'}</Text>}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            disabled
                            placeholder="FAM_09xxxxxxxx (Tự động gán)"
                            style={{ width: '100%', height: 38, borderRadius: 8, background: '#f8fafc' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hàng 3: Giới Tính + Ngày Sinh + Số Định Danh */}
                    <Row gutter={16}>
                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="gender"
                          label={<Text strong>{isEnglish ? 'Gender' : 'Giới Tính'}</Text>}
                          style={{ marginBottom: 14 }}
                        >
                          <Select style={{ width: '100%', height: 38, borderRadius: 8 }}>
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
                          style={{ marginBottom: 14 }}
                        >
                          <DatePicker
                            format={isEnglish ? ['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'] : ['DD/MM/YYYY', 'YYYY-MM-DD']}
                            placeholder={isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                            allowClear
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="idCardNumber"
                          label={<Text strong>{isEnglish ? 'Citizen ID / Passport' : 'Số CCCD / Hộ Chiếu / Mã Định Danh'}</Text>}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isEnglish ? 'Enter ID number or passport...' : 'Nhập số CCCD hoặc Passport...'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hàng 4: Địa Chỉ Thường Trú + Tỉnh / Thành Phố */}
                    <Row gutter={16}>
                      <Col xs={24} sm={16} md={16}>
                        <Form.Item
                          name="address"
                          label={<Text strong>{isEnglish ? 'Permanent / Current Address' : 'Địa Chỉ Thường Trú / Tạm Trú'}</Text>}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                            placeholder={isEnglish ? 'Street address, ward, district...' : 'Số nhà, tên đường, phường/xã, quận/huyện...'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8} md={8}>
                        <Form.Item
                          name="city"
                          label={<Text strong>{isEnglish ? 'City / Province' : 'Tỉnh / Thành Phố'}</Text>}
                          style={{ marginBottom: 14 }}
                        >
                          <Input
                            placeholder={isEnglish ? 'Ho Chi Minh City' : 'TP. Hồ Chí Minh'}
                            style={{ width: '100%', height: 38, borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '8px 0 14px' }} />

                    {/* Phương thức đăng nhập và Bảo mật */}
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
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
                            disabled={!canEditSensitive}
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
                      <Row gutter={[16, 12]}>
                        <Col span={24}>
                          <Form.Item
                            name="enrolledClassIds"
                            label={
                              <Space size={6}>
                                <Text strong>{isEnglish ? 'Enrolled Classes' : 'Lớp Học Online Ghi Danh'}</Text>
                                <Tag color="blue" style={{ fontSize: 11, fontWeight: 600 }}>Nhiều Lớp</Tag>
                              </Space>
                            }
                            extra={
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                💡 Mỗi học viên có thể đăng ký nhiều lớp học online. Hệ thống sẽ tự động phát hiện và chặn trùng khung giờ học trực tuyến Zoom.
                              </span>
                            }
                          >
                            <Select
                              mode="multiple"
                              placeholder={isEnglish ? 'Select 1 or more Zoom classes...' : 'Chọn 1 hoặc nhiều lớp học Zoom tham gia...'}
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

                        {/* Cảnh báo trùng khung giờ học online */}
                        {editConflictInfo.hasConflict && (
                          <Col span={24}>
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
                                    {editConflictInfo.conflicts.map((c, idx) => (
                                      <li key={idx} style={{ marginTop: 2 }}>{c.message}</li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            />
                          </Col>
                        )}

                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={<Text strong>{isEnglish ? 'Curriculum Level (Auto-Derived)' : 'Cấp Độ Chương Trình (Tự Động Theo Lớp)'}</Text>}
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
                              {editDerivedLevels.length > 0 ? (
                                editDerivedLevels.map((lvl) => (
                                  <Tag key={lvl} color="purple" style={{ margin: 0, fontWeight: 600, padding: '2px 8px' }}>
                                    {lvl}
                                  </Tag>
                                ))
                              ) : (
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  {user.level ? `Wonders ${user.level}` : 'Tự động xác định theo lớp ghi danh'}
                                </Text>
                              )}
                            </div>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={<Text strong>{isEnglish ? 'Tuition Status (Automated)' : 'Tình Trạng Học Phí (Hệ Thống Tự Động)'}</Text>}
                            extra={<span style={{ fontSize: 12, color: '#64748b' }}>Hệ thống kế toán tự động đối soát dựa trên học phần đăng ký, không chỉnh sửa thủ công.</span>}
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
                              <Tag
                                color={user.tuitionStatus === 'Đã đóng đủ' ? 'green' : user.tuitionStatus === 'Chờ đối soát' ? 'gold' : 'blue'}
                                style={{ margin: 0, fontWeight: 600, padding: '2px 8px' }}
                              >
                                {user.tuitionStatus || 'Chờ đối soát'}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {isEnglish ? 'Automated Accounting Sync' : 'Đối soát tự động từ Kế toán'}
                              </Text>
                            </div>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="parentName"
                            label={<Text strong>{isEnglish ? 'Parent / Guardian Name' : 'Họ Tên Phụ Huynh / Người Giám Hộ'}</Text>}
                          >
                            <Input placeholder={isEnglish ? 'E.g. Mr. Tuan / Ms. Mai' : 'VD: Anh Tuấn / Chị Mai'} style={{ width: '100%', height: 40, borderRadius: 8 }} />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="parentPhone"
                            label={<Text strong>{isEnglish ? 'Parent Phone Number (Default Phone 1)' : 'Số Điện Thoại Phụ Huynh (Mặc Định Là SĐT 1)'}</Text>}
                            extra={<span style={{ fontSize: 12, color: '#16a34a' }}>Đồng bộ với Số Điện Thoại 1 chính.</span>}
                          >
                            <Input
                              prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                              placeholder="0912 345 678"
                              style={{ width: '100%', height: 40, borderRadius: 8 }}
                            />
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
                              disabled={!canEditSensitive}
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
                            <Input disabled={!canEditSensitive} placeholder="GK-A, G1-B, G3-Online..." style={{ borderRadius: 8 }} />
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
                            <InputNumber disabled={!canEditSensitive} min={0} style={{ width: '100%', borderRadius: 8 }} placeholder={isEnglish ? '8 classes' : '8 lớp'} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="completedTasks" label={<Text strong>{isEnglish ? 'Academic KPI Score (%)' : 'KPI Hoàn Thành Học Vụ (%)'}</Text>}>
                            <InputNumber disabled={!canEditSensitive} min={0} max={100} style={{ width: '100%', borderRadius: 8 }} addonAfter="%" />
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
              onClick={() => navigate(baseProfilePath)}
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

