import React from 'react';
import {
  Modal,
  Alert,
  Form,
  Row,
  Col,
  Avatar,
  Switch,
  Divider,
  Rate,
  Input,
  Space,
  Button,
  Typography,
} from 'antd';
import { GlobalOutlined, UserOutlined, PlayCircleOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const SessionEvaluationModal = ({
  open,
  selectedClass,
  studentRoster,
  onToggleStudentPresence,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <Space>
          <GlobalOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ color: '#1890ff' }}>
            Điểm Danh & Đánh Giá Buổi Học (Session Attendance & Evaluation)
          </Text>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={650}
    >
      <Alert
        message={`Lớp đang điểm danh: ${selectedClass?.name || ''}`}
        description="Kiểm tra sĩ số học viên trong phòng Zoom, chấm điểm 4 kỹ năng tiếng Anh và nhập nhận xét buổi học."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          pronunciationScore: 5,
          spellingScore: 5,
          seriousnessScore: 5,
          listeningScore: 5,
          recordingUrl: selectedClass?.recordingUrl,
        }}
      >
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          1. Điểm danh từng học viên trong lớp:
        </Text>
        <div
          style={{
            background: '#fafafa',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {studentRoster.map((st) => (
            <Row
              key={st.id}
              justify="space-between"
              align="middle"
              style={{ padding: '6px 0', borderBottom: '1px dashed #f0f0f0' }}
            >
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
                    {st.present ? 'Có mặt (Present)' : 'Vắng (Absent)'}
                  </Text>
                  <Switch
                    checked={st.present}
                    onChange={() => onToggleStudentPresence(st.id)}
                    size="small"
                  />
                </Space>
              </Col>
            </Row>
          ))}
        </div>

        <Divider style={{ margin: '12px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          2. Đánh giá 4 kỹ năng tiếng Anh (⭐ 1 - 5 Sao):
        </Text>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="pronunciationScore" label="🗣️ Pronunciation (Phát âm)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="spellingScore" label="🔤 Spelling & Vocab (Đánh vần)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="seriousnessScore" label="🎯 Seriousness (Nghiêm túc)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="listeningScore" label="🎧 Listening (Nghe hiểu)" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="recordingUrl" label="📹 Link Video Ghi Hình Lớp Zoom (Cloud/Drive)">
          <Input prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />} />
        </Form.Item>

        <Form.Item
          name="teacherFeedback"
          label="💬 Nhận xét chi tiết của Giáo viên (English Feedback)"
          rules={[{ required: true, message: 'Vui lòng nhập nhận xét buổi học' }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập nhận xét chi tiết cho buổi học hôm nay..." />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
              Lưu Điểm Danh & Đánh Giá
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

