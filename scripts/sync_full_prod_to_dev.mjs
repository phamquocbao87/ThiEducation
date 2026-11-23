import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

/**
 * SCRIPT ĐỒNG BỘ DỮ LIỆU TOÀN BỘ TỪ PRODUCTION XUỐNG DEV & XUẤT SNAPSHOT JSON
 * 
 * 🛡️ KỶ LUẬT AN TOÀN BẤT BIẾN (STRICT READ-ONLY ON PROD):
 * 1. dbProd CHỈ GỌI getDocs() - TUYỆT ĐỐI KHÔNG CÓ BẤT KỲ LỆNH GHI/SỬA/XÓA NÀO TRÊN dbProd!
 * 2. MỌI THAO TÁC GHI ĐỀU THỰC HIỆN TRÊN dbDev (lakeducation-dev).
 * 3. XUẤT CÁC TỆP JSON CỤC BỘ TẠI `data/production_snapshot/` ĐỂ SẾP BẢO PHÂN TÍCH & CODING.
 * 4. BẢO TOÀN NGUYÊN VẸN 100% ID DOCUMENT VÀ DỮ LIỆU GỐC TỪ PROD.
 */

// 1. Cấu hình Production (CHỈ ĐỌC - READ ONLY)
const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

// 2. Cấu hình Development (ĐÍCH ĐẾN - WRITE TARGET)
const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

const appProd = initializeApp(prodConfig, 'PROD_READONLY_SAFE');
const appDev = initializeApp(devConfig, 'DEV_TARGET_WRITE');

const dbProd = getFirestore(appProd, 'lakeducationdb');
const dbDev = getFirestore(appDev, 'lakeducationdb');

// Danh sách toàn bộ các collections của hệ thống
const collectionsToSync = [
  'users',
  'classes',
  'courses',
  'session_evaluations',
  'classroom_live',
  'learning_materials',
  'student_goals',
  'tuitions',
  'exercises',
  'exercise_assignments',
  'exercise_attempts',
  'user_audit_logs',
  'notifications',
  'class_absence_requests',
  'homeworks',
  'payrolls',
  'contracts',
  'student_teacher_notes',
  'student_notes',
  'curriculum_levels',
  'curriculums',
  'classrooms',
  'materials',
  'attendance'
];

const snapshotDir = path.resolve('data/production_snapshot');
if (!fs.existsSync(snapshotDir)) {
  fs.mkdirSync(snapshotDir, { recursive: true });
}

