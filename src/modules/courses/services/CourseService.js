import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Service managing Course Catalog operations
 * Extends BaseModuleService
 */
export class CourseService extends BaseModuleService {
  static createCourse(newCourse, existingCourses = []) {
    const nextCount = existingCourses.length + 1;
    const generatedId = newCourse.id?.trim() || `KH-${String(nextCount).padStart(3, '0')}`;
    const durationMonths = Number(newCourse.durationMonths) || 3;
    const durationWeeks = Number(newCourse.durationWeeks) || durationMonths * 4;
    const sessionsPerWeek = Number(newCourse.sessionsPerWeek) || 2;
    const feePerMonth = Number(newCourse.feePerMonth) || 2500000;

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
      createdAt: new Date().toISOString(),
    };

    return [courseRecord, ...existingCourses];
  }

  static updateCourse(courseId, updatedData, existingCourses = []) {
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
        updatedAt: new Date().toISOString(),
      };
    });
  }

  static filterCourses(courses = [], keyword = '') {
    if (!keyword) return courses;
    return this.searchByFields(courses, keyword, ['id', 'name', 'level', 'description', 'objectives']);
  }
}
