import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { CourseService } from '../../courses/services/CourseService';
import { ClassService } from '../../courses/services/ClassService';
import { TimetableSlotService } from '../services/TimetableSlotService';
import { TeacherCheckInService } from '../services/TeacherCheckInService';

export const useScheduleController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const { isEnglish } = useLanguage();
  const role = currentUser.role;

  const [systemClasses, setSystemClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timetable, setTimetable] = useState([]);

  // Lấy danh sách Giáo viên Bản Xứ thực tế từ Firestore
  const teachers = useMemo(() => {
    return (allSystemUsers || [])
      .filter(
        (u) =>
          (u.role || '').toLowerCase() === 'teacher' &&
          u.status !== 'deleted' &&
          !u.isDeleted
      )
      .map((u) => ({
        id: u.id || u.code,
        name: u.name,
        englishName: u.englishName || u.name,
        nationality: u.nationality || 'Foreign Native',
        email: u.email,
        phone: u.phoneNumber || u.phone,
        avatar: u.avatar || '',
        ratePerSession: u.hourlyRate || 450000,
        status: u.status || 'Active',
      }));
  }, [allSystemUsers]);

  // Đọc danh sách lớp học và khóa học trực tiếp từ Cloud Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchSchedulesData = async () => {
      try {
        const [cList, clsList] = await Promise.all([
          CourseService.getAllCourses(),
          ClassService.getAllClasses(),
        ]);
        if (isMounted) {
          setCourses(cList);
          setSystemClasses(clsList);

          // Xóa triệt để các ca học rác cũ lưu trong localStorage ("Súng Bắn Ốc, Vặn Vít", "erw", "a223")
          try {
            localStorage.removeItem('lak_erp_timetable');
            localStorage.removeItem('lak_erp_classes');
          } catch {}

          // Sinh thời khóa biểu chuẩn từ danh sách lớp học thực tế trong Firestore
          if (clsList && clsList.length > 0) {
            const generatedSlots = TimetableSlotService.generateSlotsFromClasses(clsList);
            setTimetable(generatedSlots);
          } else {
            setTimetable([]);
          }
        }
      } catch (err) {
        console.error('Error fetching schedules from Firestore:', err);
      }
    };

    fetchSchedulesData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleCreateCourse = async (values) => {
    const updated = CourseService.createCourse(values, courses);
    const newCourse = updated[0];
    setCourses(updated);
    setIsCourseModalOpen(false);
    try {
      await CourseService.saveCourse(newCourse);
      message.success(isEnglish ? 'New course created successfully!' : 'Đã tạo khóa học mới thành công!');
    } catch (err) {
      message.error(isEnglish ? 'Failed to save course: ' + err.message : 'Lỗi lưu khóa học: ' + err.message);
    }
  };

  const handleAddScheduleSlot = (values) => {
    const next = TimetableSlotService.createScheduleSlot(timetable, values, teachers);
    setTimetable(next);
    setIsScheduleModalOpen(false);
    message.success(isEnglish ? 'New class schedule created successfully!' : 'Đã xếp lịch lớp học trực tuyến mới thành công!');
  };

  const handleCheckInSession = (slotId) => {
    setTimetable((prev) => {
      const next = TeacherCheckInService.checkInSession(prev, slotId);
      return next;
    });
    message.success(isEnglish ? 'Class check-in completed!' : 'Check-in lớp học thành công! Đã ghi nhận ca dạy của giáo viên.');
  };

  return {
    currentUser,
    courses,
    classes: systemClasses,
    teachers,
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
