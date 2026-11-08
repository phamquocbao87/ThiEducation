import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Button,
  Space,
  Row,
  Col,
  Typography,
  message,
  Divider,
} from 'antd';
import {
  BookOutlined,
  AimOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { PermissionService } from '../../core/services/PermissionService';
import { CurriculumLevelService } from './services/CurriculumLevelService';
import {
  LEVEL_STATUS,
  TEXTBOOK_SERIES,
  CEFR_BANDS,
} from './models/curriculumLevel.model';

// Base Layout & Base Controls Components
import {
  BaseFormPageLayout,
  FormSectionCard,
} from '../../shared/components/layout';
import {
  BaseRichTextEditor,
  BaseRangeSelector,
} from '../../shared/components/controls';

const { Text } = Typography;
const { Option } = Select;

const PRESET_SKILLS = [
  'Phonics',
  'Sight Words',
  'Oral Speaking',
  'Visual Storytelling',
  'Decodable Readers',
  'Reading Comprehension',
  'Story Elements',
  'Paragraph Writing',
  'Fluency',
  'Critical Thinking',
  'Expository Text',
  'Opinion Writing',
  'Close Reading',
  'Analytical Essay',
  'Academic Vocabulary',
  'Presentation',
  'Research Skills',
  'Argumentative Writing',
  'Literary Analysis',
  'Public Speaking',
];

const PRESET_COLORS = [
  { label: 'Emerald (Xanh ngọc)', value: '#10b981' },
  { label: 'Sky Blue (Xanh da trời)', value: '#0ea5e9' },
  { label: 'Royal Blue (Xanh dương)', value: '#3b82f6' },
  { label: 'Indigo (Xanh chàm)', value: '#6366f1' },
  { label: 'Purple (Tím học thuật)', value: '#8b5cf6' },
  { label: 'Pink (Hồng phấn)', value: '#ec4899' },
  { label: 'Amber (Vàng hổ phách)', value: '#f59e0b' },
];

export const CurriculumLevelEditPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const isCreate = !levelId || levelId === 'new';
  const canManage = PermissionService.canManageCurriculum(currentUser?.role || '');

  // Direct URL Guard: Chặn truy cập nếu không đủ quyền sửa cấp độ giáo trình
  useEffect(() => {
    if (!canManage) {
      message.warning(
        isEnglish
          ? 'You do not have permission to edit curriculum levels'
          : 'Bạn không có quyền chỉnh sửa cấp độ giáo trình'
      );
      navigate(isCreate ? '/curriculum-levels' : `/curriculum-levels/${levelId}`, { replace: true });
    }
  }, [canManage, isCreate, levelId, navigate, isEnglish]);

  useEffect(() => {
    if (!isCreate) {
      const existing = CurriculumLevelService.getLevelById(levelId);
      if (existing) {
        setInitialData(existing);
        form.setFieldsValue({
          code: existing.code,
          name: existing.name,
          series: existing.series || TEXTBOOK_SERIES.WONDERS,
          targetBand: existing.targetBand || 'A1 (Beginner)',
          ageRange: existing.ageRange || '6 - 7 tuổi',
          totalUnits: existing.totalUnits || 6,
          recommendedDuration: existing.recommendedDuration || '9 tháng (72 buổi)',
          orderIndex: existing.orderIndex || 1,
          coverColor: existing.coverColor || '#3b82f6',
          skillsFocus: existing.skillsFocus || [],
          description: existing.description || '',
          status: existing.status || LEVEL_STATUS.ACTIVE,
        });
      } else {
        message.error(isEnglish ? 'Curriculum level not found' : 'Không tìm thấy cấp độ giáo trình');
        navigate('/curriculum-levels');
      }
    } else {
      form.setFieldsValue({
        series: TEXTBOOK_SERIES.WONDERS,
        targetBand: 'A1 (Beginner)',
        ageRange: '6 - 7 tuổi',
        totalUnits: 6,
        recommendedDuration: '9 tháng (72 buổi)',
        orderIndex: 1,
        coverColor: '#3b82f6',
        skillsFocus: ['Reading Comprehension', 'Academic Vocabulary'],
        status: LEVEL_STATUS.ACTIVE,
        description: '',
      });
    }
  }, [levelId, isCreate, form, navigate, isEnglish]);

  const handleFinish = async (values) => {
    try {
      setSaving(true);
      const targetCode = values.code || levelId;
      if (isCreate) {
        CurriculumLevelService.createLevel(values);
        message.success(isEnglish ? 'Curriculum level created successfully' : 'Tạo cấp độ giáo trình mới thành công');
        navigate(`/curriculum-levels/${targetCode}`);
      } else {
        CurriculumLevelService.updateLevel(levelId, values);
        message.success(isEnglish ? 'Curriculum level updated successfully' : 'Cập nhật cấp độ giáo trình thành công');
        navigate(`/curriculum-levels/${targetCode}`);
      }
    } catch (err) {
      message.error(err.message || (isEnglish ? 'Failed to save curriculum level' : 'Lưu cấp độ giáo trình thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    {
      title: (
        <span
          style={{ cursor: 'pointer', color: '#1890ff' }}
          onClick={() => navigate('/curriculum-levels')}
        >
          {isEnglish ? 'Curriculum Levels' : 'Cấp Độ Giáo Trình'}
        </span>
      ),
    },
    ...(!isCreate
      ? [
          {
            title: (
              <span
                style={{ cursor: 'pointer', color: '#1890ff' }}
                onClick={() => navigate(`/curriculum-levels/${levelId}`)}
              >
                {initialData?.name || levelId}
              </span>
            ),
          },
        ]
      : []),
    {
      title: isCreate
        ? (isEnglish ? 'Create New Level' : 'Thêm Cấp Độ Mới')
        : (isEnglish ? 'Edit' : 'Chỉnh Sửa'),
    },
  ];

  const headerActions = (
    <Space size={10}>
      <Button
        onClick={() => navigate(isCreate ? '/curriculum-levels' : `/curriculum-levels/${levelId}`)}
        style={{ borderRadius: 8, minWidth: 80, height: 38 }}
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
          fontWeight: 600,
          minWidth: 130,
          height: 38,
        }}
      >
        {isCreate
          ? (isEnglish ? 'Create Level' : 'Tạo Cấp Độ Mới')
          : (isEnglish ? 'Save Changes' : 'Lưu Thay Đổi')}
      </Button>
    </Space>
  );

  return (
    <BaseFormPageLayout
      breadcrumbs={breadcrumbs}
      onBack={() => navigate(isCreate ? '/curriculum-levels' : `/curriculum-levels/${levelId}`)}
      backText={isCreate ? (isEnglish ? 'Back to Curriculum' : 'Quay Lại Danh Sách') : (isEnglish ? 'Cancel & Return to View' : 'Hủy & Quay Lại Xem')}
      icon={<BookOutlined />}
      maxWidth={1100}
      title={
        isCreate
          ? (isEnglish ? 'Create Curriculum Level' : 'Thêm Cấp Độ Giáo Trình Mới')
          : (isEnglish ? `Edit Curriculum Level: ${initialData?.name || levelId}` : `Chỉnh Sửa Cấp Độ: ${initialData?.name || levelId}`)
      }
      subtitle={
        isEnglish
          ? 'Standardized pedagogical framework, learning objectives, and age-appropriate guidelines (McGraw-Hill Wonders & CEFR)'
          : 'Khung chương trình chuẩn hóa, mục tiêu đầu ra và định hướng phương pháp giảng dạy (McGraw-Hill Wonders & CEFR)'
      }
      headerActions={headerActions}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark="optional"
      >
        {/* SECTION 1: THÔNG TIN ĐỊNH DANH & PHÂN LOẠI GIÁO TRÌNH */}
        <FormSectionCard
          icon={<BookOutlined />}
          iconColor="#1890ff"
          title={isEnglish ? '1. Identification & Program Framework' : '1. Thông Tin Định Danh & Phân Loại Giáo Trình'}
          subtitle={isEnglish ? 'Core identifiers, textbook series, and international CEFR target band' : 'Mã cấp độ, bộ giáo trình chủ đạo và chuẩn đầu ra CEFR'}
        >
          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label={
                  <Space size={6}>
                    <Text strong>{isEnglish ? 'Level Code' : 'Mã Cấp Độ'}</Text>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 'normal' }}>
                      ({isEnglish ? 'e.g. WONDERS-G1' : 'VD: WONDERS-G1'})
                    </span>
                  </Space>
                }
                rules={[{ required: true, message: isEnglish ? 'Please enter level code' : 'Vui lòng nhập mã cấp độ' }]}
              >
                <Input
                  placeholder={isEnglish ? 'E.g. WONDERS-G1' : 'VD: WONDERS-G1'}
                  disabled={!isCreate}
                  style={{ width: '100%', borderRadius: 8, height: 40, textTransform: 'uppercase', fontWeight: 600 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label={<Text strong>{isEnglish ? 'Curriculum Level Name' : 'Tên Cấp Độ Giáo Trình'}</Text>}
                rules={[{ required: true, message: isEnglish ? 'Please enter level name' : 'Vui lòng nhập tên cấp độ' }]}
              >
                <Input
                  placeholder={isEnglish ? 'E.g. Wonders Grade 1 (G1)' : 'VD: Wonders Grade 1 (G1)'}
                  style={{ width: '100%', borderRadius: 8, height: 40, fontWeight: 500 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="series"
                label={<Text strong>{isEnglish ? 'Primary Textbook Series' : 'Bộ Giáo Trình Chính'}</Text>}
                rules={[{ required: true }]}
              >
                <Select style={{ width: '100%', borderRadius: 8, height: 40 }}>
                  {Object.values(TEXTBOOK_SERIES).map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="targetBand"
                label={<Text strong>{isEnglish ? 'Target CEFR Proficiency Band' : 'Chuẩn Đầu Ra CEFR Quốc Tế'}</Text>}
                rules={[{ required: true }]}
              >
                <Select style={{ width: '100%', borderRadius: 8, height: 40 }}>
                  {CEFR_BANDS.map((b) => (
                    <Option key={b} value={b}>
                      🎯 {b}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </FormSectionCard>

        {/* SECTION 2: ĐỘ TUỔI KHUYẾN NGHỊ & KẾ HOẠCH LỘ TRÌNH */}
        <FormSectionCard
          icon={<CalendarOutlined />}
          iconColor="#f59e0b"
          title={isEnglish ? '2. Recommended Age Range & Scheduling Plan' : '2. Độ Tuổi Khuyến Nghị & Kế Hoạch Lộ Trình Đào Tạo'}
          subtitle={isEnglish ? 'Age tiers, total units, progression order, and proposed course duration' : 'Khung độ tuổi rèn luyện, số lượng unit và thời lượng đề xuất'}
        >
          <Form.Item
            name="ageRange"
            label={<Text strong>{isEnglish ? 'Recommended Age Range' : 'Độ Tuổi Khuyến Nghị'}</Text>}
            rules={[{ required: true }]}
          >
            <BaseRangeSelector />
          </Form.Item>

          <Divider style={{ margin: '18px 0 16px 0' }} />

          <Row gutter={20}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="totalUnits"
                label={<Text strong>{isEnglish ? 'Total Units' : 'Số Lượng Unit / Chủ Đề'}</Text>}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%', height: 40, borderRadius: 8 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="orderIndex"
                label={<Text strong>{isEnglish ? 'Progression Order' : 'Thứ Tự Lộ Trình'}</Text>}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: '100%', height: 40, borderRadius: 8 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="recommendedDuration"
                label={<Text strong>{isEnglish ? 'Recommended Duration' : 'Thời Lượng Đào Tạo Đề Xuất'}</Text>}
                rules={[{ required: true }]}
              >
                <Input
                  placeholder={isEnglish ? 'E.g. 9 months (72 sessions)' : 'VD: 9 tháng (72 buổi)'}
                  style={{ width: '100%', borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </FormSectionCard>

        {/* SECTION 3: TRÌNH SOẠN THẢO TIP-TAP MỤC TIÊU ĐÀO TẠO */}
        <FormSectionCard
          icon={<AimOutlined />}
          iconColor="#722ed1"
          title={isEnglish ? '3. Curriculum Overview & Pedagogical Approach' : '3. Mục Tiêu Đào Tạo & Phương Pháp Tiếp Cận'}
          subtitle={
            isEnglish
              ? 'Detailed learning goals, reading strategies, critical thinking objectives, and expected student outcomes'
              : 'Nội dung đề cương chi tiết, chiến lược phát triển kỹ năng đọc hiểu, tư duy phản biện và chuẩn đầu ra sư phạm mong đợi'
          }
        >
          <Form.Item
            name="description"
            noStyle
          >
            <BaseRichTextEditor minHeight={260} />
          </Form.Item>
        </FormSectionCard>

        {/* SECTION 4: KỸ NĂNG TRỌNG TÂM & TRẠNG THÁI VẬN HÀNH (KÈM NÚT LƯU Ở ĐÁY) */}
        <FormSectionCard
          icon={<FireOutlined />}
          iconColor="#10b981"
          title={isEnglish ? '4. Focus Skills & Operational Status' : '4. Kỹ Năng Trọng Tâm & Trạng Thái Vận Hành'}
          subtitle={isEnglish ? 'Core competencies tags, theme color, and enrollment availability' : 'Danh mục kỹ năng rèn luyện, màu nhận diện và trạng thái tuyển sinh'}
        >
          <Form.Item
            name="skillsFocus"
            label={<Text strong>{isEnglish ? 'Focus Skills (Tags)' : 'Danh Mục Kỹ Năng Rèn Luyện'}</Text>}
            extra={
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {isEnglish
                  ? 'Select preset competencies or type a custom skill and press Enter'
                  : 'Chọn từ các kỹ năng gợi ý sẵn hoặc gõ kỹ năng mới rồi nhấn Enter'}
              </span>
            }
          >
            <Select
              mode="tags"
              style={{ width: '100%', borderRadius: 8 }}
              placeholder={isEnglish ? 'Choose or type skills...' : 'Chọn hoặc gõ kỹ năng...'}
              tokenSeparators={[',']}
            >
              {PRESET_SKILLS.map((skill) => (
                <Option key={skill} value={skill}>
                  {skill}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="coverColor"
                label={<Text strong>{isEnglish ? 'Theme Color' : 'Màu Nhận Diện Cấp Độ'}</Text>}
                rules={[{ required: true }]}
              >
                <Select style={{ width: '100%', borderRadius: 8, height: 40 }}>
                  {PRESET_COLORS.map((col) => (
                    <Option key={col.value} value={col.value}>
                      <Space>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: col.value,
                          }}
                        />
                        <span>{col.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={<Text strong>{isEnglish ? 'Operational Status' : 'Trạng Thái Vận Hành'}</Text>}
                rules={[{ required: true }]}
              >
                <Radio.Group style={{ width: '100%', marginTop: 4 }}>
                  <Space size={20} wrap>
                    <Radio value={LEVEL_STATUS.ACTIVE}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        {isEnglish ? '🟢 Active (Open for Classes)' : '🟢 Đang Áp Dụng (Cho phép mở lớp)'}
                      </span>
                    </Radio>
                    <Radio value={LEVEL_STATUS.INACTIVE}>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        {isEnglish ? '🔴 Inactive (Paused Enrollment)' : '🔴 Tạm Ngưng Tuyển Sinh'}
                      </span>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {/* Đường Kẻ Phân Cách & Cụm Nút Hành Động Nằm Ngay Trong Khối 4 */}
          <Divider style={{ margin: '24px 0 16px 0' }} />

          <div className="lak-form-bottom-actions">
            <Button
              size="large"
              onClick={() => navigate(isCreate ? '/curriculum-levels' : `/curriculum-levels/${levelId}`)}
              style={{
                borderRadius: 8,
                minWidth: 120,
                height: 42,
                fontWeight: 500,
              }}
            >
              {isCreate ? (isEnglish ? 'Cancel & Return' : 'Hủy & Quay Lại') : (isEnglish ? 'Cancel & Return to View' : 'Hủy & Quay Lại Xem')}
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
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                fontWeight: 600,
                minWidth: 170,
                height: 42,
              }}
            >
              {isCreate
                ? (isEnglish ? 'Create Curriculum Level' : 'Tạo Cấp Độ Giáo Trình')
                : (isEnglish ? 'Save Level Changes' : 'Lưu Thay Đổi Cấp Độ')}
            </Button>
          </div>
        </FormSectionCard>
      </Form>
    </BaseFormPageLayout>
  );
};
