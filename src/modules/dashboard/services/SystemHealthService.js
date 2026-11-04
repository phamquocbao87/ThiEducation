import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';
import {
  MOCK_SYSTEM_HEALTH,
  INITIAL_STATS,
  MOCK_COURSES,
  MOCK_CLASSES,
  MOCK_TEACHERS,
  MOCK_STUDENTS,
  MOCK_CONTRACTS,
  MOCK_PAYROLLS,
  MOCK_TIMETABLE,
  MOCK_ATTENDANCES,
  MOCK_HOMEWORKS,
} from '../../../shared/data/mockData';

/**
 * Sub-Feature Class 1 (Dashboard): IT System Health, Drive Backup & On-Demand Year Cut-off
 * Dedicated to role: `admin`
 */
export class SystemHealthService extends BaseModuleService {
  static DRIVE_FOLDER_TREE = [
    { code: '01_DATABASE_BACKUPS/2026', folderId: '1umdw3PpK5js0ZHcYhqw88IZ64ODEmA5F', purpose: 'Chứa các bản sao lưu toàn bộ Database Firestore (.json)' },
    { code: '02_YEARLY_CUTOFF_ARCHIVES/2025', folderId: '196qivwcZJ8LyMdS-59jSKySe7CrufYKU', purpose: 'Chứa dữ liệu các năm cũ đã cắt theo yêu cầu của Admin (VD: cắt năm 2025)' },
    { code: '03_TEACHER_CONTRACTS_PAYSLIPS/contracts_pdf', folderId: '19EsJcPR8q9hZ05iRpeaAK7Vuzhfh4R0Y', purpose: 'Chứa file PDF Hợp đồng Giáo viên bản xứ' },
    { code: '03_TEACHER_CONTRACTS_PAYSLIPS/payslips_pdf', folderId: '12tnmymoId6nDJx952n1YCrbiq63KE6Wm', purpose: 'Chứa file PDF Phiếu lương Giáo viên & Giáo vụ' },
    { code: '04_STUDENT_HOMEWORKS_PROFILES/homeworks_2026', folderId: '1-3kkrYMZau2utg7TJ4E38YTCbRIwcJFU', purpose: 'Chứa file PDF/Ảnh/Video bài tập về nhà của Học viên' },
    { code: '04_STUDENT_HOMEWORKS_PROFILES/avatars', folderId: '1HjcFshw6rqfKf978HzcOf8oAlVaFlanV', purpose: 'Chứa ảnh đại diện của 68 Giáo viên & 520 Học viên' },
    { code: '05_TUITION_BILLS_INVOICES/2026', folderId: '1Z-yxE9LX4SKZghucVw-E2-cy_iwR1kdP', purpose: 'Chứa ảnh chụp Bill chuyển khoản học phí & Chứng từ kế toán' },
    { code: '06_CLASS_RECORDINGS_MATERIALS/2026', folderId: '1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS', purpose: 'Chứa giáo trình PDF, tài liệu dạy và ghi hình lớp Zoom' },
  ];

  static getSystemHealthOverview() {
    const storagePercent = Math.round(
      (MOCK_SYSTEM_HEALTH.storageUsedGb / MOCK_SYSTEM_HEALTH.storageLimitGb) * 100
    );
    return {
      ...MOCK_SYSTEM_HEALTH,
      storagePercent,
      driveRootUrl: DriveStorageService.CONFIG.DRIVE_ROOT_URL,
      driveFolderTree: this.DRIVE_FOLDER_TREE,
    };
  }

  static runHealthDiagnostic(services) {
    return services.map((srv) => ({
      ...srv,
      status: 'Healthy',
      lastCheck: 'Vừa kiểm tra tức thì',
    }));
  }

  /**
   * Sao lưu toàn bộ dữ liệu hiện tại thành file JSON và đẩy thẳng lên Google Drive: 01_DATABASE_BACKUPS/2026
   */
  static async backupFullDatabaseToDrive() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `lakeducation_full_backup_${timestamp}.json`;
    const payload = {
      exportedAt: new Date().toISOString(),
      project: 'LAK EDUCATION (lakeducation.com)',
      firebaseAccount: 'vnthietbigarage@gmail.com',
      stats: INITIAL_STATS,
      courses: MOCK_COURSES,
      classes: MOCK_CLASSES,
      teachers: MOCK_TEACHERS,
      students: MOCK_STUDENTS,
      contracts: MOCK_CONTRACTS,
      payrolls: MOCK_PAYROLLS,
      timetable: MOCK_TIMETABLE,
      attendances: MOCK_ATTENDANCES,
      homeworks: MOCK_HOMEWORKS,
    };

    return DriveStorageService.uploadJsonArchive(
      payload,
      fileName,
      DriveStorageService.FOLDERS.DATABASE_BACKUPS('2026'),
      {
        tag: 'full_backup,2026',
        title: `Bản sao lưu toàn bộ Database LAK EDUCATION (${timestamp})`,
        purpose: 'database_backup',
        key: 'backup_2026',
      }
    );
  }

  /**
   * Cắt dữ liệu theo Năm được Admin chọn chủ động (Ví dụ năm 2027 chọn cắt dữ liệu năm 2025)
   * Đẩy lên thư mục 02_YEARLY_CUTOFF_ARCHIVES/<targetYear> trên Google Drive
   */
  static async cutOffYearDataToDrive(targetYear = '2025') {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `lakeducation_cutoff_archive_${targetYear}_${timestamp}.json`;

    const archivePayload = {
      cutoffYear: targetYear,
      executedAt: new Date().toISOString(),
      policy: 'On-Demand Manual Year Cut-off (Giữ lại Master Data, cắt Transactional Data)',
      retainedMasterData: ['users', 'courses', 'classes', 'students', 'active_contracts'],
      archivedCollections: {
        attendances: MOCK_ATTENDANCES,
        homeworks: MOCK_HOMEWORKS,
        payrolls: MOCK_PAYROLLS,
      },
    };

    return DriveStorageService.uploadJsonArchive(
      archivePayload,
      fileName,
      DriveStorageService.FOLDERS.YEARLY_CUTOFF_ARCHIVES(targetYear),
      {
        tag: `yearly_cutoff,${targetYear}`,
        title: `Gói cắt dữ liệu lịch sử năm ${targetYear} (On-Demand Cut-off)`,
        purpose: 'yearly_cutoff',
        key: `cutoff_${targetYear}`,
      }
    );
  }
}
