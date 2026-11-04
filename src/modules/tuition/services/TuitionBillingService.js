import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { INITIAL_STATS } from '../../../shared/data/mockData';

/**
 * Sub-Feature Class 1 (Tuition Module): Tuition Billing, Data Scoping & Financial Summary
 */
export class TuitionBillingService extends BaseModuleService {
  static getScopedTuitionRecords(students, currentUser, { searchText = '', statusFilter = 'ALL' }) {
    // Nếu là học viên (`student`): Chỉ thấy đúng học phí của chính mình
    const roleScoped =
      currentUser.role === 'student'
        ? students.filter((s) => s.id === currentUser.id)
        : students;

    const searched = this.searchByKeyword(roleScoped, searchText, ['id', 'name', 'className', 'parentName']);
    return this.filterByField(searched, statusFilter, 'tuitionStatus');
  }

  static getTuitionSummary() {
    return {
      collected: INITIAL_STATS.monthlyTuitionCollected,
      pending: INITIAL_STATS.monthlyTuitionPending,
      completionRate: 87.4,
    };
  }
}

