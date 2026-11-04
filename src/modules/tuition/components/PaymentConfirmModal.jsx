import React from 'react';
import { Modal, Typography } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';

const { Text } = Typography;

export const PaymentConfirmModal = ({ open, student, onCancel, onConfirm }) => {
  return (
    <Modal
      title={`Đối Soát & Xác Nhận Đóng Học Phí — ${student?.name || ''}`}
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm(student?.id)}
      okText="Xác Nhận Đã Thu Tiền"
      cancelText="Hủy"
    >
      {student && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 12 }}>
          <p><Text strong>Mã HV / Học viên:</Text> {student.id} — {student.name}</p>
          <p><Text strong>Lớp học đang tham gia:</Text> {student.className}</p>
          <p>
            <Text strong>Số tiền học phí:</Text>{' '}
            <Text style={{ color: '#722ed1', fontSize: 18, fontWeight: 'bold' }}>
              {formatCurrency(student.amountDue)}
            </Text>
          </p>
          <p><Text strong>Hình thức thanh toán:</Text> Chuyển khoản ngân hàng (QR Code / Bank Transfer)</p>
        </div>
      )}
    </Modal>
  );
};

