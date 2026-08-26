import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Row, Col, Modal, Form, Rate, Input, Switch, message, Avatar, Rate as AntRate } from 'antd';
import { CheckOutlined, UserOutlined } from '@ant-design/icons';
import { MOCK_CLASSES, MOCK_ATTENDANCES } from '../../shared/data/mockData';
import { useAuth } from '../../core/context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export const ClassAttendanceManager = () => {
  const { currentUser } = useAuth();
  const [attendances, setAttendances] = useState(MOCK_ATTENDANCES);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
  const [form] = Form.useForm();

  const [studentAttendanceList, setStudentAttendanceList] = useState([
    { id: 'HV001', name: 'Lê Anh Khoa', present: true },
    { id: 'HV002', name: 'Nguyễn Thị Ngọc Ánh', present: true },
    { id: 'HV003', name: 'Trần Minh Quân', present: true },
    { id: 'HV004', name: 'Phạm Hoàng Yến', present: true },
    { id: 'HV005', name: 'Đặng Bảo Lâm', present: false },
  ]);

  const toggleStudent = (id) => {
    setStudentAttendanceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const handleOpenModal = (cls) => {
    setSelectedClass(cls);
    setIsAttendanceModalOpen(true);
  };

  const handleSubmitAttendance = (values) => {
    const presentCount = studentAttendanceList.filter((s) => s.present).length;
    const absentCount = studentAttendanceList.length - presentCount;

    const newRecord = {
      id: `AT-00${attendances.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      classId: selectedClass.id,
      className: selectedClass.name,
      teacherName: currentUser.name,
      totalStudents: selectedClass.totalStudents,
      presentCount: presentCount + (selectedClass.totalStudents - studentAttendanceList.length),
      absentCount: absentCount,
      qualityRating: values.qualityRating || 5,
      teacherFeedback: values.teacherFeedback || 'Tiết học đạt chất lượng tốt, học viên đi học đúng giờ.',
    };

    setAttendances([newRecord, ...attendances]);
    setIsAttendanceModalOpen(false);
    form.resetFields();
    message.success(`Đã lưu điểm danh & đánh giá chất lượng tiết học ${selectedClass.name}!`);
  };

  const attendanceColumns = [
    { title: 'Ngày Buổi Học', dataIndex: 'date', key: 'date', render: (text) => <Text strong>{text}</Text> },
    { title: 'Lớp Học', dataIndex: 'className', key: 'className', render: (text) => <Text strong color="#1890ff">{text}</Text> },
    { title: 'Giáo Viên Dạy', dataIndex: 'teacherName', key: 'teacherName' },
    {
      title: 'Điểm Danh',
      key: 'attendance',
      render: (_, record) => (
        <Space>
          <Tag color="green">Có mặt: {record.presentCount}</Tag>
          <Tag color={record.absentCount > 0 ? 'volcano' : 'default'}>Vắng: {record.absentCount}</Tag>
        </Space>
      ),
    },
    {
      title: 'Đánh Giá Chất Lượng',
      dataIndex: 'qualityRating',
      key: 'qualityRating',
      render: (rating) => <AntRate disabled defaultValue={rating} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Nhận Xét Của Giáo Viên',
      dataIndex: 'teacherFeedback',
      key: 'teacherFeedback',
      render: (text) => <Text style={{ fontSize: 13, color: '#595959' }}>{text}</Text>,
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Lớp Học, Điểm Danh & Chất Lượng Dạy Học
          </Title>
          <Text type="secondary">Điểm danh học viên nhanh chóng và nhập nhận xét đánh giá tiết dạy của Giáo viên.</Text>
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 12, marginBottom: 12 }}>
        Danh Sách Lớp Học Đang Hoạt Động (28 Lớp)
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {MOCK_CLASSES.map((cls) => (
          <Col xs={24} sm={12} lg={8} key={cls.id}>
            <Card
              hoverable
              title={<Text strong style={{ color: '#1890ff' }}>{cls.name}</Text>}
              extra={<Tag color="purple">{cls.room}</Tag>}
              actions={[
                <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleOpenModal(cls)}>
                  Điểm Danh Buổi Học
                </Button>
              ]}
            >
              <Paragraph style={{ margin: 0 }}><Text strong>Giáo viên:</Text> {cls.teacherName}</Paragraph>
              <Paragraph style={{ margin: 0 }}><Text strong>Sĩ số:</Text> {cls.totalStudents} học viên</Paragraph>
              <Paragraph style={{ margin: 0 }}><Text strong>Lịch học:</Text> {cls.schedule}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={4} style={{ marginBottom: 12 }}>
        Nhật Ký Điểm Danh & Đánh Giá Chất Lượng Tiết Học
      </Title>
      <Table
        columns={attendanceColumns}
        dataSource={attendances}
        rowKey="id"
        scroll={{ x: 800 }}
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={`Điểm Danh & Nhận Xét Tiết Học - ${selectedClass?.name}`}
        open={isAttendanceModalOpen}
        onCancel={() => setIsAttendanceModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitAttendance} initialValues={{ qualityRating: 5 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Danh sách điểm danh nhanh 1-Touch:
          </Text>
          <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
            {studentAttendanceList.map((st) => (
              <Row key={st.id} justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px dashed #f0f0f0' }}>
                <Col>
                  <Space>
                    <Avatar icon={<UserOutlined />} size="small" />
                    <Text strong>{st.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>({st.id})</Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Text style={{ fontSize: 12, color: st.present ? '#52c41a' : '#ff4d4f' }}>
                      {st.present ? 'Có mặt' : 'Vắng mặt'}
                    </Text>
                    <Switch checked={st.present} onChange={() => toggleStudent(st.id)} size="small" />
                  </Space>
                </Col>
              </Row>
            ))}
          </div>

          <Form.Item name="qualityRating" label="Đánh giá chất lượng tiết học (Sao)" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>

          <Form.Item name="teacherFeedback" label="Nhận xét của Giáo viên về buổi học / học viên" rules={[{ required: true, message: 'Vui lòng nhập nhận xét' }]}>
            <Input.TextArea rows={3} placeholder="Nhập nhận xét chi tiết (ví dụ: Lớp học sôi nổi, các em nắm bài tốt...)" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsAttendanceModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                Lưu Điểm Danh & Nhận Xét
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
