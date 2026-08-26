import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer, Tag, Dropdown, Avatar, Space, Typography, Card } from 'antd';
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
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content, Sider, Footer } = Layout;
const { Text, Title } = Typography;

export const AppLayout = ({ activeTab, setActiveTab, children }) => {
  const { currentUser, switchRole, MOCK_USERS } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter menu items based on role
  const getMenuItems = () => {
    const role = currentUser.role;

    const items = [
      { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng Quan Dashboard' },
    ];

    if (role === 'admin' || role === 'teacher') {
      items.push({ key: 'contracts', icon: <FileTextOutlined />, label: 'Hợp Đồng & Tính Lương' });
    }

    items.push({ key: 'timetable', icon: <CalendarOutlined />, label: 'Thời Khóa Biểu' });
    items.push({ key: 'classes', icon: <TeamOutlined />, label: 'Lớp Học & Điểm Danh' });

    if (role === 'admin' || role === 'student') {
      items.push({ key: 'tuition', icon: <DollarOutlined />, label: 'Quản Lý Học Phí' });
    }

    return items;
  };

  const roleTagColors = {
    admin: 'magenta',
    teacher: 'blue',
    student: 'green',
  };

  const roleMenuOptions = [
    {
      key: 'admin',
      label: (
        <Space>
          <Tag color="magenta">Admin</Tag>
          <Text strong>Quản trị viên (Super Admin)</Text>
        </Space>
      ),
      onClick: () => switchRole('admin'),
    },
    {
      key: 'teacher',
      label: (
        <Space>
          <Tag color="blue">Teacher</Tag>
          <Text strong>Giáo viên (Nguyễn Văn Hùng)</Text>
        </Space>
      ),
      onClick: () => switchRole('teacher'),
    },
    {
      key: 'student',
      label: (
        <Space>
          <Tag color="green">Student</Tag>
          <Text strong>Học viên (Lê Anh Khoa)</Text>
        </Space>
      ),
      onClick: () => switchRole('student'),
    },
  ];

  const handleMenuClick = (e) => {
    setActiveTab(e.key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Top Header */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 24px',
          background: '#001529',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#fff', fontSize: 18 }} />}
              onClick={() => setMobileDrawerOpen(true)}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
              ThiEducation
            </Title>
          </div>
        </div>

        {/* User Profile & Role Switcher */}
        <Space size={isMobile ? 8 : 16}>
          <Dropdown menu={{ items: roleMenuOptions }} trigger={['click']}>
            <Button
              type="primary"
              ghost
              size={isMobile ? 'small' : 'middle'}
              icon={<SwapOutlined />}
              style={{ borderRadius: 6 }}
            >
              {!isMobile && 'Role Demo: '}
              <Tag color={roleTagColors[currentUser.role]} style={{ margin: 0 }}>
                {currentUser.role.toUpperCase()}
              </Tag>
            </Button>
          </Dropdown>

          {!isMobile && (
            <Space style={{ color: '#fff' }}>
              <Avatar src={currentUser.avatar} icon={<UserOutlined />} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <Text style={{ color: '#fff', fontWeight: 600 }}>{currentUser.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{currentUser.roleLabel}</Text>
              </div>
            </Space>
          )}
        </Space>
      </Header>

      <Layout>
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
          <Sider
            width={240}
            style={{
              background: '#fff',
              boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
              zIndex: 1,
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                DANH MỤC QUẢN LÝ
              </Text>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={handleMenuClick}
              style={{ borderRight: 0, padding: '8px 0' }}
              items={getMenuItems()}
            />
          </Sider>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <Drawer
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <Text strong>ThiEducation Menu</Text>
              </Space>
            }
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            width={260}
          >
            <Card style={{ marginBottom: 16, background: '#fafafa' }} bodyStyle={{ padding: 12 }}>
              <Space align="center">
                <Avatar src={currentUser.avatar} size={40} />
                <div>
                  <Text strong style={{ display: 'block' }}>{currentUser.name}</Text>
                  <Tag color={roleTagColors[currentUser.role]}>{currentUser.roleLabel}</Tag>
                </div>
              </Space>
            </Card>

            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
              items={getMenuItems()}
            />
          </Drawer>
        )}

        {/* Main Content Area */}
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

          {/* Footer */}
          <Footer style={{ textAlign: 'center', color: '#8c8c8c', padding: '16px 0 0 0', fontSize: 13 }}>
            ThiEducation ERP ©2026 — Quản lý 520 Học viên & 68 Cán bộ/Giáo viên
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};
