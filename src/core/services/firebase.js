import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Core Firebase & Cloud Firestore Adapter Layer — LAK EDUCATION (lakeducation.com)
 *
 * 📌 GHI CHÚ QUẢN TRỊ HẠ TẦNG (INFRASTRUCTURE NOTE):
 * - Tài khoản Google quản lý Firebase / Firestore / Storage / Hosting: vnthietbigarage@gmail.com
 * - Project Name / ID: lakeducation (Project Number: 36575839783)
 * - Tên miền chính thức: lakeducation.edu.vn / lakeducation.com
 */
export const FIREBASE_OWNER_ACCOUNT = 'vnthietbigarage@gmail.com';

export const firebaseConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
  measurementId: 'G-MBH7P6ZVG5',
  ownerEmail: FIREBASE_OWNER_ACCOUNT,
};

export const IS_FIREBASE_ENABLED = true;

// Initialize Firebase instance cleanly with custom database ID 'lakeducationdb'
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const FIRESTORE_DATABASE_ID = 'lakeducationdb';
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const auth = getAuth(app);
