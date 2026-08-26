import React from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Progress, Button, List, Avatar, Space, Badge, Alert, Rate } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  FileDoneOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  GlobalOutlined,
  SoundOutlined,
  TranslationOutlined
} from '@ant-design/icons';
import { useAuth } from '../../core/context/AuthContext';
import { INITIAL_STATS, MOCK_ATTENDANCES, MOCK_TIMETABLE } from '../../shared/data/mockData';
import { formatCurrency } from '../../shared/utils/formatter';

const { Text, Paragraph } = Typography;

export const DashboardView = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  return (
    <div>
      <Alert
        message={`Xin chào / Hello, ${currentUser.name}!`}
        description={
          role === 'admin'
            ? 'Hệ thống Quản lý Giáo dục Anh Văn Trực Tuyến 100% Giáo viên Nước ngoài (Zoom Online) — Quy mô 520 Học viên & 68 Giáo viên Native.'
            : role === 'teacher'
            ? 'Welcome Teacher! You have Zoom online classes today. Evaluate students on Pronunciation, Spelling, Class Seriousness & Listening in English.'
            : 'Chào mừng em! Truy cập lớp Zoom Online và kiểm tra kết quả đánh giá Phát âm, Đánh vần từ Giáo viên Nước ngoài.'
        }
        type="info"
        showIcon
        icon={<GlobalOutlined style={{ color: '#1890ff' }} />}
        style={{ marginBottom: 24, borderRadius: 8, background: '#e6f7ff', borderColor: '#91d5ff' }}
      />

      {role === 'admin' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderColor: '#1890ff', borderRadius: 8 }}>
                <Statistic
                  title="Học Viên Zoom Online"
                  value={INITIAL_STATS.totalStudents}
                  prefix={<TeamOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                  suffix="học viên"
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>28 Lớp Anh Văn Trực Tuyến</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }}>
                <Statistic
                  title="Giáo Viên Bản Xứ (100% Native)"
                  value={INITIAL_STATS.totalTeachers}
                  prefix={<GlobalOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                  suffix="Native Teachers"
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Mỹ 🇺🇸, Anh 🇬🇧, Úc 🇦🇺, Canada 🇨🇦</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderColor: '#722ed1', borderRadius: 8 }}>
                <Statistic
                  title="Doanh Thu Học Phí (T8)"
                  value={INITIAL_STATS.monthlyTuitionCollected}
                  formatter={(val) => formatCurrency(val)}
                  prefix={<DollarOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold', fontSize: 20 }}
                />
                <Progress percent={87.4} status="active" strokeColor="#722ed1" style={{ marginTop: 4 }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderColor: '#fa8c16', borderRadius: 8 }}>
                <Statistic
                  title="Quỹ Lương Giáo Viên Native"
                  value={INITIAL_STATS.monthlyPayrollTotal}
                  formatter={(val) => formatCurrency(val)}
                  prefix={<FileDoneOutlined style={{ color: '#fa8c16', marginRight: 8 }} />}
                  valueStyle={{ color: '#fa8c16', fontWeight: 'bold', fontSize: 20 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Đã duyệt 4/4 bảng lương mẫu</Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title={<Space><ThunderboltOutlined style={{ color: '#faad14' }} /><Text strong>Thao Tác Nhanh Quản Lý</Text></Space>} style={{ height: '100%' }}>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Button block type="primary" icon={<FileDoneOutlined />} onClick={() => setActiveTab('contracts')} style={{ height: 48, borderRadius: 6 }}>
                      Hợp Đồng & Lương Native GV
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block icon={<CalendarOutlined />} onClick={() => setActiveTab('schedules')} style={{ height: 48, borderRadius: 6 }}>
                      Thời Khóa Biểu Zoom
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block icon={<TeamOutlined />} onClick={() => setActiveTab('attendance')} style={{ height: 48, borderRadius: 6 }}>
                      Đánh Giá Chi Tiết Buổi Học
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block type="dashed" icon={<DollarOutlined />} onClick={() => setActiveTab('tuition')} style={{ height: 48, borderRadius: 6 }}>
                      Thu Học Phí 520 Học Viên
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title={<Space><GlobalOutlined style={{ color: '#1890ff' }} /><Text strong>Đánh Giá Chi Tiết Từ Giáo Viên Bản Xứ (Zoom Evaluation)</Text></Space>}>
                <List
                  itemLayout="horizontal"
                  dataSource={MOCK_ATTENDANCES}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        item.recordingUrl ? (
                          <Button size="small" type="link" icon={<PlayCircleOutlined />} onClick={() => window.open(item.recordingUrl, '_blank')}>
                            Zoom Recording
                          </Button>
                        ) : null
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<GlobalOutlined />} style={{ backgroundColor: '#722ed1' }} />}
                        title={
                          <Space wrap>
                            <Text strong>{item.className}</Text>
                            <Tag color="geekblue">{item.teacherName}</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text style={{ fontSize: 13, color: '#333', fontStyle: 'italic', display: 'block' }}>"{item.teacherFeedback}"</Text>
                            <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              <span>🗣️ Pronunciation: <Rate disabled defaultValue={item.pronunciationScore || 5} style={{ fontSize: 11 }} /></span>
                              <span>🔤 Spelling: <Rate disabled defaultValue={item.spellingScore || 5} style={{ fontSize: 11 }} /></span>
                              <span>🎯 Seriousness: <Rate disabled defaultValue={item.seriousnessScore || 5} style={{ fontSize: 11 }} /></span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {role === 'teacher' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#1890ff', borderRadius: 8 }}>
                <Statistic
                  title="Completed Zoom Sessions (August)"
                  value={46}
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                  suffix="sessions"
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Text type="secondary">+6 sessions over monthly quota</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }}>
                <Statistic
                  title="Estimated Monthly Salary"
                  value={22700000}
                  formatter={(val) => formatCurrency(val)}
                  prefix={<DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
                <Tag color="green" style={{ marginTop: 4 }}>Native Rate: 450,000 VND / session</Tag>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#722ed1', borderRadius: 8 }}>
                <Statistic
                  title="Assigned Zoom Classes"
                  value={3}
                  prefix={<TeamOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                  suffix="classes"
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                />
                <Text type="secondary">95 Online Students</Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={14}>
              <Card title={<Space><CalendarOutlined /><Text strong>Today's Zoom Classes & Evaluation</Text></Space>}>
                <List
                  dataSource={MOCK_TIMETABLE.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="primary" size="small" icon={<LinkOutlined />} style={{ background: '#2db7f5', borderColor: '#2db7f5' }} onClick={() => window.open(item.meetingLink, '_blank')}>
                          Launch Zoom
                        </Button>,
                        <Button size="small" icon={<SoundOutlined />} onClick={() => setActiveTab('attendance')}>
                          Evaluate Students
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color="volcano">{item.timeSlot}</Tag>}
                        title={<Text strong>{item.className} ({item.subject})</Text>}
                        description={`Platform: ${item.platform} | Status: ${item.status}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={<Space><FileDoneOutlined /><Text strong>Native Teacher Contract Details</Text></Space>}>
                <Paragraph><Text strong>Contract Code:</Text> HD-2025-01</Paragraph>
                <Paragraph><Text strong>Contract Type:</Text> Full-time Native Teacher (40 sessions/month)</Paragraph>
                <Paragraph><Text strong>Rate Per Session:</Text> 450,000 VNĐ / session</Paragraph>
                <Paragraph><Text strong>Performance Bonus:</Text> +2,000,000 VNĐ (August)</Paragraph>
                <Button type="dashed" block onClick={() => setActiveTab('contracts')}>View Payslip Details</Button>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {role === 'student' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#1890ff', borderRadius: 8 }}>
                <Statistic
                  title="Lớp Anh Văn Trực Tuyến"
                  value="10A1"
                  prefix={<BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Text type="secondary">Advanced English Speaking (Zoom)</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }}>
                <Statistic
                  title="Tỷ Lệ Chuyên Cần Zoom"
                  value={100}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
                <Tag color="green" style={{ marginTop: 4 }}>Tham gia phòng Zoom 100%</Tag>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#722ed1', borderRadius: 8 }}>
                <Statistic
                  title="Học Phí Tháng 8"
                  value={2500000}
                  formatter={(val) => formatCurrency(val)}
                  prefix={<DollarOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                />
                <Tag color="cyan">Đã hoàn tất thanh toán</Tag>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title={<Space><CalendarOutlined /><Text strong>Lịch Học Zoom & Nút Vào Phòng Trực Tuyến</Text></Space>}>
                <List
                  dataSource={MOCK_TIMETABLE.filter((t) => t.className.includes('10A1'))}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="primary" size="small" icon={<LinkOutlined />} style={{ background: '#2db7f5', borderColor: '#2db7f5' }} onClick={() => window.open(item.meetingLink, '_blank')}>
                          Vào Phòng Zoom
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color="blue">{item.day}</Tag>}
                        title={<Text strong>{item.subject} - {item.timeSlot}</Text>}
                        description={`Native Teacher: ${item.teacherName} | Platform: ${item.platform}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<Space><GlobalOutlined style={{ color: '#1890ff' }} /><Text strong>Kết Quả Đánh Giá Chi Tiết Từ Giáo Viên Bản Xứ</Text></Space>}>
                <Paragraph style={{ background: '#f6ffed', padding: 12, borderRadius: 6, border: '1px solid #b7eb8f' }}>
                  <Text strong color="green">Mr. David Smith (USA 🇺🇸):</Text><br />
                  "Khoa demonstrated excellent pronunciation on consonant clusters today. Active participation during Zoom breakout session!"
                </Paragraph>
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
                  <Row gutter={[8, 8]}>
                    <Col span={12}>🗣️ Phát âm (Pronunciation): <Rate disabled defaultValue={5} style={{ fontSize: 12 }} /></Col>
                    <Col span={12}>🔤 Đánh vần (Spelling): <Rate disabled defaultValue={5} style={{ fontSize: 12 }} /></Col>
                    <Col span={12}>🎯 Nghiêm túc (Seriousness): <Rate disabled defaultValue={5} style={{ fontSize: 12 }} /></Col>
                    <Col span={12}>🎧 Nghe hiểu (Listening): <Rate disabled defaultValue={4} style={{ fontSize: 12 }} /></Col>
                  </Row>
                </div>
                <Button type="primary" block icon={<PlayCircleOutlined />} onClick={() => window.open('https://drive.google.com/file/d/zoom-rec-10a1-aug25', '_blank')}>
                  Xem Video Ghi Hình Lớp Zoom Mới Nhất
                </Button>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
