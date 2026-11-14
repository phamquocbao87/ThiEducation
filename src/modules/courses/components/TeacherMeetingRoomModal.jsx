import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Row, Col, message } from 'antd';
import {
  VideoCameraOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassService } from '../services/ClassService';
import { MeetingPlatformBadge, detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';

const { Text } = Typography;

export const TeacherMeetingRoomModal = ({
  open,
  classData,
  onClose,
  onSuccess,
}) => {
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);

  const hostLinkVal = Form.useWatch('zoomHostLink', form);
  const studentLinkVal = Form.useWatch('zoomStudentLink', form);
  const hostPlatform = detectMeetingPlatform(hostLinkVal);
  const studentPlatform = detectMeetingPlatform(studentLinkVal);

  useEffect(() => {
    if (open && classData) {
      form.setFieldsValue({
        zoomHostLink: classData.zoomHostLink || '',
        zoomStudentLink: classData.zoomStudentLink || '',
        meetingId: classData.meetingId || '',
        passcode: classData.passcode || '',
      });
    }
  }, [open, classData, form]);

  const handleSubmit = async (values) => {
    if (!classData?.id) return;
    setSaving(true);
    try {
      await ClassService.updateClassMeetingLinks(classData.id, values);
      message.success(
        isEnglish
          ? 'Virtual classroom links updated successfully!'
          : 'Đã cập nhật link phòng học trực tuyến thành công!'
      );
      onSuccess?.({ ...classData, ...values });
      onClose();
    } catch (err) {
      message.error(
        isEnglish
          ? `Failed to update links: ${err.message}`
          : `Lỗi cập nhật link phòng học: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VideoCameraOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {isEnglish
              ? `Update Meeting Room Links — ${classData?.name || classData?.id}`
              : `Cập Nhật Link Phòng Học — ${classData?.name || classData?.id}`}
          </span>
        </div>
      }
      style={{ borderRadius: 12 }}
    >
      <div style={{ marginBottom: 14, color: '#64748b', fontSize: 13 }}>
        💡 {isEnglish
          ? 'As the assigned teacher, you can configure your host link and the student join link (Google Meet, Zoom, Teams, etc.).'
          : 'Là giáo viên phụ trách lớp, bạn có toàn quyền cập nhật Link Host của mình và Link Tham Gia cho học viên (hỗ trợ Google Meet, Zoom, Teams...).'}
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="zoomHostLink"
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
              <Space size={6}>
                {hostPlatform.icon}
                <Text strong>{isEnglish ? 'Host Meeting URL (Teacher)' : 'Link Giáo Viên (Host)'}</Text>
              </Space>
              {hostLinkVal && <MeetingPlatformBadge url={hostLinkVal} size="small" />}
            </div>
          }
          rules={[{ required: true, message: isEnglish ? 'Please enter host URL' : 'Vui lòng nhập link Host của giáo viên' }]}
        >
          <Input
            prefix={hostPlatform.icon}
            placeholder="https://meet.google.com/xyz hoặc https://zoom.us/s/..."
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="zoomStudentLink"
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
              <Space size={6}>
                {studentPlatform.icon}
                <Text strong>{isEnglish ? 'Join Meeting URL (Students)' : 'Link Tham Gia (Học Viên)'}</Text>
              </Space>
              {studentLinkVal && <MeetingPlatformBadge url={studentLinkVal} size="small" />}
            </div>
          }
          rules={[{ required: true, message: isEnglish ? 'Please enter student join URL' : 'Vui lòng nhập link tham gia cho học viên' }]}
        >
          <Input
            prefix={studentPlatform.icon}
            placeholder="https://meet.google.com/xyz hoặc https://zoom.us/j/..."
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="meetingId" label={<Text strong>{isEnglish ? 'Meeting ID (Optional)' : 'Meeting ID (Nếu có)'}</Text>}>
              <Input placeholder="888 999 111" style={{ width: '100%', height: 40, borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="passcode" label={<Text strong>{isEnglish ? 'Passcode / PIN (Optional)' : 'Mật mã phòng / PIN (Nếu có)'}</Text>}>
              <Input placeholder="123456" style={{ width: '100%', height: 40, borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button onClick={onClose} icon={<CloseOutlined />} style={{ borderRadius: 8, height: 40 }}>
            {isEnglish ? 'Cancel' : 'Hủy'}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
            style={{ borderRadius: 8, height: 40, backgroundColor: '#1890ff', fontWeight: 600 }}
          >
            {isEnglish ? 'Save Room Links' : 'Lưu Link Phòng Học'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

