import React from 'react';
import {
  Card,
  Tabs,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Spin,
  Modal,
  Tag,
} from 'antd';
import {
  ReadOutlined,
  SearchOutlined,
  ReloadOutlined,
  BellOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { useIsMobile } from '../../shared/hooks/useIsMobile';
import { PREP_STATUS } from '../lesson-reader';
import { usePreClassPrepMonitor } from './hooks/usePreClassPrepMonitor';
import { PrepSummaryKpiRow } from './components/PrepSummaryKpiRow';
import { PrepStudentTrackingList } from './components/PrepStudentTrackingList';
import { PrepClassOverviewGrid } from './components/PrepClassOverviewGrid';

const { Title, Text } = Typography;

/**
 * PreClassPrepPage — Màn Hình Chuyên Biệt Giám Sát Chuẩn Bị Bài Trước Giờ Học (`/pre-class-prep`)
 * - 6 Roles RBAC:
 *   + academic / director / admin: Toàn trường, SĐT Phụ huynh, Nhắc cá nhân & Nhắc hàng loạt.
 *   + teacher: Chỉ các lớp GV phụ trách, ẩn 100% SĐT Phụ huynh, Zalo và Học phí.
 *   + student / accountant: Chặn 403 tại ProtectedRoute & ẩn khỏi Sidebar.
 */
export const PreClassPrepPage = () => {
  const { currentUser } = useAuth();
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const {
    userRole,
    canRemind,
    canViewParentContacts,
    canFilterTeacher,
    loading,
    dataset,
    scopedSummary,
    activeTab,
    setActiveTab,
    selectedClassId,
    setSelectedClassId,
    selectedTeacherId,
    setSelectedTeacherId,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    teacherOptions,
    filteredClasses,
    filteredStudents,
    remindableStudents,
    remindedMap,
    sendingKey,
    bulkSending,
    loadData,
    handleSendSingleReminder,
    handleSendBulkReminders,
    handleInspectClassStudents,
    handleResetFilters,
  } = usePreClassPrepMonitor({ currentUser, isEnglish });

  const isTeacher = userRole === 'teacher';
  const hasActiveFilters =
    selectedClassId !== 'ALL' ||
    selectedTeacherId !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchKeyword.trim().length > 0;

  const confirmBulkRemind = () => {
    if (!remindableStudents.length) return;
    Modal.confirm({
      title: isEnglish
        ? `Send reading reminder to ${remindableStudents.length} student(s)?`
        : `Gửi nhắc đọc bài cho ${remindableStudents.length} học viên?`,
      content: isEnglish
        ? 'Realtime notifications will be delivered to all students in the current filter who have not completed pre-class reading yet.'
        : 'Hệ thống sẽ gửi thông báo nhắc đọc bài trước giờ học ngay lập tức tới các học viên chưa hoàn thành đọc bài trong bộ lọc hiện tại.',
      okText: isEnglish ? 'Send Reminders' : 'Xác Nhận Gửi Nhắc',
      cancelText: isEnglish ? 'Cancel' : 'Hủy',
      okButtonProps: { style: { backgroundColor: '#7e22ce', borderColor: '#7e22ce' } },
      onOk: () => handleSendBulkReminders(remindableStudents),
    });
  };

  return (
    <div data-testid="pre-class-prep-page">
      {/* Header Trang */}
      <Card
        bordered={false}
        style={{
          marginBottom: isMobile ? 12 : 18,
          borderRadius: 12,
          borderLeft: '4px solid #7e22ce',
          background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: isMobile ? '14px 14px' : '18px 22px' } }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Space size={8} wrap style={{ marginBottom: 4 }}>
              <Button
                size="small"
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/dashboard')}
                style={{ padding: '0 6px', color: '#6b21a8', fontWeight: 600 }}
              >
                {isEnglish ? 'Dashboard' : 'Tổng quan'}
              </Button>
              <Tag color="purple" style={{ margin: 0, fontWeight: 700 }}>
                {isTeacher
                  ? isEnglish
                    ? 'My Teaching Classes'
                    : 'Lớp Giảng Dạy Của Tôi'
                  : isEnglish
                  ? 'School-Wide Monitor'
                  : 'Giám Sát Toàn Trường'}
              </Tag>
            </Space>

            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: '#3b0764' }}>
              <ReadOutlined style={{ color: '#7e22ce', marginRight: 8 }} />
              {isTeacher
                ? isEnglish
                  ? 'Student Pre-Class Preparation Report'
                  : 'Báo Cáo Học Viên Chuẩn Bị Bài Trước Giờ Học'
                : isEnglish
                ? `Pre-Class Preparation Monitor (${scopedSummary.overallReadinessRate}% Ready)`
                : `Giám Sát Chuẩn Bị Bài Trước Giờ Học Toàn Trường (Đạt ${scopedSummary.overallReadinessRate}%)`}
            </Title>
            <Text style={{ fontSize: isMobile ? 12 : 13, color: '#6b21a8', display: 'block', marginTop: 2 }}>
              {isTeacher
                ? isEnglish
                  ? 'Inspect real-time reading duration, scroll coverage, and Q&A readiness for your assigned classes.'
                  : 'Theo dõi thời gian đọc thực tế, độ bao phủ bài học và điểm rèn luyện của học viên các lớp bạn dạy.'
                : isEnglish
                ? 'Track every student’s pre-class lesson reading progress, coordinate with parents, and send instant reminders.'
                : 'Theo dõi chi tiết từng học viên & từng lớp học đã đọc bài trước giờ học, phối hợp phụ huynh và gửi nhắc nhở tức thì.'}
            </Text>
          </div>

          <Space
            size={8}
            wrap
            style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'stretch' : 'flex-end' }}
          >
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
              style={{ borderRadius: 8, minHeight: 38, flex: isMobile ? 1 : undefined }}
            >
              {isEnglish ? 'Refresh' : 'Làm mới'}
            </Button>

            {canRemind && remindableStudents.length > 0 && (
              <Button
                type="primary"
                icon={<BellOutlined />}
                loading={bulkSending}
                onClick={confirmBulkRemind}
                data-testid="btn-prep-bulk-remind"
                style={{
                  backgroundColor: '#7e22ce',
                  borderColor: '#7e22ce',
                  fontWeight: 700,
                  borderRadius: 8,
                  minHeight: 38,
                  flex: isMobile ? 2 : undefined,
                }}
              >
                {isEnglish
                  ? `Remind All (${remindableStudents.length})`
                  : `Nhắc Hàng Loạt (${remindableStudents.length})`}
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Hàng 4 Thẻ KPI Tổng Quan (Scale-Proof) */}
      <PrepSummaryKpiRow
        summary={scopedSummary}
        statusFilter={statusFilter}
        onSelectStatus={(nextStatus) => {
          setStatusFilter(nextStatus);
          setActiveTab('students');
        }}
        isEnglish={isEnglish}
        isMobile={isMobile}
      />

      {/* Bộ Lọc Đa Chiều Harmonized (100% Width trên Mobile, Auto-Fit trên Desktop Scale) */}
      <Card
        bordered={false}
        style={{
          marginBottom: isMobile ? 12 : 18,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: isMobile ? '12px 12px' : '14px 18px' } }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder={
              canViewParentContacts
                ? isEnglish
                  ? 'Search student, class, lesson, phone...'
                  : 'Tìm học viên, lớp, bài học, SĐT PH...'
                : isEnglish
                ? 'Search student, class, lesson...'
                : 'Tìm học viên, lớp, bài học...'
            }
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            data-testid="input-prep-search"
            style={{ width: '100%', height: 40, borderRadius: 8 }}
          />

          <Select
            value={selectedClassId}
            onChange={setSelectedClassId}
            data-testid="select-prep-page-class"
            style={{ width: '100%', height: 40 }}
            options={[
              {
                value: 'ALL',
                label: isEnglish
                  ? `All Planned Classes (${dataset.plannedClasses.length})`
                  : `Tất cả lớp có giáo án (${dataset.plannedClasses.length})`,
              },
              ...dataset.plannedClasses.map((c) => ({
                value: c.classId,
                label: `${c.classId} • ${c.className} (${c.preparedCount}/${c.totalStudents})`,
              })),
            ]}
          />

          {canFilterTeacher && (
            <Select
              value={selectedTeacherId}
              onChange={setSelectedTeacherId}
              data-testid="select-prep-page-teacher"
              style={{ width: '100%', height: 40 }}
              options={[
                {
                  value: 'ALL',
                  label: isEnglish
                    ? `All Teachers (${teacherOptions.length})`
                    : `Tất cả giáo viên (${teacherOptions.length})`,
                },
                ...teacherOptions,
              ]}
            />
          )}

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            data-testid="select-prep-page-status"
            style={{ width: '100%', height: 40 }}
            options={[
              { value: 'ALL', label: isEnglish ? 'All Reading Statuses' : 'Tất cả trạng thái đọc' },
              { value: PREP_STATUS.NOT_STARTED, label: isEnglish ? '🔴 Not Read Yet' : '🔴 Chưa đọc bài' },
              { value: PREP_STATUS.SKIMMED, label: isEnglish ? '🟡 Reading In Progress' : '🟡 Đang đọc dở / Lướt' },
              { value: PREP_STATUS.PREPARED, label: isEnglish ? '🟢 Prepared Before Class' : '🟢 Đã chuẩn bị tốt' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isEnglish
                ? `Showing ${filteredStudents.length} student(s) across ${filteredClasses.length} class(es)`
                : `Đang hiển thị ${filteredStudents.length} học viên thuộc ${filteredClasses.length} lớp học`}
            </Text>
            <Button size="small" type="link" onClick={handleResetFilters} style={{ padding: 0, fontWeight: 600 }}>
              {isEnglish ? 'Reset Filters' : 'Xóa bộ lọc'}
            </Button>
          </div>
        )}
      </Card>

      {/* Nội Dung Chính 2 Tabs: Theo Học Viên & Theo Lớp Học */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        styles={{ body: { padding: isMobile ? '10px 12px 16px' : '14px 20px 20px' } }}
      >
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarGutter={isMobile ? 16 : 28}
            items={[
              {
                key: 'students',
                label: (
                  <span data-testid="tab-prep-students" style={{ fontWeight: 700 }}>
                    <TeamOutlined style={{ marginRight: 6 }} />
                    {isMobile
                      ? isEnglish
                        ? `Students (${filteredStudents.length})`
                        : `Học viên (${filteredStudents.length})`
                      : isEnglish
                      ? `By Student (${filteredStudents.length})`
                      : `Danh Sách Học Viên (${filteredStudents.length})`}
                  </span>
                ),
                children: (
                  <PrepStudentTrackingList
                    students={filteredStudents}
                    canViewParentContacts={canViewParentContacts}
                    canRemind={canRemind}
                    remindedMap={remindedMap}
                    sendingKey={sendingKey}
                    onSendReminder={handleSendSingleReminder}
                    isEnglish={isEnglish}
                    isMobile={isMobile}
                  />
                ),
              },
              {
                key: 'classes',
                label: (
                  <span data-testid="tab-prep-classes" style={{ fontWeight: 700 }}>
                    <AppstoreOutlined style={{ marginRight: 6 }} />
                    {isMobile
                      ? isEnglish
                        ? `Classes (${filteredClasses.length})`
                        : `Theo lớp (${filteredClasses.length})`
                      : isEnglish
                      ? `By Class Overview (${filteredClasses.length})`
                      : `Tổng Quan Theo Lớp (${filteredClasses.length})`}
                  </span>
                ),
                children: (
                  <PrepClassOverviewGrid
                    classes={filteredClasses}
                    onInspectClass={handleInspectClassStudents}
                    isEnglish={isEnglish}
                    isMobile={isMobile}
                  />
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default PreClassPrepPage;
