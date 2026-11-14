import { Tag } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useAuth } from '../../core/context/AuthContext';
import { currentAttendance } from '../models/classroom.model';

export const ClassAttendanceSummary = ({ cls, now }) => {
  const { t } = useLanguage();
  const { allSystemUsers = [] } = useAuth() || {};
  const summary = currentAttendance(cls, now);
  if (!summary) return <div style={{ marginBottom: 12, fontSize: 12 }}>{t('classroom.notMarked')}</div>;

  const formatStudentName = (u, fallbackId) => {
    if (!u) return fallbackId;
    const eng = u.englishName?.trim();
    const vn = u.name?.trim();
    if (eng && vn && eng.toLowerCase() !== vn.toLowerCase()) {
      return `${eng} (${vn})`;
    }
    return eng || vn || fallbackId;
  };

  const names = (summary.absentIds || []).map((id) =>
    formatStudentName(allSystemUsers.find((u) => u.id === id), id)
  );
  const distractedNames = (summary.attentionIds || []).map((id) =>
    formatStudentName(allSystemUsers.find((u) => u.id === id), id)
  );

  return (
    <div data-testid={`attendance-summary-${cls.id}`} style={{ marginBottom: 12, overflowWrap: 'anywhere' }}>
      <Tag color="green">{t('classroom.presentCount', { count: summary.presentCount })}</Tag>
      <Tag color={summary.absentCount ? 'red' : 'default'}>{t('classroom.absentCount', { count: summary.absentCount })}</Tag>
      <Tag>{t('classroom.unmarkedCount', { count: summary.unmarkedCount })}</Tag>
      {summary.attentionCount > 0 && (
        <Tag color="orange" icon={<AlertOutlined />}>
          {t('classroom.distractedCount', { count: summary.attentionCount })}
        </Tag>
      )}
      {names.length > 0 && (
        <div role="status" style={{ color: '#cf1322', marginTop: 6, fontSize: 13 }}>
          {t('classroom.absentNames', { names: names.join(', ') })}
        </div>
      )}
      {distractedNames.length > 0 && (
        <div role="status" style={{ color: '#d46b08', marginTop: 4, fontSize: 13, fontWeight: 500 }}>
          {t('classroom.distractedNames', { names: distractedNames.join(', ') })}
        </div>
      )}
    </div>
  );
};
