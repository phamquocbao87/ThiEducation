import { db } from '../src/core/services/firebase.js';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

async function seedNotifications() {
  console.log('🔄 Đang khởi tạo thông báo mẫu cho hệ thống LAK EDUCATION...');

  const sampleNotifications = [
    {
      id: 'NOTI-20261111-SAMPLE-01',
      recipientId: null,
      recipientRole: 'academic',
      type: 'STUDENT_ENROLL_REQUEST',
      title: 'Học viên đăng ký lớp LH001',
      message: 'Học viên Phạm Bảo Lâm (HV214) vừa nộp đơn đăng ký tham gia lớp Wonders G1. Vui lòng xem xét phê duyệt.',
      actionUrl: '/courses-classes?tab=classes&classId=LH001&action=roster',
      metadata: { classId: 'LH001', studentId: 'HV214', studentName: 'Phạm Bảo Lâm' },
      isRead: false,
      readBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      createdBy: 'HV214',
      createdByName: 'Phạm Bảo Lâm',
    },
    {
      id: 'NOTI-20261111-SAMPLE-02',
      recipientId: null,
      recipientRole: 'academic',
      type: 'TEACHER_APPLY_REQUEST',
      title: 'Giáo viên đăng ký dạy lớp LH002',
      message: 'Giáo viên Hellen (GV791) vừa nộp đơn đăng ký nhận dạy lớp Wonders G4. Vui lòng xem xét phê duyệt.',
      actionUrl: '/courses-classes?tab=classes&classId=LH002&action=roster',
      metadata: { classId: 'LH002', teacherId: 'GV791', teacherName: 'Hellen' },
      isRead: false,
      readBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
      createdBy: 'GV791',
      createdByName: 'Hellen',
    },
    {
      id: 'NOTI-20261111-SAMPLE-03',
      recipientId: 'HV214',
      recipientRole: 'student',
      type: 'REGISTRATION_APPROVED',
      title: 'Phê duyệt tham gia lớp LH001!',
      message: 'Chúc mừng bạn! Yêu cầu tham gia lớp học Wonders G1 - Lớp Khởi Động Sáng Tạo (Zoom) của bạn đã được Giáo vụ phê duyệt.',
      actionUrl: '/courses-classes?tab=classes&classId=LH001',
      metadata: { classId: 'LH001', studentId: 'HV214' },
      isRead: false,
      readBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      createdBy: 'ACA545',
      createdByName: 'Ngọc Nhi',
    },
  ];

  for (const noti of sampleNotifications) {
    await setDoc(doc(db, 'notifications', noti.id), noti, { merge: true });
    console.log(`  ✅ Đã khởi tạo notification: ${noti.id} - ${noti.title}`);
  }

  console.log('🎉 Hoàn tất nạp dữ liệu thông báo mẫu vào Firestore!');
  process.exit(0);
}

seedNotifications().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

