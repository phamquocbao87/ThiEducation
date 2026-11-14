import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Space, Tag, Typography } from 'antd';
import { EditOutlined, TagOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { QUICK_NOTE_DEFAULT_TAGS } from '../../../shared/models/classroom.model';

const { TextArea } = Input;
const { Text } = Typography;

export const QuickNoteModal = ({
  open,
  student,
  initialNote,
  loading = false,
  onSave,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (open && initialNote) {
      setText(initialNote.text || '');
      setSelectedTags(Array.isArray(initialNote.tags) ? initialNote.tags : []);
    } else if (open) {
      setText('');
      setSelectedTags([]);
    }
  }, [open, initialNote]);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (!student?.id) return;
    onSave?.(student.id, {
      text: text.trim(),
      tags: selectedTags,
    });
  };

  const studentName = student ? (student.englishName ? `${student.englishName} (${student.name})` : student.name) : '';

  return (
    <Modal
      open={open}
      wrapClassName="quick-note-modal-wrapper"
      title={
        <Space orientation="horizontal" size="small" data-testid="quick-note-modal-title">
          <EditOutlined style={{ color: '#1890ff' }} />
          <span>{t('classroom.quickNoteTitle') || 'Ghi Chú Nhanh'}: <strong>{studentName}</strong></span>
        </Space>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel') || 'Hủy'}
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          data-testid={`save-quick-note-${student?.id}`}
          onClick={handleSave}
        >
          {t('classroom.saveNoteAction') || 'Lưu Ghi Chú (0ms)'}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          <TagOutlined style={{ marginRight: 6 }} />
          {t('classroom.quickTagsLabel') || 'Thẻ Sư Phạm Chọn Nhanh (1-Chạm):'}
        </Text>
        <Space orientation="horizontal" wrap size={[6, 8]}>
          {QUICK_NOTE_DEFAULT_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Tag.CheckableTag
                key={tag}
                checked={isSelected}
                onChange={() => handleToggleTag(tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #1890ff' : '1px solid #d9d9d9',
                }}
              >
                {tag}
              </Tag.CheckableTag>
            );
          })}
        </Space>
      </div>

      <div>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          {t('classroom.noteTextLabel') || 'Nội dung ghi chú cụ thể:'}
        </Text>
        <TextArea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('classroom.notePlaceholder') || 'Gõ nhanh nhận xét trong lúc dạy (tự động điền vào báo cáo cuối giờ)...'}
          maxLength={500}
          showCount
          style={{ borderRadius: 8 }}
          data-testid={`quick-note-textarea-${student?.id}`}
        />
      </div>

      <div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 12, fontStyle: 'italic' }}>
        💡 {t('classroom.quickNoteTip') || 'Ghi chú sẽ tự động đồng bộ vào Bảng đánh giá sau buổi học và tin nhắn gửi phụ huynh qua Zalo.'}
      </div>
    </Modal>
  );
};
