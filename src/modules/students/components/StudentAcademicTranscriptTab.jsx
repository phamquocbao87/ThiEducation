import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Progress,
  Typography,
  Space,
  Button,
  Tabs,
  Rate,
  Timeline,
  Empty,
  Badge,
  Tooltip,
  Modal,
  Checkbox,
  message,
  Alert,
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarFilled,
  UserOutlined,
  CalendarOutlined,
  BookOutlined,
  AimOutlined,
  EditOutlined,
  FileDoneOutlined,
  ExclamationCircleOutlined,
  SmileOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { StudentGoalService } from '../services/StudentGoalService';
import { AbsenceRequestService } from '../../attendance/services/AbsenceRequestService';
import { StudentNoteService } from '../services/StudentNoteService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';

const { Title, Text, Paragraph } = Typography;

const ASPIRATION_OPTIONS = [
  '🗣️ Tự tin giao tiếp phản xạ với người nước ngoài',
  '📚 Nắm vững kiến thức McGraw-Hill Wonders & Điểm cao trên trường',
  '🏅 Chuẩn bị thi chứng chỉ quốc tế (Cambridge Starters/Movers/Flyers)',
  '✈️ Rèn luyện tư duy song ngữ phục vụ du học',
  '🎭 Tự tin thuyết trình và tranh biện tiếng Anh',
];

