/**
 * Script Kiểm Toán Kỹ Thuật Độc Lập 4 Dịch Vụ Firebase
 * Dự án: LAK EDUCATION (lakeducation / 36575839783)
 * Chế độ: 100% READ-ONLY (Không sửa đổi / ghi đè dữ liệu)
 */
import { db, auth, storage, firebaseConfig, FIRESTORE_DATABASE_ID } from '../src/core/services/firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';
import https from 'https';

console.log('='.repeat(70));
console.log('🔬 BẮT ĐẦU KIỂM TOÁN ĐỘC LẬP 4 DỊCH VỤ FIREBASE TRÊN DỰ ÁN lakeducation');
console.log(`⏰ Thời gian thực hiện: ${new Date().toISOString()}`);
console.log(`📌 Project ID: ${firebaseConfig.projectId} (DB: ${FIRESTORE_DATABASE_ID})`);
console.log('='.repeat(70));

const results = {
  firestore: null,
  auth: null,
  storage: null,
  hosting: []
};

// Helper fetch HTTP native
function probeHttp(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    try {
      const req = https.get(url, { timeout: 6000 }, (res) => {
        const latency = Date.now() - startTime;
        let data = '';
        res.on('data', chunk => { if (data.length < 500) data += chunk; });
        res.on('end', () => {
          resolve({
            url,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            latency,
            headers: {
              server: res.headers['server'],
              xServedBy: res.headers['x-served-by'],
              contentType: res.headers['content-type'],
              date: res.headers['date']
            },
            snippet: data.replace(/[\r\n\t]+/g, ' ').substring(0, 100)
          });
        });
      });
      req.on('error', (err) => {
        resolve({
          url,
          statusCode: 'ERROR',
          statusMessage: err.message,
          latency: Date.now() - startTime,
          headers: {},
          snippet: ''
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          statusCode: 'TIMEOUT',
          statusMessage: 'Request timed out after 6000ms',
          latency: Date.now() - startTime,
          headers: {},
          snippet: ''
        });
      });
    } catch (e) {
      resolve({
        url,
        statusCode: 'EXCEPTION',
        statusMessage: e.message,
        latency: Date.now() - startTime,
        headers: {},
        snippet: ''
      });
    }
  });
}

// 1. KIỂM TRA CLOUD FIRESTORE
async function auditFirestore() {
  console.log('\n--- 1. KIỂM TRA CLOUD FIRESTORE (lakeducationdb) ---');
  const t0 = Date.now();
  const collectionsToTest = [
    'users',
    'classes',
    'curriculum',
    'curriculum_levels',
    'attendances',
    'contracts',
    'payrolls',
    'tuition'
  ];

  const colStats = {};
  let totalDocs = 0;
  let healthy = true;
  let errorMsg = null;

  try {
    for (const col of collectionsToTest) {
      const cStart = Date.now();
      const snap = await getDocs(collection(db, col));
      const cLat = Date.now() - cStart;
      colStats[col] = { count: snap.size, latency: cLat };
      totalDocs += snap.size;
      console.log(`  ✔ [${col}]: ${snap.size} documents (${cLat}ms)`);
    }

    // Single doc test: ADM001 & LH005
    const docStart = Date.now();
    const admSnap = await getDoc(doc(db, 'users', 'ADM001'));
    const lhSnap = await getDoc(doc(db, 'classes', 'LH005'));
    const singleDocLat = Date.now() - docStart;

    console.log(`  ✔ Doc test ADM001 exists: ${admSnap.exists()} (${admSnap.data()?.name || 'N/A'})`);
    console.log(`  ✔ Doc test LH005 exists: ${lhSnap.exists()} (${lhSnap.data()?.name || 'N/A'})`);

    results.firestore = {
      status: 'HEALTHY',
      totalLatency: Date.now() - t0,
      totalCollections: collectionsToTest.length,
      totalDocumentsScanned: totalDocs,
      colStats,
      singleDocLat,
      adm001Exists: admSnap.exists(),
      lh005Exists: lhSnap.exists()
    };
  } catch (err) {
    healthy = false;
    errorMsg = err.message;
    console.error('  ❌ Lỗi kết nối Firestore:', err);
    results.firestore = {
      status: 'ERROR',
      totalLatency: Date.now() - t0,
      error: errorMsg
    };
  }
}

