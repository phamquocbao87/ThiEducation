import React from 'react';
import { Popover, Space, Tag, Typography } from 'antd';
import {
  CloudFilled,
  TeamOutlined,
  VideoCameraFilled,
  WarningFilled,
} from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useZoomClassesLiveMap } from '../hooks/useZoomClassesLiveMap';

const { Text } = Typography;

/**
 * Section Thông Tin Live Từ Phòng Học Zoom (Hiển thị đồng bộ trên MỌI Card Lớp Học đã liên kết Zoom):
 * - Chỉ hiển thị khi lớp đã có liên kết Zoom (`zoomConfig.isLinked === true`).
 * - Cập nhật tức thì 0ms qua Firestore (`useZoomClassesLiveMap`).
 * - Tuân thủ nghiêm ngặt bảo mật PII Học viên (ẩn danh sách tên bạn học khác và log rời phòng đối với vai trò `student`).
 */
export const ZoomRoomLiveSection = ({
  cls = null,
  classId = '',
  role = 'academic',
  compact = false,
  style = {},
}) => {
  const { isEnglish } = useLanguage();
  const liveMap = useZoomClassesLiveMap();

  const resolvedId = String(classId || cls?.id || '').trim();
  const liveEntry = resolvedId ? liveMap.get(resolvedId) : null;

  const zoomConfig = liveEntry?.zoomConfig || cls?.zoomConfig || null;
  const zoomLiveState = liveEntry?.zoomLiveState || cls?.zoomLiveState || null;

  if (!zoomConfig?.isLinked) {
    return null;
  }

  const normalizedRole = String(role || 'academic').toLowerCase();
  const isStudent = normalizedRole === 'student';

  const isLiveOnZoom = Boolean(zoomLiveState?.isLiveOnZoom);
  const participantCount = Number(zoomLiveState?.liveParticipantCount || 0);
  const activeParticipants = Array.isArray(zoomLiveState?.activeParticipants)
    ? zoomLiveState.activeParticipants
    : [];
  const recentLeaves = Array.isArray(zoomLiveState?.recentLeaves)
    ? zoomLiveState.recentLeaves
    : [];
  const earlyLeaves = recentLeaves.filter((lv) => lv && lv.notifiedEarlyLeave);

  const prettyId = zoomConfig.prettyMeetingId || zoomConfig.zoomMeetingId || '';

  // 1. TRƯỜNG HỢP PHÒNG ZOOM ĐANG DIỄN RA TRỰC TUYẾN (LIVE ON ZOOM)
  if (isLiveOnZoom) {
    if (isStudent) {
      return (
        <div
          data-testid={`zoom-card-live-section-${resolvedId}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: compact ? 4 : 6,
            marginBottom: compact ? 4 : 8,
            padding: compact ? '4px 8px' : '6px 10px',
            borderRadius: 8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            ...style,
          }}
        >
          <Space size={5} style={{ minWidth: 0 }}>
            <VideoCameraFilled style={{ color: '#059669', fontSize: 12 }} />
            <Text strong style={{ fontSize: 11.5, color: '#065f46' }}>
              {isEnglish ? '🟢 Zoom Room is Live Now' : '🟢 Phòng Zoom đang mở trực tuyến'}
            </Text>
          </Space>
        </div>
      );
    }

    const popoverContent = (
      <div style={{ maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <Text strong style={{ fontSize: 12.5, display: 'block', marginBottom: 4 }}>
            👥{' '}
            {isEnglish
              ? `Currently in Zoom Room (${participantCount}):`
              : `Đang có mặt trong phòng Zoom (${participantCount}):`}
          </Text>
          {activeParticipants.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 11.5 }}>
              {isEnglish ? 'Host opened room — waiting for students' : 'Phòng vừa mở — đang đón học viên vào'}
            </Text>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {activeParticipants.map((p, idx) => (
                <Tag key={idx} color="green" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                  {p.zoomUserName}
                </Tag>
              ))}
            </div>
          )}
        </div>

        {earlyLeaves.length > 0 && (
          <div
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
            }}
          >
            <Text strong style={{ fontSize: 12, color: '#c2410c', display: 'block', marginBottom: 3 }}>
              ⚠️ {isEnglish ? 'Mid-session early leaves:' : 'Học viên rời phòng giữa giờ:'}
            </Text>
            {earlyLeaves.slice(0, 5).map((lv, idx) => (
              <div key={idx} style={{ fontSize: 11.5, color: '#9a3412' }}>
                • <strong>{lv.studentName || lv.zoomUserName}</strong>{' '}
                {isEnglish ? `left at ${lv.vnTimeHm}` : `rời lúc ${lv.vnTimeHm}`}
              </div>
            ))}
          </div>
        )}
      </div>
    );

    return (
      <Popover
        content={popoverContent}
        trigger={['hover', 'click']}
        title={
          <span style={{ fontSize: 12.5 }}>
            📡 Zoom Live • {prettyId}
          </span>
        }
      >
        <div
          data-testid={`zoom-card-live-section-${resolvedId}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: compact ? 4 : 6,
            marginBottom: compact ? 4 : 8,
            padding: compact ? '4px 8px' : '6px 10px',
            borderRadius: 8,
            backgroundColor: '#ecfdf5',
            border: '1.5px solid #34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6,
            cursor: 'pointer',
            ...style,
          }}
        >
          <Space size={5} style={{ minWidth: 0 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <Text strong style={{ fontSize: compact ? 11 : 11.5, color: '#065f46' }}>
              {isEnglish
                ? `Zoom Live: ${participantCount} in room`
                : `Zoom Live: ${participantCount} trong phòng`}
            </Text>
          </Space>

          <Space size={4} wrap>
            {earlyLeaves.length > 0 && (
              <Tag
                color="warning"
                icon={<WarningFilled />}
                style={{ margin: 0, fontSize: 10.5, fontWeight: 700, borderRadius: 4, padding: '0 5px' }}
              >
                {earlyLeaves.length} {isEnglish ? 'left early' : 'rời sớm'}
              </Tag>
            )}
            <Tag
              color="success"
              icon={<TeamOutlined />}
              style={{ margin: 0, fontSize: 10.5, borderRadius: 4, padding: '0 5px' }}
            >
              {isEnglish ? 'Details' : 'Xem'}
            </Tag>
          </Space>
        </div>
      </Popover>
    );
  }

  // 2. TRƯỜNG HỢP PHÒNG ĐÃ LIÊN KẾT ZOOM NHƯNG HIỆN ĐANG NGOÀI GIỜ HỌC (IDLE)
  return (
    <div
      data-testid={`zoom-card-live-section-${resolvedId}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: compact ? 4 : 6,
        marginBottom: compact ? 4 : 8,
        padding: compact ? '3px 8px' : '5px 10px',
        borderRadius: 8,
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 4,
        ...style,
      }}
    >
      <Space size={5} style={{ minWidth: 0 }}>
        <CloudFilled style={{ color: '#0284c7', fontSize: 12, flexShrink: 0 }} />
        <Text style={{ fontSize: compact ? 10.5 : 11.5, color: '#0369a1', fontWeight: 600 }}>
          {isStudent
            ? isEnglish
              ? 'Zoom Auto-Recording Enabled'
              : 'Phòng Zoom tự lưu video bài giảng'
            : isEnglish
            ? `Zoom Linked (${prettyId})`
            : `Đã nối Zoom (${prettyId})`}
        </Text>
      </Space>

      {!isStudent && (
        <Tag
          color="processing"
          style={{ margin: 0, fontSize: 10, borderRadius: 4, padding: '0 5px', whiteSpace: 'nowrap' }}
        >
          {isEnglish ? 'Auto-Sync ON' : 'Tự lưu Video'}
        </Tag>
      )}
    </div>
  );
};

export default ZoomRoomLiveSection;
