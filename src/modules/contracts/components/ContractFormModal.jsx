import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Space, Button } from 'antd';
import { CONTRACT_TYPES } from '../models/contracts.model';
import { useLanguage } from '../../../core/context/LanguageContext';

export const ContractFormModal = ({ open, onCancel, onSubmit, realTeachers = [] }) => {
  const [form] = Form.useForm();
  const { t } = useLanguage();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  const teacherOptions = realTeachers.map((tch) => ({
    value: tch.id,
    label: `${tch.name} (${tch.englishName || tch.id}) — ${tch.nationality}`,
  }));

  return (
    <Modal
      title={t('contracts.modal.title')}
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="teacherId"
          label={t('contracts.modal.selectTeacher')}
          rules={[{ required: true, message: t('contracts.modal.selectTeacherPlaceholder') }]}
        >
          {teacherOptions.length > 0 ? (
            <Select
              placeholder={t('contracts.modal.selectTeacherPlaceholder')}
              options={teacherOptions}
              onChange={(val) => {
                const selected = realTeachers.find((t) => t.id === val);
                if (selected) {
                  form.setFieldsValue({
                    teacherName: `${selected.name} (${selected.englishName || selected.id})`,
                    ratePerSession: selected.hourlyRate || 450000,
                  });
                }
              }}
            />
          ) : (
            <Input placeholder="Nhập tên giáo viên..." />
          )}
        </Form.Item>

        <Form.Item name="teacherName" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="type"
          label={t('contracts.modal.contractType')}
          initialValue="Full-time Native"
          rules={[{ required: true }]}
        >
          <Select options={CONTRACT_TYPES} />
        </Form.Item>

        <Form.Item
          name="ratePerSession"
          label={t('contracts.modal.ratePerSession')}
          initialValue={450000}
          rules={[{ required: true }]}
        >
          <InputNumber
            style={{ width: '100%', height: 40, borderRadius: 8 }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="minSessionsPerMonth"
          label={t('contracts.modal.minSessionsPerMonth')}
          initialValue={40}
        >
          <InputNumber style={{ width: '100%', height: 40, borderRadius: 8 }} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} style={{ borderRadius: 8 }}>
              {t('contracts.modal.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" style={{ borderRadius: 8 }}>
              {t('contracts.modal.save')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContractFormModal;
