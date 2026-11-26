import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

export type RoutingMode = 'DEV_ONLY' | 'DUAL_MIRROR' | 'PROD_ONLY';
export type LakEnvKey = 'dev' | 'prod';

export interface ZoomRouterConfig {
  routingMode: RoutingMode;
  writeToDev: boolean;
  writeToProd: boolean;
  earlyLeaveThresholdMinutes: number;
  autoTrashZoomCloudAfterDays: number;
  minRecordingDurationSeconds: number;
  minRecordingSizeBytes: number;
  updatedBy: string;
  updatedAt: string;
}

const DEV_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

const PROD_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const DATABASE_ID = 'lakeducationdb';
const ROUTER_COLLECTION = 'zoom_sync_config';
const ROUTER_DOC_ID = 'router';

function ensureNamedApp(name: string, cfg: Record<string, string>): FirebaseApp {
  const found = getApps().find((a) => a.name === name);
  return found || initializeApp(cfg, name);
}

const appDev = ensureNamedApp('LAK_ZOOM_DEV', DEV_FIREBASE_CONFIG);
const appProd = ensureNamedApp('LAK_ZOOM_PROD', PROD_FIREBASE_CONFIG);

export const dbDev: Firestore = getFirestore(appDev, DATABASE_ID);
export const dbProd: Firestore = getFirestore(appProd, DATABASE_ID);

export const DEFAULT_ROUTER_CONFIG: ZoomRouterConfig = {
  routingMode: 'DEV_ONLY',
  writeToDev: true,
  writeToProd: false,
  earlyLeaveThresholdMinutes: 10,
  autoTrashZoomCloudAfterDays: 7,
  minRecordingDurationSeconds: 600,
  minRecordingSizeBytes: 25 * 1024 * 1024,
  updatedBy: 'SYSTEM_INIT',
  updatedAt: new Date().toISOString(),
};

let cachedRouter: { data: ZoomRouterConfig; expiresAt: number } | null = null;

export async function getZoomRouterConfig(forceRefresh = false): Promise<ZoomRouterConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedRouter && cachedRouter.expiresAt > now) {
    return cachedRouter.data;
  }

  const ref = doc(dbDev, ROUTER_COLLECTION, ROUTER_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, DEFAULT_ROUTER_CONFIG);
    cachedRouter = { data: DEFAULT_ROUTER_CONFIG, expiresAt: now + 15_000 };
    return DEFAULT_ROUTER_CONFIG;
  }

  const raw = snap.data() as Partial<ZoomRouterConfig>;
  const mode: RoutingMode =
    raw.routingMode === 'DUAL_MIRROR' || raw.routingMode === 'PROD_ONLY'
      ? raw.routingMode
      : 'DEV_ONLY';

  const normalized: ZoomRouterConfig = {
    routingMode: mode,
    writeToDev: mode === 'DEV_ONLY' || mode === 'DUAL_MIRROR',
    writeToProd: mode === 'PROD_ONLY' || mode === 'DUAL_MIRROR',
    earlyLeaveThresholdMinutes: Number(raw.earlyLeaveThresholdMinutes ?? 10),
    autoTrashZoomCloudAfterDays: Number(raw.autoTrashZoomCloudAfterDays ?? 7),
    minRecordingDurationSeconds: Number(raw.minRecordingDurationSeconds ?? 600),
    minRecordingSizeBytes: Number(raw.minRecordingSizeBytes ?? 25 * 1024 * 1024),
    updatedBy: raw.updatedBy || 'ADM001',
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };

  cachedRouter = { data: normalized, expiresAt: now + 15_000 };
  return normalized;
}

export async function updateZoomRouterConfig(
  patch: Partial<ZoomRouterConfig>,
  actorId = 'ADM001'
): Promise<ZoomRouterConfig> {
  const current = await getZoomRouterConfig(true);
  const nextMode: RoutingMode =
    patch.routingMode === 'DUAL_MIRROR' || patch.routingMode === 'PROD_ONLY' || patch.routingMode === 'DEV_ONLY'
      ? patch.routingMode
      : current.routingMode;

  const updated: ZoomRouterConfig = {
    ...current,
    ...patch,
    routingMode: nextMode,
    writeToDev: nextMode === 'DEV_ONLY' || nextMode === 'DUAL_MIRROR',
    writeToProd: nextMode === 'PROD_ONLY' || nextMode === 'DUAL_MIRROR',
    updatedBy: actorId,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(dbDev, ROUTER_COLLECTION, ROUTER_DOC_ID), updated);
  if (updated.writeToProd) {
    // Echo router visibility to PROD config doc when PROD writes are explicitly enabled
    await setDoc(doc(dbProd, ROUTER_COLLECTION, ROUTER_DOC_ID), updated);
  }
  cachedRouter = { data: updated, expiresAt: Date.now() + 15_000 };
  return updated;
}

export async function resolveWebhookTargets(): Promise<Array<{ env: LakEnvKey; db: Firestore }>> {
  const cfg = await getZoomRouterConfig();
  const targets: Array<{ env: LakEnvKey; db: Firestore }> = [];
  if (cfg.writeToDev) targets.push({ env: 'dev', db: dbDev });
  if (cfg.writeToProd) targets.push({ env: 'prod', db: dbProd });
  if (targets.length === 0) {
    targets.push({ env: 'dev', db: dbDev });
  }
  return targets;
}

export function resolveReadOnlyTargetDb(requestedEnv?: string): { env: LakEnvKey; db: Firestore } {
  const cleanEnv: LakEnvKey = requestedEnv === 'prod' ? 'prod' : 'dev';
  return cleanEnv === 'prod' ? { env: 'prod', db: dbProd } : { env: 'dev', db: dbDev };
}

export async function resolveApiTargetDb(requestedEnv?: string): Promise<{ env: LakEnvKey; db: Firestore }> {
  const cleanEnv: LakEnvKey = requestedEnv === 'prod' ? 'prod' : 'dev';
  if (cleanEnv === 'prod') {
    const cfg = await getZoomRouterConfig(true);
    if (!cfg.writeToProd) {
      throw new Error(
        'PROD_WRITE_LOCKED: Hệ thống đang khóa an toàn ở chế độ DEV_ONLY. Hãy gạt công tắc sang DUAL_MIRROR hoặc PROD_ONLY trước khi ghi lên Production.'
      );
    }
    return { env: 'prod', db: dbProd };
  }
  return { env: 'dev', db: dbDev };
}

/**
 * Xác định danh sách Database đích khi thực hiện thao tác ghi (Link Class / Backfill Sync):
 * - Ở chế độ DUAL_MIRROR: tự động trả về đồng thời cả [dbDev, dbProd] để ghi kép 1 lần bấm.
 * - Ở chế độ DEV_ONLY hoặc PROD_ONLY: kiểm tra chốt khóa an toàn theo đúng môi trường yêu cầu.
 */
export async function resolveWriteTargetsForAction(
  requestedEnv?: string
): Promise<Array<{ env: LakEnvKey; db: Firestore }>> {
  const cfg = await getZoomRouterConfig(true);
  if (cfg.routingMode === 'DUAL_MIRROR') {
    return [
      { env: 'dev', db: dbDev },
      { env: 'prod', db: dbProd },
    ];
  }
  const single = await resolveApiTargetDb(requestedEnv);
  return [single];
}
