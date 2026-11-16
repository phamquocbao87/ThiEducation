import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Space, List, Empty, Tooltip } from 'antd';
import {
  FolderOpenOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  SoundOutlined,
  DesktopOutlined,
  VideoCameraOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { MaterialPreviewModal } from '../../materials/components/MaterialPreviewModal';

const { Title, Text, Paragraph } = Typography;

export const StudentClassMaterialsCard = ({ materials = [], myClasses = [], courses = [] }) => {
  const { isEnglish } = useLanguage();
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const getFormatMeta = (type = '') => {
    const t = type.toUpperCase();
    if (t === 'PDF') {
      return { icon: <FilePdfOutlined style={{ color: '#ef4444' }} />, color: 'red', label: 'PDF Book' };
    }
    if (t === 'AUDIO') {
      return { icon: <SoundOutlined style={{ color: '#10b981' }} />, color: 'green', label: 'Audio MP3' };
    }
    if (t === 'SLIDE') {
      return { icon: <DesktopOutlined style={{ color: '#f59e0b' }} />, color: 'gold', label: 'Slide 16:9' };
    }
    if (t === 'VIDEO') {
      return { icon: <VideoCameraOutlined style={{ color: '#6366f1' }} />, color: 'purple', label: 'Video MP4' };
    }
    return { icon: <BookOutlined style={{ color: '#0284c7' }} />, color: 'blue', label: 'Học Liệu' };
  };

  return (
    <>
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          backgroundColor: '#ffffff',
        }}
        styles={{ body: { padding: '18px 20px' } }}
        data-testid="student-class-materials-card"
      >
        {/* Header Tài Liệu Theo Lớp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Space size={8}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#fdf2f8',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              <FolderOpenOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>
                {isEnglish ? 'Class Learning Materials' : 'Tài Liệu Theo Lớp Học'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isEnglish
                  ? 'Preview live in-app or download textbooks, audios & slides'
                  : 'Xem trực tiếp hoặc tải sách giáo trình, audio phát âm & slide bài giảng'}
              </Text>
            </div>
          </Space>
        </div>

        {/* Danh Sách Tài Liệu Học Tập */}
        {materials.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={isEnglish ? 'No class materials available yet' : 'Chưa có tài liệu cho lớp này'}
            style={{ padding: '20px 0' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {materials.map((item) => {
              const meta = getFormatMeta(item.type);
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                  data-testid={`material-item-${item.id}`}
                >
                  {/* Hàng 1: Avatar + Tiêu đề + Metadata (chiếm trọn 100% bề rộng, minWidth: 0 chống rớt chữ) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                        <Text strong style={{ fontSize: 13, color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.4 }}>
                          {item.title}
                        </Text>
                        <Tag color={meta.color} style={{ fontSize: 10, lineHeight: '16px', margin: 0, padding: '0 4px', borderRadius: 4, flexShrink: 0 }}>
                          {meta.label}
                        </Tag>
                        {item.isSessionRecording && (
                          <Tag color="purple" style={{ fontSize: 10, lineHeight: '16px', margin: 0, padding: '0 4px', borderRadius: 4, flexShrink: 0 }}>
                            📹 {isEnglish ? 'Session Video' : 'Video Buổi Học'}
                          </Tag>
                        )}
                      </div>

                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                        {item.sessionDate ? `📅 ${item.sessionDate} • ` : ''}
                        {item.fileSize ? `${item.fileSize} • ` : ''}
                        {item.description || (isEnglish ? 'Curriculum resource' : 'Tài nguyên bài học')}
                      </div>
                    </div>
                  </div>

                  {/* Hàng 2: Cụm Nút Hành Động Preview & Download căn phải, không chèn ép cột text */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px dashed #f1f5f9' }}>
                    <Tooltip title={isEnglish ? 'Preview live in browser' : 'Xem trực tiếp trên ứng dụng'}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewMaterial(item)}
                        style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                        data-testid={`btn-preview-mat-${item.id}`}
                      >
                        {isEnglish ? 'Preview' : 'Xem'}
                      </Button>
                    </Tooltip>

                    <Tooltip title={isEnglish ? 'Download offline copy' : 'Tải về máy học offline'}>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{ borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap' }}
                        data-testid={`btn-download-mat-${item.id}`}
                      >
                        {isEnglish ? 'Download' : 'Tải Về'}
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal Preview Tài Liệu Đa Định Dạng */}
      {previewMaterial && (
        <MaterialPreviewModal
          open={Boolean(previewMaterial)}
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          courses={courses}
        />
      )}
    </>
  );
};

export default StudentClassMaterialsCard;

