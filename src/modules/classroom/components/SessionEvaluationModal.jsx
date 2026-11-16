import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Input,
  Modal,
  Rate,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  AlertOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LockOutlined,
  MessageOutlined,
  SaveOutlined,
  StarFilled,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { ClassroomService } from '../services/ClassroomService';
import { SimpleEvaluationEditor } from './SimpleEvaluationEditor';
import { EvaluationHistoryDrawer } from './EvaluationHistoryDrawer';
import { SessionRecordingUploadModal } from '../../materials/components/SessionRecordingUploadModal';

const { Text, Title, Paragraph } = Typography;

// Quick pedagogical feedback tags (1-tap for teachers)
const QUICK_PEDAGOGICAL_TAGS = [
  {
    label: '🌟 Khen ngợi',
    labelEn: '🌟 Praise',
    text: 'Actively participated in class, pronunciation was very clear and completed homework well.',
    textVi: 'Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay.',
  },
  {
    label: '🔤 Phát âm',
    labelEn: '🔤 Phonics',
    text: 'Good phonics blending today. Needs more focus on ending sounds /s/ and /t/.',
    textVi: 'Ghép vần phonics tốt hôm nay. Cần chú ý thêm âm đuôi /s/ và /t/.',
  },
  {
    label: '🗣️ Tích cực',
    labelEn: '🗣️ Active',
    text: 'Very energetic and engaged during group discussions. Keep up the great enthusiasm!',
    textVi: 'Rất sôi nổi và hào hứng tương tác trong giờ học. Tiếp tục phát huy nhé!',
  },
  {
    label: '📚 Bài tập',
    labelEn: '📚 Homework',
    text: 'Completed all assigned practice book pages with high accuracy.',
    textVi: 'Đã hoàn thành toàn bộ bài tập trong sách bài tập với độ chính xác cao.',
  },
];

