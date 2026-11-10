/**
 * Seed initial real tuition records into Cloud Firestore `tuitions` collection.
 * Database: `lakeducationdb`
 * Targets active students:
 * 1. HV214 - Phạm Bảo Lâm (Cowboy, Wonders G1 Primary - 2,500,000 đ - PAID)
 * 2. HV451 - Pham Bao Thu (P, Wonders G4 Deep Reading - 3,200,000 đ - UNPAID)
 */

import { db, IS_FIREBASE_ENABLED } from '../src/core/services/firebase.js';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

const INITIAL_REAL_TUITIONS = [
  {
    id: 'HP-2026-11-001',
    studentId: 'HV214',
    studentCode: 'HV214',
    name: 'Phạm Bảo Lâm',
    englishName: 'Cowboy',
    classId: 'G1-A',
    className: 'Wonders Grade 1 (G1) - Primary Class A (Zoom)',
    courseId: 'KH-WONDERS-G1',
    amountDue: 2500000,
    month: '11/2026',
    dueDate: '15/11/2026',
    tuitionStatus: 'PAID',
    parentName: 'Phạm Quốc Bảo',
    phone: '0989557230',
    email: 'phamquocbao87@gmail.com',
    paymentMethod: 'BANK_TRANSFER',
    receiptCode: 'BL-20261108-0891',
    paidAt: '2026-11-08T09:30:00.000Z',
    notes: 'Đã hoàn tất đóng học phí tháng 11/2026 qua chuyển khoản ngân hàng.',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-08T09:30:00.000Z',
  },
  {
    id: 'HP-2026-11-002',
    studentId: 'HV451',
    studentCode: 'HV451',
    name: 'Pham Bao Thu',
    englishName: 'P',
    classId: 'G4-A',
    className: 'Wonders Grade 4 (G4) - Reading & Writing Master (Zoom)',
    courseId: 'KH-WONDERS-G4',
    amountDue: 3200000,
    month: '11/2026',
    dueDate: '20/11/2026',
    tuitionStatus: 'UNPAID',
    parentName: 'Phạm Quốc Bảo',
    phone: '0989789987',
    email: 'baolamstudio@gmail.com',
    paymentMethod: 'PENDING',
    receiptCode: '',
    paidAt: null,
    notes: 'Học phí kỳ tháng 11/2026 chờ đối soát hoặc xác nhận từ phụ huynh.',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-10T10:31:00.000Z',
  },
];

async function seedTuitions() {
  if (!IS_FIREBASE_ENABLED || !db) {
    console.error('Firebase is not enabled!');
    process.exit(1);
  }

  console.log('--- KHỞI TẠO HÓA ĐƠN HỌC PHÍ THỰC TẾ TRÊN CLOUD FIRESTORE (tuitions) ---');
  for (const item of INITIAL_REAL_TUITIONS) {
    const docRef = doc(db, 'tuitions', item.id);
    await setDoc(docRef, item, { merge: true });
    console.log(`✅ Đã lưu hóa đơn [${item.id}] cho học viên ${item.studentCode} - ${item.name} (${item.tuitionStatus}: ${item.amountDue.toLocaleString('vi-VN')} đ)`);
  }

  const snap = await getDocs(collection(db, 'tuitions'));
  console.log(`\n🎉 Tổng số hóa đơn học phí thực tế trong Firestore: ${snap.size} hóa đơn.`);
  process.exit(0);
}

seedTuitions().catch((err) => {
  console.error('Lỗi khi seed hóa đơn học phí:', err);
  process.exit(1);
});

