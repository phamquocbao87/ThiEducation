import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { TUITION_STATUS } from '../models/tuition.model';
import { TuitionBillingService } from '../services/TuitionBillingService';
import { TuitionPaymentService } from '../services/TuitionPaymentService';
import { TuitionReminderService } from '../services/TuitionReminderService';

export const useTuitionController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const role = currentUser?.role;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);

  /**
   * Tải toàn bộ danh sách hóa đơn học phí thực tế từ Cloud Firestore
   */
  const loadTuitionBills = useCallback(async () => {
    setLoading(true);
    try {
      const records = await TuitionBillingService.getAllTuitionBills();
      setBills(records);
    } catch (err) {
      console.error('[useTuitionController] Lỗi tải hóa đơn học phí từ Firestore:', err);
      message.error('Lỗi khi tải dữ liệu học phí!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTuitionBills();
  }, [loadTuitionBills]);

  /**
   * Lọc và phân quyền hiển thị hóa đơn học phí (chỉ hiển thị hóa đơn của học viên đang hoạt động)
   */
  const scopedStudents = useMemo(() => {
    const activeStudentIds = new Set(
      (allSystemUsers || [])
        .filter(
          (u) =>
            (u.role || '').toLowerCase() === 'student' &&
            !u.isDeleted &&
            u.status !== 'deleted'
        )
        .map((u) => u.id || u.code)
    );
    const validBills = bills.filter((b) =>
      activeStudentIds.has(b.studentId || b.studentCode || b.id)
    );
    return TuitionBillingService.getScopedTuitionRecords(validBills, currentUser, {
      searchText,
      statusFilter,
    });
  }, [bills, currentUser, searchText, statusFilter, allSystemUsers]);

  /**
   * Tính toán thống kê tài chính thực tế theo thời gian thực (0ms)
   */
  const summary = useMemo(() => TuitionBillingService.calculateTuitionSummary(scopedStudents), [scopedStudents]);

  const permissions = {
    canConfirmPayment: PermissionService.canConfirmTuitionPayment(role),
    canSendReminder: PermissionService.canSendTuitionReminder(role),
    isStudent: role === PermissionService.ROLES.STUDENT,
  };

  /**
   * Xác nhận đóng học phí: Ghi vĩnh viễn vào Cloud Firestore và cập nhật UI ngay lập tức
   */
  const handleConfirmPayment = async (targetId, details = {}) => {
    const bill = bills.find(
      (b) => b.id === targetId || b.studentId === targetId || b.studentCode === targetId
    );
    const billId = bill?.id || targetId;
    const studentId = bill?.studentId || bill?.studentCode || targetId;

    // Optimistic UI update (0ms phản hồi)
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId || b.studentId === studentId
          ? {
              ...b,
              tuitionStatus: TUITION_STATUS.PAID,
              paidAt: new Date().toISOString(),
              paymentMethod: details.paymentMethod || 'BANK_TRANSFER',
              receiptCode: details.receiptCode || b.receiptCode,
            }
          : b
      )
    );
    setSelectedStudent(null);

    try {
      await TuitionPaymentService.confirmPayment(billId, {
        studentId,
        ...details,
      });
      message.success('Đã đối soát và xác nhận thanh toán học phí thành công!');
      // Đồng bộ lại từ Firestore
      const refreshed = await TuitionBillingService.getAllTuitionBills();
      setBills(refreshed);
    } catch (err) {
      console.error('[useTuitionController] Lỗi xác nhận học phí Firestore:', err);
      message.error('Không thể lưu trạng thái thanh toán vào Cloud Firestore!');
    }
  };

  /**
   * Gửi thông báo nhắc học phí
   */
  const handleSendReminder = (student) => {
    const msg = TuitionReminderService.buildReminderMessage(student);
    message.info(msg);
  };

  return {
    currentUser,
    loading,
    scopedStudents,
    summary,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    selectedStudent,
    setSelectedStudent,
    permissions,
    handleConfirmPayment,
    handleSendReminder,
    refreshTuitions: loadTuitionBills,
  };
};
