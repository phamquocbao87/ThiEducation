import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const productionFirebaseConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const appProd = initializeApp(productionFirebaseConfig, 'PROD_INSPECT_3');
const dbProd = getFirestore(appProd, 'lakeducationdb');

async function getFullSessionEval() {
  const ref = doc(dbProd, 'session_evaluations', 'LIVE_LH004_1794830400000');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log("=== FULL DOCUMENT 'LIVE_LH004_1794830400000' ===");
    console.log(JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("Document does not exist");
  }
  process.exit(0);
}

getFullSessionEval();
