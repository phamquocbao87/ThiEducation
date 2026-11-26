import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { matchesMultiFields } from '../../../shared/utils/searchUtils';
import {
  parseScheduleToStructured,
  findTeacherScheduleConflicts,
  findStudentScheduleConflicts,
  buildUpdatedScheduleHistory,
  sortClassesSmartly,
} from '../../../shared/utils/scheduleUtils';

/**
 * Service managing Class Management operations
 * Each class belongs to 1 Course, has 0 or 1 Assigned Native Teacher, and multiple Students.
 * Supports Effective-Dated Schedule History, Multi-Timezone, Self-Registration & Academic Approval.
 * Backed 100% by Cloud Firestore (`classes` collection in `lakeducationdb`).
 */
export class ClassService extends BaseModuleService {
  static COLLECTION_NAME = 'classes';
  static _allKnownClassIds = new Set();

  /**
   * Đọc toàn bộ danh sách Lớp học trực tiếp từ Cloud Firestore
   */
  static async getAllClasses() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const allDocs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          allDocs.forEach((c) => {
            if (c.id) this._allKnownClassIds.add(String(c.id).toUpperCase());
          });
          const list = allDocs.filter((c) => !c.isDeleted && c.status !== 'Deleted');
          return sortClassesSmartly(list);
        }
      } catch (err) {
        console.warn('[ClassService] Lỗi đọc Firestore classes:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật Lớp học vào Cloud Firestore
   * Đảm bảo luôn ghi rõ isDeleted: false & status: 'Active' khi tạo/cập nhật lớp đang hoạt động
   * để tránh lỗi { merge: true } giữ lại cờ isDeleted: true của bản ghi cũ đã xóa mềm.
   * Đồng thời đồng bộ hai chiều (Bidirectional Sync) với hồ sơ học viên users.enrolledClassIds.
   */
  static async saveClass(classData) {
    if (IS_FIREBASE_ENABLED && db && classData?.id) {
      try {
        let resolvedCourseLevel = classData.courseLevel || classData.level || '';
        let resolvedCourseName = classData.courseName || '';
        if (classData.courseId) {
          const parentSnap = await getDoc(doc(db, 'courses', classData.courseId));
          if (parentSnap.exists()) {
            const pData = parentSnap.data();
            if (pData?.level) resolvedCourseLevel = pData.level;
            if (pData?.name) resolvedCourseName = pData.name;
          }
        }

        const docRef = doc(db, this.COLLECTION_NAME, classData.id);
        const sanitizedPayload = {
          ...classData,
          ...(resolvedCourseLevel ? { courseLevel: resolvedCourseLevel } : {}),
          ...(resolvedCourseName ? { courseName: resolvedCourseName } : {}),
          isDeleted: Boolean(classData.isDeleted),
          status: classData.isDeleted ? 'Deleted' : classData.status || 'Active',
          deletedAt: classData.isDeleted ? classData.deletedAt || new Date().toISOString() : null,
        };
        await setDoc(docRef, sanitizedPayload, { merge: true });

        // [BIDIRECTIONAL CONSISTENCY]: Đồng bộ hai chiều với hồ sơ học viên trong Firestore users (+ cấp độ khóa học chuẩn)
        if (Array.isArray(classData.studentIds)) {
          const targetStudentIds = classData.studentIds.map(String);
          const usersCol = collection(db, 'users');
          const usersSnap = await getDocs(usersCol);
          if (!usersSnap.empty) {
            for (const uDoc of usersSnap.docs) {
              const uData = uDoc.data();
              if (uData.role !== 'student' || uData.isDeleted || uData.status === 'deleted') continue;
              const uId = String(uDoc.id);
              const uCode = String(uData.code || uData.id);
              const isAssigned = targetStudentIds.includes(uId) || targetStudentIds.includes(uCode);

              const currentEnrolled = Array.isArray(uData.enrolledClassIds) ? [...uData.enrolledClassIds] : [];
              const enrolledSet = new Set(currentEnrolled);
              let changed = false;

              if (isAssigned && !enrolledSet.has(classData.id)) {
                enrolledSet.add(classData.id);
                changed = true;
              } else if (!isAssigned && enrolledSet.has(classData.id)) {
                enrolledSet.delete(classData.id);
                changed = true;
              }

              const needsLevelSync = Boolean(
                isAssigned && resolvedCourseLevel && uData.level !== resolvedCourseLevel
              );

              if (changed || needsLevelSync) {
                const nextEnrolled = Array.from(enrolledSet);
                await setDoc(doc(db, 'users', uDoc.id), {
                  enrolledClassIds: nextEnrolled,
                  classesEnrolled: nextEnrolled,
                  ...(needsLevelSync ? { level: resolvedCourseLevel } : {}),
                  updatedAt: new Date().toISOString(),
                }, { merge: true });
              }
            }
          }
        }
      } catch (err) {
        console.error('[ClassService] Lỗi lưu lớp học vào Firestore:', err.message);
        throw err;
      }
    }
    return classData;
  }

  /**
   * Cập nhật riêng thông tin Link phòng học trực tuyến (Giáo viên phụ trách hoặc Giáo vụ)
   */
  static async updateClassMeetingLinks(classId, { zoomHostLink, zoomStudentLink, meetingId, passcode }) {
    if (!classId) throw new Error('Missing classId');
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, classId);
        const payload = {
          zoomHostLink: zoomHostLink || '',
          zoomStudentLink: zoomStudentLink || '',
          meetingId: meetingId || '',
          passcode: passcode || '',
          meetingUpdatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, payload, { merge: true });
        return { id: classId, ...payload };
      } catch (err) {
        console.error('[ClassService] Lỗi cập nhật link phòng học:', err.message);
        throw err;
      }
    }
    return { id: classId, zoomHostLink, zoomStudentLink, meetingId, passcode };
  }

  /**
   * Sinh mã Lớp học mới không bao giờ trùng lặp với các lớp hiện có hoặc lớp đã xóa mềm
   */
  static generateNextClassId(existingClasses = []) {
    const existingIds = new Set([
      ...Array.from(this._allKnownClassIds),
      ...(existingClasses || []).map((c) => String(c.id || '').toUpperCase()),
    ]);
    let maxNum = existingIds.size;
    for (const idStr of existingIds) {
      const match = String(idStr || '').match(/^LH(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    let candidateNum = maxNum + 1;
    let candidateId = `LH${String(candidateNum).padStart(3, '0')}`;
    while (existingIds.has(candidateId.toUpperCase())) {
      candidateNum += 1;
      candidateId = `LH${String(candidateNum).padStart(3, '0')}`;
    }
    this._allKnownClassIds.add(candidateId.toUpperCase());
    return candidateId;
  }

  /**
   * Xóa mềm (Soft delete) Lớp học trên Cloud Firestore
   * Đồng thời tự động gỡ lớp đã xóa khỏi enrolledClassIds của tất cả học viên (Bidirectional Cleanup).
   */
  static async deleteClass(classId) {
    if (IS_FIREBASE_ENABLED && db && classId) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, classId);
        await setDoc(
          docRef,
          {
            isDeleted: true,
            status: 'Deleted',
            deletedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // [BIDIRECTIONAL CONSISTENCY]: Gỡ lớp đã xóa khỏi enrolledClassIds của tất cả học viên
        const usersCol = collection(db, 'users');
        const usersSnap = await getDocs(usersCol);
        if (!usersSnap.empty) {
          for (const uDoc of usersSnap.docs) {
            const uData = uDoc.data();
            const currentEnrolled = Array.isArray(uData.enrolledClassIds) ? [...uData.enrolledClassIds] : [];
            if (currentEnrolled.includes(classId)) {
              const nextEnrolled = currentEnrolled.filter((c) => c !== classId);
              await setDoc(doc(db, 'users', uDoc.id), {
                enrolledClassIds: nextEnrolled,
                classesEnrolled: nextEnrolled,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            }
          }
        }
      } catch (err) {
        console.error('[ClassService] Lỗi xóa lớp học trên Firestore:', err.message);
        throw err;
      }
    }
  }

  static createClass(newClass, existingClasses = [], teachers = [], courses = [], actorUser = null) {
    const generatedId = this.generateNextClassId(existingClasses);

    const creatorId = actorUser?.id || actorUser?.code || newClass.createdBy || 'ADM001';
    const creatorName = actorUser?.name || newClass.createdByName || 'Phạm Quốc Bảo';

    const hasTeacher = Boolean(newClass.teacherId && String(newClass.teacherId).trim());
    const selectedTeacher = hasTeacher
      ? teachers.find((t) => t.id === newClass.teacherId || t.name === newClass.teacherId)
      : null;
    const selectedCourse = courses.find((c) => c.id === newClass.courseId);

    const studentLink =
      newClass.zoomStudentLink?.trim() ||
      newClass.meetingLink?.trim() ||
      'https://zoom.us/j/888999111';
    const hostLink =
      newClass.zoomHostLink?.trim() ||
      studentLink.replace('/j/', '/s/') + '?role=host';

    const startDate = newClass.startDate || '04/02/2026';
    const scheduleStr = newClass.schedule?.trim() || 'Thứ 2, Thứ 4 (18:00 - 19:30)';
    const scheduleData =
      newClass.scheduleData || parseScheduleToStructured(scheduleStr);

    const initialHistory = [
      {
        version: 1,
        effectiveFrom: startDate,
        effectiveTo: null,
        schedule: scheduleStr,
        scheduleData,
        status: 'ACTIVE',
        note: 'Lịch học khởi tạo từ ngày khai giảng lớp',
        updatedAt: new Date().toISOString(),
      },
    ];

    const classRecord = {
      id: newClass.id?.trim() || generatedId,
      courseId: newClass.courseId,
      courseName: selectedCourse?.name || 'Khóa Học Chuẩn',
      name:
        newClass.name?.trim() ||
        `Class ${newClass.id || generatedId} - Wonders ELA (Zoom)`,
      teacherId: selectedTeacher?.id || (hasTeacher ? newClass.teacherId : ''),
      teacherName: selectedTeacher?.name || (hasTeacher ? newClass.teacherId : 'Chưa phân công'),
      teacherAvatar: selectedTeacher?.avatar || '',
      subject: newClass.subject?.trim() || selectedCourse?.name || 'English ELA',
      platform: 'Zoom Meeting',
      startDate,
      totalSessions: Number(newClass.totalSessions) || 12,
      meetingLink: studentLink,
      zoomStudentLink: studentLink,
      zoomHostLink: hostLink,
      zaloGroupLink:
        newClass.zaloGroupLink?.trim() || 'https://zalo.me/g/lakeducation_class',
      meetingId: newClass.meetingId?.trim() || '888 999 111',
      passcode: newClass.passcode?.trim() || '123456',
      ...(newClass.zoomConfig ? { zoomConfig: newClass.zoomConfig } : {}),
      totalStudents: Array.isArray(newClass.studentIds)
        ? newClass.studentIds.length
        : Number(newClass.totalStudents) || 0,
      studentIds: Array.isArray(newClass.studentIds) ? newClass.studentIds : [],
      schedule: scheduleStr,
      scheduleData,
      scheduleHistory: initialHistory,
      holidays: Array.isArray(scheduleData?.holidays) ? scheduleData.holidays : [],
      pendingTeacherRequests: [],
      pendingStudentRequests: [],
      recordingUrl:
        newClass.recordingUrl?.trim() ||
        'https://drive.google.com/drive/folders/zoom-recordings',
      checkInStatus: 'UPCOMING',
      operationStatus:
        newClass.operationStatus ||
        (hasTeacher ? 'Đang học ổn định' : 'Mới khai giảng'),
      status: 'Active',
      isDeleted: false,
      deletedAt: null,
      createdBy: creatorId,
      createdByName: creatorName,
      updatedBy: creatorId,
      updatedByName: creatorName,
      createdAt: newClass.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return [classRecord, ...existingClasses];
  }

  static updateClass(
    classId,
    updatedData,
    existingClasses = [],
    teachers = [],
    courses = [],
    actorUser = null
  ) {
    const updaterId = actorUser?.id || actorUser?.code || updatedData.updatedBy || 'ADM001';
    const updaterName = actorUser?.name || updatedData.updatedByName || 'Phạm Quốc Bảo';
    const hasTeacherParam = updatedData.teacherId !== undefined;
    const isClearingTeacher =
      hasTeacherParam && (!updatedData.teacherId || String(updatedData.teacherId).trim() === '');

    const selectedTeacher =
      hasTeacherParam && !isClearingTeacher
        ? teachers.find(
            (t) => t.id === updatedData.teacherId || t.name === updatedData.teacherId
          )
        : null;
    const selectedCourse = courses.find((c) => c.id === updatedData.courseId);

    return existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      const studentIds = Array.isArray(updatedData.studentIds)
        ? updatedData.studentIds
        : cls.studentIds || [];

      const nextTeacherId = isClearingTeacher
        ? ''
        : selectedTeacher?.id || updatedData.teacherId || cls.teacherId || '';
      const nextTeacherName = isClearingTeacher
        ? 'Chưa phân công'
        : selectedTeacher?.name || cls.teacherName || 'Chưa phân công';

      const nextStudentLink =
        updatedData.zoomStudentLink?.trim() ||
        updatedData.meetingLink?.trim() ||
        cls.zoomStudentLink ||
        cls.meetingLink ||
        'https://zoom.us/j/888999111';

      const nextHostLink =
        updatedData.zoomHostLink?.trim() ||
        cls.zoomHostLink ||
        nextStudentLink.replace('/j/', '/s/') + '?role=host';

      const nextSchedule = updatedData.schedule?.trim() || cls.schedule;
      const nextScheduleData =
        updatedData.scheduleData ||
        cls.scheduleData ||
        parseScheduleToStructured(nextSchedule);

      const nextScheduleHistory = buildUpdatedScheduleHistory({
        existingClass: cls,
        newScheduleStr: nextSchedule,
        newScheduleData: nextScheduleData,
        effectiveFromDate: updatedData.scheduleEffectiveFrom,
        changeReason: updatedData.scheduleChangeReason,
      });

      return {
        ...cls,
        courseId: updatedData.courseId || cls.courseId,
        courseName: selectedCourse?.name || cls.courseName,
        name: updatedData.name?.trim() || cls.name,
        teacherId: nextTeacherId,
        teacherName: nextTeacherName,
        teacherAvatar: isClearingTeacher ? '' : selectedTeacher?.avatar ?? cls.teacherAvatar,
        subject: updatedData.subject?.trim() || selectedCourse?.name || cls.subject,
        startDate: updatedData.startDate || cls.startDate || '04/02/2026',
        meetingLink: nextStudentLink,
        zoomStudentLink: nextStudentLink,
        zoomHostLink: nextHostLink,
        zaloGroupLink:
          updatedData.zaloGroupLink?.trim() ??
          cls.zaloGroupLink ??
          'https://zalo.me/g/lakeducation_class',
        meetingId: updatedData.meetingId?.trim() ?? cls.meetingId,
        passcode: updatedData.passcode?.trim() ?? cls.passcode,
        ...(updatedData.zoomConfig || cls.zoomConfig
          ? { zoomConfig: updatedData.zoomConfig || cls.zoomConfig }
          : {}),
        studentIds,
        totalStudents: Array.isArray(updatedData.studentIds)
          ? updatedData.studentIds.length
          : Number(updatedData.totalStudents ?? cls.totalStudents) || 0,
        schedule: nextSchedule,
        scheduleData: nextScheduleData,
        scheduleHistory: nextScheduleHistory,
        holidays: Array.isArray(nextScheduleData?.holidays)
          ? nextScheduleData.holidays
          : cls.holidays || [],
        operationStatus:
          updatedData.operationStatus || cls.operationStatus || 'Đang học ổn định',
        updatedBy: updaterId,
        updatedByName: updaterName,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Giáo viên tự đăng ký nhận dạy lớp đang trống GV (Chờ Giáo vụ duyệt)
   */
  static requestTeachClass(classId, teacherUser, existingClasses = []) {
    const targetCls = existingClasses.find((c) => c.id === classId);
    if (!targetCls || !teacherUser) return { updatedClasses: existingClasses, conflicts: [] };

    const conflicts = findTeacherScheduleConflicts(
      teacherUser.id,
      targetCls.scheduleData || targetCls.schedule,
      existingClasses,
      classId
    );

    const updatedClasses = existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      const currentReqs = Array.isArray(cls.pendingTeacherRequests)
        ? cls.pendingTeacherRequests
        : [];
      if (currentReqs.some((r) => r.teacherId === teacherUser.id)) return cls;

      const newReq = {
        teacherId: teacherUser.id,
        teacherName: teacherUser.name,
        nationality: teacherUser.nationality || 'Native Teacher',
        requestedAt: new Date().toISOString(),
        hasConflict: conflicts.length > 0,
        conflictClasses: conflicts.map((c) => `${c.id} (${c.schedule})`),
      };
      return {
        ...cls,
        pendingTeacherRequests: [...currentReqs, newReq],
      };
    });

    return { updatedClasses, conflicts };
  }

  /**
   * Giáo vụ duyệt Giáo viên đăng ký dạy lớp
   */
  static approveTeacherRequest(classId, teacherId, existingClasses = [], teachers = []) {
    const teacherObj = teachers.find((t) => t.id === teacherId);
    return existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      const reqObj = (cls.pendingTeacherRequests || []).find(
        (r) => r.teacherId === teacherId
      );
      return {
        ...cls,
        teacherId,
        teacherName: teacherObj?.name || reqObj?.teacherName || teacherId,
        teacherAvatar: teacherObj?.avatar || '',
        pendingTeacherRequests: (cls.pendingTeacherRequests || []).filter(
          (r) => r.teacherId !== teacherId
        ),
        operationStatus:
          cls.operationStatus === 'Mới khai giảng'
            ? 'Đang học ổn định'
            : cls.operationStatus,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Giáo vụ từ chối yêu cầu đăng ký dạy của Giáo viên
   */
  static rejectTeacherRequest(classId, teacherId, existingClasses = []) {
    return existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        pendingTeacherRequests: (cls.pendingTeacherRequests || []).filter(
          (r) => r.teacherId !== teacherId
        ),
      };
    });
  }

  /**
   * Học viên tự đăng ký tham gia lớp học (Chờ Giáo vụ duyệt)
   */
  static requestEnrollClass(classId, studentUser, existingClasses = []) {
    const targetCls = existingClasses.find((c) => c.id === classId);
    if (!targetCls || !studentUser) return { updatedClasses: existingClasses, conflicts: [] };

    const conflicts = findStudentScheduleConflicts(
      studentUser.id,
      targetCls.scheduleData || targetCls.schedule,
      existingClasses,
      classId
    );

    const updatedClasses = existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      const currentReqs = Array.isArray(cls.pendingStudentRequests)
        ? cls.pendingStudentRequests
        : [];
      if (
        currentReqs.some((r) => r.studentId === studentUser.id) ||
        (cls.studentIds || []).includes(studentUser.id)
      ) {
        return cls;
      }

      const newReq = {
        studentId: studentUser.id,
        studentName: studentUser.name,
        englishName: studentUser.englishName || '',
        requestedAt: new Date().toISOString(),
        hasConflict: conflicts.length > 0,
        conflictClasses: conflicts.map((c) => `${c.id} (${c.schedule})`),
      };
      return {
        ...cls,
        pendingStudentRequests: [...currentReqs, newReq],
      };
    });

    return { updatedClasses, conflicts };
  }

  /**
   * Giáo vụ duyệt Học viên vào lớp chính thức
   */
  static approveStudentRequest(classId, studentId, existingClasses = []) {
    return existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      const currentStudents = Array.isArray(cls.studentIds) ? cls.studentIds : [];
      const nextStudents = currentStudents.includes(studentId)
        ? currentStudents
        : [...currentStudents, studentId];

      return {
        ...cls,
        studentIds: nextStudents,
        totalStudents: nextStudents.length,
        pendingStudentRequests: (cls.pendingStudentRequests || []).filter(
          (r) => r.studentId !== studentId
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Giáo vụ từ chối yêu cầu đăng ký lớp của Học viên
   */
  static rejectStudentRequest(classId, studentId, existingClasses = []) {
    return existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        pendingStudentRequests: (cls.pendingStudentRequests || []).filter(
          (r) => r.studentId !== studentId
        ),
      };
    });
  }

  /**
   * Giáo vụ / Admin gỡ Học viên khỏi danh sách lớp học (Đồng bộ 2 chiều: classes & users)
   */
  static async removeStudentFromClass(classId, studentId, existingClasses = []) {
    if (!classId || !studentId) return { updatedClasses: existingClasses, removed: false };
    const targetSid = String(studentId).trim();

    // 1. Cập nhật State danh sách lớp
    const updatedClasses = existingClasses.map((cls) => {
      if (cls.id !== classId) return cls;
      const currentStudents = Array.isArray(cls.studentIds) ? cls.studentIds : [];
      const nextStudents = currentStudents.filter((id) => String(id).trim() !== targetSid);

      return {
        ...cls,
        studentIds: nextStudents,
        totalStudents: nextStudents.length,
        updatedAt: new Date().toISOString(),
      };
    });

    // 2. Đồng bộ Firestore classes & users
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const clsRef = doc(db, 'classes', classId);
        const clsSnap = await getDoc(clsRef);
        if (clsSnap.exists()) {
          const currentList = Array.isArray(clsSnap.data().studentIds) ? clsSnap.data().studentIds : [];
          const nextList = currentList.filter((id) => String(id).trim() !== targetSid);
          await setDoc(clsRef, {
            studentIds: nextList,
            totalStudents: nextList.length,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }

        const userRef = doc(db, 'users', targetSid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const enrolled = Array.isArray(uData.enrolledClassIds) ? uData.enrolledClassIds : [];
          const nextEnrolled = enrolled.filter((cid) => cid !== classId);
          await setDoc(userRef, {
            enrolledClassIds: nextEnrolled,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn('[ClassService.removeStudentFromClass] Firestore sync error:', err.message);
      }
    }

    return { updatedClasses, removed: true };
  }

  static getStudentsInClass(classOrId, allStudents = []) {
    if (!classOrId) return [];
    if (typeof classOrId === 'object') {
      const cls = classOrId;
      if (Array.isArray(cls.studentIds) && cls.studentIds.length > 0) {
        return allStudents.filter(
          (s) => cls.studentIds.includes(s.id) || s.classId === cls.id
        );
      }
      return allStudents.filter(
        (s) => s.classId === cls.id || s.className?.includes(cls.id)
      );
    }
    return allStudents.filter(
      (s) => s.classId === classOrId || s.className?.includes(classOrId)
    );
  }

  static filterClasses(
    classes = [],
    { keyword = '', courseId = 'ALL', teacherId = 'ALL' }
  ) {
    const filtered = classes.filter((cls) => {
      const matchCourse = courseId === 'ALL' || cls.courseId === courseId;
      const matchTeacher =
        teacherId === 'ALL' ||
        (teacherId === 'UNASSIGNED'
          ? !cls.teacherId || cls.teacherName === 'Chưa phân công'
          : cls.teacherId === teacherId);

      if (!matchCourse || !matchTeacher) return false;
      if (!keyword) return true;

      return matchesMultiFields(cls, keyword, [
        'id',
        'name',
        'teacherName',
        'schedule',
        'courseName',
        'subject',
        'room',
      ]);
    });
    return sortClassesSmartly(filtered);
  }
}
