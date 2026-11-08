import React from 'react';
import { useParams } from 'react-router-dom';
import { CurriculumLevelsPage } from './CurriculumLevelsPage';
import { CurriculumLevelViewPage } from './CurriculumLevelViewPage';
import { CurriculumLevelEditPage } from './CurriculumLevelEditPage';

/**
 * Public Entry Point for Curriculum Levels Module — LAK EDUCATION
 * - /curriculum-levels/new -> Tạo mới cấp độ giáo trình (Dedicated Form Page)
 * - /curriculum-levels/:levelId -> Chế độ XEM HỒ SƠ cấp độ giáo trình (Dedicated View Page)
 * - /curriculum-levels/:levelId/edit -> Chế độ CHỈNH SỬA cấp độ giáo trình (Dedicated Edit Form Page)
 * - /curriculum-levels -> Màn hình danh mục tổng quan (Card List & Table)
 */
export default function CurriculumModule() {
  const { levelId, action } = useParams();

  // Tạo mới cấp độ giáo trình
  if (levelId === 'new' || action === 'new') {
    return <CurriculumLevelEditPage />;
  }

  // Chỉnh sửa cấp độ giáo trình
  if (action === 'edit') {
    return <CurriculumLevelEditPage />;
  }

  // Xem chi tiết cấp độ giáo trình (VIEW MODE)
  if (levelId) {
    return <CurriculumLevelViewPage />;
  }

  // Danh mục tổng quan
  return <CurriculumLevelsPage />;
}

export { CurriculumLevelsPage, CurriculumLevelViewPage, CurriculumLevelEditPage };
