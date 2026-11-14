import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useAuth } from '../../../core/context/AuthContext';
import { MATERIAL_TYPES, VISIBILITY_TYPES } from '../models/material.model';
import { MaterialService } from '../services/MaterialService';

const { Text } = Typography;
const { TextArea } = Input;

const detectFileType = (fileName = '') => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'AUDIO';
  if (['ppt', 'pptx', 'gslides'].includes(ext)) return 'SLIDES';
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) return 'VIDEO';
  if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) return 'PRACTICE';
  if (['pdf'].includes(ext)) return 'PDF';
  return 'PDF';
};

const formatBytes = (bytes = 0) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const MaterialUploadModal = ({
  open,
  files = [],
  editingItem = null,
  courses = [],
  loading = false,
  onSave,
  onSaveBatch,
  onCancel,
}) => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [form] = Form.useForm();

  // Trạng thái tiến trình upload Firebase Storage
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  const isMultiple = files.length > 1;
  const isDirectFileUpload = files.length > 0;

  // Đề xuất tên thư mục Firebase Storage thông minh
  const suggestedFolderName = useMemo(() => {
    if (editingItem?.firebaseFolder) return editingItem.firebaseFolder;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    if (files.length === 1) {
      const cleanBase = files[0].name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      return `Docs_${cleanBase.slice(0, 20)}_${dateStr}`;
    }
    if (files.length > 1) {
      return `Batch_Materials_${files.length}Files_${dateStr}`;
    }
    return `Course_Materials_${dateStr}`;
  }, [files, editingItem]);

  useEffect(() => {
    if (open) {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatusText('');
      setCompletedCount(0);

      if (editingItem) {
        form.setFieldsValue({
          title: editingItem.title || '',
          courseId: editingItem.courseId || 'ALL',
          folderName: editingItem.firebaseFolder || 'general',
          type: editingItem.type || 'PDF',
          url: editingItem.url || '',
          description: editingItem.description || '',
          visibility: editingItem.visibility || 'ALL',
        });
      } else if (isDirectFileUpload) {
        const firstFile = files[0];
        const detected = detectFileType(firstFile.name);
        const defaultTitle = isMultiple
          ? `Bộ ${files.length} Tài Liệu Học Tập (${files[0].name.replace(/\.[^/.]+$/, '')}...)`
          : firstFile.name.replace(/\.[^/.]+$/, '');

        form.resetFields();
        form.setFieldsValue({
          title: defaultTitle,
          courseId: courses[0]?.id || 'ALL',
          folderName: suggestedFolderName,
          type: detected,
          visibility: 'ALL',
          description: isMultiple ? `Đợt tải lên gồm ${files.length} tệp tài liệu số.` : '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          title: '',
          courseId: courses[0]?.id || 'ALL',
          folderName: suggestedFolderName,
          type: 'PDF',
          visibility: 'ALL',
          url: 'https://drive.google.com/',
        });
      }
    }
  }, [open, files, editingItem, courses, form, isDirectFileUpload, isMultiple, suggestedFolderName]);

  const handleFinish = async (values) => {
    const selectedCourse = courses.find((c) => c.id === values.courseId);
    const courseName = selectedCourse ? selectedCourse.name : (isEnglish ? 'All Courses' : 'Toàn Bộ Khóa Học');
    const courseLevel = selectedCourse ? (selectedCourse.level || selectedCourse.courseLevel || 'Standard') : 'All';
    const courseCode = selectedCourse ? (selectedCourse.code || selectedCourse.id) : 'ALL';
    const folderName = (values.folderName || suggestedFolderName).trim().replace(/[\\:*?"<>|]/g, '_');

    // 1. Trường hợp tải file kéo thả lên Firebase Storage
    if (isDirectFileUpload) {
      setUploading(true);
      const createdRecords = [];
      const totalFiles = files.length;

      try {
        for (let i = 0; i < totalFiles; i++) {
          const file = files[i];
          const detectedType = detectFileType(file.name);
          const singleTitle = isMultiple
            ? `${file.name.replace(/\.[^/.]+$/, '')}`
            : values.title || file.name.replace(/\.[^/.]+$/, '');

          setUploadStatusText(
            isEnglish
              ? `Uploading file ${i + 1}/${totalFiles}: ${file.name}...`
              : `Đang tải lên tệp ${i + 1}/${totalFiles}: ${file.name}...`
          );

          // Upload lên Firebase Storage vào thư mục chỉ định
          const uploadRes = await MaterialService.uploadFileToFirebase(
            file,
            folderName,
            (percent) => {
              const overall = Math.round(((i * 100) + percent) / totalFiles);
              setUploadProgress(overall);
            }
          );

          // Lưu metadata vào Firestore
          const recordPayload = {
            id: `mat_${Date.now()}_${i}`,
            title: singleTitle,
            fileName: file.name,
            fileSize: formatBytes(file.size),
            type: isMultiple ? detectedType : values.type || detectedType,
            url: uploadRes.downloadURL,
            storagePath: uploadRes.storagePath,
            firebaseFolder: folderName,
            courseId: values.courseId,
            courseName,
            courseLevel,
            courseCode,
            visibility: values.visibility,
            description: values.description || '',
            isFirebaseStorage: true,
            uploadedAt: new Date().toISOString(),
          };

          const saved = await MaterialService.saveMaterial(recordPayload, currentUser);
          createdRecords.push(saved);
          setCompletedCount(i + 1);
        }

        setUploadProgress(100);
        setUploadStatusText(
          isEnglish
            ? `Successfully uploaded ${totalFiles} file(s)!`
            : `Đã hoàn tất tải lên ${totalFiles} tài liệu học tập vào hệ thống!`
        );

        setTimeout(() => {
          setUploading(false);
          if (typeof onSaveBatch === 'function') {
            onSaveBatch(createdRecords);
          } else {
            onSave?.(createdRecords[0] || createdRecords);
          }
        }, 200);
      } catch (err) {
        console.error('Firebase Storage upload failed:', err);
        setUploading(false);
        setUploadStatusText(isEnglish ? 'Upload failed. Please try again.' : 'Tải lên thất bại. Vui lòng thử lại.');
      }
      return;
    }

    // 2. Trường hợp nhập link Drive thông thường / chỉnh sửa
    onSave?.({
      ...editingItem,
      ...values,
      firebaseFolder: folderName,
      courseName,
      courseLevel,
      courseCode,
    });
  };

  return (
    <Modal
      open={open}
      width={640}
      title={
        <Space orientation="horizontal" size="small" data-testid="upload-material-modal-title">
          <CloudUploadOutlined style={{ color: '#722ed1', fontSize: 20 }} />
          <span style={{ fontWeight: 700 }}>
            {editingItem
              ? (isEnglish ? 'Edit Learning Material' : 'Chỉnh Sửa Thông Tin Học Liệu')
              : isDirectFileUpload
                ? (isEnglish
                    ? `Upload ${files.length} Learning Material(s)`
                    : `Tải Lên ${files.length} Tài Liệu Học Tập`)
                : (isEnglish ? 'Add Learning Material Link' : 'Thêm Tài Liệu Học Tập (Google Drive)')}
          </span>
        </Space>
      }
      onCancel={uploading ? undefined : onCancel}
      closable={!uploading}
      maskClosable={!uploading}
      footer={[
        <Button key="cancel" disabled={uploading} onClick={onCancel}>
          {isEnglish ? 'Cancel' : 'Hủy'}
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading || uploading}
          data-testid="btn-submit-upload-material"
          style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', fontWeight: 600 }}
          onClick={() => form.submit()}
        >
          {uploading
            ? (isEnglish ? `Uploading (${uploadProgress}%)...` : `Đang Upload (${uploadProgress}%)...`)
            : isDirectFileUpload
              ? (isEnglish ? 'Save & Upload' : 'Lưu & Tải Lên')
              : editingItem
                ? (isEnglish ? 'Update Material' : 'Cập Nhật Tài Liệu')
                : (isEnglish ? 'Save & Sync' : 'Lưu & Đồng Bộ Tài Liệu (0ms)')}
        </Button>,
      ]}
      destroyOnClose
    >
      {/* 1. Danh sách tệp đã kéo thả vào */}
      {isDirectFileUpload && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
          }}
          data-testid="selected-files-list-container"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong style={{ fontSize: 13, color: '#334155' }}>
              📁 {isEnglish ? `Selected Files (${files.length}):` : `Danh Sách Tệp Đã Chọn (${files.length}):`}
            </Text>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
              {isMultiple
                ? (isEnglish ? 'Batch Upload' : 'Upload Hàng Loạt')
                : (isEnglish ? 'Single File' : '1 Tệp')}
            </Tag>
          </div>

          <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map((file, idx) => {
              const detected = detectFileType(file.name);
              const meta = MATERIAL_TYPES[detected] || MATERIAL_TYPES.PDF;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                  }}
                  data-testid={`dropped-file-item-${idx}`}
                >
                  <Space orientation="horizontal" size="small" style={{ overflow: 'hidden' }}>
                    <FilePdfOutlined style={{ color: meta.color, fontSize: 14 }} />
                    <span style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                  </Space>
                  <Space size={6}>
                    <Tag color={meta.badgeColor} style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
                      {isEnglish ? meta.labelEn : meta.labelVi}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatBytes(file.size)}
                    </Text>
                  </Space>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Thanh tiến trình upload Firebase Storage */}
      {uploading && (
        <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 10, backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1d39c4' }}>
              <LoadingOutlined style={{ marginRight: 6 }} /> {uploadStatusText}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1d39c4' }}>
              {uploadProgress}%
            </span>
          </div>
          <Progress percent={uploadProgress} status="active" strokeColor="#722ed1" />
        </div>
      )}

      {/* 3. Form nhập thông tin tài liệu & cấu hình thư mục Firebase */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={uploading}
        initialValues={{
          courseId: 'ALL',
          visibility: 'ALL',
          type: 'PDF',
          folderName: suggestedFolderName,
        }}
      >
        {/* Tiêu đề tài liệu hoặc tên bộ tài liệu */}
        <Form.Item
          name="title"
          label={
            <strong>
              {isMultiple
                ? (isEnglish ? 'Batch / Collection Title' : 'Tên Bộ Tài Liệu / Tên Đợt Tải Lên')
                : (isEnglish ? 'Material Title / Book Name' : 'Tên Tài Liệu / Giáo Trình')}
            </strong>
          }
          rules={[{ required: true, message: isEnglish ? 'Please enter title' : 'Vui lòng nhập tên tài liệu' }]}
        >
          <Input
            placeholder={isEnglish ? 'E.g., Wonders G5 Literature Anthology Unit 1' : 'Ví dụ: Sách Wonders G5 Reading/Writing Companion'}
            style={{ height: 40, borderRadius: 8 }}
            data-testid="input-material-title"
          />
        </Form.Item>

        {/* Thư mục lưu trữ học liệu */}
        <Form.Item
          name="folderName"
          label={
            <strong>
              {isEnglish ? 'Material Folder Name' : 'Tên Thư Mục Học Liệu'}
            </strong>
          }
          extra={
            <span style={{ fontSize: 11, color: '#64748b' }}>
              💡 {isEnglish
                ? 'Files will be organized and saved into this folder.'
                : 'Các tài liệu sẽ được gom nhóm và lưu trữ ngăn nắp theo thư mục này.'}
            </span>
          }
          rules={[{ required: true, message: isEnglish ? 'Please enter folder name' : 'Vui lòng nhập tên thư mục' }]}
        >
          <Input
            prefix={<FolderOpenOutlined style={{ color: '#722ed1' }} />}
            addonBefore="learning_materials/"
            placeholder="Wonders_G5_Unit1"
            style={{ height: 40, borderRadius: 8 }}
            data-testid="input-firebase-folder"
          />
        </Form.Item>

        {/* Khóa học áp dụng */}
        <Form.Item
          name="courseId"
          initialValue="ALL"
          label={<strong>{isEnglish ? 'Assigned Course Program' : 'Khóa Học Áp Dụng'}</strong>}
          rules={[{ required: true }]}
        >
          <Select style={{ height: 40, borderRadius: 8 }} data-testid="select-material-course">
            <Select.Option value="ALL">
              🌟 {isEnglish ? 'All Courses (Organization-wide)' : 'Toàn Bộ Khóa Học (Toàn Trung Tâm)'}
            </Select.Option>
            {courses.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name || c.code} ({c.level || 'Standard'})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Nếu không phải kéo thả trực tiếp, hiển thị ô nhập URL link Google Drive */}
        {!isDirectFileUpload && (
          <>
            <Form.Item
              name="type"
              label={<strong>{isEnglish ? 'Material Category / Format' : 'Phân Loại Học Liệu'}</strong>}
              rules={[{ required: true }]}
            >
              <Select style={{ height: 40, borderRadius: 8 }} data-testid="select-material-type">
                {Object.values(MATERIAL_TYPES).map((t) => (
                  <Select.Option key={t.key} value={t.key}>
                    {isEnglish ? t.labelEn : t.labelVi}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="url"
              label={<strong>{isEnglish ? 'Google Drive Link (File or Folder)' : 'Đường Dẫn Google Drive'}</strong>}
              rules={[
                { required: true, message: isEnglish ? 'Please enter URL' : 'Vui lòng nhập link tài liệu' },
                { type: 'url', message: isEnglish ? 'Must be a valid URL' : 'Vui lòng nhập đường dẫn URL hợp lệ' },
              ]}
            >
              <Input
                prefix={<LinkOutlined style={{ color: '#722ed1' }} />}
                placeholder="https://drive.google.com/..."
                style={{ height: 40, borderRadius: 8 }}
                data-testid="input-material-url"
              />
            </Form.Item>
          </>
        )}

        {/* Mô tả / Ghi chú */}
        <Form.Item
          name="description"
          label={<span>{isEnglish ? 'Description / Teaching Scope' : 'Mô Tả / Phạm Vi Bài Học'}</span>}
        >
          <TextArea
            rows={2}
            placeholder={isEnglish ? 'Optional brief notes about units or weeks covered...' : 'Ghi chú ngắn về các Unit hoặc tuần áp dụng (không bắt buộc)...'}
            style={{ borderRadius: 8 }}
            data-testid="input-material-description"
          />
        </Form.Item>

        {/* Quyền xem */}
        <Form.Item
          name="visibility"
          label={<strong>{isEnglish ? 'Access Permission' : 'Quyền Truy Cập & Hiển Thị'}</strong>}
        >
          <Radio.Group style={{ width: '100%' }}>
            <Radio value={VISIBILITY_TYPES.ALL.key} style={{ display: 'block', marginBottom: 6 }}>
              {isEnglish ? '🟢 Public (Visible to all Teachers and Students)' : '🟢 Công khai (Tất cả Giáo viên và Học viên đều thấy)'}
            </Radio>
            <Radio value={VISIBILITY_TYPES.TEACHERS_ONLY.key} style={{ display: 'block' }}>
              {isEnglish ? '🔒 Teachers & Academic Only (Hidden from Students)' : '🔒 Nội bộ Giáo Viên & Giáo Vụ (Ẩn đối với Học viên)'}
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};
