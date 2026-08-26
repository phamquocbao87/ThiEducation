export const INITIAL_STATS = {
  totalStudents: 520,
  totalTeachers: 68,
  totalClasses: 28,
  monthlyTuitionCollected: 1250000000,
  monthlyTuitionPending: 180000000,
  monthlyPayrollTotal: 485000000,
  averageAttendanceRate: 96.4,
};

export const MOCK_TEACHERS = [
  { id: 'GV001', name: 'Nguyễn Văn Hùng', subject: 'Toán Học', email: 'hung.nguyen@thiedu.edu.vn', phone: '0912345678', contractType: 'Toàn thời gian', ratePerSession: 350000, status: 'Hoạt động' },
  { id: 'GV002', name: 'Trần Thị Mai', subject: 'Tiếng Anh (IELTS)', email: 'mai.tran@thiedu.edu.vn', phone: '0987654321', contractType: 'Toàn thời gian', ratePerSession: 400000, status: 'Hoạt động' },
  { id: 'GV003', name: 'Lê Hoàng Nam', subject: 'Vật Lý', email: 'nam.le@thiedu.edu.vn', phone: '0933221100', contractType: 'Bán thời gian', ratePerSession: 300000, status: 'Hoạt động' },
  { id: 'GV004', name: 'Phạm Minh Thu', subject: 'Hóa Học', email: 'thu.pham@thiedu.edu.vn', phone: '0977889900', contractType: 'Thỉnh giảng', ratePerSession: 320000, status: 'Hoạt động' },
  { id: 'GV005', name: 'Hoàng Anh Tuấn', subject: 'Ngữ Văn', email: 'tuan.hoang@thiedu.edu.vn', phone: '0905556677', contractType: 'Toàn thời gian', ratePerSession: 350000, status: 'Hoạt động' },
  { id: 'GV006', name: 'Đỗ Thảo Nguyên', subject: 'Sinh Học', email: 'nguyen.do@thiedu.edu.vn', phone: '0944112233', contractType: 'Bán thời gian', ratePerSession: 280000, status: 'Hoạt động' },
  { id: 'GV007', name: 'Vũ Quốc Bảo', subject: 'Tin Học / Lập Trình', email: 'bao.vu@thiedu.edu.vn', phone: '0966334455', contractType: 'Toàn thời gian', ratePerSession: 450000, status: 'Hoạt động' },
];

export const MOCK_CONTRACTS = [
  { id: 'HD-2025-01', teacherId: 'GV001', teacherName: 'Nguyễn Văn Hùng', type: 'Toàn thời gian', ratePerSession: 350000, minSessionsPerMonth: 40, startDate: '2024-09-01', endDate: '2026-08-31', status: 'Hiệu lực' },
  { id: 'HD-2025-02', teacherId: 'GV002', teacherName: 'Trần Thị Mai', type: 'Toàn thời gian', ratePerSession: 400000, minSessionsPerMonth: 40, startDate: '2024-09-01', endDate: '2026-08-31', status: 'Hiệu lực' },
  { id: 'HD-2025-03', teacherId: 'GV003', teacherName: 'Lê Hoàng Nam', type: 'Bán thời gian', ratePerSession: 300000, minSessionsPerMonth: 20, startDate: '2025-01-15', endDate: '2026-01-14', status: 'Hiệu lực' },
  { id: 'HD-2025-04', teacherId: 'GV004', teacherName: 'Phạm Minh Thu', type: 'Thỉnh giảng', ratePerSession: 320000, minSessionsPerMonth: 12, startDate: '2025-02-01', endDate: '2025-12-31', status: 'Hiệu lực' },
  { id: 'HD-2025-05', teacherId: 'GV007', teacherName: 'Vũ Quốc Bảo', type: 'Toàn thời gian', ratePerSession: 450000, minSessionsPerMonth: 36, startDate: '2024-06-01', endDate: '2027-05-31', status: 'Hiệu lực' },
];

export const MOCK_PAYROLLS = [
  { id: 'PR-2026-08-01', teacherId: 'GV001', teacherName: 'Nguyễn Văn Hùng', month: '08/2026', totalSessions: 46, ratePerSession: 350000, bonus: 1500000, deduction: 0, totalSalary: 17600000, status: 'Đã duyệt' },
  { id: 'PR-2026-08-02', teacherId: 'GV002', teacherName: 'Trần Thị Mai', month: '08/2026', totalSessions: 44, ratePerSession: 400000, bonus: 2000000, deduction: 0, totalSalary: 19600000, status: 'Đã duyệt' },
  { id: 'PR-2026-08-03', teacherId: 'GV003', teacherName: 'Lê Hoàng Nam', month: '08/2026', totalSessions: 26, ratePerSession: 300000, bonus: 500000, deduction: 0, totalSalary: 8300000, status: 'Chờ duyệt' },
  { id: 'PR-2026-08-04', teacherId: 'GV004', teacherName: 'Phạm Minh Thu', month: '08/2026', totalSessions: 18, ratePerSession: 320000, bonus: 0, deduction: 200000, totalSalary: 5560000, status: 'Chờ duyệt' },
  { id: 'PR-2026-08-05', teacherId: 'GV007', teacherName: 'Vũ Quốc Bảo', month: '08/2026', totalSessions: 40, ratePerSession: 450000, bonus: 3000000, deduction: 0, totalSalary: 21000000, status: 'Đã duyệt' },
];

