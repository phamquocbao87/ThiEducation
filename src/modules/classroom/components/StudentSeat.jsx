import React from 'react';
import { Avatar, Badge, Button, Card, Rate, Tag, Tooltip, Typography } from 'antd';
import { AlertOutlined, DesktopOutlined, EditOutlined, MessageOutlined, StarFilled, UserOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ATTENTION_STATUS, PRESENCE } from '../models/classroom.model';

const colors = { ONLINE: '#389e0d', OFFLINE: '#cf1322', UNMARKED: '#8c8c8c' };

export const StudentSeat = React.memo(({
  student,
  status = PRESENCE.UNMARKED,
  attention = ATTENTION_STATUS.FOCUSED,
  quickNote,
  evaluation,
  isCurrentStudent = false,
  canEdit,
  isPending = false,
  isAttentionPending = false,
  onMark,
  onMarkAttention,
  onOpenQuickNote,
  onRateStudent,
}) => {
  const { t } = useLanguage();
  const isDistracted = status === PRESENCE.ONLINE && attention === ATTENTION_STATUS.DISTRACTED;
  const borderColor = isCurrentStudent ? '#52c41a' : isDistracted ? '#fa8c16' : colors[status];
  const deskColor = isDistracted ? '#fa8c16' : colors[status];
  const cleanPhone = String(student.parentPhone || student.phone || '').trim().replace(/[\s\-().]/g, '');

  // Tên tiếng Anh làm chủ đạo, tên tiếng Việt làm phụ chú
  const primaryName = student.englishName || student.name || student.id;
  const secondaryName = student.englishName && student.name !== student.englishName ? student.name : '';
  const avatarLetter = (primaryName || 'S').slice(0, 1).toUpperCase();
  const fullTitle = secondaryName ? `${primaryName} (${secondaryName})` : primaryName;

  const hasNote = Boolean(quickNote?.text || quickNote?.tags?.length);
  const currentStars = evaluation?.stars || (isDistracted ? 3 : 5);

  return (
    <Card
      className={`classroom-seat ${isDistracted ? 'classroom-seat-distracted' : ''}`}
      data-testid={`seat-${student.id}`}
      style={{
        borderColor,
        boxShadow: isCurrentStudent ? '0 0 0 2px rgba(82, 196, 26, 0.4)' : isDistracted ? '0 0 0 2px rgba(250, 140, 22, 0.25)' : undefined,
      }}
    >
      <div className="classroom-seat-person">
        <Badge dot color={deskColor} offset={[-5, 5]}>
          <Avatar
            size={64}
            src={student.avatar || undefined}
            icon={!primaryName ? <UserOutlined /> : undefined}
            style={{
              backgroundColor: isDistracted ? '#fa8c16' : '#1890ff',
              fontSize: 24,
              fontWeight: 700,
              transition: 'background-color 0.2s ease',
            }}
          >
            {avatarLetter}
          </Avatar>
        </Badge>
        <div className="classroom-seat-name-box" title={fullTitle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Typography.Text strong className="classroom-seat-primary-name" data-testid={`primary-name-${student.id}`}>
              {primaryName}
            </Typography.Text>
            {isCurrentStudent && (
              <Tag color="gold" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px', margin: 0 }}>
                {t('classroom.yourSeat') || 'Ghế của con'}
              </Tag>
            )}
          </div>
          {secondaryName && (
            <Typography.Text type="secondary" className="classroom-seat-secondary-name" data-testid={`secondary-name-${student.id}`}>
              {secondaryName}
            </Typography.Text>
          )}
        </div>
        {isDistracted ? (
          <Tag color="orange" icon={<AlertOutlined />}>
            {t('classroom.distracted')}
          </Tag>
        ) : (
          <Tag color={status === 'ONLINE' ? 'green' : status === 'OFFLINE' ? 'red' : 'default'}>
            {t(`classroom.${status}`)}
          </Tag>
        )}
      </div>

      <div className="classroom-desk" aria-hidden="true">
        <DesktopOutlined style={{ fontSize: 42, color: deskColor, transition: 'color 0.2s ease' }} />
        <div />
      </div>

      {/* Participation Stars & In-Class Quick Note Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', minHeight: 28, marginBottom: 6 }}>
        {status === PRESENCE.ONLINE ? (
          <Rate
            style={{ fontSize: 13 }}
            disabled={!canEdit}
            value={currentStars}
            onChange={(val) => onRateStudent?.(student.id, val)}
            character={<StarFilled />}
            data-testid={`rate-stars-${student.id}`}
          />
        ) : (
          <span style={{ fontSize: 11, color: '#bfbfbf' }}>-</span>
        )}

        {canEdit && (
          <Badge dot={hasNote} color="#1890ff" offset={[-2, 2]}>
            <Button
              size="small"
              icon={<EditOutlined />}
              data-testid={`btn-note-${student.id}`}
              style={{
                fontSize: 11,
                borderRadius: 6,
                height: 24,
                padding: '0 6px',
                borderColor: hasNote ? '#1890ff' : '#d9d9d9',
                color: hasNote ? '#1890ff' : undefined,
                backgroundColor: hasNote ? '#e6f7ff' : undefined,
              }}
              onClick={() => onOpenQuickNote?.(student)}
            >
              {hasNote ? (t('classroom.hasNote') || 'Đã note') : (t('classroom.addNote') || 'Note')}
            </Button>
          </Badge>
        )}
      </div>

      {/* Quick Note preview tag if present */}
      {hasNote && (
        <Tooltip title={quickNote.text || quickNote.tags?.join(', ')}>
          <div
            style={{
              fontSize: 11,
              color: '#595959',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '2px 6px',
              backgroundColor: '#f5f5f5',
              borderRadius: 6,
              marginBottom: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              cursor: 'pointer',
            }}
            onClick={() => canEdit && onOpenQuickNote?.(student)}
            data-testid={`note-preview-${student.id}`}
          >
            "{quickNote.text || quickNote.tags?.join(', ')}"
          </div>
        </Tooltip>
      )}

      {/* Attention / Alert Bar (Fixed height to prevent any layout shift) */}
      <div className="classroom-seat-attention-bar">
        {canEdit && status === PRESENCE.ONLINE && (
          <Button
            size="small"
            data-testid={`attention-${student.id}`}
            data-attention-state={isDistracted ? 'distracted' : 'focused'}
            className={isDistracted ? 'classroom-attention-active-btn' : 'classroom-attention-idle-btn'}
            disabled={isAttentionPending}
            onClick={() => onMarkAttention?.(student.id, isDistracted ? ATTENTION_STATUS.FOCUSED : ATTENTION_STATUS.DISTRACTED)}
            icon={<AlertOutlined />}
          >
            {isDistracted ? t('classroom.attentionCancelBtn') : t('classroom.attentionAlertBtn')}
          </Button>
        )}

        {!canEdit && isDistracted && cleanPhone && (
          <Button
            size="small"
            data-testid={`zalo-${student.id}`}
            className="classroom-zalo-btn"
            href={`https://zalo.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            icon={<MessageOutlined />}
          >
            {t('classroom.zaloParent')} ({cleanPhone})
          </Button>
        )}
      </div>

      {canEdit && (
        <div className="classroom-seat-actions">
          <Button
            data-testid={`online-${student.id}`}
            type={status === 'ONLINE' ? 'primary' : 'default'}
            disabled={isPending}
            aria-pressed={status === 'ONLINE'}
            onClick={() => onMark({ [student.id]: 'ONLINE' })}
          >
            {t('classroom.onlineAction')}
          </Button>
          <Button
            data-testid={`offline-${student.id}`}
            danger
            type={status === 'OFFLINE' ? 'primary' : 'default'}
            disabled={isPending}
            aria-pressed={status === 'OFFLINE'}
            onClick={() => onMark({ [student.id]: 'OFFLINE' })}
          >
            {t('classroom.offlineAction')}
          </Button>
        </div>
      )}
    </Card>
  );
});

StudentSeat.displayName = 'StudentSeat';
