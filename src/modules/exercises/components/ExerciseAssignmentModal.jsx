import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Segmented,
  Select,
  DatePicker,
  Input,
  Space,
  Tag,
  Typography,
  Avatar,
  Alert,
  Empty,
  Popconfirm,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export const ExerciseAssignmentModal = ({
  open,
  exercise,
  classes = [],
  students = [],
  assignments = [],
  saving = false,
  onAssign,
  onDeleteAssignment,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const { isEnglish, t } = useLanguage();
  const isTeacherRole = currentUser?.role === 'teacher';

  const [activeTab, setActiveTab] = useState('assign');
  const [mode, setMode] = useState('class'); // 'class' | 'students'
  const [classId, setClassId] = useState('');
  const [studentIds, setStudentIds] = useState([]);
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [dueDate, setDueDate] = useState(null);
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset form when modal opens or exercise changes
  useEffect(() => {
    if (open) {
      setActiveTab('assign');
      setMode('class');
      setClassId(classes[0]?.id || '');
      setStudentIds([]);
      setStudentClassFilter('ALL');
      setDueDate(dayjs().add(7, 'day')); // Default 1 week
      setAttemptsAllowed(Number(exercise?.attemptsAllowed || 1));
      setNotes('');
    }
  }, [open, exercise?.id, classes]);

  // Active assignments for this specific exercise
  const exerciseAssignments = useMemo(() => {
    if (!exercise?.id) return [];
    return (assignments || []).filter(
      (a) => a.exerciseId === exercise.id && !a.isDeleted
    );
  }, [assignments, exercise?.id]);

  // Selected class object
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId),
    [classes, classId]
  );

  // Roster of students in the selected class
  const roster = useMemo(() => {
    if (!selectedClass) return [];
    const classStudentIds = selectedClass.studentIds || [];
    return students.filter(
      (student) =>
        classStudentIds.includes(student.id) ||
        classStudentIds.includes(student.code)
    );
  }, [selectedClass, students]);

  // Check if selected class is already assigned
  const isClassAlreadyAssigned = useMemo(() => {
    if (!classId) return false;
    return exerciseAssignments.some(
      (a) => a.classId === classId || (a.scopeType === 'class' && a.classId === classId)
    );
  }, [exerciseAssignments, classId]);

  // Filter students for manual multi-select
  const filteredStudentsForSelect = useMemo(() => {
    if (studentClassFilter === 'ALL') return students;
    const filterClass = classes.find((c) => c.id === studentClassFilter);
    const filterIds = filterClass?.studentIds || [];
    return students.filter(
      (s) => filterIds.includes(s.id) || filterIds.includes(s.code)
    );
  }, [students, classes, studentClassFilter]);

  // Quick preset due dates
  const handleQuickDueDate = (days) => {
    if (days === null) {
      setDueDate(null);
    } else {
      setDueDate(dayjs().add(days, 'day'));
    }
  };

  // Submit assignment
  const handleSubmit = () => {
    const targetStudents =
      mode === 'class'
        ? roster
        : students.filter((s) => studentIds.includes(s.id));

    onAssign({
      selectedClass: mode === 'class' ? selectedClass : null,
      students: targetStudents,
      scopeType: mode,
      dueAt: dueDate ? dueDate.toISOString() : '',
      attemptsAllowed,
      notes: notes.trim(),
    });
  };

  const isSubmitDisabled =
    saving ||
    (mode === 'class' ? !selectedClass || roster.length === 0 : studentIds.length === 0);

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            <SendOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>
                {isEnglish ? 'Assign Exercise' : 'Phân Công & Giao Bài Tập'}
              </span>
              {isTeacherRole ? (
                <Tag color="cyan" style={{ borderRadius: 4, margin: 0, fontWeight: 600, fontSize: 11 }}>
                  🎓 {isEnglish ? 'Teacher Scope: Your Classes & Students' : 'Phạm vi: Lớp & Học sinh bạn phụ trách'}
                </Tag>
              ) : (
                <Tag color="purple" style={{ borderRadius: 4, margin: 0, fontWeight: 600, fontSize: 11 }}>
                  👑 {isEnglish ? 'Institutional Scope: Full Access' : 'Toàn Quyền Phân Công (Toàn Trường)'}
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              {exercise?.title} • {exercise?.questions?.length || 0} {isEnglish ? 'questions' : 'câu hỏi'}
            </div>
          </div>
        </div>
      }
      onCancel={onCancel}
      width={720}
      footer={null}
      destroyOnClose
      style={{ top: 24 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'assign',
            label: (
              <span style={{ fontWeight: 600 }}>
                <SendOutlined style={{ marginRight: 6 }} />
                {isEnglish ? '🚀 Assign New' : '🚀 Giao Bài Tập Mới'}
              </span>
            ),
            children: (
              <div style={{ paddingTop: 8 }}>
                {/* 1. Chọn Phạm Vi Phân Công */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155' }}>
                    {isEnglish ? '1. Select Target Audience' : '1. Chọn Đối Tượng Nhận Bài Tập'}
                  </Text>
                  <Segmented
                    block
                    value={mode}
                    onChange={setMode}
                    options={[
                      {
                        label: (
                          <div style={{ padding: '6px 0', fontWeight: 600 }}>
                            <TeamOutlined style={{ marginRight: 6, color: '#7c3aed' }} />
                            {isEnglish ? 'Whole Class (All Enrolled)' : 'Cả Lớp Học (Toàn Bộ Học Viên)'}
                          </div>
                        ),
                        value: 'class',
                      },
                      {
                        label: (
                          <div style={{ padding: '6px 0', fontWeight: 600 }}>
                            <UserOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                            {isEnglish ? 'Specific Students (Custom)' : 'Chọn Từng Học Viên Cụ Thể'}
                          </div>
                        ),
                        value: 'students',
                      },
                    ]}
                  />
                </div>

                {/* 2. Chi Tiết Lớp hoặc Học Viên */}
                {mode === 'class' ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text strong style={{ fontSize: 13, color: '#334155' }}>
                        {isEnglish ? 'Select Class:' : 'Chọn Lớp Học:'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {isTeacherRole
                          ? `${classes.length} ${isEnglish ? 'classes you teach' : 'lớp bạn phụ trách'}`
                          : `${classes.length} ${isEnglish ? 'classes available (All Academy)' : 'lớp toàn hệ thống'}`}
                      </Text>
                    </div>

                    {classes.length === 0 ? (
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 12, borderRadius: 8 }}
                        message={
                          isEnglish
                            ? 'No classes currently assigned to your teacher account.'
                            : 'Bạn hiện chưa được phân công phụ trách lớp học nào để giao bài tập.'
                        }
                      />
                    ) : (
                      <Select
                        value={classId || undefined}
                        onChange={setClassId}
                        placeholder={isEnglish ? 'Choose a class...' : 'Chọn một lớp học...'}
                        style={{ width: '100%', height: 42, marginBottom: 12 }}
                        showSearch
                        optionFilterProp="label"
                        options={classes.map((item) => ({
                          value: item.id,
                          label: `🏫 ${item.name} [${item.id}] (${item.studentIds?.length || 0} ${isEnglish ? 'students' : 'học viên'})`,
                        }))}
                      />
                    )}

                    {/* Cảnh Báo Nếu Lớp Đã Được Giao Bài Này */}
                    {isClassAlreadyAssigned && (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12, borderRadius: 8 }}
                        message={
                          <span style={{ fontWeight: 600 }}>
                            {isEnglish ? 'Already Assigned Notice' : 'Thông Báo: Lớp Này Đã Được Giao Bài'}
                          </span>
                        }
                        description={
                          isEnglish
                            ? `Class "${selectedClass?.name}" is already in the active assignments list. You can still assign again to create another batch or update due date.`
                            : `Lớp "${selectedClass?.name}" đã được giao bài tập này. Bạn vẫn có thể tiếp tục giao nếu muốn gia hạn nộp bài hoặc mở đợt làm bài mới.`
                        }
                      />
                    )}

                    {/* Danh Sách Học Viên Trong Lớp Sẽ Nhận Bài Tập */}
                    {selectedClass && (
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                            {isEnglish
                              ? `Enrolled Students (${roster.length}):`
                              : `Danh Sách Học Viên Nhận Bài (${roster.length} em):`}
                          </Text>
                          <Tag color="purple" style={{ margin: 0, borderRadius: 4 }}>
                            {selectedClass.name}
                          </Tag>
                        </div>

                        {roster.length === 0 ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {isEnglish ? 'No students enrolled in this class.' : 'Lớp chưa có học viên nào tham gia.'}
                          </Text>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                            {roster.map((s) => (
                              <Tag
                                key={s.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                }}
                              >
                                <Avatar size={18} src={s.avatar} style={{ backgroundColor: '#7c3aed' }}>
                                  {(s.englishName || s.name || s.id)[0]}
                                </Avatar>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                  {s.englishName || s.name}
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: 11 }}>
                                  ({s.code || s.id})
                                </span>
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <Row gutter={[10, 10]} style={{ marginBottom: 8 }}>
                      <Col xs={24} sm={11}>
                        <Select
                          value={studentClassFilter}
                          onChange={setStudentClassFilter}
                          style={{ width: '100%', height: 40 }}
                          options={[
                            {
                              value: 'ALL',
                              label: isTeacherRole
                                ? (isEnglish ? 'Classes You Teach: All' : 'Lớp Bạn Dạy: Tất Cả')
                                : (isEnglish ? 'Filter by Class: All' : 'Lọc Theo Lớp: Tất Cả'),
                            },
                            ...classes.map((c) => ({
                              value: c.id,
                              label: `🏫 ${c.name} [${c.id}]`,
                            })),
                          ]}
                        />
                      </Col>
                      <Col xs={24} sm={13}>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: '40px', textAlign: 'right' }}>
                          {isTeacherRole ? (
                            <span>
                              {isEnglish ? 'Your learners:' : 'Học sinh bạn dạy:'}{' '}
                              <strong>{students.length}</strong> {isEnglish ? 'learners' : 'em'} |{' '}
                            </span>
                          ) : (
                            <span>
                              {isEnglish ? 'All academy:' : 'Toàn trường:'}{' '}
                              <strong>{students.length}</strong> {isEnglish ? 'learners' : 'em'} |{' '}
                            </span>
                          )}
                          {isEnglish ? 'Selected:' : 'Đã chọn:'}{' '}
                          <Tag color="cyan" style={{ fontWeight: 700 }}>
                            {studentIds.length} {isEnglish ? 'students' : 'học viên'}
                          </Tag>
                        </div>
                      </Col>
                    </Row>

                    <Select
                      mode="multiple"
                      value={studentIds}
                      onChange={setStudentIds}
                      placeholder={isEnglish ? 'Choose specific students...' : 'Chọn danh sách học viên...'}
                      style={{ width: '100%' }}
                      showSearch
                      optionFilterProp="label"
                      options={filteredStudentsForSelect.map((item) => ({
                        value: item.id,
                        label: `${item.englishName ? `${item.englishName} • ` : ''}${item.name || item.id} (${item.code || item.id})`,
                      }))}
                    />
                  </div>
                )}

                {/* 3. Cấu Hình Thời Hạn, Số Lần Làm Bài & Lời Dặn */}
                <div
                  style={{
                    backgroundColor: '#fafafa',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #f0f0f0',
                    marginBottom: 18,
                  }}
                >
                  <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13, color: '#334155' }}>
                    {isEnglish ? '2. Assignment Settings & Instructions' : '2. Thiết Lập Thời Hạn & Lời Dặn Dò'}
                  </Text>

                  <Row gutter={[14, 14]}>
                    <Col xs={24} sm={14}>
                      <div style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 12, color: '#475569' }}>
                          📅 {isEnglish ? 'Due Date (Deadline):' : 'Hạn Nộp Bài:'}
                        </Text>
                      </div>
                      <DatePicker
                        showTime
                        format="DD/MM/YYYY HH:mm"
                        value={dueDate}
                        onChange={setDueDate}
                        placeholder={isEnglish ? 'Select due date & time...' : 'Chọn ngày & giờ hết hạn...'}
                        style={{ width: '100%', height: 38, borderRadius: 8, marginBottom: 8 }}
                      />
                      {/* Phím tắt hạn nộp tiện lợi */}
                      <Space size={6} wrap>
                        <Button size="small" onClick={() => handleQuickDueDate(3)} style={{ borderRadius: 6, fontSize: 11 }}>
                          +3 {isEnglish ? 'days' : 'ngày'}
                        </Button>
                        <Button size="small" onClick={() => handleQuickDueDate(7)} style={{ borderRadius: 6, fontSize: 11 }}>
                          +1 {isEnglish ? 'week' : 'tuần'}
                        </Button>
                        <Button size="small" onClick={() => handleQuickDueDate(14)} style={{ borderRadius: 6, fontSize: 11 }}>
                          +2 {isEnglish ? 'weeks' : 'tuần'}
                        </Button>
                        <Button size="small" onClick={() => handleQuickDueDate(null)} style={{ borderRadius: 6, fontSize: 11 }}>
                          {isEnglish ? 'No deadline' : 'Không giới hạn'}
                        </Button>
                      </Space>
                    </Col>

                    <Col xs={24} sm={10}>
                      <div style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 12, color: '#475569' }}>
                          🔄 {isEnglish ? 'Max Attempts:' : 'Số Lần Làm Bài:'}
                        </Text>
                      </div>
                      <Select
                        value={attemptsAllowed}
                        onChange={setAttemptsAllowed}
                        style={{ width: '100%', height: 38 }}
                        options={[
                          { value: 1, label: isEnglish ? '1 attempt (Standard Quiz)' : '1 lần (Kiểm tra chuẩn)' },
                          { value: 2, label: isEnglish ? '2 attempts' : '2 lần' },
                          { value: 3, label: isEnglish ? '3 attempts' : '3 lần' },
                          { value: 999, label: isEnglish ? 'Unlimited (Free Practice)' : 'Không giới hạn (Luyện tập)' },
                        ]}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginTop: 14 }}>
                    <Text strong style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6 }}>
                      💬 {isEnglish ? 'Teacher Instructions / Notes for Learners:' : 'Lời Dặn Của Giáo Viên Cho Học Viên:'}
                    </Text>
                    <TextArea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        isEnglish
                          ? 'e.g. Please listen carefully to the audio and answer all 11 questions before Thursday class.'
                          : 'Ví dụ: Các em hãy nghe kỹ đoạn audio và hoàn thành đầy đủ 11 câu hỏi trước buổi học thứ Năm nhé.'
                      }
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>

                {/* Footer Hành Động */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <Button onClick={onCancel} style={{ borderRadius: 8 }}>
                    {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={saving}
                    disabled={isSubmitDisabled}
                    onClick={handleSubmit}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                      backgroundColor: '#7c3aed',
                      borderColor: '#7c3aed',
                    }}
                  >
                    {isEnglish ? 'Confirm & Distribute' : '🚀 Xác Nhận Giao Bài Tập'}
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: 'tracking',
            label: (
              <span style={{ fontWeight: 600 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} />
                {isEnglish ? 'Active Assignments' : 'Đã Giao & Quản Lý'}
                <Badge
                  count={exerciseAssignments.length}
                  overflowCount={99}
                  style={{
                    marginLeft: 8,
                    backgroundColor: exerciseAssignments.length > 0 ? '#7c3aed' : '#94a3b8',
                  }}
                />
              </span>
            ),
            children: (
              <div style={{ paddingTop: 8 }}>
                {exerciseAssignments.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                          {isEnglish ? 'No assignments yet' : 'Chưa có phân công nào cho bài tập này'}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {isEnglish
                            ? 'Switch to "Assign New" tab to distribute this exercise to classes or learners.'
                            : 'Hãy chuyển sang Tab "Giao Bài Tập Mới" để giao cho lớp học hoặc học viên.'}
                        </Text>
                      </div>
                    }
                    style={{ padding: '30px 0' }}
                  >
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={() => setActiveTab('assign')}
                      style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', borderRadius: 8 }}
                    >
                      {isEnglish ? 'Assign Now' : 'Giao Bài Ngay'}
                    </Button>
                  </Empty>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {isEnglish ? 'Active batches for this exercise:' : 'Các đợt giao bài đang hoạt động:'}{' '}
                        <strong style={{ color: '#0f172a' }}>{exerciseAssignments.length}</strong>
                      </Text>
                      <Button
                        size="small"
                        icon={<SendOutlined />}
                        onClick={() => setActiveTab('assign')}
                        style={{ borderRadius: 6, fontWeight: 600, color: '#7c3aed', borderColor: '#7c3aed' }}
                      >
                        {isEnglish ? '+ Assign Another' : '+ Giao Thêm'}
                      </Button>
                    </div>

                    {exerciseAssignments.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Header của thẻ phân công */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <Text strong style={{ fontSize: 15, color: '#1e293b' }}>
                                {a.scopeType === 'class' || a.className
                                  ? `🏫 ${a.className || `Lớp ${a.classId}`}`
                                  : `👤 ${isEnglish ? 'Custom Learners Batch' : 'Nhóm Học Viên Cụ Thể'}`}
                              </Text>
                              <Tag color={a.scopeType === 'class' ? 'purple' : 'blue'} style={{ borderRadius: 4, margin: 0 }}>
                                {a.targetStudentIds?.length || 0} {isEnglish ? 'learners' : 'học viên'}
                              </Tag>
                              <Tag color="green" style={{ borderRadius: 4, margin: 0 }}>
                                {a.status || 'OPEN'}
                              </Tag>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              <span>✍️ {a.assignedBy || 'Teacher'}</span>
                              <span style={{ margin: '0 6px' }}>•</span>
                              <span>📅 {a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                            </div>
                          </div>

                          {/* Nút Xóa / Thu Hồi Phân Công */}
                          {onDeleteAssignment && (
                            <Popconfirm
                              title={isEnglish ? 'Revoke this assignment?' : 'Xác nhận thu hồi phân công này?'}
                              description={
                                isEnglish
                                  ? 'Learners will no longer see this exercise on their dashboard.'
                                  : 'Học viên thuộc phân công này sẽ không còn thấy bài tập trong Dashboard nữa.'
                              }
                              okText={isEnglish ? 'Revoke / Delete' : 'Xác Nhận Xóa'}
                              cancelText={isEnglish ? 'Cancel' : 'Hủy'}
                              okButtonProps={{ danger: true }}
                              onConfirm={() => onDeleteAssignment(a.id)}
                            >
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                style={{ borderRadius: 6, fontWeight: 500 }}
                              >
                                {isEnglish ? 'Revoke' : 'Xóa / Thu Hồi'}
                              </Button>
                            </Popconfirm>
                          )}
                        </div>

                        {/* Danh sách học viên nhận bài */}
                        {a.targetStudents && a.targetStudents.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                            {a.targetStudents.slice(0, 10).map((st) => (
                              <Tag
                                key={st.id}
                                style={{
                                  borderRadius: 4,
                                  fontSize: 11,
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  margin: 0,
                                }}
                              >
                                {st.englishName || st.name} ({st.code || st.id})
                              </Tag>
                            ))}
                            {a.targetStudents.length > 10 && (
                              <Tag style={{ borderRadius: 4, fontSize: 11 }}>
                                +{a.targetStudents.length - 10} {isEnglish ? 'more' : 'khác'}
                              </Tag>
                            )}
                          </div>
                        ) : null}

                        {/* Thông số hạn nộp & lần làm */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                            fontSize: 12,
                            color: '#475569',
                            backgroundColor: '#f8fafc',
                            padding: '6px 10px',
                            borderRadius: 6,
                          }}
                        >
                          <span>
                            ⏰ <strong>{isEnglish ? 'Due:' : 'Hạn nộp:'}</strong>{' '}
                            {a.dueAt ? new Date(a.dueAt).toLocaleString('vi-VN') : (isEnglish ? 'No deadline' : 'Không giới hạn')}
                          </span>
                          <span>•</span>
                          <span>
                            🔄 <strong>{isEnglish ? 'Attempts:' : 'Số lần làm:'}</strong>{' '}
                            {a.attemptsAllowed === 999 ? (isEnglish ? 'Unlimited' : 'Không giới hạn') : `${a.attemptsAllowed || 1} lần`}
                          </span>
                        </div>

                        {/* Lời dặn nếu có */}
                        {a.notes && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#6d28d9', fontStyle: 'italic' }}>
                            💬 "{a.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ExerciseAssignmentModal;
