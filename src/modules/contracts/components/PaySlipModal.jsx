import React from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Title, Text, Paragraph } = Typography;

export const PaySlipModal = ({ open, paySlip, onClose, onPrint }) => {
  const { isEnglish } = useLanguage();

  return (
    <Modal
      title={
        <Space>
          <PrinterOutlined />
          <Text strong>
            {isEnglish ? 'Detailed Native Teacher Pay Slip' : 'Phiếu Lương Chi Tiết Giáo Viên'}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={onPrint}>
          {isEnglish ? 'Print Pay Slip PDF' : 'In Phiếu Lương PDF'}
        </Button>,
        <Button key="close" onClick={onClose}>
          {isEnglish ? 'Close' : 'Đóng'}
        </Button>,
      ]}
    >
      {paySlip && (
        <div
          style={{
            background: '#fafafa',
            padding: 20,
            borderRadius: 8,
            border: '1px dashed #d9d9d9',
          }}
        >
          <Title level={4} style={{ textAlign: 'center', margin: 0, color: '#1890ff' }}>
            LAK EDUCATION SYSTEM (LAKEDUCATION.COM)
          </Title>
          <Text
            type="secondary"
            style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}
          >
            {isEnglish
              ? `TEACHER SALARY PAY SLIP — MONTH ${paySlip.month}`
              : `PHIẾU LƯƠNG GIẢNG DẠY — THÁNG ${paySlip.month}`}
          </Text>

          <Paragraph>
            <Text strong>{isEnglish ? 'Pay Slip Code:' : 'Mã phiếu lương:'}</Text>{' '}
            {paySlip.id}
          </Paragraph>
          <Paragraph>
            <Text strong>{isEnglish ? 'Teacher Full Name:' : 'Họ và tên Giáo viên:'}</Text>{' '}
            {paySlip.teacherName}
          </Paragraph>
          <Paragraph>
            <Text strong>{isEnglish ? 'Completed Sessions:' : 'Tổng số tiết đã dạy:'}</Text>{' '}
            {paySlip.totalSessions} {isEnglish ? 'sessions' : 'tiết'}
          </Paragraph>
          <Paragraph>
            <Text strong>{isEnglish ? 'Rate Per Session:' : 'Đơn giá 1 tiết:'}</Text>{' '}
            {formatCurrency(paySlip.ratePerSession)}
          </Paragraph>
          <Paragraph>
            <Text strong>{isEnglish ? 'Teaching Salary:' : 'Lương theo số tiết:'}</Text>{' '}
            {formatCurrency(paySlip.totalSessions * paySlip.ratePerSession)}
          </Paragraph>
          <Paragraph>
            <Text strong>
              {isEnglish ? 'Performance Bonus / Allowance:' : 'Thưởng hiệu quả / Chuyên cần:'}
            </Text>{' '}
            <Text type="success">+{formatCurrency(paySlip.bonus)}</Text>
          </Paragraph>
          <Paragraph>
            <Text strong>{isEnglish ? 'Deductions:' : 'Khấu trừ:'}</Text>{' '}
            <Text type="danger">-{formatCurrency(paySlip.deduction || 0)}</Text>
          </Paragraph>
          <div style={{ borderTop: '2px solid #1890ff', paddingTop: 12, marginTop: 12 }}>
            <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
              {isEnglish ? 'TOTAL NET PAYOUT:' : 'TỔNG THỰC LĨNH:'}{' '}
              {formatCurrency(paySlip.totalSalary)}
            </Title>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PaySlipModal;
