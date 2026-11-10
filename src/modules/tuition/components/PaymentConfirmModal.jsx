import React from 'react';
import { Modal, Typography } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const PaymentConfirmModal = ({ open, student, onCancel, onConfirm }) => {
  const { isEnglish } = useLanguage();

  return (
    <Modal
      title={
        isEnglish
          ? `Reconcile & Confirm Tuition Payment — ${student?.name || ''}`
          : `Đối Soát & Xác Nhận Đóng Học Phí — ${student?.name || ''}`
      }
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm(student?.id)}
      okText={isEnglish ? 'Confirm Received' : 'Xác Nhận Đã Thu Tiền'}
      cancelText={isEnglish ? 'Cancel' : 'Hủy'}
    >
      {student && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 12 }}>
          <p>
            <Text strong>{isEnglish ? 'Student ID / Name:' : 'Mã HV / Học viên:'}</Text>{' '}
            {student.id} — {student.name}
          </p>
          <p>
            <Text strong>{isEnglish ? 'Enrolled Classroom:' : 'Lớp học đang tham gia:'}</Text>{' '}
            {student.className}
          </p>
          <p>
            <Text strong>{isEnglish ? 'Tuition Fee Due:' : 'Số tiền học phí:'}</Text>{' '}
            <Text style={{ color: '#722ed1', fontSize: 18, fontWeight: 'bold' }}>
              {formatCurrency(student.amountDue)}
            </Text>
          </p>
          <p>
            <Text strong>{isEnglish ? 'Payment Method:' : 'Hình thức thanh toán:'}</Text>{' '}
            {isEnglish
              ? 'Bank Transfer (QR Code / Bank Transfer)'
              : 'Chuyển khoản ngân hàng (QR Code / Bank Transfer)'}
          </p>
        </div>
      )}
    </Modal>
  );
};
