import { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { MOCK_TIMETABLE, MOCK_TEACHERS, MOCK_COURSES } from '../../../shared/data/mockData';
import { CourseCatalogService } from '../services/CourseCatalogService';
import { TimetableSlotService } from '../services/TimetableSlotService';
import { TeacherCheckInService } from '../services/TeacherCheckInService';

export const useScheduleController = () => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const [courses, setCourses] = useState(MOCK_COURSES);
  const [timetable, setTimetable] = useState(MOCK_TIMETABLE);
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const scopedTimetable = useMemo(
    () => TimetableSlotService.getScopedTimetable(timetable, currentUser, selectedDayFilter),
    [timetable, currentUser, selectedDayFilter]
  );

  const permissions = {
    canManageCoursesAndSchedules: PermissionService.canManageCoursesAndSchedules(role),
    canCheckInClass: PermissionService.canCheckInClass(role),
    showCourseCatalog: ['director', 'academic', 'admin'].includes(role),
  };

  const handleCreateCourse = (values) => {
    setCourses((prev) => CourseCatalogService.createCourse(prev, values));
    setIsCourseModalOpen(false);
    message.success('Đã tạo khóa học mới thành công!');
  };

  const handleAddScheduleSlot = (values) => {
    setTimetable((prev) => TimetableSlotService.createScheduleSlot(prev, values, MOCK_TEACHERS));
    setIsScheduleModalOpen(false);
    message.success('Đã xếp lịch lớp học trực tuyến mới thành công!');
  };

  const handleCheckInSession = (slotId) => {
    setTimetable((prev) => TeacherCheckInService.checkInSession(prev, slotId));
    message.success('Check-in lớp học thành công! Đã ghi nhận ca dạy của giáo viên.');
  };

  return {
    currentUser,
    courses,
    teachers: MOCK_TEACHERS,
    scopedTimetable,
    selectedDayFilter,
    setSelectedDayFilter,
    permissions,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isCourseModalOpen,
    setIsCourseModalOpen,
    handleCreateCourse,
    handleAddScheduleSlot,
    handleCheckInSession,
  };
};

