import React, { useState, useEffect } from 'react';
import {
  Alert,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Divider,
  Tag,
  message,
} from 'antd';
import {
  UserOutlined,
  VideoCameraOutlined,
  BookOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  CalendarOutlined,
  MessageOutlined,
  TeamOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { CLASS_OPERATION_STATUS } from '../models/courses.model';
import { ClassService } from '../services/ClassService';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useAuth } from '../../../core/context/AuthContext';
import { AdminAuditInfo } from '../../../shared/components/AdminAuditInfo';
import {
  BaseDatePicker,
  BaseWeeklyScheduleControl,
  BaseTeacherAutocomplete,
  BaseStudentMultiAutocomplete,
} from '../../../shared/components/controls';
import { parseScheduleToStructured } from '../../../shared/utils/scheduleUtils';
import { MeetingPlatformBadge, detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';
import { ZoomBackendGateway } from '../../../shared/services/ZoomBackendGateway';

const { Option } = Select;
const { Text } = Typography;

export const ClassFormDrawer = ({
  open,
  editingClass = null,
  defaultCourseId = null,
  courses = [],
  teachers = [],
  students = [],
  existingClasses = [],
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const isEditMode = Boolean(editingClass);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [provisioningZoom, setProvisioningZoom] = useState(false);
  const [provisionedZoomConfig, setProvisionedZoomConfig] = useState(null);
  const [zoomHostOverlaps, setZoomHostOverlaps] = useState([]);

  // Live schedule state to drive real-time Teacher & Student conflict detection
  const [liveSchedule, setLiveSchedule] = useState('Thứ 2, Thứ 4 (19:00 - 21:00)');
  const [liveScheduleData, setLiveScheduleData] = useState(() =>
    parseScheduleToStructured('Thứ 2, Thứ 4 (19:00 - 21:00)')
  );

  const hostLinkVal = Form.useWatch('zoomHostLink', form);
  const studentLinkVal = Form.useWatch('zoomStudentLink', form);
  const hostPlatform = detectMeetingPlatform(hostLinkVal);
  const studentPlatform = detectMeetingPlatform(studentLinkVal);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open) {
      if (editingClass) {
        const currentStudentIds =
          Array.isArray(editingClass.studentIds) && editingClass.studentIds.length > 0
            ? editingClass.studentIds
            : ClassService.getStudentsInClass(editingClass, students).map((s) => s.id);

        const schedStr = editingClass.schedule || 'Thứ 2, Thứ 4 (18:00 - 19:30)';
        const schedObj =
          editingClass.scheduleData || parseScheduleToStructured(schedStr);

        setLiveSchedule(schedStr);
        setLiveScheduleData(schedObj);

        const studentZoom =
          editingClass.zoomStudentLink ||
          editingClass.meetingLink ||
          'https://zoom.us/j/888999101';
        const hostZoom =
          editingClass.zoomHostLink ||
          studentZoom.replace('/j/', '/s/') + '?role=host';

        form.setFieldsValue({
          courseId: editingClass.courseId || courses[0]?.id,
          name: editingClass.name,
          startDate: editingClass.startDate || '04/02/2026',
          totalSessions: Number(editingClass.totalSessions) || 12,
          operationStatus: editingClass.operationStatus || 'Đang học ổn định',
          teacherId: editingClass.teacherId || '',
          studentIds: currentStudentIds,
          schedule: schedStr,
          scheduleEffectiveFrom: '09/10/2026',
          scheduleChangeReason: '',
          zoomHostLink: hostZoom,
          zoomStudentLink: studentZoom,
          meetingId: editingClass.meetingId || '888 999 101',
          passcode: editingClass.passcode || '123456',
          zaloGroupLink:
            editingClass.zaloGroupLink || 'https://zalo.me/g/lakeducation_class',
        });
      } else {
        setProvisionedZoomConfig(null);
        setZoomHostOverlaps([]);
        const defaultSched = 'Thứ 2, Thứ 4 (19:00 - 21:00)';
        setLiveSchedule(defaultSched);
        setLiveScheduleData(parseScheduleToStructured(defaultSched));
        form.resetFields();
        const initialCourseId =
          defaultCourseId && defaultCourseId !== 'ALL'
            ? defaultCourseId
            : courses[0]?.id;
        if (initialCourseId) {
          form.setFieldsValue({
            courseId: initialCourseId,
            operationStatus: 'Đang học ổn định',
            startDate: '04/02/2026',
            totalSessions: 12,
            schedule: defaultSched,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingClass]);

  const handleAutoProvisionZoomRoom = async () => {
    const className = form.getFieldValue('name') || 'LAK Education Online Class';
    const startDateDmy = form.getFieldValue('startDate') || '';
    const totalSessions = Number(form.getFieldValue('totalSessions')) || 12;
    const passcode = form.getFieldValue('passcode') || '123456';
    const courseId = form.getFieldValue('courseId');
    const teacherId = form.getFieldValue('teacherId');
    const foundCourse = (courses || []).find((c) => c.id === courseId);
    const foundTeacher = (teachers || []).find((t) => t.id === teacherId || t.name === teacherId);

    setProvisioningZoom(true);
    try {
      const created = await ZoomBackendGateway.provisionZoomRoomForNewClass(
        {
          className,
          courseName: foundCourse?.name || '',
          teacherName: foundTeacher?.name || '',
          startDateDmy,
          totalSessions,
          scheduleData: liveScheduleData,
          passcode,
        },
        currentUser?.id || 'ADM001'
      );

      form.setFieldsValue({
        zoomHostLink: created.hostUrl,
        zoomStudentLink: created.joinUrl,
        meetingId: created.prettyMeetingId,
        passcode: created.passcode,
      });

      setZoomHostOverlaps(Array.isArray(created.overlappingZoomRooms) ? created.overlappingZoomRooms : []);

      setProvisionedZoomConfig({
        isLinked: true,
        zoomMeetingId: created.zoomMeetingId,
        prettyMeetingId: created.prettyMeetingId,
        topic: created.topic,
        meetingType: 8,
        hostEmail: created.hostEmail,
        autoRecording: created.autoRecording || 'cloud',
        weeklyDaysZoom: created.weeklyDaysZoom,
        durationMinutes: created.durationMinutes,
        occurrencesCount: created.occurrencesCount,
        joinUrl: created.joinUrl,
        passcode: created.passcode,
        linkedAt: new Date().toISOString(),
        linkedBy: currentUser?.id || 'ADM001',
      });

      message.success(
        isEnglish
          ? `Created recurring Zoom Cloud room (${created.prettyMeetingId}) with Cloud Recording ON!`
          : `Đã tự tạo phòng Zoom định kỳ (${created.prettyMeetingId}) & bật sẵn tự động ghi Cloud!`
      );
    } catch (err) {
      message.error(
        err?.message ||
        (isEnglish
          ? 'Could not auto-create Zoom room.'
          : 'Không thể khởi tạo tự động phòng học trên Zoom.')
      );
    } finally {
      setProvisioningZoom(false);
    }
  };

  const handleFinish = (values) => {
    onSubmit({
      ...values,
      totalSessions: Number(values.totalSessions) || 12,
      meetingLink: values.zoomStudentLink || values.meetingLink,
      scheduleData: liveScheduleData,
      ...(provisionedZoomConfig
        ? { zoomConfig: provisionedZoomConfig }
        : editingClass?.zoomConfig
          ? { zoomConfig: editingClass.zoomConfig }
          : {}),
    });
    setProvisionedZoomConfig(null);
    form.resetFields();
  };

  const existingHistory = Array.isArray(editingClass?.scheduleHistory)
    ? editingClass.scheduleHistory
    : editingClass
      ? [
        {
          version: 1,
          effectiveFrom: editingClass.startDate || '04/02/2026',
          effectiveTo: null,
          schedule: editingClass.schedule,
          status: 'ACTIVE',
          note: 'Lịch học khởi tạo từ ngày khai giảng lớp',
        },
      ]
      : [];

  return (
    <Drawer
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
            {isEditMode
              ? isEnglish
                ? `Edit Class & Roster: ${editingClass.id}`
                : `Chỉnh Sửa Lớp Học: ${editingClass.id}`
              : isEnglish
                ? 'Create New Class & Schedule'
                : 'Khởi Tạo Lớp Học & Lịch Tuần Hoàn'}
          </Text>
        </Space>
      }
      open={open}
      width={isMobile ? '100%' : 720}
      onClose={() => {
        form.resetFields();
        onCancel();
      }}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '6px 0' }}>
          <Button
            onClick={() => {
              form.resetFields();
              onCancel();
            }}
            style={{ height: 40, borderRadius: 8, flex: isMobile ? 1 : undefined }}
          >
            {isEnglish ? 'Cancel' : 'Hủy'}
          </Button>
          <Button
            type="primary"
            icon={isEditMode ? <SaveOutlined /> : <PlusCircleOutlined />}
            onClick={() => form.submit()}
            style={{
              height: 40,
              borderRadius: 8,
              backgroundColor: '#1890ff',
              boxShadow: '0 2px 8px rgba(24,144,255,0.3)',
              fontWeight: 600,
              flex: isMobile ? 2 : undefined,
            }}
          >
            {isEditMode
              ? isEnglish
                ? 'Save Changes'
                : 'Lưu Thay Đổi'
              : isEnglish
                ? 'Create Class'
                : 'Tạo Lớp Học'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          courseId: courses[0]?.id,
          teacherId: '',
          startDate: '04/02/2026',
          operationStatus: 'Đang học ổn định',
          platform: 'Zoom Meeting',
          schedule: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
          scheduleEffectiveFrom: '09/10/2026',
          scheduleChangeReason: '',
          zoomHostLink: 'https://zoom.us/s/888999111?role=host',
          zoomStudentLink: 'https://zoom.us/j/888999111',
          meetingId: '888 999 111',
          passcode: '123456',
          zaloGroupLink: 'https://zalo.me/g/lakeducation_class',
        }}
      >
        {/* Nhật Ký Kiểm Toán IT (Chỉ hiển thị khi chỉnh sửa và người xem là Admin) */}
        {isEditMode && (
          <AdminAuditInfo
            record={editingClass}
            currentUser={currentUser}
            mode="detail"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* KHỐI 1: ĐỊNH DANH LỚP HỌC & NGÀY KHAI GIẢNG */}
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {isEnglish
              ? '1. Class Identification & Start Date'
              : '1. Định Danh Lớp Học & Ngày Khai Giảng'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            {isEnglish
              ? 'Parent course program, class name, start date, and operational status'
              : 'Khóa học trực thuộc, tên lớp, ngày bắt đầu học và trạng thái vận hành'}
          </Text>
        </div>

        {/* Hàng 1: Khóa Học Trực Thuộc & Tên Lớp Học (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="courseId"
              label={<Text strong>{isEnglish ? 'Select Course Program' : 'Khóa Học Trực Thuộc'}</Text>}
              rules={[
                {
                  required: true,
                  message: isEnglish ? 'Please select course' : 'Vui lòng chọn khóa học',
                },
              ]}
            >
              <Select style={{ width: '100%', height: 40, borderRadius: 8 }}>
                {courses.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={<Text strong>{isEnglish ? 'Class Name' : 'Tên Lớp Học'}</Text>}
              rules={[
                {
                  required: true,
                  message: isEnglish ? 'Please enter class name' : 'Vui lòng nhập tên lớp học',
                },
              ]}
            >
              <Input
                placeholder={
                  isEnglish
                    ? 'e.g. Class 10A2 - Wonders G2 (Zoom)'
                    : 'VD: Class 10A2 - Wonders G2 (Zoom)'
                }
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2: Ngày Khai Giảng / Số Buổi Toàn Khóa / Trạng Thái Vận Hành */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="startDate"
              label={
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{isEnglish ? 'Class Start Date' : 'Ngày Bắt Đầu'}</Text>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: isEnglish ? 'Please select start date' : 'Vui lòng chọn ngày bắt đầu',
                },
              ]}
            >
              <BaseDatePicker />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="totalSessions"
              label={
                <Space>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{isEnglish ? 'Total Sessions' : 'Số Buổi Toàn Khóa'}</Text>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: isEnglish ? 'Please enter total sessions' : 'Vui lòng nhập số buổi',
                },
              ]}
              extra={
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {isEnglish ? 'Default: 12 sessions' : 'Mặc định 12 buổi (hoặc nhập)'}
                </span>
              }
            >
              <InputNumber
                min={1}
                max={100}
                placeholder="12"
                data-testid="input-class-total-sessions"
                style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="operationStatus"
              label={<Text strong>{isEnglish ? 'Operation Status' : 'Trạng Thái Vận Hành'}</Text>}
            >
              <Select style={{ width: '100%', height: 40, borderRadius: 8 }}>
                {Object.values(CLASS_OPERATION_STATUS).map((statusLabel) => (
                  <Option key={statusLabel} value={statusLabel}>
                    {statusLabel}
                  </Option>
                ))}
                <Option value="Mới khai giảng">Mới khai giảng</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* KHỐI 2: LỊCH HỌC TUẦN HOÀN KIỂU BÁO THỨC, MÚI GIỜ QUỐC TẾ & LỊCH SỬ ĐỔI LỊCH */}
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {isEnglish
              ? '2. Recurring Weekly Schedule, Multi-Timezone & Version History'
              : '2. Lịch Học Tuần Hoàn, Quy Đổi Múi Giờ & Lưu Lịch Sử Đổi Lịch'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            {isEnglish
              ? 'Supports exact-minute times (e.g. 07:20, 19:10), Vietnam/Philippines timezone conversion, and schedule version history'
              : 'Hỗ trợ chọn giờ chính xác từng phút (VD: 07:20, 19:10), tự động quy đổi giờ Việt Nam (GMT+7) <-> Philippines (GMT+8) và lưu lịch sử khi đổi lịch'}
          </Text>
        </div>

        <Form.Item
          name="schedule"
          label={<Text strong>{isEnglish ? 'Weekly Schedule Slots' : 'Cấu Hình Lịch Học Hàng Tuần'}</Text>}
          rules={[
            {
              required: true,
              message: isEnglish ? 'Please configure schedule' : 'Vui lòng cấu hình lịch học',
            },
          ]}
        >
          <BaseWeeklyScheduleControl
            scheduleData={liveScheduleData}
            onScheduleDataChange={(nextStruct) => {
              setLiveScheduleData(nextStruct);
              if (nextStruct?.formatted) {
                setLiveSchedule(nextStruct.formatted);
              }
            }}
          />
        </Form.Item>

        {/* Khi ở chế độ Chỉnh sửa Lớp học (Edit Mode): Cho phép chọn Ngày bắt đầu áp dụng lịch mới & Bảo toàn lịch sử thời khóa biểu cũ */}
        {isEditMode && (
          <div
            style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Space size={6}>
                <HistoryOutlined style={{ color: '#d48806' }} />
                <Text strong style={{ fontSize: 13, color: '#b45309' }}>
                  {isEnglish
                    ? 'Schedule Change Effective Date & History Preservation'
                    : 'Cấu Hình Ngày Áp Dụng Khi Đổi Lịch Học (Tự động lưu lịch sử thời khóa biểu cũ)'}
                </Text>
              </Space>
            </div>

            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="scheduleEffectiveFrom"
                  label={
                    <Text strong style={{ fontSize: 12 }}>
                      {isEnglish
                        ? 'New Schedule Effective From Date'
                        : 'Ngày Bắt Đầu Áp Dụng Lịch Mới'}
                    </Text>
                  }
                  style={{ marginBottom: 8 }}
                >
                  <BaseDatePicker placeholder="VD: 09/10/2026" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="scheduleChangeReason"
                  label={
                    <Text strong style={{ fontSize: 12 }}>
                      {isEnglish ? 'Reason / Note for Schedule Change' : 'Ghi Chú Lý Do Đổi Lịch'}
                    </Text>
                  }
                  style={{ marginBottom: 8 }}
                >
                  <Input
                    placeholder={
                      isEnglish
                        ? 'e.g. Switch to morning slot Tue-Thu-Sat'
                        : 'VD: Đổi sang lịch sáng T3, T5, T7 từ 09/10/2026'
                    }
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Hiển thị các giai đoạn lịch học của lớp */}
            {existingHistory.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  {isEnglish
                    ? 'Recorded Timetable History of this Class:'
                    : 'Các giai đoạn Thời khóa biểu của lớp đang được lưu trữ:'}
                </Text>
                {existingHistory.map((h) => (
                  <div
                    key={h.version}
                    style={{
                      fontSize: 12,
                      background: '#ffffff',
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                      padding: '4px 8px',
                      marginBottom: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <span>
                      <Tag color={h.status === 'ACTIVE' ? 'green' : 'default'} style={{ margin: '0 6px 0 0' }}>
                        v{h.version}
                      </Tag>
                      <strong>
                        {h.effectiveFrom} → {h.effectiveTo || (isEnglish ? 'Present' : 'Hiện tại')}:
                      </strong>{' '}
                      {h.schedule}
                    </span>
                    <Tag color={h.status === 'ACTIVE' ? 'processing' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                      {h.status === 'ACTIVE'
                        ? isEnglish
                          ? 'Current'
                          : 'Đang áp dụng'
                        : isEnglish
                          ? 'Archived'
                          : 'Lịch sử đã lưu'}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* KHỐI 3: PHÂN CÔNG GIÁO VIÊN & HỌC VIÊN (AUTOCOMPLETE + KIỂM TRA TRÙNG LỊCH TỨC THÌ) */}
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {isEnglish
              ? '3. Teacher & Student Roster Assignment (Autocomplete + Conflict Check)'
              : '3. Phân Công Giáo Viên & Học Viên (Autocomplete & Cảnh Báo Trùng Lịch)'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            {isEnglish
              ? 'Leave teacher empty to allow teachers to self-register (requires Academic approval)'
              : 'Có thể để trống Giáo viên để GV tự vào đăng ký dạy (cần Giáo vụ duyệt). Hệ thống tự động báo đỏ nếu trùng lịch.'}
          </Text>
        </div>

        {/* Giáo Viên Bản Xứ Autocomplete (Có thể để trống + Cảnh báo trùng lịch dạy) */}
        <Form.Item
          name="teacherId"
          label={
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text strong>
                {isEnglish
                  ? 'Assigned Native Teacher (1 GV - Optional)'
                  : 'Giáo Viên Bản Xứ (1 GV / Lớp — Có thể để trống cho GV đăng ký)'}
              </Text>
            </Space>
          }
        >
          <BaseTeacherAutocomplete
            teachers={teachers}
            existingClasses={existingClasses}
            targetSchedule={liveScheduleData || liveSchedule}
            excludeClassId={editingClass?.id}
          />
        </Form.Item>

        {/* Học Viên Autocomplete Đa Lựa Chọn (Cảnh báo trùng Thời khóa biểu) */}
        <Form.Item
          name="studentIds"
          label={
            <Space>
              <TeamOutlined style={{ color: '#52c41a' }} />
              <Text strong>
                {isEnglish
                  ? 'Enroll Students to Class Roster (Multi-Autocomplete)'
                  : 'Gán Học Viên Vào Lớp (Autocomplete Chọn Nhiều HV & Cảnh Báo Trùng TKB)'}
              </Text>
            </Space>
          }
        >
          <BaseStudentMultiAutocomplete
            students={students}
            existingClasses={existingClasses}
            targetSchedule={liveScheduleData || liveSchedule}
            excludeClassId={editingClass?.id}
          />
        </Form.Item>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* KHỐI 4: 2 LINK PHÒNG HỌC (TEACHER HOST & STUDENT) + NHÓM CHAT ZALO */}
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
              {isEnglish
                ? '4. Virtual Meeting Room URLs (Host & Student) & Zalo Group Chat'
                : '4. Cấu Hình 2 Link Phòng Học (Host GV & Học Viên) & Nhóm Chat Zalo'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
              {isEnglish
                ? 'Auto-create a recurring Zoom Cloud room in 1 click, or paste custom meeting URLs below.'
                : 'Bấm tự tạo phòng định kỳ trên Zoom Cloud (bật sẵn ghi Cloud) hoặc dán link thủ công bên dưới.'}
            </Text>
          </div>

          <Button
            type="primary"
            ghost
            icon={<ThunderboltOutlined />}
            loading={provisioningZoom}
            data-testid="btn-auto-provision-zoom-room"
            onClick={handleAutoProvisionZoomRoom}
            style={{
              minHeight: 38,
              borderRadius: 8,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {isEnglish ? 'Auto-Create Zoom Cloud Room' : 'Tự Tạo Phòng Trên Zoom Cloud'}
          </Button>
        </div>

        {/* Tóm tắt thông số đã đẩy lên Zoom + Cảnh báo nếu trùng khung giờ trên cùng 1 Host Zoom */}
        {provisionedZoomConfig && (
          <Alert
            type="success"
            showIcon
            data-testid="alert-zoom-provisioned-summary"
            style={{ marginBottom: 12, borderRadius: 8 }}
            title={
              isEnglish
                ? `Synced to Zoom Cloud: ID ${provisionedZoomConfig.prettyMeetingId} • ${provisionedZoomConfig.durationMinutes} mins/session • ${provisionedZoomConfig.occurrencesCount} recurring sessions • Auto-Cloud Recording ON`
                : `Đã tạo trên Zoom Cloud: ID ${provisionedZoomConfig.prettyMeetingId} • Thời lượng ${provisionedZoomConfig.durationMinutes} phút/buổi • Chuỗi ${provisionedZoomConfig.occurrencesCount} buổi định kỳ • Tự động ghi Cloud: BẬT`
            }
          />
        )}

        {zoomHostOverlaps.length > 0 && (
          <Alert
            type="warning"
            showIcon
            data-testid="alert-zoom-host-time-overlap"
            style={{ marginBottom: 12, borderRadius: 8 }}
            title={
              isEnglish
                ? 'Zoom Host Concurrency Warning (1 Licensed Host: lakvietnam@lakeducation.com)'
                : 'Cảnh Báo Trùng Giờ Trên Cùng 1 Tài Khoản Host Zoom (lakvietnam@lakeducation.com)'
            }
            description={
              <div style={{ fontSize: 12 }}>
                <div>
                  {isEnglish
                    ? 'Zoom API allows scheduling overlapping rooms, BUT your Zoom account currently has 1 Licensed Host (concurrent_meeting = None). Starting 2 live rooms at the exact same time on the same Host will disconnect the first room:'
                    : 'Zoom API vẫn cho phép lên lịch tạo mã phòng mới trùng giờ, NHƯNG tài khoản Zoom hiện chỉ có 1 giấy phép Host trả phí (concurrent_meeting = None). Nếu mở 2 phòng học cùng lúc trên cùng 1 Host sẽ làm văng phòng đang dạy:'}
                </div>
                {zoomHostOverlaps.map((ov) => (
                  <div key={ov.id} style={{ fontWeight: 600, marginTop: 3, color: '#b45309' }}>
                    • Phòng đang trùng lịch: {ov.id} — {ov.topic} ({ov.timeRange})
                  </div>
                ))}
              </div>
            }
          />
        )}

        {/* Hàng 4: Link Giáo Viên (Host) & Link Tham Gia (Học Viên) (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="zoomHostLink"
              label={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                  <Space size={6}>
                    {hostPlatform.icon}
                    <Text strong>
                      {isEnglish ? 'Host Meeting URL (Teacher)' : 'Link Giáo Viên (Host)'}
                    </Text>
                  </Space>
                  {hostLinkVal && <MeetingPlatformBadge url={hostLinkVal} size="small" />}
                </div>
              }
            >
              <Input
                prefix={hostPlatform.icon}
                placeholder="https://meet.google.com/xyz hoặc https://zoom.us/s/..."
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="zoomStudentLink"
              label={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                  <Space size={6}>
                    {studentPlatform.icon}
                    <Text strong>
                      {isEnglish ? 'Join Meeting URL (Students)' : 'Link Tham Gia (Học Viên)'}
                    </Text>
                  </Space>
                  {studentLinkVal && <MeetingPlatformBadge url={studentLinkVal} size="small" />}
                </div>
              }
            >
              <Input
                prefix={studentPlatform.icon}
                placeholder="https://meet.google.com/xyz hoặc https://zoom.us/j/..."
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 5: Meeting ID & Passcode (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="meetingId" label={<Text strong>{isEnglish ? 'Meeting ID (Optional)' : 'Meeting ID (Nếu có)'}</Text>}>
              <Input
                placeholder="888 999 111"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="passcode" label={<Text strong>{isEnglish ? 'Passcode / PIN (Optional)' : 'Mật mã phòng / PIN (Nếu có)'}</Text>}>
              <Input
                placeholder="123456"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 6: Link Nhóm Chat Zalo Của Lớp (100% Width) */}
        <Form.Item
          name="zaloGroupLink"
          label={
            <Space>
              <MessageOutlined style={{ color: '#0068ff' }} />
              <Text strong>
                {isEnglish ? 'Class Zalo Group Chat URL' : 'Link Nhóm Chat Zalo Của Lớp'}
              </Text>
            </Space>
          }
        >
          <Input
            placeholder="https://zalo.me/g/lakeducation_class_10a1"
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

// Backward-compatible alias
export const ClassFormModal = ClassFormDrawer;
