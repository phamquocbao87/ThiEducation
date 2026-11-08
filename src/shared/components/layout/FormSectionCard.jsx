import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

/**
 * FormSectionCard — Standard Card component for form sections across ERP
 * Provides consistent styling, typography hierarchy, icon badges, and responsive padding.
 */
export const FormSectionCard = ({
  icon,
  iconColor = '#1890ff',
  title,
  subtitle,
  extra,
  children,
  style,
  bodyStyle,
  bordered = false,
  ...restProps
}) => {
  return (
    <Card
      bordered={bordered}
      style={{
        borderRadius: 14,
        marginBottom: 20,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        backgroundColor: '#ffffff',
        ...style,
      }}
      styles={{
        header: {
          padding: '16px 20px',
          borderBottom: '1px solid #f8fafc',
        },
        body: {
          padding: '20px 24px',
          ...bodyStyle,
        },
      }}
      title={
        title && (
          <Space align="center" size={10}>
            {icon && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor,
                  fontSize: 18,
                }}
              >
                {icon}
              </span>
            )}
            <div>
              <Text strong style={{ fontSize: 15, color: '#1e293b' }}>
                {title}
              </Text>
              {subtitle && (
                <Text
                  type="secondary"
                  style={{ display: 'block', fontSize: 12, fontWeight: 400, marginTop: 2 }}
                >
                  {subtitle}
                </Text>
              )}
            </div>
          </Space>
        )
      }
      extra={extra}
      {...restProps}
    >
      {children}
    </Card>
  );
};

