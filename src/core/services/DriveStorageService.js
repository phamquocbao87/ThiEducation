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
      onProgress = null,
    } = options;

    if (typeof onProgress === 'function') onProgress(15);

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

    // Bước 2: Đẩy dữ liệu nhị phân trực tiếp lên Google Drive
    // Khi chạy trên localhost / dev, proxy qua Vite server /google-upload để tránh lỗi CORS chặn đọc response của Google
    let effectiveUploadUrl = uploadUrl;
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      effectiveUploadUrl = uploadUrl.replace('https://www.googleapis.com', '/google-upload');
    }

    const contentRange = file.size > 0 ? `bytes 0-${file.size - 1}/${file.size}` : 'bytes */0';
    let driveResult;

    if (typeof onProgress === 'function' && typeof XMLHttpRequest !== 'undefined') {
      driveResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', effectiveUploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('Content-Range', contentRange);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const rawPercent = Math.round((evt.loaded / evt.total) * 70); // 20% -> 90%
            onProgress(20 + rawPercent);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              resolve({ id: '' });
            }
          } else {
            reject(new Error(`Tải dữ liệu lên Google Drive thất bại: HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Lỗi mạng khi tải tệp lên Google Drive.'));
        xhr.send(file);
      });
    } else {
      const uploadRes = await fetch(effectiveUploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Range': contentRange,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Tải dữ liệu lên Google Drive thất bại.');
      }
      driveResult = await uploadRes.json();
    }

    const fileId = driveResult?.id;

    if (typeof onProgress === 'function') onProgress(92);

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

    if (typeof onProgress === 'function') onProgress(100);

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

  static getImageCdnUrl(fileId, size = 400) {
    if (!fileId) return '';
    return `https://lh3.googleusercontent.com/d/${fileId}=s${size}-c`;
  }

  /**
   * Định dạng chuẩn hóa URL ảnh đại diện Google Drive sang CDN siêu tốc độ & vuông vắn:
   * - Hỗ trợ cả fileId, drive.google.com/file/d/..., drive.google.com/uc?id=... và lh3.googleusercontent.com
   * - Tối ưu kích thước (s200, s400) giúp tải nhanh dưới 50ms và không tốn băng thông
   */
  static formatAvatarUrl(url, size = 400) {
    if (!url || typeof url !== 'string') return '';

    // Nếu là link lh3.googleusercontent.com
    if (url.includes('googleusercontent.com/d/')) {
      const rawId = url.split('/d/')[1]?.split('=')[0];
      if (rawId) {
        return `https://lh3.googleusercontent.com/d/${rawId}=s${size}-c`;
      }
    }

    // Nếu là link drive.google.com/file/d/FILE_ID/view...
    const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile && matchFile[1]) {
      return `https://lh3.googleusercontent.com/d/${matchFile[1]}=s${size}-c`;
    }

    // Nếu là drive.google.com/uc?export=download&id=FILE_ID
    const matchUc = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchUc && matchUc[1]) {
      return `https://lh3.googleusercontent.com/d/${matchUc[1]}=s${size}-c`;
    }

    return url;
  }

  static getDirectDownloadUrl(fileId) {
    if (!fileId) return '';
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Trích xuất Google Drive fileId từ bản ghi học liệu hoặc đường dẫn Drive
   */
  static extractDriveFileId(input) {
    if (!input) return '';
    if (typeof input === 'object') {
      if (input.driveFileId && String(input.driveFileId).trim()) {
        return String(input.driveFileId).trim();
      }
      // Chỉ trích xuất từ URL đối với các bản ghi được đánh dấu tải lên qua hệ thống
      const isManagedUpload =
        Boolean(input.isGoogleDrive) ||
        Boolean(input.isSessionRecording) ||
        Boolean(input.storagePath) ||
        Boolean(input.firebaseFolder);
      if (!isManagedUpload) return '';
      return this.extractDriveFileId(input.url || input.downloadUrl || '');
    }

    const str = String(input).trim();
    if (!str) return '';
    const matchFile = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile && matchFile[1]) return matchFile[1];
    const matchUc = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchUc && matchUc[1]) return matchUc[1];
    if (str.includes('googleusercontent.com/d/')) {
      const rawId = str.split('/d/')[1]?.split(/[=?/]/)[0];
      if (rawId) return rawId;
    }
    return '';
  }

  /**
   * Chuyển tệp đã upload thông qua dự án `lakeducation_com` vào Thùng rác Google Drive (`trashed: true`).
   * - Bảo vệ 100% quyền sở hữu dự án: xác minh tệp thuộc `lakeducation_com` trên Hosting-Store trước khi thao tác.
   * - Không xoá vĩnh viễn ngay: tệp nằm trong Thùng rác Google Drive 30 ngày để phòng xoá nhầm, sau 30 ngày Google tự xoá sạch.
   */
  static async moveFileToTrash(fileId) {
    const cleanId = String(fileId || '').trim();
    if (!cleanId) return { skipped: true, reason: 'EMPTY_FILE_ID' };

    // Ưu tiên 1: Gọi endpoint chuyên biệt POST /storage/files/:id/trash trên Hosting-Store
    try {
      const trashRes = await fetch(
        `${this.CONFIG.API_BASE}/storage/files/${encodeURIComponent(cleanId)}/trash`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );
      if (trashRes.ok) {
        const trashData = await trashRes.json().catch(() => ({}));
        if (trashData?.success) {
          return { success: true, trashed: true, via: 'hosting_store_trash_api' };
        }
      } else if (trashRes.status === 403) {
        // Không thuộc sở hữu của dự án lakeducation_com -> dừng an toàn
        return { skipped: true, reason: 'NOT_OWNED_BY_APP' };
      }
    } catch {
      // Chuyển sang bước xác minh + gọi trực tiếp Google Drive REST API v3 bên dưới
    }

    // Ưu tiên 2 (Zero-Egress Direct Google Drive v3 Trash):
    // Bước 2.1: Kiểm tra tệp có thực sự được upload qua dự án `lakeducation_com` không
    const metaRes = await fetch(
      `${this.CONFIG.API_BASE}/storage/files/${encodeURIComponent(cleanId)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!metaRes.ok) {
      return { skipped: true, reason: `FILE_NOT_REGISTERED_${metaRes.status}` };
    }
    const metaJson = await metaRes.json().catch(() => ({}));
    if (!metaJson?.success || metaJson?.data?.project !== this.CONFIG.APP_ID) {
      return { skipped: true, reason: 'NOT_OWNED_BY_LAKEDUCATION' };
    }

    // Bước 2.2: Xin OAuth2 Access Token tạm thời và đặt cờ `trashed: true` trực tiếp trên Google Drive v3
    const tokenRes = await fetch(`${this.CONFIG.API_BASE}/credentials/drive-token`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenJson?.data?.accessToken;
    if (!tokenRes.ok || !accessToken) {
      throw new Error('Không lấy được token xác thực Google Drive để chuyển tệp vào Thùng rác.');
    }

    const isLocalProxy =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const driveApiBase = isLocalProxy ? '/google-upload' : 'https://www.googleapis.com';

    const patchRes = await fetch(
      `${driveApiBase}/drive/v3/files/${encodeURIComponent(cleanId)}?fields=id,name,trashed`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trashed: true }),
      }
    );

    if (!patchRes.ok && patchRes.status !== 404) {
      throw new Error(`Chuyển tệp vào Thùng rác Google Drive thất bại: HTTP ${patchRes.status}`);
    }

    return { success: true, trashed: true, via: 'google_drive_v3_patch' };
  }
}
