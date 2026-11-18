import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Space, Rate, Modal, Divider, Empty, Row, Col } from 'antd';
import {
  SafetyCertificateOutlined,
  EyeOutlined,
  CalendarOutlined,
  GlobalOutlined,
  SoundOutlined,
  ReadOutlined,
  EditOutlined,
  CustomerServiceOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { FormattedText } from '../../../shared/components/controls';
import { MaterialPreviewModal } from '../../materials/components/MaterialPreviewModal';

const { Title, Text, Paragraph } = Typography;

export const StudentRecentEvaluationsCard = ({ evaluations = [] }) => {
  const { isEnglish } = useLanguage();
  const [selectedEval, setSelectedEval] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  return (
    <>
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: 20,
          backgroundColor: '#ffffff',
        }}
        styles={{ body: { padding: '18px 20px' } }}
        data-testid="student-recent-evaluations-card"
      >
        {/* Header Đánh Giá Gần Nhất */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Space size={8}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              <SafetyCertificateOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>
                {isEnglish ? 'Recent Teacher Evaluations' : 'Các Đánh Giá Gần Nhất Của Giáo Viên'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isEnglish
                  ? 'Per-session assessments on 4 core English skills (Listening, Speaking, Reading, Writing)'
                  : 'Bảng đánh giá 4 kỹ năng cốt lõi và nhận xét sư phạm trực tiếp sau mỗi buổi học Zoom'}
              </Text>
            </div>
          </Space>

          {evaluations.length > 0 && (
            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700, padding: '3px 10px', fontSize: 12, margin: 0, whiteSpace: 'nowrap' }}>
              {isEnglish ? `${evaluations.length} Recent Sessions` : `${evaluations.length} Buổi Học Gần Nhất`}
            </Tag>
          )}
        </div>

        {/* Danh Sách Đánh Giá */}
        {evaluations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={isEnglish ? 'No session evaluations yet' : 'Chưa có bản đánh giá nào từ giáo viên'}
            style={{ padding: '16px 0' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                data-testid={`eval-item-${ev.id}`}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setSelectedEval(ev)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <Space size={8} style={{ marginBottom: 4 }}>
                      <Tag color="blue" icon={<CalendarOutlined />} style={{ borderRadius: 4, margin: 0 }}>
                        {ev.sessionDate}
                      </Tag>
                      <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                        {ev.className}
                      </Text>
                    </Space>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      <GlobalOutlined style={{ marginRight: 4, color: '#7c3aed' }} />
                      {isEnglish ? 'Teacher:' : 'Giáo viên bản xứ:'} <Text strong>{ev.teacherName}</Text>
                      {ev.topic && (
                        <span>
                          {' • '}
                          <Text type="secondary">{ev.topic}</Text>
                        </span>
                      )}
                    </div>
                  </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Rate disabled allowHalf value={ev.overallRating || 4.5} style={{ fontSize: 13, color: '#f59e0b' }} />
                        <Text strong style={{ fontSize: 13, color: '#d97706', marginLeft: 2 }}>
                          {ev.overallRating || 4.5}
                        </Text>
                      </div>

                      {ev.recordingUrl && (
                        <Button
                          size="small"
                          icon={<VideoCameraOutlined style={{ color: '#7c3aed' }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingVideo(ev);
                          }}
                          style={{
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            borderColor: '#d8b4fe',
                            color: '#7c3aed',
                            backgroundColor: '#faf5ff',
                            whiteSpace: 'nowrap',
                          }}
                          data-testid={`btn-watch-recording-${ev.id}`}
                        >
                          {isEnglish ? 'Watch Video' : 'Xem Video'}
                        </Button>
                      )}

                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEval(ev);
                        }}
                        style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                        data-testid={`btn-view-eval-${ev.id}`}
                      >
                        {isEnglish ? 'Details' : 'Chi Tiết'}
                      </Button>
                    </div>
                </div>

                {/* Nhận xét của giáo viên */}
                {ev.teacherComment && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      backgroundColor: '#ffffff',
                      border: '1px solid #f1f5f9',
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ marginBottom: !isEnglish && ev.teacherCommentVi && ev.teacherCommentVi !== ev.teacherComment ? 4 : 0 }}>
                      <Text strong style={{ color: '#0958d9' }}>
                        💬 {isEnglish ? 'Teacher Remarks:' : `Nhận xét từ ${ev.teacherName}:`}{' '}
                      </Text>
                      <span style={{ color: '#1e293b' }}>
                        "<FormattedText content={ev.teacherComment} />"
                      </span>
                    </div>
                    {!isEnglish && ev.teacherCommentVi && ev.teacherCommentVi !== ev.teacherComment && (
                      <div style={{ color: '#475569', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                        <Text strong style={{ color: '#16a34a', whiteSpace: 'nowrap' }}>🇻🇳 Dịch: </Text>
                        <span>{ev.teacherCommentVi}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Xem Toàn Bộ Chi Tiết Báo Cáo Buổi Học */}
      {selectedEval && (
        <Modal
          open={Boolean(selectedEval)}
          title={
            <Space data-testid="student-evaluation-detail-modal-title">
              <SafetyCertificateOutlined style={{ color: '#16a34a' }} />
              <span>
                {isEnglish ? 'Session Evaluation Detail' : 'Chi Tiết Đánh Giá Buổi Học Trực Tuyến'} — {selectedEval.sessionDate}
              </span>
            </Space>
          }
          onCancel={() => setSelectedEval(null)}
          footer={[
            <Button key="close" type="primary" onClick={() => setSelectedEval(null)} style={{ borderRadius: 6 }}>
              {isEnglish ? 'Close' : 'Đóng'}
            </Button>,
          ]}
          width={640}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header tóm tắt */}
            <div style={{ backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>{selectedEval.className}</div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                    👨‍🏫 {isEnglish ? 'Teacher:' : 'Giáo viên:'} {selectedEval.teacherName} • 📅 {selectedEval.sessionDate}
                  </div>
                </div>
                <Tag color="green" style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, margin: 0 }}>
                  {selectedEval.attendance || 'Present'}
                </Tag>
              </div>
            </div>

            {/* Bảng điểm 4 kỹ năng ELA */}
            <div>
              <Text strong style={{ fontSize: 14, color: '#1e293b', marginBottom: 10, display: 'block' }}>
                ⭐ {isEnglish ? '4 Core ELA Skills Rating:' : 'Đánh Giá 4 Kỹ Năng Tiếng Anh Chuẩn Mỹ:'}
              </Text>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <CustomerServiceOutlined style={{ color: '#0ea5e9' }} /> {isEnglish ? 'Listening (Nghe hiểu)' : 'Kỹ Năng Nghe'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Rate disabled allowHalf value={selectedEval.listeningScore || 5} style={{ fontSize: 13, color: '#f59e0b' }} />
                      <Text strong>{selectedEval.listeningScore || 5} / 5</Text>
                    </div>
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <SoundOutlined style={{ color: '#10b981' }} /> {isEnglish ? 'Speaking (Giao tiếp & Phát âm)' : 'Kỹ Năng Nói & Phát Âm'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Rate disabled allowHalf value={selectedEval.speakingScore || 4.5} style={{ fontSize: 13, color: '#f59e0b' }} />
                      <Text strong>{selectedEval.speakingScore || 4.5} / 5</Text>
                    </div>
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <ReadOutlined style={{ color: '#8b5cf6' }} /> {isEnglish ? 'Reading (Đọc hiểu)' : 'Kỹ Năng Đọc Hiểu'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Rate disabled allowHalf value={selectedEval.readingScore || 5} style={{ fontSize: 13, color: '#f59e0b' }} />
                      <Text strong>{selectedEval.readingScore || 5} / 5</Text>
                    </div>
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <EditOutlined style={{ color: '#ec4899' }} /> {isEnglish ? 'Writing (Viết & Ngữ pháp)' : 'Kỹ Năng Viết'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Rate disabled allowHalf value={selectedEval.writingScore || 4} style={{ fontSize: 13, color: '#f59e0b' }} />
                      <Text strong>{selectedEval.writingScore || 4} / 5</Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Nhận xét sư phạm chi tiết */}
            <div style={{ backgroundColor: '#eff6ff', padding: '12px 14px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 13, marginBottom: 4 }}>
                💬 {isEnglish ? 'Foreign Teacher Assessment Remarks:' : 'Lời Nhận Xét Của Giáo Viên Bản Xứ:'}
              </div>
              <Paragraph style={{ margin: 0, fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>
                <FormattedText content={selectedEval.teacherComment} />
              </Paragraph>
              {selectedEval.teacherCommentVi && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#3b82f6', fontStyle: 'italic' }}>
                  🇻🇳 Dịch: {selectedEval.teacherCommentVi}
                </div>
              )}
            </div>

            {/* Khung Xem Video Buổi Học (nếu có recordingUrl) */}
            {selectedEval.recordingUrl && (
              <div
                style={{
                  backgroundColor: '#f5f3ff',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #ddd6fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#5b21b6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <VideoCameraOutlined /> {isEnglish ? 'Session Video Recording Available' : 'Video Buổi Học Đã Ghi Hình'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6d28d9', marginTop: 2 }}>
                    {isEnglish
                      ? 'Watch the foreign teacher class recording on Google Drive'
                      : 'Xem lại toàn bộ video bài giảng của giáo viên bản xứ trên Google Drive'}
                  </div>
                </div>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  style={{ borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed', fontWeight: 600 }}
                  onClick={() => setPlayingVideo(selectedEval)}
                  data-testid="btn-modal-watch-recording"
                >
                  {isEnglish ? 'Play Recording' : 'Phát Video'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal phát video bài giảng */}
      {playingVideo && (
        <MaterialPreviewModal
          open={Boolean(playingVideo)}
          material={{
            id: `rec_${playingVideo.id}`,
            title: `${isEnglish ? 'Session Recording' : 'Video Buổi Học'} — ${playingVideo.className} (${playingVideo.sessionDate})`,
            url: playingVideo.recordingUrl,
            type: 'VIDEO',
            courseName: playingVideo.className,
            description: playingVideo.teacherComment || 'Zoom session recording video',
          }}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </>
  );
};

export default StudentRecentEvaluationsCard;
