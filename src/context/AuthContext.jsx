import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const MOCK_USERS = {
  admin: {
    id: 'ADM001',
    name: 'Phạm Quốc Bảo',
    role: 'admin',
    roleLabel: 'Quản trị viên (Super Admin)',
    email: 'bao.pham@thiedu.edu.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bao',
  },
  teacher: {
    id: 'GV001',
    name: 'Nguyễn Văn Hùng',
    role: 'teacher',
    roleLabel: 'Giáo viên Toán Học',
    email: 'hung.nguyen@thiedu.edu.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hung',
  },
  student: {
    id: 'HV001',
    name: 'Lê Anh Khoa',
    role: 'student',
    roleLabel: 'Học viên (Lớp 10A1)',
    email: 'khoa.le@student.thiedu.edu.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khoa',
  },
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(MOCK_USERS.admin);

  const switchRole = (roleKey) => {
    if (MOCK_USERS[roleKey]) {
      setCurrentUser(MOCK_USERS[roleKey]);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
