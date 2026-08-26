import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Typography, Row, Col, Statistic, Input, Select, Modal, message, Badge } from 'antd';
import { DollarOutlined, CheckCircleOutlined, BellOutlined, SearchOutlined, CreditCardOutlined, PhoneOutlined } from '@ant-design/icons';
import { MOCK_STUDENTS, INITIAL_STATS } from '../../shared/data/mockData';
import { formatCurrency } from '../../shared/utils/formatter';

const { Title, Text } = Typography;

export const TuitionManager = () => {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleConfirmPayment = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, tuitionStatus: 'PAID' } : s))
    );
    setIsPaymentModalOpen(false);
    message.success('Đã xác nhận thanh toán học phí thành công!');
  };

  const handleSendReminder = (studentName, phone) => {
    message.info(`Đã gửi thông báo nhắc học phí SMS/Zalo tới phụ huynh em ${studentName} (${phone})!`);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchText.toLowerCase()) || s.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.tuitionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { title: 'Mã HV', dataIndex: 'id', key: 'id', render: (id) => <Text strong>{id}</Text> },
    { title: 'Họ và Tên Học Viên', dataIndex: 'name', key: 'name', render: (name) => <Text strong color="#1890ff">{name}</Text> },
    { title: 'Lớp Học', dataIndex: 'className', key: 'className' },
    { title: 'Học Phí THÁNG 8', dataIndex: 'amountDue', key: 'amountDue', render: (val) => <Text strong>{formatCurrency(val)}</Text> },
    {
      title: 'Phụ Huynh & SĐT',
      key: 'parent',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 13, display: 'block' }}>{record.parentName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}><PhoneOutlined /> {record.phone}</Text>
        </div>
      ),
    },
    {
      title: 'Trạng Thái Nộp',
      dataIndex: 'tuitionStatus',
      key: 'tuitionStatus',
      render: (status) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'UNPAID' ? 'orange' : 'red'}>
          {status === 'PAID' ? 'ĐÃ NỘP' : status === 'UNPAID' ? 'CHƯA NỘP' : 'QUÁ HẠN'}
        </Tag>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.tuitionStatus !== 'PAID' ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CreditCardOutlined />}
                onClick={() => {
                  setSelectedStudent(record);
                  setIsPaymentModalOpen(true);
                }}
              >
                Xác Nhận Nộp
              </Button>
              <Button
                size="small"
                icon={<BellOutlined />}
                onClick={() => handleSendReminder(record.name, record.phone)}
              >
                Nhắc Nhở
              </Button>
            </>
          ) : (
            <Badge status="success" text="Đã hoàn tất" />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Học Phí (520 Học Viên)
          </Title>
          <Text type="secondary">Theo dõi tiến độ đóng học phí, gửi thông báo nhắc nhở và xác nhận thanh toán.</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic
              title="Tổng Học Phí Đã Thu"
              value={INITIAL_STATS.monthlyTuitionCollected}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic
              title="Học Phí Còn Nợ"
              value={INITIAL_STATS.monthlyTuitionPending}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 16 }}>
            <Statistic
              title="Tỷ Lệ Hoàn Thành"
              value={87.4}
              suffix="%"
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bodyStyle={{ padding: 12 }} style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} justify="space-between">
          <Col xs={24} sm={12}>
            <Input
              placeholder="Tìm kiếm theo tên học viên hoặc mã HV..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
            <Space>
              <Text strong>Trạng thái:</Text>
              <Select
                defaultValue="ALL"
                style={{ width: 140 }}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'ALL', label: 'Tất cả' },
                  { value: 'PAID', label: 'Đã Nộp' },
                  { value: 'UNPAID', label: 'Chưa Nộp' },
                  { value: 'OVERDUE', label: 'Quá Hạn' },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey="id"
        scroll={{ x: 800 }}
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={`Xác Nhận Nộp Học Phí - ${selectedStudent?.name}`}
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        onOk={() => handleConfirmPayment(selectedStudent?.id)}
        okText="Xác Nhận Đã Thu Tiền"
        cancelText="Hủy"
      >
        {selectedStudent && (
          <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 12 }}>
            <p><Text strong>Mã HV / Học viên:</Text> {selectedStudent.id} - {selectedStudent.name}</p>
            <p><Text strong>Lớp học:</Text> {selectedStudent.className}</p>
            <p><Text strong>Số tiền học phí tháng 8:</Text> <Text style={{ color: '#722ed1', fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(selectedStudent.amountDue)}</Text></p>
            <p><Text strong>Hình thức thanh toán:</Text> Chuyển khoản ngân hàng (QR Code / Bank Transfer)</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
