import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ApiOutlined,
  BellOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { ZoomBackendGateway } from '../services/ZoomBackendGateway';

const { Text } = Typography;

const MODE_META = {
  DEV_ONLY: {
    color: 'green',
    labelVi: '🧪 Chỉ Ghi DEV (An toàn 100%)',
    labelEn: '🧪 DEV Only (100% Safe)',
    descVi:
      'Mọi Webhook từ Zoom và thao tác đồng bộ chỉ đổ vào database lakeducation-dev. Database Production được khóa bảo vệ tuyệt đối.',
    descEn:
      'All Zoom webhooks and sync actions write strictly to lakeducation-dev. Production database is locked.',
  },
  DUAL_MIRROR: {
    color: 'geekblue',
    labelVi: '🔁 Ghi Kép DEV + PROD (Dùng chung 1 File Drive)',
    labelEn: '🔁 Dual Mirror DEV + PROD (Shared 1 Drive File)',
    descVi:
      'Ghi đồng thời trạng thái Live & metadata vào cả DEV và PROD; file video .MP4 chỉ tải lên Google Drive 1 lần duy nhất dùng chung đường dẫn.',
    descEn:
      'Mirrors live state & metadata to both DEV and PROD while storing each .MP4 only once on Google Drive.',
  },
  PROD_ONLY: {
    color: 'blue',
    labelVi: '🚀 Chỉ Ghi PROD (Vận hành chính thức)',
    labelEn: '🚀 PROD Only (Live Production)',
    descVi:
      'Chế độ vận hành chính thức: mọi bản ghi Cloud và cảnh báo rời lớp từ Zoom đẩy thẳng vào lakeducation (PROD).',
    descEn:
      'Production mode: all Zoom Cloud recordings and early-leave alerts write directly to lakeducation (PROD).',
  },
};

/**
 * Khối Cài Đặt Điều Hướng 1 Tài Khoản Zoom (DEV <-> PROD) & Dùng Chung 1 File Google Drive:
 * Đặt độc quyền trong bảng Quản Trị Hệ Thống của IT Admin (/dashboard -> AdminSystemHealthPanel).
 */
