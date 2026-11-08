import React from 'react';
import { Select, Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Option } = Select;
const { Text } = Typography;

/**
 * BaseUserSelect — Standardized User / Teacher / Student selector
 * Renders avatar, full name, user ID, and badges.
 */
export const BaseUserSelect = ({
  users = [],
  value,
  onChange,
  mode,
  placeholder,
  style,
  allowClear = true,
  avatarBgColor = '#1890ff',
  ...restProps
}) => {
  const { isEnglish } = useLanguage();

  const defaultPlaceholder =
    placeholder ||
    (mode === 'multiple'
      ? (isEnglish ? 'Select users...' : 'Chọn danh sách người dùng...')
      : (isEnglish ? 'Select user...' : 'Chọn người dùng...'));

  return (
    <Select
      value={value}
      onChange={onChange}
      mode={mode}
      placeholder={defaultPlaceholder}
      allowClear={allowClear}
      maxTagCount="responsive"
      style={{
        width: '100%',
        minHeight: 40,
        borderRadius: 8,
        ...style,
      }}
      {...restProps}
    >
      {users.map((u) => {
        const id = u.id || u.code;
        const name = u.name || id;
        const subInfo = u.nationality || u.englishName || u.role;

        return (
          <Option key={id} value={id}>
            <Space align="center" size={8}>
              <Avatar
                size="small"
                src={u.avatarUrl}
                icon={!u.avatarUrl && <UserOutlined />}
                style={{ backgroundColor: avatarBgColor }}
              />
              <Text strong style={{ fontSize: 13 }}>
                {name}
              </Text>
              {id && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  ({id})
                </Text>
              )}
              {subInfo && (
                <span
                  style={{
                    fontSize: 11,
                    backgroundColor: '#f1f5f9',
                    padding: '1px 6px',
                    borderRadius: 4,
                    color: '#64748b',
                  }}
                >
                  {subInfo}
                </span>
              )}
            </Space>
          </Option>
        );
      })}
    </Select>
  );
};

