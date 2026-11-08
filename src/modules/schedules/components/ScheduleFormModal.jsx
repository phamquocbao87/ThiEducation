import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Space, Button, Alert, Typography } from 'antd';
import { DAYS_OF_WEEK, PLATFORMS } from '../models/schedules.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const ScheduleFormModal = ({ open, teachers = [], classes = [], onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const { isEnglish } = useLanguage();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSelectClass = (selectedId) => {
    const matched = classes.find((c) => c.id === selectedId);
    if (matched) {
      form.setFieldsValue({
        className: matched.name,
        subject: matched.subject || 'Wonders English ELA',
        teacherName: matched.teacherName,
        meetingLink: matched.meetingLink || 'https://zoom.us/j/888999111',
      });
    }
  };

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={isEnglish ? 'Schedule New Zoom Session' : 'Xếp Lịch Lớp Học Online Mới'}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      style={{ borderRadius: 12 }}
    >
      {(!classes || classes.length === 0) && (
        <Alert
          type="warning"
          showIcon
          message={isEnglish ? 'No Classes Found in System' : 'Chưa Có Lớp Học Nào Trong Hệ Thống'}
          description={
            isEnglish
              ? 'You should create a class in Courses & Classes (/courses-classes) first so schedule slots belong to real classes.'
              : 'Bạn nên tạo lớp học tại Quản Lý Khóa Học & Lớp Học (/courses-classes) trước để ca dạy được liên kết đúng với lớp thực tế.'
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {classes && classes.length > 0 && (
          <Form.Item
            name="classId"
            label={<Text strong>{isEnglish ? 'Select Existing Class' : 'Chọn Lớp Học Đang Mở'}</Text>}
            rules={[{ required: true, message: isEnglish ? 'Please select class' : 'Vui lòng chọn lớp học' }]}
          >
            <Select
              placeholder={isEnglish ? 'Choose a class to autofill...' : 'Chọn lớp để tự động điền thông tin...'}
              onChange={handleSelectClass}
              style={{ borderRadius: 8 }}
            >
              {classes.map((cls) => (
                <Select.Option key={cls.id} value={cls.id}>
                  [{cls.id}] {cls.name} — GV: {cls.teacherName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="day"
          label={<Text strong>{isEnglish ? 'Day of Week' : 'Thứ Trong Tuần'}</Text>}
          initialValue="Thứ 2"
          rules={[{ required: true }]}
        >
          <Select
            options={DAYS_OF_WEEK.filter((d) => d.value !== 'ALL').map((d) => ({
              value: d.value,
              label: isEnglish ? (d.value === 'Thứ 2' ? 'Monday' : d.value === 'Thứ 3' ? 'Tuesday' : d.value === 'Thứ 4' ? 'Wednesday' : d.value === 'Thứ 5' ? 'Thursday' : d.value === 'Thứ 6' ? 'Friday' : d.value === 'Thứ 7' ? 'Saturday' : 'Sunday') : d.label,
            }))}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label={<Text strong>{isEnglish ? 'Time Slot' : 'Khung Giờ Học'}</Text>}
          initialValue="18:00 - 20:00"
          rules={[{ required: true }]}
        >
          <Input placeholder="Ví dụ: 18:00 - 20:00" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="className"
          label={<Text strong>{isEnglish ? 'Class Name' : 'Tên Lớp Học'}</Text>}
          rules={[{ required: true, message: isEnglish ? 'Please enter class name' : 'Vui lòng nhập tên lớp' }]}
        >
          <Input placeholder={isEnglish ? 'E.g. Wonders Grade 4 - Class A' : 'Ví dụ: Wonders Grade 4 - Lớp A'} style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="subject"
          label={<Text strong>{isEnglish ? 'Subject / Curriculum' : 'Môn Học / Bộ Giáo Trình'}</Text>}
          rules={[{ required: true }]}
        >
          <Input placeholder={isEnglish ? 'E.g. Wonders ELA & Spelling' : 'Ví dụ: Wonders ELA & Spelling'} style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="teacherName"
          label={<Text strong>{isEnglish ? 'Teacher in Charge' : 'Giáo Viên Bản Xứ Phụ Trách'}</Text>}
          rules={[{ required: true }]}
        >
          <Select
            options={teachers.map((t) => ({ value: t.name, label: `${t.name} (${t.nationality || 'Native'})` }))}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="platform"
          label={<Text strong>{isEnglish ? 'Live Platform' : 'Nền Tảng Trực Tuyến'}</Text>}
          initialValue="Zoom Meeting"
          rules={[{ required: true }]}
        >
          <Select options={PLATFORMS} style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="meetingLink"
          label={<Text strong>{isEnglish ? 'Zoom Meeting URL' : 'Đường Link Phòng Học (Meeting URL)'}</Text>}
          initialValue="https://zoom.us/j/888999111"
        >
          <Input style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end', paddingTop: 10 }}>
            <Button onClick={onCancel} style={{ borderRadius: 8 }}>
              {isEnglish ? 'Cancel' : 'Hủy'}
            </Button>
            <Button type="primary" htmlType="submit" style={{ borderRadius: 8, backgroundColor: '#1890ff' }}>
              {isEnglish ? 'Save Schedule Slot' : 'Lưu Thời Khóa Biểu'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
