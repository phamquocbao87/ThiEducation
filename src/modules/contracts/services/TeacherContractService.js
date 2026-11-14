import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

/**
 * Sub-Feature Class 1 (Contracts Module): Teacher Contract Management
 * Backed 100% by Cloud Firestore (`contracts` collection in `lakeducationdb`).
 * Handles scoping contracts per role, creating new teacher contracts, and validating quotas.
 */
export class TeacherContractService extends BaseModuleService {
  static COLLECTION_NAME = 'contracts';
  static _allKnownContractIds = new Set();

  /**
   * Đọc danh sách hợp đồng trực tiếp từ Cloud Firestore
   */
  static async getAllContracts() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const allDocs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          allDocs.forEach((c) => {
            if (c.id) this._allKnownContractIds.add(String(c.id).toUpperCase());
          });
          const list = allDocs.filter((c) => !c.isDeleted && c.status !== 'Deleted');
          return list;
        }
      } catch (err) {
        console.warn('[TeacherContractService] Lỗi đọc Firestore contracts:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật hợp đồng vào Cloud Firestore
   * Đảm bảo ghi rõ isDeleted: false & status: 'Active' để { merge: true } không giữ lại cờ xóa mềm cũ
   */
  static async saveContract(contractData) {
    if (IS_FIREBASE_ENABLED && db && contractData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, contractData.id);
        const sanitizedPayload = {
          ...contractData,
          isDeleted: Boolean(contractData.isDeleted),
          status: contractData.isDeleted ? 'Deleted' : contractData.status || 'Active',
          deletedAt: contractData.isDeleted ? contractData.deletedAt || new Date().toISOString() : null,
        };
        await setDoc(docRef, sanitizedPayload, { merge: true });
      } catch (err) {
        console.error('[TeacherContractService] Lỗi lưu hợp đồng vào Firestore:', err.message);
        throw err;
      }
    }
    return contractData;
  }

  /**
   * Sinh mã Hợp đồng mới không bao giờ trùng với các hợp đồng hiện có hoặc đã xóa mềm
   */
  static generateNextContractId(contracts = []) {
    const safeList = Array.isArray(contracts) ? contracts : [];
    const existingIds = new Set([
      ...Array.from(this._allKnownContractIds),
      ...safeList.map((c) => String(c.id || '').toUpperCase()),
    ]);
    let maxNum = existingIds.size;
    for (const idStr of existingIds) {
      const match = String(idStr || '').match(/^HD-\d{4}-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    let candidateNum = maxNum + 1;
    let candidateId = `HD-2026-${String(candidateNum).padStart(3, '0')}`;
    while (existingIds.has(candidateId.toUpperCase())) {
      candidateNum += 1;
      candidateId = `HD-2026-${String(candidateNum).padStart(3, '0')}`;
    }
    this._allKnownContractIds.add(candidateId.toUpperCase());
    return candidateId;
  }

  /**
   * Xóa mềm hợp đồng trên Cloud Firestore
   */
  static async deleteContract(contractId) {
    if (IS_FIREBASE_ENABLED && db && contractId) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, contractId);
        await setDoc(
          docRef,
          {
            isDeleted: true,
            status: 'Deleted',
            deletedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[TeacherContractService] Lỗi xóa hợp đồng trên Firestore:', err.message);
        throw err;
      }
    }
  }

  static getScopedContracts(contracts, currentUser) {
    return this.scopeByRole(contracts, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
    });
  }

  static createContract(contracts, formValues, selectedTeacher = null) {
    const newId = formValues.id?.trim() || this.generateNextContractId(contracts);
    const newContract = {
      id: newId,
      teacherId: selectedTeacher?.id || selectedTeacher?.code || formValues.teacherId || '',
      teacherName: selectedTeacher?.name || formValues.teacherName || 'Giáo Viên Bản Xứ',
      teacherEmail: selectedTeacher?.email || formValues.teacherEmail || '',
      type: formValues.type || 'Full-time Native',
      ratePerSession: Number(formValues.ratePerSession || 450000),
      minSessionsPerMonth: Number(formValues.minSessionsPerMonth || 40),
      startDate: formValues.startDate || '2026-09-01',
      endDate: formValues.endDate || '2027-08-31',
      status: formValues.status || 'Active',
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    return [newContract, ...contracts];
  }
}
