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
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { ClassLiveCard } from './ClassLiveCard';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const TeacherWorkspacePanel = ({ workspaceData = {} }) => {
  const { isEnglish, t } = useLanguage();
  const isMobile = useIsMobile();
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
            marginBottom: isMobile ? 12 : 20,
            borderRadius: 12,
            border: '1.5px solid #91caff',
            backgroundColor: '#e6f4ff',
            padding: isMobile ? '10px 12px' : '14px 18px',
          }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
              <div>
                <Text strong style={{ fontSize: isMobile ? 14 : 15, color: '#003a8c', display: 'block' }}>
                  {isEnglish ? 'Next Teaching Session:' : 'Ca Dạy Tiếp Theo:'}{' '}
                  <span style={{ color: '#0958d9' }}>{nextClass.name}</span>
                </Text>
                <div style={{ marginTop: 4, color: '#475569', fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {isEnglish ? 'Schedule:' : 'Lịch:'} <Text strong>{nextClass.schedule || 'Regular Class Schedule'}</Text>
                  {' • '}
                  <BookOutlined style={{ marginLeft: 6, marginRight: 4 }} />
                  <Text strong>{nextClass.courseLevel || 'McGraw-Hill Wonders'}</Text>
                </div>
              </div>

              {nextClass.zoomHostLink && (
                <Button
                  type="primary"
                  size={isMobile ? 'middle' : 'large'}
                  icon={<VideoCameraOutlined />}
                  style={{
                    backgroundColor: '#1890ff',
                    borderRadius: 8,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                    width: isMobile ? '100%' : 'auto',
                    marginTop: isMobile ? 4 : 0,
                  }}
                  onClick={() => window.open(nextClass.zoomHostLink, '_blank')}
                >
                  {isEnglish ? '🚀 Start Class (Zoom Host)' : '🚀 Bắt Đầu Giảng Dạy (Zoom)'}
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: isMobile ? 12 : 20, borderRadius: 10 }}
          message={isEnglish ? 'No assigned classes currently scheduled' : 'Hiện chưa có lớp học nào được phân công cho tài khoản này'}
          description={isEnglish ? 'Please contact Academic Coordinator to be assigned to online Zoom classes.' : 'Vui lòng liên hệ Giáo vụ để được phân bổ lớp học trực tuyến.'}
        />
      )}

      {/* 2. Hàng Thống Kê 3 Chỉ Số Giảng Dạy */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 20 }}>
        <Col xs={12} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #1890ff',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'Assigned Classes' : 'Số Lớp Giảng Dạy'}</Text>}
              value={totalClasses}
              prefix={<TeamOutlined style={{ color: '#1890ff', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'cls' : 'lớp'}</span>}
              styles={{ content: { color: '#1890ff', fontWeight: 700, fontSize: isMobile ? 20 : 24 } }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderTop: '3px solid #52c41a',
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'Active Students' : 'Tổng Học Viên'}</Text>}
              value={totalStudents}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: isMobile ? 14 : 18 }} />}
              suffix={<span style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'std' : 'học viên'}</span>}
              styles={{ content: { color: '#52c41a', fontWeight: 700, fontSize: isMobile ? 20 : 24 } }}
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
              height: '100%',
            }}
            styles={{ body: { padding: isMobile ? '12px 12px' : '16px 20px' } }}
          >
            <Statistic
              title={<Text strong style={{ fontSize: isMobile ? 11 : 13 }}>{isEnglish ? 'Estimated Monthly Earnings' : 'Thu Nhập Dự Kiến Tháng'}</Text>}
              value={latestPayroll.totalSalary || 0}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#722ed1', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 700, fontSize: isMobile ? 18 : 22, whiteSpace: 'nowrap' } }}
            />
            <div style={{ marginTop: 4, fontSize: isMobile ? 11 : 12, color: '#64748b' }}>
              {isEnglish ? 'Rate/session:' : 'Đơn giá/tiết:'} <Text strong style={{ whiteSpace: 'nowrap' }}>{formatCurrency(latestPayroll.ratePerSession || 450000)}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. LƯỚI CARD LỚP HỌC PHỤ TRÁCH & TRẠNG THÁI REAL-TIME */}
      <Card
        title={
          <Space>
            <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
              {isEnglish
                ? (isMobile ? 'My Classes & Rooms' : 'My Teaching Classes & Virtual Zoom Rooms')
                : (isMobile ? 'Lớp Giảng Dạy & Zoom' : 'Danh Sách Lớp Học & Phòng Trực Tuyến Zoom')}
            </span>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
      >
        {/* Status badges moved to Card body */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            💡 {isEnglish
              ? 'Click card to inspect students and take attendance.'
              : 'Nhấp vào thẻ lớp để xem danh sách học viên và điểm danh.'}
          </div>

          <Space size={6} wrap style={{ fontSize: 11 }}>
            <Tag color="processing" style={{ borderRadius: 6, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
              🚀 {isEnglish ? 'Teaching Time' : 'Đang trong giờ dạy'}
            </Tag>
            <Tag color="default" style={{ borderRadius: 6, margin: 0, whiteSpace: 'nowrap' }}>
              ⚪ {isEnglish ? 'Upcoming' : 'Chưa đến giờ'}
            </Tag>
          </Space>
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
