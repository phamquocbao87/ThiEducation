import { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PermissionService } from '../../../core/services/PermissionService';
import {
  MOCK_COURSES,
  MOCK_CLASSES,
  MOCK_TEACHERS,
  MOCK_STUDENTS,
} from '../../../shared/data/mockData';
import { CourseService } from '../services/CourseService';
import { ClassService } from '../services/ClassService';

export const useCoursesController = () => {
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();

  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('lak_erp_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading lak_erp_courses:', e);
    }
    return MOCK_COURSES;
  });
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lak_erp_classes');
    return saved !== null ? JSON.parse(saved) : MOCK_CLASSES;
  });
  const [students] = useState(MOCK_STUDENTS);

  // Filters
  const [courseSearch, setCourseSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('ALL');

  // Modals & Drawers (View & Edit Modes)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [rosterClass, setRosterClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const canManage = useMemo(
    () => PermissionService.canManageCourses(currentUser?.role),
    [currentUser?.role]
  );

  const filteredCourses = useMemo(() => {
    return CourseService.filterCourses(courses, courseSearch);
  }, [courses, courseSearch]);

  const filteredClasses = useMemo(() => {
    return ClassService.filterClasses(classes, {
      keyword: classSearch,
      courseId: selectedCourseFilter,
      teacherId: selectedTeacherFilter,
    });
  }, [classes, classSearch, selectedCourseFilter, selectedTeacherFilter]);

  const syncUpdatedClasses = (updatedList, targetClassId = null) => {
    setClasses(updatedList);
    localStorage.setItem('lak_erp_classes', JSON.stringify(updatedList));
    if (targetClassId && rosterClass?.id === targetClassId) {
      const refreshed = updatedList.find((c) => c.id === targetClassId);
      if (refreshed) setRosterClass(refreshed);
    }
  };

  const handleCreateCourse = (courseData) => {
    const updated = CourseService.createCourse(courseData, courses);
    setCourses(updated);
    localStorage.setItem('lak_erp_courses', JSON.stringify(updated));
    setIsCourseModalOpen(false);
    message.success(
      isEnglish ? 'New course created successfully!' : 'Tạo khóa học mới thành công!'
    );
  };

  const handleUpdateCourse = (courseId, updatedValues) => {
    const updated = CourseService.updateCourse(courseId, updatedValues, courses);
    setCourses(updated);
    localStorage.setItem('lak_erp_courses', JSON.stringify(updated));

    const updatedCourseObj = updated.find((c) => c.id === courseId);
    if (updatedCourseObj) {
      if (viewingCourse?.id === courseId) {
        setViewingCourse(updatedCourseObj);
      }
      setClasses((prevClasses) => {
        const nextClasses = prevClasses.map((cls) =>
          cls.courseId === courseId ? { ...cls, courseName: updatedCourseObj.name } : cls
        );
        localStorage.setItem('lak_erp_classes', JSON.stringify(nextClasses));
        return nextClasses;
      });
    }

    setEditingCourse(null);
    message.success(
      isEnglish ? 'Course updated successfully!' : 'Cập nhật thông tin khóa học thành công!'
    );
  };

  const handleCreateClass = (classData) => {
    const updated = ClassService.createClass(
      classData,
      classes,
      MOCK_TEACHERS,
      courses
    );
    syncUpdatedClasses(updated);

    setCourses((prev) => {
      const nextCourses = prev.map((c) =>
        c.id === classData.courseId
          ? { ...c, activeClasses: (c.activeClasses || 0) + 1 }
          : c
      );
      localStorage.setItem('lak_erp_courses', JSON.stringify(nextCourses));
      return nextCourses;
    });

    setIsClassModalOpen(false);
    setEditingClass(null);
    message.success(
      isEnglish
        ? 'New class created successfully!'
        : 'Tạo lớp học mới thành công!'
    );
  };

  const handleUpdateClass = (classId, updatedValues) => {
    const updated = ClassService.updateClass(
      classId,
      updatedValues,
      classes,
      MOCK_TEACHERS,
      courses
    );
    syncUpdatedClasses(updated, classId);

    setEditingClass(null);
    setIsClassModalOpen(false);
    message.success(
      isEnglish ? 'Class information updated successfully!' : 'Cập nhật thông tin lớp học thành công!'
    );
  };

  /**
   * 1. Giáo viên tự đăng ký nhận dạy lớp trống GV (Chờ Giáo vụ duyệt)
   */
  const handleRequestTeachClass = (classId, customTeacher = null) => {
    const teacherActor =
      customTeacher ||
      MOCK_TEACHERS.find((t) => t.id === currentUser?.id) ||
      MOCK_TEACHERS[0];

    const { updatedClasses, conflicts } = ClassService.requestTeachClass(
      classId,
      teacherActor,
      classes
    );
    syncUpdatedClasses(updatedClasses, classId);

    if (conflicts.length > 0) {
      message.warning(
        isEnglish
          ? `Teaching request submitted with schedule conflict warning (${conflicts.map((c) => c.id).join(', ')})! Pending Academic approval.`
          : `Đã gửi đăng ký dạy lớp (Lưu ý: GV ${teacherActor.name} đang trùng lịch với lớp ${conflicts.map((c) => c.id).join(', ')})! Đang chờ Giáo vụ duyệt.`
      );
    } else {
      message.success(
        isEnglish
          ? 'Teaching registration submitted! Waiting for Academic Coordinator approval.'
          : 'Đã gửi đăng ký nhận dạy lớp thành công! Vui lòng chờ Giáo vụ phê duyệt.'
      );
    }
  };

  /**
   * 2. Giáo vụ duyệt Giáo viên nhận lớp
   */
  const handleApproveTeacherRequest = (classId, teacherId) => {
    const updated = ClassService.approveTeacherRequest(
      classId,
      teacherId,
      classes,
      MOCK_TEACHERS
    );
    syncUpdatedClasses(updated, classId);
    message.success(
      isEnglish
        ? 'Approved teacher assignment for this class!'
        : 'Đã phê duyệt phân công Giáo viên dạy lớp thành công!'
    );
  };

  /**
   * 3. Giáo vụ từ chối Giáo viên nhận lớp
   */
  const handleRejectTeacherRequest = (classId, teacherId) => {
    const updated = ClassService.rejectTeacherRequest(classId, teacherId, classes);
    syncUpdatedClasses(updated, classId);
    message.info(
      isEnglish
        ? 'Declined teacher registration request.'
        : 'Đã từ chối yêu cầu đăng ký dạy của giáo viên.'
    );
  };

  /**
   * 4. Học viên tự đăng ký tham gia lớp học (Chờ Giáo vụ duyệt)
   */
  const handleRequestEnrollClass = (classId, customStudent = null) => {
    const targetCls = classes.find((c) => c.id === classId);
    const studentActor =
      customStudent ||
      students.find((s) => s.id === currentUser?.id) ||
      students.find((s) => !(targetCls?.studentIds || []).includes(s.id)) ||
      students[0];

    const { updatedClasses, conflicts } = ClassService.requestEnrollClass(
      classId,
      studentActor,
      classes
    );
    syncUpdatedClasses(updatedClasses, classId);

    if (conflicts.length > 0) {
      message.warning(
        isEnglish
          ? `Enrollment request sent! Warning: Overlaps with timetable (${conflicts.map((c) => c.id).join(', ')}).`
          : `Đã gửi đăng ký học (Cảnh báo: HV ${studentActor.name} trùng TKB với lớp ${conflicts.map((c) => c.id).join(', ')})! Chờ Giáo vụ duyệt.`
      );
    } else {
      message.success(
        isEnglish
          ? 'Class enrollment request submitted! Waiting for Academic approval.'
          : 'Đã gửi yêu cầu đăng ký lớp học! Vui lòng chờ Giáo vụ phê duyệt.'
      );
    }
  };

  /**
   * 5. Giáo vụ duyệt Học viên vào lớp
   */
  const handleApproveStudentRequest = (classId, studentId) => {
    const updated = ClassService.approveStudentRequest(classId, studentId, classes);
    syncUpdatedClasses(updated, classId);
    message.success(
      isEnglish
        ? 'Approved student enrollment into class roster!'
        : 'Đã phê duyệt Học viên vào danh sách lớp chính thức!'
    );
  };

  /**
   * 6. Giáo vụ từ chối yêu cầu đăng ký lớp của Học viên
   */
  const handleRejectStudentRequest = (classId, studentId) => {
    const updated = ClassService.rejectStudentRequest(classId, studentId, classes);
    syncUpdatedClasses(updated, classId);
    message.info(
      isEnglish
        ? 'Declined student enrollment request.'
        : 'Đã từ chối yêu cầu đăng ký lớp của học viên.'
    );
  };

  const handleDeleteCourse = (courseId) => {
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    localStorage.setItem('lak_erp_courses', JSON.stringify(updated));
    if (viewingCourse?.id === courseId) setViewingCourse(null);
    if (editingCourse?.id === courseId) setEditingCourse(null);
    message.success(
      isEnglish ? 'Course deleted successfully!' : 'Đã xóa khóa học thành công!'
    );
  };

  const handleDeleteClass = (classId) => {
    const updated = classes.filter((c) => c.id !== classId);
    syncUpdatedClasses(updated);
    if (rosterClass?.id === classId) setRosterClass(null);
    if (editingClass?.id === classId) setEditingClass(null);
    message.success(
      isEnglish ? 'Class deleted successfully!' : 'Đã xóa lớp học thành công!'
    );
  };

  const handleClearAllData = () => {
    setCourses([]);
    setClasses([]);
    localStorage.removeItem('lak_erp_courses');
    localStorage.removeItem('lak_erp_classes');
    message.success(
      isEnglish
        ? 'All course and class data cleared!'
        : 'Đã xóa sạch toàn bộ dữ liệu khóa học và lớp học!'
    );
  };

  return {
    currentUser,
    canManage,
    activeTab,
    setActiveTab,
    courses: filteredCourses,
    allCourses: courses,
    classes: filteredClasses,
    allClasses: classes,
    teachers: MOCK_TEACHERS,
    allStudents: students,
    courseSearch,
    setCourseSearch,
    classSearch,
    setClassSearch,
    selectedCourseFilter,
    setSelectedCourseFilter,
    selectedTeacherFilter,
    setSelectedTeacherFilter,
    isCourseModalOpen,
    setIsCourseModalOpen,
    viewingCourse,
    setViewingCourse,
    editingCourse,
    setEditingCourse,
    isClassModalOpen,
    setIsClassModalOpen,
    rosterClass,
    setRosterClass,
    editingClass,
    setEditingClass,
    handleCreateCourse,
    handleUpdateCourse,
    handleCreateClass,
    handleUpdateClass,
    handleRequestTeachClass,
    handleApproveTeacherRequest,
    handleRejectTeacherRequest,
    handleRequestEnrollClass,
    handleApproveStudentRequest,
    handleRejectStudentRequest,
    handleDeleteCourse,
    handleDeleteClass,
    handleClearAllData,
  };
};
