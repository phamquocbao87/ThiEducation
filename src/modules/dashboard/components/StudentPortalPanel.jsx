import React, { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Alert,
  Avatar,
  Divider,
  Empty,
  Segmented,
} from 'antd';
import {
  VideoCameraOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  GlobalOutlined,
  UserOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { StudentDashboardService } from '../services/StudentDashboardService';
import { FormattedText } from '../../../shared/components/controls';
import { StudentLearningCornerCard } from './StudentLearningCornerCard';
import { StudentClassMaterialsCard } from './StudentClassMaterialsCard';
import { StudentHomeworkTasksCard } from './StudentHomeworkTasksCard';
import { StudentRecentEvaluationsCard } from './StudentRecentEvaluationsCard';
import { StudentConductScoreCard } from './StudentConductScoreCard';
import { DashboardNewQuestionsPreviewCard } from './DashboardNewQuestionsPreviewCard';
import { ClassAbsenceReportModal } from '../../attendance/components/ClassAbsenceReportModal';
import { LessonQaManagementService } from '../../lesson-qa/services/LessonQaManagementService';
import {
  LessonOverviewCompactCard,
  LessonBookReaderModal,
  LessonReadingTrackerService,
  ConductScoreService,
} from '../../lesson-reader';
import { useClassTimer } from '../hooks/useClassTimer';
import { ClassSessionTimer } from './ClassSessionTimer';
import { ZoomRoomLiveSection } from '../../../shared/components/ZoomRoomLiveSection';
import { findClassSession, getSessionTimer } from '../../../shared/utils/classSessionUtils';
import {
  detectMeetingPlatform,
  MeetingPlatformBadge,
  GoogleMeetIcon,
  ZoomIcon,
} from '../../../shared/utils/meetingPlatformUtils';

const { Title, Text, Paragraph } = Typography;

const getPlatformDisplayName = (platform, isEn) => {
  if (platform?.type === 'google_meet') return 'Google Meet';
  if (platform?.type === 'zoom') return 'Zoom';
  if (platform?.type === 'teams') return 'MS Teams';
  return isEn ? 'Online Classroom' : 'Phòng Trực Tuyến';
};

export const StudentPortalPanel = ({ portalData = {} }) => {
  const { currentUser } = useAuth();
  const { isEnglish, t } = useLanguage();
  const isMobile = useIsMobile();
  const now = useClassTimer();

  const {
    myClasses = [],
    activeBill = null,
    isPaid = false,
    nextClass = null,
    enrolledClassesCount = 0,
  } = portalData;

  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [selectedClassForAbsence, setSelectedClassForAbsence] = useState(null);
  const [bookReaderOpen, setBookReaderOpen] = useState(false);
  const [bookReaderInitialTab, setBookReaderInitialTab] = useState('notes');

  const [homeworks, setHomeworks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [readingLogsMap, setReadingLogsMap] = useState(() =>
    LessonReadingTrackerService.getLocalCacheMap(currentUser?.id || currentUser?.code)
  );
  const [studentQuestions, setStudentQuestions] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  // Tải dữ liệu bổ trợ bài tập, đánh giá, tài liệu, nhật ký đọc bài và Q&A theo lớp
  useEffect(() => {
    let isMounted = true;
    const studentUid = currentUser?.id || currentUser?.code;
    const loadStudentData = async () => {
      try {
        setLoadingExtra(true);
        const [hwList, evalList, matList, logsMap, qaRes] = await Promise.all([
          StudentDashboardService.getStudentHomeworkTasks(currentUser, myClasses),
          StudentDashboardService.getStudentRecentEvaluations(currentUser, myClasses),
          StudentDashboardService.getStudentClassMaterials(myClasses, currentUser),
          LessonReadingTrackerService.getStudentReadingLogs(studentUid),
          LessonQaManagementService.getScopedQaDataset(currentUser).catch(() => ({ questions: [] })),
        ]);
        if (isMounted) {
          setHomeworks(hwList || []);
          setEvaluations(evalList || []);
          setMaterials(matList || []);
          setReadingLogsMap(logsMap || {});
          setStudentQuestions(qaRes?.questions || []);
        }
      } catch (err) {
        console.warn('[StudentPortalPanel] Lỗi tải dữ liệu học viên:', err);
      } finally {
        if (isMounted) setLoadingExtra(false);
      }
    };

    loadStudentData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, myClasses]);

  // Sắp xếp lớp học theo thời gian ca học diễn ra sớm nhất (Earliest Session Priority)
  const sortedClasses = useMemo(() => {
    if (!myClasses || myClasses.length === 0) return [];
    return [...myClasses].sort((a, b) => {
      const sA = findClassSession(a, now);
      const sB = findClassSession(b, now);
      const timeA = sA ? sA.start : Infinity;
      const timeB = sB ? sB.start : Infinity;
      return timeA - timeB;
    });
  }, [myClasses, now]);

  // Lớp học trực tuyến tiếp theo (Ưu tiên ca học diễn ra sớm nhất)
  const upcomingClass = useMemo(() => {
    return sortedClasses[0] || nextClass || null;
  }, [sortedClasses, nextClass]);

  // Nhận diện nền tảng & trạng thái phòng học của ca học sắp tới
  const upcomingMeetingUrl = upcomingClass?.zoomStudentLink || upcomingClass?.meetingLink || '';
  const upcomingPlatform = useMemo(() => detectMeetingPlatform(upcomingMeetingUrl), [upcomingMeetingUrl]);
  const upcomingSession = useMemo(() => (upcomingClass ? findClassSession(upcomingClass, now) : null), [upcomingClass, now]);
  const upcomingTimer = useMemo(() => (upcomingSession ? getSessionTimer(upcomingSession, now) : null), [upcomingSession, now]);
  const isUpcomingRoomOpen = Boolean(
    upcomingTimer && (upcomingTimer.state === 'live' || (upcomingTimer.state === 'upcoming' && upcomingTimer.startsIn <= 600))
  );

  // Bộ chọn lớp học chủ động (Class Switcher / Tabs) và buổi giáo án chủ động
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedPrepSession, setSelectedPrepSession] = useState(null);

  // Hỗ trợ deep-link từ Notification (?openReader=1&classId=LH002&qaId=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openReader') === '1') {
        const targetCls = params.get('classId');
        if (targetCls) setSelectedClassId(targetCls);
        if (params.get('qaId')) setBookReaderInitialTab('qa');
        setBookReaderOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const activeClassId = useMemo(() => {
    if (selectedClassId && myClasses.some((c) => (c.id || c.code) === selectedClassId)) {
      return selectedClassId;
    }
    return sortedClasses[0]?.id || sortedClasses[0]?.code || myClasses[0]?.id || myClasses[0]?.code || null;
  }, [selectedClassId, myClasses, sortedClasses]);

  const activePrepClass = useMemo(() => {
    return (
      myClasses.find((c) => (c.id || c.code) === activeClassId) ||
      sortedClasses[0] ||
      myClasses[0] ||
      nextClass || { name: 'WP03 G5 Ms. Maj', courseLevel: 'Grade 5' }
    );
  }, [activeClassId, myClasses, sortedClasses, nextClass]);

  // Danh sách toàn bộ giáo án READY của lớp hiện hành + giáo án ưu tiên hiển thị
  const availableLessonPlans = useMemo(
    () => StudentDashboardService.getReadyLessonPlans(activePrepClass),
    [activePrepClass]
  );

  // Reset buổi đang chọn khi đổi lớp học
  useEffect(() => {
    setSelectedPrepSession(null);
  }, [activeClassId]);

  // Hướng dẫn chuẩn bị bài học cho lớp học đang được chọn (ưu tiên hôm nay/sắp tới hoặc buổi học viên tự chọn)
  const lessonPrep = useMemo(
    () =>
      StudentDashboardService.getLessonPreparationGuide(activePrepClass, {
        sessionIndexOverride: selectedPrepSession,
      }),
    [activePrepClass, selectedPrepSession]
  );

  // Nhật ký đọc bài thực tế của học viên cho buổi học hiện hành
  const activeReadingLog = useMemo(() => {
    const cId = activePrepClass?.id || activePrepClass?.code;
    const sId = currentUser?.id || currentUser?.code;
    if (!cId || !lessonPrep || !sId) return null;
    const logId = LessonReadingTrackerService.buildLogId(cId, lessonPrep.sessionIndex, sId);
    return readingLogsMap[logId] || null;
  }, [activePrepClass, lessonPrep, currentUser, readingLogsMap]);

  const handleReadingLogUpdated = (updatedLog) => {
    if (!updatedLog?.id) return;
    setReadingLogsMap((prev) => ({
      ...prev,
      [updatedLog.id]: updatedLog,
    }));
  };

  // Tổng hợp Điểm Rèn Luyện cá nhân của chính học viên (35% Chuẩn bị bài, 15% Note/Q&A, 25% Chuyên cần, 25% Bài tập)
  const studentConductSummary = useMemo(() => {
    const sId = currentUser?.id || currentUser?.code;
    if (!sId) return null;
    return ConductScoreService.computeStudentConductSummary({
      studentId: sId,
      classes: myClasses,
      readingLogs: Object.values(readingLogsMap || {}),
      evaluations,
      homeworks,
      isEnglish,
    });
  }, [currentUser, myClasses, readingLogsMap, evaluations, homeworks, isEnglish]);

  return (
    <div data-testid="student-portal-dashboard-container">
      {/* 1. Header Chào Mừng Học Viên & Tóm Tắt Trạng Thái */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          marginBottom: isMobile ? 12 : 20,
          background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,21,41,0.12)',
        }}
        styles={{ body: { padding: isMobile ? '12px 14px' : '20px 24px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          <Space size={isMobile ? 10 : 14} align="start">
            <Avatar
              size={isMobile ? 42 : 56}
              style={{
                backgroundColor: '#1890ff',
                fontSize: isMobile ? 18 : 22,
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.4)',
                flexShrink: 0,
              }}
              icon={<UserOutlined />}
            >
              {(currentUser?.name || 'S').charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Title level={3} style={{ color: '#ffffff', margin: 0, fontSize: isMobile ? 16 : 20, lineHeight: 1.2 }}>
                  {currentUser?.name || 'Học Viên'}
                </Title>
                {currentUser?.englishName && (
                  <Tag
                    color="gold"
                    style={{
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: isMobile ? 11 : 13,
                      padding: '1px 6px',
                      border: 'none',
                      margin: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🌟 {currentUser.englishName}
                  </Tag>
                )}
                <Tag color="cyan" style={{ borderRadius: 4, margin: 0, fontSize: 10, whiteSpace: 'nowrap' }}>
                  {currentUser?.code || currentUser?.id || 'STUDENT'}
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 11 : 13, display: 'block', marginTop: 2 }}>
                {isEnglish
                  ? 'McGraw-Hill Wonders ELA • Active Learner'
                  : 'McGraw-Hill Wonders ELA • Học viên chính thức'}
              </Text>
            </div>
          </Space>

          {/* Huy hiệu tóm tắt nhanh */}
          {isMobile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginTop: 2 }}>
              <div style={{ padding: '6px 8px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{isEnglish ? 'Classes' : 'Lớp Đang Học'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>{enrolledClassesCount} {isEnglish ? 'cls' : 'lớp'}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{isEnglish ? 'Tuition' : 'Học Phí'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isPaid ? '#52c41a' : '#fa8c16' }}>
                  {isPaid ? (isEnglish ? 'Paid' : 'Đã Đóng') : (isEnglish ? 'Pending' : 'Chờ Đóng')}
                </div>
              </div>
            </div>
          ) : (
            <Space size={10} style={{ flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{isEnglish ? 'Classes' : 'Lớp Đang Học'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
                  {enrolledClassesCount} {isEnglish ? (enrolledClassesCount > 1 ? 'classes' : 'class') : 'lớp'}
                </div>
              </div>
              <div style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{isEnglish ? 'Tuition' : 'Học Phí'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isPaid ? '#52c41a' : '#fa8c16' }}>
                  {isPaid ? (isEnglish ? 'Completed' : 'Đã Đóng') : (isEnglish ? 'Pending' : 'Chờ Đóng')}
                </div>
              </div>
            </Space>
          )}
        </div>
      </Card>

      {/* 2. Banner Ca Học Trực Tuyến Tiếp Theo */}
      {upcomingClass && (
        <Alert
          type="success"
          showIcon
          icon={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {upcomingPlatform.type === 'google_meet' ? (
                <GoogleMeetIcon size={isMobile ? 18 : 24} />
              ) : upcomingPlatform.type === 'zoom' ? (
                <ZoomIcon size={isMobile ? 18 : 24} />
              ) : (
                <VideoCameraOutlined style={{ color: '#52c41a', fontSize: isMobile ? 18 : 24 }} />
              )}
            </span>
          }
          style={{
            marginBottom: isMobile ? 12 : 20,
            borderRadius: 14,
            border: '1.5px solid #b7eb8f',
            backgroundColor: '#f6ffed',
            padding: isMobile ? '10px 12px' : '16px 20px',
          }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: isMobile ? 14 : 16, color: '#135200' }}>
                    {isEnglish ? 'Upcoming Session:' : 'Lớp Sắp Tới:'}{' '}
                    <span style={{ color: '#237804' }}>{upcomingClass.name}</span>
                  </Text>
                  {upcomingMeetingUrl && <MeetingPlatformBadge url={upcomingMeetingUrl} size="small" />}
                </div>
                <div style={{ marginTop: 4, color: '#4b5563', fontSize: isMobile ? 12 : 13 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: '#0284c7' }} />
                  {isEnglish ? 'Schedule:' : 'Lịch:'} <Text strong>{upcomingClass.schedule || 'Regular Schedule'}</Text>
                  {' • '}
                  <GlobalOutlined style={{ marginLeft: 6, marginRight: 4, color: '#7c3aed' }} />
                  <Text strong>{upcomingClass.teacherName || 'Teacher Maj'}</Text>
                </div>
                <div style={{ marginTop: 6 }}>
                  <ClassSessionTimer cls={upcomingClass} now={now} style={{ marginBottom: 0, padding: '3px 8px', fontSize: 11 }} />
                </div>
              </div>

              <div style={{ width: isMobile ? '100%' : 'auto', marginTop: isMobile ? 4 : 0 }}>
                {upcomingMeetingUrl ? (
                  isUpcomingRoomOpen ? (
                    <Button
                      type="primary"
                      size={isMobile ? 'middle' : 'large'}
                      block={isMobile}
                      icon={upcomingPlatform.iconSmall || upcomingPlatform.icon || <VideoCameraOutlined />}
                      style={{
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a',
                        borderRadius: 8,
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(82,196,26,0.3)',
                        width: isMobile ? '100%' : 'auto',
                      }}
                      onClick={() => window.open(upcomingMeetingUrl, '_blank')}
                      data-testid="btn-join-live-meeting"
                    >
                      {upcomingTimer?.state === 'live'
                        ? (isEnglish ? `🔴 Join Live` : `🔴 Vào Lớp (Đang Diễn Ra)`)
                        : (isEnglish ? `🎥 Join Now` : `🎥 Vào Lớp Học Ngay`)}
                    </Button>
                  ) : (
                    <Button
                      size={isMobile ? 'middle' : 'large'}
                      block={isMobile}
                      disabled
                      icon={upcomingPlatform.iconSmall || upcomingPlatform.icon || <VideoCameraOutlined />}
                      style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        borderColor: '#cbd5e1',
                        color: '#64748b',
                        cursor: 'not-allowed',
                        width: isMobile ? '100%' : 'auto',
                      }}
                      data-testid="btn-join-live-meeting-locked"
                    >
                      {isEnglish
                        ? `${getPlatformDisplayName(upcomingPlatform, isEnglish)} Opens 10m Before`
                        : `Phòng ${getPlatformDisplayName(upcomingPlatform, isEnglish)} Mở Trước 10 Phút`}
                    </Button>
                  )
                ) : (
                  <Button
                    size="large"
                    disabled
                    style={{ borderRadius: 8, fontWeight: 600 }}
                    title={
                      isEnglish
                        ? 'The teacher or academic staff has not updated the meeting link yet'
                        : 'Giáo viên hoặc giáo vụ chưa cập nhật đường dẫn phòng học trực tuyến'
                    }
                  >
                    {isEnglish ? 'Meeting Link Not Available' : 'Chưa Có Link Phòng Học'}
                  </Button>
                )}

                {upcomingClass.zaloGroupLink && (
                  <Button
                    size="large"
                    icon={<MessageOutlined />}
                    style={{ borderRadius: 8, borderColor: '#0068ff', color: '#0068ff', fontWeight: 600 }}
                    onClick={() => window.open(upcomingClass.zaloGroupLink, '_blank')}
                    title={isEnglish ? 'Join Class Zalo Group' : 'Tham gia nhóm Zalo trao đổi của lớp học'}
                  >
                    {isEnglish ? 'Class Zalo Group' : 'Zalo Lớp'}
                  </Button>
                )}

                {/* Nút Báo Nghỉ Phép dành cho Học Viên / Phụ Huynh */}
                <Button
                  size={isMobile ? 'middle' : 'large'}
                  icon={<CalendarOutlined />}
                  style={{
                    borderRadius: 8,
                    borderColor: '#fa8c16',
                    color: '#d46b08',
                    fontWeight: 600,
                    backgroundColor: '#fff7e6',
                    width: isMobile ? '100%' : 'auto',
                  }}
                  onClick={() => {
                    setSelectedClassForAbsence(upcomingClass);
                    setAbsenceModalOpen(true);
                  }}
                  data-testid="btn-student-report-absence"
                  title={isEnglish ? 'Submit absence request for upcoming class' : 'Gửi đơn báo vắng / xin nghỉ phép cho ca học này'}
                >
                  {isEnglish ? 'Request Leave' : 'Báo Nghỉ Phép'}
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* 3. BỐ CỤC LƯỚI BẤT ĐỐI XỨNG TỶ LỆ VÀNG (15 / 9 TRÊN >= 1200PX, XẾP DỌC THOÁNG TRÊN MOBILE/TABLET/SCALE HẸP) */}
      <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
        {/* ========================================================= */}
        {/* CỘT TRÁI / TRUNG TÂM (Col xl=15): LUỒNG HỌC TẬP CHÍNH */}
        {/* ========================================================= */}
        <Col xs={24} xl={15}>
          {/* KHỐI 1: LỚP HỌC ĐANG HỌC & CHUẨN BỊ BÀI HỌC (PRE-CLASS LESSON PREP) */}
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              marginBottom: isMobile ? 14 : 20,
              backgroundColor: '#ffffff',
            }}
            styles={{ body: { padding: isMobile ? '14px 12px' : '20px 22px' } }}
            data-testid="student-classes-and-prep-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Space size={8}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  <BookOutlined />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>
                    {isEnglish ? 'Enrolled Classes & Lesson Preparation' : 'Lớp Học Đang Tham Gia & Chuẩn Bị Bài Học'}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {isEnglish
                      ? 'View your class schedule, lesson plans, and preparation tasks before each live Zoom session.'
                      : 'Xem thời khóa biểu, kế hoạch bài học và nhiệm vụ chuẩn bị trước mỗi ca học trực tuyến qua Zoom.'}
                  </Text>
                </div>
              </Space>
            </div>

            {/* Danh sách lớp học kèm bộ đếm thời gian thực (Timer) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {myClasses.map((cls) => (
                <div
                  key={cls.id}
                  data-testid={`student-enrolled-class-${cls.id}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 14, color: '#0284c7' }}>
                          {cls.name}
                        </Text>
                        <Tag color="purple" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                          {cls.courseLevel || 'Wonders ELA'}
                        </Tag>
                        {(cls.zoomStudentLink || cls.meetingLink) && (
                          <MeetingPlatformBadge url={cls.zoomStudentLink || cls.meetingLink} size="small" />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        <span>📅 {cls.schedule || 'Chưa xếp lịch'}</span>
                        <span style={{ marginLeft: 10 }}>👨‍🏫 {cls.teacherName || 'Teacher Maj'}</span>
                      </div>
                      <ZoomRoomLiveSection cls={cls} role="student" compact />
                    </div>

                    <Space size={6} wrap>
                      {(() => {
                        const clsMeetingUrl = cls.zoomStudentLink || cls.meetingLink || '';
                        if (!clsMeetingUrl) return null;
                        const clsPlatform = detectMeetingPlatform(clsMeetingUrl);
                        const clsPlatformName = getPlatformDisplayName(clsPlatform, isEnglish);
                        const clsSession = findClassSession(cls, now);
                        const clsTimer = getSessionTimer(clsSession, now);
                        const isClsOpen = Boolean(
                          clsTimer && (clsTimer.state === 'live' || (clsTimer.state === 'upcoming' && clsTimer.startsIn <= 600))
                        );

                        if (isClsOpen) {
                          return (
                            <Button
                              type="primary"
                              size="small"
                              icon={clsPlatform.iconSmall || clsPlatform.icon || <VideoCameraOutlined />}
                              style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', borderRadius: 6, fontWeight: 600 }}
                              onClick={() => window.open(clsMeetingUrl, '_blank')}
                              title={
                                clsTimer?.state === 'live'
                                  ? (isEnglish ? `Class is live! Click to join ${clsPlatformName}` : `Buổi học đang diễn ra! Bấm để vào ${clsPlatformName}`)
                                  : (isEnglish ? `Click to join ${clsPlatformName} now` : `Bấm để vào phòng học ${clsPlatformName} ngay`)
                              }
                            >
                              {clsTimer?.state === 'live'
                                ? (isEnglish ? `🔴 Join Live ${clsPlatformName}` : `🔴 Vào ${clsPlatformName} (Đang Học)`)
                                : (isEnglish ? `Join ${clsPlatformName}` : `Vào ${clsPlatformName}`)}
                            </Button>
                          );
                        }

                        return (
                          <Button
                            size="small"
                            disabled
                            style={{ borderRadius: 6, fontSize: 11, color: '#64748b' }}
                            title={
                              isEnglish
                                ? `Online classroom on ${clsPlatformName} will automatically open 10 minutes before class starts`
                                : `Phòng học trực tuyến trên ${clsPlatformName} sẽ tự động mở trước giờ học 10 phút`
                            }
                          >
                            {isEnglish ? 'Opens 10m Before' : 'Phòng Mở Trước 10 Phút'}
                          </Button>
                        );
                      })()}

                      <Button
                        size="small"
                        icon={<CalendarOutlined />}
                        style={{
                          borderRadius: 6,
                          fontSize: 11,
                          borderColor: '#ffd591',
                          color: '#d46b08',
                          backgroundColor: '#fffbe6',
                          fontWeight: 600,
                        }}
                        onClick={() => {
                          setSelectedClassForAbsence(cls);
                          setAbsenceModalOpen(true);
                        }}
                        data-testid={`btn-report-absence-class-${cls.id}`}
                      >
                        {isEnglish ? 'Leave' : 'Báo Nghỉ'}
                      </Button>
                    </Space>
                  </div>

                  {/* Bộ đếm thời gian thực buổi học (Class Session Timer) */}
                  <ClassSessionTimer cls={cls} now={now} style={{ marginBottom: 0, padding: '6px 10px', fontSize: 12 }} />
                </div>
              ))}
            </div>

            <Divider style={{ margin: '14px 0' }} />

            {/* Bộ Chọn Lớp Học (Class Switcher / Tabs) khi học viên học >= 2 lớp */}
            {sortedClasses.length > 1 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
                data-testid="student-class-switcher-container"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <Text strong style={{ fontSize: 13, color: '#334155' }}>
                    {isEnglish ? 'Select Class to View Teacher Lesson Plan:' : 'Chọn Lớp Học Để Xem Giáo Án Của Giáo Viên Đã Soạn:'}
                  </Text>
                  <Tag color="blue" style={{ margin: 0, fontSize: 11, borderRadius: 4, fontWeight: 600 }}>
                    {sortedClasses.length} {isEnglish ? 'Classes Enrolled' : 'Lớp Đang Tham Gia'}
                  </Tag>
                </div>
                <Segmented
                  block
                  data-testid="student-class-switcher"
                  value={activeClassId}
                  onChange={(val) => setSelectedClassId(val)}
                  options={sortedClasses.map((cls, idx) => {
                    const isEarliest = idx === 0;
                    const isSelected = (cls.id || cls.code) === activeClassId;
                    return {
                      value: cls.id || cls.code,
                      label: (
                        <div style={{ padding: '6px 4px', textAlign: 'center', lineHeight: 1.3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? '#1d4ed8' : '#1e293b' }}>
                              [{cls.id || cls.code}] {cls.name?.split(' ')[0] || cls.name}
                            </span>
                            {isEarliest && (
                              <Tag
                                color="success"
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '0 5px',
                                  borderRadius: 4,
                                  lineHeight: '18px',
                                }}
                              >
                                {isEnglish ? '⚡ Earliest' : '⚡ Sớm nhất'}
                              </Tag>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: isSelected ? '#2563eb' : '#64748b',
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cls.schedule || 'Lịch học'}
                          </div>
                        </div>
                      ),
                    };
                  })}
                />
              </div>
            )}

            {/* Khối Chuẩn Bị Bài Học Rút Gọn (Compact Lesson Overview -> Tap Mở Book Reader Full-Screen) */}
            <LessonOverviewCompactCard
              activePrepClass={activePrepClass}
              lessonPrep={lessonPrep}
              availablePlans={availableLessonPlans}
              onSelectSession={setSelectedPrepSession}
              readingLog={activeReadingLog}
              studentUser={currentUser}
              onLogUpdated={handleReadingLogUpdated}
              isStudentRole={true}
              onOpenReader={() => setBookReaderOpen(true)}
            />
          </Card>

          {/* KHỐI 2: BÀI TẬP ĐƯỢC GIAO & CẦN LÀM (ASSIGNED HOMEWORK TASKS) */}
          <StudentHomeworkTasksCard
            homeworks={homeworks}
            onHomeworkSubmitted={(id, values) => {
              setHomeworks((prev) =>
                prev.map((h) =>
                  h.id === id ? { ...h, status: 'submitted', submittedDate: new Date().toLocaleDateString('vi-VN') } : h
                )
              );
            }}
          />

          {/* KHỐI 3: CÁC ĐÁNH GIÁ GẦN NHẤT CỦA GIÁO VIÊN BẢN XỨ */}
          <StudentRecentEvaluationsCard evaluations={evaluations} />
        </Col>

        {/* ========================================================= */}
        {/* CỘT PHẢI (Col xl=9): TÀI NGUYÊN MỞ RỘNG & HỌC LIỆU BỔ TRỢ */}
        {/* ========================================================= */}
        <Col xs={24} xl={9}>
          {/* KHỐI 3.5: ĐIỂM RÈN LUYỆN CÁ NHÂN CỦA HỌC VIÊN */}
          <StudentConductScoreCard conductSummary={studentConductSummary} />

          {/* KHỐI 3.6: PREVIEW 1–2 CÂU HỎI MỚI NHẤT -> MỞ MÀN HÌNH CHI TIẾT /lesson-qa */}
          <DashboardNewQuestionsPreviewCard
            questions={studentQuestions}
            userRole="student"
            maxItems={2}
          />

          {/* KHỐI 4: "LEARNING CORNER" (4 NỀN TẢNG QUỐC TẾ UY TÍN) */}
          <StudentLearningCornerCard />

          {/* KHỐI 5: TÀI LIỆU HỌC TẬP PHÂN THEO LỚP (DOWNLOAD & XEM TRỰC TIẾP) */}
          <StudentClassMaterialsCard
            materials={materials}
            myClasses={myClasses}
          />
        </Col>
      </Row>

      {/* Trình Đọc Sách Toàn Màn Hình Dành Cho Người Học (Book Reader + Notes + Ask Teacher Q&A + Active Timer) */}
      <LessonBookReaderModal
        open={bookReaderOpen}
        onClose={() => setBookReaderOpen(false)}
        classItem={activePrepClass}
        lessonPrep={lessonPrep}
        studentUser={currentUser}
        isStudentRole={true}
        initialLog={activeReadingLog}
        initialTab={bookReaderInitialTab}
        onLogUpdated={handleReadingLogUpdated}
      />

      {/* Modal Báo Vắng Mặt / Xin Nghỉ Phép */}
      <ClassAbsenceReportModal
        open={absenceModalOpen}
        classData={selectedClassForAbsence}
        availableClasses={myClasses}
        onClose={() => setAbsenceModalOpen(false)}
        onSuccess={() => {
          setAbsenceModalOpen(false);
        }}
      />
    </div>
  );
};

export default StudentPortalPanel;
