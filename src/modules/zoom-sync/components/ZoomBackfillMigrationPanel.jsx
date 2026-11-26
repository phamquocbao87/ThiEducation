import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CloudDownloadOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { ZoomSlotSyncingBanner } from '../../../shared/components/ZoomRecordingSourceBadge';
import { ZOOM_AUDIT_STATUS_META } from '../models/zoomSync.model';

const { Text } = Typography;

function formatBytesMb(bytes = 0) {
  const mb = Number(bytes || 0) / (1024 * 1024);
  if (mb < 1) return `${Math.round(Number(bytes || 0) / 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Yêu cầu #8, #9, #10: Bảng đối soát & Kéo bù (Migration / Backfill) toàn bộ các buổi học
 * còn thiếu trên LAK Education từ kho Zoom Cloud, kèm gán lớp cho phòng lạ.
 */
export const ZoomBackfillMigrationPanel = ({
  auditItems = [],
  suggestions = [],
  activeJobsBySlotKey,
  loading = false,
  syncing = false,
  onRefreshAudit,
  onRunBackfill,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const [showShortFragments, setShowShortFragments] = useState(false);
  const [manualClassAssign, setManualClassAssign] = useState({});

  const filteredItems = useMemo(
    () =>
      auditItems.filter((it) =>
        showShortFragments ? true : it.syncStatus !== 'SKIPPED_SHORT_FRAGMENT'
      ),
    [auditItems, showShortFragments]
  );

  const missingUuids = useMemo(
    () =>
      auditItems
        .filter((it) => it.syncStatus === 'MISSING_NEEDS_SYNC')
        .map((it) => it.zoomMeetingUuid),
    [auditItems]
  );

  const columns = [
    {
      title: isEnglish ? 'Session Date & Duration' : 'Ngày Học & Thời Lượng',
      key: 'date',
      width: 175,
      render: (_, row) => (
        <div>
          <Text strong style={{ display: 'block', whiteSpace: 'nowrap', color: '#0f172a' }}>
            📅 {row.dmyDate}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            ⏱️ {row.durationMinutes} {isEnglish ? 'min' : 'phút'} • {formatBytesMb(row.totalMp4Bytes)}
          </Text>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Zoom Room & Matched LAK Class' : 'Phòng Zoom & Lớp Học LAK Khớp',
      key: 'class',
      render: (_, row) => (
        <div style={{ minWidth: 210 }}>
          <Text strong style={{ display: 'block', fontSize: 13.5 }}>
            {row.topic}
          </Text>
          <Space size={6} wrap style={{ marginTop: 3 }}>
            <Tag style={{ margin: 0, borderRadius: 5 }}>ID: {row.zoomMeetingId || 'N/A'}</Tag>
            {row.matchedClassId ? (
              <Tag color="geekblue" style={{ margin: 0, borderRadius: 5, fontWeight: 600 }}>
                🎯 {row.matchedClassId}
              </Tag>
            ) : (
              <Select
                size="small"
                placeholder={isEnglish ? 'Assign class...' : 'Chọn lớp gán...'}
                value={manualClassAssign[row.zoomMeetingUuid]}
                onChange={(val) =>
                  setManualClassAssign((prev) => ({ ...prev, [row.zoomMeetingUuid]: val }))
                }
                style={{ minWidth: 150 }}
                options={suggestions.map((s) => ({
                  value: s.classId,
                  label: `${s.classId} — ${s.className}`,
                }))}
              />
            )}
            {row.hasAiSummary && (
              <Tag color="gold" style={{ margin: 0, borderRadius: 5 }}>
                ✨ AI Summary
              </Tag>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Sync Status' : 'Trạng Thái Trên LAK',
      key: 'status',
      width: 240,
      render: (_, row) => {
        const slotKey = row.matchedClassId ? `${row.matchedClassId}_${row.sessionDate}` : '';
        const activeJob = slotKey ? activeJobsBySlotKey?.get(slotKey) : null;
        if (activeJob) {
          return <ZoomSlotSyncingBanner syncJob={activeJob} compact />;
        }

        const meta = ZOOM_AUDIT_STATUS_META[row.syncStatus] || ZOOM_AUDIT_STATUS_META.MISSING_NEEDS_SYNC;
        return (
          <div>
            <Tag color={meta.color} style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}>
              {isEnglish ? meta.labelEn : meta.labelVi}
            </Tag>
            {row.existingRecordingTitle && (
              <Text type="secondary" style={{ display: 'block', fontSize: 11, marginTop: 3 }}>
                {row.existingRecordingTitle}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: isEnglish ? 'Action' : 'Thao Tác',
      key: 'action',
      width: 170,
      align: 'right',
      render: (_, row) => {
        if (row.syncStatus === 'ALREADY_SYNCED_AUTO' || row.syncStatus === 'SKIPPED_SHORT_FRAGMENT') {
          return null;
        }
        if (row.syncStatus === 'UNASSIGNED_CLASS') {
          const pickedClass = manualClassAssign[row.zoomMeetingUuid];
          return (
            <Button
              size="small"
              type="primary"
              disabled={!pickedClass || syncing}
              loading={syncing}
              onClick={() =>
                onRunBackfill?.([row.zoomMeetingUuid], {
                  overrideClassId: pickedClass,
                  overrideSessionDate: row.sessionDate,
                })
              }
              style={{ borderRadius: 6, minHeight: 34, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {isEnglish ? 'Assign & Sync' : 'Gán Lớp & Tải Về'}
            </Button>
          );
        }

        const isManualExisting = row.syncStatus === 'HAS_MANUAL_UPLOAD';
        return (
          <Button
            size="small"
            type={isManualExisting ? 'default' : 'primary'}
            icon={<CloudDownloadOutlined />}
            loading={syncing}
            data-testid={`btn-backfill-single-${row.matchedClassId}-${row.sessionDate}`}
            onClick={() =>
              onRunBackfill?.([row.zoomMeetingUuid], {
                allowAlongsideManual: isManualExisting,
              })
            }
            style={{ borderRadius: 6, minHeight: 34, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {isManualExisting
              ? isEnglish
                ? 'Pull Zoom Copy'
                : 'Kéo Thêm Bản Zoom'
              : isEnglish
              ? 'Sync Now'
              : 'Kéo Về LAK'}
          </Button>
        );
      },
    },
  ];

  return (
    <Card variant="borderless" data-testid="zoom-backfill-migration-panel" style={{ borderRadius: 12 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 15, display: 'block', color: '#0f172a' }}>
            {isEnglish
              ? 'Historical Zoom Cloud Recordings Migration & Backfill'
              : 'Đối Soát & Kéo Bù Các Buổi Học Còn Thiếu Từ Zoom Cloud'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            {isEnglish
              ? 'Streams missing .MP4 + AI Lesson Summaries to Google Drive 2TB and locks session cards while downloading.'
              : 'Tự động lọc bỏ các clip mở nhầm phòng (< 10 phút), giữ nguyên bản đã upload tay và hiện thông báo trực tiếp trên từng Card lịch học trong lúc tải.'}
          </Text>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 8,
            alignItems: isMobile ? 'stretch' : 'center',
          }}
        >
          <Space size={6}>
            <Switch
              size="small"
              checked={showShortFragments}
              onChange={setShowShortFragments}
            />
            <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {isEnglish ? 'Show <10m drafts' : 'Hiện cả clip nháp <10p'}
            </Text>
          </Space>

          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => onRefreshAudit?.()}
            style={{ minHeight: isMobile ? 40 : 36, borderRadius: 8 }}
          >
            {isEnglish ? 'Re-scan Zoom' : 'Quét Lại Zoom'}
          </Button>

          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            disabled={missingUuids.length === 0 || syncing}
            loading={syncing}
            data-testid="btn-backfill-all-missing"
            onClick={() => onRunBackfill?.(missingUuids)}
            style={{
              minHeight: isMobile ? 40 : 36,
              borderRadius: 8,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {isEnglish
              ? `Sync All Missing (${missingUuids.length})`
              : `Kéo Bù Tất Cả Buổi Thiếu (${missingUuids.length})`}
          </Button>
        </div>
      </div>

      {missingUuids.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12, borderRadius: 8 }}
          title={
            isEnglish
              ? `Found ${missingUuids.length} full class recording(s) on Zoom Cloud not yet attached to LAK schedules!`
              : `Phát hiện ${missingUuids.length} buổi học đầy đủ trên Zoom Cloud đang còn thiếu trên Lịch học LAK Education — sẵn sàng kéo bù tự động!`
          }
        />
      )}

      <Table
        rowKey="zoomMeetingUuid"
        loading={loading}
        dataSource={filteredItems}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </Card>
  );
};
