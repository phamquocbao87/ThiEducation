import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
};

const appDev = initializeApp(devConfig, 'VERIFY_DEV_DONE');
const dbDev = getFirestore(appDev, 'lakeducationdb');

async function checkFinal() {
  const dRef = doc(dbDev, 'session_evaluations', 'LIVE_LH004_1794830400000');
  const snap = await getDoc(dRef);
  console.log("=== DEV FIRESTORE VERIFICATION ===");
  console.log(`Document LIVE_LH004_1794830400000 exists: ${snap.exists()}`);
  if (snap.exists()) {
    const data = snap.data();
    console.log(`- Date: ${data.date}`);
    console.log(`- Class: ${data.className} (${data.classId})`);
    console.log(`- Teacher: ${data.teacherName} (ID: ${data.teacherId})`);
    console.log(`- Check-in status: ${data.checkInStatus}`);
    console.log(`- Present count: ${data.presentCount} / Total: ${data.totalStudents}`);
    console.log(`- Quick notes:`, JSON.stringify(data.quickNotes));
  }
  process.exit(0);
}

checkFinal();
