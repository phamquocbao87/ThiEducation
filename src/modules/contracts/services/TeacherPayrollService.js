import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { PAYROLL_STATUS } from '../models/contracts.model';

/**
 * Sub-Feature Class 2 (Contracts Module): Foreign Teacher Payroll Calculation, Approval & Disbursement
 */
export class TeacherPayrollService extends BaseModuleService {
  static getScopedPayrolls(payrolls, currentUser) {
    return this.scopeByRole(payrolls, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
    });
  }

  static calculateSessionSalary({ totalSessions, ratePerSession, bonus = 0, deduction = 0 }) {
    return Number(totalSessions) * Number(ratePerSession) + Number(bonus) - Number(deduction);
  }

  static approvePayroll(payrolls, payrollId) {
    return payrolls.map((item) =>
      item.id === payrollId ? { ...item, status: PAYROLL_STATUS.APPROVED } : item
    );
  }

  static disbursePayroll(payrolls, payrollId) {
    return payrolls.map((item) =>
      item.id === payrollId ? { ...item, status: PAYROLL_STATUS.PAID } : item
    );
  }

  static calculateTotalBudget(payrolls) {
    return payrolls.reduce((acc, curr) => acc + (curr.totalSalary || 0), 0);
  }
}

