import React from 'react';
import { Modal, Form, Input, Select, Row, Col, Space, Avatar, Typography } from 'antd';
import { UserOutlined, VideoCameraOutlined, BookOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Option } = Select;
const { Text } = Typography;

export const ClassFormModal = ({ open, courses, teachers, students, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const { isEnglish } = useLanguage();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={isEnglish ? 'Create New Class & Assign Teacher' : 'Khởi Tạo Lớp Học & Phân Công Giáo Viên'}
      open={open}
      width={680}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => form.submit()}
      okText={isEnglish ? 'Create Class' : 'Tạo Lớp Học'}
      cancelText={isEnglish ? 'Cancel' : 'Hủy'}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          courseId: courses[0]?.id,
          teacherId: teachers[0]?.id,
          platform: 'Zoom Meeting',
          schedule: 'Thứ 2, Thứ 4, Thứ 6 (18:00 - 20:00)',
          meetingId: '888 999 111',
          passcode: '123456',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="courseId"
              label={isEnglish ? 'Select Course Program' : 'Khóa Học Trực Thuộc'}
              rules={[{ required: true, message: isEnglish ? 'Please select course' : 'Vui lòng chọn khóa học' }]}
            >
              <Select style={{ borderRadius: 8 }}>
                {courses.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={isEnglish ? 'Class Name' : 'Tên Lớp Học'}
              rules={[{ required: true, message: isEnglish ? 'Please enter class name' : 'Vui lòng nhập tên lớp học' }]}
            >
              <Input placeholder={isEnglish ? 'e.g. Class 10A2 - Wonders G2 (Zoom)' : 'VD: Class 10A2 - Wonders G2 (Zoom)'} style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="teacherId"
          label={
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text strong>{isEnglish ? 'Assigned Native Teacher (1 Teacher per Class)' : 'Giáo Viên Bản Xứ Đảm Nhiệm (1 GV / Lớp)'}</Text>
            </Space>
          }
          rules={[{ required: true, message: isEnglish ? 'Please assign 1 native teacher' : 'Vui lòng phân công 1 giáo viên phụ trách' }]}
        >
          <Select placeholder={isEnglish ? 'Select 1 Native Teacher' : 'Chọn 1 Giáo viên Bản Xứ'} style={{ borderRadius: 8 }}>
            {teachers.map((t) => (
              <Option key={t.id} value={t.id}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  <span>{t.name}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>({t.nationality || 'Native'})</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="studentIds"
          label={isEnglish ? 'Enroll Students to Class Roster' : 'Gán Học Viên Vào Lớp (Class Roster)'}
        >
          <Select
            mode="multiple"
            allowClear
            placeholder={isEnglish ? 'Select students to enroll...' : 'Chọn các học viên nhập học vào lớp này...'}
            style={{ width: '100%', borderRadius: 8 }}
            maxTagCount="responsive"
          >
            {students.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name} ({s.englishName ? `${s.englishName} - ` : ''}{s.id})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="schedule"
              label={isEnglish ? 'Weekly Schedule Slots' : 'Lịch Học Hàng Tuần'}
              rules={[{ required: true }]}
            >
              <Input placeholder="Thứ 2, Thứ 4, Thứ 6 (18:00 - 20:00)" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="meetingLink"
              label={
                <Space>
                  <VideoCameraOutlined style={{ color: '#722ed1' }} />
                  <span>{isEnglish ? 'Zoom Meeting URL' : 'Link Phòng Zoom'}</span>
                </Space>
              }
            >
              <Input placeholder="https://zoom.us/j/888999111" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="meetingId" label="Zoom Meeting ID">
              <Input placeholder="888 999 111" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="passcode" label="Zoom Passcode">
              <Input placeholder="123456" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

