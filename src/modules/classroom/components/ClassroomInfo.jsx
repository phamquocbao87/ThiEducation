import { Button, Descriptions, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { formatTimerDuration, getSessionTimer } from '../../../shared/utils/classSessionUtils';

export const ClassroomInfo = ({ cls, session, now, onOpenRoom }) => {
  const { t, language } = useLanguage();
  const timer = getSessionTimer(session, now);
  const date = session ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(session.start) : t('classroom.noSession');
  const url = cls.zoomHostLink || cls.zoomStudentLink || cls.meetingLink;
  const safeUrl = /^https?:\/\//i.test(url || '') ? url : null;
  return <>
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
      <Descriptions.Item label={t('classroom.className')}>{cls.name}</Descriptions.Item>
      <Descriptions.Item label={t('classroom.teacher')}>{cls.teacherName || t('classroom.unassigned')}</Descriptions.Item>
      <Descriptions.Item label={t('classroom.session')}>{date}</Descriptions.Item>
      <Descriptions.Item label={t('classroom.schedule')}>{cls.schedule || t('classroom.noSession')}</Descriptions.Item>
      {cls.meetingId && <Descriptions.Item label={t('classroom.roomCode')}>{cls.meetingId}</Descriptions.Item>}
      {cls.passcode && <Descriptions.Item label={t('classroom.roomPassword')}>{cls.passcode}</Descriptions.Item>}
    </Descriptions>
    <Space wrap style={{ margin: '16px 0' }}>
      {timer && <span role="timer" aria-live="off">{timer.state === 'live'
        ? t('dashboard.classTimer.remaining', { duration: formatTimerDuration(timer.remaining, t) })
        : t('dashboard.classTimer.startsIn', { duration: formatTimerDuration(timer.startsIn, t) })}</span>}
      {safeUrl && (
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
      )}
    </Space>
  </>;
};
