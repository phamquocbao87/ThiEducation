import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { CourseService } from '../services/CourseService';
import { ClassService } from '../services/ClassService';

export const useCoursesController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const { isEnglish } = useLanguage();

  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

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

  // Lấy danh sách Học viên thực tế từ Firestore
  const students = useMemo(() => {
    return (allSystemUsers || [])
      .filter(
        (u) =>
          (u.role || '').toLowerCase() === 'student' &&
          u.status !== 'deleted' &&
          !u.isDeleted
      )
      .map((u) => ({
        id: u.id || u.code,
        name: u.name,
        englishName: u.englishName || u.name,
        age: u.age || 7,
        level: u.level || 'WONDERS-G1',
        phone: u.phoneNumber || u.phone,
        email: u.email,
        parentName: u.parentName || '',
        tuitionStatus: u.tuitionStatus || 'PAID',
        amountDue: u.amountDue || 0,
        attendanceRate: 100,
      }));
  }, [allSystemUsers]);

  // Đọc dữ liệu từ Cloud Firestore khi mount & Dọn dẹp cache rác cũ
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [cList, clsList] = await Promise.all([
          CourseService.getAllCourses(),
          ClassService.getAllClasses(),
        ]);
        if (isMounted) {
          setCourses(cList);
          setClasses(clsList);
          // Dọn sạch rác dummy trong localStorage (như "Súng Bắn Ốc, Vặn Vít", "erw", "a223")
          try {
            localStorage.removeItem('lak_erp_classes');
            localStorage.removeItem('lak_erp_timetable');
            localStorage.removeItem('lak_erp_courses');
          } catch {}
        }
      } catch (err) {
        console.error('Error fetching courses/classes from Firestore:', err);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const syncUpdatedClasses = async (updatedList, targetClassId = null) => {
    setClasses(updatedList);
    if (targetClassId) {
      const refreshed = updatedList.find((c) => c.id === targetClassId);
      if (refreshed) {
        if (rosterClass?.id === targetClassId) setRosterClass(refreshed);
        try {
          await ClassService.saveClass(refreshed);
        } catch (e) {
          console.warn('Error saving updated class to Firestore:', e);
        }
      }
    }
  };

  const handleCreateCourse = async (courseData) => {
    const updated = CourseService.createCourse(courseData, courses);
    const newCourse = updated[0];
    setCourses(updated);
    setIsCourseModalOpen(false);
    try {
      await CourseService.saveCourse(newCourse);
      message.success(
        isEnglish ? 'New course created successfully!' : 'Tạo khóa học mới thành công!'
      );
    } catch (err) {
      message.error(isEnglish ? 'Failed to save course: ' + err.message : 'Lỗi lưu khóa học: ' + err.message);
    }
  };

  const handleUpdateCourse = async (courseId, updatedValues) => {
    const updated = CourseService.updateCourse(courseId, updatedValues, courses);
    setCourses(updated);

    const updatedCourseObj = updated.find((c) => c.id === courseId);
    if (updatedCourseObj) {
      if (viewingCourse?.id === courseId) {
        setViewingCourse(updatedCourseObj);
      }
      setClasses((prevClasses) => {
        const nextClasses = prevClasses.map((cls) =>
          cls.courseId === courseId ? { ...cls, courseName: updatedCourseObj.name } : cls
        );
        return nextClasses;
      });
      try {
        await CourseService.saveCourse(updatedCourseObj);
      } catch (err) {
        console.warn('Error updating course in Firestore:', err);
      }
    }

    setEditingCourse(null);
    message.success(
      isEnglish ? 'Course updated successfully!' : 'Cập nhật thông tin khóa học thành công!'
    );
  };

  const handleCreateClass = async (classData) => {
    const updated = ClassService.createClass(
      classData,
      classes,
      teachers,
      courses
    );
    const newClass = updated[0];
    setClasses(updated);

    setCourses((prev) => {
      const nextCourses = prev.map((c) =>
        c.id === classData.courseId
          ? { ...c, activeClasses: (c.activeClasses || 0) + 1 }
          : c
      );
      return nextCourses;
    });

    setIsClassModalOpen(false);
    setEditingClass(null);

    try {
      await ClassService.saveClass(newClass);
      message.success(
        isEnglish
          ? 'New class created successfully!'
          : 'Tạo lớp học mới thành công!'
      );
    } catch (err) {
      message.error(isEnglish ? 'Failed to save class: ' + err.message : 'Lỗi lưu lớp học: ' + err.message);
    }
  };

  const handleUpdateClass = async (classId, updatedValues) => {
    const updated = ClassService.updateClass(
      classId,
      updatedValues,
      classes,
      teachers,
      courses
    );
    const updatedClassObj = updated.find((c) => c.id === classId);
    setClasses(updated);
    if (updatedClassObj && rosterClass?.id === classId) {
      setRosterClass(updatedClassObj);
    }

    setEditingClass(null);
    setIsClassModalOpen(false);

    try {
      if (updatedClassObj) {
        await ClassService.saveClass(updatedClassObj);
      }
      message.success(
        isEnglish ? 'Class information updated successfully!' : 'Cập nhật thông tin lớp học thành công!'
      );
    } catch (err) {
      message.error(isEnglish ? 'Failed to update class: ' + err.message : 'Lỗi cập nhật lớp: ' + err.message);
    }
  };

  /**
   * 1. Giáo viên tự đăng ký nhận dạy lớp trống GV (Chờ Giáo vụ duyệt)
   */
  const handleRequestTeachClass = async (classId, customTeacher = null) => {
    const teacherActor =
      customTeacher ||
      teachers.find((t) => t.id === currentUser?.id) ||
      teachers[0];

    if (!teacherActor) {
      message.error(isEnglish ? 'No teacher profile found!' : 'Không tìm thấy hồ sơ giáo viên!');
      return;
    }

    const { updatedClasses, conflicts } = ClassService.requestTeachClass(
      classId,
      teacherActor,
      classes
    );
    await syncUpdatedClasses(updatedClasses, classId);

    if (conflicts.length > 0) {
      message.warning(
        isEnglish
          ? `Teaching request submitted with schedule conflict warning (${conflicts.map((c) => c.id).join(', ')})! Pending Academic approval.`
          : `Đã gửi đăng ký dạy lớp (Lưu ý: GV ${teacherActor.name} đang trùng lịch với lớp ${conflicts.map((c) => c.id).join(', ')})! Đang chờ Giáo vụ duyệt.`
      );
    } else {
      message.success(
        isEnglish
          ? 'Teaching request submitted! Waiting for Academic approval.'
          : 'Đã gửi yêu cầu đăng ký dạy lớp! Vui lòng chờ Giáo vụ phê duyệt.'
      );
    }
  };

  /**
   * 2. Giáo vụ phê duyệt yêu cầu nhận lớp của Giáo viên
   */
  const handleApproveTeacherRequest = async (classId, teacherId) => {
    const updated = ClassService.approveTeacherRequest(classId, teacherId, classes);
    await syncUpdatedClasses(updated, classId);
    message.success(
      isEnglish
        ? 'Approved teacher assignment to class!'
        : 'Đã phê duyệt Giáo viên vào giảng dạy lớp!'
    );
  };

  /**
   * 3. Giáo vụ từ chối yêu cầu nhận lớp của Giáo viên
   */
  const handleRejectTeacherRequest = async (classId, teacherId) => {
    const updated = ClassService.rejectTeacherRequest(classId, teacherId, classes);
    await syncUpdatedClasses(updated, classId);
    message.info(
      isEnglish
        ? 'Declined teacher request for this class.'
        : 'Đã từ chối yêu cầu nhận dạy của giáo viên.'
    );
  };

  /**
   * 4. Học viên tự đăng ký ghi danh vào Lớp học (Chờ Giáo vụ duyệt)
   */
  const handleRequestEnrollClass = async (classId, customStudent = null) => {
    const studentActor =
      customStudent ||
      students.find((s) => s.id === currentUser?.id) ||
      students[0];

    if (!studentActor) {
      message.error(isEnglish ? 'No student profile found!' : 'Không tìm thấy hồ sơ học viên!');
      return;
    }

    const { updatedClasses, conflicts } = ClassService.requestEnrollClass(
      classId,
      studentActor,
      classes
    );
    await syncUpdatedClasses(updatedClasses, classId);

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
  const handleApproveStudentRequest = async (classId, studentId) => {
    const updated = ClassService.approveStudentRequest(classId, studentId, classes);
    await syncUpdatedClasses(updated, classId);
    message.success(
      isEnglish
        ? 'Approved student enrollment into class roster!'
        : 'Đã phê duyệt Học viên vào danh sách lớp chính thức!'
    );
  };

  /**
   * 6. Giáo vụ từ chối yêu cầu đăng ký lớp của Học viên
   */
  const handleRejectStudentRequest = async (classId, studentId) => {
    const updated = ClassService.rejectStudentRequest(classId, studentId, classes);
    await syncUpdatedClasses(updated, classId);
    message.info(
      isEnglish
        ? 'Declined student enrollment request.'
        : 'Đã từ chối yêu cầu đăng ký lớp của học viên.'
    );
  };

  const handleDeleteCourse = async (courseId) => {
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    if (viewingCourse?.id === courseId) setViewingCourse(null);
    if (editingCourse?.id === courseId) setEditingCourse(null);
    try {
      await CourseService.deleteCourse(courseId);
      message.success(
        isEnglish ? 'Course deleted successfully!' : 'Đã xóa khóa học thành công!'
      );
    } catch (err) {
      message.error(isEnglish ? 'Failed to delete course: ' + err.message : 'Lỗi xóa khóa học: ' + err.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);
    if (rosterClass?.id === classId) setRosterClass(null);
    if (editingClass?.id === classId) setEditingClass(null);
    try {
      await ClassService.deleteClass(classId);
      message.success(
        isEnglish ? 'Class deleted successfully!' : 'Đã xóa lớp học thành công!'
      );
    } catch (err) {
      message.error(isEnglish ? 'Failed to delete class: ' + err.message : 'Lỗi xóa lớp: ' + err.message);
    }
  };

  const handleClearAllData = async () => {
    setCourses([]);
    setClasses([]);
    try {
      localStorage.removeItem('lak_erp_courses');
      localStorage.removeItem('lak_erp_classes');
      localStorage.removeItem('lak_erp_timetable');
    } catch {}
    message.success(
      isEnglish
        ? 'All course and class local cache cleared!'
        : 'Đã xóa sạch bộ nhớ tạm khóa học và lớp học!'
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
    teachers,
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
