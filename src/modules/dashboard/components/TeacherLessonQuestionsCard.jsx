import React, { useState } from 'react';
import { Card, Tag, Button, Input, Switch, Space, Typography, Badge, message } from 'antd';
import {
  QuestionCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import {
  LessonQuestionService,
  QUESTION_STATUS,
  QUESTION_VISIBILITY,
} from '../../lesson-reader';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * TeacherLessonQuestionsCard — Hộp Thư Câu Hỏi Học Viên Trước Giờ Học (Q&A Inbox)
 * Dành cho Giáo viên Bản Xứ trên TeacherWorkspacePanel (/dashboard):
 * - 100% in-app Q&A (tuyệt đối KHÔNG hiển thị Zalo hay SĐT phụ huynh — Native Teacher Zalo Isolation Guard).
 * - Cho phép trả lời trực tiếp 0ms + bật/tắt chia sẻ câu hỏi hay cho cả lớp (`CLASS_SHARED`).
 */
export const TeacherLessonQuestionsCard = ({
  questions = [],
  onQuestionsChange = null,
  teacherUser = null,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  const [replyDrafts, setReplyDrafts] = useState({});
  const [shareDrafts, setShareDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'open' | 'answered'

  if (!questions || questions.length === 0) {
    return null;
  }

  const openCount = questions.filter((q) => q.status === QUESTION_STATUS.OPEN).length;
  const filteredList = questions.filter((q) => {
    if (filterMode === 'open') return q.status === QUESTION_STATUS.OPEN;
    if (filterMode === 'answered') return q.status === QUESTION_STATUS.ANSWERED;
    return true;
  });

  const handleSubmitAnswer = async (q) => {
    const draft = String(replyDrafts[q.id] || '').trim();
    if (!draft) {
      message.warning(isEnglish ? 'Please enter your answer before sending.' : 'Vui lòng nhập nội dung trả lời.');
      return;
    }

    const shareWithClass = Boolean(shareDrafts[q.id]);
    setSubmittingId(q.id);
    try {
      const updated = await LessonQuestionService.answerQuestion({
        question: q,
        answerText: draft,
        teacherUser,
        shareWithClass,
      });

      onQuestionsChange?.(questions.map((item) => (item.id === q.id ? updated : item)));
      setReplyDrafts((prev) => ({ ...prev, [q.id]: '' }));
      message.success(
        isEnglish
          ? `Answer sent to ${q.studentName}!`
          : `Đã gửi câu trả lời tới học viên ${q.studentName}!`
      );
    } catch (err) {
      message.error(err?.message || 'Error sending answer');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleToggleShare = async (q, checked) => {
    const nextVis = checked ? QUESTION_VISIBILITY.CLASS_SHARED : QUESTION_VISIBILITY.PRIVATE;
    // 0ms Optimistic UI
    onQuestionsChange?.(
      questions.map((item) => (item.id === q.id ? { ...item, visibility: nextVis } : item))
    );
    await LessonQuestionService.toggleVisibility({ question: q, shareWithClass: checked });
    message.success(
      checked
        ? isEnglish
          ? 'Shared this Q&A with the entire class!'
          : 'Đã chia sẻ câu hỏi & lời giải đáp cho cả lớp cùng học!'
        : isEnglish
        ? 'Changed back to Private 1-on-1.'
        : 'Đã chuyển về chế độ Riêng tư 1-1.'
    );
  };

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: isMobile ? 12 : 20,
        borderRadius: 12,
        borderLeft: `4px solid ${openCount > 0 ? '#2563eb' : '#16a34a'}`,
        backgroundColor: openCount > 0 ? '#eff6ff' : '#f0fdf4',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
      data-testid="teacher-lesson-questions-card"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Space size={8}>
          <Badge count={openCount} overflowCount={99} color="#2563eb">
            <QuestionCircleOutlined style={{ color: '#1d4ed8', fontSize: 18 }} />
          </Badge>
          <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#1e3a8a' }}>
            {isEnglish
              ? `Student Pre-Class Questions (${openCount} pending / ${questions.length} total)`
              : `Câu Hỏi Học Viên Trước Giờ Học (${openCount} chờ trả lời / ${questions.length} tổng)`}
          </Text>
        </Space>

        <Space size={6} wrap>
          <Button
            size="small"
            type={filterMode === 'all' ? 'primary' : 'default'}
            onClick={() => setFilterMode('all')}
          >
            {isEnglish ? `All (${questions.length})` : `Tất cả (${questions.length})`}
          </Button>
          <Button
            size="small"
            type={filterMode === 'open' ? 'primary' : 'default'}
            onClick={() => setFilterMode('open')}
          >
            {isEnglish ? `Pending (${openCount})` : `Chờ trả lời (${openCount})`}
          </Button>
          <Button
            size="small"
            type={filterMode === 'answered' ? 'primary' : 'default'}
            onClick={() => setFilterMode('answered')}
          >
            {isEnglish ? `Answered (${questions.length - openCount})` : `Đã trả lời (${questions.length - openCount})`}
          </Button>
        </Space>
      </div>

      {/* Danh sách câu hỏi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredList.map((q) => {
          const isAnswered = q.status === QUESTION_STATUS.ANSWERED;
          const isShared = q.visibility === QUESTION_VISIBILITY.CLASS_SHARED;

          return (
            <div
              key={q.id}
              data-testid={`teacher-qa-item-${q.id}`}
              style={{
                padding: isMobile ? '10px 12px' : '12px 14px',
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: `1px solid ${isAnswered ? '#bbf7d0' : '#bfdbfe'}`,
              }}
            >
              {/* Meta dòng 1 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Space size={6} wrap>
                  <Tag color="purple" style={{ margin: 0, fontWeight: 700 }}>
                    {q.classId} • {q.className}
                  </Tag>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {isEnglish ? `Session ${q.sessionIndex}` : `Buổi ${q.sessionIndex}`}
                  </Tag>
                  <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                    👤 {q.studentName}
                    {q.studentEnglishName ? ` (${q.studentEnglishName})` : ''}
                  </Text>
                </Space>

                <Space size={6}>
                  {isAnswered ? (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontWeight: 700 }}>
                      {isEnglish ? 'Answered' : 'Đã trả lời'}
                    </Tag>
                  ) : (
                    <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0, fontWeight: 700 }}>
                      {isEnglish ? 'Needs Answer' : 'Chờ giải đáp'}
                    </Tag>
                  )}
                </Space>
              </div>

              {/* Trích đoạn câu hỏi */}
              {q.anchorText && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#1e40af',
                    backgroundColor: '#eff6ff',
                    padding: '4px 8px',
                    borderRadius: 6,
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  📌 {q.anchorText}
                </div>
              )}

              {/* Nội dung câu hỏi */}
              <div
                style={{
                  fontSize: 13,
                  color: '#1e293b',
                  lineHeight: 1.55,
                  padding: '8px 10px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  borderLeft: '3px solid #2563eb',
                  marginBottom: 10,
                  whiteSpace: 'pre-line',
                }}
              >
                {q.questionText}
              </div>

              {/* Nếu đã trả lời -> hiện câu trả lời + Switch chia sẻ cả lớp */}
              {isAnswered ? (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                    ✅ {isEnglish ? 'Your Answer:' : 'Câu trả lời của Giáo viên:'}
                  </div>
                  <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {q.answerText}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <Space size={6}>
                      <Switch
                        size="small"
                        checked={isShared}
                        onChange={(checked) => handleToggleShare(q, checked)}
                        data-testid={`switch-share-qa-${q.id}`}
                      />
                      <Text style={{ fontSize: 12, color: isShared ? '#0369a1' : '#475569', fontWeight: 600 }}>
                        {isShared ? (
                          <>
                            <GlobalOutlined /> {isEnglish ? 'Shared with whole class' : 'Đang chia sẻ cho cả lớp cùng học'}
                          </>
                        ) : (
                          <>
                            <LockOutlined /> {isEnglish ? 'Private 1-on-1 (Toggle to share with class)' : 'Riêng tư 1-1 (Bật để chia sẻ cho cả lớp)'}
                          </>
                        )}
                      </Text>
                    </Space>
                    {q.resolvedByStudent && (
                      <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                        👍 {isEnglish ? 'Student understood' : 'Học viên đã hiểu'}
                      </Tag>
                    )}
                  </div>
                </div>
              ) : (
                /* Form trả lời cho câu hỏi OPEN */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <TextArea
                    rows={2}
                    value={replyDrafts[q.id] || ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={
                      isEnglish
                        ? 'Write a clear explanation for your student...'
                        : 'Nhập lời giải đáp cho học viên...'
                    }
                    data-testid={`input-teacher-answer-${q.id}`}
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: isMobile ? 'stretch' : 'center',
                      justifyContent: 'space-between',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: 8,
                    }}
                  >
                    <Space size={6}>
                      <Switch
                        size="small"
                        checked={Boolean(shareDrafts[q.id])}
                        onChange={(checked) => setShareDrafts((prev) => ({ ...prev, [q.id]: checked }))}
                        data-testid={`switch-share-draft-${q.id}`}
                      />
                      <Text style={{ fontSize: 12, color: '#475569' }}>
                        {isEnglish
                          ? 'Also share this Q&A with all students in class'
                          : 'Chia sẻ câu hỏi & giải đáp này cho cả lớp cùng học'}
                      </Text>
                    </Space>

                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={submittingId === q.id}
                      onClick={() => handleSubmitAnswer(q)}
                      data-testid={`btn-send-teacher-answer-${q.id}`}
                      style={{
                        backgroundColor: '#2563eb',
                        borderColor: '#2563eb',
                        borderRadius: 8,
                        fontWeight: 700,
                        minHeight: 38,
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {isEnglish ? 'Send Answer' : 'Gửi Câu Trả Lời'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TeacherLessonQuestionsCard;