export const SessionEvaluationPanel = ({
  cls,
  sessionIndex = 3,
  session,
  now = Date.now(),
  isSessionUpcoming: isUpcomingProp,
  isSessionLive: isLiveProp,
  isSessionEnded: isEndedProp,
  canEvaluate: canEvaluateProp,
  roster = [],
  attendance = {},
  lessonPlan = {},
  userRole = 'teacher',
  currentStudentId = null,
  loading = false,
  onSaveEvaluation,
  onSaveAllEvaluations,
  scheduleSessions = [],
  selectedSessionOverride = null,
  onSelectSession,
}) => {
  const { t, isEnglish, language } = useLanguage();
  const isMobile = useIsMobile(992);
  const [evaluations, setEvaluations] = useState({});
  const [zaloPreview, setZaloPreview] = useState(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [historyDocs, setHistoryDocs] = useState([]);
  const localEditsRef = useRef({});

  const isTeacher = userRole === 'teacher';
  const isAcademic = ['academic', 'admin', 'director'].includes(userRole);
  const isStudent = userRole === 'student';

  // 1. Tải danh sách lịch sử đánh giá từ Firestore để hiển thị trạng thái từng buổi trong Selector
  useEffect(() => {
    if (!cls?.id) return;
    let isMounted = true;
    ClassroomService.getEvaluationHistory(cls.id)
      .then((docs) => {
        if (isMounted) setHistoryDocs(docs || []);
      })
      .catch((err) => {
        console.warn('[SessionEvaluationPanel] Error loading evaluation history:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [cls?.id, attendance?.id, attendance?.updatedAt]);

  // 2. Xây dựng bản đồ trạng thái đánh giá cho từng buổi học
  const evaluatedSessionMap = useMemo(() => {
    const map = {};
    historyDocs.forEach((doc) => {
      const evals = doc.studentEvaluations || {};
      const evalEntries = Object.values(evals).filter((e) => e?.stars || e?.comment);
      const evalCount = evalEntries.length;
      const totalStars = evalEntries.reduce((sum, e) => sum + (Number(e.stars) || 5), 0);
      const avgStars = evalCount > 0 ? (totalStars / evalCount).toFixed(1) : null;

      const info = {
        evalCount,
        avgStars,
        evaluatedAt: doc.updatedAt || doc.createdAt,
        hasEvaluations: evalCount > 0,
      };

      if (doc.sessionStart) map[doc.sessionStart] = info;
      if (doc.id) map[doc.id] = info;
      if (doc.date) map[doc.date] = info;
    });
    return map;
  }, [historyDocs]);

  // Trạng thái buổi học hiện tại
  const isSessionUpcoming = isUpcomingProp !== undefined
    ? Boolean(isUpcomingProp)
    : Boolean(session && !selectedSessionOverride && !session.isEnded && now < session.start);
  const isSessionLive = isLiveProp !== undefined
    ? Boolean(isLiveProp)
    : Boolean(session && now >= session.start && now < session.end);
  const isSessionEnded = isEndedProp !== undefined
    ? Boolean(isEndedProp)
    : Boolean(session && (session.isEnded || now >= session.end));
  const isNoSession = !session;

  const canEvaluate = canEvaluateProp !== undefined
    ? Boolean(canEvaluateProp)
    : Boolean(
        (!isSessionUpcoming || Boolean(selectedSessionOverride)) &&
        !isNoSession &&
        (isTeacher || isAcademic)
      );

  const formattedSessionDate = session?.start
    ? new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'vi-VN', {
        dateStyle: 'medium',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(session.start)
    : attendance?.date || cls?.startDate || '';

  const formattedSessionTime = session?.start && session?.end
    ? `${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(session.start)} - ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(session.end)}`
    : cls?.scheduleData?.formatted || cls?.schedule || '';

  // 3. Khởi tạo & cập nhật dữ liệu đánh giá khi đổi session hoặc nạp record mới
  useEffect(() => {
    localEditsRef.current = {};
    const existing = attendance?.studentEvaluations || {};
    const notes = attendance?.quickNotes || {};
    const presence = attendance?.presence || {};

    const nextMap = {};
    roster.forEach((s) => {
      const note = notes[s.id];
      const isOffline = presence[s.id] === 'OFFLINE';

      const hasNoteText = Boolean(note?.text);
      const hasNoteTags = Boolean(note?.tags && note.tags.length > 0);
      const noteComment = hasNoteText ? note.text : (hasNoteTags ? note.tags.join(', ') : '');

      if (existing[s.id]) {
        nextMap[s.id] = {
          stars: existing[s.id].stars || (isOffline ? 1 : 5),
          comment: existing[s.id].comment ?? noteComment,
          tags: existing[s.id].tags || note?.tags || [],
        };
      } else {
        nextMap[s.id] = {
          stars: isOffline ? 1 : 5,
          comment: noteComment,
          tags: note?.tags || [],
        };
      }
    });
    setEvaluations(nextMap);
  }, [
    attendance?.id,
    attendance?.sessionId,
    attendance?.date,
    attendance?.studentEvaluations,
    attendance?.quickNotes,
    attendance?.presence,
    roster,
    session?.start,
  ]);

  const handleUpdateStudent = (studentId, field, value) => {
    localEditsRef.current[studentId] = {
      ...(localEditsRef.current[studentId] || {}),
      [field]: value,
    };
    setEvaluations((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value,
      },
    }));
  };

  const handleInsertTag = (studentId, snippetText) => {
    const current = evaluations[studentId]?.comment || '';
    const updated = current ? `${current} ${snippetText}` : snippetText;
    handleUpdateStudent(studentId, 'comment', updated);
  };

  const handleSaveStudent = async (studentId) => {
    if (!canEvaluate) {
      message.warning(
        isEnglish
          ? 'Session has not started yet. Evaluation is locked.'
          : 'Buổi học chưa diễn ra. Đánh giá đang tạm khóa.'
      );
      return;
    }
    const item = evaluations[studentId];
    if (!item) return;
    try {
      await onSaveEvaluation?.(studentId, item);
      delete localEditsRef.current[studentId];
      message.success(t('classroom.evaluationSaved') || 'Đã lưu đánh giá học viên!');
    } catch (err) {
      message.error(err.message || 'Lỗi lưu đánh giá');
    }
  };

  const handleSaveAll = async () => {
    if (!canEvaluate) {
      message.warning(
        isEnglish
          ? 'Session has not started yet. Evaluation is locked.'
          : 'Buổi học chưa diễn ra. Đánh giá đang tạm khóa.'
      );
      return;
    }
    try {
      await onSaveAllEvaluations?.(evaluations);
      localEditsRef.current = {};
      message.success(t('classroom.allEvaluationsSaved') || 'Đã lưu toàn bộ đánh giá buổi học!');
    } catch (err) {
      message.error(err.message || 'Lỗi lưu đánh giá');
    }
  };

  // 4. Lựa chọn buổi học từ Dropdown (Retroactive Selector)
  const getSessionEvalStatus = (s) => {
    const isFuture = s.dateMs > now;
    const isLive = s.dateMs <= now && now < s.endMs;
    const sessionKey = s.dateMs;
    const docId = `LIVE_${cls?.id}_${s.dateMs}`;
    const info = evaluatedSessionMap[sessionKey] || evaluatedSessionMap[docId] || evaluatedSessionMap[s.date];

    const hasEvaluations = Boolean(info?.hasEvaluations);
    return {
      isFuture,
      isLive,
      hasEvaluations,
      evalCount: info?.evalCount || 0,
      avgStars: info?.avgStars || null,
    };
  };

  const sessionOptions = useMemo(() => {
    if (!scheduleSessions.length) return [];
    return scheduleSessions.map((s) => {
      const status = getSessionEvalStatus(s);
      let statusTag = '';
      if (status.isFuture) {
        statusTag = isEnglish ? '⏳ Upcoming' : '🔒 Chưa diễn ra';
      } else if (status.hasEvaluations) {
        statusTag = isEnglish ? `✅ Evaluated (${status.avgStars}⭐)` : `✅ Đã đánh giá (${status.avgStars}⭐)`;
      } else if (status.isLive) {
        statusTag = isEnglish ? '🟢 Live now (Not evaluated)' : '🟢 Đang diễn ra (Chưa ĐG ⚠️)';
      } else {
        const isToday = s.dateMs <= now && now - s.endMs < 12 * 3600 * 1000;
        statusTag = isToday
          ? isEnglish
            ? '⚠️ Today (Pending)'
            : '⚠️ Hôm nay (Chưa ĐG)'
          : isEnglish
          ? '⚠️ Missed (Retroactive)'
          : '⚠️ Quên đánh giá (Đánh giá bù)';
      }

      const mainLabel = s.label ? s.label.split('—')[0].trim() : `Buổi ${s.sessionIndex} (${s.date})`;

      return {
        value: s.dateMs,
        label: `${mainLabel} — ${statusTag}`,
        session: s,
        status,
      };
    });
  }, [scheduleSessions, evaluatedSessionMap, now, isEnglish]);

  const handleSelectSession = (sessionDateMs) => {
    const targetMs = Number(sessionDateMs);
    const found = scheduleSessions.find((s) => s.dateMs === targetMs);
    if (!found) return;
    localEditsRef.current = {};
    onSelectSession?.({
      start: found.dateMs,
      end: found.endMs,
      sessionIndex: found.sessionIndex,
      isEnded: found.endMs <= now,
      id: `LIVE_${cls?.id}_${found.dateMs}`,
      date: found.date,
      label: found.label,
    });
  };

  const totalCompletedSessions = useMemo(() => {
    if (!scheduleSessions.length) return 0;
    return scheduleSessions.filter((s) => getSessionEvalStatus(s).hasEvaluations).length;
  }, [scheduleSessions, evaluatedSessionMap]);

  const pastSessionsCount = useMemo(() => {
    if (!scheduleSessions.length) return 0;
    return scheduleSessions.filter((s) => s.endMs <= now).length;
  }, [scheduleSessions, now]);

  const currentSessionEvalStatus = session ? getSessionEvalStatus({ dateMs: session.start, endMs: session.end }) : null;
  const isRetroactiveEditMode = Boolean(selectedSessionOverride && session && currentSessionEvalStatus?.hasEvaluations);
  const isRetroactiveNewMode = Boolean(selectedSessionOverride && session && session.end < now && !currentSessionEvalStatus?.hasEvaluations);

  const totalEvaluated = Object.values(evaluations).filter((e) => e?.comment || e?.stars).length;

  const openZaloPreview = (student, evalData) => {
    const cleanPhone = String(student.parentPhone || student.phone || '').trim().replace(/[\s\-().]/g, '');
    const studentTitle = student.englishName ? `${student.englishName} (${student.name})` : student.name;
    const starsStr = '⭐'.repeat(evalData?.stars || 5);
    const hw = lessonPlan?.homework || 'Practice Book';
    const isOffline = attendance.presence?.[student.id] === 'OFFLINE';
    const commentText = evalData?.comment?.trim() || (isOffline
      ? (isEnglish ? 'Absent from class today.' : 'Vắng mặt buổi học hôm nay.')
      : (isEnglish ? 'Actively participated in class, pronunciation was very clear and completed homework well.' : 'Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay.'));

    const msg = `Kính gửi Phụ Huynh bé ${studentTitle},
LAK EDUCATION xin gửi kết quả buổi học ngày ${attendance.date || new Date().toLocaleDateString('vi-VN')}:
• Tình trạng: ${isOffline ? 'Vắng mặt' : 'Online (Có mặt đúng giờ)'}
• Mức độ tiếp thu: ${starsStr} (${evalData?.stars || 5}/5 sao)
• Nhận xét trực tiếp của Giáo viên:
  "${commentText}"
• Bài tập về nhà: ${hw}.

Cảm ơn Quý Phụ Huynh đã đồng hành cùng con!`;

    setZaloPreview({
      phone: cleanPhone,
      content: msg,
      studentName: studentTitle,
    });
  };

  // 1. STUDENT VIEW
  if (isStudent) {
    const studentData = roster.find((s) => s.id === currentStudentId) || roster[0];
    const studentEval = studentData ? evaluations[studentData.id] || {} : {};
    const isOnline = attendance.presence?.[studentData?.id] === 'ONLINE';

    if (isSessionUpcoming) {
      return (
        <Card style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 20 }}>
            <Space orientation="horizontal" size="middle">
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#fa8c16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <ClockCircleOutlined />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  {isEnglish
                    ? `Upcoming Session for ${studentData?.englishName || studentData?.name}`
                    : `Thông Tin Buổi Học Sắp Tới Của ${studentData?.englishName || studentData?.name}`}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isEnglish
                    ? `Scheduled: ${formattedSessionDate} • Time: ${formattedSessionTime}`
                    : `Lịch học: ${formattedSessionDate} • Giờ học: ${formattedSessionTime}`}
                </Text>
              </div>
            </Space>
            <Tag color="orange" style={{ borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {isEnglish ? '⏳ Upcoming Session' : '⏳ Buổi Học Chưa Diễn Ra'}
            </Tag>
          </div>

          <Alert
            type="info"
            showIcon
            icon={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            message={isEnglish ? 'Post-Session Evaluation Notice' : 'Thông Báo Đánh Giá Buổi Học'}
            description={isEnglish
              ? 'This session has not taken place yet. Your attendance status, teacher feedback, and star ratings will be updated here after the class ends. You can review your past session evaluation history using the button below.'
              : 'Buổi học này chưa diễn ra. Kết quả điểm danh, nhận xét trực tiếp của giáo viên và điểm số tiếp thu sẽ được cập nhật tại đây sau khi buổi học kết thúc. Bạn có thể tra cứu lịch sử đánh giá các buổi học trước bằng nút bên dưới.'}
            style={{ borderRadius: 12, marginBottom: 20 }}
            data-testid="student-upcoming-session-alert"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setIsHistoryDrawerOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600, color: '#096dd9', borderColor: '#91caff' }}
              data-testid="btn-student-view-history"
            >
              {isEnglish ? '📜 View Past Evaluations History' : '📜 Xem Lịch Sử Đánh Giá Các Buổi Trước'}
            </Button>
          </div>

          <EvaluationHistoryDrawer
            open={isHistoryDrawerOpen}
            onClose={() => setIsHistoryDrawerOpen(false)}
            cls={cls}
            roster={roster}
            currentEvaluations={evaluations}
            currentSessionIndex={sessionIndex}
            currentDate={attendance.date}
            currentSessionId={attendance?.sessionId || attendance?.id}
            userRole={userRole}
            currentStudentId={currentStudentId}
          />
        </Card>
      );
    }

    return (
      <Card style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 20 }}>
          <Space orientation="horizontal" size="middle">
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#faad14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              <TrophyOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                {isEnglish
                  ? `Evaluation & Teacher Feedback for ${studentData?.englishName || studentData?.name}`
                  : `Kết Quả & Nhận Xét Của Thầy Cô Dành Cho ${studentData?.englishName || studentData?.name}`}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isEnglish ? `Date: ${attendance.date || 'Today'} • Teacher: ${attendance.teacherName || 'Teacher Maj'}` : `Ngày học: ${attendance.date || 'Hôm nay'} • Giáo viên: ${attendance.teacherName || 'Teacher Maj'}`}
              </Text>
            </div>
          </Space>
          <Tag color={isOnline ? 'success' : 'error'} style={{ borderRadius: 20, padding: '4px 12px', fontSize: 13, whiteSpace: 'nowrap' }}>
            {isOnline ? '🟢 Online' : '🔴 Absent'}
          </Tag>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {isEnglish ? 'Attendance:' : 'Chuyên Cần:'}
              </Text>
              <Text strong style={{ fontSize: 14, color: isOnline ? '#389e0d' : '#cf1322', whiteSpace: 'nowrap' }}>
                {isOnline ? (isEnglish ? '🟢 Online (On time)' : '🟢 Online (Có mặt đúng giờ)') : (isEnglish ? '🔴 Absent' : '🔴 Vắng mặt')}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {isEnglish ? 'Rating & Engagement:' : 'Mức Độ Tiếp Thu & Tương Tác:'}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Rate disabled value={studentEval.stars || 5} character={<StarFilled />} style={{ fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: '#faad14', whiteSpace: 'nowrap' }}>
                  ({studentEval.stars || 5}/5 ⭐)
                </Text>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {isEnglish ? 'Homework:' : 'Bài Tập Về Nhà Cần Làm:'}
              </Text>
              <Text strong style={{ fontSize: 13, color: '#096dd9' }}>
                {lessonPlan?.homework || 'Practice Book'}
              </Text>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 20, backgroundColor: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 12, padding: 16 }}>
          <Text strong style={{ color: '#1d39c4', display: 'block', marginBottom: 6 }}>
            💬 {isEnglish ? "Direct Teacher's Evaluation & Feedback:" : 'Lời Nhận Xét Trực Tiếp Từ Giáo Viên:'}
          </Text>
          <Paragraph italic style={{ fontSize: 13, color: '#262626', margin: 0, lineHeight: '22px', whiteSpace: 'pre-line' }}>
            "{studentEval.comment?.trim() || (isOnline
              ? (isEnglish ? 'Actively participated in class, pronunciation was very clear and completed homework well.' : 'Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay.')
              : (isEnglish ? 'Absent from class today.' : 'Vắng mặt buổi học hôm nay.'))}"
          </Paragraph>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setIsHistoryDrawerOpen(true)}
            style={{ borderRadius: 8, fontWeight: 600, color: '#096dd9', borderColor: '#91caff' }}
            data-testid="btn-student-view-history"
          >
            {isEnglish ? '📜 View Past Evaluations History' : '📜 Xem Lịch Sử Đánh Giá Các Buổi Trước'}
          </Button>
        </div>

        <EvaluationHistoryDrawer
          open={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          cls={cls}
          roster={roster}
          currentEvaluations={evaluations}
          currentSessionIndex={sessionIndex}
          currentDate={attendance.date}
          currentSessionId={attendance?.sessionId || attendance?.id}
          userRole={userRole}
          currentStudentId={currentStudentId}
        />
      </Card>
    );
  }

  // 2. TEACHER / ACADEMIC DESKTOP TABLE COLUMNS
  const columns = [
    {
      title: isEnglish ? 'Student' : 'Học Viên',
      key: 'student',
      width: 210,
      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 12 } }),
      render: (_, record) => {
        const primary = record.englishName || record.name;
        const secondary = record.englishName && record.name !== record.englishName ? record.name : '';
        const studentCode = record.code || record.id;
        const note = attendance.quickNotes?.[record.id];
        const hasTags = Boolean(note?.tags && note.tags.length > 0);
        const hasText = Boolean(note?.text);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 160, justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Text strong style={{ fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap' }}>{primary}</Text>
                <Tag color="default" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {studentCode}
                </Tag>
              </div>
              {secondary && <Text type="secondary" style={{ fontSize: 11 }}>{secondary}</Text>}
            </div>

            <div
              style={{
                marginTop: 6,
                padding: '6px 8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                minHeight: 88,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 11 }} />
                <span style={{ whiteSpace: 'nowrap' }}>{isEnglish ? 'In-Class Notes:' : 'Note Trong Giờ:'}</span>
              </div>
              {hasTags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                  {note.tags.map((tag) => (
                    <Tag key={tag} color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
              {hasText ? (
                <div style={{ fontSize: 11, color: '#334155', fontStyle: 'italic', lineHeight: '15px' }}>
                  "{note.text}"
                </div>
              ) : !hasTags ? (
                <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
                  {isEnglish ? 'No in-class note' : 'Chưa có ghi chú'}
                </div>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      title: isEnglish ? 'Attendance' : 'Tham Gia',
      key: 'presence',
      width: 135,
      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 12 } }),
      render: (_, record) => {
        const p = attendance.presence?.[record.id];
        const isOnline = p === 'ONLINE';
        const isOffline = p === 'OFFLINE';
        const isDistracted = attendance.attentionFlags?.[record.id] === 'DISTRACTED';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 160, justifyContent: 'space-between' }}>
            <div>
              <Tag color={isOnline ? 'success' : isOffline ? 'error' : 'default'} style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {isOnline ? 'Online' : isOffline ? 'Offline' : (isEnglish ? 'Unmarked' : 'Chưa điểm danh')}
              </Tag>
            </div>

            <div
              style={{
                marginTop: 6,
                padding: '6px 8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                minHeight: 88,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Text style={{ fontSize: 11, color: isOnline ? '#389e0d' : isOffline ? '#cf1322' : '#8c8c8c', display: 'block', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isOnline
                    ? (isEnglish ? '✓ Present in room' : '✓ Đã vào phòng học')
                    : isOffline
                    ? (isEnglish ? '✕ Absent today' : '✕ Vắng mặt buổi học')
                    : (isEnglish ? '• Unchecked' : '• Chưa kiểm tra')}
                </Text>
              </div>

              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>
                  {isEnglish ? 'Focus State:' : 'Tập Trung:'}
                </div>
                {isDistracted ? (
                  <Tag color="orange" icon={<AlertOutlined />} style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                    {isEnglish ? '⚠️ Distracted (1x)' : '⚠️ Cần tập trung (1 lần)'}
                  </Tag>
                ) : isOnline ? (
                  <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                    {isEnglish ? 'Focused' : 'Tập trung tốt'}
                  </Tag>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>--</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: isEnglish ? 'Rating (⭐)' : 'Đánh Giá (⭐)',
      key: 'stars',
      width: 175,
      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 12 } }),
      render: (_, record) => {
        const item = evaluations[record.id] || {};
        const p = attendance.presence?.[record.id];
        const isOffline = p === 'OFFLINE';
        const stars = item.stars || (isOffline ? 1 : 5);

        const ratingLabel = stars === 5
          ? (isEnglish ? 'Excellent' : 'Xuất sắc')
          : stars === 4
          ? (isEnglish ? 'Very Good' : 'Rất tốt')
          : stars === 3
          ? (isEnglish ? 'Average' : 'Cần cố gắng')
          : stars === 2
          ? (isEnglish ? 'Weak' : 'Còn yếu')
          : (isEnglish ? 'Absent' : 'Vắng học');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 160, justifyContent: 'space-between' }}>
            <div>
              <Rate
                value={stars}
                disabled={!canEvaluate}
                character={<StarFilled />}
                style={{ fontSize: 14 }}
                onChange={(val) => handleUpdateStudent(record.id, 'stars', val)}
                data-testid={`eval-rate-${record.id}`}
              />
            </div>

            <div
              style={{
                marginTop: 6,
                padding: '6px 8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                minHeight: 88,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Text strong style={{ fontSize: 11, color: stars >= 4 ? '#faad14' : stars === 3 ? '#fa8c16' : '#ff4d4f', display: 'block', whiteSpace: 'nowrap' }}>
                  {stars}/5 ⭐ • {ratingLabel}
                </Text>
              </div>

              {isTeacher && canEvaluate && (
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  {[5, 4, 3, 1].map((sVal) => (
                    <Button
                      key={sVal}
                      size="small"
                      type={stars === sVal ? 'primary' : 'default'}
                      style={{ fontSize: 10, height: 20, padding: '0 4px', borderRadius: 4, minWidth: 24, whiteSpace: 'nowrap' }}
                      onClick={() => handleUpdateStudent(record.id, 'stars', sVal)}
                    >
                      {sVal}⭐
                    </Button>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 10, color: isSessionUpcoming ? '#fa8c16' : '#08979c', marginTop: 2, whiteSpace: 'nowrap' }}>
                {isSessionUpcoming
                  ? (isEnglish ? '⏳ Session upcoming' : '⏳ Chưa diễn ra')
                  : (isEnglish ? '⚡ Auto pre-filled' : '⚡ Tự động điền')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: isEnglish ? "Teacher's Evaluation (Pre-filled from In-class Notes)" : 'Nhận Xét Của Giáo Viên (Pre-filled từ Note trong giờ)',
      key: 'comment',
      minWidth: 460,
      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 12 } }),
      render: (_, record) => {
        const item = evaluations[record.id] || {};
        const p = attendance.presence?.[record.id];
        const isOffline = p === 'OFFLINE';

        const placeholderText = isSessionUpcoming
          ? (isEnglish ? 'Post-session evaluation will unlock when this session starts...' : 'Đánh giá sau giờ sẽ mở khi buổi học bắt đầu...')
          : isOffline
          ? (isEnglish ? 'Absent from class today...' : 'Vắng mặt buổi học hôm nay...')
          : (isEnglish
              ? 'Actively participated in class, pronunciation was very clear and completed homework well...'
              : 'Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay...');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SimpleEvaluationEditor
              value={item.comment || ''}
              disabled={!canEvaluate}
              onChange={(val) => handleUpdateStudent(record.id, 'comment', val)}
              placeholder={placeholderText}
              testId={`eval-comment-${record.id}`}
              studentName={record.englishName || record.name}
            />

            {/* Quick Pedagogical Tags 1-tap below editor */}
            {canEvaluate && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {QUICK_PEDAGOGICAL_TAGS.map((tag) => (
                  <Button
                    key={tag.label}
                    size="small"
                    type="dashed"
                    style={{ fontSize: 11, height: 22, padding: '0 6px', borderRadius: 4, whiteSpace: 'nowrap' }}
                    onClick={() => handleInsertTag(record.id, isEnglish ? tag.text : tag.textVi)}
                  >
                    {isEnglish ? tag.labelEn : tag.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: isEnglish ? 'Action' : 'Hành Động',
      key: 'action',
      width: 130,
      align: 'right',
      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 12 } }),
      render: (_, record) => {
        const item = evaluations[record.id] || {};
        const cleanPhone = String(record.parentPhone || record.phone || '').trim().replace(/[\s\-().]/g, '');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 160, justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Space orientation="horizontal" size="small">
              {isTeacher && (
                <Button
                  size="small"
                  icon={<SaveOutlined />}
                  disabled={!canEvaluate}
                  onClick={() => handleSaveStudent(record.id)}
                  style={{ whiteSpace: 'nowrap' }}
                  data-testid={`btn-save-eval-${record.id}`}
                >
                  {isEnglish ? 'Save' : 'Lưu'}
                </Button>
              )}
              {isAcademic && cleanPhone && (
                <Button
                  size="small"
                  type="primary"
                  disabled={!canEvaluate}
                  style={{ backgroundColor: canEvaluate ? '#1890ff' : '#d9d9d9', borderRadius: 6, whiteSpace: 'nowrap' }}
                  icon={<MessageOutlined />}
                  onClick={() => openZaloPreview(record, item)}
                  data-testid={`btn-zalo-${record.id}`}
                >
                  {isEnglish ? 'Parent Zalo' : 'Zalo PH'}
                </Button>
              )}
            </Space>

            <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {isAcademic && cleanPhone ? `${cleanPhone.slice(-4)}` : ''}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <Card style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: isMobile ? 12 : 20 }}>
      {/* 1. Header Hub & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: 12,
        }}
      >
        <div>
          <Space orientation="horizontal" size="small" wrap>
            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {isEnglish ? 'Post-Session Evaluation Hub' : 'Trung Tâm Đánh Giá Sau Buổi Học'}
            </Tag>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {isEnglish
                ? `Completed: ${totalCompletedSessions}/${pastSessionsCount} sessions`
                : `Đã đánh giá: ${totalCompletedSessions}/${pastSessionsCount} buổi (${pastSessionsCount > 0 ? Math.round((totalCompletedSessions / pastSessionsCount) * 100) : 0}%)`}
            </Tag>
          </Space>
          <Title level={5} style={{ margin: '4px 0 0 0', fontWeight: 700 }}>
            {isEnglish
              ? 'Detailed Session Evaluation & Parent Outreach'
              : 'Bảng Đánh Giá Chi Tiết Buổi Học & Gửi Phụ Huynh'}
          </Title>
        </div>

        {(isTeacher || isAcademic) && (
          <Space size="middle" wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
            <Button
              icon={<VideoCameraOutlined style={{ color: '#7c3aed' }} />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                borderColor: '#d8b4fe',
                color: '#7c3aed',
                backgroundColor: '#faf5ff',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setIsRecordingModalOpen(true)}
              data-testid="btn-upload-session-recording"
            >
              {isEnglish ? 'Upload Video' : 'Tải Video (Tùy Chọn)'}
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              disabled={!canEvaluate}
              style={{ borderRadius: 8, fontWeight: 600, whiteSpace: 'nowrap' }}
              onClick={handleSaveAll}
              data-testid="btn-save-all-evaluations"
            >
              {isEnglish ? 'Save & Complete' : 'Lưu & Hoàn Tất'}
            </Button>
          </Space>
        )}
      </div>

      {/* 2. Top Session Selector: Bộ Chọn Buổi Học Thông Minh */}
      <div
        data-testid="retroactive-session-selector-container"
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, flex: 1 }}>
          <Text strong style={{ fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>
            📅 {isEnglish ? 'Select Session to Evaluate:' : 'Chọn Buổi Học Cần Đánh Giá:'}
          </Text>
          <Select
            value={session?.start || scheduleSessions[0]?.dateMs}
            onChange={handleSelectSession}
            options={sessionOptions}
            style={{ width: isMobile ? '100%' : 440, height: 38 }}
            data-testid="select-retroactive-session"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            {isEnglish
              ? `Session progress: ${totalEvaluated}/${roster.length} students`
              : `Buổi này: ${totalEvaluated}/${roster.length} học viên`}
          </Text>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setIsHistoryDrawerOpen(true)}
            style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, borderColor: '#91caff', color: '#096dd9', whiteSpace: 'nowrap' }}
            data-testid="btn-open-evaluation-history"
          >
            {isEnglish ? 'Past History' : 'Lịch Sử'}
          </Button>
        </div>
      </div>

      {/* 3. Session Context Card: Đang đánh giá buổi học nào */}
      <div
        data-testid="evaluation-session-context-card"
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
          border: '1px solid #bae0ff',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <Space size={8} wrap style={{ alignItems: 'center' }}>
          <Tag color="geekblue" style={{ fontSize: 13, padding: '3px 8px', borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {isEnglish ? `Session ${sessionIndex}` : `Buổi ${sessionIndex}`}
          </Tag>
          <Text strong style={{ fontSize: 13, color: '#1d39c4' }}>
            {lessonPlan?.title || (isEnglish ? `Session ${sessionIndex}: McGraw-Hill Wonders G1` : `Buổi ${sessionIndex}: McGraw-Hill Wonders G1`)}
          </Text>
          {lessonPlan?.unit && (
            <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>{lessonPlan.unit}</Tag>
          )}
        </Space>

        <Space size={12} wrap style={{ fontSize: 12, color: '#64748b', alignItems: 'center' }}>
          <span>
            <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {isEnglish ? 'Date: ' : 'Ngày học: '}
            <strong style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>
              {formattedSessionDate || attendance.date || new Date().toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN')}
            </strong>
          </span>
          {cls?.name && (
            <span>
              <TeamOutlined style={{ marginRight: 4, color: '#52c41a' }} />
              {isEnglish ? 'Class: ' : 'Lớp: '}
              <strong style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>{cls.name}</strong>
            </span>
          )}
        </Space>
      </div>

      {/* 4. Trạng Thái Buổi Học Đang Chọn Banner */}
      {isRetroactiveNewMode && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined style={{ color: '#fa8c16' }} />}
          message={
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {isEnglish
                ? `Retroactive Evaluation: Session ${sessionIndex} (${formattedSessionDate})`
                : `Đang Đánh Giá Bù Cho: Buổi ${sessionIndex} (${formattedSessionDate})`}
            </span>
          }
          description={
            <div style={{ marginTop: 2, fontSize: 12, lineHeight: '18px' }}>
              {isEnglish
                ? 'This past session was missed. Your ratings and comments will be saved directly into the student academic records.'
                : 'Buổi học này đã kết thúc trước đây nhưng chưa có đánh giá. Điểm số và nhận xét sẽ tự động lưu vào học bạ của các em.'}
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="banner-retroactive-evaluation"
        />
      )}

      {isRetroactiveEditMode && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          message={
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {isEnglish
                ? `Session ${sessionIndex} (${formattedSessionDate}) — Already Evaluated`
                : `Buổi ${sessionIndex} (${formattedSessionDate}) — Đã Hoàn Tất Đánh Giá`}
            </span>
          }
          description={
            <div style={{ marginTop: 2, fontSize: 12, lineHeight: '18px' }}>
              {isEnglish
                ? 'This session has been evaluated. You can review, update ratings or notes, and save changes at any time.'
                : 'Buổi học này đã hoàn tất đánh giá. Bạn có thể xem lại, cập nhật điểm sao hoặc lời nhận xét và lưu lại bất cứ lúc nào.'}
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="banner-evaluated-session"
        />
      )}

      {isSessionUpcoming && !selectedSessionOverride && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
          message={
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {isEnglish ? 'Upcoming Session — Evaluation Temporarily Locked' : 'Buổi Học Chưa Diễn Ra — Đánh Giá Sau Giờ Đang Tạm Khóa'}
            </span>
          }
          description={
            <div style={{ marginTop: 4, lineHeight: '20px', fontSize: 12 }}>
              <span>
                {isEnglish
                  ? `This session is scheduled for ${formattedSessionTime} on ${formattedSessionDate}. Student rating and teacher feedback editing will automatically unlock once the session starts.`
                  : `Buổi học này dự kiến diễn ra lúc ${formattedSessionTime} ngày ${formattedSessionDate}. Tính năng chấm sao và nhận xét của giáo viên sẽ tự động mở khi buổi học bắt đầu.`}
              </span>
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="upcoming-session-evaluation-banner"
        />
      )}

      {/* 5. Giao Diện Hiển Thị: Desktop Table vs Mobile Cards */}
      {isMobile ? (
        /* 📱 MOBILE VIEW (< 992px): Danh Sách Thẻ Học Viên Công Thái Học */
        <div data-testid="mobile-evaluation-card-list">
          {roster.map((record) => {
            const item = evaluations[record.id] || {};
            const p = attendance.presence?.[record.id];
            const isOnline = p === 'ONLINE';
            const isOffline = p === 'OFFLINE';
            const stars = item.stars || (isOffline ? 1 : 5);
            const studentCode = record.code || record.id;
            const primaryName = record.englishName || record.name;
            const secondaryName = record.englishName && record.name !== record.englishName ? record.name : '';
            const note = attendance.quickNotes?.[record.id];
            const hasTags = Boolean(note?.tags && note.tags.length > 0);
            const hasText = Boolean(note?.text);

            const placeholderText = isSessionUpcoming && !selectedSessionOverride
              ? (isEnglish ? 'Post-session evaluation will unlock when this session starts...' : 'Đánh giá sau giờ sẽ mở khi buổi học bắt đầu...')
              : isOffline
              ? (isEnglish ? 'Absent from class today...' : 'Vắng mặt buổi học hôm nay...')
              : (isEnglish
                  ? 'Actively participated in class, pronunciation was very clear and completed homework well...'
                  : 'Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay...');

            return (
              <Card
                key={record.id}
                size="small"
                style={{
                  borderRadius: 12,
                  marginBottom: 12,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  width: '100%',
                }}
                bodyStyle={{ padding: 14 }}
                data-testid={`mobile-eval-card-${record.id}`}
              >
                {/* Header Thẻ: Avatar, Tên, Mã, Trạng Thái Online */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar style={{ backgroundColor: isOnline ? '#52c41a' : isOffline ? '#ff4d4f' : '#1890ff', fontWeight: 700 }}>
                      {primaryName.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong style={{ fontSize: 14, color: '#1e293b', whiteSpace: 'nowrap' }}>{primaryName}</Text>
                        <Tag color="default" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                          {studentCode}
                        </Tag>
                      </div>
                      {secondaryName && <Text type="secondary" style={{ fontSize: 11 }}>{secondaryName}</Text>}
                    </div>
                  </div>
                  <Tag color={isOnline ? 'success' : isOffline ? 'error' : 'default'} style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                    {isOnline ? '🟢 Online' : isOffline ? '🔴 Offline' : '⚪ Unmarked'}
                  </Tag>
                </div>

                {/* Note Trong Giờ Học (nếu có) */}
                {(hasTags || hasText) && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '6px 8px',
                      marginBottom: 10,
                      fontSize: 11,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#475569', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileTextOutlined style={{ color: '#1890ff', fontSize: 11 }} />
                      <span style={{ whiteSpace: 'nowrap' }}>{isEnglish ? 'In-Class Note:' : 'Ghi chú trong giờ:'}</span>
                    </div>
                    {hasTags && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 2 }}>
                        {note.tags.map((t) => (
                          <Tag key={t} color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                            {t}
                          </Tag>
                        ))}
                      </div>
                    )}
                    {hasText && (
                      <div style={{ color: '#334155', fontStyle: 'italic' }}>
                        "{note.text}"
                      </div>
                    )}
                  </div>
                )}

                {/* Đánh Giá Sao & Nút Chấm Sao Nhanh */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Rate
                      value={stars}
                      disabled={!canEvaluate}
                      character={<StarFilled />}
                      style={{ fontSize: 18 }}
                      onChange={(val) => handleUpdateStudent(record.id, 'stars', val)}
                      data-testid={`eval-rate-mobile-${record.id}`}
                    />
                    <Text strong style={{ fontSize: 12, color: '#faad14', whiteSpace: 'nowrap' }}>
                      ({stars}/5 ⭐)
                    </Text>
                  </div>
                  {isTeacher && canEvaluate && (
                    <Space size={3}>
                      {[5, 4, 3, 1].map((sVal) => (
                        <Button
                          key={sVal}
                          size="small"
                          type={stars === sVal ? 'primary' : 'default'}
                          style={{ fontSize: 11, height: 26, minWidth: 28, padding: '0 4px', borderRadius: 4, whiteSpace: 'nowrap' }}
                          onClick={() => handleUpdateStudent(record.id, 'stars', sVal)}
                        >
                          {sVal}⭐
                        </Button>
                      ))}
                    </Space>
                  )}
                </div>

                {/* Hàng Quick Tags 1-Chạm Mẫu */}
                {canEvaluate && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
                      {isEnglish ? '⚡ Quick Feedback Snippets (1-Tap):' : '⚡ Tag Nhận Xét Nhanh 1-Chạm:'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {QUICK_PEDAGOGICAL_TAGS.map((tag) => (
                        <Button
                          key={tag.label}
                          size="small"
                          type="dashed"
                          style={{
                            fontSize: 11,
                            height: 28,
                            padding: '0 8px',
                            borderRadius: 6,
                            whiteSpace: 'nowrap',
                            backgroundColor: '#fafafa',
                          }}
                          onClick={() => handleInsertTag(record.id, isEnglish ? tag.text : tag.textVi)}
                        >
                          {isEnglish ? tag.labelEn : tag.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ô Nhập Nhận Xét Của Giáo Viên */}
                <Input.TextArea
                  rows={3}
                  value={item.comment || ''}
                  disabled={!canEvaluate}
                  onChange={(e) => handleUpdateStudent(record.id, 'comment', e.target.value)}
                  placeholder={placeholderText}
                  style={{ borderRadius: 8, fontSize: 13, width: '100%', marginBottom: 10 }}
                  data-testid={`eval-comment-mobile-${record.id}`}
                />

                {/* Nút Hành Động Ở Thẻ: Lưu Riêng Từng Em */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {isTeacher && (
                    <Button
                      size="small"
                      icon={<SaveOutlined />}
                      disabled={!canEvaluate}
                      onClick={() => handleSaveStudent(record.id)}
                      style={{ borderRadius: 6, fontWeight: 600, height: 32, whiteSpace: 'nowrap' }}
                      data-testid={`btn-save-eval-mobile-${record.id}`}
                    >
                      {isEnglish ? 'Save Student' : 'Lưu Em Này'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Sticky Bottom Action Bar trên Mobile */}
          {(isTeacher || isAcademic) && (
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginTop: 12,
                borderRadius: '12px 12px 0 0',
              }}
              data-testid="mobile-sticky-action-bar"
            >
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', color: '#1e293b', whiteSpace: 'nowrap' }}>
                  {isEnglish ? `Evaluated: ${totalEvaluated}/${roster.length}` : `Đã nhận xét: ${totalEvaluated}/${roster.length} em`}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  {isEnglish ? `Session ${sessionIndex}` : `Buổi ${sessionIndex}`}
                </Text>
              </div>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                disabled={!canEvaluate}
                onClick={handleSaveAll}
                style={{
                  height: 40,
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '0 16px',
                  whiteSpace: 'nowrap',
                }}
                data-testid="btn-mobile-save-all"
              >
                {isEnglish ? `Save Session ${sessionIndex}` : `Lưu Buổi ${sessionIndex}`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* 🖥️ DESKTOP VIEW (>= 992px): Table Chuẩn Mực */
        <Table
          dataSource={roster}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 1120 }}
          style={{ borderRadius: 8, overflow: 'hidden' }}
        />
      )}

      {/* Zalo Preview Modal */}
      {zaloPreview && (
        <Modal
          open={Boolean(zaloPreview)}
          wrapClassName="zalo-preview-modal-wrapper"
          title={
            <Space orientation="horizontal" size="small" data-testid="zalo-preview-modal-title">
              <MessageOutlined style={{ color: '#1890ff' }} />
              <span>
                {isEnglish ? 'Parent Zalo Message Preview: ' : 'Mẫu Tin Nhắn Zalo Phụ Huynh: '}
                <strong>{zaloPreview.studentName}</strong>
              </span>
            </Space>
          }
          onCancel={() => setZaloPreview(null)}
          footer={[
            <Button
              key="copy"
              onClick={() => {
                navigator.clipboard.writeText(zaloPreview.content);
                message.success(isEnglish ? 'Copied Zalo message to clipboard!' : 'Đã sao chép nội dung tin nhắn Zalo!');
              }}
            >
              📋 {isEnglish ? 'Copy Text' : 'Sao Chép'}
            </Button>,
            <Button
              key="send"
              type="primary"
              data-testid="btn-zalo-send-direct"
              href={`https://zalo.me/${zaloPreview.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setZaloPreview(null)}
            >
              {isEnglish ? 'Open Zalo & Send ↗' : 'Gửi Ngay Qua Zalo ↗'}
            </Button>,
          ]}
        >
          <div style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: '20px' }}>
            {zaloPreview.content}
          </div>
        </Modal>
      )}

      {/* Drawer xem lịch sử đánh giá các buổi học trước */}
      <EvaluationHistoryDrawer
        open={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        cls={cls}
        roster={roster}
        currentEvaluations={evaluations}
        currentSessionIndex={sessionIndex}
        currentDate={attendance.date}
        currentSessionId={attendance?.sessionId || attendance?.id}
        userRole={userRole}
        currentStudentId={currentStudentId}
      />

      {/* Modal tải lên video recording sau buổi học (Optional) */}
      <SessionRecordingUploadModal
        open={isRecordingModalOpen}
        classData={cls}
        currentUser={{ role: userRole }}
        onClose={() => setIsRecordingModalOpen(false)}
        onSuccess={() => {
          message.success(isEnglish ? 'Recording uploaded and shared to class!' : 'Đã tải lên video bài giảng cho lớp!');
        }}
      />
    </Card>
  );
};
