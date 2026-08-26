import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Tabs, Modal, Form, Input, InputNumber, Select, Row, Col, Statistic, message, Popconfirm } from 'antd';
import { FileTextOutlined, DollarOutlined, PlusOutlined, CheckOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import { MOCK_CONTRACTS, MOCK_PAYROLLS, MOCK_TEACHERS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export const ContractPayrollManager = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [payrolls, setPayrolls] = useState(MOCK_PAYROLLS);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
  const [form] = Form.useForm();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleApprovePayroll = (id) => {
    setPayrolls((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Đã duyệt' } : item))
    );
    message.success('Đã phê duyệt bảng lương thành công!');
  };

  const handleCreateContract = (values) => {
    const newContract = {
      id: `HD-2026-${contracts.length + 1}`,
      teacherName: values.teacherName,
      type: values.type,
      ratePerSession: values.ratePerSession,
      minSessionsPerMonth: values.minSessionsPerMonth || 30,
      startDate: values.startDate || '2026-09-01',
      endDate: values.endDate || '2027-08-31',
      status: 'Hiệu lực',
    };
    setContracts([newContract, ...contracts]);
    setIsContractModalOpen(false);
    form.resetFields();
    message.success('Tạo hợp đồng giáo viên thành công!');
  };

  const showPaySlip = (record) => {
    setSelectedPaySlip(record);
    setIsPaySlipModalOpen(true);
  };

  // Columns for Contracts Table
  const contractColumns = [
    { title: 'Mã HĐ', dataIndex: 'id', key: 'id', render: (text) => <Text strong>{text}</Text> },
    { title: 'Giáo Viên', dataIndex: 'teacherName', key: 'teacherName', render: (text) => <Text strong color="#1890ff">{text}</Text> },
    {
      title: 'Loại Hợp Đồng',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Toàn thời gian' ? 'blue' : type === 'Bán thời gian' ? 'cyan' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Đơn Giá / Tiết Dạy',
      dataIndex: 'ratePerSession',
      key: 'ratePerSession',
      render: (val) => <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>{formatCurrency(val)}</Text>,
    },
    { title: 'Chỉ Tiêu Tiết/Tháng', dataIndex: 'minSessionsPerMonth', key: 'minSessionsPerMonth', render: (val) => `${val} tiết` },
    { title: 'Ngày Bắt Đầu', dataIndex: 'startDate', key: 'startDate' },
    { title: 'Ngày Kết Thúc', dataIndex: 'endDate', key: 'endDate' },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="green">{status}</Tag>,
    },
  ];

  // Columns for Payrolls Table
  const payrollColumns = [
    { title: 'Mã Phiếu', dataIndex: 'id', key: 'id' },
    { title: 'Giáo Viên', dataIndex: 'teacherName', key: 'teacherName', render: (text) => <Text strong>{text}</Text> },
    { title: 'Tháng', dataIndex: 'month', key: 'month' },
    { title: 'Số Tiết Dạy', dataIndex: 'totalSessions', key: 'totalSessions', render: (val) => <Tag color="geekblue">{val} tiết</Tag> },
    { title: 'Đơn Giá Tiết', dataIndex: 'ratePerSession', key: 'ratePerSession', render: (val) => formatCurrency(val) },
    { title: 'Thưởng', dataIndex: 'bonus', key: 'bonus', render: (val) => <Text type="success">+{formatCurrency(val)}</Text> },
    { title: 'Khấu Trừ', dataIndex: 'deduction', key: 'deduction', render: (val) => <Text type="danger">-{formatCurrency(val)}</Text> },
    {
      title: 'Tổng Thực Lĩnh',
      dataIndex: 'totalSalary',
      key: 'totalSalary',
      render: (val) => <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#722ed1' }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Đã duyệt' ? 'green' : 'gold'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {currentUser.role === 'admin' && record.status === 'Chờ duyệt' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprovePayroll(record.id)}>
              Duyệt
            </Button>
          )}
          <Button size="small" icon={<PrinterOutlined />} onClick={() => showPaySlip(record)}>
            Phiếu Lương
          </Button>
        </Space>
      ),
    },
  ];

  const totalPayrollBudget = payrolls.reduce((acc, curr) => acc + curr.totalSalary, 0);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Hợp Đồng & Bảng Lương Giáo Viên
          </Title>
          <Text type="secondary">Quản lý định mức tiết dạy, hợp đồng và tính toán chi trả lương tự động cho 68 Giáo viên.</Text>
        </Col>
        {currentUser.role === 'admin' && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsContractModalOpen(true)}>
              Tạo Hợp Đồng Mới
            </Button>
          </Col>
        )}
      </Row>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="Tổng Hợp Đồng Đang Hiệu Lực" value={contracts.length} suffix="HĐ" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="Tổng Chi Trả Lương Tháng 8" value={totalPayrollBudget} formatter={(val) => formatCurrency(val)} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic title="Trạng Thái Phê Duyệt" value={payrolls.filter(p => p.status === 'Đã duyệt').length} suffix={`/${payrolls.length} Bảng lương`} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="contracts"
        items={[
          {
            key: 'contracts',
            label: (
              <Space>
                <FileTextOutlined />
                <span>Danh Sách Hợp Đồng Giáo Viên ({contracts.length})</span>
              </Space>
            ),
            children: (
              <Table
                columns={contractColumns}
                dataSource={contracts}
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{ pageSize: 5 }}
              />
            ),
          },
          {
            key: 'payrolls',
            label: (
              <Space>
                <DollarOutlined />
                <span>Bảng Tính Lương Tháng 08/2026 ({payrolls.length})</span>
              </Space>
            ),
            children: (
              <Table
                columns={payrollColumns}
                dataSource={payrolls}
                rowKey="id"
                scroll={{ x: 900 }}
                pagination={{ pageSize: 5 }}
              />
            ),
          },
        ]}
      />

      {/* Modal Add Contract */}
      <Modal
        title="Tạo Hợp Đồng Giáo Viên Mới"
        open={isContractModalOpen}
        onCancel={() => setIsContractModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateContract}>
          <Form.Item name="teacherName" label="Họ và Tên Giáo Viên" rules={[{ required: true, message: 'Vui lòng nhập tên giáo viên' }]}>
            <Input placeholder="Ví dụ: Nguyễn Thị Lan" />
          </Form.Item>
          <Form.Item name="type" label="Loại Hợp Đồng" initialValue="Toàn thời gian" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Toàn thời gian', label: 'Toàn thời gian' },
              { value: 'Bán thời gian', label: 'Bán thời gian' },
              { value: 'Thỉnh giảng', label: 'Thỉnh giảng' },
            ]} />
          </Form.Item>
          <Form.Item name="ratePerSession" label="Đơn Giá / 1 Tiết Dạy (VNĐ)" initialValue={350000} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="minSessionsPerMonth" label="Chỉ tiêu tiết dạy/tháng" initialValue={40}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsContractModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu Hợp Đồng</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal PaySlip Preview */}
      <Modal
        title={<Space><PrinterOutlined /><Text strong>Phiếu Lương Chi Tiết Giáo Viên</Text></Space>}
        open={isPaySlipModalOpen}
        onCancel={() => setIsPaySlipModalOpen(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => { message.info('Đang in phiếu lương...'); setIsPaySlipModalOpen(false); }}>
            In Phiếu Lương PDF
          </Button>,
          <Button key="close" onClick={() => setIsPaySlipModalOpen(false)}>Đóng</Button>
        ]}
      >
        {selectedPaySlip && (
          <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px dashed #d9d9d9' }}>
            <Title level={4} style={{ textAlign: 'center', margin: 0, color: '#1890ff' }}>
              HỆ THỐNG GIÁO DỤC THIEDUCATION
            </Title>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
              PHIẾU LƯƠNG GIẢNG DẠY - THÁNG {selectedPaySlip.month}
            </Text>

            <Paragraph><Text strong>Mã giáo viên / Phiếu:</Text> {selectedPaySlip.id}</Paragraph>
            <Paragraph><Text strong>Họ và tên Giáo viên:</Text> {selectedPaySlip.teacherName}</Paragraph>
            <Paragraph><Text strong>Tổng số tiết đã dạy:</Text> {selectedPaySlip.totalSessions} tiết</Paragraph>
            <Paragraph><Text strong>Đơn giá 1 tiết:</Text> {formatCurrency(selectedPaySlip.ratePerSession)}</Paragraph>
            <Paragraph><Text strong>Lương theo số tiết:</Text> {formatCurrency(selectedPaySlip.totalSessions * selectedPaySlip.ratePerSession)}</Paragraph>
            <Paragraph><Text strong>Thưởng hiệu quả / Chuyên cần:</Text> <Text type="success">+{formatCurrency(selectedPaySlip.bonus)}</Text></Paragraph>
            <Paragraph><Text strong>Khấu trừ:</Text> <Text type="danger">-{formatCurrency(selectedPaySlip.deduction)}</Text></Paragraph>
            <div style={{ borderTop: '2px solid #1890ff', paddingTop: 12, marginTop: 12 }}>
              <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                TỔNG THỰC LĨNH: {formatCurrency(selectedPaySlip.totalSalary)}
              </Title>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
