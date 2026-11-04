import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { PAYROLL_STATUS } from '../models/contracts.model';

/**
 * Sub-Feature Class 3 (Contracts Module): Academic Staff (Giáo Vụ) Payroll & KPI Verification
 * Used by Director and Accountant to audit and disburse Academic Staff salaries.
 */
export class StaffPayrollService extends BaseModuleService {
  static approveStaffPayroll(staffList, staffId) {
    return staffList.map((st) =>
      st.id === staffId ? { ...st, payrollStatus: PAYROLL_STATUS.APPROVED } : st
    );
  }

  static disburseStaffPayroll(staffList, staffId) {
    return staffList.map((st) =>
      st.id === staffId ? { ...st, payrollStatus: PAYROLL_STATUS.PAID } : st
    );
  }

  static calculateStaffPayrollTotal(staffList) {
    return staffList.reduce((acc, curr) => acc + (curr.totalSalary || 0), 0);
  }
}

