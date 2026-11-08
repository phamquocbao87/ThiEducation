/**
 * =====================================================================================
 * IMAGE OPTIMIZER SERVICE (WRAPPER & ADAPTER PATTERN)
 * =====================================================================================
 * 
 * Mục đích:
 * 1. Kiểm tra giới hạn dung lượng tải ảnh:
 *    - Nếu > 5MB: Chặn tải lên và cảnh báo người dùng.
 *    - Nếu từ > 1MB đến <= 5MB: Tự động nén/scale chất lượng cao về <= 1MB trước khi upload lên Google Drive.
 *    - Nếu <= 1MB: Đạt chuẩn dung lượng, giữ nguyên độ nét tối đa.
 * 2. Kiến trúc Adapter / Wrapper:
 *    - Cho phép dễ dàng thay thế hoặc nâng cấp thư viện nén (browser-image-compression, compressorjs, pica, canvas...)
 *      mà không cần sửa đổi mã nguồn tại các component UI.
 *    - Tích hợp sẵn Native Canvas Fallback để đảm bảo ứng dụng luôn chạy mượt mà ngay cả khi Web Worker gặp sự cố.
 * 3. Bảo toàn chất lượng hình ảnh:
 *    - Giữ độ phân giải tối ưu (mặc định 1200px cho avatar/sản phẩm), initialQuality 0.9.
 * =====================================================================================
 */

import imageCompression from 'browser-image-compression';

/**
 * 1. Interface định nghĩa hợp đồng nén ảnh (Provider Contract)
 */
export class BaseImageCompressionProvider {
  /**
   * @param {File} file - File ảnh đầu vào
   * @param {Object} options - Các tùy chọn nén (maxSizeMB, maxWidthOrHeight, quality...)
   * @returns {Promise<File>} File ảnh sau khi nén
   */
  async compress(file, options) {
    throw new Error('Provider must implement compress(file, options) method');
  }

  getName() {
    return 'BaseProvider';
  }
}

/**
 * 2. Adapter cho thư viện `browser-image-compression` (Được đánh giá cao nhất trên GitHub / NPM)
 * - Sử dụng Web Worker để không gây giật lag giao diện (non-blocking UI)
 * - Tự động tính toán thuật toán giảm kích thước để đạt đúng ngưỡng dung lượng mục tiêu
 */
export class BrowserImageCompressionAdapter extends BaseImageCompressionProvider {
  getName() {
    return 'BrowserImageCompression (WebWorker)';
  }

  async compress(file, options = {}) {
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 1.0,
      maxWidthOrHeight: options.maxWidthOrHeight || 1200,
      initialQuality: options.initialQuality || 0.9,
      useWebWorker: options.useWebWorker !== false,
      maxIteration: options.maxIteration || 10,
      fileType: options.fileType || file.type || 'image/jpeg',
    };

    return await imageCompression(file, compressionOptions);
  }
}

/**
 * 3. Adapter dự phòng Native HTML5 Canvas (Fallback không phụ thuộc thư viện ngoài)
 */
export class NativeCanvasCompressionAdapter extends BaseImageCompressionProvider {
  getName() {
    return 'NativeCanvas (Fallback)';
  }

  async compress(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = options.maxWidthOrHeight || 1200;
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const targetQuality = options.initialQuality || 0.88;
          const mimeType = options.fileType || file.type || 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Canvas toBlob conversion failed'));
              }
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            mimeType,
            targetQuality
          );
        };
        img.onerror = () => reject(new Error('Không thể tải ảnh vào Canvas'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
      reader.readAsDataURL(file);
    });
  }
}

/**
 * 4. ImageOptimizerService Wrapper (Facade Class trung tâm)
 */
export class ImageOptimizerService {
  // Giới hạn cấu hình mặc định theo quy chuẩn hệ thống
  static LIMITS = {
    MAX_ALLOWED_SIZE_BYTES: 5 * 1024 * 1024, // 5MB (Ngưỡng tối đa cho phép chọn)
    TARGET_SIZE_BYTES: 1 * 1024 * 1024,      // 1MB (Ngưỡng mục tiêu nén)
    MAX_DIMENSION: 1200,                     // 1200px (Giữ chi tiết sắc nét cho avatar / sản phẩm)
    INITIAL_QUALITY: 0.90,                   // 90% (Bảo toàn chất lượng màu sắc & độ nét)
  };

  // Provider nén hiện tại (Mặc định dùng BrowserImageCompressionAdapter)
  static activeProvider = new BrowserImageCompressionAdapter();

  /**
   * Thay đổi hoặc cập nhật Provider nén linh hoạt tại runtime
   * @param {BaseImageCompressionProvider} newProvider 
   */
  static setProvider(newProvider) {
    if (!newProvider || typeof newProvider.compress !== 'function') {
      throw new Error('Provider không hợp lệ. Phải kế thừa BaseImageCompressionProvider hoặc cài đặt hàm compress.');
    }
    this.activeProvider = newProvider;
    console.log(`[ImageOptimizerService] Đã kích hoạt Provider: ${newProvider.getName()}`);
  }

  /**
   * Lấy Provider nén đang hoạt động
   */
  static getProvider() {
    return this.activeProvider;
  }

