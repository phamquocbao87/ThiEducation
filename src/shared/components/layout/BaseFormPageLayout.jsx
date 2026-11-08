import React from 'react';
import { Breadcrumb, Button, Card, Typography, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Title, Text } = Typography;

/**
 * BaseFormPageLayout — Unified Page Layout for all Create / Edit / Detail Forms in ERP
 * Handles navigation breadcrumbs, standard hero title banner, responsive container, and loading states.
 */
export const BaseFormPageLayout = ({
  breadcrumbs,
  onBack,
  backText,
  icon,
  title,
  subtitle,
  headerActions,
  loading = false,
  maxWidth = 1320,
  children,
  style,
}) => {
  const { isEnglish } = useLanguage();

  return (
    <div
      className="lak-base-form-page-layout"
      style={{
        maxWidth,
        margin: '0 auto',
        padding: '0 8px 32px 8px',
        ...style,
      }}
    >
      {/* 1. Breadcrumbs Navigation & Header Actions Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size={10} wrap>
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ borderRadius: 8 }}
            >
              {backText || (isEnglish ? 'Back' : 'Quay Lại')}
            </Button>
          )}

          {breadcrumbs && Array.isArray(breadcrumbs) && (
            <Breadcrumb items={breadcrumbs} />
          )}
        </Space>

        {headerActions && (
          <div className="lak-form-header-actions" style={{ flexShrink: 0 }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* 2. Hero Title Banner */}
      {(title || subtitle) && (
        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            border: '1px solid #e0f2fe',
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {icon && (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              {title && (
                <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                  {title}
                </Title>
              )}
              {subtitle && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 13,
                    display: 'block',
                    marginTop: 2,
                    color: '#64748b',
                  }}
                >
                  {subtitle}
                </Text>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 3. Main Form Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

