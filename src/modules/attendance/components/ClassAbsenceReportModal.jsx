import React, { useState } from 'react';
import { Modal, Form, DatePicker, Select, Input, Button, Space, Typography, Tag, message } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useAuth } from '../../../core/context/AuthContext';
import { AbsenceRequestService } from '../services/AbsenceRequestService';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const ClassAbsenceReportModal = ({
  open,
  classData,
  onClose,
  onSuccess,
}) => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    if (!classData?.id) return;
    setSubmitting(true);
    try {
      const formattedDate = values.absenceDate
        ? values.absenceDate.format('DD/MM/YYYY')
        : dayjs().format('DD/MM/YYYY');

      const userRole = currentUser?.role === 'teacher' ? 'teacher' : 'student';

      await AbsenceRequestService.createRequest({
        classId: classData.id,
        className: classData.name || classData.id,
        userId: currentUser?.id || currentUser?.code || 'UNKNOWN',
        userName: currentUser?.name || currentUser?.displayName || 'User',
        userRole,
        absenceDate: formattedDate,
        sessionTime: values.sessionTime || classData.schedule || 'Regular Session',
        reason: values.reason,
        note: values.note || '',
      });

      message.success(
        isEnglish
          ? 'Absence notice sent successfully! Academic team has been notified.'
          : 'Đã gửi thông báo báo vắng thành công! Giáo vụ đã nhận được thông tin để hỗ trợ.'
      );
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(
        isEnglish
          ? `Failed to send absence notice: ${err.message}`
          : `Lỗi gửi đơn báo vắng: ${err.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isTeacher = currentUser?.role === 'teacher';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {isEnglish
              ? `Report Absence / Leave — ${classData?.name || classData?.id}`
              : `Báo Vắng Mặt / Xin Nghỉ — ${classData?.name || classData?.id}`}
          </span>
        </div>
      }
      style={{ borderRadius: 12 }}
    >
      <div style={{ marginBottom: 14, background: '#fffbe6', padding: '10px 14px', borderRadius: 8, border: '1px solid #ffe58f' }}>
        <Text style={{ fontSize: 13, color: '#873800' }}>
          💡 {isEnglish
            ? 'Your absence request will be delivered directly to the Academic Operations Center for schedule adjustment and teacher/student notification.'
            : 'Đơn báo vắng của bạn sẽ được gửi thẳng tới Bàn Giáo Vụ để điều phối lớp, ghi nhận sổ điểm danh và sắp xếp lịch học bù kịp thời.'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          absenceDate: dayjs(),
          sessionTime: classData?.schedule || '',
          reason: isEnglish ? 'Health / Sick Leave' : 'Bị ốm / Sức khỏe không tốt',
        }}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <Tag color="blue">{classData?.id}</Tag>
          <Text strong>{classData?.name}</Text>
          <Tag color={isTeacher ? 'purple' : 'green'}>
            {isTeacher ? (isEnglish ? 'Teacher Notice' : 'Giáo Viên Báo Vắng') : (isEnglish ? 'Student Notice' : 'Học Viên Xin Nghỉ')}
          </Tag>
        </div>

        <Form.Item
          name="absenceDate"
          label={<Text strong>{isEnglish ? 'Absence Date' : 'Ngày Xin Vắng Mặt'}</Text>}
          rules={[{ required: true, message: isEnglish ? 'Please select absence date' : 'Vui lòng chọn ngày báo vắng' }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="sessionTime"
          label={<Text strong>{isEnglish ? 'Class Schedule / Time Slot' : 'Khung Giờ Ca Học'}</Text>}
        >
          <Input
            prefix={<ClockCircleOutlined style={{ color: '#0284c7' }} />}
            placeholder="19:00 - 21:10"
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label={<Text strong>{isEnglish ? 'Reason for Absence' : 'Lý Do Vắng Mặt'}</Text>}
          rules={[{ required: true, message: isEnglish ? 'Please choose reason' : 'Vui lòng chọn lý do' }]}
        >
          <Select style={{ width: '100%', height: 40 }}>
            <Option value="Bị ốm / Sức khỏe không tốt">
              {isEnglish ? 'Health / Sick Leave' : '🤒 Bị ốm / Sức khỏe không tốt'}
            </Option>
            <Option value="Bận việc gia đình đột xuất">
              {isEnglish ? 'Urgent Family Matters' : '🏠 Bận việc gia đình đột xuất'}
            </Option>
            <Option value="Trùng lịch thi cử / Học trên trường">
              {isEnglish ? 'School Exam / Test Conflict' : '📚 Trùng lịch thi cử / Học trên trường'}
            </Option>
            <Option value="Đi công tác / Du lịch">
              {isEnglish ? 'Business Trip / Travel' : '✈️ Đi công tác / Du lịch'}
            </Option>
            <Option value="Lý do khác">
              {isEnglish ? 'Other Reason' : '📝 Lý do khác'}
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="note"
          label={<Text strong>{isEnglish ? 'Detailed Notes / Message to Academic Staff' : 'Ghi Chú Chi Tiết / Lời Nhắn Gửi Giáo Vụ'}</Text>}
        >
          <TextArea
            rows={3}
            placeholder={
              isEnglish
                ? 'Provide any additional details or preferred makeup date...'
                : 'Nhập thông tin thêm hoặc đề xuất buổi học bù (nếu có)...'
            }
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <Button onClick={onClose} icon={<CloseOutlined />} style={{ borderRadius: 8, height: 40 }}>
            {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SendOutlined />}
            style={{ borderRadius: 8, height: 40, backgroundColor: '#fa8c16', borderColor: '#fa8c16', fontWeight: 600 }}
          >
            {isEnglish ? 'Send Absence Notice' : 'Gửi Đơn Báo Vắng'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

