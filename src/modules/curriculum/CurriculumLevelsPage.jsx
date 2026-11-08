import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Statistic, Space, Tag } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { PermissionService } from '../../core/services/PermissionService';
import { useCurriculumLevelController } from './hooks/useCurriculumLevelController';
import { CurriculumLevelFilterBar } from './components/CurriculumLevelFilterBar';
import { CurriculumLevelTable } from './components/CurriculumLevelTable';
import { CurriculumLevelCardList } from './components/CurriculumLevelCardList';
import { CurriculumLevelDeleteModal } from './components/CurriculumLevelDeleteModal';

const { Title, Text } = Typography;

export const CurriculumLevelsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canManage = ['admin', 'director', 'academic'].includes(currentUser?.role);

  const {
    levels,
    loading,
    stats,
    searchText,
    setSearchText,
    seriesFilter,
    setSeriesFilter,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    editingLevel,
    modalLoading,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSaveLevel,
    handleToggleStatus,
    isDeleteModalOpen,
    deletingLevel,
    deleteLoading,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
    handleResetDefaults,
  } = useCurriculumLevelController();

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 8px 32px' }}>
      {/* 1. Header Banner & Tiêu đề phân hệ */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          marginBottom: 16,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          border: '1px solid #e2e8f0',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Space align="center" style={{ marginBottom: 4 }}>
              <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
                <BookOutlined style={{ color: '#0284c7', marginRight: 8 }} />
                {isEnglish ? 'Curriculum Levels & Standards' : 'Quản Lý Cấp Độ Giáo Trình'}
              </Title>
              <Tag color="blue" style={{ fontWeight: 700, borderRadius: 6 }}>
                McGraw-Hill Wonders & CEFR
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
              {isEnglish
                ? 'Manage textbook series, progression roadmaps (GK -> G5), age ranges, and international output benchmarks.'
                : 'Chuẩn hóa danh mục cấp độ, lộ trình đào tạo từ Mầm non đến Lớp 5 (GK -> G5), độ tuổi và chuẩn đầu ra quốc tế.'}
            </Text>
          </div>
        </div>

        {/* 2. Thẻ Thống Kê Tổng Quan */}
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: 12 }}>{isEnglish ? 'Total Levels' : 'Tổng Cấp Độ'}</span>}
                value={stats.total}
                prefix={<AppstoreOutlined style={{ color: '#3b82f6' }} />}
                valueStyle={{ color: '#0f172a', fontWeight: 700, fontSize: 22 }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: 12 }}>{isEnglish ? 'Active in Use' : 'Đang Áp Dụng'}</span>}
                value={stats.activeCount}
                prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: 22 }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: 12 }}>{isEnglish ? 'Curriculum Series' : 'Bộ Giáo Trình'}</span>}
                value={stats.seriesCount}
                prefix={<BookOutlined style={{ color: '#8b5cf6' }} />}
                valueStyle={{ color: '#8b5cf6', fontWeight: 700, fontSize: 22 }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: 12 }}>{isEnglish ? 'CEFR Coverage' : 'Khung Chuẩn'}</span>}
                value="Pre-A1 → B1"
                prefix={<AimOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: 18 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 3. Thanh Bộ Lọc & Tìm Kiếm */}
      <CurriculumLevelFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        seriesFilter={seriesFilter}
        onSeriesChange={setSeriesFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onOpenCreate={() => navigate('/curriculum-levels/new')}
        onResetDefaults={handleResetDefaults}
        canManage={canManage}
      />

      {/* 4. Danh Sách Cấp Độ (Desktop Table hoặc Mobile Cards) */}
      {isMobile ? (
        <CurriculumLevelCardList
          levels={levels}
          onView={(record) => navigate(`/curriculum-levels/${record.code || record.id}`)}
          onEdit={(record) => navigate(`/curriculum-levels/${record.code || record.id}/edit`)}
          onToggleStatus={handleToggleStatus}
          onDelete={handleOpenDelete}
          canManage={canManage}
        />
      ) : (
        <CurriculumLevelTable
          levels={levels}
          loading={loading}
          onView={(record) => navigate(`/curriculum-levels/${record.code || record.id}`)}
          onEdit={(record) => navigate(`/curriculum-levels/${record.code || record.id}/edit`)}
          onToggleStatus={handleToggleStatus}
          onDelete={handleOpenDelete}
          canManage={canManage}
        />
      )}

      {/* 5. Modal Xác Nhận Xóa */}
      <CurriculumLevelDeleteModal
        open={isDeleteModalOpen}
        deletingLevel={deletingLevel}
        loading={deleteLoading}
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

