/**
 * Batch Password Migration Script to Bcrypt Hash — LAK EDUCATION
 *
 * Quét toàn bộ collection `users` trên Cloud Firestore (lakeducationdb).
 * Tự động băm (hash) mọi mật khẩu plaintext sang Bcrypt Salted Hash ($2a$ / $2b$).
 */
import { db } from '../src/core/services/firebase.js';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { PasswordHashService } from '../src/core/services/PasswordHashService.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('==================================================================');
  console.log('🚀 BẮT ĐẦU CHẠY BATCH MIGRATION: MÃ HOÁ TOÀN BỘ MẬT KHẨU TRÊN FIRESTORE');
  console.log('==================================================================\n');

  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);

  if (snap.empty) {
    console.log('⚠️ Không tìm thấy người dùng nào trong Firestore users collection!');
    process.exit(0);
  }

  console.log(`📁 Tìm thấy tổng cộng: ${snap.size} documents trong collection 'users'.\n`);

  const backupData = [];
  let updatedCount = 0;
  let alreadyHashedCount = 0;
  let errorCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    const userId = data.id || data.code || docId;
    const userName = data.name || 'Unknown';
    const role = data.role || 'unknown';
    const rawPass = data.password;

    backupData.push({
      docId,
      userId,
      name: userName,
      role,
      hasPassword: Boolean(rawPass),
      rawPasswordPreview: rawPass ? (rawPass.length > 3 ? `${rawPass.slice(0, 2)}***` : '***') : null,
    });

    if (PasswordHashService.isBcryptHash(rawPass)) {
      console.log(`  ⏩ [${userId}] ${userName} (${role}): ĐÃ ĐƯỢC MÃ HOÁ TRƯỚC ĐÓ (${rawPass.slice(0, 10)}...). Bỏ qua.`);
      alreadyHashedCount++;
      continue;
    }

    const plainPassToHash = (rawPass && String(rawPass).trim()) || 'LakEducation@2026';
    const newHash = PasswordHashService.hashPassword(plainPassToHash);

    try {
      await setDoc(
        doc(db, 'users', docId),
        {
          password: newHash,
          passwordMigratedAt: new Date().toISOString(),
          passwordAlgo: 'bcrypt-10',
        },
        { merge: true }
      );
      console.log(`  ✅ [${userId}] ${userName} (${role}): ĐÃ MÃ HOÁ THÀNH CÔNG!`);
      console.log(`     - Mật khẩu cũ: "${plainPassToHash}"`);
      console.log(`     - Hash mới:    "${newHash.slice(0, 25)}..."`);
      updatedCount++;
    } catch (err) {
      console.error(`  ❌ [${userId}] Lỗi cập nhật document:`, err.message);
      errorCount++;
    }
  }

  // Lưu backup metadata
  try {
    const backupDir = path.resolve(process.cwd(), 'docs');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, 'migration_audit_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu snapshot kiểm toán tại: ${backupPath}`);
  } catch (bErr) {
    console.warn('⚠️ Lỗi ghi backup file:', bErr.message);
  }

  console.log('\n==================================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ MIGRATION MÃ HOÁ MẬT KHẨU:');
  console.log(`   - Tổng số tài khoản kiểm tra: ${snap.size}`);
  console.log(`   - Số tài khoản đã mã hoá mới: ${updatedCount}`);
  console.log(`   - Số tài khoản đã mã hoá sẵn: ${alreadyHashedCount}`);
  console.log(`   - Số tài khoản lỗi:           ${errorCount}`);
  console.log('==================================================================');

  if (errorCount === 0) {
    console.log('🎉 100% TÀI KHOẢN TRÊN FIRESTORE ĐÃ ĐƯỢC BẢO MẬT BẰNG BCRYPT!');
  }

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
