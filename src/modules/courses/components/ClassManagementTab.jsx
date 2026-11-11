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
  WarningOutlined,
} from '@ant-design/icons';
import { CLASS_STATUS_COLORS } from '../models/courses.model';
import { useLanguage } from '../../../core/context/LanguageContext';
import { AdminAuditInfo } from '../../../shared/components/AdminAuditInfo';
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
  const { isEnglish, t } = useLanguage();
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
                placeholder={t('courses.classes.searchPlaceholder')}
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
                <Option value="ALL">{t('courses.classes.allCourses')}</Option>
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
                <Option value="ALL">{t('courses.classes.allTeachers')}</Option>
                <Option value="UNASSIGNED">
                  🟠 {t('courses.classes.openUnassignedTeacher')}
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
              {t('courses.classes.createBtn')}
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
                {t('courses.classes.noClassesFound')}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t('courses.classes.noClassesDesc')}
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
              {t('courses.classes.createFirst')}
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {classes.map((record) => {
            const foundCourse = courses.find((c) => c.id === record.courseId);
            const maxClassSize = Number(foundCourse?.maxClassSize) || 18;
            const isUnassignedTeacher =
              !record.teacherId || record.teacherName === 'Chưa phân công';
            const studentCount = record.totalStudents || record.studentIds?.length || 0;
            const isClassFull = studentCount >= maxClassSize;
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
            const currentUid = currentUser?.id || currentUser?.code;
            const isAlreadyEnrolled = (record.studentIds || []).includes(currentUid);
            const myStudentPending = pendingSReqs.some(
              (r) => r.studentId === currentUid
            );
            const myStudentConflicts = isStudentRole
              ? findStudentScheduleConflicts(
                  currentUid,
                  record.scheduleData || record.schedule,
                  allClasses.length ? allClasses : classes,
                  record.id
                )
              : [];

            // Quyền xem thông tin Phòng học Zoom & Nhóm Zalo:
            // - Cán bộ quản lý (canManage) hoặc Giáo viên phụ trách: Xem toàn bộ
            // - Học viên (isStudentRole): CHỈ ĐƯỢC XEM KHI ĐÃ ĐƯỢC DUYỆT VÀO LỚP (isAlreadyEnrolled === true)
            const canViewClassRoomLinks = !isStudentRole || isAlreadyEnrolled;

            const zoomUrlToOpen =
              canManage || isTeacherRole
                ? record.zoomHostLink || record.meetingLink
                : record.zoomStudentLink || record.meetingLink;

            return (
              <Col xs={24} sm={12} md={12} lg={12} xl={8} key={record.id}>
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
                          title={t('courses.classes.deleteConfirmTitle')}
                          description={t('courses.classes.deleteConfirmDesc')}
                          onConfirm={() => onDeleteClass(record.id)}
                          okText={t('common.delete')}
                          cancelText={t('common.cancel')}
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
                          {totalPending} {t('courses.classes.pendingApprovals')}
                        </Text>
                      </Space>
                      <Tag color="gold" style={{ margin: 0, fontSize: 11 }}>
                        {canManage ? t('courses.classes.reviewNow') : t('courses.classes.pendingTag')}
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
                          {t('courses.classes.openForRegistration')}
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
                        <Text type="secondary">{t('courses.classes.rosterLabel')}</Text>
                      </Space>
                      <Text strong style={{ color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {studentCount} {t('courses.classes.studentsCount')}
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
                            {t('courses.classes.startDateLabel')}
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
                                {t('courses.classes.scheduleLabel')}
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
                                justifycontent: 'space-between',
                                fontSize: 11,
                                paddingLeft: 18,
                              }}
                            >
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('courses.classes.scheduleHistoryLabel')}
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
                                📜 {historyCount} {t('courses.classes.periodsCount')}
                              </Tag>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Phòng Zoom & Nhóm Zalo (Học viên chỉ được mở khóa khi đã được Giáo vụ duyệt vào lớp) */}
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
                      {canViewClassRoomLinks ? (
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
                      ) : (
                        <Tag
                          color="default"
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: '#64748b',
                            borderRadius: 6,
                          }}
                        >
                          {isEnglish ? '🔒 Unlocked after approval' : '🔒 Mở sau khi duyệt'}
                        </Tag>
                      )}
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
                          <Text type="secondary">{t('courses.classes.zaloChatLabel')}</Text>
                        </Space>
                        {canViewClassRoomLinks ? (
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
                            {t('courses.classes.joinZaloGroup')}
                          </Tag>
                        ) : (
                          <Tag
                            color="default"
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: '#64748b',
                              borderRadius: 6,
                            }}
                          >
                            {isEnglish ? '🔒 Unlocked after approval' : '🔒 Mở sau khi duyệt'}
                          </Tag>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Khối Tự Đăng Ký Dạy Dành Cho Giáo Viên Khi Lớp Chưa Có GV (CHỈ DUY NHẤT GIÁO VIÊN) */}
                  {isUnassignedTeacher && isTeacherRole && onRequestTeachClass && (
                    <div style={{ marginBottom: 10 }}>
                      {myTeacherPending ? (
                        <Tag
                          icon={<ClockCircleOutlined />}
                          color="processing"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '6px 8px',
                            borderRadius: 6,
                            fontWeight: 600,
                          }}
                        >
                          {t('courses.classes.teacherPendingNotice')}
                        </Tag>
                      ) : myTeacherConflicts.length > 0 ? (
                        <Tooltip
                          title={
                            isEnglish
                              ? `Schedule overlaps with your assigned class: ${myTeacherConflicts.map((c) => `${c.id} (${c.schedule})`).join(', ')}`
                              : `Trùng thời khóa biểu với lớp bạn đang phụ trách: ${myTeacherConflicts.map((c) => `${c.id} (${c.schedule})`).join(', ')}`
                          }
                        >
                          <Button
                            type="dashed"
                            danger
                            disabled
                            block
                            icon={<WarningOutlined />}
                            style={{
                              height: 36,
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#fff1f0',
                              borderColor: '#ffa39e',
                              color: '#cf1322',
                            }}
                          >
                            {isEnglish
                              ? `Conflict with ${myTeacherConflicts[0].id}`
                              : `Trùng lịch dạy lớp ${myTeacherConflicts[0].id}`}
                          </Button>
                        </Tooltip>
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
                          {t('courses.classes.applyToTeach')}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Khối Tự Đăng Ký Học Dành Cho Học Viên (3 Trạng Thái Rõ Ràng) */}
                  {isStudentRole && onRequestEnrollClass && (
                    <div style={{ marginBottom: 10 }}>
                      {isAlreadyEnrolled ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Tag
                            icon={<CheckCircleOutlined />}
                            color="success"
                            style={{
                              width: '100%',
                              textAlign: 'center',
                              padding: '6px 8px',
                              borderRadius: 6,
                              fontWeight: 600,
                              margin: 0,
                            }}
                          >
                            {isEnglish
                              ? 'Enrolled — Approved to Join Class'
                              : 'Đã duyệt đăng ký — Đã tham gia lớp học'}
                          </Tag>
                          <Button
                            type="primary"
                            block
                            icon={<VideoCameraOutlined />}
                            onClick={() => zoomUrlToOpen && window.open(zoomUrlToOpen, '_blank')}
                            style={{
                              height: 36,
                              borderRadius: 8,
                              background: '#722ed1',
                              borderColor: '#722ed1',
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {isEnglish
                              ? `Join Zoom Class (${record.meetingId || '888 999 111'})`
                              : `Vào Phòng Học Zoom (${record.meetingId || '888 999 111'})`}
                          </Button>
                        </div>
                      ) : myStudentPending ? (
                        <Button
                          disabled
                          block
                          icon={<ClockCircleOutlined />}
                          style={{
                            height: 36,
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#e6f4ff',
                            borderColor: '#91caff',
                            color: '#0958d9',
                            cursor: 'not-allowed',
                          }}
                        >
                          {isEnglish
                            ? 'Registered — Waiting for Approval'
                            : 'Đã đăng ký — Chờ phê duyệt'}
                        </Button>
                      ) : isClassFull ? (
                        <Button
                          type="dashed"
                          disabled
                          block
                          style={{
                            height: 36,
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#f8fafc',
                            borderColor: '#cbd5e1',
                            color: '#94a3b8',
                          }}
                        >
                          {isEnglish
                            ? `Class is full (${studentCount}/${maxClassSize})`
                            : `Lớp đã đủ sĩ số (${studentCount}/${maxClassSize})`}
                        </Button>
                      ) : myStudentConflicts.length > 0 ? (
                        <Tooltip
                          title={
                            isEnglish
                              ? `Schedule overlaps with your enrolled class: ${myStudentConflicts.map((c) => `${c.id} (${c.schedule})`).join(', ')}`
                              : `Trùng thời khóa biểu với lớp bạn đang theo học: ${myStudentConflicts.map((c) => `${c.id} (${c.schedule})`).join(', ')}`
                          }
                        >
                          <Button
                            type="dashed"
                            danger
                            disabled
                            block
                            icon={<WarningOutlined />}
                            style={{
                              height: 36,
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#fff1f0',
                              borderColor: '#ffa39e',
                              color: '#cf1322',
                            }}
                          >
                            {isEnglish
                              ? `Conflict with ${myStudentConflicts[0].id}`
                              : `Trùng TKB lớp ${myStudentConflicts[0].id}`}
                          </Button>
                        </Tooltip>
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
                          {t('courses.classes.requestEnrollment')}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Nhật Ký Kiểm Toán IT (Chỉ hiển thị cho View Admin) */}
                  <AdminAuditInfo record={record} currentUser={currentUser} mode="card" style={{ marginBottom: 12 }} />

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
                      {t('common.details')} ({studentCount})
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
                        {t('common.edit')}
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