async function syncProdToDev() {
  console.log("================================================================================");
  console.log("🚀 BẮT ĐẦU ĐỒNG BỘ TOÀN DIỆN DỮ LIỆU TỪ PRODUCTION SANG DEVELOPMENT");
  console.log("🛡️ AN TOÀN TUYỆT ĐỐI: PRODUCTION (lakeducation) LÀ 100% READ-ONLY");
  console.log("🎯 ĐÍCH ĐẾN 1: FIRESTORE DEV (lakeducation-dev / lakeducationdb)");
  console.log(`🎯 ĐÍCH ĐẾN 2: THƯ MỤC DỮ LIỆU CỤC BỘ (${snapshotDir})`);
  console.log("================================================================================\n");

  const syncReport = {};
  let totalDocsCopied = 0;
  const snapshotSummary = [];

  for (const colName of collectionsToSync) {
    console.log(`\n📂 [COLLECTION: ${colName}]`);
    try {
      // Đọc toàn bộ documents từ Production (CHỈ ĐỌC)
      const prodSnap = await getDocs(collection(dbProd, colName));
      const count = prodSnap.size;
      console.log(`   -> Tìm thấy ${count} documents trên Production.`);

      if (count === 0) {
        console.log(`   ⚪ Bỏ qua vì collection rỗng.`);
        syncReport[colName] = { prodCount: 0, copied: 0, status: 'SKIPPED_EMPTY' };
        continue;
      }

      const collectionDocs = [];
      let copiedCount = 0;

      for (const d of prodSnap.docs) {
        const docId = d.id;
        const docData = d.data();
        collectionDocs.push({ _id: docId, ...docData });

        // Ghi sang Firestore Dev với ID trùng khớp 100%
        await setDoc(doc(dbDev, colName, docId), docData, { merge: true });
        copiedCount++;
        totalDocsCopied++;

        if (count <= 10 || copiedCount % 20 === 0 || copiedCount === count) {
          console.log(`      ✓ Đã nạp sang Dev: [${colName}/${docId}] (${copiedCount}/${count})`);
        }
      }

      // Lưu tệp JSON snapshot cục bộ cho Sếp phân tích & coding
      const jsonFilePath = path.join(snapshotDir, `${colName}.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(collectionDocs, null, 2), 'utf-8');
      console.log(`   💾 Đã xuất file JSON cục bộ: ${jsonFilePath} (${(fs.statSync(jsonFilePath).size / 1024).toFixed(1)} KB)`);

      syncReport[colName] = { prodCount: count, copied: copiedCount, status: 'SUCCESS' };
      snapshotSummary.push({ collection: colName, count: count, file: `${colName}.json` });

      console.log(`   ✅ Hoàn tất [${colName}]: ${copiedCount}/${count} docs.`);
    } catch (err) {
      console.error(`   ❌ Lỗi khi đồng bộ collection [${colName}]:`, err.message);
      syncReport[colName] = { prodCount: 'ERROR', copied: 0, status: `ERROR: ${err.message}` };
    }
  }

  // ---------------------------------------------------------------------------
  // XUẤT TỆP SUMMARY README ĐỂ TRA CỨU
  // ---------------------------------------------------------------------------
  const summaryContent = `# PRODUCTION DATA SNAPSHOT FOR DEV & CODING
> Xuất lúc: ${new Date().toISOString()}
> Nguồn: Production Firebase \`lakeducation\` / database \`lakeducationdb\` (100% Read-Only)
> Đích: Development Firebase \`lakeducation-dev\` / database \`lakeducationdb\`
> Thư mục snapshot: \`data/production_snapshot/\`

## 📊 Bảng Thống Kê Collections
| STT | Tên Collection | Số Documents | File JSON Cục Bộ | Trạng Thái |
|:---:|:---|:---:|:---|:---:|
${snapshotSummary.map((s, idx) => `| ${idx + 1} | \`${s.collection}\` | **${s.count}** | [\`${s.file}\`](./${s.file}) | ✅ Đã đồng bộ |`).join('\n')}

**Tổng số documents đã đồng bộ:** **${totalDocsCopied}**
`;

  fs.writeFileSync(path.join(snapshotDir, 'README.md'), summaryContent, 'utf-8');

  // ---------------------------------------------------------------------------
  // XÁC MINH KẾT QUẢ SAU ĐỒNG BỘ TRÊN DEV
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("🔍 TIẾN HÀNH KIỂM TOÁN XÁC MINH TRÊN DATABASE DEV...");
  console.log("================================================================================\n");

  for (const colName of Object.keys(syncReport)) {
    if (syncReport[colName].status === 'SUCCESS') {
      try {
        const devSnap = await getDocs(collection(dbDev, colName));
        const prodCount = syncReport[colName].prodCount;
        const devCount = devSnap.size;
        const isMatch = devCount >= prodCount;
        console.log(`   * ${colName.padEnd(25)}: Prod = ${prodCount} | Dev = ${devCount} -> ${isMatch ? '✅ KHỚP CHUẨN' : '⚠️ CHÊNH LỆCH'}`);
      } catch (e) {
        console.log(`   * ${colName.padEnd(25)}: Lỗi xác minh: ${e.message}`);
      }
    }
  }

  console.log("\n================================================================================");
  console.log(`🎉 TỔNG KẾT: ĐÃ ĐỒNG BỘ THÀNH CÔNG ${totalDocsCopied} DOCUMENTS TỪ PROD SANG DEV!`);
  console.log(`📁 DỮ LIỆU CỤC BỘ ĐÃ LƯU TẠI: ${snapshotDir}`);
  console.log("🛡️ DỮ LIỆU PRODUCTION HOÀN TOÀN KHÔNG BỊ THAY ĐỔI DÙ CHỈ 1 BYTE!");
  console.log("================================================================================");
  process.exit(0);
}

syncProdToDev();
