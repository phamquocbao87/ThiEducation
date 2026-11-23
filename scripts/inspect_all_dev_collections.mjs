import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

const appDev = initializeApp(devConfig, 'DEV_INSPECT');
const dbDev = getFirestore(appDev, 'lakeducationdb');

const targetCollections = [
  'users',
  'classes',
  'courses',
  'session_evaluations',
  'classroom_live',
  'learning_materials',
  'student_goals',
  'tuitions',
  'exercises',
  'exercise_assignments',
  'exercise_attempts',
  'user_audit_logs',
];

async function inspectDev() {
  console.log("=== KIỂM TRA HIỆN TRẠNG DATABASE DEV (lakeducation-dev / lakeducationdb) ===");
  for (const colName of targetCollections) {
    try {
      const snap = await getDocs(collection(dbDev, colName));
      console.log(`[DEV - ${colName}]: ${snap.size} documents`);
    } catch (err) {
      console.log(`⚠️ [DEV - ${colName}]: Error: ${err.message}`);
    }
  }
  process.exit(0);
}

inspectDev();
