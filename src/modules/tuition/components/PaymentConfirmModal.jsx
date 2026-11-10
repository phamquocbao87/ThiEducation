import React, { useState, useEffect } from 'react';
import { Modal, Typography, Input, Space } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';
import { TuitionPaymentService } from '../services/TuitionPaymentService';

const { Text } = Typography;

export const PaymentConfirmModal = ({ open, student, onCancel, onConfirm }) => {
  const { isEnglish } = useLanguage();
  const [receiptCode, setReceiptCode] = useState('');

  useEffect(() => {
    if (student && open) {
      setReceiptCode(student.receiptCode || TuitionPaymentService.generateReceiptCode());
    }
  }, [student, open]);

  const handleOk = () => {
    if (!student) return;
    onConfirm(student.id, {
      receiptCode: receiptCode.trim(),
      paymentMethod: 'BANK_TRANSFER',
      studentId: student.studentId || student.studentCode || student.id,
    });
  };

  return (
    <Modal
      title={
        isEnglish
          ? `Reconcile & Confirm Tuition Payment — ${student?.name || ''}`
          : `Đối Soát & Xác Nhận Đóng Học Phí — ${student?.name || ''}`
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEnglish ? 'Confirm Received' : 'Xác Nhận Đã Thu Tiền'}
      cancelText={isEnglish ? 'Cancel' : 'Hủy'}
    >
      {student && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 12 }}>
          <p>
            <Text strong>{isEnglish ? 'Student ID / Name:' : 'Mã HV / Học viên:'}</Text>{' '}
            {student.studentCode || student.studentId || student.id} — {student.name}
          </p>
          <p>
            <Text strong>{isEnglish ? 'Enrolled Classroom:' : 'Lớp học đang tham gia:'}</Text>{' '}
            {student.className || '—'}
          </p>
          <p>
            <Text strong>{isEnglish ? 'Tuition Fee Due:' : 'Số tiền học phí:'}</Text>{' '}
            <Text style={{ color: '#722ed1', fontSize: 18, fontWeight: 'bold' }}>
              {formatCurrency(student.amountDue)}
            </Text>
          </p>
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {isEnglish ? 'Receipt Code (Official):' : 'Mã Biên Lai Thu Tiền:'}
            </Text>
            <Input
              value={receiptCode}
              onChange={(e) => setReceiptCode(e.target.value)}
              placeholder="VD: BL-20261110-1234"
              style={{ width: '100%', borderRadius: 6, fontWeight: 600, color: '#0958d9' }}
            />
          </div>
          <p style={{ margin: 0 }}>
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
