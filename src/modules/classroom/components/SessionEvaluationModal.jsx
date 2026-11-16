import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Modal, Rate, Row, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
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
  TrophyOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { SimpleEvaluationEditor } from './SimpleEvaluationEditor';
import { EvaluationHistoryDrawer } from './EvaluationHistoryDrawer';
import { SessionRecordingUploadModal } from '../../materials/components/SessionRecordingUploadModal';

const { Text, Title, Paragraph } = Typography;

export const SessionEvaluationPanel = ({
  cls,
  sessionIndex = 3,
  session,
  now = Date.now(),
  isSessionUpcoming: isUpcomingProp,
  isSessionLive: isLiveProp,
  canEvaluate: canEvaluateProp,
  roster = [],
  attendance = {},
  lessonPlan = {},
  userRole = 'teacher',
  currentStudentId = null,
  loading = false,
  onSaveEvaluation,
  onSaveAllEvaluations,
}) => {
  const { t, isEnglish } = useLanguage();
  const [evaluations, setEvaluations] = useState({});
  const [zaloPreview, setZaloPreview] = useState(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const localEditsRef = useRef({});

  const isTeacher = userRole === 'teacher';
  const isAcademic = ['academic', 'admin', 'director'].includes(userRole);
  const isStudent = userRole === 'student';

  // Trạng thái buổi học: upcoming (chưa diễn ra), live (đang diễn ra), ended/completed
  const isSessionUpcoming = isUpcomingProp !== undefined
    ? Boolean(isUpcomingProp)
    : Boolean(session && now < session.start);
  const isSessionLive = isLiveProp !== undefined
    ? Boolean(isLiveProp)
    : Boolean(session && now >= session.start && now < session.end);
  const isNoSession = !session;

  // Quyền đánh giá sau giờ: Chỉ mở khi buổi học đã bắt đầu hoặc kết thúc, và user có quyền
  const canEvaluate = canEvaluateProp !== undefined
    ? Boolean(canEvaluateProp)
    : Boolean(!isSessionUpcoming && !isNoSession && (isTeacher || isAcademic));

  const formattedSessionDate = session?.start
    ? new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'vi-VN', {
        dateStyle: 'medium',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(session.start)
    : attendance?.date || cls?.startDate || '';

  const formattedSessionTime = session?.start && session?.end
    ? `${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(session.start)} - ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(session.end)}`
    : cls?.scheduleData?.formatted || cls?.schedule || '';

  // Initialize or prefill from quickNotes & existing studentEvaluations
  useEffect(() => {
    const existing = attendance?.studentEvaluations || {};
    const notes = attendance?.quickNotes || {};
    const presence = attendance?.presence || {};

    setEvaluations((prev) => {
      const nextMap = { ...prev };
      roster.forEach((s) => {
        const note = notes[s.id];
        const isOffline = presence[s.id] === 'OFFLINE';
        
        // CHỈ prefill nếu giáo viên thực sự có ghi note trong giờ; không tự ý gán text giả định
        const hasNoteText = Boolean(note?.text);
        const hasNoteTags = Boolean(note?.tags && note.tags.length > 0);
        const noteComment = hasNoteText ? note.text : (hasNoteTags ? note.tags.join(', ') : '');

        // Bảo vệ văn bản người dùng đang gõ: Nếu đã có local edit thì tuyệt đối không bị reset
        if (localEditsRef.current[s.id]) {
          nextMap[s.id] = {
            ...nextMap[s.id],
            ...localEditsRef.current[s.id],
          };
          return;
        }

        if (existing[s.id]) {
          nextMap[s.id] = {
            stars: existing[s.id].stars || (isOffline ? 1 : 5),
            comment: existing[s.id].comment ?? noteComment,
            tags: existing[s.id].tags || note?.tags || [],
          };
        } else if (!nextMap[s.id]) {
          nextMap[s.id] = {
            stars: isOffline ? 1 : 5,
            comment: noteComment, // Rỗng nếu chưa có note trong giờ! Nhường chỗ cho placeholder!
            tags: note?.tags || [],
          };
        }
      });
      return nextMap;
    });
  }, [roster, attendance?.presence, attendance?.quickNotes, attendance?.studentEvaluations]);

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

  const handleSaveStudent = async (studentId) => {
    if (!canEvaluate) {
      message.warning(isEnglish ? 'Session has not started yet. Evaluation is locked.' : 'Buổi học chưa diễn ra. Đánh giá đang tạm khóa.');
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
      message.warning(isEnglish ? 'Session has not started yet. Evaluation is locked.' : 'Buổi học chưa diễn ra. Đánh giá đang tạm khóa.');
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
            <Tag color="orange" style={{ borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
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
                Kết Quả & Nhận Xét Của Thầy Cô Dành Cho {studentData?.englishName || studentData?.name}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Ngày học: {attendance.date || 'Hôm nay'} • Giáo viên: {attendance.teacherName || 'Teacher Maj'}
              </Text>
            </div>
          </Space>
          <Tag color={isOnline ? 'success' : 'error'} style={{ borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>
            {isOnline ? '🟢 Đã Tham Gia Lớp Học' : '🔴 Vắng Mặt'}
          </Tag>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Chuyên Cần:
              </Text>
              <Text strong style={{ fontSize: 14, color: isOnline ? '#389e0d' : '#cf1322' }}>
                {isOnline ? '🟢 Online (Có mặt đúng giờ)' : '🔴 Vắng mặt'}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Mức Độ Tiếp Thu & Tương Tác:
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Rate disabled value={studentEval.stars || 5} character={<StarFilled />} style={{ fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: '#faad14' }}>
                  ({studentEval.stars || 5}/5)
                </Text>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Bài Tập Về Nhà Cần Làm:
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

        {/* Nút xem lịch sử đánh giá của con */}
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

  // 2. TEACHER / ACADEMIC TABLE VIEW
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
                <Text strong style={{ fontSize: 13, color: '#1e293b' }}>{primary}</Text>
                <Tag color="default" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px', borderRadius: 4 }}>
                  {studentCode}
                </Tag>
              </div>
              {secondary && <Text type="secondary" style={{ fontSize: 11 }}>{secondary}</Text>}
            </div>

            {/* Vùng hiển thị Note trong giờ của giáo viên */}
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
                <span>{isEnglish ? 'In-Class Notes:' : 'Note Trong Giờ:'}</span>
              </div>
              {hasTags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                  {note.tags.map((tag) => (
                    <Tag key={tag} color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px', borderRadius: 4 }}>
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
        const isDistracted = (attendance.attentionFlags?.[record.id] === 'DISTRACTED');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 160, justifyContent: 'space-between' }}>
            <div>
              <Tag color={isOnline ? 'success' : isOffline ? 'error' : 'default'} style={{ fontWeight: 600 }}>
                {isOnline ? 'Online' : isOffline ? 'Offline' : (isEnglish ? 'Unmarked' : 'Chưa điểm danh')}
              </Tag>
            </div>

            {/* Thông tin Online / Offline & Trạng thái tập trung */}
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
                <Text style={{ fontSize: 11, color: isOnline ? '#389e0d' : isOffline ? '#cf1322' : '#8c8c8c', display: 'block', fontWeight: 600 }}>
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
                  <Tag color="orange" icon={<AlertOutlined />} style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px', borderRadius: 4 }}>
                    {isEnglish ? '⚠️ Distracted (1x)' : '⚠️ Cần tập trung (1 lần)'}
                  </Tag>
                ) : isOnline ? (
                  <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px', borderRadius: 4 }}>
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

            {/* Chi tiết đánh giá mức độ & Thao tác chấm sao nhanh */}
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
                <Text strong style={{ fontSize: 11, color: stars >= 4 ? '#faad14' : stars === 3 ? '#fa8c16' : '#ff4d4f', display: 'block' }}>
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
                      style={{ fontSize: 10, height: 20, padding: '0 4px', borderRadius: 4, minWidth: 24 }}
                      onClick={() => handleUpdateStudent(record.id, 'stars', sVal)}
                    >
                      {sVal}⭐
                    </Button>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 10, color: isSessionUpcoming ? '#fa8c16' : '#08979c', marginTop: 2 }}>
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
          <SimpleEvaluationEditor
            value={item.comment || ''}
            disabled={!canEvaluate}
            onChange={(val) => handleUpdateStudent(record.id, 'comment', val)}
            placeholder={placeholderText}
            testId={`eval-comment-${record.id}`}
            studentName={record.englishName || record.name}
          />
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
                  style={{ backgroundColor: canEvaluate ? '#1890ff' : '#d9d9d9', borderRadius: 6 }}
                  icon={<MessageOutlined />}
                  onClick={() => openZaloPreview(record, item)}
                  data-testid={`btn-zalo-${record.id}`}
                >
                  {isEnglish ? 'Parent Zalo' : 'Zalo PH'}
                </Button>
              )}
            </Space>

            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {isAcademic && cleanPhone ? `${cleanPhone.slice(-4)}` : ''}
            </div>
          </div>
        );
      },
    },
  ];

  const totalEvaluated = Object.values(evaluations).filter((e) => e?.comment).length;

  return (
    <Card style={{ borderRadius: 16, borderColor: '#d9d9d9', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: 20 }}>
      {/* 1. Header Hub */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <div>
          <Space orientation="horizontal" size="small">
            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>
              {isEnglish ? 'Post-Session Evaluation Hub' : 'Trung Tâm Đánh Giá Sau Buổi Học'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isEnglish
                ? `Progress: ${totalEvaluated}/${roster.length} students evaluated`
                : `Tiến độ: ${totalEvaluated}/${roster.length} Học viên đã có nhận xét`}
            </Text>
          </Space>
          <Title level={5} style={{ margin: '4px 0 0 0', fontWeight: 700 }}>
            {isEnglish
              ? 'Detailed Session Evaluation & Parent Outreach'
              : 'Bảng Đánh Giá Chi Tiết Buổi Học & Gửi Phụ Huynh'}
          </Title>
        </div>

        {(isTeacher || isAcademic) && (
          <Space size="middle" wrap>
            <Button
              icon={<VideoCameraOutlined style={{ color: '#7c3aed' }} />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                borderColor: '#d8b4fe',
                color: '#7c3aed',
                backgroundColor: '#faf5ff',
              }}
              onClick={() => setIsRecordingModalOpen(true)}
              data-testid="btn-upload-session-recording"
            >
              {isEnglish ? 'Upload Recording (Optional)' : 'Tải Video Buổi Học (Tùy Chọn)'}
            </Button>

            {isSessionUpcoming && (
              <Tag color="orange" icon={<LockOutlined />} style={{ padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                {isEnglish ? 'Evaluation Locked (Upcoming)' : 'Chưa Đến Giờ Học (Đang Khóa)'}
              </Tag>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              disabled={!canEvaluate}
              style={{ borderRadius: 8, fontWeight: 600 }}
              onClick={handleSaveAll}
              data-testid="btn-save-all-evaluations"
            >
              {isEnglish ? 'Save & Complete Evaluations' : 'Lưu & Hoàn Tất Đánh Giá'}
            </Button>
          </Space>
        )}
      </div>

      {/* 2. Session Context Card: Đang đánh giá buổi học nào */}
      <div
        data-testid="evaluation-session-context-card"
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
          border: '1px solid #bae0ff',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Space size={10} wrap style={{ alignItems: 'center' }}>
          <Tag color="geekblue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>
            {isEnglish ? `Session ${sessionIndex}` : `Buổi ${sessionIndex}`}
          </Tag>
          <Text strong style={{ fontSize: 14, color: '#1d39c4' }}>
            {lessonPlan?.title || (isEnglish ? `Session ${sessionIndex}: McGraw-Hill Wonders G1` : `Buổi ${sessionIndex}: McGraw-Hill Wonders G1`)}
          </Text>
          {lessonPlan?.unit && (
            <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600 }}>{lessonPlan.unit}</Tag>
          )}
        </Space>

        <Space size={14} wrap style={{ fontSize: 12, color: '#64748b', alignItems: 'center' }}>
          <span>
            <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {isEnglish ? 'Date: ' : 'Ngày học: '}
            <strong style={{ color: '#1e293b' }}>
              {formattedSessionDate || attendance.date || new Date().toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN')}
            </strong>
          </span>
          {cls?.name && (
            <span>
              <TeamOutlined style={{ marginRight: 4, color: '#52c41a' }} />
              {isEnglish ? 'Class: ' : 'Lớp: '}
              <strong style={{ color: '#1e293b' }}>{cls.name}</strong>
            </span>
          )}
          {lessonPlan?.essentialQuestion && (
            <span style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lessonPlan.essentialQuestion}>
              <BookOutlined style={{ marginRight: 4, color: '#fa8c16' }} />
              {isEnglish ? 'Focus: ' : 'Chủ đề: '}
              <em>{lessonPlan.essentialQuestion}</em>
            </span>
          )}
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setIsHistoryDrawerOpen(true)}
            style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, borderColor: '#91caff', color: '#096dd9' }}
            data-testid="btn-open-evaluation-history"
          >
            {isEnglish ? '🕒 Past Evaluations History' : '🕒 Lịch Sử Các Ngày Đánh Giá'}
          </Button>
        </Space>
      </div>

      {/* 3. Upcoming Session Warning Banner */}
      {isSessionUpcoming && (
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
            <div style={{ marginTop: 4, lineHeight: '20px' }}>
              <span>
                {isEnglish
                  ? `This session is scheduled for ${formattedSessionTime} on ${formattedSessionDate}. Student rating and teacher feedback editing will automatically unlock once the session starts.`
                  : `Buổi học này dự kiến diễn ra lúc ${formattedSessionTime} ngày ${formattedSessionDate}. Tính năng chấm sao và nhận xét của giáo viên sẽ tự động mở khi buổi học bắt đầu.`}
              </span>
              <span style={{ display: 'block', marginTop: 4, color: '#096dd9' }}>
                {isEnglish
                  ? '💡 You can review past evaluations via the history button or preview the enrolled student roster below.'
                  : '💡 Bạn vẫn có thể xem lại lịch sử các buổi học trước bằng nút Lịch Sử Đánh Giá hoặc xem trước danh sách học viên bên dưới.'}
              </span>
            </div>
          }
          style={{ borderRadius: 12, marginBottom: 16 }}
          data-testid="upcoming-session-evaluation-banner"
        />
      )}

      <Table
        dataSource={roster}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="middle"
        scroll={{ x: 1120 }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />

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

