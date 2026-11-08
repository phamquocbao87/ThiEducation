import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Result, Button, Card, Typography, Space } from 'antd';
import { LockOutlined, ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { PermissionService } from '../services/PermissionService';
import { ROLE_DEFAULT_ERP_ROUTE } from '../config/siteConfig';

const { Text, Title } = Typography;

/**
 * Universal Security Route Guard for LAK EDUCATION ERP (lakeducation.com)
 *
 * 🛡️ 2 Tầng bảo mật cốt lõi:
 * 1. Authentication Guard: Chưa đăng nhập -> Chặn truy cập và chuyển hướng về /?require_login=true
 * 2. Role Authorization Guard (RBAC): Đã đăng nhập nhưng Role không có quyền truy cập moduleKey
 *    -> Hiển thị màn hình 403 Forbidden kèm nút quay về Dashboard đúng vai trò.
 */
export const ProtectedRoute = ({ moduleKey, children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. TẦNG 1: KIỂM TRA ĐĂNG NHẬP (Authentication Guard)
  if (!isAuthenticated || !currentUser) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?require_login=true&redirect=${redirectParam}`} replace />;
  }

  // 2. TẦNG 2: KIỂM TRA PHÂN QUYỀN VAI TRÒ (Role-Based Authorization Guard)
  if (moduleKey && !PermissionService.canAccessModule(currentUser.role, moduleKey)) {
    const defaultRouteSlug = ROLE_DEFAULT_ERP_ROUTE[currentUser.role] || 'dashboard';

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          padding: '24px 16px',
        }}
      >
        <Card
          style={{
            maxWidth: 580,
            width: '100%',
            borderRadius: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          <Result
            status="403"
            title={
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ff4d4f' }}>
                403 — Không Có Quyền Truy Cập
              </span>
            }
            subTitle={
              <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
                <Text style={{ fontSize: 14 }}>
                  Tài khoản của bạn: <strong>{currentUser.name}</strong> ({currentUser.email || currentUser.id})
                </Text>
                <div>
                  <Text type="secondary">Vai trò hiện tại: </Text>
                  <span
                    style={{
                      backgroundColor: '#fff1f0',
                      color: '#cf1322',
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontWeight: 700,
                      border: '1px solid #ffa39e',
                      fontSize: 12,
                    }}
                  >
                    {currentUser.roleLabel || currentUser.role.toUpperCase()}
                  </span>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                  Phân hệ này được thiết lập bảo mật chỉ dành cho các vai trò được cấp phép.
                  Vui lòng quay lại không gian làm việc được phân công của bạn.
                </Text>
              </Space>
            }
            extra={
              <Space size={12}>
                <Button
                  type="primary"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(`/${defaultRouteSlug}`)}
                  style={{
                    borderRadius: 8,
                    height: 40,
                    fontWeight: 600,
                    backgroundColor: '#1890ff',
                  }}
                >
                  Quay Về Màn Hình Của Bạn
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  return children;
};

