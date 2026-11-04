import React from 'react';
import { Modal, Form, Input, Select, Space, Button } from 'antd';
import { DAYS_OF_WEEK, PLATFORMS } from '../models/schedules.model';

export const ScheduleFormModal = ({ open, teachers, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal title="Xếp Lịch Lớp Học Online Mới" open={open} onCancel={onCancel} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="day" label="Thứ trong tuần" initialValue="Thứ 2" rules={[{ required: true }]}>
          <Select options={DAYS_OF_WEEK.filter((d) => d.value !== 'ALL')} />
        </Form.Item>
        <Form.Item name="timeSlot" label="Khung giờ" initialValue="08:00 - 10:00" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="className" label="Tên Lớp Học" rules={[{ required: true }]}>
          <Input placeholder="Ví dụ: 10A2 - Advanced Speaking" />
        </Form.Item>
        <Form.Item name="subject" label="Môn Học / Chuyên Đề" rules={[{ required: true }]}>
          <Input placeholder="Ví dụ: English Communication" />
        </Form.Item>
        <Form.Item name="teacherName" label="Giáo Viên Phụ Trách" rules={[{ required: true }]}>
          <Select options={teachers.map((t) => ({ value: t.name, label: `${t.name} (${t.nationality})` }))} />
        </Form.Item>
        <Form.Item name="platform" label="Nền tảng Online" initialValue="Zoom Meeting" rules={[{ required: true }]}>
          <Select options={PLATFORMS} />
        </Form.Item>
        <Form.Item name="meetingLink" label="Đường link phòng học (Meeting URL)" initialValue="https://zoom.us/j/888999111">
          <Input />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu Thời Khóa Biểu</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

