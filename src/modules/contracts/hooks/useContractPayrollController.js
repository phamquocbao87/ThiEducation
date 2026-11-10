import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { TeacherContractService } from '../services/TeacherContractService';
import { TeacherPayrollService } from '../services/TeacherPayrollService';
import { StaffPayrollService } from '../services/StaffPayrollService';
import { ClassService } from '../../courses/services/ClassService';

export const useContractPayrollController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const { isEnglish, t } = useLanguage();
  const role = currentUser.role;

  const [contracts, setContracts] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

  // Danh sách Giáo viên bản xứ thực tế từ Firestore
  const realTeachers = useMemo(() => {
    return (allSystemUsers || [])
      .filter(
        (u) =>
          (u.role || '').toLowerCase() === 'teacher' &&
          !u.isDeleted &&
          u.status !== 'deleted'
      )
      .map((u) => ({
        id: u.id || u.code,
        name: u.name,
        englishName: u.englishName || u.name,
        nationality: u.nationality || 'Foreign Native',
        email: u.email,
        phone: u.phoneNumber || u.phone,
        hourlyRate: u.hourlyRate || 450000,
      }));
  }, [allSystemUsers]);

  // Tải dữ liệu thực tế từ Cloud Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchContractsData = async () => {
      setLoading(true);
      try {
        const [contractsList, payrollsList, classesList] = await Promise.all([
          TeacherContractService.getAllContracts(),
          TeacherPayrollService.getAllPayrolls(),
          ClassService.getAllClasses(),
        ]);
        if (isMounted) {
          setContracts(contractsList);
          setPayrolls(payrollsList);
          setClasses(classesList);
        }
      } catch (err) {
        console.error('Error fetching contracts/payrolls from Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContractsData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Danh sách Bảng lương Cán bộ Giáo vụ sinh động từ dữ liệu Firestore thực tế
  const staffPayrolls = useMemo(() => {
    return StaffPayrollService.buildStaffPayrollsFromRealUsers(allSystemUsers, classes);
  }, [allSystemUsers, classes]);

  const scopedContracts = useMemo(
    () => TeacherContractService.getScopedContracts(contracts, currentUser),
    [contracts, currentUser]
  );

  const scopedPayrolls = useMemo(
    () => TeacherPayrollService.getScopedPayrolls(payrolls, currentUser),
    [payrolls, currentUser]
  );

  const teacherPayrollTotal = useMemo(
    () => TeacherPayrollService.calculateTotalBudget(scopedPayrolls),
    [scopedPayrolls]
  );

  const staffPayrollTotal = useMemo(
    () => StaffPayrollService.calculateStaffPayrollTotal(staffPayrolls),
    [staffPayrolls]
  );

  const permissions = {
    canManageContracts: PermissionService.canManageContracts(role),
    canApprovePayroll: PermissionService.canApprovePayroll(role),
    canDisbursePayroll: PermissionService.canDisbursePayroll(role),
    canViewStaffPayroll: PermissionService.canViewStaffPayroll(role),
  };

  const handleCreateContract = async (values) => {
    const matchedTeacher = realTeachers.find(
      (t) => t.id === values.teacherId || t.name === values.teacherId
    );
    const updated = TeacherContractService.createContract(contracts, values, matchedTeacher);
    const newContractRecord = updated[0];
    setContracts(updated);
    setIsContractModalOpen(false);

    try {
      await TeacherContractService.saveContract(newContractRecord);
      message.success(t('contracts.modal.success'));
    } catch (err) {
      message.error(isEnglish ? 'Failed to save contract: ' + err.message : 'Lỗi lưu hợp đồng: ' + err.message);
    }
  };

  const handleApproveTeacherPayroll = async (id) => {
    const updated = await TeacherPayrollService.approvePayroll(payrolls, id);
    setPayrolls(updated);
    message.success(
      isEnglish
        ? 'Approved teacher payroll successfully!'
        : 'Đã phê duyệt bảng lương giáo viên thành công!'
    );
  };

  const handleDisburseTeacherPayroll = async (id) => {
    const updated = await TeacherPayrollService.disbursePayroll(payrolls, id);
    setPayrolls(updated);
    message.success(
      isEnglish
        ? 'Payroll disbursement confirmed by Accountant!'
        : 'Kế toán đã xác nhận chuyển khoản chi lương giáo viên!'
    );
  };

  const handleApproveStaffPayroll = (id) => {
    message.success(
      isEnglish
        ? 'Approved academic staff payroll!'
        : 'Đã duyệt bảng lương nhân viên Giáo vụ!'
    );
  };

  const handleDisburseStaffPayroll = (id) => {
    message.success(
      isEnglish
        ? 'Academic staff payroll disbursement confirmed!'
        : 'Kế toán đã xác nhận chi lương cho nhân viên Giáo vụ!'
    );
  };

  const handlePrintPaySlip = () => {
    message.info(
      isEnglish
        ? 'Exporting Pay Slip PDF...'
        : 'Đang kết xuất Phiếu Lương PDF...'
    );
    setSelectedPaySlip(null);
  };

  return {
    currentUser,
    realTeachers,
    scopedContracts,
    scopedPayrolls,
    staffPayrolls,
    teacherPayrollTotal,
    staffPayrollTotal,
    permissions,
    isContractModalOpen,
    setIsContractModalOpen,
    selectedPaySlip,
    setSelectedPaySlip,
    loading,
    handleCreateContract,
    handleApproveTeacherPayroll,
    handleDisburseTeacherPayroll,
    handleApproveStaffPayroll,
    handleDisburseStaffPayroll,
    handlePrintPaySlip,
  };
};

export default useContractPayrollController;
