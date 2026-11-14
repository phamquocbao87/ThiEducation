import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, message } from 'antd';
import { IdcardOutlined, TeamOutlined } from '@ant-design/icons';
import { useLanguage } from '../../core/context/LanguageContext';
import { useCoursesController } from '../courses/hooks/useCoursesController';
import { StudentCardGrid } from '../courses/components/StudentCardGrid';
import { UserService } from '../users/services/UserService';

const { Title, Text } = Typography;

export const StudentsPage = () => {
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    currentUser,
    canManage,
    allCourses,
    allClasses,
    allStudents,
  } = useCoursesController();

  const handleToggleStudentStatus = async (student, checked) => {
    try {
      const newStatus = checked ? 'Active' : 'Disabled';
      await UserService.toggleUserStatus(currentUser, student, newStatus);
      message.success(
        isEnglish
          ? `Updated status for ${student.name} to ${checked ? 'Active' : 'Paused'}`
          : `Đã cập nhật trạng thái học viên ${student.name} thành ${checked ? 'Đang học' : 'Tạm dừng'}`
      );
    } catch (err) {
      message.error(err.message || 'Lỗi cập nhật trạng thái học viên');
      throw err;
    }
  };

  return (
    <div data-testid="dedicated-student-management-view">
      {/* 1. Header Tiêu Đề Quản Lý Học Viên */}
      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            <IdcardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {isEnglish ? 'Student Management' : 'Quản Lý Học Viên'}
          </Title>
          <Text type="secondary">
            {isEnglish
              ? 'Manage student roster, personal profiles, enrolled online classes, and parent contact information.'
              : 'Quản trị danh sách học viên thực tế, hồ sơ cá nhân, lớp học trực tuyến đang tham gia và thông tin liên hệ phụ huynh.'}
          </Text>
        </div>
        <Button
          icon={<TeamOutlined />}
          onClick={() => navigate('/courses-classes')}
          style={{ borderRadius: 8 }}
        >
          {isEnglish ? 'View Classes & Courses' : 'Xem Khóa Học & Lớp Học'}
        </Button>
      </div>

      {/* 2. Lưới Thẻ Học Viên Độc Lập */}
      <StudentCardGrid
        students={allStudents}
        allClasses={allClasses}
        courses={allCourses}
        currentUser={currentUser}
        canManage={canManage}
        onViewStudent={(student) => navigate(`/user-management/${student.code || student.id}`)}
        onEditStudent={(student) => navigate(`/user-management/${student.code || student.id}`)}
        onToggleStatus={handleToggleStudentStatus}
        onOpenCreateStudent={() => navigate('/user-management/new')}
        isMobile={isMobile}
      />
    </div>
  );
};

export default StudentsPage;

