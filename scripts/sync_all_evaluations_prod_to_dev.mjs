import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

const appProd = initializeApp(prodConfig, 'PROD_READONLY');
const appDev = initializeApp(devConfig, 'DEV_TARGET');

const dbProd = getFirestore(appProd, 'lakeducationdb');
const dbDev = getFirestore(appDev, 'lakeducationdb');

async function syncAllEvaluations() {
  console.log("=== ĐỒNG BỘ TOÀN BỘ SESSION EVALUATIONS TỪ PROD SANG DEV ===");
  const snap = await getDocs(collection(dbProd, 'session_evaluations'));
  console.log(`Tìm thấy ${snap.size} documents session_evaluations trên Prod.`);

  for (const d of snap.docs) {
    const data = d.data();
    console.log(`Đang đồng bộ Doc [${d.id}]: Class=${data.className}, Date=${data.date}`);
    if (data.studentEvaluations) {
      console.log(`  -> Số học viên có nhận xét: ${Object.keys(data.studentEvaluations).length}`);
      for (const [sid, ev] of Object.entries(data.studentEvaluations)) {
        if (ev.comment) {
          console.log(`     * ${sid}: "${ev.comment.slice(0, 50)}..."`);
        }
      }
    }
    await setDoc(doc(dbDev, 'session_evaluations', d.id), data, { merge: true });
    console.log(`  ✅ Đã ghi thành công sang Dev!`);
  }

  console.log("🎉 HOÀN TẤT ĐỒNG BỘ TẤT CẢ EVALUATIONS THỰC TẾ SANG DEV!");
  process.exit(0);
}

syncAllEvaluations();
