import React from 'react';
import { Row, Col, Button, Tabs, Space, Typography } from 'antd';
import { FileTextOutlined, DollarOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useContractPayrollController } from './hooks/useContractPayrollController';
import { ContractStatsRow } from './components/ContractStatsRow';
import { TeacherContractTable } from './components/TeacherContractTable';
import { TeacherPayrollTable } from './components/TeacherPayrollTable';
import { StaffPayrollTable } from './components/StaffPayrollTable';
import { ContractFormModal } from './components/ContractFormModal';
import { PaySlipModal } from './components/PaySlipModal';

const { Title, Text } = Typography;

export const ContractPayrollPage = () => {
  const { t, translateLabel } = useLanguage();
  const {
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
  } = useContractPayrollController();

  const tabItems = [
    {
      key: 'teacher-payrolls',
      label: (
        <Space>
          <DollarOutlined />
          <span>{`${t('pages.tabTeacherPayrolls')} (${scopedPayrolls.length})`}</span>
        </Space>
      ),
      children: (
        <TeacherPayrollTable
          payrolls={scopedPayrolls}
          canApprove={permissions.canApprovePayroll}
          canDisburse={permissions.canDisbursePayroll}
          onApprove={handleApproveTeacherPayroll}
          onDisburse={handleDisburseTeacherPayroll}
          onShowPaySlip={setSelectedPaySlip}
        />
      ),
    },
    {
      key: 'teacher-contracts',
      label: (
        <Space>
          <FileTextOutlined />
          <span>{`${t('pages.tabTeacherContracts')} (${scopedContracts.length})`}</span>
        </Space>
      ),
      children: <TeacherContractTable contracts={scopedContracts} />,
    },
  ];

  if (permissions.canViewStaffPayroll) {
    tabItems.push({
      key: 'staff-payrolls',
      label: (
        <Space>
          <TeamOutlined />
          <span>{`${t('pages.tabStaffPayrolls')} (${staffPayrolls.length})`}</span>
        </Space>
      ),
      children: (
        <StaffPayrollTable
          staffList={staffPayrolls}
          canApprove={permissions.canApprovePayroll}
          canDisburse={permissions.canDisbursePayroll}
          onApproveStaff={handleApproveStaffPayroll}
          onDisburseStaff={handleDisburseStaffPayroll}
        />
      ),
    });
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            {t('pages.contractsTitle')} ({translateLabel(currentUser.roleLabel)})
          </Title>
          <Text type="secondary">{t('pages.contractsSub')}</Text>
        </Col>
        {permissions.canManageContracts && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsContractModalOpen(true)}>
              {t('pages.createContractBtn')}
            </Button>
          </Col>
        )}
      </Row>

      <ContractStatsRow
        contractsCount={scopedContracts.length}
        teacherPayrollTotal={teacherPayrollTotal}
        staffPayrollTotal={staffPayrollTotal}
        showStaffPayroll={permissions.canViewStaffPayroll}
      />

      <Tabs defaultActiveKey="teacher-payrolls" items={tabItems} />

      <ContractFormModal
        open={isContractModalOpen}
        onCancel={() => setIsContractModalOpen(false)}
        onSubmit={handleCreateContract}
      />

      <PaySlipModal
        open={Boolean(selectedPaySlip)}
        paySlip={selectedPaySlip}
        onClose={() => setSelectedPaySlip(null)}
        onPrint={handlePrintPaySlip}
      />
    </div>
  );
};
