import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Radio,
  Typography,
  Space,
} from 'antd';
import {
  BookOutlined,
  TagOutlined,
  AimOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  LEVEL_STATUS,
  TEXTBOOK_SERIES,
  CEFR_BANDS,
} from '../models/curriculumLevel.model';
import { AgeRangePicker } from './AgeRangePicker';
import { CurriculumRichEditor } from './CurriculumRichEditor';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const COLOR_PRESETS = [
  { label: 'Emerald (Xanh ngọc)', value: '#10b981' },
  { label: 'Sky Blue (Xanh da trời)', value: '#0ea5e9' },
  { label: 'Royal Blue (Xanh hoàng gia)', value: '#3b82f6' },
  { label: 'Indigo (Xanh chàm)', value: '#6366f1' },
  { label: 'Purple (Tím học thuật)', value: '#8b5cf6' },
  { label: 'Pink (Hồng năng động)', value: '#ec4899' },
  { label: 'Amber (Cam nổi bật)', value: '#f59e0b' },
];

const SKILL_SUGGESTIONS = [
  'Phonics & Decoding',
  'Sight Words',
  'Reading Comprehension',
  'Critical Thinking',
  'Vocabulary Acquisition',
  'Grammar & Sentence Building',
  'Paragraph Writing',
  'Argumentative Essay',
  'Oral Fluency & Presentation',
  'Listening Strategies',
];

