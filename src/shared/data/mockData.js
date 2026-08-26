export const INITIAL_STATS = {
  totalStudents: 520,
  totalTeachers: 68, // 100% Foreign/Native English Teachers & Academic Staff
  totalClasses: 28,
  monthlyTuitionCollected: 1250000000,
  monthlyTuitionPending: 180000000,
  monthlyPayrollTotal: 485000000,
  averageAttendanceRate: 96.4,
};

// 100% Foreign Teachers
export const MOCK_TEACHERS = [
  { id: 'GV001', name: 'Mr. David Smith', nationality: 'USA 🇺🇸', subject: 'Native English Speaking', email: 'david.smith@thiedu.edu.vn', phone: '+1 202 555 0143', contractType: 'Full-time Native', ratePerSession: 450000, status: 'Active' },
  { id: 'GV002', name: 'Ms. Emma Watson', nationality: 'UK 🇬🇧', subject: 'IELTS Speaking & Writing', email: 'emma.watson@thiedu.edu.vn', phone: '+44 20 7946 0991', contractType: 'Full-time Native', ratePerSession: 500000, status: 'Active' },
  { id: 'GV003', name: 'Mr. Michael Jordan', nationality: 'Canada 🇨🇦', subject: 'Grammar & Phonics', email: 'michael.jordan@thiedu.edu.vn', phone: '+1 416 555 0188', contractType: 'Part-time Native', ratePerSession: 400000, status: 'Active' },
  { id: 'GV004', name: 'Ms. Sarah Jenkins', nationality: 'Australia 🇦🇺', subject: 'Kids Communication & Spelling', email: 'sarah.jenkins@thiedu.edu.vn', phone: '+61 2 9374 4000', contractType: 'Visiting Native', ratePerSession: 420000, status: 'Active' },
  { id: 'GV007', name: 'Mr. Alex Ferguson', nationality: 'UK 🇬🇧', subject: 'Advanced Business English', email: 'alex.ferguson@thiedu.edu.vn', phone: '+44 161 834 5000', contractType: 'Full-time Native', ratePerSession: 550000, status: 'Active' },
];

export const MOCK_CONTRACTS = [
  { id: 'HD-2025-01', teacherId: 'GV001', teacherName: 'Mr. David Smith', type: 'Full-time Native', ratePerSession: 450000, minSessionsPerMonth: 40, startDate: '2024-09-01', endDate: '2026-08-31', status: 'Active' },
  { id: 'HD-2025-02', teacherId: 'GV002', teacherName: 'Ms. Emma Watson', type: 'Full-time Native', ratePerSession: 500000, minSessionsPerMonth: 40, startDate: '2024-09-01', endDate: '2026-08-31', status: 'Active' },
  { id: 'HD-2025-03', teacherId: 'GV003', teacherName: 'Mr. Michael Jordan', type: 'Part-time Native', ratePerSession: 400000, minSessionsPerMonth: 20, startDate: '2025-01-15', endDate: '2026-01-14', status: 'Active' },
  { id: 'HD-2025-05', teacherId: 'GV007', teacherName: 'Mr. Alex Ferguson', type: 'Full-time Native', ratePerSession: 550000, minSessionsPerMonth: 36, startDate: '2024-06-01', endDate: '2027-05-31', status: 'Active' },
];

export const MOCK_PAYROLLS = [
  { id: 'PR-2026-08-01', teacherId: 'GV001', teacherName: 'Mr. David Smith', month: '08/2026', totalSessions: 46, ratePerSession: 450000, bonus: 2000000, deduction: 0, totalSalary: 22700000, status: 'Approved' },
  { id: 'PR-2026-08-02', teacherId: 'GV002', teacherName: 'Ms. Emma Watson', month: '08/2026', totalSessions: 44, ratePerSession: 500000, bonus: 2500000, deduction: 0, totalSalary: 24500000, status: 'Approved' },
  { id: 'PR-2026-08-03', teacherId: 'GV003', teacherName: 'Mr. Michael Jordan', month: '08/2026', totalSessions: 26, ratePerSession: 400000, bonus: 1000000, deduction: 0, totalSalary: 11400000, status: 'Pending' },
  { id: 'PR-2026-08-05', teacherId: 'GV007', teacherName: 'Mr. Alex Ferguson', month: '08/2026', totalSessions: 40, ratePerSession: 550000, bonus: 3000000, deduction: 0, totalSalary: 25000000, status: 'Approved' },
];

