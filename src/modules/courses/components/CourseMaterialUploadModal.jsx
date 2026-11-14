import React from 'react';
import { Button, Form, Input, Modal, Radio, Select, Space, Typography } from 'antd';
import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const CourseMaterialUploadModal = ({
  open,
  course,
  loading = false,
  onSave,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSave?.({
      ...values,
      id: `mat_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    });
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      wrapClassName="course-upload-modal-wrapper"
      title={
        <Space orientation="horizontal" size="small" data-testid="course-upload-modal-title">
          <CloudUploadOutlined style={{ color: '#722ed1' }} />
          <span>Tải Lên Học Liệu Cho Khóa Học: <strong>{course?.name || 'Khung Khóa Học'}</strong></span>
        </Space>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel') || 'Hủy'}
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
          onClick={() => form.submit()}
          data-testid="btn-submit-course-material"
        >
          {t('classroom.saveToCourse') || 'Lưu Vào Khóa Học (0ms Đồng Bộ)'}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ backgroundColor: '#f9f0ff', border: '1px solid #d3adf7', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#531dab' }}>
          ⚡ <strong>Kế Thừa Tự Động:</strong> Khi Giáo vụ lưu tài liệu tại đây, toàn bộ các lớp học, giáo viên và học viên trực thuộc khóa học này sẽ lập tức nhận và tải được tài liệu trong phòng học!
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          type: 'PDF',
          visibility: 'ALL',
          url: 'https://drive.google.com/file/d/1w3s6Xjeq0SPV9qg_83igR6NCo7SbDEMh/view',
        }}
      >
        <Form.Item
          name="title"
          label="Tên Tài Liệu / Giáo Trình"
          rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
        >
          <Input placeholder="Ví dụ: Decodable Readers Unit 2 (Full PDF)" style={{ height: 38, borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="type"
          label="Phân Loại Học Liệu"
          rules={[{ required: true }]}
        >
          <Select style={{ height: 38, borderRadius: 8 }}>
            <Select.Option value="PDF">📘 Sách Học Sinh (PDF Book)</Select.Option>
            <Select.Option value="AUDIO">🎧 Thư Mục Audio Bài Nghe (MP3 Google Drive)</Select.Option>
            <Select.Option value="PRACTICE">📝 Sách Bài Tập (Practice Book PDF)</Select.Option>
            <Select.Option value="TEACHER">🧑‍🏫 Sách Hướng Dẫn Giáo Viên (Teacher Only)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="url"
          label="Đường Dẫn Google Drive (File hoặc Thư Mục)"
          rules={[{ required: true, message: 'Vui lòng nhập link Drive' }]}
        >
          <Input prefix={<LinkOutlined />} placeholder="https://drive.google.com/..." style={{ height: 38, borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="visibility"
          label="Đối Tượng Được Phép Truy Cập"
        >
          <Radio.Group>
            <Radio value="ALL">Tất cả (Giáo viên & Học viên các lớp)</Radio>
            <Radio value="TEACHER_ONLY">Chỉ Giáo viên (Teacher Only)</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};
