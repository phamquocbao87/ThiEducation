import { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { MOCK_CONTRACTS, MOCK_PAYROLLS, MOCK_ACADEMIC_STAFF } from '../../../shared/data/mockData';
import { TeacherContractService } from '../services/TeacherContractService';
import { TeacherPayrollService } from '../services/TeacherPayrollService';
import { StaffPayrollService } from '../services/StaffPayrollService';

export const useContractPayrollController = () => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [payrolls, setPayrolls] = useState(MOCK_PAYROLLS);
  const [staffPayrolls, setStaffPayrolls] = useState(MOCK_ACADEMIC_STAFF);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

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

  const handleCreateContract = (values) => {
    setContracts((prev) => TeacherContractService.createContract(prev, values));
    setIsContractModalOpen(false);
    message.success('Đã tạo hợp đồng giáo viên mới thành công!');
  };

  const handleApproveTeacherPayroll = (id) => {
    setPayrolls((prev) => TeacherPayrollService.approvePayroll(prev, id));
    message.success('Đã phê duyệt bảng lương giáo viên!');
  };

  const handleDisburseTeacherPayroll = (id) => {
    setPayrolls((prev) => TeacherPayrollService.disbursePayroll(prev, id));
    message.success('Kế toán đã xác nhận chuyển khoản chi lương giáo viên!');
  };

  const handleApproveStaffPayroll = (id) => {
    setStaffPayrolls((prev) => StaffPayrollService.approveStaffPayroll(prev, id));
    message.success('Đã duyệt bảng lương nhân viên Giáo vụ!');
  };

  const handleDisburseStaffPayroll = (id) => {
    setStaffPayrolls((prev) => StaffPayrollService.disburseStaffPayroll(prev, id));
    message.success('Kế toán đã xác nhận chi lương cho nhân viên Giáo vụ!');
  };

  const handlePrintPaySlip = () => {
    message.info('Đang kết xuất Phiếu Lương PDF...');
    setSelectedPaySlip(null);
  };

  return {
    currentUser,
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
    handleCreateContract,
    handleApproveTeacherPayroll,
    handleDisburseTeacherPayroll,
    handleApproveStaffPayroll,
    handleDisburseStaffPayroll,
    handlePrintPaySlip,
  };
};

