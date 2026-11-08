import React from 'react';
import { Modal, Alert, Typography, Space, Tag } from 'antd';
import { ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text, Paragraph } = Typography;

export const CurriculumLevelDeleteModal = ({
  open,
  deletingLevel,
  loading,
  onCancel,
  onConfirm,
}) => {
  const { isEnglish } = useLanguage();

  if (!deletingLevel) return null;

  return (
    <Modal
      open={open}
      title={
        <Space style={{ color: '#ff4d4f' }}>
          <ExclamationCircleOutlined />
          <span>{isEnglish ? 'Confirm Delete Curriculum Level' : 'Xác Nhận Xóa Cấp Độ Giáo Trình'}</span>
        </Space>
      }
      okText={isEnglish ? 'Yes, Delete Level' : 'Xác Nhận Xóa'}
      okButtonProps={{ danger: true, icon: <DeleteOutlined /> }}
      cancelText={isEnglish ? 'Cancel' : 'Hủy Bỏ'}
      confirmLoading={loading}
      onOk={onConfirm}
      onCancel={onCancel}
      destroyOnClose
    >
      <div style={{ padding: '8px 0' }}>
        <Paragraph>
          {isEnglish ? 'Are you sure you want to delete the following curriculum level?' : 'Bạn có chắc chắn muốn xóa cấp độ giáo trình sau khỏi hệ thống?'}
        </Paragraph>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Tag color={deletingLevel.coverColor || '#1890ff'} style={{ fontWeight: 700 }}>
              {deletingLevel.code}
            </Tag>
            <Text strong style={{ fontSize: 14 }}>{deletingLevel.name}</Text>
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            📚 {deletingLevel.series} | 👶 {deletingLevel.ageRange} | 🎯 {deletingLevel.targetBand}
          </div>
        </div>

        <Alert
          type="warning"
          showIcon
          message={isEnglish ? 'Warning: Impact on Existing Classes' : 'Cảnh Báo: Ảnh Hưởng Lớp Học Đang Mở'}
          description={
            isEnglish
              ? 'If any courses or classes are currently linked to this level, their historical records will remain intact, but you will not be able to select this level for new course registrations.'
              : 'Nếu có khóa học hoặc lớp học nào đang tham chiếu tới cấp độ này, dữ liệu lịch sử vẫn được bảo toàn nhưng bạn sẽ không thể chọn cấp độ này khi mở khóa học mới.'
          }
        />
      </div>
    </Modal>
  );
};

