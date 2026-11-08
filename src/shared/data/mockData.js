export const INITIAL_STATS = {
  totalStudents: 520,
  totalTeachers: 68,
  totalAcademicStaff: 8,
  totalCourses: 0,
  totalClasses: 0,
  monthlyTuitionCollected: 1250000000,
  monthlyTuitionPending: 180000000,
  monthlyPayrollTotal: 485000000,
  monthlyStaffPayrollTotal: 96000000,
  averageAttendanceRate: 96.4,
};

// Dữ liệu Sức khỏe Hệ thống & Bảo mật cho Role `admin` (IT Quản trị hệ thống)
export const MOCK_SYSTEM_HEALTH = {
  uptime: '99.98%',
  cpuUsage: 24,
  memoryUsage: 42,
  storageUsedGb: 318,
  storageLimitGb: 1000,
  domainStatus: 'lakeducation.com (SSL Active - Squarespace DNS)',
  firebaseAccount: 'vnthietbigarage@gmail.com',
  services: [
    { id: 'SYS-01', name: 'Firebase Firestore & Auth Cluster (vnthietbigarage@gmail.com)', status: 'Healthy', latency: '18ms', lastCheck: 'Vừa xong' },
    { id: 'SYS-02', name: 'Hosting-Store Google Drive Storage (appId: lakeducation_com)', status: 'Healthy', latency: '29ms', lastCheck: 'Vừa xong' },
    { id: 'SYS-03', name: 'Zoom Cloud Meeting & Recording Webhook', status: 'Healthy', latency: '45ms', lastCheck: '1 phút trước' },
    { id: 'SYS-04', name: 'Zalo ZNS & SMS Tuition Gateway', status: 'Healthy', latency: '62ms', lastCheck: '2 phút trước' },
  ],
  securityLogs: [
    { id: 'LOG-101', time: '09:15:22', actor: 'Trần Thu Hà (Giáo Vụ)', action: 'Cập nhật Thời khóa biểu Lớp 10A1', ip: '113.161.72.14', level: 'INFO' },
    { id: 'LOG-102', time: '08:50:10', actor: 'Lê Hoàng Mai (Kế Toán)', action: 'Đối soát & Xác nhận học phí HV002', ip: '113.161.72.18', level: 'INFO' },
    { id: 'LOG-103', time: '08:30:05', actor: 'Mr. David Smith (Teacher)', action: 'Check-in phòng Zoom Lớp 10A1', ip: '72.21.215.90', level: 'INFO' },
    { id: 'LOG-104', time: '02:14:00', actor: 'Firewall / WAF Guard', action: 'Chặn 3 request đăng nhập sai mật khẩu liên tiếp', ip: '45.122.90.11', level: 'WARN' },
  ],
};

