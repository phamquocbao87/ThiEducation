import React from 'react';
import { Row, Col, Card, Statistic, Tag, Button, Space, Typography, Alert, Empty } from 'antd';
import {
  VideoCameraOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassLiveCard } from './ClassLiveCard';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const TeacherWorkspacePanel = ({ workspaceData = {} }) => {
  const { isEnglish, t } = useLanguage();

  const navigate = useNavigate();

  const {
    myClasses = [],
    myStudents = [],
    latestPayroll = {},
    nextClass = null,
    totalClasses = 0,
    totalStudents = 0,
  } = workspaceData;

  const handleCardClick = (cls) => {
    navigate(`/classroom/${encodeURIComponent(cls.id)}`);
  };

  return (
    <div>
      {/* 1. Banner Lớp Học Sắp Tới Nổi Bật (Next Class Alert) */}
      {nextClass ? (
        <Alert
          type="info"
          showIcon
          icon={<VideoCameraOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
          style={{
            marginBottom: 20,
            borderRadius: 12,
            border: '1.5px solid #91caff',
            backgroundColor: '#e6f4ff',
            padding: '14px 18px',
          }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Text strong style={{ fontSize: 15, color: '#003a8c' }}>
                  {isEnglish ? 'Next Upcoming Teaching Session:' : 'Ca Dạy Tiếp Theo Của Bạn:'}{' '}
                  <span style={{ color: '#0958d9' }}>{nextClass.name}</span>
                </Text>
                <div style={{ marginTop: 4, color: '#475569', fontSize: 13 }}>
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  {isEnglish ? 'Schedule:' : 'Lịch dạy:'} <Text strong>{nextClass.schedule || 'Regular Class Schedule'}</Text>
                  {' • '}
                  <BookOutlined style={{ marginLeft: 8, marginRight: 4 }} />
                  {isEnglish ? 'Curriculum:' : 'Giáo trình:'} <Text strong>{nextClass.courseLevel || 'McGraw-Hill Wonders'}</Text>
                </div>
              </div>

              {nextClass.zoomHostLink && (
                <Button
                  type="primary"
                  size="large"
                  icon={<VideoCameraOutlined />}
                  style={{
                    backgroundColor: '#1890ff',
                    borderRadius: 8,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                  }}
                  onClick={() => window.open(nextClass.zoomHostLink, '_blank')}
                >
                  {isEnglish ? '🚀 Start Class (Zoom Host)' : '🚀 Bắt Đầu Giảng Dạy (Zoom Host)'}
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20, borderRadius: 10 }}
          message={isEnglish ? 'No assigned classes currently scheduled' : 'Hiện chưa có lớp học nào được phân công cho tài khoản này'}
          description={isEnglish ? 'Please contact Academic Coordinator to be assigned to online Zoom classes.' : 'Vui lòng liên hệ Giáo vụ để được phân bổ lớp học trực tuyến.'}
        />
      )}

      {/* 2. Hàng Thống Kê 3 Chỉ Số Giảng Dạy */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Assigned Classes' : 'Số Lớp Đang Giảng Dạy'}</Text>}
              value={totalClasses}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix={isEnglish ? 'classes' : 'lớp'}
              styles={{ content: { color: '#1890ff', fontWeight: 700 } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #52c41a',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Active Students Under Care' : 'Tổng Học Viên Đang Học'}</Text>}
              value={totalStudents}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={isEnglish ? 'students' : 'học viên'}
              styles={{ content: { color: '#52c41a', fontWeight: 700 } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #722ed1',
            }}
          >
            <Statistic
              title={<Text strong>{isEnglish ? 'Estimated Monthly Earnings' : 'Thu Nhập Dự Kiến Tháng'}</Text>}
              value={latestPayroll.totalSalary || 0}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              {isEnglish ? 'Rate per session:' : 'Đơn giá tiết:'} <Text strong>{formatCurrency(latestPayroll.ratePerSession || 450000)}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. LƯỚI CARD LỚP HỌC PHỤ TRÁCH & TRẠNG THÁI REAL-TIME */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <Space>
              <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {isEnglish ? 'My Teaching Classes & Virtual Zoom Rooms' : 'Danh Sách Lớp Học & Phòng Trực Tuyến Zoom Của Tôi'}
              </span>
            </Space>

            <Space size={6} wrap style={{ fontSize: 12 }}>
              <Tag color="processing" style={{ borderRadius: 6, fontWeight: 600 }}>
                🚀 {isEnglish ? 'Live: Teaching Time (Pulse)' : 'Đang trong giờ dạy (Nhấp nháy)'}
              </Tag>
              <Tag color="default" style={{ borderRadius: 6 }}>
                ⚪ {isEnglish ? 'Upcoming Session' : 'Chưa đến giờ dạy'}
              </Tag>
            </Space>
          </div>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <div style={{ marginBottom: 14, fontSize: 13, color: '#64748b' }}>
          💡 {isEnglish
            ? 'Click any class card to inspect students list, meeting credentials, and take attendance.'
            : 'Nhấp vào bất kỳ thẻ lớp học nào để xem danh sách học viên, ID phòng Zoom và vào sổ điểm danh.'}
        </div>

        {myClasses.length > 0 ? (
          <Row gutter={[16, 16]}>
            {myClasses.map((cls) => (
              <Col xs={24} sm={12} lg={8} key={cls.id}>
                <ClassLiveCard cls={cls} role="teacher" onClick={handleCardClick} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description={isEnglish ? 'No classes assigned' : 'Chưa được phân bổ lớp học nào'} />
        )}
      </Card>

    </div>
  );
};
