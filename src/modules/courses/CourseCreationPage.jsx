import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  message,
  Breadcrumb,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  BookOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { COURSE_LEVEL_OPTIONS } from './models/courses.model';
import { CourseService } from './services/CourseService';
import { CurriculumLevelService } from '../curriculum/services/CurriculumLevelService';
import { MOCK_COURSES } from '../../shared/data/mockData';
import { BaseRangeSelector } from '../../shared/components/controls';
import { FormSectionCard } from '../../shared/components/layout';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const CourseCreationPage = () => {
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const curriculumLevels = useMemo(() => {
    try {
      const all = CurriculumLevelService.getAllLevels();
      const active = all.filter((l) => l.status === 'ACTIVE');
      return active.length > 0 ? active : null;
    } catch {
      return null;
    }
  }, []);

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      // 1. Lấy danh sách khóa học thực tế từ Cloud Firestore
      const currentCourses = await CourseService.getAllCourses();

      // 2. Tạo đối tượng khóa học mới theo chuẩn đào tạo Tiếng Anh LAK Education
      const durationMonths = Number(values.durationMonths) || 3;
      const durationWeeks = durationMonths * 4;

      const newCourseRecord = {
        id: values.id?.trim() || `KH-${String(currentCourses.length + 1).padStart(3, '0')}`,
        name: values.name?.trim(),
        level: values.level,
        targetAge: values.targetAge?.trim() || '6 - 12 tuổi',
        durationMonths,
        durationWeeks,
        sessionsPerWeek: Number(values.sessionsPerWeek) || 2,
        totalSessions: Number(values.totalSessions) || (durationWeeks * (Number(values.sessionsPerWeek) || 2)),
        maxClassSize: Number(values.maxClassSize) || 20,
        feePerMonth: Number(values.feePerMonth) || 2500000,
        totalCourseFee: (Number(values.feePerMonth) || 2500000) * durationMonths,
        objectives: values.objectives?.trim() || '',
        curriculumTextbooks: values.curriculumTextbooks?.trim() || 'McGraw-Hill Wonders Literature Anthology & Practice Book',
        prerequisites: values.prerequisites?.trim() || 'Kiểm tra đánh giá đầu vào 1-1 với giáo vụ',
        format: values.format || '100% Native English Teacher (Zoom Cloud Meeting)',
        activeClasses: 0,
        enrolledStudents: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      // 3. Lưu trực tiếp vào Cloud Firestore collection 'courses'
      await CourseService.saveCourse(newCourseRecord);

      message.success(isEnglish ? 'Course created and published successfully!' : 'Đã khởi tạo và xuất bản khóa học mới thành công!');
      navigate('/courses-classes');
    } catch (err) {
      message.error(isEnglish ? 'Failed to create course: ' + err.message : 'Lỗi tạo khóa học: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Header Điều Hướng & Nút Hành Động */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size={10}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/courses-classes')}
            style={{ borderRadius: 8 }}
          >
            {isEnglish ? 'Back to Courses & Classes' : 'Quay Lại Danh Sách'}
          </Button>
          <Breadcrumb
            items={[
              { title: isEnglish ? 'Courses & Classes' : 'Khóa Học & Lớp Học' },
              { title: isEnglish ? 'Create New Course' : 'Khởi Tạo Khóa Học Mới' },
            ]}
          />
        </Space>

        <Space size={10}>
          <Button
            onClick={() => navigate('/courses-classes')}
            style={{ borderRadius: 8 }}
          >
            {isEnglish ? 'Cancel' : 'Hủy'}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
            style={{
              borderRadius: 8,
              backgroundColor: '#1890ff',
              boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
            }}
          >
            {isEnglish ? 'Save & Publish Course' : 'Lưu & Xuất Bản Khóa Học'}
          </Button>
        </Space>
      </div>

      {/* 2. Banner Hướng Dẫn Nghiệp Vụ */}
      <Alert
        message={isEnglish ? 'Standard English Curriculum Setup (McGraw-Hill Wonders ELA)' : 'Thiết Lập Chuẩn Chương Trình Đào Tạo Tiếng Anh (McGraw-Hill Wonders ELA)'}
        description={
          isEnglish
            ? 'Define academic learning objectives, curriculum duration, monthly tuition fee, and maximum class capacity. Each class created under this course will be strictly assigned to 1 Native Teacher.'
            : 'Định nghĩa chuẩn mực đầu ra học thuật, thời lượng theo tháng, học phí niêm yết và sĩ số học viên tối đa cho 1 lớp. Mỗi lớp học trực tuyến thuộc khóa học này sẽ được đảm nhiệm bởi đúng 01 Giáo viên Bản Xứ.'
        }
        type="info"
        showIcon
        icon={<BookOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
        style={{ borderRadius: 12, marginBottom: 20, border: '1px solid #bae0ff', backgroundColor: '#e6f4ff' }}
      />

      {/* 3. Form Nhập Liệu Tiêu Chuẩn Quốc Tế */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          id: `KH-${Date.now().toString().slice(-4)}`,
          level: 'Grade 1 (Primary)',
          durationMonths: 3,
          sessionsPerWeek: 2,
          totalSessions: 24,
          maxClassSize: 20,
          feePerMonth: 2500000,
          targetAge: '6 - 7 tuổi (Lớp 1 Tiểu học)',
          format: '100% Native English Teacher (Zoom Cloud Meeting)',
          curriculumTextbooks: 'McGraw-Hill Wonders Literature Anthology G1 & Reading/Writing Companion',
          prerequisites: 'Đã hoàn thành cấp độ Wonders GK hoặc đạt bài kiểm tra đánh giá năng lực 1-1 với giáo vụ',
        }}
      >
        {/* CARD 1: THÔNG TIN CƠ BẢN & ĐỊNH DANH KHÓA HỌC */}
        <FormSectionCard
          icon={<BookOutlined />}
          iconColor="#1890ff"
          title={isEnglish ? '1. Course Identification & Curriculum Level' : '1. Định Danh & Cấp Độ Chương Trình'}
          subtitle={isEnglish ? 'Core course code, title, and McGraw-Hill Wonders level' : 'Mã khóa học, tên chương trình đào tạo và cấp độ giáo trình McGraw-Hill Wonders'}
        >
          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="id"
                label={<Text strong>{isEnglish ? 'Course Code (ID)' : 'Mã Khóa Học'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please enter course code' : 'Vui lòng nhập mã khóa học' }]}
              >
                <Input placeholder="VD: KH-WONDERS-G1" style={{ width: '100%', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label={<Text strong>{isEnglish ? 'Course Title' : 'Tên Khóa Học'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please enter course title' : 'Vui lòng nhập tên khóa học' }]}
              >
                <Input placeholder="VD: McGraw-Hill Wonders G1 - ELA Reading & Critical Thinking" style={{ width: '100%', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="level"
                label={<Text strong>{isEnglish ? 'Curriculum Framework (Level)' : 'Cấp Độ Giáo Trình'}</Text>}
                rules={[{ required: true }]}
              >
                <Select
                  style={{ width: '100%', borderRadius: 8, height: 40 }}
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
                          {lvl.name} — {lvl.targetBand} ({lvl.series})
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

            <Col xs={24} sm={12}>
              <Form.Item
                name="format"
                label={<Text strong>{isEnglish ? 'Instruction Format' : 'Hình Thức Giảng Dạy'}</Text>}
              >
                <Input style={{ width: '100%', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
        </FormSectionCard>

        {/* CARD 2: ĐỘ TUỔI KHUYẾN NGHỊ & QUY CHUẨN THỜI LƯỢNG (ĐỒNG BỘ CREATE NEW LEVEL) */}
        <FormSectionCard
          icon={<ClockCircleOutlined />}
          iconColor="#f59e0b"
          title={isEnglish ? '2. Recommended Age Range & Scheduling Plan' : '2. Độ Tuổi Khuyến Nghị & Kế Hoạch Thời Gian Khóa Học'}
          subtitle={isEnglish ? 'Age tiers, class capacity, study frequency, and proposed course duration' : 'Khung độ tuổi học viên mục tiêu, sĩ số lớp tối đa, tần suất học và thời lượng khóa học'}
        >
          <Form.Item
            name="targetAge"
            label={<Text strong>{isEnglish ? 'Recommended Age Range (Target Age Group)' : 'Độ Tuổi Học Viên Mục Tiêu (Recommended Age Range)'}</Text>}
            rules={[{ required: true }]}
          >
            <BaseRangeSelector />
          </Form.Item>

          <Divider style={{ margin: '18px 0 16px 0' }} />

          <Row gutter={20}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="durationMonths"
                label={<Text strong>{isEnglish ? 'Course Duration (Months)' : 'Thời Gian Khóa Học (Tháng)'}</Text>}
                rules={[{ required: true }]}
              >
                <Select style={{ width: '100%', borderRadius: 8, height: 40 }}>
                  <Option value={1}>{isEnglish ? '1 Month (Intensive / Trial)' : '1 Tháng (Cấp tốc / Trải nghiệm)'}</Option>
                  <Option value={2}>{isEnglish ? '2 Months (8 Weeks)' : '2 Tháng (8 Tuần)'}</Option>
                  <Option value={3}>{isEnglish ? '3 Months (1 Term / 12 Weeks)' : '3 Tháng (1 Quý / 12 Tuần)'}</Option>
                  <Option value={6}>{isEnglish ? '6 Months (1 Semester / 24 Weeks)' : '6 Tháng (1 Học kỳ / 24 Tuần)'}</Option>
                  <Option value={12}>{isEnglish ? '12 Months (Full Academic Year)' : '12 Tháng (Trọn Năm Học)'}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="maxClassSize"
                label={<Text strong>{isEnglish ? 'Max Students Per Class' : 'Sĩ Số Tối Đa Của 1 Lớp'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please specify max class size' : 'Vui lòng nhập sĩ số tối đa' }]}
              >
                <InputNumber
                  min={5}
                  max={40}
                  style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="feePerMonth"
                label={<Text strong>{isEnglish ? 'Monthly Tuition Fee (VND)' : 'Học Phí Niêm Yết / Tháng (VNĐ)'}</Text>}
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
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sessionsPerWeek"
                label={<Text strong>{isEnglish ? 'Sessions Per Week' : 'Tần Suất Học / Tuần'}</Text>}
              >
                <Select style={{ width: '100%', borderRadius: 8, height: 40 }}>
                  <Option value={2}>2 {isEnglish ? 'sessions / week' : 'buổi / tuần (VD: T2-T4 hoặc T3-T5)'}</Option>
                  <Option value={3}>3 {isEnglish ? 'sessions / week' : 'buổi / tuần (VD: T2-T4-T6)'}</Option>
                  <Option value={1}>1 {isEnglish ? 'session / week (Weekend Workshop)' : 'buổi / tuần (Cuối tuần)'}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="totalSessions"
                label={<Text strong>{isEnglish ? 'Total Planned Sessions' : 'Tổng Số Buổi Học Dự Kiến'}</Text>}
              >
                <InputNumber min={4} max={120} style={{ width: '100%', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center' }} />
              </Form.Item>
            </Col>
          </Row>
        </FormSectionCard>

        {/* CARD 3: MỤC TIÊU ĐÀO TẠO & CHUẨN ĐẦU RA */}
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#722ed1' }} />
              <span>{isEnglish ? '3. Academic Learning Objectives & Core Competencies' : '3. Mục Tiêu Khóa Học & Chuẩn Đầu Ra Học Thuật'}</span>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginBottom: 20 }}
          styles={{ body: { padding: '20px 24px' } }}
        >
          <Form.Item
            name="objectives"
            label={<Text strong>{isEnglish ? 'Course Learning Outcomes / Academic Objectives' : 'Mục Tiêu Khóa Học & Năng Lực Đạt Được'}</Text>}
            rules={[{ required: true, message: isEnglish ? 'Please provide course objectives' : 'Vui lòng nhập mục tiêu khóa học' }]}
          >
            <TextArea
              rows={4}
              placeholder={
                isEnglish
                  ? 'e.g. Master 400 core sight words; develop phonemic awareness; practice 4-step graphic organizers for academic reading comprehension; gain confidence communicating with Native Speakers...'
                  : 'VD: Nắm vững 400 từ vựng cốt lõi; phát âm chuẩn Phonics; rèn luyện kỹ năng đọc hiểu văn bản qua sơ đồ tư duy (Graphic Organizers); tự tin thuyết trình và tranh biện 100% bằng Tiếng Anh với Giáo viên Bản Xứ...'
              }
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="prerequisites"
            label={<Text strong>{isEnglish ? 'Prerequisites & Placement Test Requirements' : 'Yêu Cầu Đầu Vào & Bài Đánh Giá Xếp Lớp'}</Text>}
          >
            <Input
              placeholder={isEnglish ? 'e.g. Completed Wonders GK or passed 1-on-1 placement interview' : 'VD: Hoàn thành cấp độ Wonders GK hoặc vượt qua bài phỏng vấn xếp lớp 1-1'}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Card>

        {/* CARD 4: GIÁO TRÌNH & NỘI DUNG CHƯƠNG TRÌNH */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: '#fa8c16' }} />
              <span>{isEnglish ? '4. Curriculum Syllabus & McGraw-Hill Textbooks' : '4. Giáo Trình & Nội Dung Khóa Học'}</span>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}
          styles={{ body: { padding: '20px 24px' } }}
        >
          <Form.Item
            name="curriculumTextbooks"
            label={<Text strong>{isEnglish ? 'Assigned Textbooks & Core Materials' : 'Bộ Sách Giáo Trình & Tài Liệu Giảng Dạy Chính'}</Text>}
            rules={[{ required: true, message: isEnglish ? 'Please specify curriculum textbooks' : 'Vui lòng cung cấp bộ giáo trình' }]}
          >
            <Input
              placeholder="VD: McGraw-Hill Wonders Literature Anthology G1 & Reading/Writing Companion"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space size={12}>
              <Button onClick={() => navigate('/courses-classes')} style={{ borderRadius: 8 }}>
                {isEnglish ? 'Cancel' : 'Hủy'}
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => form.submit()}
                style={{
                  borderRadius: 8,
                  backgroundColor: '#1890ff',
                  boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                  paddingLeft: 24,
                  paddingRight: 24,
                }}
              >
                {isEnglish ? 'Publish Course Program' : 'Lưu & Xuất Bản Khóa Học'}
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
};

