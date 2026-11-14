/**
 * Mô hình dữ liệu Tài liệu học tập (Digital Learning Materials & Curriculum)
 * Phân hệ Quản lý Tài Liệu Học Tập (src/modules/materials/)
 */

export const MATERIAL_TYPES = {
  PDF: {
    key: 'PDF',
    labelVi: 'Sách Học Sinh (PDF Book)',
    labelEn: 'Student Book (PDF)',
    icon: 'FilePdfOutlined',
    color: '#1677ff',
    badgeColor: 'blue',
  },
  AUDIO: {
    key: 'AUDIO',
    labelVi: 'Thư Mục Audio Luyện Nghe (MP3)',
    labelEn: 'Listening Audio (MP3 Drive)',
    icon: 'CustomerServiceOutlined',
    color: '#fa8c16',
    badgeColor: 'orange',
  },
  PRACTICE: {
    key: 'PRACTICE',
    labelVi: 'Sách Bài Tập & Hoạt Động',
    labelEn: 'Practice & Activity Book',
    icon: 'BookOutlined',
    color: '#13c2c2',
    badgeColor: 'cyan',
  },
  SLIDES: {
    key: 'SLIDES',
    labelVi: 'Slide Bài Giảng Trực Tuyến',
    labelEn: 'Presentation Slides (Google Slides)',
    icon: 'DesktopOutlined',
    color: '#52c41a',
    badgeColor: 'green',
  },
  VIDEO: {
    key: 'VIDEO',
    labelVi: 'Video Bài Giảng & Minh Họa',
    labelEn: 'Lesson Video & Context',
    icon: 'VideoCameraOutlined',
    color: '#8b5cf6',
    badgeColor: 'purple',
  },
  TEACHER_GUIDE: {
    key: 'TEACHER_GUIDE',
    labelVi: 'Sách Hướng Dẫn Giáo Viên (Nội bộ)',
    labelEn: "Teacher's Guide (Confidential)",
    icon: 'SafetyCertificateOutlined',
    color: '#722ed1',
    badgeColor: 'magenta',
  },
};

export const VISIBILITY_TYPES = {
  ALL: {
    key: 'ALL',
    labelVi: 'Toàn Bộ (Giáo Viên & Học Viên)',
    labelEn: 'All (Teachers & Students)',
    color: 'green',
  },
  TEACHERS_ONLY: {
    key: 'TEACHERS_ONLY',
    labelVi: 'Chỉ Giáo Viên & Giáo Vụ',
    labelEn: 'Teachers & Academic Staff Only',
    color: 'volcano',
  },
};

