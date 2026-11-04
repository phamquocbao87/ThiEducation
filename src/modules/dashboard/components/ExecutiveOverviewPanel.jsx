import React from 'react';
import { Row, Col, Card, Statistic, Tag, Progress, Table, Button, Space, Typography } from 'antd';
import {
  TeamOutlined,
  GlobalOutlined,
  DollarOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  BookOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';

const { Text } = Typography;

export const ExecutiveOverviewPanel = ({ summary, role, setActiveTab }) => {
  const courseColumns = [
    { title: 'Mã KH', dataIndex: 'id', key: 'id', render: (v) => <Text strong>{v}</Text> },
    { title: 'Tên Khóa Học', dataIndex: 'name', key: 'name', render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text> },
    { title: 'Trình Độ', dataIndex: 'level', key: 'level', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Số Lớp Đang Mở', dataIndex: 'activeClasses', key: 'activeClasses', render: (v) => `${v} lớp` },
    { title: 'Học Viên', dataIndex: 'enrolledStudents', key: 'enrolledStudents', render: (v) => <Tag color="purple">{v} HV</Tag> },
    { title: 'Học Phí / Tháng', dataIndex: 'feePerMonth', key: 'feePerMonth', render: (v) => formatCurrency(v) },
  ];

  const staffColumns = [
    { title: 'Mã NV', dataIndex: 'id', key: 'id' },
    { title: 'Nhân Viên Giáo Vụ', dataIndex: 'name', key: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: 'Vị Trí Phụ Trách', dataIndex: 'position', key: 'position' },
    { title: 'Lớp Quản Lý', dataIndex: 'managedClasses', key: 'managedClasses', render: (v) => <Tag color="cyan">{v} lớp</Tag> },
    { title: 'Học Viên Phụ Trách', dataIndex: 'managedStudents', key: 'managedStudents', render: (v) => `${v} HV` },
    { title: 'Tỷ Lệ Hoàn Thành KPI', dataIndex: 'completedTasks', key: 'completedTasks', render: (v) => <Progress percent={v} size="small" /> },
    { title: 'Tổng Lương Tháng', dataIndex: 'totalSalary', key: 'totalSalary', render: (v) => <Text strong style={{ color: '#722ed1' }}>{formatCurrency(v)}</Text> },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderColor: '#1890ff', borderRadius: 8 }} onClick={() => setActiveTab('attendance')}>
            <Statistic
              title="Tổng Học Viên & Lớp Học"
              value={summary.totalStudents}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix="HV"
              styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{summary.totalClasses} lớp thuộc {summary.totalCourses} khóa học</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }} onClick={() => setActiveTab('contracts')}>
            <Statistic
              title="Đội Ngũ GV & Giáo Vụ"
              value={summary.totalTeachers}
              prefix={<GlobalOutlined style={{ color: '#52c41a' }} />}
              suffix="GV Native"
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>+ {summary.totalAcademicStaff} Chuyên viên Giáo vụ</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderColor: '#722ed1', borderRadius: 8 }} onClick={() => setActiveTab('tuition')}>
            <Statistic
              title="Thu Học Phí Tháng Này"
              value={summary.monthlyTuitionCollected}
              formatter={(val) => formatCurrency(val)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold', fontSize: 19 } }}
            />
            <Progress percent={summary.tuitionCollectionRate} size="small" strokeColor="#722ed1" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderColor: '#fa8c16', borderRadius: 8 }} onClick={() => setActiveTab('contracts')}>
            <Statistic
              title="Tổng Chi Lương (GV & Giáo Vụ)"
              value={summary.monthlyPayrollTotal + summary.monthlyStaffPayrollTotal}
              formatter={(val) => formatCurrency(val)}
              prefix={<FileDoneOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 'bold', fontSize: 19 } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              GV: {formatCurrency(summary.monthlyPayrollTotal)} | Giáo vụ: {formatCurrency(summary.monthlyStaffPayrollTotal)}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 20 }}
        title={<Space><BookOutlined style={{ color: '#1890ff' }} /><Text strong>Danh Mục Khóa Học & Tình Trạng Vận Hành Các Lớp</Text></Space>}
        extra={
          <Space>
            <Button size="small" icon={<CalendarOutlined />} onClick={() => setActiveTab('schedules')}>
              Quản Lý Khóa Học & TKB
            </Button>
            <Button size="small" type="primary" onClick={() => setActiveTab('attendance')}>
              Giám Sát Lớp Học & Điểm Danh
            </Button>
          </Space>
        }
      >
        <Table
          columns={courseColumns}
          dataSource={summary.courses}
          rowKey="id"
          pagination={false}
          scroll={{ x: 750 }}
          size="small"
        />
      </Card>

      {(role === 'director' || role === 'accountant' || role === 'academic') && (
        <Card
          style={{ marginTop: 20 }}
          title={<Space><UserSwitchOutlined style={{ color: '#722ed1' }} /><Text strong>Hoạt Động Vận Hành & Bảng Lương Đội Ngũ Nhân Viên Giáo Vụ</Text></Space>}
          extra={
            <Button size="small" onClick={() => setActiveTab('contracts')}>
              Đối Soát Lương Giáo Vụ & GV
            </Button>
          }
        >
          <Table
            columns={staffColumns}
            dataSource={summary.academicStaff}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

