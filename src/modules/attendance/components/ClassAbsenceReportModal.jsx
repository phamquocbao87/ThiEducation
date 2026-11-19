import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  message,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  BookOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useAuth } from '../../../core/context/AuthContext';
import { AbsenceRequestService } from '../services/AbsenceRequestService';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const ClassAbsenceReportModal = ({
  open,
  classData,
  availableClasses = [],
  onClose,
  onSuccess,
}) => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // State lớp học được chọn: ưu tiên classData truyền vào, nếu không lấy lớp đầu tiên của availableClasses
  const [selectedClassId, setSelectedClassId] = useState(classData?.id || availableClasses[0]?.id || '');
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);

  useEffect(() => {
    if (classData?.id) {
      setSelectedClassId(classData.id);
    } else if (availableClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [classData, availableClasses]);

  // Object thông tin lớp học hiện tại
  const currentClass = useMemo(() => {
    if (classData && classData.id === selectedClassId) return classData;
    return availableClasses.find((c) => c.id === selectedClassId) || classData || null;
  }, [classData, availableClasses, selectedClassId]);

  // Trích xuất khung giờ ca học chuẩn của lớp (VD: "19:00 - 21:10")
  const defaultTimeRange = useMemo(() => {
    if (!currentClass) return '19:00 - 21:10';
    const sData = currentClass.scheduleData || {};
    if (sData.startTime && sData.endTime) {
      return `${sData.startTime} - ${sData.endTime}`;
    }
    const matched = String(currentClass.schedule || '').match(/(\d{1,2}:\d{2}\s*[-–~]\s*\d{1,2}:\d{2})/);
    return matched ? matched[1].replace('–', '-').replace('~', '-') : '19:00 - 21:10';
  }, [currentClass]);

  // Tự động sinh danh sách các ca học sắp tới theo TKB thực tế của lớp (Smart Session Options)
  const upcomingSessions = useMemo(() => {
    if (!currentClass) return [];
    const sessions = generateClassSessionDates(currentClass, 10, isEnglish);
    const now = Date.now();
    // Lọc các ca học từ ngày hôm nay trở đi
    const futureSessions = sessions.filter((s) => s.endMs >= now - 3600000);
    return futureSessions.length > 0 ? futureSessions : sessions.slice(0, 6);
  }, [currentClass, isEnglish]);

  // Khung giờ gợi ý dạng Selection
  const timeSlotOptions = useMemo(() => {
    return [
      {
        label: isEnglish
          ? `⏰ Full Session (${defaultTimeRange})`
          : `⏰ Toàn bộ ca học chính thức (${defaultTimeRange})`,
        value: defaultTimeRange,
      },
      {
        label: isEnglish
          ? `⏰ Late Arrival (First half of session)`
          : `⏰ Đến muộn (Vào lớp muộn nửa đầu ca)`,
        value: `${defaultTimeRange.split('-')[0]?.trim()} (Đến muộn)`,
      },
      {
        label: isEnglish
          ? `⏰ Early Leave (Second half of session)`
          : `⏰ Về sớm (Xin phép rời lớp sớm)`,
        value: `(Xin về sớm) - ${defaultTimeRange.split('-')[1]?.trim()}`,
      },
      {
        label: isEnglish
          ? `⏰ Full Day Off (Excused Entire Session)`
          : `⏰ Nghỉ trọn vẹn cả buổi học`,
        value: 'Full Day Off',
      },
    ];
  }, [defaultTimeRange, isEnglish]);

  // Reset và cập nhật form khi đổi lớp hoặc mở modal
  useEffect(() => {
    if (!open) return;
    const firstSession = upcomingSessions[0];
    const initialDate = firstSession?.date
      ? dayjs(firstSession.date, 'DD/MM/YYYY')
      : dayjs();

    form.setFieldsValue({
      classId: selectedClassId,
      sessionSelection: firstSession ? `SESSION_${firstSession.sessionIndex}` : 'CUSTOM',
      absenceDate: initialDate,
      sessionTime: defaultTimeRange,
      reason: undefined,
      note: '',
    });
    setIsCustomDateMode(!firstSession);
  }, [open, selectedClassId, upcomingSessions, defaultTimeRange, form]);

  // Khi học viên chọn một buổi học từ Dropdown Smart Session
  const handleSessionSelectChange = (value) => {
    if (value === 'CUSTOM') {
      setIsCustomDateMode(true);
      return;
    }
    setIsCustomDateMode(false);
    const matched = upcomingSessions.find((s) => `SESSION_${s.sessionIndex}` === value);
    if (matched) {
      form.setFieldsValue({
        absenceDate: dayjs(matched.date, 'DD/MM/YYYY'),
        sessionTime: matched.timeRange || defaultTimeRange,
      });
    }
  };

  const handleSubmit = async (values) => {
    if (!currentClass?.id) {
      message.error(isEnglish ? 'Please select a valid class' : 'Vui lòng chọn lớp học hợp lệ');
      return;
    }
    setSubmitting(true);
    try {
      const formattedDate = values.absenceDate
        ? values.absenceDate.format('DD/MM/YYYY')
        : dayjs().format('DD/MM/YYYY');

      const userRole = currentUser?.role === 'teacher' ? 'teacher' : 'student';

      await AbsenceRequestService.createRequest({
        classId: currentClass.id,
        className: currentClass.name || currentClass.id,
        userId: currentUser?.id || currentUser?.code || 'UNKNOWN',
        userName: currentUser?.englishName || currentUser?.name || currentUser?.displayName || 'User',
        userRole,
        teacherId: currentClass.teacherId || '',
        teacherName: currentClass.teacherName || 'Native Teacher',
        absenceDate: formattedDate,
        sessionTime: values.sessionTime || defaultTimeRange,
        reason: values.reason || (isEnglish ? 'Personal Reason' : 'Lý do cá nhân'),
        note: values.note || '',
      });

      message.success(
        isEnglish
          ? 'Absence notice sent successfully! Academic staff and native teacher have been notified.'
          : 'Đã gửi đơn xin nghỉ phép thành công! Giáo vụ và giáo viên bản xứ đã nhận được thông tin.'
      );
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(
        isEnglish
          ? `Failed to send absence notice: ${err.message}`
          : `Lỗi gửi đơn báo vắng: ${err.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isTeacher = currentUser?.role === 'teacher';
  const hasMultipleClasses = availableClasses.length > 1;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={580}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {isEnglish
              ? `Report Absence / Request Leave`
              : `Báo Vắng Mặt / Xin Nghỉ Phép`}
          </span>
        </div>
      }
      style={{ borderRadius: 12 }}
      data-testid="modal-class-absence-report"
    >
      <div
        style={{
          marginBottom: 14,
          background: '#fffbe6',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #ffe58f',
        }}
      >
        <Text style={{ fontSize: 13, color: '#873800', lineHeight: 1.4, display: 'block' }}>
          💡 {isEnglish
            ? 'Your absence request will be delivered directly to the Academic Operations Center and synced to your Native Teacher with an Excused Leave tag.'
            : 'Đơn báo vắng của bạn sẽ được gửi thẳng tới Bàn Giáo Vụ và tự động gắn huy hiệu Vắng Có Phép trên bàn dạy của Giáo viên bản xứ.'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          classId: selectedClassId,
          sessionTime: defaultTimeRange,
          reason: undefined,
          note: '',
        }}
      >
        {/* ========================================================= */}
        {/* 1. LỚP HỌC: CHỌN LỚP NẾU HỌC NHIỀU LỚP HOẶC HIỂN THỊ CỐ ĐỊNH */}
        {/* ========================================================= */}
        {hasMultipleClasses ? (
          <Form.Item
            name="classId"
            label={
              <Space>
                <Text strong>{isEnglish ? 'Select Class to Request Leave' : 'Chọn Lớp Học Cần Xin Nghỉ'}</Text>
                <Tag color="purple" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                  {isEnglish ? `${availableClasses.length} enrolled classes` : `${availableClasses.length} lớp đang học`}
                </Tag>
              </Space>
            }
            rules={[{ required: true, message: isEnglish ? 'Please select a class' : 'Vui lòng chọn lớp học' }]}
          >
            <Select
              style={{ width: '100%', height: 42 }}
              value={selectedClassId}
              onChange={(val) => setSelectedClassId(val)}
              data-testid="select-absence-class"
            >
              {availableClasses.map((c) => (
                <Option key={c.id} value={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {c.schedule} • GV: {c.teacherName || 'Teacher'}
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>
              {currentClass?.id}
            </Tag>
            <Text strong style={{ fontSize: 13, color: '#0958d9' }}>
              {currentClass?.name}
            </Text>
            <Tag color={isTeacher ? 'purple' : 'green'} style={{ margin: 0 }}>
              {isTeacher ? (isEnglish ? 'Teacher Notice' : 'Giáo Viên') : (isEnglish ? 'Student Notice' : 'Học Viên')}
            </Tag>
            {currentClass?.teacherName && (
              <Tag color="cyan" style={{ margin: 0 }}>
                {isEnglish ? `Teacher: ${currentClass.teacherName}` : `GV: ${currentClass.teacherName}`}
              </Tag>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. CHỌN BUỔI HỌC / CA HỌC THEO THỜI KHÓA BIỂU THỰC TẾ     */}
        {/* ========================================================= */}
        {!isCustomDateMode ? (
          <Form.Item
            name="sessionSelection"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Space size={6}>
                  <CalendarOutlined style={{ color: '#0284c7' }} />
                  <Text strong>{isEnglish ? 'Upcoming Scheduled Session' : 'Buổi Học Theo Thời Khóa Biểu'}</Text>
                </Space>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setIsCustomDateMode(true)}
                  style={{ padding: 0, fontSize: 12 }}
                  data-testid="btn-switch-custom-date"
                >
                  {isEnglish ? '📅 Choose another date' : '📅 Chọn ngày khác ngoài lịch'}
                </Button>
              </div>
            }
            rules={[{ required: true, message: isEnglish ? 'Please choose a session' : 'Vui lòng chọn buổi học' }]}
          >
            <Select
              style={{ width: '100%', height: 42 }}
              onChange={handleSessionSelectChange}
              data-testid="select-absence-session"
            >
              {upcomingSessions.map((s, idx) => (
                <Option key={`SESSION_${s.sessionIndex}`} value={`SESSION_${s.sessionIndex}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: idx === 0 ? 700 : 500 }}>
                      {idx === 0 ? '🌟 ' : '📅 '}
                      {s.dayName}, {s.date}
                    </span>
                    <Tag color={idx === 0 ? 'green' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                      {s.timeRange || defaultTimeRange}
                    </Tag>
                  </div>
                </Option>
              ))}
              <Option value="CUSTOM">
                <span style={{ color: '#0284c7', fontWeight: 600 }}>
                  📅 {isEnglish ? 'Choose custom date from calendar...' : 'Chọn ngày khác tùy chỉnh trên lịch...'}
                </span>
              </Option>
            </Select>
          </Form.Item>
        ) : (
          <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: 8, border: '1px solid #bae6fd', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong style={{ color: '#0369a1' }}>
                {isEnglish ? 'Select Custom Absence Date' : 'Chọn Ngày Vắng Tùy Chỉnh Trên Lịch'}
              </Text>
              {upcomingSessions.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setIsCustomDateMode(false);
                    const first = upcomingSessions[0];
                    if (first) {
                      form.setFieldsValue({
                        sessionSelection: `SESSION_${first.sessionIndex}`,
                        absenceDate: dayjs(first.date, 'DD/MM/YYYY'),
                        sessionTime: first.timeRange || defaultTimeRange,
                      });
                    }
                  }}
                  style={{ padding: 0, fontSize: 12 }}
                >
                  {isEnglish ? '↩ Back to timetable' : '↩ Quay lại lịch học cố định'}
                </Button>
              )}
            </div>

            <Form.Item
              name="absenceDate"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: isEnglish ? 'Please select absence date' : 'Vui lòng chọn ngày báo vắng' }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                data-testid="input-absence-date"
              />
            </Form.Item>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. KHUNG GIỜ CA HỌC: DROPDOWN SELECTION CHUẨN HÓA         */}
        {/* ========================================================= */}
        <Form.Item
          name="sessionTime"
          label={
            <Space size={6}>
              <ClockCircleOutlined style={{ color: '#0284c7' }} />
              <Text strong>{isEnglish ? 'Class Session Time Slot' : 'Khung Giờ Ca Học'}</Text>
            </Space>
          }
          rules={[{ required: true, message: isEnglish ? 'Please select time slot' : 'Vui lòng chọn khung giờ' }]}
        >
          <Select
            style={{ width: '100%', height: 42 }}
            options={timeSlotOptions}
            data-testid="select-absence-timeslot"
          />
        </Form.Item>

        {/* ========================================================= */}
        {/* 4. LÝ DO VẮNG MẶT: OPTIONAL (TÙY CHỌN)                    */}
        {/* ========================================================= */}
        <Form.Item
          name="reason"
          label={
            <Space>
              <Text strong>{isEnglish ? 'Reason for Absence' : 'Lý Do Vắng Mặt'}</Text>
              <Tag color="default" style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                {isEnglish ? 'Optional' : 'Tùy chọn'}
              </Tag>
            </Space>
          }
        >
          <Select
            allowClear
            placeholder={isEnglish ? 'Select a reason (optional) or leave blank' : 'Chọn lý do (tùy chọn) hoặc để trống'}
            style={{ width: '100%', height: 40 }}
            data-testid="select-absence-reason"
          >
            <Option value="Bị ốm / Sức khỏe không tốt">
              {isEnglish ? '🤒 Health / Sick Leave' : '🤒 Bị ốm / Sức khỏe không tốt'}
            </Option>
            <Option value="Bận việc gia đình đột xuất">
              {isEnglish ? '🏠 Urgent Family Matters' : '🏠 Bận việc gia đình đột xuất'}
            </Option>
            <Option value="Trùng lịch thi cử / Học trên trường">
              {isEnglish ? '📚 School Exam / Test Conflict' : '📚 Trùng lịch thi cử / Học trên trường'}
            </Option>
            <Option value="Đi công tác / Du lịch / Về quê">
              {isEnglish ? '✈️ Business Trip / Travel / Homecoming' : '✈️ Đi công tác / Du lịch / Về quê'}
            </Option>
            <Option value="Lý do cá nhân khác">
              {isEnglish ? '📝 Other Personal Reason' : '📝 Lý do cá nhân khác'}
            </Option>
          </Select>
        </Form.Item>

        {/* ========================================================= */}
        {/* 5. LỜI NHẮN GỬI GIÁO VỤ: OPTIONAL (TÙY CHỌN)              */}
        {/* ========================================================= */}
        <Form.Item
          name="note"
          label={
            <Space>
              <Text strong>{isEnglish ? 'Detailed Message to Academic Staff' : 'Lời Nhắn Gửi Giáo Vụ'}</Text>
              <Tag color="default" style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                {isEnglish ? 'Optional' : 'Tùy chọn'}
              </Tag>
            </Space>
          }
        >
          <TextArea
            rows={3}
            placeholder={
              isEnglish
                ? 'Provide any additional details or preferred makeup date (optional)...'
                : 'Nhập thông tin thêm hoặc đề xuất buổi học bù nếu có (tùy chọn)...'
            }
            style={{ borderRadius: 8 }}
            data-testid="input-absence-note"
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <Button onClick={onClose} icon={<CloseOutlined />} style={{ borderRadius: 8, height: 40 }}>
            {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SendOutlined />}
            style={{ borderRadius: 8, height: 40, backgroundColor: '#fa8c16', borderColor: '#fa8c16', fontWeight: 600 }}
            data-testid="btn-submit-absence-report"
          >
            {isEnglish ? 'Send Absence Notice' : 'Gửi Đơn Xin Nghỉ'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