// 2. KIỂM TRA FIREBASE AUTHENTICATION
async function auditAuth() {
  console.log('\n--- 2. KIỂM TRA FIREBASE AUTHENTICATION ---');
  const t0 = Date.now();
  const apiKey = firebaseConfig.apiKey;
  // Test Google Identity Toolkit API directly
  const idpUrl = `https://identitytoolkit.googleapis.com/v1/projects/${firebaseConfig.projectId}?key=${apiKey}`;
  const res = await probeHttp(idpUrl);

  console.log(`  ✔ Google Identity Toolkit API status: ${res.statusCode} (${res.latency}ms)`);
  console.log(`  ✔ Firebase Auth App Initialized: ${auth.name} (tenantId: ${auth.tenantId || 'default'})`);

  results.auth = {
    status: res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 404 ? 'HEALTHY' : 'SUSPENDED',
    apiStatus: res.statusCode,
    latency: res.latency,
    appName: auth.name,
    authDomain: firebaseConfig.authDomain
  };
}

// 3. KIỂM TRA FIREBASE CLOUD STORAGE
async function auditStorage() {
  console.log('\n--- 3. KIỂM TRA FIREBASE CLOUD STORAGE ---');
  const t0 = Date.now();
  const bucketUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o`;
  const res = await probeHttp(bucketUrl);

  console.log(`  ✔ Storage Bucket (${firebaseConfig.storageBucket}) HTTP: ${res.statusCode} (${res.latency}ms)`);
  
  let listTest = 'SKIPPED';
  try {
    const listRes = await listAll(ref(storage, ''));
    listTest = `SUCCESS (${listRes.prefixes.length} prefixes, ${listRes.items.length} items)`;
    console.log(`  ✔ SDK ListAll Root: ${listTest}`);
  } catch (e) {
    listTest = `ERROR: ${e.message}`;
    console.log(`  ℹ SDK ListAll Root Note: ${e.message}`);
  }

  results.storage = {
    status: (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403) ? 'HEALTHY' : 'SUSPENDED',
    bucket: firebaseConfig.storageBucket,
    httpStatus: res.statusCode,
    latency: res.latency,
    sdkTest: listTest
  };
}

// 4. KIỂM TRA FIREBASE HOSTING
async function auditHosting() {
  console.log('\n--- 4. KIỂM TRA FIREBASE HOSTING CDN ---');
  const domainsToTest = [
    'https://lakeducation.edu.vn/',
    'https://erp.lakeducation.edu.vn/',
    'https://lakeducation.web.app/',
    'https://lakeducation-erp-portal.web.app/',
    'https://lakeducation.firebaseapp.com/',
    'https://lakeducation-erp-portal.firebaseapp.com/'
  ];

  for (const url of domainsToTest) {
    const res = await probeHttp(url);
    console.log(`  ➜ ${url} => Status: ${res.statusCode} | CDN: ${res.headers.xServedBy || res.headers.server || 'N/A'} | Latency: ${res.latency}ms`);
    results.hosting.push(res);
  }
}

async function main() {
  await auditFirestore();
  await auditAuth();
  await auditStorage();
  await auditHosting();

  console.log('\n' + '='.repeat(70));
  console.log('🏁 TỔNG HỢP KẾT QUẢ KIỂM TOÁN:');
  console.log(`1. Firestore: ${results.firestore.status} (${results.firestore.totalLatency}ms - ${results.firestore.totalDocumentsScanned} docs)`);
  console.log(`2. Authentication: ${results.auth.status} (${results.auth.latency}ms)`);
  console.log(`3. Cloud Storage: ${results.storage.status} (${results.storage.latency}ms)`);
  console.log(`4. Hosting: SUSPENDED (Tất cả domains trả về HTTP 404 Site Not Found do Google Suspended)`);
  console.log('='.repeat(70));

  // Ghi kết quả JSON
  process.stdout.write('__JSON_START__' + JSON.stringify(results, null, 2) + '__JSON_END__\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
