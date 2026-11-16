import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, message, Space, Tag, Typography, Upload } from 'antd';
import {
  CloudUploadOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { PermissionService } from '../../core/services/PermissionService';
import { CourseService } from '../courses/services/CourseService';
import { ClassService } from '../courses/services/ClassService';
import { UserService } from '../users/services/UserService';
import { MaterialService } from './services/MaterialService';
import { MaterialStatsCard } from './components/MaterialStatsCard';
import { MaterialFilterToolbar } from './components/MaterialFilterToolbar';
import { MaterialTableView } from './components/MaterialTableView';
import { MaterialUploadModal } from './components/MaterialUploadModal';
import { MaterialPreviewModal } from './components/MaterialPreviewModal';
import { MaterialShareDrawer } from './components/MaterialShareDrawer';

const { Title, Paragraph, Text } = Typography;

export const MaterialsPage = () => {
  const { currentUser } = useAuth();
  const { isEnglish, t } = useLanguage();

  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modal & Drag/Drop State
  const [modalOpen, setModalOpen] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Share Management Drawer State
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [sharingMaterial, setSharingMaterial] = useState(null);

  const canManage = useMemo(() => {
    return ['admin', 'director', 'academic'].includes(currentUser?.role);
  }, [currentUser?.role]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allMats, allCourses, allClasses, allStudents] = await Promise.all([
        MaterialService.getAllMaterials(),
        CourseService.getAllCourses(),
        ClassService.getAllClasses(),
        UserService.getUsersByRole('student'),
      ]);
      setMaterials(allMats || []);
      setCourses(allCourses || []);
      setClasses(allClasses || []);
      setStudents(allStudents || []);
    } catch (err) {
      console.error('Failed to load materials data:', err);
      message.error(isEnglish ? 'Failed to load materials' : 'Không tải được danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  }, [isEnglish]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ lọc dữ liệu bảo đảm đúng phân quyền Invariant
  const filteredMaterials = useMemo(() => {
    return MaterialService.filterMaterials(materials, {
      searchTerm,
      courseId: selectedCourseId,
      type: selectedType,
      user: currentUser,
      userRole: currentUser?.role,
      userClasses: classes,
    });
  }, [materials, searchTerm, selectedCourseId, selectedType, currentUser, classes]);

  // Handlers
  const handleOpenUpload = () => {
    setDroppedFiles([]);
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenShare = (item) => {
    setSharingMaterial(item);
    setShareDrawerOpen(true);
  };

  const handleShareTargets = async (materialId, targets) => {
    const updated = await MaterialService.shareMaterialToTargets(materialId, targets, currentUser);
    setMaterials((prev) => prev.map((m) => (m.id === materialId ? updated : m)));
    setSharingMaterial(updated);
    return updated;
  };

  const handleRevokeAccess = async (materialId, targetType, targetId) => {
    const updated = await MaterialService.revokeMaterialAccess(materialId, targetType, targetId, currentUser);
    setMaterials((prev) => prev.map((m) => (m.id === materialId ? updated : m)));
    setSharingMaterial(updated);
    return updated;
  };

  const handleEdit = (item) => {
    setDroppedFiles([]);
    setEditingItem(item);
    setModalOpen(true);
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const saved = await MaterialService.saveMaterial(values, currentUser);
      // Optimistic update
      setMaterials((prev) => {
        const idx = prev.findIndex((m) => m.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      message.success(
        editingItem
          ? (isEnglish ? 'Material updated successfully!' : 'Đã cập nhật học liệu thành công!')
          : (isEnglish ? 'Material uploaded & synced to course!' : 'Đã lưu và đồng bộ học liệu vào khóa học!')
      );
      setModalOpen(false);
      setDroppedFiles([]);
    } catch (err) {
      console.error('Save material error:', err);
      message.error(isEnglish ? 'Failed to save material' : 'Lưu tài liệu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBatch = (savedList) => {
    if (Array.isArray(savedList) && savedList.length > 0) {
      setMaterials((prev) => {
        const newIds = new Set(savedList.map((s) => s.id));
        const filtered = prev.filter((m) => !newIds.has(m.id));
        return [...savedList, ...filtered];
      });
      message.success(
        isEnglish
          ? `Uploaded ${savedList.length} file(s) successfully!`
          : `Đã tải lên ${savedList.length} tài liệu học tập thành công!`
      );
      setModalOpen(false);
      setDroppedFiles([]);
    }
  };

  const handleDelete = async (item) => {
    try {
      await MaterialService.deleteMaterial(item.id, item.courseId, currentUser);
      setMaterials((prev) => prev.filter((m) => m.id !== item.id));
      message.success(isEnglish ? 'Material deleted' : 'Đã xóa tài liệu khỏi hệ thống');
    } catch (err) {
      console.error('Delete material error:', err);
      message.error(isEnglish ? 'Failed to delete material' : 'Xóa tài liệu thất bại');
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 20px 40px' }} data-testid="materials-page-container">
      {/* Header Banner */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(67, 56, 202, 0.15)',
        }}
        bodyStyle={{ padding: '24px 28px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Space orientation="horizontal" size="middle">
              <span style={{ fontSize: 32 }}>📁</span>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }} data-testid="materials-page-title">
                  {isEnglish ? 'Digital Curriculum & Learning Materials Hub' : 'Quản Lý Tài Liệu Học Tập & Giáo Trình Số'}
                </Title>
                <Paragraph style={{ color: '#e0e7ff', margin: '4px 0 0 0', fontSize: 13 }}>
                  {isEnglish
                    ? 'Drag and drop documents or link course resources to build the digital learning materials hub.'
                    : 'Kéo thả tài liệu từ máy tính hoặc liên kết tài liệu từ Drive để bổ sung vào kho học liệu của khóa học.'}
                </Paragraph>
              </div>
            </Space>
          </div>

          <Space size="middle">
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
              }}
            >
              {isEnglish ? 'Refresh' : 'Làm mới'}
            </Button>
            {canManage && (
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleOpenUpload}
                data-testid="btn-banner-upload-material"
                style={{
                  backgroundColor: '#722ed1',
                  borderColor: '#722ed1',
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 38,
                }}
              >
                {isEnglish ? 'Upload Material' : 'Tải Lên Học Liệu Mới'}
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* 2. Drag & Drop Zone: Kéo 1 hoặc nhiều file vào web để tự động tạo thư mục trên Firebase Storage */}
      {canManage && (
        <Card
          style={{
            borderRadius: 14,
            marginBottom: 20,
            backgroundColor: '#faf5ff',
            border: '2px dashed #d3adf7',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.25s ease',
          }}
          bodyStyle={{ padding: 16 }}
          data-testid="materials-dropzone-card"
        >
          <Upload.Dragger
            name="files"
            multiple={true}
            showUploadList={false}
            beforeUpload={(file, fileList) => {
              // Gom toàn bộ các file được kéo thả hoặc chọn từ file picker
              const incoming = Array.isArray(fileList) && fileList.length > 0 ? fileList : [file];
              setDroppedFiles(incoming);
              setEditingItem(null);
              setModalOpen(true);
              return false; // Chặn HTTP post tự động của trình duyệt để xử lý qua Dialog
            }}
            data-testid="materials-upload-dragger"
            style={{ padding: '20px 24px', background: 'transparent', border: 'none' }}
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
              <InboxOutlined style={{ color: '#722ed1', fontSize: 44 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 700, color: '#3b0764', marginBottom: 6 }}>
              {isEnglish
                ? 'Drag & drop 1 or multiple files here (or click to browse from computer)'
                : 'Kéo thả 1 hoặc nhiều file vào đây (hoặc nhấp chuột để chọn tệp từ máy tính)'}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 13, color: '#6b21a8', margin: 0, maxWidth: 650, marginInline: 'auto' }}>
              💡 {isEnglish
                ? 'Drag & drop 1 or multiple documents here to enter details and organize by course. Supports PDF, Audio, and Lecture Slides.'
                : 'Kéo thả 1 hoặc nhiều tài liệu vào đây để nhập thông tin và phân loại theo khóa học. Hỗ trợ đầy đủ tệp PDF, Audio, Slide bài giảng.'}
            </p>
          </Upload.Dragger>
        </Card>
      )}

      {/* Metrics Row */}
      <MaterialStatsCard materials={materials} />

      {/* Filter Toolbar */}
      <MaterialFilterToolbar
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={setSelectedCourseId}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        canManage={canManage}
        onOpenUpload={handleOpenUpload}
      />

      {/* Materials Table / Cards */}
      <MaterialTableView
        materials={filteredMaterials}
        loading={loading}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPreview={handlePreview}
        onOpenShare={handleOpenShare}
      />

      {/* Upload & Edit Modal */}
      <MaterialUploadModal
        open={modalOpen}
        files={droppedFiles}
        editingItem={editingItem}
        courses={courses}
        classes={classes}
        students={students}
        loading={saving}
        onSave={handleSave}
        onSaveBatch={handleSaveBatch}
        onCancel={() => {
          setModalOpen(false);
          setDroppedFiles([]);
        }}
      />

      {/* Multi-Format File Preview Modal */}
      <MaterialPreviewModal
        open={previewOpen}
        material={previewItem}
        courses={courses}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewItem(null);
        }}
      />

      {/* Drawer Quản Lý Chia Sẻ & Phân Quyền Đa Đối Tượng */}
      <MaterialShareDrawer
        open={shareDrawerOpen}
        material={sharingMaterial}
        courses={courses}
        classes={classes}
        students={students}
        onClose={() => {
          setShareDrawerOpen(false);
          setSharingMaterial(null);
        }}
        onShareTargets={handleShareTargets}
        onRevokeAccess={handleRevokeAccess}
      />
    </div>
  );
};
