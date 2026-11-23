import React, { useState } from 'react';
import { Card, Statistic, Tag, Progress, Typography, Drawer, Table, Space, Tabs, Empty, Button } from 'antd';
import {
  ReadOutlined,
  TrophyOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { formatHumanDuration, getPrepStatusMeta } from '../../lesson-reader';

const { Text } = Typography;

/**
 * DirectorStudentReadinessCard — KPI Card Toàn Trường & Drawer Đối Soát Chuẩn Bị Bài + Điểm Rèn Luyện
 * Đặt đối xứng ngay cạnh DirectorCurriculumReadinessCard trên DirectorOverviewPanel (/dashboard).
 */
export const DirectorStudentReadinessCard = ({ reportData = null, loading = false }) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const summary = reportData?.summary || {
    totalStudentsMonitored: 0,
    totalPrepared: 0,
    totalSkimmed: 0,
    totalNotStarted: 0,
    overallReadinessRate: 0,
    avgConductScore: 0,
    totalOpenQuestions: 0,
  };
  const classReports = (reportData?.classReports || []).filter(
    (c) => c.hasLessonPlan && c.totalStudents > 0
  );
  const needsAttention = reportData?.needsAttentionStudents || [];

  const rate = summary.overallReadinessRate || 0;
  const statusColor = rate >= 75 ? '#16a34a' : rate >= 40 ? '#fa8c16' : '#7e22ce';

  const classColumns = [
    {
      title: isEnglish ? 'Class' : 'Lớp Học',
      key: 'class',
      render: (_, r) => (
        <div>
          <Tag color="purple" style={{ margin: 0, fontWeight: 700 }}>{r.classId}</Tag>{' '}
          <Text strong style={{ fontSize: 12 }}>{r.className}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            👨‍🏫 {r.teacherName} • {isEnglish ? `Session ${r.sessionIndex}` : `Buổi ${r.sessionIndex}`}
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Readiness' : 'Chuẩn Bị Bài',
      key: 'readiness',
      width: 140,
      render: (_, r) => (
        <div>
          <Progress percent={r.readinessRate} size="small" strokeColor={r.readinessRate >= 70 ? '#16a34a' : '#7e22ce'} />
          <div style={{ fontSize: 11, color: '#475569' }}>
            🟢 {r.preparedCount} • 🟡 {r.skimmedCount} • 🔴 {r.notStartedCount}
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Avg Conduct' : 'Rèn Luyện TB',
      key: 'conduct',
      align: 'center',
      width: 100,
      render: (_, r) => (
        <Tag color={r.avgConductScore >= 75 ? 'success' : r.avgConductScore >= 60 ? 'warning' : 'error'} style={{ margin: 0, fontWeight: 700 }}>
          {r.avgConductScore}/100
        </Tag>
      ),
    },
  ];

  const attentionColumns = [
    {
      title: isEnglish ? 'Student & Class' : 'Học Viên & Lớp',
      key: 'student',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{r.studentName}</Text>{' '}
          <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>{r.classId}</Tag>
          {(r.parentName || r.parentPhone) && (
            <div style={{ fontSize: 11, color: '#0369a1' }}>
              📞 {r.parentName ? `${r.parentName}: ` : ''}{r.parentPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Reading' : 'Tình Trạng Đọc',
      key: 'reading',
      render: (_, r) => {
        const meta = getPrepStatusMeta(r.prepStatus, isEnglish);
        return (
          <div>
            <Tag style={{ margin: 0, fontSize: 10, backgroundColor: meta.bg, borderColor: meta.border, color: meta.textColor }}>
              {meta.icon} {meta.label}
            </Tag>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {formatHumanDuration(r.preClassActiveSeconds, isEnglish)} ({r.maxScrollPercent}%)
            </div>
          </div>
        );
      },
    },
    {
      title: isEnglish ? 'Conduct' : 'Điểm',
      key: 'score',
      align: 'center',
      width: 80,
      render: (_, r) => (
        <Tag color={r.conductRank?.tagColor || 'error'} style={{ margin: 0, fontWeight: 700 }}>
          {r.conductScore}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <Card
        hoverable
        loading={loading}
        onClick={() => setDrawerOpen(true)}
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          borderTop: `3px solid ${statusColor}`,
          backgroundColor: '#faf5ff',
          height: '100%',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
        data-testid="kpi-director-student-readiness"
      >
        <Statistic
          title={
            <Text strong style={{ fontSize: isMobile ? 11 : 13, display: 'block', lineHeight: 1.3, color: '#3b0764' }}>
              {isEnglish ? 'Student Prep & Conduct' : 'Học Viên Đọc Bài & Rèn Luyện'}
            </Text>
          }
          value={rate}
          suffix="%"
          prefix={<ReadOutlined style={{ color: statusColor, fontSize: isMobile ? 14 : 18 }} />}
          styles={{ content: { color: statusColor, fontWeight: 700, fontSize: isMobile ? 18 : 24 } }}
        />

        <div style={{ marginTop: 6 }}>
          <Progress
            percent={rate}
            size="small"
            strokeColor={statusColor}
            showInfo={false}
            style={{ marginBottom: 4 }}
          />
          <div style={{ fontSize: isMobile ? 10 : 12, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <span>
              {isEnglish ? 'Prepared:' : 'Đạt chuẩn:'}{' '}
              <Text strong style={{ color: '#16a34a' }}>
                {summary.totalPrepared}/{summary.totalStudentsMonitored}
              </Text>
            </span>
            <Tag color="purple" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
              <TrophyOutlined /> TB {summary.avgConductScore}/100
            </Tag>
          </div>
        </div>
      </Card>

      {/* Drawer Đối Soát Chuẩn Bị Bài & Điểm Rèn Luyện Toàn Trường */}
      <Drawer
        title={
          <Space>
            <ReadOutlined style={{ color: '#7e22ce' }} />
            <span>
              {isEnglish
                ? 'Executive Audit: Pre-Class Reading & Conduct Score'
                : 'Đối Soát Toàn Trường: Chuẩn Bị Bài & Điểm Rèn Luyện'}
            </span>
          </Space>
        }
        placement="right"
        width={isMobile ? '100%' : 640}
        zIndex={1080}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            data-testid="btn-director-open-prep-page"
            style={{ backgroundColor: '#7e22ce', borderColor: '#7e22ce', fontWeight: 700, borderRadius: 6 }}
            onClick={() => {
              setDrawerOpen(false);
              navigate('/pre-class-prep');
            }}
          >
            {isEnglish ? 'Full Page' : 'Mở Toàn Trang'}
          </Button>
        }
        data-testid="director-student-readiness-drawer"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ padding: 10, borderRadius: 10, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#166534' }}>{isEnglish ? 'Prepared' : 'Đã đọc tốt'}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{summary.totalPrepared}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 10, backgroundColor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#991b1b' }}>{isEnglish ? 'Not Read' : 'Chưa đọc bài'}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{summary.totalNotStarted}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 10, backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#581c87' }}>{isEnglish ? 'Avg Conduct' : 'Rèn luyện TB'}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#7e22ce' }}>{summary.avgConductScore}/100</div>
          </div>
        </div>

        <Tabs
          items={[
            {
              key: 'classes',
              label: isEnglish ? `By Class (${classReports.length})` : `Theo Lớp Học (${classReports.length})`,
              children:
                classReports.length === 0 ? (
                  <Empty description={isEnglish ? 'No classes with lesson plans yet.' : 'Chưa có lớp nào có giáo án.'} />
                ) : (
                  <Table
                    dataSource={classReports}
                    columns={classColumns}
                    rowKey="classId"
                    pagination={false}
                    size="small"
                    scroll={{ x: 460 }}
                  />
                ),
            },
            {
              key: 'attention',
              label: (
                <span>
                  <WarningOutlined style={{ color: '#dc2626', marginRight: 4 }} />
                  {isEnglish ? `Needs Follow-up (${needsAttention.length})` : `Cần Đôn Đốc (${needsAttention.length})`}
                </span>
              ),
              children:
                needsAttention.length === 0 ? (
                  <Empty description={isEnglish ? 'All students are on track!' : 'Toàn bộ học viên đều đang theo sát tiến độ!'} />
                ) : (
                  <Table
                    dataSource={needsAttention}
                    columns={attentionColumns}
                    rowKey={(r) => `${r.classId}_${r.studentId}`}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    scroll={{ x: 460 }}
                  />
                ),
            },
          ]}
        />
      </Drawer>
    </>
  );
};

export default DirectorStudentReadinessCard;
