import React from 'react';
import { Row, Col, Card, Tag, Typography, Button, Space, Input, Empty, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { formatLocalizedAgeRange } from '../../../shared/utils/taxonomyUtils';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Title, Text, Paragraph } = Typography;

export const CourseCatalogTab = ({
  courses,
  canManage,
  onOpenCreate,
  onViewCourse,
  onEditCourse,
  search,
  onSearchChange,
  onDeleteCourse,
  onClearAll,
  isMobile = false,
}) => {
  const { isEnglish, t } = useLanguage();

  return (
    <div>
      {/* Thanh Công Cụ: Tìm Kiếm & Nút Thêm Mới */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder={t('courses.catalog.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            flex: isMobile ? '1 1 100%' : '1 1 300px',
            maxWidth: isMobile ? '100%' : 360,
            height: 40,
            borderRadius: 8,
          }}
          allowClear
        />

        {canManage && (
          <Space
            wrap
            size={10}
            style={{
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
            }}
          >
            {courses.length > 0 && onClearAll && (
              <Popconfirm
                title={t('courses.catalog.clearConfirmTitle')}
                description={
                  isEnglish
                    ? 'Are you sure you want to delete all courses?'
                    : 'Bạn có chắc chắn muốn xóa hết tất cả khóa học?'
                }
                onConfirm={onClearAll}
                okText={t('common.yesDeleteAll')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  style={{ height: 40, borderRadius: 8, flex: isMobile ? 1 : undefined }}
                >
                  {t('courses.catalog.clearAll')}
                </Button>
              </Popconfirm>
            )}

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreate}
              style={{
                height: 40,
                borderRadius: 8,
                backgroundColor: '#1890ff',
                fontWeight: 600,
                flex: isMobile ? 1 : undefined,
                boxShadow: '0 2px 8px rgba(24,144,255,0.3)',
              }}
            >
              {t('courses.catalog.createBtn')}
            </Button>
          </Space>
        )}
      </div>

      {courses.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ padding: '12px 0' }}>
              <Text strong style={{ fontSize: 15, display: 'block', color: '#475569' }}>
                {isEnglish ? 'No courses in system yet' : 'Chưa có khóa học nào trong hệ thống'}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {isEnglish
                  ? 'Create a course program (e.g. McGraw-Hill Wonders) to get started.'
                  : 'Bấm nút "Tạo Khóa Học Mới" để thiết lập chương trình học đầu tiên.'}
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
              {isEnglish ? 'Create First Course' : 'Tạo Khóa Học Đầu Tiên'}
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map((course) => (
            <Col xs={24} sm={12} md={12} lg={12} xl={8} key={course.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
                styles={{
                  body: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Tag color="geekblue" style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
                    {course.id}
                  </Tag>
                  <Space size={6}>
                    <Tag color={course.status === 'Inactive' ? 'red' : 'green'} style={{ margin: 0 }}>
                      {course.status || 'Active'}
                    </Tag>
                    {canManage && onDeleteCourse && (
                      <Popconfirm
                        title={isEnglish ? 'Delete this course?' : 'Xóa khóa học này?'}
                        description={
                          isEnglish
                            ? 'Are you sure you want to delete this course?'
                            : 'Bạn có chắc chắn muốn xóa khóa học này?'
                        }
                        onConfirm={() => onDeleteCourse(course.id)}
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

                <Title level={5} style={{ margin: '0 0 8px 0', color: '#0f172a', minHeight: 44, lineHeight: 1.4 }}>
                  {course.name}
                </Title>

                <div style={{ marginBottom: 12 }}>
                  <Tag color="blue" style={{ borderRadius: 4, fontWeight: 500 }}>
                    {course.level}
                  </Tag>
                  {course.targetAge && (
                    <Tag color="default" style={{ borderRadius: 4, color: '#64748b' }}>
                      {formatLocalizedAgeRange(course.targetAge, isEnglish)}
                    </Tag>
                  )}
                </div>

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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <Space size={6}>
                      <ClockCircleOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary">{isEnglish ? 'Duration:' : 'Thời lượng:'}</Text>
                    </Space>
                    <Text strong>{course.durationWeeks} {isEnglish ? 'weeks' : 'tuần'}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <Space size={6}>
                      <TeamOutlined style={{ color: '#52c41a' }} />
                      <Text type="secondary">{isEnglish ? 'Scale:' : 'Quy mô:'}</Text>
                    </Space>
                    <Text strong>
                      {course.activeClasses || 0} {isEnglish ? 'classes' : 'lớp'} ({course.enrolledStudents || 0} {isEnglish ? 'students' : 'HV'})
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <Space size={6}>
                      <DollarOutlined style={{ color: '#722ed1' }} />
                      <Text type="secondary">{isEnglish ? 'Fee:' : 'Học phí:'}</Text>
                    </Space>
                    <Text strong style={{ color: '#722ed1', whiteSpace: 'nowrap' }}>
                      {formatCurrency(course.feePerMonth)}/{isEnglish ? 'mo' : 'tháng'}
                    </Text>
                  </div>
                </div>

                {course.description && (
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: '0 0 12px 0', fontSize: 12 }}>
                    {course.description}
                  </Paragraph>
                )}

                {/* Thanh Nút Hành Động Chân Card: Xem Chi Tiết & Chỉnh Sửa */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => onViewCourse && onViewCourse(course)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 8,
                      fontWeight: 500,
                    }}
                  >
                    {t('courses.catalog.btnView')}
                  </Button>
                  {canManage && onEditCourse && (
                    <Button
                      type="primary"
                      ghost
                      icon={<EditOutlined />}
                      onClick={() => onEditCourse(course)}
                      style={{
                        height: 38,
                        borderRadius: 8,
                        padding: '0 14px',
                        fontWeight: 500,
                      }}
                    >
                      {t('courses.catalog.btnEdit')}
                    </Button>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
