import React from 'react';
import { Card, Row, Col, Input, Select, Button, Space, Popconfirm } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  BookOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { TEXTBOOK_SERIES } from '../models/curriculumLevel.model';

const { Option } = Select;

export const CurriculumLevelFilterBar = ({
  searchText,
  onSearchChange,
  seriesFilter,
  onSeriesChange,
  statusFilter,
  onStatusChange,
  onOpenCreate,
  onResetDefaults,
  canManage = true,
}) => {
  const { isEnglish } = useLanguage();

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: '14px 16px' } }}
    >
      <Row gutter={[12, 12]} align="middle" justify="space-between">
        <Col xs={24} md={14} lg={15}>
          <Space wrap size={10} style={{ width: '100%' }}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={
                isEnglish
                  ? 'Search by code, level name, CEFR band...'
                  : 'Tìm kiếm theo mã cấp độ, tên, chuẩn CEFR...'
              }
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: 260, borderRadius: 8 }}
            />

            <Select
              value={seriesFilter}
              onChange={onSeriesChange}
              style={{ width: 220 }}
              prefix={<BookOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
            >
              <Option value="ALL">{isEnglish ? 'All Curriculum Series' : 'Tất cả Bộ Giáo Trình'}</Option>
              {Object.values(TEXTBOOK_SERIES).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={onStatusChange}
              style={{ width: 160 }}
              prefix={<FilterOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
            >
              <Option value="ALL">{isEnglish ? 'All Statuses' : 'Tất cả trạng thái'}</Option>
              <Option value="ACTIVE">{isEnglish ? '🟢 Active' : '🟢 Đang Áp Dụng'}</Option>
              <Option value="INACTIVE">{isEnglish ? '🔴 Inactive' : '🔴 Tạm Ngưng'}</Option>
            </Select>
          </Space>
        </Col>

        <Col xs={24} md={10} lg={9} style={{ textAlign: 'right' }}>
          <Space wrap size={10}>
            {canManage && (
              <Popconfirm
                title={isEnglish ? 'Reset to Default Levels?' : 'Khôi phục danh mục cấp độ mặc định?'}
                description={
                  isEnglish
                    ? 'This will reset the catalog back to McGraw-Hill Wonders (GK -> G5) and IELTS Junior defaults.'
                    : 'Thao tác này sẽ thiết lập lại danh mục chuẩn McGraw-Hill Wonders (GK -> G5) và IELTS ban đầu.'
                }
                okText={isEnglish ? 'Yes, Reset' : 'Đồng ý khôi phục'}
                cancelText={isEnglish ? 'Cancel' : 'Hủy'}
                onConfirm={onResetDefaults}
              >
                <Button icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>
                  {isEnglish ? 'Reset Defaults' : 'Khôi Phục Mặc Định'}
                </Button>
              </Popconfirm>
            )}

            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onOpenCreate}
                style={{
                  borderRadius: 8,
                  backgroundColor: '#1890ff',
                  boxShadow: '0 2px 6px rgba(24,144,255,0.3)',
                  fontWeight: 600,
                }}
              >
                {isEnglish ? 'Add New Level' : 'Thêm Cấp Độ Mới'}
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

