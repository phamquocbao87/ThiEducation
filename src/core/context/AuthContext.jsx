import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  MOCK_TEACHERS,
  MOCK_ACADEMIC_STAFF,
  MOCK_STUDENTS,
} from '../../shared/data/mockData';
import { ROLE_DEFAULT_ERP_ROUTE } from '../config/siteConfig';

const AuthContext = createContext();

export const STORAGE_AUTH_USER_KEY = 'lak_authenticated_user_id';

// Danh sách tài khoản lõi đại diện 6 Roles
export const CORE_ROLE_USERS = {
  admin: {
    id: 'ADM001',
    name: 'Phạm Quốc Bảo',
    role: 'admin',
    roleLabel: 'IT Quản Trị Hệ Thống (System Admin)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BaoAdmin',
    email: 'admin@lakeducation.com',
  },
  director: {
    id: 'DIR001',
    name: 'Nguyễn Minh Tuấn',
    role: 'director',
    roleLabel: 'Giám Đốc Điều Hành (Director)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuanDirector',
    email: 'director@lakeducation.com',
  },
  academic: {
    id: 'ACA001',
    name: 'Trần Thu Hà',
    role: 'academic',
    roleLabel: 'Giáo Vụ Đào Tạo (Academic)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HaAcademic',
    email: 'academic@lakeducation.com',
  },
  teacher: {
    id: 'GV001',
    name: 'Mr. David Smith',
    role: 'teacher',
    roleLabel: 'Giáo Viên Bản Xứ (Native Teacher)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidTeacher',
    email: 'david.smith@lakeducation.com',
  },
  accountant: {
    id: 'ACC001',
    name: 'Lê Hoàng Mai',
    role: 'accountant',
    roleLabel: 'Kế Toán Tài Chính (Accountant)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MaiAccountant',
    email: 'accounting@lakeducation.com',
  },
  student: {
    id: 'HV001',
    name: 'Lê Anh Khoa',
    role: 'student',
    roleLabel: 'Học Viên (Student)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KhoaStudent',
    email: 'anhkhoa.student@lakeducation.com',
  },
};

/**
 * Xây dựng danh bạ TẤT CẢ tài khoản có trong hệ thống (16 tài khoản thuộc 6 Roles)
 */
export const buildAllSystemUsersDirectory = () => {
  const teacherAccounts = MOCK_TEACHERS.map((t) => ({
    id: t.id,
    name: t.name,
    role: 'teacher',
    roleLabel: `Giáo Viên Bản Xứ (${t.nationality} — ${t.certificate})`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.id)}`,
    email: `${t.id.toLowerCase()}@lakeducation.com`,
    extraInfo: `Đơn giá: ${(t.hourlyRate / 1000).toFixed(0)}k/tiết | Rating: ⭐ ${t.rating}`,
  }));

  const academicAccounts = MOCK_ACADEMIC_STAFF.map((s) => ({
    id: s.id,
    name: s.name,
    role: 'academic',
    roleLabel: s.position,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.id)}`,
    email: `${s.id.toLowerCase()}@lakeducation.com`,
    extraInfo: `Quản lý ${s.managedClasses} lớp (${s.managedStudents} HV) | KPI: ${s.completedTasks}%`,
  }));

  const studentAccounts = MOCK_STUDENTS.map((st) => ({
    id: st.id,
    name: st.name,
    role: 'student',
    roleLabel: `Học Viên — ${st.className}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(st.id)}`,
    email: `${st.id.toLowerCase()}.student@lakeducation.com`,
    extraInfo: `Level: ${st.level} | Chuyên cần: ${st.attendanceRate}% | Phụ huynh: ${st.parentName}`,
  }));

  return [
    {
      ...CORE_ROLE_USERS.admin,
      extraInfo: 'Toàn quyền cấu hình hạ tầng, Backup Google Drive & Giả lập xem mọi tài khoản',
    },
    {
      ...CORE_ROLE_USERS.director,
      extraInfo: 'Điều hành toàn trung tâm (520 Học viên & 68 Cán bộ/Giáo viên)',
    },
    {
      ...CORE_ROLE_USERS.accountant,
      extraInfo: 'Kiểm soát & đối soát chi lương GV/Giáo vụ và thu học phí toàn hệ thống',
    },
    ...academicAccounts,
    ...teacherAccounts,
    ...studentAccounts,
  ];
};

