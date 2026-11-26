import {
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { ZoomOAuthClient } from '../clients/zoomOAuthClient';
import {
  matchZoomEventToLakClass,
  normalizeZoomMeetingId,
} from './zoomClassMatcher';
import { dbDev, dbProd, getZoomRouterConfig, LakEnvKey } from '../config/firestoreRouter';

const DRIVE_API_BASE = 'https://hosting-store-api.phuchungvang.com/api';
const DRIVE_APP_ID = 'lakeducation_com';
const DRIVE_APP_TOKEN = 'app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe';
const DRIVE_RECORDINGS_FOLDER = '06_CLASS_RECORDINGS_MATERIALS/2026';

// 8 MB là bội số chính xác của 256 KB (chuẩn bắt buộc của Google Drive Resumable Upload API)
const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(raw: string): string {
  return String(raw || 'Zoom_Recording')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchOptionalZoomJsonFile(downloadUrl: string): Promise<any | null> {
  try {
    const token = await ZoomOAuthClient.getAccessToken(0);
    const resp = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Stream trực tiếp từ Zoom CDN -> Google Drive Resumable Upload theo từng mảnh 8MB (Zero-RAM Buffering)
 */
async function streamZoomMp4ToGoogleDrive(params: {
  downloadUrl: string;
  expectedBytes: number;
  fileName: string;
  directDownloadToken?: string;
  onProgress?: (percent: number, uploadedBytes: number) => Promise<void>;
}): Promise<{ driveFileId: string; previewUrl: string; sizeBytes: number }> {
  // 1. Tạo phiên Resumable Upload trên Google Drive 2TB của LAK Education
  const initResp = await fetch(`${DRIVE_API_BASE}/storage/upload-session`, {
    method: 'POST',
    headers: {
      'x-app-id': DRIVE_APP_ID,
      'x-app-token': DRIVE_APP_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: params.fileName,
      mimeType: 'video/mp4',
      fileSize: params.expectedBytes,
      folderPath: DRIVE_RECORDINGS_FOLDER,
    }),
  });

  const initJson = (await initResp.json()) as any;
  if (!initJson.success || !initJson.data?.uploadUrl) {
    throw new Error(`DRIVE_SESSION_INIT_FAILED: ${initJson.error || 'Missing uploadUrl'}`);
  }
  const uploadUrl: string = initJson.data.uploadUrl;

  // 2. Mở luồng đọc nhị phân từ Zoom (dùng token_index=1 riêng biệt để không bị hủy giữa chừng!)
  const bearerToken = params.directDownloadToken || (await ZoomOAuthClient.getAccessToken(1));
  const zoomResp = await fetch(params.downloadUrl, {
    headers: { Authorization: `Bearer ${bearerToken}` },
    redirect: 'follow',
  });

  if (!zoomResp.ok || !zoomResp.body) {
    throw new Error(`ZOOM_DOWNLOAD_STREAM_FAILED (${zoomResp.status})`);
  }

  const contentLenHeader = Number(zoomResp.headers.get('content-length') || 0);
  const totalBytes = contentLenHeader > 0 ? contentLenHeader : params.expectedBytes;

  const reader = zoomResp.body.getReader();
  let pendingBuffer = Buffer.alloc(0);
  let offset = 0;
  let driveMeta: any = null;
  let lastReportedPct = 10;

  const flushChunkToDrive = async (chunk: Buffer, isFinal: boolean) => {
    const startByte = offset;
    const endByte = offset + chunk.length - 1;
    const rangeHeader = `bytes ${startByte}-${endByte}/${totalBytes}`;

    const putResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunk.length),
        'Content-Range': rangeHeader,
      },
      body: new Uint8Array(chunk),
    });

    // Google Drive trả 308 Resume Incomplete cho các chunk giữa, và 200/201 cho chunk cuối cùng
    if (putResp.status !== 308 && putResp.status !== 200 && putResp.status !== 201) {
      const errTxt = await putResp.text();
      throw new Error(`DRIVE_CHUNK_PUT_FAILED (${putResp.status} at ${rangeHeader}): ${errTxt.slice(0, 200)}`);
    }

    offset += chunk.length;

    if (putResp.status === 200 || putResp.status === 201 || isFinal) {
      try {
        driveMeta = await putResp.json();
      } catch {
        driveMeta = null;
      }
    }

    const pct = Math.min(95, Math.max(12, Math.round((offset / totalBytes) * 90) + 5));
    if (params.onProgress && (pct - lastReportedPct >= 12 || isFinal)) {
      lastReportedPct = pct;
      await params.onProgress(pct, offset).catch(() => {});
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.byteLength > 0) {
      pendingBuffer = Buffer.concat([pendingBuffer, Buffer.from(value)]);
      while (pendingBuffer.length >= CHUNK_SIZE_BYTES) {
        const slice = pendingBuffer.subarray(0, CHUNK_SIZE_BYTES);
        pendingBuffer = pendingBuffer.subarray(CHUNK_SIZE_BYTES);
        await flushChunkToDrive(slice, false);
      }
    }
  }

  if (pendingBuffer.length > 0) {
    await flushChunkToDrive(pendingBuffer, true);
  }

  if (!driveMeta?.id) {
    throw new Error('DRIVE_FINALIZE_MISSING_ID: Google Drive did not return file ID after final chunk');
  }

  const driveSize = Number(driveMeta.size || offset);
  if (totalBytes > 0 && Math.abs(driveSize - totalBytes) > 1024) {
    throw new Error(`BYTE_MISMATCH: Zoom=${totalBytes} bytes vs Drive=${driveSize} bytes`);
  }

  const previewUrl = `https://drive.google.com/file/d/${driveMeta.id}/preview`;

  // 3. Ghi sổ quản lý trên hosting-store registry (best-effort)
  await fetch(`${DRIVE_API_BASE}/storage/register-upload`, {
    method: 'POST',
    headers: {
      'x-app-id': DRIVE_APP_ID,
      'x-app-token': DRIVE_APP_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      driveFileId: driveMeta.id,
      fileName: params.fileName,
      mimeType: 'video/mp4',
      sizeBytes: driveSize,
      folderPath: DRIVE_RECORDINGS_FOLDER,
      tag: 'zoom_auto_recording',
      title: params.fileName,
    }),
  }).catch(() => {});

  return {
    driveFileId: driveMeta.id,
    previewUrl,
    sizeBytes: driveSize,
  };
}

