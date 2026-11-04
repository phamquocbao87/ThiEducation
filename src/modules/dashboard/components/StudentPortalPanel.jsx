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

const { Text } = Typography;

export const StudentPortalPanel = ({ portalData, setActiveTab }) => {
  const { studentProfile, myTimetable, myHomeworks } = portalData;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#1890ff', borderRadius: 8 }}>
            <Statistic
              title="Lớp Đang Tham Gia"
              value={studentProfile.className}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff', fontWeight: 'bold', fontSize: 16 } }}
            />
            <Tag color="blue" style={{ marginTop: 6 }}>Cấp độ: {studentProfile.level}</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#52c41a', borderRadius: 8 }}>
            <Statistic
              title="Chuyên Cần & Bài Tập"
              value={studentProfile.attendanceRate}
              suffix={`% (${myHomeworks.length} bài tập)`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setActiveTab('attendance')}>
              Xem & Nộp bài tập về nhà →
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderColor: '#722ed1', borderRadius: 8 }}>
            <Statistic
              title="Thông Tin Đóng Học Phí"
              value={studentProfile.amountDue}
              formatter={(val) => formatCurrency(val)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }}
            />
            <Tag color={studentProfile.tuitionStatus === 'PAID' ? 'green' : 'volcano'} style={{ marginTop: 6 }}>
              {studentProfile.tuitionStatus === 'PAID' ? 'ĐÃ HOÀN TẤT HỌC PHÍ' : 'CẦN THANH TOÁN'}
            </Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card title={<Space><UserOutlined style={{ color: '#1890ff' }} /><Text strong>Hồ Sơ Cá Nhân & Đánh Giá Của Giáo Viên</Text></Space>}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Họ và Tên">{studentProfile.name} ({studentProfile.englishName})</Descriptions.Item>
              <Descriptions.Item label="Mã Học Viên">{studentProfile.id} — Tuổi: {studentProfile.age}</Descriptions.Item>
              <Descriptions.Item label="Phụ Huynh">{studentProfile.parentName} ({studentProfile.phone})</Descriptions.Item>
              <Descriptions.Item label="Nhận Xét Mới Nhất Từ GV Bản Xứ">
                <Text italic style={{ color: '#389e0d' }}>"{studentProfile.latestTeacherNote}"</Text>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12, padding: 10, background: '#fafafa', borderRadius: 6 }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>🗣️ Phát âm: <Rate disabled defaultValue={studentProfile.pronunciationScore} style={{ fontSize: 12 }} /></Col>
                <Col span={12}>🔤 Đánh vần: <Rate disabled defaultValue={studentProfile.spellingScore} style={{ fontSize: 12 }} /></Col>
                <Col span={12}>🎯 Nghiêm túc: <Rate disabled defaultValue={studentProfile.seriousnessScore} style={{ fontSize: 12 }} /></Col>
                <Col span={12}>🎧 Nghe hiểu: <Rate disabled defaultValue={studentProfile.listeningScore} style={{ fontSize: 12 }} /></Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Space><FormOutlined style={{ color: '#722ed1' }} /><Text strong>Bài Tập Của Tôi & Lịch Học Trực Tuyến</Text></Space>}
            extra={<Button size="small" type="primary" onClick={() => setActiveTab('attendance')}>Nộp Bài Tập</Button>}
          >
            <List
              size="small"
              header={<Text strong>Danh sách Bài tập được giao:</Text>}
              dataSource={myHomeworks}
              renderItem={(hw) => (
                <List.Item
                  extra={
                    <Tag color={hw.status === 'SUBMITTED' ? 'green' : 'orange'}>
                      {hw.status === 'SUBMITTED' ? `Đã nộp (${hw.score})` : 'Chưa nộp'}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={<Text strong>{hw.title}</Text>}
                    description={`Hạn nộp: ${hw.dueDate} | Ghi chú GV: ${hw.teacherComment}`}
                  />
                </List.Item>
              )}
            />

            <List
              style={{ marginTop: 12 }}
              size="small"
              header={<Text strong>Lịch học Zoom của lớp {studentProfile.classId}:</Text>}
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
                      Vào Lớp Zoom
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={`${slot.day} (${slot.timeSlot}) — ${slot.subject}`}
                    description={`Giáo viên: ${slot.teacherName}`}
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

