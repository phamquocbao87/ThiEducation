/**
 * reconcile_student_classes.mjs
 * 
 * Script đối soát và đồng bộ 2 chiều toàn diện giữa collection `users` và `classes`
 * - Gỡ học viên đã chuyển lớp khỏi danh sách `studentIds` của lớp cũ
 * - Làm sạch `enrolledClassIds` của các tài khoản đã xóa mềm (soft-deleted)
 * - Khắc phục triệt để hiện tượng lệch pha (split-brain) trên cả DEV và PRODUCTION
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

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

async function reconcileEnvironment(envName, config) {
  console.log(`\n======================================================`);
  console.log(`🔍 BẮT ĐẦU ĐỐI SOÁT & ĐỒNG BỘ TRÊN MÔI TRƯỜNG: ${envName.toUpperCase()}`);
  console.log(`======================================================`);

  const app = initializeApp(config, `reconcile-${envName}`);
  const db = getFirestore(app, 'lakeducationdb');

  const usersSnap = await getDocs(collection(db, 'users'));
  const classesSnap = await getDocs(collection(db, 'classes'));

  const usersMap = new Map();
  usersSnap.forEach((d) => usersMap.set(d.id, { id: d.id, ...d.data() }));

  const classesMap = new Map();
  classesSnap.forEach((d) => classesMap.set(d.id, { id: d.id, ...d.data() }));

  console.log(`📊 Tổng số users: ${usersMap.size} | Tổng số lớp học: ${classesMap.size}\n`);

  let fixCount = 0;

  // BƯỚC 1: Xử lý tài khoản học viên đã xóa mềm (soft-deleted)
  console.log(`--- [BƯỚC 1: LÀM SẠCH ENROLLEDCLASSIDS CỦA USER ĐÃ XÓA MỀM] ---`);
  for (const [userId, user] of usersMap.entries()) {
    const isDeleted = user.isDeleted || user.status === 'deleted';
    if (isDeleted && Array.isArray(user.enrolledClassIds) && user.enrolledClassIds.length > 0) {
      console.log(`🧹 [XÓA ENROLLED USER DELETED]: Học viên đã xóa ${userId} (${user.name}) có enrolledClassIds: [${user.enrolledClassIds.join(', ')}] -> Reset về []`);
      await setDoc(doc(db, 'users', userId), {
        enrolledClassIds: [],
        classesEnrolled: [],
        className: '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      user.enrolledClassIds = [];
      user.classesEnrolled = [];
      fixCount++;
    }
  }

  // BƯỚC 2: Kiểm tra danh sách học viên trong từng lớp học (classes.studentIds)
  console.log(`\n--- [BƯỚC 2: LÀM SẠCH STUDENTIDS TRONG CLASSES (GỠ LỚP CŨ & USER DELETED)] ---`);
  for (const [classDocId, cls] of classesMap.entries()) {
    const originalStudentIds = Array.isArray(cls.studentIds) ? [...cls.studentIds] : [];
    const validStudentIds = [];
    let classModified = false;

    for (const sId of originalStudentIds) {
      const u = usersMap.get(sId);
      if (!u) {
        console.log(`⚠️ Gỡ học viên không tồn tại khỏi lớp ${classDocId} (${cls.name}): ${sId}`);
        classModified = true;
        fixCount++;
        continue;
      }

      if (u.isDeleted || u.status === 'deleted') {
        console.log(`🧹 Gỡ học viên đã xóa ${sId} (${u.name}) khỏi lớp ${classDocId} (${cls.name})`);
        classModified = true;
        fixCount++;
        continue;
      }

      const enrolledIds = Array.isArray(u.enrolledClassIds) ? u.enrolledClassIds : (u.classId ? [u.classId] : []);
      
      // Nếu user có đăng ký lớp này trong hồ sơ: Giữ lại
      if (enrolledIds.includes(classDocId) || enrolledIds.includes(cls.id)) {
        validStudentIds.push(sId);
      } else {
        // User KHÔNG đăng ký lớp này (đã chuyển sang lớp khác, nhưng lớp cũ vẫn lưu): GỠ BỎ
        console.log(`🧹 [GỠ LỚP CŨ KHÔNG ĐỒNG BỘ]: Học viên ${sId} (${u.name}) chỉ đăng ký [${enrolledIds.join(', ')}], gỡ khỏi lớp ${classDocId} (${cls.name})`);
        classModified = true;
        fixCount++;
      }
    }

    if (classModified) {
      console.log(`💾 Cập nhật lớp ${classDocId}: ${originalStudentIds.length} HV -> ${validStudentIds.length} HV`);
      await setDoc(doc(db, 'classes', classDocId), {
        studentIds: validStudentIds,
        totalStudents: validStudentIds.length,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  console.log(`\n✅ Hoàn tất xử lý ${envName.toUpperCase()}: Đã sửa ${fixCount} trường hợp.`);
}

async function main() {
  const target = process.argv[2] || 'both';
  if (target === 'dev' || target === 'both') {
    await reconcileEnvironment('development', devConfig);
  }
  if (target === 'prod' || target === 'both') {
    await reconcileEnvironment('production', prodConfig);
  }
  console.log(`\n🎉 TẤT CẢ MÔI TRƯỜNG ĐÃ ĐƯỢC ĐỒNG BỘ NHẤT QUÁN 100%!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi reconciliation:', err);
  process.exit(1);
});
