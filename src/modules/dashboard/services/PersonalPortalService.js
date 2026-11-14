import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { DashboardDataService } from './DashboardDataService';

/**
 * Sub-Feature Class 3 (Dashboard): Scoped Teacher Workspace & Student Personal Portal
 * Dedicated to roles: `teacher` and `student`
 * Backed 100% by Cloud Firestore Real Data — ZERO mock data.
 */
export class PersonalPortalService extends BaseModuleService {
  static getTeacherWorkspaceData(currentUser, { classes = [], users = [], payrolls = [] } = {}) {
    return DashboardDataService.getTeacherWorkspaceRealData({
      currentUser,
      classes,
      users,
      payrolls,
    });
  }

  static getStudentPortalData(currentUser, { classes = [], tuitions = [] } = {}) {
    return DashboardDataService.getStudentPortalRealData({
      currentUser,
      classes,
      tuitions,
    });
  }
}
