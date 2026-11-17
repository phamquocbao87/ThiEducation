import assert from 'assert';
import { resolveErpTargetAfterLogin } from '../src/core/config/siteConfig.js';
import { PermissionService } from '../src/core/services/PermissionService.js';

console.log('==================================================================');
console.log('🧪 UNIT TEST: DEEP LINKING & INTENDED REDIRECT LOGIC');
console.log('==================================================================\n');

// 1. TEST resolveErpTargetAfterLogin
console.log('--- 1. Kiểm tra resolveErpTargetAfterLogin ---');

const teacherUser = { id: 'GV952', role: 'teacher', name: 'Teacher Maj' };
const studentUser = { id: 'HV768', role: 'student', name: 'Nguyen Phu Quy' };
const accountantUser = { id: 'ACC330', role: 'accountant', name: 'Le Thi My Dung' };

// 1.1: Có redirectPath cụ thể: /zoom-schedules
const res1 = resolveErpTargetAfterLogin(teacherUser, 'vi', '/zoom-schedules');
assert.strictEqual(res1.path, '/zoom-schedules', 'Path phải là /zoom-schedules');
console.log('  ✅ [PASS] Redirect đến /zoom-schedules chính xác:', res1.path);

// 1.2: Có redirectPath chứa Query Parameters: /classroom/LH004?tab=evaluation&sessionDateMs=123
const res2 = resolveErpTargetAfterLogin(teacherUser, 'en', '/classroom/LH004?tab=evaluation&sessionDateMs=123');
assert.strictEqual(res2.path, '/classroom/LH004?tab=evaluation&sessionDateMs=123', 'Path phải bảo toàn query string');
console.log('  ✅ [PASS] Redirect bảo toàn Query params chính xác:', res2.path);

// 1.3: redirectPath rỗng hoặc là / hoặc /login -> Fallback về defaultRoute
const res3 = resolveErpTargetAfterLogin(teacherUser, 'vi', '/');
assert.strictEqual(res3.path, '/dashboard', 'Fallback khi redirectPath="/" phải là /dashboard');
const res4 = resolveErpTargetAfterLogin(teacherUser, 'vi', '/login');
assert.strictEqual(res4.path, '/dashboard', 'Fallback khi redirectPath="/login" phải là /dashboard');
console.log('  ✅ [PASS] Fallback an toàn về defaultRoute khi path rỗng hoặc /');

// 2. TEST PermissionService.canAccessRoutePath CHO 3 SCENARIOS
console.log('\n--- 2. Kiểm tra RBAC Matrix (PermissionService.canAccessRoutePath) ---');

// Kịch bản 1: Đúng quyền vào /zoom-schedules
const checkTeacherZoom = PermissionService.canAccessRoutePath('teacher', '/zoom-schedules');
assert.strictEqual(checkTeacherZoom.allowed, true, 'Teacher phải có quyền vào /zoom-schedules');
const checkStudentZoom = PermissionService.canAccessRoutePath('student', '/zoom-schedules');
assert.strictEqual(checkStudentZoom.allowed, true, 'Student phải có quyền vào /zoom-schedules');
console.log('  ✅ [PASS] Kịch bản 1: Teacher & Student có quyền vào /zoom-schedules');

// Kịch bản 3A: Accountant không có quyền vào /zoom-schedules (Bị 403)
const checkAccountantZoom = PermissionService.canAccessRoutePath('accountant', '/zoom-schedules');
assert.strictEqual(checkAccountantZoom.allowed, false, 'Accountant không được vào /zoom-schedules');
assert.strictEqual(checkAccountantZoom.reason, 'MODULE_ACCESS_FORBIDDEN');
console.log('  ✅ [PASS] Kịch bản 3A: Accountant bị chặn 403 khi vào /zoom-schedules');

// Kịch bản 3B: Student không có quyền vào /contracts-payroll (Bị 403)
const checkStudentContracts = PermissionService.canAccessRoutePath('student', '/contracts-payroll');
assert.strictEqual(checkStudentContracts.allowed, false, 'Student không được vào /contracts-payroll');
assert.strictEqual(checkStudentContracts.reason, 'MODULE_ACCESS_FORBIDDEN');
console.log('  ✅ [PASS] Kịch bản 3B: Student bị chặn 403 khi vào /contracts-payroll');

// Kịch bản 3C: Teacher không có quyền vào /user-management (Bị 403)
const checkTeacherUsers = PermissionService.canAccessRoutePath('teacher', '/user-management');
assert.strictEqual(checkTeacherUsers.allowed, false, 'Teacher không được vào /user-management');
console.log('  ✅ [PASS] Kịch bản 3C: Teacher bị chặn 403 khi vào /user-management');

console.log('\n==================================================================');
console.log('🎉 TẤT CẢ UNIT TESTS ĐỀU ĐẠT CHUẨN 100% (PERFECT PASS)');
console.log('==================================================================');
