/**
 * TARGETED FIRESTORE CLONE SCRIPT (PROD -> DEV)
 * LAK EDUCATION (lakeducation.com)
 *
 * Allows cloning a single document or an entire targeted collection directly from
 * Production (lakeducation) to Development (lakeducation-dev) with 0đ cost & zero GCS latency.
 *
 * Usage:
 *   node scripts/sync_target_doc.js --doc=classes/LH002
 *   node scripts/sync_target_doc.js --col=courses
 *   node scripts/sync_target_doc.js --col=classes --dry-run
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:01e839e5590c7dcfca1f6c',
};

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

const DATABASE_ID = 'lakeducationdb';

// Parse arguments
const args = process.argv.slice(2);
const docArg = args.find((a) => a.startsWith('--doc='));
const colArg = args.find((a) => a.startsWith('--col='));
const isDryRun = args.includes('--dry-run');

if (!docArg && !colArg) {
  console.error('❌ Thiếu tham số! Vui lòng chỉ định một trong các lệnh sau:');
  console.error('   --doc=<collection>/<id>   (Ví dụ: --doc=classes/LH002)');
  console.error('   --col=<collection>        (Ví dụ: --col=courses)');
  console.error('   --dry-run                 (Chạy thử nghiệm không ghi)');
  process.exit(1);
}

// Initialize two distinct isolated apps
const prodApp = initializeApp(prodConfig, 'PROD_READER');
const devApp = initializeApp(devConfig, 'DEV_WRITER');

const prodDb = getFirestore(prodApp, DATABASE_ID);
const devDb = getFirestore(devApp, DATABASE_ID);

async function cloneSingleDoc(path) {
  const [colName, docId] = path.split('/');
  if (!colName || !docId) {
    throw new Error(`Đường dẫn document không hợp lệ: "${path}". Chuẩn: <collection>/<id>`);
  }

  console.log(`🔍 [PROD] Đang đọc document: ${colName}/${docId}...`);
  const snap = await getDoc(doc(prodDb, colName, docId));

  if (!snap.exists()) {
    console.error(`❌ Document "${path}" không tồn tại trên Production!`);
    return;
  }

  const data = snap.data();
  console.log(`📦 [PROD] Tìm thấy:`, JSON.stringify({ id: snap.id, ...data }, null, 2));

  if (isDryRun) {
    console.log(`ℹ️ [DRY-RUN] Không thực hiện ghi vào DEV.`);
    return;
  }

  console.log(`🚀 [DEV] Đang đồng bộ sang lakeducation-dev (${colName}/${docId})...`);
  await setDoc(doc(devDb, colName, docId), data, { merge: true });
  console.log(`✅ [THÀNH CÔNG] Đã clone document ${colName}/${docId} sang DEV (0đ chi phí, 0ms GCS delay).`);
}

async function cloneCollection(colName) {
  console.log(`🔍 [PROD] Đang đọc toàn bộ collection "${colName}"...`);
  const snap = await getDocs(collection(prodDb, colName));

  if (snap.empty) {
    console.log(`ℹ️ Collection "${colName}" trên Production rỗng.`);
    return;
  }

  console.log(`📦 [PROD] Tìm thấy ${snap.size} documents trong collection "${colName}".`);

  let count = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (!isDryRun) {
      await setDoc(doc(devDb, colName, docSnap.id), data, { merge: true });
    }
    count++;
    console.log(`   [${count}/${snap.size}] Đã sync: ${docSnap.id}`);
  }

  if (isDryRun) {
    console.log(`ℹ️ [DRY-RUN] Đã quét thử ${count} documents. Không có dữ liệu nào bị ghi.`);
  } else {
    console.log(`✅ [THÀNH CÔNG] Đã đồng bộ toàn bộ ${count} documents của "${colName}" sang DEV.`);
  }
}

async function run() {
  try {
    if (docArg) {
      const docPath = docArg.replace('--doc=', '').trim();
      await cloneSingleDoc(docPath);
    } else if (colArg) {
      const colName = colArg.replace('--col=', '').trim();
      await cloneCollection(colName);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi thực thi clone:', err.message);
    process.exit(1);
  }
}

run();

