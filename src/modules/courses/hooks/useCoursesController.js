import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { CourseService } from '../services/CourseService';
import { ClassService } from '../services/ClassService';
import { db } from '../../../core/services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NotificationService, NOTIFICATION_TYPES } from '../../../core/services/NotificationService';

export const useCoursesController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const { isEnglish } = useLanguage();

  const [activeTab, setActiveTab] = useState('classes');
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
    const updated = CourseService.createCourse(courseData, courses, currentUser);
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
    const updated = CourseService.updateCourse(courseId, updatedValues, courses, currentUser);
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
      courses,
      currentUser
    );
    const newClass = updated[0];
    setClasses(updated);

    // Đảm bảo bộ lọc hiện tại không che khuất lớp học vừa tạo
    if (selectedCourseFilter !== 'ALL' && selectedCourseFilter !== newClass.courseId) {
      setSelectedCourseFilter('ALL');
    }
    if (selectedTeacherFilter !== 'ALL') {
      setSelectedTeacherFilter('ALL');
    }
    if (classSearch) {
      setClassSearch('');
    }
    setActiveTab('classes');

    setCourses((prev) => {
      const nextCourses = prev.map((c) => {
        if (c.id === classData.courseId) {
          const realCount = updated.filter((cls) => cls.courseId === c.id).length;
          return { ...c, activeClasses: realCount };
        }
        return c;
      });
      return nextCourses;
    });

    setIsClassModalOpen(false);
    setEditingClass(null);

    try {
      await ClassService.saveClass(newClass);
      const parentCourse = courses.find((c) => c.id === classData.courseId);
      if (parentCourse) {
        const realCount = updated.filter((cls) => cls.courseId === parentCourse.id).length;
        await CourseService.saveCourse({ ...parentCourse, activeClasses: realCount });
      }
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
      courses,
      currentUser
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
   * [FIX ROOT-CAUSE]: Tuyệt đối KHÔNG fallback sang teachers[0], chỉ lấy đúng giáo viên đang đăng nhập
   */
  const handleRequestTeachClass = async (classId, customTeacher = null) => {
    const currentTeacherId = currentUser?.id || currentUser?.code;
    const matchedTeacher = teachers.find((t) => t.id === currentTeacherId);
    const teacherActor =
      customTeacher ||
      (currentUser?.role === 'teacher' && currentTeacherId
        ? {
            ...(matchedTeacher || {}),
            id: currentTeacherId,
            name: currentUser.name || matchedTeacher?.name || currentTeacherId,
            englishName: currentUser.englishName || matchedTeacher?.englishName || currentUser.name,
            email: currentUser.email || matchedTeacher?.email || '',
          }
        : matchedTeacher);

    if (!teacherActor || !teacherActor.id) {
      message.error(
        isEnglish
          ? 'Only logged-in Native Teachers can apply to teach classes!'
          : 'Chỉ tài khoản Giáo viên đang đăng nhập mới có thể đăng ký nhận dạy lớp!'
      );
      return;
    }

    const targetCls = classes.find((c) => c.id === classId);
    if (!targetCls) return;

    // Chặn trùng lặp nếu Giáo viên đã đăng ký và đang chờ phê duyệt
    if ((targetCls.pendingTeacherRequests || []).some((r) => r.teacherId === teacherActor.id)) {
      message.warning(
        isEnglish
          ? 'You have already applied for this class. Waiting for Academic approval!'
          : 'Bạn đã gửi yêu cầu nhận dạy lớp này rồi và đang chờ Giáo vụ phê duyệt!'
      );
      return;
    }

    const { updatedClasses, conflicts } = ClassService.requestTeachClass(
      classId,
      teacherActor,
      classes
    );

    if (conflicts.length > 0) {
      message.error(
        isEnglish
          ? `Cannot apply to teach: Schedule conflict with class ${conflicts.map((c) => c.id).join(', ')}!`
          : `Không thể đăng ký: Trùng thời khóa biểu với lớp ${conflicts.map((c) => c.id).join(', ')} bạn đang dạy!`
      );
      return;
    }

    await syncUpdatedClasses(updatedClasses, classId);

    // Gửi thông báo đến Giáo vụ và Admin
    try {
      const createdNoti = await NotificationService.sendNotification({
        recipientRole: 'academic',
        type: NOTIFICATION_TYPES.TEACHER_APPLY_REQUEST,
        title: isEnglish
          ? `Teacher applied for ${classId}`
          : `Giáo viên đăng ký dạy lớp ${classId}`,
        message: isEnglish
          ? `Teacher ${teacherActor.name} (${teacherActor.id}) requested to teach class ${targetCls?.name || classId}. Pending your review.`
          : `Giáo viên ${teacherActor.name} (${teacherActor.id}) vừa nộp đơn đăng ký nhận dạy lớp ${targetCls?.name || classId}. Vui lòng xem xét phê duyệt.`,
        actionUrl: `/courses-classes?tab=classes&classId=${classId}&action=roster`,
        metadata: {
          classId,
          className: targetCls?.name,
          teacherId: teacherActor.id,
          teacherName: teacherActor.name,
          teacherEmail: teacherActor.email || '',
        },
        createdBy: teacherActor.id,
        createdByName: teacherActor.name,
        createdByRole: 'teacher',
      });
      window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: createdNoti }));
    } catch (err) {
      console.warn('Lỗi gửi notification teacher request:', err);
    }

    message.success(
      isEnglish
        ? 'Teaching request submitted! Waiting for Academic approval.'
        : 'Đã gửi yêu cầu đăng ký dạy lớp! Vui lòng chờ Giáo vụ phê duyệt.'
    );
  };

  /**
   * 2. Giáo vụ phê duyệt yêu cầu nhận lớp của Giáo viên
   */
  const handleApproveTeacherRequest = async (classId, teacherId) => {
    const targetCls = classes.find((c) => c.id === classId);
    const updated = ClassService.approveTeacherRequest(classId, teacherId, classes, teachers);
    await syncUpdatedClasses(updated, classId);

    // Gửi thông báo đến Giáo viên được duyệt
    try {
      const createdNoti = await NotificationService.sendNotification({
        recipientId: teacherId,
        recipientRole: 'teacher',
        type: NOTIFICATION_TYPES.REGISTRATION_APPROVED,
        title: isEnglish
          ? `Approved to teach ${classId}`
          : `Phê duyệt nhận dạy lớp ${classId}`,
        message: isEnglish
          ? `Your application to teach class ${targetCls?.name || classId} has been approved. Welcome!`
          : `Chúc mừng bạn! Yêu cầu nhận dạy lớp ${targetCls?.name || classId} của bạn đã được Giáo vụ phê duyệt.`,
        actionUrl: `/courses-classes?tab=classes&classId=${classId}`,
        metadata: { classId, teacherId },
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdByRole: currentUser?.role || 'academic',
      });
      window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: createdNoti }));
    } catch (err) {
      console.warn('Lỗi gửi notification approve teacher:', err);
    }

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
    const targetCls = classes.find((c) => c.id === classId);
    const updated = ClassService.rejectTeacherRequest(classId, teacherId, classes);
    await syncUpdatedClasses(updated, classId);

    // Gửi thông báo đến Giáo viên
    try {
      const createdNoti = await NotificationService.sendNotification({
        recipientId: teacherId,
        recipientRole: 'teacher',
        type: NOTIFICATION_TYPES.REGISTRATION_REJECTED,
        title: isEnglish
          ? `Application declined for ${classId}`
          : `Từ chối yêu cầu nhận lớp ${classId}`,
        message: isEnglish
          ? `Your application for class ${targetCls?.name || classId} could not be approved at this time.`
          : `Rất tiếc, yêu cầu nhận dạy lớp ${targetCls?.name || classId} của bạn chưa thể phê duyệt vào thời điểm này.`,
        actionUrl: `/courses-classes?tab=classes`,
        metadata: { classId, teacherId },
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdByRole: currentUser?.role || 'academic',
      });
      window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: createdNoti }));
    } catch (err) {
      console.warn('Lỗi gửi notification reject teacher:', err);
    }

    message.info(
      isEnglish
        ? 'Declined teacher request for this class.'
        : 'Đã từ chối yêu cầu nhận dạy của giáo viên.'
    );
  };

  /**
   * 4. Học viên tự đăng ký ghi danh vào Lớp học (Chờ Giáo vụ duyệt)
   * [FIX ROOT-CAUSE]: Tuyệt đối KHÔNG fallback sang students[0] (tránh gửi nhầm thông báo tên học viên khác),
   * lấy đúng currentUser đang đăng nhập và khóa cứng không cho gửi trùng khi đang chờ phê duyệt.
   */
  const handleRequestEnrollClass = async (classId, customStudent = null) => {
    const currentStudentId = currentUser?.id || currentUser?.code;
    const matchedStudent = students.find((s) => s.id === currentStudentId);
    const studentActor =
      customStudent ||
      (currentUser?.role === 'student' && currentStudentId
        ? {
            ...(matchedStudent || {}),
            id: currentStudentId,
            name: currentUser.name || matchedStudent?.name || currentStudentId,
            englishName: currentUser.englishName || matchedStudent?.englishName || currentUser.name,
            email: currentUser.email || matchedStudent?.email || '',
          }
        : matchedStudent);

    if (!studentActor || !studentActor.id) {
      message.error(
        isEnglish
          ? 'Only logged-in Students can register for classes!'
          : 'Chỉ tài khoản Học viên đang đăng nhập mới có thể đăng ký tham gia lớp học!'
      );
      return;
    }

    const targetCls = classes.find((c) => c.id === classId);
    if (!targetCls) return;

    // 1. Nếu học viên đã tham gia lớp học chính thức
    if ((targetCls.studentIds || []).includes(studentActor.id)) {
      message.info(
        isEnglish
          ? 'You are already officially enrolled in this class!'
          : 'Bạn đã là học viên chính thức của lớp học này!'
      );
      return;
    }

    // 2. Nếu học viên đã đăng ký và đang trong thời gian chờ phê duyệt -> Chặn đứng không cho đăng ký lại
    if ((targetCls.pendingStudentRequests || []).some((r) => r.studentId === studentActor.id)) {
      message.warning(
        isEnglish
          ? 'You have already registered for this class. Waiting for Academic approval!'
          : 'Bạn đã đăng ký lớp học này rồi và đang chờ Giáo vụ phê duyệt!'
      );
      return;
    }

    const foundCourse = courses.find((c) => c.id === targetCls?.courseId);
    const maxClassSize = Number(foundCourse?.maxClassSize) || 18;
    const currentCount = (targetCls?.studentIds || []).length;

    if (currentCount >= maxClassSize) {
      message.error(
        isEnglish
          ? `Cannot enroll: Class has reached maximum capacity (${currentCount}/${maxClassSize})!`
          : `Không thể đăng ký: Lớp đã đủ sĩ số tối đa (${currentCount}/${maxClassSize})!`
      );
      return;
    }

    const { updatedClasses, conflicts } = ClassService.requestEnrollClass(
      classId,
      studentActor,
      classes
    );

    if (conflicts.length > 0) {
      message.error(
        isEnglish
          ? `Cannot enroll: Schedule conflict with class ${conflicts.map((c) => c.id).join(', ')}!`
          : `Không thể đăng ký: Trùng thời khóa biểu với lớp ${conflicts.map((c) => c.id).join(', ')} bạn đang học!`
      );
      return;
    }

    await syncUpdatedClasses(updatedClasses, classId);

    // Gửi thông báo đến Giáo vụ, Giám đốc và Admin với đúng định danh Học viên đăng ký
    const studentLabel = studentActor.email
      ? `${studentActor.name} (${studentActor.id} - ${studentActor.email})`
      : `${studentActor.name} (${studentActor.id})`;

    try {
      const createdNoti = await NotificationService.sendNotification({
        recipientRole: 'academic',
        type: NOTIFICATION_TYPES.STUDENT_ENROLL_REQUEST,
        title: isEnglish
          ? `Student applied for ${classId}`
          : `Học viên đăng ký lớp ${classId}`,
        message: isEnglish
          ? `Student ${studentLabel} requested to join ${targetCls?.name || classId}. Pending your approval.`
          : `Học viên ${studentLabel} vừa đăng ký tham gia lớp ${targetCls?.name || classId}. Vui lòng xem xét phê duyệt.`,
        actionUrl: `/courses-classes?tab=classes&classId=${classId}&action=roster`,
        metadata: {
          classId,
          className: targetCls?.name,
          courseId: targetCls?.courseId,
          studentId: studentActor.id,
          studentName: studentActor.name,
          studentEmail: studentActor.email || '',
        },
        createdBy: studentActor.id,
        createdByName: studentActor.name,
        createdByRole: 'student',
      });
      window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: createdNoti }));
    } catch (err) {
      console.warn('Lỗi gửi notification student request:', err);
    }

    message.success(
      isEnglish
        ? 'Class enrollment request submitted! Waiting for Academic approval.'
        : 'Đã gửi yêu cầu đăng ký lớp học! Vui lòng chờ Giáo vụ phê duyệt.'
    );
  };

  /**
   * 5. Giáo vụ duyệt Học viên vào lớp (Đồng bộ Firestore classes + users)
   */
  const handleApproveStudentRequest = async (classId, studentId) => {
    const targetCls = classes.find((c) => c.id === classId);
    const updated = ClassService.approveStudentRequest(classId, studentId, classes);
    await syncUpdatedClasses(updated, classId);

    // Đồng bộ vào Firestore users (cập nhật cả classesEnrolled và enrolledClassIds)
    try {
      const userDocRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentEnrolled = Array.isArray(userData.classesEnrolled)
          ? userData.classesEnrolled
          : [];
        const currentEnrolledIds = Array.isArray(userData.enrolledClassIds)
          ? userData.enrolledClassIds
          : [];
        const nextEnrolled = currentEnrolled.includes(classId)
          ? currentEnrolled
          : [...currentEnrolled, classId];
        const nextEnrolledIds = currentEnrolledIds.includes(classId)
          ? currentEnrolledIds
          : [...currentEnrolledIds, classId];

        await updateDoc(userDocRef, {
          classesEnrolled: nextEnrolled,
          enrolledClassIds: nextEnrolledIds,
          classId: userData.classId || classId,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.id,
          updatedByName: currentUser?.name,
        });
      }
    } catch (err) {
      console.warn('Lỗi cập nhật users Firestore sau khi duyệt học viên:', err);
    }

    // Gửi thông báo đến Học viên
    try {
      const createdNoti = await NotificationService.sendNotification({
        recipientId: studentId,
        recipientRole: 'student',
        type: NOTIFICATION_TYPES.REGISTRATION_APPROVED,
        title: isEnglish
          ? `Enrollment approved for ${classId}!`
          : `Phê duyệt tham gia lớp ${classId}!`,
        message: isEnglish
          ? `Congratulations! Your request to join class ${targetCls?.name || classId} has been approved.`
          : `Chúc mừng bạn! Yêu cầu tham gia lớp học ${targetCls?.name || classId} của bạn đã được Giáo vụ phê duyệt thành công.`,
        actionUrl: `/courses-classes?tab=classes&classId=${classId}`,
        metadata: { classId, studentId },
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdByRole: currentUser?.role || 'academic',
      });
      window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: createdNoti }));
    } catch (err) {
      console.warn('Lỗi gửi notification approve student:', err);
    }

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
    const targetCls = classes.find((c) => c.id === classId);
    const updated = ClassService.rejectStudentRequest(classId, studentId, classes);
    await syncUpdatedClasses(updated, classId);

    // Gửi thông báo đến Học viên
    try {
      const createdNoti = await NotificationService.sendNotification({
        recipientId: studentId,
        recipientRole: 'student',
        type: NOTIFICATION_TYPES.REGISTRATION_REJECTED,
        title: isEnglish
          ? `Enrollment declined for ${classId}`
          : `Từ chối yêu cầu vào lớp ${classId}`,
        message: isEnglish
          ? `Your enrollment request for class ${targetCls?.name || classId} could not be approved at this time.`
          : `Yêu cầu tham gia lớp ${targetCls?.name || classId} của bạn chưa thể phê duyệt vào thời điểm này.`,
        actionUrl: `/courses-classes?tab=classes`,
        metadata: { classId, studentId },
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdByRole: currentUser?.role || 'academic',
      });
      window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: createdNoti }));
    } catch (err) {
      console.warn('Lỗi gửi notification reject student:', err);
    }

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
