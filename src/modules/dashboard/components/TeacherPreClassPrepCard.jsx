import React, { useState, useMemo } from 'react';
import { Card, Tag, Button, Space, Typography, Progress, Drawer, Table, Select, Empty } from 'antd';
import {
  ReadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import {
  PREP_STATUS,
  formatHumanDuration,
  getPrepStatusMeta,
} from '../../lesson-reader';

const { Text } = Typography;

/**
 * TeacherPreClassPrepCard — Báo Cáo Học Viên Chuẩn Bị Bài Trước Giờ Học cho Giáo Viên Bản Xứ (`teacher`)
 * - Hiển thị ngay trên TeacherWorkspacePanel (/dashboard).
 * - TUYỆT ĐỐI KHÔNG hiển thị Zalo, SĐT Phụ huynh hay Học phí (Native Teacher Privacy & Zalo Isolation Guard).
 */
export const TeacherPreClassPrepCard = ({ reportData = null, loading = false, maxItems = 2 }) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [selectedClassReport, setSelectedClassReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const classReports = reportData?.classReports || [];
  const plannedClasses = useMemo(() => {
    const list = classReports.filter((c) => c.hasLessonPlan && c.totalStudents > 0);
    return [...list].sort((a, b) => (b.notStartedCount || 0) - (a.notStartedCount || 0));
  }, [classReports]);

  const previewClasses = useMemo(
    () => plannedClasses.slice(0, Math.min(2, Math.max(1, maxItems))),
    [plannedClasses, maxItems]
  );
  const remainingClassCount = Math.max(0, plannedClasses.length - previewClasses.length);

  const filteredStudents = useMemo(() => {
    const list = selectedClassReport?.students || [];
    if (statusFilter === 'ALL') return list;
    return list.filter((s) => s.prepStatus === statusFilter);
  }, [selectedClassReport, statusFilter]);

  if (!loading && plannedClasses.length === 0) {
    return null;
  }

  const studentColumns = [
    {
      title: isEnglish ? 'Student' : 'Học Viên',
      key: 'student',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
            {r.studentName}
          </Text>
          {r.englishName && (
            <Tag color="gold" style={{ marginLeft: 6, fontSize: 10, borderRadius: 4 }}>
              {r.englishName}
            </Tag>
          )}
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.studentCode}</div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Prep Status' : 'Trạng Thái Đọc Bài',
      key: 'status',
      render: (_, r) => {
        const meta = getPrepStatusMeta(r.prepStatus, isEnglish);
        return (
          <Tag
            style={{
              margin: 0,
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 11,
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.textColor,
              whiteSpace: 'nowrap',
            }}
          >
            {meta.icon} {meta.label}
          </Tag>
        );
      },
    },
    {
      title: isEnglish ? 'Reading Time & Scroll' : 'Thời Gian Đọc & Bao Phủ',
      key: 'reading',
      render: (_, r) => (
        <div style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <Text strong style={{ color: '#7e22ce' }}>
            {formatHumanDuration(r.preClassActiveSeconds, isEnglish)}
          </Text>
          <Text type="secondary"> / {formatHumanDuration(r.minRequiredSeconds, isEnglish)}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {isEnglish ? `Scrolled: ${r.maxScrollPercent}%` : `Đã xem: ${r.maxScrollPercent}%`}
            {r.questionsCount > 0 ? ` • 🙋 ${r.questionsCount} Q&A` : ''}
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Conduct' : 'Rèn Luyện',
      key: 'conduct',
      align: 'center',
      render: (_, r) => (
        <Tag color={r.conductRank?.tagColor || 'default'} style={{ margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {r.conductRank?.icon} {r.conductScore}/100
        </Tag>
      ),
    },
  ];

  return (
    <>
      <Card
        loading={loading}
        bordered={false}
        style={{
          marginBottom: isMobile ? 12 : 20,
          borderRadius: 12,
          borderLeft: '4px solid #7e22ce',
          backgroundColor: '#faf5ff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
        data-testid="teacher-pre-class-prep-card"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Space size={8}>
            <ReadOutlined style={{ color: '#7e22ce', fontSize: 18 }} />
            <div>
              <Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#3b0764', display: 'block' }}>
                {isEnglish
                  ? 'Student Pre-Class Reading & Preparation Report'
                  : 'Báo Cáo Học Viên Chuẩn Bị Bài Trước Giờ Học'}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b21a8' }}>
                {isEnglish
                  ? 'Real-time reading progress tracked from Student Lesson Book Reader'
                  : 'Theo dõi thời gian đọc bài thực tế của từng học viên trước khi vào lớp'}
              </Text>
            </div>
          </Space>

          <Space size={6} wrap>
            {reportData?.summary && (
              <>
                <Tag color="success" style={{ margin: 0, fontWeight: 700 }}>
                  🟢 {reportData.summary.totalPrepared} {isEnglish ? 'Prepared' : 'Đã đọc tốt'}
                </Tag>
                <Tag color="warning" style={{ margin: 0, fontWeight: 700 }}>
                  🟡 {reportData.summary.totalSkimmed} {isEnglish ? 'In Progress' : 'Đọc lướt'}
                </Tag>
                <Tag color="error" style={{ margin: 0, fontWeight: 700 }}>
                  🔴 {reportData.summary.totalNotStarted} {isEnglish ? 'Not Read' : 'Chưa đọc'}
                </Tag>
              </>
            )}
            <Button
              type="primary"
              size="small"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              onClick={() => navigate('/pre-class-prep')}
              data-testid="btn-teacher-view-all-prep"
              style={{
                backgroundColor: '#7e22ce',
                borderColor: '#7e22ce',
                borderRadius: 6,
                fontWeight: 700,
                minHeight: 30,
              }}
            >
              {isEnglish ? 'Full Report' : 'Xem Chi Tiết'}
            </Button>
          </Space>
        </div>

        {/* Chỉ hiển thị tối đa 2 lớp ưu tiên ngoài Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {previewClasses.map((cls) => (
            <div
              key={cls.classId}
              data-testid={`teacher-prep-class-row-${cls.classId}`}
              style={{
                padding: isMobile ? '10px 12px' : '12px 14px',
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: '1px solid #e9d5ff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <Tag color="purple" style={{ margin: 0, fontWeight: 800 }}>
                    {cls.classId}
                  </Tag>
                  <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                    {cls.className}
                  </Text>
                  <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                    {isEnglish ? `Session ${cls.sessionIndex}` : `Buổi ${cls.sessionIndex}`}
                  </Tag>
                  {cls.openQuestionsCount > 0 && (
                    <Tag color="processing" icon={<QuestionCircleOutlined />} style={{ margin: 0, fontSize: 11 }}>
                      {cls.openQuestionsCount} {isEnglish ? 'Open Q&A' : 'Câu hỏi chờ'}
                    </Tag>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                  <div style={{ width: isMobile ? '100%' : 170 }}>
                    <Progress
                      percent={cls.readinessRate}
                      size="small"
                      strokeColor={cls.readinessRate >= 70 ? '#16a34a' : cls.readinessRate >= 40 ? '#fa8c16' : '#dc2626'}
                      format={(p) => `${p}%`}
                    />
                  </div>
                  <Space size={6} wrap style={{ fontSize: 12 }}>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>
                      <CheckCircleOutlined /> {cls.preparedCount}/{cls.totalStudents} {isEnglish ? 'Prepared' : 'Đã chuẩn bị'}
                    </span>
                    <span style={{ color: '#b45309' }}>
                      • <ClockCircleOutlined /> {cls.skimmedCount} {isEnglish ? 'Skimmed' : 'Đọc lướt'}
                    </span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      • {cls.notStartedCount} {isEnglish ? 'Not Read' : 'Chưa đọc'}
                    </span>
                  </Space>
                </div>
              </div>

              <Button
                type="primary"
                ghost
                icon={<EyeOutlined />}
                data-testid={`btn-teacher-inspect-prep-${cls.classId}`}
                onClick={() => {
                  setStatusFilter('ALL');
                  setSelectedClassReport(cls);
                }}
                style={{
                  borderColor: '#7e22ce',
                  color: '#7e22ce',
                  fontWeight: 700,
                  borderRadius: 8,
                  minHeight: 38,
                  width: isMobile ? '100%' : 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {isEnglish ? 'View Student List' : 'Xem Danh Sách HV'}
              </Button>
            </div>
          ))}
          {remainingClassCount > 0 && (
            <div style={{ textAlign: 'right', marginTop: 2 }}>
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/pre-class-prep')}
                style={{ padding: 0, fontWeight: 700, color: '#7e22ce', fontSize: 12 }}
              >
                {isEnglish
                  ? `+${remainingClassCount} more class(es) — View full report →`
                  : `+${remainingClassCount} lớp khác — Mở báo cáo chi tiết →`}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Drawer Chi Tiết Chuẩn Bị Bài Từng Học Viên Trong Lớp (Ẩn 100% SĐT PH & Zalo) */}
      <Drawer
        title={
          selectedClassReport ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                📖 {selectedClassReport.classId} • {selectedClassReport.className}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                {isEnglish
                  ? `Session ${selectedClassReport.sessionIndex} • Goal: ${formatHumanDuration(selectedClassReport.minRequiredSeconds, true)} & ≥ 80% scrolled`
                  : `Buổi ${selectedClassReport.sessionIndex} • Tiêu chuẩn: đọc ${formatHumanDuration(selectedClassReport.minRequiredSeconds, false)} & xem ≥ 80%`}
              </div>
            </div>
          ) : (
            ''
          )
        }
        placement="right"
        width={isMobile ? '100%' : 640}
        zIndex={1080}
        open={Boolean(selectedClassReport)}
        onClose={() => setSelectedClassReport(null)}
        data-testid="teacher-prep-detail-drawer"
      >
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: isMobile ? '100%' : 240, height: 40 }}
            options={[
              { value: 'ALL', label: isEnglish ? 'All Students' : 'Tất cả học viên' },
              { value: PREP_STATUS.NOT_STARTED, label: isEnglish ? '🔴 Not Read Yet' : '🔴 Chưa đọc bài' },
              { value: PREP_STATUS.SKIMMED, label: isEnglish ? '🟡 Reading In Progress' : '🟡 Đang đọc dở / Lướt' },
              { value: PREP_STATUS.PREPARED, label: isEnglish ? '🟢 Prepared Before Class' : '🟢 Đã chuẩn bị tốt' },
            ]}
          />
          {selectedClassReport && (
            <Tag color="purple" style={{ alignSelf: 'center', padding: '4px 10px', fontSize: 12, fontWeight: 700, margin: 0 }}>
              {isEnglish ? 'Class Avg Conduct:' : 'Điểm rèn luyện TB:'} {selectedClassReport.avgConductScore}/100
            </Tag>
          )}
        </div>

        {filteredStudents.length === 0 ? (
          <Empty description={isEnglish ? 'No students match this filter.' : 'Không có học viên nào ở trạng thái này.'} />
        ) : (
          <Table
            dataSource={filteredStudents}
            columns={studentColumns}
            rowKey="studentId"
            pagination={false}
            size="small"
            scroll={{ x: 520 }}
          />
        )}
      </Drawer>
    </>
  );
};

export default TeacherPreClassPrepCard;
