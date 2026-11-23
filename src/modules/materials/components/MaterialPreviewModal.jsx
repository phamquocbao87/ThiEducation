import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Button,
  Card,
  Grid,
  Modal,
  Radio,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  CustomerServiceOutlined,
  DesktopOutlined,
  ExportOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  useMaterialViewTimer,
  formatClockDuration,
  formatHumanDuration,
} from '../../lesson-reader';
import {
  detectMaterialKind,
  extractYouTubeId,
  isGoogleDriveUrl,
  PREVIEW_KINDS,
  resolveEmbedUrl,
} from '../utils/materialPreviewUtils';

const { Text, Title, Paragraph } = Typography;

export const MaterialPreviewModal = ({
  open,
  material,
  onClose,
  courses = [],
  zIndex = 1200,
  trackingContext = null,
}) => {
  const { isEnglish } = useLanguage();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const slideContainerRef = useRef(null);
  const fullscreenShellRef = useRef(null);

  const [playbackSpeed, setPlaybackSpeed] = useState('1.0');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const kind = material ? detectMaterialKind(material) : PREVIEW_KINDS.GENERIC;
  const isYouTube = material ? Boolean(extractYouTubeId(material.url)) : false;
  const isDriveFile = material ? isGoogleDriveUrl(material.url) : false;
  const isDirectMedia =
    (kind === PREVIEW_KINDS.AUDIO && !isDriveFile) ||
    (kind === PREVIEW_KINDS.VIDEO && !isDriveFile && !isYouTube);

  // PDF, Video & Slides mặc định mở Toàn Màn Hình (100vw × 100dvh) để đọc/xem trọn vẹn và triệt tiêu lỗi 2 vùng scroll chồng nhau trên Mobile
  const isFullViewportKind =
    kind === PREVIEW_KINDS.PDF ||
    kind === PREVIEW_KINDS.VIDEO ||
    kind === PREVIEW_KINDS.SLIDES;
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    if (open && material) {
      setIsFullscreen(isMobile || isFullViewportKind);
    }
  }, [open, material?.id, material?.url, isMobile, isFullViewportKind]);

  const useFullscreenShell = Boolean(open && material && (isMobile || isFullscreen));
  const isDarkCinemaKind =
    kind === PREVIEW_KINDS.VIDEO ||
    kind === PREVIEW_KINDS.SLIDES ||
    kind === PREVIEW_KINDS.IMAGE;
  const isEmbeddedViewport =
    !material?.url?.startsWith('blob:') &&
    (kind === PREVIEW_KINDS.PDF ||
      kind === PREVIEW_KINDS.VIDEO ||
      kind === PREVIEW_KINDS.SLIDES ||
      kind === PREVIEW_KINDS.IMAGE);

  const trackingEnabled = Boolean(open && material && trackingContext?.enabled);
  const matTimer = useMaterialViewTimer({
    open: Boolean(open && material),
    enabled: trackingEnabled,
    isDirectMedia,
    classItem: trackingContext?.classItem || null,
    lessonPrep: trackingContext?.lessonPrep || null,
    studentUser: trackingContext?.studentUser || null,
    material: material || null,
    initialMaterialLog: trackingContext?.initialMaterialLog || null,
    onLogUpdated: trackingContext?.onLogUpdated || null,
  });

  const handleSafeClose = async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (trackingEnabled) {
      await matTimer.flushNow({ force: true });
    }
    onClose?.();
  };

  // Khóa cuộn nền (body + html) khi mở Full-Screen Shell -> loại bỏ 100% lỗi 2 vùng scroll đấu nhau trên Mobile
  useEffect(() => {
    if (!useFullscreenShell) return undefined;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, [useFullscreenShell]);

  // Hỗ trợ phím ESC để đóng an toàn (flush giờ xem trước khi đóng)
  useEffect(() => {
    if (!useFullscreenShell) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        e.stopPropagation();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [useFullscreenShell, trackingEnabled]);

  if (!material) return null;

  const embedUrl = resolveEmbedUrl(material.url, kind);
  const isFolder = kind === PREVIEW_KINDS.DRIVE_FOLDER;

  // Tìm tên khóa học đầy đủ
  const course = courses.find((c) => c.id === material.courseId);
  const courseLabel = course?.name || material.courseName || (isEnglish ? 'All Courses' : 'Toàn Trung Tâm');

  // Điều chỉnh tốc độ phát âm thanh (0.75x, 1.0x, 1.25x, 1.5x)
  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackSpeed(e.target.value);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Mở toàn màn hình gốc trình duyệt (Native Fullscreen API — hỗ trợ cả iOS Safari video)
  const handleToggleNativeFullscreen = () => {
    if (kind === PREVIEW_KINDS.VIDEO && videoRef.current) {
      if (typeof videoRef.current.webkitEnterFullscreen === 'function' && !document.fullscreenElement) {
        try {
          videoRef.current.webkitEnterFullscreen();
          return;
        } catch {
          // Fallback below
        }
      }
    }
    const target = slideContainerRef.current || fullscreenShellRef.current;
    if (!target) return;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  const handleToggleFullscreen = handleToggleNativeFullscreen;

  // Icon và màu sắc tương ứng theo định dạng
  const getFormatBadge = () => {
    switch (kind) {
      case PREVIEW_KINDS.PDF:
        return {
          icon: <FilePdfOutlined style={{ color: '#ef4444', fontSize: 20 }} />,
          tagColor: 'red',
          label: isEnglish ? 'PDF Document' : 'Tài Liệu PDF',
        };
      case PREVIEW_KINDS.AUDIO:
        return {
          icon: <CustomerServiceOutlined style={{ color: '#f97316', fontSize: 20 }} />,
          tagColor: 'orange',
          label: isEnglish ? 'Listening Audio' : 'Tệp Luyện Nghe',
        };
      case PREVIEW_KINDS.IMAGE:
        return {
          icon: <FileImageOutlined style={{ color: '#10b981', fontSize: 20 }} />,
          tagColor: 'green',
          label: isEnglish ? 'Image / Diagram' : 'Hình Ảnh Minh Họa',
        };
      case PREVIEW_KINDS.VIDEO:
        return {
          icon: <VideoCameraOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />,
          tagColor: 'purple',
          label: isEnglish ? 'Video Lesson' : 'Video Bài Giảng',
        };
      case PREVIEW_KINDS.SLIDES:
        return {
          icon: <DesktopOutlined style={{ color: '#06b6d4', fontSize: 20 }} />,
          tagColor: 'cyan',
          label: isEnglish ? 'Slides Presentation' : 'Bài Giảng Trình Chiếu',
        };
      case PREVIEW_KINDS.DRIVE_FOLDER:
        return {
          icon: <FolderOpenOutlined style={{ color: '#3b82f6', fontSize: 20 }} />,
          tagColor: 'blue',
          label: isEnglish ? 'Google Drive Folder' : 'Thư Mục Google Drive',
        };
      default:
        return {
          icon: <FileTextOutlined style={{ color: '#64748b', fontSize: 20 }} />,
          tagColor: 'default',
          label: isEnglish ? 'Curriculum Resource' : 'Học Liệu Số',
        };
    }
  };

  const badge = getFormatBadge();

  // Render khung nội dung xem trước dựa theo loại tệp
  const renderPreviewContent = () => {
    // 0. Phòng vệ URL tạm thời (blob:)
    if (material.url?.startsWith('blob:')) {
      return (
        <Card
          data-testid="preview-blob-warning-card"
          style={{
            borderRadius: 14,
            backgroundColor: '#fffbe6',
            border: '1px solid #ffe58f',
            textAlign: 'center',
            padding: '30px 16px',
          }}
        >
          <Title level={4} style={{ color: '#d48806', margin: '0 0 10px 0' }}>
            {isEnglish ? 'Temporary Session File' : 'Tệp Tạm Thời Cần Cập Nhật Liên Kết'}
          </Title>
          <Paragraph style={{ maxWidth: 540, margin: '0 auto 16px auto', color: '#873800', fontSize: 13 }}>
            {isEnglish
              ? 'This document was loaded from a temporary browser session buffer. Please update it with a permanent Google Drive or cloud storage link to view all pages directly.'
              : 'Tài liệu này được tải qua bộ nhớ tạm thời của phiên duyệt trước. Vui lòng cập nhật liên kết lưu trữ chính thức (Google Drive hoặc kho học liệu số) để xem toàn bộ trang trực tiếp.'}
          </Paragraph>
        </Card>
      );
    }

    // 1. Xem trước PDF (100% chiều cao khi ở Fullscreen Shell -> KHÔNG có 2 vùng scroll chồng nhau!)
    if (kind === PREVIEW_KINDS.PDF) {
      return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: useFullscreenShell ? '100%' : 'auto',
            borderRadius: useFullscreenShell ? 0 : 10,
            overflow: 'hidden',
            backgroundColor: '#525659',
          }}
        >
          <iframe
            src={embedUrl}
            title={material.title || 'PDF Preview'}
            data-testid="preview-pdf-iframe"
            style={{
              width: '100%',
              height: useFullscreenShell ? '100%' : 600,
              border: useFullscreenShell ? 'none' : '1px solid #e2e8f0',
              borderRadius: useFullscreenShell ? 0 : 10,
              backgroundColor: '#f8fafc',
              display: 'block',
            }}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      );
    }

    // 2. Trình phát âm thanh sư phạm (Audio MP3 / Drive Audio)
    if (kind === PREVIEW_KINDS.AUDIO) {
      // Trường hợp Google Drive Audio: Nhúng trình phát của Google Drive
      if (isDriveFile) {
        return (
          <div
            data-testid="preview-audio-drive-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: isMobile ? '16px 10px' : '24px 20px',
              backgroundColor: '#fff7ed',
              borderRadius: 16,
              border: '1px solid #fed7aa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <CustomerServiceOutlined style={{ fontSize: 32, color: '#ea580c' }} />
              <div>
                <Title level={4} style={{ margin: 0, color: '#7c2d12', fontWeight: 700 }}>
                  {material.title || material.fileName}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isEnglish ? 'Google Drive Audio Track' : 'File âm thanh luyện nghe giáo trình trên Google Drive'}
                </Text>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: 640, height: 160, borderRadius: 10, overflow: 'hidden', border: '1px solid #fed7aa' }}>
              <iframe
                src={embedUrl}
                title={material.title || 'Audio Preview'}
                data-testid="preview-audio-drive-iframe"
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                allow="autoplay"
              />
            </div>
          </div>
        );
      }

      // Trường hợp Audio trực tiếp: Trình phát HTML5 sư phạm kèm bộ chọn tốc độ đọc
      return (
        <div
          data-testid="preview-audio-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '20px 12px' : '36px 24px',
            backgroundColor: '#fff7ed',
            borderRadius: 16,
            border: '1px solid #fed7aa',
            boxShadow: '0 2px 10px rgba(249, 115, 22, 0.06)',
          }}
        >
          {/* Đĩa nhạc / Biểu tượng sóng âm thanh sinh động */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#ffedd5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: isPlayingAudio
                ? '0 0 0 10px rgba(249, 115, 22, 0.15), 0 4px 14px rgba(249, 115, 22, 0.3)'
                : '0 4px 14px rgba(249, 115, 22, 0.2)',
              border: '3px solid #ffffff',
              transition: 'all 0.3s ease',
            }}
          >
            {isPlayingAudio ? (
              <SoundOutlined style={{ fontSize: 38, color: '#ea580c' }} />
            ) : (
              <CustomerServiceOutlined style={{ fontSize: 38, color: '#ea580c' }} />
            )}
          </div>

          <Title level={4} style={{ margin: '0 0 4px 0', textAlign: 'center', color: '#7c2d12', fontWeight: 700 }}>
            {material.title || material.fileName}
          </Title>

          <Text type="secondary" style={{ fontSize: 13, marginBottom: 18, textAlign: 'center' }}>
            {material.fileName || (isEnglish ? 'Classroom Listening Track' : 'File âm thanh luyện nghe giáo trình')}
          </Text>

          {/* Native HTML5 Audio */}
          <audio
            ref={audioRef}
            controls
            autoPlay={false}
            src={material.url}
            data-testid="preview-audio-player"
            onPlay={() => {
              setIsPlayingAudio(true);
              if (trackingEnabled) matTimer.handleMediaPlay();
            }}
            onPause={() => {
              setIsPlayingAudio(false);
              if (trackingEnabled) matTimer.handleMediaPauseOrEnded();
            }}
            onEnded={() => {
              setIsPlayingAudio(false);
              if (trackingEnabled) matTimer.handleMediaPauseOrEnded();
            }}
            onTimeUpdate={(e) => {
              if (trackingEnabled) matTimer.handleMediaTimeUpdate(e.currentTarget);
            }}
            style={{
              width: '100%',
              maxWidth: 520,
              height: 48,
              borderRadius: 10,
              outline: 'none',
              marginBottom: 16,
            }}
          />

          {/* Bộ chọn tốc độ phát chuẩn sư phạm (ESL Speed Selector) */}
          <div
            data-testid="audio-speed-controller"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#ffedd5',
              padding: '6px 14px',
              borderRadius: 20,
              marginBottom: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9a3412' }}>
              ⏱️ {isEnglish ? 'Playback Speed:' : 'Tốc độ nghe:'}
            </span>
            <Radio.Group
              size="small"
              value={playbackSpeed}
              onChange={handleSpeedChange}
              buttonStyle="solid"
              data-testid="audio-speed-radio-group"
            >
              <Radio.Button value="0.75" style={{ borderRadius: '12px 0 0 12px', fontSize: 12 }}>
                0.75x ({isEnglish ? 'Slow' : 'Chậm'})
              </Radio.Button>
              <Radio.Button value="1.0" style={{ fontSize: 12 }}>
                1.0x ({isEnglish ? 'Normal' : 'Chuẩn'})
              </Radio.Button>
              <Radio.Button value="1.25" style={{ fontSize: 12 }}>
                1.25x
              </Radio.Button>
              <Radio.Button value="1.5" style={{ borderRadius: '0 12px 12px 0', fontSize: 12 }}>
                1.5x
              </Radio.Button>
            </Radio.Group>
          </div>

          <Paragraph
            style={{
              fontSize: 12,
              color: '#9a3412',
              margin: '6px 0 0 0',
              textAlign: 'center',
              maxWidth: 480,
            }}
          >
            💡 {isEnglish
              ? 'Pedagogical audio player with speed tuning for ESL pronunciation & listening comprehension.'
              : 'Trình phát âm thanh sư phạm hỗ trợ điều chỉnh tốc độ đọc, phù hợp cho học sinh luyện nghe phát âm chuẩn bản ngữ.'}
          </Paragraph>
        </div>
      );
    }

    // 3. Xem trước Slide thuyết trình / Google Slides (100% chiều cao ở Fullscreen Shell hoặc 16:9 ở Modal)
    if (kind === PREVIEW_KINDS.SLIDES) {
      return (
        <div
          ref={slideContainerRef}
          data-testid="preview-slides-container"
          style={{
            position: 'relative',
            width: '100%',
            height: useFullscreenShell ? '100%' : 'auto',
            borderRadius: useFullscreenShell ? 0 : 12,
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            border: useFullscreenShell ? 'none' : '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Thanh công cụ tiêu đề slide & nút Fullscreen (chỉ hiện trong Modal thu gọn để tránh lặp header) */}
          {!useFullscreenShell && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
              }}
            >
              <Space size="small">
                <DesktopOutlined style={{ color: '#06b6d4', fontSize: 16 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                  {material.title || 'Slide Presentation'}
                </span>
              </Space>
              <Tooltip title={isEnglish ? 'Toggle Fullscreen Mode' : 'Chế độ Trình chiếu Toàn Màn Hình'}>
                <Button
                  type="text"
                  size="small"
                  icon={<FullscreenOutlined style={{ color: '#38bdf8' }} />}
                  onClick={handleToggleFullscreen}
                  data-testid="btn-slide-fullscreen"
                  style={{ color: '#38bdf8' }}
                >
                  {!isMobile && (isEnglish ? 'Fullscreen' : 'Toàn màn hình')}
                </Button>
              </Tooltip>
            </div>
          )}

          {/* Iframe */}
          <div
            style={
              useFullscreenShell
                ? { position: 'relative', width: '100%', flex: 1, minHeight: 0 }
                : { position: 'relative', width: '100%', paddingBottom: isMobile ? '70%' : '56.25%', height: 0 }
            }
          >
            <iframe
              src={embedUrl}
              title={material.title || 'Slide Preview'}
              data-testid="preview-slides-iframe"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#ffffff',
              }}
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    // 4. Trình phát Video (YouTube, Google Drive, hoặc MP4 trực tiếp — Full Cinema Stage ở Fullscreen Shell)
    if (kind === PREVIEW_KINDS.VIDEO) {
      // Trường hợp YouTube: Dùng youtube-nocookie
      if (isYouTube) {
        return (
          <div
            data-testid="preview-video-youtube-container"
            style={{
              position: 'relative',
              width: '100%',
              height: useFullscreenShell ? '100%' : 'auto',
              borderRadius: useFullscreenShell ? 0 : 12,
              overflow: 'hidden',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: useFullscreenShell ? 'none' : '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={
                useFullscreenShell
                  ? { position: 'relative', width: '100%', height: '100%' }
                  : { position: 'relative', width: '100%', paddingBottom: isMobile ? '65%' : '56.25%', height: 0 }
              }
            >
              <iframe
                src={embedUrl}
                title={material.title || 'YouTube Lesson Video'}
                data-testid="preview-video-youtube-iframe"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        );
      }

      // Trường hợp Google Drive Video: Iframe preview
      if (isDriveFile) {
        return (
          <div
            data-testid="preview-video-drive-container"
            style={{
              position: 'relative',
              width: '100%',
              height: useFullscreenShell ? '100%' : 'auto',
              borderRadius: useFullscreenShell ? 0 : 12,
              overflow: 'hidden',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: useFullscreenShell ? 'none' : '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={
                useFullscreenShell
                  ? { position: 'relative', width: '100%', height: '100%' }
                  : { position: 'relative', width: '100%', paddingBottom: isMobile ? '65%' : '56.25%', height: 0 }
              }
            >
              <iframe
                src={embedUrl}
                title={material.title || 'Drive Video Preview'}
                data-testid="preview-video-drive-iframe"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        );
      }

      // Trường hợp File Video MP4/WebM trực tiếp
      return (
        <div
          data-testid="preview-video-container"
          style={{
            backgroundColor: '#000000',
            borderRadius: useFullscreenShell ? 0 : 12,
            overflow: 'hidden',
            width: '100%',
            height: useFullscreenShell ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: useFullscreenShell ? 'none' : '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <video
            ref={videoRef}
            controls
            playsInline
            autoPlay={false}
            src={material.url}
            data-testid="preview-video-player"
            onPlay={() => {
              if (trackingEnabled) matTimer.handleMediaPlay();
            }}
            onPause={() => {
              if (trackingEnabled) matTimer.handleMediaPauseOrEnded();
            }}
            onEnded={() => {
              if (trackingEnabled) matTimer.handleMediaPauseOrEnded();
            }}
            onTimeUpdate={(e) => {
              if (trackingEnabled) matTimer.handleMediaTimeUpdate(e.currentTarget);
            }}
            style={
              useFullscreenShell
                ? {
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }
                : {
                    width: '100%',
                    maxHeight: isMobile ? 320 : 540,
                    aspectRatio: '16/9',
                    display: 'block',
                  }
            }
          />
        </div>
      );
    }

    // 5. Xem trước Hình ảnh
    if (kind === PREVIEW_KINDS.IMAGE) {
      return (
        <div
          data-testid="preview-image-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            borderRadius: useFullscreenShell ? 0 : 12,
            padding: useFullscreenShell ? 8 : 16,
            width: '100%',
            height: useFullscreenShell ? '100%' : 'auto',
            minHeight: useFullscreenShell ? 0 : isMobile ? 260 : 420,
            boxSizing: 'border-box',
          }}
        >
          <img
            src={material.url}
            alt={material.title || 'Preview'}
            data-testid="preview-image-element"
            style={{
              maxWidth: '100%',
              maxHeight: useFullscreenShell ? '100%' : isMobile ? 380 : 580,
              objectFit: 'contain',
              borderRadius: 6,
            }}
          />
        </div>
      );
    }

    // 6. Thư mục Google Drive
    if (kind === PREVIEW_KINDS.DRIVE_FOLDER) {
      return (
        <Card
          data-testid="preview-folder-card"
          style={{
            borderRadius: 14,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            textAlign: 'center',
            padding: isMobile ? '20px 10px' : '36px 20px',
          }}
        >
          <FolderOpenOutlined style={{ fontSize: 56, color: '#2563eb', marginBottom: 14 }} />
          <Title level={4} style={{ color: '#1e3a8a', margin: '0 0 6px 0', fontWeight: 700 }}>
            {material.title}
          </Title>
          <Paragraph style={{ color: '#3b82f6', fontSize: 13, maxWidth: 540, margin: '0 auto 20px auto' }}>
            {isEnglish
              ? 'This is a shared Google Drive curriculum folder containing multiple lesson files, audios, and worksheets.'
              : 'Đây là thư mục giáo trình trên Google Drive chứa nhiều bài học, file nghe và phiếu bài tập bổ trợ.'}
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ExportOutlined />}
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="btn-open-drive-folder"
            style={{
              borderRadius: 8,
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              fontWeight: 600,
            }}
          >
            {isEnglish ? 'Open Folder in Google Drive' : 'Mở Thư Mục Trên Google Drive'}
          </Button>
        </Card>
      );
    }

    // 7. Định dạng chung khác (Docs / Office / General)
    return (
      <Card
        data-testid="preview-generic-card"
        style={{
          borderRadius: 14,
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          padding: '30px 16px',
        }}
      >
        <BookOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 12 }} />
        <Title level={4} style={{ margin: '0 0 6px 0' }}>
          {material.title || material.fileName}
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 500, margin: '0 auto 20px auto' }}>
          {material.description || (isEnglish ? 'Ready to open or download to your computer.' : 'Tài liệu đã sẵn sàng để xem hoặc tải về máy tính.')}
        </Paragraph>
        <Space size="middle" wrap>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="btn-open-generic-file"
            style={{ borderRadius: 8, backgroundColor: '#722ed1', borderColor: '#722ed1' }}
          >
            {isEnglish ? 'Open in New Tab' : 'Mở Trong Tab Mới'}
          </Button>
          <Button
            icon={<CloudDownloadOutlined />}
            href={material.url}
            download={material.fileName || material.title}
            data-testid="btn-download-generic-file"
            style={{ borderRadius: 8 }}
          >
            {isEnglish ? 'Download File' : 'Tải Về Máy'}
          </Button>
        </Space>
      </Card>
    );
  };

  const renderTrackingAndGuideStrip = (compact = false) => {
    if (!trackingEnabled && !material.pageLocation) return null;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          alignItems: compact ? 'center' : 'stretch',
          justifyContent: compact ? 'space-between' : 'flex-start',
          flexWrap: 'wrap',
          gap: compact ? 6 : 8,
          padding: compact ? (isMobile ? '6px 10px' : '6px 16px') : 0,
          marginBottom: compact ? 0 : 10,
          backgroundColor: compact
            ? isDarkCinemaKind
              ? '#1e293b'
              : '#f8fafc'
            : 'transparent',
          borderBottom: compact
            ? `1px solid ${isDarkCinemaKind ? '#334155' : '#e2e8f0'}`
            : 'none',
          flexShrink: 0,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {trackingEnabled && (
          <div
            data-testid="material-preview-tracking-bar"
            style={{
              padding: compact ? '4px 10px' : '8px 12px',
              borderRadius: 8,
              backgroundColor: matTimer.completed
                ? '#f0fdf4'
                : matTimer.isIdleCheckinNeeded
                ? '#fff7ed'
                : '#faf5ff',
              border: `1px solid ${
                matTimer.completed ? '#86efac' : matTimer.isIdleCheckinNeeded ? '#fdba74' : '#d8b4fe'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              fontSize: 12,
              flex: compact && !material.pageLocation ? 1 : '0 1 auto',
            }}
          >
            <Space size={6} wrap>
              {matTimer.completed ? (
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {isEnglish ? 'Completed' : isMobile ? 'Đạt chuẩn' : 'Đã xem đạt chuẩn'}
                </Tag>
              ) : matTimer.isIdleCheckinNeeded ? (
                <Tag color="warning" icon={<PauseCircleOutlined />} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {isEnglish ? 'Paused (Idle 2m)' : isMobile ? 'Tạm dừng' : 'Tạm dừng (2 phút chưa thao tác)'}
                </Tag>
              ) : isDirectMedia && !matTimer.isMediaPlaying ? (
                <Tag color="processing" icon={<PlayCircleOutlined />} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {isEnglish ? 'Press Play' : isMobile ? 'Bấm phát' : 'Bấm phát để bắt đầu tính giờ'}
                </Tag>
              ) : (
                <Tag color="purple" icon={<ClockCircleOutlined />} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {isEnglish ? 'Tracking' : isMobile ? 'Đang tính giờ' : 'Đang tính giờ xem tài liệu'}
                </Tag>
              )}

              <Text strong style={{ color: '#581c87', fontSize: 12, whiteSpace: 'nowrap' }} data-testid="material-preview-timer-clock">
                ⏱ {formatClockDuration(matTimer.activeSeconds)}
                {isDirectMedia
                  ? ` • ${isEnglish ? 'Watched' : 'Đã xem'} ${matTimer.mediaProgressPercent}% / 60%`
                  : ` / ${formatClockDuration(matTimer.requiredSeconds)} (${matTimer.progressPercent}%)`}
              </Text>
            </Space>

            {matTimer.isIdleCheckinNeeded && (
              <Button
                size="small"
                type="primary"
                onClick={matTimer.confirmActive}
                data-testid="btn-material-resume-tracking"
                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', fontWeight: 700, borderRadius: 6 }}
              >
                {isEnglish ? 'Continue' : 'Tiếp tục'}
              </Button>
            )}
          </div>
        )}

        {material.pageLocation && (
          <div
            data-testid="preview-page-location-banner"
            style={{
              padding: compact ? '4px 10px' : '8px 12px',
              borderRadius: 8,
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              color: '#92400e',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span>📍 {isEnglish ? (compact ? 'Guide:' : 'Teacher’s Page / Section Guide:') : (compact ? 'Vị trí dặn xem:' : 'Vị trí giáo viên dặn xem:')}</span>
            <Tag color="gold" style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#78350f' }}>
              {material.pageLocation}
            </Tag>
          </div>
        )}
      </div>
    );
  };

  if (!open) return null;

  // CHẾ ĐỘ TOÀN MÀN HÌNH 100vw × 100dvh (Mặc định cho PDF / Video / Slides và 100% Mobile -> triệt tiêu 2 vùng scroll chồng nhau!)
  if (useFullscreenShell) {
    const headerBg = isDarkCinemaKind ? '#0f172a' : '#ffffff';
    const headerBorder = isDarkCinemaKind ? '#1e293b' : '#e2e8f0';
    const titleColor = isDarkCinemaKind ? '#f8fafc' : '#1e293b';

    const fullscreenOverlay = (
      <div
        ref={fullscreenShellRef}
        data-testid="material-preview-fullscreen-shell"
        role="dialog"
        aria-modal="true"
        aria-label={material.title || material.fileName || 'Material Preview'}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          maxWidth: '100vw',
          maxHeight: '100dvh',
          zIndex,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          overscrollBehavior: 'none',
          backgroundColor: isDarkCinemaKind ? '#000000' : '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        {/* BAND 1: TOP BAR SIÊU GỌN (KHÔNG CUỘN) */}
        <header
          data-testid="material-preview-modal-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: isMobile ? '6px 10px' : '8px 16px',
            minHeight: 48,
            backgroundColor: headerBg,
            borderBottom: `1px solid ${headerBorder}`,
            flexShrink: 0,
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>{badge.icon}</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 14 : 15,
                color: titleColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={material.title || material.fileName}
            >
              {material.title || material.fileName}
            </span>
            {!isMobile && (
              <Tag color={badge.tagColor} style={{ borderRadius: 4, fontSize: 11, margin: 0, flexShrink: 0 }}>
                {badge.label}
              </Tag>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Tooltip title={isEnglish ? 'Open in New Tab' : 'Mở Tab Mới'}>
              <Button
                size="small"
                icon={<ExportOutlined />}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="btn-preview-open-tab"
                style={{
                  borderRadius: 8,
                  minHeight: 34,
                  minWidth: 34,
                  backgroundColor: isDarkCinemaKind ? '#1e293b' : undefined,
                  borderColor: isDarkCinemaKind ? '#334155' : undefined,
                  color: isDarkCinemaKind ? '#e2e8f0' : undefined,
                }}
              >
                {!isMobile && (isEnglish ? 'Open' : 'Mở Tab')}
              </Button>
            </Tooltip>

            {!isFolder && (
              <Tooltip title={isEnglish ? 'Download File' : 'Tải Về'}>
                <Button
                  size="small"
                  icon={<CloudDownloadOutlined />}
                  href={material.url}
                  download={material.fileName || material.title}
                  data-testid="btn-preview-download-file"
                  style={{
                    borderRadius: 8,
                    minHeight: 34,
                    minWidth: 34,
                    backgroundColor: isDarkCinemaKind ? '#1e293b' : undefined,
                    borderColor: isDarkCinemaKind ? '#334155' : undefined,
                    color: isDarkCinemaKind ? '#e2e8f0' : undefined,
                  }}
                >
                  {!isMobile && (isEnglish ? 'Download' : 'Tải Về')}
                </Button>
              </Tooltip>
            )}

            {/* Desktop: Cho phép thu gọn về cửa sổ Modal 920px; Mobile Video/Slides: Kích hoạt Native Fullscreen gốc */}
            {!isMobile ? (
              <Tooltip title={isEnglish ? 'Exit Full-Screen View' : 'Thu gọn cửa sổ'}>
                <Button
                  size="small"
                  icon={<FullscreenExitOutlined />}
                  onClick={() => setIsFullscreen(false)}
                  data-testid="btn-preview-toggle-fullscreen"
                  style={{
                    borderRadius: 8,
                    minHeight: 34,
                    backgroundColor: isDarkCinemaKind ? '#1e293b' : undefined,
                    borderColor: isDarkCinemaKind ? '#334155' : undefined,
                    color: isDarkCinemaKind ? '#38bdf8' : '#722ed1',
                    fontWeight: 600,
                  }}
                >
                  {isEnglish ? 'Compact' : 'Thu gọn'}
                </Button>
              </Tooltip>
            ) : (
              (kind === PREVIEW_KINDS.VIDEO || kind === PREVIEW_KINDS.SLIDES) && (
                <Tooltip title={isEnglish ? 'Native Fullscreen' : 'Phóng to toàn màn hình'}>
                  <Button
                    size="small"
                    icon={<FullscreenOutlined />}
                    onClick={handleToggleNativeFullscreen}
                    data-testid="btn-preview-native-fullscreen"
                    style={{
                      borderRadius: 8,
                      minHeight: 34,
                      minWidth: 34,
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      color: '#38bdf8',
                    }}
                  />
                </Tooltip>
              )
            )}

            <Button
              size="small"
              type="primary"
              icon={<CloseOutlined />}
              onClick={handleSafeClose}
              data-testid="btn-preview-close"
              style={{
                borderRadius: 8,
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                fontWeight: 700,
                minHeight: 34,
                minWidth: isMobile ? 38 : 76,
              }}
            >
              {!isMobile && (isEnglish ? 'Close' : 'Đóng')}
            </Button>
          </div>
        </header>

        {/* BAND 2: THANH TRACKING + VỊ TRÍ DẶN XEM GỌN (KHÔNG CUỘN) */}
        {renderTrackingAndGuideStrip(true)}

        {/* BAND 3: VÙNG NỘI DUNG CHÍNH — FULL 100% CHIỀU CAO CÒN LẠI (CHỈ 1 VÙNG SCROLL DUY NHẤT) */}
        <main
          data-testid="material-preview-fullscreen-stage"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            position: 'relative',
            overflow: isEmbeddedViewport ? 'hidden' : 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: isEmbeddedViewport ? 0 : isMobile ? 12 : 24,
            backgroundColor: isDarkCinemaKind ? '#000000' : '#f8fafc',
            boxSizing: 'border-box',
          }}
        >
          {renderPreviewContent()}
        </main>
      </div>
    );

    return ReactDOM.createPortal(fullscreenOverlay, document.body);
  }

  // CHẾ ĐỘ MODAL GỌN TRÊN DESKTOP (cho Audio / Folder / Generic hoặc khi người dùng bấm Thu gọn)
  return (
    <Modal
      open={open}
      onCancel={handleSafeClose}
      zIndex={zIndex}
      width={isMobile ? '100%' : 920}
      style={{ top: isMobile ? 0 : 25, paddingBottom: isMobile ? 0 : 20, maxWidth: '100vw' }}
      styles={{ body: { padding: isMobile ? '12px' : '18px 24px' } }}
      destroyOnClose={true} // Tự động dừng audio/video khi đóng modal
      title={
        <div
          data-testid="material-preview-modal-title"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingRight: 28, flexWrap: 'wrap' }}
        >
          <Space align="center" size="small">
            {badge.icon}
            <div>
              <span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: '#1e293b' }}>
                {material.title || material.fileName}
              </span>
              <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                <Tag color={badge.tagColor} style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                  {badge.label}
                </Tag>
                {material.courseLevel && (
                  <Tag color="purple" style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                    {material.courseLevel}
                  </Tag>
                )}
                {material.fileSize && (
                  <Tag style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                    {material.fileSize}
                  </Tag>
                )}
              </div>
            </div>
          </Space>

          <Button
            size="small"
            icon={<FullscreenOutlined />}
            onClick={() => setIsFullscreen(true)}
            data-testid="btn-preview-toggle-fullscreen"
            style={{ borderRadius: 8, color: '#722ed1', borderColor: '#d8b4fe', fontWeight: 600 }}
          >
            {isEnglish ? 'Full Screen' : 'Toàn màn hình'}
          </Button>
        </div>
      }
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', width: isMobile ? '100%' : 'auto' }}>
            <span>📚 <strong>{isEnglish ? 'Course:' : 'Khóa học:'}</strong> {courseLabel}</span>
            {material.firebaseFolder && (
              <span>• 📁 <strong>{isEnglish ? 'Folder:' : 'Thư mục:'}</strong> {material.firebaseFolder}</span>
            )}
          </div>

          <Space size={6} wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            <Button
              icon={<ExportOutlined />}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="btn-preview-open-tab"
              style={{ borderRadius: 8, whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none' }}
            >
              {isEnglish ? 'Open' : (isMobile ? 'Mở Tab' : 'Mở Tab Mới')}
            </Button>
            {!isFolder && (
              <Button
                icon={<CloudDownloadOutlined />}
                href={material.url}
                download={material.fileName || material.title}
                data-testid="btn-preview-download-file"
                style={{ borderRadius: 8, whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none' }}
              >
                {isEnglish ? 'Download' : 'Tải Về'}
              </Button>
            )}
            <Button
              type="primary"
              icon={<CloseOutlined />}
              onClick={handleSafeClose}
              data-testid="btn-preview-close"
              style={{
                borderRadius: 8,
                backgroundColor: '#722ed1',
                borderColor: '#722ed1',
                whiteSpace: 'nowrap',
                minWidth: 80,
                flex: isMobile ? 1 : 'none',
              }}
            >
              {isEnglish ? 'Close' : 'Đóng'}
            </Button>
          </Space>
        </div>
      }
    >
      {renderTrackingAndGuideStrip(false)}
      {renderPreviewContent()}
    </Modal>
  );
};

export default MaterialPreviewModal;
