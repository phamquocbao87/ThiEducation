import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TUITION_STATUS } from '../models/tuition.model';

/**
 * Sub-Feature Class 2 (Tuition Module): Tuition Payment Verification & Confirmation
 * Backed 100% by Cloud Firestore (`tuitions` and `users` collections in `lakeducationdb`).
 * Used by Accountant (Kế toán), Academic (Giáo vụ), and Director.
 */
export class TuitionPaymentService extends BaseModuleService {
  static COLLECTION_NAME = 'tuitions';

  /**
   * Sinh mã biên lai thu tiền chuẩn ERP: BL-YYYYMMDD-XXXX
   */
  static generateReceiptCode() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BL-${yyyy}${mm}${dd}-${rand}`;
  }

  /**
   * Xác nhận thanh toán học phí, ghi vĩnh viễn vào Firestore và đồng bộ trạng thái học viên
   */
  static async confirmPayment(billId, paymentDetails = {}) {
    if (!billId) throw new Error('Missing billId for confirmation');

    const receiptCode = paymentDetails.receiptCode?.trim() || this.generateReceiptCode();
    const nowIso = new Date().toISOString();

    const updatePayload = {
      tuitionStatus: TUITION_STATUS.PAID,
      paidAt: nowIso,
      paymentMethod: paymentDetails.paymentMethod || 'BANK_TRANSFER',
      receiptCode,
      notes: paymentDetails.notes || 'Đã đối soát và xác nhận thanh toán học phí thành công.',
      updatedAt: nowIso,
    };

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const billDocRef = doc(db, this.COLLECTION_NAME, billId);
        await setDoc(billDocRef, updatePayload, { merge: true });

        // Đồng bộ trạng thái vào hồ sơ học viên trong collection `users`
        const studentId = paymentDetails.studentId || paymentDetails.studentCode;
        if (studentId) {
          try {
            const userDocRef = doc(db, 'users', studentId);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              await setDoc(
                userDocRef,
                {
                  tuitionStatus: 'Đã đóng đủ',
                  updatedAt: nowIso,
                },
                { merge: true }
              );
            }
          } catch (syncErr) {
            console.warn('[TuitionPaymentService] Không thể đồng bộ user tuitionStatus:', syncErr.message);
          }
        }
      } catch (err) {
        console.error('[TuitionPaymentService] Lỗi xác nhận thanh toán Firestore:', err.message);
        throw err;
      }
    }

    return {
      id: billId,
      ...updatePayload,
    };
  }
}
