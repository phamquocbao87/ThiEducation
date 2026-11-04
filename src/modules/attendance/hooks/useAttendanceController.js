import { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import {
  MOCK_CLASSES,
  MOCK_ATTENDANCES,
  MOCK_STUDENTS,
  MOCK_HOMEWORKS,
} from '../../../shared/data/mockData';
import { ClassroomOperationService } from '../services/ClassroomOperationService';
import { StudentProfileService } from '../services/StudentProfileService';
import { SessionEvaluationService } from '../services/SessionEvaluationService';
import { HomeworkAssignmentService } from '../services/HomeworkAssignmentService';

export const useAttendanceController = () => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [attendances, setAttendances] = useState(MOCK_ATTENDANCES);
  const [homeworks, setHomeworks] = useState(MOCK_HOMEWORKS);

  const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const [studentRoster, setStudentRoster] = useState(() =>
    MOCK_STUDENTS.map((s) => ({ id: s.id, name: s.name, present: true }))
  );

  const scopedClasses = useMemo(
    () => ClassroomOperationService.getScopedClasses(classes, currentUser),
    [classes, currentUser]
  );

  const scopedAttendances = useMemo(
    () => SessionEvaluationService.getScopedAttendances(attendances, currentUser),
    [attendances, currentUser]
  );

  const scopedHomeworks = useMemo(
    () => HomeworkAssignmentService.getScopedHomeworks(homeworks, currentUser),
    [homeworks, currentUser]
  );

  const studentsInSelectedClass = useMemo(
    () => StudentProfileService.getStudentsByClass(students, selectedClass?.id, currentUser),
    [students, selectedClass, currentUser]
  );

  const permissions = {
    canCheckIn: PermissionService.canCheckInClass(role),
    canEvaluate: PermissionService.canEvaluateStudents(role),
    isStudent: role === PermissionService.ROLES.STUDENT,
  };

  const handleCheckInClass = (classId) => {
    setClasses((prev) => ClassroomOperationService.checkInClassroom(prev, classId));
    message.success('Giáo viên đã Check-in lớp học trực tuyến thành công!');
  };

  const handleOpenEvaluateModal = (cls) => {
    setSelectedClass(cls);
    setIsEvaluationModalOpen(true);
  };

  const handleOpenProfileDrawer = (cls) => {
    setSelectedClass(cls);
    setIsProfileDrawerOpen(true);
  };

  const handleToggleStudentPresence = (studentId) => {
    setStudentRoster((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s))
    );
  };

  const handleSubmitEvaluation = (values) => {
    setAttendances((prev) =>
      SessionEvaluationService.createSessionEvaluation(
        prev,
        selectedClass,
        studentRoster,
        values,
        currentUser
      )
    );
    setIsEvaluationModalOpen(false);
    message.success(`Đã lưu điểm danh & đánh giá buổi học cho lớp ${selectedClass.name}!`);
  };

  const handleSaveStudentNote = (studentId, note) => {
    setStudents((prev) =>
      StudentProfileService.updateStudentIndividualNote(prev, studentId, note)
    );
    message.success('Đã cập nhật nhận xét cá nhân vào hồ sơ học viên!');
  };

  const handleSubmitHomework = (homeworkId) => {
    setHomeworks((prev) => HomeworkAssignmentService.submitHomework(prev, homeworkId));
    message.success('Đã nộp bài tập thành công! Giáo viên sẽ chấm và phản hồi.');
  };

  return {
    currentUser,
    scopedClasses,
    scopedAttendances,
    scopedHomeworks,
    studentsInSelectedClass,
    selectedClass,
    studentRoster,
    permissions,
    isEvaluationModalOpen,
    setIsEvaluationModalOpen,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    handleCheckInClass,
    handleOpenEvaluateModal,
    handleOpenProfileDrawer,
    handleToggleStudentPresence,
    handleSubmitEvaluation,
    handleSaveStudentNote,
    handleSubmitHomework,
  };
};

