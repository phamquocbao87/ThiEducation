import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * BaseSearchInput — Standard Search Input with 300ms Debounce and Clearable button
 */
export const BaseSearchInput = ({
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  placeholder,
  style,
  allowClear = true,
  ...restProps
}) => {
  const { isEnglish } = useLanguage();
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const timerRef = useRef(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e) => {
    const nextVal = e.target.value;
    setInternalValue(nextVal);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (typeof onChange === 'function') {
        onChange(nextVal);
      }
      if (typeof onSearch === 'function') {
        onSearch(nextVal);
      }
    }, debounceMs);
  };

  const defaultPlaceholder =
    placeholder ||
    (isEnglish
      ? 'Search by name, code, or keyword...'
      : 'Tìm kiếm theo tên, mã hoặc từ khóa...');

  return (
    <Input
      value={internalValue}
      onChange={handleChange}
      placeholder={defaultPlaceholder}
      prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
      allowClear={allowClear}
      style={{
        width: '100%',
        height: 40,
        borderRadius: 8,
        ...style,
      }}
      {...restProps}
    />
  );
};

