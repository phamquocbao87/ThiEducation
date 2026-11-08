import React from 'react';
import { InputNumber } from 'antd';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * BaseCurrencyInput — Standard Currency & Numeric Input for ERP
 * Automatically formats thousands with dots/commas and currency symbol (VNĐ / USD)
 * Disallows negative values by default.
 */
export const BaseCurrencyInput = ({
  value,
  onChange,
  currency = 'VND',
  min = 0,
  max,
  placeholder,
  style,
  ...restProps
}) => {
  const { isEnglish } = useLanguage();

  const formatter = (val) => {
    if (!val) return '';
    const formatted = `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return currency === 'VND' ? `${formatted} ₫` : `$ ${formatted}`;
  };

  const parser = (val) => {
    if (!val) return '';
    return val.replace(/\D/g, '');
  };

  const defaultPlaceholder =
    placeholder || (isEnglish ? 'Enter amount...' : 'Nhập số tiền...');

  return (
    <InputNumber
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      formatter={formatter}
      parser={parser}
      placeholder={defaultPlaceholder}
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

