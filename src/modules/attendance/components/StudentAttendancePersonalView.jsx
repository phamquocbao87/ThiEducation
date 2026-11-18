import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Table, Rate, Button, Popover, Empty, Tabs, Avatar } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  BookOutlined,
  StarFilled,
  CalendarOutlined,
  FormOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { FormattedText } from '../../../shared/components/controls/FormattedText';
import { HomeworkAssignmentPanel } from './HomeworkAssignmentPanel';

const { Title, Text, Paragraph } = Typography;

export const StudentAttendancePersonalView = ({
  currentUser,
  myClass,
  myPersonalAttendances = [],
  scopedHomeworks = [],
  personalStats = {},
  onSubmitHomework,
}) => {
  const { t, isEnglish } = useLanguage();

  const studentName = currentUser?.name || 'Học viên';
  const studentEnglishName = currentUser?.englishName || studentName;
  const studentCode = currentUser?.code || currentUser?.id || 'HV';
  const className = myClass?.name || 'Wonders Online Class';
  const courseLevel = myClass?.courseLevel || myClass?.level || 'McGraw-Hill Wonders Grade 5';
  const teacherName = myClass?.teacherName || 'Teacher Maj';

  const columns = useMemo(
    () => [
      {
        title: isEnglish ? 'Session Date' : 'Ngày Học',
        dataIndex: 'date',
        key: 'date',
        width: 130,
        render: (dateStr, record) => (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <Text strong>{dateStr || (record.sessionStart ? new Date(record.sessionStart).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN') : '—')}</Text>
          </Space>
        ),
      },
      {
        title: isEnglish ? 'Classroom & Teacher' : 'Lớp Học & Giáo Viên',
        key: 'classInfo',
        width: 180,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: '#0958d9', fontSize: 13 }}>
              {record.className || className}
            </Text>
            <Tag color="geekblue" style={{ borderRadius: 4, margin: 0, width: 'fit-content' }}>
              <GlobalOutlined /> {record.teacherName || teacherName}
            </Tag>
          </Space>
        ),
      },
      {
        title: isEnglish ? 'My Attendance' : 'Điểm Danh Của Bạn',
        key: 'presence',
        width: 150,
        render: (_, record) => {
          const isOnline = record.myPresence === 'ONLINE';
          return isOnline ? (
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              style={{ padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}
            >
              {isEnglish ? 'Online · Present' : 'Online · Có mặt'}
            </Tag>
          ) : (
            <Tag
              color="error"
              icon={<CloseCircleOutlined />}
              style={{ padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}
            >
              {isEnglish ? 'Absent' : 'Vắng mặt'}
            </Tag>
          );
        },
      },
      {
        title: isEnglish ? "Teacher's Rating" : 'Đánh Giá Của Thầy Cô',
        key: 'stars',
        width: 160,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Rate disabled value={record.myStars || 5} style={{ fontSize: 13, color: '#faad14' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.myStars || 5}/5 {isEnglish ? 'Stars' : 'Sao'}
            </Text>
          </Space>
        ),
      },
      {
        title: isEnglish ? "Teacher's Direct Feedback" : 'Lời Nhận Xét Sư Phạm Từ Giáo Viên',
        key: 'comment',
        render: (_, record) => {
          const feedback = record.myComment || record.myEvaluation?.comment;
          if (feedback === '__ABSENT__') {
            return (
              <Tag color="default" style={{ borderRadius: 6 }}>
                {isEnglish ? 'Absent from session' : 'Vắng mặt buổi học'}
              </Tag>
            );
          }

          if (!feedback || feedback === '__PENDING__') {
            return (
              <Space direction="vertical" size={2} data-testid="teacher-feedback-pending">
                <Tag color="orange" icon={<ClockCircleOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                  {isEnglish ? 'Feedback Updating' : 'Đang cập nhật nhận xét'}
                </Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {isEnglish
                    ? 'Native teacher will post evaluation after review.'
                    : 'Giáo viên bản xứ đang hoàn thiện nhận xét sau giờ học.'}
                </Text>
              </Space>
            );
          }

          const isLong = feedback.length > 90;
          return (
            <div
              style={{
                backgroundColor: '#f6f9fe',
                border: '1px solid #d0e2ff',
                borderRadius: 8,
                padding: '8px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                maxWidth: 440,
              }}
              data-testid="teacher-feedback-callout"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space size={4}>
                  <MessageOutlined style={{ color: '#1677ff', fontSize: 12 }} />
                  <Text strong style={{ fontSize: 11, color: '#0958d9' }}>
                    {isEnglish ? "Teacher's Remark" : 'Nhận Xét Sư Phạm'}
                  </Text>
                </Space>
                <Tag color="geekblue" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4, lineHeight: '18px' }}>
                  {record.evaluatedByName || 'Teacher Maj'}
                </Tag>
              </div>
              <div style={{ color: '#1f1f1f', fontSize: 12.5, lineHeight: '19px', fontStyle: 'italic' }}>
                "{isLong ? `${feedback.slice(0, 85)}...` : feedback}"
              </div>
              {isLong && (
                <div style={{ marginTop: 4, textAlign: 'right' }}>
                  <Popover
                    title={
                      <Space>
                        <MessageOutlined style={{ color: '#1677ff' }} />
                        <span>{isEnglish ? "Teacher Maj's Full Evaluation" : 'Toàn Văn Nhận Xét Của Giáo Viên'}</span>
                      </Space>
                    }
                    content={
                      <div style={{ maxWidth: 380, padding: '4px 0', lineHeight: '22px' }}>
                        <FormattedText content={feedback} />
                      </div>
                    }
                    trigger="click"
                  >
                    <Button type="link" size="small" style={{ padding: 0, fontSize: 11, fontWeight: 600, height: 'auto' }}>
                      {isEnglish ? '🔍 Read full feedback' : '🔍 Xem chi tiết lời khen & dặn dò'}
                    </Button>
                  </Popover>
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: isEnglish ? 'Recorded Video' : 'Video Buổi Học',
        key: 'video',
        width: 130,
        render: (_, record) =>
          record.recordingUrl ? (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<PlayCircleOutlined />}
              style={{ borderRadius: 6, fontWeight: 600 }}
              onClick={() => window.open(record.recordingUrl, '_blank')}
            >
              {isEnglish ? 'Review Video' : 'Ôn Tập Video'}
            </Button>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {isEnglish ? 'No video recorded' : 'Chưa có video'}
            </Text>
          ),
      },
    ],
    [isEnglish, className, teacherName]
  );

  return (
    <div data-testid="student-personal-attendance-view" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. HERO PROFILE & QUÁ TRÌNH RÈN LUYỆN CARD */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #091a32 0%, #1e3a8a 60%, #172554 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <Space orientation="horizontal" size="middle" align="center">
            <Avatar
              size={58}
              style={{ backgroundColor: '#2563eb', border: '3px solid #60a5fa', fontWeight: 700, fontSize: 22 }}
              icon={!currentUser?.avatar && <UserOutlined />}
              src={currentUser?.avatar}
            >
              {studentEnglishName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  {studentEnglishName.toUpperCase()}
                </span>
                {studentEnglishName !== studentName && (
                  <span style={{ fontSize: 14, color: '#93c5fd', fontWeight: 500 }}>
                    ({studentName})
                  </span>
                )}
                <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 700 }}>
                  {studentCode}
                </Tag>
                <Tag color="gold" icon={<StarFilled />} style={{ borderRadius: 4, fontWeight: 700 }}>
                  {isEnglish ? 'Student' : 'Học Viên'}
                </Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 6, fontSize: 13, color: '#cbd5e1' }}>
                <span>🏫 <strong>{className}</strong></span>
                <span>📖 {courseLevel}</span>
                <span>👩‍🏫 {isEnglish ? 'Teacher:' : 'GV Bản Xứ:'} <strong style={{ color: '#93c5fd' }}>{teacherName}</strong></span>
              </div>
            </div>
          </Space>
        </div>

        {/* 4 KHỐI THỐNG KÊ RÈN LUYỆN CÁ NHÂN (PERSONAL KPIS) */}
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
                {isEnglish ? 'Attendance Rate' : 'Tỷ Lệ Chuyên Cần'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>
                {personalStats?.attendanceRate ?? 100}%
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                {isEnglish
                  ? `${personalStats?.attendedCount || 0} sessions present`
                  : `${personalStats?.attendedCount || 0} buổi có mặt`}
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
                {isEnglish ? 'Average Rating' : 'Đánh Giá Trung Bình'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>
                {personalStats?.averageStars ?? '5.0'} ⭐
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                {isEnglish
                  ? `${personalStats?.evaluatedCount || 0} evaluated sessions`
                  : `${personalStats?.evaluatedCount || 0} buổi được khen ngợi`}
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
                {isEnglish ? 'Homework Completed' : 'Bài Tập Hoàn Thành'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>
                {personalStats?.completedHomeworkCount || 0} / {personalStats?.totalHomeworkCount || 0}
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                {isEnglish ? 'Practice tasks completed' : 'Bài tập đã hoàn thành'}
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
                {isEnglish ? 'Wonders Daily Goal' : 'Mục Tiêu Rèn Luyện'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span
                  style={{
                    backgroundColor: '#2563eb',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  📖 60+m Read
                </span>
                <span
                  style={{
                    backgroundColor: '#16a34a',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ✍️ 30+m Write
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>
                {isEnglish ? 'Suggested daily benchmark' : 'Định mức tự học mỗi ngày'}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 2. CẤU TRÚC 2 TABS NHẬT KÝ RÈN LUYỆN & BÀI TẬP VỀ NHÀ */}
      <Tabs
        defaultActiveKey="personal-evaluations"
        data-testid="student-personal-tabs"
        items={[
          {
            key: 'personal-evaluations',
            label: (
              <Space>
                <StarFilled style={{ color: '#faad14' }} />
                <span>{`${t('pages.tabStudentEvaluations')} (${myPersonalAttendances.length})`}</span>
              </Space>
            ),
            children: (
              <Card
                bordered={false}
                style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                bodyStyle={{ padding: 16 }}
              >
                <Table
                  columns={columns}
                  dataSource={myPersonalAttendances}
                  rowKey={(r) => r.id || r.sessionId || `${r.date}_${r.classId}`}
                  scroll={{ x: 750 }}
                  pagination={{ pageSize: 8 }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div style={{ maxWidth: 460, margin: '0 auto', color: '#64748b' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                              {isEnglish ? 'Welcome to your Learning Journal!' : 'Chào mừng bạn đến với Nhật Ký Rèn Luyện!'}
                            </div>
                            <div>
                              {isEnglish
                                ? 'Your attendance records, 4-skill ratings, and native teacher feedback will appear here right after each live session.'
                                : 'Kết quả điểm danh chuyên cần, đánh giá 4 kỹ năng và lời khen dặn dò từ Giáo viên bản xứ sẽ hiển thị tại đây sau mỗi buổi học trực tuyến.'}
                            </div>
                          </div>
                        }
                      />
                    ),
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'personal-homeworks',
            label: (
              <Space>
                <FormOutlined style={{ color: '#1677ff' }} />
                <span>{`${t('pages.tabStudentHomeworks')} (${scopedHomeworks.length})`}</span>
              </Space>
            ),
            children: (
              <HomeworkAssignmentPanel
                homeworks={scopedHomeworks}
                isStudent={true}
                onSubmitHomework={onSubmitHomework}
              />
            ),
          },
        ]}
      />
    </div>
  );
};
