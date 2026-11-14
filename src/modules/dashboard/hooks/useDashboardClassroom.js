import { useEffect, useMemo, useState } from 'react';
import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';
import { PermissionService } from '../../../core/services/PermissionService';

export const useDashboardClassroom = (user) => {
  const [records, setClasses] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [classroomError, setError] = useState(false);
  const userId = user?.id;
  const role = user?.role;
  const classes = useMemo(() => records.map((cls) => ({ ...cls, liveAttendance: attendance[cls.id] })), [records, attendance]);
  useEffect(() => {
    setClasses([]); setAttendance({}); setError(false);
    if (!userId || !PermissionService.canAccessModule(role, 'classroom')) return undefined;
    const actor = { id: userId, role };
    const stopClasses = ClassroomRealtimeService.subscribeClasses(actor, setClasses, () => {
      setError(true); setClasses([]);
    });
    const stopAttendance = ClassroomRealtimeService.subscribeAttendance(actor, setAttendance, () => {
      setError(true); setAttendance({});
    });
    return () => { stopClasses(); stopAttendance(); };
  }, [userId, role]);
  return { classes, setClasses, classroomError };
};
