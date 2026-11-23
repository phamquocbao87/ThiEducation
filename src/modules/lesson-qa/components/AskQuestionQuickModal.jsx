import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Select, Input, Button, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { LessonQuestionService } from '../../lesson-reader';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * AskQuestionQuickModal — Modal cho Học viên đặt câu hỏi mới trực tiếp từ màn hình /lesson-qa
 * Bắt buộc chọn Lớp học -> Chọn Buổi học / Bài học -> (tùy chọn) Chọn mục nội dung bài học chưa rõ.
 */
export const AskQuestionQuickModal = ({
  open = false,
  onClose = null,
  classes = [],
  studentUser = null,
  onCreated = null,
}) => {
  const { isEnglish } = useLanguage();
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(null);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id || classes[0].code);
    }
  }, [open, classes, selectedClassId]);

  const activeClass = useMemo(
    () => classes.find((c) => (c.id || c.code) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const sessionOptions = useMemo(() => {
    if (!activeClass) return [];
    const plans = activeClass.lessonPlans || {};
    const readyList = Object.values(plans)
      .filter((p) => p && p.status !== 'DRAFT' && (p.lessonTitle || p.objectives || p.studentPrep))
      .sort((a, b) => (Number(b.sessionIndex) || 0) - (Number(a.sessionIndex) || 0));

    if (readyList.length === 0) {
      return [{ value: 1, label: isEnglish ? 'Session 1 (General)' : 'Buổi 1 (Chung)', plan: { sessionIndex: 1, lessonTitle: '', objectives: [] } }];
    }

    return readyList.map((p) => {
      const idx = Number(p.sessionIndex) || 1;
      const title = p.lessonTitle ? `: ${p.lessonTitle.slice(0, 65)}${p.lessonTitle.length > 65 ? '...' : ''}` : '';
      return {
        value: idx,
        label: `${isEnglish ? 'Session' : 'Buổi'} ${idx}${title}`,
        plan: p,
      };
    });
  }, [activeClass, isEnglish]);

  useEffect(() => {
    if (sessionOptions.length > 0) {
      setSelectedSessionIndex(sessionOptions[0].value);
      setSelectedAnchor('');
    }
  }, [selectedClassId, sessionOptions.length]);

  const activePlan = useMemo(() => {
    const found = sessionOptions.find((o) => o.value === selectedSessionIndex);
    return found?.plan || { sessionIndex: Number(selectedSessionIndex) || 1, lessonTitle: '', objectives: [] };
  }, [sessionOptions, selectedSessionIndex]);

  const objectiveOptions = useMemo(() => {
    const raw = Array.isArray(activePlan?.objectives) ? activePlan.objectives : [];
    return raw
      .map((item, idx) => {
        const clean = String(item || '').replace(/<[^>]+>/g, '').trim();
        return clean ? { value: clean, label: clean, index: idx } : null;
      })
      .filter(Boolean);
  }, [activePlan]);

  const handleSubmit = async () => {
    const trimmed = questionText.trim();
    if (!activeClass) {
      message.warning(isEnglish ? 'Please select a class.' : 'Vui lòng chọn lớp học.');
      return;
    }
    if (!trimmed) {
      message.warning(isEnglish ? 'Please enter your question.' : 'Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    setSubmitting(true);
    try {
      const matchedObj = objectiveOptions.find((o) => o.value === selectedAnchor);
      const created = await LessonQuestionService.createQuestion({
        classItem: activeClass,
        lessonPrep: activePlan,
        studentUser,
        questionText: trimmed,
        anchorIndex: matchedObj?.index ?? null,
        anchorText: selectedAnchor || '',
      });
      setQuestionText('');
      setSelectedAnchor('');
      message.success(
        isEnglish
          ? `Question sent to ${activeClass.teacherName || 'Teacher'}!`
          : `Đã gửi câu hỏi tới ${activeClass.teacherName || 'Giáo viên'}!`
      );
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      message.error(err?.message || 'Lỗi gửi câu hỏi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={isEnglish ? '🙋 Ask a Question About Your Lesson' : '🙋 Đặt Câu Hỏi Mới Về Bài Học'}
      data-testid="modal-ask-question-quick"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            🏫 {isEnglish ? 'Class:' : 'Thuộc Lớp Học:'}
          </Text>
          <Select
            value={selectedClassId}
            onChange={setSelectedClassId}
            style={{ width: '100%', height: 40 }}
            data-testid="modal-qa-select-class"
            options={classes.map((c) => ({
              value: c.id || c.code,
              label: `[${c.id || c.code}] ${c.name} — 👨‍🏫 ${c.teacherName || 'Teacher'}`,
            }))}
          />
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            📘 {isEnglish ? 'Session & Lesson:' : 'Thuộc Buổi Học & Bài Học:'}
          </Text>
          <Select
            value={selectedSessionIndex}
            onChange={(val) => {
              setSelectedSessionIndex(val);
              setSelectedAnchor('');
            }}
            style={{ width: '100%', height: 40 }}
            data-testid="modal-qa-select-session"
            options={sessionOptions}
          />
        </div>

        {objectiveOptions.length > 0 && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
              📌 {isEnglish ? 'Specific Lesson Part (Optional):' : 'Đoạn / Mục Bài Học Chưa Rõ (Tùy chọn):'}
            </Text>
            <Select
              allowClear
              value={selectedAnchor || undefined}
              onChange={(val) => setSelectedAnchor(val || '')}
              placeholder={isEnglish ? 'Select a section you need help with...' : 'Chọn phần bài học con cần giải thích...'}
              style={{ width: '100%', height: 40 }}
              options={objectiveOptions}
            />
          </div>
        )}

        <div>
          <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            ❓ {isEnglish ? 'Your Question:' : 'Nội Dung Câu Hỏi:'}
          </Text>
          <TextArea
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={
              isEnglish
                ? 'Type what you need help with — your teacher will be notified right away!'
                : 'Nhập câu hỏi con chưa rõ — Giáo viên phụ trách lớp sẽ nhận thông báo ngay!'
            }
            maxLength={1000}
            data-testid="modal-qa-input-question"
          />
        </div>

        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          data-testid="modal-qa-btn-submit"
          style={{
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            fontWeight: 700,
            minHeight: 42,
            borderRadius: 8,
          }}
        >
          {isEnglish ? 'Send Question to Teacher' : 'Gửi Câu Hỏi Tới Giáo Viên'}
        </Button>
      </div>
    </Modal>
  );
};

export default AskQuestionQuickModal;
