import React, { useState, useEffect } from 'react';
import {
  Space,
  Tag,
  TimePicker,
  Row,
  Col,
  Typography,
  DatePicker,
  Button,
  Divider,
} from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  BellOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  DAY_OPTIONS,
  WEEKLY_DAY_PRESETS,
  TIME_SLOT_PRESETS,
  HOLIDAY_PRESETS,
  parseScheduleToStructured,
  formatStructuredSchedule,
  normalizeTimeStr,
} from '../../utils/scheduleUtils';

dayjs.extend(customParseFormat);

const { Text } = Typography;
const { CheckableTag } = Tag;

/**
 * BaseWeeklyScheduleControl — Recurring Alarm-style Weekly Schedule,
 * Exact-Minute TimePicker (e.g. 07:20, 19:10), Multi-Timezone Preview (VN GMT+7 / PH GMT+8) & Holiday Selector
 */
export const BaseWeeklyScheduleControl = ({
  value,
  onChange,
  scheduleData,
  onScheduleDataChange,
}) => {
  const { isEnglish } = useLanguage();

  const [state, setState] = useState(() =>
    parseScheduleToStructured(scheduleData || value)
  );
  const [customHolidayDate, setCustomHolidayDate] = useState(null);

  useEffect(() => {
    if (scheduleData && typeof scheduleData === 'object') {
      setState(parseScheduleToStructured(scheduleData));
    } else if (value) {
      setState((prev) => {
        const parsed = parseScheduleToStructured(value);
        return {
          ...parsed,
          holidays: prev.holidays?.length ? prev.holidays : parsed.holidays,
        };
      });
    }
  }, [value, scheduleData]);

  const emitUpdate = (nextState) => {
    const normalized = {
      ...nextState,
      startTime: normalizeTimeStr(nextState.startTime),
      endTime: normalizeTimeStr(nextState.endTime),
    };
    setState(normalized);
    const formattedStr = formatStructuredSchedule(normalized, isEnglish);
    if (typeof onChange === 'function') {
      onChange(formattedStr);
    }
    if (typeof onScheduleDataChange === 'function') {
      onScheduleDataChange({
        ...normalized,
        formatted: formattedStr,
      });
    }
  };

  const handleToggleDay = (dayVal) => {
    const exists = state.days.includes(dayVal);
    let nextDays = exists
      ? state.days.filter((d) => d !== dayVal)
      : [...state.days, dayVal];
    if (nextDays.length === 0) nextDays = [dayVal];
    emitUpdate({ ...state, days: nextDays });
  };

  const handleApplyDayPreset = (presetDays) => {
    emitUpdate({ ...state, days: [...presetDays] });
  };

  const handleApplyTimePreset = (startTime, endTime) => {
    emitUpdate({ ...state, startTime, endTime });
  };

  const handleToggleHolidayPreset = (holidayLabel) => {
    const current = state.holidays || [];
    const exists = current.includes(holidayLabel);
    const nextHolidays = exists
      ? current.filter((h) => h !== holidayLabel)
      : [...current, holidayLabel];
    emitUpdate({ ...state, holidays: nextHolidays });
  };

  const handleAddCustomHoliday = () => {
    if (!customHolidayDate) return;
    const dateStr = dayjs(customHolidayDate).format('DD/MM/YYYY');
    const label = isEnglish ? `Off: ${dateStr}` : `Nghỉ: ${dateStr}`;
    const current = state.holidays || [];
    if (!current.includes(label)) {
      emitUpdate({ ...state, holidays: [...current, label] });
    }
    setCustomHolidayDate(null);
  };

  const handleRemoveHoliday = (holidayLabel) => {
    const current = state.holidays || [];
    emitUpdate({
      ...state,
      holidays: current.filter((h) => h !== holidayLabel),
    });
  };

  const isDayPresetMatch = (presetDays) => {
    if (state.days.length !== presetDays.length) return false;
    return presetDays.every((d) => state.days.includes(d));
  };

  const formattedPreview = formatStructuredSchedule(state, isEnglish);

  const startDayjs = dayjs(normalizeTimeStr(state.startTime), 'HH:mm');
  const endDayjs = dayjs(normalizeTimeStr(state.endTime), 'HH:mm');

  return (
    <div
      className="lak-weekly-schedule-control"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '14px',
      }}
    >
      {/* 1. Thanh Preview Lịch Tuần Hoàn (Alarm Summary Banner) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 12,
        }}
      >
        <Space size={6}>
          <BellOutlined style={{ color: '#1890ff', fontSize: 15 }} />
          <Text strong style={{ color: '#1e3a8a', fontSize: 13 }}>
            {formattedPreview}
          </Text>
        </Space>
        <Tag color="blue" style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}>
          {state.days.length} {isEnglish ? 'sessions / week' : 'buổi / tuần'}
        </Tag>
      </div>

      {/* 2. Chọn Nhanh Cặp Thứ Phổ Biến */}
      <div style={{ marginBottom: 10 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
          {isEnglish ? 'Quick Weekly Patterns:' : 'Chọn nhanh cặp ngày học trong tuần:'}
        </Text>
        <Space size={[6, 6]} wrap>
          {WEEKLY_DAY_PRESETS.map((preset) => {
            const active = isDayPresetMatch(preset.days);
            return (
              <CheckableTag
                key={preset.key}
                checked={active}
                onChange={() => handleApplyDayPreset(preset.days)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  border: active ? '1px solid #1890ff' : '1px solid #cbd5e1',
                  background: active ? '#1890ff' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {isEnglish ? preset.labelEn : preset.labelVi}
              </CheckableTag>
            );
          })}
        </Space>
      </div>

      {/* 3. Nút Chọn Từng Thứ Trong Tuần Kiểu Đồng Hồ Báo Thức (7 Days Alarm Pills) */}
      <div style={{ marginBottom: 14 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
          {isEnglish
            ? 'Or tap individual days of the week (Alarm mode):'
            : 'Hoặc chạm chọn từng Thứ trong tuần (Kiểu lịch báo thức tuần hoàn):'}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
          }}
        >
          {DAY_OPTIONS.map((day) => {
            const selected = state.days.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => handleToggleDay(day.value)}
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: selected ? '1.5px solid #1890ff' : '1px solid #cbd5e1',
                  backgroundColor: selected ? '#1890ff' : '#ffffff',
                  color: selected ? '#ffffff' : '#334155',
                  fontWeight: selected ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {isEnglish ? day.shortEn : day.shortVi}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Chọn Ca Học & Khung Giờ Từng Phút (Start Time - End Time với TimePicker HH:mm minuteStep=1) */}
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {isEnglish ? 'Class Time Slot:' : 'Khung giờ ca học:'}
        </Text>
        <Space size={[6, 6]} wrap style={{ marginBottom: 10 }}>
          {TIME_SLOT_PRESETS.map((slot) => {
            const isSlotSelected =
              state.startTime === slot.startTime && state.endTime === slot.endTime;
            return (
              <CheckableTag
                key={slot.label}
                checked={isSlotSelected}
                onChange={() => handleApplyTimePreset(slot.startTime, slot.endTime)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  border: isSlotSelected ? '1px solid #722ed1' : '1px solid #cbd5e1',
                  background: isSlotSelected ? '#722ed1' : '#ffffff',
                  color: isSlotSelected ? '#ffffff' : '#475569',
                  fontWeight: isSlotSelected ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {slot.label}
              </CheckableTag>
            );
          })}
        </Space>

        <Row gutter={12}>
          <Col xs={12} sm={12}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
              {isEnglish ? 'Start Time' : 'Giờ vào lớp'}
            </div>
            <TimePicker
              className="lak-start-time-picker"
              value={startDayjs.isValid() ? startDayjs : dayjs('18:00', 'HH:mm')}
              format="HH:mm"
              minuteStep={1}
              showNow={false}
              needConfirm={false}
              allowClear={false}
              placeholder="HH:mm"
              onChange={(timeObj, timeStr) => {
                if (timeObj && timeObj.isValid()) {
                  emitUpdate({ ...state, startTime: timeObj.format('HH:mm') });
                } else if (timeStr) {
                  emitUpdate({ ...state, startTime: normalizeTimeStr(timeStr) });
                }
              }}
              style={{ width: '100%', height: 40, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={12}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
              {isEnglish ? 'End Time' : 'Giờ tan lớp'}
            </div>
            <TimePicker
              className="lak-end-time-picker"
              value={endDayjs.isValid() ? endDayjs : dayjs('19:30', 'HH:mm')}
              format="HH:mm"
              minuteStep={1}
              showNow={false}
              needConfirm={false}
              allowClear={false}
              placeholder="HH:mm"
              onChange={(timeObj, timeStr) => {
                if (timeObj && timeObj.isValid()) {
                  emitUpdate({ ...state, endTime: timeObj.format('HH:mm') });
                } else if (timeStr) {
                  emitUpdate({ ...state, endTime: normalizeTimeStr(timeStr) });
                }
              }}
              style={{ width: '100%', height: 40, borderRadius: 8 }}
            />
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* 5. Cấu Hình Ngày Nghỉ Lễ / Tết / Nghỉ Đột Xuất */}
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
          <CalendarOutlined style={{ marginRight: 4, color: '#fa8c16' }} />
          {isEnglish
            ? 'Auto-Skip Holidays & Off-Days (Tet, National Holidays, Custom Days):'
            : 'Thiết lập Ngày nghỉ Lễ / Tết (Tự động trừ khỏi lịch điểm danh tuần hoàn):'}
        </Text>

        <Space size={[6, 6]} wrap style={{ marginBottom: 10 }}>
          {HOLIDAY_PRESETS.map((hp) => {
            const label = isEnglish ? hp.labelEn : hp.labelVi;
            const checked =
              (state.holidays || []).includes(label) ||
              (state.holidays || []).includes(hp.labelVi);
            return (
              <CheckableTag
                key={hp.key}
                checked={checked}
                onChange={() =>
                  handleToggleHolidayPreset(
                    (state.holidays || []).includes(hp.labelVi) ? hp.labelVi : label
                  )
                }
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  border: checked ? '1px solid #fa8c16' : '1px solid #cbd5e1',
                  background: checked ? '#fff7e6' : '#ffffff',
                  color: checked ? '#d46b08' : '#475569',
                  fontWeight: checked ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                🎌 {label}
              </CheckableTag>
            );
          })}
        </Space>

        {/* Thêm ngày nghỉ cụ thể bằng DatePicker */}
        <Row gutter={8} align="middle">
          <Col xs={16} sm={16}>
            <DatePicker
              value={customHolidayDate}
              onChange={(d) => setCustomHolidayDate(d)}
              format={isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
              placeholder={
                isEnglish
                  ? 'Add custom off-date (MM/DD/YYYY)'
                  : 'Thêm ngày nghỉ đột xuất (DD/MM/YYYY)'
              }
              style={{ width: '100%', height: 38, borderRadius: 8 }}
            />
          </Col>
          <Col xs={8} sm={8}>
            <Button
              icon={<PlusOutlined />}
              onClick={handleAddCustomHoliday}
              style={{ width: '100%', height: 38, borderRadius: 8 }}
            >
              {isEnglish ? 'Add Off-Day' : 'Thêm Ngày Nghỉ'}
            </Button>
          </Col>
        </Row>

        {/* Danh sách các ngày nghỉ đang áp dụng */}
        {Array.isArray(state.holidays) && state.holidays.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Space size={[4, 4]} wrap>
              {state.holidays.map((h) => (
                <Tag
                  key={h}
                  color="orange"
                  closable
                  onClose={() => handleRemoveHoliday(h)}
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  {h}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};
