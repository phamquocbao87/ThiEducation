import { Button, Space, Tag } from 'antd';
import { MessageOutlined, RightOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';

export const ClassCardActions = ({ cls, role, onClick }) => {
  const { t } = useLanguage();
  const meetingUrl = role === 'teacher' ? (cls.zoomHostLink || cls.zoomStudentLink)
    : (cls.zoomStudentLink || cls.zoomHostLink || cls.meetingLink);
  const platform = meetingUrl ? detectMeetingPlatform(meetingUrl) : null;
  return <div onClick={(event) => event.stopPropagation()} style={{ borderTop: '1px solid #e2e8f0',
    paddingTop: 12, marginTop: 'auto', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
    <Space size={6} wrap>
      {platform ? <Button type="primary" size="small" icon={platform.icon}
        style={{ backgroundColor: platform.badgeColor || '#1890ff', borderColor: platform.badgeColor || '#1890ff', borderRadius: 6 }}
        onClick={() => window.open(meetingUrl, '_blank')}>
        {t(role === 'teacher' ? 'classroom.cardOpenHost' : 'classroom.cardJoin')}
      </Button> : <Tag style={{ margin: 0, fontSize: 11 }}>{t('classroom.cardNoLink')}</Tag>}
      {cls.zaloGroupLink && <Button size="small" icon={<MessageOutlined />} style={{ borderRadius: 6, color: '#0068ff' }}
        onClick={() => window.open(cls.zaloGroupLink, '_blank')}>Zalo</Button>}
    </Space>
    <Button type="link" size="small" style={{ padding: 0, fontSize: 12, fontWeight: 600 }} onClick={() => onClick?.(cls)}>
      {t('classroom.cardDetails')} <RightOutlined style={{ fontSize: 10 }} />
    </Button>
  </div>;
};
