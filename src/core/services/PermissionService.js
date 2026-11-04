/**
 * Common RBAC Permission Service Class for all 6 Roles in ThiEducation ERP
 * Roles:
 * - admin: IT / System Administrator (Security, System Health, Config, Logs)
 * - director: Executive Director / CEO (Full Visibility, Staff KPI, Course Overview, Final Approvals)
 * - academic: Academic Coordinator / Giáo Vụ (Manage Teachers, Students, Courses, Schedules, Attendance, Tuition Reminders, Draft Payroll)
 * - teacher: Foreign Native Teacher (Check-in Class, Scoped Schedule/Classes, Student Profiles, Attendance & Per-Student Evaluation, Homework)
 * - accountant: Accountant / Kế Toán (Teacher Payroll, Academic Staff Payroll, Student Tuition Verification)
 * - student: Student / Học Viên (Personal Profile, Homework, Personal Evaluations, Enrolled Classes, Personal Tuition)
 */
export class PermissionService {
  static ROLES = {
    ADMIN: 'admin',
    DIRECTOR: 'director',
    ACADEMIC: 'academic',
    TEACHER: 'teacher',
    ACCOUNTANT: 'accountant',
    STUDENT: 'student',
  };

  static ROLE_METADATA = {
    admin: { color: 'red', label: 'IT Quản Trị Hệ Thống (System Admin)', shortLabel: 'IT ADMIN' },
    director: { color: 'purple', label: 'Giám Đốc Điều Hành (Director)', shortLabel: 'DIRECTOR' },
    academic: { color: 'cyan', label: 'Giáo Vụ Đào Tạo (Academic)', shortLabel: 'GIÁO VỤ' },
    teacher: { color: 'blue', label: 'Giáo Viên Bản Xứ (Native Teacher)', shortLabel: 'TEACHER' },
    accountant: { color: 'gold', label: 'Kế Toán Tài Chính (Accountant)', shortLabel: 'KẾ TOÁN' },
    student: { color: 'green', label: 'Học Viên (Student)', shortLabel: 'HỌC VIÊN' },
  };

  static canAccessModule(role, moduleKey) {
    const accessMatrix = {
      dashboard: ['admin', 'director', 'academic', 'teacher', 'accountant', 'student'],
      contracts: ['admin', 'director', 'academic', 'teacher', 'accountant'],
      schedules: ['admin', 'director', 'academic', 'teacher', 'student'],
      attendance: ['admin', 'director', 'academic', 'teacher', 'student'],
      tuition: ['director', 'academic', 'accountant', 'student'],
    };
    return (accessMatrix[moduleKey] || []).includes(role);
  }

  static canManageContracts(role) {
    return ['director', 'academic'].includes(role);
  }

  static canApprovePayroll(role) {
    return ['director', 'academic'].includes(role);
  }

  static canDisbursePayroll(role) {
    return ['accountant', 'director'].includes(role);
  }

  static canViewStaffPayroll(role) {
    return ['director', 'accountant', 'admin'].includes(role);
  }

  static canManageCoursesAndSchedules(role) {
    return ['academic', 'director'].includes(role);
  }

  static canCheckInClass(role) {
    return ['teacher', 'academic'].includes(role);
  }

  static canEvaluateStudents(role) {
    return ['teacher', 'academic'].includes(role);
  }

  static canConfirmTuitionPayment(role) {
    return ['accountant', 'academic', 'director'].includes(role);
  }

  static canSendTuitionReminder(role) {
    return ['academic', 'accountant', 'director'].includes(role);
  }
}

