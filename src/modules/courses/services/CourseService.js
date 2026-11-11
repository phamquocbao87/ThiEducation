import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

/**
 * Service managing Course Catalog operations
 * Backed 100% by Cloud Firestore (`courses` collection in `lakeducationdb`)
 * Extends BaseModuleService
 */
export class CourseService extends BaseModuleService {
  static COLLECTION_NAME = 'courses';

  /**
   * Đọc toàn bộ danh sách Khóa học trực tiếp từ Cloud Firestore
   */
  static async getAllCourses() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((c) => !c.isDeleted && c.status !== 'Deleted');
          return list;
        }
      } catch (err) {
        console.warn('[CourseService] Lỗi đọc Firestore courses:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật một Khóa học vào Cloud Firestore
   */
  static async saveCourse(courseData) {
    if (IS_FIREBASE_ENABLED && db && courseData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, courseData.id);
        await setDoc(docRef, courseData, { merge: true });
      } catch (err) {
        console.error('[CourseService] Lỗi lưu khóa học vào Firestore:', err.message);
        throw err;
      }
    }
    return courseData;
  }

  /**
   * Xóa mềm (Soft delete) một Khóa học trên Cloud Firestore
   */
  static async deleteCourse(courseId) {
    if (IS_FIREBASE_ENABLED && db && courseId) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, courseId);
        await setDoc(
          docRef,
          {
            isDeleted: true,
            status: 'Deleted',
            deletedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[CourseService] Lỗi xóa khóa học trên Firestore:', err.message);
        throw err;
      }
    }
  }

  static createCourse(newCourse, existingCourses = [], actorUser = null) {
    const nextCount = existingCourses.length + 1;
    const generatedId = newCourse.id?.trim() || `KH-${String(nextCount).padStart(3, '0')}`;
    const durationMonths = Number(newCourse.durationMonths) || 3;
    const durationWeeks = Number(newCourse.durationWeeks) || durationMonths * 4;
    const sessionsPerWeek = Number(newCourse.sessionsPerWeek) || 2;
    const feePerMonth = Number(newCourse.feePerMonth) || 2500000;

    const creatorId = actorUser?.id || actorUser?.code || newCourse.createdBy || 'ADM001';
    const creatorName = actorUser?.name || newCourse.createdByName || 'Phạm Quốc Bảo';

    const courseRecord = {
      id: generatedId,
      name: newCourse.name?.trim() || 'Khóa Học Mới',
      level: newCourse.level || 'WONDERS-G1',
      targetAge: newCourse.targetAge?.trim() || '6 - 12 tuổi',
      durationMonths,
      durationWeeks,
      sessionsPerWeek,
      totalSessions: Number(newCourse.totalSessions) || durationWeeks * sessionsPerWeek,
      maxClassSize: Number(newCourse.maxClassSize) || 18,
      feePerMonth,
      totalCourseFee: feePerMonth * durationMonths,
      activeClasses: 0,
      enrolledStudents: 0,
      status: newCourse.status || 'Active',
      format: newCourse.format || '100% Native English Teacher (Zoom Cloud Meeting)',
      curriculumTextbooks:
        newCourse.curriculumTextbooks?.trim() ||
        'McGraw-Hill Wonders Literature Anthology & Reading/Writing Companion',
      prerequisites:
        newCourse.prerequisites?.trim() ||
        'Kiểm tra đánh giá năng lực đầu vào 1-1 với giáo vụ',
      objectives: newCourse.objectives?.trim() || newCourse.description?.trim() || '',
      description: newCourse.description?.trim() || newCourse.objectives?.trim() || '',
      createdBy: creatorId,
      createdByName: creatorName,
      updatedBy: creatorId,
      updatedByName: creatorName,
      createdAt: newCourse.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return [courseRecord, ...existingCourses];
  }

  static updateCourse(courseId, updatedData, existingCourses = [], actorUser = null) {
    const updaterId = actorUser?.id || actorUser?.code || updatedData.updatedBy || 'ADM001';
    const updaterName = actorUser?.name || updatedData.updatedByName || 'Phạm Quốc Bảo';

    return existingCourses.map((c) => {
      if (c.id !== courseId) return c;
      const durationMonths = Number(updatedData.durationMonths) || c.durationMonths || 3;
      const durationWeeks = Number(updatedData.durationWeeks) || durationMonths * 4;
      const sessionsPerWeek = Number(updatedData.sessionsPerWeek) || c.sessionsPerWeek || 2;
      const feePerMonth = Number(updatedData.feePerMonth) || c.feePerMonth || 2500000;

      return {
        ...c,
        name: updatedData.name?.trim() || c.name,
        level: updatedData.level || c.level,
        targetAge: updatedData.targetAge?.trim() ?? c.targetAge,
        durationMonths,
        durationWeeks,
        sessionsPerWeek,
        totalSessions: Number(updatedData.totalSessions) || durationWeeks * sessionsPerWeek,
        maxClassSize: Number(updatedData.maxClassSize) || c.maxClassSize || 18,
        feePerMonth,
        totalCourseFee: feePerMonth * durationMonths,
        status: updatedData.status || c.status || 'Active',
        format: updatedData.format?.trim() ?? c.format,
        curriculumTextbooks: updatedData.curriculumTextbooks?.trim() ?? c.curriculumTextbooks,
        prerequisites: updatedData.prerequisites?.trim() ?? c.prerequisites,
        objectives: updatedData.objectives?.trim() ?? c.objectives,
        description: updatedData.description?.trim() ?? updatedData.objectives?.trim() ?? c.description,
        updatedBy: updaterId,
        updatedByName: updaterName,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  static filterCourses(courses = [], keyword = '') {
    if (!keyword) return courses;
    return this.searchByFields(courses, keyword, ['id', 'name', 'level', 'description', 'objectives']);
  }
}
