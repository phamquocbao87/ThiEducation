import { useState } from 'react';
import { Alert, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { localizeSystemMessage } from '../../../core/i18n/i18n';
import { currentAttendance } from '../../../shared/models/classroom.model';
import { ClassroomNoticeService } from '../services/ClassroomNoticeService';

export const ClassroomReminder = ({ cls, students, now }) => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const summary = currentAttendance(cls, now);
  if (!['admin', 'director', 'academic'].includes(currentUser?.role) || !summary?.absentCount) return null;
  const formatStudentName = (s, fallbackId) => {
    if (!s) return fallbackId;
    const eng = s.englishName?.trim();
    const vn = s.name?.trim();
    if (eng && vn && eng.toLowerCase() !== vn.toLowerCase()) {
      return `${eng} (${vn})`;
    }
    return eng || vn || fallbackId;
  };

  const send = async () => {
    setBusy(true); setResult('');
    const names = summary.absentIds
      .map((id) => formatStudentName(students.find((s) => s.id === id), id))
      .join(', ');
    try {
      setResult(await ClassroomNoticeService.remind(cls, currentUser, summary.absentIds, {
        title: t('classroom.noticeTitle'), message: t('classroom.noticeMessage', { className: cls.name, names }),
      }));
    } catch (error) { console.warn('[ClassroomReminder]', error.code || error.message); setResult('noticeError'); }
    finally { setBusy(false); }
  };
  return <div style={{ marginTop: 16 }}>
    <Button icon={<BellOutlined />} loading={busy} onClick={send} data-testid="remind-teacher">
      {t('classroom.remindTeacher')}
    </Button>
    {result && <Alert style={{ marginTop: 12 }} type={result === 'noticeError' ? 'error' : 'success'}
      title={localizeSystemMessage(t(`classroom.${result}`), language)} />}
  </div>;
};
