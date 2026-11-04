import React from 'react';
import { Row, Col, Card, Statistic, Tag, List, Button, Space, Typography } from 'antd';
import {
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  LinkOutlined,
  SoundOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';

const { Text } = Typography;

export const TeacherWorkspacePanel = ({ workspaceData, setActiveTab }) => {
  const { myClasses, myTimetable, myStudents, currentPayroll } = workspaceData;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#1890ff', borderRadius: 8 }}>
            <Statistic
              title="My Assigned Classes"
              value={myClasses.length}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix={`classes (${myStudents.length} profiled students)`}
              styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#52c41a', borderRadius: 8 }}>
            <Statistic
              title="Completed Sessions (Month)"
              value={currentPayroll.totalSessions}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="sessions"
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#722ed1', borderRadius: 8 }}>
            <Statistic
              title="My Monthly Salary"
              value={currentPayroll.totalSalary}
              formatter={(val) => formatCurrency(val)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<Space><CalendarOutlined /><Text strong>My Teaching Schedule & Classroom Check-In</Text></Space>}
            extra={<Button size="small" onClick={() => setActiveTab('schedules')}>Full Schedule</Button>}
          >
            <List
              dataSource={myTimetable}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="zoom"
                      type="primary"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => window.open(item.meetingLink, '_blank')}
                    >
                      Check-in & Launch Zoom
                    </Button>,
                    <Button
                      key="eval"
                      size="small"
                      icon={<SoundOutlined />}
                      onClick={() => setActiveTab('attendance')}
                    >
                      Attendance & Evaluate
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Tag color="blue">{item.day}</Tag>}
                    title={<Text strong>{item.className} ({item.timeSlot})</Text>}
                    description={
                      <Space>
                        <Tag color="purple">{item.platform}</Tag>
                        <Tag color={item.status === 'CHECKED_IN' ? 'green' : 'gold'}>
                          {item.status}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><Text strong>My Students Quick Review</Text></Space>}
            extra={<Button size="small" onClick={() => setActiveTab('attendance')}>All Student Profiles</Button>}
          >
            <List
              size="small"
              dataSource={myStudents}
              renderItem={(st) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{st.name} ({st.englishName}) — <Tag color="geekblue">{st.level}</Tag></Text>}
                    description={<Text type="secondary" style={{ fontSize: 12 }}>"{st.latestTeacherNote}"</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

