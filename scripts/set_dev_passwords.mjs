import { db, firebaseConfig, FIREBASE_RUNTIME_ENV } from '../src/core/services/firebase.js';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { PasswordHashService } from '../src/core/services/PasswordHashService.js';
import fs from 'fs';
import path from 'path';

const TARGET_PASS = '@Bcd1234';

async function setDevPasswords() {
  console.log('==================================================================');
  console.log('🛠️ THIẾT LẬP MẬT KHẨU MẶC ĐỊNH CHO MÔI TRƯỜNG DEV (lakeducation-dev)');
  console.log('==================================================================');
  console.log(`Runtime Env: ${FIREBASE_RUNTIME_ENV}`);
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  console.log(`Target Password: ${TARGET_PASS}\n`);

  if (firebaseConfig.projectId !== 'lakeducation-dev') {
    console.error('❌ SAFETY ABORT: Project ID is NOT lakeducation-dev! Aborting to protect other environments.');
    process.exit(1);
  }

  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);

  if (snap.empty) {
    console.log('⚠️ Không tìm thấy người dùng nào trong Firestore users collection!');
    process.exit(0);
  }

  console.log(`📁 Tìm thấy tổng cộng: ${snap.size} tài khoản trong 'lakeducation-dev/users'.`);

  // Hash target password using Bcrypt with 10 salt rounds
  const newHash = PasswordHashService.hashPassword(TARGET_PASS);
  console.log(`🔒 Chuỗi băm Bcrypt mới: ${newHash.slice(0, 15)}...\n`);

  let updated = 0;
  let errors = 0;
  const auditList = [];

  for (const docSnap of snap.docs) {
    const docId = docSnap.id;
    const data = docSnap.data();
    const userId = data.id || data.code || docId;
    const role = data.role || 'unknown';
    const email = data.email || data.phone || 'N/A';

    try {
      const docRef = doc(db, 'users', docId);
      await updateDoc(docRef, {
        password: newHash,
        updatedAt: new Date().toISOString(),
      });

      updated++;
      auditList.push({ docId, userId, role, email, status: 'UPDATED' });
      process.stdout.write(`   [${updated}/${snap.size}] ✅ Updated ${userId} (${role} - ${email})\n`);
    } catch (err) {
      errors++;
      console.error(`   ❌ Lỗi cập nhật ${userId}:`, err.message);
    }
  }

  console.log('\n==================================================================');
  console.log(`📊 TỔNG KẾT: Đã cập nhật thành công ${updated}/${snap.size} tài khoản sang mật khẩu mặc định: ${TARGET_PASS}`);
  if (errors > 0) {
    console.log(`⚠️ Số tài khoản gặp lỗi: ${errors}`);
  }
  console.log('==================================================================');

  // Save audit backup
  const auditPath = path.resolve('docs/dev_passwords_update_audit.json');
  fs.writeFileSync(auditPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: 'lakeducation-dev',
    defaultPassword: TARGET_PASS,
    totalUpdated: updated,
    accounts: auditList
  }, null, 2));
  console.log(`📄 Đã lưu file kiểm toán tại: ${auditPath}`);
  process.exit(0);
}

setDevPasswords().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
