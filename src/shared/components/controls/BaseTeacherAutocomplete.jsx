import React, { useMemo } from 'react';
import { Select, Space, Avatar, Tag, Alert, Typography } from 'antd';
import { UserOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { findTeacherScheduleConflicts } from '../../utils/scheduleUtils';
import { matchLikeSearch } from '../../utils/searchUtils';

const { Option } = Select;
const { Text } = Typography;

/**
 * BaseTeacherAutocomplete — Autocomplete Native Teacher Selector with:
 * 1. Instant keyword search (Name, ID, Nationality, Specialty)
 * 2. Optional / Unassigned state (Allows leaving empty so teachers can self-register)
 * 3. Real-time Schedule Conflict Detection & Warning Alert
 */
export const BaseTeacherAutocomplete = ({
  value,
  onChange,
  teachers = [],
  existingClasses = [],
  targetSchedule = '',
  excludeClassId = null,
  style,
}) => {
  const { isEnglish } = useLanguage();

  // Map conflict status for all teachers based on current targetSchedule
  const teacherConflictMap = useMemo(() => {
    const map = {};
    teachers.forEach((t) => {
      map[t.id] = findTeacherScheduleConflicts(
        t.id,
        targetSchedule,
        existingClasses,
        excludeClassId
      );
    });
    return map;
  }, [teachers, targetSchedule, existingClasses, excludeClassId]);

  const selectedTeacherConflicts = useMemo(() => {
    if (!value) return [];
    return teacherConflictMap[value] || [];
  }, [value, teacherConflictMap]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === value),
    [teachers, value]
  );

  return (
    <div className="lak-teacher-autocomplete">
      <Select
        showSearch
        allowClear
        value={value || undefined}
        onChange={(val) => onChange?.(val || '')}
        placeholder={
          isEnglish
            ? 'Type teacher name/ID to search, or leave empty for open registration...'
            : 'Gõ tên/mã GV để tìm kiếm, hoặc để trống cho GV tự đăng ký dạy...'
        }
        optionFilterProp="searchText"
        filterOption={(input, option) =>
          matchLikeSearch(option?.searchText || '', input)
        }
        style={{ width: '100%', height: 40, borderRadius: 8, ...style }}
      >
        <Option
          key="__UNASSIGNED__"
          value=""
          searchText="chua phan cong chua co gv unassigned open for registration"
        >
          <Space>
            <Tag color="orange" style={{ margin: 0, borderRadius: 6 }}>
              {isEnglish ? 'Open Slot' : 'Để trống'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {isEnglish
                ? 'Unassigned — Allow Teachers to Self-Register (Academic Approval)'
                : 'Chưa phân công — Mở cho Giáo viên đăng ký dạy (Giáo vụ duyệt)'}
            </Text>
          </Space>
        </Option>

        {teachers.map((t) => {
          const conflicts = teacherConflictMap[t.id] || [];
          const hasConflict = conflicts.length > 0;
          const searchText = `${t.id} ${t.name} ${t.nationality || ''} ${t.specialty || ''}`;

          return (
            <Option key={t.id} value={t.id} searchText={searchText}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: 8,
                }}
              >
                <Space size={6} style={{ overflow: 'hidden' }}>
                  <Avatar
                    size={22}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: hasConflict ? '#faad14' : '#1890ff',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    ({t.id} • {t.nationality || 'Native'})
                  </span>
                </Space>

                {hasConflict ? (
                  <Tag
                    color="error"
                    icon={<WarningOutlined />}
                    style={{ margin: 0, fontSize: 11, borderRadius: 4, flexShrink: 0 }}
                  >
                    {isEnglish
                      ? `Conflict (${conflicts.map((c) => c.id).join(', ')})`
                      : `Trùng lịch (${conflicts.map((c) => c.id).join(', ')})`}
                  </Tag>
                ) : (
                  <Tag
                    color="success"
                    icon={<CheckCircleOutlined />}
                    style={{ margin: 0, fontSize: 11, borderRadius: 4, flexShrink: 0 }}
                  >
                    {isEnglish ? 'Available' : 'Lịch trống'}
                  </Tag>
                )}
              </div>
            </Option>
          );
        })}
      </Select>

      {/* Cảnh báo tức thì nếu Giáo viên đang chọn bị trùng lịch dạy */}
      {selectedTeacherConflicts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 8, borderRadius: 8, padding: '8px 12px' }}
          message={
            <Text strong style={{ color: '#d46b08', fontSize: 12 }}>
              {isEnglish
                ? `Schedule Conflict Detected for ${selectedTeacher?.name || value}!`
                : `Cảnh báo trùng lịch dạy của GV ${selectedTeacher?.name || value}!`}
            </Text>
          }
          description={
            <div style={{ fontSize: 12, color: '#874d00', marginTop: 2 }}>
              {selectedTeacherConflicts.map((c) => (
                <div key={c.id}>
                  • {isEnglish ? 'Overlaps with class' : 'Trùng giờ với lớp'}{' '}
                  <strong>
                    [{c.id}] {c.name}
                  </strong>{' '}
                  — <span>{c.schedule}</span>
                </div>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
};

