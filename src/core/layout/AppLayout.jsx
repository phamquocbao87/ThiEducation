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
  Segmented,
  Tooltip,
  Dropdown,
  message,
  Input,
} from 'antd';
import {
  MenuOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  UserOutlined,
  BookOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  LogoutOutlined,
  SwapOutlined,
  DownOutlined,
  CheckOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuth, CORE_ROLE_USERS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PermissionService } from '../services/PermissionService';
import { isProductionErpDomain, SITE_DOMAINS, APP_BUILD_VERSION_LABEL } from '../config/siteConfig';
import { DriveStorageService } from '../services/DriveStorageService';
import { AdminUserImpersonationModal } from '../../shared/components/modals/AdminUserImpersonationModal';
import { matchesMultiFields } from '../../shared/utils/searchUtils';

const { Header, Content, Sider, Footer } = Layout;
const { Text, Title } = Typography;

export const AppLayout = ({ activeTab, setActiveTab, children }) => {
  const {
    currentUser,
    authenticatedUser,
    isImpersonating,
    canImpersonateUsers,
    allSystemUsers,
    impersonateAccount,
    exitImpersonation,
    linkedProfiles,
    switchActiveProfile,
    logoutAccount,
  } = useAuth();

  const navigate = useNavigate();
  const { language, setLanguage, t, translateLabel } = useLanguage();

  const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCompactHeader, setIsCompactHeader] = useState(window.innerWidth < 1200);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsCompactHeader(window.innerWidth < 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isEnglish = language === 'en';

  const allMenuDefinitions = useMemo(
    () => [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: t('menus.dashboard'),
      },
      {
        key: 'courses',
        icon: <BookOutlined />,
        label: t('menus.courses'),
      },
      {
        key: 'curriculum',
        icon: <AppstoreOutlined />,
        label: t('menus.curriculum'),
      },
      {
        key: 'schedules',
        icon: <CalendarOutlined />,
        label: t('menus.schedules'),
      },
      {
        key: 'attendance',
        icon: <TeamOutlined />,
        label: t('menus.attendance'),
      },
      {
        key: 'contracts',
        icon: <FileTextOutlined />,
        label: t('menus.contracts'),
      },
      {
        key: 'tuition',
        icon: <DollarOutlined />,
        label: t('menus.tuition'),
      },
      {
        key: 'users',
        icon: <SafetyCertificateOutlined />,
        label: t('menus.users'),
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: t('menus.profile'),
      },
    ],
    [isEnglish, language, t]
  );

  // Danh sách tài khoản người dùng thực tế kèm các vai trò mẫu để Admin kiểm thử giao diện
  const impersonationUserList = useMemo(() => {
    const activeUsers = (allSystemUsers || []).filter((u) => !u.isDeleted && u.status !== 'deleted');
    const hasTeacher = activeUsers.some((u) => u.role === 'teacher');
    const hasAcademic = activeUsers.some((u) => u.role === 'academic');
    const hasStudent = activeUsers.some((u) => u.role === 'student');

    const list = [...activeUsers];
    if (!hasAcademic && CORE_ROLE_USERS.academic) list.push(CORE_ROLE_USERS.academic);
    if (!hasTeacher && CORE_ROLE_USERS.teacher) list.push(CORE_ROLE_USERS.teacher);
    if (!hasStudent && CORE_ROLE_USERS.student) list.push(CORE_ROLE_USERS.student);
    return list;
  }, [allSystemUsers]);

  const menuItems = allMenuDefinitions.filter((item) =>
    PermissionService.canAccessModule(currentUser.role, item.key)
  );

  const currentRoleMeta = PermissionService.ROLE_METADATA[currentUser.role] || {
    color: 'blue',
    shortLabel: currentUser.role.toUpperCase(),
  };

  const localizedCurrentRoleLabel = translateLabel(currentUser.roleLabel);

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
          padding: isMobile ? '0 10px' : '0 24px',
          background: '#001529',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, minWidth: 0, flexShrink: 1 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#fff', fontSize: 18 }} />}
              onClick={() => setMobileDrawerOpen(true)}
              style={{ width: 34, height: 34, padding: 0 }}
            />
          )}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => setActiveTab('dashboard')}
          >
            <img
              src="/resources/web/icon_core_ela.webp"
              alt="LAK EDUCATION"
              style={{
                width: isMobile ? 24 : 30,
                height: isMobile ? 24 : 30,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <Text style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: isMobile ? 15 : isCompactHeader ? 16 : 18, whiteSpace: 'nowrap' }}>
              {isMobile ? 'LAK' : isCompactHeader ? 'LAK EDUCATION' : t('appTitle')}
            </Text>
          </div>
        </div>

        <Space size={isMobile ? 4 : isCompactHeader ? 8 : 12} style={{ flexShrink: 0 }}>
          <Button
            size={isMobile || isCompactHeader ? 'small' : 'middle'}
            icon={<GlobalOutlined />}
            onClick={() => {
              if (isProductionErpDomain()) {
                window.location.href = SITE_DOMAINS.LANDING_PRODUCTION;
              } else {
                navigate('/');
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.3)',
              borderRadius: 6,
              padding: isMobile ? '0 6px' : isCompactHeader ? '0 8px' : undefined,
            }}
          >
            {!isMobile && (language === 'en' ? 'Landing Page' : 'Trang Chủ')}
          </Button>

          {/* BỘ CHUYỂN NGÔN NGỮ 2 CHẾ ĐỘ: MẶC ĐỊNH TIẾNG ANH (EN) | TIẾNG VIỆT (VI) */}
          <Segmented
            size="small"
            value={language}
            onChange={(val) => setLanguage(val)}
            options={[
              { label: isMobile || isCompactHeader ? 'EN' : '🇬🇧 EN', value: 'en' },
              { label: isMobile || isCompactHeader ? 'VI' : '🇻🇳 VI', value: 'vi' },
            ]}
            style={{ fontWeight: 600 }}
          />

          {!isMobile && (
            <Space style={{ color: '#fff' }} size={isCompactHeader ? 6 : 10}>
              <Tooltip title={isEnglish ? 'View My Personal Profile' : 'Xem Hồ Sơ Cá Nhân Của Tôi'}>
                <div
                  className="lak-header-user-profile-trigger"
                  onClick={() => setActiveTab('profile')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isCompactHeader ? 6 : 8,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: activeTab === 'profile' ? 'rgba(24, 144, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    border: activeTab === 'profile' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Avatar
                    key={currentUser.avatar || currentUser.id}
                    src={DriveStorageService.formatAvatarUrl(currentUser.avatar, 100)}
                    icon={<UserOutlined />}
                    size={isCompactHeader ? 28 : 30}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <Text style={{ color: '#fff', fontWeight: 600, fontSize: isCompactHeader ? 13 : 14, whiteSpace: 'nowrap' }}>
                      {currentUser.name}
                    </Text>
                    {!isCompactHeader && (
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {localizedCurrentRoleLabel}
                      </Text>
                    )}
                  </div>
                </div>
              </Tooltip>

              {/* BỘ CHUYỂN ĐỔI HỒ SƠ 1 CHẠM: PHỤ HUYNH NHIỀU CON HOẶC CÁN BỘ / GIÁO VIÊN CÓ CON HỌC */}
              {linkedProfiles && linkedProfiles.length > 1 && (
                <Dropdown
                  menu={{
                    items: linkedProfiles.map((p) => {
                      const pId = p.id || p.code;
                      const isActive = (currentUser.id || currentUser.code) === pId;
                      const roleColor = p.role === 'admin' ? 'red' : p.role === 'teacher' ? 'green' : p.role === 'student' ? 'blue' : 'gold';
                      const roleLabel = isEnglish ? (p.roleLabelEn || p.role) : (p.roleLabel || p.role);

                      return {
                        key: pId,
                        label: (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              padding: '4px 2px',
                              minWidth: 210,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar
                                size={28}
                                src={DriveStorageService.formatAvatarUrl(p.avatar, 60)}
                                icon={<UserOutlined />}
                                style={{ border: `1.5px solid ${roleColor === 'red' ? '#ff4d4f' : '#38bdf8'}` }}
                              />
                              <div>
                                <div style={{ fontWeight: isActive ? 700 : 500, fontSize: 13, color: isActive ? '#1890ff' : '#1e293b' }}>
                                  {p.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                  <Tag color={roleColor} style={{ margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 4px' }}>
                                    {roleLabel}
                                  </Tag>
                                  {p.englishName && (
                                    <span style={{ fontSize: 11, color: '#64748b' }}>
                                      ({p.englishName})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isActive && <CheckOutlined style={{ color: '#1890ff', fontSize: 14 }} />}
                          </div>
                        ),
                        onClick: () => {
                          if (!isActive) {
                            switchActiveProfile(pId);
                            message.success(
                              isEnglish
                                ? `Switched active profile to: ${p.name}`
                                : `Đã chuyển sang hồ sơ: ${p.name}`
                            );
                          }
                        },
                      };
                    }),
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    size="small"
                    style={{
                      borderRadius: 8,
                      height: 32,
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      color: '#fff',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <SwapOutlined style={{ fontSize: 13, color: '#38bdf8' }} />
                    {!isCompactHeader && <span>{isEnglish ? 'Switch Child' : 'Đổi Hồ Sơ'}</span>}
                    <DownOutlined style={{ fontSize: 10, opacity: 0.8 }} />
                  </Button>
                </Dropdown>
              )}

              {/* BỘ CHUYỂN ĐỔI VAI TRÒ DÀNH CHO IT ADMIN KIỂM THỬ GIAO DIỆN (ADMIN ROLE SWITCHER - DIRECT MODAL TRIGGER) */}
              {(canImpersonateUsers || isImpersonating) && (
                <Button
                  size="small"
                  onClick={() => setIsUserSearchModalOpen(true)}
                  style={{
                    borderRadius: 8,
                    height: 32,
                    background: isImpersonating ? '#fa8c16' : 'rgba(255, 255, 255, 0.12)',
                    borderColor: isImpersonating ? '#d46b08' : 'rgba(255, 255, 255, 0.25)',
                    color: '#fff',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title={
                    isEnglish
                      ? 'Search & switch role / user test view'
                      : 'Tìm kiếm & đóng vai người dùng để kiểm thử'
                  }
                >
                  <SwapOutlined style={{ fontSize: 13, color: isImpersonating ? '#fff' : '#fbbf24' }} />
                  {!isCompactHeader && (
                    <span>
                      {isImpersonating
                        ? (isEnglish ? 'Test View' : 'Đang Xem Thử')
                        : (isEnglish ? 'Switch Role' : 'Đổi Vai Trò')}
                    </span>
                  )}
                </Button>
              )}

              <Button
                size="small"
                danger
                ghost
                icon={<LogoutOutlined />}
                onClick={() => {
                  logoutAccount();
                  if (isProductionErpDomain()) {
                    window.location.href = SITE_DOMAINS.LANDING_PRODUCTION;
                  } else {
                    navigate('/');
                  }
                }}
              >
                {language === 'en' ? 'Logout' : 'Đăng xuất'}
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      {/* BANNER CẢNH BÁO KHI ADMIN ĐANG XEM DƯỚI GÓC NHÌN VAI TRÒ KHÁC (ĐẶT NGOÀI SIDER ĐỂ FULL-WIDTH) */}
      {isImpersonating && (
        <div
          style={{
            background: 'linear-gradient(90deg, #ea580c, #f97316)',
            color: '#ffffff',
            padding: isMobile ? '8px 12px' : '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
            zIndex: 99,
          }}
        >
          <Space size={8}>
            <EyeOutlined style={{ fontSize: 16 }} />
            <span>
              {isEnglish
                ? `Viewing system as: ${currentUser.name} (${currentUser.roleLabel || currentUser.role}) [Original Admin: ${authenticatedUser?.name}]`
                : `Đang xem hệ thống dưới góc nhìn: ${currentUser.name} (${currentUser.roleLabel || currentUser.role}) [Tài khoản gốc: ${authenticatedUser?.name}]`}
            </span>
          </Space>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              exitImpersonation();
              message.success(isEnglish ? 'Returned to IT Admin' : 'Đã quay về quyền IT Admin');
            }}
            style={{
              borderRadius: 6,
              fontWeight: 700,
              height: 28,
              fontSize: 12,
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: 'none',
            }}
          >
            {isEnglish ? 'Exit Test View' : 'Thoát Chế Độ Xem'}
          </Button>
        </div>
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
                {isEnglish ? 'WORKSPACE MENU FOR' : 'MENU CÔNG VIỆC CỦA'}{' '}
                {isEnglish ? (currentRoleMeta.shortLabelEn || currentRoleMeta.shortLabel) : currentRoleMeta.shortLabel}{' '}
                ({currentUser.id || currentUser.code})
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
                <img
                  src="/resources/web/icon_core_ela.webp"
                  alt="LAK EDUCATION"
                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                />
                <Text strong>{t('appTitle')}</Text>
              </Space>
            }
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            width={280}
            footer={
              <div style={{ padding: '4px 0' }}>
                <Button
                  danger
                  type="primary"
                  block
                  icon={<LogoutOutlined />}
                  className="lak-mobile-drawer-logout-btn"
                  style={{
                    height: 42,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logoutAccount();
                    if (isProductionErpDomain()) {
                      window.location.href = SITE_DOMAINS.LANDING_PRODUCTION;
                    } else {
                      navigate('/');
                    }
                  }}
                >
                  {language === 'en' ? 'Logout Account' : 'Đăng Xuất Tài Khoản'}
                </Button>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  {APP_BUILD_VERSION_LABEL}
                </div>
              </div>
            }
          >
            <Card
              hoverable
              className="lak-mobile-drawer-profile-card"
              onClick={() => {
                setMobileDrawerOpen(false);
                setActiveTab('profile');
              }}
              style={{ marginBottom: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #cbd5e1', cursor: 'pointer' }}
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar
                  key={currentUser.avatar || currentUser.id}
                  src={DriveStorageService.formatAvatarUrl(currentUser.avatar, 100)}
                  icon={<UserOutlined />}
                  size={42}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text strong style={{ display: 'block', lineHeight: 1.25 }}>
                    {currentUser.name}
                  </Text>
                  <Tag
                    color={currentRoleMeta.color}
                    style={{
                      marginTop: 4,
                      marginRight: 0,
                      whiteSpace: 'normal',
                      lineHeight: '16px',
                      padding: '2px 6px',
                    }}
                  >
                    {localizedCurrentRoleLabel}
                  </Tag>
                  <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, marginTop: 4 }}>
                    {isEnglish ? 'View My Profile →' : 'Xem Hồ Sơ Cá Nhân →'}
                  </div>
                </div>
              </div>
            </Card>

            {/* DANH SÁCH HỒ SƠ LIÊN KẾT TRÊN MOBILE DRAWER */}
            {linkedProfiles && linkedProfiles.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  {isEnglish ? 'LINKED PROFILES / CHILDREN' : 'HỒ SƠ LIÊN KẾT / TÀI KHOẢN CON'}
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {linkedProfiles.map((p) => {
                    const pId = p.id || p.code;
                    const isActive = (currentUser.id || currentUser.code) === pId;
                    const roleColor = p.role === 'admin' ? 'red' : p.role === 'teacher' ? 'green' : p.role === 'student' ? 'blue' : 'gold';

                    return (
                      <div
                        key={pId}
                        onClick={() => {
                          if (!isActive) {
                            switchActiveProfile(pId);
                            setMobileDrawerOpen(false);
                            message.success(isEnglish ? `Switched to: ${p.name}` : `Đã chuyển sang: ${p.name}`);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: isActive ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                          background: isActive ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar size={28} src={DriveStorageService.formatAvatarUrl(p.avatar, 60)} icon={<UserOutlined />} />
                          <div>
                            <Text strong style={{ fontSize: 13, color: isActive ? '#0284c7' : '#1e293b' }}>{p.name}</Text>
                            {p.englishName && <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>({p.englishName})</Text>}
                          </div>
                        </div>
                        {isActive ? <CheckOutlined style={{ color: '#1890ff' }} /> : <SwapOutlined style={{ color: '#94a3b8' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
            <div>{t('footerText')}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {APP_BUILD_VERSION_LABEL}
            </div>
          </Footer>
        </Layout>
      </Layout>

      {/* MODAL TÌM KIẾM & ĐÓNG VAI TÀI KHOẢN NGƯỜI DÙNG THỰC TẾ (ADMIN IMPERSONATION) */}
      <AdminUserImpersonationModal
        open={isUserSearchModalOpen}
        onClose={() => setIsUserSearchModalOpen(false)}
        users={impersonationUserList}
        currentUser={currentUser}
        authenticatedUser={authenticatedUser}
        isImpersonating={isImpersonating}
        onImpersonate={(targetUser) => {
          impersonateAccount(targetUser);
          message.success(
            isEnglish
              ? `Viewing system as: ${targetUser.name} (${targetUser.roleLabel || targetUser.role})`
              : `Đang xem hệ thống dưới danh nghĩa: ${targetUser.name} (${targetUser.roleLabel || targetUser.role})`
          );
        }}
        onExitImpersonation={() => {
          exitImpersonation();
          message.success(isEnglish ? 'Returned to IT Admin' : 'Đã quay về quyền IT Admin');
        }}
      />
    </Layout>
  );
};
