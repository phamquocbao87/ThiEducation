import assert from 'node:assert/strict';
import i18next from 'i18next';
import en from '../src/core/i18n/locales/en.js';
import vi from '../src/core/i18n/locales/vi.js';
import { findClassSession, getSessionTimer, formatTimerDuration } from '../src/modules/dashboard/utils/classSessionTimer.js';

const at = (value) => Date.parse(value + '+07:00');
const cls = {
  startDate: '13/11/2026', endDate: '27/11/2026',
  scheduleData: { days: [5], startTime: '18:00', endTime: '19:00', baseTimezoneOffset: 7 },
};
const timer = (value, record = cls) => {
  const now = at(value);
  return getSessionTimer(findClassSession(record, now), now);
};
assert.deepEqual(timer('2026-11-12T14:28:45'), { state: 'upcoming', startsIn: 99075 });
assert.deepEqual(timer('2026-11-13T17:59:59'), { state: 'upcoming', startsIn: 1 });
assert.deepEqual(timer('2026-11-13T18:00:00'), { state: 'live', elapsed: 0, remaining: 3600 });
assert.deepEqual(timer('2026-11-13T18:05:15'), { state: 'live', elapsed: 315, remaining: 3285 });
assert.equal(timer('2026-11-13T19:00:00').startsIn, 7 * 86400 - 3600);
assert.equal(timer('2026-11-27T18:30:00').state, 'live');
assert.equal(timer('2026-11-27T19:00:00'), null);
assert.equal(timer('2026-11-13T18:00:00', { ...cls, operationStatus: 'Tạm hoãn' }), null);
assert.equal(timer('2026-11-13T18:00:00', { ...cls, scheduleData: null }), null);
const overnight = { ...cls, scheduleData: { days: [5], startTime: '23:30', endTime: '00:30' } };
assert.deepEqual(timer('2026-11-14T00:05:15', overnight), { state: 'live', elapsed: 2115, remaining: 1485 });
const history = { ...cls, scheduleHistory: [
  { effectiveFrom: '13/11/2026', effectiveTo: '19/11/2026', scheduleData: cls.scheduleData },
  { effectiveFrom: '20/11/2026', scheduleData: { ...cls.scheduleData, startTime: '20:00', endTime: '21:00' } },
] };
assert.equal(timer('2026-11-13T18:30:00', history).state, 'live');
assert.equal(timer('2026-11-20T18:30:00', history).startsIn, 5400);
assert.equal(timer('2026-11-20T20:30:00', history).remaining, 1800);
assert.equal(timer('2026-11-13T17:59:59.900').startsIn, 1);
assert.equal(timer('2026-11-13T18:59:59.900').remaining, 1);
assert.equal(timer('2026-11-13T17:00:00', { ...cls, scheduleData: { ...cls.scheduleData, startTime: '00:00', endTime: '00:30' } }).state, 'upcoming');
const far = { ...cls, startDate: '01/01/2027', endDate: '31/01/2027' };
assert.equal(findClassSession(far, at('2026-11-13T17:00:00')).start, at('2027-01-01T18:00:00'));
assert.equal(findClassSession(cls, Date.parse('2026-11-13T11:05:15Z')).start, at('2026-11-13T18:00:00'));
await i18next.init({ lng: 'vi', resources: { en: { translation: en }, vi: { translation: vi } } });
assert.equal(formatTimerDuration(99075, i18next.t), '1 ngày 3 giờ 31 phút 15 giây');
await i18next.changeLanguage('en');
assert.equal(formatTimerDuration(3661, i18next.t), '1 hour 1 minute 1 second');
assert.equal(formatTimerDuration(0, i18next.t), '0 seconds');
console.log('PASS: countdown boundaries, recurrence, dates, history, overnight, timezone and EN/VI');
