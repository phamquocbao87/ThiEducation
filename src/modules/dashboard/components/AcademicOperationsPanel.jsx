import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, Button, Space, Typography, Segmented, Empty, Badge, message } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  TableOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ClassLiveCard } from './ClassLiveCard';
import { sortClassesByLivePriority } from '../utils/classTimeUtils';
import { AbsenceRequestService } from '../../attendance/services/AbsenceRequestService';

const { Title, Text } = Typography;

export const AcademicOperationsPanel = ({ academicData = {} }) => {
  const { isEnglish, t } = useLanguage();
  const navigate = useNavigate();

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

  const handleAcknowledgeAbsence = async (reqId) => {
    try {
      await AbsenceRequestService.updateRequestStatus(reqId, 'ACKNOWLEDGED');
      message.success(isEnglish ? 'Absence notice acknowledged!' : 'Đã tiếp nhận đơn báo vắng!');
      setAbsenceRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'ACKNOWLEDGED' } : r))
      );
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCardClick = (cls) => {
    navigate(`/classroom/${encodeURIComponent(cls.id)}`);
  };

  return (
    <div>
      {/* 1. Hàng Thống Kê 4 Chỉ Số Vận Hành Giáo Vụ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? `Live Classes Today (${todayDayLabel})` : `Lớp Học Hôm Nay (${todayDayLabel})`}</Text>}
              value={todayClasses.length}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              suffix={isEnglish ? 'classes' : 'lớp'}
              styles={{ content: { color: '#1890ff', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Total active online classes:' : 'Tổng số lớp đang hoạt động:'} <Text strong>{allActiveClasses.length}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #52c41a',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Total Running Classes' : 'Tổng Lớp Đang Giảng Dạy'}</Text>}
              value={allActiveClasses.length}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              suffix={isEnglish ? 'classes' : 'lớp'}
              styles={{ content: { color: '#52c41a', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Synced directly from Firestore' : 'Đồng bộ từ Cloud Firestore'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #fa8c16',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Pending Class Enrollments' : 'Yêu Cầu Vào Lớp Chờ Duyệt'}</Text>}
              value={pendingStudentRequests}
              prefix={<UserAddOutlined style={{ color: '#fa8c16' }} />}
              suffix={isEnglish ? 'requests' : 'yêu cầu'}
              styles={{ content: { color: '#fa8c16', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Awaiting coordinator approval' : 'Đang chờ giáo vụ phê duyệt'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #722ed1',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Unassigned New Students' : 'Học Viên Chưa Xếp Lớp'}</Text>}
              value={unassignedStudentsCount}
              prefix={<UserAddOutlined style={{ color: '#722ed1' }} />}
              suffix={isEnglish ? 'students' : 'học viên'}
              styles={{ content: { color: '#722ed1', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Ready for placement assessment' : 'Cần hẹn lịch kiểm tra năng lực'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Thông Báo Đơn Báo Vắng Mặt Mới Cần Giáo Vụ Tiếp Nhận */}
      {pendingAbsences.length > 0 && (
        <Card
          bordered={false}
          style={{
            marginBottom: 20,
            borderRadius: 12,
            borderLeft: '4px solid #fa8c16',
            backgroundColor: '#fffbe6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          styles={{ body: { padding: '14px 18px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <Space size={8}>
              <Badge count={pendingAbsences.length} overflowCount={99}>
                <ExclamationCircleOutlined style={{ color: '#d46b08', fontSize: 18 }} />
              </Badge>
              <Text strong style={{ fontSize: 15, color: '#873800' }}>
                {isEnglish
                  ? `New Absence & Leave Notices (${pendingAbsences.length}) — Action Required`
                  : `Đơn Báo Vắng Mặt Mới Cần Tiếp Nhận (${pendingAbsences.length} đơn từ GV & Học Viên)`}
              </Text>
            </Space>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingAbsences.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #ffd591',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <Space size={8} wrap>
                    <Tag color={req.userRole === 'teacher' ? 'purple' : 'green'} style={{ fontWeight: 600 }}>
                      {req.userRole === 'teacher' ? 'Giáo Viên' : 'Học Viên'}: {req.userName} ({req.userId})
                    </Tag>
                    <Tag color="blue">{req.classId} — {req.className}</Tag>
                    <Tag color="orange">📅 Ngày vắng: {req.absenceDate} ({req.sessionTime})</Tag>
                    <Tag color="red">Lý do: {req.reason}</Tag>
                  </Space>
                  {req.note && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                      💬 "{req.note}"
                    </div>
                  )}
                </div>

                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 6, fontWeight: 600 }}
                  onClick={() => handleAcknowledgeAbsence(req.id)}
                >
                  {isEnglish ? 'Acknowledge' : 'Đã Tiếp Nhận'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 2. KHỐI GIÁM SÁT REAL-TIME CÁC CA HỌC DẠNG CARD */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <Space>
              <VideoCameraOutlined style={{ color: '#1890ff', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {isEnglish
                  ? `Live Classrooms Monitoring (Active Alerts Prioritized)`
                  : `Giám Sát Vận Hành Lớp Trực Tuyến (Ưu tiên ca đang học & cảnh báo)`}
              </span>
            </Space>

            {/* Bộ Lọc Tab Phân Loại Lớp Học */}
            <Segmented
              value={filterTab}
              onChange={setFilterTab}
              options={[
                {
                  label: isEnglish ? `All Classes (${allActiveClasses.length})` : `Tất cả lớp (${allActiveClasses.length})`,
                  value: 'all',
                },
                {
                  label: isEnglish ? `Today (${todayClasses.length})` : `Hôm nay (${todayClasses.length})`,
                  value: 'today',
                },
                {
                  label: isEnglish ? `Preparing (${upcomingClasses.length})` : `Sắp khai giảng (${upcomingClasses.length})`,
                  value: 'upcoming',
                },
              ]}
              style={{ fontWeight: 600 }}
            />
          </div>
        }
        extra={
          <Button type="link" onClick={() => navigate('/courses-classes?tab=classes')}>
            {isEnglish ? 'Manage All Classes' : 'Quản Lý Tất Cả Lớp'} <ArrowRightOutlined />
          </Button>
        }
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        {/* Thanh Chú Thích Trạng Thái Real-Time (Legend) & Hướng Dẫn */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            💡 {isEnglish
              ? 'Real-time sorting: Live classes with pending attendance are prioritized at the top. Upcoming classes have a neutral grey border.'
              : 'Tự động sắp xếp: Các lớp đang học chưa điểm danh được ưu tiên đẩy lên đầu trang. Các lớp chưa học hiển thị viền xám.'}
          </div>

          <Space size={6} wrap style={{ fontSize: 12 }}>
            <Tag color="error" style={{ borderRadius: 6, fontWeight: 600 }}>
              🔴 {isEnglish ? 'Live: Attendance Pending' : 'Đang học: Chưa điểm danh'}
            </Tag>
            <Tag color="success" style={{ borderRadius: 6, fontWeight: 600 }}>
              🟢 {isEnglish ? 'Live: Stable' : 'Đang học ổn định'}
            </Tag>
            <Tag style={{ borderRadius: 6, backgroundColor: '#fafafa', borderColor: '#d9d9d9', color: '#64748b' }}>
              ⚪ {isEnglish ? 'Not started yet (Grey border)' : 'Chưa học (Viền xám)'}
            </Tag>
          </Space>
        </div>

        {displayClasses.length > 0 ? (
          <Row gutter={[16, 16]}>
            {displayClasses.map((cls) => (
              <Col xs={24} sm={12} lg={8} key={cls.id}>
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

    </div>
  );
};
