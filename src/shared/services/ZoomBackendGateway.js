import { IS_DEVELOPMENT_FIREBASE } from '../../core/services/firebase';

const DEFAULT_ZOOM_API_URL = 'https://us-central1-hosting-store-api.cloudfunctions.net/lakZoomApi';

/**
 * Shared HTTP Gateway connecting LAK Education ERP to isolated `lakZoomApi` Cloud Function.
 * Automatically attaches `x-lak-target-env` ('dev' on localhost/dev domains, 'prod' on production)
 * so developer tests never touch production Firestore unless explicitly routed.
 */
export class ZoomBackendGateway {
  static getBaseUrl() {
    const envUrl =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZOOM_SYNC_API_URL
        ? String(import.meta.env.VITE_ZOOM_SYNC_API_URL).replace(/\/+$/, '')
        : '';
    return envUrl || DEFAULT_ZOOM_API_URL;
  }

  static getCurrentTargetEnv() {
    return IS_DEVELOPMENT_FIREBASE ? 'dev' : 'prod';
  }

  static async call(
    path,
    { method = 'GET', body = null, targetEnv = null, actorId = 'ADM001', actorRole = '' } = {}
  ) {
    const envHeader = targetEnv || this.getCurrentTargetEnv();
    const url = `${this.getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-lak-target-env': envHeader,
        'x-lak-actor-id': actorId || 'ADM001',
        ...(actorRole ? { 'x-lak-actor-role': String(actorRole) } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.success === false) {
      throw new Error(json.error || `Zoom Sync API error (${resp.status})`);
    }
    return json;
  }

  static async provisionZoomRoomForNewClass(classPayload, actorId = 'ADM001') {
    const res = await this.call('/provision-room', {
      method: 'POST',
      body: classPayload,
      actorId,
    });
    return res.data;
  }
}
