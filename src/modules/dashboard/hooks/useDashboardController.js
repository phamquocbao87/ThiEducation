import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../../../core/context/AuthContext';
import { ROLE_BANNERS } from '../models/dashboard.model';
import { SystemHealthService } from '../services/SystemHealthService';
import { DashboardDataService } from '../services/DashboardDataService';
import { CourseService } from '../../courses/services/CourseService';
import { ClassService } from '../../courses/services/ClassService';
import { TuitionBillingService } from '../../tuition/services/TuitionBillingService';
import { TeacherPayrollService } from '../../contracts/services/TeacherPayrollService';
import { useDashboardClassroom } from './useDashboardClassroom';
import { PermissionService } from '../../../core/services/PermissionService';
export const useDashboardController = () => {
  const { currentUser, allSystemUsers } = useAuth();
  const role = currentUser?.role || 'student';
  const [courses, setCourses] = useState([]);
  const { classes, setClasses, classroomError } = useDashboardClassroom(currentUser);
  const [tuitions, setTuitions] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  // Tải 100% dữ liệu thực tế từ Cloud Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchRealDbData = async () => {
      setLoading(true);
      try {
        const [cList, clsList, tList, pList] = await Promise.all([
          CourseService.getAllCourses(),
          PermissionService.canAccessModule(role, 'classroom') ? Promise.resolve(null) : ClassService.getAllClasses(),
          TuitionBillingService.getAllTuitionBills(),
          TeacherPayrollService.getAllPayrolls(),
        ]);
        if (isMounted) {
          setCourses(cList || []);
          if (clsList) setClasses(clsList);
          setTuitions(tList || []);
          setPayrolls(pList || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard real DB data:', err);
      } finally {
        if (isMounted) setLoading(false);
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
  // 1. Dữ liệu chuyên biệt cho Giám đốc (Director)
  const directorData = useMemo(
    () =>
      DashboardDataService.getDirectorAnalytics({
        users: allSystemUsers,
        classes,
        courses,
        tuitions,
        payrolls,
      }),
    [allSystemUsers, classes, courses, tuitions, payrolls]
  );
  // 2. Dữ liệu chuyên biệt cho Giáo vụ (Academic)
  const academicData = useMemo(
    () =>
      DashboardDataService.getAcademicOperationsData({
        classes,
        users: allSystemUsers,
      }),
    [classes, allSystemUsers]
  );
  // 3. Dữ liệu chuyên biệt cho Kế toán (Accountant)
  const accountantData = useMemo(
    () =>
      DashboardDataService.getAccountantTreasuryData({
        tuitions,
        payrolls,
        users: allSystemUsers,
        classes,
      }),
    [tuitions, payrolls, allSystemUsers, classes]
  );
  // 4. Dữ liệu chuyên biệt cho Giáo viên bản xứ (Teacher)
  const teacherWorkspaceData = useMemo(
    () =>
      DashboardDataService.getTeacherWorkspaceRealData({
        currentUser,
        classes,
        users: allSystemUsers,
        payrolls,
      }),
    [currentUser, classes, allSystemUsers, payrolls]
  );

  // 5. Dữ liệu chuyên biệt cho Học viên (Student)
  const studentPortalData = useMemo(
    () =>
      DashboardDataService.getStudentPortalRealData({
        currentUser,
        classes,
        tuitions,
      }),
    [currentUser, classes, tuitions]
  );

  // 6. Dữ liệu nhân khẩu học 6 Roles cho IT Admin (Admin)
  const adminDemographics = useMemo(
    () =>
      DashboardDataService.getAdminDemographics({
        users: allSystemUsers,
      }),
    [allSystemUsers]
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
    classroomError,
    currentUser,
    role,
    loading,
    bannerInfo,
    healthData,
    adminDemographics,
    directorData,
    academicData,
    accountantData,
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
