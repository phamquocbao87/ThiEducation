import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlayCircleFilled,
  PlusOutlined,
  SearchOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useZoomSyncJobs } from '../hooks/useZoomSyncJobs';
import { ClassRecordingsDirectoryService } from '../services/ClassRecordingsDirectoryService';
import {
  ZoomRecordingSourceBadge,
  ZoomSlotSyncingBanner,
} from './ZoomRecordingSourceBadge';

const { Title, Text } = Typography;

/**
 * Shared Master Class Recordings Directory Card ("File Tổng Recording Của Lớp")
 * Renders in both:
 * 1. Live Class Schedules (/zoom-schedules -> Tab "📹 Tổng Hợp Recording")
 * 2. Classroom (/classroom/:classId -> Tab "Bài Học & Tài Liệu")
 */
export const ClassRecordingsDirectoryCard = ({
  classes = [],
  fixedClass = null,
  allRecordings = [],
  currentUser = null,
  onWatchRecording,
  onOpenUploadRecording,
  onDeleteRecording,
  testIdPrefix = 'class-recordings-dir',
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const { activeJobsBySlotKey } = useZoomSyncJobs();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [includeMissing, setIncludeMissing] = useState(false);

  const scopedClasses = useMemo(() => {
    if (fixedClass) return [fixedClass];
    return ClassRecordingsDirectoryService.getScopedClasses(classes, currentUser);
  }, [classes, fixedClass, currentUser]);

  const [selectedClassId, setSelectedClassId] = useState(() => fixedClass?.id || scopedClasses[0]?.id || '');

  useEffect(() => {
    if (fixedClass?.id) {
      setSelectedClassId(fixedClass.id);
      return;
    }
    if (scopedClasses.length > 0 && !scopedClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(scopedClasses[0].id);
    }
  }, [fixedClass?.id, scopedClasses, selectedClassId]);

  const activeClass = useMemo(() => {
    if (fixedClass) return fixedClass;
    return scopedClasses.find((c) => c.id === selectedClassId) || scopedClasses[0] || null;
  }, [fixedClass, scopedClasses, selectedClassId]);

  const canManage = useMemo(
    () => ClassRecordingsDirectoryService.canManageClassRecordings(currentUser, activeClass),
    [currentUser, activeClass]
  );

  const isStaffOrTeacher = ['admin', 'director', 'academic', 'teacher'].includes(
    String(currentUser?.role || '').toLowerCase()
  );

  const ledger = useMemo(
    () =>
      ClassRecordingsDirectoryService.buildClassRecordingsLedger({
        cls: activeClass,
        allRecordings,
        currentUser,
        includeMissing: isStaffOrTeacher && includeMissing,
        isEnglish,
      }),
    [activeClass, allRecordings, currentUser, isStaffOrTeacher, includeMissing, isEnglish]
  );

  const filteredRows = useMemo(() => {
    const kw = String(searchKeyword || '').trim().toLowerCase();
    if (!kw) return ledger.rows;
    return ledger.rows.filter((r) =>
      `${r.sessionLabel} ${r.dateFormatted} ${r.title} ${r.uploadedBy}`.toLowerCase().includes(kw)
    );
  }, [ledger.rows, searchKeyword]);

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    message.success(isEnglish ? 'Copied recording link!' : 'Đã sao chép đường dẫn video!');
  };

  const handleExportExcel = () => {
    if (!activeClass) return;
    ClassRecordingsDirectoryService.exportClassRecordingsXlsx({
      cls: activeClass,
      rows: filteredRows,
      isEnglish,
    });
    message.success(
      isEnglish
        ? `Exported ${filteredRows.length} row(s) to Excel (.xlsx)!`
        : `Đã xuất file tổng hợp Excel (.xlsx) gồm ${filteredRows.length} dòng!`
    );
  };

  const columns = [
    {
      title: isEnglish ? 'Session & Date' : 'Buổi & Ngày Học',
      key: 'session',
      width: 190,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Tag
            color={row.hasRecording ? 'purple' : 'default'}
            style={{ margin: 0, fontWeight: 700, borderRadius: 6, whiteSpace: 'nowrap' }}
          >
            {row.sessionLabel}
          </Tag>
          <Text strong style={{ fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap' }}>
            📅 {row.dateFormatted}
          </Text>
        </Space>
      ),
    },
    {
      title: isEnglish ? 'Recording Title' : 'Video Ghi Hình Buổi Học',
      key: 'title',
      render: (_, row) => {
        const activeJob = activeJobsBySlotKey?.get(`${activeClass?.id || ''}_${row.isoDate || ''}`);
        if (row.hasRecording) {
          return (
            <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text strong style={{ fontSize: 13.5, color: '#1e1b4b', display: 'block' }}>
                🎬 {row.title}
              </Text>
              <Space size={6} wrap>
                <ZoomRecordingSourceBadge recording={row.recording} />
                <Text type="secondary" style={{ fontSize: 11.5 }}>
                  {isEnglish ? 'By: ' : 'Nguồn: '}
                  {row.uploadedBy}
                </Text>
              </Space>
              {activeJob && <ZoomSlotSyncingBanner syncJob={activeJob} compact />}
            </div>
          );
        }
        if (activeJob) {
          return <ZoomSlotSyncingBanner syncJob={activeJob} />;
        }
        return (
          <Tag color="warning" icon={<WarningOutlined />} style={{ fontWeight: 600, margin: 0 }}>
            {isEnglish ? 'No recording uploaded yet' : 'Chưa tải lên video buổi học'}
          </Tag>
        );
      },
    },
    {
      title: isEnglish ? 'Actions' : 'Thao Tác',
      key: 'actions',
      width: 250,
      align: 'right',
      render: (_, row) =>
        row.hasRecording ? (
          <Space size={6} wrap style={{ justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleFilled />}
              style={{
                backgroundColor: '#7c3aed',
                borderColor: '#7c3aed',
                borderRadius: 6,
                fontWeight: 600,
                minHeight: 32,
                whiteSpace: 'nowrap',
              }}
              onClick={() => onWatchRecording?.(row.recording)}
              data-testid={`${testIdPrefix}-watch-${row.recording.id}`}
            >
              {isEnglish ? 'Watch' : 'Xem Ngay'}
            </Button>

            {isStaffOrTeacher && (
              <Tooltip title={isEnglish ? 'Copy video link' : 'Sao chép link video'}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  style={{ borderRadius: 6, minWidth: 32, minHeight: 32 }}
                  onClick={() => handleCopyLink(row.url)}
                  data-testid={`${testIdPrefix}-copy-${row.recording.id}`}
                />
              </Tooltip>
            )}

            {canManage && onDeleteRecording && (
              <Popconfirm
                title={isEnglish ? 'Delete this recording?' : 'Xoá video ghi hình này?'}
                description={
                  isEnglish
                    ? 'The file will be moved to Google Drive Trash (30-day recovery).'
                    : 'Video sẽ được chuyển vào Thùng rác Google Drive (lưu 30 ngày).'
                }
                okText={isEnglish ? 'Delete' : 'Xoá'}
                cancelText={isEnglish ? 'Cancel' : 'Huỷ'}
                okButtonProps={{ danger: true }}
                onConfirm={() => onDeleteRecording(row.recording)}
              >
                <Button
                  size="small"
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  style={{ borderRadius: 6, minWidth: 32, minHeight: 32 }}
                  data-testid={`${testIdPrefix}-delete-${row.recording.id}`}
                />
              </Popconfirm>
            )}
          </Space>
        ) : (
          canManage &&
          onOpenUploadRecording && (
            <Button
              size="small"
              type="dashed"
              icon={<PlusOutlined />}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                borderColor: '#7c3aed',
                color: '#7c3aed',
                minHeight: 32,
                whiteSpace: 'nowrap',
              }}
              onClick={() => onOpenUploadRecording(activeClass, row.isoDate)}
              data-testid={`${testIdPrefix}-upload-missing-${row.isoDate}`}
            >
              {isEnglish ? 'Upload Recording' : 'Upload Bù'}
            </Button>
          )
        ),
    },
  ];

  return (
    <Card
      variant="borderless"
      data-testid={testIdPrefix}
      style={{
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
      styles={{ body: { padding: isMobile ? 12 : 20 } }}
    >
      {/* 1. Header & KPI Summary */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 12,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div>
          <Space size={8} wrap>
            <Title level={5} style={{ margin: 0, fontWeight: 700, color: '#1e1b4b' }}>
              📹{' '}
              {isEnglish
                ? 'Class Session Recordings Directory'
                : 'Danh Sách Tổng Hợp Recording Của Lớp Học'}
            </Title>
            <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 6, whiteSpace: 'nowrap' }} data-testid={`${testIdPrefix}-count-tag`}>
              {isEnglish
                ? `${ledger.recordedCount} recording(s)`
                : `Đã có: ${ledger.recordedCount} video`}
            </Tag>
            {isStaffOrTeacher && ledger.missingPastSessionsCount > 0 && (
              <Tag color="orange" style={{ margin: 0, fontWeight: 600, borderRadius: 6, whiteSpace: 'nowrap' }} data-testid={`${testIdPrefix}-missing-tag`}>
                {isEnglish
                  ? `${ledger.missingPastSessionsCount} past session(s) without video`
                  : `Chưa có video: ${ledger.missingPastSessionsCount} buổi đã học`}
              </Tag>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {isEnglish
              ? 'Consolidated list of all recorded lessons for the selected class — watch directly in fullscreen.'
              : 'Tổng hợp toàn bộ video ghi hình các buổi học đã diễn ra của lớp — bấm Xem Ngay trên ứng dụng không cần mật khẩu.'}
          </Text>
        </div>

        <Space
          size={8}
          wrap
          style={{
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'stretch' : 'flex-end',
          }}
        >
          {isStaffOrTeacher && activeClass && (
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                minHeight: 40,
                borderColor: '#16a34a',
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                width: isMobile ? '100%' : 'auto',
                whiteSpace: 'nowrap',
              }}
              data-testid={`${testIdPrefix}-btn-export-xlsx`}
            >
              {isEnglish ? 'Export Excel (.xlsx)' : 'Xuất File Tổng (.xlsx)'}
            </Button>
          )}

          {canManage && activeClass && onOpenUploadRecording && (
            <Button
              type="primary"
              icon={<VideoCameraOutlined />}
              onClick={() => onOpenUploadRecording(activeClass, '')}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                minHeight: 40,
                backgroundColor: '#7c3aed',
                borderColor: '#7c3aed',
                width: isMobile ? '100%' : 'auto',
                whiteSpace: 'nowrap',
              }}
              data-testid={`${testIdPrefix}-btn-upload`}
            >
              {isEnglish ? 'Upload Recording' : 'Tải Lên Recording'}
            </Button>
          )}
        </Space>
      </div>

      {/* 2. Filter Bar: Chọn Lớp (nếu ở trang Schedule) + Tìm kiếm + Nút gạt Hiện buổi chưa có video */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 10,
            flex: 1,
          }}
        >
          {!fixedClass && (
            <Select
              value={activeClass?.id || undefined}
              onChange={setSelectedClassId}
              placeholder={isEnglish ? 'Select class...' : 'Chọn lớp học...'}
              style={{ width: isMobile ? '100%' : 320, height: 40 }}
              options={scopedClasses.map((c) => ({
                value: c.id,
                label: `${c.name}${c.teacherName ? ` (${c.teacherName})` : ''}`,
              }))}
              data-testid={`${testIdPrefix}-select-class`}
            />
          )}

          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={
              isEnglish
                ? 'Filter by date, session, or video title...'
                : 'Tìm theo ngày học, buổi học hoặc tên video...'
            }
            style={{ width: isMobile ? '100%' : 280, height: 40, borderRadius: 8 }}
            data-testid={`${testIdPrefix}-search-input`}
          />
        </div>

        {isStaffOrTeacher && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'space-between' : 'flex-end',
              gap: 8,
              padding: isMobile ? '6px 10px' : 0,
              backgroundColor: isMobile ? '#f8fafc' : 'transparent',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12.5, color: '#475569' }}>
              {isEnglish ? 'Show sessions without video:' : 'Hiện cả buổi chưa có video:'}
            </Text>
            <Switch
              size="small"
              checked={includeMissing}
              onChange={setIncludeMissing}
              data-testid={`${testIdPrefix}-switch-include-missing`}
            />
          </div>
        )}
      </div>

      {/* 3. Danh sách Recording: Mobile Cards vs Desktop Table */}
      {filteredRows.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            isEnglish
              ? 'No session recordings uploaded for this class yet.'
              : 'Lớp học này hiện chưa có bản ghi hình buổi học nào được tải lên.'
          }
          data-testid={`${testIdPrefix}-empty`}
        />
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid={`${testIdPrefix}-mobile-list`}>
          {filteredRows.map((row) => (
            <div
              key={row.key}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: row.hasRecording ? '1px solid #ddd6fe' : '1px dashed #cbd5e1',
                backgroundColor: row.hasRecording ? '#faf5ff' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Tag color={row.hasRecording ? 'purple' : 'default'} style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                  {row.sessionLabel} • {row.dateFormatted}
                </Tag>
                {!row.hasRecording && (
                  <Tag color="warning" style={{ margin: 0 }}>
                    {isEnglish ? 'Missing' : 'Chưa có video'}
                  </Tag>
                )}
              </div>

              {row.hasRecording && (
                <div>
                  <Text strong style={{ fontSize: 13, color: '#1e1b4b', display: 'block' }}>
                    🎬 {row.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {row.uploadedBy}
                  </Text>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                {row.hasRecording ? (
                  <>
                    <Button
                      type="primary"
                      icon={<PlayCircleFilled />}
                      style={{
                        flex: 1,
                        minHeight: 38,
                        borderRadius: 8,
                        fontWeight: 600,
                        backgroundColor: '#7c3aed',
                        borderColor: '#7c3aed',
                      }}
                      onClick={() => onWatchRecording?.(row.recording)}
                      data-testid={`${testIdPrefix}-watch-mobile-${row.recording.id}`}
                    >
                      {isEnglish ? 'Watch Recording' : 'Xem Ngay'}
                    </Button>
                    {canManage && onDeleteRecording && (
                      <Popconfirm
                        title={isEnglish ? 'Delete this recording?' : 'Xoá video này?'}
                        okText={isEnglish ? 'Delete' : 'Xoá'}
                        cancelText={isEnglish ? 'Cancel' : 'Huỷ'}
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDeleteRecording(row.recording)}
                      >
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          style={{ minWidth: 38, minHeight: 38, borderRadius: 8 }}
                          data-testid={`${testIdPrefix}-delete-mobile-${row.recording.id}`}
                        />
                      </Popconfirm>
                    )}
                  </>
                ) : (
                  canManage &&
                  onOpenUploadRecording && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      style={{ width: '100%', minHeight: 38, borderRadius: 8, borderColor: '#7c3aed', color: '#7c3aed', fontWeight: 600 }}
                      onClick={() => onOpenUploadRecording(activeClass, row.isoDate)}
                    >
                      {isEnglish ? 'Upload Recording' : 'Upload Bù Video'}
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table
          dataSource={filteredRows}
          columns={columns}
          rowKey="key"
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          size="middle"
        />
      )}
    </Card>
  );
};