  /**
   * Kiểm tra tính hợp lệ và dung lượng ảnh:
   * - Nếu > 5MB: Trả về lỗi chặn tải lên
   * - Nếu từ > 1MB đến <= 5MB: Cần nén về <= 1MB
   * - Nếu <= 1MB: Đạt chuẩn dung lượng
   * 
   * @param {File} file 
   * @returns {{ valid: boolean, error?: string, needsCompression: boolean, sizeMB: string }}
   */
  static validateAvatarFile(file) {
    if (!file) {
      return { valid: false, error: 'Chưa có file ảnh được chọn.', needsCompression: false, sizeMB: '0' };
    }

    // 1. Kiểm tra định dạng ảnh hợp lệ
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const isImage = file.type
      ? validTypes.includes(file.type.toLowerCase()) || file.type.startsWith('image/')
      : /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);

    if (!isImage) {
      return {
        valid: false,
        error: 'Định dạng file không hợp lệ. Vui lòng chọn ảnh định dạng JPG, PNG, WEBP hoặc GIF.',
        needsCompression: false,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
      };
    }

    const sizeInMB = file.size / (1024 * 1024);
    const sizeFormatted = sizeInMB.toFixed(2);

    // 2. Chặn tuyệt đối ảnh vượt quá 5MB
    if (file.size > this.LIMITS.MAX_ALLOWED_SIZE_BYTES) {
      return {
        valid: false,
        error: `Dung lượng ảnh (${sizeFormatted}MB) vượt quá giới hạn cho phép (tối đa 5MB). Vui lòng chọn ảnh khác có dung lượng nhỏ hơn.`,
        needsCompression: false,
        sizeMB: sizeFormatted,
      };
    }

    // 3. Ảnh từ > 1MB đến <= 5MB cần được nén
    const needsCompression = file.size > this.LIMITS.TARGET_SIZE_BYTES;

    return {
      valid: true,
      needsCompression,
      sizeMB: sizeFormatted,
    };
  }

  /**
   * Xử lý tối ưu hóa và nén ảnh đại diện trước khi upload lên Google Drive:
   * - Nếu ảnh > 1MB và <= 5MB: Tiến hành nén/scale giảm về <= 1MB mà vẫn giữ chất lượng cao.
   * - Nếu ảnh <= 1MB: Giữ nguyên file gốc.
   * 
   * @param {File} file - File ảnh đầu vào
   * @param {Object} customOptions - Tùy biến thông số nếu có
   * @returns {Promise<{
   *   file: File,
   *   originalSize: number,
   *   optimizedSize: number,
   *   originalSizeFormatted: string,
   *   optimizedSizeFormatted: string,
   *   compressionRatio: string,
   *   wasOptimized: boolean,
   *   durationMs: number
   * }>}
   */
  static async optimizeAvatar(file, customOptions = {}) {
    const startTime = performance.now();
    const originalSize = file.size;

    // Bước 1: Kiểm tra hợp lệ và dung lượng > 5MB
    const validation = this.validateAvatarFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Nếu ảnh đã <= 1MB, không cần nén thêm để bảo toàn 100% chất lượng gốc
    if (!validation.needsCompression && !customOptions.forceCompress) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        file,
        originalSize,
        optimizedSize: originalSize,
        originalSizeFormatted: this.formatBytes(originalSize),
        optimizedSizeFormatted: this.formatBytes(originalSize),
        compressionRatio: '0%',
        wasOptimized: false,
        durationMs,
      };
    }

    // Bước 2: Ảnh > 1MB và <= 5MB -> Thực hiện nén chất lượng cao về <= 1MB
    const options = {
      maxSizeMB: customOptions.maxSizeMB || 0.98, // Ngưỡng an toàn < 1MB
      maxWidthOrHeight: customOptions.maxWidthOrHeight || this.LIMITS.MAX_DIMENSION,
      initialQuality: customOptions.initialQuality || this.LIMITS.INITIAL_QUALITY,
      useWebWorker: customOptions.useWebWorker !== false,
      fileType: customOptions.fileType || file.type || 'image/jpeg',
    };

    let compressedFile;
    try {
      compressedFile = await this.activeProvider.compress(file, options);
    } catch (providerErr) {
      console.warn(`[ImageOptimizerService] Provider ${this.activeProvider.getName()} thất bại: ${providerErr.message}. Chuyển sang NativeCanvas fallback...`);
      // Thử lại với Adapter Native Canvas Fallback
      const fallbackProvider = new NativeCanvasCompressionAdapter();
      compressedFile = await fallbackProvider.compress(file, options);
    }

    // Bước 3: Đảm bảo tên file và kiểu MIME chuẩn xác
    const finalFile = new File([compressedFile], file.name, {
      type: compressedFile.type || file.type || 'image/jpeg',
      lastModified: Date.now(),
    });

    const optimizedSize = finalFile.size;
    const durationMs = Math.round(performance.now() - startTime);
    const ratioPercent = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

    return {
      file: finalFile,
      originalSize,
      optimizedSize,
      originalSizeFormatted: this.formatBytes(originalSize),
      optimizedSizeFormatted: this.formatBytes(optimizedSize),
      compressionRatio: `-${ratioPercent}%`,
      wasOptimized: true,
      durationMs,
    };
  }

  /**
   * Helper định dạng dung lượng byte sang KB / MB dễ đọc
   */
  static formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 2 ? 2 : 1)} ${sizes[i]}`;
  }
}

