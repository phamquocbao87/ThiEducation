import React from 'react';
import {
  Drawer,
  Timeline,
  Tag,
  Typography,
  Space,
  Empty,
  Spin,
  Badge,
  Card,
} from 'antd';
import {
  UserAddOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EditOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { AUDIT_ACTIONS, ROLE_COLORS } from '../models/user.model';

const { Text, Title } = Typography;

export const UserAuditLogDrawer = ({
  open,
  onClose,
  auditLogs = [],
  loading = false,
}) => {
  const getActionIcon = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.CREATE_USER:
        return <UserAddOutlined style={{ fontSize: 16, color: '#1890ff' }} />;
      case AUDIT_ACTIONS.ACTIVATE_USER:
        return <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />;
      case AUDIT_ACTIONS.DISABLE_USER:
        return <StopOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />;
      case AUDIT_ACTIONS.UPDATE_USER:
        return <EditOutlined style={{ fontSize: 16, color: '#faad14' }} />;
      case AUDIT_ACTIONS.DELETE_USER:
        return <StopOutlined style={{ fontSize: 16, color: '#f5222d' }} />;
      case AUDIT_ACTIONS.LOGIN_SUCCESS:
        return <SafetyCertificateOutlined style={{ fontSize: 16, color: '#13c2c2' }} />;
      case AUDIT_ACTIONS.LOGIN_REJECTED:
        return <StopOutlined style={{ fontSize: 16, color: '#eb2f96' }} />;
      default:
        return <ClockCircleOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.CREATE_USER:
        return 'blue';
      case AUDIT_ACTIONS.ACTIVATE_USER:
        return 'green';
      case AUDIT_ACTIONS.DISABLE_USER:
        return 'red';
      case AUDIT_ACTIONS.UPDATE_USER:
        return 'gold';
      case AUDIT_ACTIONS.DELETE_USER:
        return 'red';
      case AUDIT_ACTIONS.LOGIN_SUCCESS:
        return 'cyan';
      case AUDIT_ACTIONS.LOGIN_REJECTED:
        return 'magenta';
      default:
        return 'default';
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <span>Nhật Ký Kiểm Toán & Phân Quyền (Audit Logs)</span>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Ghi nhận toàn bộ thao tác Tạo mới, Cập nhật thông tin, Kích hoạt và Vô hiệu hóa tài khoản trong hệ thống.
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="Đang tải nhật ký kiểm toán..." />
        </div>
      ) : auditLogs.length === 0 ? (
        <Empty description="Chưa có nhật ký thao tác nào" />
      ) : (
        <Timeline
          items={auditLogs.map((log) => ({
            dot: getActionIcon(log.action),
            children: (
              <Card
                size="small"
                style={{
                  marginBottom: 12,
                  borderRadius: 8,
                  borderColor: '#e8e8e8',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Tag color={getActionColor(log.action)} style={{ fontWeight: 600 }}>
                    {log.actionLabel || log.action}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </div>

                <Text style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                  {log.description}
                </Text>

                <div
                  style={{
                    backgroundColor: '#fafafa',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Space size={4}>
                    <Text type="secondary">Người thực hiện:</Text>
                    <Tag color={ROLE_COLORS[log.actor?.role] || 'blue'}>
                      {log.actor?.name || log.actor?.code}
                    </Tag>
                  </Space>
                  <Space size={4}>
                    <Text type="secondary">Mục tiêu:</Text>
                    <Text strong>{log.target?.code || log.target?.name}</Text>
                  </Space>
                </div>
              </Card>
            ),
          }))}
        />
      )}
    </Drawer>
  );
};

