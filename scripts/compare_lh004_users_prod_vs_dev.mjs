import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
};

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
};

const appProd = initializeApp(prodConfig, 'PROD_READ');
const dbProd = getFirestore(appProd, 'lakeducationdb');

const appDev = initializeApp(devConfig, 'DEV_READ');
const dbDev = getFirestore(appDev, 'lakeducationdb');

async function compare() {
  console.log("=== SO SÁNH DỮ LIỆU LH004 GIỮA PROD VÀ DEV ===");

  // 1. Classes
  const pCls = await getDoc(doc(dbProd, 'classes', 'LH004'));
  const dCls = await getDoc(doc(dbDev, 'classes', 'LH004'));
  console.log(`Class LH004 in Prod: ${pCls.exists()}, in Dev: ${dCls.exists()}`);

  // 2. Session Evaluation
  const pEval = await getDoc(doc(dbProd, 'session_evaluations', 'LIVE_LH004_1794830400000'));
  const dEval = await getDoc(doc(dbDev, 'session_evaluations', 'LIVE_LH004_1794830400000'));
  console.log(`Session LIVE_LH004_1794830400000 in Prod: ${pEval.exists()}, in Dev: ${dEval.exists()}`);

  // 3. Check 8 students in Dev
  const studentIds = ['HV257', 'HV344', 'HV463', 'HV610', 'HV739', 'HV768', 'HV905', 'HV971', 'GV952'];
  for (const sid of studentIds) {
    const sDev = await getDoc(doc(dbDev, 'users', sid));
    console.log(`  User ${sid} in Dev: ${sDev.exists()}`);
  }

  // 4. Check materials in Dev
  const pMat = await getDocs(collection(dbProd, 'learning_materials'));
  const dMat = await getDocs(collection(dbDev, 'learning_materials'));
  console.log(`Learning materials: Prod=${pMat.size}, Dev=${dMat.size}`);

  process.exit(0);
}

compare();
