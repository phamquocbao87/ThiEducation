import React from 'react';
import { useParams } from 'react-router-dom';
import { UsersPage } from './UsersPage';
import { UserDetailPage } from './UserDetailPage';
import { UserRegistrationPage } from './UserRegistrationPage';

/**
 * Public Entry Point for Users & RBAC Module — LAK EDUCATION (lakeducation.com)
 * - Nếu URL có :userId === 'new' hoặc 'create' -> Hiển thị trang UserRegistrationPage đăng ký mới
 * - Nếu URL có :userId cụ thể (ví dụ /user-management/HV001) -> Hiển thị trang UserDetailPage chi tiết
 * - Mặc định -> Hiển thị trang UsersPage tổng quan (Bảng Desktop / Thẻ Card Mobile)
 */
export default function UsersModule({ isSelfProfile = false }) {
  const { userId } = useParams();
  if (isSelfProfile) {
    return <UserDetailPage isSelfProfile={true} />;
  }
  if (userId === 'new' || userId === 'create' || userId === 'register') {
    return <UserRegistrationPage />;
  }
  if (userId) {
    return <UserDetailPage />;
  }
  return <UsersPage />;
}