export const MOCK_CLASSES = [
  { id: 'LH10A1', name: 'Lớp 10A1 - Toán Chuyên', teacherId: 'GV001', teacherName: 'Nguyễn Văn Hùng', subject: 'Toán Học', room: 'P.301', totalStudents: 35, schedule: 'Thứ 2, 4, 6 (07:30 - 09:30)' },
  { id: 'LH11B2', name: 'Lớp 11B2 - English IELTS 6.5+', teacherId: 'GV002', teacherName: 'Trần Thị Mai', subject: 'Tiếng Anh', room: 'P.204', totalStudents: 28, schedule: 'Thứ 3, 5, 7 (14:00 - 16:00)' },
  { id: 'LH12A1', name: 'Lớp 12A1 - Ôn Thi Lý THPT', teacherId: 'GV003', teacherName: 'Lê Hoàng Nam', subject: 'Vật Lý', room: 'P.402', totalStudents: 42, schedule: 'Thứ 2, 5 (18:00 - 20:00)' },
  { id: 'LH10C3', name: 'Lớp 10C3 - Hóa Học Nâng Cao', teacherId: 'GV004', teacherName: 'Phạm Minh Thu', subject: 'Hóa Học', room: 'P.105', totalStudents: 30, schedule: 'Thứ 3, 6 (18:00 - 20:00)' },
  { id: 'LH12IT', name: 'Lớp 12IT - Lập Trình React & Web', teacherId: 'GV007', teacherName: 'Vũ Quốc Bảo', subject: 'Tin Học', room: 'Lab 01', totalStudents: 25, schedule: 'Thứ 7, CN (08:30 - 11:30)' },
];

export const MOCK_TIMETABLE = [
  { id: 'T01', day: 'Thứ 2', timeSlot: '07:30 - 09:30', className: '10A1 - Toán Chuyên', subject: 'Toán Học', teacherName: 'Nguyễn Văn Hùng', room: 'P.301', status: 'Đã hoàn thành' },
  { id: 'T02', day: 'Thứ 2', timeSlot: '14:00 - 16:00', className: '12A1 - Ôn Thi Lý', subject: 'Vật Lý', teacherName: 'Lê Hoàng Nam', room: 'P.402', status: 'Đã hoàn thành' },
  { id: 'T03', day: 'Thứ 3', timeSlot: '08:00 - 10:00', className: '11B2 - IELTS 6.5+', subject: 'Tiếng Anh', teacherName: 'Trần Thị Mai', room: 'P.204', status: 'Sắp diễn ra' },
  { id: 'T04', day: 'Thứ 3', timeSlot: '18:00 - 20:00', className: '10C3 - Hóa Nâng Cao', subject: 'Hóa Học', teacherName: 'Phạm Minh Thu', room: 'P.105', status: 'Sắp diễn ra' },
  { id: 'T05', day: 'Thứ 4', timeSlot: '07:30 - 09:30', className: '10A1 - Toán Chuyên', subject: 'Toán Học', teacherName: 'Nguyễn Văn Hùng', room: 'P.301', status: 'Lên kế hoạch' },
  { id: 'T06', day: 'Thứ 7', timeSlot: '08:30 - 11:30', className: '12IT - Lập Trình Web', subject: 'Tin Học', teacherName: 'Vũ Quốc Bảo', room: 'Lab 01', status: 'Lên kế hoạch' },
];

export const MOCK_STUDENTS = [
  { id: 'HV001', name: 'Lê Anh Khoa', classId: 'LH10A1', className: '10A1 - Toán Chuyên', parentName: 'Lê Minh Trí', phone: '0901112223', tuitionStatus: 'PAID', amountDue: 2500000, attendanceRate: 100 },
  { id: 'HV002', name: 'Nguyễn Thị Ngọc Ánh', classId: 'LH10A1', className: '10A1 - Toán Chuyên', parentName: 'Nguyễn Văn Bình', phone: '0902223334', tuitionStatus: 'PAID', amountDue: 2500000, attendanceRate: 96 },
  { id: 'HV003', name: 'Trần Minh Quân', classId: 'LH11B2', className: '11B2 - IELTS 6.5+', parentName: 'Trần Hương Giang', phone: '0903334445', tuitionStatus: 'UNPAID', amountDue: 3200000, attendanceRate: 92 },
  { id: 'HV004', name: 'Phạm Hoàng Yến', classId: 'LH11B2', className: '11B2 - IELTS 6.5+', parentName: 'Phạm Thanh Sơn', phone: '0904445556', tuitionStatus: 'PAID', amountDue: 3200000, attendanceRate: 98 },
  { id: 'HV005', name: 'Đặng Bảo Lâm', classId: 'LH12A1', className: '12A1 - Ôn Thi Lý', parentName: 'Đặng Tuấn Anh', phone: '0905556667', tuitionStatus: 'OVERDUE', amountDue: 2800000, attendanceRate: 85 },
  { id: 'HV006', name: 'Vũ Khánh Linh', classId: 'LH12IT', className: '12IT - Lập Trình Web', parentName: 'Vũ Đình Tiến', phone: '0906667778', tuitionStatus: 'PAID', amountDue: 3500000, attendanceRate: 100 },
];

export const MOCK_ATTENDANCES = [
  {
    id: 'AT-001',
    date: '2026-08-25',
    classId: 'LH10A1',
    className: '10A1 - Toán Chuyên',
    teacherName: 'Nguyễn Văn Hùng',
    totalStudents: 35,
    presentCount: 34,
    absentCount: 1,
    qualityRating: 5,
    teacherFeedback: 'Học viên hăng hái phát biểu, 95% hoàn thành bài tập về nhà xuất sắc.',
  },
  {
    id: 'AT-002',
    date: '2026-08-25',
    classId: 'LH11B2',
    className: '11B2 - IELTS 6.5+',
    teacherName: 'Trần Thị Mai',
    totalStudents: 28,
    presentCount: 27,
    absentCount: 1,
    qualityRating: 4,
    teacherFeedback: 'Kỹ năng Speaking IELTS phát triển tốt.',
  },
];
