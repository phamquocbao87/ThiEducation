import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 1 (Schedules Module): Course Catalog & Course Creation
 * Used by Academic Coordinator (Giáo vụ) & Director to create and manage courses.
 */
export class CourseCatalogService extends BaseModuleService {
  static createCourse(courses, values) {
    const newCourse = {
      id: this.generateId('KH', courses),
      name: values.name,
      level: values.level || 'Intermediate B1',
      durationWeeks: Number(values.durationWeeks || 12),
      feePerMonth: Number(values.feePerMonth || 2500000),
      activeClasses: 1,
      enrolledStudents: 0,
      status: 'Active',
    };
    return [newCourse, ...courses];
  }
}

