import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { ZoomBackendGateway } from '../../../shared/services/ZoomBackendGateway';

/**
 * Sub-Feature Class 1 (Zoom Sync Module):
 * Smart Class <-> Zoom Room Mapping, Confidence Scoring & Auto-Provisioning
 */
export class ZoomMappingModuleService extends BaseModuleService {
  static async fetchStatusAndRouter(actorId) {
    const res = await ZoomBackendGateway.call('/status', { method: 'GET', actorId });
    return res.data;
  }

  static async updateRouterConfig(patch, actorId, actorRole = '') {
    const res = await ZoomBackendGateway.call('/router-config', {
      method: 'POST',
      body: { ...patch, actorId, actorRole },
      actorId,
      actorRole,
    });
    return res.data;
  }

  static async fetchMappingSuggestions(targetEnv, actorId) {
    const res = await ZoomBackendGateway.call(`/mapping-suggestions?env=${encodeURIComponent(targetEnv)}`, {
      method: 'GET',
      targetEnv,
      actorId,
    });
    return res.data;
  }

  static async linkClassToZoomRoom({ classId, zoomMeetingId, ensureCloudAutoRecording = true, targetEnv, actorId }) {
    const res = await ZoomBackendGateway.call('/link-class', {
      method: 'POST',
      targetEnv,
      actorId,
      body: {
        classId,
        zoomMeetingId,
        ensureCloudAutoRecording,
        actorId,
      },
    });
    return res.data;
  }
}
