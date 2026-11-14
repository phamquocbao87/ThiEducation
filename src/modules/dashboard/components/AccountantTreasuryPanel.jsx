import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Tag, Table, Button, Space, Typography, Progress } from 'antd';
import {
  DollarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  ArrowRightOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const AccountantTreasuryPanel = ({ accountantData = {} }) => {
  const { isEnglish, t } = useLanguage();
  const navigate = useNavigate();

  const {
    totalCollected = 0,
    totalPending = 0,
    totalExpected = 0,
    collectionRate = 0,
    paidCount = 0,
    unpaidCount = 0,
    agingTuitionList = [],
    pendingPayrolls = [],
    totalPayrollToDisburse = 0,
  } = accountantData;

  const tuitionColumns = useMemo(
    () => [
      {
        title: isEnglish ? 'Bill ID' : 'Mã Hóa Đơn',
        dataIndex: 'id',
        key: 'id',
        render: (v) => <Tag color="blue" style={{ fontWeight: 700 }}>{v}</Tag>,
      },
      {
        title: isEnglish ? 'Student Name' : 'Học Viên',
        dataIndex: 'name',
        key: 'name',
        render: (v, r) => (
          <div>
            <Text strong style={{ color: '#0958d9' }}>{v}</Text>
            <div style={{ fontSize: 12, color: '#64748b' }}>{r.studentCode || r.studentId} • {r.className}</div>
          </div>
        ),
      },
      {
        title: isEnglish ? 'Parent Contact' : 'Phụ Huynh & SĐT',
        key: 'parent',
        render: (_, r) => (
          <div>
            <Text>{r.parentName || 'Phụ huynh'}</Text>
            {r.phone && (
              <div style={{ fontSize: 12, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4 }}>
                <PhoneOutlined /> {r.phone}
              </div>
            )}
          </div>
        ),
      },
      {
        title: isEnglish ? 'Amount Due' : 'Học Phí Phải Thu',
        dataIndex: 'amountDue',
        key: 'amountDue',
        render: (v) => (
          <Text strong style={{ color: '#cf1322' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Due Date' : 'Hạn Nộp',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: (v) => <Tag color="volcano">{v || 'Trong tháng'}</Tag>,
      },
      {
        title: isEnglish ? 'Action' : 'Thao Tác',
        key: 'action',
        render: (_, r) => (
          <Button
            type="primary"
            size="small"
            style={{ borderRadius: 6, backgroundColor: '#1890ff' }}
            onClick={() => navigate('/tuition-fees')}
          >
            {isEnglish ? 'Reconcile' : 'Đối Soát Thu'}
          </Button>
        ),
      },
    ],
    [isEnglish, navigate]
  );

  const payrollColumns = useMemo(
    () => [
      {
        title: isEnglish ? 'Payroll ID' : 'Mã Phiếu Lương',
        dataIndex: 'id',
        key: 'id',
        render: (v) => <Tag color="purple" style={{ fontWeight: 700 }}>{v}</Tag>,
      },
      {
        title: isEnglish ? 'Recipient' : 'Người Nhận',
        dataIndex: 'teacherName',
        key: 'teacherName',
        render: (v, r) => (
          <div>
            <Text strong>{v || r.name}</Text>
            <div style={{ fontSize: 12, color: '#64748b' }}>{r.teacherId || r.id}</div>
          </div>
        ),
      },
      {
        title: isEnglish ? 'Month / Sessions' : 'Kỳ Lương / Số Buổi',
        key: 'month',
        render: (_, r) => (
          <div>
            <Text>{r.month || '11/2026'}</Text>
            {r.totalSessions && <div style={{ fontSize: 12, color: '#64748b' }}>{r.totalSessions} buổi dạy</div>}
          </div>
        ),
      },
      {
        title: isEnglish ? 'Net Amount' : 'Thực Lĩnh',
        dataIndex: 'totalSalary',
        key: 'totalSalary',
        render: (v) => (
          <Text strong style={{ color: '#16a34a' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Status' : 'Trạng Thái',
        dataIndex: 'status',
        key: 'status',
        render: (v) => (
          <Tag color={v === 'APPROVED' ? 'gold' : v === 'PAID' ? 'green' : 'blue'}>
            {v || 'PENDING'}
          </Tag>
        ),
      },
      {
        title: isEnglish ? 'Action' : 'Thao Tác',
        key: 'action',
        render: () => (
          <Button
            size="small"
            style={{ borderRadius: 6 }}
            onClick={() => navigate('/contracts-payroll')}
          >
            {isEnglish ? 'Disburse' : 'Chi Lương'}
          </Button>
        ),
      },
    ],
    [isEnglish, navigate]
  );

  return (
    <div>
      {/* 1. Hàng Thống Kê Dòng Tiền & Quỹ Lương */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #16a34a',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Tuition Collected (Month)' : 'Học Phí Đã Thu Thực Tế'}</Text>}
              value={totalCollected}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
              styles={{ content: { color: '#16a34a', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Reconciled bills:' : 'Biên lai đã đối soát:'} <Text strong>{paidCount}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #ff4d4f',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Pending Tuition (Receivables)' : 'Học Phí Chưa Thu / Công Nợ'}</Text>}
              value={totalPending}
              formatter={(v) => formatCurrency(v)}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              styles={{ content: { color: '#ff4d4f', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Pending students:' : 'Học viên chưa đóng:'} <Text strong>{unpaidCount}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Collection Completion Rate' : 'Tỷ Lệ Thu Học Phí Kỳ Này'}</Text>}
              value={collectionRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff', fontWeight: 700 } }}
            />
            <Progress percent={collectionRate} strokeColor="#1890ff" size="small" showInfo={false} style={{ marginTop: 8 }} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #722ed1',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Pending Payroll Disbursement' : 'Quỹ Lương Chờ Giải Ngân'}</Text>}
              value={totalPayrollToDisburse}
              formatter={(v) => formatCurrency(v)}
              prefix={<AuditOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Approved slips:' : 'Phiếu lương đã duyệt:'} <Text strong>{pendingPayrolls.length}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2. Bảng Công Nợ Học Phí & Bảng Kê Giải Ngân Lương */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? 'Aging Tuition Receivables (Pending Payment)' : 'Danh Sách Học Phí Chưa Đóng / Đến Hạn Đối Soát'}
                </span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/tuition-fees')}>
                {isEnglish ? 'Open Tuition Treasury' : 'Vào Sổ Thu Học Phí'} <ArrowRightOutlined />
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Table
              dataSource={agingTuitionList}
              columns={tuitionColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="middle"
              scroll={{ x: 650 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <AuditOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? 'Payrolls Awaiting Payment' : 'Bảng Kê Lương Chờ Giải Ngân'}
                </span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/contracts-payroll')}>
                {isEnglish ? 'Payroll Sheet' : 'Sổ Bảng Lương'} <ArrowRightOutlined />
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Table
              dataSource={pendingPayrolls}
              columns={payrollColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="middle"
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

