import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../core/services/firebase';
import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';
import { AbsenceRequestService } from '../../attendance/services/AbsenceRequestService';
import { findClassSession } from '../../../shared/utils/classSessionUtils';

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

    const now = Date.now();
    const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
    const todayDmy = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(now);

    const absentRecords = [];
    const seenKeys = new Set();

    try {
      // 1. Quét từ `session_evaluations` (các ca học trong quá khứ hoặc hôm nay đã có sổ chấm điểm danh)
      const snap = await getDocs(collection(db, 'session_evaluations'));
      snap.forEach((d) => {
        const data = d.data();
        const classId = data.classId;
        const cls = classMap.get(classId) || {};
        const presence = data.presence || {};
        const notes = data.quickNotes || {};
        const dateStr = data.date || '';

        Object.entries(presence).forEach(([studentId, status]) => {
          if (status === 'absent' || status === 'OFFLINE') {
            const student = userMap.get(studentId) || {};
            // Chỉ lấy tài khoản là học viên
            if (student.role && student.role !== 'student') return;

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
                hasOfficialRequest: false,
                source: 'SESSION_EVALUATION',
              });
            }
          }
        });
      });

      // 2. Quét từ `classroom_live` (buổi học hôm nay đang diễn ra)
      // 🚨 KỶ LUẬT CHỐNG BÁO OAN: Ca học phải ĐANG DIỄN RA HOẶC ĐÃ BẮT ĐẦU hôm nay mới tính vắng!
      try {
        const liveSnap = await getDocs(collection(db, 'classroom_live'));
        liveSnap.forEach((d) => {
          const classId = d.id;
          const liveData = d.data();
          const cls = classMap.get(classId) || {};
          const presence = liveData.presence || {};
          const notes = liveData.quickNotes || {};

          // Kiểm tra xem ca học hôm nay đã bắt đầu chưa
          const session = findClassSession(cls, now);
          const isSessionStarted = Boolean(liveData.isStarted || (session && now >= session.start));

          // Nếu ca học chưa tới giờ bắt đầu -> Bỏ qua, tuyệt đối không tính học sinh vắng!
          if (!isSessionStarted) {
            return;
          }

          Object.entries(presence).forEach(([studentId, status]) => {
            if (status === 'OFFLINE') {
              const student = userMap.get(studentId) || {};
              if (student.role && student.role !== 'student') return;

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
                  hasOfficialRequest: false,
                  source: 'LIVE_ROOM',
                });
              }
            }
          });
        });
      } catch (err) {
        console.warn('[AbsentStudentsService] Lỗi quét live rooms:', err);
      }

      // 3. Quét từ `absence_requests` (đơn xin phép nghỉ học chính thức)
      try {
        const requests = await AbsenceRequestService.getAllRequests();
        (requests || []).forEach((req) => {
          const student = userMap.get(req.userId) || {};
          // Kiểm tra role: Phải là student và không được là staff
          const isStudent = req.userRole === 'student' || (!req.userRole && student.role === 'student');
          const validDate = req.absenceDate || req.date;

          // Loại bỏ record không phải học viên hoặc ngày bị undefined
          if (isStudent && validDate && validDate !== 'undefined') {
            const cls = classMap.get(req.classId) || {};
            const key = `${validDate}_${req.classId}_${req.userId}`;

            const isApproved = req.status === 'APPROVED' || req.status === 'ACKNOWLEDGED';
            const isToday = validDate === todayDmy || validDate === todayIso;

            // Nếu đã có trong seenKeys (ví dụ từ session_evaluations hoặc live_room), cập nhật trạng thái có phép
            const existingIdx = absentRecords.findIndex((r) => r.id === key);
            if (existingIdx !== -1) {
              absentRecords[existingIdx].hasOfficialRequest = true;
              absentRecords[existingIdx].isExcused = isApproved;
              absentRecords[existingIdx].requestStatus = req.status;
              if (req.reason) {
                absentRecords[existingIdx].note = req.reason + (req.note ? ` (${req.note})` : '');
              }
            } else if (!seenKeys.has(key)) {
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
                teacherId: cls.teacherId || req.teacherId || '',
                teacherName: cls.teacherName || req.teacherName || 'Teacher',
                date: validDate,
                dateIso: validDate.includes('/') ? validDate.split('/').reverse().join('-') : validDate,
                isToday,
                note: req.reason || req.note || 'Có đơn xin phép vắng mặt',
                hasOfficialRequest: true,
                isExcused: isApproved,
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
