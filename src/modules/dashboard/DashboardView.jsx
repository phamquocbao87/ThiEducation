import React from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Progress, Button, List, Avatar, Space, Badge, Alert } from 'antd';
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
  LinkOutlined
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
        message={`Xin chào, ${currentUser.name}!`}
        description={
          role === 'admin'
            ? 'Chào mừng bạn đến với Hệ thống Quản lý Giáo dục Trực tuyến ThiEducation (Quy mô: 520 Học viên Online, 68 Cán bộ/GV).'
            : role === 'teacher'
            ? 'Chào mừng thầy/cô. Bạn có 2 lớp học Online hôm nay. Hãy sẵn sàng mở phòng Zoom/Meet và cập nhật video ghi hình bài giảng nhé.'
            : 'Chào mừng bạn trở lại! Kiểm tra thời khóa biểu Online và bấm nút "Vào Lớp Online" để học ngay.'
        }
        type="info"
        showIcon
        icon={<VideoCameraOutlined style={{ color: '#1890ff' }} />}
        style={{ marginBottom: 24, borderRadius: 8, background: '#e6f7ff', borderColor: '#91d5ff' }}
      />

      {role === 'admin' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderColor: '#1890ff', borderRadius: 8 }}>
                <Statistic
                  title="Tổng Học Viên Online"
                  value={INITIAL_STATS.totalStudents}
                  prefix={<TeamOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                  suffix="em"
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Đang học tại 28 lớp trực tuyến</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }}>
                <Statistic
                  title="Giáo Viên Giảng Dạy Online"
                  value={INITIAL_STATS.totalTeachers}
                  prefix={<UserOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                  suffix="thầy/cô"
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>68 Giáo viên + 2 cán bộ</Text>
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
                  title="Tổng Chi Quỹ Lương (T8)"
                  value={INITIAL_STATS.monthlyPayrollTotal}
                  formatter={(val) => formatCurrency(val)}
                  prefix={<FileDoneOutlined style={{ color: '#fa8c16', marginRight: 8 }} />}
                  valueStyle={{ color: '#fa8c16', fontWeight: 'bold', fontSize: 20 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Đã duyệt 5/5 bảng lương mẫu</Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title={<Space><ThunderboltOutlined style={{ color: '#faad14' }} /><Text strong>Thao Tác Nhanh Quản Lý</Text></Space>} style={{ height: '100%' }}>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Button block type="primary" icon={<FileDoneOutlined />} onClick={() => setActiveTab('contracts')} style={{ height: 48, borderRadius: 6 }}>
                      Tính Lương GV
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block icon={<CalendarOutlined />} onClick={() => setActiveTab('schedules')} style={{ height: 48, borderRadius: 6 }}>
                      Thời Khóa Biểu Online
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block icon={<TeamOutlined />} onClick={() => setActiveTab('attendance')} style={{ height: 48, borderRadius: 6 }}>
                      Điểm Danh & Recording
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block type="dashed" icon={<DollarOutlined />} onClick={() => setActiveTab('tuition')} style={{ height: 48, borderRadius: 6 }}>
                      Thu Học Phí
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title={<Space><VideoCameraOutlined style={{ color: '#1890ff' }} /><Text strong>Đánh Giá Chất Lượng Dạy Online Mới Nhất</Text></Space>}>
                <List
                  itemLayout="horizontal"
                  dataSource={MOCK_ATTENDANCES}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        item.recordingUrl ? (
                          <Button size="small" type="link" icon={<PlayCircleOutlined />} onClick={() => window.open(item.recordingUrl, '_blank')}>
                            Xem Recording
                          </Button>
                        ) : null
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<VideoCameraOutlined />} style={{ backgroundColor: '#722ed1' }} />}
                        title={
                          <Space>
                            <Text strong>{item.className}</Text>
                            <Tag color="blue">{item.teacherName}</Tag>
                            <Tag color="gold">★ {item.qualityRating}/5</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text style={{ fontSize: 13, color: '#595959' }}>{item.teacherFeedback}</Text>
                            <div style={{ marginTop: 4 }}>
                              <Badge status="success" text={`Hiện diện trong phòng: ${item.presentCount}/${item.totalStudents}`} />
                              <Text type="secondary" style={{ fontSize: 11, marginLeft: 12 }}>{item.date}</Text>
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
                  title="Số Tiết Dạy Online (Tháng 8)"
                  value={46}
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                  suffix="tiết"
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Text type="secondary">Vượt chỉ tiêu 6 tiết</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }}>
                <Statistic
                  title="Lương Tạm Tính Tháng 8"
                  value={17600000}
                  formatter={(val) => formatCurrency(val)}
                  prefix={<DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
                <Tag color="green" style={{ marginTop: 4 }}>Đơn giá: 350.000đ / tiết</Tag>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#722ed1', borderRadius: 8 }}>
                <Statistic
                  title="Lớp Online Phụ Trách"
                  value={3}
                  prefix={<TeamOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                  suffix="lớp"
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                />
                <Text type="secondary">Tổng 95 học viên</Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={14}>
              <Card title={<Space><CalendarOutlined /><Text strong>Lịch Dạy Online Hôm Nay & Phòng Học</Text></Space>}>
                <List
                  dataSource={MOCK_TIMETABLE.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="primary" size="small" icon={<LinkOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => window.open(item.meetingLink, '_blank')}>
                          Mở Phòng Học
                        </Button>,
                        <Button size="small" onClick={() => setActiveTab('attendance')}>
                          Điểm danh
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color="volcano">{item.timeSlot}</Tag>}
                        title={<Text strong>{item.className} ({item.subject})</Text>}
                        description={`Nền tảng: ${item.platform} | Trạng thái: ${item.status}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={<Space><FileDoneOutlined /><Text strong>Thông Tin Hợp Đồng Cá Nhân</Text></Space>}>
                <Paragraph><Text strong>Mã hợp đồng:</Text> HD-2025-01</Paragraph>
                <Paragraph><Text strong>Loại HĐ:</Text> Toàn thời gian (Giảng dạy Trực tuyến)</Paragraph>
                <Paragraph><Text strong>Đơn giá tiết dạy:</Text> 350.000 VNĐ / tiết</Paragraph>
                <Paragraph><Text strong>Thưởng hiệu quả:</Text> +1.500.000 VNĐ (Tháng 8)</Paragraph>
                <Button type="dashed" block onClick={() => setActiveTab('contracts')}>Xem chi tiết bảng lương</Button>
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
                  title="Lớp Online Đăng Ký"
                  value="10A1"
                  prefix={<BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Text type="secondary">Toán Chuyên Online</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderColor: '#52c41a', borderRadius: 8 }}>
                <Statistic
                  title="Tỷ Lệ Chuyên Cần"
                  value={100}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
                <Tag color="green" style={{ marginTop: 4 }}>Tham gia đầy đủ 100%</Tag>
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
              <Card title={<Space><CalendarOutlined /><Text strong>Lịch Học Online & Vào Phòng Học</Text></Space>}>
                <List
                  dataSource={MOCK_TIMETABLE.filter((t) => t.className.includes('10A1'))}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="primary" size="small" icon={<LinkOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => window.open(item.meetingLink, '_blank')}>
                          Vào Lớp Online
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color="blue">{item.day}</Tag>}
                        title={<Text strong>{item.subject} - {item.timeSlot}</Text>}
                        description={`Giáo viên: ${item.teacherName} | Nền tảng: ${item.platform}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<Space><SmileOutlined /><Text strong>Nhận Xét Của Giáo Viên & Video Ghi Hình</Text></Space>}>
                <Paragraph style={{ background: '#f6ffed', padding: 12, borderRadius: 6, border: '1px solid #b7eb8f' }}>
                  <Text strong color="green">Thầy Nguyễn Văn Hùng (Môn Toán):</Text><br />
                  "Em Khoa học rất chăm chỉ, phát biểu hăng hái qua Mic & Chatbox và hoàn thành xuất sắc các bài toán nâng cao."
                </Paragraph>
                <Button type="primary" block icon={<PlayCircleOutlined />} onClick={() => window.open('https://drive.google.com/file/d/zoom-rec-10a1-aug25', '_blank')}>
                  Xem Video Ghi Hình Bài Giảng Mới Nhất
                </Button>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
