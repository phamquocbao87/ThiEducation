import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Select, Row, Col, Modal, Form, Input, TimePicker, message } from 'antd';
import { CalendarOutlined, PlusOutlined, ClockCircleOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import { MOCK_TIMETABLE, MOCK_TEACHERS, MOCK_CLASSES } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

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
      room: values.room,
      status: 'Lên kế hoạch',
    };
    setTimetable([...timetable, newSlot]);
    setIsModalOpen(false);
    form.resetFields();
    message.success('Đêm lịch dạy mới vào Thời khóa biểu thành công!');
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
      title: 'Lớp Học',
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
      title: 'Phòng Học',
      dataIndex: 'room',
      key: 'room',
      render: (room) => (
        <Space>
          <HomeOutlined style={{ color: '#fa8c16' }} />
          <Tag color="volcano">{room}</Tag>
        </Space>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Đã hoàn thành' ? 'green' : status === 'Sắp diễn ra' ? 'gold' : 'blue'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Thời Khóa Biểu Giảng Dạy
          </Title>
          <Text type="secondary">Lịch học và xếp phòng học trực quan dành cho Giáo viên và Học viên.</Text>
        </Col>
        {currentUser.role === 'admin' && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Xếp Lịch Mới
            </Button>
          </Col>
        )}
      </Row>

      {/* Filter Bar */}
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
        scroll={{ x: 800 }}
        pagination={{ pageSize: 6 }}
      />

      {/* Modal Add Timetable Slot */}
      <Modal
        title="Thêm Khung Giờ Học Mới"
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
            <Input placeholder="Ví dụ: 10A1 - Toán Chuyên" />
          </Form.Item>

          <Form.Item name="subject" label="Môn Học" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Toán Học" />
          </Form.Item>

          <Form.Item name="teacherName" label="Giáo Viên Phụ Trách" rules={[{ required: true }]}>
            <Select options={MOCK_TEACHERS.map(t => ({ value: t.name, label: `${t.name} (${t.subject})` }))} />
          </Form.Item>

          <Form.Item name="room" label="Phòng Học" initialValue="P.301" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: P.301 hoặc Lab 01" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu Thời Khóa Biểu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
