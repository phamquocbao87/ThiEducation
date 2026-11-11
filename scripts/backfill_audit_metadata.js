import { db } from '../src/core/services/firebase.js';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

async function backfillAuditMetadata() {
  console.log('🔄 Bắt đầu kiểm tra và cập nhật Audit Metadata cho courses và classes...');

  // 1. Khóa Học (courses)
  const coursesCol = collection(db, 'courses');
  const coursesSnap = await getDocs(coursesCol);
  console.log(`📚 Tìm thấy ${coursesSnap.size} khóa học trong Firestore.`);

  for (const docSnap of coursesSnap.docs) {
    const data = docSnap.data();
    const updates = {};
    if (!data.createdBy) updates.createdBy = 'ADM001';
    if (!data.createdByName) updates.createdByName = 'Phạm Quốc Bảo';
    if (!data.createdAt) updates.createdAt = '2026-11-01T08:00:00.000Z';

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'courses', docSnap.id), updates);
      console.log(`  ✅ Đã cập nhật metadata audit cho khóa học: ${docSnap.id} (${data.name})`);
    } else {
      console.log(`  ℹ️ Khóa học ${docSnap.id} đã có đủ thông tin audit: ${data.createdByName} (${data.createdBy})`);
    }
  }

  // 2. Lớp Học (classes)
  const classesCol = collection(db, 'classes');
  const classesSnap = await getDocs(classesCol);
  console.log(`🏫 Tìm thấy ${classesSnap.size} lớp học trong Firestore.`);

  for (const docSnap of classesSnap.docs) {
    const data = docSnap.data();
    const updates = {};
    if (!data.createdBy) updates.createdBy = 'ADM001';
    if (!data.createdByName) updates.createdByName = 'Phạm Quốc Bảo';
    if (!data.createdAt) updates.createdAt = '2026-11-01T08:00:00.000Z';

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'classes', docSnap.id), updates);
      console.log(`  ✅ Đã cập nhật metadata audit cho lớp học: ${docSnap.id} (${data.name})`);
    } else {
      console.log(`  ℹ️ Lớp học ${docSnap.id} đã có đủ thông tin audit: ${data.createdByName} (${data.createdBy})`);
    }
  }

  console.log('🎉 Hoàn tất cập nhật Audit Metadata cho Cloud Firestore!');
  process.exit(0);
}

backfillAuditMetadata().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

