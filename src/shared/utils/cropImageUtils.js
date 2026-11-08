/**
 * =====================================================================================
 * CROP IMAGE UTILITIES (CANVAS PIXEL CROP FOR AVATAR)
 * =====================================================================================
 * 
 * Thuật toán cắt ảnh pixel chuẩn xác từ thư viện react-easy-crop / canvas HTML5:
 * - Hỗ trợ Zoom, Pan (kéo ảnh) và Xoay (rotation 0 - 360 độ).
 * - Cắt đúng tọa độ khung tròn hiển thị (1:1 aspect ratio).
 * - Xuất ra đối tượng File (JPEG, quality 0.95) sẵn sàng cho ImageOptimizerService.
 * =====================================================================================
 */

/**
 * Tải ảnh vào đối tượng Image HTML
 * @param {string} url - Data URL hoặc Object URL
 * @returns {Promise<HTMLImageElement>}
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Đổi độ sang radian
 */
export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Tính toán kích thước mới của bounding box khi xoay
 */
export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Hàm kỹ thuật cốt lõi: getCroppedImg
 * Cắt ảnh theo tọa độ pixel Crop (x, y, width, height) và góc xoay
 * 
 * @param {string} imageSrc - Data URL của ảnh ban đầu
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop - Tọa độ cắt
 * @param {number} rotation - Góc xoay (độ)
 * @param {string} fileName - Tên file xuất ra
 * @returns {Promise<File>} File ảnh đã cắt vuông vức sẵn sàng nén & upload
 */
export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  fileName = 'avatar_cropped.jpg'
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Không thể khởi tạo Canvas 2D context.');
  }

  const rotRad = getRadianAngle(rotation);

  // Tính kích thước bounding box khi ảnh bị xoay
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Đặt canvas trung gian bằng kích thước bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Xoay canvas quanh tâm
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Vẽ ảnh vào canvas trung gian
  ctx.drawImage(image, 0, 0);

  // Khởi tạo canvas cắt cuối cùng với kích thước đúng vùng chọn
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Không thể khởi tạo Canvas cắt ảnh.');
  }

  // Đặt kích thước ảnh xuất ra theo pixelCrop (tối thiểu 400x400 để ảnh luôn nét)
  const targetWidth = Math.max(pixelCrop.width, 400);
  const targetHeight = Math.max(pixelCrop.height, 400);

  croppedCanvas.width = targetWidth;
  croppedCanvas.height = targetHeight;

  // Bật làm mịn ảnh khi scale để nét căng
  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = 'high';

  // Cắt đúng vùng pixelCrop từ canvas trung gian sang croppedCanvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Chuyển Canvas sang File blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas xuất ảnh thất bại.'));
          return;
        }
        const croppedFile = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(croppedFile);
      },
      'image/jpeg',
      0.95
    );
  });
}

