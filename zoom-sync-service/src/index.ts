import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  dbDev,
  dbProd,
  getZoomRouterConfig,
  updateZoomRouterConfig,
  resolveWebhookTargets,
  resolveReadOnlyTargetDb,
  resolveApiTargetDb,
  resolveWriteTargetsForAction,
  RoutingMode,
} from './config/firestoreRouter';
import { ZoomOAuthClient } from './clients/zoomOAuthClient';
import {
  computeMappingSuggestions,
  formatZoomMeetingIdPretty,
  normalizeZoomMeetingId,
  provisionRecurringZoomRoomForClass,
} from './services/zoomClassMatcher';
import {
  auditZoomCloudRecordingsAgainstDb,
  syncSingleZoomMeetingRecordingToTargets,
} from './services/zoomRecordingStreamService';
import { handleIncomingZoomWebhookEvent } from './services/zoomRealtimeEventService';

dotenv.config();

// ============================================================================
// 1. PUBLIC ZOOM WEBHOOK ENDPOINT (lakZoomWebhook) — HMAC-SHA256 VERIFIED
// ============================================================================
export const lakZoomWebhook = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(200).json({ service: 'lak-zoom-sync-webhook', status: 'READY' });
      return;
    }

    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
    const body = req.body || {};

    // Bước 1: Phản hồi xác thực URL của Zoom Marketplace (endpoint.url_validation)
    if (body.event === 'endpoint.url_validation' && body.payload?.plainToken) {
      const challenge = ZoomOAuthClient.buildUrlValidationResponse(String(body.payload.plainToken));
      res.status(200).json(challenge);
      return;
    }

    // Bước 2: Kiểm tra chữ ký bảo mật HMAC-SHA256 chống giả mạo gói tin
    const sig = req.headers['x-zm-signature'] as string | undefined;
    const ts = req.headers['x-zm-request-timestamp'] as string | undefined;
    if (!ZoomOAuthClient.verifyWebhookSignature(rawBody, ts, sig)) {
      res.status(401).json({ error: 'INVALID_ZOOM_SIGNATURE' });
      return;
    }

    try {
      const targets = await resolveWebhookTargets();
      const result = await handleIncomingZoomWebhookEvent(body.event, body.payload, targets);
      res.status(200).json({ ok: true, result });
    } catch (err: any) {
      console.error('[lakZoomWebhook] Error:', err?.message || err);
      res.status(500).json({ ok: false, error: err?.message || 'Webhook processing error' });
    }
  }
);

// ============================================================================
// 2. MANAGEMENT & SYNC REST API (lakZoomApi) — ISOLATED CODEBASE FOR LAK ERP
// ============================================================================
const app = express();
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-lak-target-env',
      'x-lak-actor-id',
      'x-lak-actor-role',
    ],
  })
);
app.use(express.json({ limit: '2mb' }));

function readReqEnv(req: express.Request): string {
  return String(req.headers['x-lak-target-env'] || req.query.env || 'dev').toLowerCase();
}

