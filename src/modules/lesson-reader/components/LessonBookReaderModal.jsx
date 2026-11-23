import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Button, Tag, Space, Typography, Progress, Tooltip, Alert, Tabs, Drawer, Badge, message } from 'antd';
import {
  CloseOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  FontSizeOutlined,
  FormOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { FormattedText } from '../../../shared/components/controls';
import { MaterialPreviewModal } from '../../materials/components/MaterialPreviewModal';
import {
  READER_FONT_SIZES,
  READER_THEMES,
  PREP_STATUS,
  formatClockDuration,
  formatHumanDuration,
  getPrepStatusMeta,
  isObjectiveSectionHeading,
} from '../models/lessonReader.model';
import { useActiveReadingTimer } from '../hooks/useActiveReadingTimer';
import { LessonStudentNoteService } from '../services/LessonStudentNoteService';
import { LessonQuestionService } from '../services/LessonQuestionService';
import { LessonStudentNotesPanel } from './LessonStudentNotesPanel';
import { LessonQuestionsPanel } from './LessonQuestionsPanel';

const { Title, Text } = Typography;

const THEME_PREF_KEY = 'lak_lesson_reader_theme_v1';
const FONTSIZE_PREF_KEY = 'lak_lesson_reader_fontsize_v1';

/**
 * LessonBookReaderModal — Trình Đọc Sách Toàn Màn Hình (100vw × 100vh) cho Người Học (`student`)
 * - Phase 1: Full-screen Book Canvas, Close/ESC, A-/A+, Light/Sepia/Night, Active Reading Timer 3 lớp chống treo máy.
 * - Phase 2: Bố cục 2 cột Desktop (65% Trang Sách / 35% Ghi Chú & Hỏi GV) + Mobile Sticky Bottom Bar & Bottom Sheet.
 * - Đảm bảo Zero Overflow-X trên cả Desktop (1366px) & Mobile (390px).
 */
export const LessonBookReaderModal = ({
  open = false,
  onClose = null,
  classItem = null,
  lessonPrep = null,
  studentUser = null,
  isStudentRole = true,
  initialLog = null,
  initialTab = 'notes',
  onLogUpdated = null,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef(null);

  const [themeKey, setThemeKey] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_PREF_KEY);
      return saved && READER_THEMES[saved] ? saved : 'sepia';
    } catch {
      return 'sepia';
    }
  });

  const [fontSize, setFontSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(FONTSIZE_PREF_KEY));
      return READER_FONT_SIZES.includes(saved) ? saved : 16;
    } catch {
      return 16;
    }
  });

  const [closing, setClosing] = useState(false);

  // Phase 2 State: Notes & Q&A + Anchor selection + Mobile Bottom Sheet
  const [activeSideTab, setActiveSideTab] = useState(initialTab || 'notes');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState(null);
  const [notes, setNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [liveReadingLog, setLiveReadingLog] = useState(initialLog || null);

  useEffect(() => {
    setLiveReadingLog(initialLog || null);
  }, [initialLog]);

  const effectiveLog = liveReadingLog || initialLog || null;

  const handleMergedLogUpdated = (updatedLog) => {
    if (updatedLog) {
      setLiveReadingLog(updatedLog);
    }
    onLogUpdated?.(updatedLog);
  };

  const theme = READER_THEMES[themeKey] || READER_THEMES.sepia;
  const objectives = Array.isArray(lessonPrep?.objectives) ? lessonPrep.objectives : [];
  const classId = classItem?.id || classItem?.code;
  const studentId = studentUser?.id || studentUser?.code;

  // Khởi chạy bộ đếm thời gian đọc thực tế (Hand-Off: tạm dừng ngay khi mở MaterialPreviewModal để 0% cộng đúp giờ!)
  const timer = useActiveReadingTimer({
    open,
    enabled: Boolean(open && isStudentRole && lessonPrep && classItem && studentUser),
    pausedExternally: Boolean(previewMaterial),
    classItem,
    lessonPrep,
    studentUser,
    initialLog: effectiveLog,
    onLogUpdated: handleMergedLogUpdated,
  });

  const statusMeta = getPrepStatusMeta(timer.prepStatus, isEnglish);

  // Đồng bộ initialTab khi mở từ deep-link Notification (VD: ?openReader=1&qaId=...)
  useEffect(() => {
    if (open && initialTab) {
      setActiveSideTab(initialTab);
    }
  }, [open, initialTab]);

  // Nạp danh sách Ghi chú cá nhân & Câu hỏi Q&A khi mở Reader
  useEffect(() => {
    if (!open || !isStudentRole || !classId || !studentId || !lessonPrep) return;
    let mounted = true;
    const sessionIdx = lessonPrep.sessionIndex || 1;

    Promise.all([
      LessonStudentNoteService.getNotesForLesson({ classId, sessionIndex: sessionIdx, studentId }),
      LessonQuestionService.getQuestionsForStudent({ classId, sessionIndex: sessionIdx, studentId }),
    ])
      .then(([noteList, qaList]) => {
        if (mounted) {
          setNotes(noteList || []);
          setQuestions(qaList || []);
        }
      })
      .catch((err) => console.warn('[LessonBookReaderModal] Lỗi tải Notes/Q&A:', err?.message));

    return () => {
      mounted = false;
    };
  }, [open, isStudentRole, classId, studentId, lessonPrep?.sessionIndex]);

  // Khóa cuộn body phía sau khi mở trình đọc sách toàn màn hình
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Kiểm tra mức độ bao phủ cuộn ban đầu khi vừa mở
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      if (scrollContainerRef.current) {
        timer.handleScrollElement(scrollContainerRef.current);
      }
    }, 180);
    return () => clearTimeout(id);
  }, [open, lessonPrep?.sessionIndex]);

  const handleSelectTheme = (key) => {
    setThemeKey(key);
    try {
      localStorage.setItem(THEME_PREF_KEY, key);
    } catch {
      // ignore
    }
  };

  const handleAdjustFontSize = (delta) => {
    const idx = READER_FONT_SIZES.indexOf(fontSize);
    const nextIdx = Math.max(0, Math.min(READER_FONT_SIZES.length - 1, idx + delta));
    const nextSize = READER_FONT_SIZES[nextIdx];
    setFontSize(nextSize);
    try {
      localStorage.setItem(FONTSIZE_PREF_KEY, String(nextSize));
    } catch {
      // ignore
    }
  };

  const handleSafeClose = async () => {
    if (closing) return;
    setClosing(true);
    try {
      if (isStudentRole) {
        await timer.flushNow({ force: true });
      }
    } finally {
      setClosing(false);
      setMobileSheetOpen(false);
      onClose?.();
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !mobileSheetOpen && !previewMaterial) {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closing, mobileSheetOpen, previewMaterial]);

  // Chọn 1 mục bài học để Ghi chú hoặc Hỏi Giáo viên ngay lập tức
  const handleQuickActionOnItem = (item, targetTab) => {
    const cleanText = String(item?.text || '').replace(/<[^>]+>/g, '').trim();
    setActiveAnchor({ index: item?.index ?? null, text: cleanText });
    setActiveSideTab(targetTab);
    if (isMobile) {
      setMobileSheetOpen(true);
    }
  };

  // Nhóm các dòng objectives theo tiêu đề phần (VD: READING, WRITING)
  const structuredSections = useMemo(() => {
    const sections = [];
    let current = { heading: null, items: [] };

    objectives.forEach((raw, rawIndex) => {
      if (isObjectiveSectionHeading(raw)) {
        if (current.heading || current.items.length > 0) {
          sections.push(current);
        }
        current = { heading: raw, headingIndex: rawIndex, items: [] };
      } else {
        current.items.push({ text: raw, index: rawIndex });
      }
    });

    if (current.heading || current.items.length > 0) {
      sections.push(current);
    }
    return sections;
  }, [objectives]);

  const handleConfirmFinished = async () => {
    await timer.confirmCompleted();
    if (timer.preClassSeconds >= timer.minRequiredSeconds) {
      message.success(
        isEnglish
          ? 'Awesome! Your pre-class reading completion has been saved.'
          : 'Tuyệt vời! Hệ thống đã ghi nhận con hoàn thành đọc chuẩn bị bài trước giờ học.'
      );
    } else {
      const remaining = Math.max(1, timer.minRequiredSeconds - timer.preClassSeconds);
      message.info(
        isEnglish
          ? `Progress saved! Read ${formatHumanDuration(remaining, true)} more to reach the full Pre-Class Prepared goal.`
          : `Đã lưu tiến độ! Con hãy đọc kỹ thêm ${formatHumanDuration(remaining, false)} để đạt trọn mốc Chuẩn bị bài tốt nhé.`
      );
    }
  };

  if (!open || !lessonPrep) return null;

  const answeredCount = questions.filter((q) => q.status === 'ANSWERED').length;

  const sideTabsItems = [
    {
      key: 'notes',
      label: (
        <span data-testid="tab-reader-notes" style={{ fontWeight: 700, fontSize: 13 }}>
          📝 {isEnglish ? 'My Notes' : 'Ghi chú'} ({notes.length})
        </span>
      ),
      children: (
        <LessonStudentNotesPanel
          notes={notes}
          onNotesChange={setNotes}
          classItem={classItem}
          lessonPrep={lessonPrep}
          studentUser={studentUser}
          activeAnchor={activeAnchor}
          onClearAnchor={() => setActiveAnchor(null)}
          theme={theme}
        />
      ),
    },
    {
      key: 'qa',
      label: (
        <span data-testid="tab-reader-qa" style={{ fontWeight: 700, fontSize: 13 }}>
          🙋 {isEnglish ? 'Ask Teacher' : 'Hỏi GV'} ({questions.length})
          {answeredCount > 0 && (
            <Badge
              count={answeredCount}
              size="small"
              style={{ backgroundColor: '#16a34a', marginLeft: 5 }}
            />
          )}
        </span>
      ),
      children: (
        <LessonQuestionsPanel
          questions={questions}
          onQuestionsChange={setQuestions}
          classItem={classItem}
          lessonPrep={lessonPrep}
          studentUser={studentUser}
          activeAnchor={activeAnchor}
          onClearAnchor={() => setActiveAnchor(null)}
          theme={theme}
        />
      ),
    },
  ];

  const readerOverlay = (
    <div
      data-testid="lesson-book-reader-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label={isEnglish ? 'Lesson Book Reader' : 'Trình Đọc Sách Bài Học'}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.pageBg,
        color: theme.textPrimary,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. READER TOP BAR */}
      <header
        data-testid="lesson-book-reader-topbar"
        style={{
          backgroundColor: theme.headerBg,
          borderBottom: `1px solid ${theme.headerBorder}`,
          padding: isMobile ? '8px 10px' : '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isMobile ? 6 : 12,
          flexShrink: 0,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: isMobile ? '1 1 65%' : '0 1 auto' }}>
          <Tag
            style={{
              margin: 0,
              backgroundColor: '#7e22ce',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              borderRadius: 6,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            📖 {classItem?.id || classItem?.code || 'CLASS'}
          </Tag>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 13 : 14,
                color: theme.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {classItem?.name || 'Lesson Reader'}
            </div>
            <div style={{ fontSize: 11, color: theme.textSecondary, whiteSpace: 'nowrap' }}>
              {isEnglish
                ? `Session ${lessonPrep.sessionIndex} • ${lessonPrep.authorName || classItem?.teacherName || ''}`
                : `Buổi ${lessonPrep.sessionIndex} • ${lessonPrep.authorName || classItem?.teacherName || ''}`}
            </div>
          </div>
        </div>

        {isMobile && (
          <Button
            type="primary"
            danger
            icon={<CloseOutlined />}
            loading={closing}
            onClick={handleSafeClose}
            data-testid="btn-close-lesson-book-reader"
            style={{ minHeight: 40, minWidth: 44, borderRadius: 8, fontWeight: 700, flexShrink: 0 }}
          >
            {isEnglish ? 'Close' : 'Đóng'}
          </Button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 6 : 10,
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'space-between' : 'center',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {/* Chỉnh cỡ chữ */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: `1px solid ${theme.headerBorder}`,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: theme.canvasBg,
            }}
          >
            <Tooltip title={isEnglish ? 'Decrease font size' : 'Giảm cỡ chữ'}>
              <Button
                type="text"
                size="small"
                disabled={fontSize <= READER_FONT_SIZES[0]}
                onClick={() => handleAdjustFontSize(-1)}
                data-testid="btn-reader-font-decrease"
                style={{ color: theme.textPrimary, fontWeight: 700, height: 32, padding: '0 8px' }}
              >
                A-
              </Button>
            </Tooltip>
            <span style={{ fontSize: 11, color: theme.textSecondary, padding: '0 4px', whiteSpace: 'nowrap' }}>
              <FontSizeOutlined /> {fontSize}
            </span>
            <Tooltip title={isEnglish ? 'Increase font size' : 'Tăng cỡ chữ'}>
              <Button
                type="text"
                size="small"
                disabled={fontSize >= READER_FONT_SIZES[READER_FONT_SIZES.length - 1]}
                onClick={() => handleAdjustFontSize(1)}
                data-testid="btn-reader-font-increase"
                style={{ color: theme.textPrimary, fontWeight: 700, height: 32, padding: '0 8px' }}
              >
                A+
              </Button>
            </Tooltip>
          </div>

          {/* Chọn chế độ giấy đọc */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 3,
              border: `1px solid ${theme.headerBorder}`,
              borderRadius: 8,
              backgroundColor: theme.canvasBg,
            }}
          >
            {Object.values(READER_THEMES).map((tItem) => {
              const active = tItem.key === themeKey;
              return (
                <button
                  key={tItem.key}
                  type="button"
                  data-testid={`btn-reader-theme-${tItem.key}`}
                  onClick={() => handleSelectTheme(tItem.key)}
                  style={{
                    border: active ? '1.5px solid #7e22ce' : '1px solid transparent',
                    backgroundColor: active ? (themeKey === 'dark' ? '#312e81' : '#f3e8ff') : 'transparent',
                    color: theme.textPrimary,
                    borderRadius: 6,
                    padding: isMobile ? '4px 7px' : '4px 9px',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tItem.icon} {!isMobile ? (isEnglish ? tItem.labelEn : tItem.labelVi) : ''}
                </button>
              );
            })}
          </div>

          {/* Đồng hồ Active Reading */}
          {isStudentRole && (
            <div
              data-testid="lesson-reader-active-timer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                backgroundColor: timer.isTracking ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${timer.isTracking ? '#86efac' : '#fcd34d'}`,
                color: timer.isTracking ? '#15803d' : '#b45309',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {timer.isTracking ? <ClockCircleOutlined /> : <PauseCircleOutlined />}
              <span data-testid="lesson-reader-timer-clock">{formatClockDuration(timer.totalSeconds)}</span>
              <span style={{ opacity: 0.75, fontWeight: 500 }}>
                / {formatClockDuration(timer.minRequiredSeconds)}
              </span>
              <span
                data-testid="lesson-reader-scroll-pct"
                style={{ padding: '1px 6px', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.06)', fontSize: 11 }}
              >
                {timer.maxScrollPercent}%
              </span>
            </div>
          )}
        </div>

        {!isMobile && (
          <Button
            type="primary"
            danger
            icon={<CloseOutlined />}
            loading={closing}
            onClick={handleSafeClose}
            data-testid="btn-close-lesson-book-reader"
            style={{ minHeight: 40, padding: '0 16px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}
          >
            {isEnglish ? 'Close Reader' : 'Đóng (Close)'}
          </Button>
        )}
      </header>

      {/* Thanh tiến độ mảnh dưới Top Bar */}
      {isStudentRole && (
        <div style={{ width: '100%', height: 4, backgroundColor: theme.headerBorder, flexShrink: 0 }}>
          <div
            style={{
              width: `${timer.progressPercent}%`,
              height: '100%',
              backgroundColor: timer.prepStatus === PREP_STATUS.PREPARED ? '#16a34a' : '#9333ea',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {/* Banner nhắc khi treo máy Idle >= 60s */}
      {isStudentRole && timer.isIdle && (
        <div style={{ padding: '8px 16px', flexShrink: 0 }} data-testid="lesson-reader-idle-banner">
          <Alert
            type="warning"
            showIcon
            message={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span>
                  {isEnglish
                    ? 'Reading timer paused due to inactivity (60s). Tap to continue reading!'
                    : 'Đồng hồ đọc tạm dừng vì chưa có thao tác trong 60 giây. Con vẫn đang đọc bài chứ?'}
                </span>
                <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={timer.resumeFromIdle}>
                  {isEnglish ? 'Resume Reading' : 'Tiếp tục đọc'}
                </Button>
              </div>
            }
          />
        </div>
      )}

      {/* 2. PHẦN THÂN CHIA 2 CỘT DESKTOP (65% SÁCH / 35% NOTES & Q&A) HOẶC 1 CỘT MOBILE */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* CỘT TRÁI: TRANG SÁCH ĐỌC CHÍNH (READING CANVAS) */}
        <main
          ref={scrollContainerRef}
          onScroll={(e) => timer.handleScrollElement(e.currentTarget)}
          data-testid="lesson-book-reader-canvas"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '12px 10px 24px' : '24px 24px 48px',
            boxSizing: 'border-box',
          }}
        >
          <article
            style={{
              maxWidth: 740,
              margin: '0 auto',
              backgroundColor: theme.canvasBg,
              border: `1px solid ${theme.canvasBorder}`,
              borderRadius: isMobile ? 12 : 16,
              padding: isMobile ? '16px 12px' : '30px 36px',
              boxShadow: themeKey === 'dark' ? '0 8px 30px rgba(0,0,0,0.45)' : '0 8px 28px rgba(15,23,42,0.06)',
              boxSizing: 'border-box',
            }}
          >
            {/* Meta Chương Sách */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: `1px solid ${theme.canvasBorder}`,
              }}
            >
              <Space size={6} wrap>
                <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                  <BookOutlined /> {isEnglish ? `Session ${lessonPrep.sessionIndex}` : `Buổi học ${lessonPrep.sessionIndex}`}
                </Tag>
                {lessonPrep.unitWeek && (
                  <Tag color="geekblue" style={{ margin: 0, borderRadius: 6 }}>{lessonPrep.unitWeek}</Tag>
                )}
                {lessonPrep.date && (
                  <Tag style={{ margin: 0, borderRadius: 6 }}>📅 {lessonPrep.date}</Tag>
                )}
              </Space>

              {isStudentRole && (
                <Tag
                  data-testid="reader-prep-status-tag"
                  style={{
                    margin: 0,
                    borderRadius: 6,
                    fontWeight: 700,
                    backgroundColor: statusMeta.bg,
                    borderColor: statusMeta.border,
                    color: statusMeta.textColor,
                  }}
                >
                  {statusMeta.icon} {statusMeta.label}
                </Tag>
              )}
            </div>

            {lessonPrep.lessonTitle && (
              <Title
                level={2}
                style={{
                  color: theme.textPrimary,
                  fontSize: isMobile ? fontSize + 4 : fontSize + 7,
                  lineHeight: 1.38,
                  marginTop: 0,
                  marginBottom: 18,
                  fontFamily: themeKey === 'sepia' ? 'Georgia, "Times New Roman", serif' : 'inherit',
                }}
              >
                {lessonPrep.lessonTitle}
              </Title>
            )}

            {(lessonPrep.readingDailyTime || lessonPrep.writingDailyTime) && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '3px 9px', borderRadius: 999, backgroundColor: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {lessonPrep.readingDailyTime || '60+ mins'}
                  </span>
                  <Text strong style={{ color: theme.textPrimary, fontSize: 13 }}>
                    {isEnglish ? 'Reading Goals' : 'Mục Tiêu Đọc Hiểu'}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '3px 9px', borderRadius: 999, backgroundColor: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {lessonPrep.writingDailyTime || '30+ mins'}
                  </span>
                  <Text strong style={{ color: theme.textPrimary, fontSize: 13 }}>
                    {isEnglish ? 'Writing Goals' : 'Mục Tiêu Viết & Ngữ Pháp'}
                  </Text>
                </div>
              </div>
            )}

            {/* Danh sách mục tiêu đầy đủ — Mỗi mục có nút nhanh 📝 Ghi chú & 🙋 Hỏi GV */}
            {structuredSections.length > 0 && (
              <section style={{ marginBottom: 24 }} data-testid="reader-full-objectives-list">
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    color: theme.cardAccent,
                    marginBottom: 12,
                  }}
                >
                  🎯 {isEnglish
                    ? `Full Lesson Objectives & Content (${objectives.length} items)`
                    : `Nội Dung & Mục Tiêu Bài Học Đầy Đủ (${objectives.length} mục)`}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {structuredSections.map((sec, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        padding: isMobile ? '12px' : '16px 18px',
                        borderRadius: 12,
                        backgroundColor: theme.cardBg,
                        border: `1px solid ${theme.cardBorder}`,
                      }}
                    >
                      {sec.heading && (
                        <div
                          style={{
                            fontSize: fontSize + 1,
                            fontWeight: 800,
                            color: theme.cardAccent,
                            marginBottom: 10,
                            paddingBottom: 6,
                            borderBottom: `1px dashed ${theme.cardBorder}`,
                          }}
                        >
                          <FormattedText content={sec.heading} />
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sec.items.map((item) => (
                          <div
                            key={item.index}
                            data-testid={`reader-objective-item-${item.index}`}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '6px 8px',
                              borderRadius: 8,
                              backgroundColor: themeKey === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
                              fontSize,
                              lineHeight: 1.65,
                              color: theme.textPrimary,
                              fontFamily: themeKey === 'sepia' ? 'Georgia, "Times New Roman", serif' : 'inherit',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ marginRight: 6, opacity: 0.6 }}>•</span>
                              <FormattedText content={item.text} />
                            </div>

                            {isStudentRole && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <Tooltip title={isEnglish ? 'Take note on this item' : 'Ghi chú cho mục này'}>
                                  <button
                                    type="button"
                                    data-testid={`btn-anchor-note-${item.index}`}
                                    onClick={() => handleQuickActionOnItem(item, 'notes')}
                                    style={{
                                      border: `1px solid ${theme.cardBorder}`,
                                      backgroundColor: theme.canvasBg,
                                      borderRadius: 6,
                                      padding: '2px 6px',
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      minHeight: 28,
                                      minWidth: 28,
                                    }}
                                  >
                                    📝
                                  </button>
                                </Tooltip>
                                <Tooltip title={isEnglish ? 'Ask teacher about this' : 'Hỏi giáo viên về phần này'}>
                                  <button
                                    type="button"
                                    data-testid={`btn-anchor-qa-${item.index}`}
                                    onClick={() => handleQuickActionOnItem(item, 'qa')}
                                    style={{
                                      border: `1px solid ${theme.cardBorder}`,
                                      backgroundColor: theme.canvasBg,
                                      borderRadius: 6,
                                      padding: '2px 6px',
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      minHeight: 28,
                                      minWidth: 28,
                                    }}
                                  >
                                    🙋
                                  </button>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {lessonPrep.studentPrep && (
              <section
                style={{
                  padding: isMobile ? '14px' : '16px 18px',
                  borderRadius: 12,
                  backgroundColor: theme.prepBg,
                  border: `1px solid ${theme.prepBorder}`,
                  marginBottom: 16,
                }}
                data-testid="reader-student-prep-section"
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.prepText, marginBottom: 6 }}>
                  📖 {isEnglish ? 'Student Pre-Class Reading & Preparation' : 'Nội Dung Học Sinh Cần Chuẩn Bị Trước Khi Lên Lớp'}
                </div>
                <div style={{ fontSize, lineHeight: 1.7, color: theme.prepText, fontWeight: 600, whiteSpace: 'pre-line' }}>
                  {lessonPrep.studentPrep}
                </div>
              </section>
            )}

            {lessonPrep.homework && (
              <section
                style={{
                  padding: isMobile ? '14px' : '16px 18px',
                  borderRadius: 12,
                  backgroundColor: theme.hwBg,
                  border: `1px solid ${theme.hwBorder}`,
                  marginBottom: 16,
                }}
                data-testid="reader-homework-section"
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.hwText, marginBottom: 6 }}>
                  📚 {isEnglish ? 'Assigned Homework' : 'Bài Tập Giáo Viên Giao Về Nhà'}
                </div>
                <div style={{ fontSize, lineHeight: 1.7, color: theme.hwText, fontWeight: 600, whiteSpace: 'pre-line' }}>
                  {lessonPrep.homework}
                </div>
              </section>
            )}

            {Array.isArray(lessonPrep.attachedMaterials) && lessonPrep.attachedMaterials.length > 0 && (
              <section
                data-testid="reader-attached-materials-section"
                style={{
                  padding: isMobile ? '14px' : '16px 18px',
                  borderRadius: 12,
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.cardAccent, marginBottom: 10 }}>
                  📎 {isEnglish
                    ? `Attached Lesson Materials (${lessonPrep.attachedMaterials.length})`
                    : `Tài Liệu Đính Kèm Buổi Học (${lessonPrep.attachedMaterials.length})`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lessonPrep.attachedMaterials.map((mat, idx) => {
                    const matLog = effectiveLog?.materialLogs?.[String(mat.id)] || null;
                    const matSec = Number(matLog?.activeSeconds) || 0;
                    const matDone = Boolean(matLog?.completed);
                    return (
                      <div
                        key={`${mat.id || idx}_${idx}`}
                        data-testid={`reader-attached-material-${mat.id || idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: isMobile ? 'stretch' : 'center',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 10,
                          backgroundColor: '#ffffff',
                          border: `1px solid ${matDone ? '#86efac' : '#d8b4fe'}`,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Tag color={mat.type === 'AUDIO' ? 'orange' : 'purple'} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                              {mat.type || 'PDF'}
                            </Tag>
                            <Text strong style={{ fontSize: 13, color: '#581c87' }}>
                              {mat.title}
                            </Text>
                            {isStudentRole && (
                              <Tag
                                color={matDone ? 'success' : matSec > 0 ? 'warning' : 'default'}
                                data-testid={`reader-material-progress-${mat.id || idx}`}
                                style={{ margin: 0, fontSize: 10, fontWeight: 700 }}
                              >
                                {matDone
                                  ? `✅ ${formatHumanDuration(matSec, isEnglish)}`
                                  : matSec > 0
                                  ? `🟡 ${formatHumanDuration(matSec, isEnglish)}`
                                  : isEnglish
                                  ? '⚪ Not viewed'
                                  : '⚪ Chưa xem'}
                              </Tag>
                            )}
                          </div>
                          {mat.pageLocation && (
                            <div style={{ marginTop: 4, fontSize: 12, color: '#b45309', fontWeight: 700 }}>
                              📍 {isEnglish ? 'Read / Check at:' : 'Xem tại vị trí:'} {mat.pageLocation}
                            </div>
                          )}
                        </div>

                        {mat.url && (
                          <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() =>
                              setPreviewMaterial({
                                ...mat,
                                courseName: classItem?.name || classItem?.courseName || '',
                              })
                            }
                            data-testid={`btn-reader-preview-material-${mat.id || idx}`}
                            style={{
                              borderRadius: 6,
                              fontWeight: 700,
                              backgroundColor: '#7e22ce',
                              borderColor: '#7e22ce',
                              minHeight: 34,
                              width: isMobile ? '100%' : 'auto',
                            }}
                          >
                            {isEnglish ? 'Preview Material' : 'Xem Trước Tài Liệu'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {lessonPrep.slideLink && (
              <div style={{ marginBottom: 20 }}>
                <Button
                  type="primary"
                  ghost
                  href={lessonPrep.slideLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<GlobalOutlined />}
                  style={{ borderRadius: 8, fontWeight: 600, minHeight: 40 }}
                >
                  {isEnglish ? 'Open Interactive Presentation Slides' : 'Mở Slide Bài Giảng Trực Tuyến'}
                </Button>
              </div>
            )}

            {/* Khối Tổng Kết & Xác Nhận Đọc Xong */}
            {isStudentRole && (
              <div
                data-testid="reader-completion-footer"
                style={{
                  marginTop: 22,
                  padding: isMobile ? '14px' : '18px 20px',
                  borderRadius: 12,
                  backgroundColor: theme.pageBg,
                  border: `1.5px solid ${timer.prepStatus === PREP_STATUS.PREPARED ? '#86efac' : theme.cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div>
                    <Text strong style={{ color: theme.textPrimary, fontSize: 14, display: 'block' }}>
                      {isEnglish ? 'Pre-Class Preparation Tracker' : 'Ghi Nhận Thời Gian Đọc Chuẩn Bị Bài'}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {isEnglish
                        ? `Goal: Read actively for ${formatHumanDuration(timer.minRequiredSeconds, true)} & scroll ≥ 80% of the lesson.`
                        : `Tiêu chuẩn đạt: Đọc thực tế tối thiểu ${formatHumanDuration(timer.minRequiredSeconds, false)} & xem ≥ 80% nội dung bài học.`}
                    </Text>
                  </div>
                  <Text strong style={{ color: '#7e22ce', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {formatHumanDuration(timer.preClassSeconds, isEnglish)} / {formatHumanDuration(timer.minRequiredSeconds, isEnglish)} • {timer.maxScrollPercent}%
                  </Text>
                </div>

                <Progress
                  percent={timer.progressPercent}
                  strokeColor={timer.prepStatus === PREP_STATUS.PREPARED ? '#16a34a' : '#7e22ce'}
                  style={{ marginBottom: 14 }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={timer.isSaving}
                    onClick={handleConfirmFinished}
                    data-testid="btn-confirm-lesson-read"
                    style={{
                      backgroundColor: '#16a34a',
                      borderColor: '#16a34a',
                      borderRadius: 8,
                      fontWeight: 700,
                      minHeight: 42,
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    {timer.completedConfirmedAt
                      ? isEnglish
                        ? 'Reading Confirmed — Save Latest Progress'
                        : 'Đã Xác Nhận Đọc Bài — Cập Nhật Tiến Độ'
                      : isEnglish
                      ? 'I Have Finished Reading This Lesson'
                      : 'Con Đã Đọc Hiểu Xong Bài Học Này'}
                  </Button>

                  <Button
                    onClick={handleSafeClose}
                    loading={closing}
                    style={{ borderRadius: 8, fontWeight: 600, minHeight: 42, width: isMobile ? '100%' : 'auto' }}
                  >
                    {isEnglish ? 'Save & Close Reader' : 'Lưu Thời Gian & Đóng'}
                  </Button>
                </div>
              </div>
            )}
          </article>
        </main>

        {/* CỘT PHẢI DESKTOP (35%): BẢNG GHI CHÚ & HỎI GIÁO VIÊN */}
        {!isMobile && isStudentRole && (
          <aside
            data-testid="lesson-reader-desktop-sidebar"
            style={{
              width: '35%',
              minWidth: 340,
              maxWidth: 440,
              backgroundColor: theme.sidebarBg || theme.headerBg,
              borderLeft: `1px solid ${theme.headerBorder}`,
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <Tabs
              activeKey={activeSideTab}
              onChange={setActiveSideTab}
              items={sideTabsItems}
              size="middle"
              style={{ flex: 1 }}
            />
          </aside>
        )}
      </div>

      {/* 3. THANH ĐÁY MOBILE (STICKY BOTTOM ACTION BAR) + BOTTOM SHEET DRAWER */}
      {isMobile && isStudentRole && (
        <>
          <footer
            data-testid="lesson-reader-mobile-bottom-bar"
            style={{
              backgroundColor: theme.headerBg,
              borderTop: `1px solid ${theme.headerBorder}`,
              padding: '8px 10px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              flexShrink: 0,
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            <Button
              type={activeSideTab === 'notes' && mobileSheetOpen ? 'primary' : 'default'}
              icon={<FormOutlined />}
              data-testid="btn-mobile-open-notes"
              onClick={() => {
                setActiveSideTab('notes');
                setMobileSheetOpen(true);
              }}
              style={{ minHeight: 44, borderRadius: 8, fontWeight: 700 }}
            >
              {isEnglish ? `Notes (${notes.length})` : `Ghi chú (${notes.length})`}
            </Button>

            <Button
              type={activeSideTab === 'qa' && mobileSheetOpen ? 'primary' : 'default'}
              icon={<QuestionCircleOutlined />}
              data-testid="btn-mobile-open-qa"
              onClick={() => {
                setActiveSideTab('qa');
                setMobileSheetOpen(true);
              }}
              style={{
                minHeight: 44,
                borderRadius: 8,
                fontWeight: 700,
                borderColor: '#2563eb',
                color: activeSideTab === 'qa' && mobileSheetOpen ? '#ffffff' : '#2563eb',
              }}
            >
              {isEnglish ? `Ask Teacher (${questions.length})` : `Hỏi GV (${questions.length})`}
            </Button>
          </footer>

          <Drawer
            placement="bottom"
            height="78vh"
            open={mobileSheetOpen}
            onClose={() => setMobileSheetOpen(false)}
            zIndex={1060}
            title={
              activeSideTab === 'notes'
                ? isEnglish
                  ? '📝 My Study Notes'
                  : '📝 Ghi Chú Cá Nhân Của Con'
                : isEnglish
                ? '🙋 Ask Your Teacher (Q&A)'
                : '🙋 Hỏi Giáo Viên (Q&A)'
            }
            styles={{ body: { padding: '12px 14px' } }}
          >
            <Tabs
              activeKey={activeSideTab}
              onChange={setActiveSideTab}
              items={sideTabsItems}
              size="small"
            />
          </Drawer>
        </>
      )}
      <MaterialPreviewModal
        open={Boolean(previewMaterial)}
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        zIndex={1250}
        trackingContext={
          isStudentRole && previewMaterial
            ? {
                enabled: true,
                classItem,
                lessonPrep,
                studentUser,
                initialMaterialLog: effectiveLog?.materialLogs?.[String(previewMaterial.id)] || null,
                onLogUpdated: handleMergedLogUpdated,
              }
            : null
        }
      />
    </div>
  );

  return ReactDOM.createPortal(readerOverlay, document.body);
};

export default LessonBookReaderModal;
