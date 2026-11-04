import React from 'react';
import { Typography } from 'antd';
import { useLanguage } from '../../core/context/LanguageContext';
import { useTuitionController } from './hooks/useTuitionController';
import { TuitionStatsRow } from './components/TuitionStatsRow';
import { TuitionFilterBar } from './components/TuitionFilterBar';
import { TuitionTable } from './components/TuitionTable';
import { PaymentConfirmModal } from './components/PaymentConfirmModal';

const { Title, Text } = Typography;

export const TuitionPage = () => {
  const { t, translateLabel } = useLanguage();
  const {
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
  } = useTuitionController();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {permissions.isStudent
            ? `${t('pages.tuitionTitleStudent')} (${currentUser.name})`
            : `${t('pages.tuitionTitleManager')} (${translateLabel(currentUser.roleLabel)})`}
        </Title>
        <Text type="secondary">{t('pages.tuitionSub')}</Text>
      </div>

      {!permissions.isStudent && <TuitionStatsRow summary={summary} />}

      {!permissions.isStudent && (
        <TuitionFilterBar
          searchText={searchText}
          onChangeSearch={setSearchText}
          statusFilter={statusFilter}
          onChangeStatus={setStatusFilter}
        />
      )}

      <TuitionTable
        students={scopedStudents}
        canConfirmPayment={permissions.canConfirmPayment}
        canSendReminder={permissions.canSendReminder}
        onSelectForPayment={setSelectedStudent}
        onSendReminder={handleSendReminder}
      />

      <PaymentConfirmModal
        open={Boolean(selectedStudent)}
        student={selectedStudent}
        onCancel={() => setSelectedStudent(null)}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};
