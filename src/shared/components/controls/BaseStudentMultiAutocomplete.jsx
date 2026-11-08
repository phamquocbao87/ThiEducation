import React, { useMemo } from 'react';
import { Select, Space, Avatar, Tag, Alert, Typography } from 'antd';
import { UserOutlined, WarningOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { findStudentScheduleConflicts } from '../../utils/scheduleUtils';

const { Option } = Select;
const { Text } = Typography;

/**
 * BaseStudentMultiAutocomplete — Multi-Student Autocomplete Selector with:
 * 1. Instant keyword search by Vietnamese name, English name, Student ID, or Parent Phone
 * 2. Real-time Student Timetable Conflict Detection & Warning Alert
 */
export const BaseStudentMultiAutocomplete = ({
  value = [],
  onChange,
  students = [],
  existingClasses = [],
  targetSchedule = '',
  excludeClassId = null,
  style,
}) => {
  const { isEnglish } = useLanguage();

  const studentConflictMap = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      map[s.id] = findStudentScheduleConflicts(
        s.id,
        targetSchedule,
        existingClasses,
        excludeClassId
      );
    });
    return map;
  }, [students, targetSchedule, existingClasses, excludeClassId]);

  const conflictingSelectedStudents = useMemo(() => {
    if (!Array.isArray(value) || value.length === 0) return [];
    return value
      .map((sId) => {
        const studentObj = students.find((s) => s.id === sId);
        const conflicts = studentConflictMap[sId] || [];
        return conflicts.length > 0
          ? { student: studentObj || { id: sId, name: sId }, conflicts }
          : null;
      })
      .filter(Boolean);
  }, [value, students, studentConflictMap]);

  return (
    <div className="lak-student-multi-autocomplete">
      <Select
        mode="multiple"
        showSearch
        allowClear
        value={Array.isArray(value) ? value : []}
        onChange={(vals) => onChange?.(vals)}
        placeholder={
          isEnglish
            ? 'Type student name, English nickname, or ID (HV001) to search & enroll...'
            : 'Gõ tên học viên, biệt danh tiếng Anh hoặc mã HV (HV001) để tìm và gán vào lớp...'
        }
        optionFilterProp="searchText"
        filterOption={(input, option) => {
          const searchStr = String(option?.searchText || '').toLowerCase();
          return searchStr.includes(input.toLowerCase().trim());
        }}
        maxTagCount="responsive"
        style={{ width: '100%', borderRadius: 8, ...style }}
      >
        {students.map((s) => {
          const conflicts = studentConflictMap[s.id] || [];
          const hasConflict = conflicts.length > 0;
          const searchText = `${s.id} ${s.name} ${s.englishName || ''} ${s.phone || ''} ${s.parentName || ''}`;

          return (
            <Option key={s.id} value={s.id} searchText={searchText}>
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
                    size={20}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: hasConflict ? '#faad14' : '#52c41a',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  {s.englishName && (
                    <span style={{ color: '#1890ff', fontSize: 12 }}>
                      ({s.englishName})
                    </span>
                  )}
                  <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                    {s.id}
                  </Tag>
                </Space>

                {hasConflict && (
                  <Tag
                    color="error"
                    icon={<WarningOutlined />}
                    style={{ margin: 0, fontSize: 11, borderRadius: 4, flexShrink: 0 }}
                  >
                    {isEnglish
                      ? `Timetable Conflict (${conflicts.map((c) => c.id).join(', ')})`
                      : `Trùng TKB (${conflicts.map((c) => c.id).join(', ')})`}
                  </Tag>
                )}
              </div>
            </Option>
          );
        })}
      </Select>

      {/* Cảnh báo tức thì nếu Học viên đang được chọn bị trùng Thời khóa biểu */}
      {conflictingSelectedStudents.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 8, borderRadius: 8, padding: '8px 12px' }}
          message={
            <Text strong style={{ color: '#d46b08', fontSize: 12 }}>
              {isEnglish
                ? `Student Timetable Conflict Warning (${conflictingSelectedStudents.length} student(s))`
                : `Cảnh báo trùng Thời khóa biểu học viên (${conflictingSelectedStudents.length} học viên)!`}
            </Text>
          }
          description={
            <div style={{ fontSize: 12, color: '#874d00', marginTop: 2 }}>
              {conflictingSelectedStudents.map(({ student, conflicts }) => (
                <div key={student.id}>
                  • <strong>{student.name}</strong> ({student.id}):{' '}
                  {isEnglish ? 'Overlaps with' : 'Đang học trùng giờ tại lớp'}{' '}
                  {conflicts.map((c) => `[${c.id} - ${c.schedule}]`).join(', ')}
                </div>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
};

