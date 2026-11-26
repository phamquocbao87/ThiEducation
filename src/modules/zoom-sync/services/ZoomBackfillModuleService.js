import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { ZoomBackendGateway } from '../../../shared/services/ZoomBackendGateway';

/**
 * Sub-Feature Class 2 (Zoom Sync Module):
 * Missing Cloud Recording Audit & Backfill Migration Streamer (#8, #9, #10)
 */
export class ZoomBackfillModuleService extends BaseModuleService {
  static async auditMissingRecordings({ fromDate, toDate, targetEnv, actorId }) {
    const qs = new URLSearchParams();
    if (fromDate) qs.set('from', fromDate);
    if (toDate) qs.set('to', toDate);
    if (targetEnv) qs.set('env', targetEnv);

    const res = await ZoomBackendGateway.call(`/missing-recordings?${qs.toString()}`, {
      method: 'GET',
      targetEnv,
      actorId,
    });
    return res.data;
  }

  static async triggerBackfillSync({
    zoomMeetingUuids,
    overrideClassId = null,
    overrideSessionDate = null,
    allowAlongsideManual = false,
    targetEnv,
    actorId,
  }) {
    const res = await ZoomBackendGateway.call('/backfill-sync', {
      method: 'POST',
      targetEnv,
      actorId,
      body: {
        zoomMeetingUuids,
        ...(overrideClassId ? { overrideClassId } : {}),
        ...(overrideSessionDate ? { overrideSessionDate } : {}),
        allowAlongsideManual,
      },
    });
    return res.data;
  }
}
