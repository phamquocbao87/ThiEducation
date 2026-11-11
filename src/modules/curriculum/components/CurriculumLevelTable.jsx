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
import { useAuth } from '../../../core/context/AuthContext';
import { AdminAuditInfo } from '../../../shared/components/AdminAuditInfo';
import { formatLocalizedAgeRange, formatLocalizedDuration } from '../../../shared/utils/taxonomyUtils';

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
  const { isEnglish, t } = useLanguage();
  const { currentUser } = useAuth();

  const columns = useMemo(
    () => [
      {
        title: t('curriculum.table.colOrder'),
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
        title: t('curriculum.table.colLevelCode'),
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
        title: t('curriculum.table.colAgeCefr'),
        key: 'targetGroup',
        width: 200,
        render: (_, record) => (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              👶 {formatLocalizedAgeRange(record.ageRange, isEnglish)}
            </div>
            <Tag color="cyan" style={{ fontSize: 11, fontWeight: 600, borderRadius: 4 }}>
              <AimOutlined style={{ marginRight: 4 }} />
              {record.targetBand}
            </Tag>
          </div>
        ),
      },
      {
        title: t('curriculum.table.colSkills'),
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
        title: t('curriculum.table.colUnits'),
        key: 'duration',
        width: 190,
        render: (_, record) => (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              📚 {record.totalUnits} {t('curriculum.table.unitsCount')}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              ⏱️ {formatLocalizedDuration(record.recommendedDuration, isEnglish)}
            </div>
          </div>
        ),
      },
      {
        title: t('curriculum.table.colStatus'),
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
                  ? t('curriculum.table.noPermissionStatus')
                  : isActive
                  ? t('curriculum.table.toggleDeactivate')
                  : t('curriculum.table.toggleActivate')
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
      ...(currentUser?.role === 'admin'
        ? [
            {
              title: isEnglish ? 'Audit Trail' : 'Người Tạo / Cập Nhật',
              key: 'auditTrail',
              width: 190,
              render: (_, record) => (
                <AdminAuditInfo record={record} currentUser={currentUser} mode="table" />
              ),
            },
          ]
        : []),
      {
        title: t('curriculum.table.colActions'),
        key: 'actions',
        width: 140,
        align: 'center',
        render: (_, record) => (
          <Space size={4}>
            <Tooltip title={t('curriculum.table.tooltipView')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: '#0ea5e9' }} />}
                onClick={() => onView && onView(record)}
              />
            </Tooltip>
            <Tooltip title={t('curriculum.table.tooltipEdit')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#1890ff' }} />}
                onClick={() => onEdit(record)}
                disabled={!canManage}
              />
            </Tooltip>
            <Tooltip title={t('curriculum.table.tooltipDelete')}>
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
    [isEnglish, canManage, onView, onEdit, onToggleStatus, onDelete, t, currentUser]
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

