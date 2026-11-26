import React from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

/**
 * Sub-Feature UI Component:
 * Hiển thị khu vực Xem / Gắn / Xoá Video Ghi Hình Buổi Học (Session Recording)
 * ngay bên trong từng ô buổi học tại Live Class Schedules (Lịch Tuần & Bảng Danh Sách).
 */
export const SessionSlotRecordingBox = ({
  slotItem,
  isoDate,
  timeState,
  recordings = [],
  canManage = false,
  compact = false,
  onWatchRecording,
  onOpenUpload,
  onDeleteRecording,
}) => {
  const { isEnglish } = useLanguage();
  const slotKey = `${slotItem?.classId || 'cls'}_${isoDate || 'date'}`;
  const hasRecordings = Array.isArray(recordings) && recordings.length > 0;
  const isPastOrLive = timeState?.state === 'FINISHED' || timeState?.state === 'LIVE';

  // 1. Trường hợp ĐÃ CÓ Video Recording cho buổi học ngày hôm đó
  if (hasRecordings) {
    return (
      <div
        data-testid={`slot-recording-box-${slotKey}`}
        style={{
          marginTop: compact ? 0 : 8,
          padding: compact ? '4px 6px' : '6px 8px',
          borderRadius: 8,
          backgroundColor: '#faf5ff',
          border: '1px solid #d8b4fe',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {recordings.map((rec, idx) => {
          const watchLabel =
            recordings.length > 1
              ? isEnglish
                ? `Recording #${idx + 1}`
                : `Xem Video #${idx + 1}`
              : isEnglish
              ? 'Watch Recording'
              : 'Xem Recording';

          return (
            <div
              key={rec.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                minWidth: 0,
              }}
            >
              <Tooltip title={rec.title || watchLabel}>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  data-testid={`btn-watch-schedule-recording-${slotKey}-${idx}`}
                  onClick={() => onWatchRecording?.(rec)}
                  style={{
                    backgroundColor: '#7c3aed',
                    borderColor: '#7c3aed',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 11,
                    minHeight: 30,
                    padding: '0 8px',
                    flex: compact ? undefined : 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {watchLabel}
                  </span>
                </Button>
              </Tooltip>

              {canManage && (
                <Space size={2} style={{ flexShrink: 0 }}>
                  {idx === 0 && (
                    <Tooltip
                      title={
                        isEnglish
                          ? 'Upload another video for this session'
                          : 'Tải thêm video cho buổi học này'
                      }
                    >
                      <Button
                        size="small"
                        type="text"
                        icon={<PlusOutlined />}
                        data-testid={`btn-add-more-schedule-recording-${slotKey}`}
                        onClick={() => onOpenUpload?.(slotItem, isoDate)}
                        style={{
                          color: '#7c3aed',
                          minWidth: 30,
                          minHeight: 30,
                          padding: 0,
                          borderRadius: 6,
                        }}
                      />
                    </Tooltip>
                  )}

                  <Popconfirm
                    title={
                      isEnglish
                        ? 'Delete this session recording?'
                        : 'Xoá video ghi hình buổi học này?'
                    }
                    description={
                      isEnglish
                        ? 'Students in this class will no longer see this recording.'
                        : 'Video sẽ được gỡ ngay lập tức khỏi lịch học của lớp.'
                    }
                    okText={isEnglish ? 'Delete' : 'Xoá ngay'}
                    cancelText={isEnglish ? 'Cancel' : 'Hủy'}
                    okButtonProps={{
                      danger: true,
                      'data-testid': `btn-confirm-delete-schedule-recording-${rec.id}`,
                    }}
                    onConfirm={() => onDeleteRecording?.(rec)}
                  >
                    <Tooltip title={isEnglish ? 'Delete recording' : 'Xoá recording'}>
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        data-testid={`btn-delete-schedule-recording-${rec.id}`}
                        style={{
                          minWidth: 32,
                          minHeight: 32,
                          padding: 0,
                          borderRadius: 6,
                        }}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 2. Trường hợp buổi học ĐÃ DIỄN RA / ĐANG DIỄN RA nhưng CHƯA CÓ Video Recording
  if (isPastOrLive) {
    if (canManage) {
      return (
        <div
          data-testid={`slot-recording-empty-manage-${slotKey}`}
          style={{ marginTop: compact ? 0 : 8 }}
        >
          <Button
            size="small"
            type="dashed"
            icon={<CloudUploadOutlined />}
            data-testid={`btn-upload-schedule-recording-${slotKey}`}
            onClick={() => onOpenUpload?.(slotItem, isoDate)}
            style={{
              width: compact ? 'auto' : '100%',
              minHeight: 32,
              borderRadius: 6,
              borderColor: '#c4b5fd',
              color: '#6d28d9',
              backgroundColor: '#faf5ff',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {isEnglish ? '+ Upload Recording' : '+ Gắn Recording'}
          </Button>
        </div>
      );
    }

    return (
      <div
        data-testid={`slot-recording-empty-student-${slotKey}`}
        style={{ marginTop: compact ? 0 : 8 }}
      >
        <Tag
          icon={<VideoCameraOutlined />}
          data-testid={`tag-no-schedule-recording-${slotKey}`}
          style={{
            margin: 0,
            width: compact ? 'auto' : '100%',
            textAlign: 'center',
            borderRadius: 6,
            fontSize: 11,
            padding: '2px 6px',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderColor: '#e2e8f0',
          }}
        >
          {isEnglish ? 'No recording yet' : 'Chưa có recording'}
        </Tag>
      </div>
    );
  }

  return null;
};
