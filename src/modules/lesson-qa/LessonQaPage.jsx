import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tabs,
  Input,
  Select,
  Tag,
  Button,
  Switch,
  Space,
  Typography,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  LockOutlined,
  BellOutlined,
  PlusOutlined,
  LikeOutlined,
  BookOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../../shared/hooks/useIsMobile';
import {
  LessonQuestionService,
  QUESTION_STATUS,
  QUESTION_VISIBILITY,
} from '../lesson-reader';
import { LessonQaManagementService } from './services/LessonQaManagementService';
import { QaSummaryKpiRow } from './components/QaSummaryKpiRow';
import { AskQuestionQuickModal } from './components/AskQuestionQuickModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * LessonQaPage — Màn Hình Chuyên Biệt Quản Lý Hỏi & Đáp Bài Học (/lesson-qa)
 * - Phân quyền chuẩn 6 Roles:
 *   + student: Xem câu của mình + câu chia sẻ cả lớp, đặt câu hỏi mới, đánh dấu đã hiểu.
 *   + teacher: Xem & trả lời câu hỏi thuộc lớp GV dạy + bật/tắt chia sẻ lớp (0% Zalo, 0% SĐT PH).
 *   + academic: Xem toàn trường, lọc theo Lớp/Bài học/GV, trả lời hỗ trợ hoặc bấm Nhắc GV trả lời.
 *   + director: Xem toàn trường giám sát chất lượng phản hồi & SLA.
 *   + admin: Full quyền toàn trường.
 *   + accountant: Bị chặn tại ProtectedRoute & ẩn khỏi Sidebar.
 */
