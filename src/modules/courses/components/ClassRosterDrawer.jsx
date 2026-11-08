import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Descriptions,
  Table,
  Tag,
  Space,
  Avatar,
  Button,
  Row,
  Col,
  Card,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  EditOutlined,
  LinkOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  MessageOutlined,
  UserAddOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { CLASS_STATUS_COLORS } from '../models/courses.model';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassService } from '../services/ClassService';
import { formatScheduleForViewer } from '../../../shared/utils/scheduleUtils';

const { Title, Text } = Typography;

export const ClassRosterDrawer = ({
  open,
  targetClass,
  allStudents = [],
  teachers = [],
  currentUser,
  canManage = false,
  onClose,
  onEdit,
  onRequestTeachClass,
  onApproveTeacherRequest,
  onRejectTeacherRequest,
  onRequestEnrollClass,
  onApproveStudentRequest,
  onRejectStudentRequest,
}) => {
  const { isEnglish } = useLanguage();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!targetClass) return null;

  const enrolledStudents = ClassService.getStudentsInClass(targetClass, allStudents);
  const studentTotal = Math.max(
    enrolledStudents.length,
    Number(targetClass.totalStudents) || 0
  );
  const statusColor = CLASS_STATUS_COLORS[targetClass.operationStatus] || 'green';
  const isUnassignedTeacher =
    !targetClass.teacherId || targetClass.teacherName === 'Chưa phân công';

  const pendingTeacherRequests = Array.isArray(targetClass.pendingTeacherRequests)
    ? targetClass.pendingTeacherRequests
    : [];
  const pendingStudentRequests = Array.isArray(targetClass.pendingStudentRequests)
    ? targetClass.pendingStudentRequests
    : [];

  const holidays = Array.isArray(targetClass.holidays)
    ? targetClass.holidays
    : Array.isArray(targetClass.scheduleData?.holidays)
    ? targetClass.scheduleData.holidays
    : [];

  const viewerCurrentSchedule = formatScheduleForViewer(
    targetClass.scheduleData || targetClass.schedule,
    isEnglish,
    currentUser
  );

  const scheduleHistory =
    Array.isArray(targetClass.scheduleHistory) && targetClass.scheduleHistory.length > 0
      ? targetClass.scheduleHistory
      : [
          {
            version: 1,
            effectiveFrom: targetClass.startDate || '04/02/2026',
            effectiveTo: null,
            schedule: targetClass.schedule,
            status: 'ACTIVE',
            note: 'Lịch học khởi tạo từ ngày khai giảng lớp',
          },
        ];

  const studentZoomUrl =
    targetClass.zoomStudentLink ||
    targetClass.meetingLink ||
    'https://zoom.us/j/888999101';
  const hostZoomUrl =
    targetClass.zoomHostLink || studentZoomUrl.replace('/j/', '/s/') + '?role=host';
  const zaloUrl =
    targetClass.zaloGroupLink || 'https://zalo.me/g/lakeducation_class';

  const columns = [
    {
      title: isEnglish ? 'Student Name' : 'Họ & Tên Học Viên',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div>
            <Text strong>{record.name}</Text>
            {record.englishName && (
              <span style={{ color: '#1890ff', fontSize: 12, marginLeft: 6 }}>
                ({record.englishName})
              </span>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: isEnglish ? 'Student ID' : 'Mã HV',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag color="geekblue">{id}</Tag>,
    },
    {
      title: isEnglish ? 'Attendance Rate' : 'Chuyên Cần',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      align: 'center',
      render: (rate) => (
        <Tag color={rate >= 90 ? 'green' : 'orange'}>{rate || 95}%</Tag>
      ),
    },
    {
      title: isEnglish ? 'Tuition Status' : 'Tình Trạng Học Phí',
      dataIndex: 'tuitionStatus',
      key: 'tuitionStatus',
      render: (status) => {
        const color = status === 'PAID' ? 'green' : status === 'OVERDUE' ? 'red' : 'orange';
        const label =
          status === 'PAID'
            ? isEnglish
              ? 'Paid in Full'
              : 'Đã đóng đủ'
            : status === 'OVERDUE'
            ? isEnglish
              ? 'Overdue'
              : 'Quá hạn'
            : isEnglish
            ? 'Pending'
            : 'Chưa đóng';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: isEnglish ? 'Parent Contact' : 'Phụ Huynh & SĐT',
      key: 'parent',
      render: (_, record) => (
        <div>
          <div>
            <Text style={{ fontSize: 12 }}>{record.parentName || 'Chưa cập nhật'}</Text>
          </div>
          {record.phone && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <TeamOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>
            {isEnglish ? 'Class Details & Student Roster' : 'Chi Tiết Lớp Học & Danh Sách Học Viên'}
          </span>
        </Space>
      }
      open={open}
      width={isMobile ? '100%' : 760}
      onClose={onClose}
      destroyOnClose
      extra={
        canManage && onEdit ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              onClose();
              onEdit(targetClass);
            }}
            style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
          >
            {isEnglish ? 'Edit Class' : 'Chỉnh Sửa'}
          </Button>
        ) : null
      }
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: 10,
            padding: '4px 0',
          }}
        >
          <Button onClick={onClose} style={{ height: 40, borderRadius: 8, minWidth: 90 }}>
            {isEnglish ? 'Close' : 'Đóng'}
          </Button>
          {zaloUrl && (
            <Button
              icon={<MessageOutlined />}
              onClick={() => window.open(zaloUrl, '_blank')}
              style={{
                height: 40,
                borderRadius: 8,
                borderColor: '#0068ff',
                color: '#0068ff',
                fontWeight: 500,
              }}
            >
              {isEnglish ? 'Zalo Group' : 'Nhóm Zalo Lớp'}
            </Button>
          )}
          <Button
            icon={<LinkOutlined />}
            onClick={() =>
              window.open(canManage ? hostZoomUrl : studentZoomUrl, '_blank')
            }
            style={{
              height: 40,
              borderRadius: 8,
              borderColor: '#722ed1',
              color: '#722ed1',
              fontWeight: 500,
            }}
          >
            {isEnglish ? 'Open Zoom Room' : 'Mở Phòng Zoom'}
          </Button>
          {canManage && onEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                onClose();
                onEdit(targetClass);
              }}
              style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
            >
              {isEnglish ? 'Edit Class & Roster' : 'Chỉnh Sửa Lớp Học'}
            </Button>
          )}
        </div>
      }
    >
      {/* 1. Header Lớp Học */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap size={8}>
          <Tag color="geekblue" style={{ fontSize: 13, padding: '2px 8px', fontWeight: 700 }}>
            {targetClass.id}
          </Tag>
          <Tag color="purple" style={{ fontSize: 13, padding: '2px 8px' }}>
            {targetClass.courseName || targetClass.courseId}
          </Tag>
          {targetClass.startDate && (
            <Tag color="cyan" style={{ fontSize: 13, padding: '2px 8px' }}>
              {isEnglish ? `Start: ${targetClass.startDate}` : `Khai giảng: ${targetClass.startDate}`}
            </Tag>
          )}
          <Tag color={statusColor} style={{ fontSize: 13, padding: '2px 8px' }}>
            {targetClass.operationStatus || (isEnglish ? 'Active' : 'Đang học ổn định')}
          </Tag>
        </Space>
        <Title level={4} style={{ margin: '10px 0 4px', color: '#0f172a' }}>
          {targetClass.name}
        </Title>
      </div>

      {/* 2. Thẻ Chỉ Số Tóm Tắt (Metric Highlight Cards) */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#f0f7ff', borderColor: '#bae0ff' }}>
            <Space>
              <Avatar
                size={32}
                icon={<UserOutlined />}
                style={{ backgroundColor: isUnassignedTeacher ? '#fa8c16' : '#1890ff' }}
              />
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {isEnglish ? 'Native Teacher' : 'Giáo viên bản xứ'}
                </div>
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    color: isUnassignedTeacher ? '#d46b08' : '#0f172a',
                  }}
                >
                  {isUnassignedTeacher
                    ? isEnglish
                      ? 'Open for Registration'
                      : 'Chưa có GV (Mở ĐK)'
                    : targetClass.teacherName}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Space>
              <TeamOutlined style={{ fontSize: 22, color: '#52c41a' }} />
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {isEnglish ? 'Class Size' : 'Sĩ số hiện tại'}
                </div>
                <Text strong style={{ fontSize: 15, color: '#16a34a' }}>
                  {studentTotal} {isEnglish ? 'students' : 'học viên'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#f9f0ff', borderColor: '#d3adf7' }}>
            <Space>
              <VideoCameraOutlined style={{ fontSize: 22, color: '#722ed1' }} />
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {isEnglish ? 'Zoom Room ID' : 'Mã phòng Zoom'}
                </div>
                <Text strong style={{ fontSize: 15, color: '#722ed1' }}>
                  {targetClass.meetingId || '888 999 101'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 3. KHỐI DUYỆT ĐĂNG KÝ DẠY (GIÁO VIÊN) & ĐĂNG KÝ HỌC (HỌC VIÊN) DÀNH CHO GIÁO VỤ */}
      <Card
        size="small"
        style={{
          marginBottom: 20,
          borderRadius: 10,
          border:
            pendingTeacherRequests.length + pendingStudentRequests.length > 0
              ? '1.5px solid #faad14'
              : '1px solid #e2e8f0',
          background:
            pendingTeacherRequests.length + pendingStudentRequests.length > 0
              ? '#fffbe6'
              : '#f8fafc',
        }}
      >
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
          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
            {isEnglish
              ? 'Academic Registration & Approval Queue'
              : 'Trung Tâm Đăng Ký & Giáo Vụ Phê Duyệt (GV & Học Viên)'}
          </Text>

          <Space size={8} wrap>
            {isUnassignedTeacher && onRequestTeachClass && (
              <Button
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => onRequestTeachClass(targetClass.id)}
                style={{
                  borderRadius: 6,
                  borderColor: '#fa8c16',
                  color: '#d46b08',
                  fontWeight: 600,
                }}
              >
                {isEnglish ? 'Apply to Teach' : 'GV Đăng Ký Dạy Lớp Này'}
              </Button>
            )}
            {onRequestEnrollClass && (
              <Button
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => onRequestEnrollClass(targetClass.id)}
                style={{
                  borderRadius: 6,
                  borderColor: '#16a34a',
                  color: '#16a34a',
                  fontWeight: 600,
                }}
              >
                {isEnglish ? 'Request Enrollment' : 'HV Đăng Ký Học Lớp Này'}
              </Button>
            )}
          </Space>
        </div>

        {/* 3.1. Danh sách Giáo viên đăng ký dạy chờ Giáo vụ duyệt */}
        {pendingTeacherRequests.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <Text strong style={{ fontSize: 12, color: '#d46b08', display: 'block', marginBottom: 6 }}>
              {isEnglish
                ? `Pending Teacher Applications (${pendingTeacherRequests.length}):`
                : `Giáo viên đăng ký nhận dạy lớp chờ duyệt (${pendingTeacherRequests.length}):`}
            </Text>
            {pendingTeacherRequests.map((req) => (
              <div
                key={req.teacherId}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ffe58f',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <Space size={6}>
                    <Tag color="blue">{req.teacherId}</Tag>
                    <Text strong>{req.teacherName}</Text>
                    {req.hasConflict && (
                      <Tag color="error" icon={<WarningOutlined />}>
                        {isEnglish
                          ? `Schedule Conflict: ${req.conflictClasses?.join(', ')}`
                          : `Trùng lịch dạy: ${req.conflictClasses?.join(', ')}`}
                      </Tag>
                    )}
                  </Space>
                </div>

                {canManage && (
                  <Space size={6}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() =>
                        onApproveTeacherRequest?.(targetClass.id, req.teacherId)
                      }
                      style={{ borderRadius: 6, background: '#16a34a' }}
                    >
                      {isEnglish ? 'Approve GV' : 'Duyệt GV'}
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() =>
                        onRejectTeacherRequest?.(targetClass.id, req.teacherId)
                      }
                      style={{ borderRadius: 6 }}
                    >
                      {isEnglish ? 'Reject' : 'Từ Chối'}
                    </Button>
                  </Space>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3.2. Danh sách Học viên đăng ký vào lớp chờ Giáo vụ duyệt */}
        {pendingStudentRequests.length > 0 && (
          <div>
            <Text strong style={{ fontSize: 12, color: '#16a34a', display: 'block', marginBottom: 6 }}>
              {isEnglish
                ? `Pending Student Enrollment Requests (${pendingStudentRequests.length}):`
                : `Học viên đăng ký tham gia lớp chờ duyệt (${pendingStudentRequests.length}):`}
            </Text>
            {pendingStudentRequests.map((req) => (
              <div
                key={req.studentId}
                style={{
                  background: '#ffffff',
                  border: '1px solid #b7eb8f',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <Space size={6}>
                    <Tag color="geekblue">{req.studentId}</Tag>
                    <Text strong>{req.studentName}</Text>
                    {req.englishName && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({req.englishName})
                      </Text>
                    )}
                    {req.hasConflict && (
                      <Tag color="error" icon={<WarningOutlined />}>
                        {isEnglish
                          ? `Timetable Conflict: ${req.conflictClasses?.join(', ')}`
                          : `Trùng TKB: ${req.conflictClasses?.join(', ')}`}
                      </Tag>
                    )}
                  </Space>
                </div>

                {canManage && (
                  <Space size={6}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() =>
                        onApproveStudentRequest?.(targetClass.id, req.studentId)
                      }
                      style={{ borderRadius: 6, background: '#16a34a' }}
                    >
                      {isEnglish ? 'Approve Student' : 'Duyệt Vào Lớp'}
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() =>
                        onRejectStudentRequest?.(targetClass.id, req.studentId)
                      }
                      style={{ borderRadius: 6 }}
                    >
                      {isEnglish ? 'Reject' : 'Từ Chối'}
                    </Button>
                  </Space>
                )}
              </div>
            ))}
          </div>
        )}

        {pendingTeacherRequests.length === 0 && pendingStudentRequests.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isEnglish
              ? 'No pending teacher or student registration requests at the moment.'
              : 'Hiện không có yêu cầu đăng ký dạy hoặc đăng ký học nào đang chờ duyệt.'}
          </Text>
        )}
      </Card>

      {/* 4. Bảng Thông Tin Chi Tiết Chuẩn Enterprise (Ngày bắt đầu, Lịch học tự động theo múi giờ, Ngày nghỉ Lễ/Tết, 2 Link Zoom & Zalo) */}
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 20 }}>
        <Descriptions.Item label={isEnglish ? 'Class Start Date' : 'Ngày bắt đầu lớp học'}>
          <Text strong>{targetClass.startDate || '04/02/2026'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Current Schedule' : 'Lịch học hiện hành'}>
          <Space>
            <CalendarOutlined style={{ color: '#fa8c16' }} />
            <Text strong>{viewerCurrentSchedule}</Text>
          </Space>
        </Descriptions.Item>

        {holidays.length > 0 && (
          <Descriptions.Item
            label={isEnglish ? 'Configured Holidays / Off-Days' : 'Ngày nghỉ Lễ / Tết đã cấu hình'}
            span={2}
          >
            <Space size={[4, 4]} wrap>
              {holidays.map((h) => (
                <Tag key={h} color="orange" style={{ margin: 0 }}>
                  🎌 {h}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
        )}

        <Descriptions.Item label={isEnglish ? 'Zoom Meeting ID' : 'Zoom Meeting ID'}>
          <Text strong>{targetClass.meetingId || '888 999 101'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Zoom Passcode' : 'Mật khẩu Zoom'}>
          <Tag color="default">{targetClass.passcode || '123456'}</Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label={isEnglish ? 'Zoom Link for Teacher (Host)' : 'Link Zoom Giáo Viên (Host)'}
          span={2}
        >
          <a href={hostZoomUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
            {hostZoomUrl}
          </a>
        </Descriptions.Item>

        <Descriptions.Item
          label={isEnglish ? 'Zoom Link for Students (Join)' : 'Link Zoom Học Viên (Vào Học)'}
          span={2}
        >
          <a
            href={studentZoomUrl}
            target="_blank"
            rel="noreferrer"
            style={{ wordBreak: 'break-all' }}
          >
            {studentZoomUrl}
          </a>
        </Descriptions.Item>

        <Descriptions.Item
          label={isEnglish ? 'Class Zalo Group Chat' : 'Link Nhóm Chat Zalo Của Lớp'}
          span={2}
        >
          <a href={zaloUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
            {zaloUrl}
          </a>
        </Descriptions.Item>
      </Descriptions>

      {/* 5. BẢNG LỊCH SỬ THAY ĐỔI THỜI KHÓA BIỂU THEO GIAI ĐOẠN (SCHEDULE VERSION HISTORY) */}
      <Card
        size="small"
        className="lak-schedule-history-card"
        style={{
          marginBottom: 20,
          borderRadius: 10,
          border: '1px solid #cbd5e1',
          background: '#f8fafc',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Space size={6}>
            <HistoryOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
              {isEnglish
                ? `Class Timetable Version History (${scheduleHistory.length} period(s))`
                : `Lịch Sử Thay Đổi Thời Khóa Biểu Của Lớp (${scheduleHistory.length} giai đoạn)`}
            </Text>
          </Space>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scheduleHistory.map((item) => {
            const viewerHistSchedule = formatScheduleForViewer(
              item.scheduleData || item.schedule,
              isEnglish,
              currentUser
            );
            const isActive = item.status === 'ACTIVE' || !item.effectiveTo;

            return (
              <div
                key={`${item.version}-${item.effectiveFrom}`}
                style={{
                  background: '#ffffff',
                  border: isActive ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Space size={6} wrap>
                    <Tag color={isActive ? 'blue' : 'default'} style={{ margin: 0, fontWeight: 700 }}>
                      {isEnglish ? `Period #${item.version}` : `Giai đoạn #${item.version}`}
                    </Tag>
                    <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
                      {item.effectiveFrom} →{' '}
                      {item.effectiveTo || (isEnglish ? 'Present' : 'Hiện tại')}
                    </Text>
                  </Space>

                  <Tag
                    color={isActive ? 'success' : 'default'}
                    style={{ margin: 0, fontWeight: 600 }}
                  >
                    {isActive
                      ? isEnglish
                        ? '🟢 Active Schedule'
                        : '🟢 Đang áp dụng'
                      : isEnglish
                      ? '📦 Archived History'
                      : '📦 Đã lưu lịch sử'}
                  </Tag>
                </div>

                <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, marginBottom: 4 }}>
                  📅 {viewerHistSchedule}
                </div>

                {item.note && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    📝 {item.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 6. Bảng Danh Sách Học Viên Chính Thức */}
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          {isEnglish ? 'Enrolled Students' : 'Danh Sách Học Viên Chính Thức'} (
          {enrolledStudents.length} {isEnglish ? 'records' : 'hồ sơ'})
        </Title>
      </div>

      <Table
        dataSource={enrolledStudents}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 600 }}
        style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}
      />
    </Drawer>
  );
};
