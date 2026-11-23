import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const appProd = initializeApp(prodConfig, 'PROD_INSPECT');
const dbProd = getFirestore(appProd, 'lakeducationdb');

const candidateCollections = [
  'users',
  'classes',
  'courses',
  'session_evaluations',
  'classroom_live',
  'learning_materials',
  'notifications',
  'class_absence_requests',
  'student_goals',
  'homeworks',
  'tuitions',
  'payrolls',
  'contracts',
  'student_notes',
  'exercises',
  'exercise_assignments',
  'exercise_attempts',
  'user_audit_logs',
  'curriculum_levels',
  'curriculums',
  'classrooms',
  'materials',
  'attendance'
];

async function inspectProd() {
  console.log("=== KIỂM TRA TẤT CẢ COLLECTIONS TRÊN PRODUCTION (lakeducation / lakeducationdb) ===");
  console.log("🛡️ CHẾ ĐỘ: 100% READ-ONLY");
  
  for (const colName of candidateCollections) {
    try {
      const snap = await getDocs(collection(dbProd, colName));
      if (snap.size > 0) {
        console.log(`✅ [${colName}]: ${snap.size} documents`);
      } else {
        console.log(`⚪ [${colName}]: 0 documents (empty)`);
      }
    } catch (err) {
      console.log(`⚠️ [${colName}]: Error: ${err.message}`);
    }
  }
  process.exit(0);
}

inspectProd();