export const LessonQaPage = () => {
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();

  const userRole = String(currentUser?.role || '').toLowerCase();
  const studentId = String(currentUser?.id || currentUser?.code || '');
  const isStudent = userRole === 'student';
  const canAnswer = ['teacher', 'academic', 'admin'].includes(userRole);
  const canRemindTeacher = ['academic', 'director', 'admin'].includes(userRole);
  const canFilterTeacher = ['academic', 'director', 'admin'].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [classes, setClasses] = useState([]);

  // Filters
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'OPEN' | 'ANSWERED' | 'SHARED'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedLessonKey, setSelectedLessonKey] = useState('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState('ALL');

  // Inline answer & remind state
  const [replyDrafts, setReplyDrafts] = useState({});
  const [shareDrafts, setShareDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [remindedIds, setRemindedIds] = useState({});
  const [askModalOpen, setAskModalOpen] = useState(false);

  const highlightedQaId = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('qaId') || '';
    } catch {
      return '';
    }
  }, [location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await LessonQaManagementService.getScopedQaDataset(currentUser);
      setQuestions(res.questions || []);
      setClasses(res.classes || []);
    } catch (err) {
      console.warn('[LessonQaPage] Lỗi nạp dữ liệu Q&A:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, currentUser?.role]);

  // Danh sách các Buổi học / Bài học có câu hỏi (lọc động theo lớp đang chọn)
  const lessonFilterOptions = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      if (selectedClassId !== 'ALL' && String(q.classId) !== String(selectedClassId)) return;
      if (!map.has(q.lessonKey)) {
        const shortTitle =
          q.lessonTitle && q.lessonTitle.length > 55
            ? `${q.lessonTitle.slice(0, 55)}...`
            : q.lessonTitle || '';
        map.set(q.lessonKey, {
          value: q.lessonKey,
          label: `[${q.classId}] ${isEnglish ? 'Session' : 'Buổi'} ${q.sessionIndex}${shortTitle ? ` • ${shortTitle}` : ''}`,
        });
      }
    });
    return Array.from(map.values());
  }, [questions, selectedClassId, isEnglish]);

  // Danh sách Giáo viên để Academic/Director lọc
  const teacherFilterOptions = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      if (q.teacherId && !map.has(q.teacherId)) {
        map.set(q.teacherId, { value: q.teacherId, label: `👨‍🏫 ${q.teacherName || q.teacherId}` });
      }
    });
    return Array.from(map.values());
  }, [questions]);

  // Reset bộ lọc bài học nếu đổi lớp
  useEffect(() => {
    setSelectedLessonKey('ALL');
  }, [selectedClassId]);

  // Bộ lọc chính trước khi đếm Tab
  const baseFilteredQuestions = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return questions.filter((q) => {
      if (selectedClassId !== 'ALL' && String(q.classId) !== String(selectedClassId)) return false;
      if (selectedLessonKey !== 'ALL' && q.lessonKey !== selectedLessonKey) return false;
      if (canFilterTeacher && selectedTeacherId !== 'ALL' && String(q.teacherId) !== String(selectedTeacherId)) {
        return false;
      }
      if (kw) {
        const hay = `${q.classId} ${q.className} ${q.lessonTitle} ${q.anchorText} ${q.questionText} ${q.answerText} ${q.studentName} ${q.studentEnglishName} ${q.teacherName}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [questions, selectedClassId, selectedLessonKey, selectedTeacherId, canFilterTeacher, searchKeyword]);

  const summary = useMemo(
    () => LessonQaManagementService.buildSummary(baseFilteredQuestions),
    [baseFilteredQuestions]
  );

  const visibleQuestions = useMemo(() => {
    if (statusTab === 'OPEN') return baseFilteredQuestions.filter((q) => q.status === QUESTION_STATUS.OPEN);
    if (statusTab === 'ANSWERED') return baseFilteredQuestions.filter((q) => q.status === QUESTION_STATUS.ANSWERED);
    if (statusTab === 'SHARED') return baseFilteredQuestions.filter((q) => q.visibility === QUESTION_VISIBILITY.CLASS_SHARED);
    return baseFilteredQuestions;
  }, [baseFilteredQuestions, statusTab]);

  // Hành động: Giáo viên / Giáo vụ / Admin trả lời câu hỏi (0ms)
  const handleSubmitAnswer = async (q) => {
    const draft = String(replyDrafts[q.id] || '').trim();
    if (!draft) {
      message.warning(isEnglish ? 'Please enter your answer.' : 'Vui lòng nhập nội dung câu trả lời.');
      return;
    }

    setSubmittingId(q.id);
    try {
      const updated = await LessonQuestionService.answerQuestion({
        question: q,
        answerText: draft,
        teacherUser: currentUser,
        shareWithClass: Boolean(shareDrafts[q.id]),
      });
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...item, ...updated } : item)));
      setReplyDrafts((prev) => ({ ...prev, [q.id]: '' }));
      message.success(
        isEnglish
          ? `Answer sent to ${q.studentName}!`
          : `Đã gửi câu trả lời tới học viên ${q.studentName}!`
      );
    } catch (err) {
      message.error(err?.message || 'Lỗi gửi câu trả lời');
    } finally {
      setSubmittingId(null);
    }
  };

  // Hành động: Bật/tắt chia sẻ câu hỏi cho cả lớp
  const handleToggleShare = async (q, checked) => {
    const nextVis = checked ? QUESTION_VISIBILITY.CLASS_SHARED : QUESTION_VISIBILITY.PRIVATE;
    setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...item, visibility: nextVis } : item)));
    await LessonQuestionService.toggleVisibility({ question: q, shareWithClass: checked });
    message.success(
      checked
        ? isEnglish
          ? 'Shared with the whole class!'
          : 'Đã chia sẻ câu hỏi & lời giải đáp cho cả lớp!'
        : isEnglish
        ? 'Changed back to Private 1-on-1.'
        : 'Đã chuyển về chế độ Riêng tư 1-1.'
    );
  };

  // Hành động: Giáo vụ / Giám đốc nhắc Giáo viên trả lời
  const handleRemindTeacher = async (q) => {
    setRemindedIds((prev) => ({ ...prev, [q.id]: true }));
    await LessonQaManagementService.remindTeacherToAnswer({
      question: q,
      senderUser: currentUser,
      isEnglish,
    });
    message.success(
      isEnglish
        ? `Reminder sent to ${q.teacherName}!`
        : `Đã gửi nhắc nhở tới giáo viên ${q.teacherName}!`
    );
  };

  // Hành động: Học viên đánh dấu đã hiểu
  const handleToggleResolved = async (q) => {
    const nextVal = !q.resolvedByStudent;
    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, resolvedByStudent: nextVal } : item))
    );
    await LessonQuestionService.markResolvedByStudent({ question: q, resolved: nextVal });
    if (nextVal) {
      message.success(isEnglish ? 'Marked as understood!' : 'Đã đánh dấu con đã hiểu bài!');
    }
  };

  const roleHeaderCopy = useMemo(() => {
    if (isStudent) {
      return {
        title: isEnglish ? 'My Lesson Questions & Answers' : 'Hỏi & Đáp Bài Học Của Con',
        subtitle: isEnglish
          ? 'Ask your Native Teacher about unclear parts in any lesson and review class-shared Q&A.'
          : 'Xem toàn bộ câu hỏi của con theo từng lớp, từng bài học và các lời giải đáp từ Giáo viên bản xứ.',
      };
    }
    if (userRole === 'teacher') {
      return {
        title: isEnglish ? 'Student Lesson Q&A Management' : 'Quản Lý Hỏi & Đáp Học Viên',
        subtitle: isEnglish
          ? 'Review and answer student questions organized by class, session, and lesson topic.'
          : 'Phân loại và giải đáp câu hỏi của học viên theo từng lớp học, buổi học và nội dung bài giảng.',
      };
    }
    return {
      title: isEnglish ? 'School-Wide Lesson Q&A Management' : 'Quản Lý Hỏi & Đáp Bài Học Toàn Trường',
      subtitle: isEnglish
        ? 'Monitor student questions across all classes, track teacher response status, and support resolution.'
        : 'Theo dõi toàn bộ câu hỏi theo từng lớp, bài học, trạng thái mới/đã giải quyết và đôn đốc giáo viên phản hồi.',
    };
  }, [isStudent, userRole, isEnglish]);

  const tabItems = [
    {
      key: 'ALL',
      label: isMobile
        ? isEnglish
          ? `All (${summary.total})`
          : `Tất cả (${summary.total})`
        : isEnglish
        ? `All (${summary.total})`
        : `Tất cả (${summary.total})`,
    },
    {
      key: 'OPEN',
      label: (
        <span data-testid="qa-tab-open" style={{ color: statusTab === 'OPEN' ? '#d97706' : undefined, fontWeight: 700 }}>
          {isMobile
            ? isEnglish
              ? `New (${summary.openCount})`
              : `Mới (${summary.openCount})`
            : isEnglish
            ? `🆕 New / Pending (${summary.openCount})`
            : `🆕 Câu hỏi mới (${summary.openCount})`}
        </span>
      ),
    },
    {
      key: 'ANSWERED',
      label: (
        <span data-testid="qa-tab-answered">
          {isMobile
            ? isEnglish
              ? `Done (${summary.answeredCount})`
              : `Đã xong (${summary.answeredCount})`
            : isEnglish
            ? `✅ Resolved (${summary.answeredCount})`
            : `✅ Đã giải quyết (${summary.answeredCount})`}
        </span>
      ),
    },
    {
      key: 'SHARED',
      label: (
        <span data-testid="qa-tab-shared">
          {isMobile
            ? isEnglish
              ? `Shared (${summary.sharedCount})`
              : `Lớp (${summary.sharedCount})`
            : isEnglish
            ? `🌐 Class Shared (${summary.sharedCount})`
            : `🌐 Chia sẻ lớp (${summary.sharedCount})`}
        </span>
      ),
    },
  ];

  return (
    <div data-testid="lesson-qa-management-page">
      {/* 1. Header Màn Hình Quản Lý Q&A */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 10,
          marginBottom: isMobile ? 12 : 18,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: '#0f172a' }}>
            <QuestionCircleOutlined style={{ color: '#2563eb', marginRight: 8 }} />
            {roleHeaderCopy.title}
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
            {roleHeaderCopy.subtitle}
          </Text>
        </div>

        <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
          {isStudent && classes.length > 0 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAskModalOpen(true)}
              data-testid="btn-student-ask-new-qa"
              style={{
                backgroundColor: '#2563eb',
                borderColor: '#2563eb',
                fontWeight: 700,
                borderRadius: 8,
                minHeight: 40,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {isEnglish ? 'Ask New Question' : 'Đặt Câu Hỏi Mới'}
            </Button>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
            style={{ borderRadius: 8, minHeight: 40, width: isMobile ? '100%' : 'auto' }}
          >
            {isEnglish ? 'Refresh' : 'Làm mới'}
          </Button>
        </Space>
      </div>

      {/* 2. Hàng KPI Tổng Quan */}
      <QaSummaryKpiRow summary={summary} userRole={userRole} />

      {/* 3. Thanh Bộ Lọc Đa Chiều (Lớp học + Bài học + Giáo viên + Từ khóa) */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        styles={{ body: { padding: isMobile ? '12px' : '16px 20px' } }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : canFilterTeacher
              ? '1.4fr 1fr 1.2fr 0.9fr'
              : '1.5fr 1fr 1.2fr',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={
              isEnglish
                ? 'Search question, lesson topic, student...'
                : 'Tìm nội dung câu hỏi, tên bài học, học viên...'
            }
            data-testid="input-qa-search"
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />

          <Select
            value={selectedClassId}
            onChange={setSelectedClassId}
            data-testid="select-qa-filter-class"
            style={{ width: '100%', height: 40 }}
            options={[
              {
                value: 'ALL',
                label: isEnglish ? `🏫 All Classes (${classes.length})` : `🏫 Tất cả lớp học (${classes.length})`,
              },
              ...classes.map((c) => ({
                value: c.id || c.code,
                label: `[${c.id || c.code}] ${c.name}`,
              })),
            ]}
          />

          <Select
            value={selectedLessonKey}
            onChange={setSelectedLessonKey}
            data-testid="select-qa-filter-lesson"
            style={{ width: '100%', height: 40 }}
            options={[
              {
                value: 'ALL',
                label: isEnglish ? '📘 All Sessions & Lessons' : '📘 Tất cả buổi học & bài học',
              },
              ...lessonFilterOptions,
            ]}
          />

          {canFilterTeacher && (
            <Select
              value={selectedTeacherId}
              onChange={setSelectedTeacherId}
              data-testid="select-qa-filter-teacher"
              style={{ width: '100%', height: 40 }}
              options={[
                { value: 'ALL', label: isEnglish ? '👨‍🏫 All Teachers' : '👨‍🏫 Tất cả giáo viên' },
                ...teacherFilterOptions,
              ]}
            />
          )}
        </div>

        {/* Tabs Phân Loại Câu Mới / Đã Giải Quyết / Chia Sẻ */}
        <Tabs
          activeKey={statusTab}
          onChange={setStatusTab}
          items={tabItems}
          size={isMobile ? 'small' : 'middle'}
          tabBarGutter={isMobile ? 14 : 24}
          style={{ marginBottom: 0 }}
        />

        {/* Danh sách chi tiết từng câu hỏi */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : visibleQuestions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isEnglish
                ? 'No questions match your current filters.'
                : 'Không có câu hỏi nào phù hợp với bộ lọc hiện tại.'
            }
            style={{ padding: '28px 0' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {visibleQuestions.map((q) => {
              const isOpen = q.status === QUESTION_STATUS.OPEN;
              const isShared = q.visibility === QUESTION_VISIBILITY.CLASS_SHARED;
              const isHighlighted = highlightedQaId && highlightedQaId === q.id;
              const isOwn = isStudent && String(q.studentId) === studentId;

              return (
                <div
                  key={q.id}
                  data-testid={`qa-management-card-${q.id}`}
                  style={{
                    padding: isMobile ? '12px' : '16px 18px',
                    borderRadius: 12,
                    backgroundColor: isHighlighted ? '#fefce8' : '#ffffff',
                    border: `1.5px solid ${
                      isHighlighted ? '#facc15' : isOpen ? '#93c5fd' : '#bbf7d0'
                    }`,
                    borderLeft: `4px solid ${isOpen ? '#2563eb' : '#16a34a'}`,
                    boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
                  }}
                >
                  {/* Dòng 1: Trạng thái Mới / Đã giải quyết + Lớp học + Buổi học */}
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
                      {isOpen ? (
                        <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0, fontWeight: 700 }}>
                          {isEnglish ? '🆕 New • Pending Answer' : '🆕 Câu hỏi mới • Chờ giải đáp'}
                        </Tag>
                      ) : (
                        <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontWeight: 700 }}>
                          {isEnglish ? '✅ Resolved' : '✅ Đã giải quyết'}
                        </Tag>
                      )}

                      {q.isOverdue24h && (
                        <Tag color="error" style={{ margin: 0, fontWeight: 700 }}>
                          ⏰ {isEnglish ? 'Overdue > 24h' : 'Quá hạn > 24h'}
                        </Tag>
                      )}

                      <Tag color="purple" style={{ margin: 0, fontWeight: 700 }}>
                        🏫 {q.classId} • {q.className}
                      </Tag>

                      <Tag color="blue" icon={<BookOutlined />} style={{ margin: 0, fontWeight: 600 }}>
                        {isEnglish ? `Session ${q.sessionIndex}` : `Buổi ${q.sessionIndex}`}
                      </Tag>

                      {isShared ? (
                        <Tag color="cyan" icon={<GlobalOutlined />} style={{ margin: 0 }}>
                          {isEnglish ? 'Shared with Class' : 'Chia sẻ cả lớp'}
                        </Tag>
                      ) : (
                        <Tag color="default" icon={<LockOutlined />} style={{ margin: 0 }}>
                          {isEnglish ? 'Private 1-on-1' : 'Riêng tư 1-1'}
                        </Tag>
                      )}
                    </Space>

                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {q.createdAt ? new Date(q.createdAt).toLocaleString('vi-VN') : ''}
                    </Text>
                  </div>

                  {/* Dòng 2: Ngữ cảnh Bài Học (Lesson Title) & Đoạn chưa rõ (Anchor) */}
                  <div
                    data-testid={`qa-lesson-context-${q.id}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      marginBottom: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#334155' }}>
                      <Text strong style={{ color: '#581c87' }}>
                        📖 {isEnglish ? 'Lesson:' : 'Bài học:'}
                      </Text>{' '}
                      <span>{q.lessonTitle}</span>
                    </div>
                    {q.anchorText && (
                      <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>
                        📌 {isEnglish ? 'Unclear section:' : 'Phần bài học học viên hỏi:'} {q.anchorText}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {(!isStudent || isOwn) && (
                        <span>
                          👤 {isEnglish ? 'Student:' : 'Học viên:'}{' '}
                          <Text strong>
                            {q.studentName}
                            {q.studentEnglishName ? ` (${q.studentEnglishName})` : ''}
                          </Text>
                        </span>
                      )}
                      <span>
                        👨‍🏫 {isEnglish ? 'Teacher:' : 'Giáo viên phụ trách:'}{' '}
                        <Text strong>{q.teacherName}</Text>
                      </span>
                    </div>
                  </div>

                  {/* Dòng 3: Nội dung câu hỏi */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#0f172a',
                      lineHeight: 1.6,
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: '#eff6ff',
                      borderLeft: '3px solid #2563eb',
                      marginBottom: 10,
                      whiteSpace: 'pre-line',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    ❓ {q.questionText}
                  </div>

                  {/* Dòng 4: Khối Trả Lời / Hành Động Theo Role */}
                  {!isOpen && q.answerText ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                        ✅ {q.answeredByName || q.teacherName}{' '}
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
                          ({q.answeredAt ? new Date(q.answeredAt).toLocaleString('vi-VN') : ''})
                        </Text>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#166534',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {q.answerText}
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: '1px dashed #bbf7d0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        {canAnswer && (
                          <Space size={6}>
                            <Switch
                              size="small"
                              checked={isShared}
                              onChange={(checked) => handleToggleShare(q, checked)}
                              data-testid={`qa-page-switch-share-${q.id}`}
                            />
                            <Text style={{ fontSize: 12, color: isShared ? '#0369a1' : '#475569', fontWeight: 600 }}>
                              {isShared
                                ? isEnglish
                                  ? 'Shared with whole class'
                                  : 'Đang chia sẻ cho cả lớp cùng học'
                                : isEnglish
                                ? 'Private 1-on-1 (Toggle to share with class)'
                                : 'Riêng tư 1-1 (Bật để chia sẻ cho cả lớp)'}
                            </Text>
                          </Space>
                        )}

                        {isOwn && (
                          <Button
                            size="small"
                            type={q.resolvedByStudent ? 'primary' : 'default'}
                            icon={<LikeOutlined />}
                            onClick={() => handleToggleResolved(q)}
                            style={{
                              borderRadius: 6,
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
                        )}

                        {!isOwn && q.resolvedByStudent && (
                          <Tag color="green" style={{ margin: 0 }}>
                            👍 {isEnglish ? 'Student understood' : 'Học viên đã xác nhận hiểu'}
                          </Tag>
                        )}
                      </div>
                    </div>
                  ) : canAnswer ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <TextArea
                        rows={2}
                        value={replyDrafts[q.id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={
                          isEnglish
                            ? 'Write a clear explanation for this lesson question...'
                            : 'Nhập lời giải đáp chi tiết cho câu hỏi bài học này...'
                        }
                        data-testid={`qa-page-input-answer-${q.id}`}
                        style={{ borderRadius: 8, fontSize: 13 }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: isMobile ? 'stretch' : 'center',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: 8,
                        }}
                      >
                        <Space size={6}>
                          <Switch
                            size="small"
                            checked={Boolean(shareDrafts[q.id])}
                            onChange={(checked) => setShareDrafts((prev) => ({ ...prev, [q.id]: checked }))}
                          />
                          <Text style={{ fontSize: 12, color: '#475569' }}>
                            {isEnglish ? 'Share answer with whole class' : 'Chia sẻ lời giải đáp cho cả lớp'}
                          </Text>
                        </Space>

                        <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
                          {canRemindTeacher && q.teacherId && (
                            <Button
                              icon={<BellOutlined />}
                              disabled={Boolean(remindedIds[q.id])}
                              onClick={() => handleRemindTeacher(q)}
                              data-testid={`qa-page-btn-remind-gv-${q.id}`}
                              style={{ borderRadius: 8, minHeight: 38, width: isMobile ? '100%' : 'auto' }}
                            >
                              {remindedIds[q.id]
                                ? isEnglish
                                  ? 'Teacher Reminded'
                                  : 'Đã Nhắc GV'
                                : isEnglish
                                ? 'Remind Teacher'
                                : 'Nhắc GV Trả Lời'}
                            </Button>
                          )}
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            loading={submittingId === q.id}
                            onClick={() => handleSubmitAnswer(q)}
                            data-testid={`qa-page-btn-send-answer-${q.id}`}
                            style={{
                              backgroundColor: '#2563eb',
                              borderColor: '#2563eb',
                              fontWeight: 700,
                              borderRadius: 8,
                              minHeight: 38,
                              width: isMobile ? '100%' : 'auto',
                            }}
                          >
                            {isEnglish ? 'Send Answer' : 'Gửi Câu Trả Lời'}
                          </Button>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    canRemindTeacher && q.teacherId && (
                      <div>
                        <Button
                          icon={<BellOutlined />}
                          disabled={Boolean(remindedIds[q.id])}
                          onClick={() => handleRemindTeacher(q)}
                          data-testid={`qa-page-btn-remind-gv-${q.id}`}
                          style={{ borderRadius: 8, minHeight: 38 }}
                        >
                          {remindedIds[q.id]
                            ? isEnglish
                              ? 'Teacher Reminded'
                              : 'Đã Nhắc Giáo Viên'
                            : isEnglish
                            ? 'Remind Teacher to Answer'
                            : 'Nhắc Giáo Viên Trả Lời'}
                        </Button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal đặt câu hỏi mới cho Học Viên */}
      {isStudent && (
        <AskQuestionQuickModal
          open={askModalOpen}
          onClose={() => setAskModalOpen(false)}
          classes={classes}
          studentUser={currentUser}
          onCreated={() => loadData()}
        />
      )}
    </div>
  );
};

export default LessonQaPage;
