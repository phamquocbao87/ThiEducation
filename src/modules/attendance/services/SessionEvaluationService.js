import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { MaterialService } from '../../materials/services/MaterialService';

/**
 * Sub-Feature Class 3 (Attendance Module): Session Attendance & 4-Skill English Evaluation
 * Backed 100% by Cloud Firestore (`session_evaluations` collection in `lakeducationdb`).
 */
export class SessionEvaluationService extends BaseModuleService {
  static COLLECTION_NAME = 'session_evaluations';

  /**
   * Đọc danh sách điểm danh và đánh giá từ Cloud Firestore
   */
  static async getAllEvaluations() {
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((a) => !a.isDeleted);
          // Sắp xếp ngày mới nhất lên đầu
          return list.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        }
      } catch (err) {
        console.warn('[SessionEvaluationService] Lỗi đọc Firestore evaluations:', err.message);
      }
    }
    return [];
  }

  /**
   * Lưu bản ghi điểm danh và đánh giá vào Cloud Firestore
   */
  static async saveEvaluation(evaluationData) {
    if (IS_FIREBASE_ENABLED && db && evaluationData?.id) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, evaluationData.id);
        const cleanPayload = {
          ...evaluationData,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, cleanPayload, { merge: true });
        return cleanPayload;
      } catch (err) {
        console.error('[SessionEvaluationService] Lỗi lưu evaluation vào Firestore:', err.message);
        throw err;
      }
    }
    return evaluationData;
  }

  static getScopedAttendances(attendances, currentUser) {
    return this.scopeByRole(attendances, currentUser, {
      teacherIdField: 'teacherId',
      teacherNameField: 'teacherName',
      classIdField: 'classId',
    });
  }

  static async createSessionEvaluation(attendances, selectedClass, studentRoster, formValues, currentUser) {
    const presentCount = (studentRoster || []).filter((s) => s.present).length;
    const absentCount = (studentRoster || []).length - presentCount;
    const dateStr = formValues.date || new Date().toISOString().split('T')[0];
    const generatedId = `AT-${Date.now().toString().slice(-6)}`;

    const newRecord = {
      id: generatedId,
      date: dateStr,
      classId: selectedClass.id,
      className: selectedClass.name,
      teacherId: currentUser.id || currentUser.code,
      teacherName: currentUser.name,
      totalStudents: Array.isArray(selectedClass.studentIds) ? selectedClass.studentIds.length : (selectedClass.totalStudents || studentRoster.length),
      presentCount,
      absentCount,
      pronunciationScore: formValues.pronunciationScore || 5,
      spellingScore: formValues.spellingScore || 5,
      seriousnessScore: formValues.seriousnessScore || 5,
      listeningScore: formValues.listeningScore || 5,
      teacherFeedback:
        formValues.teacherFeedback ||
        'Students actively participated in the online lesson and completed speaking exercises.',
      recordingUrl: formValues.recordingUrl || selectedClass.recordingUrl || '',
      roster: (studentRoster || []).map((s) => ({
        id: s.id,
        name: s.name,
        present: Boolean(s.present),
      })),
      createdAt: new Date().toISOString(),
    };

    await this.saveEvaluation(newRecord);

    // Đồng bộ tức thì sang learning_materials cho toàn bộ học viên của lớp (Class Scoped) nếu có video recording
    if (newRecord.recordingUrl && newRecord.recordingUrl.trim()) {
      try {
        await MaterialService.saveMaterial({
          id: `rec_${selectedClass.id}_${Date.now()}`,
          title: `Video Buổi Học: ${selectedClass.name} (${dateStr})`,
          type: 'VIDEO',
          url: newRecord.recordingUrl.trim(),
          downloadUrl: newRecord.recordingUrl.trim(),
          courseId: selectedClass.courseId || 'ALL',
          courseName: selectedClass.courseName || selectedClass.name,
          classId: selectedClass.id,
          className: selectedClass.name,
          sharedClassIds: [selectedClass.id],
          shareScope: 'CUSTOM',
          targetType: 'class',
          targetId: selectedClass.id,
          visibility: 'ALL',
          isSessionRecording: true,
          sessionDate: dateStr,
          description: newRecord.teacherFeedback || `Video recording for ${selectedClass.name}`,
        }, currentUser);
      } catch (matErr) {
        console.warn('[SessionEvaluationService] Không thể đồng bộ sang learning_materials:', matErr.message);
      }
    }

    return [newRecord, ...attendances];
  }
}
