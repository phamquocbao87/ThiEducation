import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { PAYROLL_STATUS } from '../models/contracts.model';

/**
 * Sub-Feature Class 3 (Contracts Module): Academic Staff (Giáo Vụ) Payroll & KPI Verification
 * Backed 100% by real Cloud Firestore `payrolls` (recipientType === 'STAFF') — ZERO dummy data.
 * Used by Director and Accountant to audit and disburse Academic Staff salaries.
 */
export class StaffPayrollService extends BaseModuleService {
  static COLLECTION_NAME = 'payrolls';

  /**
   * Đọc danh sách phiếu lương giáo vụ thực tế từ Cloud Firestore
   */
  static async getAllStaffPayrolls() {
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
                p.recipientType === 'STAFF'
            );
          return list;
        }
      } catch (err) {
        console.warn('[StaffPayrollService] Lỗi đọc Firestore staff payrolls:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật phiếu lương giáo vụ vào Cloud Firestore
   */
  static async saveStaffPayroll(payrollData) {
    if (IS_FIREBASE_ENABLED && db && payrollData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, payrollData.id);
        const payload = {
          ...payrollData,
          recipientType: 'STAFF',
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, payload, { merge: true });
      } catch (err) {
        console.error('[StaffPayrollService] Lỗi lưu staff payroll vào Firestore:', err.message);
        throw err;
      }
    }
    return payrollData;
  }

  /**
   * Duyệt phiếu lương giáo vụ
   */
  static async approveStaffPayroll(staffList, staffId) {
    const updated = staffList.map((st) =>
      st.id === staffId
        ? { ...st, payrollStatus: PAYROLL_STATUS.APPROVED, approvedAt: new Date().toISOString() }
        : st
    );
    const target = updated.find((st) => st.id === staffId);
    if (target) {
      await this.saveStaffPayroll(target);
    }
    return updated;
  }

  /**
   * Xác nhận chi lương giáo vụ
   */
  static async disburseStaffPayroll(staffList, staffId) {
    const updated = staffList.map((st) =>
      st.id === staffId
        ? { ...st, payrollStatus: PAYROLL_STATUS.PAID, disbursedAt: new Date().toISOString() }
        : st
    );
    const target = updated.find((st) => st.id === staffId);
    if (target) {
      await this.saveStaffPayroll(target);
    }
    return updated;
  }

  /**
   * Tính tổng ngân sách chi lương giáo vụ thực tế (chỉ tính từ các bản ghi thật)
   */
  static calculateStaffPayrollTotal(staffList = []) {
    return (staffList || []).reduce((acc, curr) => acc + (Number(curr.totalSalary) || 0), 0);
  }
}

export default StaffPayrollService;
