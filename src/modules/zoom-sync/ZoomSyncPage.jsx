import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Badge, Space, Tabs, Tag, Typography } from 'antd';
import {
  CloudSyncOutlined,
  LinkOutlined,
  RadarChartOutlined,
  SettingOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { PermissionService } from '../../core/services/PermissionService';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../../shared/hooks/useIsMobile';
import { useZoomSyncController } from './hooks/useZoomSyncController';
import { ZoomEnvRouterCard } from './components/ZoomEnvRouterCard';
import { ZoomClassMappingPanel } from './components/ZoomClassMappingPanel';
import { ZoomBackfillMigrationPanel } from './components/ZoomBackfillMigrationPanel';
import { ZoomLiveMonitorPanel } from './components/ZoomLiveMonitorPanel';

const { Title, Text } = Typography;

export const ZoomSyncPage = () => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const isAdminOnly = PermissionService.canManageZoomRouterSettings(currentUser?.role);

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab === 'settings' && isAdminOnly) return 'settings';
    if (urlTab === 'backfill' || urlTab === 'live') return urlTab;
    return 'mapping';
  });

  useEffect(() => {
    if (!isAdminOnly && activeTab === 'settings') {
      setActiveTab('mapping');
    } else if (urlTab === 'settings' && isAdminOnly) {
      setActiveTab('settings');
    }
  }, [isAdminOnly, urlTab, activeTab]);

  const ctrl = useZoomSyncController();

  const missingCount = ctrl.auditItems.filter(
    (x) => x.syncStatus === 'MISSING_NEEDS_SYNC'
  ).length;

  const tabItems = [
    {
      key: 'mapping',
      label: (
        <span data-testid="tab-zoom-mapping">
          <LinkOutlined />{' '}
          {isMobile
            ? isEnglish
              ? 'Classes'
              : 'Lớp Học'
            : isEnglish
            ? 'Class Link Overview'
            : 'Liên Kết Lớp'}
        </span>
      ),
      children: (
        <ZoomClassMappingPanel
          suggestions={ctrl.suggestions}
          loading={ctrl.loadingMappings}
        />
      ),
    },
    {
      key: 'backfill',
      label: (
        <Space size={4} data-testid="tab-zoom-backfill">
          <CloudSyncOutlined />
          <span>
            {isMobile
              ? isEnglish
                ? 'Sync'
                : 'Video'
              : isEnglish
              ? 'Recording Sync'
              : 'Kéo Bù Video'}
          </span>
          {missingCount > 0 && <Badge count={missingCount} size="small" />}
        </Space>
      ),
      children: (
        <ZoomBackfillMigrationPanel
          auditItems={ctrl.auditItems}
          suggestions={ctrl.suggestions}
          activeJobsBySlotKey={ctrl.activeJobsBySlotKey}
          loading={ctrl.loadingAudit}
          syncing={ctrl.syncingBackfill}
          onRefreshAudit={ctrl.loadMissingAudit}
          onRunBackfill={ctrl.handleRunBackfill}
        />
      ),
    },
    {
      key: 'live',
      label: (
        <span data-testid="tab-zoom-live-monitor">
          <RadarChartOutlined />{' '}
          {isMobile
            ? 'Live'
            : isEnglish
            ? 'Live Guard'
            : 'Giám Sát Live'}
        </span>
      ),
      children: (
        <ZoomLiveMonitorPanel
          currentEnv={ctrl.currentEnv}
          liveClasses={ctrl.liveClasses}
          simulating={ctrl.simulatingLeave}
          onSimulateEarlyLeave={ctrl.handleSimulateEarlyLeave}
        />
      ),
    },
    ...(isAdminOnly
      ? [
          {
            key: 'settings',
            label: (
              <span data-testid="tab-zoom-settings">
                <SettingOutlined />{' '}
                {isMobile
                  ? isEnglish
                    ? 'Config'
                    : 'Cài đặt'
                  : isEnglish
                  ? 'Settings (Admin)'
                  : 'Cài Đặt'}
              </span>
            ),
            children: (
              <div data-testid="zoom-admin-settings-panel" style={{ marginTop: 4 }}>
                <ZoomEnvRouterCard
                  currentEnv={ctrl.currentEnv}
                  statusData={ctrl.statusData}
                  loading={ctrl.loadingStatus}
                  saving={ctrl.savingRouter}
                  onRefresh={ctrl.loadAllOverview}
                  onUpdateRouter={ctrl.handleUpdateRouterConfig}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div data-testid="zoom-sync-module-page" style={{ paddingBottom: 24 }}>
      {/* Header Phân Hệ Độc Lập */}
      <div style={{ marginBottom: 16 }}>
        <Space size={10} wrap align="center">
          <VideoCameraOutlined style={{ fontSize: 24, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
            {isEnglish
              ? 'Zoom Class Integration & Cloud Recording Sync'
              : 'Phân Hệ Liên Kết Lớp Học & Đồng Bộ Zoom Cloud'}
          </Title>
          <Tag color="blue" style={{ fontWeight: 600, borderRadius: 6, margin: 0 }}>
            Isolated Module • Zero Breaking Change
          </Tag>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
          {isEnglish
            ? 'Centralized Zoom Cloud recording backfill, live student early-leave guard, and class link overview.'
            : 'Trung tâm kéo bù video ghi hình từ Zoom Cloud, giám sát học viên rời phòng giữa giờ và tổng quan liên kết lớp.'}
        </Text>
      </div>

      {ctrl.apiError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 14, borderRadius: 8 }}
          title={isEnglish ? 'Zoom Backend Service Notice' : 'Thông báo kết nối dịch vụ lakZoomApi'}
          description={ctrl.apiError}
        />
      )}

      {/* Tabs Nghiệp Vụ Tinh Gọn (Tab Cài Đặt chỉ hiển thị duy nhất cho IT Admin!) */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarGutter={isMobile ? 8 : 20}
        items={tabItems}
      />
    </div>
  );
};
