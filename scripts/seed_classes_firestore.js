import { db, IS_FIREBASE_ENABLED } from '../src/core/services/firebase.js';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';

const INITIAL_REAL_CLASSES = [
  {
    id: 'LH001',
    name: 'Wonders G1 - Lớp Khởi Động Sáng Tạo (Zoom)',
    courseId: 'KH-WONDERS-G1',
    courseName: 'Wonders Grade 1 (G1) - Tiếng Anh Học Thuật & Tư Duy Phản Biện',
    courseLevel: 'WONDERS-G1',
    subject: 'Wonders Grade 1 (G1) - Tiếng Anh Học Thuật & Tư Duy Phản Biện',
    teacherId: 'GV791',
    teacherName: 'Hellen (GV791)',
    teacherAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GV791',
    schedule: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
    scheduleData: {
      days: ['Thứ 2', 'Thứ 4'],
      startTime: '18:00',
      endTime: '19:30',
      timeString: '18:00 - 19:30',
    },
    scheduleHistory: [
      {
        version: 1,
        effectiveFrom: '01/11/2026',
        effectiveTo: null,
        schedule: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
        scheduleData: {
          days: ['Thứ 2', 'Thứ 4'],
          startTime: '18:00',
          endTime: '19:30',
          timeString: '18:00 - 19:30',
        },
        status: 'ACTIVE',
        note: 'Lịch học khởi tạo từ ngày khai giảng lớp',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
    studentIds: ['HV214'],
    totalStudents: 1,
    startDate: '01/11/2026',
    platform: 'Zoom Meeting',
    meetingLink: 'https://zoom.us/j/888999111',
    zoomStudentLink: 'https://zoom.us/j/888999111',
    zoomHostLink: 'https://zoom.us/s/888999111?role=host',
    zaloGroupLink: 'https://zalo.me/g/lakeducation_class_g1',
    meetingId: '888 999 111',
    passcode: '123456',
    operationStatus: 'Đang học ổn định',
    checkInStatus: 'UPCOMING',
    recordingUrl: 'https://drive.google.com/drive/folders/zoom-recordings',
    holidays: [],
    pendingTeacherRequests: [],
    pendingStudentRequests: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LH002',
    name: 'Wonders G4 - Đọc Sâu & Viết Luận (Zoom)',
    courseId: 'KH-WONDERS-G4',
    courseName: 'Wonders Grade 4 (G4) - Đọc Sâu & Viết Luận Phân Tích',
    courseLevel: 'WONDERS-G4',
    subject: 'Wonders Grade 4 (G4) - Đọc Sâu & Viết Luận Phân Tích',
    teacherId: 'GV791',
    teacherName: 'Hellen (GV791)',
    teacherAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GV791',
    schedule: 'Thứ 3, Thứ 5 (18:00 - 19:30)',
    scheduleData: {
      days: ['Thứ 3', 'Thứ 5'],
      startTime: '18:00',
      endTime: '19:30',
      timeString: '18:00 - 19:30',
    },
    scheduleHistory: [
      {
        version: 1,
        effectiveFrom: '01/11/2026',
        effectiveTo: null,
        schedule: 'Thứ 3, Thứ 5 (18:00 - 19:30)',
        scheduleData: {
          days: ['Thứ 3', 'Thứ 5'],
          startTime: '18:00',
          endTime: '19:30',
          timeString: '18:00 - 19:30',
        },
        status: 'ACTIVE',
        note: 'Lịch học khởi tạo từ ngày khai giảng lớp',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
    studentIds: ['HV451'],
    totalStudents: 1,
    startDate: '01/11/2026',
    platform: 'Zoom Meeting',
    meetingLink: 'https://zoom.us/j/888999222',
    zoomStudentLink: 'https://zoom.us/j/888999222',
    zoomHostLink: 'https://zoom.us/s/888999222?role=host',
    zaloGroupLink: 'https://zalo.me/g/lakeducation_class_g4',
    meetingId: '888 999 222',
    passcode: '123456',
    operationStatus: 'Đang học ổn định',
    checkInStatus: 'UPCOMING',
    recordingUrl: 'https://drive.google.com/drive/folders/zoom-recordings',
    holidays: [],
    pendingTeacherRequests: [],
    pendingStudentRequests: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

async function seedClasses() {
  if (!IS_FIREBASE_ENABLED || !db) {
    console.error('Firebase is not enabled.');
    process.exit(1);
  }

  console.log('Seeding real classes into Cloud Firestore `classes` collection...');
  for (const cls of INITIAL_REAL_CLASSES) {
    await setDoc(doc(db, 'classes', cls.id), cls);
    console.log(`  ✅ Added/Updated class: ${cls.id} - ${cls.name}`);
  }

  // Cập nhật số lớp đang mở trong `courses`
  await setDoc(doc(db, 'courses', 'KH-WONDERS-G1'), { activeClasses: 1, enrolledStudents: 1 }, { merge: true });
  console.log('  ✅ Updated course KH-WONDERS-G1: activeClasses=1, enrolledStudents=1');
  await setDoc(doc(db, 'courses', 'KH-WONDERS-G4'), { activeClasses: 1, enrolledStudents: 1 }, { merge: true });
  console.log('  ✅ Updated course KH-WONDERS-G4: activeClasses=1, enrolledStudents=1');

  // Cập nhật thông tin ghi danh lớp cho HV214 và HV451
  await setDoc(doc(db, 'users', 'HV214'), {
    enrolledClassIds: ['LH001'],
    className: 'Wonders G1 - Lớp Khởi Động Sáng Tạo (Zoom)',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('  ✅ Updated student HV214: enrolledClassIds=[LH001]');

  await setDoc(doc(db, 'users', 'HV451'), {
    enrolledClassIds: ['LH002'],
    className: 'Wonders G4 - Đọc Sâu & Viết Luận (Zoom)',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('  ✅ Updated student HV451: enrolledClassIds=[LH002]');

  // Cập nhật assignedClasses cho GV791
  await setDoc(doc(db, 'users', 'GV791'), {
    assignedClasses: 'LH001, LH002',
    name: 'Hellen',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('  ✅ Updated teacher GV791: assignedClasses="LH001, LH002"');

  console.log('\n🎉 Seed classes successfully completed!');
  process.exit(0);
}

seedClasses().catch((e) => {
  console.error('❌ Error seeding classes:', e);
  process.exit(1);
});

