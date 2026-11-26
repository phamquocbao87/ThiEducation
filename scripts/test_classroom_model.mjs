import assert from 'node:assert/strict';
import {
  ATTENTION_STATUS,
  PRESENCE,
  LESSON_PLAN_STATUS,
  QUICK_NOTE_DEFAULT_TAGS,
  buildAttendance,
  buildAttention,
  buildTeacherCheckIn,
  buildQuickNote,
  buildLessonPlan,
  buildStudentEvaluation,
  buildEvaluationUnlockState,
  classroomSessionId,
  currentAttendance,
} from '../src/shared/models/classroom.model.js';
import { findClassSession } from '../src/shared/utils/classSessionUtils.js';
import { PermissionService } from '../src/core/services/PermissionService.js';

const now = Date.parse('2026-11-13T11:00:00Z');
const cls = {
  id: 'TEST_CLASS', teacherId: 'T1', studentIds: ['S1', 'S2'], startDate: '13/11/2026',
  scheduleData: { days: [5], startTime: '18:00', endTime: '19:00' },
};
const teacher = { id: 'T1', name: 'Test Teacher', role: 'teacher' };
let record = buildAttendance(cls, {}, { S1: 'ONLINE' }, teacher, now);
assert.equal(record.presentCount, 1); assert.equal(record.absentCount, 0); assert.equal(record.unmarkedCount, 1);
assert.equal(record.teacherCheckIn.status, 'CHECKED_IN');
assert.equal(record.teacherCheckIn.method, 'AUTO_ATTENDANCE');
assert.equal(record.teacherCheckIn.confirmedBy, 'T1');

record = buildAttendance(cls, record, { S2: 'OFFLINE' }, teacher, now + 1000);
assert.deepEqual(record.absentIds, ['S2']); assert.equal(record.presence.S1, 'ONLINE');
assert.equal(record.teacherCheckIn.status, 'CHECKED_IN');

record = buildAttendance(cls, record, { S1: 'ONLINE', S2: 'ONLINE' }, teacher, now + 2000);
assert.equal(record.presentCount, 2); assert.equal(record.absentCount, 0);

// Test attention flags
assert.equal(record.attentionFlags.S1, ATTENTION_STATUS.FOCUSED);
assert.equal(record.attentionFlags.S2, ATTENTION_STATUS.FOCUSED);
assert.equal(record.attentionCount, 0);

// Toggle S1 to DISTRACTED
const attentionRecord = buildAttention(cls, record, { S1: ATTENTION_STATUS.DISTRACTED }, teacher, now + 3000);
assert.equal(attentionRecord.attentionFlags.S1, ATTENTION_STATUS.DISTRACTED);
assert.equal(attentionRecord.attentionFlags.S2, ATTENTION_STATUS.FOCUSED);
assert.equal(attentionRecord.attentionCount, 1);
assert.deepEqual(attentionRecord.attentionIds, ['S1']);
// Presence must be preserved untouched!
assert.equal(attentionRecord.presence.S1, 'ONLINE');
assert.equal(attentionRecord.presence.S2, 'ONLINE');
assert.equal(attentionRecord.presentCount, 2);
assert.equal(attentionRecord.teacherCheckIn.status, 'CHECKED_IN');

// Toggle S1 back to FOCUSED
const restoredRecord = buildAttention(cls, attentionRecord, { S1: ATTENTION_STATUS.FOCUSED }, teacher, now + 4000);
assert.equal(restoredRecord.attentionFlags.S1, ATTENTION_STATUS.FOCUSED);
assert.equal(restoredRecord.attentionCount, 0);
assert.deepEqual(restoredRecord.attentionIds, []);
assert.equal(restoredRecord.presentCount, 2);

// Test explicit teacher checkin (e.g. host open or academic confirmed)
const academic = { id: 'ACA01', name: 'Academic Staff', role: 'academic' };
const academicConfirmed = buildTeacherCheckIn(cls, {}, academic, 'ACADEMIC_CONFIRMED', now);
assert.equal(academicConfirmed.teacherCheckIn.status, 'CHECKED_IN');
assert.equal(academicConfirmed.teacherCheckIn.method, 'ACADEMIC_CONFIRMED');
assert.equal(academicConfirmed.teacherCheckIn.confirmedBy, 'ACA01');

// -------------------------------------------------------------
// TEST QUICK NOTES (1-Touch Pedagogical Tags & Text Note)
// -------------------------------------------------------------
assert.equal(QUICK_NOTE_DEFAULT_TAGS.length, 5);
const noteRecord = buildQuickNote(
  cls,
  record,
  'S1',
  { text: 'Pronounced short a very clearly', tags: ['🌟 Clear Reading', '🧩 S-V-O Sentence'] },
  teacher,
  now + 5000
);
assert.ok(noteRecord.quickNotes.S1);
assert.equal(noteRecord.quickNotes.S1.text, 'Pronounced short a very clearly');
assert.deepEqual(noteRecord.quickNotes.S1.tags, ['🌟 Clear Reading', '🧩 S-V-O Sentence']);
assert.equal(noteRecord.quickNotes.S1.authorId, 'T1');
assert.equal(noteRecord.presence.S1, 'ONLINE'); // Presence preserved
assert.equal(noteRecord.teacherCheckIn.status, 'CHECKED_IN'); // Teacher checkin preserved

