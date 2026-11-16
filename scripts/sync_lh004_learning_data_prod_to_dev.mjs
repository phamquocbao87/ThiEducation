import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// 1. CONFIGURATION & ISOLATION
// -----------------------------------------------------------------------------
const prodConfig = {
  apiKey: 'AIzaSyDt14R5Iu5-gRHzE1jJ5VE3K4jlt-6CWl0',
  authDomain: 'lakeducation.firebaseapp.com',
  projectId: 'lakeducation',
  storageBucket: 'lakeducation.firebasestorage.app',
  messagingSenderId: '36575839783',
  appId: '1:36575839783:web:6d628597b275618d187002',
};

const devConfig = {
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
};

// Khởi tạo 2 ứng dụng độc lập
const appProd = initializeApp(prodConfig, 'PROD_READONLY');
const appDev = initializeApp(devConfig, 'DEV_TARGET');

// dbProd: CHỈ DÙNG ĐỂ ĐỌC (STRICT READ-ONLY)
const dbProd = getFirestore(appProd, 'lakeducationdb');

// dbDev: DÙNG ĐỂ GHI SANG SANDBOX DEV
const dbDev = getFirestore(appDev, 'lakeducationdb');

async function syncLH004ProdToDev() {
  console.log("================================================================================");
  console.log("🔄 BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU LỚP LH004 TỪ PRODUCTION SANG FIRESTORE DEV");
  console.log("🛡️ CHẾ ĐỘ AN TOÀN: PRODUCTION LÀ 100% READ-ONLY (ZERO WRITE)");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // BƯỚC 1: ĐỒNG BỘ THÔNG TIN LỚP LH004
  // ---------------------------------------------------------------------------
  console.log("\n[1/5] Đồng bộ Document Class 'LH004'...");
  const prodClassSnap = await getDoc(doc(dbProd, 'classes', 'LH004'));
  if (prodClassSnap.exists()) {
    const classData = prodClassSnap.data();
    console.log(`   -> Đọc thành công từ Prod: ${classData.name} (${(classData.studentIds || []).length} học sinh)`);
    await setDoc(doc(dbDev, 'classes', 'LH004'), classData, { merge: true });
    console.log("   ✅ Đã ghi thành công sang Dev: classes/LH004");
  } else {
    console.warn("   ⚠️ Không tìm thấy doc classes/LH004 trên Prod!");
  }

  // ---------------------------------------------------------------------------
  // BƯỚC 2: ĐỒNG BỘ PHIÊN HỌC TỐI NAY LIVE_LH004_1794830400000
  // ---------------------------------------------------------------------------
  console.log("\n[2/5] Đồng bộ Session Evaluation 'LIVE_LH004_1794830400000'...");
  const sessionId = 'LIVE_LH004_1794830400000';
  const prodSessionSnap = await getDoc(doc(dbProd, 'session_evaluations', sessionId));
  if (prodSessionSnap.exists()) {
    const sessionData = prodSessionSnap.data();
    console.log(`   -> Đọc thành công từ Prod: Date=${sessionData.date}, Present=${sessionData.presentCount}, Absent=${sessionData.absentCount}`);
    console.log(`   -> Quick notes: ${JSON.stringify(sessionData.quickNotes)}`);
    await setDoc(doc(dbDev, 'session_evaluations', sessionId), sessionData, { merge: true });
    console.log(`   ✅ Đã ghi thành công sang Dev: session_evaluations/${sessionId}`);
  } else {
    console.warn(`   ⚠️ Không tìm thấy doc session_evaluations/${sessionId} trên Prod!`);
  }

  // ---------------------------------------------------------------------------
  // BƯỚC 3: ĐỒNG BỘ HỒ SƠ HỌC VIÊN THIẾU TRÊN DEV (HV610 - Subin)
  // ---------------------------------------------------------------------------
  console.log("\n[3/5] Đồng bộ Hồ sơ Học sinh HV610 (Subin) sang Dev...");
  const prodHV610Snap = await getDoc(doc(dbProd, 'users', 'HV610'));
  if (prodHV610Snap.exists()) {
    const hv610Data = prodHV610Snap.data();
    console.log(`   -> Đọc thành công từ Prod: ${hv610Data.name || 'Ha Thinh Gia Bao'} (${hv610Data.englishName})`);
    // Gán mật khẩu chuẩn dev nếu chưa có hash
    if (!hv610Data.password) {
      hv610Data.password = '$2b$10$7Z2vL3LhG9F.PzM/25/7quR.2k4xLwV9W1L9Z1X2Z3Z4Z5Z6Z7Z8Z'; // default hash
    }
    await setDoc(doc(dbDev, 'users', 'HV610'), hv610Data, { merge: true });
    console.log("   ✅ Đã tạo thành công tài khoản HV610 trên Dev!");
  } else {
    console.warn("   ⚠️ Không tìm thấy doc users/HV610 trên Prod!");
  }

  // ---------------------------------------------------------------------------
  // BƯỚC 4: ĐẢM BẢO LIÊN KẾT LỚP LH004 CHO CẢ 8 HỌC VIÊN & GIÁO VIÊN TRÊN DEV
  // ---------------------------------------------------------------------------
  console.log("\n[4/5] Đồng bộ liên kết lớp LH004 cho 8 học viên và Teacher Maj trên Dev...");
  const studentIds = ['HV463', 'HV257', 'HV344', 'HV768', 'HV739', 'HV905', 'HV971', 'HV610'];
  for (const sid of studentIds) {
    const pSnap = await getDoc(doc(dbProd, 'users', sid));
    if (pSnap.exists()) {
      const pData = pSnap.data();
      const currentDevSnap = await getDoc(doc(dbDev, 'users', sid));
      const enrolled = Array.from(new Set([
        ...(pData.enrolledClassIds || []),
        ...(pData.classesEnrolled || []),
        ...(currentDevSnap.exists() ? (currentDevSnap.data().enrolledClassIds || []) : []),
        'LH004'
      ]));
      await setDoc(doc(dbDev, 'users', sid), {
        ...pData,
        enrolledClassIds: enrolled,
        classesEnrolled: enrolled,
        status: 'active'
      }, { merge: true });
      console.log(`   -> Cập nhật user Dev [${sid}]: enrolledClassIds = ${JSON.stringify(enrolled)}`);
    }
  }

  // Giáo viên Teacher Maj (GV952)
  const pTeachSnap = await getDoc(doc(dbProd, 'users', 'GV952'));
  if (pTeachSnap.exists()) {
    const tData = pTeachSnap.data();
    const assigned = Array.from(new Set([
      ...(tData.assignedClasses || []),
      'LH004',
      'LH002'
    ]));
    await setDoc(doc(dbDev, 'users', 'GV952'), {
      ...tData,
      assignedClasses: assigned,
      status: 'active'
    }, { merge: true });
    console.log(`   -> Cập nhật giáo viên Dev [GV952]: assignedClasses = ${JSON.stringify(assigned)}`);
  }

  // ---------------------------------------------------------------------------
  // BƯỚC 5: ĐỒNG BỘ 6 HỌC LIỆU / TÀI LIỆU CỦA LỚP LH004 / KH-7569
  // ---------------------------------------------------------------------------
  console.log("\n[5/5] Đồng bộ Học liệu liên quan đến LH004 sang Dev...");
  const pMatSnap = await getDocs(collection(dbProd, 'learning_materials'));
  let syncedMats = 0;
  for (const docMat of pMatSnap.docs) {
    const mData = docMat.data();
    const str = JSON.stringify(mData);
    if (str.includes('LH004') || str.includes('KH-7569') || mData.classId === 'LH004') {
      await setDoc(doc(dbDev, 'learning_materials', docMat.id), mData, { merge: true });
      syncedMats++;
      console.log(`   -> Đồng bộ học liệu Dev [${docMat.id}]: ${mData.title || mData.name || mData.courseName}`);
    }
  }
  console.log(`   ✅ Đã đồng bộ ${syncedMats} tài liệu/học liệu sang Dev!`);

  console.log("\n================================================================================");
  console.log("🎉 ĐỒNG BỘ THÀNH CÔNG 100% SANG FIRESTORE DEV!");
  console.log("================================================================================");
  process.exit(0);
}

syncLH004ProdToDev().catch(err => {
  console.error("❌ Lỗi khi đồng bộ:", err);
  process.exit(1);
});
