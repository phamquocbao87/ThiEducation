import React, { useMemo } from 'react';
import { Table, Tag, Switch, Space, Button, Tooltip, Typography, Popover } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  AimOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const CurriculumLevelTable = ({
  levels,
  loading,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  canManage = true,
}) => {
  const { isEnglish } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Order' : 'STT',
        dataIndex: 'orderIndex',
        key: 'orderIndex',
        width: 70,
        align: 'center',
        render: (val) => (
          <Tag color="default" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
            #{val || 1}
          </Tag>
        ),
      },
      {
        title: isEnglish ? 'Level Name & Code' : 'Mã & Cấp Độ Giáo Trình',
        key: 'levelInfo',
        width: 260,
        render: (_, record) => (
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, cursor: 'pointer' }}
              onClick={() => onView && onView(record)}
            >
              <Tag
                color={record.coverColor || '#1890ff'}
                style={{ fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}
              >
                {record.code}
              </Tag>
              <Text strong style={{ fontSize: 14, color: '#1890ff', cursor: 'pointer' }}>
                {record.name}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: '#64748b', fontSize: 12, marginTop: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <BookOutlined />
                {record.series}
              </span>

              {record.description && (
                <Popover
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                      <span style={{ fontWeight: 700 }}>
                        {isEnglish ? 'Curriculum Objectives & Approach' : 'Mục Tiêu Đào Tạo & Phương Pháp'} ({record.code})
                      </span>
                    </Space>
                  }
                  content={
                    <div
                      style={{ maxWidth: 380, maxHeight: 260, overflowY: 'auto', fontSize: 13, lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{
                        __html: record.description.startsWith('<')
                          ? record.description
                          : `<p>${record.description}</p>`,
                      }}
                    />
                  }
                  trigger="click"
                >
                  <Button
                    type="link"
                    size="small"
                    icon={<FileTextOutlined />}
                    style={{ padding: '0 4px', height: 'auto', fontSize: 11 }}
                  >
                    {isEnglish ? 'Objectives' : 'Mục tiêu'}
                  </Button>
                </Popover>
              )}
            </div>
          </div>
        ),
      },
      {
        title: isEnglish ? 'Age Range & CEFR' : 'Độ Tuổi & Chuẩn Đầu Ra',
        key: 'targetGroup',
        width: 200,
        render: (_, record) => (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              👶 {record.ageRange}
            </div>
            <Tag color="cyan" style={{ fontSize: 11, fontWeight: 600, borderRadius: 4 }}>
              <AimOutlined style={{ marginRight: 4 }} />
              {record.targetBand}
            </Tag>
          </div>
        ),
      },
      {
        title: isEnglish ? 'Skills Focus' : 'Kỹ Năng Trọng Tâm',
        key: 'skillsFocus',
        width: 240,
        render: (_, record) => (
          <Space wrap size={[4, 4]}>
            {Array.isArray(record.skillsFocus) && record.skillsFocus.length > 0 ? (
              record.skillsFocus.map((s, idx) => (
                <Tag key={idx} color="blue" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                  {s}
                </Tag>
              ))
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
            )}
          </Space>
        ),
      },
      {
        title: isEnglish ? 'Units & Duration' : 'Số Unit & Thời Lượng',
        key: 'duration',
        width: 190,
        render: (_, record) => (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              📚 {record.totalUnits} {isEnglish ? 'Units' : 'Chủ đề (Units)'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              ⏱️ {record.recommendedDuration}
            </div>
          </div>
        ),
      },
      {
        title: isEnglish ? 'Status' : 'Trạng Thái',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        align: 'center',
        render: (status, record) => {
          const isActive = status === 'ACTIVE';
          return (
            <Tooltip
              title={
                !canManage
                  ? isEnglish ? 'You do not have permission to change status' : 'Bạn không có quyền đổi trạng thái'
                  : isActive
                  ? isEnglish ? 'Click to deactivate level' : 'Gạt để tạm ngưng cấp độ này'
                  : isEnglish ? 'Click to activate level' : 'Gạt để kích hoạt cấp độ này'
              }
            >
              <Switch
                checked={isActive}
                disabled={!canManage}
                checkedChildren={<CheckCircleOutlined />}
                unCheckedChildren={<CloseCircleOutlined />}
                onChange={() => onToggleStatus(record)}
                style={{ backgroundColor: isActive ? '#52c41a' : '#ff4d4f' }}
              />
            </Tooltip>
          );
        },
      },
      {
        title: isEnglish ? 'Actions' : 'Thao Tác',
        key: 'actions',
        width: 140,
        align: 'center',
        render: (_, record) => (
          <Space size={4}>
            <Tooltip title={isEnglish ? 'View details' : 'Xem chi tiết'}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: '#0ea5e9' }} />}
                onClick={() => onView && onView(record)}
              />
            </Tooltip>
            <Tooltip title={isEnglish ? 'Edit curriculum level' : 'Chỉnh sửa cấp độ'}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#1890ff' }} />}
                onClick={() => onEdit(record)}
                disabled={!canManage}
              />
            </Tooltip>
            <Tooltip title={isEnglish ? 'Delete curriculum level' : 'Xóa cấp độ'}>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
                disabled={!canManage}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [isEnglish, canManage, onView, onEdit, onToggleStatus, onDelete]
  );

  return (
    <Table
      columns={columns}
      dataSource={levels}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total) =>
          isEnglish ? `Total ${total} levels` : `Tổng cộng ${total} cấp độ giáo trình`,
      }}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      }}
    />
  );
};