// Test updating note on S2
const noteRecord2 = buildQuickNote(
  cls,
  noteRecord,
  'S2',
  { text: 'Needed reminder to focus', tags: ['⚠️ Needs Focus'] },
  teacher,
  now + 6000
);
assert.ok(noteRecord2.quickNotes.S1); // S1 preserved
assert.ok(noteRecord2.quickNotes.S2);
assert.equal(noteRecord2.quickNotes.S2.tags[0], '⚠️ Needs Focus');
assert.throws(() => buildQuickNote(cls, record, 'stranger', { text: 'invalid' }, teacher, now));

// -------------------------------------------------------------
// TEST MULTI-SESSION LESSON PLAN BUILDER
// -------------------------------------------------------------
const planSession3 = buildLessonPlan(
  cls,
  {
    sessionIndex: 3,
    date: '14/11/2026',
    unitWeek: 'Unit 1 Week 2 · Lesson 3',
    lessonTitle: 'Where I Live — Communities and Homes',
    objectives: [
      'Essential Question: What is your neighborhood like?',
      'Anchor Text: "Six Kids"',
      'Phonics: Short i sound blending',
    ],
    studentPrep: 'Literature Anthology pp. 10-25',
    homework: 'Practice Book pp. 12, 14, 16',
    slideLink: 'https://docs.google.com/presentation/d/test3',
    teacherNotes: 'Internal note for teacher only',
    status: LESSON_PLAN_STATUS.READY,
  },
  teacher,
  now
);
assert.equal(planSession3.id, 'LP_TEST_CLASS_SESSION_3');
assert.equal(planSession3.sessionIndex, 3);
assert.equal(planSession3.status, 'READY');
assert.equal(planSession3.objectives.length, 3);
assert.equal(planSession3.homework, 'Practice Book pp. 12, 14, 16');
assert.equal(planSession3.authorId, 'T1');

// Test Draft future session (Session 5)
const planSession5Draft = buildLessonPlan(
  cls,
  {
    sessionIndex: 5,
    unitWeek: 'Unit 1 Week 3 · Lesson 5',
    lessonTitle: 'Our Pets',
    status: LESSON_PLAN_STATUS.DRAFT,
  },
  teacher,
  now
);
assert.equal(planSession5Draft.id, 'LP_TEST_CLASS_SESSION_5');
assert.equal(planSession5Draft.status, 'DRAFT');

// -------------------------------------------------------------
// TEST POST-SESSION STUDENT EVALUATION BUILDER
// -------------------------------------------------------------
const evalRecord = buildStudentEvaluation(
  cls,
  noteRecord2,
  'S1',
  {
    stars: 5,
    comment: 'Pronounced short a very clearly. Excellent participation!',
    tags: ['🌟 Clear Reading'],
  },
  teacher,
  now + 7000
);
assert.ok(evalRecord.studentEvaluations.S1);
assert.equal(evalRecord.studentEvaluations.S1.stars, 5);
assert.equal(evalRecord.studentEvaluations.S1.comment, 'Pronounced short a very clearly. Excellent participation!');
assert.equal(evalRecord.studentEvaluations.S1.evaluatedBy, 'T1');
assert.ok(evalRecord.quickNotes.S1); // Quick notes preserved
assert.ok(evalRecord.quickNotes.S2); // Quick notes preserved

// Clamping star ratings between 1 and 5
const clampedEval = buildStudentEvaluation(cls, evalRecord, 'S2', { stars: 10, comment: 'Clamped stars' }, teacher, now + 8000);
assert.equal(clampedEval.studentEvaluations.S2.stars, 5);
const clampedLowEval = buildStudentEvaluation(cls, clampedEval, 'S2', { stars: -2, comment: 'Low clamped stars' }, teacher, now + 9000);
assert.equal(clampedLowEval.studentEvaluations.S2.stars, 1);
assert.throws(() => buildStudentEvaluation(cls, evalRecord, 'stranger', { stars: 5 }, teacher, now));
assert.throws(() => buildStudentEvaluation(cls, evalRecord, 'S1', { stars: 5 }, teacher, now - 1), /SESSION_NOT_STARTED/);

