import React, { useMemo, useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, Table, Progress, Button, Space, Typography } from 'antd';
import {
  DollarOutlined,
  TeamOutlined,
  GlobalOutlined,
  BookOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';
import { AbsentStudentsService } from '../services/AbsentStudentsService';
import { AbsentStudentsAuditDrawer } from './AbsentStudentsAuditDrawer';
import { LessonPlanAlertService } from '../services/LessonPlanAlertService';
import { DirectorCurriculumReadinessCard } from './DirectorCurriculumReadinessCard';
import { DirectorStudentReadinessCard } from './DirectorStudentReadinessCard';
import { DashboardNewQuestionsPreviewCard } from './DashboardNewQuestionsPreviewCard';
import { PreClassPrepReportService } from '../../lesson-reader';
import { LessonQaManagementService } from '../../lesson-qa/services/LessonQaManagementService';
import { useAuth } from '../../../core/context/AuthContext';

const { Title, Text } = Typography;

export const DirectorOverviewPanel = ({ directorData = {} }) => {
  const { currentUser } = useAuth();
  const { isEnglish, t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const {
    totalStudents = 0,
    totalTeachers = 0,
    totalAcademicStaff = 0,
    totalClasses = 0,
    totalCourses = 0,
    paidTuitionTotal = 0,
    pendingTuitionTotal = 0,
    totalPayrollCommitted = 0,
    grossProfit = 0,
    fillRate = 0,
    courseStats = [],
    allActiveClasses = [],
  } = directorData;

  const lessonPlanAlertData = useMemo(() => {
    return LessonPlanAlertService.getLessonPlanAlerts({
      classes: allActiveClasses,
      userRole: 'director',
      isEnglish,
    });
  }, [allActiveClasses, isEnglish]);

  const [absentData, setAbsentData] = useState({ absentRecords: [], todayAbsentCount: 0 });
  const [isAbsentDrawerOpen, setIsAbsentDrawerOpen] = useState(false);
  const [prepReportData, setPrepReportData] = useState(null);
  const [loadingPrepReport, setLoadingPrepReport] = useState(false);
  const [schoolQuestions, setSchoolQuestions] = useState([]);

  useEffect(() => {
    let mounted = true;
    AbsentStudentsService.getAbsentStudentsData()
      .then((res) => {
        if (mounted) setAbsentData(res || { absentRecords: [], todayAbsentCount: 0 });
      })
      .catch((err) => console.warn('Lỗi quét absent students:', err));

    if (allActiveClasses.length > 0) {
      setLoadingPrepReport(true);
      PreClassPrepReportService.buildPrepReport({
        classes: allActiveClasses,
        users: directorData.allUsers || [],
        userRole: 'director',
        isEnglish,
      })
        .then((res) => {
          if (mounted) setPrepReportData(res);
        })
        .catch((err) => console.warn('Lỗi tổng hợp báo cáo chuẩn bị bài cho giám đốc:', err))
        .finally(() => {
          if (mounted) setLoadingPrepReport(false);
        });
    }

    LessonQaManagementService.getScopedQaDataset(currentUser)
      .then((res) => {
        if (mounted) setSchoolQuestions(res?.questions || []);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [allActiveClasses, directorData.allUsers, isEnglish]);

  const courseColumns = useMemo(
    () => [
      {
        title: isEnglish ? 'Course ID' : 'Mã Khóa Học',
        dataIndex: 'id',
        key: 'id',
        width: 90,
        render: (v) => <Text strong style={{ whiteSpace: 'nowrap' }}>{v}</Text>,
      },
      {
        title: isEnglish ? 'Program / Curriculum' : 'Chương Trình Đào Tạo',
        dataIndex: 'name',
        key: 'name',
        minWidth: 160,
        render: (v) => (
          <Text strong style={{ color: '#1890ff' }}>
            {v}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Level' : 'Cấp Độ',
        dataIndex: 'level',
        key: 'level',
        width: 130,
        render: (v) => <Tag color="blue" style={{ margin: 0, whiteSpace: 'nowrap' }}>{v}</Tag>,
      },
      {
        title: isEnglish ? 'Active Classes' : 'Số Lớp Đang Mở',
        dataIndex: 'activeClassesCount',
        key: 'activeClassesCount',
        width: 110,
        render: (v) => <span style={{ whiteSpace: 'nowrap' }}>{`${v} ${isEnglish ? 'classes' : 'lớp'}`}</span>,
      },
      {
        title: isEnglish ? 'Enrolled Students' : 'Học Viên Đang Học',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: 130,
        render: (v) => (
          <Tag color="purple" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            {v} {isEnglish ? 'students' : 'học viên'}
          </Tag>
        ),
      },
      {
        title: isEnglish ? 'Realized Revenue' : 'Doanh Thu Thực Thu',
        dataIndex: 'courseTuition',
        key: 'courseTuition',
        width: 140,
        render: (v) => (
          <Text strong style={{ color: '#16a34a', whiteSpace: 'nowrap' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
    ],
    [isEnglish]
  );

  return (
    <div>
      {/* 1. Hàng Thống Kê 4 Thẻ KPI Chiến Lược */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 20 }}>
        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #16a34a',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 18px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Monthly Revenue' : 'Doanh Thu Thực Thu'}</Text>}
              value={paidTuitionTotal}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#16a34a', fontSize: isMobile ? 14 : 17 }} />}
              styles={{ content: { color: '#16a34a', fontWeight: 700, fontSize: isMobile ? 15 : 'clamp(15px, 1.35vw, 21px)', whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Pending:' : 'Chờ đối soát:'}{' '}
              <Text strong>{formatCurrency(pendingTuitionTotal)}</Text>
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
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 18px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Committed Payroll' : 'Quỹ Lương Nhân Sự'}</Text>}
              value={totalPayrollCommitted}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#722ed1', fontSize: isMobile ? 14 : 17 }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 700, fontSize: isMobile ? 15 : 'clamp(15px, 1.35vw, 21px)', whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Staff:' : 'Nhân sự:'}{' '}
              <Text strong>{totalTeachers + totalAcademicStaff} {isEnglish ? 'members' : 'người'}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 18px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Estimated Margin' : 'Lợi Nhuận Gộp'}</Text>}
              value={grossProfit}
              formatter={(v) => formatCurrency(v)}
              prefix={<RiseOutlined style={{ color: grossProfit >= 0 ? '#1890ff' : '#cf1322', fontSize: isMobile ? 14 : 17 }} />}
              styles={{ content: { color: grossProfit >= 0 ? '#1890ff' : '#cf1322', fontWeight: 700, fontSize: isMobile ? 15 : 'clamp(15px, 1.35vw, 21px)', whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Gross profit' : 'Sau trừ chi phí'}
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
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 18px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Average Fill Rate' : 'Tỷ Lệ Lấp Đầy'}</Text>}
              value={fillRate}
              suffix={<span style={{ fontSize: isMobile ? 12 : 14 }}>%</span>}
              prefix={<TeamOutlined style={{ color: '#fa8c16', fontSize: isMobile ? 14 : 17 }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 700, fontSize: isMobile ? 18 : 22 } }}
            />
            <Progress percent={fillRate} strokeColor="#fa8c16" showInfo={false} size="small" style={{ marginTop: 4 }} />
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
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 18px' } }}
            data-testid="kpi-today-absent-students-director"
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3, color: '#cf1322' }}>
                  {isEnglish ? "Today's Absent Students" : 'Học Viên Vắng Hôm Nay'}
                </Text>
              }
              value={absentData.todayAbsentCount}
              prefix={<UserDeleteOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? 14 : 17 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'std' : 'học viên'}</span>}
              styles={{ content: { color: '#cf1322', fontWeight: 700, fontSize: isMobile ? 18 : 22 } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#cf1322', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              👉 {isEnglish ? 'Click to inspect list' : 'Chạm để xem chi tiết'}
            </div>
          </Card>
        </Col>

        {/* Thẻ KPI Sẵn Sàng Bài Học 24H (Lesson Plan & Curriculum Readiness) */}
        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <DirectorCurriculumReadinessCard
            alerts={lessonPlanAlertData.urgentAlerts}
            complianceRate={lessonPlanAlertData.complianceRate}
            readyCount={lessonPlanAlertData.readyCount}
            totalUpcoming24h={lessonPlanAlertData.totalUpcoming24h}
          />
        </Col>

        {/* Thẻ KPI Học Viên Đọc Bài & Điểm Rèn Luyện Toàn Trường */}
        <Col xs={12} sm={12} md={12} lg={12} xl={6}>
          <DirectorStudentReadinessCard
            reportData={prepReportData}
            loading={loadingPrepReport}
          />
        </Col>
      </Row>

      {/* 1.5. Preview 1–2 Câu Hỏi Mới Nhất Toàn Trường -> Mở /lesson-qa */}
      <DashboardNewQuestionsPreviewCard
        questions={schoolQuestions}
        userRole="director"
        maxItems={2}
      />

      {/* 2. Quy Mô Toàn Hệ Thống & Phân Bổ Chương Trình Đào Tạo */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                  {isEnglish
                    ? (isMobile ? 'Curriculum Scale' : 'Curriculum Scale & Revenue Breakdown')
                    : (isMobile ? 'Quy Mô Khóa Học' : 'Quy Mô Khóa Học & Phân Bổ Doanh Thu Thực Tế')}
                </span>
              </Space>
            }
            extra={
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/courses-classes')}>
                {isEnglish ? (isMobile ? 'All →' : 'View All Courses →') : (isMobile ? 'Tất cả →' : 'Xem Tất Cả Khóa Học →')}
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
          >
            <Table
              dataSource={courseStats}
              columns={courseColumns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 760 }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                  {isEnglish
                    ? (isMobile ? 'System Capacity' : 'System Capacity & Executive Shortcuts')
                    : (isMobile ? 'Quy Mô Hệ Thống' : 'Tổng Thể Quy Mô & Điều Hành')}
                </span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <Space size={6}>
                  <TeamOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                  <Text style={{ fontSize: isMobile ? 12 : 14 }}>{isEnglish ? 'Active Students:' : 'Học viên đang học:'}</Text>
                </Space>
                <Tag color="blue" style={{ fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                  {totalStudents} {isEnglish ? 'Students' : 'Học viên'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <Space size={6}>
                  <GlobalOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  <Text style={{ fontSize: isMobile ? 12 : 14 }}>{isEnglish ? 'Foreign Teachers:' : 'Giáo viên bản xứ:'}</Text>
                </Space>
                <Tag color="green" style={{ fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                  {totalTeachers} {isEnglish ? 'Teachers' : 'Giáo viên'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <Space size={6}>
                  <CheckCircleOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                  <Text style={{ fontSize: isMobile ? 12 : 14 }}>{isEnglish ? 'Coordinators:' : 'Cán bộ giáo vụ:'}</Text>
                </Space>
                <Tag color="purple" style={{ fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                  {totalAcademicStaff} {isEnglish ? 'Staff' : 'Nhân sự'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <Space size={6}>
                  <BookOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
                  <Text style={{ fontSize: isMobile ? 12 : 14 }}>{isEnglish ? 'Active Classes:' : 'Lớp đang vận hành:'}</Text>
                </Space>
                <Tag color="orange" style={{ fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                  {totalClasses} {isEnglish ? 'Classes' : 'Lớp học'}
                </Tag>
              </div>

              <Button
                type="primary"
                block
                size={isMobile ? 'middle' : 'large'}
                style={{ marginTop: 4, borderRadius: 8, height: 40, fontWeight: 600 }}
                onClick={() => navigate('/user-management')}
              >
                {isEnglish ? 'Manage All Users & Directory' : 'Quản Trị Người Dùng & Nhân Sự'}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Drawer Kiểm Toán Học Viên Vắng Học Cho Giám Đốc */}
      <AbsentStudentsAuditDrawer
        open={isAbsentDrawerOpen}
        onClose={() => setIsAbsentDrawerOpen(false)}
        absentRecords={absentData.absentRecords}
        todayAbsentCount={absentData.todayAbsentCount}
      />
    </div>
  );
};

