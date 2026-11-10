import { db } from '../src/core/services/firebase.js';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

const OFFICIAL_WONDERS_COURSES = [
  {
    id: 'KH-WONDERS-G1',
    name: 'Wonders Grade 1 (G1) - Tiếng Anh Học Thuật & Tư Duy Phản Biện',
    level: 'WONDERS-G1',
    targetAge: '6 - 7 tuổi (Lớp 1 Tiểu học)',
    durationMonths: 3,
    durationWeeks: 12,
    sessionsPerWeek: 2,
    totalSessions: 24,
    maxClassSize: 18,
    feePerMonth: 2500000,
    totalCourseFee: 7500000,
    objectives: 'Phát triển toàn diện 4 kỹ năng ELA: Nhận diện âm vị chuẩn Phonics, nâng cao vốn từ vựng học thuật, đọc sâu văn bản văn học cổ điển và tự tin giao tiếp 100% với Giáo viên Bản Xứ qua Zoom.',
    curriculumTextbooks: 'McGraw-Hill Wonders Literature Anthology G1 & Reading/Writing Companion',
    prerequisites: 'Đã hoàn thành cấp độ Wonders GK hoặc đạt bài kiểm tra đánh giá năng lực 1-1 với giáo vụ',
    format: '100% Native English Teacher (Zoom Cloud Meeting)',
    activeClasses: 0,
    enrolledStudents: 0,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'KH-WONDERS-G2',
    name: 'Wonders Grade 2 (G2) - Nâng Cao Kỹ Năng Đọc Hiểu & Giao Tiếp',
    level: 'WONDERS-G2',
    targetAge: '7 - 8 tuổi (Lớp 2 Tiểu học)',
    durationMonths: 3,
    durationWeeks: 12,
    sessionsPerWeek: 2,
    totalSessions: 24,
    maxClassSize: 18,
    feePerMonth: 2700000,
    totalCourseFee: 8100000,
    objectives: 'Mở rộng vốn từ vựng theo chủ đề khoa học xã hội, phát triển kỹ năng trả lời câu hỏi suy luận và thuyết trình ngắn trước lớp.',
    curriculumTextbooks: 'McGraw-Hill Wonders Literature Anthology G2 & Reading/Writing Companion',
    prerequisites: 'Đã hoàn thành Wonders G1 hoặc tương đương',
    format: '100% Native English Teacher (Zoom Cloud Meeting)',
    activeClasses: 0,
    enrolledStudents: 0,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'KH-WONDERS-G3',
    name: 'Wonders Grade 3 (G3) - Cấu Trúc Ngữ Pháp & Phát Triển Ý Tưởng',
    level: 'WONDERS-G3',
    targetAge: '8 - 9 tuổi (Lớp 3 Tiểu học)',
    durationMonths: 4,
    durationWeeks: 16,
    sessionsPerWeek: 2,
    totalSessions: 32,
    maxClassSize: 16,
    feePerMonth: 2900000,
    totalCourseFee: 11600000,
    objectives: 'Học cách phân tích cấu trúc đoạn văn, nhận diện thông điệp chính tác giả và viết đoạn văn biểu đạt quan điểm.',
    curriculumTextbooks: 'McGraw-Hill Wonders Literature Anthology G3 & Reading/Writing Companion',
    prerequisites: 'Đã hoàn thành Wonders G2 hoặc tương đương',
    format: '100% Native English Teacher (Zoom Cloud Meeting)',
    activeClasses: 0,
    enrolledStudents: 0,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'KH-WONDERS-G4',
    name: 'Wonders Grade 4 (G4) - Đọc Sâu & Viết Luận Phân Tích',
    level: 'WONDERS-G4',
    targetAge: '9 - 10 tuổi (Lớp 4 Tiểu học)',
    durationMonths: 6,
    durationWeeks: 24,
    sessionsPerWeek: 2,
    totalSessions: 48,
    maxClassSize: 16,
    feePerMonth: 3200000,
    totalCourseFee: 19200000,
    objectives: 'Rèn luyện kỹ năng đọc sâu (Close Reading), tổng hợp đa nguồn thông tin, viết bài luận phân tích cấu trúc 4 bước và tranh biện bảo vệ luận điểm cá nhân chuẩn Common Core State Standards.',
    curriculumTextbooks: 'McGraw-Hill Wonders Literature Anthology G4 & Reading/Writing Companion',
    prerequisites: 'Đã hoàn thành cấp độ Wonders G3 hoặc đạt bài kiểm tra năng lực đầu vào B1',
    format: '100% Native English Teacher (Zoom Cloud Meeting)',
    activeClasses: 0,
    enrolledStudents: 0,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

async function seedCourses() {
  const colRef = collection(db, 'courses');
  const snap = await getDocs(colRef);
  console.log(`Current courses in Firestore: ${snap.size}`);

  if (snap.size === 0) {
    console.log('Seeding official McGraw-Hill Wonders courses into Firestore...');
    for (const c of OFFICIAL_WONDERS_COURSES) {
      await setDoc(doc(db, 'courses', c.id), c);
      console.log(`  ✅ Added course ${c.id}: ${c.name}`);
    }
    console.log('Done seeding official courses to Firestore.');
  } else {
    console.log('Courses collection already has documents. Skipping seed.');
  }
  process.exit(0);
}

seedCourses();

