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
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const TeacherWorkspacePanel = ({ workspaceData, setActiveTab }) => {
  const { isEnglish, t } = useLanguage();
  const { myClasses, myTimetable, myStudents, currentPayroll } = workspaceData;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#1890ff', borderRadius: 8 }}>
            <Statistic
              title={t('dashboard.teacherWorkspace.assignedClasses')}
              value={myClasses.length}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix={
                isEnglish
                  ? `classes (${myStudents.length} profiled students)`
                  : `lớp (${myStudents.length} hồ sơ học viên)`
              }
              styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#52c41a', borderRadius: 8 }}>
            <Statistic
              title={t('dashboard.teacherWorkspace.completedSessionsMonth')}
              value={currentPayroll.totalSessions}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={t('dashboard.teacherWorkspace.sessionsSuffix')}
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#722ed1', borderRadius: 8 }}>
            <Statistic
              title={t('dashboard.teacherWorkspace.monthlySalary')}
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
            title={
              <Space>
                <CalendarOutlined />
                <Text strong>{t('dashboard.teacherWorkspace.teachingScheduleTitle')}</Text>
              </Space>
            }
            extra={
              <Button size="small" onClick={() => setActiveTab('schedules')}>
                {t('dashboard.teacherWorkspace.btnFullSchedule')}
              </Button>
            }
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
                      {t('dashboard.teacherWorkspace.btnCheckinZoom')}
                    </Button>,
                    <Button
                      key="eval"
                      size="small"
                      icon={<SoundOutlined />}
                      onClick={() => setActiveTab('attendance')}
                    >
                      {t('dashboard.teacherWorkspace.btnEvaluateStudents')}
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
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>
                  {isEnglish ? 'My Students Quick Review' : 'Hồ Sơ Học Viên Phụ Trách'}
                </Text>
              </Space>
            }
            extra={
              <Button size="small" onClick={() => setActiveTab('attendance')}>
                {isEnglish ? 'All Student Profiles' : 'Tất Cả Hồ Sơ Học Viên'}
              </Button>
            }
          >
            <List
              size="small"
              dataSource={myStudents}
              renderItem={(st) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Text strong>
                        {st.name} ({st.englishName}) — <Tag color="geekblue">{st.level}</Tag>
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        "{st.latestTeacherNote}"
                      </Text>
                    }
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

export default TeacherWorkspacePanel;
