import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Input,
  Popconfirm,
  Badge,
  Spin,
  message,
} from 'antd';
import {
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  SendOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  StudentNoteService,
  NOTE_CATEGORY_LABELS,
  NOTE_STATUS,
} from '../services/StudentNoteService';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export const AcademicStudentNotesDrawer = ({
  open,
  student,
  currentUser,
  onClose,
  onRefresh,
}) => {
  const { isEnglish, language } = useLanguage();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [feedbackNotes, setFeedbackNotes] = useState({});

  const studentCode = student?.code || student?.id;
  const labels = NOTE_CATEGORY_LABELS[language === 'vi' ? 'vi' : 'en'] || NOTE_CATEGORY_LABELS.vi;

  const loadNotes = async () => {
    if (!studentCode) return;
    setLoading(true);
    try {
      const list = await StudentNoteService.getNotesByStudent(studentCode);
      setNotes(list);
    } catch (err) {
      console.warn('Lỗi tải notes học viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentCode) {
      loadNotes();
    }
  }, [open, studentCode]);

  const handleMarkCommunicated = async (noteId) => {
    try {
      setProcessingId(noteId);
      const noteFeedback = feedbackNotes[noteId] || '';
      await StudentNoteService.markAsCommunicated(noteId, currentUser, noteFeedback);
      message.success(
        isEnglish
          ? 'Marked as communicated to parent successfully!'
          : 'Đã cập nhật trạng thái: Đã truyền đạt cho phụ huynh!'
      );
      await loadNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error(err.message || 'Lỗi cập nhật');
    } finally {
      setProcessingId(null);
    }
  };

  if (!student) return null;

  const pendingCount = notes.filter((n) => n.status === NOTE_STATUS.PENDING).length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 580}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 16 }}>
          <Space>
            <MessageOutlined style={{ color: '#0958d9', fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              {isEnglish ? 'Teacher Notes for Student' : 'Tin Nhắn Từ Giáo Viên Về Học Viên'}
            </span>
          </Space>
          {pendingCount > 0 && (
            <Tag color="volcano" style={{ borderRadius: 6, fontWeight: 600 }}>
              {pendingCount} {isEnglish ? 'Pending' : 'Chưa truyền đạt'}
            </Tag>
          )}
        </div>
      }
      destroyOnClose
    >
      {/* Tóm tắt thông tin học viên & SĐT phụ huynh thật dành cho Giáo vụ */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          borderRadius: 12,
          border: '1px solid #bfdbfe',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text strong style={{ fontSize: 15, color: '#1e3a8a' }}>
            {student.name} {student.englishName ? `(${student.englishName})` : ''}
          </Text>
          <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>
            {studentCode}
          </Tag>
        </div>
        <div style={{ fontSize: 13, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>
            📞 <strong>{isEnglish ? 'Parent Phone:' : 'SĐT Phụ Huynh:'}</strong>{' '}
            <a href={`tel:${student.phone || student.phoneNumber}`} style={{ fontWeight: 700, color: '#1d4ed8' }}>
              {student.phone || student.phoneNumber || (isEnglish ? 'No phone' : 'Chưa có SĐT')}
            </a>
          </span>
          {student.phone && (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<MessageOutlined />}
              href={`https://zalo.me/${(student.phone || '').replace(/[^0-9]/g, '')}`}
              target="_blank"
              style={{ borderRadius: 6, height: 26, fontSize: 12 }}
            >
              Zalo Phụ Huynh
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip={isEnglish ? 'Loading teacher notes...' : 'Đang tải tin nhắn từ giáo viên...'} />
        </div>
      ) : notes.length === 0 ? (
        <Empty
          description={
            isEnglish
              ? 'No teacher notes recorded for this student yet.'
              : 'Chưa có tin nhắn hoặc yêu cầu nào từ Giáo viên về học viên này.'
          }
          style={{ padding: '40px 0' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map((note) => {
            const isPending = note.status === NOTE_STATUS.PENDING;
            const isUrgent = note.priority === 'URGENT';
            const catLabel = labels[note.category] || note.category;

            return (
              <Card
                key={note.id}
                size="small"
                style={{
                  borderRadius: 10,
                  border: isPending ? (isUrgent ? '1px solid #fecdd3' : '1px solid #fed7aa') : '1px solid #e2e8f0',
                  backgroundColor: isPending ? (isUrgent ? '#fff1f2' : '#fff7ed') : '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Header Note: Giáo viên gửi + Thẻ phân loại + Trạng thái */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <Space size={6}>
                    <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                      👨‍🏫 {note.teacherName}
                    </Text>
                    <Tag color="blue" style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                      {catLabel}
                    </Tag>
                    {isUrgent && (
                      <Tag color="red" style={{ borderRadius: 4, fontSize: 11, margin: 0, fontWeight: 700 }}>
                        🚨 {isEnglish ? 'Urgent' : 'Khẩn cấp'}
                      </Tag>
                    )}
                  </Space>

                  <Tag
                    color={isPending ? 'warning' : 'success'}
                    icon={isPending ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                    style={{ borderRadius: 4, margin: 0, fontSize: 11 }}
                  >
                    {isPending
                      ? isEnglish ? 'Pending' : 'Chưa truyền đạt'
                      : isEnglish ? 'Communicated' : 'Đã truyền đạt'}
                  </Tag>
                </div>

                {/* Nội dung tin nhắn giáo viên viết */}
                <Paragraph
                  style={{
                    fontSize: 13,
                    color: '#334155',
                    backgroundColor: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                    marginBottom: 8,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {note.content}
                </Paragraph>

                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                  🕒 {new Date(note.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </div>

                {/* Thông tin xử lý của Giáo vụ */}
                {!isPending && (
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#166534',
                      border: '1px solid #dcfce7',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      ✅ {isEnglish ? 'Communicated by' : 'Đã truyền đạt bởi'}: {note.communicatedByName || 'Giáo vụ'} (
                      {note.communicatedAt ? new Date(note.communicatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : ''})
                    </div>
                    {note.communicatedNote && (
                      <div style={{ marginTop: 2, color: '#15803d', fontStyle: 'italic' }}>
                        💬 {note.communicatedNote}
                      </div>
                    )}
                  </div>
                )}

                {/* Hành động dành cho Giáo vụ khi note còn PENDING */}
                {isPending && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                    <Input
                      placeholder={
                        isEnglish
                          ? 'Optional notes: E.g. Parent confirmed, will remind child to do homework...'
                          : 'Ghi chú phản hồi của PH: Ví dụ PH đã nghe máy, hứa sẽ nhắc con làm bài...'
                      }
                      size="small"
                      value={feedbackNotes[note.id] || ''}
                      onChange={(e) => setFeedbackNotes({ ...feedbackNotes, [note.id]: e.target.value })}
                      style={{ borderRadius: 6, marginBottom: 6, fontSize: 12 }}
                    />
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      loading={processingId === note.id}
                      onClick={() => handleMarkCommunicated(note.id)}
                      style={{
                        borderRadius: 6,
                        height: 28,
                        backgroundColor: '#16a34a',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {isEnglish ? 'Mark as Communicated to Parent' : 'Đã Truyền Đạt Cho Phụ Huynh'}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default AcademicStudentNotesDrawer;
