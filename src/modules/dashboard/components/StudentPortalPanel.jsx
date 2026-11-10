import React from 'react';
import { Row, Col, Card, Statistic, Tag, List, Button, Space, Typography, Rate, Descriptions } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LinkOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const StudentPortalPanel = ({ portalData, setActiveTab }) => {
  const { isEnglish, t } = useLanguage();
  const { studentProfile, myTimetable, myHomeworks } = portalData;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#1890ff', borderRadius: 8 }}>
            <Statistic
              title={t('dashboard.studentPortal.enrolledClass')}
              value={studentProfile.className}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff', fontWeight: 'bold', fontSize: 16 } }}
            />
            <Tag color="blue" style={{ marginTop: 6 }}>
              {t('dashboard.studentPortal.levelPrefix')}{studentProfile.level}
            </Tag>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#52c41a', borderRadius: 8 }}>
            <Statistic
              title={t('dashboard.studentPortal.attendanceHomework')}
              value={studentProfile.attendanceRate}
              suffix={`% (${myHomeworks.length} ${isEnglish ? 'assignments' : 'bài tập'})`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setActiveTab('attendance')}>
              {t('dashboard.studentPortal.btnViewSubmitHomework')}
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#722ed1', borderRadius: 8 }}>
            <Statistic
              title={t('dashboard.studentPortal.tuitionInfo')}
              value={studentProfile.amountDue}
              formatter={(val) => formatCurrency(val)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }}
            />
            <Tag color={studentProfile.tuitionStatus === 'PAID' ? 'green' : 'volcano'} style={{ marginTop: 6 }}>
              {studentProfile.tuitionStatus === 'PAID'
                ? t('dashboard.studentPortal.tuitionPaidTag')
                : t('dashboard.studentPortal.tuitionDueTag')}
            </Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text strong>{t('dashboard.studentPortal.personalProfileTitle')}</Text>
              </Space>
            }
          >
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={t('dashboard.studentPortal.fullNameLabel')}>
                {studentProfile.name} ({studentProfile.englishName})
              </Descriptions.Item>
              <Descriptions.Item label={t('dashboard.studentPortal.studentCodeLabel')}>
                {studentProfile.id} — {t('dashboard.studentPortal.agePrefix')}{studentProfile.age}
              </Descriptions.Item>
              <Descriptions.Item label={t('dashboard.studentPortal.parentLabel')}>
                {studentProfile.parentName} ({studentProfile.phone})
              </Descriptions.Item>
              <Descriptions.Item label={t('dashboard.studentPortal.latestFeedbackLabel')}>
                <Text italic style={{ color: '#389e0d' }}>
                  "{studentProfile.latestTeacherNote}"
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12, padding: 10, background: '#fafafa', borderRadius: 6 }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  {t('dashboard.studentPortal.pronunciationSkill')}:{' '}
                  <Rate disabled defaultValue={studentProfile.pronunciationScore} style={{ fontSize: 12 }} />
                </Col>
                <Col span={12}>
                  {t('dashboard.studentPortal.spellingSkill')}:{' '}
                  <Rate disabled defaultValue={studentProfile.spellingScore} style={{ fontSize: 12 }} />
                </Col>
                <Col span={12}>
                  {t('dashboard.studentPortal.seriousnessSkill')}:{' '}
                  <Rate disabled defaultValue={studentProfile.seriousnessScore} style={{ fontSize: 12 }} />
                </Col>
                <Col span={12}>
                  {t('dashboard.studentPortal.listeningSkill')}:{' '}
                  <Rate disabled defaultValue={studentProfile.listeningScore} style={{ fontSize: 12 }} />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FormOutlined style={{ color: '#722ed1' }} />
                <Text strong>{t('dashboard.studentPortal.homeworkListTitle')}</Text>
              </Space>
            }
            extra={
              <Button size="small" type="primary" onClick={() => setActiveTab('attendance')}>
                {t('dashboard.studentPortal.btnSubmitNow')}
              </Button>
            }
          >
            <List
              size="small"
              header={<Text strong>{isEnglish ? 'Assigned Homework List:' : 'Danh sách Bài tập được giao:'}</Text>}
              dataSource={myHomeworks}
              renderItem={(hw) => (
                <List.Item
                  extra={
                    <Tag color={hw.status === 'SUBMITTED' ? 'green' : 'orange'}>
                      {hw.status === 'SUBMITTED'
                        ? `${isEnglish ? 'Submitted' : 'Đã nộp'} (${hw.score})`
                        : (isEnglish ? 'Pending' : 'Chưa nộp')}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={<Text strong>{hw.title}</Text>}
                    description={`${isEnglish ? 'Due Date' : 'Hạn nộp'}: ${hw.dueDate} | ${isEnglish ? 'Teacher Note' : 'Ghi chú GV'}: ${hw.teacherComment}`}
                  />
                </List.Item>
              )}
            />

            <List
              style={{ marginTop: 12 }}
              size="small"
              header={
                <Text strong>
                  {isEnglish
                    ? `Live Zoom Schedule for Class ${studentProfile.classId}:`
                    : `Lịch học Zoom của lớp ${studentProfile.classId}:`}
                </Text>
              }
              dataSource={myTimetable}
              renderItem={(slot) => (
                <List.Item
                  actions={[
                    <Button
                      key="join"
                      type="primary"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => window.open(slot.meetingLink, '_blank')}
                    >
                      {t('dashboard.studentPortal.btnJoinClass')}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={`${slot.day} (${slot.timeSlot}) — ${slot.subject}`}
                    description={`${isEnglish ? 'Teacher' : 'Giáo viên'}: ${slot.teacherName}`}
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

export default StudentPortalPanel;
