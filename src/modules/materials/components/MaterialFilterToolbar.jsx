import React from 'react';
import { Button, Col, Input, Row, Select, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { MATERIAL_TYPES } from '../models/material.model';

export const MaterialFilterToolbar = ({
  courses = [],
  selectedCourseId = 'ALL',
  onSelectCourse,
  selectedType = 'ALL',
  onSelectType,
  searchTerm = '',
  onSearchChange,
  canManage = false,
  onOpenUpload,
}) => {
  const { isEnglish } = useLanguage();

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <Row gutter={[12, 12]} align="middle" justify="space-between">
        {/* Left: Filters */}
        <Col xs={24} md={16} lg={18}>
          <Row gutter={[10, 10]}>
            {/* Search Input */}
            <Col xs={24} sm={8} md={8}>
              <Input
                placeholder={isEnglish ? 'Search material or course...' : 'Tìm tài liệu, giáo trình, bài học...'}
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                allowClear
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                data-testid="input-search-material"
              />
            </Col>

            {/* Course Filter */}
            <Col xs={24} sm={8} md={8}>
              <Select
                value={selectedCourseId}
                onChange={onSelectCourse}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                data-testid="select-filter-course"
              >
                <Select.Option value="ALL">
                  {isEnglish ? '📚 All Courses' : '📚 Tất Cả Khóa Học'}
                </Select.Option>
                {courses.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name || c.code} ({c.level || 'Standard'})
                  </Select.Option>
                ))}
              </Select>
            </Col>

            {/* Type Filter */}
            <Col xs={24} sm={8} md={8}>
              <Select
                value={selectedType}
                onChange={onSelectType}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                data-testid="select-filter-type"
              >
                <Select.Option value="ALL">
                  {isEnglish ? '🗂️ All Formats' : '🗂️ Tất Cả Định Dạng'}
                </Select.Option>
                {Object.values(MATERIAL_TYPES).map((t) => (
                  <Select.Option key={t.key} value={t.key}>
                    {isEnglish ? t.labelEn : t.labelVi}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Col>

        {/* Right: Upload Action Button */}
        {canManage && (
          <Col xs={24} md={8} lg={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenUpload}
              data-testid="btn-open-upload-modal"
              style={{
                backgroundColor: '#722ed1',
                borderColor: '#722ed1',
                borderRadius: 8,
                height: 40,
                fontWeight: 600,
                width: '100%',
              }}
            >
              {isEnglish ? 'Upload Learning Material' : 'Tải Lên Học Liệu Mới'}
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
};

