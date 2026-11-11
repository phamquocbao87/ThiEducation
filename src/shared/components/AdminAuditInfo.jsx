import React from 'react';
import { Tag, Typography, Row, Col, Space, Tooltip } from 'antd';
import { AuditOutlined, UserOutlined, ClockCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { formatDateTime } from '../utils/formatter';

const { Text } = Typography;

/**
 * AdminAuditInfo — Enterprise Audit Trail Component for IT Admin view.
 * Strictly visible ONLY when logged in user has role === 'admin'.
 * Renders null for all other roles (Director, Academic, Teacher, Student, Accountant).
 *
 * Supported modes:
 * - 'table': Compact 2-line rendering inside Ant Design Table column.
 * - 'card': Elegant footer block on Mobile/Desktop cards.
 * - 'detail': High-visibility banner for Detail Views and Drawers.
 * - 'inline': Single-line tag or tooltip for tight headers.
 */
export const AdminAuditInfo = ({
  record,
  createdBy: propCreatedBy,
  createdByName: propCreatedByName,
  createdAt: propCreatedAt,
  updatedBy: propUpdatedBy,
  updatedByName: propUpdatedByName,
  updatedAt: propUpdatedAt,
  currentUser: propCurrentUser,
  mode = 'table',
  style = {},
}) => {
  const auth = useAuth();
  const lang = useLanguage();
  const currentUser = propCurrentUser || auth?.currentUser;
  const isEnglish = lang?.isEnglish;

  // Strict RBAC gate: Only IT Admin can see creator & updater audit info
  if (currentUser?.role !== 'admin') {
    return null;
  }

  const rawCreatorName = record?.createdByName || propCreatedByName;
  const rawCreatorId = record?.createdBy || propCreatedBy;
  const creator = rawCreatorName
    ? (rawCreatorId && rawCreatorId !== rawCreatorName ? `${rawCreatorName} (${rawCreatorId})` : rawCreatorName)
    : (rawCreatorId || (record?.createdAt || propCreatedAt ? (isEnglish ? 'System' : 'Hệ thống') : '-'));

  const rawCreatedAt = record?.createdAt || propCreatedAt;

  const rawUpdaterName = record?.updatedByName || propUpdatedByName;
  const rawUpdaterId = record?.updatedBy || propUpdatedBy;
  const updater = rawUpdaterName
    ? (rawUpdaterId && rawUpdaterId !== rawUpdaterName ? `${rawUpdaterName} (${rawUpdaterId})` : rawUpdaterName)
    : (rawUpdaterId || '-');

  const rawUpdatedAt = record?.updatedAt || propUpdatedAt;
  const hasUpdate = Boolean(rawUpdatedAt && (rawUpdatedAt !== rawCreatedAt || rawUpdaterName || rawUpdaterId));

  // 1. MODE: TABLE (Desktop Antd Table Column)
  if (mode === 'table') {
    return (
      <div style={{ fontSize: 11, lineHeight: 1.4, ...style }}>
        <div style={{ color: '#334155' }}>
          <span style={{ fontWeight: 600, color: '#0284c7' }}>
            {isEnglish ? 'Created:' : 'Tạo:'}
          </span>{' '}
          <span style={{ fontWeight: 500 }}>{creator}</span>
          {rawCreatedAt && (
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 1 }}>
              🕒 {formatDateTime(rawCreatedAt)}
            </div>
          )}
        </div>
        {hasUpdate && (
          <div style={{ marginTop: 4, color: '#334155' }}>
            <span style={{ fontWeight: 600, color: '#d97706' }}>
              {isEnglish ? 'Updated:' : 'Sửa:'}
            </span>{' '}
            <span style={{ fontWeight: 500 }}>{updater}</span>
            {rawUpdatedAt && (
              <div style={{ color: '#64748b', fontSize: 10, marginTop: 1 }}>
                ✏️ {formatDateTime(rawUpdatedAt)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. MODE: CARD (Desktop/Mobile Card Footer)
  if (mode === 'card') {
    return (
      <div
        style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: 11,
          color: '#475569',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
          <span>
            <strong style={{ color: '#0284c7' }}>{isEnglish ? 'Created:' : 'Tạo bởi:'}</strong> {creator}
          </span>
          {rawCreatedAt && (
            <span style={{ color: '#94a3b8', fontSize: 10 }}>
              {formatDateTime(rawCreatedAt)}
            </span>
          )}
        </div>
        {hasUpdate && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
            <span>
              <strong style={{ color: '#d97706' }}>{isEnglish ? 'Updated:' : 'Sửa gần nhất:'}</strong> {updater}
            </span>
            {rawUpdatedAt && (
              <span style={{ color: '#94a3b8', fontSize: 10 }}>
                {formatDateTime(rawUpdatedAt)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. MODE: DETAIL (Drawer, Modal & View Page Header Box)
  if (mode === 'detail') {
    return (
      <div
        style={{
          padding: '10px 14px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          marginBottom: 16,
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <AuditOutlined style={{ color: '#16a34a', fontSize: 14 }} />
          <Text strong style={{ fontSize: 12, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isEnglish ? 'IT System Audit Trail (Admin View Only)' : 'Nhật Ký Kiểm Toán Hệ Thống (Dành Riêng Cho IT Admin)'}
          </Text>
        </div>
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: '#64748b' }}>{isEnglish ? 'Created by:' : 'Người khởi tạo:'}</span>
              <Tag color="blue" style={{ fontWeight: 600, fontSize: 11, margin: 0 }}>
                {creator}
              </Tag>
              {rawCreatedAt && (
                <span style={{ color: '#64748b', fontSize: 11 }}>
                  • {formatDateTime(rawCreatedAt)}
                </span>
              )}
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: '#64748b' }}>{isEnglish ? 'Last updated by:' : 'Cập nhật gần nhất:'}</span>
              <Tag color="orange" style={{ fontWeight: 600, fontSize: 11, margin: 0 }}>
                {updater}
              </Tag>
              {rawUpdatedAt && (
                <span style={{ color: '#64748b', fontSize: 11 }}>
                  • {formatDateTime(rawUpdatedAt)}
                </span>
              )}
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  // 4. MODE: INLINE (Compact tag with tooltip)
  return (
    <Tooltip
      title={
        <div>
          <div><strong>{isEnglish ? 'Created:' : 'Tạo:'}</strong> {creator} ({formatDateTime(rawCreatedAt)})</div>
          {hasUpdate && (
            <div style={{ marginTop: 4 }}>
              <strong>{isEnglish ? 'Updated:' : 'Sửa:'}</strong> {updater} ({formatDateTime(rawUpdatedAt)})
            </div>
          )}
        </div>
      }
    >
      <Tag
        icon={<AuditOutlined />}
        color="purple"
        style={{ cursor: 'pointer', fontSize: 11, padding: '2px 8px', ...style }}
      >
        {isEnglish ? 'Audit' : 'Kiểm toán'}
      </Tag>
    </Tooltip>
  );
};

