import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 1 (Contracts Module): Teacher Contract Management
 * Handles scoping contracts per role, creating new teacher contracts, and validating quotas.
 */
export class TeacherContractService extends BaseModuleService {
  static getScopedContracts(contracts, currentUser) {
    return this.scopeByRole(contracts, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
    });
  }

  static createContract(contracts, formValues) {
    const newId = this.generateId('HD-2026', contracts);
    const newContract = {
      id: newId,
      teacherId: `GV00${contracts.length + 5}`,
      teacherName: formValues.teacherName,
      type: formValues.type,
      ratePerSession: Number(formValues.ratePerSession || 450000),
      minSessionsPerMonth: Number(formValues.minSessionsPerMonth || 40),
      startDate: formValues.startDate || '2026-09-01',
      endDate: formValues.endDate || '2027-08-31',
      status: 'Active',
    };
    return [newContract, ...contracts];
  }
}

