import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  ExpandOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReadOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { FormattedText } from '../../../shared/components/controls';
import { ClassRecordingsDirectoryCard } from '../../../shared/components/ClassRecordingsDirectoryCard';
import { LESSON_PLAN_STATUS } from '../../../shared/models/classroom.model';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';
import { MaterialPreviewModal } from '../../materials/components/MaterialPreviewModal';
import { SessionRecordingUploadModal } from '../../materials/components/SessionRecordingUploadModal';
import { StudentDashboardService } from '../../dashboard/services/StudentDashboardService';
import {
  LessonBookReaderModal,
  LessonReadingTrackerService,
  PREP_STATUS,
  computeMinRequiredSeconds,
  formatHumanDuration,
  getPrepStatusMeta,
} from '../../lesson-reader';

const { Text, Title, Paragraph } = Typography;

export const ClassroomCurriculumPanel = ({
  cls,
  lessonPlans = {},
  currentSessionIndex = null,
  userRole = 'teacher',
  currentUser = null,
  courseMaterials = [],
  parentCourseLevel = '',
  classRecordings = [],
  onClassRecordingUploaded,
  onDeleteClassRecording,
  onOpenEditor,
  onOpenCourseUpload,
  onDeleteCourseMaterial,
}) => {
  const { t, isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const [recordingUploadTarget, setRecordingUploadTarget] = useState(null);

  // 1. Tự động tính toán các buổi học thực tế của lớp theo thời khóa biểu (hỗ trợ nhập động số buổi hoặc mặc định 12 buổi)
  const totalSessionsCount = useMemo(() => {
    return Math.max(1, Number(cls?.totalSessions) || 12);
  }, [cls?.totalSessions]);

  const scheduleSessions = useMemo(() => {
    return generateClassSessionDates(cls, totalSessionsCount, isEnglish);
  }, [cls, totalSessionsCount, isEnglish]);

  const isTeacherOrAcademic = ['teacher', 'academic', 'admin', 'director'].includes(userRole);
  const isStudent = userRole === 'student';

  // Học viên chỉ thấy các buổi READY (ẩn bản nháp DRAFT của giáo viên)
  const visibleLessonPlans = useMemo(() => {
    if (!isStudent) return lessonPlans || {};
    const filtered = {};
    Object.entries(lessonPlans || {}).forEach(([k, p]) => {
      if (p && p.status !== LESSON_PLAN_STATUS.DRAFT) {
        filtered[k] = p;
      }
    });
    return filtered;
  }, [lessonPlans, isStudent]);

  // 2. Danh sách toàn bộ các số buổi (kết hợp các buổi đã soạn và toàn bộ TKB)
  const allSessionIndices = useMemo(() => {
    const planKeys = Object.keys(visibleLessonPlans).map(Number).filter((n) => !Number.isNaN(n) && n > 0);
    const schedIndices = scheduleSessions.map((s) => s.sessionIndex);
    const merged = Array.from(new Set([...planKeys, ...schedIndices, 1])).sort((a, b) => a - b);
    return merged;
  }, [visibleLessonPlans, scheduleSessions]);

  // Mặc định ưu tiên buổi hôm nay (nếu đã có giáo án), ngược lại chọn giáo án thông minh theo ngày dạy thực tế (VD: Buổi 3 ngày 23/11)
  const smartDefaultSession = useMemo(() => {
    if (currentSessionIndex && visibleLessonPlans[currentSessionIndex]) {
      return currentSessionIndex;
    }
    if (cls) {
      const smartPlan = StudentDashboardService.getLessonPreparationGuide({
        ...cls,
        lessonPlans: visibleLessonPlans,
      });
      if (smartPlan?.sessionIndex) return smartPlan.sessionIndex;
    }
    return currentSessionIndex || 1;
  }, [currentSessionIndex, cls, visibleLessonPlans]);

  const [selectedSession, setSelectedSession] = useState(smartDefaultSession);
  const [userHasManuallySwitched, setUserHasManuallySwitched] = useState(false);

  useEffect(() => {
    if (!userHasManuallySwitched && smartDefaultSession && smartDefaultSession !== selectedSession) {
      setSelectedSession(smartDefaultSession);
    }
  }, [smartDefaultSession, userHasManuallySwitched, selectedSession]);

  // Bộ lọc trạng thái: 'all' | 'planned' | 'unplanned'
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [bookReaderOpen, setBookReaderOpen] = useState(false);
  const [readingLogsMap, setReadingLogsMap] = useState(() =>
    isStudent ? LessonReadingTrackerService.getLocalCacheMap(currentUser?.id || currentUser?.code) : {}
  );

  // Nạp nhật ký đọc bài thực tế của học viên (đồng bộ 100% cùng bản ghi với Dashboard)
  useEffect(() => {
    if (!isStudent) return;
    const studentUid = currentUser?.id || currentUser?.code;
    if (!studentUid) return;
    let mounted = true;
    LessonReadingTrackerService.getStudentReadingLogs(studentUid)
      .then((logs) => {
        if (mounted && logs) setReadingLogsMap(logs);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isStudent, currentUser?.id, currentUser?.code]);

  // Đếm số buổi đã soạn và chưa soạn
  const plannedCount = useMemo(() => {
    return allSessionIndices.filter((idx) => Boolean(visibleLessonPlans[idx])).length;
  }, [allSessionIndices, visibleLessonPlans]);
  const unplannedCount = Math.max(0, allSessionIndices.length - plannedCount);

  // Danh sách buổi hiển thị trên timeline carousel theo bộ lọc
  const visiblePillIndices = useMemo(() => {
    if (statusFilter === 'planned') {
      return allSessionIndices.filter((idx) => Boolean(visibleLessonPlans[idx]));
    }
    if (statusFilter === 'unplanned') {
      return allSessionIndices.filter((idx) => !visibleLessonPlans[idx]);
    }
    return allSessionIndices;
  }, [allSessionIndices, statusFilter, visibleLessonPlans]);

  // Điều hướng 1-chạm Buổi Trước / Buổi Sau
  const currentPos = allSessionIndices.indexOf(selectedSession);
  const hasPrev = currentPos > 0;
  const hasNext = currentPos >= 0 && currentPos < allSessionIndices.length - 1;

  const handleSelectSession = (val) => {
    setUserHasManuallySwitched(true);
    setSelectedSession(val);
  };

  const handlePrevSession = () => {
    if (hasPrev) handleSelectSession(allSessionIndices[currentPos - 1]);
  };

  const handleNextSession = () => {
    if (hasNext) handleSelectSession(allSessionIndices[currentPos + 1]);
  };

  const canManageCourseVault = ['academic', 'admin', 'director'].includes(userRole);

  // 3. 100% Real Database: Duyệt danh sách giáo trình & video chung của khóa học
  //    - Tách sạch 100% Session Recording của lớp lẻ (isSessionRecording) & mục đã xóa
  //    - Bảo mật RBAC: Học viên tuyệt đối không nhìn thấy sách đáp án Giáo viên (TEACHER_ONLY / STAFF_ONLY / TEACHER_GUIDE)
  const allMaterials = useMemo(() => {
    const seen = new Set();
    const unique = [];
    (courseMaterials || []).forEach((m, idx) => {
      if (!m || m.isDeleted || m.isSessionRecording) return;

      const normalizedType = String(m.type || 'PDF').toUpperCase();
      const isStaffConfidential =
        m.visibility === 'TEACHER_ONLY' ||
        m.visibility === 'TEACHERS_ONLY' ||
        m.shareScope === 'STAFF_ONLY' ||
        normalizedType === 'TEACHER_GUIDE' ||
        normalizedType === 'TEACHER';

      if (isStudent && isStaffConfidential) return;

      const dedupKey = m.id ? String(m.id) : `${m.title}_${m.url}`;
      if (seen.has(dedupKey)) return;
      seen.add(dedupKey);

      let iconNode = <FilePdfOutlined />;
      let accentColor = '#722ed1';
      let badgeColor = 'purple';
      let badgeLabel = normalizedType;

      if (normalizedType === 'VIDEO') {
        iconNode = <VideoCameraOutlined />;
        accentColor = '#7c3aed';
        badgeColor = 'purple';
        badgeLabel = 'VIDEO';
      } else if (normalizedType === 'AUDIO') {
        iconNode = <CustomerServiceOutlined />;
        accentColor = '#fa8c16';
        badgeColor = 'orange';
        badgeLabel = 'AUDIO';
      } else if (normalizedType === 'SLIDES') {
        iconNode = <DesktopOutlined />;
        accentColor = '#16a34a';
        badgeColor = 'green';
        badgeLabel = 'SLIDES';
      } else if (normalizedType === 'PRACTICE') {
        iconNode = <BookOutlined />;
        accentColor = '#0891b2';
        badgeColor = 'cyan';
        badgeLabel = isEnglish ? 'PRACTICE' : 'BÀI TẬP';
      } else if (normalizedType === 'TEACHER_GUIDE' || normalizedType === 'TEACHER') {
        iconNode = <SafetyCertificateOutlined />;
        accentColor = '#be185d';
        badgeColor = 'magenta';
        badgeLabel = isEnglish ? 'TEACHER' : 'NỘI BỘ GV';
      } else {
        iconNode = <FilePdfOutlined />;
        accentColor = '#2563eb';
        badgeColor = 'blue';
        badgeLabel = 'PDF';
      }

      unique.push({
        ...m,
        id: m.id || `mat-${idx}`,
        title: m.title || (isEnglish ? 'Course Material' : 'Tài Liệu Khóa Học'),
        type: normalizedType === 'TEACHER' ? 'TEACHER_GUIDE' : normalizedType,
        url: m.url || '#',
        icon: iconNode,
        accentColor,
        badgeColor,
        badgeLabel,
        isStaffConfidential,
      });
    });
    return unique;
  }, [courseMaterials, isEnglish, isStudent]);

  // 4. Lấy dữ liệu giáo án THỰC TẾ của buổi đang chọn (TUYỆT ĐỐI KHÔNG FAKE DỮ LIỆU)
  const realPlan = visibleLessonPlans[selectedSession] || null;
  const selectedSched = scheduleSessions.find((s) => s.sessionIndex === selectedSession);

  // Chuẩn hóa giáo án cho Book Reader (đồng bộ 100% schema với Dashboard)
  const formattedReaderLessonPrep = useMemo(() => {
    if (!realPlan || !cls) return null;
    return StudentDashboardService._formatReadyPlan(
      { ...realPlan, sessionIndex: selectedSession },
      cls
    );
  }, [realPlan, cls, selectedSession]);

  const activeReadingLog = useMemo(() => {
    if (!isStudent || !cls?.id) return null;
    const studentUid = currentUser?.id || currentUser?.code;
    if (!studentUid) return null;
    const logId = LessonReadingTrackerService.buildLogId(cls.id, selectedSession, studentUid);
    return readingLogsMap[logId] || null;
  }, [isStudent, cls?.id, selectedSession, currentUser?.id, currentUser?.code, readingLogsMap]);

  const readerStats = useMemo(() => {
    const objCount = Array.isArray(formattedReaderLessonPrep?.objectives)
      ? formattedReaderLessonPrep.objectives.length
      : 0;
    const minReq = computeMinRequiredSeconds(objCount);
    const preSec = Number(activeReadingLog?.preClassActiveSeconds) || 0;
    const scrollPct = Number(activeReadingLog?.maxScrollPercent) || 0;
    const status = activeReadingLog?.prepStatus || PREP_STATUS.NOT_STARTED;
    return {
      minReq,
      preSec,
      scrollPct,
      status,
      percent: Math.min(100, Math.round((preSec / minReq) * 100)),
      meta: getPrepStatusMeta(status, isEnglish),
    };
  }, [formattedReaderLessonPrep, activeReadingLog, isEnglish]);

  const handleReadingLogUpdated = (updatedLog) => {
    if (!updatedLog?.id) return;
    setReadingLogsMap((prev) => ({
      ...prev,
      [updatedLog.id]: updatedLog,
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Multi-Session Lesson Plan Manager Bar */}
      <Card
        style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
        styles={{ body: { padding: isMobile ? 12 : 20 } }}
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
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: isMobile ? '10px' : '12px 14px', marginBottom: 16, overflow: 'hidden' }}>
          <Row gutter={[12, 10]} align="middle">
            {/* Quick Search & Jump Select */}
            <Col xs={24} sm={24} lg={12}>
              <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>
                🔍 {t('classroom.selectSessionToPlan', isEnglish ? 'Jump to any session:' : 'Nhảy nhanh đến buổi học:') || (isEnglish ? 'Jump to any session:' : 'Nhảy nhanh đến buổi học:')}
              </Text>
              <Select
                showSearch
                data-testid="select-quick-jump-session"
                value={selectedSession}
                onChange={(val) => handleSelectSession(val)}
                placeholder={t('classroom.jumpToSession', isEnglish ? 'Jump to session...' : 'Nhảy nhanh đến buổi học...') || (isEnglish ? 'Jump to session...' : 'Nhảy nhanh đến buổi học...')}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={allSessionIndices.map((idx) => {
                  const p = visibleLessonPlans[idx];
                  const sched = scheduleSessions.find((s) => s.sessionIndex === idx);
                  const hasPlan = Boolean(p);
                  const isToday = currentSessionIndex && idx === currentSessionIndex;
                  const statusIcon = isToday ? '🟢 ' : hasPlan ? '📘 ' : '⚪ ';
                  const dateText = sched?.date ? `• ${sched.date}` : '';

                  let titleOrStatus = '';
                  if (hasPlan && p?.lessonTitle) {
                    const rawTitle = String(p.lessonTitle).trim();
                    const truncated = rawTitle.length > 35 ? `${rawTitle.slice(0, 35)}...` : rawTitle;
                    titleOrStatus = `: ${truncated}`;
                  } else if (hasPlan) {
                    titleOrStatus = ` [${isEnglish ? 'Planned' : 'Đã soạn'}]`;
                  } else {
                    titleOrStatus = ` [${isEnglish ? 'Unplanned' : 'Chưa soạn'}]`;
                  }

                  return {
                    value: idx,
                    label: `${statusIcon}${isEnglish ? `Session ${idx}` : `Buổi ${idx}`} ${dateText}${titleOrStatus}`,
                  };
                })}
              />
            </Col>

            {/* Status Filter & 1-Touch Prev/Next */}
            <Col xs={24} sm={24} lg={12}>
              <div
                style={{
                  display: 'flex',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 8,
                  flexWrap: 'wrap',
                  width: '100%',
                }}
              >
                <Segmented
                  block={isMobile}
                  size={isMobile ? 'small' : 'middle'}
                  data-testid="session-status-filter"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    {
                      label: isMobile
                        ? `${isEnglish ? 'All' : 'Tất cả'} (${allSessionIndices.length})`
                        : `${t('classroom.allSessions', isEnglish ? 'All' : 'Tất cả') || (isEnglish ? 'All' : 'Tất cả')} (${allSessionIndices.length})`,
                      value: 'all',
                    },
                    {
                      label: isMobile
                        ? `${isEnglish ? 'Done' : 'Soạn'} (${plannedCount})`
                        : `📘 ${t('classroom.hasPlan', isEnglish ? 'Planned' : 'Đã soạn') || (isEnglish ? 'Planned' : 'Đã soạn')} (${plannedCount})`,
                      value: 'planned',
                    },
                    {
                      label: isMobile
                        ? `${isEnglish ? 'Todo' : 'Chưa'} (${unplannedCount})`
                        : `⚪ ${t('classroom.noPlan', isEnglish ? 'Unplanned' : 'Chưa soạn') || (isEnglish ? 'Unplanned' : 'Chưa soạn')} (${unplannedCount})`,
                      value: 'unplanned',
                    },
                  ]}
                  style={{
                    borderRadius: 8,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    width: isMobile ? '100%' : 'auto',
                    maxWidth: '100%',
                    fontSize: isMobile ? 11 : 13,
                  }}
                />

                <div style={{ display: 'flex', gap: 6, width: isMobile ? '100%' : 'auto' }}>
                  <Button
                    size="middle"
                    icon={<LeftOutlined />}
                    disabled={!hasPrev}
                    onClick={handlePrevSession}
                    data-testid="btn-prev-session"
                    style={{ borderRadius: 8, height: 36, fontSize: 12, flex: isMobile ? 1 : undefined, whiteSpace: 'nowrap' }}
                  >
                    {isMobile
                      ? isEnglish
                        ? 'Prev'
                        : 'Buổi trước'
                      : t('classroom.prevSession', isEnglish ? 'Prev' : 'Trước') || (isEnglish ? 'Prev' : 'Trước')}
                  </Button>
                  <Button
                    size="middle"
                    disabled={!hasNext}
                    onClick={handleNextSession}
                    data-testid="btn-next-session"
                    style={{ borderRadius: 8, height: 36, fontSize: 12, flex: isMobile ? 1 : undefined, whiteSpace: 'nowrap' }}
                  >
                    {isMobile
                      ? isEnglish
                        ? 'Next'
                        : 'Buổi sau'
                      : t('classroom.nextSession', isEnglish ? 'Next' : 'Sau') || (isEnglish ? 'Next' : 'Sau')}{' '}
                    <RightOutlined />
                  </Button>
                </div>
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
              const p = visibleLessonPlans[idx];
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
                  onClick={() => handleSelectSession(idx)}
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

            {/* Thanh Đọc Sách & Tính Giờ Chuẩn Bị Bài Dành Riêng Cho Học Viên (Đồng bộ 100% với Dashboard) */}
            {isStudent && formattedReaderLessonPrep && (
              <div
                data-testid="classroom-student-reading-bar"
                style={{
                  marginBottom: 14,
                  padding: isMobile ? '12px' : '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#faf5ff',
                  border: '1.5px solid #d8b4fe',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'stretch' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Tag
                      data-testid="classroom-reading-status-badge"
                      style={{
                        margin: 0,
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11,
                        backgroundColor: readerStats.meta.bg,
                        borderColor: readerStats.meta.border,
                        color: readerStats.meta.textColor,
                      }}
                    >
                      {readerStats.meta.icon} {readerStats.meta.label}
                    </Tag>
                    <Text style={{ fontSize: 12, color: '#581c87', fontWeight: 600 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {formatHumanDuration(readerStats.preSec, isEnglish)} / {formatHumanDuration(readerStats.minReq, isEnglish)} •{' '}
                      {isEnglish ? `Scrolled ${readerStats.scrollPct}%` : `Đã xem ${readerStats.scrollPct}%`}
                    </Text>
                  </div>
                  <Progress
                    percent={readerStats.percent}
                    size="small"
                    strokeColor={readerStats.status === PREP_STATUS.PREPARED ? '#16a34a' : '#7e22ce'}
                    showInfo={false}
                    style={{ margin: 0 }}
                  />
                </div>

                <Button
                  type="primary"
                  icon={<ReadOutlined />}
                  onClick={() => setBookReaderOpen(true)}
                  data-testid="btn-classroom-open-book-reader"
                  style={{
                    backgroundColor: '#7e22ce',
                    borderColor: '#7e22ce',
                    fontWeight: 700,
                    borderRadius: 8,
                    minHeight: 40,
                    width: isMobile ? '100%' : 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ExpandOutlined style={{ marginRight: 4 }} />
                  {isEnglish ? 'Open Book Reader & Track Time' : 'Mở Chế Độ Đọc Sách & Tính Giờ'}
                </Button>
              </div>
            )}

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

                  {/* Tài liệu đính kèm buổi học (đã chọn từ ô Autocomplete) */}
                  {Array.isArray(realPlan.attachedMaterials) && realPlan.attachedMaterials.length > 0 && (
                    <div
                      data-testid="lesson-plan-attached-materials"
                      style={{
                        backgroundColor: '#faf5ff',
                        border: '1px solid #d8b4fe',
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <Text strong style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 6 }}>
                        📎 {isEnglish
                          ? `Attached Session Materials (${realPlan.attachedMaterials.length}):`
                          : `Tài Liệu Đính Kèm Buổi Học (${realPlan.attachedMaterials.length}):`}
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {realPlan.attachedMaterials.map((mat, idx) => (
                          <div
                            key={`${mat.id || idx}_${idx}`}
                            data-testid={`classroom-attached-material-${mat.id || idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 8,
                              padding: '7px 10px',
                              borderRadius: 8,
                              backgroundColor: '#ffffff',
                              border: '1px solid #d8b4fe',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                              <Tag color={mat.type === 'AUDIO' ? 'orange' : 'purple'} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                {mat.type || 'PDF'}
                              </Tag>
                              <button
                                type="button"
                                onClick={() => setPreviewMaterial({ ...mat, courseName: cls?.name || cls?.courseName || '', _enableSessionTracking: true })}
                                data-testid={`btn-classroom-preview-material-${mat.id || idx}`}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  color: '#581c87',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  textAlign: 'left',
                                }}
                              >
                                {mat.title}
                              </button>
                            </div>
                            <Space size={6} wrap>
                              {isStudent && (() => {
                                const matLog = activeReadingLog?.materialLogs?.[String(mat.id)] || null;
                                const matSec = Number(matLog?.activeSeconds) || 0;
                                const matDone = Boolean(matLog?.completed);
                                return (
                                  <Tag
                                    color={matDone ? 'success' : matSec > 0 ? 'warning' : 'default'}
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
                                );
                              })()}
                              {mat.pageLocation && (
                                <Tag
                                  color="gold"
                                  style={{
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#92400e',
                                    borderRadius: 6,
                                  }}
                                >
                                  📍 {mat.pageLocation}
                                </Tag>
                              )}
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={<EyeOutlined />}
                                onClick={() => setPreviewMaterial({ ...mat, courseName: cls?.name || cls?.courseName || '', _enableSessionTracking: true })}
                                data-testid={`btn-classroom-preview-btn-${mat.id || idx}`}
                                style={{
                                  borderColor: '#7e22ce',
                                  color: '#7e22ce',
                                  borderRadius: 6,
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              >
                                {isEnglish ? 'Preview' : 'Xem trước'}
                              </Button>
                            </Space>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap' }} data-testid="course-vault-level-tag">
                {parentCourseLevel || cls?.courseLevel || cls?.level || 'WONDERS-G5'}
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

          {canManageCourseVault && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              style={{
                backgroundColor: '#722ed1',
                borderColor: '#722ed1',
                borderRadius: 8,
                fontWeight: 600,
                minHeight: 40,
                width: isMobile ? '100%' : 'auto',
              }}
              onClick={onOpenCourseUpload}
              data-testid="btn-academic-upload-course-vault"
            >
              {isMobile
                ? isEnglish
                  ? 'Upload Video / Material'
                  : 'Tải Lên Video / Học Liệu'
                : isEnglish
                ? 'Upload Video / Course Material'
                : 'Tải Lên Video / Giáo Trình Khóa Học'}
            </Button>
          )}
        </div>

        {allMaterials.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: 12, border: '1px dashed #d9d9d9' }} data-testid="empty-course-vault">
            <FolderOpenOutlined style={{ fontSize: 36, color: '#bfbfbf', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 4 }}>
              {isEnglish ? 'No digital course materials or videos uploaded yet' : 'Chưa có tệp giáo trình số hoặc video bài giảng nào được tải lên cho Khóa học'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 440, margin: '0 auto' }}>
              {isEnglish
                ? 'Academic coordinators can upload instructional videos, PDF textbooks, slides, or audio files using the button above.'
                : 'Giáo vụ có thể nhấn nút "Tải Lên Video / Giáo Trình Khóa Học" bên trên để đồng bộ tài liệu vào toàn bộ các lớp.'}
            </div>
          </div>
        ) : (
          <Row gutter={[12, 12]}>
            {allMaterials.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <div
                  role="button"
                  tabIndex={0}
                  data-testid={`course-vault-card-${item.id}`}
                  onClick={() =>
                    setPreviewMaterial({
                      ...item,
                      courseName: cls?.courseName || cls?.name || '',
                      _enableSessionTracking: false,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPreviewMaterial({
                        ...item,
                        courseName: cls?.courseName || cls?.name || '',
                        _enableSessionTracking: false,
                      });
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: item.type === 'VIDEO' ? '1px solid #c4b5fd' : '1px solid #d3adf7',
                    backgroundColor: item.type === 'VIDEO' ? '#f5f3ff' : '#f9f0ff',
                    color: '#262626',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    minHeight: 52,
                  }}
                  className="curriculum-drive-link-card"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        color: item.accentColor || '#722ed1',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {item.icon}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text
                        strong
                        title={item.title}
                        style={{
                          fontSize: 12.5,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </Text>
                      <Space size={4} style={{ marginTop: 2 }}>
                        <Tag
                          color={item.badgeColor || 'purple'}
                          style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px', fontWeight: 700 }}
                        >
                          {item.badgeLabel}
                        </Tag>
                        {item.fileSize && (
                          <Text type="secondary" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>
                            {item.fileSize}
                          </Text>
                        )}
                      </Space>
                    </div>
                  </div>

                  <Space size={4} style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={isEnglish ? 'Preview Full-Screen' : 'Xem trực tiếp trong App'}>
                      <Button
                        size="small"
                        type="text"
                        icon={item.type === 'VIDEO' ? <PlayCircleOutlined /> : <EyeOutlined />}
                        data-testid={`btn-preview-course-material-${item.id}`}
                        onClick={() =>
                          setPreviewMaterial({
                            ...item,
                            courseName: cls?.courseName || cls?.name || '',
                            _enableSessionTracking: false,
                          })
                        }
                        style={{
                          color: item.accentColor || '#722ed1',
                          minWidth: 32,
                          minHeight: 32,
                          borderRadius: 6,
                        }}
                      />
                    </Tooltip>

                    {canManageCourseVault && typeof onDeleteCourseMaterial === 'function' && (
                      <Popconfirm
                        title={
                          isEnglish
                            ? 'Remove from Course Program Vault?'
                            : 'Xoá học liệu này khỏi Kho Khóa Học?'
                        }
                        description={
                          isEnglish
                            ? 'This will remove the item from all classes sharing this course.'
                            : 'Học liệu sẽ được gỡ đồng bộ khỏi tất cả các lớp thuộc khóa học này.'
                        }
                        okText={isEnglish ? 'Delete' : 'Xoá ngay'}
                        cancelText={isEnglish ? 'Cancel' : 'Hủy'}
                        okButtonProps={{ danger: true, 'data-testid': `btn-confirm-delete-course-material-${item.id}` }}
                        onConfirm={() => onDeleteCourseMaterial(item.id)}
                      >
                        <Tooltip title={isEnglish ? 'Delete' : 'Xoá khỏi khóa học'}>
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            data-testid={`btn-delete-course-material-${item.id}`}
                            style={{
                              minWidth: 32,
                              minHeight: 32,
                              borderRadius: 6,
                            }}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 3. Danh Sách Tổng Hợp Recording Riêng Của Lớp Học Này (Cô lập 100% theo cls.id) */}
      <div style={{ marginTop: 16 }}>
        <ClassRecordingsDirectoryCard
          fixedClass={{
            ...cls,
            courseLevel: parentCourseLevel || cls?.courseLevel || cls?.level || '',
          }}
          allRecordings={classRecordings}
          currentUser={currentUser}
          onWatchRecording={(rec) =>
            setPreviewMaterial({
              ...rec,
              courseName: cls?.courseName || cls?.name || '',
              _enableSessionTracking: false,
            })
          }
          onOpenUploadRecording={(clsObj, isoDate) =>
            setRecordingUploadTarget({ clsObj, isoDate: isoDate || '' })
          }
          onDeleteRecording={onDeleteClassRecording}
          testIdPrefix="classroom-recordings-dir"
        />
      </div>

      {/* Modal Upload Recording trực tiếp cho Lớp học hiện tại */}
      <SessionRecordingUploadModal
        open={Boolean(recordingUploadTarget)}
        classData={{
          id: cls?.id,
          name: cls?.name,
          courseId: cls?.courseId || 'ALL',
          courseName: cls?.courseName || '',
          courseLevel: parentCourseLevel || cls?.courseLevel || cls?.level || '',
          teacherId: cls?.teacherId || '',
          teacherName: cls?.teacherName || '',
        }}
        initialSessionDate={recordingUploadTarget?.isoDate || ''}
        currentUser={currentUser || { role: userRole }}
        onClose={() => setRecordingUploadTarget(null)}
        onSuccess={(savedRec) => {
          onClassRecordingUploaded?.(savedRec);
          setRecordingUploadTarget(null);
        }}
      />

      {/* Modal Xem Trước Tài Liệu Đính Kèm Trực Tiếp Trong Ứng Dụng */}
      <MaterialPreviewModal
        open={Boolean(previewMaterial)}
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        zIndex={1200}
        trackingContext={
          isStudent && previewMaterial?._enableSessionTracking && formattedReaderLessonPrep && currentUser
            ? {
                enabled: true,
                classItem: cls,
                lessonPrep: formattedReaderLessonPrep,
                studentUser: currentUser,
                initialMaterialLog: activeReadingLog?.materialLogs?.[String(previewMaterial.id)] || null,
                onLogUpdated: handleReadingLogUpdated,
              }
            : null
        }
      />

      {/* Trình Đọc Sách Toàn Màn Hình & Tính Giờ Đọc Bài Cho Học Viên (Đồng Bộ 100% Với Dashboard) */}
      {isStudent && formattedReaderLessonPrep && (
        <LessonBookReaderModal
          open={bookReaderOpen}
          onClose={() => setBookReaderOpen(false)}
          classItem={cls}
          lessonPrep={formattedReaderLessonPrep}
          studentUser={currentUser}
          isStudentRole={true}
          initialLog={activeReadingLog}
          onLogUpdated={handleReadingLogUpdated}
        />
      )}
    </div>
  );
};
