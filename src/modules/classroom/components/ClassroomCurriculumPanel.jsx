import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  BookOutlined,
  CustomerServiceOutlined,
  EditOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  LinkOutlined,
  PlusOutlined,
  RightOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { FormattedText } from '../../../shared/components/controls';
import { LESSON_PLAN_STATUS } from '../../../shared/models/classroom.model';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';

const { Text, Title, Paragraph } = Typography;

export const ClassroomCurriculumPanel = ({
  cls,
  lessonPlans = {},
  currentSessionIndex = null,
  userRole = 'teacher',
  courseMaterials = [],
  onOpenEditor,
  onOpenCourseUpload,
}) => {
  const { t, isEnglish } = useLanguage();

  // 1. Tự động tính toán các buổi học thực tế của lớp theo thời khóa biểu (hỗ trợ quy mô 60-100+ buổi)
  const totalSessionsCount = useMemo(() => {
    return Math.max(Number(cls?.totalSessions) || 60, 60);
  }, [cls?.totalSessions]);

  const scheduleSessions = useMemo(() => {
    return generateClassSessionDates(cls, totalSessionsCount, isEnglish);
  }, [cls, totalSessionsCount, isEnglish]);

  // 2. Danh sách toàn bộ các số buổi (kết hợp các buổi đã soạn và toàn bộ TKB)
  const allSessionIndices = useMemo(() => {
    const planKeys = Object.keys(lessonPlans).map(Number).filter((n) => !Number.isNaN(n) && n > 0);
    const schedIndices = scheduleSessions.map((s) => s.sessionIndex);
    const merged = Array.from(new Set([...planKeys, ...schedIndices, 1])).sort((a, b) => a - b);
    return merged;
  }, [lessonPlans, scheduleSessions]);

  // Mặc định chọn buổi hôm nay nếu có, hoặc buổi 1 (khai giảng)
  const [selectedSession, setSelectedSession] = useState(currentSessionIndex || 1);

  // Bộ lọc trạng thái: 'all' | 'planned' | 'unplanned'
  const [statusFilter, setStatusFilter] = useState('all');

  const isTeacherOrAcademic = ['teacher', 'academic', 'admin', 'director'].includes(userRole);
  const isStudent = userRole === 'student';

  // Đếm số buổi đã soạn và chưa soạn
  const plannedCount = useMemo(() => {
    return allSessionIndices.filter((idx) => Boolean(lessonPlans[idx])).length;
  }, [allSessionIndices, lessonPlans]);
  const unplannedCount = Math.max(0, allSessionIndices.length - plannedCount);

  // Danh sách buổi hiển thị trên timeline carousel theo bộ lọc
  const visiblePillIndices = useMemo(() => {
    if (statusFilter === 'planned') {
      return allSessionIndices.filter((idx) => Boolean(lessonPlans[idx]));
    }
    if (statusFilter === 'unplanned') {
      return allSessionIndices.filter((idx) => !lessonPlans[idx]);
    }
    return allSessionIndices;
  }, [allSessionIndices, statusFilter, lessonPlans]);

  // Điều hướng 1-chạm Buổi Trước / Buổi Sau
  const currentPos = allSessionIndices.indexOf(selectedSession);
  const hasPrev = currentPos > 0;
  const hasNext = currentPos >= 0 && currentPos < allSessionIndices.length - 1;

  const handlePrevSession = () => {
    if (hasPrev) setSelectedSession(allSessionIndices[currentPos - 1]);
  };

  const handleNextSession = () => {
    if (hasNext) setSelectedSession(allSessionIndices[currentPos + 1]);
  };

  // 3. 100% Real Database: Duyệt danh sách tài liệu thực tế của khóa học (loại bỏ hoàn toàn link dummy)
  const allMaterials = useMemo(() => {
    const seen = new Set();
    const unique = [];
    (courseMaterials || []).forEach((m, idx) => {
      const key = `${m.title}_${m.url}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({
          id: m.id || `mat-${idx}`,
          title: m.title || (isEnglish ? 'Course Document' : 'Tài Liệu Khóa Học'),
          type: m.type || 'PDF',
          url: m.url || '#',
          icon: m.type === 'AUDIO' ? <CustomerServiceOutlined /> : <FilePdfOutlined />,
          uploadedAt: m.uploadedAt,
          visibility: m.visibility,
        });
      }
    });
    return unique;
  }, [courseMaterials, isEnglish]);

  // 4. Lấy dữ liệu giáo án THỰC TẾ của buổi đang chọn (TUYỆT ĐỐI KHÔNG FAKE DỮ LIỆU)
  const realPlan = lessonPlans[selectedSession] || null;
  const selectedSched = scheduleSessions.find((s) => s.sessionIndex === selectedSession);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Multi-Session Lesson Plan Manager Bar */}
      <Card
        style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <Space orientation="horizontal" size="small">
              <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
                {isStudent
                  ? (t('classroom.studentPrepTag', isEnglish ? 'Student Lesson Prep' : 'Chuẩn Bị Bài Học') || (isEnglish ? 'Student Lesson Prep' : 'Chuẩn Bị Bài Học'))
                  : (t('classroom.multiSessionTag', isEnglish ? 'Multi-Session Planning' : 'Soạn Giáo Án Đa Buổi') || (isEnglish ? 'Multi-Session Planning' : 'Soạn Giáo Án Đa Buổi'))}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isStudent
                  ? (isEnglish ? 'Review required pre-readings and homework' : 'Xem bài cần đọc trước và bài tập về nhà')
                  : (isEnglish ? 'Teachers proactively prepare lesson plans across sessions' : 'Giáo viên chủ động chuẩn bị trước nhiều buổi học')}
              </Text>
            </Space>
            <Title level={5} style={{ margin: '4px 0 0 0', fontWeight: 700 }}>
              {isStudent
                ? (isEnglish ? 'Upcoming Lessons & Curriculum' : 'Kế Hoạch & Bài Học Sắp Tới')
                : (isEnglish ? 'Session Roadmaps & Lesson Plans' : 'Lộ Trình & Kế Hoạch Bài Giảng Từng Buổi')}
            </Title>
          </div>

          {isTeacherOrAcademic && (
            <Space orientation="horizontal" size="small" wrap>
              <Button
                type="primary"
                icon={<EditOutlined />}
                data-testid="btn-open-lesson-editor"
                style={{ borderRadius: 8, fontWeight: 600 }}
                onClick={() => onOpenEditor?.(realPlan ? realPlan : selectedSession)}
              >
                {realPlan
                  ? (t('classroom.editThisPlan', isEnglish ? 'Edit This Lesson Plan' : 'Soạn / Chỉnh Sửa Giáo Án') || (isEnglish ? 'Edit This Lesson Plan' : 'Soạn / Chỉnh Sửa Giáo Án'))
                  : (isEnglish ? `Prepare Session ${selectedSession} Plan` : `Soạn Giáo Án Buổi ${selectedSession}`)}
              </Button>
              <Button
                icon={<PlusOutlined />}
                data-testid="btn-add-session-plan"
                style={{ borderRadius: 8 }}
                onClick={() => {
                  const maxIndex = Math.max(...allSessionIndices, 0);
                  onOpenEditor?.(maxIndex + 1);
                }}
              >
                {t('classroom.addNextPlan', isEnglish ? 'Add New Plan' : 'Soạn Thêm Buổi Mới') || (isEnglish ? 'Add New Plan' : 'Soạn Thêm Buổi Mới')}
              </Button>
            </Space>
          )}
        </div>

        {/* 2. Scalable Navigation Controls for 100+ Sessions */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <Row gutter={[12, 10]} align="middle">
            {/* Quick Search & Jump Select */}
            <Col xs={24} sm={12} md={12}>
              <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>
                🔍 {t('classroom.selectSessionToPlan', isEnglish ? 'Jump to any session:' : 'Nhảy nhanh đến buổi học:') || (isEnglish ? 'Jump to any session:' : 'Nhảy nhanh đến buổi học:')}
              </Text>
              <Select
                showSearch
                data-testid="select-quick-jump-session"
                value={selectedSession}
                onChange={(val) => setSelectedSession(val)}
                placeholder={t('classroom.jumpToSession', isEnglish ? 'Jump to session...' : 'Nhảy nhanh đến buổi học...') || (isEnglish ? 'Jump to session...' : 'Nhảy nhanh đến buổi học...')}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={allSessionIndices.map((idx) => {
                  const p = lessonPlans[idx];
                  const sched = scheduleSessions.find((s) => s.sessionIndex === idx);
                  const hasPlan = Boolean(p);
                  const isToday = currentSessionIndex && idx === currentSessionIndex;
                  const statusIcon = isToday ? '🟢 ' : hasPlan ? '📘 ' : '⚪ ';
                  const statusText = hasPlan
                    ? `[${isEnglish ? 'Planned' : 'Đã soạn'}]`
                    : `[${isEnglish ? 'Unplanned' : 'Chưa soạn'}]`;
                  const dateText = sched?.date ? `• ${sched.date}` : '';
                  const unitText = sched?.unitWeek ? `— ${sched.unitWeek}` : '';
                  return {
                    value: idx,
                    label: `${statusIcon}${isEnglish ? `Session ${idx}` : `Buổi ${idx}`} ${dateText} ${statusText} ${unitText}`,
                  };
                })}
              />
            </Col>

            {/* Status Filter & 1-Touch Prev/Next */}
            <Col xs={24} sm={12} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <Segmented
                  size="middle"
                  data-testid="session-status-filter"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    {
                      label: `${t('classroom.allSessions', isEnglish ? 'All' : 'Tất cả') || (isEnglish ? 'All' : 'Tất cả')} (${allSessionIndices.length})`,
                      value: 'all',
                    },
                    {
                      label: `📘 ${t('classroom.hasPlan', isEnglish ? 'Planned' : 'Đã soạn') || (isEnglish ? 'Planned' : 'Đã soạn')} (${plannedCount})`,
                      value: 'planned',
                    },
                    {
                      label: `⚪ ${t('classroom.noPlan', isEnglish ? 'Unplanned' : 'Chưa soạn') || (isEnglish ? 'Unplanned' : 'Chưa soạn')} (${unplannedCount})`,
                      value: 'unplanned',
                    },
                  ]}
                  style={{ borderRadius: 8, backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                />

                <Space size={6}>
                  <Button
                    size="middle"
                    icon={<LeftOutlined />}
                    disabled={!hasPrev}
                    onClick={handlePrevSession}
                    data-testid="btn-prev-session"
                    style={{ borderRadius: 8, height: 36, fontSize: 12 }}
                  >
                    {t('classroom.prevSession', isEnglish ? 'Prev' : 'Trước') || (isEnglish ? 'Prev' : 'Trước')}
                  </Button>
                  <Button
                    size="middle"
                    disabled={!hasNext}
                    onClick={handleNextSession}
                    data-testid="btn-next-session"
                    style={{ borderRadius: 8, height: 36, fontSize: 12 }}
                  >
                    {t('classroom.nextSession', isEnglish ? 'Next' : 'Sau') || (isEnglish ? 'Next' : 'Sau')} <RightOutlined />
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        {/* 3. Session Timeline Carousel Pills */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 6,
              scrollbarWidth: 'none',
            }}
          >
            {visiblePillIndices.map((idx) => {
              const p = lessonPlans[idx];
              const sched = scheduleSessions.find((s) => s.sessionIndex === idx);
              const isSelected = idx === selectedSession;
              const isToday = currentSessionIndex && idx === currentSessionIndex;
              const hasPlan = Boolean(p);
              const isReady = (p?.status || LESSON_PLAN_STATUS.READY) === LESSON_PLAN_STATUS.READY;

              const dateLabel = sched?.date ? `(${sched.date.slice(0, 5)})` : '';

              return (
                <Button
                  key={idx}
                  type={isSelected ? 'primary' : 'default'}
                  data-testid={`session-pill-${idx}`}
                  style={{
                    borderRadius: 10,
                    height: 36,
                    fontSize: 12,
                    fontWeight: isSelected || isToday ? 700 : 500,
                    borderStyle: hasPlan ? 'solid' : 'dashed',
                    borderColor: isSelected ? undefined : isToday ? '#52c41a' : hasPlan ? '#91caff' : '#d9d9d9',
                    backgroundColor: isSelected ? undefined : isToday ? '#f6ffed' : hasPlan ? '#f0f5ff' : '#fafafa',
                    color: isSelected ? undefined : isToday ? '#389e0d' : hasPlan ? '#1d39c4' : '#8c8c8c',
                    flexShrink: 0,
                    padding: '0 12px',
                  }}
                  onClick={() => setSelectedSession(idx)}
                >
                  {isToday ? '🟢' : hasPlan ? (isReady ? '📘' : '✏️') : '⚪'}{' '}
                  {isEnglish ? `Session ${idx}` : `Buổi ${idx}`} {dateLabel}{' '}
                  {hasPlan ? '✓' : ''}{' '}
                  {isToday ? (isEnglish ? '(Today)' : '(Hôm nay)') : ''}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 4. Active Selected Plan Details: REAL DATA vs. EMPTY STATE */}
        {realPlan ? (
          <div
            style={{
              backgroundColor: '#fafafa',
              border: '1px solid #e8e8e8',
              borderRadius: 12,
              padding: 16,
            }}
            data-testid="active-session-plan-card"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
              <Space orientation="horizontal" size="small" wrap>
                <Tag color="geekblue" style={{ fontSize: 13, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                  {isEnglish ? `Session ${selectedSession}` : `Buổi ${selectedSession}`}
                </Tag>
                <Text strong style={{ fontSize: 14, color: '#1d39c4' }}>
                  {realPlan.lessonTitle || (isEnglish ? `Session ${selectedSession} Syllabus` : `Kế hoạch bài học Buổi ${selectedSession}`)}
                </Text>
                {(realPlan.unitWeek || selectedSched?.unitWeek) && (
                  <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600 }}>
                    {realPlan.unitWeek || selectedSched?.unitWeek}
                  </Tag>
                )}
              </Space>

              <Space orientation="horizontal" size="small">
                {(realPlan.date || selectedSched?.date) && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    📅 {isEnglish ? 'Date: ' : 'Ngày: '}{realPlan.date || selectedSched?.date}
                  </Text>
                )}
                <Tag color={realPlan.status === LESSON_PLAN_STATUS.READY ? 'success' : 'warning'} style={{ borderRadius: 12, fontSize: 11 }}>
                  {realPlan.status === LESSON_PLAN_STATUS.READY
                    ? (isEnglish ? '🟢 Ready (Visible)' : '🟢 Sẵn Sàng (Học viên thấy)')
                    : (isEnglish ? '✏️ Draft (Teacher only)' : '✏️ Bản Nháp (Đang soạn dở)')}
                </Tag>
              </Space>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, height: '100%' }}>
                  <Text strong style={{ fontSize: 12, color: '#096dd9', display: 'block', marginBottom: 6 }}>
                    🎯 {isEnglish ? 'Lesson Objectives & Phonics:' : 'Mục Tiêu Bài Học & Ngữ Âm:'}
                  </Text>
                  <div style={{ fontSize: 12, color: '#262626', lineHeight: '20px', whiteSpace: 'pre-line' }}>
                    {Array.isArray(realPlan.objectives)
                      ? realPlan.objectives.map((obj, i) => (
                          <div key={i}>
                            <FormattedText content={obj} />
                          </div>
                        ))
                      : (
                          <FormattedText
                            content={realPlan.objectives}
                            fallback={isEnglish ? 'Objectives will be added by teacher.' : 'Mục tiêu đang được cập nhật.'}
                          />
                        )}
                  </div>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* McGraw-Hill Wonders Suggested Daily Time Benchmarks */}
                  <div
                    data-testid="wonders-daily-time-badges"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                      backgroundColor: '#f0f5ff',
                      border: '1px solid #adc6ff',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#096dd9',
                          color: '#ffffff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '0 4px',
                          textAlign: 'center',
                          boxShadow: '0 2px 4px rgba(9,109,217,0.25)',
                          flexShrink: 0,
                        }}
                      >
                        {realPlan.readingDailyTime || '60+ mins'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#096dd9' }}>
                        {isEnglish ? 'Reading Suggested Daily Time' : 'Đọc Gợi Ý / Ngày'}
                      </span>
                    </div>

                    <div style={{ width: 1, height: 18, backgroundColor: '#d9d9d9', margin: '0 4px' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#389e0d',
                          color: '#ffffff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '0 4px',
                          textAlign: 'center',
                          boxShadow: '0 2px 4px rgba(56,158,13,0.25)',
                          flexShrink: 0,
                        }}
                      >
                        {realPlan.writingDailyTime || '30+ mins'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#389e0d' }}>
                        {isEnglish ? 'Writing Suggested Daily Time' : 'Viết Gợi Ý / Ngày'}
                      </span>
                    </div>
                  </div>

                  {/* Học sinh chuẩn bị bài trước */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                    <Text strong style={{ fontSize: 12, color: '#389e0d', display: 'block', marginBottom: 4 }}>
                      📖 {isEnglish ? 'Student Pre-Class Reading:' : 'Học Sinh Đọc Chuẩn Bị (Student Prep):'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#262626', whiteSpace: 'pre-line', display: 'block' }}>
                      {realPlan.studentPrep || (isEnglish ? 'None required' : 'Không có yêu cầu chuẩn bị trước')}
                    </Text>
                  </div>

                  {/* Bài tập về nhà */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                    <Text strong style={{ fontSize: 12, color: '#cf1322', display: 'block', marginBottom: 4 }}>
                      📚 {isEnglish ? 'Homework & Practice Tasks:' : 'Bài Tập Về Nhà (Homework):'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#262626', whiteSpace: 'pre-line', display: 'block' }}>
                      {realPlan.homework || (isEnglish ? 'No homework assigned' : 'Chưa giao bài tập')}
                    </Text>
                  </div>

                  {/* Slide link nếu có */}
                  {realPlan.slideLink && (
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
                      <a href={realPlan.slideLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1677ff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <LinkOutlined /> {isEnglish ? 'Open Presentation Slides' : 'Mở Slide Bài Giảng Trực Tuyến'}
                      </a>
                    </div>
                  )}

                  {/* Ghi chú nội bộ giáo viên - ẨN HOÀN TOÀN ĐỐI VỚI HỌC VIÊN */}
                  {!isStudent && realPlan.teacherNotes && (
                    <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '6px 10px', borderRadius: 6, fontSize: 12, color: '#ad6800', fontStyle: 'italic' }}>
                      <strong>{isEnglish ? 'Teacher Internal Note: ' : 'Lưu ý nội bộ GV: '}</strong>"{realPlan.teacherNotes}"
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          /* Empty State khi buổi học chưa được soạn giáo án (100% Real DB) */
          <div
            data-testid="empty-session-plan-card"
            style={{
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: 12,
              padding: '36px 20px',
              textAlign: 'center',
            }}
          >
            <BookOutlined style={{ fontSize: 40, color: '#bfbfbf', marginBottom: 12 }} />
            <Title level={5} style={{ margin: '0 0 6px 0', color: '#1e293b', fontWeight: 700 }}>
              {isEnglish
                ? `Session ${selectedSession}: No Lesson Plan Prepared Yet`
                : `Buổi ${selectedSession}: Chưa Có Giáo Án Được Soạn`}
            </Title>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {selectedSched?.date && (
                <span>📅 {isEnglish ? `Scheduled Date: ${selectedSched.date}` : `Ngày giảng dạy dự kiến: ${selectedSched.date}`}</span>
              )}
              {selectedSched?.unitWeek && (
                <Tag color="cyan" style={{ marginLeft: 8, borderRadius: 4 }}>{selectedSched.unitWeek}</Tag>
              )}
            </div>

            {isTeacherOrAcademic ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                data-testid="btn-prepare-this-session-plan"
                style={{ borderRadius: 8, height: 38, padding: '0 20px', fontWeight: 600 }}
                onClick={() => onOpenEditor?.(selectedSession)}
              >
                {isEnglish
                  ? `Prepare Lesson Plan for Session ${selectedSession}`
                  : `Soạn Giáo Án Cho Buổi ${selectedSession}`}
              </Button>
            ) : (
              <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 460, margin: '0 auto' }}>
                {isEnglish
                  ? 'Teacher is preparing learning materials for this session. Please check back before class begins.'
                  : 'Giáo viên đang chuẩn bị học liệu cho buổi học này. Vui lòng quay lại trước giờ học để xem phần chuẩn bị bài.'}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 2. Course Program Curriculum Vault (100% Real Course Data) */}
      <Card
        id="curriculum-vault"
        data-testid="course-program-vault"
        style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
          <div>
            <Space orientation="horizontal" size="small">
              <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                📁 {isEnglish ? 'Course Program Vault' : 'Kho Giáo Trình Gốc Của Khóa Học'}
              </Title>
              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
                {cls?.courseLevel || cls?.level || 'Wonders G5'}
              </Tag>
            </Space>
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 12 }}>
              ⚡ <strong>{isEnglish ? 'Course Inheritance:' : 'Tự động kế thừa cho tất cả các lớp:'}</strong>{' '}
              {isEnglish
                ? 'Textbooks and materials uploaded to the parent course program are automatically available to all classes and teachers.'
                : 'Tài liệu giáo trình tải lên Khóa học cấp cha sẽ tự động hiển thị cho mọi giáo viên và học viên của các lớp thuộc khóa học này.'}
            </Paragraph>
            <div style={{ marginTop: 6, fontSize: 12, color: '#334155' }}>
              📚 <strong>{isEnglish ? 'Core Textbook: ' : 'Bộ giáo trình chính: '}</strong>
              <span style={{ color: '#1d39c4', fontWeight: 600 }}>
                {cls?.curriculumTextbooks || 'McGraw-Hill Wonders Literature Anthology & Reading/Writing Companion'}
              </span>
            </div>
          </div>

          {['academic', 'admin', 'director'].includes(userRole) && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', borderRadius: 8, fontWeight: 600 }}
              onClick={onOpenCourseUpload}
              data-testid="btn-academic-upload-course-vault"
            >
              {t('classroom.uploadToCourse', isEnglish ? 'Upload to Course Vault' : 'Tải Lên Giáo Trình Cho Khóa Học') || (isEnglish ? 'Upload to Course Vault' : 'Tải Lên Giáo Trình Cho Khóa Học')}
            </Button>
          )}
        </div>

        {allMaterials.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: 12, border: '1px dashed #d9d9d9' }} data-testid="empty-course-vault">
            <FolderOpenOutlined style={{ fontSize: 36, color: '#bfbfbf', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 4 }}>
              {isEnglish ? 'No digital course materials uploaded yet' : 'Chưa có tệp giáo trình số hoặc link Drive nào được tải lên cho Khóa học'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 440, margin: '0 auto' }}>
              {isEnglish
                ? 'Academic coordinators can upload course materials, Google Slides, or audio files using the button above.'
                : 'Giáo vụ có thể nhấn nút "Tải Lên Giáo Trình Cho Khóa Học" bên trên để đồng bộ tài liệu vào toàn bộ các lớp.'}
            </div>
          </div>
        ) : (
          <Row gutter={[12, 12]}>
            {allMaterials.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #d3adf7',
                    backgroundColor: '#f9f0ff',
                    color: '#262626',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                  }}
                  className="curriculum-drive-link-card"
                >
                  <Space orientation="horizontal" size="middle" style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: 18, color: item.type === 'AUDIO' ? '#fa8c16' : '#722ed1' }}>
                      {item.icon}
                    </span>
                    <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </Text>
                  </Space>
                  <LinkOutlined style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }} />
                </a>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};
