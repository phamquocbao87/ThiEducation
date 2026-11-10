/**
 * Hook Controller for Curriculum Levels Management Module — LAK EDUCATION
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { CurriculumLevelService } from '../services/CurriculumLevelService';
import { useLanguage } from '../../../core/context/LanguageContext';
import { matchesMultiFields } from '../../../shared/utils/searchUtils';

export const useCurriculumLevelController = () => {
  const { isEnglish } = useLanguage();

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal Xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLevel, setDeletingLevel] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tải danh sách
  const refreshLevels = useCallback(() => {
    setLoading(true);
    try {
      const data = CurriculumLevelService.getAllLevels();
      setLevels(data);
    } catch (err) {
      message.error(err.message || 'Lỗi tải danh mục cấp độ giáo trình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLevels();
  }, [refreshLevels]);

  // Bộ lọc tìm kiếm
  const filteredLevels = useMemo(() => {
    return levels.filter((item) => {
      const matchSearch = matchesMultiFields(item, searchText, [
        'name',
        'code',
        'targetBand',
        'ageRange',
        'description',
        'series',
      ]);

      const matchSeries = seriesFilter === 'ALL' || item.series === seriesFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchSeries && matchStatus;
    });
  }, [levels, searchText, seriesFilter, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = levels.length;
    const activeCount = levels.filter((l) => l.status === 'ACTIVE').length;
    const seriesSet = new Set(levels.map((l) => l.series));
    return {
      total,
      activeCount,
      seriesCount: seriesSet.size,
    };
  }, [levels]);

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingLevel(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (record) => {
    setEditingLevel(record);
    setIsModalOpen(true);
  };

  // Đóng modal thêm/sửa
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLevel(null);
  };

  // Lưu cấp độ (Thêm hoặc Cập nhật)
  const handleSaveLevel = async (values) => {
    setModalLoading(true);
    try {
      if (editingLevel) {
        CurriculumLevelService.updateLevel(editingLevel.id, values);
        message.success(
          isEnglish
            ? `Updated curriculum level "${values.name || editingLevel.code}" successfully`
            : `Đã cập nhật thành công cấp độ "${values.name || editingLevel.code}"`
        );
      } else {
        CurriculumLevelService.createLevel(values);
        message.success(
          isEnglish
            ? `Created new curriculum level "${values.name}" successfully`
            : `Đã thêm mới thành công cấp độ giáo trình "${values.name}"`
        );
      }
      setIsModalOpen(false);
      setEditingLevel(null);
      refreshLevels();
    } catch (err) {
      message.error(err.message || 'Lỗi lưu thông tin cấp độ');
    } finally {
      setModalLoading(false);
    }
  };

  // Bật / Tắt trạng thái hoạt động nhanh
  const handleToggleStatus = (record) => {
    try {
      const targetId = record.id || record.code;
      const updated = CurriculumLevelService.toggleLevelStatus(targetId);
      message.success(
        isEnglish
          ? `Status of "${updated.name}" changed to ${updated.status}`
          : `Đã chuyển trạng thái cấp độ "${updated.name}" sang ${updated.status === 'ACTIVE' ? 'Đang Áp Dụng' : 'Tạm Ngưng'}`
      );
      // Cập nhật State trực tiếp ngay lập tức
      setLevels((prev) => prev.map((l) => (l.id === record.id || l.code === record.code ? updated : l)));
    } catch (err) {
      message.error(err.message || 'Lỗi đổi trạng thái');
    }
  };

  // Mở modal xác nhận xóa
  const handleOpenDelete = (record) => {
    setDeletingLevel(record);
    setIsDeleteModalOpen(true);
  };

  // Đóng modal xóa
  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingLevel(null);
  };

  // Xác nhận xóa (Optimistic Instant State Update)
  const handleConfirmDelete = () => {
    if (!deletingLevel) return;
    const targetId = deletingLevel.id;
    const targetCode = deletingLevel.code;
    const targetName = deletingLevel.name;

    setDeleteLoading(true);
    try {
      CurriculumLevelService.deleteLevel(targetId || targetCode);

      // Cập nhật State lập tức (0ms) — phần tử biến mất ngay trên giao diện mà không cần reload
      setLevels((prev) =>
        prev.filter((l) => l.id !== targetId && l.code !== targetCode && l.id !== targetCode && l.code !== targetId)
      );

      message.success(
        isEnglish
          ? `Deleted curriculum level "${targetName}"`
          : `Đã xóa cấp độ giáo trình: "${targetName}" (${targetCode})`
      );
      setIsDeleteModalOpen(false);
      setDeletingLevel(null);
    } catch (err) {
      message.error(err.message || 'Không thể xóa cấp độ này');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Khôi phục mặc định
  const handleResetDefaults = () => {
    try {
      const defaults = CurriculumLevelService.resetToDefaults();
      setLevels(defaults);
      message.success(
        isEnglish
          ? 'Reset curriculum levels catalog to system defaults successfully'
          : 'Đã khôi phục danh mục cấp độ giáo trình chuẩn mặc định (Wonders GK -> G6)'
      );
    } catch (err) {
      message.error(err.message || 'Lỗi khôi phục mặc định');
    }
  };

  return {
    levels: filteredLevels,
    allLevelsCount: levels.length,
    loading,
    stats,
    searchText,
    setSearchText,
    seriesFilter,
    setSeriesFilter,
    statusFilter,
    setStatusFilter,
    // Modals
    isModalOpen,
    editingLevel,
    modalLoading,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSaveLevel,
    handleToggleStatus,
    // Delete
    isDeleteModalOpen,
    deletingLevel,
    deleteLoading,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
    // Reset
    handleResetDefaults,
  };
};

