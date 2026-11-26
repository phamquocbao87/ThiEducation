import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../core/services/firebase';

export const ACTIVE_ZOOM_JOB_STATUSES = new Set([
  'QUEUED',
  'ENCODING_ON_ZOOM',
  'DOWNLOADING_TO_DRIVE',
]);

/**
 * Shared Realtime Hook subscribing to `zoom_sync_jobs` in the active environment's Firestore.
 * Powers live progress banners on Schedule cards & Recordings Directory (#8, #9, #10)
 * to inform users and prevent duplicate manual uploads while Zoom video is syncing.
 */
export function useZoomSyncJobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!IS_FIREBASE_ENABLED || !db) return undefined;
    const unsub = onSnapshot(
      collection(db, 'zoom_sync_jobs'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setJobs(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const jobsBySlotKey = useMemo(() => {
    const map = new Map();
    jobs.forEach((j) => {
      if (j?.classId && j?.sessionDate) {
        const key = `${j.classId}_${j.sessionDate}`;
        const prev = map.get(key);
        // Ưu tiên hiển thị job đang chạy hoặc cập nhật mới nhất
        if (
          !prev ||
          ACTIVE_ZOOM_JOB_STATUSES.has(j.status) ||
          String(j.updatedAt || '') > String(prev.updatedAt || '')
        ) {
          map.set(key, j);
        }
      }
    });
    return map;
  }, [jobs]);

  const activeJobsBySlotKey = useMemo(() => {
    const map = new Map();
    jobsBySlotKey.forEach((job, key) => {
      if (ACTIVE_ZOOM_JOB_STATUSES.has(job.status)) {
        map.set(key, job);
      }
    });
    return map;
  }, [jobsBySlotKey]);

  const unassignedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'NEEDS_MANUAL_ASSIGN'),
    [jobs]
  );

  return {
    allJobs: jobs,
    jobsBySlotKey,
    activeJobsBySlotKey,
    unassignedJobs,
  };
}
