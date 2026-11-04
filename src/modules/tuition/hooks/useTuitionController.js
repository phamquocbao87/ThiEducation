import { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { MOCK_STUDENTS } from '../../../shared/data/mockData';
import { TuitionBillingService } from '../services/TuitionBillingService';
import { TuitionPaymentService } from '../services/TuitionPaymentService';
import { TuitionReminderService } from '../services/TuitionReminderService';

export const useTuitionController = () => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const scopedStudents = useMemo(
    () =>
      TuitionBillingService.getScopedTuitionRecords(students, currentUser, {
        searchText,
        statusFilter,
      }),
    [students, currentUser, searchText, statusFilter]
  );

  const summary = useMemo(() => TuitionBillingService.getTuitionSummary(), []);

  const permissions = {
    canConfirmPayment: PermissionService.canConfirmTuitionPayment(role),
    canSendReminder: PermissionService.canSendTuitionReminder(role),
    isStudent: role === PermissionService.ROLES.STUDENT,
  };

  const handleConfirmPayment = (studentId) => {
    setStudents((prev) => TuitionPaymentService.confirmPayment(prev, studentId));
    setSelectedStudent(null);
    message.success('Đã đối soát và xác nhận thanh toán học phí thành công!');
  };

  const handleSendReminder = (student) => {
    const msg = TuitionReminderService.buildReminderMessage(student);
    message.info(msg);
  };

  return {
    currentUser,
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
  };
};

