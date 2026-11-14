import React, { useMemo, useState } from 'react';
import { Alert, Button, message, Result, Space, Tabs, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  AlertOutlined,
  BookOutlined,
  DesktopOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { localizeSystemMessage } from '../../core/i18n/i18n';
import { BaseFormPageLayout } from '../../shared/components/layout/BaseFormPageLayout';
import { FormSectionCard } from '../../shared/components/layout/FormSectionCard';
import { FormActionBar } from '../../shared/components/layout/FormActionBar';
import { useClassroomController } from './hooks/useClassroomController';
import { ClassroomSeating } from './components/ClassroomSeating';
import { ClassroomInfo } from './components/ClassroomInfo';
import { ClassroomReminder } from './components/ClassroomReminder';
import { QuickNoteModal } from './components/QuickNoteModal';
import { LessonPlanEditorModal } from './components/LessonPlanEditorModal';
import { ClassroomCurriculumPanel } from './components/ClassroomCurriculumPanel';
import { SessionEvaluationPanel } from './components/SessionEvaluationModal';
import { CourseMaterialUploadModal } from '../courses/components/CourseMaterialUploadModal';
import { generateClassSessionDates } from '../../shared/utils/classSessionUtils';
import { ATTENTION_STATUS } from './models/classroom.model';
import './classroom.css';

export default function ClassroomPage() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const c = useClassroomController();
  const back = () => navigate('/dashboard');

  const [activeTab, setActiveTab] = useState('seating');
  const [selectedStudentForNote, setSelectedStudentForNote] = useState(null);
  const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false);
  const [lessonPlanModalOpen, setLessonPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [courseUploadModalOpen, setCourseUploadModalOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isSavingCourseMat, setIsSavingCourseMat] = useState(false);

  const sessionAttendance = useMemo(() => ({
    presence: c.presence,
    quickNotes: c.quickNotes,
    studentEvaluations: c.studentEvaluations,
    attentionFlags: c.attentionFlags,
    date: c.session?.start
      ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
          dateStyle: 'medium',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(c.session.start)
      : c.session?.date || undefined,
  }), [c.presence, c.quickNotes, c.studentEvaluations, c.attentionFlags, c.session, language]);

  const userRole = currentUser?.role || 'student';
  const currentStudentId = userRole === 'student' ? currentUser?.id : null;

  const todayDateStr = useMemo(
    () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(c.now),
    [c.now]
  );

  const scheduleSessions = useMemo(() => {
    return c.cls ? generateClassSessionDates(c.cls, 60, language === 'en') : [];
  }, [c.cls, language]);

  const activeSessionIndex = useMemo(() => {
    if (!c.session || !c.cls) return null;
    const sessionDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(c.session.start);
    if (sessionDateStr !== todayDateStr) return null;
    const matched = scheduleSessions.find((s) => Math.abs(s.dateMs - c.session.start) < 60000);
    return matched ? matched.sessionIndex : null;
  }, [c.session, c.cls, todayDateStr, scheduleSessions]);

  const currentOrUpcomingSessionIndex = useMemo(() => {
    if (!c.session || !scheduleSessions.length) return 1;
    const matched = scheduleSessions.find((s) => Math.abs(s.dateMs - c.session.start) < 60000);
    return matched ? matched.sessionIndex : 1;
  }, [c.session, scheduleSessions]);

  if (!c.loading && !c.error && (!c.cls || !c.allowed)) {
    return (
      <Result
        status={c.cls || c.denied ? '403' : '404'}
        title={t('classroom.unavailable')}
        extra={<Button onClick={back}>{t('classroom.back')}</Button>}
      />
    );
  }

  const counts = (status) => c.students.filter((s) => (c.presence[s.id] || 'UNMARKED') === status).length;

  const handleSaveQuickNote = async (studentId, noteData) => {
    setIsSavingNote(true);
    try {
      await c.saveQuickNote(studentId, noteData);
      setQuickNoteModalOpen(false);
      setSelectedStudentForNote(null);
      message.success(t('classroom.saveNoteSuccess') || 'Đã lưu ghi chú học viên!');
    } catch (err) {
      message.error(err.message || 'Lỗi lưu ghi chú');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveLessonPlan = async (arg1, arg2) => {
    const sessionIndex = typeof arg1 === 'number' ? arg1 : arg1?.sessionIndex || arg2?.sessionIndex;
    const planData = typeof arg1 === 'object' ? arg1 : arg2 || {};
    setIsSavingPlan(true);
    try {
      await c.saveLessonPlan(sessionIndex, { ...planData, sessionIndex });
      setLessonPlanModalOpen(false);
      setEditingPlan(null);
      message.success('Đã lưu giáo án thành công!');
    } catch (err) {
      message.error(err.message || 'Lỗi lưu giáo án');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleSaveCourseMaterial = async (matData) => {
    setIsSavingCourseMat(true);
    try {
      await c.saveCourseMaterial(matData);
      setCourseUploadModalOpen(false);
      message.success('Đã đồng bộ học liệu vào Khóa học (0ms)!');
    } catch (err) {
      message.error(err.message || 'Lỗi lưu học liệu');
    } finally {
      setIsSavingCourseMat(false);
    }
  };

  const tabItems = [
    {
      key: 'seating',
      label: (
        <span data-testid="tab-seating">
          <Space size={6}>
            <DesktopOutlined />
            <span>{t('classroom.tabSeating') || 'Sơ Đồ Lớp & Note Nhanh'}</span>
          </Space>
        </span>
      ),
      children: (
        <div style={{ marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            title={c.canEdit ? t('classroom.teacherHint') : t('classroom.readOnlyHint')}
            style={{ marginBottom: 16 }}
          />
          <Space wrap style={{ marginBottom: 16 }} data-testid="attendance-counts">
            <Tag color="green">{t('classroom.presentCount', { count: counts('ONLINE') })}</Tag>
            <Tag color="red">{t('classroom.absentCount', { count: counts('OFFLINE') })}</Tag>
            <Tag>{t('classroom.unmarkedCount', { count: counts('UNMARKED') })}</Tag>
            {c.attentionCount > 0 && (
              <Tag color="orange" icon={<AlertOutlined />} data-testid="attention-count-tag">
                {t('classroom.distractedCount', { count: c.attentionCount })}
              </Tag>
            )}
          </Space>

          {c.attentionCount > 0 && (
            <div
              role="status"
              style={{ color: '#d46b08', marginBottom: 10, fontSize: 13, fontWeight: 500 }}
              data-testid="distracted-students-banner"
            >
              {t('classroom.distractedNames', {
                names: c.students
                  .filter((s) => c.attentionFlags[s.id] === ATTENTION_STATUS.DISTRACTED && (c.presence[s.id] || 'UNMARKED') === 'ONLINE')
                  .map((s) => (s.englishName && s.englishName !== s.name ? `${s.englishName} (${s.name})` : (s.englishName || s.name || s.id)))
                  .join(', '),
              })}
            </div>
          )}

          {counts('OFFLINE') > 0 && (
            <div
              role="status"
              style={{ color: '#cf1322', marginBottom: 12, fontSize: 13 }}
              data-testid="absent-students-banner"
            >
              {t('classroom.absentNames', {
                names: c.students
                  .filter((s) => c.presence[s.id] === 'OFFLINE')
                  .map((s) => (s.englishName && s.englishName !== s.name ? `${s.englishName} (${s.name})` : (s.englishName || s.name || s.id)))
                  .join(', '),
              })}
            </div>
          )}

          <ClassroomSeating
            students={c.students}
            presence={c.presence}
            attentionFlags={c.attentionFlags}
            quickNotes={c.quickNotes}
            studentEvaluations={c.studentEvaluations}
            teacherCheckIn={c.teacherCheckIn}
            canEdit={c.canEdit}
            canConfirmCheckIn={!c.canEdit && Boolean(c.session)}
            pendingChanges={c.pendingChanges}
            pendingAttentionChanges={c.pendingAttentionChanges}
            isMarkAllPending={c.isMarkAllPending}
            isCheckInPending={c.isCheckInPending}
            onMark={c.mark}
            onMarkAttention={c.markAttention}
            onOpenQuickNote={(student) => {
              setSelectedStudentForNote(student);
              setQuickNoteModalOpen(true);
            }}
            onRateStudent={(studentId, stars) => {
              const prevEval = c.studentEvaluations[studentId] || {};
              const note = c.quickNotes[studentId];
              const fallbackComment = note?.text || (note?.tags?.length ? note.tags.join(', ') : '');
              c.saveStudentEvaluation(studentId, {
                ...prevEval,
                stars,
                comment: prevEval.comment || fallbackComment || '',
                tags: prevEval.tags || note?.tags || [],
              });
            }}
            onConfirmTeacherCheckIn={c.markTeacherCheckIn}
            loading={c.rosterLoading}
            teacherName={c.cls?.teacherName}
            currentStudentId={currentStudentId}
          />
          <ClassroomReminder key={c.cls?.id} cls={{ ...c.cls, liveAttendance: c.record }} students={c.students} now={c.now} />
        </div>
      ),
    },
    {
      key: 'curriculum',
      label: (
        <span data-testid="tab-curriculum">
          <Space size={6}>
            <BookOutlined />
            <span>{t('classroom.tabCurriculum') || 'Soạn Giáo Án & Học Liệu'}</span>
          </Space>
        </span>
      ),
      children: (
        <div style={{ marginTop: 8 }}>
          <ClassroomCurriculumPanel
            cls={c.cls}
            lessonPlans={c.lessonPlans}
            currentSessionIndex={activeSessionIndex}
            userRole={userRole}
            courseMaterials={c.courseMaterials}
            onOpenEditor={(plan) => {
              setEditingPlan(plan);
              setLessonPlanModalOpen(true);
            }}
            onOpenCourseUpload={() => setCourseUploadModalOpen(true)}
          />
        </div>
      ),
    },
    {
      key: 'evaluation',
      label: (
        <span data-testid="tab-evaluation">
          <Space size={6}>
            <StarFilled />
            <span>{t('classroom.tabEvaluation') || 'Đánh Giá Sau Giờ & Chăm Sóc PH'}</span>
          </Space>
        </span>
      ),
      children: (
        <div style={{ marginTop: 8 }}>
          <SessionEvaluationPanel
            cls={c.cls}
            sessionIndex={activeSessionIndex || currentOrUpcomingSessionIndex || 1}
            session={c.session}
            now={c.now}
            isSessionUpcoming={c.isSessionUpcoming}
            isSessionLive={c.isSessionLive}
            canEvaluate={c.canEvaluate}
            roster={c.students}
            attendance={sessionAttendance}
            lessonPlan={c.lessonPlans?.[activeSessionIndex || currentOrUpcomingSessionIndex || 1] || {}}
            userRole={userRole}
            currentStudentId={currentStudentId}
            onSaveEvaluation={c.saveStudentEvaluation}
            onSaveAllEvaluations={c.saveAllEvaluations}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="classroom-page">
      <BaseFormPageLayout
        title={c.cls?.name || t('classroom.title')}
        subtitle={t('classroom.subtitle')}
        icon={<DesktopOutlined />}
        loading={c.loading}
        onBack={back}
        backText={t('classroom.back')}
      >
        {c.error && <Alert type="error" showIcon title={localizeSystemMessage(t(`classroom.${c.error}`), language)} />}
        {c.writeError && <Alert type="error" showIcon title={localizeSystemMessage(t(`classroom.${c.writeError}`), language)} />}
        {c.allowed && (
          <>
            <FormSectionCard title={t('classroom.information')}>
              <ClassroomInfo
                cls={c.cls}
                session={c.session}
                now={c.now}
                onOpenRoom={c.canEdit ? () => c.markTeacherCheckIn('AUTO_HOST_OPEN') : undefined}
              />
            </FormSectionCard>

            <FormSectionCard title={t('classroom.title') || 'Hoạt Động Phòng Học'}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                type="card"
                className="classroom-tabs"
              />
            </FormSectionCard>

            {activeTab === 'seating' && c.canEdit && c.students.length > 0 && (
              <FormActionBar
                onCancel={back}
                cancelText={t('classroom.back')}
                onSubmit={c.students.length ? c.markAll : undefined}
                loading={c.isMarkAllPending}
                submitText={t('classroom.markAll')}
                noteText={t('classroom.teacherHint')}
              />
            )}
          </>
        )}
      </BaseFormPageLayout>

      {/* Quick Note Modal for Teacher */}
      <QuickNoteModal
        open={quickNoteModalOpen}
        student={selectedStudentForNote}
        initialNote={selectedStudentForNote ? c.quickNotes[selectedStudentForNote.id] : null}
        loading={isSavingNote}
        onSave={handleSaveQuickNote}
        onCancel={() => {
          setQuickNoteModalOpen(false);
          setSelectedStudentForNote(null);
        }}
      />

      {/* Multi-Session Lesson Plan Editor Modal */}
      <LessonPlanEditorModal
        open={lessonPlanModalOpen}
        cls={c.cls}
        sessionIndex={typeof editingPlan === 'number' ? editingPlan : (editingPlan?.sessionIndex || activeSessionIndex || currentOrUpcomingSessionIndex || 1)}
        initialPlan={typeof editingPlan === 'object' ? editingPlan : c.lessonPlans?.[editingPlan] || null}
        previousPlan={c.lessonPlans?.[(typeof editingPlan === 'number' ? editingPlan : (editingPlan?.sessionIndex || activeSessionIndex || currentOrUpcomingSessionIndex || 1)) - 1]}
        loading={isSavingPlan}
        onSave={handleSaveLessonPlan}
        onCancel={() => {
          setLessonPlanModalOpen(false);
          setEditingPlan(null);
        }}
      />

      {/* Course Program Material Upload Modal */}
      <CourseMaterialUploadModal
        open={courseUploadModalOpen}
        course={{ id: c.cls?.courseId, name: c.cls?.courseName || c.cls?.name }}
        loading={isSavingCourseMat}
        onSave={handleSaveCourseMaterial}
        onCancel={() => setCourseUploadModalOpen(false)}
      />
    </div>
  );
}
