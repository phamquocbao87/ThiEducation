import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

/**
 * Core Firebase & Cloud Firestore Adapter Layer — LAK EDUCATION (lakeducation.com)
 *
 * 📌 GHI CHÚ QUẢN TRỊ HẠ TẦNG (INFRASTRUCTURE NOTE):
 * - Tài khoản Google quản lý Firebase / Firestore / Storage / Hosting: vnthietbigarage@gmail.com
 * - Project Name / ID: lakeducation (Project Number: 36575839783)
 * - Tên miền chính thức: lakeducation.edu.vn / lakeducation.com
 */
export const FIREBASE_OWNER_ACCOUNT = 'vnthietbigarage@gmail.com';

const productionFirebaseConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
  measurementId: 'G-MBH7P6ZVG5',
  ownerEmail: FIREBASE_OWNER_ACCOUNT,
};

const viteEnv = import.meta.env || {};
const nodeEnv = typeof process !== 'undefined' ? process.env || {} : {};
const isLocalhost =
  (typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname))
  || (typeof window === 'undefined' && !nodeEnv.LAK_USE_PROD_FIREBASE);
const isEmulatorRequested =
  viteEnv.VITE_USE_FIREBASE_EMULATOR === 'true' || nodeEnv.LAK_USE_FIREBASE_EMULATOR === 'true';

const isDevDomain =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('lakeducation-dev') ||
   window.location.hostname.includes('-dev') ||
   window.location.hostname.includes('qc'));

// Localhost is always isolated from production. A non-local browser must never
// connect to an emulator, even if a build variable was configured incorrectly.
if (isEmulatorRequested && typeof window !== 'undefined' && !isLocalhost) {
  throw new Error('The local test data service can only run on localhost.');
}

export const IS_LOCAL_EMULATOR = isLocalhost && isEmulatorRequested;
export const IS_DEVELOPMENT_FIREBASE = ((isLocalhost || isDevDomain) && !IS_LOCAL_EMULATOR);
export const FIREBASE_RUNTIME_ENV = IS_LOCAL_EMULATOR
  ? 'local-emulator'
  : IS_DEVELOPMENT_FIREBASE
    ? 'development'
    : 'production';

const emulatorFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'localhost',
  projectId: 'demo-lakeducation',
  storageBucket: 'demo-lakeducation.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:localemulator',
};

const developmentFirebaseConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
  ownerEmail: FIREBASE_OWNER_ACCOUNT,
};

export const firebaseConfig = IS_LOCAL_EMULATOR
  ? emulatorFirebaseConfig
  : IS_DEVELOPMENT_FIREBASE
    ? developmentFirebaseConfig
    : productionFirebaseConfig;

export const IS_FIREBASE_ENABLED = true;

// Initialize Firebase instance cleanly with custom database ID 'lakeducationdb'
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const FIRESTORE_DATABASE_ID = 'lakeducationdb';
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (IS_LOCAL_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
