import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CloudFilled,
  LinkOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

/**
 * Bảng Tổng Quan Trạng Thái Liên Kết Lớp Học Trên /zoom-sync:
 * Thao tác "Chọn Phòng Zoom để liên kết" được đặt tại Tab thứ 4 "Liên Kết Với Zoom"
 * ngay trong màn hình Chi Tiết Lớp Học (/classroom/:classId?tab=zoom-link).
 */
export const ZoomClassMappingPanel = ({
  suggestions = [],
  loading = false,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!loading && suggestions.length === 0) {
    return (
      <Card variant="borderless" style={{ borderRadius: 12 }}>
        <Empty
          description={
            isEnglish
              ? 'No active LAK classes found.'
              : 'Chưa có lớp học đang hoạt động.'
          }
        />
      </Card>
    );
  }

  return (
    <div data-testid="zoom-class-mapping-panel">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 10 }}
        title={
          isEnglish
            ? 'Configure Zoom room selection directly inside each Class Detail workspace (Tab: "Zoom Cloud Link").'
            : 'Để chọn phòng Zoom liên kết cho từng lớp, bấm nút bên dưới để mở thẳng Tab "Liên Kết Với Zoom" trong màn hình Chi Tiết Lớp Học.'
        }
      />

      <Row gutter={[16, 16]}>
        {suggestions.map((item) => {
          const linkedRoomId =
            item.zoomConfig?.prettyMeetingId || item.zoomConfig?.zoomMeetingId || '';

          return (
            <Col xs={24} lg={8} key={item.classId}>
              <Card
                variant="borderless"
                data-testid={`zoom-mapping-card-${item.classId}`}
                style={{
                  borderRadius: 12,
                  height: '100%',
                  border: item.isAlreadyLinked ? '1.5px solid #86efac' : '1px solid #cbd5e1',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <Space size={6} wrap style={{ marginBottom: 4 }}>
                      <Tag color="geekblue" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                        {item.classId}
                      </Tag>
                      {item.isAlreadyLinked ? (
                        <Tag
                          color="success"
                          icon={<CheckCircleFilled />}
                          style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}
                        >
                          {isEnglish ? 'Linked with Zoom' : 'Đã liên kết Zoom'}
                        </Tag>
                      ) : (
                        <Tag color="warning" style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}>
                          {isEnglish ? 'Not Linked Yet' : 'Chưa liên kết Zoom'}
                        </Tag>
                      )}
                    </Space>

                    <Text strong style={{ fontSize: 14.5, display: 'block', color: '#0f172a' }}>
                      {item.className}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      👩‍🏫 {item.teacherName} • 👥 {item.studentCount}{' '}
                      {isEnglish ? 'students' : 'HV'} • 📅 {item.schedule}
                    </Text>
                  </div>

                  {item.isAlreadyLinked && linkedRoomId ? (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '8px 10px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      <Tag color="blue" style={{ margin: 0, fontWeight: 700, borderRadius: 5 }}>
                        Zoom ID: {linkedRoomId}
                      </Tag>
                      <Tag icon={<CloudFilled />} color="processing" style={{ margin: 0, borderRadius: 5 }}>
                        {isEnglish ? 'Auto-Cloud ON' : 'Ghi Cloud: BẬT'}
                      </Tag>
                    </div>
                  ) : item.suggestedRoom ? (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px dashed #93c5fd',
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                    >
                      <Space size={4}>
                        <ThunderboltFilled style={{ color: '#2563eb' }} />
                        <Text strong style={{ fontSize: 12, color: '#1e40af' }}>
                          {isEnglish ? 'AI Suggest:' : 'Gợi ý khớp:'} {item.suggestedRoom.id} (
                          {item.confidenceScore}%)
                        </Text>
                      </Space>
                    </div>
                  ) : null}

                  <Button
                    type={item.isAlreadyLinked ? 'default' : 'primary'}
                    icon={<LinkOutlined />}
                    data-testid={`btn-open-classroom-zoom-tab-${item.classId}`}
                    onClick={() => navigate(`/classroom/${item.classId}?tab=zoom-link`)}
                    style={{
                      width: '100%',
                      minHeight: isMobile ? 42 : 38,
                      borderRadius: 8,
                      fontWeight: 600,
                      marginTop: 4,
                    }}
                  >
                    {isEnglish
                      ? 'Open Class Detail to Configure Zoom'
                      : 'Mở Chi Tiết Lớp Để Liên Kết Zoom'}{' '}
                    <ArrowRightOutlined />
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};
