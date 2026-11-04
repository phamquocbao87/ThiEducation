import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  MOCK_TEACHERS,
  MOCK_STUDENTS,
  MOCK_ACADEMIC_STAFF,
} from '../../shared/data/mockData';

const AuthContext = createContext();

// Danh sách tài khoản lõi đại diện 6 Roles
export const CORE_ROLE_USERS = {
  admin: {
    id: 'ADM001',
    name: 'Phạm Quốc Bảo',
    role: 'admin',
    roleLabel: 'IT Quản Trị Hệ Thống (System Admin)',
    email: 'it.security@lakeducation.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BaoIT',
  },
  director: {
    id: 'DIR001',
    name: 'Nguyễn Minh Tuấn',
    role: 'director',
    roleLabel: 'Giám Đốc Điều Hành (Executive Director)',
    email: 'director@lakeducation.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuanCEO',
  },
  academic: {
    id: 'ACA001',
    name: 'Trần Thu Hà',
    role: 'academic',
    roleLabel: 'Trưởng Bộ Phận Giáo Vụ (Academic Coordinator)',
    email: 'academic@lakeducation.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThuHa',
  },
  teacher: {
    id: 'GV001',
    name: 'Mr. David Smith',
    role: 'teacher',
    roleLabel: 'Native English Teacher (USA 🇺🇸)',
    email: 'david.smith@lakeducation.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidSmith',
  },
  accountant: {
    id: 'ACC001',
    name: 'Lê Hoàng Mai',
    role: 'accountant',
    roleLabel: 'Kế Toán Trưởng (Chief Accountant)',
    email: 'accounting@lakeducation.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HoangMai',
  },
  student: {
    id: 'HV001',
    name: 'Lê Anh Khoa',
    role: 'student',
    roleLabel: 'Học Viên (Lớp 10A1 - Advanced Speaking)',
    classId: 'LH10A1',
    classCode: '10A1',
    email: 'khoa.le@student.lakeducation.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnhKhoa',
  },
};

/**
 * Xây dựng danh bạ toàn bộ User trong hệ thống để duy nhất Role `admin` (IT Admin)
 * có thể tìm kiếm và chuyển sang xem màn hình của BẤT KỲ tài khoản nào (Impersonation / View-As).
 */
export const buildAllSystemUsersDirectory = () => {
  const teacherAccounts = MOCK_TEACHERS.map((t) => ({
    id: t.id,
    name: t.name,
    role: 'teacher',
    roleLabel: `Giáo Viên Bản Xứ (${t.nationality} - ${t.subject})`,
    email: t.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.id)}`,
  }));

  const studentAccounts = MOCK_STUDENTS.map((s) => ({
    id: s.id,
    name: s.name,
    role: 'student',
    roleLabel: `Học Viên (${s.className})`,
    classId: s.classId,
    classCode: s.classId.replace('LH', ''),
    email: s.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.id)}`,
  }));

  const academicAccounts = MOCK_ACADEMIC_STAFF.map((a) => ({
    id: a.id,
    name: a.name,
    role: 'academic',
    roleLabel: `${a.position} (Giáo Vụ)`,
    email: `${a.id.toLowerCase()}@lakeducation.com`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(a.id)}`,
  }));

  return [
    CORE_ROLE_USERS.admin,
    CORE_ROLE_USERS.director,
    CORE_ROLE_USERS.accountant,
    ...academicAccounts,
    ...teacherAccounts,
    ...studentAccounts,
  ];
};

export const AuthProvider = ({ children }) => {
  // Tài khoản gốc đăng nhập thực tế (Real Logged-in Session)
  const [authenticatedUser] = useState(CORE_ROLE_USERS.admin);

  // Tài khoản đang được IT Admin giả lập để kiểm tra màn hình (Impersonated Target User)
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  const allSystemUsers = useMemo(() => buildAllSystemUsersDirectory(), []);

  // Chỉ duy nhất tài khoản gốc có role === 'admin' mới có quyền chuyển sang xem tài khoản khác
  const canImpersonateUsers = authenticatedUser.role === 'admin';

  // User hiệu lực đang hiển thị trên toàn bộ màn hình ứng dụng
  const currentUser = impersonatedUser || authenticatedUser;
  const isImpersonating = Boolean(impersonatedUser && impersonatedUser.id !== authenticatedUser.id);

  /**
   * Chuyển sang bất kỳ tài khoản nào theo userId hoặc theo mã role (Chỉ cho phép khi authenticatedUser là admin)
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

    if (CORE_ROLE_USERS[targetIdOrRole]) {
      setImpersonatedUser(CORE_ROLE_USERS[targetIdOrRole]);
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
        MOCK_USERS: CORE_ROLE_USERS,
        switchRole: impersonateAccount,
        impersonateAccount,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