export const MOCK_CLASSES = [
  { id: 'LH10A1', name: 'Class 10A1 - Advanced English Speaking (Zoom)', teacherId: 'GV001', teacherName: 'Mr. David Smith (USA 🇺🇸)', subject: 'English Communication', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/888999111', meetingId: '888 999 111', passcode: '123456', totalStudents: 35, schedule: 'Mon, Wed, Fri (07:30 - 09:30)', recordingUrl: 'https://drive.google.com/drive/folders/zoom-10a1' },
  { id: 'LH11B2', name: 'Class 11B2 - IELTS Master 6.5+ (Zoom)', teacherId: 'GV002', teacherName: 'Ms. Emma Watson (UK 🇬🇧)', subject: 'IELTS Intensive', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/999888777', meetingId: '999 888 777', passcode: '654321', totalStudents: 28, schedule: 'Tue, Thu, Sat (14:00 - 16:00)', recordingUrl: 'https://drive.google.com/drive/folders/zoom-11b2' },
  { id: 'LH12A1', name: 'Class 12A1 - Phonics & Pronunciation (Zoom)', teacherId: 'GV003', teacherName: 'Mr. Michael Jordan (Canada 🇨🇦)', subject: 'Phonics & Pronunciation', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/777666555', meetingId: '777 666 555', passcode: '112233', totalStudents: 42, schedule: 'Mon, Thu (18:00 - 20:00)', recordingUrl: 'https://drive.google.com/drive/folders/zoom-12a1' },
  { id: 'LH10C3', name: 'Class 10C3 - Kids Communication & Spelling (Zoom)', teacherId: 'GV004', teacherName: 'Ms. Sarah Jenkins (Australia 🇦🇺)', subject: 'Spelling & Vocabulary', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/555444333', meetingId: '555 444 333', passcode: '445566', totalStudents: 30, schedule: 'Tue, Fri (18:00 - 20:00)', recordingUrl: 'https://drive.google.com/drive/folders/zoom-10c3' },
];

export const MOCK_TIMETABLE = [
  { id: 'T01', day: 'Monday', timeSlot: '07:30 - 09:30', className: '10A1 - Advanced English Speaking', subject: 'English Communication', teacherName: 'Mr. David Smith', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/888999111', status: 'Completed' },
  { id: 'T02', day: 'Monday', timeSlot: '14:00 - 16:00', className: '12A1 - Phonics & Pronunciation', subject: 'Phonics & Pronunciation', teacherName: 'Mr. Michael Jordan', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/777666555', status: 'Completed' },
  { id: 'T03', day: 'Tuesday', timeSlot: '08:00 - 10:00', className: '11B2 - IELTS Master 6.5+', subject: 'IELTS Intensive', teacherName: 'Ms. Emma Watson', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/999888777', status: 'Upcoming' },
  { id: 'T04', day: 'Tuesday', timeSlot: '18:00 - 20:00', className: '10C3 - Kids Communication & Spelling', subject: 'Spelling & Vocabulary', teacherName: 'Ms. Sarah Jenkins', platform: 'Zoom Meeting', meetingLink: 'https://zoom.us/j/555444333', status: 'Upcoming' },
];

export const MOCK_STUDENTS = [
  { id: 'HV001', name: 'Lê Anh Khoa', classId: 'LH10A1', className: '10A1 - Advanced English Speaking (Zoom)', parentName: 'Lê Minh Trí', phone: '0901112223', tuitionStatus: 'PAID', amountDue: 2500000, attendanceRate: 100 },
  { id: 'HV002', name: 'Nguyễn Thị Ngọc Ánh', classId: 'LH10A1', className: '10A1 - Advanced English Speaking (Zoom)', parentName: 'Nguyễn Văn Bình', phone: '0902223334', tuitionStatus: 'PAID', amountDue: 2500000, attendanceRate: 96 },
  { id: 'HV003', name: 'Trần Minh Quân', classId: 'LH11B2', className: '11B2 - IELTS Master 6.5+ (Zoom)', parentName: 'Trần Hương Giang', phone: '0903334445', tuitionStatus: 'UNPAID', amountDue: 3200000, attendanceRate: 92 },
  { id: 'HV004', name: 'Phạm Hoàng Yến', classId: 'LH11B2', className: '11B2 - IELTS Master 6.5+ (Zoom)', parentName: 'Phạm Thanh Sơn', phone: '0904445556', tuitionStatus: 'PAID', amountDue: 3200000, attendanceRate: 98 },
  { id: 'HV005', name: 'Đặng Bảo Lâm', classId: 'LH12A1', className: '12A1 - Phonics & Pronunciation (Zoom)', parentName: 'Đặng Tuấn Anh', phone: '0905556667', tuitionStatus: 'OVERDUE', amountDue: 2800000, attendanceRate: 85 },
];

export const MOCK_ATTENDANCES = [
  {
    id: 'AT-001',
    date: '2026-08-25',
    classId: 'LH10A1',
    className: '10A1 - Advanced English Speaking',
    teacherName: 'Mr. David Smith (USA 🇺🇸)',
    totalStudents: 35,
    presentCount: 34,
    absentCount: 1,
    pronunciationScore: 5,
    spellingScore: 5,
    seriousnessScore: 5,
    listeningScore: 4,
    teacherFeedback: 'Khoa demonstrated excellent pronunciation on consonant clusters today. Active participation during Zoom breakout session!',
    recordingUrl: 'https://drive.google.com/file/d/zoom-rec-10a1-aug25',
  },
  {
    id: 'AT-002',
    date: '2026-08-25',
    classId: 'LH11B2',
    className: '11B2 - IELTS Master 6.5+',
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
