import React from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ApiOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { ZOOM_ROUTING_MODES, ZOOM_ROUTING_MODE_META } from '../models/zoomSync.model';

const { Text } = Typography;

export const ZoomEnvRouterCard = ({
  currentEnv,
  statusData,
  loading,
  saving,
  onRefresh,
  onUpdateRouter,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  const routerCfg = statusData?.routerConfig || {
    routingMode: ZOOM_ROUTING_MODES.DEV_ONLY,
    writeToDev: true,
    writeToProd: false,
    earlyLeaveThresholdMinutes: 10,
    autoTrashZoomCloudAfterDays: 7,
  };

  const activeMode = routerCfg.routingMode || ZOOM_ROUTING_MODES.DEV_ONLY;
  const modeMeta = ZOOM_ROUTING_MODE_META[activeMode] || ZOOM_ROUTING_MODE_META.DEV_ONLY;
  const owner = statusData?.zoomOwner;

  const handleSelectMode = (nextMode) => {
    if (nextMode === activeMode) return;
    onUpdateRouter?.({ routingMode: nextMode });
  };

  return (
    <Card
      variant="borderless"
      data-testid="zoom-env-router-card"
      style={{
        borderRadius: 12,
        marginBottom: 16,
        border: activeMode === 'DEV_ONLY' ? '1.5px solid #86efac' : '1.5px solid #93c5fd',
        background: activeMode === 'DEV_ONLY' ? '#f0fdf4' : '#eff6ff',
      }}
    >
      <Row gutter={[16, 12]} align="middle" justify="space-between">
        <Col xs={24} lg={13}>
          <Space size={8} wrap style={{ marginBottom: 6 }}>
            <SwapOutlined style={{ color: '#2563eb', fontSize: 18 }} />
            <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
              {isEnglish
                ? '1-Zoom-Account Environment Router (DEV ↔ PROD Switch)'
                : 'Công Tắc Điều Hướng 1 Tài Khoản Zoom (Test DEV ↔ Chuyển PROD)'}
            </Text>
            <Tag color={modeMeta.color} style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
              {isEnglish ? modeMeta.labelEn : modeMeta.labelVi}
            </Tag>
          </Space>

          <Text type="secondary" style={{ display: 'block', fontSize: 12.5 }}>
            {isEnglish ? modeMeta.descEn : modeMeta.descVi}
          </Text>

          {owner && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Tag icon={<CheckCircleFilled />} color="cyan" style={{ margin: 0, borderRadius: 6 }}>
                Zoom Business: {owner.email} (#{owner.accountNumber})
              </Tag>
              <Tag icon={<ApiOutlined />} color="geekblue" style={{ margin: 0, borderRadius: 6 }}>
                {isEnglish ? 'Current Portal DB:' : 'Cổng Web đang mở:'}{' '}
                <strong>{currentEnv === 'dev' ? 'DEV (lakeducation-dev)' : 'PROD (lakeducation)'}</strong>
              </Tag>
            </div>
          )}
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
                  { val: 'DEV_ONLY', label: isEnglish ? '🧪 DEV Only (Safe)' : '🧪 Chỉ Ghi DEV (An toàn)' },
                  { val: 'DUAL_MIRROR', label: isEnglish ? '🔁 Dual (DEV + PROD)' : '🔁 Song Song DEV + PROD' },
                  { val: 'PROD_ONLY', label: isEnglish ? '🚀 PROD Live' : '🚀 Chuyển Hẳn PROD' },
                ].map((opt) => (
                  <Button
                    key={opt.val}
                    type={activeMode === opt.val ? 'primary' : 'default'}
                    loading={saving}
                    onClick={() => handleSelectMode(opt.val)}
                    data-testid={`btn-router-mode-${opt.val}`}
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
                data-testid="segmented-zoom-router-mode"
                onChange={(val) => {
                  if (val === 'PROD_ONLY' || val === 'DUAL_MIRROR') {
                    handleSelectMode(val);
                  } else {
                    handleSelectMode(val);
                  }
                }}
                options={[
                  { value: 'DEV_ONLY', label: isEnglish ? '🧪 DEV Only' : '🧪 Chỉ Ghi DEV' },
                  { value: 'DUAL_MIRROR', label: isEnglish ? '🔁 DEV + PROD' : '🔁 Cả DEV & PROD' },
                  { value: 'PROD_ONLY', label: isEnglish ? '🚀 PROD Live' : '🚀 Ghi PROD' },
                ]}
              />
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <Space size={4}>
                <SafetyCertificateOutlined style={{ color: '#059669' }} />
                <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {isEnglish ? 'Early-leave alert cutoff:' : 'Báo chuông rời lớp trước giờ tan:'}
                </Text>
                <InputNumber
                  min={0}
                  max={60}
                  size="small"
                  value={routerCfg.earlyLeaveThresholdMinutes}
                  onChange={(v) => {
                    if (typeof v === 'number') {
                      onUpdateRouter?.({ earlyLeaveThresholdMinutes: v });
                    }
                  }}
                  style={{ width: 64 }}
                />
                <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {isEnglish ? 'min' : 'phút'}
                </Text>
              </Space>

              <Popconfirm
                title={
                  isEnglish
                    ? 'Reload live Zoom rooms and router state?'
                    : 'Làm mới danh sách phòng Zoom & trạng thái Router?'
                }
                onConfirm={onRefresh}
                okText={isEnglish ? 'Refresh' : 'Làm mới'}
                cancelText={isEnglish ? 'Cancel' : 'Huỷ'}
              >
                <Button
                  size="small"
                  icon={<ReloadOutlined spin={loading} />}
                  data-testid="btn-refresh-zoom-overview"
                  style={{ minHeight: isMobile ? 38 : 30, borderRadius: 6 }}
                >
                  {isEnglish ? 'Refresh' : 'Làm mới'}
                </Button>
              </Popconfirm>
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
              ? 'Safe DEV Testing Active: Production database (lakeducation) is 100% write-locked while you test.'
              : 'Chốt Khóa An Toàn Đang Bật: Mọi thử nghiệm tạo liên kết, kéo bù video và cảnh báo rời lớp hiện chỉ ghi vào DEV (lakeducation-dev), tuyệt đối không chạm vào Production.'
          }
        />
      )}
    </Card>
  );
};
