import React, { useState, useEffect } from 'react';
import { Slider, Space, Tag, Typography } from 'antd';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;
const { CheckableTag } = Tag;

const DEFAULT_AGE_PRESETS = [
  { label: '3 - 5t', range: [3, 5] },
  { label: '4 - 6t', range: [4, 6] },
  { label: '6 - 7t', range: [6, 7] },
  { label: '7 - 8t', range: [7, 8] },
  { label: '8 - 9t', range: [8, 9] },
  { label: '9 - 10t', range: [9, 10] },
  { label: '10 - 11t', range: [10, 11] },
  { label: '11 - 15t', range: [11, 15] },
  { label: '12 - 16+t', range: [12, 18] },
];

/**
 * BaseRangeSelector — 2-tier Range Selector (Preset Pills + Dual Slider)
 * Supports standard presets and free-form continuous range adjustments.
 */
export const BaseRangeSelector = ({
  value,
  onChange,
  presets = DEFAULT_AGE_PRESETS,
  min = 3,
  max = 18,
  unitVi = 'tuổi',
  unitEn = 'years old',
  style,
}) => {
  const { isEnglish } = useLanguage();

  const parseValueToRange = (val) => {
    if (Array.isArray(val) && val.length === 2) return val;
    if (typeof val === 'string') {
      const nums = val.match(/\d+/g);
      if (nums && nums.length >= 2) {
        return [Number(nums[0]), Number(nums[1])];
      }
      if (nums && nums.length === 1) {
        return [Number(nums[0]), Number(nums[0]) + 1];
      }
    }
    return [6, 10];
  };

  const [range, setRange] = useState(() => parseValueToRange(value));

  useEffect(() => {
    if (value) {
      setRange(parseValueToRange(value));
    }
  }, [value]);

  const emitChange = (newRange) => {
    setRange(newRange);
    const unit = isEnglish ? unitEn : unitVi;
    const formatted = `${newRange[0]} - ${newRange[1]} ${unit}`;
    if (typeof onChange === 'function') {
      onChange(formatted);
    }
  };

  return (
    <div
      className="lak-base-range-selector"
      style={{
        background: '#f8fafc',
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        ...style,
      }}
    >
      {/* 1. Preset Pills */}
      <div style={{ marginBottom: 10 }}>
        <Space size={[4, 6]} wrap>
          {presets.map((p) => {
            const isSelected =
              range[0] === p.range[0] && range[1] === p.range[1];
            return (
              <CheckableTag
                key={p.label}
                checked={isSelected}
                onChange={() => emitChange(p.range)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  border: isSelected ? '1px solid #1890ff' : '1px solid #cbd5e1',
                  background: isSelected ? '#1890ff' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {p.label}
              </CheckableTag>
            );
          })}
        </Space>
      </div>

      {/* 2. Dual Range Slider */}
      <div style={{ padding: '0 6px' }}>
        <Slider
          range
          min={min}
          max={max}
          value={range}
          onChange={(newVal) => emitChange(newVal)}
          tooltip={{
            formatter: (v) => `${v} ${isEnglish ? unitEn : unitVi}`,
          }}
        />
      </div>

      {/* 3. Output display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {isEnglish ? 'Selected Range:' : 'Khoảng đã chọn:'}
        </Text>
        <Text strong style={{ color: '#1890ff', fontSize: 13 }}>
          {range[0]} - {range[1]} {isEnglish ? unitEn : unitVi}
        </Text>
      </div>
    </div>
  );
};

