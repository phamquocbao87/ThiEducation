import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createQuestion, EXERCISE_STATUS, QUESTION_TYPES } from '../models/exercise.model';
import { QuestionEditor } from './QuestionEditor';
import { useLanguage } from '../../../core/context/LanguageContext';

export const ExerciseBuilderModal = ({ open, initialItem, saving, onSave, onCancel }) => {
  const { isEnglish, t } = useLanguage();
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([]);
  const [draftId, setDraftId] = useState('');

  useEffect(() => {
    if (open) {
      const id = initialItem?.id || `ex_${Date.now()}`;
      setDraftId(id);
      form.setFieldsValue(
        initialItem || {
          id,
          title: '',
          status: EXERCISE_STATUS.DRAFT,
          attemptsAllowed: 1,
        }
      );
      setQuestions(initialItem?.questions || [createQuestion(QUESTION_TYPES.MULTIPLE_CHOICE)]);
    }
  }, [open, initialItem, form]);

  const save = async () => {
    const values = await form.validateFields();
    onSave({ ...initialItem, ...values, id: initialItem?.id || draftId, questions });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={920}
      title={
        initialItem?.id
          ? t('exercises.editExercise', isEnglish ? 'Edit Exercise' : 'Chỉnh Sửa Bài Tập')
          : t('exercises.createExercise', isEnglish ? 'Create Exercise' : 'Tạo Bài Tập')
      }
      footer={
        <Space>
          <Button onClick={onCancel}>{t('exercises.cancel', isEnglish ? 'Cancel' : 'Hủy Bỏ')}</Button>
          <Button type="primary" loading={saving} onClick={save}>
            {t('exercises.saveExercise', isEnglish ? 'Save Exercise' : 'Lưu Bài Tập')}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label={t('exercises.exerciseTitle', isEnglish ? 'Exercise Title' : 'Tên Bài Tập')}
          rules={[{ required: true, message: isEnglish ? 'Please enter exercise title' : 'Vui lòng nhập tên bài tập' }]}
        >
          <Input
            placeholder={t('exercises.exerciseTitlePlaceholder', isEnglish ? 'Enter exercise title...' : 'Nhập tên bài tập...')}
            style={{ height: 40 }}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Form.Item
            name="status"
            label={t('exercises.status', isEnglish ? 'Status' : 'Trạng Thái')}
          >
            <Select
              options={[
                { value: 'DRAFT', label: t('exercises.statusDraft', isEnglish ? 'Draft' : 'Bản Nháp') },
                { value: 'PUBLISHED', label: t('exercises.statusPublished', isEnglish ? 'Published' : 'Đã Xuất Bản') },
              ]}
              style={{ height: 40 }}
            />
          </Form.Item>

          <Form.Item
            name="dueAt"
            label={t('exercises.dueAt', isEnglish ? 'Due Date & Time' : 'Hạn Nộp')}
          >
            <Input type="datetime-local" style={{ height: 40 }} />
          </Form.Item>

          <Form.Item
            name="attemptsAllowed"
            label={t('exercises.attemptsAllowed', isEnglish ? 'Allowed Attempts' : 'Số Lần Làm')}
          >
            <Input type="number" min="1" style={{ height: 40 }} />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label={t('exercises.instructions', isEnglish ? 'Instructions' : 'Hướng Dẫn Làm Bài')}
        >
          <Input.TextArea
            placeholder={t('exercises.instructionsPlaceholder', isEnglish ? 'Enter instructions for learners...' : 'Nhập hướng dẫn làm bài cho học viên...')}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>

      {questions.map((question, index) => (
        <QuestionEditor
          key={question.id}
          question={question}
          index={index}
          exerciseId={draftId}
          onChange={(next) =>
            setQuestions((list) => list.map((item) => (item.id === next.id ? next : item)))
          }
          onDelete={() => setQuestions((list) => list.filter((item) => item.id !== question.id))}
        />
      ))}

      <Button
        block
        icon={<PlusOutlined />}
        onClick={() => setQuestions((list) => [...list, createQuestion()])}
        style={{ marginTop: 8, height: 40, borderRadius: 8 }}
      >
        {t('exercises.addQuestion', isEnglish ? 'Add Question' : 'Thêm Câu Hỏi')}
      </Button>
    </Modal>
  );
};
export default ExerciseBuilderModal;
