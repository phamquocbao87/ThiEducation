import React, { useState } from 'react';
import { Card, Tag, Button, Space, Typography, Badge, message } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  BookOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { NotificationService, NOTIFICATION_TYPES } from '../../../core/services/NotificationService';

const { Text } = Typography;

export const AcademicLessonPlanMonitorCard = ({
  alerts = [],
  pastMissingCount = 0,
  onAlertReminded,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [remindedMap, setRemindedMap] = useState({});

  if ((!alerts || alerts.length === 0) && (!pastMissingCount || pastMissingCount === 0)) {
    return null;
  }

  const handleRemindTeacher = async (alert) => {
    console.log('[AcademicLessonPlanMonitorCard] handleRemindTeacher called with alert:', {
      classId: alert?.classId,
      teacherId: alert?.teacherId,
      teacherName: alert?.teacherName,
    });
    try {
      setRemindedMap((prev) => ({ ...prev, [alert.id]: true }));

      // Gửi realtime notification tới giáo viên phụ trách
      if (alert.teacherId) {
        await NotificationService.sendNotification({
          recipientId: alert.teacherId,
          recipientRole: 'teacher',
          type: NOTIFICATION_TYPES.LESSON_PLAN_DUE_REMINDER,
          title: isEnglish
            ? `Action Required: Lesson Plan Due in < 24h (${alert.className})`
            : `Nhắc Nhở: Cần Soạn Giáo Án Trước 24h (${alert.className})`,
          message: isEnglish
            ? `Your session [${alert.className} - ${alert.unitWeek}] tomorrow at ${alert.timeRange} needs a prepared lesson plan.`
            : `Ca dạy [${alert.className} - ${alert.unitWeek}] vào ngày mai lúc ${alert.timeRange} chưa có giáo án. Vui lòng hoàn tất trước giờ dạy.`,
          actionUrl: `/classroom/${encodeURIComponent(alert.classId)}?tab=curriculum&sessionIndex=${alert.sessionIndex}`,
          createdBy: 'ACA101',
          createdByName: 'Giáo Vụ Đào Tạo',
          createdByRole: 'academic',
        });
      }

      message.success(
        isEnglish
          ? `Reminder sent to ${alert.teacherName} for class ${alert.className}!`
          : `Đã gửi thông báo nhắc nhở tới giáo viên ${alert.teacherName} (Lớp ${alert.className})!`
      );
      onAlertReminded?.(alert);
    } catch (err) {
      console.warn('Lỗi gửi nhắc nhở:', err);
      message.error(err.message || 'Lỗi gửi thông báo nhắc nhở');
    }
  };

  const handleInspectClass = (alert) => {
    navigate(`/classroom/${encodeURIComponent(alert.classId)}?tab=curriculum&sessionIndex=${alert.sessionIndex}`);
  };

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: isMobile ? 12 : 20,
        borderRadius: 12,
        borderLeft: '4px solid #1890ff',
        backgroundColor: '#f0f5ff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
      data-testid="academic-lesson-plan-monitor-card"
    >
      {/* 1. Header Giám Sát Mốc 24H */}
      {alerts.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <Space size={8}>
              <Badge count={alerts.length} overflowCount={99}>
                <ClockCircleOutlined style={{ color: '#0958d9', fontSize: 16 }} />
              </Badge>
              <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#002c6a' }}>
                {isEnglish
                  ? `Academic Quality Control: Lesson Plans Due in < 24h (${alerts.length} upcoming sessions)`
                  : `Nhiệm Vụ Giáo Vụ: Đôn Đốc Soạn Giáo Án Trước 24H (${alerts.length} ca dạy sắp tới)`}
              </Text>
            </Space>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((alert) => {
              const isReminded = remindedMap[alert.id];
              return (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #d6e4ff',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <Tag color="blue" style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                        {alert.className}
                      </Tag>
                      <Tag color="geekblue" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                        👨‍🏫 {alert.teacherName}
                      </Tag>
                      <Tag
                        color={alert.isUrgent12h ? 'error' : 'warning'}
                        style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}
                      >
                        {isEnglish
                          ? `⏰ ${alert.diffHours}h ${alert.diffMinutes}m left`
                          : `⏰ Còn ${alert.diffHours}h ${alert.diffMinutes}p`}
                      </Tag>
                      {!alert.hasPlan && (
                        <Tag color="red" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                          {isEnglish ? 'No Plan' : 'Chưa có giáo án'}
                        </Tag>
                      )}
                      {!alert.hasCurriculum && (
                        <Tag color="orange" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                          {isEnglish ? 'No Textbook' : 'Thiếu giáo trình'}
                        </Tag>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <span style={{ fontWeight: 600 }}>{alert.unitWeek}</span>
                      {' • '}
                      <span>{alert.dayName}, {alert.sessionDate} ({alert.timeRange})</span>
                    </div>
                  </div>

                  <Space size={8} wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                    <Button
                      type="default"
                      icon={<SearchOutlined />}
                      size={isMobile ? 'middle' : 'small'}
                      style={{
                        borderRadius: 6,
                        flex: isMobile ? 1 : undefined,
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleInspectClass(alert)}
                    >
                      {isEnglish ? 'Inspect' : 'Kiểm tra'}
                    </Button>

                    <Button
                      type="primary"
                      icon={isReminded ? <CheckOutlined /> : <BellOutlined />}
                      size={isMobile ? 'middle' : 'small'}
                      disabled={isReminded}
                      style={{
                        backgroundColor: isReminded ? '#52c41a' : '#1890ff',
                        borderColor: isReminded ? '#52c41a' : '#1890ff',
                        fontWeight: 600,
                        borderRadius: 6,
                        flex: isMobile ? 1 : undefined,
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleRemindTeacher(alert)}
                      data-testid={`btn-remind-lesson-plan-${alert.sessionIndex}`}
                    >
                      {isReminded
                        ? (isEnglish ? 'Reminded' : 'Đã nhắc')
                        : (isEnglish ? 'Remind Teacher' : 'Nhắc giáo viên')}
                    </Button>
                  </Space>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 2. TẦNG 2: Tóm Tắt Hồ Sơ Quá Khứ Toàn Trường */}
      {pastMissingCount > 0 && (
        <div
          style={{
            marginTop: alerts.length > 0 ? 12 : 0,
            paddingTop: alerts.length > 0 ? 10 : 0,
            borderTop: alerts.length > 0 ? '1px dashed #d6e4ff' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: '#1e3a8a' }}>
            ℹ️ {isEnglish
              ? `Archival Backlog: ${pastMissingCount} past sessions across all classes lack completed lesson records.`
              : `Hồ sơ quá khứ: Có ${pastMissingCount} buổi học cũ của các lớp chưa hoàn thiện giáo án lưu trữ.`}
          </div>
        </div>
      )}
    </Card>
  );
};