// Danh sách Khóa học (Courses) cho Director & Giáo vụ
export const MOCK_COURSES = [
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

// Danh sách Nhân viên Giáo vụ & Bảng lương Giáo vụ (cho Director & Kế toán)
export const MOCK_ACADEMIC_STAFF = [
  { id: 'ACA001', name: 'Trần Thu Hà', gender: 'Nữ', dateOfBirth: '15/06/1992', phoneNumber: '0987654321', position: 'Trưởng nhóm Giáo vụ', managedClasses: 10, managedStudents: 195, completedTasks: 98, baseSalary: 14000000, kpiBonus: 3500000, totalSalary: 17500000, payrollStatus: 'APPROVED', month: '08/2026' },
  { id: 'ACA002', name: 'Nguyễn Phương Thảo', gender: 'Nữ', dateOfBirth: '20/08/1994', phoneNumber: '0912345678', position: 'Chuyên viên Giáo vụ & Xếp lịch', managedClasses: 9, managedStudents: 165, completedTasks: 95, baseSalary: 11000000, kpiBonus: 2500000, totalSalary: 13500000, payrollStatus: 'APPROVED', month: '08/2026' },
  { id: 'ACA003', name: 'Võ Hoàng Nam', gender: 'Nam', dateOfBirth: '10/11/1993', phoneNumber: '0938123456', position: 'Giáo vụ Quản lý Chất lượng & CSKH', managedClasses: 9, managedStudents: 160, completedTasks: 92, baseSalary: 11000000, kpiBonus: 2000000, totalSalary: 13000000, payrollStatus: 'PENDING', month: '08/2026' },
];

// 100% Foreign Native Teachers
export const MOCK_TEACHERS = [
  { id: 'GV001', name: 'Mr. David Smith', nationality: 'USA 🇺🇸', subject: 'Native English Speaking', email: 'david.smith@lakeducation.com', phone: '+1 202 555 0143', contractType: 'Full-time Native', ratePerSession: 450000, status: 'Active' },
  { id: 'GV002', name: 'Ms. Emma Watson', nationality: 'UK 🇬🇧', subject: 'IELTS Speaking & Writing', email: 'emma.watson@lakeducation.com', phone: '+44 20 7946 0991', contractType: 'Full-time Native', ratePerSession: 500000, status: 'Active' },
  { id: 'GV003', name: 'Mr. Michael Jordan', nationality: 'Canada 🇨🇦', subject: 'Grammar & Phonics', email: 'michael.jordan@lakeducation.com', phone: '+1 416 555 0188', contractType: 'Part-time Native', ratePerSession: 400000, status: 'Active' },
  { id: 'GV004', name: 'Ms. Sarah Jenkins', nationality: 'Australia 🇦🇺', subject: 'Kids Communication & Spelling', email: 'sarah.jenkins@lakeducation.com', phone: '+61 2 9374 4000', contractType: 'Visiting Native', ratePerSession: 420000, status: 'Active' },
  { id: 'GV007', name: 'Mr. Alex Ferguson', nationality: 'UK 🇬🇧', subject: 'Advanced Business English', email: 'alex.ferguson@lakeducation.com', phone: '+44 161 834 5000', contractType: 'Full-time Native', ratePerSession: 550000, status: 'Active' },
];

export const MOCK_CONTRACTS = [
  { id: 'HD-2025-01', teacherId: 'GV001', teacherName: 'Mr. David Smith', type: 'Full-time Native', ratePerSession: 450000, minSessionsPerMonth: 40, startDate: '2024-09-01', endDate: '2026-08-31', status: 'Active' },
  { id: 'HD-2025-02', teacherId: 'GV002', teacherName: 'Ms. Emma Watson', type: 'Full-time Native', ratePerSession: 500000, minSessionsPerMonth: 40, startDate: '2024-09-01', endDate: '2026-08-31', status: 'Active' },
  { id: 'HD-2025-03', teacherId: 'GV003', teacherName: 'Mr. Michael Jordan', type: 'Part-time Native', ratePerSession: 400000, minSessionsPerMonth: 20, startDate: '2025-01-15', endDate: '2026-01-14', status: 'Active' },
  { id: 'HD-2025-05', teacherId: 'GV007', teacherName: 'Mr. Alex Ferguson', type: 'Full-time Native', ratePerSession: 550000, minSessionsPerMonth: 36, startDate: '2024-06-01', endDate: '2027-05-31', status: 'Active' },
];

export const MOCK_PAYROLLS = [
  { id: 'PR-2026-08-01', teacherId: 'GV001', teacherName: 'Mr. David Smith', month: '08/2026', totalSessions: 46, ratePerSession: 450000, bonus: 2000000, deduction: 0, totalSalary: 22700000, status: 'APPROVED' },
  { id: 'PR-2026-08-02', teacherId: 'GV002', teacherName: 'Ms. Emma Watson', month: '08/2026', totalSessions: 44, ratePerSession: 500000, bonus: 2500000, deduction: 0, totalSalary: 24500000, status: 'PAID' },
  { id: 'PR-2026-08-03', teacherId: 'GV003', teacherName: 'Mr. Michael Jordan', month: '08/2026', totalSessions: 26, ratePerSession: 400000, bonus: 1000000, deduction: 0, totalSalary: 11400000, status: 'PENDING' },
  { id: 'PR-2026-08-05', teacherId: 'GV007', teacherName: 'Mr. Alex Ferguson', month: '08/2026', totalSessions: 40, ratePerSession: 550000, bonus: 3000000, deduction: 0, totalSalary: 25000000, status: 'APPROVED' },
];

export const MOCK_CLASSES = [];

export const MOCK_TIMETABLE = [];

export const MOCK_STUDENTS = [
  { id: 'HV001', name: 'Lê Anh Khoa', englishName: 'Kevin Le', age: 15, level: 'B1 Intermediate', classId: 'LH10A1', className: '10A1 - Advanced English Speaking (Zoom)', teacherId: 'GV001', parentName: 'Lê Minh Trí', phone: '0901112223', email: 'khoa.le@student.lakeducation.com', tuitionStatus: 'PAID', amountDue: 2500000, attendanceRate: 100, pronunciationScore: 5, spellingScore: 5, seriousnessScore: 5, listeningScore: 4, latestTeacherNote: 'Khoa demonstrated excellent pronunciation on consonant clusters today. Active participation!' },
  { id: 'HV002', name: 'Nguyễn Thị Ngọc Ánh', englishName: 'Anna Nguyen', age: 15, level: 'B1 Intermediate', classId: 'LH10A1', className: '10A1 - Advanced English Speaking (Zoom)', teacherId: 'GV001', parentName: 'Nguyễn Văn Bình', phone: '0902223334', email: 'anh.nguyen@student.lakeducation.com', tuitionStatus: 'PAID', amountDue: 2500000, attendanceRate: 96, pronunciationScore: 4, spellingScore: 5, seriousnessScore: 5, listeningScore: 5, latestTeacherNote: 'Anna has great vocabulary retention and spelling accuracy.' },
  { id: 'HV003', name: 'Trần Minh Quân', englishName: 'Lucas Tran', age: 16, level: 'B2 Upper-Intermediate', classId: 'LH11B2', className: '11B2 - IELTS Master 6.5+ (Zoom)', teacherId: 'GV002', parentName: 'Trần Hương Giang', phone: '0903334445', email: 'quan.tran@student.lakeducation.com', tuitionStatus: 'UNPAID', amountDue: 3200000, attendanceRate: 92, pronunciationScore: 4, spellingScore: 4, seriousnessScore: 4, listeningScore: 4, latestTeacherNote: 'Needs to focus more on final word endings in IELTS Speaking Part 2.' },
  { id: 'HV004', name: 'Phạm Hoàng Yến', englishName: 'Jenny Pham', age: 16, level: 'B2 Upper-Intermediate', classId: 'LH11B2', className: '11B2 - IELTS Master 6.5+ (Zoom)', teacherId: 'GV002', parentName: 'Phạm Thanh Sơn', phone: '0904445556', email: 'yen.pham@student.lakeducation.com', tuitionStatus: 'PAID', amountDue: 3200000, attendanceRate: 98, pronunciationScore: 5, spellingScore: 4, seriousnessScore: 5, listeningScore: 5, latestTeacherNote: 'Super active during Zoom group debate activities.' },
  { id: 'HV005', name: 'Đặng Bảo Lâm', englishName: 'Leo Dang', age: 12, level: 'A2 Elementary', classId: 'LH10C3', className: '10C3 - Kids Communication & Spelling (Zoom)', teacherId: 'GV001', parentName: 'Đặng Tuấn Anh', phone: '0905556667', email: 'lam.dang@student.lakeducation.com', tuitionStatus: 'OVERDUE', amountDue: 2400000, attendanceRate: 85, pronunciationScore: 4, spellingScore: 3, seriousnessScore: 4, listeningScore: 4, latestTeacherNote: 'Good effort today, please review spelling unit 4 at home.' },
];

export const MOCK_ATTENDANCES = [
  {
    id: 'AT-001',
    date: '2026-08-25',
    classId: 'LH10A1',
    className: '10A1 - Advanced English Speaking',
    teacherId: 'GV001',
    teacherName: 'Mr. David Smith (USA 🇺🇸)',
    totalStudents: 35,
    presentCount: 34,
    absentCount: 1,
    pronunciationScore: 5,
    spellingScore: 5,
    seriousnessScore: 5,
    listeningScore: 4,
    teacherFeedback: 'Khoa and Anna demonstrated excellent pronunciation on consonant clusters today. Active participation during Zoom breakout session!',
    recordingUrl: 'https://drive.google.com/file/d/zoom-rec-10a1-aug25',
  },
  {
    id: 'AT-002',
    date: '2026-08-25',
    classId: 'LH11B2',
    className: '11B2 - IELTS Master 6.5+',
    teacherId: 'GV002',
    teacherName: 'Ms. Emma Watson (UK 🇬🇧)',
    totalStudents: 28,
    presentCount: 27,
    absentCount: 1,
    pronunciationScore: 4,
    spellingScore: 4,
    seriousnessScore: 5,
    listeningScore: 5,
    teacherFeedback: 'Great IELTS Speaking Part 2 practice. Students need to focus a bit more on stress and intonation.',
    recordingUrl: 'https://drive.google.com/file/d/zoom-rec-11b2-aug25',
  },
];

// Danh sách Bài tập về nhà (Homework / Assignments) cho Học viên & Giáo viên
export const MOCK_HOMEWORKS = [
  { id: 'HW-001', classId: 'LH10A1', className: '10A1 - Advanced English Speaking', studentId: 'HV001', studentName: 'Lê Anh Khoa', teacherId: 'GV001', title: 'Unit 5: Record a 2-minute video introducing your hometown', dueDate: '2026-08-30', status: 'SUBMITTED', score: '9.5/10', teacherComment: 'Clear intonation and confident speaking!' },
  { id: 'HW-002', classId: 'LH10A1', className: '10A1 - Advanced English Speaking', studentId: 'HV001', studentName: 'Lê Anh Khoa', teacherId: 'GV001', title: 'Unit 6: Phonetic Transcription & Consonant Clusters Worksheet', dueDate: '2026-09-05', status: 'ASSIGNED', score: null, teacherComment: 'Please submit before Friday Zoom session.' },
  { id: 'HW-003', classId: 'LH11B2', className: '11B2 - IELTS Master 6.5+', studentId: 'HV003', studentName: 'Trần Minh Quân', teacherId: 'GV002', title: 'IELTS Writing Task 2: Education & Technology Essay (250 words)', dueDate: '2026-09-02', status: 'ASSIGNED', score: null, teacherComment: 'Focus on cohesive devices.' },
];
