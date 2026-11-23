import React from 'react';
import { Card, Tag, Button, Space, Typography, Badge } from 'antd';
import {
  QuestionCircleOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { QUESTION_STATUS } from '../../lesson-reader';

const { Text } = Typography;

/**
 * DashboardNewQuestionsPreviewCard — Khối Preview Gọn Bên Ngoài Dashboard (Tối Đa 2 Câu Hỏi Mới)
 * - Đúng yêu cầu Sếp Bảo: Bên ngoài Dashboard CHỈ hiển thị 1 đến 2 câu hỏi mới nhất,
 *   kèm ngữ cảnh Lớp + Buổi học + Bài học và nút `Xem tất cả →` mở màn hình chi tiết `/lesson-qa`.
 * - Dùng chung sạch sẽ cho mọi role: Teacher, Academic, Director, Student.
 */
export const DashboardNewQuestionsPreviewCard = ({
  questions = [],
  userRole = 'teacher',
  maxItems = 2,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const isStudent = String(userRole || '').toLowerCase() === 'student';

  // Bên ngoài Dashboard CHỈ lấy câu hỏi MỚI (OPEN) đối với Staff; với Học viên ưu tiên câu mới hỏi / vừa được trả lời
  const newQuestions = (questions || []).filter((q) => {
    if (q.isDeleted) return false;
    if (isStudent) {
      return q.status === QUESTION_STATUS.OPEN || (q.status === QUESTION_STATUS.ANSWERED && !q.resolvedByStudent);
    }
    return q.status === QUESTION_STATUS.OPEN;
  });

  // Nếu không có câu mới nào -> không chiếm diện tích Dashboard
  if (newQuestions.length === 0) {
    return null;
  }

  const previewItems = newQuestions.slice(0, Math.min(2, Math.max(1, maxItems)));
  const totalCount = questions.length;
  const openCount = questions.filter((q) => !q.isDeleted && q.status === QUESTION_STATUS.OPEN).length;

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: isMobile ? 12 : 20,
        borderRadius: 12,
        borderLeft: '4px solid #2563eb',
        backgroundColor: '#eff6ff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: isMobile ? '12px 14px' : '14px 18px' } }}
      data-testid="dashboard-new-questions-preview-card"
    >
      {/* Header gọn + Nút vào màn hình chi tiết /lesson-qa */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Space size={8}>
          <Badge count={isStudent ? newQuestions.length : openCount} overflowCount={99} color="#2563eb">
            <QuestionCircleOutlined style={{ color: '#1d4ed8', fontSize: 18 }} />
          </Badge>
          <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#1e3a8a' }}>
            {isStudent
              ? isEnglish
                ? `Latest Lesson Q&A (${newQuestions.length})`
                : `Hỏi & Đáp Bài Học Mới Nhất (${newQuestions.length})`
              : isEnglish
              ? `New Student Questions (${openCount} pending)`
              : `Câu Hỏi Học Viên Mới (${openCount} chờ giải đáp)`}
          </Text>
        </Space>

        <Button
          type="primary"
          size="small"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          onClick={() => navigate('/lesson-qa')}
          data-testid="btn-dashboard-view-all-qa"
          style={{
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            borderRadius: 6,
            fontWeight: 700,
            minHeight: 32,
          }}
        >
          {isEnglish
            ? `Manage All Q&A (${totalCount})`
            : `Xem Tất Cả (${totalCount})`}
        </Button>
      </div>

      {/* Chỉ hiển thị 1 đến 2 câu hỏi mới nhất */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {previewItems.map((q) => {
          const isOpen = q.status === QUESTION_STATUS.OPEN;
          return (
            <div
              key={q.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/lesson-qa?qaId=${encodeURIComponent(q.id)}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/lesson-qa?qaId=${encodeURIComponent(q.id)}`);
                }
              }}
              data-testid={`dashboard-qa-preview-item-${q.id}`}
              style={{
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: `1px solid ${isOpen ? '#bfdbfe' : '#bbf7d0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  {isOpen ? (
                    <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                      {isEnglish ? 'NEW' : 'MỚI'}
                    </Tag>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                      {isEnglish ? 'ANSWERED' : 'ĐÃ TRẢ LỜI'}
                    </Tag>
                  )}
                  <Tag color="purple" style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
                    🏫 {q.classId}
                  </Tag>
                  <Tag color="blue" icon={<BookOutlined />} style={{ margin: 0, fontSize: 11 }}>
                    {isEnglish ? `Session ${q.sessionIndex}` : `Buổi ${q.sessionIndex}`}
                  </Tag>
                  {!isStudent && (
                    <Text strong style={{ fontSize: 12, color: '#0f172a' }}>
                      👤 {q.studentName}
                    </Text>
                  )}
                </div>

                {q.lessonTitle && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#6b21a8',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 2,
                    }}
                  >
                    📖 {q.lessonTitle}
                    {q.anchorText ? ` • 📌 ${q.anchorText}` : ''}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 13,
                    color: '#1e293b',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  ❓ {q.questionText}
                </div>
              </div>

              <Button
                size="small"
                type="link"
                style={{ padding: 0, fontWeight: 700, color: '#2563eb', alignSelf: isMobile ? 'flex-end' : 'center' }}
              >
                {isStudent
                  ? isEnglish
                    ? 'Open →'
                    : 'Xem chi tiết →'
                  : isEnglish
                  ? 'Answer →'
                  : 'Giải đáp →'}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DashboardNewQuestionsPreviewCard;
