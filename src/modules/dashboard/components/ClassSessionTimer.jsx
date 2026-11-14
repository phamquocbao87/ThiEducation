import { ClockCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { formatTimerDuration } from '../utils/classSessionTimer';
import { ClassTimerService } from '../services/ClassTimerService';

export const ClassSessionTimer = ({ cls, now, isUrgent = false, style: customStyle = {} }) => {
  const { t } = useLanguage();
  const timer = ClassTimerService.getTimer(cls, now);
  if (!timer) return null;
  const duration = (value) => formatTimerDuration(value, t);

  const isLive = timer.state === 'live';
  const isStartingSoon =
    timer.state === 'upcoming' &&
    typeof timer.startsIn === 'number' &&
    timer.startsIn <= 1800; // Lớp còn 30 phút nữa bắt đầu (1800 giây)

  let pulseClass = '';
  if (isLive) {
    pulseClass = isUrgent ? 'lak-timer-pulse-live-red' : 'lak-timer-pulse-live-green';
  } else if (isStartingSoon) {
    pulseClass = 'lak-timer-pulse-upcoming';
  }

  const isPulsing = Boolean(pulseClass);

  return (
    <div
      data-testid="class-session-timer"
      data-state={timer.state}
      role="timer"
      aria-live="off"
      className={pulseClass}
      style={{
        marginBottom: 12,
        padding: '8px 10px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: isPulsing ? 600 : 500,
        fontVariantNumeric: 'tabular-nums',
        overflowWrap: 'anywhere',
        background: isLive
          ? (isUrgent ? '#fff2f0' : '#f6ffed')
          : (isStartingSoon ? '#e6f4ff' : '#f8fafc'),
        color: isLive
          ? (isUrgent ? '#cf1322' : '#237804')
          : (isStartingSoon ? '#0958d9' : '#334155'),
        border: isLive
          ? (isUrgent ? '1px solid #ffa39e' : '1px solid #b7eb8f')
          : (isStartingSoon ? '1px solid #91caff' : '1px solid #e2e8f0'),
        transition: 'all 0.25s ease',
        ...customStyle,
      }}
    >
      <ClockCircleOutlined
        className={isPulsing ? 'lak-heartbeat-icon' : ''}
        style={{
          marginRight: 6,
          color: isLive
            ? (isUrgent ? '#ff4d4f' : '#52c41a')
            : (isStartingSoon ? '#1890ff' : '#64748b'),
        }}
      />
      {timer.state === 'upcoming' ? (
        t('dashboard.classTimer.startsIn', { duration: duration(timer.startsIn) })
      ) : (
        <>
          <span>{t('dashboard.classTimer.elapsed', { duration: duration(timer.elapsed) })}</span>
          <span style={{ display: 'block' }}>
            {t('dashboard.classTimer.remaining', { duration: duration(timer.remaining) })}
          </span>
        </>
      )}
    </div>
  );
};
