import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { UserService } from '../services/UserService';
import { UserAuditService } from '../services/UserAuditService';
import { USER_STATUS } from '../models/user.model';

export const useUsers = () => {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Tải danh sách Users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      message.error(`Lỗi tải danh sách người dùng: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Tải danh sách Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const logs = await UserAuditService.getAuditLogs(100);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Lỗi tải nhật ký kiểm toán:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const openAuditDrawer = () => {
    setIsAuditDrawerOpen(true);
    loadAuditLogs();
  };

  // Tạo tài khoản mới
  const handleCreateUser = async (formData) => {
    try {
      const created = await UserService.createUser(currentUser, formData);
      message.success(`Đã tạo thành công tài khoản: ${created.name} (${created.code})`);
      setUsers((prev) => [created, ...prev]);
      setIsFormModalOpen(false);
      return true;
    } catch (err) {
      message.error(err.message || 'Không thể tạo tài khoản');
      return false;
    }
  };

  // Mở & Đóng Modal Sửa Hồ Sơ
  const openEditModal = (user) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedUserForEdit(null);
    setIsEditModalOpen(false);
  };

  // Cập nhật thông tin hồ sơ người dùng
  const handleUpdateUser = async (targetUser, updateData) => {
    try {
      const updated = await UserService.updateUserProfile(currentUser, targetUser, updateData);
      message.success(`Đã cập nhật thành công hồ sơ của ${updated.name}`);
      setUsers((prev) =>
        prev.map((u) => ((u.id === targetUser.id || u.code === targetUser.code) ? updated : u))
      );
      closeEditModal();
      return true;
    } catch (err) {
      message.error(err.message || 'Lỗi cập nhật hồ sơ người dùng');
      return false;
    }
  };

  // Mở & Đóng Modal Xác Nhận Xóa
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setIsDeleteModalOpen(false);
  };

  // Xác nhận Xóa Mềm (Soft-delete) tài khoản người dùng kèm lý do
  const handleConfirmDeleteUser = async (targetUser, deleteReason) => {
    setDeleteLoading(true);
    try {
      await UserService.deleteUser(currentUser, targetUser, deleteReason);
      message.success(`Đã xóa tài khoản: ${targetUser.name} (${targetUser.code || targetUser.id})`);
      setUsers((prev) =>
        prev.filter((u) => u.id !== targetUser.id && u.code !== targetUser.code)
      );
      closeDeleteModal();
      if (selectedUserForEdit?.id === targetUser.id) {
        closeEditModal();
      }
      return true;
    } catch (err) {
      message.error(err.message || 'Không thể xóa tài khoản này');
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  // Kích hoạt hoặc Vô hiệu hóa
  const handleToggleStatus = async (targetUser, checked) => {
    const newStatus = checked ? USER_STATUS.ACTIVE : USER_STATUS.DISABLED;
    try {
      await UserService.toggleUserStatus(currentUser, targetUser, newStatus);
      message.success(
        `Đã ${newStatus === USER_STATUS.ACTIVE ? 'kích hoạt' : 'khóa'} tài khoản ${targetUser.name}`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      message.error(err.message || 'Lỗi thay đổi trạng thái tài khoản');
    }
  };

  // Đồng bộ lên Firestore
  const handleSeedToFirestore = async () => {
    try {
      message.loading({ content: 'Đang đồng bộ danh bạ lên Firestore...', key: 'seed' });
      const res = await UserService.seedInitialUsersToFirestore(currentUser);
      message.success({
        content: `Đồng bộ thành công ${res.count} tài khoản lên Cloud Firestore lakeducationdb!`,
        key: 'seed',
      });
      loadUsers();
    } catch (err) {
      message.error({ content: `Lỗi đồng bộ: ${err.message}`, key: 'seed' });
    }
  };

  // Dữ liệu lọc tìm kiếm
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const kw = searchText.trim().toLowerCase();
      const matchKeyword =
        !kw ||
        u.name?.toLowerCase().includes(kw) ||
        u.id?.toLowerCase().includes(kw) ||
        u.code?.toLowerCase().includes(kw) ||
        u.email?.toLowerCase().includes(kw) ||
        u.roleLabel?.toLowerCase().includes(kw);

      return matchRole && matchStatus && matchKeyword;
    });
  }, [users, roleFilter, statusFilter, searchText]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === USER_STATUS.ACTIVE).length;
    const disabled = users.filter((u) => u.status === USER_STATUS.DISABLED).length;
    const students = users.filter((u) => u.role === 'student').length;
    const staff = total - students;
    return { total, active, disabled, students, staff };
  }, [users]);

  return {
    currentUser,
    users: filteredUsers,
    allUsersCount: users.length,
    loading,
    stats,
    searchText,
    setSearchText,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    isFormModalOpen,
    setIsFormModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedUserForEdit,
    openEditModal,
    closeEditModal,
    handleUpdateUser,
    isDeleteModalOpen,
    userToDelete,
    deleteLoading,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDeleteUser,
    handleDeleteUser: openDeleteModal,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    auditLogs,
    auditLoading,
    openAuditDrawer,
    handleCreateUser,
    handleToggleStatus,
    handleSeedToFirestore,
    reloadUsers: loadUsers,
  };
};

