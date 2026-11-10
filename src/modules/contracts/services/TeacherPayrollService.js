import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { PAYROLL_STATUS } from '../models/contracts.model';

/**
 * Sub-Feature Class 2 (Contracts Module): Foreign Teacher Payroll Calculation, Approval & Disbursement
 * Backed 100% by Cloud Firestore (`payrolls` collection in `lakeducationdb`).
 */
export class TeacherPayrollService extends BaseModuleService {
  static COLLECTION_NAME = 'payrolls';

  /**
   * Đọc danh sách phiếu lương giáo viên từ Cloud Firestore
   */
  static async getAllPayrolls() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter(
              (p) =>
                !p.isDeleted &&
                p.status !== 'Deleted' &&
                (!p.recipientType || p.recipientType === 'TEACHER')
            );
          return list;
        }
      } catch (err) {
        console.warn('[TeacherPayrollService] Lỗi đọc Firestore payrolls:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật phiếu lương vào Cloud Firestore
   */
  static async savePayroll(payrollData) {
    if (IS_FIREBASE_ENABLED && db && payrollData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, payrollData.id);
        await setDoc(docRef, payrollData, { merge: true });
      } catch (err) {
        console.error('[TeacherPayrollService] Lỗi lưu payroll vào Firestore:', err.message);
        throw err;
      }
    }
    return payrollData;
  }

  static getScopedPayrolls(payrolls, currentUser) {
    return this.scopeByRole(payrolls, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
    });
  }

  static calculateSessionSalary({ totalSessions, ratePerSession, bonus = 0, deduction = 0 }) {
    return Number(totalSessions) * Number(ratePerSession) + Number(bonus) - Number(deduction);
  }

  static async approvePayroll(payrolls, payrollId) {
    const updated = payrolls.map((item) =>
      item.id === payrollId
        ? { ...item, status: PAYROLL_STATUS.APPROVED, approvedAt: new Date().toISOString() }
        : item
    );
    const target = updated.find((item) => item.id === payrollId);
    if (target) {
      await this.savePayroll(target);
    }
    return updated;
  }

  static async disbursePayroll(payrolls, payrollId) {
    const updated = payrolls.map((item) =>
      item.id === payrollId
        ? { ...item, status: PAYROLL_STATUS.PAID, disbursedAt: new Date().toISOString() }
        : item
    );
    const target = updated.find((item) => item.id === payrollId);
    if (target) {
      await this.savePayroll(target);
    }
    return updated;
  }

  static calculateTotalBudget(payrolls) {
    return (payrolls || []).reduce((acc, curr) => acc + (curr.totalSalary || 0), 0);
  }
}
