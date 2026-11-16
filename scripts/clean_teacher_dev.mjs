import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
};

const appDev = initializeApp(devConfig, 'DEV_CLEAN_TEACHER');
const dbDev = getFirestore(appDev, 'lakeducationdb');

async function cleanTeacherClasses() {
  await setDoc(doc(dbDev, 'users', 'GV952'), {
    assignedClasses: ['LH004', 'LH002', 'LH005'],
    assignedClassIds: ['LH004', 'LH002', 'LH005'],
    classesAssigned: ['LH004', 'LH002', 'LH005']
  }, { merge: true });
  console.log("✅ Đã chuẩn hóa assignedClasses cho GV952 trên Dev: ['LH004', 'LH002', 'LH005']");
  process.exit(0);
}

cleanTeacherClasses();
