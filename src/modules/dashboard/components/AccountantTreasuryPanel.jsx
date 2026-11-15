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
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const AccountantTreasuryPanel = ({ accountantData = {} }) => {
  const { isEnglish, t } = useLanguage();
  const isMobile = useIsMobile();
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
        width: 90,
        render: (v) => <Tag color="blue" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>{v}</Tag>,
      },
      {
        title: isEnglish ? 'Student Name' : 'Học Viên',
        dataIndex: 'name',
        key: 'name',
        minWidth: 150,
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
        width: 140,
        render: (_, r) => (
          <div>
            <Text>{r.parentName || 'Phụ huynh'}</Text>
            {r.phone && (
              <div style={{ fontSize: 12, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
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
        width: 120,
        render: (v) => (
          <Text strong style={{ color: '#cf1322', whiteSpace: 'nowrap' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Due Date' : 'Hạn Nộp',
        dataIndex: 'dueDate',
        key: 'dueDate',
        width: 110,
        render: (v) => <Tag color="volcano" style={{ margin: 0, whiteSpace: 'nowrap' }}>{v || 'Trong tháng'}</Tag>,
      },
      {
        title: isEnglish ? 'Action' : 'Thao Tác',
        key: 'action',
        width: 100,
        render: (_, r) => (
          <Button
            type="primary"
            size="small"
            style={{ borderRadius: 6, backgroundColor: '#1890ff', whiteSpace: 'nowrap' }}
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
        width: 100,
        render: (v) => <Tag color="purple" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>{v}</Tag>,
      },
      {
        title: isEnglish ? 'Recipient' : 'Người Nhận',
        dataIndex: 'teacherName',
        key: 'teacherName',
        minWidth: 150,
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
        width: 120,
        render: (_, r) => (
          <div>
            <Text style={{ whiteSpace: 'nowrap' }}>{r.month || '11/2026'}</Text>
            {r.totalSessions && <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{r.totalSessions} buổi dạy</div>}
          </div>
        ),
      },
      {
        title: isEnglish ? 'Net Amount' : 'Thực Lĩnh',
        dataIndex: 'totalSalary',
        key: 'totalSalary',
        width: 120,
        render: (v) => (
          <Text strong style={{ color: '#16a34a', whiteSpace: 'nowrap' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Status' : 'Trạng Thái',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (v) => (
          <Tag color={v === 'APPROVED' ? 'gold' : v === 'PAID' ? 'green' : 'blue'} style={{ margin: 0, whiteSpace: 'nowrap' }}>
            {v || 'PENDING'}
          </Tag>
        ),
      },
      {
        title: isEnglish ? 'Action' : 'Thao Tác',
        key: 'action',
        width: 100,
        render: () => (
          <Button
            size="small"
            style={{ borderRadius: 6, whiteSpace: 'nowrap' }}
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
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 20 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #16a34a',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Tuition Collected' : 'Học Phí Đã Thu'}</Text>}
              value={totalCollected}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#16a34a', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#16a34a', fontWeight: 700, fontSize: isMobile ? 16 : 22, whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Paid:' : 'Biên lai:'} <Text strong>{paidCount}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #ff4d4f',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Pending Tuition' : 'Công Nợ Học Phí'}</Text>}
              value={totalPending}
              formatter={(v) => formatCurrency(v)}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#ff4d4f', fontWeight: 700, fontSize: isMobile ? 16 : 22, whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Unpaid:' : 'Chưa đóng:'} <Text strong>{unpaidCount}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Collection Rate' : 'Tỷ Lệ Thu Kỳ Này'}</Text>}
              value={collectionRate}
              suffix={<span style={{ fontSize: isMobile ? 12 : 14 }}>%</span>}
              prefix={<CheckCircleOutlined style={{ color: '#1890ff', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#1890ff', fontWeight: 700, fontSize: isMobile ? 18 : 22 } }}
            />
            <Progress percent={collectionRate} strokeColor="#1890ff" size="small" showInfo={false} style={{ marginTop: 4 }} />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #722ed1',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3 }}>{isEnglish ? 'Pending Payroll' : 'Lương Chờ Chi'}</Text>}
              value={totalPayrollToDisburse}
              formatter={(v) => formatCurrency(v)}
              prefix={<AuditOutlined style={{ color: '#722ed1', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 700, fontSize: isMobile ? 16 : 22, whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 10 : 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Slips:' : 'Phiếu duyệt:'} <Text strong>{pendingPayrolls.length}</Text>
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
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                  {isEnglish
                    ? (isMobile ? 'Aging Receivables' : 'Aging Tuition Receivables (Pending Payment)')
                    : (isMobile ? 'Công Nợ Học Phí' : 'Danh Sách Học Phí Chưa Đóng / Đến Hạn')}
                </span>
              </Space>
            }
            extra={
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/tuition-fees')}>
                {isEnglish ? (isMobile ? 'Treasury →' : 'Open Tuition Treasury →') : (isMobile ? 'Sổ thu →' : 'Vào Sổ Thu Học Phí →')}
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
          >
            <Table
              dataSource={agingTuitionList}
              columns={tuitionColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <AuditOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                  {isEnglish
                    ? (isMobile ? 'Pending Payrolls' : 'Payrolls Awaiting Payment')
                    : (isMobile ? 'Lương Chờ Chi' : 'Bảng Kê Lương Chờ Giải Ngân')}
                </span>
              </Space>
            }
            extra={
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/contracts-payroll')}>
                {isEnglish ? (isMobile ? 'Sheet →' : 'Payroll Sheet →') : (isMobile ? 'Sổ lương →' : 'Sổ Bảng Lương →')}
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
          >
            <Table
              dataSource={pendingPayrolls}
              columns={payrollColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

