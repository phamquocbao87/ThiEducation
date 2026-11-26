import {
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import {
  matchZoomEventToLakClass,
  normalizeZoomMeetingId,
  parseHmToMinutes,
  toVietnamDateParts,
} from './zoomClassMatcher';
import { getZoomRouterConfig, LakEnvKey } from '../config/firestoreRouter';
import { syncSingleZoomMeetingRecordingToTargets } from './zoomRecordingStreamService';

function normalizePersonName(s = ''): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHostOrStaffDisplayName(zoomName = '', userEmail = ''): boolean {
  const n = normalizePersonName(zoomName);
  const em = String(userEmail || '').toLowerCase();
  if (em.includes('lakeducation.com') || em.includes('marjorie')) return true;
  if (
    n.includes('lak education') ||
    n.includes('lak s staff') ||
    n.includes('laks staff') ||
    n.includes('teacher ') ||
    n.startsWith('ms ') ||
    n.startsWith('mr ')
  ) {
    return true;
  }
  return false;
}

function resolveEnrolledStudent(zoomUserName: string, enrolledUsers: any[]): any | null {
  const zNorm = normalizePersonName(zoomUserName);
  if (!zNorm) return null;

  for (const stu of enrolledUsers) {
    const candidates = [
      stu.zoomDisplayName,
      stu.englishName,
      stu.nickname,
      stu.name,
      stu.fullName,
    ]
      .filter(Boolean)
      .map((x) => normalizePersonName(x));

    for (const c of candidates) {
      if (!c) continue;
      if (zNorm === c || zNorm.includes(c) || (c.length >= 4 && c.includes(zNorm))) {
        return stu;
      }
    }
  }
  return null;
}

/**
 * Yêu cầu #5, #6, #9, #10: Xử lý toàn bộ sự kiện Realtime Webhook từ Zoom theo đúng Target Router (DEV / PROD)
 */
export async function handleIncomingZoomWebhookEvent(
  eventType: string,
  payload: any,
  targets: Array<{ env: LakEnvKey; db: Firestore }>
) {
  const routerCfg = await getZoomRouterConfig();
  const obj = payload?.object || {};
  const zoomMeetingId = normalizeZoomMeetingId(obj.id);
  const topic = obj.topic || '';
  const nowIso = new Date().toISOString();

  // 1. Sự kiện hoàn tất bản ghi Cloud (#9 -> tự kích hoạt download & báo tiến trình #10)
  if (eventType === 'recording.completed') {
    return syncSingleZoomMeetingRecordingToTargets({
      zoomMeetingUuid: obj.uuid,
      targets,
      triggerSource: 'WEBHOOK_AUTO',
      directDownloadToken: payload?.download_token,
    });
  }

  // 2. Các sự kiện Realtime trong lớp học (#5 & #6)
  for (const target of targets) {
    const clsSnap = await getDocs(collection(target.db, 'classes'));
    const allClasses = clsSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
    const match = matchZoomEventToLakClass(zoomMeetingId, topic, obj.start_time, allClasses);
    if (!match.matchedClass) continue;

    const cls = match.matchedClass;
    const prevLive = cls.zoomLiveState || {};
    const activeList: any[] = Array.isArray(prevLive.activeParticipants)
      ? [...prevLive.activeParticipants]
      : [];
    const recentLeaves: any[] = Array.isArray(prevLive.recentLeaves)
      ? [...prevLive.recentLeaves]
      : [];

    if (eventType === 'meeting.started') {
      await setDoc(
        doc(target.db, 'classes', cls.id),
        {
          zoomLiveState: {
            ...prevLive,
            isLiveOnZoom: true,
            currentMeetingUuid: obj.uuid || '',
            startedAt: obj.start_time || nowIso,
            endedAt: null,
            liveParticipantCount: 0,
            activeParticipants: [],
            recentLeaves: [],
            lastWebhookAt: nowIso,
            lastEventType: eventType,
          },
        },
        { merge: true }
      );
    } else if (eventType === 'meeting.ended') {
      // Vừa kết thúc ca học -> cập nhật trạng thái lớp VÀ tạo ngay Job ENCODING_ON_ZOOM để khóa nút upload trên Card (#9, #10)!
      const sessionDate = toVietnamDateParts(obj.start_time || nowIso).isoDate;
      const jobDocId = `JOB_${cls.id}_${sessionDate}`;

      await Promise.all([
        setDoc(
          doc(target.db, 'classes', cls.id),
          {
            zoomLiveState: {
              ...prevLive,
              isLiveOnZoom: false,
              endedAt: nowIso,
              liveParticipantCount: 0,
              activeParticipants: [],
              lastWebhookAt: nowIso,
              lastEventType: eventType,
            },
          },
          { merge: true }
        ),
        setDoc(
          doc(target.db, 'zoom_sync_jobs', jobDocId),
          {
            id: jobDocId,
            classId: cls.id,
            className: cls.name,
            sessionDate,
            zoomMeetingId,
            zoomMeetingUuid: obj.uuid || '',
            status: 'ENCODING_ON_ZOOM',
            progressPercent: 8,
            triggerSource: 'WEBHOOK_AUTO',
            statusMessage:
              'Ca học vừa kết thúc — Đang chờ Zoom nén video & tự động tải về LAK Education...',
            updatedAt: nowIso,
          },
          { merge: true }
        ),
      ]);
    } else if (eventType === 'meeting.participant_joined') {
      const part = obj.participant || {};
      const pName = part.user_name || 'Participant';
      const filtered = activeList.filter((p) => p.zoomUserName !== pName);
      filtered.push({
        zoomUserName: pName,
        participantUserId: part.participant_user_id || part.user_id || '',
        joinedAt: part.join_time || nowIso,
      });

      await setDoc(
        doc(target.db, 'classes', cls.id),
        {
          zoomLiveState: {
            ...prevLive,
            isLiveOnZoom: true,
            currentMeetingUuid: obj.uuid || prevLive.currentMeetingUuid || '',
            liveParticipantCount: filtered.length,
            activeParticipants: filtered.slice(-40),
            lastWebhookAt: nowIso,
            lastEventType: eventType,
          },
        },
        { merge: true }
      );
    } else if (eventType === 'meeting.participant_left') {
      const part = obj.participant || {};
      const pName = part.user_name || 'Học viên';
      const pEmail = part.email || '';
      const leaveTimeIso = part.leave_time || nowIso;
      const leaveReason = part.leave_reason || '';

      const remaining = activeList.filter((p) => p.zoomUserName !== pName);

      // Đối chiếu danh sách học sinh trong lớp
      const usersSnap = await getDocs(collection(target.db, 'users'));
      const classStudentSet = new Set(cls.studentIds || []);
      const enrolledUsers = usersSnap.docs
        .map((d) => ({ ...(d.data() as any), id: d.id }))
        .filter((u) => classStudentSet.has(u.id));

      const matchedStudent = resolveEnrolledStudent(pName, enrolledUsers);
      const isStaffOrHost = !matchedStudent && isHostOrStaffDisplayName(pName, pEmail);

      // Kiểm tra ngưỡng rời lớp giữa giờ (trước giờ tan lớp >= earlyLeaveThresholdMinutes, mặc định 10 phút)
      const vnLeave = toVietnamDateParts(leaveTimeIso);
      const classEndMin = parseHmToMinutes(cls.scheduleData?.endTime);
      const classStartMin = parseHmToMinutes(cls.scheduleData?.startTime);

      const isDuringClassBeforeCutoff =
        classStartMin !== null && classEndMin !== null
          ? vnLeave.minutesOfDay >= classStartMin - 10 &&
            vnLeave.minutesOfDay <= classEndMin - routerCfg.earlyLeaveThresholdMinutes
          : true;

      const leaveRecord = {
        zoomUserName: pName,
        studentId: matchedStudent?.id || null,
        studentName: matchedStudent?.name || matchedStudent?.fullName || pName,
        leftAt: leaveTimeIso,
        vnTimeHm: vnLeave.timeHm,
        leaveReason,
        notifiedEarlyLeave: Boolean(!isStaffOrHost && isDuringClassBeforeCutoff),
      };

      const nextRecentLeaves = [leaveRecord, ...recentLeaves].slice(0, 20);

      await setDoc(
        doc(target.db, 'classes', cls.id),
        {
          zoomLiveState: {
            ...prevLive,
            liveParticipantCount: remaining.length,
            activeParticipants: remaining,
            recentLeaves: nextRecentLeaves,
            lastWebhookAt: nowIso,
            lastEventType: eventType,
          },
        },
        { merge: true }
      );

      // Bắn thông báo chuông Realtime cho Giáo viên đứng lớp & Giáo vụ / Giám đốc / IT (Yêu cầu #6)
      if (!isStaffOrHost && isDuringClassBeforeCutoff) {
        const notifId = `notif_zoom_leave_${cls.id}_${Date.now()}`;
        const studentLabel = matchedStudent
          ? `${matchedStudent.name || matchedStudent.fullName} (${matchedStudent.id} • Zoom: "${pName}")`
          : `"${pName}"`;
        const reasonVi = leaveReason.toLowerCase().includes('network')
          ? 'do sự cố kết nối mạng'
          : 'vừa rời khỏi phòng học Zoom';

        const targetKeys = ['ROLE:academic', 'ROLE:director', 'ROLE:admin'];
        if (cls.teacherId) {
          targetKeys.unshift(`USER:${cls.teacherId}`);
        }

        await setDoc(doc(target.db, 'notifications', notifId), {
          id: notifId,
          type: 'ZOOM_STUDENT_LEFT_EARLY',
          title: `⚠️ Học viên rời Zoom giữa giờ — ${cls.name}`,
          titleEn: `⚠️ Student left Zoom early — ${cls.name}`,
          message: `Học viên ${studentLabel} ${reasonVi} lúc ${vnLeave.timeHm} (trước giờ tan lớp). Giáo vụ & Giáo viên vui lòng kiểm tra hỗ trợ học viên vào lại phòng.`,
          messageEn: `Student ${studentLabel} left the Zoom room at ${vnLeave.timeHm} (${
            leaveReason || 'mid-session'
          }). Please check on the student.`,
          recipientId: null,
          recipientRole: 'academic',
          targetKeys,
          relatedId: cls.id,
          actionUrl: `/classroom/${cls.id}`,
          readBy: [],
          readAt: {},
          createdBy: 'ZOOM_WEBHOOK_GUARD',
          createdByName: 'Zoom Live Guard',
          createdByRole: 'system',
          createdAt: nowIso,
        });
      }
    }
  }

  return { handled: true, eventType, targetEnvs: targets.map((t) => t.env) };
}
