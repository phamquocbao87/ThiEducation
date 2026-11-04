import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Space, Button } from 'antd';
import { CONTRACT_TYPES } from '../models/contracts.model';

export const ContractFormModal = ({ open, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Tạo Hợp Đồng Giáo Viên Mới"
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="teacherName"
          label="Họ và Tên Giáo Viên Bản Xứ"
          rules={[{ required: true, message: 'Vui lòng nhập tên giáo viên' }]}
        >
          <Input placeholder="Ví dụ: Mr. Robert Wilson (USA)" />
        </Form.Item>
        <Form.Item name="type" label="Loại Hợp Đồng" initialValue="Full-time Native" rules={[{ required: true }]}>
          <Select options={CONTRACT_TYPES} />
        </Form.Item>
        <Form.Item name="ratePerSession" label="Đơn Giá / 1 Tiết Dạy (VNĐ)" initialValue={450000} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="minSessionsPerMonth" label="Chỉ tiêu tiết dạy/tháng" initialValue={40}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu Hợp Đồng</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

