import { doc, setDoc, terminate } from 'firebase/firestore';
import { localDb, requireLocalEmulator, TEST_DOCUMENTS, TEST_PREFIX } from './local_emulator_fixture.js';

requireLocalEmulator();

const password = 'LakTest@2026';
const users = [
  ['TEST_ADM_001', 'admin', 'Test Administrator', 'test.admin@lakeducation.test'],
  ['TEST_DIR_001', 'director', 'Test Director', 'test.director@lakeducation.test'],
  ['TEST_ACA_001', 'academic', 'Test Academic Coordinator', 'test.academic@lakeducation.test'],
  ['TEST_TEA_001', 'teacher', 'Test Teacher', 'test.teacher@lakeducation.test'],
  ['TEST_ACC_001', 'accountant', 'Test Accountant', 'test.accountant@lakeducation.test'],
  ['TEST_STU_001', 'student', 'Test Student', 'test.student@lakeducation.test'],
];

const now = new Date().toISOString();

for (const [id, role, label, email] of users) {
  await setDoc(doc(localDb, 'users', id), {
    id,
    code: id,
    name: `${TEST_PREFIX} ${label}`,
    englishName: `${TEST_PREFIX} ${label}`,
    email,
    phoneNumber: `090000${id.slice(-3)}`,
    role,
    roleLabel: role,
    status: 'active',
    password,
    authProviders: ['password', 'google'],
    isTestData: true,
    testPrefix: TEST_PREFIX,
    createdAt: now,
    updatedAt: now,
  });
}

await setDoc(doc(localDb, 'courses', TEST_DOCUMENTS.courses[0]), {
  id: TEST_DOCUMENTS.courses[0],
  name: `${TEST_PREFIX} Foundation Course`,
  code: TEST_DOCUMENTS.courses[0],
  status: 'Active',
  isTestData: true,
  testPrefix: TEST_PREFIX,
  createdAt: now,
  updatedAt: now,
});

await setDoc(doc(localDb, 'classes', TEST_DOCUMENTS.classes[0]), {
  id: TEST_DOCUMENTS.classes[0],
  name: `${TEST_PREFIX} Foundation Class`,
  code: TEST_DOCUMENTS.classes[0],
  courseId: TEST_DOCUMENTS.courses[0],
  teacherId: TEST_DOCUMENTS.users[3],
  studentIds: [TEST_DOCUMENTS.users[5]],
  pendingStudentRequests: [],
  status: 'Active',
  isTestData: true,
  testPrefix: TEST_PREFIX,
  createdAt: now,
  updatedAt: now,
});

console.log(`Seeded ${TEST_PREFIX} data in the local Firebase Emulator.`);
console.log(`Test login password for all seeded users: ${password}`);
await terminate(localDb);
