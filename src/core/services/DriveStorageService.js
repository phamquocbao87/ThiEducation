/**
 * Common Google Drive Storage Service Class (Zero-Egress via Hosting-Store API)
 *
 * 📌 THÔNG TIN ĐĂNG KÝ CHÍNH THỨC TRÊN HOSTING-STORE:
 * - API Endpoint: https://hosting-store-api.phuchungvang.com/api
 * - App ID (`x-app-id`): lakeducation_com
 * - App Token (`x-app-token`): app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe
 * - Google Drive Root Folder ID: 1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn
 *   (Mở trực tiếp trên Drive: https://drive.google.com/drive/folders/1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn)
 *
 * 📁 CẤU TRÚC THƯ MỤC CHUẨN TRÊN GOOGLE DRIVE (ĐÃ KHỞI TẠO SẴN):
 * lakeducation_com (1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn)
 * ├── 01_DATABASE_BACKUPS/2026                 (ID: 1umdw3PpK5js0ZHcYhqw88IZ64ODEmA5F)
 * ├── 02_YEARLY_CUTOFF_ARCHIVES/2025           (ID: 196qivwcZJ8LyMdS-59jSKySe7CrufYKU)
 * ├── 03_TEACHER_CONTRACTS_PAYSLIPS/
 * │   ├── contracts_pdf                        (ID: 19EsJcPR8q9hZ05iRpeaAK7Vuzhfh4R0Y)
 * │   └── payslips_pdf                         (ID: 12tnmymoId6nDJx952n1YCrbiq63KE6Wm)
 * ├── 04_STUDENT_HOMEWORKS_PROFILES/
 * │   ├── homeworks_2026                       (ID: 1-3kkrYMZau2utg7TJ4E38YTCbRIwcJFU)
 * │   └── avatars                              (ID: 1HjcFshw6rqfKf978HzcOf8oAlVaFlanV)
 * ├── 05_TUITION_BILLS_INVOICES/2026           (ID: 1Z-yxE9LX4SKZghucVw-E2-cy_iwR1kdP)
 * └── 06_CLASS_RECORDINGS_MATERIALS/2026       (ID: 1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS)
 */
export class DriveStorageService {
  static CONFIG = {
    API_BASE: 'https://hosting-store-api.phuchungvang.com/api',
    APP_ID: 'lakeducation_com',
    APP_TOKEN: 'app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe',
    DRIVE_FOLDER_ID: '1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn',
    DRIVE_ROOT_URL: 'https://drive.google.com/drive/folders/1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn',
  };

  static FOLDERS = {
    DATABASE_BACKUPS: (year = '2026') => `01_DATABASE_BACKUPS/${year}`,
    YEARLY_CUTOFF_ARCHIVES: (year = '2025') => `02_YEARLY_CUTOFF_ARCHIVES/${year}`,
    CONTRACTS_PDF: '03_TEACHER_CONTRACTS_PAYSLIPS/contracts_pdf',
    PAYSLIPS_PDF: '03_TEACHER_CONTRACTS_PAYSLIPS/payslips_pdf',
    HOMEWORK_MEDIA: (year = '2026') => `04_STUDENT_HOMEWORKS_PROFILES/homeworks_${year}`,
    AVATARS: '04_STUDENT_HOMEWORKS_PROFILES/avatars',
    TUITION_BILLS: (year = '2026') => `05_TUITION_BILLS_INVOICES/${year}`,
    CLASS_RECORDINGS: (year = '2026') => `06_CLASS_RECORDINGS_MATERIALS/${year}`,
  };

  static getHeaders() {
    return {
      'x-app-id': this.CONFIG.APP_ID,
      'x-app-token': this.CONFIG.APP_TOKEN,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Upload file trực tiếp từ trình duyệt lên Google Drive theo chuẩn Zero-Egress (3 bước)
   */
  static async uploadFile(file, options = {}) {
    const {
      folderPath = this.FOLDERS.HOMEWORK_MEDIA('2026'),
      tag = 'lakeducation_upload',
      title = file.name,
      notes = '',
      purpose = 'general',
      key = '',
    } = options;

    // Bước 1: Khởi tạo phiên Resumable Upload
    const sessionRes = await fetch(`${this.CONFIG.API_BASE}/storage/upload-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        folderPath,
      }),
    });
    const sessionData = await sessionRes.json();
    if (!sessionData.success) {
      throw new Error(sessionData.error || 'Không thể khởi tạo phiên upload Google Drive.');
    }

    const { uploadUrl } = sessionData.data;

    // Bước 2: Đẩy dữ liệu nhị phân trực tiếp từ trình duyệt lên Google Drive
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': String(file.size),
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error('Tải dữ liệu lên Google Drive thất bại.');
    }

    const driveResult = await uploadRes.json();
    const fileId = driveResult.id;

    // Bước 3: Xác nhận hoàn tất và nhận bộ link CDN (lh3) + Direct Download
    const confirmRes = await fetch(`${this.CONFIG.API_BASE}/storage/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        fileId,
        fileName: file.name,
        folderPath,
        tag,
        title,
        notes,
        purpose,
        key,
      }),
    });

    const confirmData = await confirmRes.json();
    if (!confirmData.success) {
      throw new Error(confirmData.error || 'Không thể xác nhận tệp trên Hosting-Store.');
    }

    return confirmData.data;
  }

  /**
   * Đóng gói bất kỳ đối tượng JSON nào (Backup / Yearly Cut-off Archive) thành File và đẩy lên Google Drive
   */
  static async uploadJsonArchive(jsonObject, fileName, folderPath, metadata = {}) {
    const jsonString = JSON.stringify(jsonObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });
    return this.uploadFile(file, {
      folderPath,
      tag: metadata.tag || 'json_archive',
      title: metadata.title || fileName,
      notes: metadata.notes || '',
      purpose: metadata.purpose || 'database_archive',
      key: metadata.key || fileName,
    });
  }

  /**
   * Lấy danh sách file đã lưu trên Google Drive của dự án lakeducation_com
   */
  static async listFiles({ folderPath = '', tag = '', purpose = '', key = '', limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (folderPath) params.set('folderPath', folderPath);
    if (tag) params.set('tag', tag);
    if (purpose) params.set('purpose', purpose);
    if (key) params.set('key', key);
    if (limit) params.set('limit', String(limit));

    const res = await fetch(`${this.CONFIG.API_BASE}/storage/files?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data || [];
  }

  static getImageCdnUrl(fileId, width = 800) {
    if (!fileId) return '';
    return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
  }

  static getDirectDownloadUrl(fileId) {
    if (!fileId) return '';
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
}
