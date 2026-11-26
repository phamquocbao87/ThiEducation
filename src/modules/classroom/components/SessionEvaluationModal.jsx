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
  SendOutlined,
  StarFilled,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UnlockOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import {
  POST_SESSION_FEEDBACK_WINDOW_MS,
  evaluateSessionFeedbackCompleteness,
  formatFeedbackCountdown,
  getSessionFeedbackWindowState,
  mergeSessionEvaluationDocs,
  normalizeSessionDateKey,
} from '../../../shared/utils/classSessionUtils';
import { ClassroomService } from '../services/ClassroomService';
import { SimpleEvaluationEditor } from './SimpleEvaluationEditor';
import { FormattedText } from '../../../shared/components/controls';
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
  onRequestUnlock,
  onUnlockSession,
  onRelockSession,
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
  const [isRequestUnlockModalOpen, setIsRequestUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [isUnlockActionLoading, setIsUnlockActionLoading] = useState(false);
  const [historyDocs, setHistoryDocs] = useState([]);
  const localEditsRef = useRef({});
  const lastSessionKeyRef = useRef(null);

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

  const rosterIds = useMemo(
    () => (roster?.length ? roster.map((r) => r.id).filter(Boolean) : (cls?.studentIds || [])),
    [roster, cls?.studentIds]
  );

  // 2. Xây dựng bản đồ trạng thái đánh giá cho từng buổi học (hợp nhất lịch sử + live attendance 0ms)
  const evaluatedSessionMap = useMemo(() => {
    const rawByStart = new Map();
    const rawById = new Map();
    const rawByDate = new Map();

    const registerDoc = (doc) => {
      if (!doc) return;
      if (doc.sessionStart) {
        const k = Number(doc.sessionStart);
        rawByStart.set(k, mergeSessionEvaluationDocs(rawByStart.get(k), doc));
      }
      if (doc.id) {
        const k = String(doc.id);
        rawById.set(k, mergeSessionEvaluationDocs(rawById.get(k), doc));
      }
      const dKey = normalizeSessionDateKey(doc.date);
      if (dKey) {
        rawByDate.set(dKey, mergeSessionEvaluationDocs(rawByDate.get(dKey), doc));
      }
    };

    historyDocs.forEach(registerDoc);

    if (session?.start && (attendance?.studentEvaluations || attendance?.presence || attendance?.unlockState)) {
      registerDoc({
        id: session.id || `LIVE_${cls?.id}_${session.start}`,
        sessionStart: session.start,
        date: session.date || attendance.date,
        presence: attendance.presence || {},
        studentEvaluations: attendance.studentEvaluations || {},
        ...(attendance.unlockState ? { unlockState: attendance.unlockState } : {}),
        updatedAt: new Date().toISOString(),
      });
    }

    return { rawByStart, rawById, rawByDate };
  }, [
    historyDocs,
    session?.id,
    session?.start,
    session?.date,
    attendance?.date,
    attendance?.presence,
    attendance?.studentEvaluations,
    attendance?.unlockState,
    cls?.id,
  ]);

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

  const fallbackWindowState = useMemo(
    () => getSessionFeedbackWindowState(session?.end, now, POST_SESSION_FEEDBACK_WINDOW_MS, attendance?.unlockState || null),
    [session?.end, now, attendance?.unlockState]
  );

  const canEvaluate = canEvaluateProp !== undefined
    ? Boolean(canEvaluateProp)
    : Boolean(
        (!isSessionUpcoming || Boolean(selectedSessionOverride)) &&
        !isNoSession &&
        !fallbackWindowState.isLockedAfter18h &&
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
  const currentSessionKey = String(
    selectedSessionOverride?.id ||
    selectedSessionOverride?.start ||
    session?.id ||
    session?.start ||
    attendance?.sessionId ||
    attendance?.date ||
    sessionIndex ||
    'default'
  );

  useEffect(() => {
    const isDifferentSession = lastSessionKeyRef.current !== currentSessionKey;
    if (isDifferentSession) {
      lastSessionKeyRef.current = currentSessionKey;
      localEditsRef.current = {};
    }

    const existing = attendance?.studentEvaluations || {};
    const notes = attendance?.quickNotes || {};
    const presence = attendance?.presence || {};

    setEvaluations((prev) => {
      const nextMap = isDifferentSession ? {} : { ...prev };
      roster.forEach((s) => {
        const note = notes[s.id];
        const isOffline = presence[s.id] === 'OFFLINE';

        const hasNoteText = Boolean(note?.text);
        const hasNoteTags = Boolean(note?.tags && note.tags.length > 0);
        const noteComment = hasNoteText ? note.text : (hasNoteTags ? note.tags.join(', ') : '');

        // 🛡️ CHESTERTON'S FENCE & LOCAL BUFFER GUARD:
        // Bảo vệ tuyệt đối văn bản người dùng đang gõ dở dang trên cùng session.
        // Tuyệt đối không cho phép server hay timer nền đè mất chữ!
        if (!isDifferentSession && localEditsRef.current[s.id]) {
          nextMap[s.id] = {
            ...(nextMap[s.id] || {}),
            ...localEditsRef.current[s.id],
          };
          return;
        }

        if (existing[s.id]) {
          const sStars = existing[s.id].stars || (isOffline ? 1 : 5);
          nextMap[s.id] = {
            stars: sStars,
            listeningScore: Number(existing[s.id].listeningScore) || sStars,
            speakingScore: Number(existing[s.id].speakingScore) || sStars,
            readingScore: Number(existing[s.id].readingScore) || sStars,
            writingScore: Number(existing[s.id].writingScore) || sStars,
            comment: existing[s.id].comment ?? noteComment,
            tags: existing[s.id].tags || note?.tags || [],
          };
        } else if (isDifferentSession || !nextMap[s.id]) {
          const sStars = isOffline ? 1 : 5;
          nextMap[s.id] = {
            stars: sStars,
            listeningScore: sStars,
            speakingScore: sStars,
            readingScore: sStars,
            writingScore: sStars,
            comment: noteComment,
            tags: note?.tags || [],
          };
        }
      });
      return nextMap;
    });
  }, [
    currentSessionKey,
    attendance?.id,
    attendance?.sessionId,
    attendance?.date,
    attendance?.studentEvaluations,
    attendance?.quickNotes,
    roster,
  ]);

  const handleUpdateStudent = (studentId, field, value) => {
    setEvaluations((prev) => {
      const current = prev[studentId] || {};
      const updated = { ...current, [field]: value };

      if (['listeningScore', 'speakingScore', 'readingScore', 'writingScore'].includes(field)) {
        const l = Number(field === 'listeningScore' ? value : (current.listeningScore || current.stars || 5));
        const s = Number(field === 'speakingScore' ? value : (current.speakingScore || current.stars || 5));
        const r = Number(field === 'readingScore' ? value : (current.readingScore || current.stars || 5));
        const w = Number(field === 'writingScore' ? value : (current.writingScore || current.stars || 5));
        updated.stars = Math.max(1, Math.min(5, Math.round((l + s + r + w) / 4)));
      } else if (field === 'stars') {
        updated.listeningScore = value;
        updated.speakingScore = value;
        updated.readingScore = value;
        updated.writingScore = value;
      }

      localEditsRef.current[studentId] = {
        ...(localEditsRef.current[studentId] || {}),
        ...updated,
      };

      return {
        ...prev,
        [studentId]: updated,
      };
    });
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

  // 4. Lựa chọn buổi học từ Dropdown (Chuẩn Khóa >18h, Mở khóa 18h & Yêu cầu mở khóa)
  const getSessionEvalStatus = (s) => {
    const isFuture = s.dateMs > now;
    const isLive = s.dateMs <= now && now < s.endMs;
    const docId = `LIVE_${cls?.id}_${s.dateMs}`;
    const dKey = normalizeSessionDateKey(s.date || s.dateMs);

    let mergedDoc = null;
    if (evaluatedSessionMap.rawByStart?.has(Number(s.dateMs))) {
      mergedDoc = mergeSessionEvaluationDocs(mergedDoc, evaluatedSessionMap.rawByStart.get(Number(s.dateMs)));
    }
    if (evaluatedSessionMap.rawById?.has(docId)) {
      mergedDoc = mergeSessionEvaluationDocs(mergedDoc, evaluatedSessionMap.rawById.get(docId));
    }
    if (dKey && evaluatedSessionMap.rawByDate?.has(dKey)) {
      mergedDoc = mergeSessionEvaluationDocs(mergedDoc, evaluatedSessionMap.rawByDate.get(dKey));
    }

    const comp = evaluateSessionFeedbackCompleteness(mergedDoc, rosterIds);
    const win = getSessionFeedbackWindowState(
      s.endMs,
      now,
      POST_SESSION_FEEDBACK_WINDOW_MS,
      mergedDoc?.unlockState || null
    );

    return {
      isFuture,
      isLive,
      isEnded: win.isEnded,
      isWithin18h: win.isWithinWindow,
      isOverdue18h: win.isOverdue,
      isLockedAfter18h: win.isLockedAfter18h,
      isTemporarilyUnlocked: win.isTemporarilyUnlocked,
      isUnlockRequested: win.isUnlockRequested,
      unlockedUntilMs: win.unlockedUntilMs,
      unlockRemainingMs: win.unlockRemainingMs,
      unlockState: win.unlockState,
      deadlineMs: win.deadlineMs,
      remainingMs: win.remainingMs,
      isComplete: comp.isComplete,
      isPartial: comp.isPartial,
      completedCount: comp.completedCount,
      requiredCount: comp.requiredCount,
      missingCount: comp.missingCount,
      hasEvaluations: comp.isComplete,
      evalCount: comp.completedCount,
      avgStars: comp.avgStars || null,
    };
  };

  const sessionOptions = useMemo(() => {
    if (!scheduleSessions.length) return [];
    return scheduleSessions.map((s) => {
      const status = getSessionEvalStatus(s);
      let statusTag = '';
      if (status.isFuture) {
        statusTag = isEnglish ? '⏳ Upcoming' : '🔒 Chưa diễn ra';
      } else if (status.isLive) {
        statusTag = status.completedCount > 0
          ? (isEnglish
            ? `🟢 Live (${status.completedCount}/${status.requiredCount} — ${status.missingCount} left)`
            : `🟢 Đang học (${status.completedCount}/${status.requiredCount} — thiếu ${status.missingCount} HS)`)
          : (isEnglish
            ? `🟢 Live now (0/${status.requiredCount} feedback)`
            : `🟢 Đang diễn ra (0/${status.requiredCount} HS)`);
      } else if (status.isTemporarilyUnlocked) {
        const ucd = formatFeedbackCountdown(status.unlockRemainingMs, isEnglish);
        statusTag = isEnglish
          ? `🔓 Unlocked (${ucd} left • ${status.completedCount}/${status.requiredCount})`
          : `🔓 Đã mở khóa (còn ${ucd} • ${status.completedCount}/${status.requiredCount} HS)`;
      } else if (status.isUnlockRequested) {
        statusTag = isEnglish
          ? `📨 Unlock Requested (${status.completedCount}/${status.requiredCount})`
          : `📨 Chờ duyệt mở khóa (${status.completedCount}/${status.requiredCount} HS)`;
      } else if (status.isLockedAfter18h) {
        statusTag = status.isComplete
          ? (isEnglish
              ? `🔒 Completed & Locked (${status.completedCount}/${status.requiredCount})`
              : `🔒 Hoàn tất & Đã khóa (${status.completedCount}/${status.requiredCount} HS)`)
          : (isEnglish
              ? `🔒 Locked >18h (Missing ${status.missingCount}/${status.requiredCount})`
              : `🔒 Đã khóa >18h (Thiếu ${status.missingCount}/${status.requiredCount} HS)`);
      } else if (status.isComplete) {
        statusTag = isEnglish
          ? `✅ Completed (${status.completedCount}/${status.requiredCount}${status.avgStars ? ` • ${status.avgStars}⭐` : ''})`
          : `✅ Đã hoàn tất (${status.completedCount}/${status.requiredCount} HS${status.avgStars ? ` • ${status.avgStars}⭐` : ''})`;
      } else {
        const countdown = formatFeedbackCountdown(status.remainingMs, isEnglish);
        statusTag = isEnglish
          ? `⏳ Due in ${countdown} (Missing ${status.missingCount}/${status.requiredCount})`
          : `⏳ Hạn 18h: còn ${countdown} (Thiếu ${status.missingCount}/${status.requiredCount} HS)`;
      }

      const mainLabel = s.label ? s.label.split('—')[0].trim() : `Buổi ${s.sessionIndex} (${s.date})`;

      return {
        value: s.dateMs,
        label: `${mainLabel} — ${statusTag}`,
        session: s,
        status,
      };
    });
  }, [scheduleSessions, evaluatedSessionMap, rosterIds, now, isEnglish]);

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
    return scheduleSessions.filter((s) => s.endMs <= now && getSessionEvalStatus(s).isComplete).length;
  }, [scheduleSessions, evaluatedSessionMap, rosterIds, now]);

  const pastSessionsCount = useMemo(() => {
    if (!scheduleSessions.length) return 0;
    return scheduleSessions.filter((s) => s.endMs <= now).length;
  }, [scheduleSessions, now]);

  const currentSessionEvalStatus = session
    ? getSessionEvalStatus({ dateMs: session.start, endMs: session.end, date: session.date || attendance?.date })
    : null;

  const liveSessionCompleteness = useMemo(
    () => evaluateSessionFeedbackCompleteness(
      { presence: attendance?.presence, studentEvaluations: evaluations },
      rosterIds
    ),
    [attendance?.presence, evaluations, rosterIds]
  );

  const formattedFeedbackDeadline = currentSessionEvalStatus?.deadlineMs
    ? new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(currentSessionEvalStatus.deadlineMs)
    : '';

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
          <Paragraph italic={!studentEval.comment?.trim()} style={{ fontSize: 13, color: '#262626', margin: 0, lineHeight: '22px', whiteSpace: 'pre-line' }}>
            "{studentEval.comment?.trim() ? (
              <FormattedText content={studentEval.comment} />
            ) : (isOnline
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
        const item = evaluations[record.id] || {};
        const p = item.presence || item.attendanceStatus || (item.stars || item.comment ? 'ONLINE' : undefined) || attendance.presence?.[record.id] || cls?.liveAttendance?.presence?.[record.id];
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
      title: isEnglish ? '4 Core Skills (1-5 ⭐)' : '4 Kỹ Năng ELA (1-5 ⭐)',
      key: 'stars',
      width: 220,
      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 12 } }),
      render: (_, record) => {
        const item = evaluations[record.id] || {};
        const p = item.presence || item.attendanceStatus || (item.stars || item.comment ? 'ONLINE' : undefined) || attendance.presence?.[record.id] || cls?.liveAttendance?.presence?.[record.id];
        const isOffline = p === 'OFFLINE';
        const stars = item.stars || (isOffline ? 1 : 5);
        const listening = item.listeningScore ?? stars;
        const speaking = item.speakingScore ?? stars;
        const reading = item.readingScore ?? stars;
        const writing = item.writingScore ?? stars;

        const ratingLabel = stars === 5
          ? (isEnglish ? 'Excellent' : 'Xuất sắc')
          : stars === 4
            ? (isEnglish ? 'Very Good' : 'Rất tốt')
            : stars === 3
              ? (isEnglish ? 'Average' : 'Cần cố gắng')
              : stars === 2
                ? (isEnglish ? 'Weak' : 'Còn yếu')
                : (isEnglish ? 'Absent' : 'Vắng học');

        const skillItem = (label, icon, val, keyField) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>{icon}</span> {label}:
            </span>
            <Rate
              value={val}
              disabled={!canEvaluate}
              character={<StarFilled />}
              style={{ fontSize: 11 }}
              onChange={(v) => handleUpdateStudent(record.id, keyField, v)}
              data-testid={`eval-${keyField}-${record.id}`}
            />
          </div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 160, justifyContent: 'space-between' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                  {isEnglish ? 'Overall:' : 'Tổng kết:'}
                </span>
                <Text strong style={{ fontSize: 11, color: stars >= 4 ? '#faad14' : stars === 3 ? '#fa8c16' : '#ff4d4f', whiteSpace: 'nowrap' }}>
                  {stars}/5 ⭐ • {ratingLabel}
                </Text>
              </div>
              {skillItem(isEnglish ? 'Listening' : 'Nghe', '🎧', listening, 'listeningScore')}
              {skillItem(isEnglish ? 'Speaking' : 'Nói', '🗣️', speaking, 'speakingScore')}
              {skillItem(isEnglish ? 'Reading' : 'Đọc', '📖', reading, 'readingScore')}
              {skillItem(isEnglish ? 'Writing' : 'Viết', '✍️', writing, 'writingScore')}
            </div>

            <div
              style={{
                padding: '4px 8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {isTeacher && canEvaluate && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{isEnglish ? 'Quick All:' : 'Chấm nhanh:'}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
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
                minHeight: isMobile ? 40 : undefined,
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
              style={{ borderRadius: 8, fontWeight: 600, minHeight: isMobile ? 40 : undefined, whiteSpace: 'nowrap' }}
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
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>
            📅 {isEnglish ? 'Select Session to Evaluate:' : 'Chọn Buổi Học Cần Đánh Giá:'}
          </Text>
          <Select
            value={session?.start || scheduleSessions[0]?.dateMs}
            onChange={handleSelectSession}
            options={sessionOptions}
            style={{ width: isMobile ? '100%' : 470, maxWidth: '100%', height: isMobile ? 40 : 38 }}
            data-testid="select-retroactive-session"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          <Space size={6} wrap>
            <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }} data-testid="session-feedback-progress-text">
              {isEnglish
                ? `Feedback: ${liveSessionCompleteness.completedCount}/${liveSessionCompleteness.requiredCount} present`
                : `Đã nhận xét: ${liveSessionCompleteness.completedCount}/${liveSessionCompleteness.requiredCount} HS có mặt`}
            </Text>
            {liveSessionCompleteness.missingCount > 0 && !isStudent && (
              <Tag color="warning" style={{ margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }} data-testid="session-feedback-missing-tag">
                {isEnglish
                  ? `Missing ${liveSessionCompleteness.missingCount}/${liveSessionCompleteness.requiredCount}`
                  : `Thiếu ${liveSessionCompleteness.missingCount}/${liveSessionCompleteness.requiredCount} HS`}
              </Tag>
            )}
          </Space>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setIsHistoryDrawerOpen(true)}
            style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, minHeight: isMobile ? 38 : undefined, borderColor: '#91caff', color: '#096dd9', whiteSpace: 'nowrap' }}
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

      {/* 4. Trạng Thái Buổi Học Đang Chọn Banner (Khóa Cứng >18h + Mở Khóa 18h + Yêu Cầu Mở Khóa) */}
      {!isStudent && isSessionEnded && currentSessionEvalStatus?.isTemporarilyUnlocked && (
        <Alert
          type="success"
          showIcon
          icon={<UnlockOutlined style={{ color: '#52c41a' }} />}
          title={
            <span style={{ fontWeight: 700 }}>
              {isEnglish
                ? `Unlocked for Re-Evaluation (18h) — ${formatFeedbackCountdown(currentSessionEvalStatus.unlockRemainingMs, true)} remaining`
                : `Đã Mở Khóa Đánh Giá Lại (18 Tiếng) — Còn ${formatFeedbackCountdown(currentSessionEvalStatus.unlockRemainingMs, false)}`}
            </span>
          }
          description={
            <div style={{ marginTop: 4, fontSize: 12, lineHeight: '18px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                {isEnglish
                  ? `Unlocked by ${currentSessionEvalStatus.unlockState?.unlockedByName || 'Academic'} (${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} present students completed). Editing will automatically re-lock when the 18h window expires.`
                  : `Được mở khóa bởi ${currentSessionEvalStatus.unlockState?.unlockedByName || 'Giáo vụ'} (đã nhận xét ${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} học sinh có mặt). Hệ thống sẽ tự động khóa lại sau khi hết 18 tiếng.`}
              </div>
              {isAcademic && onRelockSession && (
                <Button
                  size="middle"
                  danger
                  icon={<LockOutlined />}
                  loading={isUnlockActionLoading}
                  style={{ borderRadius: 8, fontWeight: 600, minHeight: 38, whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto' }}
                  onClick={async () => {
                    setIsUnlockActionLoading(true);
                    try {
                      await onRelockSession();
                      message.success(isEnglish ? 'Session evaluation locked immediately.' : 'Đã khóa lại đánh giá buổi học ngay lập tức.');
                    } catch (err) {
                      message.error(err.message || (isEnglish ? 'Failed to lock session' : 'Lỗi khóa buổi học'));
                    } finally {
                      setIsUnlockActionLoading(false);
                    }
                  }}
                  data-testid="btn-relock-eval-now"
                >
                  {isEnglish ? 'Lock Now' : 'Khóa Lại Ngay'}
                </Button>
              )}
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="banner-feedback-unlocked-18h"
        />
      )}

      {!isStudent && isSessionEnded && currentSessionEvalStatus?.isLockedAfter18h && (
        <Alert
          type={currentSessionEvalStatus.isComplete ? 'warning' : 'error'}
          showIcon
          icon={<LockOutlined style={{ color: currentSessionEvalStatus.isComplete ? '#d46b08' : '#cf1322' }} />}
          title={
            <span style={{ fontWeight: 700 }}>
              {currentSessionEvalStatus.isComplete
                ? (isEnglish
                    ? `Session Evaluation Locked (>18h After Class) — Completed ${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} present students`
                    : `Đã Khóa Đánh Giá Sau 18 Tiếng — Đã hoàn tất ${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} học sinh có mặt`)
                : (isEnglish
                    ? `Locked (>18h After Class) — Missing feedback for ${currentSessionEvalStatus.missingCount}/${currentSessionEvalStatus.requiredCount} present students`
                    : `Đã Khóa Đánh Giá (>18 Tiếng) — Còn thiếu nhận xét của ${currentSessionEvalStatus.missingCount}/${currentSessionEvalStatus.requiredCount} học sinh có mặt`)}
            </span>
          }
          description={
            <div style={{ marginTop: 4, fontSize: 12, lineHeight: '18px' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  {isEnglish
                    ? `The 18-hour post-session window (${formattedFeedbackDeadline}) has closed and editing is locked. ${isTeacher ? 'Please request Academic staff to unlock this session if you need to add or update student evaluations.' : 'Click Unlock below to open a new 18-hour re-evaluation window.'}`
                    : `Đã hết thời hạn 18 tiếng sau giờ học (${formattedFeedbackDeadline}), chức năng chỉnh sửa đánh giá đã tự động khóa. ${isTeacher ? 'Vui lòng gửi yêu cầu để Giáo vụ mở khóa nếu cần bổ sung hoặc cập nhật nhận xét.' : 'Bấm Mở Khóa bên dưới để cấp thêm 18 tiếng đánh giá lại cho buổi học này.'}`}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                  {isTeacher && (
                    currentSessionEvalStatus.isUnlockRequested ? (
                      <Tag
                        color="purple"
                        icon={<ClockCircleOutlined />}
                        style={{ margin: 0, padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8, whiteSpace: isMobile ? 'normal' : 'nowrap', width: isMobile ? '100%' : 'auto', textAlign: 'center' }}
                        data-testid="tag-unlock-requested-pending"
                      >
                        {isEnglish ? '⏳ Unlock Requested — Waiting for Academic Approval' : '⏳ Đã gửi yêu cầu — Chờ Giáo vụ duyệt mở khóa'}
                      </Tag>
                    ) : (
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        style={{ borderRadius: 8, fontWeight: 700, minHeight: 38, whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto' }}
                        onClick={() => {
                          setUnlockReason(
                            currentSessionEvalStatus.missingCount > 0
                              ? (isEnglish
                                  ? `Need to complete remaining ${currentSessionEvalStatus.missingCount}/${currentSessionEvalStatus.requiredCount} student evaluations.`
                                  : `Cần bổ sung nhận xét cho ${currentSessionEvalStatus.missingCount}/${currentSessionEvalStatus.requiredCount} học sinh còn thiếu.`)
                              : (isEnglish
                                  ? 'Need to update student evaluation comments after reviewing classwork.'
                                  : 'Cần cập nhật lại lời nhận xét học sinh sau khi chấm bài tập.')
                          );
                          setIsRequestUnlockModalOpen(true);
                        }}
                        data-testid="btn-request-eval-unlock"
                      >
                        {isEnglish ? 'Request Unlock' : 'Yêu Cầu Mở Khóa'}
                      </Button>
                    )
                  )}

                  {isAcademic && onUnlockSession && (
                    <Button
                      type="primary"
                      icon={<UnlockOutlined />}
                      loading={isUnlockActionLoading}
                      style={{
                        borderRadius: 8,
                        fontWeight: 700,
                        minHeight: 38,
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a',
                        whiteSpace: 'nowrap',
                        width: isMobile ? '100%' : 'auto',
                      }}
                      onClick={async () => {
                        setIsUnlockActionLoading(true);
                        try {
                          await onUnlockSession();
                          message.success(
                            isEnglish
                              ? 'Unlocked session evaluation for 18 hours!'
                              : 'Đã mở khóa đánh giá buổi học trong 18 tiếng!'
                          );
                        } catch (err) {
                          message.error(err.message || (isEnglish ? 'Failed to unlock session' : 'Lỗi mở khóa buổi học'));
                        } finally {
                          setIsUnlockActionLoading(false);
                        }
                      }}
                      data-testid="btn-unlock-eval-18h"
                    >
                      {currentSessionEvalStatus.isUnlockRequested
                        ? (isEnglish ? 'Approve & Unlock (18h)' : 'Duyệt Mở Khóa (18h)')
                        : (isEnglish ? 'Unlock Evaluation (18h)' : 'Mở Khóa Đánh Giá Lại (18h)')}
                    </Button>
                  )}
                </div>
              </div>

              {currentSessionEvalStatus.isUnlockRequested && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    backgroundColor: '#f9f0ff',
                    border: '1px solid #d3adf7',
                    borderRadius: 6,
                    color: '#531dab',
                  }}
                  data-testid="box-unlock-request-detail"
                >
                  📨 <strong>{currentSessionEvalStatus.unlockState?.requestedByName || 'Teacher'}:</strong>{' '}
                  {currentSessionEvalStatus.unlockState?.requestReason || (isEnglish ? 'Requested evaluation unlock.' : 'Yêu cầu mở khóa đánh giá buổi học.')}
                </div>
              )}
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="banner-feedback-overdue-18h"
        />
      )}

      {!isStudent && isSessionEnded && currentSessionEvalStatus?.isWithin18h && currentSessionEvalStatus?.isComplete && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title={
            <span style={{ fontWeight: 700 }}>
              {isEnglish
                ? `Session ${sessionIndex} (${formattedSessionDate}) — All ${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} Present Students Evaluated`
                : `Buổi ${sessionIndex} (${formattedSessionDate}) — Đã Hoàn Tất Nhận Xét (${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} học sinh có mặt)`}
            </span>
          }
          description={
            <div style={{ marginTop: 2, fontSize: 12, lineHeight: '18px' }}>
              {isEnglish
                ? `Every present student in this session has received written pedagogical feedback. You can still edit until ${formattedFeedbackDeadline} (${formatFeedbackCountdown(currentSessionEvalStatus.remainingMs, true)} left).`
                : `Tất cả học sinh có mặt đều đã có nhận xét sư phạm đầy đủ. Bạn vẫn có thể chỉnh sửa trước khi khóa lúc ${formattedFeedbackDeadline} (còn ${formatFeedbackCountdown(currentSessionEvalStatus.remainingMs, false)}).`}
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="banner-evaluated-session"
        />
      )}

      {!isStudent && isSessionEnded && currentSessionEvalStatus && !currentSessionEvalStatus.isComplete && currentSessionEvalStatus.isWithin18h && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
          title={
            <span style={{ fontWeight: 700 }}>
              {isEnglish
                ? `18-Hour Feedback Window — ${formatFeedbackCountdown(currentSessionEvalStatus.remainingMs, true)} remaining (Missing ${currentSessionEvalStatus.missingCount}/${currentSessionEvalStatus.requiredCount} students)`
                : `Thời Hạn Nộp Nhận Xét 18 Tiếng — Còn ${formatFeedbackCountdown(currentSessionEvalStatus.remainingMs, false)} (Còn thiếu ${currentSessionEvalStatus.missingCount}/${currentSessionEvalStatus.requiredCount} học sinh)`}
            </span>
          }
          description={
            <div style={{ marginTop: 2, fontSize: 12, lineHeight: '18px' }}>
              {isEnglish
                ? `Auto-locks at ${formattedFeedbackDeadline} (18h after class ended). Written comments are required for all ${currentSessionEvalStatus.requiredCount} present students (${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} saved).`
                : `Tự động khóa lúc ${formattedFeedbackDeadline} (18 tiếng sau giờ tan lớp). Bắt buộc nhập nhận xét cho đủ ${currentSessionEvalStatus.requiredCount} học sinh có mặt (đã lưu ${currentSessionEvalStatus.completedCount}/${currentSessionEvalStatus.requiredCount} học sinh).`}
            </div>
          }
          style={{ borderRadius: 10, marginBottom: 16 }}
          data-testid="banner-feedback-window-18h"
        />
      )}

      {isSessionUpcoming && !selectedSessionOverride && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
          message={
            <span style={{ fontWeight: 700 }}>
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
            const p = item.presence || item.attendanceStatus || (item.stars || item.comment ? 'ONLINE' : undefined) || attendance.presence?.[record.id] || cls?.liveAttendance?.presence?.[record.id];
            const isOnline = p === 'ONLINE';
            const isOffline = p === 'OFFLINE';
            const stars = item.stars || (isOffline ? 1 : 5);
            const listening = item.listeningScore ?? stars;
            const speaking = item.speakingScore ?? stars;
            const reading = item.readingScore ?? stars;
            const writing = item.writingScore ?? stars;
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

                {/* Đánh Giá 4 Kỹ Năng ELA & Nút Chấm Sao Nhanh */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                        {isEnglish ? '4 Core Skills:' : '4 Kỹ Năng ELA:'}
                      </span>
                      <Text strong style={{ fontSize: 12, color: '#faad14', whiteSpace: 'nowrap' }}>
                        {stars}/5 ⭐
                      </Text>
                    </div>
                    {isTeacher && canEvaluate && (
                      <Space size={3}>
                        {[5, 4, 3, 1].map((sVal) => (
                          <Button
                            key={sVal}
                            size="small"
                            type={stars === sVal ? 'primary' : 'default'}
                            style={{ fontSize: 10, height: 22, minWidth: 26, padding: '0 4px', borderRadius: 4, whiteSpace: 'nowrap' }}
                            onClick={() => handleUpdateStudent(record.id, 'stars', sVal)}
                          >
                            {sVal}⭐
                          </Button>
                        ))}
                      </Space>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>🎧 {isEnglish ? 'Listening' : 'Nghe'}:</span>
                      <Rate
                        value={listening}
                        disabled={!canEvaluate}
                        character={<StarFilled />}
                        style={{ fontSize: 11 }}
                        onChange={(val) => handleUpdateStudent(record.id, 'listeningScore', val)}
                        data-testid={`eval-listeningScore-mobile-${record.id}`}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>🗣️ {isEnglish ? 'Speaking' : 'Nói'}:</span>
                      <Rate
                        value={speaking}
                        disabled={!canEvaluate}
                        character={<StarFilled />}
                        style={{ fontSize: 11 }}
                        onChange={(val) => handleUpdateStudent(record.id, 'speakingScore', val)}
                        data-testid={`eval-speakingScore-mobile-${record.id}`}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>📖 {isEnglish ? 'Reading' : 'Đọc'}:</span>
                      <Rate
                        value={reading}
                        disabled={!canEvaluate}
                        character={<StarFilled />}
                        style={{ fontSize: 11 }}
                        onChange={(val) => handleUpdateStudent(record.id, 'readingScore', val)}
                        data-testid={`eval-readingScore-mobile-${record.id}`}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>✍️ {isEnglish ? 'Writing' : 'Viết'}:</span>
                      <Rate
                        value={writing}
                        disabled={!canEvaluate}
                        character={<StarFilled />}
                        style={{ fontSize: 11 }}
                        onChange={(val) => handleUpdateStudent(record.id, 'writingScore', val)}
                        data-testid={`eval-writingScore-mobile-${record.id}`}
                      />
                    </div>
                  </div>
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

                {/* Ô Nhập Nhận Xét Của Giáo Viên (WYSIWYG TipTap Đồng Bộ Cả Mobile) */}
                <div style={{ marginBottom: 10, width: '100%' }}>
                  <SimpleEvaluationEditor
                    value={item.comment || ''}
                    disabled={!canEvaluate}
                    onChange={(val) => handleUpdateStudent(record.id, 'comment', val)}
                    placeholder={placeholderText}
                    testId={`eval-comment-mobile-${record.id}`}
                  />
                </div>

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
                  {isEnglish
                    ? `Feedback: ${liveSessionCompleteness.completedCount}/${liveSessionCompleteness.requiredCount} present`
                    : `Đã nhận xét: ${liveSessionCompleteness.completedCount}/${liveSessionCompleteness.requiredCount} HS`}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  {liveSessionCompleteness.missingCount > 0
                    ? (isEnglish
                      ? `Session ${sessionIndex} • Missing ${liveSessionCompleteness.missingCount}`
                      : `Buổi ${sessionIndex} • Thiếu ${liveSessionCompleteness.missingCount} HS`)
                    : (isEnglish ? `Session ${sessionIndex} • Complete` : `Buổi ${sessionIndex} • Đủ 100%`)}
                </Text>
              </div>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                disabled={!canEvaluate}
                onClick={handleSaveAll}
                style={{
                  minHeight: 40,
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

      {/* Modal Giáo viên gửi yêu cầu mở khóa đánh giá buổi học quá hạn 18h */}
      <Modal
        open={isRequestUnlockModalOpen}
        onCancel={() => setIsRequestUnlockModalOpen(false)}
        width={isMobile ? '94%' : 500}
        title={
          <Space size={8}>
            <SendOutlined style={{ color: '#1677ff' }} />
            <span>
              {isEnglish
                ? `Request Evaluation Unlock — Session ${sessionIndex}`
                : `Yêu Cầu Giáo Vụ Mở Khóa Đánh Giá — Buổi ${sessionIndex}`}
            </span>
          </Space>
        }
        footer={[
          <Button
            key="cancel"
            style={{ minHeight: 38, borderRadius: 8 }}
            onClick={() => setIsRequestUnlockModalOpen(false)}
          >
            {isEnglish ? 'Cancel' : 'Hủy'}
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SendOutlined />}
            loading={isUnlockActionLoading}
            style={{ minHeight: 38, borderRadius: 8, fontWeight: 700 }}
            onClick={async () => {
              if (!onRequestUnlock) return;
              setIsUnlockActionLoading(true);
              try {
                await onRequestUnlock(unlockReason);
                setIsRequestUnlockModalOpen(false);
                message.success(
                  isEnglish
                    ? 'Unlock request sent to Academic staff!'
                    : 'Đã gửi yêu cầu mở khóa tới bộ phận Giáo vụ!'
                );
              } catch (err) {
                message.error(err.message || (isEnglish ? 'Failed to send request' : 'Lỗi gửi yêu cầu mở khóa'));
              } finally {
                setIsUnlockActionLoading(false);
              }
            }}
            data-testid="btn-submit-unlock-request"
          >
            {isEnglish ? 'Send Unlock Request' : 'Gửi Yêu Cầu Mở Khóa'}
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="modal-request-eval-unlock">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isEnglish
              ? `Class: ${cls?.name || ''} • Date: ${formattedSessionDate}. Once approved by Academic / Director / IT, you will receive an 18-hour window to complete or update student evaluations.`
              : `Lớp: ${cls?.name || ''} • Ngày học: ${formattedSessionDate}. Ngay khi Giáo vụ / Giám đốc / IT duyệt, buổi học sẽ được mở khóa thêm 18 tiếng để cập nhật đánh giá.`}
          </Text>
          <Input.TextArea
            rows={3}
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            placeholder={
              isEnglish
                ? 'Brief reason for requesting unlock...'
                : 'Nhập lý do cần mở khóa đánh giá buổi học...'
            }
            data-testid="input-unlock-reason"
          />
        </div>
      </Modal>
    </Card>
  );
};
