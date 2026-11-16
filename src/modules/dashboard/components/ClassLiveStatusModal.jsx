import React from 'react';
import { Modal, Descriptions, Tag, Button, Space, Typography, Row, Col, Alert, message } from 'antd';
import {
  VideoCameraOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  GlobalOutlined,
  CopyOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  EditOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getClassLiveStatus } from '../utils/classTimeUtils';
import { MeetingPlatformBadge, detectMeetingPlatform } from '../../../shared/utils/meetingPlatformUtils';
import { TeacherMeetingRoomModal } from '../../courses/components/TeacherMeetingRoomModal';
import { SessionRecordingUploadModal } from '../../materials/components/SessionRecordingUploadModal';

const { Title, Text, Paragraph } = Typography;

export const ClassLiveStatusModal = ({ visible, classData, onClose, role = 'academic', onClassUpdated }) => {
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();

  const [meetingModalOpen, setMeetingModalOpen] = React.useState(false);
  const [recordingModalOpen, setRecordingModalOpen] = React.useState(false);
  const [activeClass, setActiveClass] = React.useState(classData);

  React.useEffect(() => {
    setActiveClass(classData);
  }, [classData]);

  if (!activeClass) return null;

  const currentCls = activeClass;
  const liveStatus = getClassLiveStatus(currentCls, role);
  const studentsCount = Array.isArray(currentCls.studentIds)
    ? currentCls.studentIds.length
    : (Number(currentCls.totalStudents) || 0);
  const maxStudents = Number(currentCls.maxStudents) || 12;

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.success(isEnglish ? `Copied ${label} to clipboard!` : `Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  const singleMeetingUrl = currentCls.zoomStudentLink || currentCls.zoomHostLink || currentCls.meetingLink;
  const isSingleRoomLink =
    !currentCls.zoomHostLink ||
    !currentCls.zoomStudentLink ||
    currentCls.zoomHostLink === currentCls.zoomStudentLink ||
    singleMeetingUrl?.includes('meet.google.com');

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 24 }}>
          <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
            {classData.id}
          </Tag>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {classData.name}
          </span>
        </div>
      }
      style={{ borderRadius: 12 }}
    >
      {/* 1. Trạng Thái Real-time Của Lớp */}
      <Alert
        type={
          liveStatus.timeStatus === 'IN_PROGRESS'
            ? liveStatus.isAttendanceDone
              ? 'success'
              : 'error'
            : 'info'
        }
        showIcon
        icon={
          liveStatus.timeStatus === 'IN_PROGRESS' ? (
            <VideoCameraOutlined style={{ fontSize: 18 }} />
          ) : (
            <ClockCircleOutlined style={{ fontSize: 18 }} />
          )
        }
        style={{
          marginTop: 12,
          marginBottom: 16,
          borderRadius: 8,
          borderWidth: 1.5,
        }}
        message={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              {isEnglish ? liveStatus.statusLabelEn : liveStatus.statusLabelVi}
            </Text>
            <Tag color={liveStatus.statusTagColor} style={{ margin: 0, fontWeight: 600 }}>
              {liveStatus.startTime} — {liveStatus.endTime} (GMT+7)
            </Tag>
          </div>
        }
        description={
          liveStatus.timeStatus === 'IN_PROGRESS' && !liveStatus.isAttendanceDone && role === 'academic'
            ? (isEnglish
                ? 'Attendance has not been completed for this live session! Please alert teacher or assist checking in.'
                : 'Lớp học đang diễn ra nhưng chưa hoàn tất điểm danh! Giáo vụ vui lòng kiểm tra và hỗ trợ giáo viên check-in.')
            : (isEnglish
                ? 'Virtual classroom is operating under standard LAK EDUCATION guidelines.'
                : 'Phòng học trực tuyến đang vận hành theo chuẩn quy trình đào tạo LAK EDUCATION.')
        }
      />

      {/* 2. Chi Tiết Thông Tin Phòng Học */}
      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2 }}
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label={isEnglish ? 'Program / Level' : 'Chương Trình / Cấp Độ'}>
          <Tag color="purple">{classData.courseLevel || classData.courseName || 'Wonders ELA'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Foreign Teacher' : 'Giáo Viên Bản Xứ'}>
          <Text strong>{classData.teacherName || 'Chưa phân công'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Weekly Schedule' : 'Lịch Học Hàng Tuần'}>
          {classData.schedule || 'Chưa xếp lịch'}
        </Descriptions.Item>
        <Descriptions.Item label={isEnglish ? 'Students Capacity' : 'Sĩ Số Học Viên'}>
          <Text strong style={{ color: studentsCount >= maxStudents ? '#cf1322' : '#16a34a' }}>
            {studentsCount} / {maxStudents} {isEnglish ? 'students' : 'học viên'}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      {/* 3. Khối Truy Cập Phòng Học Trực Tuyến */}
      <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Title level={5} style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>
            <VideoCameraOutlined style={{ color: '#1890ff', marginRight: 6 }} />
            {isEnglish ? 'Virtual Classroom Connectivity & Meeting Credentials' : 'Kết Nối Trực Tiếp Phòng Học'}
          </Title>
          {(classData.zoomStudentLink || classData.zoomHostLink) && (
            <MeetingPlatformBadge url={classData.zoomStudentLink || classData.zoomHostLink} size="small" />
          )}
        </div>

        <Row gutter={[12, 10]}>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid #d9d9d9' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Meeting ID:</div>
                <Text strong style={{ fontSize: 13 }}>{classData.meetingId || '888 999 111'}</Text>
              </div>
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(classData.meetingId || '888 999 111', 'Meeting ID')} />
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid #d9d9d9' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Passcode:</div>
                <Text strong style={{ fontSize: 13 }}>{classData.passcode || '123456'}</Text>
              </div>
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(classData.passcode || '123456', 'Passcode')} />
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {isSingleRoomLink ? (
            singleMeetingUrl && (
              <Button
                type="primary"
                icon={detectMeetingPlatform(singleMeetingUrl).icon}
                style={{ backgroundColor: '#1890ff', borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => window.open(singleMeetingUrl, '_blank')}
              >
                {isEnglish ? 'Join Online Classroom' : 'Vào Phòng Học Trực Tuyến'}
              </Button>
            )
          ) : (
            <>
              {currentCls.zoomHostLink && (
                <Button
                  type="primary"
                  icon={detectMeetingPlatform(currentCls.zoomHostLink).icon}
                  style={{ backgroundColor: '#1890ff', borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => window.open(currentCls.zoomHostLink, '_blank')}
                >
                  {isEnglish ? 'Open Room (Host)' : 'Mở Phòng (Host GV)'}
                </Button>
              )}

              {currentCls.zoomStudentLink && (
                <Button
                  icon={detectMeetingPlatform(currentCls.zoomStudentLink).icon}
                  style={{ borderColor: '#52c41a', color: '#16a34a', borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => window.open(currentCls.zoomStudentLink, '_blank')}
                >
                  {isEnglish ? 'Join Meeting (Students)' : 'Link Tham Gia (Học Viên)'}
                </Button>
              )}
            </>
          )}

          {role !== 'teacher' && currentCls.zaloGroupLink && (
            <Button
              icon={<MessageOutlined style={{ color: '#0068ff' }} />}
              style={{ borderColor: '#0068ff', color: '#0068ff', borderRadius: 8 }}
              onClick={() => window.open(currentCls.zaloGroupLink, '_blank')}
            >
              {isEnglish ? 'Zalo Group' : 'Nhóm Zalo Lớp'}
            </Button>
          )}

          {role === 'teacher' && (
            <Button
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              style={{ borderColor: '#0284c7', color: '#0284c7', borderRadius: 8, fontWeight: 600 }}
              onClick={() => setMeetingModalOpen(true)}
            >
              {isEnglish ? 'Edit Meeting Links' : 'Cập Nhật Link Phòng'}
            </Button>
          )}

          {(role === 'teacher' || role === 'academic' || role === 'admin' || role === 'director') && (
            <Button
              icon={<VideoCameraOutlined style={{ color: '#7c3aed' }} />}
              style={{ borderColor: '#d8b4fe', color: '#7c3aed', borderRadius: 8, fontWeight: 600, backgroundColor: '#faf5ff' }}
              onClick={() => setRecordingModalOpen(true)}
              data-testid="btn-live-modal-upload-recording"
            >
              {isEnglish ? 'Upload Recording (Optional)' : 'Tải Lên Video Buổi Học (Tùy Chọn)'}
            </Button>
          )}
        </div>
      </div>

      {/* 4. Thao Tác Chuyển Hướng Nghiệp Vụ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button
          onClick={() => {
            onClose();
            navigate(`/class-attendance-evaluation?classId=${currentCls.id}`);
          }}
          style={{ borderRadius: 8 }}
        >
          {isEnglish ? 'Take Attendance / Evaluation' : 'Sổ Điểm Danh & Nhận Xét'} <ArrowRightOutlined />
        </Button>

        <Button
          type="primary"
          onClick={() => {
            onClose();
            navigate('/courses-classes?tab=classes');
          }}
          style={{ borderRadius: 8, backgroundColor: '#0958d9' }}
        >
          {isEnglish ? 'Class Management Details' : 'Chi Tiết Hồ Sơ Lớp'} <ArrowRightOutlined />
        </Button>
      </div>

      {/* Modal Cập Nhật Link Phòng Cho Giáo Viên */}
      <TeacherMeetingRoomModal
        open={meetingModalOpen}
        classData={currentCls}
        onClose={() => setMeetingModalOpen(false)}
        onSuccess={(updated) => {
          setActiveClass(updated);
          onClassUpdated?.(updated);
        }}
      />

      {/* Modal Tải Lên Video Buổi Học Cho Lớp */}
      <SessionRecordingUploadModal
        open={recordingModalOpen}
        classData={currentCls}
        currentUser={{ role }}
        onClose={() => setRecordingModalOpen(false)}
        onSuccess={() => {
          setRecordingModalOpen(false);
          message.success(isEnglish ? 'Recording uploaded and shared to class!' : 'Đã tải lên video bài giảng cho lớp!');
        }}
      />
    </Modal>
  );
};

