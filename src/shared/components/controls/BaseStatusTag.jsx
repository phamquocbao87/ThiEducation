import React from 'react';
import { Tag, Tooltip } from 'antd';
import { useLanguage } from '../../../core/context/LanguageContext';

const STATUS_CONFIGS = {
  ACTIVE: {
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    labelVi: 'Đang Hoạt Động',
    labelEn: 'Active',
    tooltipVi: 'Trạng thái hoạt động bình thường, cho phép mở lớp và tuyển sinh.',
    tooltipEn: 'Operational and active for class enrollments.',
  },
  INACTIVE: {
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    labelVi: 'Tạm Ngưng',
    labelEn: 'Inactive',
    tooltipVi: 'Tạm ngưng hoạt động hoặc dừng tuyển sinh.',
    tooltipEn: 'Temporarily paused or disabled.',
  },
  DISABLED: {
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    labelVi: 'Đã Khóa',
    labelEn: 'Disabled',
    tooltipVi: 'Tài khoản hoặc cấp độ đã bị vô hiệu hóa.',
    tooltipEn: 'Account or record is disabled.',
  },
  PENDING: {
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    labelVi: 'Chờ Duyệt',
    labelEn: 'Pending Review',
    tooltipVi: 'Đang chờ quản trị viên hoặc kế toán phê duyệt.',
    tooltipEn: 'Pending administrative or accounting approval.',
  },
};

/**
 * BaseStatusTag — Standard Status Badge with Glowing Indicator Dot & Tooltip
 */
export const BaseStatusTag = ({
  status = 'ACTIVE',
  customLabel,
  tooltip,
  style,
}) => {
  const { isEnglish } = useLanguage();
  const normalizedKey = String(status).toUpperCase();
  const conf = STATUS_CONFIGS[normalizedKey] || STATUS_CONFIGS.ACTIVE;

  const displayLabel =
    customLabel || (isEnglish ? conf.labelEn : conf.labelVi);
  const displayTooltip =
    tooltip || (isEnglish ? conf.tooltipEn : conf.tooltipVi);

  return (
    <Tooltip title={displayTooltip}>
      <Tag
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 10px',
          borderRadius: 12,
          backgroundColor: conf.bg,
          border: `1px solid ${conf.border}`,
          color: conf.color,
          fontWeight: 600,
          fontSize: 12,
          cursor: 'default',
          ...style,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: conf.color,
            boxShadow: `0 0 6px ${conf.color}`,
          }}
        />
        <span>{displayLabel}</span>
      </Tag>
    </Tooltip>
  );
};

