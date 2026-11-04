import React from 'react';
import { Modal, Form, Input, InputNumber, Space, Button } from 'antd';

export const CourseFormModal = ({ open, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal title="Tạo Khóa Học Mới" open={open} onCancel={onCancel} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="Tên Khóa Học" rules={[{ required: true }]}>
          <Input placeholder="Ví dụ: Business English Communication B2" />
        </Form.Item>
        <Form.Item name="level" label="Trình độ / Cấp độ" initialValue="Intermediate B1-B2" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="durationWeeks" label="Thời lượng (Số tuần)" initialValue={12} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="feePerMonth" label="Học phí / Tháng (VNĐ)" initialValue={2800000} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">Tạo Khóa Học</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

