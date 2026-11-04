/**
 * Core Firebase & Cloud Firestore Adapter Layer — LAK EDUCATION (lakeducation.com)
 *
 * 📌 GHI CHÚ QUẢN TRỊ HẠ TẦNG (INFRASTRUCTURE NOTE):
 * - Tài khoản Google quản lý Firebase / Firestore / Storage / Hosting: vnthietbigarage@gmail.com
 * - Tên miền chính thức: lakeducation.com (Squarespace Domains / Google Cloud DNS)
 */
export const FIREBASE_OWNER_ACCOUNT = 'vnthietbigarage@gmail.com';

export const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'lakeducation-app.firebaseapp.com',
  projectId: 'lakeducation-app',
  storageBucket: 'lakeducation-app.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef123456',
  ownerEmail: FIREBASE_OWNER_ACCOUNT,
};

export const IS_FIREBASE_ENABLED = false;
