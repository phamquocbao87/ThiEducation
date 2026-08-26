import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Select, Row, Col, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, ClockCircleOutlined, UserOutlined, VideoCameraOutlined, LinkOutlined } from '@ant-design/icons';
import { MOCK_TIMETABLE, MOCK_TEACHERS } from '../../shared/data/mockData';
import { useAuth } from '../../core/context/AuthContext';

const { Title, Text } = Typography;

export const TimetableManager = () => {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState(MOCK_TIMETABLE);
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddSlot = (values) => {
    const newSlot = {
      id: `T${timetable.length + 1}`,
      day: values.day,
      timeSlot: values.timeSlot,
      className: values.className,
      subject: values.subject,
      teacherName: values.teacherName,
      platform: values.platform || 'Zoom Meeting',
      meetingLink: values.meetingLink || 'https://zoom.us/j/123456789',
      status: 'Lên kế hoạch',
    };
    setTimetable([...timetable, newSlot]);
    setIsModalOpen(false);
    form.resetFields();
    message.success('Thêm lịch dạy Online mới thành công!');
  };

  const filteredData = selectedDayFilter === 'ALL'
    ? timetable
    : timetable.filter(item => item.day === selectedDayFilter);

  const columns = [
    {
      title: 'Thứ trong tuần',
      dataIndex: 'day',
      key: 'day',
      render: (day) => <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px' }}>{day}</Tag>,
    },
    {
      title: 'Khung Giờ',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      render: (timeSlot) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <Text strong>{timeSlot}</Text>
        </Space>
      ),
    },
    {
      title: 'Lớp Học Online',
      dataIndex: 'className',
      key: 'className',
      render: (text) => <Text strong color="#722ed1">{text}</Text>,
    },
    { title: 'Môn Học', dataIndex: 'subject', key: 'subject' },
    {
      title: 'Giáo Viên Phụ Trách',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Nền Tảng / Phòng Học',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Space>
          <VideoCameraOutlined style={{ color: '#722ed1' }} />
          <Tag color="purple">{platform}</Tag>
        </Space>
      ),
    },
    {
      title: 'Phòng Trực Tuyến',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<LinkOutlined />}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
          onClick={() => window.open(record.meetingLink, '_blank')}
        >
          Vào Lớp Online
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Thời Khóa Biểu Lớp Học Online
          </Title>
          <Text type="secondary">Lịch giảng dạy trực tuyến (Zoom, Google Meet, MS Teams) dành cho Giáo viên & Học viên.</Text>
        </Col>
        {currentUser.role === 'admin' && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Xếp Lịch Online Mới
            </Button>
          </Col>
        )}
      </Row>

      <Card bodyStyle={{ padding: 12 }} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong>Lọc theo Thứ:</Text>
          <Select
            defaultValue="ALL"
            style={{ width: 160 }}
            onChange={(val) => setSelectedDayFilter(val)}
            options={[
              { value: 'ALL', label: 'Tất cả các ngày' },
              { value: 'Thứ 2', label: 'Thứ 2' },
              { value: 'Thứ 3', label: 'Thứ 3' },
              { value: 'Thứ 4', label: 'Thứ 4' },
              { value: 'Thứ 5', label: 'Thứ 5' },
              { value: 'Thứ 6', label: 'Thứ 6' },
              { value: 'Thứ 7', label: 'Thứ 7' },
              { value: 'Chủ Nhật', label: 'Chủ Nhật' },
            ]}
          />
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        scroll={{ x: 850 }}
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title="Thêm Lớp Học Online Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddSlot}>
          <Form.Item name="day" label="Thứ trong tuần" initialValue="Thứ 2" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Thứ 2', label: 'Thứ 2' },
              { value: 'Thứ 3', label: 'Thứ 3' },
              { value: 'Thứ 4', label: 'Thứ 4' },
              { value: 'Thứ 5', label: 'Thứ 5' },
              { value: 'Thứ 6', label: 'Thứ 6' },
              { value: 'Thứ 7', label: 'Thứ 7' },
              { value: 'Chủ Nhật', label: 'Chủ Nhật' },
            ]} />
          </Form.Item>

          <Form.Item name="timeSlot" label="Khung giờ (Ví dụ: 08:00 - 10:00)" initialValue="08:00 - 10:00" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="className" label="Tên Lớp Học" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: 10A1 - Toán Chuyên Online" />
          </Form.Item>

          <Form.Item name="subject" label="Môn Học" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Toán Học" />
          </Form.Item>

          <Form.Item name="teacherName" label="Giáo Viên Phụ Trách" rules={[{ required: true }]}>
            <Select options={MOCK_TEACHERS.map(t => ({ value: t.name, label: `${t.name} (${t.subject})` }))} />
          </Form.Item>

          <Form.Item name="platform" label="Nền tảng Online" initialValue="Zoom Meeting" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Zoom Meeting', label: 'Zoom Meeting' },
              { value: 'Google Meet', label: 'Google Meet' },
              { value: 'MS Teams', label: 'Microsoft Teams' },
              { value: 'ClassIn', label: 'ClassIn' },
            ]} />
          </Form.Item>

          <Form.Item name="meetingLink" label="Đường link phòng học Online (Meeting URL)" initialValue="https://zoom.us/j/123456789">
            <Input placeholder="https://zoom.us/j/..." />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu Thời Khóa Biểu Online</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
