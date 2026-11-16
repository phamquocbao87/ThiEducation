import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const productionFirebaseConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const appProd = initializeApp(productionFirebaseConfig, 'PROD_INSPECT_4');
const dbProd = getFirestore(appProd, 'lakeducationdb');

async function checkSubcollections() {
  const subcols = ['evaluations', 'student_evaluations', 'reports', 'attendance', 'notes', 'records'];
  for (const sub of subcols) {
    try {
      const snap = await getDocs(collection(dbProd, `session_evaluations/LIVE_LH004_1794830400000/${sub}`));
      console.log(`Subcollection ${sub}: ${snap.size} docs`);
      snap.forEach(d => console.log(`  - [${d.id}]:`, JSON.stringify(d.data())));
    } catch (e) {
      console.log(`Subcollection ${sub}: error ${e.message}`);
    }
  }

  // Check also if there are other collections in Firestore root that we didn't scan
  const allPossibleRootCols = [
    'session_evaluations', 'class_sessions', 'live_sessions', 'teacher_evaluations',
    'student_feedback', 'attendance_records', 'class_attendance', 'student_attendance',
    'evaluation_records', 'daily_evaluations', 'course_evaluations', 'activities',
    'notifications', 'audit_logs', 'logs'
  ];

  for (const c of allPossibleRootCols) {
    try {
      const snap = await getDocs(collection(dbProd, c));
      if (snap.size > 0) {
        console.log(`Collection '${c}': ${snap.size} docs`);
        snap.forEach(d => {
          const str = JSON.stringify(d.data());
          if (str.includes('LH004') || str.includes('Maj') || str.includes('HV768')) {
            console.log(`  -> Match in '${c}': [${d.id}]:`, str.substring(0, 150));
          }
        });
      }
    } catch (e) {}
  }

  process.exit(0);
}

checkSubcollections();
