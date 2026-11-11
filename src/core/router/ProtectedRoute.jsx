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

  // 1. TẦNG 1: KIỂM TRA ĐĂNG NHẬP TẬP TRUNG (Centralized Authentication Guard)
  // Kiểm tra đồng thời cả state React và khóa phiên trong localStorage để chống giả mạo hoặc rỗng phiên
  const hasStoredSession =
    typeof window !== 'undefined' &&
    Boolean(
      localStorage.getItem('lak_authenticated_user_id') ||
        localStorage.getItem('lak_erp_auth_user') ||
        new URLSearchParams(window.location.search).get('sso_uid')
    );

  if (!isAuthenticated || !currentUser || !hasStoredSession) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?require_login=true&redirect=${redirectParam}`} replace />;
  }

  // 2. TẦNG 2: KIỂM TRA PHÂN QUYỀN VAI TRÒ TẬP TRUNG THEO MODULE & ROUTE PATH (Centralized RBAC Guard)
  const routeCheck = PermissionService.canAccessRoutePath(
    currentUser.role,
    location.pathname,
    location.search
  );
  const isModuleAllowed = moduleKey
    ? PermissionService.canAccessModule(currentUser.role, moduleKey)
    : true;

  if (!isModuleAllowed || !routeCheck.allowed) {
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
                403 Not Found
              </span>
            }
            subTitle={
              <Text type="secondary" style={{ fontSize: 14 }}>
                Trang bạn yêu cầu không tồn tại hoặc bạn không có quyền truy cập.
              </Text>
            }
            extra={
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
                Quay Lại
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return children;
};

