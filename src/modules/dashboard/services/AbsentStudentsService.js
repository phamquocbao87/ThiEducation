import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../core/services/firebase';
import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';
import { AbsenceRequestService } from '../../attendance/services/AbsenceRequestService';

export class AbsentStudentsService {
  /**
   * Quét và tổng hợp danh sách học viên vắng học sắp xếp theo ngày
   * phục vụ công tác kiểm toán của Giám đốc & Giáo vụ
   */
  static async getAbsentStudentsData(classes = [], users = []) {
    const userMap = new Map();
    (users || []).forEach((u) => {
      if (u.id) userMap.set(u.id, u);
      if (u.code) userMap.set(u.code, u);
    });

    const classMap = new Map();
    (classes || []).forEach((c) => {
      if (c.id) classMap.set(c.id, c);
    });

    const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(Date.now());
    const todayDmy = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(Date.now());

    const absentRecords = [];
    const seenKeys = new Set();

    try {
      // 1. Quét từ `session_evaluations`
      const snap = await getDocs(collection(db, 'session_evaluations'));
      snap.forEach((d) => {
        const data = d.data();
        const classId = data.classId;
        const cls = classMap.get(classId) || {};
        const presence = data.presence || {};
        const notes = data.quickNotes || {};
        const dateStr = data.date || '';

        Object.entries(presence).forEach(([studentId, status]) => {
          if (status === 'OFFLINE') {
            const student = userMap.get(studentId) || {};
            const key = `${dateStr}_${classId}_${studentId}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              absentRecords.push({
                id: key,
                studentId,
                studentName: student.name || student.fullName || studentId,
                englishName: student.englishName || student.name || studentId,
                studentCode: student.code || student.id || studentId,
                parentPhone: student.parentPhone || student.phone || '',
                classId,
                className: cls.name || data.className || classId,
                teacherId: cls.teacherId || data.teacherId || '',
                teacherName: cls.teacherName || data.teacherName || 'Teacher',
                date: dateStr,
                dateIso: data.dateIso || (dateStr.includes('/') ? dateStr.split('/').reverse().join('-') : dateStr),
                isToday: dateStr === todayIso || dateStr === todayDmy || dateStr.includes(todayIso),
                note: notes[studentId]?.text || (notes[studentId]?.tags ? notes[studentId].tags.join(', ') : ''),
                source: 'SESSION_EVALUATION',
              });
            }
          }
        });
      });

      // 2. Quét từ `classroom_live` (buổi học hôm nay đang diễn ra)
      try {
        const liveSnap = await getDocs(collection(db, 'classroom_live'));
        liveSnap.forEach((d) => {
          const classId = d.id;
          const liveData = d.data();
          const cls = classMap.get(classId) || {};
          const presence = liveData.presence || {};
          const notes = liveData.quickNotes || {};

          Object.entries(presence).forEach(([studentId, status]) => {
            if (status === 'OFFLINE') {
              const student = userMap.get(studentId) || {};
              const key = `${todayIso}_${classId}_${studentId}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                absentRecords.push({
                  id: key,
                  studentId,
                  studentName: student.name || student.fullName || studentId,
                  englishName: student.englishName || student.name || studentId,
                  studentCode: student.code || student.id || studentId,
                  parentPhone: student.parentPhone || student.phone || '',
                  classId,
                  className: cls.name || liveData.className || classId,
                  teacherId: cls.teacherId || liveData.teacherId || '',
                  teacherName: cls.teacherName || liveData.teacherName || 'Teacher',
                  date: todayDmy,
                  dateIso: todayIso,
                  isToday: true,
                  note: notes[studentId]?.text || (notes[studentId]?.tags ? notes[studentId].tags.join(', ') : ''),
                  source: 'LIVE_ROOM',
                });
              }
            }
          });
        });
      } catch (err) {
        console.warn('[AbsentStudentsService] Lỗi quét live rooms:', err);
      }

      // 3. Quét từ `absence_requests` (đơn xin phép nghỉ học)
      try {
        const requests = await AbsenceRequestService.getAllRequests();
        (requests || []).forEach((req) => {
          if (req.userRole === 'student') {
            const student = userMap.get(req.userId) || {};
            const cls = classMap.get(req.classId) || {};
            const key = `${req.date}_${req.classId}_${req.userId}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              absentRecords.push({
                id: key,
                studentId: req.userId,
                studentName: req.userName || student.name || req.userId,
                englishName: student.englishName || req.userName || req.userId,
                studentCode: student.code || req.userId,
                parentPhone: student.parentPhone || student.phone || '',
                classId: req.classId,
                className: req.className || cls.name || req.classId,
                teacherId: cls.teacherId || '',
                teacherName: cls.teacherName || 'Teacher',
                date: req.date,
                dateIso: req.date ? req.date.split('/').reverse().join('-') : todayIso,
                isToday: req.date === todayDmy || req.date === todayIso,
                note: req.reason || 'Có đơn xin phép vắng mặt',
                hasOfficialRequest: true,
                requestStatus: req.status,
                source: 'ABSENCE_REQUEST',
              });
            }
          }
        });
      } catch (err) {
        console.warn('[AbsentStudentsService] Lỗi quét absence_requests:', err);
      }
    } catch (err) {
      console.warn('[AbsentStudentsService] Lỗi tổng hợp absent students:', err);
    }

    // Sắp xếp theo ngày giảm dần (Mới nhất / Hôm nay lên trước)
    absentRecords.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return (b.dateIso || '').localeCompare(a.dateIso || '');
    });

    const todayAbsentCount = absentRecords.filter((r) => r.isToday).length;

    return {
      absentRecords,
      todayAbsentCount,
    };
  }
}
