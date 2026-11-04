import React from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';

const { Title, Text, Paragraph } = Typography;

export const PaySlipModal = ({ open, paySlip, onClose, onPrint }) => {
  return (
    <Modal
      title={<Space><PrinterOutlined /><Text strong>Phiếu Lương Chi Tiết Giáo Viên</Text></Space>}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={onPrint}>
          In Phiếu Lương PDF
        </Button>,
        <Button key="close" onClick={onClose}>Đóng</Button>,
      ]}
    >
      {paySlip && (
        <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px dashed #d9d9d9' }}>
          <Title level={4} style={{ textAlign: 'center', margin: 0, color: '#1890ff' }}>
            HỆ THỐNG GIÁO DỤC LAK EDUCATION (LAKEDUCATION.COM)
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
            PHIẾU LƯƠNG GIẢNG DẠY — THÁNG {paySlip.month}
          </Text>

          <Paragraph><Text strong>Mã phiếu lương:</Text> {paySlip.id}</Paragraph>
          <Paragraph><Text strong>Họ và tên Giáo viên:</Text> {paySlip.teacherName}</Paragraph>
          <Paragraph><Text strong>Tổng số tiết đã dạy:</Text> {paySlip.totalSessions} tiết</Paragraph>
          <Paragraph><Text strong>Đơn giá 1 tiết:</Text> {formatCurrency(paySlip.ratePerSession)}</Paragraph>
          <Paragraph><Text strong>Lương theo số tiết:</Text> {formatCurrency(paySlip.totalSessions * paySlip.ratePerSession)}</Paragraph>
          <Paragraph><Text strong>Thưởng hiệu quả / Chuyên cần:</Text> <Text type="success">+{formatCurrency(paySlip.bonus)}</Text></Paragraph>
          <Paragraph><Text strong>Khấu trừ:</Text> <Text type="danger">-{formatCurrency(paySlip.deduction)}</Text></Paragraph>
          <div style={{ borderTop: '2px solid #1890ff', paddingTop: 12, marginTop: 12 }}>
            <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
              TỔNG THỰC LĨNH: {formatCurrency(paySlip.totalSalary)}
            </Title>
          </div>
        </div>
      )}
    </Modal>
  );
};