export const StudentAcademicTranscriptTab = ({
  student = {},
  enrolledClasses = [],
  currentUser = {},
  canManage = false,
}) => {
  const { isEnglish } = useLanguage();
  const userRole = (currentUser?.role || '').toLowerCase();
  const isStudentRole = userRole === 'student';
  const isTeacherRole = userRole === 'teacher';

  // Lớp học đang được chọn để xem học bạ
  const [selectedClassId, setSelectedClassId] = useState(() => {
    return enrolledClasses.length > 0 ? enrolledClasses[0].id : null;
  });

  useEffect(() => {
    if (enrolledClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(enrolledClasses[0].id);
    }
  }, [enrolledClasses, selectedClassId]);

  const activeClass = useMemo(() => {
    return (enrolledClasses || []).find((c) => c.id === selectedClassId) || enrolledClasses[0] || {};
  }, [enrolledClasses, selectedClassId]);

  // States dữ liệu
  const [goal, setGoal] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [sessionEvaluations, setSessionEvaluations] = useState([]);
  const [studentAbsences, setStudentAbsences] = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  const [isAspirationModalOpen, setIsAspirationModalOpen] = useState(false);
  const [selectedAspirations, setSelectedAspirations] = useState([]);

  const studentId = student.id || student.code;

  // Tải dữ liệu toàn diện của học viên cho lớp này
  useEffect(() => {
    if (!studentId) return;

    let isMounted = true;
    setLoadingGoal(true);

    const loadData = async () => {
      try {
        // 1. Tải Goal của học sinh cho lớp học này
        const goalData = await StudentGoalService.getStudentGoalForClass(studentId, activeClass);
        if (isMounted) {
          setGoal(goalData);
          setSelectedAspirations(goalData.parentAspirations || []);
        }

        // 2. Tải lịch sử đánh giá từng buổi học từ session_evaluations
        let evals = [];
        if (IS_FIREBASE_ENABLED && db) {
          try {
            const evRef = collection(db, 'session_evaluations');
            const q = activeClass.id
              ? query(evRef, where('classId', '==', activeClass.id))
              : evRef;
            const snap = await getDocs(q);
            snap.forEach((d) => {
              const data = d.data();
              const studentEvals = data.studentEvaluations || {};
              const stEv = studentEvals[studentId] || studentEvals[student.code];
              if (stEv) {
                evals.push({
                  id: d.id,
                  date: data.date || '',
                  dateIso: data.dateIso || '',
                  teacherName: data.teacherName || activeClass.teacherName || 'Native Teacher',
                  stars: stEv.stars || stEv.rating || 5,
                  comment: stEv.comment || '',
                  homeworkStatus: stEv.homeworkStatus || (stEv.hasHomework === false ? 'none' : 'done'),
                  pronunciation: stEv.pronunciationScore || 5,
                  vocabulary: stEv.vocabularyScore || 5,
                  listening: stEv.listeningScore || 5,
                  engagement: stEv.seriousnessScore || 5,
                });
              }
            });
            evals.sort((a, b) => new Date(b.dateIso || 0) - new Date(a.dateIso || 0));
          } catch (e) {
            console.warn('Lỗi đọc session_evaluations:', e);
          }
        }
        if (isMounted) setSessionEvaluations(evals);

        // 3. Tải đơn nghỉ phép của học viên
        const allAbsences = await AbsenceRequestService.getAllRequests().catch(() => []);
        const filteredAbs = (allAbsences || []).filter(
          (r) => r.userId === studentId || r.userId === student.code
        );
        if (isMounted) setStudentAbsences(filteredAbs);

        // 4. Tải ghi chú nội bộ GV - Giáo vụ (nếu không phải role student)
        if (!isStudentRole) {
          const notes = await StudentNoteService.getAllNotes().catch(() => []);
          const filteredNotes = (notes || []).filter(
            (n) =>
              String(n.studentId || '').toUpperCase() === String(studentId).toUpperCase() ||
              String(n.studentCode || '').toUpperCase() === String(studentId).toUpperCase()
          );
          if (isMounted) setStudentNotes(filteredNotes);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu học bạ:', err);
      } finally {
        if (isMounted) setLoadingGoal(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [studentId, activeClass.id, isStudentRole]);

  // Phân tích tiến độ mục tiêu
  const progressAnalytics = useMemo(() => {
    if (!goal) return null;
    return StudentGoalService.calculateGoalProgress(goal, sessionEvaluations, {
      attendanceRate: student.attendanceRate !== undefined ? student.attendanceRate : 96,
    });
  }, [goal, sessionEvaluations, student.attendanceRate]);

  // Xử lý hoàn thành Milestone
  const handleToggleMilestone = async (milestoneId, currentStatus) => {
    if (isStudentRole) return; // Học viên chỉ xem
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
      await StudentGoalService.updateMilestoneStatus(goal.id, milestoneId, newStatus, currentUser);
      setGoal((prev) => ({
        ...prev,
        milestones: (prev.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, status: newStatus } : m
        ),
      }));
      message.success(
        isEnglish
          ? `Milestone marked as ${newStatus === 'COMPLETED' ? 'Completed' : 'In Progress'}!`
          : `Đã cập nhật cột mốc thành ${newStatus === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang rèn luyện'}!`
      );
    } catch (err) {
      message.error(err.message || 'Lỗi cập nhật cột mốc');
    }
  };

  // Lưu nguyện vọng phụ huynh
  const handleSaveAspirations = async () => {
    try {
      await StudentGoalService.updateAspirations(goal.id, selectedAspirations);
      setGoal((prev) => ({ ...prev, parentAspirations: selectedAspirations }));
      setIsAspirationModalOpen(false);
      message.success(isEnglish ? 'Learning aspirations updated!' : 'Đã cập nhật nguyện vọng học tập thành công!');
    } catch (err) {
      message.error(err.message || 'Lỗi lưu nguyện vọng');
    }
  };

  return (
    <div style={{ paddingTop: 8 }}>
      {/* 1. THANH CHỌN KHÓA HỌC / LỚP HỌC (NẾU HỌC NHIỀU LỚP) */}
      {enrolledClasses.length > 1 && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>
              🏫 {isEnglish ? 'Select Course & Class Transcript:' : 'Chọn Học Bạ Theo Lớp / Khóa Học:'}
            </span>
            <Space wrap>
              {enrolledClasses.map((cls) => (
                <Button
                  key={cls.id}
                  type={selectedClassId === cls.id ? 'primary' : 'default'}
                  onClick={() => setSelectedClassId(cls.id)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                  data-testid={`btn-select-transcript-class-${cls.id}`}
                >
                  {cls.name || cls.id}
                </Button>
              ))}
            </Space>
          </div>
        </Card>
      )}

      {/* 2. KHỐI MỤC TIÊU KHÓA HỌC & TIẾN ĐỘ TỔNG THỂ (GOAL & MILESTONE BANNER) */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
          border: '1px solid #bbf7d0',
          boxShadow: '0 4px 12px rgba(16,185,129,0.06)',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <AimOutlined style={{ fontSize: 24, color: '#16a34a' }} />
              <Title level={4} style={{ margin: 0, color: '#15803d' }}>
                {goal?.title || `Mục Tiêu Khóa Học: ${activeClass.courseLevel || 'Wonders G1'}`}
              </Title>
              <Tag color="cyan" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
                CEFR: {goal?.targetCefr || 'A1'}
              </Tag>
              <Tag
                color={progressAnalytics?.statusColor || 'blue'}
                style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}
              >
                {progressAnalytics?.statusLabel || 'Đúng Tiến Độ'}
              </Tag>
            </div>

            <Paragraph style={{ color: '#475569', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
              {goal?.description || 'Nắm vững Phonics ngữ âm, đọc hiểu câu chuyện và tự tin tương tác với Giáo viên bản xứ.'}
            </Paragraph>

            {/* Thanh tiến độ phần trăm % */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  🎯 {isEnglish ? 'Overall Goal Completion:' : 'Tiến Độ Chinh Phục Mục Tiêu Khóa Học:'}
                </span>
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
                  {progressAnalytics?.totalProgress || 75}%
                </span>
              </div>
              <Progress
                percent={progressAnalytics?.totalProgress || 75}
                strokeColor={{ '0%': '#10b981', '100%': '#059669' }}
                showInfo={false}
                strokeWidth={10}
                style={{ borderRadius: 6 }}
              />
            </div>
          </Col>

          {/* 4 Thẻ chỉ số đo lường thực tế */}
          <Col xs={24} md={8}>
            <Row gutter={[10, 10]}>
              <Col span={12}>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 10, border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>⭐ {isEnglish ? 'Avg Rating' : 'Đánh Giá TB'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginTop: 2 }}>
                    {progressAnalytics?.starsAvg || 5.0} / 5.0
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 10, border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>📅 {isEnglish ? 'Attendance' : 'Chuyên Cần'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 2 }}>
                    {progressAnalytics?.attendanceRate || 96}%
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 10, border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>📝 {isEnglish ? 'Homework' : 'Bài Tập'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed', marginTop: 2 }}>
                    {progressAnalytics?.homeworkRate || 85}%
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 10, border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>⏱️ {isEnglish ? 'Sessions' : 'Số Buổi'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ea580c', marginTop: 2 }}>
                    {progressAnalytics?.completedSessionsCount || sessionEvaluations.length} / {progressAnalytics?.totalSessions || 36}
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 3. CÁC CỘT MỐC CHINH PHỤC (LEARNING MILESTONES ROADMAP) */}
      <Card
        bordered={false}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>{isEnglish ? 'Learning Milestones & Competency Pathway' : 'Các Cột Mốc Năng Lực Cần Chinh Phục (Milestones)'}</span>
          </Space>
        }
        style={{ borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
      >
        <Row gutter={[16, 16]}>
          {(goal?.milestones || []).map((m, idx) => {
            const isCompleted = m.status === 'COMPLETED';
            return (
              <Col xs={24} md={8} key={m.id || idx}>
                <Card
                  size="small"
                  hoverable={!isStudentRole}
                  onClick={() => !isStudentRole && handleToggleMilestone(m.id, m.status)}
                  style={{
                    borderRadius: 12,
                    border: isCompleted ? '2px solid #52c41a' : '1px solid #cbd5e1',
                    background: isCompleted ? '#f6ffed' : '#ffffff',
                    cursor: isStudentRole ? 'default' : 'pointer',
                    height: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Tag color={isCompleted ? 'success' : 'default'} style={{ borderRadius: 6, fontWeight: 700 }}>
                      {isEnglish ? `Milestone ${idx + 1}` : `Cột Mốc ${idx + 1}`} ({m.targetSession || 12} {isEnglish ? 'sessions' : 'buổi'})
                    </Tag>
                    {isCompleted ? (
                      <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                    ) : (
                      <ClockCircleOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13, marginBottom: 6 }}>
                    {m.title}
                  </div>
                  {isCompleted && m.achievedDate && (
                    <div style={{ fontSize: 11, color: '#16a34a' }}>
                      🎉 {isEnglish ? 'Achieved on:' : 'Đạt được ngày:'} {m.achievedDate}
                    </div>
                  )}
                  {!isStudentRole && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                      👉 {isEnglish ? 'Click to toggle status' : 'Nhấp để đổi trạng thái'}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* 4. NGUYỆN VỌNG & MONG MUỐN CỦA PHỤ HUYNH / HỌC VIÊN */}
      <Card
        size="small"
        style={{
          borderRadius: 12,
          marginBottom: 20,
          background: '#faf5ff',
          border: '1px solid #f3e8ff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Space size={8}>
              <SmileOutlined style={{ color: '#9333ea', fontSize: 16 }} />
              <span style={{ fontWeight: 700, color: '#6b21a8', fontSize: 13 }}>
                {isEnglish ? 'Family Learning Aspirations & Motivation:' : 'Nguyện Vọng & Động Lực Học Tập Của Gia Đình:'}
              </span>
            </Space>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {(goal?.parentAspirations || []).map((asp, i) => (
                <Tag key={i} color="purple" style={{ borderRadius: 6, fontWeight: 500, fontSize: 12, padding: '2px 8px' }}>
                  {asp}
                </Tag>
              ))}
            </div>
          </div>
          {(canManage || isStudentRole) && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setIsAspirationModalOpen(true)}
              style={{ borderRadius: 6, borderColor: '#d8b4fe', color: '#7e22ce' }}
              data-testid="btn-edit-aspirations"
            >
              {isEnglish ? 'Update Aspirations' : 'Đổi Nguyện Vọng'}
            </Button>
          )}
        </div>
      </Card>

      {/* 5. SỔ ĐÁNH GIÁ SƯ PHẠM TỪNG BUỔI HỌC (SESSION EVALUATION TIMELINE) */}
      <Card
        bordered={false}
        title={
          <Space>
            <BookOutlined style={{ color: '#0958d9' }} />
            <span>
              {isEnglish
                ? `Session-by-Session Pedagogical Evaluations (${sessionEvaluations.length} sessions recorded)`
                : `Học Bạ Đánh Giá Sư Phạm Từng Buổi Học (${sessionEvaluations.length} buổi đã ghi nhận)`}
            </span>
          </Space>
        }
        style={{ borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
      >
        {sessionEvaluations.length === 0 ? (
          <Empty
            description={
              isEnglish
                ? 'No session evaluations recorded yet. Evaluations from native teachers will appear here after each Zoom class.'
                : 'Chưa có buổi học nào được chấm nhận xét. Sau mỗi buổi học Zoom, giáo viên bản xứ sẽ cập nhật nhận xét và số sao vào đây.'
            }
            style={{ padding: '24px 0' }}
          />
        ) : (
          <Timeline
            style={{ marginTop: 12 }}
            items={sessionEvaluations.map((ev, index) => ({
              color: ev.stars >= 4 ? 'green' : 'orange',
              children: (
                <Card
                  size="small"
                  style={{
                    marginBottom: 12,
                    borderRadius: 10,
                    border: '1px solid #fed7aa',
                    background: '#fffdf7',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <Space size={8}>
                      <CalendarOutlined style={{ color: '#ea580c' }} />
                      <Text strong style={{ color: '#0f172a' }}>{ev.date || 'Gần đây'}</Text>
                      <Tag color="geekblue">{ev.teacherName || 'Teacher Maj'}</Tag>
                      <Tag color={ev.homeworkStatus === 'done' ? 'success' : 'default'}>
                        {ev.homeworkStatus === 'done'
                          ? (isEnglish ? 'Homework Completed' : 'Đã làm bài tập')
                          : (isEnglish ? 'No Homework' : 'Chưa có BTVN')}
                      </Tag>
                    </Space>
                    <Rate disabled value={ev.stars || 5} style={{ fontSize: 13, color: '#f59e0b' }} />
                  </div>

                  {/* Lời nhận xét sư phạm chi tiết */}
                  {ev.comment ? (
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: 8,
                        borderLeft: '4px solid #0284c7',
                        fontSize: 13,
                        color: '#334155',
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                      }}
                    >
                      "{ev.comment}"
                    </div>
                  ) : (
                    <div style={{ padding: '6px 12px', background: '#fff7ed', borderRadius: 6, border: '1px solid #fed7aa', display: 'inline-block' }}>
                      <Tag color="orange" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                        {isEnglish ? 'Teacher feedback pending' : 'Đang cập nhật nhận xét'}
                      </Tag>
                    </div>
                  )}
                </Card>
              ),
            }))}
          />
        )}
      </Card>

      {/* 6. BÁO CÁO CHUYÊN CẦN & ĐƠN XIN NGHỈ PHÉP */}
      <Card
        size="small"
        title={
          <Space>
            <CalendarOutlined style={{ color: '#16a34a' }} />
            <span>{isEnglish ? 'Attendance & Leave History' : 'Lịch Sử Chuyên Cần & Đơn Xin Nghỉ Phép'}</span>
          </Space>
        }
        style={{ borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0' }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Tag color="success" style={{ padding: '4px 10px', fontSize: 13, fontWeight: 600 }}>
            {isEnglish ? 'Attendance Rate:' : 'Tỷ Lệ Chuyên Cần:'} {student.attendanceRate !== undefined ? `${student.attendanceRate}%` : '96%'}
          </Tag>
          <Tag color="blue" style={{ padding: '4px 10px', fontSize: 13 }}>
            {isEnglish ? 'Leave Notices:' : 'Tổng Đơn Xin Nghỉ:'} {studentAbsences.length}
          </Tag>
        </div>

        {studentAbsences.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {studentAbsences.map((abs) => (
              <div
                key={abs.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <Space size={6}>
                  <Tag color={abs.status === 'APPROVED' ? 'green' : 'orange'}>
                    {abs.status === 'APPROVED' ? (isEnglish ? 'Approved' : 'Đã duyệt') : (isEnglish ? 'Pending' : 'Chờ duyệt')}
                  </Tag>
                  <span style={{ fontWeight: 600, color: '#334155' }}>📅 {abs.absenceDate || abs.date}</span>
                  {abs.reason && <span style={{ color: '#64748b' }}>({abs.reason})</span>}
                </Space>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 7. SỔ GHI CHÚ NGHIỆP VỤ NỘI BỘ GIỮA GV VÀ GIÁO VỤ (CHỈ HIỂN THỊ CHO TEACHER & ACADEMIC, ẨN 100% VỚI STUDENT) */}
      {!isStudentRole && (
        <Card
          size="small"
          title={
            <Space>
              <MessageOutlined style={{ color: '#7c3aed' }} />
              <span style={{ color: '#6b21a8' }}>
                🔒 {isEnglish ? 'Internal Teacher & Academic Collaboration Notes (Confidential)' : 'Sổ Ghi Chú Nghiệp Vụ Nội Bộ (Bảo Mật — Phụ Huynh Không Thấy)'}
              </span>
            </Space>
          }
          style={{
            borderRadius: 14,
            marginBottom: 20,
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
          }}
        >
          {studentNotes.length === 0 ? (
            <div style={{ padding: '12px 0', color: '#64748b', fontSize: 12, textAlign: 'center' }}>
              {isEnglish ? 'No internal notes recorded for this student.' : 'Chưa có ghi chú nghiệp vụ nội bộ nào cho học viên này.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {studentNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #f3e8ff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b21a8', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>👨‍🏫 {note.teacherName || 'Teacher'}:</span>
                    <span>{note.createdAt?.slice?.(0, 10) || 'Gần đây'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>"{note.content || note.note}"</div>
                  {note.academicReply && (
                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#f5f3ff', borderRadius: 6, fontSize: 11, color: '#4c1d95' }}>
                      👩‍💼 <b>{isEnglish ? 'Academic Reply:' : 'Phản hồi Giáo vụ:'}</b> {note.academicReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* MODAL CẬP NHẬT NGUYỆN VỌNG PHỤ HUYNH */}
      <Modal
        title={isEnglish ? 'Update Learning Aspirations' : 'Cập Nhật Nguyện Vọng Học Tập'}
        open={isAspirationModalOpen}
        onOk={handleSaveAspirations}
        onCancel={() => setIsAspirationModalOpen(false)}
        okText={isEnglish ? 'Save' : 'Lưu Nguyện Vọng'}
        cancelText={isEnglish ? 'Cancel' : 'Hủy'}
      >
        <Paragraph style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
          {isEnglish
            ? 'Select learning motivations that best fit your child:'
            : 'Chọn các mục tiêu và động lực học tập phù hợp nhất với con:'}
        </Paragraph>
        <Checkbox.Group
          options={ASPIRATION_OPTIONS}
          value={selectedAspirations}
          onChange={setSelectedAspirations}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      </Modal>
    </div>
  );
};
