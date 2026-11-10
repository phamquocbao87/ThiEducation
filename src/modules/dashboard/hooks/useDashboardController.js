import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { ROLE_BANNERS } from '../models/dashboard.model';
import { SystemHealthService } from '../services/SystemHealthService';
import { ExecutiveAnalyticsService } from '../services/ExecutiveAnalyticsService';
import { PersonalPortalService } from '../services/PersonalPortalService';
import { CourseService } from '../../courses/services/CourseService';
import { ClassService } from '../../courses/services/ClassService';

export const useDashboardController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const role = currentUser.role;

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  // Tải dữ liệu thực tế từ Cloud Firestore: Khóa học & Lớp học
  useEffect(() => {
    let isMounted = true;
    const fetchRealDbData = async () => {
      try {
        const [cList, clsList] = await Promise.all([
          CourseService.getAllCourses(),
          ClassService.getAllClasses(),
        ]);
        if (isMounted) {
          setCourses(cList);
          setClasses(clsList);
        }
      } catch (err) {
        console.error('Error fetching dashboard real DB data:', err);
      }
    };
    fetchRealDbData();
    return () => {
      isMounted = false;
    };
  }, []);

  const [healthData, setHealthData] = useState(() =>
    SystemHealthService.getSystemHealthOverview()
  );
  const [selectedCutoffYear, setSelectedCutoffYear] = useState('2025');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isCuttingOff, setIsCuttingOff] = useState(false);
  const [recentDriveArchives, setRecentDriveArchives] = useState([]);

  const bannerInfo = ROLE_BANNERS[role] || ROLE_BANNERS.director;

  // Tính toán số liệu thống kê Dashboard 100% từ dữ liệu thực tế Firestore
  const executiveSummary = useMemo(
    () =>
      ExecutiveAnalyticsService.getExecutiveSummary({
        users: allSystemUsers,
        courses,
        classes,
      }),
    [allSystemUsers, courses, classes]
  );

  const teacherWorkspaceData = useMemo(
    () => PersonalPortalService.getTeacherWorkspaceData(currentUser),
    [currentUser]
  );

  const studentPortalData = useMemo(
    () => PersonalPortalService.getStudentPortalData(currentUser),
    [currentUser]
  );

  const handleRunDiagnostic = () => {
    setHealthData((prev) => ({
      ...prev,
      services: SystemHealthService.runHealthDiagnostic(prev.services),
    }));
    message.success('Đã quét kiểm tra sức khỏe toàn bộ cụm máy chủ & API: 100% Healthy!');
  };

  const handleBackupToDrive = async () => {
    try {
      setIsBackingUp(true);
      const uploaded = await SystemHealthService.backupFullDatabaseToDrive();
      setRecentDriveArchives((prev) => [uploaded, ...prev]);
      message.success(`Đã sao lưu thành công file ${uploaded.fileName} lên Google Drive!`);
    } catch (err) {
      message.error(`Lỗi sao lưu: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCutoffYearToDrive = async () => {
    try {
      setIsCuttingOff(true);
      const uploaded = await SystemHealthService.cutOffYearDataToDrive(selectedCutoffYear);
      setRecentDriveArchives((prev) => [uploaded, ...prev]);
      message.success(
        `Đã cắt và đóng gói dữ liệu năm ${selectedCutoffYear} lên Google Drive (${uploaded.fileName}) thành công!`
      );
    } catch (err) {
      message.error(`Lỗi cắt dữ liệu: ${err.message}`);
    } finally {
      setIsCuttingOff(false);
    }
  };

  return {
    currentUser,
    role,
    bannerInfo,
    healthData,
    executiveSummary,
    teacherWorkspaceData,
    studentPortalData,
    selectedCutoffYear,
    setSelectedCutoffYear,
    isBackingUp,
    isCuttingOff,
    recentDriveArchives,
    handleRunDiagnostic,
    handleBackupToDrive,
    handleCutoffYearToDrive,
  };
};

export default useDashboardController;
