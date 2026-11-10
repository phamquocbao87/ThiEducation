import React, { useMemo } from 'react';
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
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const ExecutiveOverviewPanel = ({ summary, role, setActiveTab }) => {
  const { isEnglish, language, t } = useLanguage();

  const courseColumns = useMemo(
    () => [
      {
        title: t('dashboard.executive.tableCourseCode'),
        dataIndex: 'id',
        key: 'id',
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: t('dashboard.executive.tableCourseName'),
        dataIndex: 'name',
        key: 'name',
        render: (v) => (
          <Text strong style={{ color: '#1890ff' }}>
            {v}
          </Text>
        ),
      },
      {
        title: t('dashboard.executive.tableLevel'),
        dataIndex: 'level',
        key: 'level',
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: t('dashboard.executive.tableActiveClasses'),
        dataIndex: 'activeClasses',
        key: 'activeClasses',
        render: (v) => `${v} ${t('dashboard.executive.unitClasses')}`,
      },
      {
        title: t('dashboard.executive.tableEnrolledStudents'),
        dataIndex: 'enrolledStudents',
        key: 'enrolledStudents',
        render: (v) => (
          <Tag color="purple">
            {v} {t('dashboard.executive.unitStudents')}
          </Tag>
        ),
      },
      {
        title: t('dashboard.executive.tableFeePerMonth'),
        dataIndex: 'feePerMonth',
        key: 'feePerMonth',
        render: (v) => formatCurrency(v),
      },
    ],
    [isEnglish, language, t]
  );

  const staffColumns = useMemo(
    () => [
      {
        title: t('dashboard.executive.tableStaffCode'),
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: t('dashboard.executive.tableStaffName'),
        dataIndex: 'name',
        key: 'name',
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: t('dashboard.executive.tableStaffPosition'),
        dataIndex: 'position',
        key: 'position',
      },
      {
        title: t('dashboard.executive.tableManagedClasses'),
        dataIndex: 'managedClasses',
        key: 'managedClasses',
        render: (v) => (
          <Tag color="cyan">
            {v} {t('dashboard.executive.unitClasses')}
          </Tag>
        ),
      },
      {
        title: t('dashboard.executive.tableManagedStudents'),
        dataIndex: 'managedStudents',
        key: 'managedStudents',
        render: (v) => `${v} ${t('dashboard.executive.unitStudents')}`,
      },
      {
        title: t('dashboard.executive.tableKpiRate'),
        dataIndex: 'completedTasks',
        key: 'completedTasks',
        render: (v) => <Progress percent={v} size="small" />,
      },
      {
        title: t('dashboard.executive.tableTotalSalary'),
        dataIndex: 'totalSalary',
        key: 'totalSalary',
        render: (v) => (
          <Text strong style={{ color: '#722ed1' }}>
            {formatCurrency(v)}
          </Text>
        ),
      },
    ],
    [isEnglish, language, t]
  );

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderColor: '#1890ff', borderRadius: 8 }}
            onClick={() => setActiveTab('attendance')}
          >
            <Statistic
              title={t('dashboard.executive.statsStudentsClasses')}
              value={summary.totalStudents}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix={t('dashboard.executive.unitStudents')}
              styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {summary.totalClasses} {t('dashboard.executive.unitClasses')}{' '}
              {isEnglish
                ? `in ${summary.totalCourses} courses`
                : `thuộc ${summary.totalCourses} khóa học`}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderColor: '#52c41a', borderRadius: 8 }}
            onClick={() => setActiveTab('contracts')}
          >
            <Statistic
              title={t('dashboard.executive.statsTeachersStaff')}
              value={summary.totalTeachers}
              prefix={<GlobalOutlined style={{ color: '#52c41a' }} />}
              suffix={t('dashboard.executive.nativeTeachersSuffix')}
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              + {summary.totalAcademicStaff}{' '}
              {isEnglish ? 'Academic Specialists' : 'Chuyên viên Giáo vụ'}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderColor: '#722ed1', borderRadius: 8 }}
            onClick={() => setActiveTab('tuition')}
          >
            <Statistic
              title={t('dashboard.executive.statsTuitionMonth')}
              value={summary.monthlyTuitionCollected}
              formatter={(val) => formatCurrency(val)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold', fontSize: 19 } }}
            />
            <Progress
              percent={summary.tuitionCollectionRate}
              size="small"
              strokeColor="#722ed1"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderColor: '#fa8c16', borderRadius: 8 }}
            onClick={() => setActiveTab('contracts')}
          >
            <Statistic
              title={t('dashboard.executive.statsTotalSalary')}
              value={summary.monthlyPayrollTotal + summary.monthlyStaffPayrollTotal}
              formatter={(val) => formatCurrency(val)}
              prefix={<FileDoneOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 'bold', fontSize: 19 } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isEnglish ? 'Teachers' : 'GV'}: {formatCurrency(summary.monthlyPayrollTotal)} |{' '}
              {isEnglish ? 'Staff' : 'Giáo vụ'}:{' '}
              {formatCurrency(summary.monthlyStaffPayrollTotal)}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 20 }}
        title={
          <Space>
            <BookOutlined style={{ color: '#1890ff' }} />
            <Text strong>{t('dashboard.executive.courseCatalogCardTitle')}</Text>
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => setActiveTab('schedules')}
            >
              {t('dashboard.executive.btnManageSchedules')}
            </Button>
            <Button size="small" type="primary" onClick={() => setActiveTab('attendance')}>
              {t('dashboard.executive.btnMonitorAttendance')}
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
          title={
            <Space>
              <UserSwitchOutlined style={{ color: '#722ed1' }} />
              <Text strong>{t('dashboard.executive.staffPerformanceTitle')}</Text>
            </Space>
          }
          extra={
            <Button size="small" onClick={() => setActiveTab('contracts')}>
              {isEnglish ? 'Reconcile Staff & Teacher Payroll' : 'Đối Soát Lương Giáo Vụ & GV'}
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

export default ExecutiveOverviewPanel;