export const AdminZoomRouterConfigCard = () => {
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  const actorId = currentUser?.id || currentUser?.code || 'ADM001';
  const actorRole = currentUser?.role || '';
  const currentEnv = ZoomBackendGateway.getCurrentTargetEnv();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [statusData, setStatusData] = useState(null);

  const loadRouterStatus = useCallback(async () => {
    if (actorRole !== 'admin') return;
    setLoading(true);
    try {
      const res = await ZoomBackendGateway.call('/status', {
        method: 'GET',
        actorId,
        actorRole,
      });
      setStatusData(res.data || null);
    } catch {
      // Giữ yên lặng nếu mất mạng tạm thời
    } finally {
      setLoading(false);
    }
  }, [actorId, actorRole]);

  useEffect(() => {
    loadRouterStatus();
  }, [loadRouterStatus]);

  if (actorRole !== 'admin') {
    return null;
  }

  const routerCfg = statusData?.routerConfig || {
    routingMode: 'DEV_ONLY',
    earlyLeaveThresholdMinutes: 10,
  };
  const activeMode = routerCfg.routingMode || 'DEV_ONLY';
  const meta = MODE_META[activeMode] || MODE_META.DEV_ONLY;
  const owner = statusData?.zoomOwner;

  const handleUpdateRouter = async (patch) => {
    setSaving(true);
    try {
      const res = await ZoomBackendGateway.call('/router-config', {
        method: 'POST',
        actorId,
        actorRole,
        body: { ...patch, actorId, actorRole },
      });
      setStatusData((prev) => (prev ? { ...prev, routerConfig: res.data } : { routerConfig: res.data }));
      message.success(
        isEnglish
          ? 'Updated Zoom Environment Router configuration!'
          : 'Đã cập nhật cấu hình Công tắc Điều hướng Zoom Cloud!'
      );
    } catch (err) {
      message.error(err?.message || 'Không thể cập nhật cấu hình Router.');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateLeaveOnDev = async () => {
    setSimulating(true);
    try {
      await ZoomBackendGateway.call('/simulate-early-leave-dev', {
        method: 'POST',
        targetEnv: 'dev',
        actorId,
        actorRole,
        body: { classId: 'LH004', studentZoomName: 'KENJI< PHÚ QUÝ>' },
      });
      message.success(
        isEnglish
          ? 'Simulated student early-leave alert on DEV! Check the top-right notification bell.'
          : 'Đã bắn thử cảnh báo học sinh rời phòng Zoom trên DEV! Kiểm tra chuông thông báo góc phải.'
      );
    } catch (err) {
      message.error(err?.message || 'Lỗi giả lập thông báo.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Card
      data-testid="admin-dashboard-zoom-router-card"
      style={{
        marginTop: isMobile ? 12 : 20,
        borderRadius: 12,
        border: activeMode === 'DEV_ONLY' ? '1.5px solid #86efac' : '1.5px solid #93c5fd',
        background: activeMode === 'DEV_ONLY' ? '#f0fdf4' : '#eff6ff',
      }}
      styles={{ body: { padding: isMobile ? '12px' : '18px 22px' } }}
      title={
        <Space wrap size={6}>
          <SwapOutlined style={{ color: '#2563eb' }} />
          <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
            {isEnglish
              ? 'Zoom Cloud Router (DEV ↔ PROD • Shared 1 Drive File)'
              : 'Công Tắc Điều Hướng 1 Tài Khoản Zoom (DEV ↔ PROD • 1 File Drive Chung)'}
          </Text>
          <Tag color="red" style={{ margin: 0, fontWeight: 700, borderRadius: 5 }}>
            IT ADMIN ONLY
          </Tag>
        </Space>
      }
      extra={
        <Button
          size="small"
          icon={<ReloadOutlined spin={loading} />}
          onClick={loadRouterStatus}
          style={{ borderRadius: 6 }}
        >
          {isEnglish ? 'Refresh' : 'Làm mới'}
        </Button>
      }
    >
      <Row gutter={[16, 12]} align="middle" justify="space-between">
        <Col xs={24} lg={13}>
          <Space size={6} wrap style={{ marginBottom: 6 }}>
            <Tag color={meta.color} style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
              {isEnglish ? meta.labelEn : meta.labelVi}
            </Tag>
            <Tag icon={<CloudServerOutlined />} color="purple" style={{ margin: 0, borderRadius: 6 }}>
              {isEnglish ? 'Write-Once Shared Google Drive' : 'Lưu 1 Lần Dùng Chung Drive'}
            </Tag>
          </Space>

          <Text type="secondary" style={{ display: 'block', fontSize: 12.5 }}>
            {isEnglish ? meta.descEn : meta.descVi}
          </Text>

          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {owner && (
              <Tag icon={<CheckCircleFilled />} color="cyan" style={{ margin: 0, borderRadius: 6 }}>
                Zoom Business: {owner.email} (#{owner.accountNumber})
              </Tag>
            )}
            <Tag icon={<ApiOutlined />} color="geekblue" style={{ margin: 0, borderRadius: 6 }}>
              {isEnglish ? 'Current Portal DB:' : 'Cổng Web đang mở:'}{' '}
              <strong>{currentEnv === 'dev' ? 'DEV (lakeducation-dev)' : 'PROD (lakeducation)'}</strong>
            </Tag>
          </div>
        </Col>

        <Col xs={24} lg={11}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignItems: isMobile ? 'stretch' : 'flex-end',
            }}
          >
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {[
                  { val: 'DEV_ONLY', label: isEnglish ? '🧪 DEV Only (Safe)' : '🧪 Chỉ Ghi DEV' },
                  { val: 'DUAL_MIRROR', label: isEnglish ? '🔁 Dual (DEV + PROD)' : '🔁 Cả DEV & PROD' },
                  { val: 'PROD_ONLY', label: isEnglish ? '🚀 PROD Live' : '🚀 Chỉ Ghi PROD' },
                ].map((opt) => (
                  <Button
                    key={opt.val}
                    type={activeMode === opt.val ? 'primary' : 'default'}
                    loading={saving}
                    onClick={() => opt.val !== activeMode && handleUpdateRouter({ routingMode: opt.val })}
                    data-testid={`btn-admin-router-${opt.val}`}
                    style={{ width: '100%', minHeight: 40, borderRadius: 8, fontWeight: 600 }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            ) : (
              <Segmented
                value={activeMode}
                disabled={saving}
                data-testid="segmented-admin-zoom-router"
                onChange={(val) => val !== activeMode && handleUpdateRouter({ routingMode: val })}
                options={[
                  { value: 'DEV_ONLY', label: isEnglish ? '🧪 DEV Only' : '🧪 Chỉ Ghi DEV' },
                  { value: 'DUAL_MIRROR', label: isEnglish ? '🔁 DEV + PROD' : '🔁 Cả DEV & PROD' },
                  { value: 'PROD_ONLY', label: isEnglish ? '🚀 PROD Live' : '🚀 Chỉ Ghi PROD' },
                ]}
              />
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <Space size={4}>
                <SafetyCertificateOutlined style={{ color: '#059669' }} />
                <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {isEnglish ? 'Early-leave cutoff:' : 'Báo chuông rời lớp trước giờ tan:'}
                </Text>
                <InputNumber
                  min={0}
                  max={60}
                  size="small"
                  value={routerCfg.earlyLeaveThresholdMinutes}
                  onChange={(v) => {
                    if (typeof v === 'number') {
                      handleUpdateRouter({ earlyLeaveThresholdMinutes: v });
                    }
                  }}
                  style={{ width: 62 }}
                />
                <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {isEnglish ? 'min' : 'phút'}
                </Text>
              </Space>

              {currentEnv === 'dev' && (
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  loading={simulating}
                  data-testid="btn-admin-test-early-leave"
                  onClick={handleSimulateLeaveOnDev}
                  style={{ borderRadius: 6, minHeight: isMobile ? 38 : 28 }}
                >
                  {isEnglish ? 'Test Bell (DEV)' : 'Test Chuông (DEV)'}
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {activeMode === 'DEV_ONLY' && (
        <Alert
          type="success"
          showIcon
          style={{ marginTop: 10, borderRadius: 8 }}
          title={
            isEnglish
              ? 'Safe DEV Lock Active: Production DB is protected. Deleting any recording on DEV will NOT trash shared Google Drive files.'
              : 'Chốt Khóa An Toàn Đang Bật: Production được khóa bảo vệ; xóa thử video trên DEV cũng KHÔNG xóa file vật lý dùng chung trên Google Drive.'
          }
        />
      )}
    </Card>
  );
};

export default AdminZoomRouterConfigCard;
