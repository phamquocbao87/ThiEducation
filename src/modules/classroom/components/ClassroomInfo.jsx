import { Button, Descriptions, Space } from 'antd';
import { VideoCameraOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { formatTimerDuration, getSessionTimer } from '../../../shared/utils/classSessionUtils';
import { ZoomRoomLiveSection } from '../../../shared/components/ZoomRoomLiveSection';

export const ClassroomInfo = ({ cls, session, now, onOpenRoom, currentUser }) => {
  const { t, language } = useLanguage();
  const timer = getSessionTimer(session, now);
  const date = session ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(session.start) : t('classroom.noSession');
  const rawUrl = cls.zoomHostLink || cls.zoomStudentLink || cls.meetingLink;
  const url = (rawUrl || '').replace(/^:\s*/, '').trim();
  const safeUrl = /^https?:\/\//i.test(url || '') ? url : null;

  const isStudentRole = currentUser?.role === 'student' || (!currentUser?.role && currentUser?.id?.startsWith('HV'));
  const isRoomOpen = !isStudentRole || Boolean(
    timer && (timer.state === 'live' || (timer.state === 'upcoming' && timer.startsIn <= 600))
  );

  return <>
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
      <Descriptions.Item label={t('classroom.className')}>{cls.name}</Descriptions.Item>
      <Descriptions.Item label={t('classroom.teacher')}>{cls.teacherName || t('classroom.unassigned')}</Descriptions.Item>
      <Descriptions.Item label={t('classroom.session')}>{date}</Descriptions.Item>
      <Descriptions.Item label={t('classroom.schedule')}>{cls.schedule || t('classroom.noSession')}</Descriptions.Item>
      {cls.meetingId && <Descriptions.Item label={t('classroom.roomCode')}>{cls.meetingId}</Descriptions.Item>}
      {cls.passcode && <Descriptions.Item label={t('classroom.roomPassword')}>{cls.passcode}</Descriptions.Item>}
    </Descriptions>
    <ZoomRoomLiveSection cls={cls} role={currentUser?.role || 'academic'} style={{ marginTop: 12 }} />
    <Space wrap style={{ margin: '16px 0' }}>
      {timer && <span role="timer" aria-live="off">{timer.state === 'live'
        ? t('dashboard.classTimer.remaining', { duration: formatTimerDuration(timer.remaining, t) })
        : t('dashboard.classTimer.startsIn', { duration: formatTimerDuration(timer.startsIn, t) })}</span>}
      {safeUrl && (
        isRoomOpen ? (
          <Button
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            icon={<VideoCameraOutlined />}
            onClick={() => onOpenRoom?.()}
            data-testid="open-room-btn"
          >
            {t('classroom.openRoom')}
          </Button>
        ) : (
          <Button
            disabled
            icon={<ClockCircleOutlined />}
            data-testid="open-room-btn"
            style={{ borderRadius: 6, color: '#64748b' }}
            title={
              language === 'en'
                ? 'Online classroom will automatically open 10 minutes before class starts'
                : 'Phòng học trực tuyến sẽ tự động mở trước giờ học 10 phút'
            }
          >
            {language === 'en' ? '⏰ Opens 10m Before' : '⏰ Phòng Mở Trước 10 Phút'}
          </Button>
        )
      )}
    </Space>
  </>;
};
