import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Badge,
  Space,
  Button,
  Typography,
  message,
  Tooltip,
} from 'antd';
import {
  BookOutlined,
  CalendarOutlined,
  AimOutlined,
  FireOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { formatLocalizedAgeRange, formatLocalizedDuration } from '../../shared/utils/taxonomyUtils';
import { PermissionService } from '../../core/services/PermissionService';
import { CurriculumLevelService } from './services/CurriculumLevelService';
import { LEVEL_STATUS } from './models/curriculumLevel.model';
import {
  BaseFormPageLayout,
  FormSectionCard,
} from '../../shared/components/layout';

const { Title, Text, Paragraph } = Typography;

export const CurriculumLevelViewPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();

  const [level, setLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  const canManage = PermissionService.canManageCurriculum(currentUser?.role || '');

  useEffect(() => {
    if (!levelId) {
      navigate('/curriculum-levels');
      return;
    }

    const found = CurriculumLevelService.getLevelById(levelId);
    if (found) {
      setLevel(found);
    } else {
      message.error(isEnglish ? 'Curriculum level not found' : 'Không tìm thấy cấp độ giáo trình');
      navigate('/curriculum-levels');
    }
    setLoading(false);
  }, [levelId, navigate, isEnglish]);

  if (loading || !level) {
    return null;
  }

  const isActive = level.status === LEVEL_STATUS.ACTIVE;

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
    {
      title: level.name || level.code,
    },
    {
      title: isEnglish ? 'Details' : 'Chi Tiết',
    },
  ];

  const headerActions = (
    <Space size={10}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/curriculum-levels')}
        style={{ borderRadius: 8, height: 38 }}
      >
        {isEnglish ? 'Back to List' : 'Quay Lại Danh Sách'}
      </Button>

      {canManage && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/curriculum-levels/${level.code || level.id}/edit`)}
          style={{
            borderRadius: 8,
            backgroundColor: '#1890ff',
            boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
            fontWeight: 600,
            height: 38,
          }}
        >
          {isEnglish ? 'Edit Curriculum Level' : 'Chỉnh Sửa Cấp Độ'}
        </Button>
      )}
    </Space>
  );

  return (
    <BaseFormPageLayout
      breadcrumbs={breadcrumbs}
      onBack={() => navigate('/curriculum-levels')}
      backText={isEnglish ? 'Back to Curriculum' : 'Quay Lại Danh Sách'}
      icon={<BookOutlined />}
      maxWidth={1100}
      title={`${level.name || level.code}`}
      subtitle={
        isEnglish
          ? 'Standardized pedagogical framework, learning objectives, and age-appropriate guidelines (McGraw-Hill Wonders & CEFR)'
          : 'Khung chương trình chuẩn hóa, mục tiêu đầu ra và định hướng phương pháp giảng dạy (McGraw-Hill Wonders & CEFR)'
      }
      headerActions={headerActions}
    >
      {/* 1. THẺ HIGHLIGHT STAT CARDS TỔNG QUAN (3 METRICS CHỦ CHỐT) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Metric 1: Độ Tuổi Khuyến Nghị */}
        <Col xs={24} sm={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              border: '1px solid #bbf7d0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 4px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                👶
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: '#166534' }}>
                  {isEnglish ? 'Target Age Group' : 'Độ Tuổi Khuyến Nghị'}
                </Text>
                <Title level={4} style={{ margin: 0, color: '#15803d' }}>
                  {formatLocalizedAgeRange(level.ageRange, isEnglish)}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        {/* Metric 2: Chuẩn Đầu Ra CEFR */}
        <Col xs={24} sm={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
              border: '1px solid #bfdbfe',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 4px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🎯
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: '#1e40af' }}>
                  {isEnglish ? 'Target CEFR Proficiency' : 'Chuẩn Đầu Ra CEFR'}
                </Text>
                <Title level={4} style={{ margin: 0, color: '#1d4ed8' }}>
                  {level.targetBand || 'A1 (Beginner)'}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        {/* Metric 3: Lộ Trình & Thời Lượng */}
        <Col xs={24} sm={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)',
              border: '1px solid #fef08a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 4px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#fef9c3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                📚
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: '#854d0e' }}>
                  {isEnglish ? 'Course Units & Order' : 'Lộ Trình & Số Unit'}
                </Text>
                <Title level={4} style={{ margin: 0, color: '#a16207' }}>
                  {level.totalUnits} {isEnglish ? 'Units' : 'Chủ đề'} (Bậc #{level.orderIndex || 1})
                </Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2. SECTION 1: THÔNG TIN ĐỊNH DANH & PHÂN LOẠI GIÁO TRÌNH */}
      <FormSectionCard
        icon={<BookOutlined />}
        iconColor="#1890ff"
        title={isEnglish ? '1. Identification & Program Framework' : '1. Thông Tin Định Danh & Phân Loại Giáo Trình'}
        subtitle={isEnglish ? 'Core identifiers, textbook series, and international CEFR target band' : 'Mã cấp độ, bộ giáo trình chủ đạo và chuẩn đầu ra CEFR'}
      >
        <Descriptions
          bordered
          size="middle"
          column={{ xs: 1, sm: 2 }}
          styles={{
            label: { width: '22%', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' },
            content: { width: '28%', color: '#0f172a' },
          }}
        >
          <Descriptions.Item label={isEnglish ? 'Level Code' : 'Mã Cấp Độ'}>
            <Tag
              color={level.coverColor || '#1890ff'}
              style={{ fontWeight: 700, fontSize: 13, padding: '2px 10px', borderRadius: 4 }}
            >
              {level.code}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Level Name' : 'Tên Cấp Độ Giáo Trình'}>
            <Text strong style={{ fontSize: 14 }}>
              {level.name}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Primary Textbook Series' : 'Bộ Giáo Trình Chính'}>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              <ReadOutlined style={{ marginRight: 4 }} />
              {level.series}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Target CEFR Proficiency' : 'Chuẩn Đầu Ra CEFR'}>
            <Tag color="cyan" style={{ fontWeight: 600 }}>
              <AimOutlined style={{ marginRight: 4 }} />
              {level.targetBand}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Recommended Duration' : 'Thời Lượng Đào Tạo Đề Xuất'}>
            <Space size={6}>
              <CalendarOutlined style={{ color: '#0ea5e9' }} />
              <span>{formatLocalizedDuration(level.recommendedDuration, isEnglish)}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Operational Status' : 'Trạng Thái Tuyển Sinh'}>
            {isActive ? (
              <Badge status="success" text={<span style={{ color: '#16a34a', fontWeight: 600 }}>{isEnglish ? 'Active (Open for Classes)' : 'Đang Áp Dụng (Cho phép mở lớp)'}</span>} />
            ) : (
              <Badge status="error" text={<span style={{ color: '#dc2626', fontWeight: 600 }}>{isEnglish ? 'Inactive (Paused Enrollment)' : 'Tạm Ngưng Tuyển Sinh'}</span>} />
            )}
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Progression Order' : 'Thứ Tự Lộ Trình'}>
            <Tag color="default" style={{ fontWeight: 700 }}>
              #{level.orderIndex || 1}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={isEnglish ? 'Theme Color' : 'Màu Nhận Diện Cấp Độ'}>
            <Space size={8}>
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: level.coverColor || '#1890ff',
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
              <Text code>{level.coverColor || '#1890ff'}</Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </FormSectionCard>

      {/* 3. SECTION 2: KỸ NĂNG TRỌNG TÂM & NĂNG LỰC CỐT LÕI */}
      <FormSectionCard
        icon={<FireOutlined />}
        iconColor="#10b981"
        title={isEnglish ? '2. Core Competencies & Skills Focus' : '2. Kỹ Năng Trọng Tâm & Năng Lực Cốt Lõi'}
        subtitle={isEnglish ? 'Curated English competencies developed during this level' : 'Danh mục kỹ năng ngôn ngữ rèn luyện trong suốt khóa học'}
      >
        {Array.isArray(level.skillsFocus) && level.skillsFocus.length > 0 ? (
          <Space wrap size={[8, 10]}>
            {level.skillsFocus.map((skill, idx) => (
              <Tag
                key={idx}
                color="geekblue"
                style={{
                  fontSize: 13,
                  padding: '5px 12px',
                  borderRadius: 6,
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                ⚡ {skill}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontStyle: 'italic' }}>
            {isEnglish ? 'No focus skills specified.' : 'Chưa thiết lập danh mục kỹ năng trọng tâm.'}
          </Text>
        )}
      </FormSectionCard>

      {/* 4. SECTION 3: MỤC TIÊU ĐÀO TẠO & PHƯƠNG PHÁP TIẾP CẬN SƯ PHẠM */}
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
        {level.description ? (
          <div
            className="lak-curriculum-rich-content"
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              color: '#1e293b',
              lineHeight: 1.7,
              fontSize: 14,
            }}
            dangerouslySetInnerHTML={{ __html: level.description }}
          />
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: 10,
              border: '1px dashed #cbd5e1',
            }}
          >
            <Text type="secondary">
              {isEnglish
                ? 'No detailed pedagogical syllabus has been documented for this curriculum level yet.'
                : 'Chưa có nội dung đề cương sư phạm chi tiết cho cấp độ giáo trình này.'}
            </Text>
          </div>
        )}
      </FormSectionCard>

      {/* 5. CỤM NÚT HÀNH ĐỘNG Ở ĐÁY TRANG */}
      <div
        className="lak-form-bottom-actions"
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <Button
          size="large"
          onClick={() => navigate('/curriculum-levels')}
          style={{
            borderRadius: 8,
            minWidth: 120,
            height: 42,
            fontWeight: 500,
          }}
        >
          {isEnglish ? 'Back to List' : 'Quay Lại Danh Sách'}
        </Button>

        {canManage && (
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            onClick={() => navigate(`/curriculum-levels/${level.code || level.id}/edit`)}
            style={{
              borderRadius: 8,
              backgroundColor: '#1890ff',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
              fontWeight: 600,
              minWidth: 180,
              height: 42,
            }}
          >
            {isEnglish ? 'Edit Curriculum Level' : 'Chỉnh Sửa Cấp Độ'}
          </Button>
        )}
      </div>
    </BaseFormPageLayout>
  );
};
