import React from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  BellOutlined,
  ExperimentOutlined,
  TeamOutlined,
  VideoCameraFilled,
  WarningOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

/**
 * Yêu cầu #5 & #6: Giám sát Realtime Trạng thái Phòng Zoom đang dạy
 * & Lịch sử cảnh báo Học viên rời lớp giữa giờ (kèm nút Test Báo Chuông trên DEV).
 */
export const ZoomLiveMonitorPanel = ({
  currentEnv,
  liveClasses = [],
  simulating = false,
  onSimulateEarlyLeave,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <div data-testid="zoom-live-monitor-panel">
      <Alert
        type="info"
        showIcon
        icon={<BellOutlined />}
        style={{ marginBottom: 16, borderRadius: 10 }}
        title={
          isEnglish
            ? 'Realtime Zoom Webhook Guard: Early Student Leave Detection Active'
            : 'Cảnh Báo Tức Thì Học Viên Rời Phòng Zoom Giữa Giờ (Webhook meeting.participant_left)'
        }
        description={
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: 10,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 12.5 }}>
              {isEnglish
                ? 'Whenever a student leaves the Zoom room >10 minutes before class ends, LAK immediately alerts both the Class Teacher and Academic staff via the realtime notification bell.'
                : 'Khi có học viên thoát/rớt khỏi phòng Zoom giữa giờ (trước giờ tan lớp tối thiểu 10 phút), hệ thống tự động cập nhật trạng thái lớp realtime và bắn chuông báo cho Giáo viên đứng lớp + Giáo vụ hỗ trợ ngay.'}
            </Text>

            {currentEnv === 'dev' && (
              <Button
                type="dashed"
                icon={<ExperimentOutlined />}
                loading={simulating}
                data-testid="btn-simulate-zoom-early-leave-dev"
                onClick={() => onSimulateEarlyLeave?.('LH004', 'KENJI< PHÚ QUÝ>')}
                style={{
                  minHeight: isMobile ? 40 : 36,
                  borderRadius: 8,
                  borderColor: '#2563eb',
                  color: '#1d4ed8',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {isEnglish
                  ? '🧪 Test Student Leave Alert (DEV)'
                  : '🧪 Giả Lập Học Sinh Rời Lớp (Test Chuông DEV)'}
              </Button>
            )}
          </div>
        }
      />

      {liveClasses.length === 0 ? (
        <Card variant="borderless" style={{ borderRadius: 12 }}>
          <Empty description={isEnglish ? 'No active classes' : 'Chưa có lớp đang hoạt động'} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {liveClasses.map((cls) => {
            const zLive = cls.zoomLiveState || {};
            const isLive = Boolean(zLive.isLiveOnZoom);
            const leaves = Array.isArray(zLive.recentLeaves) ? zLive.recentLeaves : [];
            const activeParts = Array.isArray(zLive.activeParticipants)
              ? zLive.activeParticipants
              : [];

            return (
              <Col xs={24} lg={12} key={cls.id}>
                <Card
                  variant="borderless"
                  data-testid={`zoom-live-class-card-${cls.id}`}
                  style={{
                    borderRadius: 12,
                    height: '100%',
                    border: isLive ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <Space size={6} wrap>
                        <Tag color="geekblue" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                          {cls.id}
                        </Tag>
                        <Text strong style={{ fontSize: 14.5 }}>
                          {cls.name}
                        </Text>
                      </Space>

                      {isLive ? (
                        <Tag
                          color="success"
                          icon={<VideoCameraFilled />}
                          style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}
                        >
                          🔴 LIVE ON ZOOM ({activeParts.length})
                        </Tag>
                      ) : (
                        <Tag style={{ margin: 0, borderRadius: 6 }}>
                          {isEnglish ? 'Idle / Waiting' : 'Đang nghỉ / Chờ đến giờ'}
                        </Tag>
                      )}
                    </div>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      👩‍🏫 {cls.teacherName} • 📅 {cls.schedule} • 🔑 Zoom ID: {cls.meetingId}
                    </Text>

                    {activeParts.length > 0 && (
                      <div
                        style={{
                          background: '#f0fdf4',
                          borderRadius: 8,
                          padding: '8px 10px',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <Text strong style={{ fontSize: 12, color: '#166534', display: 'block', marginBottom: 4 }}>
                          <TeamOutlined />{' '}
                          {isEnglish ? 'Currently inside Zoom:' : 'Đang có mặt trong phòng Zoom:'}
                        </Text>
                        <Space size={[4, 4]} wrap>
                          {activeParts.map((p, idx) => (
                            <Tag key={idx} color="green" style={{ margin: 0, borderRadius: 5 }}>
                              {p.zoomUserName}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    <div>
                      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        <WarningOutlined style={{ color: '#d97706', marginRight: 4 }} />
                        {isEnglish
                          ? 'Recent Mid-Session Leave Events:'
                          : 'Nhật ký Học viên rời phòng Zoom gần nhất:'}
                      </Text>

                      {leaves.length === 0 ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {isEnglish
                            ? 'No mid-session student leaves recorded.'
                            : 'Chưa có sự kiện học viên rời lớp giữa giờ.'}
                        </Text>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {leaves.slice(0, 5).map((lv, idx) => (
                            <div
                              key={idx}
                              data-testid={`zoom-leave-log-${cls.id}-${idx}`}
                              style={{
                                background: lv.notifiedEarlyLeave ? '#fffbeb' : '#f8fafc',
                                border: lv.notifiedEarlyLeave
                                  ? '1px solid #fde68a'
                                  : '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 12,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <span>
                                <strong>{lv.studentName}</strong>{' '}
                                {lv.studentId ? `(${lv.studentId})` : ''} —{' '}
                                <span style={{ color: '#64748b' }}>Zoom: "{lv.zoomUserName}"</span>
                              </span>
                              <Space size={4}>
                                <Tag color={lv.notifiedEarlyLeave ? 'warning' : 'default'} style={{ margin: 0 }}>
                                  ⏰ {lv.vnTimeHm}
                                </Tag>
                                {lv.notifiedEarlyLeave && (
                                  <Tag color="red" style={{ margin: 0 }}>
                                    🔔 {isEnglish ? 'Alert Sent' : 'Đã báo GV & Giáo vụ'}
                                  </Tag>
                                )}
                              </Space>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};
