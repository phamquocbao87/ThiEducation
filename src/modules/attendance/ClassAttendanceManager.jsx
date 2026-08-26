import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Row, Col, Modal, Form, Rate, Input, Switch, message, Avatar, Rate as AntRate, Tooltip, Divider } from 'antd';
import { CheckOutlined, UserOutlined, VideoCameraOutlined, PlayCircleOutlined, LinkOutlined, StarOutlined, GlobalOutlined, SoundOutlined, TranslationOutlined, AudioOutlined } from '@ant-design/icons';
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
    { id: 'HV001', name: 'Lê Anh Khoa', present: true, pronunciation: 5, spelling: 5, seriousness: 5, listening: 4, comment: 'Great energy and clear pronunciation!' },
    { id: 'HV002', name: 'Nguyễn Thị Ngọc Ánh', present: true, pronunciation: 4, spelling: 5, seriousness: 5, listening: 5, comment: 'Spelling accuracy was excellent today.' },
    { id: 'HV003', name: 'Trần Minh Quân', present: true, pronunciation: 4, spelling: 4, seriousness: 4, listening: 4, comment: 'Needs to focus more on word endings.' },
    { id: 'HV004', name: 'Phạm Hoàng Yến', present: true, pronunciation: 5, spelling: 4, seriousness: 5, listening: 5, comment: 'Super active during Zoom group activities.' },
    { id: 'HV005', name: 'Đặng Bảo Lâm', present: false, pronunciation: 3, spelling: 3, seriousness: 3, listening: 3, comment: 'Absent - sent recording link.' },
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
      pronunciationScore: values.pronunciationScore || 5,
      spellingScore: values.spellingScore || 5,
      seriousnessScore: values.seriousnessScore || 5,
      listeningScore: values.listeningScore || 5,
      teacherFeedback: values.teacherFeedback || 'Students were highly engaged in today Zoom lesson. Pronunciation and spelling drills completed successfully.',
      recordingUrl: values.recordingUrl || selectedClass.recordingUrl,
    };

    setAttendances([newRecord, ...attendances]);
    setIsAttendanceModalOpen(false);
    form.resetFields();
    message.success(`Saved English session evaluation & Zoom recording link for ${selectedClass.name}!`);
  };

  const attendanceColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (text) => <Text strong>{text}</Text> },
    { title: 'Zoom Online Class', dataIndex: 'className', key: 'className', render: (text) => <Text strong color="#1890ff">{text}</Text> },
    { title: 'Native Teacher', dataIndex: 'teacherName', key: 'teacherName', render: (t) => <Tag color="geekblue"><GlobalOutlined /> {t}</Tag> },
    {
      title: 'Zoom Attendance',
      key: 'attendance',
      render: (_, record) => (
        <Space>
          <Tag color="green">Present: {record.presentCount}</Tag>
          <Tag color={record.absentCount > 0 ? 'volcano' : 'default'}>Absent: {record.absentCount}</Tag>
        </Space>
      ),
    },
    {
      title: 'English Skills Assessment (⭐ Stars)',
      key: 'scores',
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
          <div><Text type="secondary"><SoundOutlined /> Pronunciation:</Text> <AntRate disabled defaultValue={record.pronunciationScore || 5} style={{ fontSize: 12 }} /></div>
          <div><Text type="secondary"><TranslationOutlined /> Spelling & Vocab:</Text> <AntRate disabled defaultValue={record.spellingScore || 5} style={{ fontSize: 12 }} /></div>
          <div><Text type="secondary"><CheckOutlined /> Class Seriousness:</Text> <AntRate disabled defaultValue={record.seriousnessScore || 5} style={{ fontSize: 12 }} /></div>
        </Space>
      ),
    },
    {
      title: 'Native Teacher Feedback (English)',
      dataIndex: 'teacherFeedback',
      key: 'teacherFeedback',
      render: (text) => <Text style={{ fontSize: 13, color: '#333', fontStyle: 'italic' }}>"{text}"</Text>,
    },
    {
      title: 'Zoom Video Recording',
      key: 'recording',
      render: (_, record) => (
        record.recordingUrl ? (
          <Button
            size="small"
            type="primary"
            ghost
            icon={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
            onClick={() => window.open(record.recordingUrl, '_blank')}
          >
            Watch Video
          </Button>
        ) : <Text type="secondary">N/A</Text>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Zoom Online Classes & English Session Evaluation
          </Title>
          <Text type="secondary">Per-student session assessment by 100% Foreign Native Teachers (Pronunciation, Spelling, Class Seriousness & Zoom Video Cloud).</Text>
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 12, marginBottom: 12 }}>
        Active Zoom Online Classes (Native Foreign Teachers 🇺🇸 🇬🇧 🇨🇦 🇦🇺)
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {MOCK_CLASSES.map((cls) => (
          <Col xs={24} sm={12} lg={8} key={cls.id}>
            <Card
              hoverable
              title={<Text strong style={{ color: '#1890ff' }}>{cls.name}</Text>}
              extra={<Tag color="purple"><VideoCameraOutlined /> Zoom Cloud</Tag>}
              actions={[
                <Button type="primary" size="small" icon={<LinkOutlined />} style={{ background: '#2db7f5', borderColor: '#2db7f5' }} onClick={() => window.open(cls.meetingLink, '_blank')}>
                  Join Zoom Room
                </Button>,
                <Button size="small" icon={<StarOutlined style={{ color: '#faad14' }} />} onClick={() => handleOpenModal(cls)}>
                  Evaluate Students
                </Button>
              ]}
            >
              <Paragraph style={{ margin: 0 }}><Text strong>Native Teacher:</Text> {cls.teacherName}</Paragraph>
              <Paragraph style={{ margin: 0 }}><Text strong>Students Enrolled:</Text> {cls.totalStudents} online</Paragraph>
              <Paragraph style={{ margin: 0 }}><Text strong>Zoom Meeting ID:</Text> {cls.meetingId} (Pass: {cls.passcode})</Paragraph>
              <Paragraph style={{ margin: 0 }}><Text strong>Class Time:</Text> {cls.schedule}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={4} style={{ marginBottom: 12 }}>
        Per-Session Native Teacher Assessment Logs (100% English Interface)
      </Title>
      <Table
        columns={attendanceColumns}
        dataSource={attendances}
        rowKey="id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 5 }}
      />

      {/* English Evaluation Modal for Foreign Teachers */}
      <Modal
        title={
          <Space>
            <GlobalOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ color: '#1890ff' }}>Student Evaluation Form (100% English for Foreign Teachers)</Text>
          </Space>
        }
        open={isAttendanceModalOpen}
        onCancel={() => setIsAttendanceModalOpen(false)}
        footer={null}
        width={650}
      >
        <Alert
          message={`Evaluating: ${selectedClass?.name}`}
          description="Please grade students on Pronunciation, Spelling, Class Seriousness/Focus, and Listening. Add comments in English for parents to review."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmitAttendance} initialValues={{ pronunciationScore: 5, spellingScore: 5, seriousnessScore: 5, listeningScore: 5, recordingUrl: selectedClass?.recordingUrl }}>
          
          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 8 }}>
            1. Zoom Room Attendance Check:
          </Text>
          <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16, maxHeight: 180, overflowY: 'auto' }}>
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
                      {st.present ? 'Present in Zoom' : 'Absent'}
                    </Text>
                    <Switch checked={st.present} onChange={() => toggleStudent(st.id)} size="small" />
                  </Space>
                </Col>
              </Row>
            ))}
          </div>

          <Divider style={{ margin: '12px 0' }} />
          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>
            2. Overall English Performance Ratings (⭐ 1 to 5 Stars):
          </Text>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pronunciationScore" label="🗣️ Pronunciation & Accent (Phát âm)" rules={[{ required: true }]}>
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spellingScore" label="🔤 Spelling & Vocabulary (Đánh vần & Từ vựng)" rules={[{ required: true }]}>
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="seriousnessScore" label="🎯 Class Seriousness & Focus (Nghiêm túc & Tập trung)" rules={[{ required: true }]}>
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="listeningScore" label="🎧 Listening & Comprehension (Nghe & Hiểu bài)" rules={[{ required: true }]}>
                <Rate />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="recordingUrl" label="📹 Zoom Recording Video Link (Cloud/Drive Link for Parents)">
            <Input placeholder="https://zoom.us/rec/..." prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />} />
          </Form.Item>

          <Form.Item name="teacherFeedback" label="💬 Teacher's General Feedback & Notes (In English)" rules={[{ required: true, message: 'Please type feedback in English' }]}>
            <Input.TextArea rows={3} placeholder="E.g., Students participated actively during Zoom breakout rooms. Pronunciation accuracy improved significantly during phonics drills." />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                Submit Evaluation & Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
