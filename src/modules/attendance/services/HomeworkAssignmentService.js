import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { HOMEWORK_STATUS } from '../models/attendance.model';

/**
 * Sub-Feature Class 4 (Attendance Module): Student Homework Assignment & Submission
 * Backed 100% by Cloud Firestore (`homeworks` collection in `lakeducationdb`).
 */
export class HomeworkAssignmentService extends BaseModuleService {
  static COLLECTION_NAME = 'homeworks';

  /**
   * Đọc danh sách bài tập về nhà từ Cloud Firestore
   */
  static async getAllHomeworks() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((h) => !h.isDeleted);
          return list;
        }
      } catch (err) {
        console.warn('[HomeworkAssignmentService] Lỗi đọc Firestore homeworks:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu hoặc cập nhật bài tập vào Cloud Firestore
   */
  static async saveHomework(hwData) {
    if (IS_FIREBASE_ENABLED && db && hwData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, hwData.id);
        const cleanPayload = {
          ...hwData,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, cleanPayload, { merge: true });
        return cleanPayload;
      } catch (err) {
        console.error('[HomeworkAssignmentService] Lỗi lưu homework vào Firestore:', err.message);
        throw err;
      }
    }
    return hwData;
  }

  static getScopedHomeworks(homeworks, currentUser) {
    return this.scopeByRole(homeworks, currentUser, {
      teacherIdField: 'teacherId',
      studentIdField: 'studentId',
      classIdField: 'classId',
    });
  }

  static async submitHomework(homeworks, homeworkId) {
    const updated = homeworks.map((hw) =>
      hw.id === homeworkId
        ? {
            ...hw,
            status: HOMEWORK_STATUS.SUBMITTED,
            score: hw.score || 'Đang chấm',
            submittedAt: new Date().toISOString(),
          }
        : hw
    );
    const target = updated.find((h) => h.id === homeworkId);
    if (target) {
      await this.saveHomework(target);
    }
    return updated;
  }
}
