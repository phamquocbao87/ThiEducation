import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Divider,
  Drawer,
  Empty,
  message,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  ReadOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { MATERIAL_TYPES, SHARE_SCOPES, TARGET_TYPES } from '../models/material.model';

const { Title, Text, Paragraph } = Typography;

export const MaterialShareDrawer = ({
  open = false,
  material = null,
  courses = [],
  classes = [],
  students = [],
  loading = false,
  onClose,
  onShareTargets,
  onRevokeAccess,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();

  const [targetType, setTargetType] = useState('student');
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  // Danh sách các mục đang được chia sẻ của tài liệu này
  const activeShares = useMemo(() => {
    if (!material || !Array.isArray(material.shares)) return [];
    return material.shares;
  }, [material]);

  // Bộ chọn đối tượng dựa trên targetType
  const selectOptions = useMemo(() => {
    if (targetType === 'student') {
      const sharedSet = new Set(material?.sharedStudentIds || []);
      return (students || [])
        .filter((s) => !s.isDeleted && s.status !== 'deleted')
        .map((s) => {
          const isAlreadyShared = sharedSet.has(s.id) || sharedSet.has(s.code);
          return {
            value: s.id || s.code,
            label: `${s.name} ${s.englishName ? `(${s.englishName})` : ''} [${s.code || s.id}]`,
            disabled: isAlreadyShared,
            avatar: s.avatar,
            name: s.name,
            code: s.code || s.id,
            englishName: s.englishName,
          };
        });
    }

    if (targetType === 'class') {
      const sharedSet = new Set(material?.sharedClassIds || []);
      return (classes || [])
        .filter((c) => !c.isDeleted && c.status !== 'Deleted')
        .map((c) => {
          const isAlreadyShared = sharedSet.has(c.id);
          return {
            value: c.id,
            label: `${c.name || c.id} [${c.id}] • ${c.teacherName || 'Chưa phân công GV'}`,
            disabled: isAlreadyShared,
            name: c.name || c.id,
            id: c.id,
            teacherName: c.teacherName,
          };
        });
    }

    if (targetType === 'course') {
      const sharedSet = new Set(material?.sharedCourseIds || []);
      return (courses || [])
        .filter((c) => !c.isDeleted && c.status !== 'Deleted')
        .map((c) => {
          const isAlreadyShared = sharedSet.has(c.id);
          return {
            value: c.id,
            label: `${c.name || c.code} [${c.id}] • ${c.level || 'Standard'}`,
            disabled: isAlreadyShared,
            name: c.name || c.code,
            id: c.id,
            level: c.level,
          };
        });
    }

    return [];
  }, [targetType, students, classes, courses, material]);

  // Xử lý Thêm chia sẻ
  const handleAddShare = async () => {
    if (!material?.id || selectedTargetIds.length === 0) {
      message.warning(isEnglish ? 'Please select at least one recipient' : 'Vui lòng chọn ít nhất một đối tượng để chia sẻ');
      return;
    }

    setSharing(true);
    try {
      const targetsToAdd = selectedTargetIds.map((tid) => {
        let targetName = tid;
        if (targetType === 'student') {
          const found = students.find((s) => s.id === tid || s.code === tid);
          targetName = found ? `${found.name} ${found.englishName ? `(${found.englishName})` : ''}` : tid;
        } else if (targetType === 'class') {
          const found = classes.find((c) => c.id === tid);
          targetName = found ? found.name || found.id : tid;
        } else if (targetType === 'course') {
          const found = courses.find((c) => c.id === tid);
          targetName = found ? found.name || found.code : tid;
        }

        return {
          targetType,
          targetId: tid,
          targetName,
        };
      });

      await onShareTargets?.(material.id, targetsToAdd);
      setSelectedTargetIds([]);
      message.success(
        isEnglish
          ? `Material shared to ${targetsToAdd.length} recipient(s) successfully!`
          : `Đã chia sẻ tài liệu thành công tới ${targetsToAdd.length} đối tượng!`
      );
    } catch (err) {
      console.error('Error adding share:', err);
      message.error(err.message || (isEnglish ? 'Failed to share material' : 'Lỗi chia sẻ tài liệu'));
    } finally {
      setSharing(false);
    }
  };

  // Xử lý Xóa quyền truy cập (Revoke Access)
  const handleRevoke = async (record) => {
    if (!material?.id || !record.targetType || !record.targetId) return;

    setRevokingId(record.id || `${record.targetType}_${record.targetId}`);
    try {
      await onRevokeAccess?.(material.id, record.targetType, record.targetId);
      message.success(
        isEnglish
          ? `Revoked access for ${record.targetName} successfully!`
          : `Đã xóa quyền truy cập của ${record.targetName} thành công!`
      );
    } catch (err) {
      console.error('Error revoking access:', err);
      message.error(err.message || (isEnglish ? 'Failed to revoke access' : 'Lỗi xóa quyền truy cập'));
    } finally {
      setRevokingId(null);
    }
  };

  const columns = [
    {
      title: isEnglish ? 'Target Type' : 'Đối Tượng',
      key: 'type',
      width: 130,
      render: (_, record) => {
        const meta = TARGET_TYPES[record.targetType?.toUpperCase()] || TARGET_TYPES.STUDENT;
        return (
          <Tag color={meta.badgeColor} style={{ borderRadius: 6, fontWeight: 600 }}>
            {record.targetType === 'student' && <UserOutlined style={{ marginRight: 4 }} />}
            {record.targetType === 'class' && <TeamOutlined style={{ marginRight: 4 }} />}
            {record.targetType === 'course' && <ReadOutlined style={{ marginRight: 4 }} />}
            {isEnglish ? meta.labelEn : meta.labelVi}
          </Tag>
        );
      },
    },
    {
      title: isEnglish ? 'Recipient Name' : 'Tên Đối Tượng Được Share',
      key: 'name',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
            {record.targetName}
          </Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            ID: <Text code>{record.targetId}</Text>
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Shared Date & By' : 'Thời Gian & Người Gán',
      key: 'sharedBy',
      width: 170,
      responsive: ['sm'],
      render: (_, record) => (
        <div style={{ fontSize: 11, color: '#475569' }}>
          <div>{record.sharedByName || 'Giáo Vụ'}</div>
          <div style={{ color: '#94a3b8' }}>
            {record.sharedAt ? new Date(record.sharedAt).toLocaleDateString('vi-VN') : '—'}
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Revoke' : 'Gỡ Quyền',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title={isEnglish ? 'Revoke Access?' : 'Xác nhận xóa quyền truy cập?'}
          description={
            isEnglish
              ? `Remove access to this material for ${record.targetName}?`
              : `Gỡ bỏ quyền xem tài liệu này của "${record.targetName}"?`
          }
          okText={isEnglish ? 'Revoke' : 'Gỡ Quyền'}
          cancelText={isEnglish ? 'Cancel' : 'Hủy'}
          okButtonProps={{ danger: true, loading: revokingId === (record.id || `${record.targetType}_${record.targetId}`) }}
          onConfirm={() => handleRevoke(record)}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={revokingId === (record.id || `${record.targetType}_${record.targetId}`)}
            style={{ borderRadius: 6 }}
            data-testid={`btn-revoke-share-${record.targetId}`}
          >
            {isEnglish ? 'Revoke' : 'Xóa'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (!material) return null;

  const currentFormatMeta = MATERIAL_TYPES[material.type] || MATERIAL_TYPES.PDF;

  return (
    <Drawer
      title={
        <Space size={8}>
          <ShareAltOutlined style={{ color: '#722ed1', fontSize: 18 }} />
          <span style={{ fontWeight: 700 }}>
            {isEnglish ? 'Manage Sharing & Access Permissions' : 'Quản Lý Quyền Truy Cập & Chia Sẻ Tài Liệu'}
          </span>
        </Space>
      }
      placement="right"
      width={isMobile ? '100%' : 580}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        body: { padding: isMobile ? '16px 14px' : '20px 24px' },
      }}
      data-testid="material-share-drawer"
    >
      {/* 1. Header tóm tắt tài liệu */}
      <Card
        size="small"
        style={{
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #cbd5e1',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <Tag color={currentFormatMeta.badgeColor} style={{ borderRadius: 4, fontWeight: 600 }}>
                {isEnglish ? currentFormatMeta.labelEn : currentFormatMeta.labelVi}
              </Tag>
              {material.shareScope === SHARE_SCOPES.ALL.key && (
                <Tag color="green" icon={<GlobalOutlined />}>
                  {isEnglish ? 'Public (All)' : 'Công Khai (Toàn Trường)'}
                </Tag>
              )}
              {material.shareScope === SHARE_SCOPES.CUSTOM.key && (
                <Tag color="purple" icon={<ShareAltOutlined />}>
                  {isEnglish ? 'Custom Shared' : 'Chia Sẻ Chọn Lọc'}
                </Tag>
              )}
              {material.shareScope === SHARE_SCOPES.STAFF_ONLY.key && (
                <Tag color="volcano" icon={<LockOutlined />}>
                  {isEnglish ? 'Staff Only' : 'Nội Bộ Giáo Viên'}
                </Tag>
              )}
            </div>
            <Title level={5} style={{ margin: 0, color: '#0f172a', wordBreak: 'break-word' }}>
              {material.title}
            </Title>
            {material.fileName && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                📄 {material.fileName} {material.fileSize ? `(${material.fileSize})` : ''}
              </Text>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Khu vực Cấu hình Thêm Chia Sẻ Mới */}
      <Card
        size="small"
        title={
          <Space size={6}>
            <UserAddOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {isEnglish ? 'Add Recipients (Share)' : 'Thêm Đối Tượng Nhận Tài Liệu'}
            </span>
          </Space>
        }
        style={{
          borderRadius: 12,
          border: '1px solid #d8b4fe',
          backgroundColor: '#faf5ff',
          marginBottom: 20,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
            {isEnglish ? 'Select Target Type:' : 'Chọn Loại Đối Tượng:'}
          </Text>
          <Segmented
            block
            value={targetType}
            onChange={(val) => {
              setTargetType(val);
              setSelectedTargetIds([]);
            }}
            options={[
              {
                value: 'student',
                label: (
                  <Space size={4}>
                    <UserOutlined />
                    <span>{isEnglish ? 'Student' : 'Học Viên'}</span>
                  </Space>
                ),
              },
              {
                value: 'class',
                label: (
                  <Space size={4}>
                    <TeamOutlined />
                    <span>{isEnglish ? 'Class' : 'Lớp Học'}</span>
                  </Space>
                ),
              },
              {
                value: 'course',
                label: (
                  <Space size={4}>
                    <ReadOutlined />
                    <span>{isEnglish ? 'Course' : 'Khóa Học'}</span>
                  </Space>
                ),
              },
            ]}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
            {targetType === 'student' && (isEnglish ? 'Pick Students to Share:' : 'Chọn Học Viên Muốn Chia Sẻ:')}
            {targetType === 'class' && (isEnglish ? 'Pick Classes to Share:' : 'Chọn Lớp Học Muốn Chia Sẻ:')}
            {targetType === 'course' && (isEnglish ? 'Pick Courses to Share:' : 'Chọn Khóa Học Muốn Chia Sẻ:')}
          </Text>
          <Select
            mode="multiple"
            style={{ width: '100%', minHeight: 40 }}
            placeholder={
              targetType === 'student'
                ? (isEnglish ? 'Search student by name or code...' : 'Tìm học viên theo tên hoặc mã...')
                : targetType === 'class'
                ? (isEnglish ? 'Select classes...' : 'Chọn các lớp học áp dụng...')
                : (isEnglish ? 'Select courses...' : 'Chọn các khóa học áp dụng...')
            }
            value={selectedTargetIds}
            onChange={setSelectedTargetIds}
            options={selectOptions}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            maxTagCount="responsive"
            data-testid="select-share-recipients"
          />
        </div>

        <Button
          type="primary"
          block
          icon={<ShareAltOutlined />}
          loading={sharing}
          disabled={selectedTargetIds.length === 0}
          onClick={handleAddShare}
          style={{
            height: 40,
            borderRadius: 8,
            backgroundColor: '#722ed1',
            borderColor: '#722ed1',
            fontWeight: 600,
          }}
          data-testid="btn-confirm-add-share"
        >
          {isEnglish
            ? `Grant Access to Selected (${selectedTargetIds.length})`
            : `Cấp Quyền Truy Cập Cho Đã Chọn (${selectedTargetIds.length})`}
        </Button>
      </Card>

      {/* 3. Danh sách các đối tượng Đang Được Chia Sẻ (Revoke Access Table) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Space size={6}>
            <TeamOutlined style={{ color: '#0958d9' }} />
            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
              {isEnglish ? 'Currently Shared Recipients' : 'Danh Sách Đang Được Cấp Quyền Truy Cập'}
            </Text>
          </Space>
          <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700 }}>
            {activeShares.length} {isEnglish ? 'active shares' : 'đối tượng'}
          </Tag>
        </div>

        {activeShares.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isEnglish
                ? 'No custom recipients yet. Material is currently accessible based on its global scope.'
                : 'Chưa có đối tượng chia sẻ chọn lọc nào. Tài liệu đang hiển thị theo phạm vi chung.'
            }
            style={{ padding: '24px 0' }}
          />
        ) : (
          <Table
            size="small"
            dataSource={activeShares}
            columns={columns}
            rowKey={(r) => r.id || `${r.targetType}_${r.targetId}`}
            pagination={false}
            scroll={{ x: 'max-content' }}
            bordered
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        )}
      </div>
    </Drawer>
  );
};
