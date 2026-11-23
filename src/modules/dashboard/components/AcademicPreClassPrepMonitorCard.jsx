import React, { useState, useMemo } from 'react';
import { Card, Tag, Button, Space, Typography, Badge, Empty, message } from 'antd';
import {
  ReadOutlined,
  BellOutlined,
  CheckOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import {
  PREP_STATUS,
  PreClassPrepReportService,
  formatHumanDuration,
  getPrepStatusMeta,
} from '../../lesson-reader';

const { Text } = Typography;

/**
 * AcademicPreClassPrepMonitorCard — Thẻ Preview Gọn (Tối Đa 2 Dòng) Trên `/dashboard` cho Giáo Vụ
 * - Chỉ thể hiện đúng 2 học viên ưu tiên đôn đốc nhất (chưa đọc -> đọc lướt) cùng tóm tắt tỷ lệ %.
 * - Bấm CTA `Xem Chi Tiết Toàn Trường →` hoặc bấm vào từng dòng để mở màn hình chuyên sâu `/pre-class-prep`.
 */
export const AcademicPreClassPrepMonitorCard = ({
  reportData = null,
  loading = false,
  currentUser = null,
  maxItems = 2,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [remindedMap, setRemindedMap] = useState({});
  const [sendingKey, setSendingKey] = useState(null);

  const classReports = reportData?.classReports || [];
  const plannedClasses = useMemo(
    () => classReports.filter((c) => c.hasLessonPlan && c.totalStudents > 0),
    [classReports]
  );

  // Gom toàn bộ học viên từ các lớp có giáo án và ưu tiên chưa đọc -> đọc lướt lên đầu
  const prioritizedStudents = useMemo(() => {
    const rows = [];
    plannedClasses.forEach((cls) => {
      (cls.students || []).forEach((st) => rows.push(st));
    });
    const order = {
      [PREP_STATUS.NOT_STARTED]: 0,
      [PREP_STATUS.SKIMMED]: 1,
      [PREP_STATUS.POST_READ]: 2,
      [PREP_STATUS.PREPARED]: 3,
    };
    rows.sort((a, b) => {
      const diff = (order[a.prepStatus] ?? 9) - (order[b.prepStatus] ?? 9);
      if (diff !== 0) return diff;
      return (a.conductScore || 0) - (b.conductScore || 0);
    });
    return rows;
  }, [plannedClasses]);

  if (!loading && plannedClasses.length === 0) {
    return null;
  }

  const limit = Math.min(2, Math.max(1, maxItems));
  const previewStudents = prioritizedStudents.slice(0, limit);
  const remainingCount = Math.max(0, prioritizedStudents.length - previewStudents.length);
  const summary = reportData?.summary || {};

  const handleSendReminder = async (e, studentRow) => {
    e.stopPropagation();
    const key = `${studentRow.classId}_${studentRow.studentId}`;
    setSendingKey(key);
    try {
      await PreClassPrepReportService.sendPreClassPrepReminder({
        studentId: studentRow.studentId,
        studentName: studentRow.studentName,
        classId: studentRow.classId,
        className: studentRow.className,
        sessionIndex: studentRow.sessionIndex,
        senderUser: currentUser,
        isEnglish,
      });
      setRemindedMap((prev) => ({ ...prev, [key]: true }));
      message.success(
        isEnglish
          ? `Pre-class reading reminder sent to ${studentRow.studentName}!`
          : `Đã gửi thông báo nhắc đọc bài tới học viên ${studentRow.studentName}!`
      );
    } catch (err) {
      message.error(err?.message || 'Lỗi gửi thông báo nhắc đọc bài');
    } finally {
      setSendingKey(null);
    }
  };

  return (
    <Card
      loading={loading}
      bordered={false}
      style={{
        marginBottom: isMobile ? 12 : 20,
        borderRadius: 12,
        borderLeft: '4px solid #7e22ce',
        backgroundColor: '#faf5ff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: isMobile ? '12px 14px' : '14px 18px' } }}
      data-testid="academic-pre-class-prep-monitor-card"
    >
      {/* Header gọn + Nút điều hướng vào màn hình chuyên sâu /pre-class-prep */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Space size={10} align="start">
          <Badge count={summary.totalNotStarted || 0} overflowCount={99} color="#dc2626">
            <ReadOutlined style={{ color: '#7e22ce', fontSize: 18, marginTop: 2 }} />
          </Badge>
          <div>
            <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#3b0764', display: 'block', lineHeight: 1.35 }}>
              {isEnglish
                ? `Academic Monitor: Pre-Class Preparation (${summary.overallReadinessRate || 0}% Ready)`
                : `Giáo Vụ Giám Sát: Chuẩn Bị Bài Trước Giờ Học Toàn Trường (Đạt ${summary.overallReadinessRate || 0}%)`}
            </Text>
            <Space size={6} wrap style={{ marginTop: 4 }}>
              <Tag color="success" style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                🟢 {summary.totalPrepared || 0} {isEnglish ? 'Prepared' : 'Đã đọc tốt'}
              </Tag>
              <Tag color="warning" style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                🟡 {summary.totalSkimmed || 0} {isEnglish ? 'Skimmed' : 'Đọc lướt'}
              </Tag>
              <Tag color="error" style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                🔴 {summary.totalNotStarted || 0} {isEnglish ? 'Not Read' : 'Chưa đọc'}
              </Tag>
              {(summary.totalOpenQuestions || 0) > 0 && (
                <Tag color="processing" icon={<QuestionCircleOutlined />} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {summary.totalOpenQuestions} Q&A
                </Tag>
              )}
            </Space>
          </div>
        </Space>

        <Button
          type="primary"
          size="small"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          onClick={() => navigate('/pre-class-prep')}
          data-testid="btn-academic-view-all-prep"
          style={{
            backgroundColor: '#7e22ce',
            borderColor: '#7e22ce',
            borderRadius: 8,
            fontWeight: 700,
            minHeight: 34,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {isEnglish
            ? `Open Full Monitor (${prioritizedStudents.length})`
            : `Xem Chi Tiết Toàn Trường (${prioritizedStudents.length})`}
        </Button>
      </div>

      {/* Chỉ hiển thị đúng 2 dòng học viên ưu tiên nhất ngoài Dashboard */}
      {previewStudents.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            isEnglish
              ? 'All monitored students have prepared their lessons!'
              : 'Tuyệt vời! Toàn bộ học viên đã chuẩn bị bài tốt.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {previewStudents.map((st) => {
            const meta = getPrepStatusMeta(st.prepStatus, isEnglish);
            const rowKey = `${st.classId}_${st.studentId}`;
            const isReminded = Boolean(remindedMap[rowKey]);
            const detailUrl = `/pre-class-prep?classId=${encodeURIComponent(st.classId)}&status=${encodeURIComponent(st.prepStatus)}`;

            return (
              <div
                key={rowKey}
                role="button"
                tabIndex={0}
                onClick={() => navigate(detailUrl)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(detailUrl);
                  }
                }}
                data-testid={`academic-prep-student-row-${st.studentId}`}
                style={{
                  cursor: 'pointer',
                  padding: isMobile ? '10px 12px' : '10px 14px',
                  backgroundColor: '#ffffff',
                  borderRadius: 10,
                  border: `1px solid ${st.prepStatus === PREP_STATUS.NOT_STARTED ? '#fecaca' : '#e9d5ff'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'stretch' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Tag color="purple" style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                      {st.classId} • {isEnglish ? `S${st.sessionIndex}` : `Buổi ${st.sessionIndex}`}
                    </Tag>
                    <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                      {st.studentName}
                    </Text>
                    {st.englishName && (
                      <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>
                        {st.englishName}
                      </Tag>
                    )}
                    <Tag
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: meta.bg,
                        borderColor: meta.border,
                        color: meta.textColor,
                      }}
                    >
                      {meta.icon} {meta.label}
                    </Tag>
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <span>
                      ⏱ {formatHumanDuration(st.preClassActiveSeconds, isEnglish)} /{' '}
                      {formatHumanDuration(st.minRequiredSeconds, isEnglish)} ({st.maxScrollPercent}%)
                    </span>
                    {(st.materialsTotalCount || 0) > 0 && (
                      <span style={{ color: '#6b21a8', fontWeight: 600 }}>
                        📎 {isEnglish ? 'Materials:' : 'Tài liệu:'} {st.materialsCompletedCount || 0}/{st.materialsTotalCount}
                        {(st.materialActiveSeconds || 0) > 0
                          ? ` (${formatHumanDuration(st.materialActiveSeconds, isEnglish)})`
                          : ''}
                      </span>
                    )}
                    <span>
                      🏅 {isEnglish ? 'Conduct:' : 'Rèn luyện:'} <Text strong>{st.conductScore}/100</Text>
                    </span>
                    {(st.parentName || st.parentPhone) && (
                      <span style={{ color: '#0369a1', fontWeight: 600 }} data-testid={`academic-parent-contact-${st.studentId}`}>
                        <PhoneOutlined /> {st.parentName ? `${st.parentName}: ` : ''}
                        {st.parentPhone || '—'}
                      </span>
                    )}
                  </div>
                </div>

                {st.prepStatus !== PREP_STATUS.PREPARED && (
                  <Button
                    type={isReminded ? 'default' : 'primary'}
                    icon={isReminded ? <CheckOutlined /> : <BellOutlined />}
                    disabled={isReminded}
                    loading={sendingKey === rowKey}
                    onClick={(e) => handleSendReminder(e, st)}
                    data-testid={`btn-academic-remind-${st.studentId}`}
                    style={{
                      backgroundColor: isReminded ? '#f0fdf4' : '#7e22ce',
                      borderColor: isReminded ? '#86efac' : '#7e22ce',
                      color: isReminded ? '#15803d' : '#ffffff',
                      fontWeight: 700,
                      borderRadius: 8,
                      minHeight: 36,
                      width: isMobile ? '100%' : 'auto',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isReminded
                      ? isEnglish
                        ? 'Reminder Sent'
                        : 'Đã Gửi Nhắc Nhở'
                      : isEnglish
                      ? 'Remind Student'
                      : 'Gửi Nhắc Đọc Bài'}
                  </Button>
                )}
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div style={{ textAlign: 'right', marginTop: 2 }}>
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/pre-class-prep')}
                data-testid="link-academic-prep-remaining"
                style={{ padding: 0, fontWeight: 700, color: '#7e22ce', fontSize: 12 }}
              >
                {isEnglish
                  ? `+${remainingCount} more students — Open full monitor & filters →`
                  : `+${remainingCount} học viên khác — Mở màn hình giám sát chi tiết & bộ lọc →`}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AcademicPreClassPrepMonitorCard;
