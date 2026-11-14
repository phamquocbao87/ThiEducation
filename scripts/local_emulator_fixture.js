import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const LOCAL_PROJECT_ID = 'demo-lakeducation';

const app = initializeApp({
  apiKey: 'demo-api-key',
  authDomain: 'localhost',
  projectId: LOCAL_PROJECT_ID,
  appId: '1:000000000000:web:localemulator',
});

export const localDb = getFirestore(app, 'lakeducationdb');
connectFirestoreEmulator(localDb, '127.0.0.1', 8080);

export const TEST_PREFIX = '[TEST:LOCAL]';
export const TEST_DOCUMENTS = {
  users: ['TEST_ADM_001', 'TEST_DIR_001', 'TEST_ACA_001', 'TEST_TEA_001', 'TEST_ACC_001', 'TEST_STU_001'],
  courses: ['TEST_COURSE_001'],
  classes: ['TEST_CLASS_001'],
};

export const requireLocalEmulator = () => {
  if (process.env.LAK_USE_FIREBASE_EMULATOR !== 'true') {
    throw new Error('Refusing to run: set LAK_USE_FIREBASE_EMULATOR=true for local test data only.');
  }
};
