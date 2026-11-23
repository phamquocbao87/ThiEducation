import React, { useState } from 'react';
import { Button, Input, Tag, Space, Empty, message } from 'antd';
import {
  SendOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  GlobalOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { QUESTION_STATUS, QUESTION_VISIBILITY } from '../models/lessonReader.model';
import { LessonQuestionService } from '../services/LessonQuestionService';

const { TextArea } = Input;

/**
 * LessonQuestionsPanel — Bảng Hỏi Giáo Viên (Ask Teacher Q&A) bên trong Book Reader
 * - Học viên đặt câu hỏi cho đoạn chưa rõ -> gửi thẳng thông báo tới Giáo viên phụ trách.
 * - Mặc định riêng tư 1-1 (`PRIVATE`); nếu GV bật chia sẻ cả lớp (`CLASS_SHARED`) thì hiện thêm badge 🌐.
 * - Học viên nhận câu trả lời trực tiếp trên hệ thống và có thể bấm `👍 Con đã hiểu rồi`.
 */
export const LessonQuestionsPanel = ({
  questions = [],
  onQuestionsChange = null,
  classItem = null,
  lessonPrep = null,
  studentUser = null,
  activeAnchor = null,
  onClearAnchor = null,
  theme = {},
}) => {
  const { isEnglish } = useLanguage();
  const [questionText, setQuestionText] = useState('');
  const [sending, setSending] = useState(false);

  const studentId = studentUser?.id || studentUser?.code;

  const handleSendQuestion = async () => {
    const trimmed = questionText.trim();
    if (!trimmed) {
      message.warning(
        isEnglish ? 'Please enter your question for the teacher.' : 'Vui lòng nhập câu hỏi gửi giáo viên.'
      );
      return;
    }

    setSending(true);
    try {
      const created = await LessonQuestionService.createQuestion({
        classItem,
        lessonPrep,
        studentUser,
        questionText: trimmed,
        anchorIndex: activeAnchor?.index ?? null,
        anchorText: activeAnchor?.text || '',
      });
      onQuestionsChange?.([created, ...questions]);
      setQuestionText('');
      onClearAnchor?.();
      message.success(
        isEnglish
          ? `Your question has been sent to ${classItem?.teacherName || 'Teacher'}!`
          : `Đã gửi câu hỏi tới ${classItem?.teacherName || 'Giáo viên'}! Thầy/Cô sẽ nhận được thông báo ngay.`
      );
    } catch (err) {
      message.error(err?.message || 'Lỗi gửi câu hỏi');
    } finally {
      setSending(false);
    }
  };

  const handleToggleResolved = async (q) => {
    const nextVal = !q.resolvedByStudent;
    // 0ms Optimistic UI
    onQuestionsChange?.(
      questions.map((item) => (item.id === q.id ? { ...item, resolvedByStudent: nextVal } : item))
    );
    await LessonQuestionService.markResolvedByStudent({ question: q, resolved: nextVal });
    if (nextVal) {
      message.success(isEnglish ? 'Marked as understood!' : 'Tuyệt vời! Đã đánh dấu con đã hiểu bài.');
    }
  };

  return (
    <div
      data-testid="lesson-questions-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}
    >
      {/* Ghi chú quyền riêng tư Q&A */}
      <div
        style={{
          fontSize: 11,
          color: theme.textSecondary || '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <LockOutlined />
        <span>
          {isEnglish
            ? `Private 1-on-1 with ${classItem?.teacherName || 'your Teacher'} by default.`
            : `Mặc định riêng tư 1-1 với ${classItem?.teacherName || 'Giáo viên'} (GV có thể chia sẻ câu hay cho lớp).`}
        </span>
      </div>

      {/* Form đặt câu hỏi */}
      <div
        style={{
          padding: 10,
          borderRadius: 10,
          backgroundColor: theme.pageBg || '#f8fafc',
          border: `1px solid ${theme.canvasBorder || '#e2e8f0'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {activeAnchor?.text && (
          <div
            data-testid="qa-anchor-preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              padding: '5px 8px',
              borderRadius: 6,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: 12,
              color: '#1e40af',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ❓ {activeAnchor.text}
            </span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ fontSize: 10 }} />}
              onClick={onClearAnchor}
              style={{ minWidth: 22, height: 22, padding: 0, color: '#1d4ed8' }}
            />
          </div>
        )}

        <TextArea
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={
            isEnglish
              ? 'Ask your teacher about anything unclear in this lesson...'
              : 'Con chưa rõ phần nào trong bài học? Nhập câu hỏi gửi thầy/cô ngay nhé...'
          }
          maxLength={1000}
          data-testid="input-student-question-text"
          style={{ borderRadius: 8, fontSize: 13 }}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          onClick={handleSendQuestion}
          data-testid="btn-submit-student-question"
          style={{
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            borderRadius: 8,
            fontWeight: 700,
            minHeight: 38,
          }}
        >
          {isEnglish
            ? `Send Question to ${classItem?.teacherName || 'Teacher'}`
            : `Gửi Câu Hỏi Cho ${classItem?.teacherName || 'Giáo Viên'}`}
        </Button>
      </div>

      {/* Danh sách câu hỏi & câu trả lời từ Giáo Viên */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        {questions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ fontSize: 12, color: theme.textSecondary || '#64748b' }}>
                {isEnglish
                  ? 'No questions yet. Tap 🙋 next to any unclear part to ask your teacher!'
                  : 'Chưa có câu hỏi nào. Bấm 🙋 cạnh mục chưa rõ để hỏi giáo viên ngay nhé!'}
              </span>
            }
          />
        ) : (
          questions.map((q) => {
            const isAnswered = q.status === QUESTION_STATUS.ANSWERED;
            const isShared = q.visibility === QUESTION_VISIBILITY.CLASS_SHARED;
            const isOwn = q.studentId === studentId;

            return (
              <div
                key={q.id}
                data-testid={`student-qa-card-${q.id}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: theme.canvasBg || '#ffffff',
                  border: `1px solid ${isAnswered ? '#86efac' : theme.canvasBorder || '#e2e8f0'}`,
                  borderLeft: `3px solid ${isAnswered ? '#16a34a' : '#2563eb'}`,
                }}
              >
                {/* Status & Visibility Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  <Space size={4} wrap>
                    {isAnswered ? (
                      <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
                        {isEnglish ? 'Answered' : 'GV đã trả lời'}
                      </Tag>
                    ) : (
                      <Tag color="processing" icon={<ClockCircleOutlined />} style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                        {isEnglish ? 'Waiting for Teacher' : 'Chờ GV giải đáp'}
                      </Tag>
                    )}

                    {isShared ? (
                      <Tag color="cyan" icon={<GlobalOutlined />} style={{ margin: 0, fontSize: 10 }}>
                        {isEnglish ? 'Shared with Class' : 'Chia sẻ cả lớp'}
                      </Tag>
                    ) : (
                      <Tag color="default" icon={<LockOutlined />} style={{ margin: 0, fontSize: 10 }}>
                        {isEnglish ? 'Private 1-on-1' : 'Riêng tư 1-1'}
                      </Tag>
                    )}
                  </Space>
                </div>

                {/* Trích đoạn câu hỏi */}
                {q.anchorText && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#1e40af',
                      backgroundColor: '#eff6ff',
                      padding: '3px 7px',
                      borderRadius: 5,
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    ❓ {q.anchorText}
                  </div>
                )}

                {/* Nội dung câu hỏi */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.textPrimary || '#0f172a',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {q.questionText}
                </div>

                {/* Khung câu trả lời từ Giáo Viên */}
                {isAnswered && q.answerText && (
                  <div
                    data-testid={`student-qa-answer-${q.id}`}
                    style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                      👨‍🏫 {q.answeredByName || q.teacherName || 'Teacher'}:
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#166534',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-line',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {q.answerText}
                    </div>

                    {isOwn && (
                      <div style={{ marginTop: 8 }}>
                        <Button
                          size="small"
                          type={q.resolvedByStudent ? 'primary' : 'default'}
                          icon={<LikeOutlined />}
                          onClick={() => handleToggleResolved(q)}
                          data-testid={`btn-resolve-qa-${q.id}`}
                          style={{
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: q.resolvedByStudent ? '#16a34a' : undefined,
                            borderColor: q.resolvedByStudent ? '#16a34a' : '#86efac',
                            color: q.resolvedByStudent ? '#ffffff' : '#15803d',
                          }}
                        >
                          {q.resolvedByStudent
                            ? isEnglish
                              ? 'Understood!'
                              : 'Con đã hiểu rồi!'
                            : isEnglish
                            ? 'Mark as Understood'
                            : 'Đánh dấu con đã hiểu'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 10, color: theme.textSecondary || '#94a3b8', marginTop: 6 }}>
                  {!isOwn ? (isEnglish ? 'Shared Q&A • ' : 'Câu hỏi chung của lớp • ') : ''}
                  {q.createdAt ? new Date(q.createdAt).toLocaleString('vi-VN') : ''}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LessonQuestionsPanel;
