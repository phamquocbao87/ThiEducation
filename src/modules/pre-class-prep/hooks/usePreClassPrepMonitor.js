import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import { PREP_STATUS } from '../../lesson-reader';
import { PreClassPrepMonitorService } from '../services/PreClassPrepMonitorService';

/**
 * usePreClassPrepMonitor — Controller Hook quản lý toàn bộ trạng thái màn hình `/pre-class-prep`
 * - Hỗ trợ Deep-Link Query Params: `?classId=...&status=...&tab=students|classes&q=...`
 * - Cô lập quyền hiển thị (SĐT Phụ huynh, lọc Giáo viên, gửi nhắc cá nhân & hàng loạt).
 */
export const usePreClassPrepMonitor = ({ currentUser, isEnglish = false }) => {
  const location = useLocation();
  const userRole = String(currentUser?.role || '').toLowerCase();

  const canRemind = ['academic', 'director', 'admin'].includes(userRole);
  const canViewParentContacts = ['academic', 'director', 'admin'].includes(userRole);
  const canFilterTeacher = ['academic', 'director', 'admin'].includes(userRole);

  const initialQuery = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const validStatuses = ['ALL', PREP_STATUS.NOT_STARTED, PREP_STATUS.SKIMMED, PREP_STATUS.PREPARED, PREP_STATUS.POST_READ];
      const rawStatus = params.get('status') || 'ALL';
      const rawTab = params.get('tab') || 'students';
      return {
        classId: params.get('classId') || 'ALL',
        status: validStatuses.includes(rawStatus) ? rawStatus : 'ALL',
        tab: rawTab === 'classes' ? 'classes' : 'students',
        keyword: params.get('q') || '',
      };
    } catch {
      return { classId: 'ALL', status: 'ALL', tab: 'students', keyword: '' };
    }
  }, [location.search]);

  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState(() => PreClassPrepMonitorService.buildEmptyDataset());

  const [activeTab, setActiveTab] = useState(initialQuery.tab);
  const [selectedClassId, setSelectedClassId] = useState(initialQuery.classId);
  const [selectedTeacherId, setSelectedTeacherId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(initialQuery.status);
  const [searchKeyword, setSearchKeyword] = useState(initialQuery.keyword);

  const [remindedMap, setRemindedMap] = useState({});
  const [sendingKey, setSendingKey] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);

  // Đồng bộ khi người dùng điều hướng qua query param mới
  useEffect(() => {
    setSelectedClassId(initialQuery.classId);
    setStatusFilter(initialQuery.status);
    setActiveTab(initialQuery.tab);
    if (initialQuery.keyword) {
      setSearchKeyword(initialQuery.keyword);
    }
  }, [initialQuery]);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await PreClassPrepMonitorService.getScopedPrepDataset(currentUser, isEnglish);
      setDataset(res);
    } catch (err) {
      console.warn('[usePreClassPrepMonitor] Lỗi nạp báo cáo chuẩn bị bài:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isEnglish]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách Giáo viên để lọc (chỉ Staff)
  const teacherOptions = useMemo(() => {
    const map = new Map();
    (dataset.plannedClasses || []).forEach((cls) => {
      if (cls.teacherId && !map.has(cls.teacherId)) {
        map.set(cls.teacherId, {
          value: cls.teacherId,
          label: `👨‍🏫 ${cls.teacherName || cls.teacherId}`,
        });
      }
    });
    return Array.from(map.values());
  }, [dataset.plannedClasses]);

  // Danh sách lớp đã lọc theo Giáo viên & Từ khóa
  const filteredClasses = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return (dataset.plannedClasses || []).filter((cls) => {
      if (selectedClassId !== 'ALL' && String(cls.classId) !== String(selectedClassId)) return false;
      if (canFilterTeacher && selectedTeacherId !== 'ALL' && String(cls.teacherId) !== String(selectedTeacherId)) {
        return false;
      }
      if (kw) {
        const hay = `${cls.classId} ${cls.className} ${cls.teacherName} ${cls.lessonTitle} ${cls.courseLevel}`.toLowerCase();
        const studentMatch = (cls.students || []).some((s) =>
          `${s.studentName} ${s.englishName} ${s.studentCode} ${canViewParentContacts ? `${s.parentName || ''} ${s.parentPhone || ''}` : ''}`
            .toLowerCase()
            .includes(kw)
        );
        if (!hay.includes(kw) && !studentMatch) return false;
      }
      return true;
    });
  }, [dataset.plannedClasses, selectedClassId, selectedTeacherId, canFilterTeacher, searchKeyword, canViewParentContacts]);

  // Danh sách học viên đã lọc theo Lớp, GV, Từ khóa & Trạng thái
  const filteredStudents = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return (dataset.studentRows || []).filter((row) => {
      if (selectedClassId !== 'ALL' && String(row.classId) !== String(selectedClassId)) return false;
      if (canFilterTeacher && selectedTeacherId !== 'ALL' && String(row.teacherId) !== String(selectedTeacherId)) {
        return false;
      }
      if (statusFilter !== 'ALL' && row.prepStatus !== statusFilter) return false;
      if (kw) {
        const contactHay = canViewParentContacts ? `${row.parentName || ''} ${row.parentPhone || ''}` : '';
        const hay = `${row.studentName} ${row.englishName} ${row.studentCode} ${row.classId} ${row.className} ${row.lessonTitle} ${row.teacherName} ${contactHay}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [dataset.studentRows, selectedClassId, selectedTeacherId, canFilterTeacher, statusFilter, searchKeyword, canViewParentContacts]);

  // Tính lại KPI Summary theo bộ lọc Lớp / Giáo viên hiện tại (giúp lọc lớp nào thấy đúng % lớp đó)
  const scopedSummary = useMemo(() => {
    const rows = (dataset.studentRows || []).filter((row) => {
      if (selectedClassId !== 'ALL' && String(row.classId) !== String(selectedClassId)) return false;
      if (canFilterTeacher && selectedTeacherId !== 'ALL' && String(row.teacherId) !== String(selectedTeacherId)) {
        return false;
      }
      return true;
    });
    const total = rows.length;
    const totalPrepared = rows.filter((r) => r.prepStatus === PREP_STATUS.PREPARED).length;
    const totalSkimmed = rows.filter((r) => r.prepStatus === PREP_STATUS.SKIMMED).length;
    const totalNotStarted = rows.filter((r) => r.prepStatus === PREP_STATUS.NOT_STARTED).length;
    const overallReadinessRate = total > 0 ? Math.round((totalPrepared / total) * 100) : 0;
    const avgConductScore =
      total > 0 ? Math.round(rows.reduce((acc, r) => acc + (r.conductScore || 0), 0) / total) : 0;

    return {
      totalStudentsMonitored: total,
      totalPrepared,
      totalSkimmed,
      totalNotStarted,
      overallReadinessRate,
      avgConductScore,
      totalClassesMonitored: filteredClasses.length,
    };
  }, [dataset.studentRows, selectedClassId, selectedTeacherId, canFilterTeacher, filteredClasses.length]);

  // Danh sách đối tượng có thể gửi nhắc hàng loạt trong bộ lọc hiện tại (chưa đạt chuẩn & chưa gửi trong phiên)
  const remindableStudents = useMemo(() => {
    return filteredStudents.filter((r) => {
      const key = `${r.classId}_${r.studentId}`;
      return r.prepStatus !== PREP_STATUS.PREPARED && !remindedMap[key];
    });
  }, [filteredStudents, remindedMap]);

  const handleSendSingleReminder = async (studentRow) => {
    if (!canRemind || !studentRow) return;
    const key = `${studentRow.classId}_${studentRow.studentId}`;
    setSendingKey(key);
    try {
      await PreClassPrepMonitorService.sendSingleReminder({
        studentRow,
        senderUser: currentUser,
        isEnglish,
      });
      setRemindedMap((prev) => ({ ...prev, [key]: true }));
      message.success(
        isEnglish
          ? `Pre-class reading reminder sent to ${studentRow.studentName}!`
          : `Đã gửi thông báo nhắc đọc bài tới học viên ${studentRow.studentName}!`
      );
    } catch (err) {
      message.error(err?.message || (isEnglish ? 'Failed to send reminder' : 'Lỗi gửi thông báo nhắc đọc bài'));
    } finally {
      setSendingKey(null);
    }
  };

  const handleSendBulkReminders = async (targetList = remindableStudents) => {
    if (!canRemind || !targetList.length) return;
    setBulkSending(true);
    try {
      const res = await PreClassPrepMonitorService.sendBulkReminders({
        studentRows: targetList,
        senderUser: currentUser,
        isEnglish,
      });
      if (res.sentKeys.length > 0) {
        setRemindedMap((prev) => {
          const next = { ...prev };
          res.sentKeys.forEach((k) => {
            next[k] = true;
          });
          return next;
        });
        message.success(
          isEnglish
            ? `Sent pre-class reading reminders to ${res.sentCount} student(s)!`
            : `Đã gửi thông báo nhắc đọc bài tới ${res.sentCount} học viên thành công!`
        );
      }
      if (res.failedCount > 0) {
        message.warning(
          isEnglish
            ? `${res.failedCount} reminder(s) could not be delivered.`
            : `Có ${res.failedCount} thông báo chưa gửi được, vui lòng thử lại.`
        );
      }
    } catch (err) {
      message.error(err?.message || (isEnglish ? 'Bulk reminder failed' : 'Lỗi gửi nhắc hàng loạt'));
    } finally {
      setBulkSending(false);
    }
  };

  const handleInspectClassStudents = (classId) => {
    setSelectedClassId(classId);
    setStatusFilter('ALL');
    setActiveTab('students');
  };

  const handleResetFilters = () => {
    setSelectedClassId('ALL');
    setSelectedTeacherId('ALL');
    setStatusFilter('ALL');
    setSearchKeyword('');
  };

  return {
    userRole,
    canRemind,
    canViewParentContacts,
    canFilterTeacher,
    loading,
    dataset,
    scopedSummary,
    activeTab,
    setActiveTab,
    selectedClassId,
    setSelectedClassId,
    selectedTeacherId,
    setSelectedTeacherId,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    teacherOptions,
    filteredClasses,
    filteredStudents,
    remindableStudents,
    remindedMap,
    sendingKey,
    bulkSending,
    loadData,
    handleSendSingleReminder,
    handleSendBulkReminders,
    handleInspectClassStudents,
    handleResetFilters,
  };
};

export default usePreClassPrepMonitor;
