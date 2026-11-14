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
import { detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';

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
      {classes.map((cls) => {
        const platform = detectMeetingPlatform(cls.meetingLink || cls.zoomStudentLink);
        const isMeet = platform.type === 'google_meet';

        return (
          <Col xs={24} sm={12} lg={8} key={cls.id}>
            <Card
              hoverable
              title={<Text strong style={{ color: '#1890ff' }}>{cls.name}</Text>}
              extra={
                <Tag color={cls.checkInStatus === 'CHECKED_IN' ? 'green' : (isMeet ? 'green' : 'blue')}>
                  {platform.iconSmall || <VideoCameraOutlined />} {cls.checkInStatus === 'CHECKED_IN'
                    ? (isEnglish ? 'Teacher Checked-in' : 'GV Đã Check-in')
                    : platform.label}
                </Tag>
              }
              actions={[
                <Button
                  key="join"
                  type="primary"
                  size="small"
                  icon={platform.iconSmall || <LinkOutlined />}
                  style={{
                    background: isMeet ? '#0f9d58' : '#1890ff',
                    borderColor: isMeet ? '#0f9d58' : '#1890ff',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  onClick={() => window.open(cls.meetingLink || cls.zoomStudentLink, '_blank')}
                >
                  {isEnglish ? (isMeet ? 'Meet' : 'Join') : (isMeet ? 'Meet' : 'Vào Lớp')}
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
      );
    })}
  </Row>
  );
};