// 18-Hour Post-Session Hard-Lock, Request Unlock & 18h Temporary Unlock Lifecycle
const sessionEndMs = Date.parse('2026-11-13T12:00:00Z'); // 19:00 GMT+7
// Within 18h (+17h after end): still OPEN
const within18hEval = buildStudentEvaluation(
  cls,
  { ...evalRecord, sessionEnd: sessionEndMs },
  'S1',
  { stars: 5, comment: 'Updated within 18h window' },
  teacher,
  sessionEndMs + 17 * 3600 * 1000
);
assert.equal(within18hEval.studentEvaluations.S1.comment, 'Updated within 18h window');

// Past 18h (+18.5h after end): HARD LOCKED
const past18hTime = sessionEndMs + 18.5 * 3600 * 1000;
assert.throws(
  () => buildStudentEvaluation(cls, within18hEval, 'S1', { stars: 5, comment: 'Too late' }, teacher, past18hTime),
  /EVALUATION_WINDOW_LOCKED/
);

// Teacher requests unlock -> status REQUESTED (still locked until Academic/Director/Admin approves!)
const requestedDoc = buildEvaluationUnlockState(
  cls,
  within18hEval,
  'REQUEST',
  { reason: 'Need to update S2 comment' },
  teacher,
  past18hTime
);
assert.equal(requestedDoc.unlockState.status, 'REQUESTED');
assert.throws(
  () => buildStudentEvaluation(cls, requestedDoc, 'S2', { stars: 5, comment: 'Still locked' }, teacher, past18hTime + 1000),
  /EVALUATION_WINDOW_LOCKED/
);

// Academic approves unlock -> unlocked for 18h!
const unlockedDoc = buildEvaluationUnlockState(cls, requestedDoc, 'UNLOCK', {}, academic, past18hTime + 2000);
assert.equal(unlockedDoc.unlockState.status, 'UNLOCKED');
const reEvalSuccess = buildStudentEvaluation(
  cls,
  unlockedDoc,
  'S2',
  { stars: 5, comment: 'Graded during 18h unlock window' },
  teacher,
  past18hTime + 5 * 3600 * 1000
);
assert.equal(reEvalSuccess.studentEvaluations.S2.comment, 'Graded during 18h unlock window');

// After 18h unlock expires (+18.1h after unlock): AUTO-RELOCKS!
assert.throws(
  () => buildStudentEvaluation(cls, reEvalSuccess, 'S2', { stars: 4, comment: 'Unlock expired' }, teacher, past18hTime + 2000 + 18.1 * 3600 * 1000),
  /EVALUATION_WINDOW_LOCKED/
);

// Manual Relock Now by Academic: immediately locks even inside 18h window!
const relockedDoc = buildEvaluationUnlockState(cls, unlockedDoc, 'RELOCK', {}, academic, past18hTime + 3600 * 1000);
assert.throws(
  () => buildStudentEvaluation(cls, relockedDoc, 'S2', { stars: 4, comment: 'Relocked manually' }, teacher, past18hTime + 3600 * 1000 + 5000),
  /EVALUATION_WINDOW_LOCKED/
);

assert.throws(() => buildAttendance(cls, record, { stranger: 'ONLINE' }, teacher, now));
assert.throws(() => buildAttendance(cls, record, { S1: 'WRONG' }, teacher, now));
assert.throws(() => buildAttendance(cls, record, { S1: 'ONLINE' }, teacher, now - 1));
assert.throws(() => buildAttendance(cls, record, { S1: 'ONLINE' }, teacher, now + 3600000));
assert.throws(() => buildAttention(cls, record, { stranger: ATTENTION_STATUS.DISTRACTED }, teacher, now));
assert.throws(() => buildAttention(cls, record, { S1: 'WRONG_STATUS' }, teacher, now));
assert.throws(() => buildTeacherCheckIn(cls, {}, teacher, 'AUTO_HOST_OPEN', now - 1));

const next = now + 7 * 86400000;
assert.notEqual(classroomSessionId(cls.id, findClassSession(cls, next)), record.sessionId);
const reset = buildAttendance(cls, record, { S1: 'OFFLINE' }, teacher, next);
assert.equal(reset.presence.S2, 'UNMARKED');
assert.equal(currentAttendance({ ...cls, liveAttendance: record }, next), null);

for (const role of ['admin', 'director', 'academic']) {
  assert.equal(PermissionService.canViewClassroom({ id: 'X', role }, cls), true);
  assert.equal(PermissionService.canTakeClassroomAttendance(role), false);
}
assert.equal(PermissionService.canViewClassroom(teacher, cls), true);
assert.equal(PermissionService.canViewClassroom({ id: 'T2', role: 'teacher' }, cls), false);
assert.equal(PermissionService.canAccessRoutePath('student', '/classroom/X').allowed, true);
assert.equal(PermissionService.canAccessRoutePath('accountant', '/classroom/X').allowed, false);
assert.equal(PermissionService.canAccessRoutePath(null, '/classroom/X').allowed, false);

console.log('PASS classroom model: presence, attentionFlags, teacherCheckIn (Hybrid), reset by session, boundary validation, role permissions');
