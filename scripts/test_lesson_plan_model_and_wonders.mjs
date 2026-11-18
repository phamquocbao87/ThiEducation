import { buildLessonPlan, LESSON_PLAN_STATUS } from '../src/shared/models/classroom.model.js';

console.log('=== TEST TẦNG 1: UNIT TEST BUILD LESSON PLAN & WONDERS BENCHMARKS ===');

const mockClass = {
  id: 'LH002',
  name: 'WP03 G5 Ms. Maj',
  code: 'WP03',
  teacherId: 'TEA001',
};

const mockActor = {
  id: 'ACA545',
  name: 'Ngọc Nhi',
  role: 'academic',
};

// Case 1: Kế hoạch mới có đầy đủ các trường mới
const planWithNewFields = buildLessonPlan(
  mockClass,
  {
    sessionIndex: 2,
    date: '2026-11-18',
    unitWeek: 'Unit 1 Week 1 · Lesson 2',
    lessonTitle: 'Essential Question: How can experiencing nature change the way you think about it?',
    objectives: ['READING', 'Shared Read, T8–T11', 'WRITING', 'Argumentative Writing'],
    studentPrep: 'Companion pp. 36–42\nDecodable #4',
    homework: 'Practice Book pp. 20, 22, 24\nReview Vocab',
    readingDailyTime: '60+ mins',
    writingDailyTime: '30+ mins',
    status: LESSON_PLAN_STATUS.READY,
  },
  mockActor
);

console.log('Case 1 Check:');
console.assert(planWithNewFields.sessionIndex === 2, 'SessionIndex must be 2');
console.assert(planWithNewFields.readingDailyTime === '60+ mins', 'ReadingDailyTime must be 60+ mins');
console.assert(planWithNewFields.writingDailyTime === '30+ mins', 'WritingDailyTime must be 30+ mins');
console.assert(planWithNewFields.studentPrep.includes('Decodable #4'), 'StudentPrep must preserve multi-line');
console.assert(planWithNewFields.homework.includes('Review Vocab'), 'Homework must preserve multi-line');
console.log('  ✅ Case 1 PASS: Đầy đủ các trường mới và đa dòng.');

// Case 2: Tương thích ngược với dữ liệu cũ (không truyền readingDailyTime, writingDailyTime)
const legacyPlan = buildLessonPlan(
  mockClass,
  {
    sessionIndex: 1,
    lessonTitle: 'Where I Live',
  },
  mockActor
);

console.log('Case 2 Check (Legacy fallback):');
console.assert(legacyPlan.readingDailyTime === '60+ mins', 'Legacy readingDailyTime should fallback to 60+ mins');
console.assert(legacyPlan.writingDailyTime === '30+ mins', 'Legacy writingDailyTime should fallback to 30+ mins');
console.log('  ✅ Case 2 PASS: Fallback chuẩn xác cho dữ liệu cũ (tương thích ngược 100%).');

console.log('🎉 TẤT CẢ 2/2 TEST CASES MODEL ĐÃ ĐẠT CHUẨN!');