export interface MissingRecordingAuditItem {
  zoomMeetingUuid: string;
  zoomMeetingId: string;
  topic: string;
  startTimeUtc: string;
  sessionDate: string;
  dmyDate: string;
  durationMinutes: number;
  mp4Count: number;
  totalMp4Bytes: number;
  hasAiSummary: boolean;
  matchedClassId: string | null;
  matchedClassName: string | null;
  syncStatus: 'MISSING_NEEDS_SYNC' | 'ALREADY_SYNCED_AUTO' | 'HAS_MANUAL_UPLOAD' | 'SKIPPED_SHORT_FRAGMENT' | 'UNASSIGNED_CLASS';
  existingRecordingTitle?: string;
}

/**
 * Yêu cầu #8: Quét đối soát toàn bộ các buổi học trên Zoom Cloud so với LAK Firestore để tìm buổi còn thiếu
 */
export async function auditZoomCloudRecordingsAgainstDb(
  db: Firestore,
  fromDate: string,
  toDate: string
): Promise<MissingRecordingAuditItem[]> {
  const routerCfg = await getZoomRouterConfig();
  const [zoomMeetings, clsSnap, matSnap] = await Promise.all([
    ZoomOAuthClient.listCloudRecordingsRange(fromDate, toDate),
    getDocs(collection(db, 'classes')),
    getDocs(collection(db, 'learning_materials')),
  ]);

  const lakClasses = clsSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
  const existingMaterials = matSnap.docs
    .map((d) => ({ ...(d.data() as any), id: d.id }))
    .filter((m) => !m.isDeleted && m.isSessionRecording);

  const syncedFileIds = new Set<string>();
  const syncedUuids = new Set<string>();
  const manualBySlot = new Map<string, any>();
  const autoBySlot = new Map<string, any>();

  for (const m of existingMaterials) {
    if (m.zoomMeta?.zoomRecordingFileId) syncedFileIds.add(String(m.zoomMeta.zoomRecordingFileId));
    if (m.zoomMeta?.zoomMeetingUuid) syncedUuids.add(String(m.zoomMeta.zoomMeetingUuid));
    const slotKey = `${m.classId}_${m.sessionDate}`;
    if (m.recordingSource === 'ZOOM_AUTO_SYNC') {
      autoBySlot.set(slotKey, m);
    } else {
      manualBySlot.set(slotKey, m);
    }
  }

  const items: MissingRecordingAuditItem[] = [];

  for (const zm of zoomMeetings) {
    const mp4Files = (zm.recording_files || []).filter(
      (rf: any) => rf.file_type === 'MP4' && rf.status === 'completed'
    );
    if (mp4Files.length === 0) {
      // Đang live hoặc đang render chưa xong
      continue;
    }

    const totalMp4Bytes = mp4Files.reduce((acc: number, f: any) => acc + Number(f.file_size || 0), 0);
    const durationMin = Number(zm.duration || 0);
    const hasAiSummary = (zm.recording_files || []).some((rf: any) => rf.recording_type === 'summary');

    const match = matchZoomEventToLakClass(zm.id, zm.topic || '', zm.start_time, lakClasses);

    // Chốt lọc rác: Bỏ qua các đoạn nháp mở nhầm phòng (< 10 phút VÀ < 25 MB)
    if (
      durationMin * 60 < routerCfg.minRecordingDurationSeconds &&
      totalMp4Bytes < routerCfg.minRecordingSizeBytes
    ) {
      items.push({
        zoomMeetingUuid: zm.uuid,
        zoomMeetingId: normalizeZoomMeetingId(zm.id),
        topic: zm.topic || '',
        startTimeUtc: zm.start_time,
        sessionDate: match.sessionDate,
        dmyDate: match.dmyDate,
        durationMinutes: durationMin,
        mp4Count: mp4Files.length,
        totalMp4Bytes,
        hasAiSummary,
        matchedClassId: match.matchedClass?.id || null,
        matchedClassName: match.matchedClass?.name || null,
        syncStatus: 'SKIPPED_SHORT_FRAGMENT',
      });
      continue;
    }

    if (!match.matchedClass) {
      items.push({
        zoomMeetingUuid: zm.uuid,
        zoomMeetingId: normalizeZoomMeetingId(zm.id),
        topic: zm.topic || '',
        startTimeUtc: zm.start_time,
        sessionDate: match.sessionDate,
        dmyDate: match.dmyDate,
        durationMinutes: durationMin,
        mp4Count: mp4Files.length,
        totalMp4Bytes,
        hasAiSummary,
        matchedClassId: null,
        matchedClassName: null,
        syncStatus: 'UNASSIGNED_CLASS',
      });
      continue;
    }

    const slotKey = `${match.matchedClass.id}_${match.sessionDate}`;
    const allFilesAlreadySynced = mp4Files.every((f: any) => syncedFileIds.has(String(f.id)));

    if (allFilesAlreadySynced || syncedUuids.has(String(zm.uuid)) || autoBySlot.has(slotKey)) {
      const ex = autoBySlot.get(slotKey);
      items.push({
        zoomMeetingUuid: zm.uuid,
        zoomMeetingId: normalizeZoomMeetingId(zm.id),
        topic: zm.topic || '',
        startTimeUtc: zm.start_time,
        sessionDate: match.sessionDate,
        dmyDate: match.dmyDate,
        durationMinutes: durationMin,
        mp4Count: mp4Files.length,
        totalMp4Bytes,
        hasAiSummary,
        matchedClassId: match.matchedClass.id,
        matchedClassName: match.matchedClass.name,
        syncStatus: 'ALREADY_SYNCED_AUTO',
        existingRecordingTitle: ex?.title,
      });
    } else if (manualBySlot.has(slotKey)) {
      const exMan = manualBySlot.get(slotKey);
      items.push({
        zoomMeetingUuid: zm.uuid,
        zoomMeetingId: normalizeZoomMeetingId(zm.id),
        topic: zm.topic || '',
        startTimeUtc: zm.start_time,
        sessionDate: match.sessionDate,
        dmyDate: match.dmyDate,
        durationMinutes: durationMin,
        mp4Count: mp4Files.length,
        totalMp4Bytes,
        hasAiSummary,
        matchedClassId: match.matchedClass.id,
        matchedClassName: match.matchedClass.name,
        syncStatus: 'HAS_MANUAL_UPLOAD',
        existingRecordingTitle: exMan?.title,
      });
    } else {
      items.push({
        zoomMeetingUuid: zm.uuid,
        zoomMeetingId: normalizeZoomMeetingId(zm.id),
        topic: zm.topic || '',
        startTimeUtc: zm.start_time,
        sessionDate: match.sessionDate,
        dmyDate: match.dmyDate,
        durationMinutes: durationMin,
        mp4Count: mp4Files.length,
        totalMp4Bytes,
        hasAiSummary,
        matchedClassId: match.matchedClass.id,
        matchedClassName: match.matchedClass.name,
        syncStatus: 'MISSING_NEEDS_SYNC',
      });
    }
  }

  return items;
}