export const AuthProvider = ({ children }) => {
  const allSystemUsers = useMemo(() => buildAllSystemUsersDirectory(), []);

  // Tìm tài khoản đăng nhập khởi tạo từ URL (?sso_uid=...) hoặc localStorage
  const resolveInitialAuthenticatedUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ssoUid = params.get('sso_uid');
      if (ssoUid) {
        const matchedSso = allSystemUsers.find(
          (u) => u.id.toUpperCase() === ssoUid.toUpperCase()
        );
        if (matchedSso) {
          localStorage.setItem(STORAGE_AUTH_USER_KEY, matchedSso.id);
          return matchedSso;
        }
      }

      const savedId = localStorage.getItem(STORAGE_AUTH_USER_KEY);
      if (savedId) {
        const matchedSaved = allSystemUsers.find(
          (u) => u.id.toUpperCase() === savedId.toUpperCase()
        );
        if (matchedSaved) return matchedSaved;
      }
    }
    return allSystemUsers[0]; // Mặc định ADM001 khi chưa chọn tài khoản khác
  }, [allSystemUsers]);

  // 1. authenticatedUser: Tài khoản thực sự vừa Login vào hệ thống
  const [authenticatedUser, setAuthenticatedUser] = useState(resolveInitialAuthenticatedUser);

  // 2. impersonatedUser: Tài khoản đang được IT Admin giả lập xem hộ (nếu authenticatedUser là admin)
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  // Làm sạch ?sso_uid trên thanh địa chỉ sau khi đã nhận phiên đăng nhập liên thông từ Landing Page
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('sso_uid=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('sso_uid');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);

  // currentUser là tài khoản quyết định giao diện & dữ liệu của mọi màn hình hiện tại
  const currentUser = impersonatedUser || authenticatedUser;
  const isImpersonating = Boolean(impersonatedUser && impersonatedUser.id !== authenticatedUser.id);

  // QUY TẮC BẢO MẬT: Chỉ duy nhất tài khoản gốc là IT Admin (role === 'admin') mới có quyền giả lập xem tài khoản khác
  const canImpersonateUsers = authenticatedUser.role === 'admin';

  /**
   * Đăng nhập thực tế từ Form Login trên Landing Page hoặc trang /login
   * -> Xác định đúng User & Role -> Thiết lập phiên đăng nhập gốc (authenticatedUser)
   */
  const loginWithAccount = useCallback(
    (accountIdentifier) => {
      const normalized = String(accountIdentifier || '').trim().toLowerCase();

      // Hỗ trợ email Google chủ quản của Sếp Bảo -> vào thẳng tài khoản IT Admin (ADM001)
      if (
        !normalized ||
        normalized === 'vnthietbigarage@gmail.com' ||
        normalized === 'phamquocbao87@gmail.com' ||
        normalized === 'google'
      ) {
        const adminUser = allSystemUsers[0];
        setAuthenticatedUser(adminUser);
        setImpersonatedUser(null);
        localStorage.setItem(STORAGE_AUTH_USER_KEY, adminUser.id);
        return {
          success: true,
          user: adminUser,
          role: adminUser.role,
          defaultRoute: ROLE_DEFAULT_ERP_ROUTE[adminUser.role] || 'dashboard',
        };
      }

      const targetUser =
        allSystemUsers.find(
          (u) =>
            u.id.toLowerCase() === normalized ||
            u.email.toLowerCase() === normalized ||
            u.role.toLowerCase() === normalized ||
            u.email.split('@')[0].toLowerCase() === normalized
        ) || allSystemUsers[0];

      setAuthenticatedUser(targetUser);
      setImpersonatedUser(null);
      localStorage.setItem(STORAGE_AUTH_USER_KEY, targetUser.id);

      const defaultRoute = ROLE_DEFAULT_ERP_ROUTE[targetUser.role] || 'dashboard';
      return {
        success: true,
        user: targetUser,
        role: targetUser.role,
        defaultRoute,
      };
    },
    [allSystemUsers]
  );

  /**
   * Đăng xuất khỏi phiên làm việc hiện tại
   */
  const logoutAccount = useCallback(() => {
    setImpersonatedUser(null);
  }, []);

  /**
   * Chuyển sang xem màn hình của bất kỳ tài khoản nào (Chỉ dành cho IT Admin)
   */
  const impersonateAccount = (targetIdOrRole) => {
    if (!canImpersonateUsers) return;

    if (targetIdOrRole === 'admin' || targetIdOrRole === authenticatedUser.id) {
      setImpersonatedUser(null);
      return;
    }

    const byId = allSystemUsers.find((u) => u.id === targetIdOrRole);
    if (byId) {
      setImpersonatedUser(byId);
      return;
    }

    const byRole = allSystemUsers.find((u) => u.role === targetIdOrRole);
    if (byRole) {
      setImpersonatedUser(byRole);
    }
  };

  const exitImpersonation = () => {
    setImpersonatedUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authenticatedUser,
        currentUser,
        isImpersonating,
        canImpersonateUsers,
        allSystemUsers,
        loginWithAccount,
        logoutAccount,
        impersonateAccount,
        exitImpersonation,
        switchRole: impersonateAccount,
        availableRoles: Object.keys(CORE_ROLE_USERS),
        roleUsers: CORE_ROLE_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
