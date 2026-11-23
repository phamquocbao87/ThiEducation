import React, { useState } from 'react';
import { Tag, Button, Space, Typography, Progress, Empty } from 'antd';
import {
  BookOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  ExpandOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { FormattedText } from '../../../shared/components/controls';
import { MaterialPreviewModal } from '../../materials/components/MaterialPreviewModal';
import {
  COMPACT_PREVIEW_ROWS,
  computeMinRequiredSeconds,
  formatHumanDuration,
  getPrepStatusMeta,
  isObjectiveSectionHeading,
  PREP_STATUS,
} from '../models/lessonReader.model';

const { Text, Paragraph } = Typography;

/**
 * LessonOverviewCompactCard — Phiên bản rút gọn thông minh của "Tổng Quan Bài Học (Lesson Overview)"
 * - Desktop: tối đa 4 dòng mục tiêu + hiệu ứng fade-out.
 * - Mobile: tối đa 3 dòng mục tiêu + Zero Overflow-X.
 * - Cho phép tap vào toàn bộ khung để mở Full-Screen Book Reader Viewer.
 */
export const LessonOverviewCompactCard = ({
  activePrepClass = null,
  lessonPrep = null,
  availablePlans = [],
  onSelectSession = null,
  readingLog = null,
  studentUser = null,
  onLogUpdated = null,
  isStudentRole = true,
  onOpenReader = null,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const maxVisibleRows = isMobile ? COMPACT_PREVIEW_ROWS.MOBILE : COMPACT_PREVIEW_ROWS.DESKTOP;
  const objectives = Array.isArray(lessonPrep?.objectives) ? lessonPrep.objectives : [];
  const visibleObjectives = objectives.slice(0, maxVisibleRows);
  const hiddenCount = Math.max(0, objectives.length - maxVisibleRows);

  const minRequiredSeconds = computeMinRequiredSeconds(objectives.length);
  const preSeconds = Number(readingLog?.preClassActiveSeconds) || 0;
  const totalSeconds = Number(readingLog?.totalActiveSeconds) || 0;
  const maxScrollPct = Number(readingLog?.maxScrollPercent) || 0;
  const prepStatus = readingLog?.prepStatus || PREP_STATUS.NOT_STARTED;
  const statusMeta = getPrepStatusMeta(prepStatus, isEnglish);
  const readingPercent = Math.min(100, Math.round((preSeconds / minRequiredSeconds) * 100));

  const handleTriggerOpen = () => {
    if (lessonPrep && onOpenReader) {
      onOpenReader();
    }
  };

  return (
    <div
      style={{
        padding: isMobile ? '12px' : '14px 16px',
        borderRadius: 10,
        backgroundColor: '#faf5ff',
        border: '1.5px solid #e9d5ff',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      data-testid="pre-class-prep-guide"
    >
      {/* Huy Hiệu Nhận Diện Rõ Tên Lớp & Mã Lớp */}
      <div
        data-testid="active-prep-class-badge"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '8px 10px' : '10px 14px',
          backgroundColor: '#f3e8ff',
          borderRadius: 8,
          border: '1.5px solid #d8b4fe',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <Tag
            color="purple"
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              margin: 0,
              backgroundColor: '#7e22ce',
              color: '#ffffff',
              border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            🏫 {activePrepClass?.id || activePrepClass?.code || 'LỚP'}
          </Tag>
          <Text strong style={{ fontSize: isMobile ? 13 : 14, color: '#581c87' }}>
            {activePrepClass?.name}
          </Text>
          <Tag color="cyan" style={{ fontSize: 11, borderRadius: 4, margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {activePrepClass?.courseLevel || 'Wonders ELA'}
          </Tag>
        </div>
        <div style={{ fontSize: 12, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>👨‍🏫 {activePrepClass?.teacherName || 'Teacher Maj'}</span>
          <span>•</span>
          <span>📅 {activePrepClass?.schedule || 'Lịch học'}</span>
        </div>
      </div>

      {/* Dải chọn nhanh buổi học khi lớp có >= 2 giáo án READY */}
      {Array.isArray(availablePlans) && availablePlans.length > 1 && typeof onSelectSession === 'function' && (
        <div
          data-testid="lesson-overview-session-switcher"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            overflowX: 'auto',
            paddingBottom: 2,
            scrollbarWidth: 'none',
          }}
        >
          <Text strong style={{ fontSize: 11, color: '#6b21a8', whiteSpace: 'nowrap', flexShrink: 0 }}>
            📚 {isEnglish ? 'Sessions:' : 'Chọn buổi:'}
          </Text>
          {availablePlans.map((p) => {
            const isActive = Number(p.sessionIndex) === Number(lessonPrep?.sessionIndex);
            return (
              <Button
                key={p.sessionIndex}
                size="small"
                type={isActive ? 'primary' : 'default'}
                data-testid={`btn-overview-session-${p.sessionIndex}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSession(p.sessionIndex);
                }}
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: isActive ? '#7e22ce' : '#ffffff',
                  borderColor: isActive ? '#7e22ce' : '#d8b4fe',
                  color: isActive ? '#ffffff' : '#6b21a8',
                }}
              >
                {isEnglish ? `Session ${p.sessionIndex}` : `Buổi ${p.sessionIndex}`}
                {p.date ? ` (${String(p.date).slice(5)})` : ''}
              </Button>
            );
          })}
        </div>
      )}

      {!lessonPrep ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            isEnglish
              ? `📚 Upcoming lesson materials & Wonders curriculum are being finalized before class. Have a great and engaging session!`
              : `📚 Bài học và tài liệu đọc trước cho buổi học đang được hoàn thiện trước giờ học. Chúc con có một buổi học thật vui và bổ ích!`
          }
          style={{ padding: '16px 0' }}
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleTriggerOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTriggerOpen();
            }
          }}
          data-testid="lesson-overview-compact-trigger"
          style={{
            cursor: 'pointer',
            borderRadius: 10,
            padding: isMobile ? '10px' : '12px 14px',
            backgroundColor: '#ffffff',
            border: '1px solid #d8b4fe',
            boxShadow: '0 2px 8px rgba(126, 34, 206, 0.06)',
          }}
        >
          {/* Header Tổng Quan Bài Học + Trạng Thái Đọc Bài */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <Space size={6} wrap>
              <BookOutlined style={{ color: '#9333ea', fontSize: 16 }} />
              <Text strong style={{ fontSize: 14, color: '#581c87' }}>
                {isEnglish ? 'Lesson Overview:' : 'Tổng Quan Bài Học (Lesson Overview):'}
              </Text>
            </Space>

            <Space size={6} wrap>
              {isStudentRole && (
                <Tag
                  data-testid="lesson-prep-reading-status-badge"
                  style={{
                    margin: 0,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 11,
                    backgroundColor: statusMeta.bg,
                    borderColor: statusMeta.border,
                    color: statusMeta.textColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {statusMeta.icon} {statusMeta.label}
                  {totalSeconds > 0 ? ` (${formatHumanDuration(totalSeconds, isEnglish)})` : ''}
                </Tag>
              )}
              {lessonPrep.isRealPlan && (
                <Tag color="success" style={{ borderRadius: 4, margin: 0, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {isEnglish
                    ? `Session ${lessonPrep.sessionIndex} • ${lessonPrep.authorName}`
                    : `Buổi ${lessonPrep.sessionIndex} • ${lessonPrep.authorName}`}
                </Tag>
              )}
              {lessonPrep.date && (
                <Tag color="default" style={{ borderRadius: 4, margin: 0, fontSize: 11, whiteSpace: 'nowrap' }}>
                  📅 {lessonPrep.date}
                </Tag>
              )}
            </Space>
          </div>

          {/* Thanh tiến trình đọc bài mini cho Học Viên */}
          {isStudentRole && (
            <div
              data-testid="lesson-prep-mini-progress"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 10px',
                borderRadius: 8,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              <ClockCircleOutlined style={{ color: '#7e22ce', fontSize: 13 }} />
              <Text style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                {isEnglish
                  ? `Pre-class reading goal: ${formatHumanDuration(preSeconds, true)} / ${formatHumanDuration(minRequiredSeconds, true)}`
                  : `Tiến độ đọc bài trước giờ: ${formatHumanDuration(preSeconds, false)} / ${formatHumanDuration(minRequiredSeconds, false)}`}
              </Text>
              <div style={{ flex: 1, minWidth: 90 }}>
                <Progress
                  percent={readingPercent}
                  size="small"
                  strokeColor={prepStatus === PREP_STATUS.PREPARED ? '#16a34a' : '#9333ea'}
                  showInfo={false}
                  style={{ margin: 0 }}
                />
              </div>
              <Text style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                {isEnglish ? `Scrolled ${maxScrollPct}%` : `Đã xem ${maxScrollPct}%`}
              </Text>
            </div>
          )}

          {/* Tiêu đề bài học giáo viên đã soạn */}
          {lessonPrep.lessonTitle && (
            <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: '#3b0764', marginBottom: 10, lineHeight: 1.4 }}>
              📖 {lessonPrep.lessonTitle}
            </div>
          )}

          {/* 1. Danh sách Mục tiêu RÚT GỌN (Desktop: tối đa 4 dòng, Mobile: tối đa 3 dòng) */}
          {visibleObjectives.length > 0 && (
            <div
              style={{
                position: 'relative',
                marginBottom: 10,
              }}
              data-testid="lesson-plan-objectives"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 6 }}>
                <Text strong style={{ fontSize: 12, color: '#6b21a8' }}>
                  🎯 {isEnglish ? 'Lesson Objectives & Academic Content:' : 'Mục Tiêu Bài Học & Nội Dung Giảng Dạy:'}
                </Text>
                <Tag color="purple" style={{ margin: 0, fontSize: 11, borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {isEnglish
                    ? `${visibleObjectives.length}/${objectives.length} items`
                    : `Hiện ${visibleObjectives.length}/${objectives.length} mục`}
                </Tag>
              </div>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                }}
              >
                {visibleObjectives.map((obj, idx) => {
                  const isHeading = isObjectiveSectionHeading(obj);
                  return (
                    <div
                      key={idx}
                      data-testid={`compact-objective-row-${idx}`}
                      style={{
                        fontSize: 13,
                        color: isHeading ? '#581c87' : '#1e293b',
                        fontWeight: isHeading ? 700 : 400,
                        padding: isHeading ? '4px 10px' : '5px 10px',
                        backgroundColor: isHeading ? '#f3e8ff' : '#faf5ff',
                        borderRadius: 6,
                        borderLeft: `3px solid ${isHeading ? '#7e22ce' : '#c084fc'}`,
                        lineHeight: 1.45,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <FormattedText content={obj} />
                    </div>
                  );
                })}

                {/* Hiệu ứng mờ dần (Fade-out gradient) khi còn nội dung ẩn */}
                {hiddenCount > 0 && (
                  <div
                    data-testid="lesson-overview-fade-overlay"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 36,
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 85%, #ffffff 100%)',
                      pointerEvents: 'none',
                      borderRadius: '0 0 6px 6px',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 2. Tóm tắt gọn Student Prep & Homework (ellipsis 2 dòng) */}
          {(lessonPrep.studentPrep || lessonPrep.homework) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : (lessonPrep.studentPrep && lessonPrep.homework ? '1fr 1fr' : '1fr'),
                gap: 8,
                marginBottom: 10,
              }}
            >
              {lessonPrep.studentPrep && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                  data-testid="lesson-plan-student-prep"
                >
                  <Text strong style={{ fontSize: 11, color: '#15803d', display: 'block', marginBottom: 2 }}>
                    📖 {isEnglish ? 'Student Pre-Class Prep:' : 'Chuẩn Bị Trước Giờ Học:'}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ margin: 0, fontSize: 12, color: '#166534', fontWeight: 600, lineHeight: 1.4 }}
                  >
                    {lessonPrep.studentPrep}
                  </Paragraph>
                </div>
              )}

              {lessonPrep.homework && (
                <div
                  style={{
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                  data-testid="lesson-plan-homework"
                >
                  <Text strong style={{ fontSize: 11, color: '#c2410c', display: 'block', marginBottom: 2 }}>
                    📚 {isEnglish ? 'Assigned Homework:' : 'Bài Tập Về Nhà:'}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ margin: 0, fontSize: 12, color: '#9a3412', fontWeight: 600, lineHeight: 1.4 }}
                  >
                    {lessonPrep.homework}
                  </Paragraph>
                </div>
              )}
            </div>
          )}

          {/* 2.5. Dải tóm tắt tài liệu đính kèm buổi học (nếu GV đã chọn) */}
          {Array.isArray(lessonPrep.attachedMaterials) && lessonPrep.attachedMaterials.length > 0 && (
            <div
              data-testid="lesson-overview-attached-materials"
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 10,
                padding: '6px 10px',
                borderRadius: 8,
                backgroundColor: '#f5f3ff',
                border: '1px solid #ddd6fe',
              }}
            >
              <Text strong style={{ fontSize: 11, color: '#6b21a8' }}>
                📎 {isEnglish ? 'Session Materials:' : 'Tài liệu buổi học:'}
              </Text>
              {lessonPrep.attachedMaterials.slice(0, 3).map((mat, idx) => {
                const matLog = readingLog?.materialLogs?.[String(mat.id)] || null;
                const matSec = Number(matLog?.activeSeconds) || 0;
                const matDone = Boolean(matLog?.completed);
                return (
                  <Tag
                    key={`${mat.id || idx}_${idx}`}
                    color={matDone ? 'success' : 'purple'}
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewMaterial({
                        ...mat,
                        courseName: activePrepClass?.name || activePrepClass?.courseName || '',
                      });
                    }}
                    data-testid={`btn-overview-preview-material-${mat.id || idx}`}
                    style={{ margin: 0, fontSize: 11, fontWeight: 600, maxWidth: '100%', whiteSpace: 'normal', cursor: 'pointer' }}
                  >
                    {mat.title}
                    {mat.pageLocation ? ` (📍 ${mat.pageLocation})` : ''}
                    {isStudentRole && matSec > 0 ? ` • ${matDone ? '✅' : '⏱'} ${formatHumanDuration(matSec, isEnglish)}` : ''}
                  </Tag>
                );
              })}
              {lessonPrep.attachedMaterials.length > 3 && (
                <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                  +{lessonPrep.attachedMaterials.length - 3}
                </Tag>
              )}
            </div>
          )}

          {/* 3. Thanh Chân Trang CTA Mở Sách Đọc Full-Screen */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
              paddingTop: 8,
              borderTop: '1px dashed #e9d5ff',
            }}
          >
            <Button
              type="primary"
              icon={isStudentRole ? <ReadOutlined /> : <ExpandOutlined />}
              size={isMobile ? 'middle' : 'middle'}
              data-testid="btn-open-lesson-book-reader"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerOpen();
              }}
              style={{
                backgroundColor: '#7e22ce',
                borderColor: '#7e22ce',
                borderRadius: 8,
                fontWeight: 700,
                minHeight: 40,
                width: isMobile ? '100%' : 'auto',
                boxShadow: '0 2px 8px rgba(126, 34, 206, 0.22)',
              }}
            >
              {isStudentRole
                ? isEnglish
                  ? `Open Book Reader${hiddenCount > 0 ? ` (+${hiddenCount} more items)` : ' (Full View)'}`
                  : `Mở Chế Độ Đọc Sách Toàn Màn Hình${hiddenCount > 0 ? ` (+${hiddenCount} mục)` : ''}`
                : isEnglish
                ? `View Full Lesson Overview (${objectives.length} items)`
                : `Xem Đầy Đủ Tổng Quan Bài Học (${objectives.length} mục)`}
            </Button>

            {lessonPrep.slideLink && (
              <Button
                type="link"
                href={lessonPrep.slideLink}
                target="_blank"
                rel="noopener noreferrer"
                icon={<GlobalOutlined />}
                onClick={(e) => e.stopPropagation()}
                style={{ padding: '0 4px', fontWeight: 600, color: '#2563eb', fontSize: 12 }}
              >
                {isEnglish ? 'Open Slides' : 'Mở Slide Bài Giảng'}
              </Button>
            )}
          </div>
        </div>
      )}
      <MaterialPreviewModal
        open={Boolean(previewMaterial)}
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        zIndex={1200}
        trackingContext={
          isStudentRole && previewMaterial && studentUser
            ? {
                enabled: true,
                classItem: activePrepClass,
                lessonPrep,
                studentUser,
                initialMaterialLog: readingLog?.materialLogs?.[String(previewMaterial.id)] || null,
                onLogUpdated,
              }
            : null
        }
      />
    </div>
  );
};

export default LessonOverviewCompactCard;