// 2.1. Tổng quan sức khỏe Zoom Account + Công tắc Router DEV/PROD
app.get('/status', async (req, res) => {
  try {
    const [routerConfig, me, accountRooms] = await Promise.all([
      getZoomRouterConfig(true),
      ZoomOAuthClient.request<any>('/users/me'),
      ZoomOAuthClient.listAllAccountRooms(),
    ]);

    res.json({
      success: true,
      data: {
        routerConfig,
        zoomOwner: {
          id: me.id,
          email: me.email,
          accountNumber: me.account_number,
          roleName: me.role_name,
          timezone: me.timezone,
        },
        usersCount: accountRooms.users.length,
        rooms: accountRooms.rooms,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to read Zoom status' });
  }
});

// 2.2. Cập nhật Công tắc Điều hướng Môi trường (CHỈ DUY NHẤT IT ADMIN MỚI CÓ QUYỀN!)
app.post('/router-config', async (req, res) => {
  try {
    const actorId = String(req.headers['x-lak-actor-id'] || req.body?.actorId || '').trim();
    const headerRole = String(req.headers['x-lak-actor-role'] || req.body?.actorRole || '')
      .trim()
      .toLowerCase();

    if (!actorId) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ADMIN_ONLY: Thiếu định danh tài khoản quản trị.',
      });
      return;
    }

    if (headerRole && headerRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ADMIN_ONLY: Chỉ IT Admin mới có quyền cấu hình Công tắc Điều hướng Zoom.',
      });
      return;
    }

    const devActorSnap = await getDoc(doc(dbDev, 'users', actorId));
    const prodActorSnap = !devActorSnap.exists()
      ? await getDoc(doc(dbProd, 'users', actorId))
      : null;
    const resolvedRole = String(
      (devActorSnap.exists() ? devActorSnap.data()?.role : prodActorSnap?.data()?.role) || ''
    ).toLowerCase();

    if (resolvedRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ADMIN_ONLY: Chỉ IT Admin mới có quyền cấu hình Công tắc Điều hướng Zoom.',
      });
      return;
    }

    const mode = req.body?.routingMode as RoutingMode | undefined;
    const updated = await updateZoomRouterConfig(
      {
        ...(mode ? { routingMode: mode } : {}),
        ...(req.body?.earlyLeaveThresholdMinutes !== undefined
          ? { earlyLeaveThresholdMinutes: Number(req.body.earlyLeaveThresholdMinutes) }
          : {}),
        ...(req.body?.autoTrashZoomCloudAfterDays !== undefined
          ? { autoTrashZoomCloudAfterDays: Number(req.body.autoTrashZoomCloudAfterDays) }
          : {}),
      },
      actorId
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// 2.3. Yêu cầu #2: Lấy bảng Gợi ý Mapping thông minh giữa Lớp LAK và Phòng Zoom (Read-Only an toàn cho cả DEV & PROD)
app.get('/mapping-suggestions', async (req, res) => {
  try {
    const { env, db } = resolveReadOnlyTargetDb(readReqEnv(req));
    const [clsSnap, accountRooms] = await Promise.all([
      getDocs(collection(db, 'classes')),
      ZoomOAuthClient.listAllAccountRooms(),
    ]);

    const lakClasses = clsSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
    const suggestions = computeMappingSuggestions(lakClasses, accountRooms.rooms);

    res.json({
      success: true,
      env,
      data: {
        suggestions,
        zoomRooms: accountRooms.rooms,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// 2.4. Yêu cầu #2, #3, #7: Xác nhận Liên kết Lớp LAK <-> Phòng Zoom (Hỗ trợ ghi kép ở DUAL_MIRROR, giữ nguyên field cũ!)
app.post('/link-class', async (req, res) => {
  try {
    const writeTargets = await resolveWriteTargetsForAction(readReqEnv(req));
    const { classId, zoomMeetingId, ensureCloudAutoRecording = true, actorId = 'ADM001' } = req.body || {};
    const cleanId = normalizeZoomMeetingId(zoomMeetingId);
    if (!classId || !cleanId) {
      res.status(400).json({ success: false, error: 'Missing classId or valid zoomMeetingId' });
      return;
    }

    // Nếu được yêu cầu, bật luôn auto_recording="cloud" trên Zoom cho phòng đó
    if (ensureCloudAutoRecording) {
      await ZoomOAuthClient.request(`/meetings/${cleanId}`, {
        method: 'PATCH',
        body: JSON.stringify({ settings: { auto_recording: 'cloud' } }),
      }).catch(() => {});
    }

    const detail = await ZoomOAuthClient.request<any>(`/meetings/${cleanId}`);
    const prettyId = formatZoomMeetingIdPretty(cleanId);
    const nowIso = new Date().toISOString();

    const updatedEnvs: string[] = [];
    let finalZoomConfig: any = null;

    for (const target of writeTargets) {
      const classRef = doc(target.db, 'classes', String(classId));
      const classSnap = await getDoc(classRef);
      if (!classSnap.exists()) {
        continue;
      }

      const joinUrl = detail.join_url || classSnap.data().zoomStudentLink || '';
      const zoomConfig = {
        isLinked: true,
        zoomMeetingId: cleanId,
        prettyMeetingId: prettyId,
        topic: detail.topic || '',
        meetingType: detail.type,
        hostEmail: detail.host_email || 'lakvietnam@lakeducation.com',
        autoRecording: detail.settings?.auto_recording || 'cloud',
        weeklyDaysZoom: detail.recurrence?.weekly_days || '',
        joinUrl,
        passcode: detail.password || classSnap.data().passcode || '',
        linkedAt: nowIso,
        linkedBy: actorId,
      };
      finalZoomConfig = zoomConfig;

      // Ghi SONG SONG: cập nhật cả field chuẩn cũ lẫn zoomConfig mới, KHÔNG XÓA BẤT KỲ FIELD CŨ NÀO!
      await setDoc(
        classRef,
        {
          platform: 'Zoom Meeting',
          meetingId: prettyId,
          meetingLink: joinUrl,
          zoomStudentLink: joinUrl,
          zoomHostLink: joinUrl,
          ...(detail.password ? { passcode: String(detail.password) } : {}),
          zoomConfig,
          updatedAt: nowIso,
        },
        { merge: true }
      );
      updatedEnvs.push(target.env);
    }

    if (updatedEnvs.length === 0) {
      res.status(404).json({ success: false, error: `Class ${classId} not found in target database(s)` });
      return;
    }

    res.json({
      success: true,
      writtenEnvs: updatedEnvs,
      data: { classId, zoomConfig: finalZoomConfig },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// 2.5. Yêu cầu #1: Tự động tạo phòng Zoom định kỳ khi tạo/sửa lớp trên LAK
app.post('/provision-room', async (req, res) => {
  try {
    // Kiểm tra quyền ghi môi trường đích trước khi gọi Zoom
    await resolveApiTargetDb(readReqEnv(req));
    const provisioned = await provisionRecurringZoomRoomForClass(req.body || {});
    res.json({ success: true, data: provisioned });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// 2.6.1. Đọc trực tiếp chi tiết 1 phòng học trên Zoom API (phục vụ kiểm tra đối soát thông số phòng vừa tạo)
app.get('/meetings/:meetingId', async (req, res) => {
  try {
    const cleanId = normalizeZoomMeetingId(req.params.meetingId);
    if (!cleanId) {
      res.status(400).json({ success: false, error: 'Invalid meetingId' });
      return;
    }
    const detail = await ZoomOAuthClient.request<any>(`/meetings/${cleanId}`);
    res.json({ success: true, data: detail });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err?.message });
  }
});

// Xóa phòng Zoom test (phục vụ dọn rác QC Teardown Trục 5)
app.delete('/meetings/:meetingId', async (req, res) => {
  try {
    const cleanId = normalizeZoomMeetingId(req.params.meetingId);
    if (!cleanId) {
      res.status(400).json({ success: false, error: 'Invalid meetingId' });
      return;
    }
    await ZoomOAuthClient.request(`/meetings/${cleanId}`, { method: 'DELETE' });
    res.json({ success: true, deletedMeetingId: cleanId });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// 2.6. Yêu cầu #8: Quét đối soát các bản ghi còn thiếu trên Zoom Cloud (Read-Only an toàn cho cả DEV & PROD)
app.get('/missing-recordings', async (req, res) => {
  try {
    const { env, db } = resolveReadOnlyTargetDb(readReqEnv(req));
    const todayIso = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 35 * 86400 * 1000).toISOString().slice(0, 10);
    const fromDate = String(req.query.from || defaultFrom);
    const toDate = String(req.query.to || todayIso);

    const items = await auditZoomCloudRecordingsAgainstDb(db, fromDate, toDate);
    res.json({
      success: true,
      env,
      data: {
        fromDate,
        toDate,
        items,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// 2.7. Yêu cầu #8 & #10: Thực thi Migration kéo bù các bản ghi còn thiếu (Hỗ trợ ghi kép ở DUAL_MIRROR & tái sử dụng 1 file Drive chung!)
app.post('/backfill-sync', async (req, res) => {
  try {
    const writeTargets = await resolveWriteTargetsForAction(readReqEnv(req));
    const uuids: string[] = Array.isArray(req.body?.zoomMeetingUuids)
      ? req.body.zoomMeetingUuids
      : req.body?.zoomMeetingUuid
      ? [String(req.body.zoomMeetingUuid)]
      : [];

    if (uuids.length === 0) {
      res.status(400).json({ success: false, error: 'No zoomMeetingUuids provided' });
      return;
    }

    const results: any[] = [];
    for (const u of uuids) {
      const r = await syncSingleZoomMeetingRecordingToTargets({
        zoomMeetingUuid: u,
        targets: writeTargets,
        triggerSource: 'BACKFILL_MIGRATION',
        overrideClassId: req.body?.overrideClassId,
        overrideSessionDate: req.body?.overrideSessionDate,
        allowAlongsideManual: Boolean(req.body?.allowAlongsideManual),
      });
      results.push({ uuid: u, ...r });
    }

    res.json({
      success: true,
      writtenEnvs: writeTargets.map((t) => t.env),
      data: results,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// 2.8. Giả lập sự kiện học sinh rời phòng Zoom giữa giờ trên DEV để kiểm thử chuông báo (#6)
app.post('/simulate-early-leave-dev', async (req, res) => {
  try {
    const { db } = await resolveApiTargetDb('dev');
    const classId = String(req.body?.classId || 'LH004');
    const zoomMeetingId = classId === 'LH002' ? '96545837709' : '97784357897';
    const studentZoomName = String(req.body?.studentZoomName || 'KENJI< PHÚ QUÝ>');

    // Giả lập rời lớp lúc 20:05 giờ Việt Nam (13:05 UTC — cách giờ tan 21:20 là 75 phút >= ngưỡng 10p!)
    const todayVn = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const simulatedLeaveUtc = `${todayVn}T13:05:00Z`;

    const result = await handleIncomingZoomWebhookEvent(
      'meeting.participant_left',
      {
        object: {
          id: zoomMeetingId,
          uuid: `SIM_DEV_${Date.now()}`,
          topic: classId === 'LH002' ? 'WP03 G5 Ms. Maj/357 7:20-9:20 pm' : 'WP02 G5 Ms. Maj/246 7:20-9:20 pm',
          start_time: `${todayVn}T12:20:00Z`,
          participant: {
            user_name: studentZoomName,
            leave_time: simulatedLeaveUtc,
            leave_reason: req.body?.leaveReason || 'Left the meeting (network connection issue)',
          },
        },
      },
      [{ env: 'dev', db }]
    );

    res.json({ success: true, simulatedOn: 'dev', result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// Xóa job sync (hỗ trợ dọn rác hoặc clear trạng thái lỗi)
app.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { env, db } = await resolveApiTargetDb(readReqEnv(req));
    await deleteDoc(doc(db, 'zoom_sync_jobs', req.params.jobId));
    res.json({ success: true, env, deletedJobId: req.params.jobId });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

export const lakZoomApi = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
    maxInstances: 10,
  },
  app
);
