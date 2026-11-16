import React, { useState } from 'react';
import {
  Modal,
  Alert,
  Form,
  Row,
  Col,
  Avatar,
  Switch,
  Divider,
  Rate,
  Input,
  Space,
  Button,
  Typography,
  Tag,
  Progress,
  message,
} from 'antd';
import {
  GlobalOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

const { Text } = Typography;

export const SessionEvaluationModal = ({
  open,
  selectedClass,
  studentRoster,
  onToggleStudentPresence,
  onCancel,
  onSubmit,
}) => {
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadedVideoFile, setUploadedVideoFile] = useState(null);

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
    setUploadedVideoFile(null);
    setUploadingVideo(false);
    setVideoUploadProgress(0);
  };

  const handleDirectVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setVideoUploadProgress(10);
    try {
      const uploadRes = await DriveStorageService.uploadFile(file, {
        folderPath: DriveStorageService.FOLDERS.CLASS_RECORDINGS('2026'),
        tag: 'class_recording',
        title: `Session Recording - ${selectedClass?.name || 'Class'} (${new Date().toLocaleDateString('vi-VN')})`,
        notes: `Recorded session for class ${selectedClass?.name || ''}`,
        purpose: 'session_recording',
        key: selectedClass?.id || 'class_recording',
        onProgress: (p) => setVideoUploadProgress(p),
      });

      const videoUrl = uploadRes.webViewLink || uploadRes.downloadUrl || '';
      form.setFieldsValue({ recordingUrl: videoUrl });
      setUploadedVideoFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      });
      message.success(
        isEnglish
          ? 'Video uploaded to Google Drive successfully!'
          : 'Đã tải tệp video lên Google Drive thành công!'
      );
    } catch (err) {
      console.error('Video upload failed:', err);
      message.error(err.message || 'Lỗi tải video lên Google Drive');
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <GlobalOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ color: '#1890ff' }}>
            {isEnglish ? 'Session Attendance & Evaluation' : 'Điểm Danh & Đánh Giá Buổi Học'}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={650}
    >
      <Alert
        message={`${isEnglish ? 'Active Class:' : 'Lớp đang điểm danh:'} ${selectedClass?.name || ''}`}
        description={
          isEnglish
            ? 'Verify attendance in online classroom, evaluate 4 English skills and provide session feedback.'
            : 'Kiểm tra sĩ số học viên trong phòng học trực tuyến, chấm điểm 4 kỹ năng tiếng Anh và nhập nhận xét buổi học.'
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          pronunciationScore: 5,
          spellingScore: 5,
          seriousnessScore: 5,
          listeningScore: 5,
          recordingUrl: selectedClass?.recordingUrl,
        }}
      >
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {isEnglish ? '1. Student Attendance Roster:' : '1. Điểm danh từng học viên trong lớp:'}
        </Text>
        <div
          style={{
            background: '#fafafa',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {studentRoster.map((st) => (
            <Row
              key={st.id}
              justify="space-between"
              align="middle"
              style={{ padding: '6px 0', borderBottom: '1px dashed #f0f0f0' }}
            >
              <Col>
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <Text strong>{st.englishName && st.englishName !== st.name ? `${st.englishName} (${st.name})` : (st.englishName || st.name)}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>({st.id})</Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Text style={{ fontSize: 12, color: st.present ? '#52c41a' : '#ff4d4f' }}>
                    {st.present ? 'Có mặt (Present)' : 'Vắng (Absent)'}
                  </Text>
                  <Switch
                    checked={st.present}
                    onChange={() => onToggleStudentPresence(st.id)}
                    size="small"
                  />
                </Space>
              </Col>
            </Row>
          ))}
        </div>

        <Divider style={{ margin: '12px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          2. Đánh giá 4 kỹ năng tiếng Anh (⭐ 1 - 5 Sao):
        </Text>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="pronunciationScore" label="🗣️ Pronunciation (Phát âm)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="spellingScore" label="🔤 Spelling & Vocab (Đánh vần)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="seriousnessScore" label="🎯 Seriousness (Nghiêm túc)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="listeningScore" label="🎧 Listening (Nghe hiểu)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, backgroundColor: '#fcfaff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <Text strong style={{ fontSize: 13, color: '#6b21a8' }}>
              📹 {isEnglish ? 'Session Video Recording (Optional)' : 'Video Ghi Hình Buổi Học (Tùy Chọn)'}
            </Text>
            <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>
              {isEnglish ? 'Google Drive Cloud' : 'Lưu Trên Google Drive'}
            </Tag>
          </div>

          <Form.Item
            name="recordingUrl"
            style={{ marginBottom: 8 }}
            extra={
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {isEnglish
                  ? 'Paste a Google Drive / Cloud link or upload video directly below. Optional: You can leave it blank.'
                  : 'Dán link Google Drive / Cloud hoặc tải tệp video trực tiếp bên dưới. Không bắt buộc, có thể để trống.'}
              </span>
            }
          >
            <Input
              prefix={<PlayCircleOutlined style={{ color: '#7c3aed' }} />}
              placeholder="https://drive.google.com/file/d/... hoặc link video"
              style={{ borderRadius: 6 }}
              allowClear
              data-testid="input-attendance-recording-url"
            />
          </Form.Item>

          {/* Cụm Nút Tải Tệp Trực Tiếp Lên Google Drive */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <input
              id="attendance-video-upload-input"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
              style={{ display: 'none' }}
              onChange={handleDirectVideoUpload}
              disabled={uploadingVideo}
            />
            <Button
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => document.getElementById('attendance-video-upload-input')?.click()}
              loading={uploadingVideo}
              style={{ borderRadius: 6, borderColor: '#c4b5fd', color: '#6b21a8' }}
              data-testid="btn-attendance-upload-video"
            >
              {uploadingVideo
                ? (isEnglish ? 'Uploading to Drive...' : 'Đang tải lên Drive...')
                : (isEnglish ? 'Upload Video File (.mp4)' : 'Tải Tệp Video Từ Máy (.mp4)')}
            </Button>

            {uploadedVideoFile && (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 4, margin: 0 }}>
                {uploadedVideoFile.name} ({uploadedVideoFile.size})
              </Tag>
            )}
          </div>

          {uploadingVideo && (
            <div style={{ marginTop: 8 }}>
              <Progress percent={videoUploadProgress} size="small" strokeColor="#7c3aed" />
            </div>
          )}
        </div>

        <Form.Item
          name="teacherFeedback"
          label={isEnglish ? "💬 Teacher's Feedback" : '💬 Nhận xét chi tiết của Giáo viên (English Feedback)'}
          rules={[{ required: true, message: isEnglish ? 'Please provide feedback for this session' : 'Vui lòng nhập nhận xét buổi học' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder={isEnglish ? "Enter detailed feedback for today's session..." : 'Nhập nhận xét chi tiết cho buổi học hôm nay...'}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>{isEnglish ? 'Cancel' : 'Hủy'}</Button>
            <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
              {isEnglish ? 'Save Attendance & Evaluation' : 'Lưu Điểm Danh & Đánh Giá'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

