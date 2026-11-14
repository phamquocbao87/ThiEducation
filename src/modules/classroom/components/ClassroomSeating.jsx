import React from 'react';
import { Button, Card, Empty, Spin, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { StudentSeat } from './StudentSeat';

export const ClassroomSeating = ({
  students,
  presence,
  attentionFlags = {},
  quickNotes = {},
  studentEvaluations = {},
  teacherCheckIn = null,
  canEdit,
  canConfirmCheckIn = false,
  currentStudentId = null,
  pendingChanges = {},
  pendingAttentionChanges = {},
  isMarkAllPending = false,
  isCheckInPending = false,
  onMark,
  onMarkAttention,
  onOpenQuickNote,
  onRateStudent,
  onConfirmTeacherCheckIn,
  loading,
  teacherName,
}) => {
  const { t, language } = useLanguage();
  const isTeacherCheckedIn = teacherCheckIn?.status === 'CHECKED_IN';
  const checkInTime = isTeacherCheckedIn && teacherCheckIn.checkedInAt
    ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(teacherCheckIn.checkedInAt))
    : '';

  return (
    <Spin spinning={loading}>
      <Card className="classroom-teacher" data-testid="teacher-desk-card">
        <Typography.Title level={4} style={{ margin: 0, marginBottom: 4 }}>
          {t('classroom.teacherDesk')}
        </Typography.Title>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <Typography.Text strong style={{ fontSize: 15, color: '#0958d9' }}>
            {teacherName || t('classroom.unassigned')}
          </Typography.Text>
          {isTeacherCheckedIn ? (
            <Tag
              color="green"
              icon={<CheckCircleOutlined />}
              data-testid="teacher-checkedin-tag"
              style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}
            >
              {t('classroom.teacherCheckedIn', { time: checkInTime })}
            </Tag>
          ) : (
            <Tag color="default" data-testid="teacher-pending-tag" style={{ margin: 0, borderRadius: 6 }}>
              {t('classroom.teacherAwaitingCheckIn')}
            </Tag>
          )}
          {canConfirmCheckIn && !isTeacherCheckedIn && onConfirmTeacherCheckIn && (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<CheckOutlined />}
              loading={isCheckInPending}
              onClick={() => onConfirmTeacherCheckIn('ACADEMIC_CONFIRMED')}
              data-testid="confirm-teacher-checkin-btn"
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              {t('classroom.confirmTeacherPresent')}
            </Button>
          )}
        </div>
      </Card>
      {students.length ? (
        <div className="classroom-seat-grid">
          {students.map((student) => (
            <StudentSeat
              key={student.id}
              student={student}
              status={presence[student.id]}
              attention={attentionFlags[student.id]}
              quickNote={quickNotes[student.id]}
              evaluation={studentEvaluations[student.id]}
              isCurrentStudent={currentStudentId === student.id}
              canEdit={canEdit}
              isPending={Boolean(pendingChanges[student.id]) || isMarkAllPending}
              isAttentionPending={Boolean(pendingAttentionChanges[student.id])}
              onMark={onMark}
              onMarkAttention={onMarkAttention}
              onOpenQuickNote={onOpenQuickNote}
              onRateStudent={onRateStudent}
            />
          ))}
        </div>
      ) : (
        !loading && <Empty description={t('classroom.emptyRoster')} />
      )}
    </Spin>
  );
};
