import React, { useEffect } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Space, Tag } from 'antd';
import { QUESTION_TYPES } from '../models/exercise.model';
import { useLanguage } from '../../../core/context/LanguageContext';

export const ExerciseReviewModal = ({
  open,
  attempt,
  exercise,
  saving,
  onSave,
  onCancel,
}) => {
  const { isEnglish, t } = useLanguage();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        manualScore: attempt?.manualScore || 0,
        teacherComment: attempt?.teacherComment || '',
      });
    }
  }, [open, attempt, form]);

  if (!attempt || !exercise) return null;

  const manualQuestions =
    exercise.questions?.filter((q) =>
      [QUESTION_TYPES.WRITING, QUESTION_TYPES.SPEAKING].includes(q.type)
    ) || [];

  return (
    <Modal
      open={open}
      width={760}
      destroyOnClose
      title={t('exercises.reviewTitle', {
        studentName: attempt.studentName || attempt.studentId || '',
        defaultValue: isEnglish
          ? `Review: ${attempt.studentName || attempt.studentId}`
          : `Chấm bài: ${attempt.studentName || attempt.studentId}`,
      })}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>{t('exercises.cancel', isEnglish ? 'Cancel' : 'Hủy Bỏ')}</Button>
          <Button
            type="primary"
            loading={saving}
            onClick={() => form.validateFields().then(onSave)}
          >
            {t('exercises.saveReview', isEnglish ? 'Save Review' : 'Lưu Chấm Bài')}
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>
          {t('exercises.autoScore', isEnglish ? 'Auto Score' : 'Điểm Tự Động')}:{' '}
        </span>
        <Tag color="blue" style={{ fontSize: 13, fontWeight: 700 }}>
          {attempt.autoScore || 0}/{attempt.autoTotal || 0}
        </Tag>
      </div>

      {manualQuestions.map((question, index) => (
        <Card
          key={question.id}
          size="small"
          title={`${index + 1}. ${question.prompt} (${question.points} ${isEnglish ? 'pts' : 'điểm'})`}
          style={{ marginBottom: 12, borderRadius: 10 }}
        >
          <p style={{ fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            {question.type === QUESTION_TYPES.SPEAKING
              ? (isEnglish ? 'Speaking recording:' : 'Bản thu âm của học viên:')
              : (isEnglish ? 'Writing answer:' : 'Bài viết của học viên:')}
          </p>

          {question.type === QUESTION_TYPES.SPEAKING && attempt.answers?.[question.id] ? (
            (() => {
              const audioSrc = attempt.answers[question.id];
              const matchD = audioSrc.match(/\/d\/([a-zA-Z0-9_-]+)/) || audioSrc.match(/[?&]id=([a-zA-Z0-9_-]+)/);
              const driveId = matchD ? matchD[1] : null;

              if (driveId || audioSrc.includes('drive.google.com')) {
                return (
                  <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #fed7aa', backgroundColor: '#fffbeb' }}>
                    <div style={{ padding: '6px 12px', backgroundColor: '#fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                        🎧 {isEnglish ? 'Student Voice Recording' : 'Bản thu âm nói của học viên'}
                      </span>
                      <a href={audioSrc} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                        {isEnglish ? 'Open on Drive ↗' : 'Mở trên Google Drive ↗'}
                      </a>
                    </div>
                    {driveId && (
                      <iframe
                        src={`https://drive.google.com/file/d/${driveId}/preview`}
                        title="Student Audio Recording"
                        style={{ width: '100%', height: 110, border: 'none', display: 'block', backgroundColor: '#ffffff' }}
                        allow="autoplay"
                      />
                    )}
                  </div>
                );
              }

              return <audio controls src={audioSrc} style={{ width: '100%', marginBottom: 8 }} />;
            })()
          ) : (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                backgroundColor: '#f8fafc',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 8,
              }}
            >
              {attempt.answers?.[question.id] || '—'}
            </div>
          )}

          {question.rubric && (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <span style={{ fontWeight: 600 }}>{t('exercises.teacherRubric', isEnglish ? 'Rubric:' : 'Tiêu chí chấm:')}</span>{' '}
              {question.rubric}
            </div>
          )}
        </Card>
      ))}

      <Form form={form} layout="vertical">
        <Form.Item
          name="manualScore"
          label={t('exercises.manualScore', isEnglish ? 'Teacher Manual Score' : 'Điểm Giáo Viên Chấm')}
          rules={[{ required: true, message: isEnglish ? 'Please enter score' : 'Vui lòng nhập điểm' }]}
        >
          <InputNumber min={0} style={{ width: '100%', height: 40 }} />
        </Form.Item>

        <Form.Item
          name="teacherComment"
          label={t('exercises.feedback', isEnglish ? 'Teacher Feedback' : 'Lời Phê / Nhận Xét')}
        >
          <Input.TextArea
            placeholder={t('exercises.feedbackPlaceholder', isEnglish ? 'Enter feedback for learner...' : 'Nhập lời phê nhận xét cho học viên...')}
            autoSize={{ minRows: 3, maxRows: 7 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default ExerciseReviewModal;