/**
 * Thực thi đồng bộ 1 phiên bản ghi Zoom (từ Webhook #9 hoặc Migration #8) và cập nhật tiến trình #10
 */
export async function syncSingleZoomMeetingRecordingToTargets(params: {
  zoomMeetingUuid: string;
  targets: Array<{ env: LakEnvKey; db: Firestore }>;
  triggerSource: 'WEBHOOK_AUTO' | 'BACKFILL_MIGRATION';
  directDownloadToken?: string;
  overrideClassId?: string;
  overrideSessionDate?: string;
  allowAlongsideManual?: boolean;
}) {
  const routerCfg = await getZoomRouterConfig();
  const encodedUuid = ZoomOAuthClient.encodeZoomUuid(params.zoomMeetingUuid);
  const recDetail = await ZoomOAuthClient.request<any>(
    `/meetings/${encodedUuid}/recordings?include_fields=download_access_token`
  );

  const rawFiles: any[] = recDetail.recording_files || [];
  // Lọc lấy luồng MP4 chính (nếu Zoom sinh cả active_speaker và shared_screen_with_speaker_view cùng khung giờ, ưu tiên bản shared_screen_with_speaker_view)
  const completedMp4s = rawFiles.filter(
    (f) => f.file_type === 'MP4' && f.status === 'completed'
  );
  const preferredMp4s = completedMp4s.filter((f) =>
    String(f.recording_type || '').includes('shared_screen')
  );
  const mp4List = (preferredMp4s.length > 0 ? preferredMp4s : completedMp4s)
    .filter(
      (f) =>
        Number(recDetail.duration || 0) * 60 >= routerCfg.minRecordingDurationSeconds ||
        Number(f.file_size || 0) >= routerCfg.minRecordingSizeBytes
    )
    .sort(
      (a, b) =>
        new Date(a.recording_start || 0).getTime() - new Date(b.recording_start || 0).getTime()
    );

  if (mp4List.length === 0) {
    return { skipped: true, reason: 'NO_ELIGIBLE_MP4_ABOVE_THRESHOLD' };
  }

  // Đọc AI Summary & Next Steps Homework nếu Zoom đã tạo sẵn
  const summaryFile = rawFiles.find((f) => f.recording_type === 'summary');
  const nextStepsFile = rawFiles.find((f) => f.recording_type === 'summary_next_steps');
  const [summaryJson, nextStepsJson] = await Promise.all([
    summaryFile?.download_url ? fetchOptionalZoomJsonFile(summaryFile.download_url) : Promise.resolve(null),
    nextStepsFile?.download_url ? fetchOptionalZoomJsonFile(nextStepsFile.download_url) : Promise.resolve(null),
  ]);

  const aiSummaryOverview: string = summaryJson?.overall_summary || '';
  const aiNextStepsHomework: string[] = Array.isArray(nextStepsJson?.items)
    ? nextStepsJson.items
        .map((it: any) => it.action_item_text || it.rephrased_text || '')
        .filter(Boolean)
    : [];

  // Xác định lớp học trên target chính đầu tiên
  const primaryDb = params.targets[0].db;
  const clsSnap = await getDocs(collection(primaryDb, 'classes'));
  const lakClasses = clsSnap.docs.map((d) => ({ ...d.data(), id: d.id }));

  const match = params.overrideClassId
    ? {
        matchedClass: lakClasses.find((c) => c.id === params.overrideClassId) || null,
        sessionDate: params.overrideSessionDate || matchZoomEventToLakClass(recDetail.id, recDetail.topic || '', recDetail.start_time, lakClasses).sessionDate,
        dmyDate: matchZoomEventToLakClass(recDetail.id, recDetail.topic || '', recDetail.start_time, lakClasses).dmyDate,
      }
    : matchZoomEventToLakClass(recDetail.id, recDetail.topic || '', recDetail.start_time, lakClasses);

  if (!match.matchedClass) {
    // Lưu vào hàng đợi chờ gán lớp thủ công (Tầng 3 an toàn)
    const safeUuidKey = String(recDetail.uuid).replace(/[^a-zA-Z0-9_-]/g, '_');
    for (const t of params.targets) {
      await setDoc(doc(t.db, 'zoom_sync_jobs', `UNASSIGNED_${safeUuidKey}`), {
        id: `UNASSIGNED_${safeUuidKey}`,
        zoomMeetingUuid: recDetail.uuid,
        zoomMeetingId: normalizeZoomMeetingId(recDetail.id),
        topic: recDetail.topic || '',
        startTimeUtc: recDetail.start_time,
        sessionDate: match.sessionDate,
        status: 'NEEDS_MANUAL_ASSIGN',
        progressPercent: 0,
        triggerSource: params.triggerSource,
        statusMessage: 'Phòng Zoom chưa liên kết lớp — chờ Giáo vụ chọn lớp 1 chạm',
        updatedAt: new Date().toISOString(),
      });
    }
    return { skipped: true, reason: 'NEEDS_MANUAL_ASSIGN' };
  }

  const targetClass = match.matchedClass;
  const sessionDate = params.overrideSessionDate || match.sessionDate;
  const jobDocId = `JOB_${targetClass.id}_${sessionDate}`;

  // Đọc danh sách learning_materials hiện có của từng target VÀ của cả 2 môi trường (để tái sử dụng 1 file Drive chung!)
  const [devMatSnap, prodMatSnap] = await Promise.all([
    getDocs(collection(dbDev, 'learning_materials')),
    getDocs(collection(dbProd, 'learning_materials')).catch(() => null),
  ]);

  const devMats = devMatSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
  const prodMats = prodMatSnap
    ? prodMatSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }))
    : [];
  const allCrossEnvActiveMats = [...devMats, ...prodMats].filter(
    (m) => !m.isDeleted && m.isSessionRecording
  );

  const matsByEnv: Record<LakEnvKey, any[]> = {
    dev: devMats.filter(
      (m) => !m.isDeleted && m.isSessionRecording && m.classId === targetClass.id && m.sessionDate === sessionDate
    ),
    prod: prodMats.filter(
      (m) => !m.isDeleted && m.isSessionRecording && m.classId === targetClass.id && m.sessionDate === sessionDate
    ),
  };

  const syncedResults: any[] = [];

  for (let idx = 0; idx < mp4List.length; idx++) {
    const mp4 = mp4List[idx];

    // Chỉ bỏ qua hoàn toàn nếu TẤT CẢ các target DB cần ghi đều đã có sẵn file này!
    const everyTargetAlreadyHasFile = params.targets.every((t) =>
      (matsByEnv[t.env] || []).some((m) => m.zoomMeta?.zoomRecordingFileId === mp4.id)
    );
    if (everyTargetAlreadyHasFile) {
      continue;
    }

    // Lọc các target thực sự chưa có bản ghi này
    const pendingTargets = params.targets.filter((t) => {
      const slotList = matsByEnv[t.env] || [];
      if (slotList.some((m) => m.zoomMeta?.zoomRecordingFileId === mp4.id)) return false;
      const hasManualOnly =
        slotList.length > 0 && slotList.every((m) => m.recordingSource !== 'ZOOM_AUTO_SYNC');
      if (hasManualOnly && !params.allowAlongsideManual && params.triggerSource === 'BACKFILL_MIGRATION') {
        return false;
      }
      return true;
    });

    if (pendingTargets.length === 0) {
      continue;
    }

    const partSuffix = mp4List.length > 1 ? ` • Phần ${idx + 1}` : '';
    const displayTitle = `Session Recording - ${targetClass.name} (${match.dmyDate})${partSuffix}`;
    const cleanFileName = `${sanitizeFileName(targetClass.name)}_${sessionDate}${
      mp4List.length > 1 ? `_Part${idx + 1}` : ''
    }.mp4`;

    const broadcastJobState = async (patch: Record<string, any>) => {
      await Promise.all(
        pendingTargets.map((t) =>
          setDoc(
            doc(t.db, 'zoom_sync_jobs', jobDocId),
            {
              id: jobDocId,
              classId: targetClass.id,
              className: targetClass.name,
              sessionDate,
              zoomMeetingId: normalizeZoomMeetingId(recDetail.id),
              zoomMeetingUuid: recDetail.uuid,
              zoomRecordingFileId: mp4.id,
              triggerSource: params.triggerSource,
              updatedAt: new Date().toISOString(),
              ...patch,
            },
            { merge: true }
          )
        )
      );
    };

    try {
      // KIỂM TRA TÁI SỬ DỤNG 1 FILE GOOGLE DRIVE CHUNG GIỮA PROD & DEV (Tiết kiệm 100% dung lượng trùng!)
      const existingDriveMat = allCrossEnvActiveMats.find(
        (m) =>
          m.zoomMeta?.zoomRecordingFileId === mp4.id &&
          m.driveFileId &&
          String(m.url || m.fileUrl || '').includes('drive.google.com')
      );

      let uploaded: { driveFileId: string; previewUrl: string; sizeBytes: number };
      let reusedExistingDriveFile = false;

      if (existingDriveMat) {
        reusedExistingDriveFile = true;
        uploaded = {
          driveFileId: String(existingDriveMat.driveFileId),
          previewUrl: String(
            existingDriveMat.url ||
              existingDriveMat.fileUrl ||
              `https://drive.google.com/file/d/${existingDriveMat.driveFileId}/preview`
          ),
          sizeBytes: Number(existingDriveMat.fileSize || mp4.file_size || 0),
        };
      } else {
        // Bật ngay cờ DOWNLOADING_TO_DRIVE để mọi Card buổi học hiện thông báo khóa chống upload trùng (#10)!
        await broadcastJobState({
          status: 'DOWNLOADING_TO_DRIVE',
          progressPercent: 10,
          statusMessage: `Đang lấy dữ liệu video recording từ Zoom về LAK Education... (10%)`,
        });

        uploaded = await streamZoomMp4ToGoogleDrive({
          downloadUrl: mp4.download_url,
          expectedBytes: Number(mp4.file_size || 0),
          fileName: cleanFileName,
          directDownloadToken: params.directDownloadToken || recDetail.download_access_token,
          onProgress: async (pct) => {
            await broadcastJobState({
              status: 'DOWNLOADING_TO_DRIVE',
              progressPercent: pct,
              statusMessage: `Đang lấy dữ liệu video recording từ Zoom về LAK Education... (${pct}%)`,
            });
          },
        });
      }

      const recDocId = `rec_zoom_${targetClass.id}_${sessionDate.replace(/-/g, '')}_${String(mp4.id).slice(0, 8)}`;
      const nowIso = new Date().toISOString();

      // Ghi cùng 1 đường dẫn Google Drive duy nhất xuống tất cả các target DB cần đồng bộ (DEV & PROD)
      for (const t of pendingTargets) {
        const tClassSnap = await getDocs(collection(t.db, 'classes'));
        const tCls = tClassSnap.docs
          .map((d) => ({ ...(d.data() as any), id: d.id }))
          .find((c) => c.id === targetClass.id);

        if (!tCls) {
          // Nếu môi trường đích chưa có lớp học này thì bỏ qua an toàn không tạo bản ghi mồ côi
          continue;
        }

        const materialDoc = {
          // 100% các trường chuẩn hiện tại của LAK Education (Yêu cầu #7)
          id: recDocId,
          title: displayTitle,
          description:
            aiSummaryOverview ||
            `Bản ghi tự động đồng bộ từ Zoom Cloud của lớp ${tCls.name} ngày ${match.dmyDate}.`,
          type: 'VIDEO',
          category: 'Session Recording',
          url: uploaded.previewUrl,
          fileUrl: uploaded.previewUrl,
          driveFileId: uploaded.driveFileId,
          fileName: cleanFileName,
          fileSize: uploaded.sizeBytes,
          mimeType: 'video/mp4',
          classId: tCls.id,
          courseId: tCls.courseId || '',
          level: tCls.courseLevel || tCls.level || 'WONDERS-G5',
          sharedClassIds: [tCls.id],
          sharedCourseIds: [], // Bảo vệ cô lập lớp học tuyệt đối theo AGENTS.md!
          shareScope: 'CUSTOM',
          isSessionRecording: true,
          sessionDate,
          uploadedBy: 'ZOOM_CLOUD_AUTO',
          uploadedByName: 'Zoom Cloud Auto-Sync',
          uploadedByRole: 'system',
          uploadedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
          isDeleted: false,

          // Các trường mở rộng song song cho Phân hệ Zoom (Yêu cầu #3, #4, #7)
          recordingSource: 'ZOOM_AUTO_SYNC',
          zoomMeta: {
            zoomMeetingId: normalizeZoomMeetingId(recDetail.id),
            zoomMeetingUuid: recDetail.uuid,
            zoomRecordingFileId: mp4.id,
            recordingStart: mp4.recording_start || recDetail.start_time,
            recordingEnd: mp4.recording_end || '',
            durationSeconds: Number(recDetail.duration || 0) * 60,
            fileSizeBytes: uploaded.sizeBytes,
            partNumber: idx + 1,
            totalParts: mp4List.length,
            aiSummaryOverview,
            aiNextStepsHomework,
            syncedAt: nowIso,
            triggerSource: params.triggerSource,
            reusedSharedDriveFile: reusedExistingDriveFile,
            zoomTrashScheduledAfter: new Date(
              Date.now() + routerCfg.autoTrashZoomCloudAfterDays * 86400 * 1000
            ).toISOString(),
          },
        };

        await setDoc(doc(t.db, 'learning_materials', recDocId), materialDoc, { merge: true });
      }

      await broadcastJobState({
        status: 'COMPLETED',
        progressPercent: 100,
        driveFileId: uploaded.driveFileId,
        recordingDocId: recDocId,
        statusMessage: 'Đã đồng bộ hoàn tất bản ghi từ Zoom Cloud về LAK Education!',
        completedAt: nowIso,
      });

      syncedResults.push({
        recDocId,
        classId: targetClass.id,
        sessionDate,
        driveFileId: uploaded.driveFileId,
        sizeBytes: uploaded.sizeBytes,
        reusedExistingDriveFile,
        writtenEnvs: pendingTargets.map((t) => t.env),
      });
    } catch (err: any) {
      await broadcastJobState({
        status: 'FAILED',
        errorMessage: err?.message || 'Unknown stream error',
        statusMessage: `Lỗi tải video từ Zoom: ${(err?.message || '').slice(0, 120)}`,
      });
      throw err;
    }
  }

  return { skipped: false, synced: syncedResults };
}
