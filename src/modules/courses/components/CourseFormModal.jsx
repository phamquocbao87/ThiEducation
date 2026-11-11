import React, { useEffect, useState, useMemo } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Descriptions,
  Tag,
  Card,
  Divider,
} from 'antd';
import {
  BookOutlined,
  EditOutlined,
  SaveOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { COURSE_LEVEL_OPTIONS } from '../models/courses.model';
import { CurriculumLevelService } from '../../curriculum/services/CurriculumLevelService';
import { BaseRangeSelector } from '../../../shared/components/controls';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useAuth } from '../../../core/context/AuthContext';
import { AdminAuditInfo } from '../../../shared/components/AdminAuditInfo';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * Drawer Chế Độ XEM CHI TIẾT KHÓA HỌC (VIEW MODE)
 */
export const CourseDetailDrawer = ({
  open,
  course,
  classes = [],
  canManage = false,
  onClose,
  onEdit,
  onRequestEnrollClass,
  onViewRoster,
}) => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const isStudentRole = currentUser?.role === 'student';
  const currentUid = currentUser?.id || currentUser?.code;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!course) return null;

  const courseClasses = classes.filter((cls) => cls.courseId === course.id);

  return (
    <Drawer
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
            {isEnglish ? 'Course Program Details' : 'Chi Tiết Chương Trình Khóa Học'}
          </Text>
        </Space>
      }
      open={open}
      width={isMobile ? '100%' : 720}
      onClose={onClose}
      destroyOnClose
      extra={
        canManage && onEdit ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              onClose();
              onEdit(course);
            }}
            style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
          >
            {isEnglish ? 'Edit Course' : 'Chỉnh Sửa'}
          </Button>
        ) : null
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '4px 0' }}>
          <Button onClick={onClose} style={{ height: 40, borderRadius: 8, minWidth: 100 }}>
            {isEnglish ? 'Close' : 'Đóng'}
          </Button>
          {canManage && onEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                onClose();
                onEdit(course);
              }}
              style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
            >
              {isEnglish ? 'Edit Course Program' : 'Chỉnh Sửa Khóa Học'}
            </Button>
          )}
        </div>
      }
    >
      {/* 1. Header Khóa Học */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap size={8}>
          <Tag color="geekblue" style={{ fontSize: 13, padding: '2px 8px', fontWeight: 700 }}>
            {course.id}
          </Tag>
          <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px', fontWeight: 500 }}>
            {course.level}
          </Tag>
          <Tag color={course.status === 'Inactive' ? 'red' : 'green'} style={{ fontSize: 13, padding: '2px 8px' }}>
            {course.status || 'Active'}
          </Tag>
        </Space>
        <Title level={4} style={{ margin: '10px 0 4px', color: '#0f172a' }}>
          {course.name}
        </Title>
        {course.targetAge && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {isEnglish ? 'Target Age Group: ' : 'Độ tuổi học viên mục tiêu: '}
            <Text strong>{course.targetAge}</Text>
          </Text>
        )}
      </div>

      {/* Nhật Ký Kiểm Toán IT (Chỉ hiển thị cho View Admin) */}
      <AdminAuditInfo record={course} currentUser={currentUser} mode="detail" style={{ marginBottom: 16 }} />

      {/* 2. Thẻ Chỉ Số Tóm Tắt (Metric Highlight Cards) */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#f0f7ff', borderColor: '#bae0ff' }}>
            <Space>
              <ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {isEnglish ? 'Duration' : 'Thời lượng khóa'}
                </div>
                <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                  {course.durationMonths || 3} {isEnglish ? 'months' : 'tháng'} ({course.durationWeeks || 12}{' '}
                  {isEnglish ? 'wks' : 'tuần'})
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Space>
              <TeamOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {isEnglish ? 'Max Class Size' : 'Sĩ số chuẩn / lớp'}
                </div>
                <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                  {course.maxClassSize || 18} {isEnglish ? 'students' : 'học viên'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#f9f0ff', borderColor: '#d3adf7' }}>
            <Space>
              <DollarOutlined style={{ fontSize: 20, color: '#722ed1' }} />
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {isEnglish ? 'Monthly Fee' : 'Học phí niêm yết'}
                </div>
                <Text strong style={{ fontSize: 15, color: '#722ed1', whiteSpace: 'nowrap' }}>
                  {formatCurrency(course.feePerMonth)}/{isEnglish ? 'mo' : 'tháng'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 3. Bảng Thông Tin Chi Tiết Chuẩn Enterprise */}
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 20 }}>
        <Descriptions.Item label={isEnglish ? 'Study Frequency' : 'Tần suất học'}>
          {course.sessionsPerWeek || 2} {isEnglish ? 'sessions/week' : 'buổi/tuần'} (
          {course.totalSessions || 24} {isEnglish ? 'total sessions' : 'buổi toàn khóa'})
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Full Course Tuition' : 'Tổng học phí toàn khóa'}>
          <Text strong style={{ color: '#0f172a' }}>
            {formatCurrency(
              course.totalCourseFee || (course.feePerMonth || 2500000) * (course.durationMonths || 3)
            )}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Learning Format' : 'Hình thức đào tạo'} span={2}>
          {course.format || '100% Native English Teacher (Zoom Cloud Meeting)'}
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Official Textbooks' : 'Giáo trình chính'} span={2}>
          {course.curriculumTextbooks || 'McGraw-Hill Wonders Literature Anthology & Reading/Writing Companion'}
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Prerequisites' : 'Điều kiện đầu vào'} span={2}>
          {course.prerequisites || 'Kiểm tra đánh giá năng lực đầu vào 1-1 với giáo vụ'}
        </Descriptions.Item>
      </Descriptions>

      {/* 4. Mục Tiêu Đào Tạo Sư Phạm */}
      {(course.objectives || course.description) && (
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8, color: '#0f172a', fontSize: 14 }}>
            {isEnglish ? 'Pedagogical Objectives & Outcomes:' : 'Mục Tiêu Đào Tạo & Chuẩn Đầu Ra:'}
          </Text>
          <div
            style={{
              background: '#f8fafc',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              fontSize: 13,
              lineHeight: 1.6,
              color: '#334155',
            }}
          >
            {course.objectives || course.description}
          </div>
        </div>
      )}

      {/* 5. Danh Sách Các Lớp Học Đang Mở Thuộc Khóa Học Này */}
      <Divider style={{ margin: '16px 0' }} />
      <div>
        <Title level={5} style={{ margin: '0 0 12px 0', color: '#0f172a' }}>
          {isEnglish ? 'Active Classes in this Course' : 'Danh Sách Lớp Học Trực Thuộc'} (
          {courseClasses.length})
        </Title>
        {courseClasses.length === 0 ? (
          <div
            style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
            }}
          >
            {isEnglish
              ? 'No active classes assigned to this course yet.'
              : 'Hiện chưa có lớp học nào đang mở dưới khóa học này.'}
          </div>
        ) : (
          <Row gutter={[10, 10]}>
            {courseClasses.map((cls) => {
              const isEnrolled = (cls.studentIds || []).includes(currentUid);
              const isPending = (cls.pendingStudentRequests || []).some(
                (r) => r.studentId === currentUid
              );
              const zoomUrl = cls.zoomStudentLink || cls.meetingLink;

              return (
                <Col xs={24} sm={12} key={cls.id}>
                  <Card size="small" style={{ borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color="geekblue" style={{ fontWeight: 700, margin: 0 }}>
                        {cls.id}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {cls.totalStudents || cls.studentIds?.length || 0} HV
                      </Text>
                    </div>
                    <Text strong style={{ display: 'block', marginBottom: 4, color: '#0f172a' }}>
                      {cls.name}
                    </Text>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <UserOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                      {cls.teacherName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      <CalendarOutlined style={{ marginRight: 4, color: '#fa8c16' }} />
                      {cls.schedule}
                    </div>

                    {/* Hiển thị thông tin Zoom nếu đã được duyệt hoặc là Cán bộ quản lý */}
                    {(!isStudentRole || isEnrolled) && (
                      <div style={{ fontSize: 12, color: '#722ed1', marginTop: 4, fontWeight: 600 }}>
                        <VideoCameraOutlined style={{ marginRight: 4 }} />
                        Zoom ID: {cls.meetingId || '888 999 101'}{' '}
                        {zoomUrl && (
                          <a
                            href={zoomUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 6, textDecoration: 'underline' }}
                          >
                            {isEnglish ? 'Join Zoom' : 'Vào Zoom'}
                          </a>
                        )}
                      </div>
                    )}

                    {/* 3 trạng thái đăng ký cho Học viên ngay trong Drawer Khóa học */}
                    {isStudentRole && (
                      <div style={{ marginTop: 8 }}>
                        {isEnrolled ? (
                          <Button
                            type="primary"
                            size="small"
                            block
                            icon={<LinkOutlined />}
                            onClick={() =>
                              onViewRoster ? onViewRoster(cls) : zoomUrl && window.open(zoomUrl, '_blank')
                            }
                            style={{
                              borderRadius: 6,
                              background: '#16a34a',
                              borderColor: '#16a34a',
                              fontWeight: 600,
                            }}
                          >
                            {isEnglish
                              ? 'Enrolled — View Class & Zoom'
                              : 'Đã duyệt — Xem Lớp & Phòng Zoom'}
                          </Button>
                        ) : isPending ? (
                          <Button
                            size="small"
                            disabled
                            block
                            icon={<ClockCircleOutlined />}
                            style={{
                              borderRadius: 6,
                              background: '#e6f4ff',
                              borderColor: '#91caff',
                              color: '#0958d9',
                              fontWeight: 600,
                              cursor: 'not-allowed',
                            }}
                          >
                            {isEnglish
                              ? 'Registered — Waiting for Approval'
                              : 'Đã đăng ký — Chờ phê duyệt'}
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            type="dashed"
                            block
                            icon={<UserAddOutlined />}
                            onClick={() => onRequestEnrollClass && onRequestEnrollClass(cls.id)}
                            style={{
                              borderRadius: 6,
                              borderColor: '#16a34a',
                              color: '#16a34a',
                              background: '#f6ffed',
                              fontWeight: 600,
                            }}
                          >
                            {isEnglish ? 'Register for Class' : 'Đăng Ký Tham Gia Lớp'}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </Drawer>
  );
};

/**
 * Drawer Chế Độ CHỈNH SỬA / TẠO MỚI KHÓA HỌC (EDIT MODE)
 * Chuẩn hóa Grid Harmonization (50/50 & 33/33/33) và 100% Width Controls (Height 40px)
 */
export const CourseFormModal = ({
  open,
  editingCourse = null,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const isEditMode = Boolean(editingCourse);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const curriculumLevels = useMemo(() => {
    try {
      const all = CurriculumLevelService.getAllLevels();
      const active = all.filter((l) => l.status === 'ACTIVE');
      return active.length > 0 ? active : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (editingCourse) {
        form.setFieldsValue({
          id: editingCourse.id,
          name: editingCourse.name,
          level: editingCourse.level || 'WONDERS-G1',
          targetAge: editingCourse.targetAge || '6 - 7 tuổi (Lớp 1 Tiểu học)',
          status: editingCourse.status || 'Active',
          durationMonths: editingCourse.durationMonths || Math.round((editingCourse.durationWeeks || 12) / 4),
          sessionsPerWeek: editingCourse.sessionsPerWeek || 2,
          maxClassSize: editingCourse.maxClassSize || 18,
          feePerMonth: editingCourse.feePerMonth || 2500000,
          format: editingCourse.format || '100% Native English Teacher (Zoom Cloud Meeting)',
          curriculumTextbooks:
            editingCourse.curriculumTextbooks ||
            'McGraw-Hill Wonders Literature Anthology & Reading/Writing Companion',
          prerequisites:
            editingCourse.prerequisites ||
            'Kiểm tra đánh giá năng lực đầu vào 1-1 với giáo vụ',
          objectives: editingCourse.objectives || editingCourse.description || '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingCourse, form]);

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Drawer
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
            {isEditMode
              ? isEnglish
                ? `Edit Course: ${editingCourse.id}`
                : `Chỉnh Sửa Khóa Học: ${editingCourse.id}`
              : isEnglish
              ? 'Create New Course Program'
              : 'Khởi Tạo Khóa Học Mới'}
          </Text>
        </Space>
      }
      open={open}
      width={isMobile ? '100%' : 680}
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
              ? 'Create Course'
              : 'Tạo Khóa Học'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          level: 'WONDERS-G1',
          targetAge: '6 - 7 tuổi',
          status: 'Active',
          durationMonths: 3,
          sessionsPerWeek: 2,
          maxClassSize: 18,
          feePerMonth: 2500000,
          format: '100% Native English Teacher (Zoom Cloud Meeting)',
        }}
      >
        {/* Nhật Ký Kiểm Toán IT (Chỉ hiển thị khi chỉnh sửa và người xem là Admin) */}
        {isEditMode && (
          <AdminAuditInfo
            record={editingCourse}
            currentUser={currentUser}
            mode="detail"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* KHỐI 1: ĐỊNH DANH KHÓA HỌC & CẤP ĐỘ GIÁO TRÌNH */}
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {isEnglish
              ? '1. Course Identification & Curriculum Framework'
              : '1. Định Danh Khóa Học & Cấp Độ Giáo Trình'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            {isEnglish
              ? 'Course title, McGraw-Hill Wonders level, and enrollment status'
              : 'Tên chương trình đào tạo, cấp độ giáo trình McGraw-Hill Wonders và trạng thái tuyển sinh'}
          </Text>
        </div>

        {/* Hàng 1: Tên Khóa Học & Cấp Độ Giáo Trình (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={<Text strong>{isEnglish ? 'Course Title' : 'Tên Khóa Học'}</Text>}
              rules={[
                {
                  required: true,
                  message: isEnglish ? 'Please enter course title' : 'Vui lòng nhập tên khóa học',
                },
              ]}
            >
              <Input
                placeholder={
                  isEnglish
                    ? 'e.g. Wonders Grade 1 - ELA Mastery'
                    : 'VD: Wonders Grade 1 (G1) - Tiếng Anh Học Thuật'
                }
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="level"
              label={<Text strong>{isEnglish ? 'Curriculum Level' : 'Cấp Độ Giáo Trình'}</Text>}
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                onChange={(selectedCode) => {
                  if (curriculumLevels) {
                    const matched = curriculumLevels.find((l) => l.code === selectedCode);
                    if (matched?.ageRange) {
                      form.setFieldsValue({ targetAge: matched.ageRange });
                    }
                  }
                }}
              >
                {curriculumLevels
                  ? curriculumLevels.map((lvl) => (
                      <Option key={lvl.code} value={lvl.code}>
                        {lvl.code} — {isEnglish ? lvl.titleEn || lvl.name || lvl.titleVi : lvl.name || lvl.titleVi}
                      </Option>
                    ))
                  : COURSE_LEVEL_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* KHỐI 2: ĐỘ TUỔI KHUYẾN NGHỊ & KẾ HOẠCH LỘ TRÌNH (ĐỒNG BỘ 100% VỚI CREATE NEW LEVEL) */}
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {isEnglish
              ? '2. Recommended Age Range & Scheduling Plan'
              : '2. Độ Tuổi Khuyến Nghị & Kế Hoạch Thời Lượng Khóa Học'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            {isEnglish
              ? 'Age tiers, study frequency, class capacity, and proposed course duration'
              : 'Khung độ tuổi học viên mục tiêu, thời lượng tháng, tần suất học và sĩ số chuẩn'}
          </Text>
        </div>

        {/* Control BaseRangeSelector đồng bộ 100% với màn hình Create New Level */}
        <Form.Item
          name="targetAge"
          label={
            <Text strong>
              {isEnglish ? 'Recommended Age Range (Target Age Group)' : 'Độ Tuổi Học Viên Mục Tiêu (Recommended Age Range)'}
            </Text>
          }
          rules={[{ required: true }]}
        >
          <BaseRangeSelector />
        </Form.Item>

        {/* Hàng 2: Thời Lượng Tháng, Số Buổi/Tuần, Sĩ Số Tối Đa (33.3% / 33.3% / 33.3%) */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="durationMonths"
              label={<Text strong>{isEnglish ? 'Duration (Months)' : 'Thời Lượng (Tháng)'}</Text>}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                max={24}
                style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="sessionsPerWeek"
              label={<Text strong>{isEnglish ? 'Sessions / Week' : 'Số Buổi / Tuần'}</Text>}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                max={7}
                style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="maxClassSize"
              label={<Text strong>{isEnglish ? 'Max Class Size' : 'Sĩ Số Tối Đa / Lớp'}</Text>}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                max={50}
                style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 3: Học Phí / Tháng & Trạng Thái Khóa Học (50% / 50%) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="feePerMonth"
              label={<Text strong>{isEnglish ? 'Monthly Fee (VND)' : 'Học Phí Niêm Yết / Tháng (VNĐ)'}</Text>}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={500000}
                step={100000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="status"
              label={<Text strong>{isEnglish ? 'Program Status' : 'Trạng Thái Khóa Học'}</Text>}
            >
              <Select style={{ width: '100%', height: 40, borderRadius: 8 }}>
                <Option value="Active">{isEnglish ? 'Active (Open)' : 'Active (Đang mở tuyển sinh)'}</Option>
                <Option value="Inactive">{isEnglish ? 'Inactive (Paused)' : 'Inactive (Tạm ngưng)'}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* KHỐI 3: GIÁO TRÌNH, HÌNH THỨC & MỤC TIÊU ĐÀO TẠO */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="curriculumTextbooks"
              label={<Text strong>{isEnglish ? 'Official Textbooks' : 'Giáo Trình Chính'}</Text>}
            >
              <Input
                placeholder="McGraw-Hill Wonders Literature Anthology..."
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="format"
              label={<Text strong>{isEnglish ? 'Learning Format' : 'Hình Thức Giảng Dạy'}</Text>}
            >
              <Input
                placeholder="100% Native English Teacher (Zoom Cloud Meeting)"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="prerequisites"
          label={<Text strong>{isEnglish ? 'Entry Prerequisites' : 'Yêu Cầu Đầu Vào'}</Text>}
        >
          <Input
            placeholder="Đánh giá năng lực đầu vào 1-1 với giáo vụ"
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />
        </Form.Item>

        {/* Hàng 6: Mục Tiêu Đào Tạo Sư Phạm */}
        <Form.Item
          name="objectives"
          label={
            <Text strong>
              {isEnglish ? 'Pedagogical Objectives & Outcomes' : 'Mục Tiêu Đào Tạo & Chuẩn Đầu Ra'}
            </Text>
          }
        >
          <TextArea
            rows={4}
            placeholder={
              isEnglish
                ? 'Summary of Wonders textbooks, reading comprehension and writing goals...'
                : 'Mô tả chi tiết mục tiêu phát triển kỹ năng đọc hiểu, từ vựng học thuật và tư duy phản biện...'
            }
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
