import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Progress,
  Radio,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  LinkOutlined,
  LoadingOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { MaterialService } from '../../materials/services/MaterialService';

const { Text } = Typography;

const detectCourseVaultFileType = (fileName = '') => {
  const ext = String(fileName).split('.').pop()?.toLowerCase();
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)) return 'VIDEO';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'AUDIO';
  if (['ppt', 'pptx', 'gslides'].includes(ext)) return 'SLIDES';
  if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) return 'PRACTICE';
  return 'PDF';
};

const detectTypeFromUrl = (rawUrl = '') => {
  const lower = String(rawUrl).toLowerCase();
  if (
    lower.includes('youtube.com/') ||
    lower.includes('youtu.be/') ||
    lower.includes('vimeo.com/') ||
    /\.(mp4|webm|mov|mkv)(\?|$)/.test(lower)
  ) {
    return 'VIDEO';
  }
  if (lower.includes('/presentation/')) return 'SLIDES';
  if (/\.(mp3|wav|m4a|ogg)(\?|$)/.test(lower)) return 'AUDIO';
  return null;
};

const formatBytes = (bytes = 0) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const CourseMaterialUploadModal = ({
  open,
  course,
  loading = false,
  onSave,
  onCancel,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  const [uploadMode, setUploadMode] = useState('FILE'); // 'FILE' | 'LINK'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');

  useEffect(() => {
    if (open) {
      setUploadMode('FILE');
      setSelectedFile(null);
      setIsDragOver(false);
      setUploading(false);
      setUploadProgress(0);
      setUploadStatusText('');
      form.resetFields();
      form.setFieldsValue({
        title: '',
        type: 'VIDEO',
        visibility: 'ALL',
        url: '',
      });
    }
  }, [open, form]);

  const handlePickFile = (file) => {
    if (!file) return;
    const maxBytes = 2 * 1024 * 1024 * 1024; // 2 GB
    if (file.size > maxBytes) {
      message.error(
        isEnglish
          ? 'File exceeds the 2 GB limit.'
          : 'Tệp vượt quá giới hạn tối đa 2 GB.'
      );
      return;
    }
    const detected = detectCourseVaultFileType(file.name);
    const baseTitle = file.name.replace(/\.[^/.]+$/, '');
    setSelectedFile(file);
    const currentTitle = form.getFieldValue('title');
    form.setFieldsValue({
      type: detected,
      title: currentTitle?.trim() ? currentTitle : baseTitle,
    });
  };

  const handleTypeChange = (nextType) => {
    if (nextType === 'TEACHER_GUIDE' || nextType === 'TEACHER') {
      form.setFieldsValue({ visibility: 'TEACHER_ONLY' });
    }
  };

  const handleUrlChange = (e) => {
    const val = e.target.value || '';
    const guessed = detectTypeFromUrl(val);
    if (guessed) {
      form.setFieldsValue({ type: guessed });
    }
  };

  const handleFinish = async (values) => {
    const cleanTitle = String(values.title || '').trim();
    const materialType = values.type || 'PDF';
    const visibility =
      materialType === 'TEACHER_GUIDE' || materialType === 'TEACHER'
        ? 'TEACHER_ONLY'
        : values.visibility || 'ALL';

    const courseTag = String(course?.id || 'Course').replace(/[^a-zA-Z0-9_-]/g, '_');
    const folderName = `CourseVault_${courseTag}`;

    if (uploadMode === 'FILE') {
      if (!selectedFile) {
        message.warning(
          isEnglish
            ? 'Please select a video or document file from your computer.'
            : 'Vui lòng chọn tệp video hoặc giáo trình từ máy tính.'
        );
        return;
      }

      setUploading(true);
      setUploadProgress(5);
      setUploadStatusText(
        isEnglish
          ? `Uploading "${selectedFile.name}" to Google Drive...`
          : `Đang tải "${selectedFile.name}" lên Google Drive của trường...`
      );

      try {
        const uploadRes = await MaterialService.uploadFileToFirebase(
          selectedFile,
          folderName,
          (percent) => {
            setUploadProgress(Math.max(5, Math.min(99, Math.round(percent))));
          }
        );

        const driveFileId = uploadRes.driveFileId || '';
        const previewOrViewUrl = driveFileId
          ? `https://drive.google.com/file/d/${driveFileId}/view`
          : uploadRes.downloadURL;

        const payload = {
          id: `mat_${Date.now()}`,
          title: cleanTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
          type: materialType,
          visibility,
          url: previewOrViewUrl,
          downloadUrl: uploadRes.downloadUrl || uploadRes.downloadURL || previewOrViewUrl,
          cdnUrl: uploadRes.cdnUrl || '',
          driveFileId,
          storagePath: uploadRes.storagePath || '06_CLASS_RECORDINGS_MATERIALS/2026',
          firebaseFolder: folderName,
          fileName: selectedFile.name,
          fileSize: formatBytes(selectedFile.size),
          isGoogleDrive: true,
          isSessionRecording: false,
          uploadedAt: new Date().toISOString(),
        };

        setUploadProgress(100);
        setUploadStatusText(
          isEnglish
            ? 'Upload complete! Syncing to Course Program Vault...'
            : 'Đã tải lên 100%! Đang đồng bộ vào Kho Giáo Trình Khóa Học...'
        );

        await onSave?.(payload);
        setUploading(false);
        setSelectedFile(null);
        form.resetFields();
      } catch (err) {
        console.error('[CourseMaterialUploadModal] File upload failed:', err);
        setUploading(false);
        setUploadStatusText('');
        message.error(
          err?.message ||
            (isEnglish
              ? 'Failed to upload file to Google Drive.'
              : 'Không thể tải tệp lên Google Drive. Vui lòng thử lại.')
        );
      }
      return;
    }

    // Chế độ 2: Dán đường dẫn URL
    const cleanUrl = String(values.url || '').trim();
    if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('blob:')) {
      message.error(
        isEnglish
          ? 'Please enter a valid https:// Google Drive or YouTube link.'
          : 'Vui lòng nhập đường dẫn https:// hợp lệ (Google Drive, YouTube, Google Slides...).'
      );
      return;
    }

    setUploading(true);
    try {
      const payload = {
        id: `mat_${Date.now()}`,
        title: cleanTitle,
        type: materialType,
        visibility,
        url: cleanUrl,
        downloadUrl: cleanUrl,
        firebaseFolder: folderName,
        isSessionRecording: false,
        uploadedAt: new Date().toISOString(),
      };
      await onSave?.(payload);
      setUploading(false);
      form.resetFields();
    } catch (err) {
      setUploading(false);
      message.error(
        err?.message ||
          (isEnglish ? 'Failed to save material.' : 'Lỗi lưu học liệu vào Khóa học.')
      );
    }
  };

  const busy = loading || uploading;

  return (
    <Modal
      open={open}
      width={isMobile ? 'calc(100vw - 24px)' : 600}
      style={isMobile ? { top: 12, maxWidth: 'calc(100vw - 24px)', margin: '0 auto' } : undefined}
      wrapClassName="course-upload-modal-wrapper"
      title={
        <Space orientation="horizontal" size="small" data-testid="course-upload-modal-title">
          <CloudUploadOutlined style={{ color: '#722ed1', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
            {isEnglish ? 'Upload to Course Vault: ' : 'Tải Lên Kho Khóa Học: '}
            <strong style={{ color: '#722ed1' }}>
              {course?.name || (isEnglish ? 'Course Program' : 'Khung Khóa Học')}
            </strong>
          </span>
        </Space>
      }
      onCancel={busy ? undefined : onCancel}
      closable={!busy}
      maskClosable={!busy}
      footer={
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <Button
            key="cancel"
            disabled={busy}
            onClick={onCancel}
            style={{ minHeight: 40, borderRadius: 8, flex: isMobile ? 1 : undefined }}
          >
            {isEnglish ? 'Cancel' : 'Hủy'}
          </Button>
          <Button
            key="save"
            type="primary"
            loading={busy}
            style={{
              minHeight: 40,
              borderRadius: 8,
              backgroundColor: '#722ed1',
              borderColor: '#722ed1',
              fontWeight: 600,
              flex: isMobile ? 1 : undefined,
            }}
            onClick={() => form.submit()}
            data-testid="btn-submit-course-material"
          >
            {uploading && uploadMode === 'FILE'
              ? isEnglish
                ? `Uploading (${uploadProgress}%)...`
                : `Đang tải lên (${uploadProgress}%)...`
              : uploadMode === 'FILE'
              ? isEnglish
                ? 'Upload & Sync to Course'
                : 'Tải Lên & Đồng Bộ Khóa Học'
              : isEnglish
              ? 'Save Link to Course Vault'
              : 'Lưu Vào Khóa Học (0ms)'}
          </Button>
        </div>
      }
      destroyOnHidden
    >
      <div
        style={{
          backgroundColor: '#f9f0ff',
          border: '1px solid #d3adf7',
          padding: '10px 14px',
          borderRadius: 10,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 12, color: '#531dab', lineHeight: 1.5, display: 'block' }}>
          ⚡{' '}
          <strong>
            {isEnglish ? 'Course-Wide Inheritance:' : 'Kế Thừa Chung Toàn Khóa Học:'}
          </strong>{' '}
          {isEnglish
            ? 'Textbooks and instructional videos uploaded here are shared across all classes belonging to this course program. (Class-specific session recordings belong in Live Class Schedules).'
            : 'Giáo trình và video bài giảng tải lên tại đây sẽ tự động hiển thị cho tất cả các lớp thuộc khóa học này. (Video ghi hình từng buổi học riêng của lớp được quản lý bên Lịch Học Trực Tuyến).'}
        </Text>
      </div>

      {/* Bộ chuyển chế độ: Tải Tệp Nhị Phân (.mp4/.pdf...) vs Dán Link */}
      <div style={{ marginBottom: 16 }}>
        <Segmented
          block
          value={uploadMode}
          disabled={busy}
          onChange={(val) => setUploadMode(val)}
          data-testid="segmented-course-vault-mode"
          options={[
            {
              value: 'FILE',
              icon: <FolderOpenOutlined />,
              label: isMobile
                ? isEnglish
                  ? 'Upload File'
                  : 'Tải Tệp Lên'
                : isEnglish
                ? 'Upload File / Video (.mp4, .pdf)'
                : 'Tải Tệp / Video Từ Máy',
            },
            {
              value: 'LINK',
              icon: <LinkOutlined />,
              label: isMobile
                ? isEnglish
                  ? 'Paste Link'
                  : 'Dán Link'
                : isEnglish
                ? 'Paste Drive / YouTube Link'
                : 'Dán Link Drive / YouTube',
            },
          ]}
          style={{
            borderRadius: 8,
            padding: 3,
            backgroundColor: '#f1f5f9',
            fontWeight: 600,
          }}
        />
      </div>

      {/* Khung Kéo-Thả Tệp Video / Tài Liệu Nhị Phân */}
      {uploadMode === 'FILE' && (
        <div style={{ marginBottom: 16 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.webm,.mkv,.avi,.m4v,.pdf,.mp3,.wav,.m4a,.ppt,.pptx,.doc,.docx,.xlsx"
            style={{ display: 'none' }}
            data-testid="input-course-vault-file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePickFile(f);
              e.target.value = '';
            }}
          />

          {!selectedFile ? (
            <div
              role="button"
              tabIndex={0}
              data-testid="dropzone-course-vault-file"
              onClick={() => !busy && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!busy) fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (busy) return;
                const f = e.dataTransfer?.files?.[0];
                if (f) handlePickFile(f);
              }}
              style={{
                border: `2px dashed ${isDragOver ? '#722ed1' : '#cbd5e1'}`,
                backgroundColor: isDragOver ? '#f9f0ff' : '#f8fafc',
                borderRadius: 12,
                padding: isMobile ? '18px 12px' : '22px 16px',
                textAlign: 'center',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <InboxOutlined style={{ fontSize: 34, color: '#722ed1', marginBottom: 6 }} />
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b', marginBottom: 4 }}>
                {isEnglish
                  ? 'Click or drag & drop a Video (.mp4) or Textbook (.pdf, .mp3, .pptx)'
                  : 'Bấm chọn hoặc kéo-thả tệp Video (.mp4) / Giáo trình (.pdf, .mp3, .pptx)'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {isEnglish
                  ? 'Direct Zero-Egress upload to school Google Drive (up to 2 GB)'
                  : 'Tải trực tiếp lên Google Drive lưu trữ chính thức của trường (hỗ trợ tới 2 GB)'}
              </div>
            </div>
          ) : (
            <div
              data-testid="selected-course-vault-file-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: '#f5f3ff',
                border: '1px solid #c4b5fd',
              }}
            >
              <Space orientation="horizontal" size="small" style={{ minWidth: 0, flex: 1 }}>
                {detectCourseVaultFileType(selectedFile.name) === 'VIDEO' ? (
                  <VideoCameraOutlined style={{ fontSize: 20, color: '#7c3aed', flexShrink: 0 }} />
                ) : (
                  <FilePdfOutlined style={{ fontSize: 20, color: '#2563eb', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedFile.name}
                  </div>
                  <Space size={6} style={{ marginTop: 2 }}>
                    <Tag color="purple" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                      {detectCourseVaultFileType(selectedFile.name)}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatBytes(selectedFile.size)}
                    </Text>
                  </Space>
                </div>
              </Space>

              <Button
                size="small"
                danger
                type="text"
                disabled={busy}
                icon={<DeleteOutlined />}
                data-testid="btn-clear-selected-course-file"
                onClick={() => setSelectedFile(null)}
                style={{ minWidth: 32, minHeight: 32 }}
              />
            </div>
          )}

          {uploading && (
            <div
              data-testid="course-vault-upload-progress"
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: '#f0f5ff',
                border: '1px solid #adc6ff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1d39c4' }}>
                  <LoadingOutlined style={{ marginRight: 6 }} />
                  {uploadStatusText}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1d39c4', whiteSpace: 'nowrap' }}>
                  {uploadProgress}%
                </span>
              </div>
              <Progress percent={uploadProgress} status="active" strokeColor="#722ed1" showInfo={false} />
            </div>
          )}
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={busy}
        initialValues={{
          type: 'VIDEO',
          visibility: 'ALL',
          url: '',
        }}
      >
        <Form.Item
          name="title"
          label={
            <strong>
              {isEnglish ? 'Material / Video Title' : 'Tên Video / Tài Liệu Giáo Trình'}
            </strong>
          }
          rules={[
            {
              required: true,
              message: isEnglish ? 'Please enter a title' : 'Vui lòng nhập tên tài liệu hoặc video',
            },
          ]}
        >
          <Input
            data-testid="input-course-vault-title"
            placeholder={
              isEnglish
                ? 'E.g., Wonders G5 Unit 1 Concept Video / Literature Anthology G5'
                : 'Ví dụ: Video giới thiệu chủ đề Unit 1 / Sách Reading Writing Companion'
            }
            style={{ height: 40, borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label={<strong>{isEnglish ? 'Material Category' : 'Phân Loại Học Liệu'}</strong>}
          rules={[{ required: true }]}
        >
          <Select
            data-testid="select-course-vault-type"
            onChange={handleTypeChange}
            style={{ height: 40, borderRadius: 8 }}
          >
            <Select.Option value="VIDEO">
              🎬 {isEnglish ? 'Lesson & Concept Video (MP4 / Drive / YouTube)' : 'Video Bài Giảng & Minh Họa (MP4 / Drive / YouTube)'}
            </Select.Option>
            <Select.Option value="PDF">
              📘 {isEnglish ? 'Student Textbook (PDF Book)' : 'Sách Học Sinh (PDF Book)'}
            </Select.Option>
            <Select.Option value="AUDIO">
              🎧 {isEnglish ? 'Listening Audio (MP3 / Drive Folder)' : 'Audio Luyện Nghe (MP3 / Thư Mục Drive)'}
            </Select.Option>
            <Select.Option value="PRACTICE">
              📝 {isEnglish ? 'Practice & Activity Workbook (PDF)' : 'Sách Bài Tập & Thực Hành (Practice Book)'}
            </Select.Option>
            <Select.Option value="SLIDES">
              🖥️ {isEnglish ? 'Presentation Slides (Google Slides / PPTX)' : 'Slide Bài Giảng Trực Tuyến (Slides / PPTX)'}
            </Select.Option>
            <Select.Option value="TEACHER_GUIDE">
              🧑‍🏫 {isEnglish ? "Teacher's Edition (Teachers & Staff Only)" : 'Sách Hướng Dẫn Giáo Viên (Nội Bộ GV)'}
            </Select.Option>
          </Select>
        </Form.Item>

        {uploadMode === 'LINK' && (
          <Form.Item
            name="url"
            label={
              <strong>
                {isEnglish ? 'Google Drive / YouTube URL' : 'Đường Dẫn Google Drive / YouTube'}
              </strong>
            }
            rules={[
              {
                required: true,
                message: isEnglish ? 'Please paste a valid URL' : 'Vui lòng dán đường dẫn học liệu',
              },
            ]}
          >
            <Input
              data-testid="input-course-vault-url"
              prefix={<LinkOutlined />}
              onChange={handleUrlChange}
              placeholder="https://drive.google.com/file/d/... hoặc https://www.youtube.com/watch?v=..."
              style={{ height: 40, borderRadius: 8 }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="visibility"
          label={<strong>{isEnglish ? 'Access Permission' : 'Đối Tượng Được Phép Xem'}</strong>}
          style={{ marginBottom: 4 }}
        >
          <Radio.Group data-testid="radio-course-vault-visibility">
            <Space orientation="vertical" size={6}>
              <Radio value="ALL">
                {isEnglish
                  ? 'All (Teachers & Students in this Course)'
                  : 'Tất cả (Giáo viên & Học viên các lớp thuộc khóa)'}
              </Radio>
              <Radio value="TEACHER_ONLY">
                {isEnglish
                  ? 'Teachers & Academic Staff Only (Hidden from Students)'
                  : 'Chỉ Giáo viên & Giáo vụ (Ẩn tuyệt đối với Học sinh)'}
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};
