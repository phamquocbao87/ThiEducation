import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Grid,
} from 'antd';
import {
  UserAddOutlined,
  HistoryOutlined,
  CloudUploadOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  BookOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useUsers } from './hooks/useUsers';
import { UserTable } from './components/UserTable';
import { UserCardList } from './components/UserCardList';
import { UserDeleteModal } from './components/UserDeleteModal';
import { UserAuditLogDrawer } from './components/UserAuditLogDrawer';
import { USER_ROLES, USER_STATUS, ROLE_LABELS } from './models/user.model';
import { PermissionService } from '../../core/services/PermissionService';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export const UsersPage = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md); // < 768px

  const handleSelectUser = (user) => {
    const targetId = user.code || user.id;
    navigate(`/user-management/${targetId}`);
  };

  const {
    currentUser,
    users,
    loading,
    stats,
    searchText,
    setSearchText,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    isFormModalOpen,
    setIsFormModalOpen,
    isEditModalOpen,
    selectedUserForEdit,
    openEditModal,
    closeEditModal,
    handleUpdateUser,
    isDeleteModalOpen,
    userToDelete,
    deleteLoading,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDeleteUser,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    auditLogs,
    auditLoading,
    openAuditDrawer,
    handleCreateUser,
    handleToggleStatus,
    handleSeedToFirestore,
  } = useUsers();

  const canManage = PermissionService.canManageUsers(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  return (
    <div style={{ padding: '0 4px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
            <span>Quản Trị Người Dùng & Phân Quyền RBAC</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Quản lý tài khoản 6 Roles, cấp quyền, kích hoạt/khóa và nhật ký kiểm toán LAK EDUCATION
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<HistoryOutlined />}
            onClick={openAuditDrawer}
            style={{ borderRadius: 6 }}
          >
            Nhật Ký Kiểm Toán
          </Button>

          {isAdmin && (
            <Button
              icon={<CloudUploadOutlined />}
              onClick={handleSeedToFirestore}
              style={{ borderRadius: 6 }}
            >
              Đồng Bộ Dữ Liệu
            </Button>
          )}

          {canManage && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate('/user-management/new')}
              style={{
                borderRadius: 8,
                backgroundColor: '#1890ff',
                boxShadow: '0 2px 8px rgba(24,144,255,0.35)',
                fontWeight: 600,
              }}
            >
              + Tạo & Đăng Ký Tài Khoản Mới
            </Button>
          )}
        </Space>
      </div>

      {/* 2. Thẻ Thống Kê Nhanh (Stats Cards) */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={5}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Tổng Tài Khoản</span>}
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Đang Hoạt Động</span>}
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Đã Khóa</span>}
              value={stats.disabled}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Học Viên (HV)</span>}
              value={stats.students}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Cán Bộ & Giáo Viên</span>}
              value={stats.staff}
              prefix={<IdcardOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. Thanh Lọc & Tìm Kiếm */}
      <Card
        bordered={false}
        style={{
          borderRadius: 10,
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={10}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Tìm theo Tên, Mã (HV001, GV002...), Email hoặc SĐT..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: 6 }}
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="ALL">Tất Cả Vai Trò (6 Roles)</Option>
              {Object.values(USER_ROLES).map((role) => (
                <Option key={role} value={role}>
                  {ROLE_LABELS.vi[role]}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={7}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="ALL">Tất Cả Trạng Thái</Option>
              <Option value={USER_STATUS.ACTIVE}>Đang Hoạt Động</Option>
              <Option value={USER_STATUS.DISABLED}>Đã Khóa / Vô Hiệu Hóa</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 4. Giao Diện Dữ Liệu Users (Responsive: Mobile = Card List, Desktop = Table) */}
      <div className="mobile-user-view" style={{ display: isMobile ? 'block' : 'none', marginBottom: 24 }}>
        {canManage && (
          <Button
            type="primary"
            block
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => navigate('/user-management/new')}
            style={{
              marginBottom: 16,
              borderRadius: 10,
              backgroundColor: '#1890ff',
              boxShadow: '0 4px 12px rgba(24,144,255,0.35)',
              fontWeight: 700,
              height: 44,
            }}
          >
            + Tạo & Đăng Ký Tài Khoản Mới
          </Button>
        )}
        <UserCardList
          users={users}
          loading={loading}
          currentUser={currentUser}
          onEditUser={handleSelectUser}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={openDeleteModal}
        />
      </div>

      <div className="desktop-user-view" style={{ display: !isMobile ? 'block' : 'none' }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <UserTable
            users={users}
            loading={loading}
            currentUser={currentUser}
            onToggleStatus={handleToggleStatus}
            onEditUser={handleSelectUser}
            onDeleteUser={openDeleteModal}
          />
        </Card>
      </div>

      {/* 5. Modals & Drawers */}
      {/* Modal Xác Nhận Xóa Mềm Kèm Lý Do */}
      <UserDeleteModal
        open={isDeleteModalOpen}
        user={userToDelete}
        loading={deleteLoading}
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDeleteUser}
      />

      {/* Drawer Nhật ký kiểm toán */}
      <UserAuditLogDrawer
        open={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        auditLogs={auditLogs}
        loading={auditLoading}
      />
    </div>
  );
};
