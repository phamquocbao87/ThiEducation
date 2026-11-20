/**
 * Utility functions for detecting file formats and resolving preview/embed URLs
 * Module: src/modules/materials/utils/materialPreviewUtils.js
 */

export const PREVIEW_KINDS = {
  PDF: 'PDF',
  AUDIO: 'AUDIO',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  SLIDES: 'SLIDES',
  DOCS: 'DOCS',
  DRIVE_FOLDER: 'DRIVE_FOLDER',
  GENERIC: 'GENERIC',
};

/**
 * Trích xuất Google Drive File ID từ đường dẫn
 */
export function extractGoogleDriveId(url = '') {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  return null;
}

/**
 * Trích xuất YouTube Video ID từ đường dẫn (hỗ trợ watch, share, short, embed)
 */
export function extractYouTubeId(url = '') {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) return match[1];
  return null;
}

/**
 * Kiểm tra xem URL có phải là Google Drive link hay không
 */
export function isGoogleDriveUrl(url = '') {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com');
}

/**
 * Nhận diện loại nội dung xem trước của tài liệu
 */
export function detectMaterialKind(item = {}) {
  const url = (item.url || '').trim();
  const rawName = (item.fileName || item.title || '').trim().toLowerCase();
  const ext = rawName.split('.').pop() || '';
  const typeKey = (item.type || '').toUpperCase();

  // 1. Google Drive Folder
  if (url.includes('drive.google.com/drive/folders') || url.includes('/folders/')) {
    return PREVIEW_KINDS.DRIVE_FOLDER;
  }

  // 2. Video YouTube
  if (extractYouTubeId(url)) {
    return PREVIEW_KINDS.VIDEO;
  }

  // 3. Google Drive File (Nhận diện sâu theo typeKey, extension, hoặc từ khóa)
  if (url.includes('drive.google.com/file/d/')) {
    if (
      typeKey === 'VIDEO' ||
      ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext) ||
      rawName.includes('video') ||
      rawName.includes('clip')
    ) {
      return PREVIEW_KINDS.VIDEO;
    }

    if (
      typeKey === 'SLIDES' ||
      ['pptx', 'ppt', 'key'].includes(ext) ||
      rawName.includes('slide') ||
      rawName.includes('presentation')
    ) {
      return PREVIEW_KINDS.SLIDES;
    }

    if (
      typeKey === 'AUDIO' ||
      ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(ext) ||
      rawName.includes('audio') ||
      rawName.includes('listening') ||
      rawName.includes('track')
    ) {
      return PREVIEW_KINDS.AUDIO;
    }

    return PREVIEW_KINDS.PDF;
  }

  // 4. Google Slides / PPTX
  if (
    url.includes('docs.google.com/presentation') ||
    typeKey === 'SLIDES' ||
    ['pptx', 'ppt', 'key'].includes(ext)
  ) {
    return PREVIEW_KINDS.SLIDES;
  }

  // 5. Video bài giảng (Direct files hoặc web streams)
  if (
    typeKey === 'VIDEO' ||
    ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext) ||
    url.toLowerCase().includes('.mp4') ||
    url.toLowerCase().includes('.webm')
  ) {
    return PREVIEW_KINDS.VIDEO;
  }

  // 6. Audio luyện phát âm / Listening tracks
  if (
    typeKey === 'AUDIO' ||
    ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(ext) ||
    url.toLowerCase().includes('.mp3')
  ) {
    return PREVIEW_KINDS.AUDIO;
  }

  // 7. Hình ảnh bài học / Sơ đồ
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
    return PREVIEW_KINDS.IMAGE;
  }

  // 8. PDF (Giáo trình & Sách bài tập)
  if (
    typeKey === 'PDF' ||
    typeKey === 'PRACTICE' ||
    typeKey === 'TEACHER_GUIDE' ||
    ext === 'pdf' ||
    url.toLowerCase().includes('.pdf')
  ) {
    return PREVIEW_KINDS.PDF;
  }

  // 9. Docs (Google Docs / Word)
  if (url.includes('docs.google.com/document') || ['docx', 'doc', 'txt'].includes(ext)) {
    return PREVIEW_KINDS.DOCS;
  }

  return PREVIEW_KINDS.GENERIC;
}

/**
 * Chuẩn hóa URL sang định dạng nhúng (Embed URL) để hiển thị trong iframe
 */
export function resolveEmbedUrl(url = '', kind = PREVIEW_KINDS.GENERIC) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // YouTube Video (Dùng youtube-nocookie bảo mật & chặn tracking)
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1`;
  }

  // Google Drive File (Video, Audio, Docs, Sheets, PDF...)
  if (isGoogleDriveUrl(trimmed) || trimmed.includes('drive.google.com')) {
    const fileId = extractGoogleDriveId(trimmed);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  // Google Slides
  if (trimmed.includes('docs.google.com/presentation/d/')) {
    const slideId = extractGoogleDriveId(trimmed);
    if (slideId) {
      return `https://docs.google.com/presentation/d/${slideId}/embed?start=false&loop=false&delayms=3000`;
    }
  }

  // File PPTX trực tiếp ngoài Google Drive -> Dùng Google Docs Viewer
  if (kind === PREVIEW_KINDS.SLIDES && (trimmed.endsWith('.pptx') || trimmed.endsWith('.ppt'))) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
  }

  // Google Docs
  if (trimmed.includes('docs.google.com/document/d/')) {
    const docId = extractGoogleDriveId(trimmed);
    if (docId) {
      return `https://docs.google.com/document/d/${docId}/preview`;
    }
  }

  // Google Sheets
  if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
    const sheetId = extractGoogleDriveId(trimmed);
    if (sheetId) {
      return `https://docs.google.com/spreadsheets/d/${sheetId}/preview`;
    }
  }

  // Với PDF từ Cloud Storage hoặc tệp trực tiếp, trả về link trực tiếp để browser iframe render native viewer
  return trimmed;
}
