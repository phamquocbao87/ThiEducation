import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { TUITION_STATUS } from '../models/tuition.model';

/**
 * Sub-Feature Class 1 (Tuition Module): Tuition Billing, Data Scoping & Financial Summary
 * Backed 100% by Cloud Firestore (`tuitions` collection in `lakeducationdb`).
 */
export class TuitionBillingService extends BaseModuleService {
  static COLLECTION_NAME = 'tuitions';

  /**
   * Đọc toàn bộ danh sách hóa đơn học phí từ Cloud Firestore
   */
  static async getAllTuitionBills() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((b) => !b.isDeleted);
          return list;
        }
      } catch (err) {
        console.warn('[TuitionBillingService] Lỗi đọc Firestore tuitions:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật hóa đơn học phí vào Cloud Firestore
   */
  static async saveTuitionBill(billData) {
    if (IS_FIREBASE_ENABLED && db && billData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, billData.id);
        const cleanPayload = {
          ...billData,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, cleanPayload, { merge: true });
        return cleanPayload;
      } catch (err) {
        console.error('[TuitionBillingService] Lỗi lưu hóa đơn học phí vào Firestore:', err.message);
        throw err;
      }
    }
    return billData;
  }

  /**
   * Xóa mềm hóa đơn học phí trên Cloud Firestore
   */
  static async deleteTuitionBill(billId) {
    if (IS_FIREBASE_ENABLED && db && billId) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, billId);
        await setDoc(docRef, { isDeleted: true, updatedAt: new Date().toISOString() }, { merge: true });
        return true;
      } catch (err) {
        console.error('[TuitionBillingService] Lỗi xóa hóa đơn học phí:', err.message);
        throw err;
      }
    }
    return false;
  }

  /**
   * Lọc và phân quyền hiển thị hóa đơn học phí theo vai trò người dùng (Data Scoping)
   */
  static getScopedTuitionRecords(bills, currentUser, { searchText = '', statusFilter = 'ALL' }) {
    if (!Array.isArray(bills)) return [];

    // Nếu là học viên (`student`): Chỉ thấy đúng học phí của chính mình (theo studentId hoặc code)
    const roleScoped =
      currentUser?.role === 'student'
        ? bills.filter((b) => b.studentId === currentUser.id || b.studentCode === currentUser.code || b.id === currentUser.id)
        : bills;

    const searched = this.searchByKeyword(roleScoped, searchText, [
      'id',
      'studentCode',
      'name',
      'englishName',
      'className',
      'parentName',
      'phone',
    ]);

    if (!statusFilter || statusFilter === 'ALL') {
      return searched;
    }
    return searched.filter((b) => b.tuitionStatus === statusFilter);
  }

  /**
   * Tính toán động 4 chỉ số thống kê tài chính trực tiếp từ danh sách hóa đơn thực tế
   */
  static calculateTuitionSummary(bills = []) {
    if (!Array.isArray(bills) || bills.length === 0) {
      return {
        collected: 0,
        pending: 0,
        totalExpected: 0,
        completionRate: 0,
      };
    }

    const collected = bills
      .filter((b) => b.tuitionStatus === TUITION_STATUS.PAID)
      .reduce((acc, b) => acc + (Number(b.amountDue) || 0), 0);

    const pending = bills
      .filter((b) => b.tuitionStatus !== TUITION_STATUS.PAID)
      .reduce((acc, b) => acc + (Number(b.amountDue) || 0), 0);

    const totalExpected = collected + pending;
    const completionRate = totalExpected > 0 ? Number(((collected / totalExpected) * 100).toFixed(1)) : 0;

    return {
      collected,
      pending,
      totalExpected,
      completionRate,
    };
  }
}
