/**
 * boost_audit_bidirectional_consistency.mjs
 * 
 * KIỂM TOÁN CHUYÊN SÂU TÍNH NHẤT QUÁN HAI CHIỀU (BIDIRECTIONAL CONSISTENCY AUDIT)
 * u.enrolledClassIds <===> c.studentIds
 * 
 * Kiểm tra trên cả môi trường Dev và Production.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
};

const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
};

async function auditEnvironment(envName, config) {
  console.log(`\n======================================================`);
  console.log(`🔍 BẮT ĐẦU KIỂM TOÁN TÍNH NHẤT QUÁN TRÊN MÔI TRƯỜNG: ${envName.toUpperCase()}`);
  console.log(`======================================================`);

  const app = initializeApp(config, `audit-${envName}`);
  const db = getFirestore(app, 'lakeducationdb');

  const usersSnap = await getDocs(collection(db, 'users'));
  const classesSnap = await getDocs(collection(db, 'classes'));

  const usersMap = new Map();
  usersSnap.forEach((d) => usersMap.set(d.id, { id: d.id, ...d.data() }));

  const classesMap = new Map();
  classesSnap.forEach((d) => classesMap.set(d.id, { id: d.id, ...d.data() }));

  console.log(`📊 Tổng Users: ${usersMap.size} | Tổng Classes: ${classesMap.size}\n`);

  let errors = 0;
  let warnings = 0;

  // 1. KIỂM TRA CHIỀU XUÔI: user.enrolledClassIds => class.studentIds
  console.log(`--- [CHIỀU 1: HỒ SƠ HỌC VIÊN -> DANH SÁCH LỚP HỌC] ---`);
  for (const [userId, user] of usersMap.entries()) {
    if (user.role !== 'student') continue;
    const enrolledIds = Array.isArray(user.enrolledClassIds) ? user.enrolledClassIds : (user.classId ? [user.classId] : []);
    
    for (const cId of enrolledIds) {
      const cls = classesMap.get(cId);
      if (!cls) {
        console.error(`  ❌ [LỖI LỚP ẢO]: Học viên ${userId} (${user.name}) đăng ký lớp không tồn tại: "${cId}"`);
        errors++;
      } else {
        const studentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
        if (!studentIds.includes(userId) && !studentIds.includes(user.code)) {
          console.error(`  ❌ [LỆCH CHIỀU XUÔI]: Học viên ${userId} (${user.name}) có lớp "${cId}" (${cls.name}) trong enrolledClassIds, NHƯNG lớp này KHÔNG có ${userId} trong studentIds!`);
          errors++;
        }
      }
    }
  }

  // 2. KIỂM TRA CHIỀU NGƯỢC: class.studentIds => user.enrolledClassIds
  console.log(`\n--- [CHIỀU 2: DANH SÁCH LỚP HỌC -> HỒ SƠ HỌC VIÊN] ---`);
  for (const [classId, cls] of classesMap.entries()) {
    const studentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
    
    // Kiểm tra trùng lặp studentIds trong lớp
    const uniqueIds = new Set(studentIds);
    if (uniqueIds.size !== studentIds.length) {
      console.warn(`  ⚠️ [CẢNH BÁO TRÙNG LẶP]: Lớp ${classId} (${cls.name}) có studentIds bị trùng lặp ID!`);
      warnings++;
    }

    for (const sid of uniqueIds) {
      const user = usersMap.get(sid);
      if (!user) {
        console.error(`  ❌ [LỖI HỌC VIÊN ẢO]: Lớp ${classId} (${cls.name}) chứa studentId không tồn tại trong DB: "${sid}"`);
        errors++;
      } else {
        const enrolledIds = Array.isArray(user.enrolledClassIds) ? user.enrolledClassIds : (user.classId ? [user.classId] : []);
        if (!enrolledIds.includes(classId) && !enrolledIds.includes(cls.id)) {
          console.error(`  ❌ [LỆCH CHIỀU NGƯỢC]: Lớp ${classId} (${cls.name}) chứa học viên ${sid} (${user.name}), NHƯNG hồ sơ học viên KHÔNG có lớp này trong enrolledClassIds! (enrolled: [${enrolledIds.join(', ')}])`);
          errors++;
        }
      }
    }
  }

  // 3. TỔNG KẾT
  console.log(`\n------------------------------------------------------`);
  if (errors === 0 && warnings === 0) {
    console.log(`🎉 [XÁC NHẬN HOÀN TOÀN NHẤT QUÁN 100% TRÊN ${envName.toUpperCase()}]:`);
    console.log(`   - 100% học viên trong lớp đều có lớp trong hồ sơ.`);
    console.log(`   - 100% lớp trong hồ sơ học viên đều có học viên trong danh sách lớp.`);
    console.log(`   - Không có dangling references, không có lớp ảo hay học viên ảo.`);
    return true;
  } else {
    console.log(`⚠️ KẾT QUẢ KIỂM TOÁN ${envName.toUpperCase()}: ${errors} Lỗi | ${warnings} Cảnh báo.`);
    return false;
  }
}

async function main() {
  const devPassed = await auditEnvironment('Development (lakeducation-dev)', devConfig);
  const prodPassed = await auditEnvironment('Production (lakeducation)', prodConfig);

  console.log(`\n======================================================`);
  console.log(`TỔNG KẾT TOÀN CỤC:`);
  console.log(`  - Môi trường DEV:        ${devPassed ? '🟢 ĐẠT CHUẨN 100%' : '🔴 CẦN XỬ LÝ'}`);
  console.log(`  - Môi trường PRODUCTION: ${prodPassed ? '🟢 ĐẠT CHUẨN 100%' : '🟡 CÓ LỆCH PHA CŨ'}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during boost audit:', err);
  process.exit(1);
});
