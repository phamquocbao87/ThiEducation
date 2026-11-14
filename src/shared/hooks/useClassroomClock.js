import { useSyncExternalStore } from 'react';

const listeners = new Set();
let now = Date.now();
let timer;
const tick = () => { now = Date.now(); listeners.forEach((listener) => listener()); };
const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick();
    timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { clearInterval(timer); document.removeEventListener('visibilitychange', tick); }
  };
};
export const useClassroomClock = () => useSyncExternalStore(subscribe, () => now, () => now);
