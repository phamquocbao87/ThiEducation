import React, { useState } from 'react';
import { Button, Input, Tag, Space, Typography, Empty, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { NOTE_TAGS } from '../models/lessonReader.model';
import { LessonStudentNoteService } from '../services/LessonStudentNoteService';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * LessonStudentNotesPanel — Bảng Ghi Chú Cá Nhân (My Study Notes) bên trong Book Reader
 * - Cô lập riêng tư 100% theo học viên (`studentId`).
 * - Hỗ trợ gắn đoạn trích dẫn mục tiêu bài học (`anchorText`), gắn nhãn màu, thêm/sửa/xóa 0ms.
 */
export const LessonStudentNotesPanel = ({
  notes = [],
  onNotesChange = null,
  classItem = null,
  lessonPrep = null,
  studentUser = null,
  activeAnchor = null,
  onClearAnchor = null,
  theme = {},
}) => {
  const { isEnglish } = useLanguage();
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('KEY_IDEA');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const studentId = studentUser?.id || studentUser?.code;
  const classId = classItem?.id || classItem?.code;

  const handleAddNote = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      message.warning(isEnglish ? 'Please enter your note content.' : 'Vui lòng nhập nội dung ghi chú.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await LessonStudentNoteService.createNote({
        classItem,
        lessonPrep,
        studentUser,
        content: trimmed,
        tag: selectedTag,
        anchorIndex: activeAnchor?.index ?? null,
        anchorText: activeAnchor?.text || '',
      });
      onNotesChange?.([created, ...notes]);
      setContent('');
      onClearAnchor?.();
      message.success(isEnglish ? 'Note saved!' : 'Đã lưu ghi chú cá nhân!');
    } catch (err) {
      message.error(err?.message || 'Lỗi lưu ghi chú');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setEditingText(note.content || '');
  };

  const handleSaveEdit = async (note) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    // 0ms Optimistic update
    const updatedList = notes.map((n) =>
      n.id === note.id ? { ...n, content: trimmed, updatedAt: new Date().toISOString() } : n
    );
    onNotesChange?.(updatedList);
    setEditingId(null);
    setEditingText('');

    await LessonStudentNoteService.updateNote({
      noteId: note.id,
      studentId,
      content: trimmed,
    });
    message.success(isEnglish ? 'Note updated!' : 'Đã cập nhật ghi chú!');
  };

  const handleDeleteNote = async (note) => {
    // 0ms Optimistic removal
    onNotesChange?.(notes.filter((n) => n.id !== note.id));
    await LessonStudentNoteService.deleteNote({
      noteId: note.id,
      studentId,
      classId,
      sessionIndex: lessonPrep?.sessionIndex,
    });
    message.success(isEnglish ? 'Note deleted.' : 'Đã xóa ghi chú.');
  };

  return (
    <div
      data-testid="lesson-student-notes-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}
    >
      {/* Nhãn bảo mật riêng tư */}
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
            ? 'Private personal notes — only visible to you.'
            : 'Ghi chú cá nhân riêng tư — chỉ mình con nhìn thấy.'}
        </span>
      </div>

      {/* Form thêm ghi chú */}
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
        {/* Đoạn trích dẫn nếu chọn từ trang sách */}
        {activeAnchor?.text && (
          <div
            data-testid="note-anchor-preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              padding: '5px 8px',
              borderRadius: 6,
              backgroundColor: '#f3e8ff',
              border: '1px solid #d8b4fe',
              fontSize: 12,
              color: '#581c87',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📌 {activeAnchor.text}
            </span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ fontSize: 10 }} />}
              onClick={onClearAnchor}
              style={{ minWidth: 22, height: 22, padding: 0, color: '#6b21a8' }}
            />
          </div>
        )}

        {/* Chọn nhãn ghi chú */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.values(NOTE_TAGS).map((t) => {
            const active = selectedTag === t.key;
            return (
              <button
                key={t.key}
                type="button"
                data-testid={`btn-note-tag-${t.key}`}
                onClick={() => setSelectedTag(t.key)}
                style={{
                  border: active ? '1.5px solid #7e22ce' : `1px solid ${theme.canvasBorder || '#cbd5e1'}`,
                  backgroundColor: active ? t.bg : 'transparent',
                  color: active ? '#1e293b' : theme.textSecondary || '#475569',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {t.icon} {isEnglish ? t.labelEn : t.labelVi}
              </button>
            );
          })}
        </div>

        <TextArea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isEnglish
              ? 'Write new vocabulary, key ideas, or things to remember...'
              : 'Ghi chú từ vựng mới, ý chính hoặc điểm cần nhớ trước giờ học...'
          }
          maxLength={800}
          data-testid="input-student-note-content"
          style={{ borderRadius: 8, fontSize: 13 }}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={submitting}
          onClick={handleAddNote}
          data-testid="btn-save-student-note"
          style={{
            backgroundColor: '#7e22ce',
            borderColor: '#7e22ce',
            borderRadius: 8,
            fontWeight: 700,
            minHeight: 38,
          }}
        >
          {isEnglish ? 'Save Personal Note' : 'Lưu Ghi Chú'}
        </Button>
      </div>

      {/* Danh sách ghi chú đã lưu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {notes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ fontSize: 12, color: theme.textSecondary || '#64748b' }}>
                {isEnglish
                  ? 'No personal notes for this lesson yet. Tap 📝 next to any section to take notes!'
                  : 'Chưa có ghi chú nào cho buổi học này. Bấm 📝 cạnh từng mục để ghi chú nhanh!'}
              </span>
            }
          />
        ) : (
          notes.map((note) => {
            const tagMeta = NOTE_TAGS[note.tag] || NOTE_TAGS.KEY_IDEA;
            const isEditing = editingId === note.id;
            return (
              <div
                key={note.id}
                data-testid={`student-note-card-${note.id}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: theme.canvasBg || '#ffffff',
                  border: `1px solid ${theme.canvasBorder || '#e2e8f0'}`,
                  borderLeft: `3px solid #7e22ce`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 6 }}>
                  <Tag color={tagMeta.color} style={{ margin: 0, fontSize: 11, fontWeight: 600, borderRadius: 4 }}>
                    {tagMeta.icon} {isEnglish ? tagMeta.labelEn : tagMeta.labelVi}
                  </Tag>
                  <Space size={2}>
                    {!isEditing && (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(note)}
                        data-testid={`btn-edit-note-${note.id}`}
                        style={{ minWidth: 32, height: 32, color: theme.textSecondary || '#64748b' }}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteNote(note)}
                      data-testid={`btn-delete-note-${note.id}`}
                      style={{ minWidth: 32, height: 32 }}
                    />
                  </Space>
                </div>

                {note.anchorText && (
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.cardAccent || '#7e22ce',
                      backgroundColor: theme.cardBg || '#faf5ff',
                      padding: '3px 7px',
                      borderRadius: 5,
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    📌 {note.anchorText}
                  </div>
                )}

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <TextArea
                      rows={2}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      data-testid={`input-edit-note-${note.id}`}
                      style={{ fontSize: 13 }}
                    />
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleSaveEdit(note)}
                        data-testid={`btn-confirm-edit-note-${note.id}`}
                      >
                        {isEnglish ? 'Save' : 'Lưu'}
                      </Button>
                      <Button size="small" onClick={() => setEditingId(null)}>
                        {isEnglish ? 'Cancel' : 'Hủy'}
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.textPrimary || '#1e293b',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-line',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {note.content}
                  </div>
                )}

                <div style={{ fontSize: 10, color: theme.textSecondary || '#94a3b8', marginTop: 6 }}>
                  {note.createdAt ? new Date(note.createdAt).toLocaleString('vi-VN') : ''}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LessonStudentNotesPanel;
