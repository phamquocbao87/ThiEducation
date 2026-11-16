import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const developmentFirebaseConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

const appDev = initializeApp(developmentFirebaseConfig, 'DEV_INSPECT');
const dbDev = getFirestore(appDev, 'lakeducationdb');

async function checkDevDb() {
  console.log("=== KIỂM TRA DATABASE DEV (lakeducation-dev) ===");
  try {
    const snapClasses = await getDocs(collection(dbDev, 'classes'));
    console.log(`Classes in Dev: ${snapClasses.size}`);
    snapClasses.forEach(d => console.log(`  - [${d.id}]: ${d.data().code || d.data().name}`));

    const snapEvals = await getDocs(collection(dbDev, 'session_evaluations'));
    console.log(`session_evaluations in Dev: ${snapEvals.size}`);
    snapEvals.forEach(d => console.log(`  - [${d.id}]`));
  } catch (e) {
    console.error("Error connecting to Dev Firestore:", e.message);
  }
  process.exit(0);
}

checkDevDb();
