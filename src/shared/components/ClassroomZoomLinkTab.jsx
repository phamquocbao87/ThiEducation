import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  CloudDownloadOutlined,
  CloudFilled,
  CopyOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
  ThunderboltOutlined,
  VideoCameraOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { ZoomBackendGateway } from '../services/ZoomBackendGateway';
import { useZoomSyncJobs } from '../hooks/useZoomSyncJobs';

const { Text } = Typography;

function formatMb(bytes = 0) {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Tab thứ 4 "Liên Kết Với Zoom" ngay trong màn hình Chi Tiết Lớp Học (/classroom/:classId)
 * Phân quyền: Chỉ hiển thị cho Admin, Giáo vụ (academic), Giám đốc (director).
 * Tuân thủ Clean Modular Architecture (nằm tại src/shared/components để không import chéo module).
 */
export const ClassroomZoomLinkTab = ({ cls, currentUser }) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const actorId = currentUser?.id || currentUser?.code || 'ADM001';
  const actorRole = currentUser?.role || '';
  const targetEnv = ZoomBackendGateway.getCurrentTargetEnv();

  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [syncingUuid, setSyncingUuid] = useState(null);
  const [apiError, setApiError] = useState('');

  const [mySuggestion, setMySuggestion] = useState(null);
  const [zoomRooms, setZoomRooms] = useState([]);
  const [classAuditItems, setClassAuditItems] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const { activeJobsBySlotKey } = useZoomSyncJobs();

  const loadClassZoomData = useCallback(async () => {
    if (!cls?.id) return;
    setLoading(true);
    setApiError('');
    try {
      const [mapRes, audRes] = await Promise.all([
        ZoomBackendGateway.call(`/mapping-suggestions?env=${targetEnv}`, {
          targetEnv,
          actorId,
          actorRole,
        }),
        ZoomBackendGateway.call(`/missing-recordings?env=${targetEnv}`, {
          targetEnv,
          actorId,
          actorRole,
        }),
      ]);

      const suggestions = mapRes?.data?.suggestions || [];
      const rooms = mapRes?.data?.zoomRooms || [];
      const matched = suggestions.find((s) => String(s.classId) === String(cls.id)) || null;

      setMySuggestion(matched);
      setZoomRooms(rooms);

      const initialRoom =
        cls?.zoomConfig?.zoomMeetingId ||
        matched?.zoomConfig?.zoomMeetingId ||
        matched?.suggestedRoom?.id ||
        rooms[0]?.id ||
        '';
      setSelectedRoomId((prev) => prev || String(initialRoom));

      const allAudit = audRes?.data?.items || [];
      const scopedAudit = allAudit.filter(
        (it) =>
          String(it.matchedClassId) === String(cls.id) &&
          it.syncStatus !== 'SKIPPED_SHORT_FRAGMENT'
      );
      setClassAuditItems(scopedAudit);
    } catch (err) {
      setApiError(err?.message || 'Không thể tải danh sách phòng Zoom từ dịch vụ lakZoomApi.');
    } finally {
      setLoading(false);
    }
  }, [cls?.id, cls?.zoomConfig?.zoomMeetingId, targetEnv, actorId, actorRole]);

  useEffect(() => {
    loadClassZoomData();
  }, [loadClassZoomData]);

  const chosenRoom = useMemo(
    () => zoomRooms.find((r) => String(r.id) === String(selectedRoomId)) || null,
    [zoomRooms, selectedRoomId]
  );

  const isAlreadyLinked = Boolean(cls?.zoomConfig?.isLinked || mySuggestion?.isAlreadyLinked);
  const linkedConfig = cls?.zoomConfig || mySuggestion?.zoomConfig || null;
  const liveState = cls?.zoomLiveState || {};

  const handleConfirmLink = async () => {
    if (!cls?.id || !selectedRoomId) return;
    setLinking(true);
    try {
      await ZoomBackendGateway.call('/link-class', {
        method: 'POST',
        targetEnv,
        actorId,
        actorRole,
        body: {
          classId: cls.id,
          zoomMeetingId: selectedRoomId,
          ensureCloudAutoRecording: true,
          actorId,
        },
      });
      message.success(
        isEnglish
          ? `Successfully linked class ${cls.id} with Zoom room ${selectedRoomId}!`
          : `Đã liên kết lớp ${cls.id} với phòng Zoom ${selectedRoomId} & bật tự động ghi Cloud!`
      );
      await loadClassZoomData();
    } catch (err) {
      message.error(err?.message || 'Không thể liên kết phòng Zoom.');
    } finally {
      setLinking(false);
    }
  };

  const handleAutoProvisionAndLink = async () => {
    if (!cls?.id) return;
    setProvisioning(true);
    try {
      const provisioned = await ZoomBackendGateway.provisionZoomRoomForNewClass(
        {
          className: cls.name,
          days: cls.scheduleData?.days || [],
          startTime: cls.scheduleData?.startTime || '19:20',
          endTime: cls.scheduleData?.endTime || '21:20',
          startDate: cls.startDate,
          passcode: cls.passcode || '123456',
          totalSessions: cls.totalSessions || 12,
        },
        actorId
      );

      if (provisioned?.zoomMeetingId) {
        await ZoomBackendGateway.call('/link-class', {
          method: 'POST',
          targetEnv,
          actorId,
          actorRole,
          body: {
            classId: cls.id,
            zoomMeetingId: provisioned.zoomMeetingId,
            ensureCloudAutoRecording: true,
            actorId,
          },
        });
        setSelectedRoomId(String(provisioned.zoomMeetingId));
        message.success(
          isEnglish
            ? `Created & linked recurring Zoom room ${provisioned.prettyMeetingId}!`
            : `Đã tự tạo & liên kết phòng Zoom định kỳ ${provisioned.prettyMeetingId} (bật sẵn ghi Cloud)!`
        );
        await loadClassZoomData();
      }
    } catch (err) {
      message.error(err?.message || 'Không thể tạo mới phòng Zoom trên Cloud.');
    } finally {
      setProvisioning(false);
    }
  };

  const handleSyncSingleSession = async (uuid) => {
    if (!uuid) return;
    setSyncingUuid(uuid);
    try {
      await ZoomBackendGateway.call('/backfill-sync', {
        method: 'POST',
        targetEnv,
        actorId,
        actorRole,
        body: {
          zoomMeetingUuids: [uuid],
          overrideClassId: cls.id,
        },
      });
      message.success(
        isEnglish
          ? 'Synced Zoom session recording to Google Drive & Class Schedule!'
          : 'Đã kéo video buổi học từ Zoom Cloud về Google Drive & Lịch học thành công!'
      );
      await loadClassZoomData();
    } catch (err) {
      message.error(err?.message || 'Lỗi khi đồng bộ video buổi học.');
    } finally {
      setSyncingUuid(null);
    }
  };

  const missingSessions = classAuditItems.filter((x) => x.syncStatus === 'MISSING_NEEDS_SYNC');

  const handleSyncAllMissingOfClass = async () => {
    if (missingSessions.length === 0) return;
    setSyncingUuid('ALL_MISSING');
    try {
      await ZoomBackendGateway.call('/backfill-sync', {
        method: 'POST',
        targetEnv,
        actorId,
        actorRole,
        body: {
          zoomMeetingUuids: missingSessions.map((m) => m.zoomMeetingUuid),
          overrideClassId: cls.id,
        },
      });
      message.success(
        isEnglish
          ? `Synced all ${missingSessions.length} missing recordings for this class!`
          : `Đã kéo bù toàn bộ ${missingSessions.length} buổi học còn thiếu của lớp!`
      );
      await loadClassZoomData();
    } catch (err) {
      message.error(err?.message || 'Lỗi khi đồng bộ hàng loạt video của lớp.');
    } finally {
      setSyncingUuid(null);
    }
  };

  return (
    <div data-testid={`classroom-zoom-link-tab-${cls?.id || 'cls'}`}>
      {apiError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 14, borderRadius: 8 }}
          title={isEnglish ? 'Zoom Cloud Connection Error' : 'Lỗi kết nối dịch vụ Zoom Cloud'}
          description={apiError}
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {/* CỘT TRÁI: CHỌN PHÒNG ZOOM ĐỂ LIÊN KẾT & CẤU HÌNH SONG SONG */}
          <Col xs={24} lg={13}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 12,
                border: isAlreadyLinked ? '1.5px solid #86efac' : '1px solid #cbd5e1',
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <Space size={8} wrap>
                    <VideoCameraOutlined style={{ color: '#2563eb', fontSize: 18 }} />
                    <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                      {isEnglish
                        ? 'Zoom Cloud Room Mapping & Auto-Sync'
                        : 'Liên Kết Phòng Học Zoom & Tự Động Đồng Bộ'}
                    </Text>
                    {isAlreadyLinked ? (
                      <Tag
                        color="success"
                        icon={<CheckCircleFilled />}
                        style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}
                      >
                        {isEnglish ? 'Linked with Zoom' : 'Đã liên kết Zoom'}
                      </Tag>
                    ) : (
                      <Tag color="warning" style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}>
                        {isEnglish ? 'Not Linked Yet' : 'Chưa liên kết Zoom'}
                      </Tag>
                    )}
                  </Space>

                  <Button
                    size="small"
                    icon={<ReloadOutlined spin={loading} />}
                    onClick={loadClassZoomData}
                    style={{ borderRadius: 6, minHeight: isMobile ? 36 : 30 }}
                  >
                    {isEnglish ? 'Refresh' : 'Làm mới'}
                  </Button>
                </div>

                {/* Thông tin liên kết hiện tại (song song giữ nguyên các trường cũ #7) */}
                {linkedConfig?.zoomMeetingId && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <Space size={6} wrap>
                      <Tag color="geekblue" style={{ margin: 0, fontWeight: 700, borderRadius: 5 }}>
                        ID: {linkedConfig.prettyMeetingId || linkedConfig.zoomMeetingId}
                      </Tag>
                      {linkedConfig.passcode && (
                        <Tag style={{ margin: 0, borderRadius: 5 }}>
                          Passcode: <strong>{linkedConfig.passcode}</strong>
                        </Tag>
                      )}
                      <Tag icon={<CloudFilled />} color="processing" style={{ margin: 0, borderRadius: 5 }}>
                        {isEnglish ? 'Auto-Cloud Recording: ON' : 'Tự ghi Cloud: ĐANG BẬT'}
                      </Tag>
                    </Space>
                    {linkedConfig.joinUrl && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginTop: 2,
                        }}
                      >
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🔗 {linkedConfig.joinUrl}
                        </Text>
                        <Button
                          size="small"
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard?.writeText(linkedConfig.joinUrl);
                            message.success(
                              isEnglish ? 'Copied Zoom link!' : 'Đã sao chép link phòng Zoom!'
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Gợi ý khớp tự động AI (0-100%) */}
                {mySuggestion?.suggestedRoom && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #93c5fd',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Space size={4}>
                        <ThunderboltFilled style={{ color: '#2563eb' }} />
                        <Text strong style={{ fontSize: 12.5, color: '#1e40af' }}>
                          {isEnglish ? 'AI Auto-Suggest:' : 'Gợi ý khớp phòng Zoom tự động:'}
                        </Text>
                      </Space>
                      <Tag
                        color={mySuggestion.confidenceScore >= 80 ? 'blue' : 'gold'}
                        style={{ margin: 0, fontWeight: 700, borderRadius: 5, whiteSpace: 'nowrap' }}
                      >
                        {mySuggestion.confidenceScore}% {isEnglish ? 'Match' : 'Khớp'}
                      </Tag>
                    </div>
                    {mySuggestion.matchReasons?.map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#475569' }}>
                        ✓ {r}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ô Chọn Phòng Zoom Để Liên Kết (Đúng theo chỉ đạo của Sếp Bảo!) */}
                <div>
                  <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                    {isEnglish ? 'Select Target Zoom Room to Link:' : 'Chọn Phòng Zoom để liên kết:'}
                  </Text>
                  <Select
                    value={selectedRoomId || undefined}
                    onChange={(val) => setSelectedRoomId(val)}
                    data-testid="select-classroom-zoom-room"
                    placeholder={
                      isEnglish ? 'Select a Zoom room on LAK account...' : 'Chọn phòng học trên Zoom...'
                    }
                    style={{ width: '100%', height: 40 }}
                    options={zoomRooms.map((rm) => ({
                      value: String(rm.id),
                      label: `${rm.id} — ${rm.topic} (${
                        rm.autoRecording === 'cloud' ? '☁️ Cloud' : `⚠️ ${rm.autoRecording}`
                      })`,
                    }))}
                  />
                </div>

                {chosenRoom && chosenRoom.autoRecording !== 'cloud' && (
                  <Tooltip
                    title={
                      isEnglish
                        ? 'Confirming link will automatically switch this Zoom room to Cloud Recording!'
                        : 'Bấm xác nhận liên kết sẽ tự động bật chế độ ghi Cloud cho phòng này!'
                    }
                  >
                    <Tag icon={<WarningFilled />} color="error" style={{ borderRadius: 6, margin: 0 }}>
                      {isEnglish
                        ? `Room currently "${chosenRoom.autoRecording}" — Will auto-enable Cloud!`
                        : `Phòng đang để "${chosenRoom.autoRecording}" — Hệ thống sẽ tự bật Cloud khi liên kết!`}
                    </Tag>
                  </Tooltip>
                )}

                {/* Hàng nút Xác nhận liên kết & Tự tạo phòng mới nếu chưa có */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 10,
                    marginTop: 2,
                  }}
                >
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    loading={linking}
                    disabled={!selectedRoomId}
                    data-testid={`btn-classroom-confirm-zoom-link-${cls?.id}`}
                    onClick={handleConfirmLink}
                    style={{
                      flex: 1,
                      minHeight: 40,
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    {isAlreadyLinked
                      ? isEnglish
                        ? 'Update & Re-Sync Zoom Link'
                        : 'Cập Nhật & Đồng Bộ Lại Với Zoom'
                      : isEnglish
                      ? 'Confirm Link & Enable Auto-Sync'
                      : 'Xác Nhận Liên Kết & Bật Tự Đồng Bộ'}
                  </Button>

                  <Button
                    icon={<ThunderboltOutlined />}
                    loading={provisioning}
                    data-testid={`btn-classroom-provision-zoom-room-${cls?.id}`}
                    onClick={handleAutoProvisionAndLink}
                    style={{
                      minHeight: 40,
                      borderRadius: 8,
                      fontWeight: 500,
                    }}
                  >
                    {isEnglish ? 'Create New Zoom Room' : 'Tạo Phòng Zoom Mới'}
                  </Button>
                </div>

                <Text type="secondary" style={{ fontSize: 11.5 }}>
                  <SafetyCertificateOutlined style={{ color: '#16a34a', marginRight: 4 }} />
                  {isEnglish
                    ? 'Non-destructive sync: preserves all existing LAK class links while adding Zoom auto-recording & early-leave alerts.'
                    : 'Đồng bộ song song an toàn: giữ nguyên toàn bộ trường dữ liệu hiện có của lớp, tự động tải video sau mỗi buổi học và báo chuông khi học sinh rời phòng giữa giờ.'}
                </Text>
              </div>
            </Card>
          </Col>

          {/* CỘT PHẢI: VIDEO RECORDING TRÊN ZOOM CLOUD CỦA RIÊNG LỚP NÀY & TRẠNG THÁI LIVE */}
          <Col xs={24} lg={11}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Thẻ Video Recording trên Zoom Cloud của lớp */}
              <Card
                variant="borderless"
                style={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                    ☁️{' '}
                    {isEnglish
                      ? 'Zoom Cloud Recordings of This Class'
                      : 'Video Buổi Học Trên Zoom Cloud Của Lớp'}
                  </Text>
                  {missingSessions.length > 0 && (
                    <Space size={6} wrap>
                      <Tag color="warning" style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}>
                        {missingSessions.length}{' '}
                        {isEnglish ? 'missing' : 'buổi thiếu'}
                      </Tag>
                      <Button
                        size="small"
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        loading={syncingUuid === 'ALL_MISSING'}
                        data-testid={`btn-classroom-sync-all-missing-${cls?.id}`}
                        onClick={handleSyncAllMissingOfClass}
                        style={{ borderRadius: 6, fontWeight: 600, minHeight: isMobile ? 34 : 28 }}
                      >
                        {isEnglish
                          ? `Sync All (${missingSessions.length})`
                          : `Kéo Tất Cả (${missingSessions.length})`}
                      </Button>
                    </Space>
                  )}
                </div>

                {classAuditItems.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      isEnglish
                        ? 'No Zoom Cloud recordings found in the last 35 days for this class.'
                        : 'Chưa có bản ghi Cloud nào trên Zoom trong 35 ngày qua cho lớp này.'
                    }
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {classAuditItems.map((rec) => {
                      const slotKey = `${cls?.id}_${rec.sessionDate}`;
                      const liveJob = activeJobsBySlotKey[slotKey];
                      const isMissing = rec.syncStatus === 'MISSING_NEEDS_SYNC';

                      return (
                        <div
                          key={rec.zoomMeetingUuid}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            <div>
                              <Text strong style={{ fontSize: 13 }}>
                                📅 {rec.dmyDate}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 11.5, marginLeft: 8 }}>
                                {rec.durationMinutes}m • {formatMb(rec.totalMp4Bytes)}
                              </Text>
                            </div>

                            {liveJob ? (
                              <Tag color="processing" style={{ margin: 0, borderRadius: 5 }}>
                                🔄 {liveJob.progressPercent || 10}%
                              </Tag>
                            ) : isMissing ? (
                              <Button
                                size="small"
                                type="primary"
                                icon={<CloudDownloadOutlined />}
                                loading={syncingUuid === rec.zoomMeetingUuid}
                                onClick={() => handleSyncSingleSession(rec.zoomMeetingUuid)}
                                style={{ borderRadius: 6, minHeight: isMobile ? 36 : 28 }}
                              >
                                {isEnglish ? 'Sync Now' : 'Kéo Về Ngay'}
                              </Button>
                            ) : (
                              <Tag
                                icon={<CheckCircleFilled />}
                                color="success"
                                style={{ margin: 0, borderRadius: 5 }}
                              >
                                {isEnglish ? 'Synced' : 'Đã đồng bộ'}
                              </Tag>
                            )}
                          </div>

                          {liveJob && (
                            <Progress
                              percent={liveJob.progressPercent || 15}
                              size="small"
                              status="active"
                              showInfo={false}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Thẻ Trạng thái Live & Rời phòng sớm của lớp */}
              <Card
                variant="borderless"
                style={{
                  borderRadius: 12,
                  border: liveState.isLiveOnZoom ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13.5 }}>
                    📡 {isEnglish ? 'Realtime Zoom Room Status' : 'Trạng Thái Phòng Zoom Trực Tuyến'}
                  </Text>
                  {liveState.isLiveOnZoom ? (
                    <Tag color="success" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                      🟢 LIVE ({liveState.liveParticipantCount || 0} online)
                    </Tag>
                  ) : (
                    <Tag style={{ margin: 0, borderRadius: 6 }}>
                      {isEnglish ? 'Idle / Offline' : 'Phòng đang nghỉ'}
                    </Tag>
                  )}
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
