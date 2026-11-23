import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, Button, Space, Typography, Segmented, Empty, Badge, message } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  TableOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useAuth } from '../../../core/context/AuthContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';
import { ClassLiveCard } from './ClassLiveCard';
import { sortClassesByLivePriority } from '../utils/classTimeUtils';
import { AbsenceRequestService } from '../../attendance/services/AbsenceRequestService';
import { PendingEvaluationTaskService } from '../services/PendingEvaluationTaskService';
import { PendingEvaluationTasksCard } from './PendingEvaluationTasksCard';
import { AbsentStudentsService } from '../services/AbsentStudentsService';
import { AbsentStudentsAuditDrawer } from './AbsentStudentsAuditDrawer';
import { LessonPlanAlertService } from '../services/LessonPlanAlertService';
import { AcademicLessonPlanMonitorCard } from './AcademicLessonPlanMonitorCard';
import { AcademicPreClassPrepMonitorCard } from './AcademicPreClassPrepMonitorCard';
import { DashboardNewQuestionsPreviewCard } from './DashboardNewQuestionsPreviewCard';
import { PreClassPrepReportService } from '../../lesson-reader';
import { LessonQaManagementService } from '../../lesson-qa/services/LessonQaManagementService';

const { Title, Text } = Typography;

export const AcademicOperationsPanel = ({ academicData = {} }) => {
  const { isEnglish, t } = useLanguage();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [approvingAbsenceId, setApprovingAbsenceId] = useState(null);

  const [filterTab, setFilterTab] = useState('all'); // Mặc định hiển thị tất cả các lớp ('all' | 'today' | 'upcoming')

  const {
    currentDayVi = 'Hôm nay',
    currentDayEn = 'Today',
    todayClasses = [],
    upcomingClasses = [],
    allActiveClasses = [],
    pendingStudentRequests = 0,
    unassignedStudentsCount = 0,
  } = academicData;

  const todayDayLabel = isEnglish ? currentDayEn : currentDayVi;

  // Tự động sắp xếp ưu tiên lớp Đỏ (Đang học + Chưa điểm danh) lên đầu tiên, tiếp theo đến Xanh, rồi đến các lớp viền xám
  const displayClasses = useMemo(() => {
    let list = allActiveClasses;
    if (filterTab === 'today') list = todayClasses;
    else if (filterTab === 'upcoming') list = upcomingClasses;
    else list = allActiveClasses;

    return sortClassesByLivePriority(list, 'academic');
  }, [filterTab, todayClasses, upcomingClasses, allActiveClasses]);

  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchAbsences = async () => {
      setLoadingAbsences(true);
      try {
        const list = await AbsenceRequestService.getAllRequests();
        if (mounted) setAbsenceRequests(list || []);
      } catch (err) {
        console.warn('Lỗi đọc absence requests:', err);
      } finally {
        if (mounted) setLoadingAbsences(false);
      }
    };
    fetchAbsences();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingAbsences = useMemo(
    () => (absenceRequests || []).filter((r) => r.status === 'PENDING'),
    [absenceRequests]
  );

  const [pendingEvaluationTasks, setPendingEvaluationTasks] = useState([]);
  const [absentData, setAbsentData] = useState({ absentRecords: [], todayAbsentCount: 0 });
  const [isAbsentDrawerOpen, setIsAbsentDrawerOpen] = useState(false);
  const [prepReportData, setPrepReportData] = useState(null);
  const [loadingPrepReport, setLoadingPrepReport] = useState(false);
  const [schoolQuestions, setSchoolQuestions] = useState([]);

  useEffect(() => {
    let mounted = true;
    if (!allActiveClasses.length) return;

    PendingEvaluationTaskService.getPendingEvaluations({
      classes: allActiveClasses,
      userRole: 'academic',
      isEnglish,
    })
      .then((tasks) => {
        if (mounted) setPendingEvaluationTasks(tasks || []);
      })
      .catch((err) => console.warn('Lỗi quét evaluation tasks:', err));

    AbsentStudentsService.getAbsentStudentsData(allActiveClasses, academicData.allUsers || academicData.unassignedStudents)
      .then((res) => {
        if (mounted) setAbsentData(res || { absentRecords: [], todayAbsentCount: 0 });
      })
      .catch((err) => console.warn('Lỗi quét absent students:', err));

    setLoadingPrepReport(true);
    PreClassPrepReportService.buildPrepReport({
      classes: allActiveClasses,
      users: academicData.allUsers || [],
      userRole: 'academic',
      isEnglish,
    })
      .then((res) => {
        if (mounted) setPrepReportData(res);
      })
      .catch((err) => console.warn('Lỗi tổng hợp báo cáo chuẩn bị bài cho giáo vụ:', err))
      .finally(() => {
        if (mounted) setLoadingPrepReport(false);
      });

    LessonQaManagementService.getScopedQaDataset(currentUser)
      .then((res) => {
        if (mounted) setSchoolQuestions(res?.questions || []);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [allActiveClasses, isEnglish, academicData.allUsers]);

  const handleAcknowledgeAbsence = async (reqId) => {
    try {
      setApprovingAbsenceId(reqId);
      await AbsenceRequestService.updateRequestStatus(reqId, 'APPROVED', {
        id: currentUser?.id || currentUser?.code || 'ACA001',
        name: currentUser?.name || currentUser?.displayName || 'Academic Advisor',
      });
      message.success(
        isEnglish
          ? 'Absence request approved! Teacher and student have been notified.'
          : 'Đã phê duyệt đơn xin nghỉ! Giáo viên và học viên đã nhận được thông báo.'
      );
      setAbsenceRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'APPROVED' } : r))
      );
    } catch (err) {
      message.error(err.message || 'Lỗi phê duyệt đơn xin nghỉ');
    } finally {
      setApprovingAbsenceId(null);
    }
  };

  const handleCardClick = (cls) => {
    navigate(`/classroom/${encodeURIComponent(cls.id)}`);
  };

  const lessonPlanAlertData = useMemo(() => {
    return LessonPlanAlertService.getLessonPlanAlerts({
      classes: allActiveClasses,
      userRole: 'academic',
      isEnglish,
    });
  }, [allActiveClasses, isEnglish]);

  return (
    <div>
      {/* 1. Hàng Thống Kê 4 Chỉ Số Vận Hành Giáo Vụ */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 20 }}>
        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>
                  {isEnglish ? `Live Today (${todayDayLabel})` : `Lớp Hôm Nay (${todayDayLabel})`}
                </Text>
              }
              value={todayClasses.length}
              prefix={<CalendarOutlined style={{ color: '#1890ff', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'cls' : 'lớp'}</span>}
              styles={{ content: { color: '#1890ff', fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Total active:' : 'Tổng số lớp:'} <Text strong>{allActiveClasses.length}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #52c41a',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>
                  {isEnglish ? 'Running Classes' : 'Tổng Lớp Đang Dạy'}
                </Text>
              }
              value={allActiveClasses.length}
              prefix={<TeamOutlined style={{ color: '#52c41a', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'cls' : 'lớp'}</span>}
              styles={{ content: { color: '#52c41a', fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Cloud Firestore' : 'Từ Cloud Firestore'}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #fa8c16',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>
                  {isEnglish ? 'Pending Requests' : 'Yêu Cầu Chờ Duyệt'}
                </Text>
              }
              value={pendingStudentRequests}
              prefix={<UserAddOutlined style={{ color: '#fa8c16', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'reqs' : 'y/c'}</span>}
              styles={{ content: { color: '#fa8c16', fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Awaiting approval' : 'Chờ giáo vụ duyệt'}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #722ed1',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>
                  {isEnglish ? 'Unassigned Students' : 'HV Chưa Xếp Lớp'}
                </Text>
              }
              value={unassignedStudentsCount}
              prefix={<UserAddOutlined style={{ color: '#722ed1', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'std' : 'học viên'}</span>}
              styles={{ content: { color: '#722ed1', fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Placement needed' : 'Cần kiểm tra xếp lớp'}
            </div>
          </Card>
        </Col>

        {/* Thẻ KPI Học Viên Vắng Học Hôm Nay */}
        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            hoverable
            onClick={() => setIsAbsentDrawerOpen(true)}
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #ff4d4f',
              backgroundColor: absentData.todayAbsentCount > 0 ? '#fff1f0' : '#ffffff',
              height: '100%',
              cursor: 'pointer',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
            data-testid="kpi-today-absent-students-academic"
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3, color: '#cf1322' }}>
                  {isEnglish ? "Today's Absent Students" : 'Học Viên Vắng Hôm Nay'}
                </Text>
              }
              value={absentData.todayAbsentCount}
              prefix={<UserDeleteOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'std' : 'học viên'}</span>}
              styles={{ content: { color: '#cf1322', fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#cf1322', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              👉 {isEnglish ? 'Click to inspect list' : 'Chạm để xem chi tiết'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2. Nhiệm Vụ Giáo Vụ Cần Xử Lý: Giáo Viên Chưa Hoàn Tất Đánh Giá */}
      <PendingEvaluationTasksCard tasks={pendingEvaluationTasks} />

      {/* 2b. Đôn Đốc Soạn Giáo Án Trước 24H & Báo Thiếu Giáo Trình */}
      <AcademicLessonPlanMonitorCard
        alerts={lessonPlanAlertData.urgentAlerts}
        pastMissingCount={lessonPlanAlertData.pastMissingCount}
      />

      {/* 2b-2. Preview 1–2 Câu Hỏi Học Viên Mới Nhất Toàn Trường -> Mở /lesson-qa */}
      <DashboardNewQuestionsPreviewCard
        questions={schoolQuestions}
        userRole="academic"
        maxItems={2}
      />

      {/* 2c. Giám Sát Học Viên Chuẩn Bị Bài Trước Giờ Học Toàn Trường */}
      <AcademicPreClassPrepMonitorCard
        reportData={prepReportData}
        loading={loadingPrepReport}
        currentUser={currentUser}
      />

      {/* Thông Báo Đơn Báo Vắng Mặt Mới Cần Giáo Vụ Tiếp Nhận */}
      {pendingAbsences.length > 0 && (
        <Card
          bordered={false}
          style={{
            marginBottom: isMobile ? 12 : 20,
            borderRadius: 12,
            borderLeft: '4px solid #fa8c16',
            backgroundColor: '#fffbe6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          styles={{ body: { padding: isMobile ? '10px 12px' : '14px 18px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
            <Space size={8}>
              <Badge count={pendingAbsences.length} overflowCount={99}>
                <ExclamationCircleOutlined style={{ color: '#d46b08', fontSize: 16 }} />
              </Badge>
              <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#873800' }}>
                {isEnglish
                  ? `Absence Notices (${pendingAbsences.length})`
                  : `Đơn Báo Vắng Mặt Mới (${pendingAbsences.length})`}
              </Text>
            </Space>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingAbsences.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #ffd591',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <Space size={6} wrap>
                    <Tag color={req.userRole === 'teacher' ? 'purple' : 'green'} style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                      {req.userRole === 'teacher' ? 'GV' : 'HV'}: {req.userName}
                    </Tag>
                    <Tag color="blue" style={{ margin: 0, whiteSpace: 'nowrap' }}>{req.classId}</Tag>
                    <Tag color="orange" style={{ margin: 0, whiteSpace: 'nowrap' }}>📅 {req.absenceDate}</Tag>
                    <Tag color="red" style={{ margin: 0, whiteSpace: 'nowrap' }}>{req.reason}</Tag>
                  </Space>
                  {req.note && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                      💬 "{req.note}"
                    </div>
                  )}
                </div>

                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={approvingAbsenceId === req.id}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', borderRadius: 6, fontWeight: 600 }}
                  onClick={() => handleAcknowledgeAbsence(req.id)}
                  data-testid={`btn-approve-absence-${req.id}`}
                >
                  {isEnglish ? 'Approve & Notify' : 'Duyệt & Báo Giáo Viên'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 2. KHỐI GIÁM SÁT REAL-TIME CÁC CA HỌC DẠNG CARD */}
      <Card
        title={
          <Space>
            <VideoCameraOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
              {isEnglish
                ? (isMobile ? 'Live Classrooms' : 'Live Classrooms Monitoring')
                : (isMobile ? 'Giám Sát Ca Học' : 'Giám Sát Vận Hành Lớp Trực Tuyến')}
            </span>
          </Space>
        }
        extra={
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/courses-classes?tab=classes')}>
            {isEnglish ? (isMobile ? 'Classes →' : 'Manage All Classes →') : (isMobile ? 'Tất cả lớp →' : 'Quản Lý Tất Cả Lớp →')}
          </Button>
        }
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
      >
        {/* Bộ Lọc Tab Phân Loại Lớp Học - Đặt trong Card body cho trải nghiệm Mobile chuẩn */}
        <div style={{ marginBottom: 12 }}>
          <Segmented
            block
            value={filterTab}
            onChange={setFilterTab}
            options={[
              {
                label: isEnglish ? (isMobile ? `All (${allActiveClasses.length})` : `All Classes (${allActiveClasses.length})`) : (isMobile ? `Tất cả (${allActiveClasses.length})` : `Tất cả lớp (${allActiveClasses.length})`),
                value: 'all',
              },
              {
                label: isEnglish ? (isMobile ? `Today (${todayClasses.length})` : `Today (${todayClasses.length})`) : (isMobile ? `Hôm nay (${todayClasses.length})` : `Hôm nay (${todayClasses.length})`),
                value: 'today',
              },
              {
                label: isEnglish ? (isMobile ? `Prep (${upcomingClasses.length})` : `Preparing (${upcomingClasses.length})`) : (isMobile ? `Sắp mở (${upcomingClasses.length})` : `Sắp khai giảng (${upcomingClasses.length})`),
                value: 'upcoming',
              },
            ]}
            style={{ fontWeight: 600, width: '100%' }}
          />
        </div>

        {/* Thanh Chú Thích Trạng Thái Real-Time (Legend) & Hướng Dẫn */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {!isMobile && (
            <div style={{ fontSize: 13, color: '#64748b' }}>
              💡 {isEnglish
                ? 'Live classes with pending attendance are prioritized at the top.'
                : 'Các lớp đang học chưa điểm danh được ưu tiên đẩy lên đầu trang.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, width: isMobile ? '100%' : 'auto' }}>
            <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
              🔴 {isEnglish ? 'Live: Unmarked' : 'Đang học: Chưa điểm danh'}
            </Tag>
            <Tag color="success" style={{ borderRadius: 6, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
              🟢 {isEnglish ? 'Live: Stable' : 'Đang học ổn định'}
            </Tag>
            <Tag style={{ borderRadius: 6, backgroundColor: '#fafafa', borderColor: '#d9d9d9', color: '#64748b', margin: 0, whiteSpace: 'nowrap' }}>
              ⚪ {isEnglish ? 'Upcoming' : 'Chưa học'}
            </Tag>
          </div>
        </div>

        {displayClasses.length > 0 ? (
          <Row gutter={[16, 16]}>
            {displayClasses.map((cls) => (
              <Col xs={24} sm={12} md={12} lg={12} xl={8} xxl={6} key={cls.id}>
                <ClassLiveCard cls={cls} role="academic" onClick={handleCardClick} />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: 8 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong style={{ fontSize: 15, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                    {isEnglish
                      ? `No live classes scheduled for today (${todayDayLabel})`
                      : `Hôm nay (${todayDayLabel}) không có ca học trực tuyến nào diễn ra`}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {upcomingClasses.length > 0
                      ? (isEnglish
                          ? `There are ${upcomingClasses.length} class(es) currently preparing to start. Click the tab above or the button below to view them.`
                          : `Hiện có ${upcomingClasses.length} lớp học đang trong giai đoạn chuẩn bị khai giảng. Bạn có thể chọn tab để xem lịch dự kiến.`)
                      : (isEnglish ? 'All courses and classes are managed in the curriculum center.' : 'Tất cả lớp học được theo dõi trong phân hệ Khóa học & Lớp học.')}
                  </Text>
                </div>
              }
            >
              {upcomingClasses.length > 0 && filterTab === 'today' && (
                <Button type="primary" ghost onClick={() => setFilterTab('upcoming')} style={{ marginTop: 8, borderRadius: 6 }}>
                  {isEnglish ? `View Upcoming Classes (${upcomingClasses.length})` : `Xem Lớp Sắp Khai Giảng (${upcomingClasses.length})`}
                </Button>
              )}
            </Empty>
          </div>
        )}
      </Card>

      {/* Drawer Kiểm Toán Học Viên Vắng Học & Không Vào Lớp */}
      <AbsentStudentsAuditDrawer
        open={isAbsentDrawerOpen}
        onClose={() => setIsAbsentDrawerOpen(false)}
        absentRecords={absentData.absentRecords}
        todayAbsentCount={absentData.todayAbsentCount}
      />
    </div>
  );
};
