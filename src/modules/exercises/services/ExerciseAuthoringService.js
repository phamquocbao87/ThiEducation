import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';

export class ExerciseAuthoringService extends BaseModuleService {
  static COLLECTION_NAME = 'exercises';

  static async getAll() {
    if (!IS_FIREBASE_ENABLED || !db) return [];
    const snap = await getDocs(collection(db, this.COLLECTION_NAME));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => !item.isDeleted);
  }

  static async save(data, actor) {
    const id = data.id || `ex_${Date.now()}`;
    const payload = {
      ...data, id, questions: data.questions || [], isDeleted: false,
      createdBy: data.createdBy || actor?.id || '', createdByName: data.createdByName || actor?.name || '',
      createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (IS_FIREBASE_ENABLED && db) await setDoc(doc(db, this.COLLECTION_NAME, id), payload, { merge: true });
    return payload;
  }

  static async softDelete(id) {
    if (IS_FIREBASE_ENABLED && db && id) {
      await setDoc(doc(db, this.COLLECTION_NAME, id), { isDeleted: true, deletedAt: new Date().toISOString() }, { merge: true });
    }
  }

  static scope(records, user) {
    if (['admin', 'director', 'academic'].includes(user?.role)) return records;
    if (user?.role === 'teacher') return records.filter((item) => item.createdBy === user.id || item.teacherId === user.id);
    return records.filter((item) => item.status === 'PUBLISHED');
  }
}
