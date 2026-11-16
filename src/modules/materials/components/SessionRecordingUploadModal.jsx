import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  DatePicker,
  Progress,
  Space,
  Typography,
  Alert,
  Tag,
  Radio,
  message,
} from 'antd';
import {
  VideoCameraOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  FolderOpenOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLanguage } from '../../../core/context/LanguageContext';
import { DriveStorageService } from '../../../core/services/DriveStorageService';
import { MaterialService } from '../services/MaterialService';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const formatFileSize = (bytes = 0) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const SessionRecordingUploadModal = ({
  open,
  classData = {},
  currentUser = null,
  onClose,
  onSuccess,
}) => {
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();

  const [mode, setMode] = useState('DIRECT_FILE'); // 'DIRECT_FILE' | 'URL'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStageText, setUploadStageText] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadedResult, setUploadedResult] = useState(null);

  const resetState = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadStageText('');
    setUploadError(null);
    setUploadedResult(null);
    form.resetFields();
  };

  const handleModalClose = () => {
    if (uploading) {
      // Đang upload dở thì cảnh báo
      if (!window.confirm(isEnglish ? 'Upload in progress. Are you sure you want to cancel?' : 'Đang tải tệp lên Google Drive. Bạn có chắc muốn hủy không?')) {
        return;
      }
    }
    resetState();
    onClose?.();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng video
    const validExtensions = ['mp4', 'mov', 'webm', 'mkv', 'avi'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt) && !file.type.startsWith('video/')) {
      message.error(
        isEnglish
          ? 'Please select a valid video file (.mp4, .mov, .webm, .mkv)'
          : 'Vui lòng chọn tệp video hợp lệ (.mp4, .mov, .webm, .mkv)'
      );
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadedResult(null);

    // Gợi ý tiêu đề mặc định nếu chưa nhập
    const currentTitle = form.getFieldValue('title');
    if (!currentTitle) {
      const dateStr = dayjs(form.getFieldValue('sessionDate') || new Date()).format('DD/MM/YYYY');
      form.setFieldsValue({
        title: isEnglish
          ? `Session Recording - ${classData.name || 'Class'} (${dateStr})`
          : `Video Buổi Học: ${classData.name || 'Lớp Học'} (${dateStr})`,
      });
    }
  };

  const handleUploadAndSave = async () => {
    try {
      const values = await form.validateFields();
      const sessionDateStr = values.sessionDate
        ? dayjs(values.sessionDate).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');

      let finalVideoUrl = '';
      let finalFileSize = '';
      let driveFileId = '';
      let downloadUrl = '';

      if (mode === 'DIRECT_FILE') {
        if (!selectedFile) {
          message.warning(
            isEnglish
              ? 'Please select a video recording file to upload.'
              : 'Vui lòng chọn tệp video ghi hình để tải lên.'
          );
          return;
        }

        setUploading(true);
        setUploadProgress(5);
        setUploadStageText(
          isEnglish
            ? 'Initializing Google Drive upload session (Zero-Egress)...'
            : 'Đang khởi tạo phiên upload Google Drive (Zero-Egress)...'
        );

        // Upload lên Google Drive qua DriveStorageService
        const uploadResult = await DriveStorageService.uploadFile(selectedFile, {
          folderPath: DriveStorageService.FOLDERS.CLASS_RECORDINGS('2026'),
          tag: 'class_recording',
          title: values.title,
          notes: values.description || '',
          purpose: 'session_recording',
          key: classData.id || 'class_recording',
          onProgress: (percent) => {
            setUploadProgress(percent);
            if (percent < 20) {
              setUploadStageText(
                isEnglish ? 'Preparing Google Drive session...' : 'Đang chuẩn bị phiên lưu trữ Google Drive...'
              );
            } else if (percent < 90) {
              setUploadStageText(
                isEnglish
                  ? `Streaming binary video data to Google Drive... (${percent}%)`
                  : `Đang truyền tải nhị phân video lên Google Drive... (${percent}%)`
              );
            } else {
              setUploadStageText(
                isEnglish
                  ? 'Confirming file metadata & generating CDN links...'
                  : 'Đang xác nhận tệp và tạo bộ liên kết CDN...'
              );
            }
          },
        });

        finalVideoUrl = uploadResult.webViewLink || uploadResult.downloadUrl || '';
        downloadUrl = uploadResult.downloadUrl || finalVideoUrl;
        driveFileId = uploadResult.fileId || uploadResult.id || '';
        finalFileSize = formatFileSize(selectedFile.size);
        setUploadedResult(uploadResult);
      } else {
        // Mode URL
        if (!values.recordingUrl || !values.recordingUrl.trim()) {
          message.warning(
            isEnglish ? 'Please enter a valid video link.' : 'Vui lòng nhập đường dẫn video hợp lệ.'
          );
          return;
        }
        finalVideoUrl = values.recordingUrl.trim();
        downloadUrl = finalVideoUrl;
        finalFileSize = 'Cloud Video';
      }

      setUploadStageText(
        isEnglish
          ? 'Synchronizing class scoping & sharing with students...'
          : 'Đang đồng bộ phân quyền lớp và chia sẻ cho toàn bộ học viên...'
      );

      // Lưu bản ghi vào Firestore collection `learning_materials`
      const materialPayload = {
        id: `rec_${classData.id || 'class'}_${Date.now()}`,
        title: values.title || `Video Buổi Học: ${classData.name || ''}`,
        type: 'VIDEO',
        url: finalVideoUrl,
        downloadUrl: downloadUrl,
        driveFileId: driveFileId,
        fileName: selectedFile ? selectedFile.name : (values.title || 'recording.mp4'),
        fileSize: finalFileSize,
        description:
          values.description ||
          `Video recording for ${classData.name || ''} on ${sessionDateStr}`,
        courseId: classData.courseId || 'ALL',
        courseName: classData.courseName || classData.name || 'Khóa học',
        classId: classData.id,
        className: classData.name,
        sharedClassIds: [classData.id],
        shareScope: 'CUSTOM',
        targetType: 'class',
        targetId: classData.id,
        visibility: 'ALL',
        isSessionRecording: true,
        sessionDate: sessionDateStr,
        uploadedAt: new Date().toISOString(),
        teacherId: currentUser?.id || currentUser?.code || classData.teacherId || '',
        teacherName: currentUser?.name || classData.teacherName || 'Teacher',
      };

      await MaterialService.saveMaterial(materialPayload, currentUser);

      setUploadProgress(100);
      setUploadStageText(isEnglish ? 'Complete!' : 'Hoàn tất!');
      message.success(
        isEnglish
          ? 'Session recording uploaded and shared to all class students successfully!'
          : 'Đã tải lên video bài giảng và chia sẻ cho toàn bộ học viên của lớp thành công!'
      );

      onSuccess?.(materialPayload);
      resetState();
      onClose?.();
    } catch (err) {
      console.error('Session recording upload failed:', err);
      setUploadError(err.message || 'Lỗi tải tệp lên Google Drive');
      message.error(err.message || 'Lỗi tải video lên Google Drive');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <Space size={8} data-testid="session-recording-upload-modal-title">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            <VideoCameraOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {isEnglish ? 'Upload Session Recording' : 'Tải Lên Video Ghi Hình Buổi Học'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              {isEnglish
                ? 'Optional: Post-session video recording for class students'
                : 'Tùy chọn: Video bài giảng sau giờ học cho học viên trong lớp'}
            </div>
          </div>
        </Space>
      }
      onCancel={handleModalClose}
      footer={[
        <Button key="cancel" onClick={handleModalClose} disabled={uploading}>
          {isEnglish ? 'Cancel' : 'Hủy'}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={uploading}
          onClick={handleUploadAndSave}
          style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', borderRadius: 8, fontWeight: 600 }}
          data-testid="btn-submit-session-recording"
        >
          {isEnglish ? 'Upload & Share to Class' : 'Tải Lên Google Drive & Chia Sẻ Cho Lớp'}
        </Button>,
      ]}
      width={640}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        {/* Banner Giải thích & Lớp học đích */}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10, backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}
          message={
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6', marginBottom: 4 }}>
                {isEnglish ? 'Class Scoped Recording (Google Drive Storage)' : 'Lưu Trữ Google Drive & Phân Quyền Theo Lớp'}
              </div>
              <div style={{ fontSize: 12, color: '#6d28d9', lineHeight: 1.5 }}>
                {isEnglish
                  ? 'Video files are securely stored in Google Drive (06_CLASS_RECORDINGS_MATERIALS/2026). All students enrolled in this class will immediately be able to preview or download the video from their Student Dashboard.'
                  : 'Tệp video được lưu trữ an toàn trên Google Drive (06_CLASS_RECORDINGS_MATERIALS/2026). Toàn bộ học viên ghi danh vào lớp này sẽ lập tức xem trực tiếp hoặc tải về từ Cổng Học Viên.'}
              </div>
            </div>
          }
        />

        {/* Thông tin lớp học đích */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{isEnglish ? 'Target Class:' : 'Lớp học nhận video:'}</Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
              {classData.name || 'Lớp Học Trực Tuyến'}
            </div>
          </div>
          <Space size={6}>
            <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>{classData.id || 'CLASS'}</Tag>
            <Tag color="blue" style={{ margin: 0 }}>
              {classData.courseLevel || classData.courseName || 'McGraw-Hill Wonders'}
            </Tag>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            sessionDate: dayjs(),
            title: isEnglish
              ? `Session Recording - ${classData.name || 'Class'} (${dayjs().format('DD/MM/YYYY')})`
              : `Video Buổi Học: ${classData.name || 'Lớp Học'} (${dayjs().format('DD/MM/YYYY')})`,
          }}
        >
          {/* Hàng 1: Ngày buổi học & Tiêu đề */}
          <Form.Item
            name="sessionDate"
            label={isEnglish ? 'Session Date' : 'Ngày Buổi Học'}
            rules={[{ required: true, message: isEnglish ? 'Select session date' : 'Chọn ngày buổi học' }]}
          >
            <DatePicker
              style={{ width: '100%', height: 40, borderRadius: 8 }}
              format="DD/MM/YYYY"
              onChange={(date) => {
                if (date) {
                  const dateStr = date.format('DD/MM/YYYY');
                  form.setFieldsValue({
                    title: isEnglish
                      ? `Session Recording - ${classData.name || 'Class'} (${dateStr})`
                      : `Video Buổi Học: ${classData.name || 'Lớp Học'} (${dateStr})`,
                  });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label={isEnglish ? 'Recording Title' : 'Tiêu Đề Video Bài Giảng'}
            rules={[{ required: true, message: isEnglish ? 'Please enter a title' : 'Vui lòng nhập tiêu đề bài giảng' }]}
          >
            <Input
              placeholder={isEnglish ? 'e.g. Unit 3: Friends & Family - Live Class Recording' : 'Ví dụ: Unit 3: Friends & Family - Video Buổi Học'}
              style={{ height: 40, borderRadius: 8 }}
            />
          </Form.Item>

          {/* Chọn Cách Thức: Tải file trực tiếp vs Dán link */}
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 8 }}>
              {isEnglish ? 'Upload Method:' : 'Phương thức tải video:'}
            </Text>
            <Radio.Group
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              buttonStyle="solid"
              style={{ width: '100%' }}
              data-testid="recording-upload-mode-radio"
            >
              <Radio.Button value="DIRECT_FILE" style={{ width: '50%', textAlign: 'center', height: 38, lineHeight: '36px' }}>
                <CloudUploadOutlined style={{ marginRight: 6 }} />
                {isEnglish ? 'Upload Video File (.mp4)' : 'Tải File Video (.mp4 / .mov)'}
              </Radio.Button>
              <Radio.Button value="URL" style={{ width: '50%', textAlign: 'center', height: 38, lineHeight: '36px' }}>
                <LinkOutlined style={{ marginRight: 6 }} />
                {isEnglish ? 'Paste Drive / Cloud Link' : 'Dán Link Drive / Cloud'}
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* 1. KHU VỰC TẢI FILE TRỰC TIẾP */}
          {mode === 'DIRECT_FILE' && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  border: '2px dashed #c4b5fd',
                  borderRadius: 12,
                  backgroundColor: '#faf5ff',
                  padding: '20px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => document.getElementById('recording-file-input')?.click()}
                data-testid="recording-dropzone"
              >
                <input
                  id="recording-file-input"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  disabled={uploading}
                />

                {selectedFile ? (
                  <div>
                    <CheckCircleOutlined style={{ fontSize: 36, color: '#16a34a', marginBottom: 8 }} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'video/mp4'}
                    </div>
                    <Button
                      size="small"
                      type="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      style={{ color: '#dc2626', marginTop: 6 }}
                    >
                      {isEnglish ? 'Change file' : 'Chọn tệp khác'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <CloudUploadOutlined style={{ fontSize: 40, color: '#8b5cf6', marginBottom: 8 }} />
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#4c1d95' }}>
                      {isEnglish ? 'Click or drag video file here' : 'Bấm để chọn tệp video hoặc kéo thả vào đây'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {isEnglish
                        ? 'Supports .mp4, .mov, .webm, .mkv (Up to 2GB via Google Drive Zero-Egress)'
                        : 'Hỗ trợ .mp4, .mov, .webm, .mkv (Tối đa 2GB qua Google Drive Zero-Egress)'}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar khi đang upload */}
              {uploading && (
                <div style={{ marginTop: 14 }}>
                  <Progress
                    percent={uploadProgress}
                    status={uploadError ? 'exception' : (uploadProgress === 100 ? 'success' : 'active')}
                    strokeColor={{ '0%': '#8b5cf6', '100%': '#10b981' }}
                  />
                  <div style={{ fontSize: 12, color: '#6d28d9', marginTop: 4, fontStyle: 'italic' }}>
                    {uploadStageText}
                  </div>
                </div>
              )}

              {uploadError && (
                <Alert
                  type="error"
                  showIcon
                  message={uploadError}
                  style={{ marginTop: 12, borderRadius: 8 }}
                />
              )}
            </div>
          )}

          {/* 2. KHU VỰC DÁN LINK CLOUD */}
          {mode === 'URL' && (
            <Form.Item
              name="recordingUrl"
              label={isEnglish ? 'Google Drive or Cloud Video Link' : 'Đường Dẫn Google Drive hoặc Cloud Video'}
              rules={[{ required: mode === 'URL', message: isEnglish ? 'Please enter video URL' : 'Vui lòng nhập URL video' }]}
            >
              <Input
                prefix={<LinkOutlined style={{ color: '#7c3aed' }} />}
                placeholder="https://drive.google.com/file/d/.../view hoặc link MP4"
                style={{ height: 40, borderRadius: 8 }}
                data-testid="input-recording-url"
              />
            </Form.Item>
          )}

          {/* Ghi chú tóm tắt bài học (Tùy chọn) */}
          <Form.Item
            name="description"
            label={isEnglish ? 'Lesson Summary / Homework Reminder (Optional)' : 'Tóm Tắt Nội Dung / Dặn Dò Bài Tập (Tùy Chọn)'}
          >
            <TextArea
              rows={3}
              placeholder={
                isEnglish
                  ? "e.g. In today's session, we covered McGraw-Hill Wonders Unit 3. Please review phonics rules on page 42."
                  : 'Ví dụ: Buổi học hôm nay luyện tập phát âm bài Unit 3. Học viên xem lại video để ôn bài tập nhé.'
              }
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default SessionRecordingUploadModal;
