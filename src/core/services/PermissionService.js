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
      courses: ['admin', 'director', 'academic', 'teacher', 'student'],
      curriculum: ['admin', 'director', 'academic', 'teacher', 'student'],
      schedules: ['admin', 'director', 'academic', 'teacher', 'student'],
      attendance: ['admin', 'director', 'academic', 'teacher', 'student'],
      contracts: ['admin', 'director', 'academic', 'teacher', 'accountant'],
      tuition: ['director', 'academic', 'accountant', 'student'],
      users: ['admin', 'director', 'academic'],
      profile: ['admin', 'director', 'academic', 'teacher', 'accountant', 'student'],
    };
    return (accessMatrix[moduleKey] || []).includes(role);
  }

  static canManageCourses(role) {
    return ['admin', 'director', 'academic'].includes(role);
  }

  static canManageUsers(role) {
    return ['admin', 'director', 'academic'].includes(role);
  }

  static canManageCurriculum(role) {
    return ['admin', 'director', 'academic'].includes(role);
  }

  /**
   * Quyền upload & cập nhật ảnh đại diện lên Google Drive:
   * - Admin, Giám đốc (Director) và Giáo vụ (Academic) có quyền cập nhật cho các tài khoản quản lý
   * - Bất kỳ người dùng nào thuộc 6 Roles đều được phép tự cập nhật / cắt lại ảnh đại diện của chính mình
   */
  static canUploadAvatar(actor, target = null) {
    const actorRole = typeof actor === 'object' ? actor?.role : actor;
    if ([this.ROLES.ADMIN, this.ROLES.DIRECTOR, this.ROLES.ACADEMIC].includes(actorRole)) {
      return true;
    }
    if (typeof actor === 'object' && target && typeof target === 'object') {
      if (actor.id && target.id && actor.id === target.id) return true;
      if (actor.email && target.email && actor.email.toLowerCase() === target.email.toLowerCase()) return true;
    }
    return false;
  }

  /**
   * Quyền chỉnh sửa các trường nghiệp vụ nhạy cảm (Đơn giá lương giờ, Trạng thái học phí, Cấp độ, Lớp học, KPI):
   * - Chỉ Admin, Giám đốc và Giáo vụ được chỉnh sửa
   * - Giáo viên / Học viên / Kế toán khi tự sửa Profile cá nhân (/my-profile/edit) sẽ thấy các trường này ở chế độ Read-Only
   */
  static canEditSensitiveFields(actorRole) {
    const role = typeof actorRole === 'object' ? actorRole?.role : actorRole;
    return [this.ROLES.ADMIN, this.ROLES.DIRECTOR, this.ROLES.ACADEMIC].includes(role);
  }

  /**
   * Danh sách các vai trò (roles) mà actorRole được phép tạo mới / đăng ký
   * - Admin: Toàn quyền tạo Giám đốc, Admin, Giáo vụ, Giáo viên, Kế toán, Học viên
   * - Giám đốc: Được tạo Giáo vụ, Giáo viên, Học viên
   * - Giáo vụ: Được tạo Giáo viên, Học viên
   */
  static getAllowedCreatableRoles(actorRole) {
    if (actorRole === this.ROLES.ADMIN) {
      return [
        this.ROLES.DIRECTOR,
        this.ROLES.ADMIN,
        this.ROLES.ACADEMIC,
        this.ROLES.TEACHER,
        this.ROLES.ACCOUNTANT,
        this.ROLES.STUDENT,
      ];
    }
    if (actorRole === this.ROLES.DIRECTOR) {
      return [
        this.ROLES.ACADEMIC,
        this.ROLES.TEACHER,
        this.ROLES.STUDENT,
      ];
    }
    if (actorRole === this.ROLES.ACADEMIC) {
      return [
        this.ROLES.TEACHER,
        this.ROLES.STUDENT,
      ];
    }
    return [];
  }

  /**
   * Kiểm tra quyền XÓA tài khoản người dùng:
   * - admin: Xoá được tất cả ngoại trừ tài khoản của mình (và Root Admin)
   * - director: Xoá được Giáo vụ (academic), Giáo viên (teacher), Học viên (student)
   * - academic: Xoá được Học viên (student)
   */
  static canDeleteUser(actor, target) {
    if (!actor || !target) return false;
    const actorRole = typeof actor === 'object' ? actor.role : actor;
    const targetRole = typeof target === 'object' ? target.role : target;

    // Không được xóa chính mình
    if (typeof actor === 'object' && typeof target === 'object') {
      if (actor.id && target.id && actor.id === target.id) return false;
      if (actor.email && target.email && actor.email.toLowerCase() === target.email.toLowerCase()) return false;
    }

    // Root Admin bất khả xâm phạm
    if (typeof target === 'object') {
      if (target.isRootAdmin || target.id === 'ADM001' || target.email === 'phamquocbao87@gmail.com') {
        return false;
      }
    }

    if (actorRole === this.ROLES.ADMIN) return true;
    if (actorRole === this.ROLES.DIRECTOR) {
      return [this.ROLES.ACADEMIC, this.ROLES.TEACHER, this.ROLES.STUDENT].includes(targetRole);
    }
    if (actorRole === this.ROLES.ACADEMIC) {
      return targetRole === this.ROLES.STUDENT;
    }
    return false;
  }

  /**
   * Kiểm tra quyền KÍCH HOẠT / KHÓA (Toggle Status) tài khoản:
   * - admin: Kích hoạt/khóa tất cả ngoại trừ tài khoản của mình (và Root Admin)
   * - director: Kích hoạt/khóa Giáo vụ (academic), Giáo viên (teacher), Học viên (student)
   * - academic: Kích hoạt/khóa Giáo viên (teacher), Học viên (student)
   */
  static canChangeUserStatus(actor, target) {
    if (!actor || !target) return false;
    const actorRole = typeof actor === 'object' ? actor.role : actor;
    const targetRole = typeof target === 'object' ? target.role : target;

    // Không được tự khóa/vô hiệu hóa chính mình
    if (typeof actor === 'object' && typeof target === 'object') {
      if (actor.id && target.id && actor.id === target.id) return false;
      if (actor.email && target.email && actor.email.toLowerCase() === target.email.toLowerCase()) return false;
    }

    // Root Admin bất khả xâm phạm
    if (typeof target === 'object') {
      if (target.isRootAdmin || target.id === 'ADM001' || target.email === 'phamquocbao87@gmail.com') {
        return false;
      }
    }

    if (actorRole === this.ROLES.ADMIN) return true;
    if (actorRole === this.ROLES.DIRECTOR) {
      return [this.ROLES.ACADEMIC, this.ROLES.TEACHER, this.ROLES.STUDENT].includes(targetRole);
    }
    if (actorRole === this.ROLES.ACADEMIC) {
      return [this.ROLES.TEACHER, this.ROLES.STUDENT].includes(targetRole);
    }
    return false;
  }

  /**
   * Kiểm tra quyền CHỈNH SỬA thông tin hồ sơ (Edit Profile):
   * - Người dùng luôn có quyền xem/sửa hồ sơ của chính mình
   * - admin: Sửa được tất cả
   * - director: Sửa được Giáo vụ (academic), Giáo viên (teacher), Học viên (student)
   * - academic: Sửa được Giáo viên (teacher), Học viên (student)
   */
  static canEditUser(actor, target) {
    if (!actor || !target) return false;
    const actorRole = typeof actor === 'object' ? actor.role : actor;
    const targetRole = typeof target === 'object' ? target.role : target;

    // Được sửa chính mình
    if (typeof actor === 'object' && typeof target === 'object') {
      if (actor.id && target.id && actor.id === target.id) return true;
      if (actor.email && target.email && actor.email.toLowerCase() === target.email.toLowerCase()) return true;
    }

    if (actorRole === this.ROLES.ADMIN) return true;
    if (actorRole === this.ROLES.DIRECTOR) {
      return [this.ROLES.ACADEMIC, this.ROLES.TEACHER, this.ROLES.STUDENT].includes(targetRole);
    }
    if (actorRole === this.ROLES.ACADEMIC) {
      return [this.ROLES.TEACHER, this.ROLES.STUDENT].includes(targetRole);
    }
    return false;
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

