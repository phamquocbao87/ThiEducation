import React, { useState, useEffect } from 'react';
import { Slider, Tag, Space, Typography, Card } from 'antd';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

// Các nhóm tuổi chuẩn giáo trình ELA & Cambridge
const AGE_PRESETS = [
  { label: '3 - 5 tuổi (Mầm non / Pre-K)', range: [3, 5], key: '3-5' },
  { label: '4 - 6 tuổi (Wonders GK)', range: [4, 6], key: '4-6' },
  { label: '6 - 7 tuổi (Wonders G1)', range: [6, 7], key: '6-7' },
  { label: '7 - 8 tuổi (Wonders G2)', range: [7, 8], key: '7-8' },
  { label: '8 - 9 tuổi (Wonders G3)', range: [8, 9], key: '8-9' },
  { label: '9 - 10 tuổi (Wonders G4)', range: [9, 10], key: '9-10' },
  { label: '10 - 11 tuổi (Wonders G5)', range: [10, 11], key: '10-11' },
  { label: '11 - 15 tuổi (THCS / Junior)', range: [11, 15], key: '11-15' },
  { label: '12 - 16+ tuổi (IELTS / SAT)', range: [12, 16], key: '12-16' },
];

const SLIDER_MARKS = {
  3: '3 tuổi',
  6: '6t (Lớp 1)',
  10: '10t (Lớp 5)',
  15: '15t (Cấp 3)',
  18: '18+',
};

export const AgeRangePicker = ({ value, onChange }) => {
  const { isEnglish } = useLanguage();

  // Parse chuỗi đầu vào (VD: "9 - 10 tuổi" -> [9, 10])
  const parseRangeFromString = (str) => {
    if (!str) return [6, 10];
    const matches = String(str).match(/\d+/g);
    if (matches && matches.length >= 2) {
      const min = Math.max(3, Math.min(18, parseInt(matches[0], 10)));
      const max = Math.max(min, Math.min(18, parseInt(matches[1], 10)));
      return [min, max];
    }
    if (matches && matches.length === 1) {
      const val = Math.max(3, Math.min(18, parseInt(matches[0], 10)));
      return [val, val + 1];
    }
    return [6, 10];
  };

  const [currentRange, setCurrentRange] = useState(() => parseRangeFromString(value));

  useEffect(() => {
    if (value) {
      setCurrentRange(parseRangeFromString(value));
    }
  }, [value]);

  const triggerChange = (newRange) => {
    setCurrentRange(newRange);
    const formattedStr = isEnglish
      ? `${newRange[0]} - ${newRange[1]} years old`
      : `${newRange[0]} - ${newRange[1]} tuổi`;
    if (typeof onChange === 'function') {
      onChange(formattedStr);
    }
  };

  // Kiểm tra xem preset nào đang active
  const isPresetActive = (preset) => {
    return currentRange[0] === preset.range[0] && currentRange[1] === preset.range[1];
  };

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      {/* 1. Header hiển thị khoảng tuổi hiện tại */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {isEnglish ? 'Selected Age Span:' : 'Vùng tuổi áp dụng:'}
        </Text>
        <Tag
          color="#0284c7"
          style={{
            fontSize: 13,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 6,
            margin: 0,
          }}
        >
          👶 {currentRange[0]} - {currentRange[1]} {isEnglish ? 'years old' : 'tuổi'}
        </Tag>
      </div>

      {/* 2. Danh sách Preset Pills (Tick chọn nhanh theo chuẩn giáo trình) */}
      <div style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6 }}>
          {isEnglish ? 'Quick Presets (Click to select):' : 'Chọn nhanh vùng tuổi chuẩn (Click để áp dụng):'}
        </Text>
        <Space wrap size={[6, 6]}>
          {AGE_PRESETS.map((preset) => {
            const active = isPresetActive(preset);
            return (
              <Tag.CheckableTag
                key={preset.key}
                checked={active}
                onChange={() => triggerChange(preset.range)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? '#1890ff' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  border: active ? '1px solid #1890ff' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {preset.label}
              </Tag.CheckableTag>
            );
          })}
        </Space>
      </div>

      {/* 3. Range Slider 2 đầu trực quan */}
      <div style={{ padding: '0 8px 6px' }}>
        <Text style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
          {isEnglish ? 'Or drag slider to customize custom range:' : 'Hoặc kéo thanh trượt để tùy chỉnh khoảng tuổi tự do:'}
        </Text>
        <Slider
          range
          min={3}
          max={18}
          marks={SLIDER_MARKS}
          value={currentRange}
          onChange={(newVal) => triggerChange(newVal)}
          tooltip={{
            formatter: (val) => `${val} ${isEnglish ? 'years' : 'tuổi'}`,
          }}
        />
      </div>
    </div>
  );
};

