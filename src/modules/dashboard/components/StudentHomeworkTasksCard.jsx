import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Tabs,
  Modal,
  Form,
  Input,
  message,
  Empty,
  Badge,
} from 'antd';
import {
  FormOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  RightOutlined,
  FileDoneOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const StudentHomeworkTasksCard = ({ homeworks = [], onHomeworkSubmitted }) => {
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const [activeTabKey, setActiveTabKey] = useState('todo');
  const [submittingHw, setSubmittingHw] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const todoList = (homeworks || []).filter((h) => h.status !== 'graded' && h.status !== 'completed');
  const completedList = (homeworks || []).filter((h) => h.status === 'graded' || h.status === 'completed' || h.status === 'submitted');

  const handleOpenSubmit = (hw) => {
    setSubmittingHw(hw);
    form.resetFields();
  };

  const handleFinishSubmit = async (values) => {
    try {
      setSubmitting(true);
      // Giả lập nộp bài tập hoặc gọi service
      await new Promise((r) => setTimeout(r, 600));
      message.success(
        isEnglish
          ? `Successfully submitted assignment: "${submittingHw.title}"!`
          : `Đã nộp thành công bài tập: "${submittingHw.title}"!`
      );
      if (onHomeworkSubmitted) {
        onHomeworkSubmitted(submittingHw.id, values);
      }
      setSubmittingHw(null);
    } catch (err) {
      message.error(err.message || 'Lỗi nộp bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: 20,
          backgroundColor: '#ffffff',
        }}
        styles={{ body: { padding: '18px 20px' } }}
        data-testid="student-homework-tasks-card"
      >
        {/* Header Khối Bài Tập */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Space size={8}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              <FormOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>
                {isEnglish ? 'Assigned Homework & To-Do Tasks' : 'Bài Tập Được Giao & Cần Làm'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isEnglish
                  ? 'Tap any assignment to start practicing and submit to foreign teacher'
                  : 'Chạm vào bài tập để thực hành trực tiếp và nộp bài cho Giáo viên bản xứ'}
              </Text>
            </div>
          </Space>

          <Button
            type="link"
            size="small"
            onClick={() => navigate('/english-exercises')}
            style={{ fontSize: 13, fontWeight: 600, padding: 0 }}
          >
            {isEnglish ? 'All Exercises' : 'Xem Tất Cả'} <RightOutlined style={{ fontSize: 11 }} />
          </Button>
        </div>

        {/* Tab Phân Loại: Cần Làm vs Đã Nộp */}
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          size="small"
          items={[
            {
              key: 'todo',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {isEnglish ? 'To-Do Tasks' : 'Bài Tập Cần Làm'} ({todoList.length})
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                  {todoList.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={isEnglish ? 'Great job! You have completed all homework.' : 'Tuyệt vời! Em đã hoàn thành toàn bộ bài tập được giao.'}
                      style={{ padding: '16px 0' }}
                    />
                  ) : (
                    todoList.map((hw) => (
                      <div
                        key={hw.id}
                        data-testid={`homework-todo-${hw.id}`}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: hw.isExercise ? '1px solid #ddd6fe' : '1px solid #fed7aa',
                          backgroundColor: hw.isExercise ? '#faf5ff' : '#fffaf5',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                              <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                                {hw.title}
                              </Text>
                              {hw.isExercise ? (
                                <Tag color="purple" style={{ fontSize: 11, borderRadius: 4, margin: 0, fontWeight: 600 }}>
                                  💻 {isEnglish ? 'Online ELA Challenge' : 'Bài Tập ELA Trực Tuyến'}
                                </Tag>
                              ) : (
                                <Tag color={hw.priority === 'urgent' ? 'volcano' : 'orange'} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                                  {hw.skill || 'English ELA'}
                                </Tag>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              <span>🏫 {hw.className}</span>
                              {hw.estimatedMinutes && (
                                <span style={{ marginLeft: 8 }}>
                                  ⏱️ {hw.estimatedMinutes} {isEnglish ? 'mins' : 'phút'}
                                </span>
                              )}
                              {hw.attemptsAllowed && (
                                <span style={{ marginLeft: 8 }}>
                                  🔄 {isEnglish ? 'Max attempts:' : 'Số lần:'}{' '}
                                  {hw.attemptsAllowed === 999
                                    ? isEnglish ? 'Unlimited' : 'Không giới hạn'
                                    : hw.attemptsAllowed}
                                </span>
                              )}
                            </div>
                          </div>

                          {hw.isExercise ? (
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlayCircleOutlined />}
                              style={{
                                borderRadius: 6,
                                backgroundColor: '#7c3aed',
                                borderColor: '#7c3aed',
                                fontWeight: 600,
                                fontSize: 12,
                                flexShrink: 0,
                              }}
                              onClick={() => navigate(`/english-exercises?playAssignmentId=${hw.id}`)}
                              data-testid={`btn-do-homework-${hw.id}`}
                            >
                              {isEnglish ? 'Start Exercise' : 'Làm Bài Trực Tuyến'}
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              icon={<UploadOutlined />}
                              style={{
                                borderRadius: 6,
                                backgroundColor: '#ea580c',
                                borderColor: '#ea580c',
                                fontWeight: 600,
                                fontSize: 12,
                                flexShrink: 0,
                              }}
                              onClick={() => handleOpenSubmit(hw)}
                              data-testid={`btn-do-homework-${hw.id}`}
                            >
                              {isEnglish ? 'Do Homework' : 'Làm Bài Ngay'}
                            </Button>
                          )}
                        </div>

                        {hw.instructions && (
                          <Paragraph
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: hw.isExercise ? '#581c87' : '#78350f',
                              lineHeight: 1.4,
                            }}
                            ellipsis={{ rows: 2 }}
                          >
                            {hw.instructions}
                          </Paragraph>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: hw.isExercise ? '#7c3aed' : '#ea580c',
                            fontWeight: 600,
                          }}
                        >
                          <ClockCircleOutlined />
                          <span>{isEnglish ? (hw.dueDateEn || hw.dueDate) : hw.dueDate}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: 'completed',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {isEnglish ? 'Completed & Graded' : 'Đã Hoàn Thành'} ({completedList.length})
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                  {completedList.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={isEnglish ? 'No completed assignments yet' : 'Chưa có bài tập nào hoàn thành'}
                      style={{ padding: '16px 0' }}
                    />
                  ) : (
                    completedList.map((hw) => (
                      <div
                        key={hw.id}
                        data-testid={`homework-completed-${hw.id}`}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                              <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                                {hw.title}
                              </Text>
                              {hw.isExercise && (
                                <Tag color="purple" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                                  💻 {isEnglish ? 'ELA Online' : 'ELA Trực Tuyến'}
                                </Tag>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              <span>🏫 {hw.className}</span>
                            </div>
                          </div>

                          <Space size={6}>
                            <Tag color="green" icon={<CheckCircleOutlined />} style={{ borderRadius: 4, margin: 0, fontWeight: 600 }}>
                              {hw.score || (isEnglish ? 'Completed' : 'Đã Hoàn Thành')}
                            </Tag>
                            {hw.isExercise && (
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                style={{ borderRadius: 6, fontSize: 11 }}
                                onClick={() => navigate('/english-exercises')}
                              >
                                {isEnglish ? 'Review' : 'Xem Lại'}
                              </Button>
                            )}
                          </Space>
                        </div>

                        {hw.teacherComment && (
                          <div style={{ backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0', fontSize: 12 }}>
                            <Text strong style={{ color: '#15803d' }}>
                              💬 {isEnglish ? 'Teacher Feedback:' : 'Lời nhận xét của Giáo viên:'}
                            </Text>{' '}
                            <span style={{ color: '#166534' }}>{hw.teacherComment}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Nộp Bài Tập Tiện Lợi */}
      {submittingHw && (
        <Modal
          open={Boolean(submittingHw)}
          title={
            <Space data-testid="student-submit-homework-modal-title">
              <FormOutlined style={{ color: '#ea580c' }} />
              <span>{isEnglish ? 'Submit Homework Assignment' : 'Thực Hành & Nộp Bài Tập'}</span>
            </Space>
          }
          onCancel={() => setSubmittingHw(null)}
          footer={null}
          destroyOnClose
          width={560}
        >
          <div style={{ marginBottom: 14, padding: '10px 12px', backgroundColor: '#fff7ed', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#9a3412', fontSize: 14 }}>{submittingHw.title}</div>
            <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>{submittingHw.instructions}</div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleFinishSubmit}>
            <Form.Item
              name="content"
              label={isEnglish ? 'Your Answer / Essay / Submission Notes' : 'Nội Dung Bài Làm / Câu Trả Lời'}
              rules={[{ required: true, message: isEnglish ? 'Please enter your answer' : 'Vui lòng nhập nội dung bài làm' }]}
            >
              <TextArea
                rows={4}
                placeholder={
                  isEnglish
                    ? 'Write your complete sentences, answers, or paste audio recording link...'
                    : 'Nhập câu trả lời, đoạn văn hoàn chỉnh hoặc liên kết file thu âm...'
                }
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="attachmentUrl"
              label={isEnglish ? 'Attach File Link (Google Drive / Audio / Doc)' : 'Đính Kèm Link File (Google Drive / Audio / Hình ảnh)'}
            >
              <Input
                placeholder="https://drive.google.com/file/..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onClick={() => setSubmittingHw(null)} style={{ borderRadius: 6 }}>
                {isEnglish ? 'Cancel' : 'Hủy'}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<UploadOutlined />}
                style={{ borderRadius: 6, backgroundColor: '#ea580c', borderColor: '#ea580c' }}
              >
                {isEnglish ? 'Submit to Teacher' : 'Nộp Cho Giáo Viên'}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default StudentHomeworkTasksCard;
