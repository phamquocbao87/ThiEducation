import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, Grid } from 'antd';
import { SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;
const { useBreakpoint } = Grid;

/**
 * FormActionBar — Smart Responsive Action Bar
 * - Desktop (>= 768px): Elegant, right-aligned action bar at the natural end of the form.
 * - Mobile (< 768px): Sticky floating action bar pinned to the bottom of the viewport with 44px touch targets.
 */
export const FormActionBar = ({
  onCancel,
  onSubmit,
  loading = false,
  cancelText,
  submitText,
  submitIcon = <SaveOutlined />,
  cancelIcon,
  noteText,
  extraButtons,
  isStickyMobile = true,
  style,
}) => {
  const { isEnglish } = useLanguage();
  const screens = useBreakpoint();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const defaultCancel = cancelText || (isEnglish ? 'Cancel' : 'Hủy & Quay Lại');
  const defaultSubmit = submitText || (isEnglish ? 'Save Changes' : 'Lưu Thay Đổi');

  // Mobile Sticky Bottom Bar Layout
  if (isMobile && isStickyMobile) {
    return (
      <div
        className="lak-mobile-sticky-action-bar"
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
          padding: '10px 8px',
          display: 'flex',
          gap: 8,
          width: '100%',
          boxSizing: 'border-box',
          marginTop: 20,
          ...style,
        }}
      >
        {onCancel && (
          <Button
            size="large"
            icon={cancelIcon}
            onClick={onCancel}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 42,
              padding: '4px 8px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {defaultCancel}
          </Button>
        )}

        {extraButtons}

        <Button
          type="primary"
          size="large"
          icon={submitIcon}
          loading={loading}
          onClick={onSubmit}
          style={{
            flex: onCancel ? 1.4 : 1,
            minWidth: 0,
            minHeight: 42,
            padding: '4px 10px',
            borderRadius: 8,
            backgroundColor: '#1890ff',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {defaultSubmit}
        </Button>
      </div>
    );
  }

  // Desktop Standard Action Bar Layout — Clean & Borderless (Zero Orphaned Card)
  return (
    <div
      className="lak-desktop-action-bar"
      style={{
        display: 'flex',
        justifyContent: noteText ? 'space-between' : 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        padding: '12px 0',
        marginTop: 20,
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        ...style,
      }}
    >
      {noteText && (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {noteText}
        </Text>
      )}

      <Space size={12}>
        {onCancel && (
          <Button
            size="large"
            icon={cancelIcon}
            onClick={onCancel}
            style={{ borderRadius: 8, minWidth: 100, height: 40 }}
          >
            {defaultCancel}
          </Button>
        )}

        {extraButtons}

        <Button
          type="primary"
          size="large"
          icon={submitIcon}
          loading={loading}
          onClick={onSubmit}
          style={{
            borderRadius: 8,
            minWidth: 160,
            height: 40,
            backgroundColor: '#1890ff',
            boxShadow: '0 3px 8px rgba(24, 144, 255, 0.3)',
            fontWeight: 600,
          }}
        >
          {defaultSubmit}
        </Button>
      </Space>
    </div>
  );
};

