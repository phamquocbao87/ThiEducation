import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Divider,
  Tag,
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
} from '@ant-design/icons';
import { CLASS_OPERATION_STATUS } from '../models/courses.model';
import { ClassService } from '../services/ClassService';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  BaseDatePicker,
  BaseWeeklyScheduleControl,
  BaseTeacherAutocomplete,
  BaseStudentMultiAutocomplete,
} from '../../../shared/components/controls';
import { parseScheduleToStructured } from '../../../shared/utils/scheduleUtils';

const { Option } = Select;
const { Text } = Typography;

export const ClassFormDrawer = ({
  open,
  editingClass = null,
  courses = [],
  teachers = [],
  students = [],
  existingClasses = [],
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const { isEnglish } = useLanguage();
  const isEditMode = Boolean(editingClass);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  // Live schedule state to drive real-time Teacher & Student conflict detection
  const [liveSchedule, setLiveSchedule] = useState('Thứ 2, Thứ 4 (18:00 - 19:30)');
  const [liveScheduleData, setLiveScheduleData] = useState(() =>
    parseScheduleToStructured('Thứ 2, Thứ 4 (18:00 - 19:30)')
  );

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
        const defaultSched = 'Thứ 2, Thứ 4 (18:00 - 19:30)';
        setLiveSchedule(defaultSched);
        setLiveScheduleData(parseScheduleToStructured(defaultSched));
        form.resetFields();
      }
    }
  }, [open, editingClass, courses, teachers, students, form]);

  const handleFinish = (values) => {
    onSubmit({
      ...values,
      meetingLink: values.zoomStudentLink || values.meetingLink,
      scheduleData: liveScheduleData,
    });
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

        {/* Hàng 2: Ngày Khai Giảng / Bắt Đầu Lớp Học & Trạng Thái Vận Hành (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="startDate"
              label={
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{isEnglish ? 'Class Start Date' : 'Ngày Bắt Đầu Lớp Học'}</Text>
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

          <Col xs={24} sm={12}>
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

        {/* KHỐI 4: 2 LINK PHÒNG HỌC ZOOM (TEACHER HOST & STUDENT) + NHÓM CHAT ZALO */}
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {isEnglish
              ? '4. Zoom Classroom URLs (Host & Student) & Zalo Group Chat'
              : '4. Cấu Hình 2 Link Phòng Học Zoom (Host GV & Học Viên) & Nhóm Chat Zalo'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            {isEnglish
              ? 'Separate Zoom Host link for Teacher and Join link for Students, plus class Zalo group'
              : 'Tách biệt đường dẫn mở phòng (Host) cho Giáo viên, đường dẫn vào học cho Học viên và nhóm Zalo của lớp'}
          </Text>
        </div>

        {/* Hàng 4: Link Zoom Teacher (Host) & Link Zoom Học Viên (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="zoomHostLink"
              label={
                <Space>
                  <VideoCameraOutlined style={{ color: '#1890ff' }} />
                  <Text strong>
                    {isEnglish ? 'Zoom URL for Teacher (Host)' : 'Link Zoom Giáo Viên (Host)'}
                  </Text>
                </Space>
              }
            >
              <Input
                placeholder="https://zoom.us/s/888999111?role=host"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="zoomStudentLink"
              label={
                <Space>
                  <VideoCameraOutlined style={{ color: '#722ed1' }} />
                  <Text strong>
                    {isEnglish ? 'Zoom URL for Students (Join)' : 'Link Zoom Học Viên (Vào Học)'}
                  </Text>
                </Space>
              }
            >
              <Input
                placeholder="https://zoom.us/j/888999111"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 5: Zoom Meeting ID & Passcode (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="meetingId" label={<Text strong>Zoom Meeting ID</Text>}>
              <Input
                placeholder="888 999 111"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="passcode" label={<Text strong>Zoom Passcode</Text>}>
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
