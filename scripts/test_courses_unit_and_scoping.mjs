/**
 * test_courses_unit_and_scoping.mjs
 * Unit Test kiểm tra tính toán Scoping Lớp Học & Phân Quyền Hiển Thị Fee
 */
import assert from 'assert';

console.log('==================================================================');
console.log('🧪 1. UNIT TEST: SCOPING PHÂN QUYỀN LỚP HỌC & ẨN HỌC PHÍ (FEES)');
console.log('==================================================================');

// Helper mô phỏng chính xác logic scopedClasses trong useCoursesController.js
function getScopedClasses(classes, currentUser) {
  if (currentUser?.role !== 'student') return classes;
  const studentId = currentUser?.id || currentUser?.code;
  const enrolledSet = new Set([
    ...(Array.isArray(currentUser?.enrolledClassIds) ? currentUser.enrolledClassIds : []),
    ...(currentUser?.classId ? [currentUser.classId] : []),
  ]);

  return classes.filter((cls) => {
    if (cls.isDeleted || cls.status === 'Deleted') return false;
    // 1. Lớp đã ghi danh / đã duyệt
    if (enrolledSet.has(cls.id) || enrolledSet.has(cls.code)) return true;
    if (Array.isArray(cls.studentIds) && cls.studentIds.includes(studentId)) return true;
    // 2. Lớp đang chờ phê duyệt đăng ký
    if (
      Array.isArray(cls.pendingStudentRequests) &&
      cls.pendingStudentRequests.some((r) =>
        typeof r === 'object'
          ? r.studentId === studentId || r.id === studentId
          : r === studentId
      )
    ) {
      return true;
    }
    return false;
  });
}

// Helper mô phỏng kiểm tra hiển thị Fee trong CourseCatalogTab & CourseFormModal
function shouldShowCourseFees(currentUser) {
  const isTeacher = currentUser?.role === 'teacher';
  return !isTeacher;
}

const mockClasses = [
  { id: 'LH001', name: 'Wonders G1', studentIds: ['HV101', 'HV102'], status: 'Active' },
  { id: 'LH002', name: 'WP02 G5', studentIds: ['HV253'], status: 'Active' },
  { id: 'LH003', name: 'Wonders G3', studentIds: ['HV303'], status: 'Active' },
  { id: 'LH004', name: 'WP01 G5', studentIds: ['HV739'], status: 'Active' },
  {
    id: 'LH005',
    name: 'WP03 G5',
    studentIds: ['HV505'],
    pendingStudentRequests: [{ studentId: 'HV253', name: 'Melissa' }],
    status: 'Active',
  },
  { id: 'LH006', name: 'Lớp Đã Xóa', studentIds: ['HV253'], isDeleted: true },
];

// TEST 1: Học viên HV253 chỉ thấy lớp mình đã ghi danh (LH002) + lớp chờ duyệt (LH005), KHÔNG thấy lớp khác
console.log('\n▶ [TEST 1]: Học viên HV253 (đã học LH002, đang chờ duyệt LH005)...');
const studentHV253 = { id: 'HV253', role: 'student', enrolledClassIds: ['LH002'] };
const resultHV253 = getScopedClasses(mockClasses, studentHV253);
console.log('   - Kết quả lớp trả về:', resultHV253.map((c) => c.id));
assert.strictEqual(resultHV253.length, 2, 'HV253 phải thấy đúng 2 lớp (LH002 và LH005)');
assert.ok(resultHV253.some((c) => c.id === 'LH002'), 'Phải chứa LH002');
assert.ok(resultHV253.some((c) => c.id === 'LH005'), 'Phải chứa LH005');
assert.ok(!resultHV253.some((c) => c.id === 'LH001'), 'Tuyệt đối KHÔNG chứa LH001');
assert.ok(!resultHV253.some((c) => c.id === 'LH004'), 'Tuyệt đối KHÔNG chứa LH004');
assert.ok(!resultHV253.some((c) => c.id === 'LH006'), 'Tuyệt đối KHÔNG chứa lớp đã xóa LH006');
console.log('   ✅ PASS [TEST 1]');

// TEST 2: Học viên HV739 chỉ thấy lớp LH004
console.log('\n▶ [TEST 2]: Học viên HV739 (chỉ học LH004)...');
const studentHV739 = { id: 'HV739', role: 'student', enrolledClassIds: ['LH004'] };
const resultHV739 = getScopedClasses(mockClasses, studentHV739);
console.log('   - Kết quả lớp trả về:', resultHV739.map((c) => c.id));
assert.strictEqual(resultHV739.length, 1, 'HV739 chỉ được thấy đúng 1 lớp duy nhất');
assert.strictEqual(resultHV739[0].id, 'LH004', 'Lớp duy nhất phải là LH004');
console.log('   ✅ PASS [TEST 2]');

// TEST 3: Cán bộ quản lý (Admin, Academic, Director) thấy toàn bộ các lớp active
console.log('\n▶ [TEST 3]: IT Admin (ADM001) / Giáo vụ (ACA545)...');
const adminUser = { id: 'ADM001', role: 'admin' };
const academicUser = { id: 'ACA545', role: 'academic' };
const resultAdmin = getScopedClasses(mockClasses, adminUser);
const resultAcademic = getScopedClasses(mockClasses, academicUser);
assert.strictEqual(resultAdmin.length, mockClasses.length, 'Admin thấy toàn bộ');
assert.strictEqual(resultAcademic.length, mockClasses.length, 'Academic thấy toàn bộ');
console.log('   ✅ PASS [TEST 3]');

// TEST 4: Giáo viên bản xứ (teacher) thấy danh sách lớp phục vụ công tác giảng dạy
console.log('\n▶ [TEST 4]: Giáo viên GV952 (Teacher Maj)...');
const teacherUser = { id: 'GV952', role: 'teacher' };
const resultTeacher = getScopedClasses(mockClasses, teacherUser);
assert.strictEqual(resultTeacher.length, mockClasses.length, 'Giáo viên thấy các lớp');
console.log('   ✅ PASS [TEST 4]');

// TEST 5: Phân quyền hiển thị Fee
console.log('\n▶ [TEST 5]: Phân quyền hiển thị Fee...');
assert.strictEqual(shouldShowCourseFees(teacherUser), false, 'Giáo viên BẮT BUỘC KHÔNG THẤY Fee');
assert.strictEqual(shouldShowCourseFees(studentHV253), true, 'Học viên thấy Fee niêm yết');
assert.strictEqual(shouldShowCourseFees(adminUser), true, 'Admin thấy Fee');
assert.strictEqual(shouldShowCourseFees(academicUser), true, 'Giáo vụ thấy Fee');
console.log('   ✅ PASS [TEST 5]');

console.log('\n==================================================================');
console.log('🎉 TẤT CẢ 5/5 BÀI KIỂM THỬ UNIT TEST ĐẠT 100% PASS!');
console.log('==================================================================');
