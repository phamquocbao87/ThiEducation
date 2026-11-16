import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Typography,
  Space,
  Tag,
  Button,
  message,
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  StudentNoteService,
  NOTE_CATEGORIES,
  NOTE_CATEGORY_LABELS,
} from '../services/StudentNoteService';

const { Text, Title } = Typography;
const { TextArea } = Input;

export const TeacherContactAcademicModal = ({
  open,
  student,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const { isEnglish, language } = useLanguage();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  if (!student) return null;

  const studentCode = student.code || student.id;
  const labels = NOTE_CATEGORY_LABELS[language === 'vi' ? 'vi' : 'en'] || NOTE_CATEGORY_LABELS.vi;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await StudentNoteService.sendNote({
        student,
        teacher: currentUser,
        category: values.category,
        priority: values.priority || 'NORMAL',
        content: values.content,
      });

      message.success(
        isEnglish
          ? 'Message sent successfully!'
          : 'Đã gửi tin nhắn thành công!'
      );

      form.resetFields();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || 'Lỗi gửi tin nhắn đến giáo vụ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields();
        if (onClose) onClose();
      }}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#e6f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0958d9',
            }}
          >
            <MessageOutlined style={{ fontSize: 18 }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {isEnglish ? 'Send Message' : 'Gửi Tin Nhắn'}
          </span>
        </Space>
      }
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            form.resetFields();
            if (onClose) onClose();
          }}
          style={{ borderRadius: 8, height: 38 }}
        >
          {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          style={{
            borderRadius: 8,
            height: 38,
            backgroundColor: '#0958d9',
            fontWeight: 600,
          }}
        >
          {isEnglish ? 'Send Message' : 'Gửi Tin Nhắn'}
        </Button>,
      ]}
      width={560}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        {/* Card Tóm Tắt Thông Tin Học Viên */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                {student.name}
              </Text>
              {student.englishName && (
                <Tag color="cyan" style={{ marginLeft: 8, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                  🌟 {student.englishName}
                </Tag>
              )}
              <Tag style={{ marginLeft: 4, borderRadius: 4, fontSize: 11 }}>
                {studentCode}
              </Tag>
            </div>
            <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
              👨‍🏫 {currentUser?.name || 'Teacher'}
            </Tag>
          </div>
          {student.parentName && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
              👨‍👩‍👧 {isEnglish ? 'Parent:' : 'Phụ huynh:'}{' '}
              <span style={{ color: '#1e293b', fontWeight: 600 }}>{student.parentName}</span>
            </div>
          )}
        </div>

        {/* Form Nhập Liệu */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            category: NOTE_CATEGORIES.ACADEMIC_PROGRESS,
            priority: 'NORMAL',
          }}
        >
          <Form.Item
            name="category"
            label={
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {isEnglish ? 'Message Category' : 'Phân Loại Chủ Đề'}
              </span>
            }
            rules={[{ required: true, message: isEnglish ? 'Please select category' : 'Vui lòng chọn phân loại' }]}
          >
            <Select style={{ height: 40, borderRadius: 8 }}>
              {Object.keys(NOTE_CATEGORIES).map((key) => (
                <Select.Option key={key} value={key}>
                  {labels[key] || key}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label={
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {isEnglish ? 'Priority Level' : 'Mức Độ Ưu Tiên'}
              </span>
            }
          >
            <Radio.Group>
              <Radio value="NORMAL">
                🟢 {isEnglish ? 'Normal' : 'Bình thường'}
              </Radio>
              <Radio value="URGENT">
                🚨 <span style={{ color: '#e11d48', fontWeight: 600 }}>{isEnglish ? 'Urgent (Need immediate call)' : 'Khẩn cấp (Cần gọi ngay)'}</span>
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="content"
            label={
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {isEnglish ? 'Message Content' : 'Nội Dung Tin Nhắn'}
              </span>
            }
            rules={[
              {
                required: true,
                message: isEnglish
                  ? 'Please enter message content (at least 5 characters)'
                  : 'Vui lòng nhập nội dung tin nhắn (tối thiểu 5 ký tự)',
                min: 5,
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={
                isEnglish
                  ? 'E.g.: Student was absent today without prior notice. Please check with parent if student is unwell or needs homework catch-up materials...'
                  : 'Ví dụ: Hôm nay em chưa làm bài tập về nhà Unit 3 và vào học muộn 15 phút. Nhờ Giáo vụ nhắc phụ huynh đôn đốc em hoàn thành trước buổi học thứ Năm tới...'
              }
              showCount
              maxLength={1000}
              style={{ borderRadius: 8, padding: 10 }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default TeacherContactAcademicModal;
