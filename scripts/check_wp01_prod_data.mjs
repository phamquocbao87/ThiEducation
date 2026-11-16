import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const productionFirebaseConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const appProd = initializeApp(productionFirebaseConfig, 'PROD_INSPECT_2');
const dbProd = getFirestore(appProd, 'lakeducationdb');

async function scanAllCollections() {
  console.log("================================================================================");
  console.log("🔍 QUÉT CHI TIẾT TẤT CẢ DỮ LIỆU CỦA LỚP LH004 (WP01 G5 Ms. Maj/246) TRÊN PRODUCTION");
  console.log("================================================================================");

  const collectionsToScan = [
    'classes',
    'attendances',
    'evaluations',
    'session_evaluations',
    'student_evaluations',
    'classroom_sessions',
    'sessions',
    'learning_records',
    'schedules',
    'learning_materials',
    'exercises',
    'student_submissions',
    'tuition',
    'tuitions',
    'users'
  ];

  for (const colName of collectionsToScan) {
    try {
      const snap = await getDocs(collection(dbProd, colName));
      console.log(`\n📁 Collection '${colName}': Tổng số = ${snap.size}`);
      let matchLH004 = [];
      snap.forEach(d => {
        const data = d.data();
        const str = JSON.stringify(data);
        if (d.id === 'LH004' || data.classId === 'LH004' || data.classCode === 'LH004' || str.includes('LH004') || str.includes('WP01')) {
          matchLH004.push({ id: d.id, ...data });
        }
      });
      console.log(`   -> Khớp LH004 / WP01: ${matchLH004.length} documents`);
      matchLH004.forEach(item => {
        console.log(`      * [ID: ${item.id}]:`, JSON.stringify(item, null, 2).substring(0, 300) + '...');
      });
    } catch (e) {
      console.log(`   ❌ '${colName}': ${e.message}`);
    }
  }

  process.exit(0);
}

scanAllCollections().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
