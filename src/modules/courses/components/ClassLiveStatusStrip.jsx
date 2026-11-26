import React, { useMemo } from 'react';
import { Progress } from 'antd';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassSessionTimer } from '../../dashboard/components/ClassSessionTimer';
import { ClassAttendanceSummary } from '../../../shared/components/ClassAttendanceSummary';
import { ZoomRoomLiveSection } from '../../../shared/components/ZoomRoomLiveSection';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';

/**
 * ClassLiveStatusStrip — Khối Đồng Bộ Ngôn Ngữ Thiết Kế Giữa `/dashboard` (`ClassLiveCard`) & `/courses-classes`
 * Hiển thị phân tách chặt chẽ theo Vai Trò (Role-Aware View):
 * - Admin / Director / Academic / Teacher: Đồng hồ đếm ngược Live + Tóm tắt điểm danh tức thì + Thanh tiến độ số buổi đã học.
 * - Student (Người học): Đồng hồ đếm ngược ca học + Thanh tiến độ khóa học (ẨN 100% thống kê điểm danh nội bộ lớp).
 */
export const ClassLiveStatusStrip = ({
  cls,
  course = null,
  now,
  role = 'academic',
  isUrgent = false,
  isStudentEnrolled = false,
}) => {
  const { isEnglish } = useLanguage();
  const normalizedRole = String(role || 'academic').toLowerCase();
  const isStudent = normalizedRole === 'student';
  const showAttendanceSummary = !isStudent; // Chỉ GV & Quản trị thấy tóm tắt điểm danh nội bộ lớp
  const showTimer = !isStudent || isStudentEnrolled;

  // Tính toán số buổi đã học trên tổng số buổi của lớp (chuẩn SPEC-08: mặc định 12 buổi)
  const totalSessions =
    Number(cls?.totalSessions) ||
    Number(cls?.courseTotalSessions) ||
    Number(course?.totalSessions) ||
    12;

  const sessions = useMemo(() => {
    if (!cls) return [];
    return generateClassSessionDates(cls, totalSessions, isEnglish);
  }, [cls, totalSessions, isEnglish]);

  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.endMs <= now).length;
  }, [sessions, now]);

  const progressPercent = Math.min(100, Math.round((completedSessions / Math.max(1, totalSessions)) * 100));

  return (
    <div data-testid={`class-live-strip-${cls?.id}`} style={{ marginBottom: 10 }}>
      {/* 1. Đồng hồ đếm ngược / Đang diễn ra (Đồng bộ 100% với Dashboard) */}
      {showTimer && (
        <ClassSessionTimer
          cls={cls}
          now={now}
          isUrgent={!isStudent && isUrgent}
          style={{ marginBottom: 8, padding: '6px 10px', fontSize: 12 }}
        />
      )}

      {/* 2. Tóm tắt điểm danh tức thì (CHỈ hiển thị cho Giáo viên, Giáo vụ, Giám đốc, Admin — Ẩn với Học viên) */}
      {showAttendanceSummary && <ClassAttendanceSummary cls={cls} now={now} />}

      {/* 2.5. Section Thông tin Live từ Phòng Zoom (Chỉ hiện khi lớp đã liên kết với Zoom) */}
      <ZoomRoomLiveSection cls={cls} role={normalizedRole} />

      {/* 3. Thanh tiến độ số buổi đã học (Đồng bộ với ClassLiveCard trên Dashboard) */}
      <div
        data-testid={`courses-class-progress-${cls?.id}`}
        style={{
          marginTop: 4,
          padding: '6px 10px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, gap: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            {isStudent
              ? isEnglish
                ? 'My Course Progress:'
                : 'Tiến độ khóa học:'
              : isEnglish
              ? 'Sessions Completed:'
              : 'Số buổi đã học:'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0958d9', whiteSpace: 'nowrap' }}>
            {completedSessions}/{totalSessions} {isEnglish ? 'sessions' : 'buổi'} ({progressPercent}%)
          </span>
        </div>
        <Progress
          percent={progressPercent}
          size="small"
          strokeColor={isStudent ? '#7e22ce' : '#1890ff'}
          showInfo={false}
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
};

export default ClassLiveStatusStrip;
