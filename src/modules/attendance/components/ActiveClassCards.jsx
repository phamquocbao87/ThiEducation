import React from 'react';
import { Row, Col, Card, Tag, Button, Typography } from 'antd';
import {
  VideoCameraOutlined,
  LinkOutlined,
  StarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text, Paragraph } = Typography;

export const ActiveClassCards = ({
  classes,
  canCheckIn,
  canEvaluate,
  onCheckIn,
  onOpenEvaluate,
  onOpenStudentProfiles,
}) => {
  const { isEnglish, t } = useLanguage();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {classes.map((cls) => (
        <Col xs={24} sm={12} lg={8} key={cls.id}>
          <Card
            hoverable
            title={<Text strong style={{ color: '#1890ff' }}>{cls.name}</Text>}
            extra={
              <Tag color={cls.checkInStatus === 'CHECKED_IN' ? 'green' : 'purple'}>
                <VideoCameraOutlined />{' '}
                {cls.checkInStatus === 'CHECKED_IN'
                  ? (isEnglish ? 'Teacher Checked-in' : 'GV Đã Check-in')
                  : 'Zoom Cloud'}
              </Tag>
            }
            actions={[
              <Button
                key="join"
                type="primary"
                size="small"
                icon={<LinkOutlined />}
                style={{ background: '#2db7f5', borderColor: '#2db7f5' }}
                onClick={() => window.open(cls.meetingLink, '_blank')}
              >
                {isEnglish ? 'Launch Zoom' : 'Vào Zoom'}
              </Button>,
              canCheckIn && cls.checkInStatus !== 'CHECKED_IN' ? (
                <Button
                  key="checkin"
                  size="small"
                  type="dashed"
                  icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => onCheckIn(cls.id)}
                >
                  Check-in
                </Button>
              ) : (
                <Button
                  key="profiles"
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={() => onOpenStudentProfiles(cls)}
                >
                  {isEnglish ? 'Student Profiles' : 'Hồ Sơ HV'}
                </Button>
              ),
              canEvaluate ? (
                <Button
                  key="eval"
                  size="small"
                  icon={<StarOutlined style={{ color: '#faad14' }} />}
                  onClick={() => onOpenEvaluate(cls)}
                >
                  {isEnglish ? 'Take Attendance' : 'Điểm Danh'}
                </Button>
              ) : null,
            ].filter(Boolean)}
          >
            <Paragraph style={{ margin: 0 }}>
              <Text strong>{isEnglish ? 'Teacher:' : 'Giáo viên:'}</Text> {cls.teacherName}
            </Paragraph>
            <Paragraph style={{ margin: 0 }}>
              <Text strong>{isEnglish ? 'Roster:' : 'Sĩ số:'}</Text> {cls.totalStudents}{' '}
              {isEnglish ? 'students' : 'học viên'}
            </Paragraph>
            <Paragraph style={{ margin: 0 }}>
              <Text strong>{isEnglish ? 'Schedule:' : 'Lịch học:'}</Text> {cls.schedule}
            </Paragraph>
            <Paragraph style={{ margin: 0 }}>
              <Text strong>{isEnglish ? 'Operating Status:' : 'Tình trạng vận hành:'}</Text>{' '}
              <Tag color="cyan">{cls.operationStatus}</Tag>
            </Paragraph>
            {onOpenStudentProfiles && (
              <div style={{ marginTop: 8 }}>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, fontSize: 12 }}
                  onClick={() => onOpenStudentProfiles(cls)}
                >
                  {isEnglish ? 'View class roster & per-student feedback →' : 'Xem danh sách lớp & nhận xét từng học viên →'}
                </Button>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};
