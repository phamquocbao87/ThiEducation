import React from 'react';
import { CloudDownloadOutlined, CloudSyncOutlined, UploadOutlined, BulbOutlined } from '@ant-design/icons';
import { Popover, Progress, Space, Tag, Typography } from 'antd';
import { useLanguage } from '../../core/context/LanguageContext';

const { Text, Paragraph } = Typography;

/**
 * Yêu cầu #4: Huy hiệu phân biệt trực quan giữa Video tự đồng bộ từ Zoom vs Video User tự upload
 * + Xem nhanh tóm tắt bài giảng AI & Bài tập dặn dò của Zoom Smart Recording (nếu có).
 */
export const ZoomRecordingSourceBadge = ({ recording, compact = false }) => {
  const { isEnglish } = useLanguage();
  if (!recording) return null;

  const isAutoZoom = recording.recordingSource === 'ZOOM_AUTO_SYNC';
  const aiSummary = recording.zoomMeta?.aiSummaryOverview || '';
  const aiHomework = Array.isArray(recording.zoomMeta?.aiNextStepsHomework)
    ? recording.zoomMeta.aiNextStepsHomework
    : [];

  if (isAutoZoom) {
    return (
      <Space size={4} wrap style={{ lineHeight: 1 }}>
        <Tag
          color="blue"
          icon={<CloudDownloadOutlined />}
          data-testid={`badge-recording-source-zoom-${recording.id || 'item'}`}
          style={{
            margin: 0,
            fontSize: compact ? 10 : 11,
            padding: compact ? '0 5px' : '1px 6px',
            borderRadius: 5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {isEnglish ? 'Auto Zoom' : 'Tự đồng bộ Zoom'}
        </Tag>

        {(aiSummary || aiHomework.length > 0) && (
          <Popover
            trigger="click"
            title={
              <Space size={6}>
                <BulbOutlined style={{ color: '#d97706' }} />
                <Text strong>
                  {isEnglish ? 'Zoom AI Lesson Summary' : 'Tóm Tắt Bài Giảng AI (Zoom)'}
                </Text>
              </Space>
            }
            content={
              <div style={{ maxWidth: 360 }}>
                {aiSummary && (
                  <Paragraph style={{ fontSize: 12.5, marginBottom: aiHomework.length ? 8 : 0 }}>
                    {aiSummary}
                  </Paragraph>
                )}
                {aiHomework.length > 0 && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 12,
                    }}
                  >
                    <Text strong style={{ display: 'block', marginBottom: 4, color: '#92400e' }}>
                      {isEnglish ? '📌 Homework / Next Steps:' : '📌 Dặn dò cuối buổi:'}
                    </Text>
                    {aiHomework.map((hw, i) => (
                      <div key={i} style={{ marginBottom: 2 }}>
                        • {hw}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            <Tag
              color="gold"
              style={{
                margin: 0,
                fontSize: compact ? 10 : 11,
                padding: '0 5px',
                borderRadius: 5,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ✨ AI
            </Tag>
          </Popover>
        )}
      </Space>
    );
  }

  return (
    <Tag
      icon={<UploadOutlined />}
      data-testid={`badge-recording-source-manual-${recording.id || 'item'}`}
      style={{
        margin: 0,
        fontSize: compact ? 10 : 11,
        padding: compact ? '0 5px' : '1px 6px',
        borderRadius: 5,
        color: '#475569',
        backgroundColor: '#f1f5f9',
        borderColor: '#cbd5e1',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {isEnglish ? 'Manual Upload' : 'Upload thủ công'}
    </Tag>
  );
};

/**
 * Yêu cầu #10: Banner tiến trình trực tiếp trên từng Card buổi học khi đang kéo video từ Zoom (#8, #9)
 * để người dùng biết rõ và tránh upload đè thêm lần nữa.
 */
export const ZoomSlotSyncingBanner = ({ syncJob, compact = false }) => {
  const { isEnglish } = useLanguage();
  if (!syncJob) return null;

  const isEncoding = syncJob.status === 'ENCODING_ON_ZOOM';
  const pct = Math.min(99, Math.max(5, Number(syncJob.progressPercent) || (isEncoding ? 8 : 15)));

  const label = isEncoding
    ? isEnglish
      ? 'Class ended — Waiting for Zoom Cloud to encode video...'
      : 'Ca học vừa xong — Đang chờ Zoom nén video để tự tải về...'
    : isEnglish
    ? `Syncing video recording from Zoom to LAK Education... (${pct}%)`
    : `Đang lấy dữ liệu video recording từ Zoom về LAK Education... (${pct}%)`;

  return (
    <div
      data-testid={`zoom-slot-syncing-banner-${syncJob.classId}_${syncJob.sessionDate}`}
      style={{
        padding: compact ? '4px 6px' : '6px 8px',
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        border: '1px solid #93c5fd',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <CloudSyncOutlined spin style={{ color: '#2563eb', fontSize: 13, flexShrink: 0 }} />
        <Text
          strong
          style={{
            fontSize: compact ? 10.5 : 11,
            color: '#1d4ed8',
            lineHeight: 1.35,
          }}
        >
          {label}
        </Text>
      </div>
      <Progress
        percent={pct}
        size="small"
        status="active"
        showInfo={false}
        strokeColor="#2563eb"
        style={{ margin: 0 }}
      />
    </div>
  );
};
