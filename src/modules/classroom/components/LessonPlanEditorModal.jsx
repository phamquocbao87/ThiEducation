import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Radio, Select, Space, Tag, Typography, Row, Col } from 'antd';
import { BookOutlined, CalendarOutlined, CopyOutlined, FolderOpenOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { LESSON_PLAN_STATUS } from '../../../shared/models/classroom.model';
import { generateClassSessionDates } from '../../../shared/utils/classSessionUtils';
import { MaterialService } from '../../materials/services/MaterialService';
import { SimpleObjectivesEditor, parseObjectivesList } from './SimpleObjectivesEditor';
import { LessonMaterialAutocomplete } from './LessonMaterialAutocomplete';

const { TextArea } = Input;
const { Text } = Typography;

export const LessonPlanEditorModal = ({
  open,
  cls,
  sessionIndex = 1,
  initialPlan = null,
  previousPlan = null,
  loading = false,
  onSave,
  onCancel,
}) => {
  const { t, isEnglish } = useLanguage();
  const [form] = Form.useForm();
  const [isManualSchedule, setIsManualSchedule] = useState(false);
  const [selectedSessionVal, setSelectedSessionVal] = useState(sessionIndex);
  const [classSharedMaterials, setClassSharedMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Nạp danh sách học liệu đã được chia sẻ cho lớp hiện tại để gợi ý Autocomplete
  useEffect(() => {
    if (!open || !cls?.id) return;
    let mounted = true;
    setLoadingMaterials(true);
    MaterialService.getAllMaterials()
      .then((all) => {
        if (!mounted) return;
        const shared = MaterialService.getMaterialsSharedForClass(all, cls);
        setClassSharedMaterials(shared);
      })
      .catch((err) => {
        console.warn('[LessonPlanEditorModal] Lỗi nạp tài liệu chia sẻ cho lớp:', err?.message);
        if (mounted) setClassSharedMaterials([]);
      })
      .finally(() => {
        if (mounted) setLoadingMaterials(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, cls?.id, cls?.courseId]);

  // Sinh danh sách các buổi học chuẩn theo thời khóa biểu của lớp học
  const scheduleSessions = useMemo(() => {
    return generateClassSessionDates(cls, 30, isEnglish);
  }, [cls, isEnglish]);

  useEffect(() => {
    if (open) {
      const targetSession = initialPlan?.sessionIndex || sessionIndex || 1;
      setSelectedSessionVal(targetSession);
      const matchedSchedule = scheduleSessions.find((s) => s.sessionIndex === targetSession);
      const planToUse = initialPlan || cls?.lessonPlans?.[targetSession] || null;

      if (planToUse) {
        form.setFieldsValue({
          sessionIndex: targetSession,
          date: planToUse.date || matchedSchedule?.date || '',
          unitWeek: planToUse.unitWeek || matchedSchedule?.unitWeek || '',
          lessonTitle: planToUse.lessonTitle || '',
          objectives: Array.isArray(planToUse.objectives) ? planToUse.objectives.join('\n') : (planToUse.objectives || ''),
          studentPrep: planToUse.studentPrep || '',
          homework: planToUse.homework || '',
          readingDailyTime: planToUse.readingDailyTime || '60+ mins',
          writingDailyTime: planToUse.writingDailyTime || '30+ mins',
          slideLink: planToUse.slideLink || '',
          attachedMaterials: Array.isArray(planToUse.attachedMaterials) ? planToUse.attachedMaterials : [],
          teacherNotes: planToUse.teacherNotes || '',
          status: planToUse.status || LESSON_PLAN_STATUS.READY,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          sessionIndex: targetSession,
          date: matchedSchedule?.date || '',
          unitWeek: matchedSchedule?.unitWeek || '',
          lessonTitle: '',
          objectives: '',
          studentPrep: '',
          homework: '',
          readingDailyTime: '60+ mins',
          writingDailyTime: '30+ mins',
          slideLink: '',
          attachedMaterials: [],
          teacherNotes: '',
          status: LESSON_PLAN_STATUS.READY,
        });
      }
    }
  }, [open, initialPlan, sessionIndex, form, scheduleSessions, cls?.lessonPlans]);

  const handleSelectScheduleSession = (val) => {
    setSelectedSessionVal(val);
    const matched = scheduleSessions.find((s) => s.sessionIndex === val);
    const targetPlan = cls?.lessonPlans?.[val] || null;

    if (targetPlan) {
      form.setFieldsValue({
        sessionIndex: val,
        date: targetPlan.date || matched?.date || '',
        unitWeek: targetPlan.unitWeek || matched?.unitWeek || '',
        lessonTitle: targetPlan.lessonTitle || '',
        objectives: Array.isArray(targetPlan.objectives)
          ? targetPlan.objectives.join('\n')
          : (targetPlan.objectives || ''),
        studentPrep: targetPlan.studentPrep || '',
        homework: targetPlan.homework || '',
        readingDailyTime: targetPlan.readingDailyTime || '60+ mins',
        writingDailyTime: targetPlan.writingDailyTime || '30+ mins',
        slideLink: targetPlan.slideLink || '',
        attachedMaterials: Array.isArray(targetPlan.attachedMaterials) ? targetPlan.attachedMaterials : [],
        teacherNotes: targetPlan.teacherNotes || '',
        status: targetPlan.status || LESSON_PLAN_STATUS.READY,
      });
    } else {
      form.setFieldsValue({
        sessionIndex: val,
        date: matched?.date || '',
        unitWeek: matched?.unitWeek || '',
        lessonTitle: '',
        objectives: '',
        studentPrep: '',
        homework: '',
        readingDailyTime: '60+ mins',
        writingDailyTime: '30+ mins',
        slideLink: '',
        attachedMaterials: [],
        teacherNotes: '',
        status: LESSON_PLAN_STATUS.READY,
      });
    }
  };

  const handleApplyWondersTemplate = () => {
    const matched = scheduleSessions.find((s) => s.sessionIndex === selectedSessionVal);
    form.setFieldsValue({
      unitWeek: form.getFieldValue('unitWeek') || matched?.unitWeek || 'Unit 1 Week 1 · Lesson 1',
      date: matched?.date || form.getFieldValue('date') || '',
      lessonTitle: 'Where I Live — Communities and Homes',
      objectives: [
        '• 🎯 Essential Question: What is your neighborhood like?',
        '• 📖 Anchor Text: "Six Kids" & "A Surprise for Bear"',
        '• 🔤 Phonics: Short i sound blending (in, it, pin, win)',
        '• 💬 High-Frequency Words: down, out, up, very',
        '• 🧩 Grammar: Sentences & S-V-O Structure',
      ].join('\n'),
      studentPrep: 'Literature Anthology, pp. 10–25; Companion pp. 30–35',
      homework: 'Practice Book trang 12, 14, 16 và 18',
      readingDailyTime: '60+ mins',
      writingDailyTime: '30+ mins',
      status: LESSON_PLAN_STATUS.READY,
    });
  };

  const handleCopyPrevious = () => {
    if (previousPlan) {
      form.setFieldsValue({
        unitWeek: previousPlan.unitWeek || form.getFieldValue('unitWeek'),
        studentPrep: previousPlan.studentPrep || '',
        homework: previousPlan.homework || '',
        readingDailyTime: previousPlan.readingDailyTime || '60+ mins',
        writingDailyTime: previousPlan.writingDailyTime || '30+ mins',
        objectives: Array.isArray(previousPlan.objectives) ? previousPlan.objectives.join('\n') : (previousPlan.objectives || ''),
        attachedMaterials: Array.isArray(previousPlan.attachedMaterials) ? previousPlan.attachedMaterials : [],
      });
    }
  };

  const handleFinish = (values) => {
    const rawObjectives = values.objectives;
    const objectives = parseObjectivesList(rawObjectives);

    const actualSessionIndex = Number(values.sessionIndex) || selectedSessionVal || sessionIndex;
    const cleanedMaterials = Array.isArray(values.attachedMaterials)
      ? values.attachedMaterials
          .filter((m) => m && m.id && m.title)
          .map((m) => ({
            id: String(m.id).trim(),
            title: String(m.title).trim(),
            type: String(m.type || 'PDF').trim(),
            url: String(m.url || '').trim(),
            matchScope: String(m.matchScope || 'CLASS').trim(),
            pageLocation: String(m.pageLocation || '').trim(),
          }))
      : [];

    onSave?.(actualSessionIndex, {
      ...values,
      sessionIndex: actualSessionIndex,
      objectives,
      attachedMaterials: cleanedMaterials,
    });
  };

  return (
    <Modal
      open={open}
      wrapClassName="lesson-plan-modal-wrapper"
      title={
        <Space orientation="horizontal" size="small" data-testid="lesson-plan-modal-title">
          <BookOutlined style={{ color: '#1890ff' }} />
          <span>
            {t('classroom.editorTitle') || 'Soạn Giáo Án'}:{' '}
            <strong>{isEnglish ? `Session ${selectedSessionVal}` : `Buổi ${selectedSessionVal}`}</strong>
          </span>
        </Space>
      }
      onCancel={onCancel}
      width={740}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel') || 'Hủy'}
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          data-testid="btn-save-lesson-plan"
          onClick={() => form.submit()}
        >
          {t('classroom.saveLessonPlanAction') || 'Lưu Giáo Án (0ms)'}
        </Button>,
      ]}
      destroyOnClose
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#e6f7ff',
          padding: '8px 12px',
          borderRadius: 8,
          marginBottom: 16,
          border: '1px solid #91d5ff',
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: '#0050b3' }}>
          ⚡ <strong>{isEnglish ? 'Lesson Authoring Shortcuts:' : 'Tiện ích tăng tốc độ soạn bài:'}</strong>
        </Text>
        <Space orientation="horizontal" size="small" wrap>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={handleApplyWondersTemplate}
            data-testid="btn-template-wonders"
          >
            {isEnglish ? 'Load Wonders Template' : 'Nạp Mẫu Wonders'}
          </Button>
          {previousPlan && (
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyPrevious}
              data-testid="btn-copy-previous"
            >
              {isEnglish ? 'Copy Previous Session' : 'Sao Chép Buổi Trước'}
            </Button>
          )}
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          status: LESSON_PLAN_STATUS.READY,
          readingDailyTime: '60+ mins',
          writingDailyTime: '30+ mins',
        }}
      >
        <Form.Item name="sessionIndex" hidden>
          <Input />
        </Form.Item>

        {/* 1. KHUNG BÀI HỌC & NGÀY GIẢNG DẠY (GỘP 1 Ô CHỌN THÔNG MINH THEO TKB) */}
        <Form.Item
          label={
            <Space size={6}>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 600 }}>
                {isEnglish ? 'Class Schedule Session & Planned Date' : 'Khung Bài Học & Ngày Giảng Dạy (Theo Thời Khóa Biểu)'}
              </span>
              <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}>
                {isEnglish ? 'Auto-Calculated' : 'Tự Động Tính'}
              </Tag>
            </Space>
          }
          extra={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                {isEnglish
                  ? 'Select session from class timetable to link date automatically.'
                  : 'Chọn buổi học từ thời khóa biểu để tự động liên kết ngày dạy.'}
              </span>
              <Button
                type="link"
                size="small"
                style={{ fontSize: 11, padding: 0 }}
                onClick={() => setIsManualSchedule((prev) => !prev)}
                data-testid="btn-toggle-manual-schedule"
              >
                {isManualSchedule
                  ? (isEnglish ? '← Choose from Timetable' : '← Chọn từ Thời Khóa Biểu')
                  : (isEnglish ? '✏️ Custom manual date' : '✏️ Tùy chỉnh ngày thủ công')}
              </Button>
            </div>
          }
        >
          {!isManualSchedule && scheduleSessions.length > 0 ? (
            <Select
              value={selectedSessionVal}
              onChange={handleSelectScheduleSession}
              options={scheduleSessions.map((s) => ({
                value: s.sessionIndex,
                label: s.label,
              }))}
              style={{ width: '100%', height: 40 }}
              placeholder={isEnglish ? 'Select session from timetable...' : 'Chọn buổi học từ thời khóa biểu...'}
              data-testid="select-schedule-session"
            />
          ) : (
            <Form.Item name="date" style={{ marginBottom: 0 }}>
              <Input placeholder="DD/MM/YYYY (Ví dụ: 16/11/2026)" style={{ height: 38, borderRadius: 8 }} />
            </Form.Item>
          )}
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={10}>
            <Form.Item
              name="unitWeek"
              label={
                <span style={{ fontWeight: 600 }}>
                  {isEnglish ? 'Unit & Week Progress' : 'Tiến Độ Unit & Week'}
                </span>
              }
              extra={
                <span style={{ fontSize: 10, color: '#8c8c8c' }}>
                  {isEnglish ? 'Teacher/Staff custom input' : 'GV/Giáo vụ tự nhập theo lớp'}
                </span>
              }
            >
              <Input
                placeholder={isEnglish ? 'e.g. Unit 1 Week 1 or Review...' : 'VD: Unit 1 Week 1 hoặc Ôn tập...'}
                data-testid="input-lesson-plan-unit-week"
                style={{ height: 38, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={14}>
            <Form.Item
              name="lessonTitle"
              label={
                <span style={{ fontWeight: 600 }}>
                  {isEnglish ? 'Lesson Topic & Title' : 'Chủ Đề & Tiêu Đề Bài Học (Lesson Title)'}
                </span>
              }
              rules={[{ required: true, message: isEnglish ? 'Please enter lesson title' : 'Vui lòng nhập tiêu đề bài học' }]}
            >
              <Input
                placeholder={isEnglish ? 'e.g. Where I Live — Communities' : 'Ví dụ: People in My Neighborhood — Community Helpers'}
                data-testid="input-lesson-plan-title"
                style={{ height: 38, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 2. MỤC TIÊU BÀI HỌC & NGỮ ÂM (TRÌNH SOẠN THẢO ĐƠN GIẢN) */}
        <Form.Item
          name="objectives"
          label={
            <Space size={6}>
              <span style={{ fontWeight: 600 }}>
                {isEnglish ? 'Lesson Objectives & Phonics (Simple Editor)' : 'Mục Tiêu Bài Học & Ngữ Âm (Trình Soạn Thảo Đơn Giản)'}
              </span>
              <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}>
                {isEnglish ? '1-Touch Snippets' : 'Phím Tắt 1 Chạm'}
              </Tag>
            </Space>
          }
        >
          <SimpleObjectivesEditor
            testId="lesson-objectives-editor"
            placeholder={isEnglish
              ? '• 🎯 Essential Question: What is your neighborhood like?\n• 📖 Anchor Text: "Six Kids" & "A Surprise for Bear"\n• 🔤 Phonics: Short i sound blending (in, it, pin, win)\n• 💬 High-Frequency Words: down, out, up, very\n• 🧩 Grammar: Sentences & S-V-O Structure'
              : '• 🎯 Essential Question: What is your neighborhood like?\n• 📖 Anchor Text: "Six Kids" & "A Surprise for Bear"\n• 🔤 Phonics: Short i sound blending (in, it, pin, win)\n• 💬 High-Frequency Words: down, out, up, very\n• 🧩 Grammar: Sentences & S-V-O Structure'}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 16px', alignItems: 'start' }}>
          <Form.Item
            name="studentPrep"
            label={<span style={{ fontWeight: 600 }}>{isEnglish ? 'Student Pre-Class Reading' : 'Học Sinh Đọc Chuẩn Bị (Student Prep)'}</span>}
            extra={
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                {isEnglish ? 'Shown in Student Lesson Overview' : 'Hiển thị ở phần chuẩn bị bài của học viên'}
              </span>
            }
          >
            <TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Ví dụ: Companion pp. 36–42; Decodable #4"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="homework"
            label={<span style={{ fontWeight: 600 }}>{isEnglish ? 'Homework & Practice Tasks' : 'Bài Tập Về Nhà (Homework)'}</span>}
            extra={
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                {isEnglish ? 'Auto-filled into after-class report' : 'Tự động điền vào báo cáo sau buổi học'}
              </span>
            }
          >
            <TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Ví dụ: Practice Book pp. 20, 22, 24"
              style={{ borderRadius: 8, color: '#389e0d', fontWeight: 600 }}
            />
          </Form.Item>
        </div>

        {/* 3. THỜI LƯỢNG RÈN LUYỆN GỢI Ý MỖI NGÀY (MCGRAW-HILL WONDERS BENCHMARKS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 16px', alignItems: 'start' }}>
          <Form.Item
            name="readingDailyTime"
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>
                  {isEnglish ? 'Daily Reading Time' : 'Thời Lượng Đọc / Ngày'}
                </span>
                <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  Wonders 60+ mins
                </Tag>
              </span>
            }
            extra={
              <Space size={4} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>{isEnglish ? 'Quick pick:' : 'Gợi ý nhanh:'}</span>
                {['45 mins', '60+ mins', '90 mins'].map((time) => (
                  <Tag
                    key={time}
                    style={{ cursor: 'pointer', fontSize: 11, borderRadius: 4 }}
                    onClick={() => form.setFieldsValue({ readingDailyTime: time })}
                  >
                    {time}
                  </Tag>
                ))}
              </Space>
            }
          >
            <Input
              placeholder="Ví dụ: 60+ mins"
              style={{ height: 38, borderRadius: 8, color: '#096dd9', fontWeight: 600 }}
            />
          </Form.Item>

          <Form.Item
            name="writingDailyTime"
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>
                  {isEnglish ? 'Daily Writing Time' : 'Thời Lượng Viết / Ngày'}
                </span>
                <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  Wonders 30+ mins
                </Tag>
              </span>
            }
            extra={
              <Space size={4} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>{isEnglish ? 'Quick pick:' : 'Gợi ý nhanh:'}</span>
                {['20 mins', '30+ mins', '45 mins'].map((time) => (
                  <Tag
                    key={time}
                    style={{ cursor: 'pointer', fontSize: 11, borderRadius: 4 }}
                    onClick={() => form.setFieldsValue({ writingDailyTime: time })}
                  >
                    {time}
                  </Tag>
                ))}
              </Space>
            }
          >
            <Input
              placeholder="Ví dụ: 30+ mins"
              style={{ height: 38, borderRadius: 8, color: '#389e0d', fontWeight: 600 }}
            />
          </Form.Item>
        </div>

        {/* 3.5. Ô AUTOCOMPLETE CHỌN TÀI LIỆU ĐÃ ĐƯỢC CHIA SẺ CHO LỚP */}
        <Form.Item
          name="attachedMaterials"
          label={
            <Space size={6} wrap>
              <FolderOpenOutlined style={{ color: '#7e22ce' }} />
              <span style={{ fontWeight: 600 }}>
                {isEnglish ? 'Attached Class Materials (Autocomplete)' : 'Tài Liệu Đính Kèm Cho Buổi Học (Gõ Chọn Tài Liệu Đã Share Cho Lớp)'}
              </span>
              <Tag color="purple" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4 }}>
                {classSharedMaterials.length} {isEnglish ? 'available' : 'tài liệu khả dụng'}
              </Tag>
            </Space>
          }
          extra={
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {isEnglish
                ? 'Each row pairs 1 shared class material with a page/section reminder for students (e.g. pp. 10–25, Phonics section).'
                : 'Mỗi dòng gồm 1 ô gõ chọn tài liệu đã share cho lớp + 1 ô nhắc học viên xem trang mấy / vị trí nào.'}
            </span>
          }
        >
          <LessonMaterialAutocomplete
            materials={classSharedMaterials}
            loading={loadingMaterials}
            classId={cls?.id || cls?.code || ''}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 16px' }}>
          <Form.Item
            name="slideLink"
            label={isEnglish ? 'Presentation Slides Link (Google Slides)' : 'Link Slide Trình Chiếu (Google Slides)'}
          >
            <Input placeholder="https://docs.google.com/presentation/d/..." style={{ height: 38, borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="status"
            label={isEnglish ? 'Lesson Plan Status' : 'Trạng Thái Soạn Giáo Án'}
          >
            <Radio.Group style={{ marginTop: 6 }}>
              <Radio value={LESSON_PLAN_STATUS.READY}>
                {isEnglish ? '🟢 Ready (Visible to students)' : '🟢 Sẵn Sàng (Học viên thấy)'}
              </Radio>
              <Radio value={LESSON_PLAN_STATUS.DRAFT}>
                {isEnglish ? '✏️ Draft (Teacher only)' : '✏️ Bản Nháp (Đang soạn dở)'}
              </Radio>
            </Radio.Group>
          </Form.Item>
        </div>

        <Form.Item
          name="teacherNotes"
          label={isEnglish ? 'Internal Teacher Notes (Hidden from students)' : 'Ghi Chú Sư Phạm Nội Bộ Cho Giáo Viên (Học viên KHÔNG THẤY)'}
        >
          <TextArea
            rows={2}
            placeholder={isEnglish ? 'Internal notes: remind student to speak clearly, pay attention to short /i/ sound...' : 'Lưu ý nội bộ: Gọi bé phát biểu, nhắc nhở âm /i/...'}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
