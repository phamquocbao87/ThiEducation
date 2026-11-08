import React, { useMemo } from 'react';
import { DatePicker } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLanguage } from '../../../core/context/LanguageContext';

dayjs.extend(customParseFormat);

const parseToDayjs = (val) => {
  if (!val) return null;
  if (dayjs.isDayjs(val)) return val.isValid() ? val : null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'D/M/YYYY'];
    for (const fmt of formats) {
      const parsed = dayjs(trimmed, fmt, true);
      if (parsed.isValid()) return parsed;
    }
    const fallback = dayjs(trimmed);
    if (fallback.isValid()) return fallback;
  }
  return null;
};

/**
 * BaseDatePicker — Standard Bilingual DatePicker for ERP
 * - When English: US display format 'MM/DD/YYYY' & placeholder 'MM/DD/YYYY'
 * - When Vietnamese: VN display format 'DD/MM/YYYY' & placeholder 'DD/MM/YYYY'
 * - Safely accepts string ('DD/MM/YYYY' / 'YYYY-MM-DD') or dayjs objects and emits 'DD/MM/YYYY' string by default.
 */
export const BaseDatePicker = ({
  value,
  onChange,
  placeholder,
  format,
  style,
  allowClear = true,
  emitString = true,
  ...restProps
}) => {
  const { isEnglish } = useLanguage();

  const standardFormat =
    format ||
    (isEnglish
      ? ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
      : ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']);

  const standardPlaceholder =
    placeholder || (isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY');

  const dayjsValue = useMemo(() => parseToDayjs(value), [value]);

  const handleChange = (dateObj, dateString) => {
    if (!onChange) return;
    if (emitString) {
      onChange(dateObj && dateObj.isValid() ? dateObj.format('DD/MM/YYYY') : '');
    } else {
      onChange(dateObj, dateString);
    }
  };

  return (
    <DatePicker
      value={dayjsValue}
      onChange={handleChange}
      format={standardFormat}
      placeholder={standardPlaceholder}
      suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
      style={{
        width: '100%',
        height: 40,
        borderRadius: 8,
        ...style,
      }}
      allowClear={allowClear}
      {...restProps}
    />
  );
};
