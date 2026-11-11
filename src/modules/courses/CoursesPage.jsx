import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, Row, Col, Card, Statistic, Typography } from 'antd';
import { BookOutlined, TeamOutlined, UserOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useCoursesController } from './hooks/useCoursesController';
import { CourseCatalogTab } from './components/CourseCatalogTab';
import { CourseDetailDrawer, CourseFormModal } from './components/CourseFormModal';
import { ClassManagementTab } from './components/ClassManagementTab';
import { ClassFormDrawer } from './components/ClassFormDrawer';
import { ClassRosterDrawer } from './components/ClassRosterDrawer';
import { CurriculumLevelsPage } from '../curriculum/CurriculumLevelsPage';
import { CurriculumLevelService } from '../curriculum/services/CurriculumLevelService';

const { Title, Text } = Typography;

export const CoursesPage = () => {
  const navigate = useNavigate();
  const { isEnglish, t } = useLanguage();
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    currentUser,
    canManage,
    activeTab,
    setActiveTab,
    courses,
    allCourses,
    classes,
    allClasses,
    teachers,
    allStudents,
    courseSearch,
    setCourseSearch,
    classSearch,
    setClassSearch,
    selectedCourseFilter,
    setSelectedCourseFilter,
    selectedTeacherFilter,
    setSelectedTeacherFilter,
    viewingCourse,
    setViewingCourse,
    editingCourse,
    setEditingCourse,
    isClassModalOpen,
    setIsClassModalOpen,
    rosterClass,
    setRosterClass,
    editingClass,
    setEditingClass,
    handleUpdateCourse,
    handleCreateClass,
    handleUpdateClass,
    handleRequestTeachClass,
    handleApproveTeacherRequest,
    handleRejectTeacherRequest,
    handleRequestEnrollClass,
    handleApproveStudentRequest,
    handleRejectStudentRequest,
    handleDeleteCourse,
    handleDeleteClass,
    handleClearAllData,
  } = useCoursesController();

  const [searchParams] = useSearchParams();

  // Xử lý Deep-Linking từ Notifications hoặc URL trực tiếp
  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    const classIdParam = searchParams.get('classId');
    const actionParam = searchParams.get('action');

    if (tabParam === 'classes' || tabParam === 'courses' || tabParam === 'curriculum') {
      setActiveTab(tabParam);
    }

    if (classIdParam && allClasses.length > 0) {
      const target = allClasses.find((c) => c.id === classIdParam);
      if (target) {
        if (actionParam === 'roster' || !actionParam) {
          setRosterClass(target);
        } else if (actionParam === 'edit') {
          setEditingClass(target);
          setIsClassModalOpen(true);
        }
      }
    }
  }, [searchParams, allClasses, setActiveTab, setRosterClass, setEditingClass, setIsClassModalOpen]);

  return (
    <div>
      {/* 1. Header Tiêu Đề */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
          {t('courses.pageTitle')}
        </Title>
        <Text type="secondary">
          {isEnglish
            ? 'Organize McGraw-Hill Wonders curriculum programs, set up online classes, and assign 1 Native Teacher per class.'
            : 'Quản trị chương trình đào tạo McGraw-Hill Wonders ELA, khởi tạo lớp học và phân công 01 Giáo viên bản xứ phụ trách.'}
        </Text>
      </div>

      {/* 2. Thẻ Thống Kê Tổng Quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={t('courses.stats.programs')}
              value={allCourses.length}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={t('courses.stats.activeClasses')}
              value={allClasses.length}
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={t('courses.stats.teachers')}
              value={teachers.length}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={t('courses.stats.students')}
              value={allStudents.length}
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. Khối Tabs Chuyên Môn: Khóa Học vs Lớp Học */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
        }}
        styles={{ body: { padding: isMobile ? '12px 10px 20px' : '12px 20px 24px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'classes',
              label: (
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600 }}>
                  <TeamOutlined style={{ marginRight: 6 }} />
                  {isMobile
                    ? t('courses.tabs.classesShort')
                    : t('courses.tabs.classes')}{' '}
                  ({allClasses.length})
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <ClassManagementTab
                    classes={classes}
                    allClasses={allClasses}
                    courses={allCourses}
                    teachers={teachers}
                    currentUser={currentUser}
                    canManage={canManage}
                    search={classSearch}
                    onSearchChange={setClassSearch}
                    courseFilter={selectedCourseFilter}
                    onCourseFilterChange={setSelectedCourseFilter}
                    teacherFilter={selectedTeacherFilter}
                    onTeacherFilterChange={setSelectedTeacherFilter}
                    onOpenCreate={() => {
                      setEditingClass(null);
                      setIsClassModalOpen(true);
                    }}
                    onViewRoster={(cls) => setRosterClass(cls)}
                    onEditClass={(cls) => {
                      setEditingClass(cls);
                      setIsClassModalOpen(true);
                    }}
                    onDeleteClass={handleDeleteClass}
                    onRequestTeachClass={handleRequestTeachClass}
                    onApproveTeacherRequest={handleApproveTeacherRequest}
                    onRejectTeacherRequest={handleRejectTeacherRequest}
                    onRequestEnrollClass={handleRequestEnrollClass}
                    onApproveStudentRequest={handleApproveStudentRequest}
                    onRejectStudentRequest={handleRejectStudentRequest}
                    isMobile={isMobile}
                  />
                </div>
              ),
            },
            {
              key: 'courses',
              label: (
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600 }}>
                  <BookOutlined style={{ marginRight: 6 }} />
                  {isMobile
                    ? t('courses.tabs.catalogShort')
                    : t('courses.tabs.catalog')}{' '}
                  ({allCourses.length})
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <CourseCatalogTab
                    courses={courses}
                    classes={allClasses}
                    canManage={canManage}
                    onOpenCreate={() => navigate('/courses-classes/new')}
                    onViewCourse={(course) => setViewingCourse(course)}
                    onEditCourse={(course) => setEditingCourse(course)}
                    onSwitchToCourseClasses={(courseId) => {
                      setSelectedCourseFilter(courseId);
                      setActiveTab('classes');
                    }}
                    search={courseSearch}
                    onSearchChange={setCourseSearch}
                    onDeleteCourse={handleDeleteCourse}
                    onClearAll={handleClearAllData}
                    isMobile={isMobile}
                  />
                </div>
              ),
            },
            {
              key: 'curriculum',
              label: (
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600 }}>
                  <AppstoreOutlined style={{ marginRight: 6 }} />
                  {isMobile
                    ? (isEnglish ? 'Curriculum' : 'Cấp Độ')
                    : t('menus.curriculum')}{' '}
                  ({CurriculumLevelService.getAllLevels().length})
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <CurriculumLevelsPage embedded={true} />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 4. Drawers Chế Độ Xem Chi Tiết & Chỉnh Sửa Khóa Học */}
      <CourseDetailDrawer
        open={Boolean(viewingCourse)}
        course={viewingCourse}
        classes={allClasses}
        canManage={canManage}
        onClose={() => setViewingCourse(null)}
        onEdit={(course) => setEditingCourse(course)}
        onRequestEnrollClass={handleRequestEnrollClass}
        onViewRoster={(cls) => {
          setViewingCourse(null);
          setRosterClass(cls);
        }}
      />

      <CourseFormModal
        open={Boolean(editingCourse)}
        editingCourse={editingCourse}
        onCancel={() => setEditingCourse(null)}
        onSubmit={(values) => {
          if (editingCourse) {
            handleUpdateCourse(editingCourse.id, values);
          }
        }}
      />

      {/* 5. Drawers Chế Độ Xem Chi Tiết & Chỉnh Sửa Lớp Học */}
      <ClassRosterDrawer
        open={Boolean(rosterClass)}
        targetClass={rosterClass}
        allStudents={allStudents}
        teachers={teachers}
        currentUser={currentUser}
        canManage={canManage}
        onClose={() => setRosterClass(null)}
        onEdit={(cls) => {
          setEditingClass(cls);
          setIsClassModalOpen(true);
        }}
        onRequestTeachClass={handleRequestTeachClass}
        onApproveTeacherRequest={handleApproveTeacherRequest}
        onRejectTeacherRequest={handleRejectTeacherRequest}
        onRequestEnrollClass={handleRequestEnrollClass}
        onApproveStudentRequest={handleApproveStudentRequest}
        onRejectStudentRequest={handleRejectStudentRequest}
      />

      <ClassFormDrawer
        open={isClassModalOpen}
        editingClass={editingClass}
        courses={allCourses}
        teachers={teachers}
        students={allStudents}
        existingClasses={allClasses}
        onCancel={() => {
          setIsClassModalOpen(false);
          setEditingClass(null);
        }}
        onSubmit={(values) => {
          if (editingClass) {
            handleUpdateClass(editingClass.id, values);
          } else {
            handleCreateClass(values);
          }
        }}
      />
    </div>
  );
};
