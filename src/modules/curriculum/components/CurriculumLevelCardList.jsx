import React from 'react';
import { Card, Tag, Switch, Space, Button, Tooltip, Typography, Empty } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  AimOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text, Paragraph } = Typography;

const stripHtml = (html) => {
  if (!html) return '';
  return String(html).replace(/<[^>]*>?/gm, '').trim();
};

export const CurriculumLevelCardList = ({
  levels,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  canManage = true,
}) => {
  const { isEnglish } = useLanguage();

  if (!levels || levels.length === 0) {
    return (
      <Card style={{ borderRadius: 12, textAlign: 'center', padding: '32px 16px' }}>
        <Empty description={isEnglish ? 'No curriculum levels found' : 'Không tìm thấy cấp độ giáo trình phù hợp'} />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {levels.map((item) => {
        const isActive = item.status === 'ACTIVE';

        return (
          <Card
            key={item.id}
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderLeft: `4px solid ${item.coverColor || '#1890ff'}`,
            }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => onView && onView(item)}
              >
                <Space size={6} wrap style={{ marginBottom: 4 }}>
                  <Tag color="default" style={{ fontWeight: 700, margin: 0, fontSize: 11 }}>
                    #{item.orderIndex || 1}
                  </Tag>
                  <Tag
                    color={item.coverColor || '#1890ff'}
                    style={{ fontWeight: 700, fontSize: 11, margin: 0 }}
                  >
                    {item.code}
                  </Tag>
                </Space>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1890ff' }}>
                  {item.name}
                </div>
              </div>

              <Tooltip
                title={
                  !canManage
                    ? isEnglish ? 'No permission to toggle status' : 'Không có quyền đổi trạng thái'
                    : isActive
                    ? isEnglish ? 'Click to deactivate' : 'Gạt để tạm ngưng'
                    : isEnglish ? 'Click to activate' : 'Gạt để kích hoạt'
                }
              >
                <Switch
                  checked={isActive}
                  disabled={!canManage}
                  checkedChildren={<CheckCircleOutlined />}
                  unCheckedChildren={<CloseCircleOutlined />}
                  onChange={() => onToggleStatus(item)}
                  style={{ backgroundColor: isActive ? '#52c41a' : '#ff4d4f' }}
                />
              </Tooltip>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, marginBottom: 8 }}>
              <BookOutlined />
              <span>{item.series}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <Tag color="purple" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                👶 {item.ageRange}
              </Tag>
              <Tag color="cyan" style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, margin: 0 }}>
                <AimOutlined style={{ marginRight: 3 }} />
                {item.targetBand}
              </Tag>
              <Tag color="blue" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                📚 {item.totalUnits} Units
              </Tag>
            </div>

            {item.description && (
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 2 }}
                style={{ fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}
              >
                {stripHtml(item.description)}
              </Paragraph>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 8,
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                ⏱️ {item.recommendedDuration}
              </Text>

              <Space size={6}>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onView && onView(item)}
                  style={{ borderRadius: 6, fontSize: 12, color: '#0ea5e9' }}
                >
                  {isEnglish ? 'View' : 'Xem'}
                </Button>

                {canManage && (
                  <>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => onEdit(item)}
                      style={{ borderRadius: 6, fontSize: 12 }}
                    >
                      {isEnglish ? 'Edit' : 'Sửa'}
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onDelete(item)}
                      style={{ borderRadius: 6, fontSize: 12 }}
                    >
                      {isEnglish ? 'Delete' : 'Xóa'}
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

