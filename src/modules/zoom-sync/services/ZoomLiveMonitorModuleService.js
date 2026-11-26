import { collection, onSnapshot } from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { ZoomBackendGateway } from '../../../shared/services/ZoomBackendGateway';

/**
 * Sub-Feature Class 3 (Zoom Sync Module):
 * Realtime Live Zoom Classroom State & Early-Leave Webhook Monitor (#5, #6)
 */
export class ZoomLiveMonitorModuleService extends BaseModuleService {
  static subscribeLinkedClassesLiveState(onNext) {
    if (!IS_FIREBASE_ENABLED || !db) return () => {};
    return onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .filter((c) => !c.isDeleted && c.status !== 'Deleted');
        onNext(list);
      },
      () => {}
    );
  }

  static async simulateStudentEarlyLeaveOnDev({ classId, studentZoomName, actorId }) {
    const res = await ZoomBackendGateway.call('/simulate-early-leave-dev', {
      method: 'POST',
      targetEnv: 'dev',
      actorId,
      body: {
        classId,
        studentZoomName,
        leaveReason: 'Left the meeting (network connection issue)',
      },
    });
    return res.data;
  }
}