export const CurriculumLevelModal = ({
  open,
  editingLevel,
  loading,
  onCancel,
  onSave,
}) => {
  const { isEnglish } = useLanguage();
  const [form] = Form.useForm();

  const isEditing = Boolean(editingLevel);

  useEffect(() => {
    if (open) {
      if (editingLevel) {
        form.setFieldsValue({
          code: editingLevel.code || editingLevel.id,
          name: editingLevel.name || '',
          series: editingLevel.series || TEXTBOOK_SERIES.WONDERS,
          ageRange: editingLevel.ageRange || '6 - 7 tuổi',
          targetBand: editingLevel.targetBand || 'A1 (Beginner)',
          skillsFocus: Array.isArray(editingLevel.skillsFocus) ? editingLevel.skillsFocus : [],
          totalUnits: editingLevel.totalUnits || 6,
          recommendedDuration: editingLevel.recommendedDuration || '9 tháng (72 buổi)',
          orderIndex: editingLevel.orderIndex || 1,
          status: editingLevel.status || LEVEL_STATUS.ACTIVE,
          coverColor: editingLevel.coverColor || '#3b82f6',
          description: editingLevel.description || '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          series: TEXTBOOK_SERIES.WONDERS,
          ageRange: '6 - 7 tuổi',
          targetBand: 'A1 (Beginner)',
          skillsFocus: ['Phonics & Decoding', 'Reading Comprehension', 'Vocabulary Acquisition'],
          totalUnits: 6,
          recommendedDuration: '9 tháng (72 buổi)',
          orderIndex: 1,
          status: LEVEL_STATUS.ACTIVE,
          coverColor: '#0ea5e9',
        });
      }
    }
  }, [open, editingLevel, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch {
      // Validate failed
    }
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <span>
            {isEditing
              ? isEnglish
                ? `Edit Curriculum Level: ${editingLevel?.code}`
                : `Chỉnh Sửa Cấp Độ Giáo Trình: ${editingLevel?.code}`
              : isEnglish
              ? 'Add New Curriculum Level'
              : 'Thêm Cấp Độ Giáo Trình Mới'}
          </span>
        </Space>
      }
      okText={isEditing ? (isEnglish ? 'Save Changes' : 'Lưu Thay Đổi') : (isEnglish ? 'Create Level' : 'Tạo Cấp Độ')}
      cancelText={isEnglish ? 'Cancel' : 'Hủy'}
      confirmLoading={loading}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={860}
      destroyOnClose
      style={{ top: 24 }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
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
              rules={[
                { required: true, message: isEnglish ? 'Please enter level code' : 'Vui lòng nhập mã cấp độ' },
                {
                  pattern: /^[A-Za-z0-9-_]+$/,
                  message: isEnglish
                    ? 'Code must contain only letters, numbers, hyphens'
                    : 'Mã chỉ được chứa chữ cái, số và dấu gạch nối',
                },
              ]}
            >
              <Input
                disabled={isEditing}
                placeholder="WONDERS-G1"
                prefix={<TagOutlined style={{ color: '#94a3b8' }} />}
                style={{ width: '100%', height: 40, borderRadius: 8, textTransform: 'uppercase' }}
                onChange={(e) => {
                  form.setFieldValue('code', e.target.value.toUpperCase());
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={<Text strong>{isEnglish ? 'Level Display Name' : 'Tên Cấp Độ Giáo Trình'}</Text>}
              rules={[{ required: true, message: isEnglish ? 'Please enter level name' : 'Vui lòng nhập tên cấp độ' }]}
            >
              <Input
                placeholder={isEnglish ? 'E.g. Wonders Grade 1 (G1)' : 'VD: Wonders Grade 1 (G1)'}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="series"
              label={<Text strong>{isEnglish ? 'Curriculum Series' : 'Bộ Giáo Trình Chính'}</Text>}
              rules={[{ required: true }]}
            >
              <Select style={{ borderRadius: 8 }}>
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
              label={<Text strong>{isEnglish ? 'Target CEFR / International Band' : 'Chuẩn Đầu Ra CEFR Quốc Tế'}</Text>}
            >
              <Select
                placeholder={isEnglish ? 'Select CEFR band...' : 'Chọn chuẩn đầu ra...'}
                prefix={<AimOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              >
                {CEFR_BANDS.map((b) => (
                  <Option key={b} value={b}>
                    {b}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Trường Vùng Độ Tuổi với Bộ Chọn Tương Tác: Preset Pills + Range Slider */}
        <Form.Item
          name="ageRange"
          label={<Text strong>{isEnglish ? 'Recommended Age Range' : 'Độ Tuổi Khuyến Nghị (Tick chọn nhanh hoặc kéo thanh trượt)'}</Text>}
          rules={[{ required: true, message: isEnglish ? 'Please select age range' : 'Vui lòng chọn độ tuổi khuyến nghị' }]}
        >
          <AgeRangePicker />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="totalUnits"
              label={<Text strong>{isEnglish ? 'Total Units / Themes' : 'Số Lượng Unit / Chủ Đề'}</Text>}
            >
              <InputNumber min={1} max={50} style={{ width: '100%', borderRadius: 8 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="orderIndex"
              label={<Text strong>{isEnglish ? 'Roadmap Order' : 'Thứ Tự Lộ Trình'}</Text>}
            >
              <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="coverColor"
              label={<Text strong>{isEnglish ? 'Theme Color' : 'Màu Nhận Diện'}</Text>}
            >
              <Select style={{ borderRadius: 8 }}>
                {COLOR_PRESETS.map((c) => (
                  <Option key={c.value} value={c.value}>
                    <Space>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: c.value,
                        }}
                      />
                      <span>{c.label}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="recommendedDuration"
          label={<Text strong>{isEnglish ? 'Recommended Duration' : 'Thời Lượng Đào Tạo Đề Xuất'}</Text>}
        >
          <Input
            prefix={<FieldTimeOutlined style={{ color: '#94a3b8' }} />}
            placeholder={isEnglish ? 'E.g. 9 months (72 sessions)' : 'VD: 9 tháng (72 buổi)'}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="skillsFocus"
          label={<Text strong>{isEnglish ? 'Core Skills Focus' : 'Kỹ Năng Trọng Tâm'}</Text>}
          extra={<span style={{ fontSize: 11, color: '#94a3b8' }}>Chọn hoặc gõ thêm kỹ năng mới rồi nhấn Enter</span>}
        >
          <Select
            mode="tags"
            placeholder={isEnglish ? 'Select or type core skills...' : 'Chọn hoặc nhập kỹ năng trọng tâm...'}
            style={{ borderRadius: 8 }}
            tokenSeparators={[',']}
          >
            {SKILL_SUGGESTIONS.map((skill) => (
              <Option key={skill} value={skill}>
                {skill}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Trình Soạn Thảo TipTap Đầy Đủ Formatting Chuẩn Đào Tạo */}
        <Form.Item
          name="description"
          label={<Text strong>{isEnglish ? 'Curriculum Overview & Pedagogical Approach' : 'Mục Tiêu Đào Tạo & Phương Pháp Tiếp Cận'}</Text>}
          extra={
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {isEnglish
                ? 'Use the toolbar above to format headings, bullet points, bold key terms, and learning objectives.'
                : 'Sử dụng thanh công cụ để định dạng tiêu đề, in đậm/nghiêng/gạch chân, danh sách gạch đầu dòng và trích dẫn chuẩn sư phạm.'}
            </span>
          }
        >
          <CurriculumRichEditor />
        </Form.Item>

        <Form.Item
          name="status"
          label={<Text strong>{isEnglish ? 'Operational Status' : 'Trạng Thái Vận Hành'}</Text>}
        >
          <Radio.Group>
            <Radio value={LEVEL_STATUS.ACTIVE}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>
                {isEnglish ? '🟢 Active (Accepting Class Enrollments)' : '🟢 Đang Áp Dụng (Cho phép mở lớp)'}
              </span>
            </Radio>
            <Radio value={LEVEL_STATUS.INACTIVE}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                {isEnglish ? '🔴 Inactive (Paused)' : '🔴 Tạm Ngưng Tuyển Sinh'}
              </span>
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

