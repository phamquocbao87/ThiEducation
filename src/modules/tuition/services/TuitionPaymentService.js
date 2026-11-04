import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { TUITION_STATUS } from '../models/tuition.model';

/**
 * Sub-Feature Class 2 (Tuition Module): Tuition Payment Verification & Confirmation
 * Used by Accountant (Kế toán), Academic (Giáo vụ), and Director.
 */
export class TuitionPaymentService extends BaseModuleService {
  static confirmPayment(students, studentId) {
    return students.map((s) =>
      s.id === studentId ? { ...s, tuitionStatus: TUITION_STATUS.PAID } : s
    );
  }
}

