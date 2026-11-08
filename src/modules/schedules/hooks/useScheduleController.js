import { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import {
  MOCK_TIMETABLE,
  MOCK_TEACHERS,
  MOCK_COURSES,
  MOCK_CLASSES,
} from '../../../shared/data/mockData';
import { CourseCatalogService } from '../services/CourseCatalogService';
import { TimetableSlotService } from '../services/TimetableSlotService';
import { TeacherCheckInService } from '../services/TeacherCheckInService';

export const useScheduleController = () => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  // Đọc danh sách lớp học thực tế từ hệ thống (localStorage hoặc MOCK_CLASSES)
  const systemClasses = useMemo(() => {
    try {
      const saved = localStorage.getItem('lak_erp_classes');
      return saved !== null ? JSON.parse(saved) : MOCK_CLASSES;
    } catch {
      return MOCK_CLASSES;
    }
  }, []);

  const [courses, setCourses] = useState(MOCK_COURSES);

  // Nếu hệ thống không có lớp học nào -> Thời khóa biểu phải là rỗng []
  const [timetable, setTimetable] = useState(() => {
    if (!systemClasses || systemClasses.length === 0) {
      try {
        localStorage.removeItem('lak_erp_timetable');
      } catch {}
      return [];
    }

    try {
      const saved = localStorage.getItem('lak_erp_timetable');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        // Lọc bỏ những ca học thuộc các lớp không còn tồn tại
        const validSlots = parsed.filter((slot) =>
          systemClasses.some((c) => c.id === slot.classId)
        );
        return validSlots;
      }
    } catch {
      // ignore
    }

    // Tự động sinh từ các lớp học thực tế đang có trong hệ thống
    return TimetableSlotService.generateSlotsFromClasses(systemClasses);
  });

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
    const next = TimetableSlotService.createScheduleSlot(timetable, values, MOCK_TEACHERS);
    setTimetable(next);
    localStorage.setItem('lak_erp_timetable', JSON.stringify(next));
    setIsScheduleModalOpen(false);
    message.success('Đã xếp lịch lớp học trực tuyến mới thành công!');
  };

  const handleCheckInSession = (slotId) => {
    setTimetable((prev) => {
      const next = TeacherCheckInService.checkInSession(prev, slotId);
      localStorage.setItem('lak_erp_timetable', JSON.stringify(next));
      return next;
    });
    message.success('Check-in lớp học thành công! Đã ghi nhận ca dạy của giáo viên.');
  };

  return {
    currentUser,
    courses,
    classes: systemClasses,
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
