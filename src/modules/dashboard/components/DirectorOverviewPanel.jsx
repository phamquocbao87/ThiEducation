import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Tag, Table, Progress, Button, Space, Typography } from 'antd';
import {
  DollarOutlined,
  TeamOutlined,
  GlobalOutlined,
  BookOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const DirectorOverviewPanel = ({ directorData = {} }) => {
  const { isEnglish, t } = useLanguage();
  const navigate = useNavigate();

  const {
    totalStudents = 0,
    totalTeachers = 0,
    totalAcademicStaff = 0,
    totalClasses = 0,
    totalCourses = 0,
    paidTuitionTotal = 0,
    pendingTuitionTotal = 0,
    totalPayrollCommitted = 0,
    grossProfit = 0,
    fillRate = 0,
    courseStats = [],
  } = directorData;

  const courseColumns = useMemo(
    () => [
      {
        title: isEnglish ? 'Course ID' : 'Mã Khóa Học',
        dataIndex: 'id',
        key: 'id',
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: isEnglish ? 'Program / Curriculum' : 'Chương Trình Đào Tạo',
        dataIndex: 'name',
        key: 'name',
        render: (v) => (
          <Text strong style={{ color: '#1890ff' }}>
            {v}
          </Text>
        ),
      },
      {
        title: isEnglish ? 'Level' : 'Cấp Độ',
        dataIndex: 'level',
        key: 'level',
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: isEnglish ? 'Active Classes' : 'Số Lớp Đang Mở',
        dataIndex: 'activeClassesCount',
        key: 'activeClassesCount',
        render: (v) => `${v} ${isEnglish ? 'classes' : 'lớp'}`,
      },
      {
        title: isEnglish ? 'Enrolled Students' : 'Học Viên Đang Học',
        dataIndex: 'studentCount',
        key: 'studentCount',
        render: (v) => (
          <Tag color="purple">
            {v} {isEnglish ? 'students' : 'học viên'}
          </Tag>
        ),
      },
      {
        title: isEnglish ? 'Realized Revenue' : 'Doanh Thu Thực Thu',
        dataIndex: 'courseTuition',
        key: 'courseTuition',
        render: (v) => (
          <Text strong style={{ color: '#16a34a' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
    ],
    [isEnglish]
  );

  return (
    <div>
      {/* 1. Hàng Thống Kê 4 Thẻ KPI Chiến Lược */}
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
              title={<Text strong>{isEnglish ? 'Monthly Realized Revenue' : 'Doanh Thu Học Phí Thực Thu'}</Text>}
              value={paidTuitionTotal}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
              styles={{ content: { color: '#16a34a', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Pending collection:' : 'Đang chờ đối soát:'}{' '}
              <Text strong>{formatCurrency(pendingTuitionTotal)}</Text>
            </div>
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
              title={<Text strong>{isEnglish ? 'Total Committed Payroll' : 'Tổng Quỹ Lương Nhân Sự'}</Text>}
              value={totalPayrollCommitted}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Faculty & Staff:' : 'Giáo viên & Giáo vụ:'}{' '}
              <Text strong>{totalTeachers + totalAcademicStaff} {isEnglish ? 'members' : 'nhân sự'}</Text>
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
              title={<Text strong>{isEnglish ? 'Estimated Gross Margin' : 'Lợi Nhuận Gộp Đào Tạo'}</Text>}
              value={grossProfit}
              formatter={(v) => formatCurrency(v)}
              prefix={<RiseOutlined style={{ color: grossProfit >= 0 ? '#1890ff' : '#cf1322' }} />}
              styles={{ content: { color: grossProfit >= 0 ? '#1890ff' : '#cf1322', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Revenue minus payroll costs' : 'Doanh thu trừ chi phí giảng dạy'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #fa8c16',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Average Class Fill Rate' : 'Tỷ Lệ Lấp Đầy Lớp Học'}</Text>}
              value={fillRate}
              suffix="%"
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 700 } }}
            />
            <Progress percent={fillRate} strokeColor="#fa8c16" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>
      </Row>

      {/* 2. Quy Mô Toàn Hệ Thống & Phân Bổ Chương Trình Đào Tạo */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? 'Curriculum Scale & Revenue Breakdown' : 'Quy Mô Khóa Học & Phân Bổ Doanh Thu Thực Tế'}
                </span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/courses-classes')}>
                {isEnglish ? 'View All Courses' : 'Xem Tất Cả Khóa Học'} <ArrowRightOutlined />
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Table
              dataSource={courseStats}
              columns={courseColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: 700 }}>
                  {isEnglish ? 'System Capacity & Executive Shortcuts' : 'Tổng Thể Quy Mô & Điều Hành'}
                </span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <Space>
                  <TeamOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                  <Text>{isEnglish ? 'Active Students:' : 'Học viên đang học:'}</Text>
                </Space>
                <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {totalStudents} {isEnglish ? 'Students' : 'Học viên'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <Space>
                  <GlobalOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <Text>{isEnglish ? 'Foreign Teachers:' : 'Giáo viên bản xứ:'}</Text>
                </Space>
                <Tag color="green" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {totalTeachers} {isEnglish ? 'Teachers' : 'Giáo viên'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                  <Text>{isEnglish ? 'Academic Coordinators:' : 'Cán bộ giáo vụ:'}</Text>
                </Space>
                <Tag color="purple" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {totalAcademicStaff} {isEnglish ? 'Staff' : 'Nhân sự'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <Space>
                  <BookOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                  <Text>{isEnglish ? 'Active Classes:' : 'Lớp học đang vận hành:'}</Text>
                </Space>
                <Tag color="orange" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {totalClasses} {isEnglish ? 'Classes' : 'Lớp học'}
                </Tag>
              </div>

              <Button
                type="primary"
                block
                size="large"
                style={{ marginTop: 8, borderRadius: 8, height: 42, fontWeight: 600 }}
                onClick={() => navigate('/user-management')}
              >
                {isEnglish ? 'Manage All Users & Directory' : 'Quản Trị Người Dùng & Nhân Sự'}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

