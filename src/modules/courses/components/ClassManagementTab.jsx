import React from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tooltip,
  Avatar,
  Popconfirm,
  Empty,
  Row,
  Col,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  TeamOutlined,
  LinkOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  UserAddOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { CLASS_STATUS_COLORS } from '../models/courses.model';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  findTeacherScheduleConflicts,
  findStudentScheduleConflicts,
  formatScheduleForViewer,
} from '../../../shared/utils/scheduleUtils';

const { Title, Text } = Typography;
const { Option } = Select;

const renderFormattedSchedule = (scheduleStr = '') => {
  const match = String(scheduleStr).match(/^(.*?)(\s*\([^)]+\))$/);
  if (match) {
    return (
      <>
        <span>{match[1]}</span>{' '}
        <span style={{ whiteSpace: 'nowrap' }}>{match[2].trim()}</span>
      </>
    );
  }
  return scheduleStr;
};

export const ClassManagementTab = ({
  classes,
  allClasses = [],
  courses,
  teachers,
  currentUser,
  canManage,
  search,
  onSearchChange,
  courseFilter,
  onCourseFilterChange,
  teacherFilter,
  onTeacherFilterChange,
  onOpenCreate,
  onViewRoster,
  onEditClass,
  onDeleteClass,
  onRequestTeachClass,
  onApproveTeacherRequest,
  onRejectTeacherRequest,
  onRequestEnrollClass,
  onApproveStudentRequest,
  onRejectStudentRequest,
  isMobile = false,
}) => {
  const { isEnglish } = useLanguage();
  const isTeacherRole = currentUser?.role === 'teacher';
  const isStudentRole = currentUser?.role === 'student';

  return (
    <div>
      {/* Bộ Lọc & Tìm Kiếm Chuẩn Hóa 100% Width */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }} align="middle" justify="space-between">
        <Col xs={24} lg={18}>
          <Row gutter={[10, 10]}>
            <Col xs={24} sm={10} md={9}>
              <Input
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                placeholder={isEnglish ? 'Search classes, teachers...' : 'Tìm theo mã lớp, tên lớp, GV...'}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                allowClear
              />
            </Col>
            <Col xs={24} sm={7} md={8}>
              <Select
                value={courseFilter}
                onChange={onCourseFilterChange}
                style={{ width: '100%', height: 40 }}
              >
                <Option value="ALL">{isEnglish ? 'All Courses' : 'Tất Cả Khóa Học'}</Option>
                {courses.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={7} md={7}>
              <Select
                value={teacherFilter}
                onChange={onTeacherFilterChange}
                style={{ width: '100%', height: 40 }}
              >
                <Option value="ALL">{isEnglish ? 'All Teachers' : 'Tất Cả Giáo Viên'}</Option>
                <Option value="UNASSIGNED">
                  🟠 {isEnglish ? 'Open / Unassigned Teacher' : 'Lớp Chưa Có GV (Mở Đăng Ký)'}
                </Option>
                {teachers.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Col>

        {canManage && (
          <Col xs={24} lg={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreate}
              style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : 220,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#1890ff',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(24,144,255,0.3)',
              }}
            >
              {isEnglish ? 'Create New Class' : 'Tạo Lớp Học Mới'}
            </Button>
          </Col>
        )}
      </Row>

      {classes.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ padding: '12px 0' }}>
              <Text strong style={{ fontSize: 15, display: 'block', color: '#475569' }}>
                {isEnglish ? 'No classes found' : 'Chưa có lớp học nào'}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {isEnglish
                  ? 'Create a new class and configure weekly recurring schedule.'
                  : 'Bấm nút "Tạo Lớp Học Mới" để thiết lập lớp và lịch học tuần hoàn.'}
              </Text>
            </div>
          }
        >
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreate}
              style={{ height: 40, borderRadius: 8, backgroundColor: '#1890ff', fontWeight: 600 }}
            >
              {isEnglish ? 'Create First Class' : 'Tạo Lớp Học Đầu Tiên'}
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {classes.map((record) => {
            const foundCourse = courses.find((c) => c.id === record.courseId);
            const isUnassignedTeacher =
              !record.teacherId || record.teacherName === 'Chưa phân công';
            const studentCount = record.totalStudents || record.studentIds?.length || 0;
            const statusColor = CLASS_STATUS_COLORS[record.operationStatus] || 'green';

            const pendingTReqs = Array.isArray(record.pendingTeacherRequests)
              ? record.pendingTeacherRequests
              : [];
            const pendingSReqs = Array.isArray(record.pendingStudentRequests)
              ? record.pendingStudentRequests
              : [];
            const totalPending = pendingTReqs.length + pendingSReqs.length;

            // Kiểm tra trạng thái đăng ký dạy của GV hiện tại
            const myTeacherPending = pendingTReqs.some(
              (r) => r.teacherId === currentUser?.id
            );
            const myTeacherConflicts = isTeacherRole
              ? findTeacherScheduleConflicts(
                  currentUser?.id,
                  record.scheduleData || record.schedule,
                  allClasses.length ? allClasses : classes,
                  record.id
                )
              : [];

            // Kiểm tra trạng thái đăng ký học của HV hiện tại
            const isAlreadyEnrolled = (record.studentIds || []).includes(currentUser?.id);
            const myStudentPending = pendingSReqs.some(
              (r) => r.studentId === currentUser?.id
            );
            const myStudentConflicts = isStudentRole
              ? findStudentScheduleConflicts(
                  currentUser?.id,
                  record.scheduleData || record.schedule,
                  allClasses.length ? allClasses : classes,
                  record.id
                )
              : [];

            const zoomUrlToOpen =
              canManage || isTeacherRole
                ? record.zoomHostLink || record.meetingLink
                : record.zoomStudentLink || record.meetingLink;

            return (
              <Col xs={24} sm={12} md={12} lg={8} key={record.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    border:
                      totalPending > 0 && canManage
                        ? '1.5px solid #faad14'
                        : '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                  styles={{
                    body: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
                  }}
                >
                  {/* 1. Header Card: Mã Lớp + Trạng Thái + Nút Xóa */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Tag color="geekblue" style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
                      {record.id}
                    </Tag>

                    <Space size={6}>
                      <Tag color={statusColor} style={{ margin: 0 }}>
                        {record.operationStatus || (isEnglish ? 'Active' : 'Đang học ổn định')}
                      </Tag>
                      {canManage && onDeleteClass && (
                        <Popconfirm
                          title={isEnglish ? 'Delete this class?' : 'Xóa lớp học này?'}
                          description={
                            isEnglish
                              ? 'Are you sure you want to delete this class?'
                              : 'Bạn có chắc chắn muốn xóa lớp học này?'
                          }
                          onConfirm={() => onDeleteClass(record.id)}
                          okText={isEnglish ? 'Delete' : 'Xóa'}
                          cancelText={isEnglish ? 'Cancel' : 'Hủy'}
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: 15 }} />}
                            style={{
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                            }}
                          />
                        </Popconfirm>
                      )}
                    </Space>
                  </div>

                  {/* 2. Tên Lớp Học & Khóa Học Trực Thuộc */}
                  <Title
                    level={5}
                    style={{ margin: '0 0 8px 0', color: '#0f172a', minHeight: 44, lineHeight: 1.4 }}
                  >
                    {record.name}
                  </Title>

                  <div style={{ marginBottom: 12 }}>
                    <Tag
                      color="purple"
                      style={{
                        borderRadius: 4,
                        fontWeight: 500,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'bottom',
                      }}
                    >
                      {foundCourse?.name || record.courseName || record.courseId}
                    </Tag>
                  </div>

                  {/* Banner Chờ Giáo Vụ Duyệt (Nếu có GV hoặc HV đăng ký) */}
                  {totalPending > 0 && (
                    <div
                      onClick={() => onViewRoster(record)}
                      style={{
                        background: '#fffbe6',
                        border: '1px solid #ffe58f',
                        borderRadius: 8,
                        padding: '6px 10px',
                        marginBottom: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Space size={6}>
                        <BellOutlined style={{ color: '#d48806' }} />
                        <Text strong style={{ fontSize: 12, color: '#d48806' }}>
                          {isEnglish
                            ? `${totalPending} Pending Approval(s)`
                            : `${totalPending} yêu cầu chờ Giáo vụ duyệt`}
                        </Text>
                      </Space>
                      <Tag color="gold" style={{ margin: 0, fontSize: 11 }}>
                        {canManage ? (isEnglish ? 'Review' : 'Duyệt ngay') : (isEnglish ? 'Pending' : 'Chờ duyệt')}
                      </Tag>
                    </div>
                  )}

                  {/* 3. Khung Thông Số Vận Hành Lớp Học */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: 8,
                      marginBottom: 14,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {/* Giáo viên bản xứ */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        gap: 8,
                      }}
                    >
                      <Space size={6} style={{ flexShrink: 0 }}>
                        <UserOutlined style={{ color: '#1890ff' }} />
                        <Text type="secondary">{isEnglish ? 'Teacher:' : 'Giáo viên:'}</Text>
                      </Space>

                      {isUnassignedTeacher ? (
                        <Tag color="warning" style={{ margin: 0, fontWeight: 600 }}>
                          {isEnglish ? 'Open for Registration' : 'Chưa có GV (Mở ĐK)'}
                        </Tag>
                      ) : (
                        <Space size={6} style={{ overflow: 'hidden' }}>
                          <Avatar
                            size={20}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
                          />
                          <Text
                            strong
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {record.teacherName}
                          </Text>
                        </Space>
                      )}
                    </div>

                    {/* Sĩ số học viên */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13,
                      }}
                    >
                      <Space size={6}>
                        <TeamOutlined style={{ color: '#52c41a' }} />
                        <Text type="secondary">{isEnglish ? 'Class Roster:' : 'Sĩ số lớp:'}</Text>
                      </Space>
                      <Text strong style={{ color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {studentCount} {isEnglish ? 'students' : 'học viên'}
                      </Text>
                    </div>

                    {/* Ngày bắt đầu lớp học */}
                    {record.startDate && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 13,
                        }}
                      >
                        <Space size={6}>
                          <ClockCircleOutlined style={{ color: '#0ea5e9' }} />
                          <Text type="secondary">
                            {isEnglish ? 'Start Date:' : 'Ngày bắt đầu:'}
                          </Text>
                        </Space>
                        <Text strong style={{ color: '#0284c7', whiteSpace: 'nowrap' }}>
                          {record.startDate}
                        </Text>
                      </div>
                    )}

                    {/* Lịch học hàng tuần (Tự động quy đổi theo múi giờ người xem + Lịch sử đổi lịch) */}
                    {(() => {
                      const viewerScheduleStr = formatScheduleForViewer(
                        record.scheduleData || record.schedule,
                        isEnglish
                      );
                      const historyCount = Array.isArray(record.scheduleHistory)
                        ? record.scheduleHistory.length
                        : 1;

                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              fontSize: 13,
                              gap: 8,
                            }}
                          >
                            <Space size={6} style={{ flexShrink: 0 }}>
                              <CalendarOutlined style={{ color: '#fa8c16' }} />
                              <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                                {isEnglish ? 'Schedule:' : 'Lịch học:'}
                              </Text>
                            </Space>
                            <Text
                              strong
                              style={{ fontSize: 12, textAlign: 'right', lineHeight: 1.35 }}
                            >
                              {renderFormattedSchedule(viewerScheduleStr)}
                            </Text>
                          </div>

                          {historyCount > 1 && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                paddingLeft: 18,
                              }}
                            >
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {isEnglish ? 'Schedule History:' : 'Lịch sử đổi lịch:'}
                              </Text>
                              <Tag
                                color="blue"
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  padding: '0 6px',
                                  lineHeight: '16px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                📜 {historyCount} {isEnglish ? 'periods' : 'giai đoạn TKB'}
                              </Tag>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Phòng Zoom & Nhóm Zalo (Click mở trực tiếp) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13,
                      }}
                    >
                      <Space size={6}>
                        <VideoCameraOutlined style={{ color: '#722ed1' }} />
                        <Text type="secondary">{isEnglish ? 'Zoom Room:' : 'Phòng Zoom:'}</Text>
                      </Space>
                      <Tag
                        color="purple"
                        onClick={() => zoomUrlToOpen && window.open(zoomUrlToOpen, '_blank')}
                        style={{
                          margin: 0,
                          cursor: 'pointer',
                          fontWeight: 600,
                          borderRadius: 6,
                        }}
                      >
                        <LinkOutlined style={{ marginRight: 4 }} />
                        {record.meetingId || '888 999 111'}
                      </Tag>
                    </div>

                    {record.zaloGroupLink && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 13,
                        }}
                      >
                        <Space size={6}>
                          <MessageOutlined style={{ color: '#0068ff' }} />
                          <Text type="secondary">{isEnglish ? 'Zalo Chat:' : 'Nhóm Zalo:'}</Text>
                        </Space>
                        <Tag
                          color="blue"
                          onClick={() => window.open(record.zaloGroupLink, '_blank')}
                          style={{
                            margin: 0,
                            cursor: 'pointer',
                            fontWeight: 600,
                            borderRadius: 6,
                          }}
                        >
                          <MessageOutlined style={{ marginRight: 4 }} />
                          {isEnglish ? 'Join Zalo Group' : 'Mở Nhóm Zalo'}
                        </Tag>
                      </div>
                    )}
                  </div>

                  {/* Khối Tự Đăng Ký Dạy Dành Cho Giáo Viên Khi Lớp Chưa Có GV */}
                  {isUnassignedTeacher && (isTeacherRole || canManage) && onRequestTeachClass && (
                    <div style={{ marginBottom: 10 }}>
                      {myTeacherPending ? (
                        <Tag
                          icon={<ClockCircleOutlined />}
                          color="processing"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '5px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {isEnglish
                            ? 'Teaching Request Sent (Pending Academic Approval)'
                            : 'Đã gửi ĐK dạy — Chờ Giáo vụ duyệt'}
                        </Tag>
                      ) : (
                        <Button
                          type="dashed"
                          block
                          icon={<UserAddOutlined />}
                          onClick={() => onRequestTeachClass(record.id)}
                          style={{
                            height: 36,
                            borderRadius: 8,
                            borderColor: '#fa8c16',
                            color: '#d46b08',
                            fontWeight: 600,
                            background: '#fff7e6',
                            fontSize: 12,
                          }}
                        >
                          {isEnglish ? 'Apply to Teach Class' : 'Đăng Ký Nhận Dạy Lớp Này'}
                          {myTeacherConflicts.length > 0
                            ? isEnglish
                              ? ' (⚠️ Conflict)'
                              : ' (⚠️ Trùng lịch)'
                            : ''}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Khối Tự Đăng Ký Học Dành Cho Học Viên */}
                  {isStudentRole && onRequestEnrollClass && (
                    <div style={{ marginBottom: 10 }}>
                      {isAlreadyEnrolled ? (
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '5px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {isEnglish ? 'Enrolled in this Class' : 'Bạn đang học lớp này'}
                        </Tag>
                      ) : myStudentPending ? (
                        <Tag
                          icon={<ClockCircleOutlined />}
                          color="processing"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '5px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {isEnglish
                            ? 'Enrollment Pending Academic Approval'
                            : 'Đã đăng ký học — Chờ Giáo vụ duyệt'}
                        </Tag>
                      ) : (
                        <Button
                          type="dashed"
                          block
                          icon={<UserAddOutlined />}
                          onClick={() => onRequestEnrollClass(record.id)}
                          style={{
                            height: 36,
                            borderRadius: 8,
                            borderColor: '#16a34a',
                            color: '#16a34a',
                            fontWeight: 600,
                            background: '#f6ffed',
                            fontSize: 12,
                          }}
                        >
                          {isEnglish ? 'Request Class Enrollment' : 'Đăng Ký Tham Gia Lớp Học'}
                          {myStudentConflicts.length > 0
                            ? isEnglish
                              ? ' (⚠️ Timetable Conflict)'
                              : ' (⚠️ Trùng TKB)'
                            : ''}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 4. Thanh Nút Hành Động Chân Card (50% / 50% đồng bộ Course Card) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 'auto',
                      width: '100%',
                    }}
                  >
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => onViewRoster(record)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 8,
                        fontWeight: 500,
                      }}
                    >
                      {isEnglish ? 'Details' : 'Chi Tiết'} ({studentCount})
                      {canManage && totalPending > 0 ? ` • 🔔${totalPending}` : ''}
                    </Button>

                    {canManage && onEditClass && (
                      <Button
                        type="primary"
                        ghost
                        icon={<EditOutlined />}
                        onClick={() => onEditClass(record)}
                        style={{
                          flex: 1,
                          height: 38,
                          borderRadius: 8,
                          fontWeight: 500,
                        }}
                      >
                        {isEnglish ? 'Edit' : 'Chỉnh Sửa'}
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};
