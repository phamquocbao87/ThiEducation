import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { ZoomBackendGateway } from '../../../shared/services/ZoomBackendGateway';
import { useZoomSyncJobs } from '../../../shared/hooks/useZoomSyncJobs';
import { ZoomMappingModuleService } from '../services/ZoomMappingModuleService';
import { ZoomBackfillModuleService } from '../services/ZoomBackfillModuleService';
import { ZoomLiveMonitorModuleService } from '../services/ZoomLiveMonitorModuleService';

export function useZoomSyncController() {
  const { currentUser } = useAuth();
  const actorId = currentUser?.id || currentUser?.code || 'ADM001';
  const actorRole = currentUser?.role || '';
  const currentEnv = ZoomBackendGateway.getCurrentTargetEnv();

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [savingRouter, setSavingRouter] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [linkingClassId, setLinkingClassId] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [syncingBackfill, setSyncingBackfill] = useState(false);
  const [simulatingLeave, setSimulatingLeave] = useState(false);

  const [statusData, setStatusData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [zoomRooms, setZoomRooms] = useState([]);
  const [auditItems, setAuditItems] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [apiError, setApiError] = useState('');

  const { allJobs, activeJobsBySlotKey, unassignedJobs } = useZoomSyncJobs();

  const loadAllOverview = useCallback(async () => {
    setLoadingStatus(true);
    setLoadingMappings(true);
    setApiError('');
    try {
      const [st, mapData] = await Promise.all([
        ZoomMappingModuleService.fetchStatusAndRouter(actorId),
        ZoomMappingModuleService.fetchMappingSuggestions(currentEnv, actorId),
      ]);
      setStatusData(st);
      setSuggestions(mapData.suggestions || []);
      setZoomRooms(mapData.zoomRooms || []);
    } catch (err) {
      setApiError(err?.message || 'Không thể kết nối tới dịch vụ lakZoomApi.');
    } finally {
      setLoadingStatus(false);
      setLoadingMappings(false);
    }
  }, [actorId, currentEnv]);

  const loadMissingAudit = useCallback(
    async (fromDate, toDate) => {
      setLoadingAudit(true);
      try {
        const res = await ZoomBackfillModuleService.auditMissingRecordings({
          fromDate,
          toDate,
          targetEnv: currentEnv,
          actorId,
        });
        setAuditItems(res.items || []);
      } catch (err) {
        message.error(err?.message || 'Lỗi quét đối soát bản ghi trên Zoom Cloud.');
      } finally {
        setLoadingAudit(false);
      }
    },
    [actorId, currentEnv]
  );

  useEffect(() => {
    loadAllOverview();
    loadMissingAudit();
  }, [loadAllOverview, loadMissingAudit]);

  useEffect(() => {
    const unsub = ZoomLiveMonitorModuleService.subscribeLinkedClassesLiveState(setLiveClasses);
    return () => unsub();
  }, []);

  const handleUpdateRouterConfig = async (patch) => {
    setSavingRouter(true);
    try {
      const updated = await ZoomMappingModuleService.updateRouterConfig(patch, actorId, actorRole);
      setStatusData((prev) => (prev ? { ...prev, routerConfig: updated } : prev));
      message.success('Đã cập nhật cấu hình Bộ Định Tuyến Môi Trường Zoom!');
    } catch (err) {
      message.error(err?.message || 'Không thể cập nhật cấu hình Router.');
    } finally {
      setSavingRouter(false);
    }
  };

  const handleLinkClass = async (classId, zoomMeetingId, ensureCloudAutoRecording = true) => {
    setLinkingClassId(classId);
    try {
      await ZoomMappingModuleService.linkClassToZoomRoom({
        classId,
        zoomMeetingId,
        ensureCloudAutoRecording,
        targetEnv: currentEnv,
        actorId,
      });
      message.success(`Đã liên kết lớp ${classId} với phòng Zoom ${zoomMeetingId} thành công!`);
      await Promise.all([loadAllOverview(), loadMissingAudit()]);
    } catch (err) {
      message.error(err?.message || 'Không thể liên kết lớp với phòng Zoom.');
    } finally {
      setLinkingClassId(null);
    }
  };

  const handleRunBackfill = async (uuids, extra = {}) => {
    if (!Array.isArray(uuids) || uuids.length === 0) return;
    setSyncingBackfill(true);
    try {
      await ZoomBackfillModuleService.triggerBackfillSync({
        zoomMeetingUuids: uuids,
        targetEnv: currentEnv,
        actorId,
        ...extra,
      });
      message.success(`Đã đồng bộ xong ${uuids.length} buổi học từ Zoom Cloud về Google Drive & Lịch học!`);
      await loadMissingAudit();
    } catch (err) {
      message.error(err?.message || 'Lỗi trong quá trình tải bù bản ghi từ Zoom Cloud.');
    } finally {
      setSyncingBackfill(false);
    }
  };

  const handleSimulateEarlyLeave = async (classId = 'LH004', studentZoomName = 'KENJI< PHÚ QUÝ>') => {
    setSimulatingLeave(true);
    try {
      await ZoomLiveMonitorModuleService.simulateStudentEarlyLeaveOnDev({
        classId,
        studentZoomName,
        actorId,
      });
      message.success(
        `Đã giả lập sự kiện học viên "${studentZoomName}" rời phòng ${classId} giữa giờ trên DEV! Kiểm tra chuông thông báo góc phải.`
      );
    } catch (err) {
      message.error(err?.message || 'Không thể giả lập sự kiện rời phòng.');
    } finally {
      setSimulatingLeave(false);
    }
  };

  return {
    currentEnv,
    statusData,
    suggestions,
    zoomRooms,
    auditItems,
    liveClasses,
    allJobs,
    activeJobsBySlotKey,
    unassignedJobs,
    apiError,
    loadingStatus,
    savingRouter,
    loadingMappings,
    linkingClassId,
    loadingAudit,
    syncingBackfill,
    simulatingLeave,
    loadAllOverview,
    loadMissingAudit,
    handleUpdateRouterConfig,
    handleLinkClass,
    handleRunBackfill,
    handleSimulateEarlyLeave,
  };
}
