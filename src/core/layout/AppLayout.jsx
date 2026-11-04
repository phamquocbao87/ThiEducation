import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Drawer,
  Tag,
  Avatar,
  Space,
  Typography,
  Card,
  Modal,
  Input,
  Select,
  List,
  Alert,
  Segmented,
} from 'antd';
import {
  MenuOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  UserOutlined,
  SwapOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  RollbackOutlined,
  EyeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PermissionService } from '../services/PermissionService';

const { Header, Content, Sider, Footer } = Layout;
const { Text, Title } = Typography;

export const AppLayout = ({ activeTab, setActiveTab, children }) => {
  const {
    authenticatedUser,
    currentUser,
    isImpersonating,
    canImpersonateUsers,
    allSystemUsers,
    impersonateAccount,
    exitImpersonation,
  } = useAuth();

  const navigate = useNavigate();
  const { language, setLanguage, t, translateLabel } = useLanguage();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allMenuDefinitions = useMemo(
    () => [
      { key: 'dashboard', icon: <DashboardOutlined />, label: t('menus.dashboard') },
      { key: 'contracts', icon: <FileTextOutlined />, label: t('menus.contracts') },
      { key: 'schedules', icon: <CalendarOutlined />, label: t('menus.schedules') },
      { key: 'attendance', icon: <TeamOutlined />, label: t('menus.attendance') },
      { key: 'tuition', icon: <DollarOutlined />, label: t('menus.tuition') },
    ],
    [t]
  );

  const menuItems = allMenuDefinitions.filter((item) =>
    PermissionService.canAccessModule(currentUser.role, item.key)
  );

  const filteredDirectoryUsers = useMemo(() => {
    return allSystemUsers.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const kw = userSearchText.trim().toLowerCase();
      const matchKeyword =
        !kw ||
        u.name.toLowerCase().includes(kw) ||
        u.id.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.roleLabel.toLowerCase().includes(kw);
      return matchRole && matchKeyword;
    });
  }, [allSystemUsers, roleFilter, userSearchText]);

  const currentRoleMeta = PermissionService.ROLE_METADATA[currentUser.role] || {
    color: 'blue',
    shortLabel: currentUser.role.toUpperCase(),
  };

  const localizedCurrentRoleLabel = translateLabel(currentUser.roleLabel);

  const handleSelectTargetUser = (userObj) => {
    impersonateAccount(userObj.id);
    if (!PermissionService.canAccessModule(userObj.role, activeTab)) {
      setActiveTab('dashboard');
    }
    setIsImpersonateModalOpen(false);
  };

  const handleMenuClick = (e) => {
    setActiveTab(e.key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px',
          background: '#001529',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#fff', fontSize: 18 }} />}
              onClick={() => setMobileDrawerOpen(true)}
            />
          )}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('dashboard')}
          >
            <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
              {t('appTitle')}
            </Title>
          </div>
        </div>

        <Space size={isMobile ? 6 : 12}>
          <Button
            size={isMobile ? 'small' : 'middle'}
            icon={<GlobalOutlined />}
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.3)',
              borderRadius: 6,
            }}
          >
            {!isMobile && (language === 'en' ? 'Landing Page' : 'Trang Chủ')}
          </Button>

          {/* BỘ CHUYỂN NGÔN NGỮ 2 CHẾ ĐỘ: MẶC ĐỊNH TIẾNG ANH (EN) | TIẾNG VIỆT (VI) */}
          <Segmented
            size={isMobile ? 'small' : 'middle'}
            value={language}
            onChange={(val) => setLanguage(val)}
            options={[
              { label: '🇬🇧 EN', value: 'en' },
              { label: '🇻🇳 VI', value: 'vi' },
            ]}
            style={{ fontWeight: 600 }}
          />

          {/* CHỈ DUY NHẤT ADMIN MỚI CÓ QUYỀN GIẢ LẬP / CHUYỂN TÀI KHOẢN BẤT KỲ */}
          {canImpersonateUsers && (
            <Space size={8}>
              {isImpersonating && (
                <Button
                  danger
                  type="primary"
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={exitImpersonation}
                >
                  {!isMobile && t('exitViewAsBtn')}
                </Button>
              )}
              <Button
                type="primary"
                ghost
                size={isMobile ? 'small' : 'middle'}
                icon={<SwapOutlined />}
                onClick={() => setIsImpersonateModalOpen(true)}
                style={{ borderRadius: 6 }}
              >
                {!isMobile && `${t('adminViewAsBtn')} `}
                <Tag color={currentRoleMeta.color} style={{ margin: 0 }}>
                  {currentRoleMeta.shortLabel} — {currentUser.id}
                </Tag>
              </Button>
            </Space>
          )}

          {!isMobile && (
            <Space style={{ color: '#fff' }}>
              <Avatar src={currentUser.avatar} icon={<UserOutlined />} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <Text style={{ color: '#fff', fontWeight: 600 }}>{currentUser.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                  {localizedCurrentRoleLabel}
                </Text>
              </div>
            </Space>
          )}
        </Space>
      </Header>

      {/* Thanh cảnh báo nổi bật khi IT Admin đang đóng vai xem màn hình của User khác */}
      {canImpersonateUsers && isImpersonating && (
        <Alert
          banner
          type="warning"
          showIcon
          icon={<EyeOutlined />}
          message={
            <Space wrap>
              <Text strong>
                {t('impersonationBannerPrefix', { adminName: authenticatedUser.name })}
              </Text>
              <Tag color={currentRoleMeta.color}>
                {currentUser.name} ({currentUser.id} — {localizedCurrentRoleLabel})
              </Tag>
              <Button size="small" type="link" onClick={() => setIsImpersonateModalOpen(true)}>
                {t('switchAnotherAccountBtn')}
              </Button>
              <Button size="small" danger type="primary" onClick={exitImpersonation}>
                {t('returnToAdminBtn')}
              </Button>
            </Space>
          }
        />
      )}

      <Layout>
        {!isMobile && (
          <Sider
            width={255}
            style={{
              background: '#fff',
              boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
              zIndex: 1,
            }}
          >
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                {t('menuHeaderPrefix')} {currentRoleMeta.shortLabel} ({currentUser.id})
              </Text>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={handleMenuClick}
              style={{ borderRight: 0, padding: '8px 0' }}
              items={menuItems}
            />
          </Sider>
        )}

        {isMobile && (
          <Drawer
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <Text strong>{t('appTitle')}</Text>
              </Space>
            }
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            width={265}
          >
            <Card style={{ marginBottom: 16, background: '#fafafa' }} styles={{ body: { padding: 12 } }}>
              <Space align="center">
                <Avatar src={currentUser.avatar} size={40} />
                <div>
                  <Text strong style={{ display: 'block' }}>{currentUser.name}</Text>
                  <Tag color={currentRoleMeta.color}>{localizedCurrentRoleLabel}</Tag>
                </div>
              </Space>
            </Card>
            <div style={{ marginBottom: 12 }}>
              <Space>
                <GlobalOutlined />
                <Text type="secondary">{t('langSwitchLabel')}:</Text>
                <Segmented
                  size="small"
                  value={language}
                  onChange={(val) => setLanguage(val)}
                  options={[
                    { label: '🇬🇧 EN', value: 'en' },
                    { label: '🇻🇳 VI', value: 'vi' },
                  ]}
                />
              </Space>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
              items={menuItems}
            />
          </Drawer>
        )}

        <Layout style={{ padding: isMobile ? '12px' : '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: isMobile ? '16px' : '24px',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              minHeight: 360,
            }}
          >
            {children}
          </Content>
          <Footer style={{ textAlign: 'center', color: '#8c8c8c', padding: '16px 0 0 0', fontSize: 13 }}>
            {t('footerText')}
          </Footer>
        </Layout>
      </Layout>

      {/* Modal Chuyển Đổi Thông Minh Dành Riêng Cho IT Admin */}
      {canImpersonateUsers && (
        <Modal
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#ff4d4f' }} />
              <Text strong>
                {t('impersonateModalTitle', { count: allSystemUsers.length })}
              </Text>
            </Space>
          }
          open={isImpersonateModalOpen}
          onCancel={() => setIsImpersonateModalOpen(false)}
          footer={null}
          width={680}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message={t('impersonateModalAlert')}
          />

          <Space style={{ width: '100%', marginBottom: 12 }} wrap>
            <Input
              placeholder={t('impersonateSearchPlaceholder')}
              prefix={<SearchOutlined />}
              value={userSearchText}
              onChange={(e) => setUserSearchText(e.target.value)}
              style={{ width: 360 }}
              allowClear
            />
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 240 }}
              options={[
                { value: 'ALL', label: translateLabel('Tất cả 6 Vai trò (Roles)') },
                { value: 'admin', label: translateLabel('🛠️ IT Admin (Quản trị hệ thống)') },
                { value: 'director', label: translateLabel('👑 Director (Giám đốc điều hành)') },
                { value: 'academic', label: translateLabel('🎓 Giáo vụ (Academic Staff)') },
                { value: 'teacher', label: translateLabel('🌎 Giáo viên bản xứ (Teachers)') },
                { value: 'accountant', label: translateLabel('💰 Kế toán (Accountant)') },
                { value: 'student', label: translateLabel('🧑‍🎓 Học viên (Students)') },
              ]}
            />
          </Space>

          <List
            style={{ maxHeight: 380, overflowY: 'auto' }}
            bordered
            size="small"
            dataSource={filteredDirectoryUsers}
            renderItem={(u) => {
              const meta = PermissionService.ROLE_METADATA[u.role] || { color: 'blue', shortLabel: u.role };
              const isSelected = currentUser.id === u.id;
              return (
                <List.Item
                  style={{
                    background: isSelected ? '#e6f7ff' : '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelectTargetUser(u)}
                  actions={[
                    <Button
                      key="switch"
                      type={isSelected ? 'default' : 'primary'}
                      size="small"
                      icon={<EyeOutlined />}
                    >
                      {isSelected ? translateLabel('Đang xem') : translateLabel('Xem màn hình này')}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={u.avatar} icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <Tag color={meta.color} style={{ minWidth: 78, textAlign: 'center' }}>
                          {meta.shortLabel}
                        </Tag>
                        <Text strong>{u.name}</Text>
                        <Tag>{u.id}</Tag>
                      </Space>
                    }
                    description={`${translateLabel(u.roleLabel)} — ${u.email}`}
                  />
                </List.Item>
              );
            }}
          />
        </Modal>
      )}
    </Layout>
  );
};
