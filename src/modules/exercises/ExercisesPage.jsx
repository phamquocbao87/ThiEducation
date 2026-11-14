import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  message,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Tabs,
  Select,
  Input,
  Badge,
  Avatar,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SendOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { ClassService } from '../courses/services/ClassService';
import { CourseService } from '../courses/services/CourseService';
import { ExerciseAuthoringService } from './services/ExerciseAuthoringService';
import { ExerciseAssignmentService } from './services/ExerciseAssignmentService';
import { ExerciseAttemptService } from './services/ExerciseAttemptService';
import { ExerciseBuilderModal } from './components/ExerciseBuilderModal';
import { ExercisePlayerModal } from './components/ExercisePlayerModal';
import { ExerciseReviewModal } from './components/ExerciseReviewModal';
import { ExerciseAssignmentModal } from './components/ExerciseAssignmentModal';

const { Title, Text, Paragraph } = Typography;

const canAuthor = (role) => ['admin', 'director', 'academic', 'teacher'].includes(role);

export const ExercisesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, allSystemUsers } = useAuth();
  const { isEnglish, t } = useLanguage();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [builder, setBuilder] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  // Author Tabs & Filter States
  const [authorActiveTab, setAuthorActiveTab] = useState('exercises');
  const [searchExerciseKeyword, setSearchExerciseKeyword] = useState('');
  const [filterExerciseStatus, setFilterExerciseStatus] = useState('ALL');

  const [filterSubmissionClassId, setFilterSubmissionClassId] = useState('ALL');
  const [filterSubmissionStatus, setFilterSubmissionStatus] = useState('ALL');
  const [searchSubmissionKeyword, setSearchSubmissionKeyword] = useState('');

  // Student Filter States
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');
  const [studentSearchKeyword, setStudentSearchKeyword] = useState('');

  // Tải dữ liệu toàn hệ thống
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exerciseList, classList, courseList, assignmentList, attemptList] = await Promise.all([
        ExerciseAuthoringService.getAll(),
        ClassService.getAllClasses(),
        CourseService.getAllCourses(),
        ExerciseAssignmentService.getAll(),
        ExerciseAttemptService.getAll(),
      ]);
      setItems(exerciseList);
      setClasses(classList);
      setCourses(courseList);
      setAssignments(assignmentList);
      setAttempts(attemptList);
    } catch (err) {
      message.error(
        isEnglish
          ? 'Unable to load exercises data'
          : 'Không thể tải dữ liệu bài tập'
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, isEnglish]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleItems = useMemo(
    () => ExerciseAuthoringService.scope(items, currentUser),
    [items, currentUser]
  );

  const visibleAssignments = useMemo(
    () => ExerciseAssignmentService.scope(assignments, currentUser),
    [assignments, currentUser]
  );

  const allStudents = useMemo(
    () => (allSystemUsers || []).filter((user) => user.role === 'student' && !user.isDeleted),
    [allSystemUsers]
  );

  // PHÂN QUYỀN GIAO BÀI TẬP (RBAC ENFORCEMENT):
  // 1. Admin, Giám Đốc (Director), Giáo Vụ (Academic): Toàn quyền giao cho tất cả lớp học & học viên toàn trường
  // 2. Giáo viên (Teacher): Chỉ được giao cho các lớp mình phụ trách/quản lý và học sinh thuộc các lớp mình dạy
  const assignableClasses = useMemo(() => {
    if (!classes || !Array.isArray(classes)) return [];
    const activeClasses = classes.filter((c) => !c.isDeleted && c.status !== 'Deleted');
    if (['admin', 'director', 'academic'].includes(currentUser?.role)) {
      return activeClasses;
    }
    if (currentUser?.role === 'teacher') {
      const teacherId = currentUser.id;
      const teacherCode = currentUser.code;
      const teacherName = currentUser.name;
      const teacherEnName = currentUser.englishName;
      return activeClasses.filter((c) => {
        return (
          (teacherId && c.teacherId === teacherId) ||
          (teacherCode && c.teacherId === teacherCode) ||
          (teacherName && c.teacherName === teacherName) ||
          (teacherEnName && c.teacherName === teacherEnName)
        );
      });
    }
    return [];
  }, [classes, currentUser]);

  const assignableStudents = useMemo(() => {
    if (!allStudents || !Array.isArray(allStudents)) return [];
    if (['admin', 'director', 'academic'].includes(currentUser?.role)) {
      return allStudents;
    }
    if (currentUser?.role === 'teacher') {
      const allowedStudentIds = new Set();
      assignableClasses.forEach((c) => {
        (c.studentIds || []).forEach((sId) => allowedStudentIds.add(sId));
      });
      return allStudents.filter(
        (s) => allowedStudentIds.has(s.id) || allowedStudentIds.has(s.code)
      );
    }
    return [];
  }, [allStudents, assignableClasses, currentUser]);

  // Tự động mở bài tập nếu được điều hướng từ Student Dashboard qua URL query: ?playAssignmentId=...
  useEffect(() => {
    const playAssignmentId = searchParams.get('playAssignmentId');
    if (playAssignmentId && assignments.length > 0 && items.length > 0) {
      const targetAssignment = assignments.find(
        (a) => a.id === playAssignmentId && !a.isDeleted
      );
      if (targetAssignment) {
        const targetExercise = items.find((item) => item.id === targetAssignment.exerciseId);
        if (targetExercise) {
          setPlaying({
            assignment: targetAssignment,
            exercise: targetExercise,
          });
          setSearchParams({}, { replace: true });
        }
      }
    }
  }, [searchParams, assignments, items, setSearchParams]);

  // Lưu hoặc cập nhật đề bài tập
  const save = async (data) => {
    setSaving(true);
    try {
      const saved = await ExerciseAuthoringService.save(data, currentUser);
      setItems((list) => [saved, ...list.filter((item) => item.id !== saved.id)]);
      setBuilder(null);
      message.success(isEnglish ? 'Exercise saved successfully!' : 'Đã lưu bài tập thành công!');
    } catch (err) {
      message.error(isEnglish ? 'Could not save exercise' : 'Không thể lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  // Phân phối đề bài cho lớp hoặc học viên
  const distribute = async ({ selectedClass, students: targetStudents, ...extra }) => {
    setSaving(true);
    try {
      const result = await ExerciseAssignmentService.assign(
        assigning,
        selectedClass,
        targetStudents,
        currentUser,
        extra
      );
      setAssignments((list) => [result, ...list]);
      setAssigning(null);
      message.success(isEnglish ? 'Exercise distributed successfully!' : 'Đã giao bài tập thành công!');
    } catch {
      message.error(isEnglish ? 'Could not distribute exercise' : 'Không thể giao bài tập');
    } finally {
      setSaving(false);
    }
  };

  // Thu hồi / Xóa phân công bài tập
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await ExerciseAssignmentService.softDelete(assignmentId);
      setAssignments((list) => list.filter((item) => item.id !== assignmentId));
      message.success(
        isEnglish
          ? 'Assignment revoked and removed successfully!'
          : 'Đã thu hồi và xóa phân công bài tập thành công!'
      );
    } catch (err) {
      message.error(
        isEnglish
          ? 'Failed to revoke assignment'
          : 'Lỗi khi thu hồi phân công bài tập'
      );
    }
  };

  // Nộp bài tập (hoặc đóng xem thử)
  const submit = async (answers) => {
    if (playing?.preview) {
      setPlaying(null);
      message.success(
        t('exercises.previewCompletedNotice', isEnglish
          ? 'Preview completed. No learner record was created.'
          : 'Đã xem thử. Không tạo bài nộp của học viên.')
      );
      return true;
    }
    setSaving(true);
    try {
      const result = await ExerciseAttemptService.submit(
        playing.assignment,
        playing.exercise,
        answers,
        currentUser
      );
      setAttempts((list) => [result, ...list.filter((item) => item.id !== result.id)]);
      message.success(
        t('exercises.submittedNotice', {
          stars: result.rewards?.stars || 1,
          xp: result.rewards?.xp || 10,
          defaultValue: isEnglish
            ? `Submitted! Earned ${result.rewards?.stars || 1}★ +${result.rewards?.xp || 10} XP`
            : `Nộp bài thành công! Đạt ${result.rewards?.stars || 1}★ +${result.rewards?.xp || 10} XP`,
        })
      );
      setPlaying(null);
      return true;
    } catch (err) {
      console.error('Submit error:', err);
      message.error(isEnglish ? 'Submission failed' : 'Nộp bài thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Giáo viên chấm bài tự luận / nghe thu âm
  const review = async (values) => {
    setSaving(true);
    try {
      const saved = await ExerciseAttemptService.gradeManual(
        reviewing,
        values.manualScore,
        values.teacherComment,
        currentUser
      );
      setAttempts((list) => [saved, ...list.filter((item) => item.id !== saved.id)]);
      setReviewing(null);
      message.success(
        t('exercises.reviewSaved', isEnglish ? 'Review and grade saved successfully!' : 'Đã lưu điểm và nhận xét thành công!')
      );
    } catch {
      message.error(isEnglish ? 'Could not save review' : 'Không thể lưu chấm bài');
    } finally {
      setSaving(false);
    }
  };

  // Danh sách đề bài đã lọc cho Author
  const filteredAuthorExercises = useMemo(() => {
    return visibleItems.filter((item) => {
      const matchKeyword = !searchExerciseKeyword ||
        item.title?.toLowerCase().includes(searchExerciseKeyword.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchExerciseKeyword.toLowerCase());
      const matchStatus = filterExerciseStatus === 'ALL' || item.status === filterExerciseStatus;
      return matchKeyword && matchStatus;
    });
  }, [visibleItems, searchExerciseKeyword, filterExerciseStatus]);

  // Lọc bài nộp theo đúng quyền RBAC (Học viên: chỉ bài của mình; Giáo viên: chỉ lớp mình dạy; Ban giám hiệu/Giáo vụ: toàn trường)
  const visibleAttempts = useMemo(
    () => ExerciseAttemptService.scope(attempts, currentUser, { classes, assignments, exercises: items }),
    [attempts, currentUser, classes, assignments, items]
  );

  // Danh sách bài nộp đã làm giàu thông tin và đã lọc
  const enrichedSubmissions = useMemo(() => {
    return visibleAttempts.map((attempt) => {
      const assignment = assignments.find((a) => a.id === attempt.assignmentId);
      const exercise = items.find((e) => e.id === attempt.exerciseId || e.id === assignment?.exerciseId);
      const student = (allSystemUsers || []).find((u) => u.id === attempt.studentId);
      return {
        ...attempt,
        exerciseTitle: exercise?.title || attempt.exerciseTitle || 'English Exercise',
        className: assignment?.className || '—',
        classId: assignment?.classId || '',
        studentCode: student?.code || '',
        studentAvatar: student?.avatar || '',
        finalScore: (attempt.autoScore || 0) + (attempt.manualScore || 0),
      };
    });
  }, [visibleAttempts, assignments, items, allSystemUsers]);

  const filteredSubmissions = useMemo(() => {
    return enrichedSubmissions.filter((sub) => {
      const matchClass = filterSubmissionClassId === 'ALL' || sub.classId === filterSubmissionClassId;
      const matchStatus = filterSubmissionStatus === 'ALL' || sub.status === filterSubmissionStatus;
      const matchKeyword = !searchSubmissionKeyword ||
        sub.studentName?.toLowerCase().includes(searchSubmissionKeyword.toLowerCase()) ||
        sub.studentCode?.toLowerCase().includes(searchSubmissionKeyword.toLowerCase()) ||
        sub.exerciseTitle?.toLowerCase().includes(searchSubmissionKeyword.toLowerCase());
      return matchClass && matchStatus && matchKeyword;
    });
  }, [enrichedSubmissions, filterSubmissionClassId, filterSubmissionStatus, searchSubmissionKeyword]);

  const pendingReviewCount = useMemo(() => {
    return visibleAttempts.filter((a) => a.status === 'NEEDS_REVIEW').length;
  }, [visibleAttempts]);

  // Cột bảng đề bài dành cho Author
  const authorColumns = [
    {
      title: t('exercises.colTitle', isEnglish ? 'Exercise' : 'Bài Tập'),
      dataIndex: 'title',
      key: 'title',
      render: (value, item) => (
        <div>
          <Text strong style={{ color: '#1e1b4b', fontSize: 14 }}>
            {value}
          </Text>
          {item.description && (
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              {item.description.slice(0, 80)}...
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('exercises.colQuestions', isEnglish ? 'Questions' : 'Số Câu'),
      key: 'questionsCount',
      width: 110,
      align: 'center',
      render: (_, item) => (
        <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 600 }}>
          {item.questions?.length || 0} {isEnglish ? 'items' : 'câu'}
        </Tag>
      ),
    },
    {
      title: t('exercises.colStatus', isEnglish ? 'Status' : 'Trạng Thái'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => (
        <Tag
          color={value === 'PUBLISHED' ? 'green' : 'orange'}
          style={{ borderRadius: 4, fontWeight: 600 }}
        >
          {value === 'PUBLISHED'
            ? t('exercises.statusPublished', isEnglish ? 'Published' : 'Đã Xuất Bản')
            : t('exercises.statusDraft', isEnglish ? 'Draft' : 'Bản Nháp')}
        </Tag>
      ),
    },
    {
      title: t('exercises.colActions', isEnglish ? 'Actions' : 'Thao Tác'),
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, item) => (
        <Space size={8} wrap={false} style={{ whiteSpace: 'nowrap' }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{ borderRadius: 6, fontWeight: 500, whiteSpace: 'nowrap' }}
            onClick={() =>
              setPlaying({
                assignment: { id: `preview_${item.id}` },
                exercise: item,
                preview: true,
              })
            }
          >
            {t('exercises.preview', isEnglish ? 'Preview' : 'Xem Thử')}
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{ borderRadius: 6, fontWeight: 500, whiteSpace: 'nowrap' }}
            onClick={() => setBuilder(item)}
          >
            {t('exercises.edit', isEnglish ? 'Edit' : 'Sửa')}
          </Button>
          {item.status === 'PUBLISHED' && (
            <Button
              size="small"
              type="primary"
              icon={<SendOutlined />}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                backgroundColor: '#7c3aed',
                borderColor: '#7c3aed',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setAssigning(item)}
            >
              {t('exercises.assign', isEnglish ? 'Assign' : 'Giao Bài')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Cột bảng Quản Lý Bài Nộp dành cho Author
  const submissionColumns = [
    {
      title: t('exercises.colStudent', isEnglish ? 'Student' : 'Học Viên'),
      key: 'student',
      render: (_, sub) => (
        <Space size={8}>
          <Avatar src={sub.studentAvatar} icon={<UserOutlined />} style={{ backgroundColor: '#7c3aed' }} />
          <div>
            <Text strong style={{ color: '#0f172a' }}>{sub.studentName}</Text>
            {sub.studentCode && (
              <div style={{ fontSize: 11, color: '#64748b' }}>{sub.studentCode}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: t('exercises.colTitle', isEnglish ? 'Exercise' : 'Bài Tập'),
      dataIndex: 'exerciseTitle',
      key: 'exerciseTitle',
      render: (v) => <Text strong style={{ color: '#4338ca' }}>{v}</Text>,
    },
    {
      title: t('exercises.colClass', isEnglish ? 'Class' : 'Lớp Học'),
      dataIndex: 'className',
      key: 'className',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: t('exercises.colAutoScore', isEnglish ? 'Auto Score' : 'Điểm Tự Động'),
      key: 'autoScore',
      align: 'center',
      render: (_, sub) => (
        <Text strong style={{ color: '#0284c7' }}>
          {sub.autoScore || 0}/{sub.autoTotal || 0}
        </Text>
      ),
    },
    {
      title: t('exercises.colManualScore', isEnglish ? 'Teacher Score' : 'Điểm GV Chấm'),
      key: 'manualScore',
      align: 'center',
      render: (_, sub) => (
        sub.manualScore != null ? (
          <Tag color="purple" style={{ fontWeight: 700 }}>+{sub.manualScore}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
    {
      title: t('exercises.colFinalScore', isEnglish ? 'Final Score' : 'Tổng Điểm'),
      key: 'finalScore',
      align: 'center',
      render: (_, sub) => (
        <Tag color="cyan" style={{ fontSize: 13, fontWeight: 700 }}>
          {sub.finalScore} pts
        </Tag>
      ),
    },
    {
      title: t('exercises.colStatus', isEnglish ? 'Status' : 'Trạng Thái'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={status === 'NEEDS_REVIEW' ? 'orange' : 'green'}
          icon={status === 'NEEDS_REVIEW' ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
          style={{ borderRadius: 4, fontWeight: 600 }}
        >
          {status === 'NEEDS_REVIEW'
            ? t('exercises.filterNeedsReview', isEnglish ? 'Awaiting Review' : 'Chờ Chấm')
            : t('exercises.filterGraded', isEnglish ? 'Graded' : 'Đã Chấm')}
        </Tag>
      ),
    },
    {
      title: t('exercises.colActions', isEnglish ? 'Actions' : 'Thao Tác'),
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, item) => (
        <Button
          type={item.status === 'NEEDS_REVIEW' ? 'primary' : 'default'}
          size="small"
          style={{
            borderRadius: 6,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            ...(item.status === 'NEEDS_REVIEW'
              ? { backgroundColor: '#ea580c', borderColor: '#ea580c' }
              : {}),
          }}
          onClick={() => setReviewing(item)}
        >
          {t('exercises.review', isEnglish ? 'Review' : 'Chấm Bài')}
        </Button>
      ),
    },
  ];

  // Danh sách bài tập dành cho Học viên
  const filteredStudentAssignments = useMemo(() => {
    return visibleAssignments.filter((assignment) => {
      const count = attempts.filter(
        (item) => item.assignmentId === assignment.id && item.studentId === currentUser?.id
      ).length;
      const isCompleted = count > 0;
      const matchStatus =
        studentStatusFilter === 'ALL'
          ? true
          : studentStatusFilter === 'TODO'
          ? !isCompleted
          : isCompleted;

      const matchKeyword =
        !studentSearchKeyword ||
        assignment.title?.toLowerCase().includes(studentSearchKeyword.toLowerCase()) ||
        assignment.className?.toLowerCase().includes(studentSearchKeyword.toLowerCase());

      return matchStatus && matchKeyword;
    });
  }, [visibleAssignments, attempts, currentUser?.id, studentStatusFilter, studentSearchKeyword]);

  // Cột bảng dành cho Học viên
  const studentColumns = [
    {
      title: t('exercises.colTitle', isEnglish ? 'Exercise' : 'Bài Tập'),
      dataIndex: 'title',
      key: 'title',
      render: (value) => <Text strong style={{ fontSize: 14, color: '#1e1b4b' }}>{value}</Text>,
    },
    {
      title: t('exercises.colClass', isEnglish ? 'Class' : 'Lớp Học'),
      dataIndex: 'className',
      key: 'className',
      render: (value) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: t('exercises.colDue', isEnglish ? 'Due Date' : 'Hạn Nộp'),
      dataIndex: 'dueAt',
      key: 'dueAt',
      render: (value) => (value ? new Date(value).toLocaleString() : '—'),
    },
    {
      title: t('exercises.colAttempts', isEnglish ? 'Attempts' : 'Lần Làm'),
      key: 'attemptsCount',
      render: (_, assignment) => {
        const count = attempts.filter(
          (item) => item.assignmentId === assignment.id && item.studentId === currentUser?.id
        ).length;
        return (
          <Tag color="geekblue" style={{ borderRadius: 4 }}>
            {count}/{assignment.attemptsAllowed || 1}
          </Tag>
        );
      },
    },
    {
      title: t('exercises.colActions', isEnglish ? 'Actions' : 'Thao Tác'),
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, assignment) => {
        const userAttempts = attempts.filter(
          (item) => item.assignmentId === assignment.id && item.studentId === currentUser?.id
        );
        const count = userAttempts.length;
        const overdue = assignment.dueAt && new Date(assignment.dueAt) < new Date();
        const locked = overdue || count >= (assignment.attemptsAllowed || 1);

        return (
          <Button
            type="primary"
            disabled={locked}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              ...(!locked ? { backgroundColor: '#7c3aed', borderColor: '#7c3aed' } : {}),
            }}
            onClick={() =>
              setPlaying({
                assignment,
                exercise: items.find((item) => item.id === assignment.exerciseId),
              })
            }
          >
            {overdue
              ? t('exercises.closedOverdue', isEnglish ? 'Closed / Overdue' : 'Đã Quá Hạn')
              : locked
              ? t('exercises.limitReached', isEnglish ? 'Limit reached' : 'Đã Đủ Lần')
              : t('exercises.start', isEnglish ? 'Start' : 'Làm Bài')}
          </Button>
        );
      },
    },
  ];

  return (
    <div
      style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: isMobile ? '12px 12px 32px' : '16px 20px 40px',
        overflowX: 'hidden',
      }}
    >
      {/* Banner Giới Thiệu Phân Hệ */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #312e81, #7c3aed)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
        }}
        styles={{ body: { padding: isMobile ? '16px 14px' : '20px 24px' } }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 14,
          }}
        >
          <div>
            <Title level={3} style={{ color: '#fff', margin: 0, fontSize: isMobile ? 18 : 22 }}>
              {t('exercises.pageTitle', isEnglish ? 'English Exercises & Practice' : 'Bài Tập Tiếng Anh & Luyện Kỹ Năng')}
            </Title>
            <Text style={{ color: '#ede9fe', fontSize: isMobile ? 12 : 13 }}>
              {t('exercises.pageSubtitle', isEnglish
                ? 'Create, assign, complete and assess multi-skill English exercises.'
                : 'Soạn thảo, giao bài, làm bài trực tuyến và đánh giá đa kỹ năng tiếng Anh.')}
            </Text>
          </div>
          {canAuthor(currentUser?.role) && (
            <Button
              type="primary"
              size={isMobile ? 'middle' : 'large'}
              icon={<PlusOutlined />}
              style={{
                backgroundColor: '#ffffff',
                color: '#6d28d9',
                borderColor: '#ffffff',
                fontWeight: 700,
                borderRadius: 8,
                height: isMobile ? 40 : undefined,
                width: isMobile ? '100%' : undefined,
              }}
              onClick={() => setBuilder({})}
            >
              {t('exercises.createExercise', isEnglish ? 'Create Exercise' : 'Tạo Bài Tập')}
            </Button>
          )}
        </div>
      </Card>

      <Spin spinning={loading}>
        {canAuthor(currentUser?.role) ? (
          /* ========================================================================= */
          /* GIAO DIỆN DÀNH CHO CÁN BỘ / GIÁO VIÊN (AUTHORING & SUBMISSION HUB)       */
          /* ========================================================================= */
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Tabs
              activeKey={authorActiveTab}
              onChange={setAuthorActiveTab}
              items={[
                {
                  key: 'exercises',
                  label: (
                    <span>
                      <BookOutlined style={{ marginRight: 6 }} />
                      {t('exercises.tabExerciseBank', isEnglish ? 'Exercise Bank' : 'Kho Đề Bài Tập')}
                      <Tag color="geekblue" style={{ marginLeft: 8, borderRadius: 10 }}>
                        {filteredAuthorExercises.length}
                      </Tag>
                    </span>
                  ),
                  children: (
                    <div>
                      {/* Bộ lọc Kho Đề Bài Tập */}
                      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
                        <Col xs={24} sm={12} md={8}>
                          <Input
                            placeholder={t('exercises.searchPlaceholder', isEnglish ? 'Search exercise title...' : 'Tìm kiếm theo tên bài tập...')}
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchExerciseKeyword}
                            onChange={(e) => setSearchExerciseKeyword(e.target.value)}
                            allowClear
                            style={{ height: 40, borderRadius: 8, width: '100%' }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Select
                            value={filterExerciseStatus}
                            onChange={setFilterExerciseStatus}
                            style={{ width: '100%', height: 40 }}
                            options={[
                              { value: 'ALL', label: t('exercises.allStatuses', isEnglish ? 'All Statuses' : 'Tất Cả Trạng Thái') },
                              { value: 'PUBLISHED', label: t('exercises.statusPublished', isEnglish ? 'Published' : 'Đã Xuất Bản') },
                              { value: 'DRAFT', label: t('exercises.statusDraft', isEnglish ? 'Draft' : 'Bản Nháp') },
                            ]}
                          />
                        </Col>
                      </Row>

                      {/* Hiển Thị Kho Đề Bài Tập: Mobile Card Stack hoặc Desktop Table */}
                      {isMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {filteredAuthorExercises.length === 0 ? (
                            <Empty
                              description={t('exercises.emptyExercises', isEnglish ? 'No exercises found' : 'Chưa có bài tập nào')}
                            />
                          ) : (
                            filteredAuthorExercises.map((item) => (
                              <Card
                                key={item.id}
                                size="small"
                                style={{
                                  borderRadius: 12,
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                                styles={{ body: { padding: '14px 14px' } }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text strong style={{ fontSize: 15, color: '#1e1b4b', lineHeight: 1.35 }}>
                                    {item.title}
                                  </Text>
                                  <Tag
                                    color={item.status === 'PUBLISHED' ? 'green' : 'orange'}
                                    style={{ margin: 0, flexShrink: 0, borderRadius: 4, fontWeight: 600 }}
                                  >
                                    {item.status === 'PUBLISHED'
                                      ? t('exercises.statusPublished', isEnglish ? 'Published' : 'Đã Xuất Bản')
                                      : t('exercises.statusDraft', isEnglish ? 'Draft' : 'Bản Nháp')}
                                  </Tag>
                                </div>

                                {item.description && (
                                  <Paragraph
                                    style={{ color: '#64748b', fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}
                                    ellipsis={{ rows: 2 }}
                                  >
                                    {item.description}
                                  </Paragraph>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                  <Tag color="geekblue" style={{ borderRadius: 4, margin: 0, fontWeight: 600 }}>
                                    📝 {item.questions?.length || 0} {isEnglish ? 'questions' : 'câu'}
                                  </Tag>
                                  {item.estimatedMinutes && (
                                    <Tag color="cyan" style={{ borderRadius: 4, margin: 0 }}>
                                      ⏱️ {item.estimatedMinutes} {isEnglish ? 'mins' : 'phút'}
                                    </Tag>
                                  )}
                                  {item.level && (
                                    <Tag color="purple" style={{ borderRadius: 4, margin: 0 }}>
                                      🎯 {item.level}
                                    </Tag>
                                  )}
                                </div>

                                {/* Các Nút Hành Động Chuẩn Mobile (Height 40px) */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: item.status === 'PUBLISHED' ? '1fr 1fr 1fr' : '1fr 1fr',
                                    gridTemplateRows: '40px',
                                    gap: 8,
                                  }}
                                >
                                  <Button
                                    icon={<EyeOutlined />}
                                    style={{
                                      height: 40,
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      padding: '0 4px',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={() =>
                                      setPlaying({
                                        assignment: { id: `preview_${item.id}` },
                                        exercise: item,
                                        preview: true,
                                      })
                                    }
                                  >
                                    {t('exercises.preview', isEnglish ? 'Preview' : 'Xem Thử')}
                                  </Button>
                                  <Button
                                    icon={<EditOutlined />}
                                    style={{
                                      height: 40,
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      padding: '0 4px',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => setBuilder(item)}
                                  >
                                    {t('exercises.edit', isEnglish ? 'Edit' : 'Sửa')}
                                  </Button>
                                  {item.status === 'PUBLISHED' && (
                                    <Button
                                      type="primary"
                                      icon={<SendOutlined />}
                                      style={{
                                        height: 40,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        backgroundColor: '#7c3aed',
                                        borderColor: '#7c3aed',
                                        padding: '0 4px',
                                        whiteSpace: 'nowrap',
                                      }}
                                      onClick={() => setAssigning(item)}
                                    >
                                      {t('exercises.assign', isEnglish ? 'Assign' : 'Giao Bài')}
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      ) : (
                        <Table
                          rowKey="id"
                          columns={authorColumns}
                          dataSource={filteredAuthorExercises}
                          scroll={{ x: 820 }}
                          pagination={{ pageSize: 8, showSizeChanger: true }}
                          locale={{
                            emptyText: (
                              <Empty
                                description={t('exercises.emptyExercises', isEnglish ? 'No exercises found' : 'Chưa có bài tập nào')}
                              />
                            ),
                          }}
                        />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'submissions',
                  label: (
                    <span>
                      <CheckCircleOutlined style={{ marginRight: 6 }} />
                      {t('exercises.tabSubmissions', isEnglish ? 'Student Submissions' : 'Quản Lý Bài Nộp')}
                      {pendingReviewCount > 0 ? (
                        <Badge count={pendingReviewCount} style={{ marginLeft: 8, backgroundColor: '#ea580c' }} />
                      ) : (
                        <Tag color="default" style={{ marginLeft: 8, borderRadius: 10 }}>
                          {filteredSubmissions.length}
                        </Tag>
                      )}
                    </span>
                  ),
                  children: (
                    <div>
                      {/* Bộ Lọc Thông Minh Dành Cho Quản Lý Bài Nộp */}
                      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
                        <Col xs={24} sm={12} md={7}>
                          <Input
                            placeholder={t('exercises.searchPlaceholder', isEnglish ? 'Search by student or exercise...' : 'Tìm theo tên học viên, bài tập...')}
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchSubmissionKeyword}
                            onChange={(e) => setSearchSubmissionKeyword(e.target.value)}
                            allowClear
                            style={{ height: 40, borderRadius: 8, width: '100%' }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={7}>
                          <Select
                            value={filterSubmissionClassId}
                            onChange={setFilterSubmissionClassId}
                            style={{ width: '100%', height: 40 }}
                            placeholder={t('exercises.filterByClass', isEnglish ? 'Filter by Class' : 'Lọc Theo Lớp Học')}
                            options={[
                              { value: 'ALL', label: `🏫 ${t('exercises.allClasses', isEnglish ? 'All Classes' : 'Tất Cả Lớp Học')}` },
                              ...assignableClasses.map((c) => ({ value: c.id, label: `🏫 ${c.name}` })),
                            ]}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Select
                            value={filterSubmissionStatus}
                            onChange={setFilterSubmissionStatus}
                            style={{ width: '100%', height: 40 }}
                            options={[
                              { value: 'ALL', label: t('exercises.allStatuses', isEnglish ? 'All Statuses' : 'Tất Cả Trạng Thái') },
                              { value: 'NEEDS_REVIEW', label: `⏳ ${t('exercises.filterNeedsReview', isEnglish ? 'Awaiting Review' : 'Chờ Chấm Điểm')}` },
                              { value: 'GRADED', label: `✅ ${t('exercises.filterGraded', isEnglish ? 'Graded' : 'Đã Chấm Xong')}` },
                            ]}
                          />
                        </Col>
                      </Row>

                      {/* Hiển Thị Bài Nộp: Mobile Card Stack hoặc Desktop Table */}
                      {isMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {filteredSubmissions.length === 0 ? (
                            <Empty
                              description={t('exercises.emptySubmissions', isEnglish ? 'No submissions found' : 'Không tìm thấy bài nộp nào')}
                            />
                          ) : (
                            filteredSubmissions.map((sub) => (
                              <Card
                                key={sub.id}
                                size="small"
                                style={{
                                  borderRadius: 12,
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                                styles={{ body: { padding: '14px 14px' } }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    marginBottom: 8,
                                  }}
                                >
                                  <Space size={8}>
                                    <Avatar src={sub.studentAvatar} icon={<UserOutlined />} style={{ backgroundColor: '#7c3aed' }} />
                                    <div>
                                      <Text strong style={{ color: '#0f172a', fontSize: 14 }}>{sub.studentName}</Text>
                                      {sub.studentCode && (
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{sub.studentCode}</div>
                                      )}
                                    </div>
                                  </Space>
                                  <Tag
                                    color={sub.status === 'NEEDS_REVIEW' ? 'orange' : 'green'}
                                    icon={sub.status === 'NEEDS_REVIEW' ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                                    style={{ borderRadius: 4, fontWeight: 600, margin: 0 }}
                                  >
                                    {sub.status === 'NEEDS_REVIEW'
                                      ? t('exercises.filterNeedsReview', isEnglish ? 'Awaiting Review' : 'Chờ Chấm')
                                      : t('exercises.filterGraded', isEnglish ? 'Graded' : 'Đã Chấm')}
                                  </Tag>
                                </div>

                                <div style={{ marginBottom: 10 }}>
                                  <Text strong style={{ color: '#4338ca', fontSize: 13, display: 'block', marginBottom: 2 }}>
                                    {sub.exerciseTitle}
                                  </Text>
                                  <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>
                                    🏫 {sub.className}
                                  </Tag>
                                </div>

                                {/* Điểm Tự Động & Điểm Chấm */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#f8fafc',
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    marginBottom: 10,
                                  }}
                                >
                                  <div>
                                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                                      {t('exercises.colAutoScore', isEnglish ? 'Auto Score' : 'Điểm Máy')}
                                    </span>
                                    <Text strong style={{ color: '#0284c7', fontSize: 13 }}>
                                      {sub.autoScore || 0}/{sub.autoTotal || 0}
                                    </Text>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                                      {t('exercises.colManualScore', isEnglish ? 'Teacher' : 'Điểm GV')}
                                    </span>
                                    {sub.manualScore != null ? (
                                      <Tag color="purple" style={{ fontWeight: 700, margin: 0 }}>+{sub.manualScore}</Tag>
                                    ) : (
                                      <Text type="secondary">—</Text>
                                    )}
                                  </div>
                                  <div>
                                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                                      {t('exercises.colFinalScore', isEnglish ? 'Final' : 'Tổng')}
                                    </span>
                                    <Tag color="cyan" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                                      {sub.finalScore} pts
                                    </Tag>
                                  </div>
                                </div>

                                <Button
                                  type={sub.status === 'NEEDS_REVIEW' ? 'primary' : 'default'}
                                  block
                                  style={{
                                    height: 38,
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    ...(sub.status === 'NEEDS_REVIEW'
                                      ? { backgroundColor: '#ea580c', borderColor: '#ea580c' }
                                      : {}),
                                  }}
                                  onClick={() => setReviewing(sub)}
                                >
                                  {t('exercises.review', isEnglish ? 'Review Submission' : 'Chấm Bài Nộp')}
                                </Button>
                              </Card>
                            ))
                          )}
                        </div>
                      ) : (
                        <Table
                          rowKey="id"
                          columns={submissionColumns}
                          dataSource={filteredSubmissions}
                          scroll={{ x: 880 }}
                          pagination={{ pageSize: 8, showSizeChanger: true }}
                          locale={{
                            emptyText: (
                              <Empty
                                description={t('exercises.emptySubmissions', isEnglish ? 'No submissions found' : 'Không tìm thấy bài nộp nào')}
                              />
                            ),
                          }}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        ) : (
          /* ========================================================================= */
          /* GIAO DIỆN DÀNH CHO HỌC VIÊN (LEARNER ASSIGNED EXERCISES VIEW)             */
          /* ========================================================================= */
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder={t('exercises.searchPlaceholder', isEnglish ? 'Search assigned exercises...' : 'Tìm bài tập được giao...')}
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={studentSearchKeyword}
                  onChange={(e) => setStudentSearchKeyword(e.target.value)}
                  allowClear
                  style={{ height: 40, borderRadius: 8, width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  value={studentStatusFilter}
                  onChange={setStudentStatusFilter}
                  style={{ width: '100%', height: 40 }}
                  options={[
                    { value: 'ALL', label: t('exercises.allStatuses', isEnglish ? 'All Exercises' : 'Tất Cả Bài Tập') },
                    { value: 'TODO', label: `📝 ${isEnglish ? 'To-Do' : 'Chưa Làm'}` },
                    { value: 'COMPLETED', label: `✅ ${isEnglish ? 'Completed' : 'Đã Hoàn Thành'}` },
                  ]}
                />
              </Col>
            </Row>

            {/* Hiển Thị Bài Tập Của Học Viên: Mobile Card Stack hoặc Desktop Table */}
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredStudentAssignments.length === 0 ? (
                  <Empty
                    description={t('exercises.emptyAssigned', isEnglish ? 'No assigned exercises' : 'Chưa có bài tập nào được giao')}
                  />
                ) : (
                  filteredStudentAssignments.map((assignment) => {
                    const userAttempts = attempts.filter(
                      (item) => item.assignmentId === assignment.id && item.studentId === currentUser?.id
                    );
                    const count = userAttempts.length;
                    const overdue = assignment.dueAt && new Date(assignment.dueAt) < new Date();
                    const locked = overdue || count >= (assignment.attemptsAllowed || 1);

                    return (
                      <Card
                        key={assignment.id}
                        size="small"
                        style={{
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                        styles={{ body: { padding: '14px 14px' } }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <Text strong style={{ fontSize: 15, color: '#1e1b4b', lineHeight: 1.35 }}>
                            {assignment.title}
                          </Text>
                          <Tag color="geekblue" style={{ borderRadius: 4, margin: 0, fontWeight: 600, flexShrink: 0 }}>
                            {count}/{assignment.attemptsAllowed || 1} {isEnglish ? 'attempts' : 'lần'}
                          </Tag>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                          <Tag color="purple" style={{ borderRadius: 4, margin: 0 }}>
                            🏫 {assignment.className}
                          </Tag>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            ⏰ {assignment.dueAt ? new Date(assignment.dueAt).toLocaleString('vi-VN') : (isEnglish ? 'No deadline' : 'Không giới hạn')}
                          </span>
                        </div>

                        <Button
                          type="primary"
                          disabled={locked}
                          block
                          style={{
                            height: 40,
                            borderRadius: 8,
                            fontWeight: 600,
                            ...(!locked ? { backgroundColor: '#7c3aed', borderColor: '#7c3aed' } : {}),
                          }}
                          onClick={() =>
                            setPlaying({
                              assignment,
                              exercise: items.find((item) => item.id === assignment.exerciseId),
                            })
                          }
                        >
                          {overdue
                            ? t('exercises.closedOverdue', isEnglish ? 'Closed / Overdue' : 'Đã Quá Hạn')
                            : locked
                            ? t('exercises.limitReached', isEnglish ? 'Limit reached' : 'Đã Đủ Lần Làm')
                            : t('exercises.start', isEnglish ? 'Start Exercise' : '🚀 Làm Bài Trực Tuyến')}
                        </Button>
                      </Card>
                    );
                  })
                )}
              </div>
            ) : (
              <Table
                rowKey="id"
                columns={studentColumns}
                dataSource={filteredStudentAssignments}
                scroll={{ x: 720 }}
                pagination={{ pageSize: 6 }}
                locale={{
                  emptyText: (
                    <Empty
                      description={t('exercises.emptyAssigned', isEnglish ? 'No assigned exercises' : 'Chưa có bài tập nào được giao')}
                    />
                  ),
                }}
              />
            )}
          </Card>
        )}
      </Spin>

      {/* Modal Soạn / Sửa Bài Tập */}
      <ExerciseBuilderModal
        open={Boolean(builder)}
        initialItem={builder}
        saving={saving}
        onSave={save}
        onCancel={() => setBuilder(null)}
      />

      {/* Modal Giao Bài Tập Cho Lớp / Học Viên Với UI/UX 2 Tab Mới */}
      <ExerciseAssignmentModal
        open={Boolean(assigning)}
        exercise={assigning}
        classes={assignableClasses}
        students={assignableStudents}
        assignments={assignments}
        saving={saving}
        onAssign={distribute}
        onDeleteAssignment={handleDeleteAssignment}
        onCancel={() => setAssigning(null)}
      />

      {/* Modal Làm Bài Trực Tuyến & Xem Thử */}
      <ExercisePlayerModal
        open={Boolean(playing)}
        assignment={playing?.assignment}
        exercise={playing?.exercise}
        submitting={saving}
        onSubmit={submit}
        onCancel={() => setPlaying(null)}
      />

      {/* Modal Giáo Viên Chấm Bài Tự Luận / Thu Âm */}
      <ExerciseReviewModal
        open={Boolean(reviewing)}
        attempt={reviewing}
        exercise={items.find((item) => item.id === reviewing?.exerciseId)}
        saving={saving}
        onSave={review}
        onCancel={() => setReviewing(null)}
      />
    </div>
  );
};

export default ExercisesPage;
