import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/services/firebase';

let cachedMap = new Map();
const subscribers = new Set();
let unsubscribeFirestore = null;

function ensureSharedSubscription() {
  if (unsubscribeFirestore || !db) return;
  unsubscribeFirestore = onSnapshot(
    collection(db, 'classes'),
    (snap) => {
      const next = new Map();
      snap.docs.forEach((d) => {
        const data = d.data() || {};
        if (data.zoomConfig || data.zoomLiveState) {
          next.set(d.id, {
            zoomConfig: data.zoomConfig || null,
            zoomLiveState: data.zoomLiveState || null,
          });
        }
      });
      cachedMap = next;
      subscribers.forEach((cb) => cb(cachedMap));
    },
    () => {}
  );
}

/**
 * Singleton Realtime Hook (1 listener duy nhất cho toàn bộ ứng dụng):
 * Cấp phát trạng thái `zoomConfig` & `zoomLiveState` 0ms cho mọi Card Lớp Học
 * trên Dashboard, Courses & Classes, Live Schedules và Classroom Detail.
 */
export function useZoomClassesLiveMap() {
  const [liveMap, setLiveMap] = useState(() => cachedMap);

  useEffect(() => {
    subscribers.add(setLiveMap);
    ensureSharedSubscription();
    if (cachedMap.size > 0) {
      setLiveMap(cachedMap);
    }
    return () => {
      subscribers.delete(setLiveMap);
      if (subscribers.size === 0 && unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
    };
  }, []);

  return liveMap;
}
