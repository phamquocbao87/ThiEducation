import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { currentAttendance } from '../../../shared/models/classroom.model';

export class ClassroomNoticeService extends BaseModuleService {
  static async remind(cls, user, absentIds, labels) {
    if (!user?.id || !['admin', 'director', 'academic'].includes(user?.role)) throw new Error('FORBIDDEN');
    return runTransaction(db, async (tx) => {
      const classRef = doc(db, 'classes', cls.id);
      const actorRef = doc(db, 'users', user.id);
      const [snapshot, actorSnapshot, liveSnapshot] = await Promise.all([
        tx.get(classRef), tx.get(actorRef), tx.get(doc(db, 'classroom_live', cls.id)),
      ]);
      const actual = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
      const actor = actorSnapshot.data();
      if (!actual || actor?.status !== 'active'
        || !['admin', 'director', 'academic'].includes(actor?.role)) throw new Error('FORBIDDEN');
      if (auth.currentUser && actor?.uid && actor.uid !== auth.currentUser.uid) {
        throw new Error('FORBIDDEN');
      }
      const summary = currentAttendance({ ...actual, liveAttendance: liveSnapshot.data() }, Date.now());
      if (!actual.teacherId || !summary?.absentIds?.length
        || [...summary.absentIds].sort().join() !== [...absentIds].sort().join()) throw new Error('STALE_ATTENDANCE');
      const id = `ABSENCE_REMINDER_${summary.sessionId}_${summary.absentIds.slice().sort().join('_')}`;
      const ref = doc(db, 'notifications', id);
      const previous = await tx.get(ref);
      if (previous.exists()) return 'alreadySent';
      const createdAt = new Date().toISOString();
      tx.set(ref, { id, recipientId: actual.teacherId, recipientRole: null,
        targetKeys: [`USER:${actual.teacherId}`], type: 'CLASSROOM_ABSENCE_REMINDER',
        title: labels.title, message: labels.message,
        actionUrl: `/classroom/${encodeURIComponent(actual.id)}`,
        metadata: { classId: actual.id, sessionId: summary.sessionId, absentIds: summary.absentIds },
        createdAt, createdBy: user.id, createdByName: user.name || '', createdByRole: actor.role,
        readBy: [], isRead: false,
        auditTrail: { action: 'CLASSROOM_ABSENCE_REMINDER', actorId: user.id,
          actorName: user.name || '', actorRole: actor.role, createdAt } });
      return 'noticeSent';
    });
  }
}
