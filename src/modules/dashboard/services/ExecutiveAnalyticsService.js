import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import {
  INITIAL_STATS,
  MOCK_COURSES,
  MOCK_ACADEMIC_STAFF,
  MOCK_ATTENDANCES,
  MOCK_PAYROLLS,
} from '../../../shared/data/mockData';

/**
 * Sub-Feature Class 2 (Dashboard): Executive, Academic & Accounting Analytics
 * Dedicated to roles: `director`, `academic`, `accountant`
 */
export class ExecutiveAnalyticsService extends BaseModuleService {
  static getExecutiveSummary() {
    const totalTuitionExpected =
      INITIAL_STATS.monthlyTuitionCollected + INITIAL_STATS.monthlyTuitionPending;
    const tuitionCollectionRate = Number(
      ((INITIAL_STATS.monthlyTuitionCollected / totalTuitionExpected) * 100).toFixed(1)
    );

    const netOperatingBalance =
      INITIAL_STATS.monthlyTuitionCollected -
      (INITIAL_STATS.monthlyPayrollTotal + INITIAL_STATS.monthlyStaffPayrollTotal);

    return {
      ...INITIAL_STATS,
      tuitionCollectionRate,
      netOperatingBalance,
      courses: MOCK_COURSES,
      academicStaff: MOCK_ACADEMIC_STAFF,
      recentAttendances: MOCK_ATTENDANCES,
      teacherPayrolls: MOCK_PAYROLLS,
    };
  }
}

