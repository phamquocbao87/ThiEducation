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

export const SHARE_SCOPES = {
  ALL: {
    key: 'ALL',
    labelVi: 'Công Khai (Toàn Trường)',
    labelEn: 'Public (Organization-wide)',
    badgeColor: 'green',
    descriptionVi: 'Tất cả giáo viên và học viên đều có thể xem và tải về',
    descriptionEn: 'Accessible to all teachers and students in the system',
  },
  CUSTOM: {
    key: 'CUSTOM',
    labelVi: 'Tùy Chọn Chia Sẻ',
    labelEn: 'Custom Sharing (Targeted)',
    badgeColor: 'purple',
    descriptionVi: 'Chỉ các Khóa học, Lớp học hoặc Học viên được chọn mới thấy',
    descriptionEn: 'Restricted only to selected courses, classes or students',
  },
  STAFF_ONLY: {
    key: 'STAFF_ONLY',
    labelVi: 'Nội Bộ Giáo Viên & Giáo Vụ',
    labelEn: 'Staff Only (Confidential)',
    badgeColor: 'volcano',
    descriptionVi: 'Chỉ Giáo viên, Giáo vụ, Ban Giám đốc và IT Admin được xem',
    descriptionEn: 'Restricted to Teachers, Academic Staff, Director and IT Admin',
  },
};

export const TARGET_TYPES = {
  COURSE: {
    key: 'course',
    labelVi: 'Khóa Học',
    labelEn: 'Course',
    badgeColor: 'geekblue',
    icon: 'ReadOutlined',
  },
  CLASS: {
    key: 'class',
    labelVi: 'Lớp Học',
    labelEn: 'Class',
    badgeColor: 'blue',
    icon: 'TeamOutlined',
  },
  STUDENT: {
    key: 'student',
    labelVi: 'Học Viên',
    labelEn: 'Student',
    badgeColor: 'cyan',
    icon: 'UserOutlined',
  },
};

/**
 * Chuẩn hóa đối tượng chia sẻ của một tài liệu học tập
 */
export const normalizeMaterialShares = (material = {}) => {
  const sharedCourseIds = Array.isArray(material.sharedCourseIds)
    ? material.sharedCourseIds.filter(Boolean)
    : material.courseId && material.courseId !== 'ALL'
    ? [material.courseId]
    : [];

  const sharedClassIds = Array.isArray(material.sharedClassIds)
    ? material.sharedClassIds.filter(Boolean)
    : material.classId
    ? [material.classId]
    : [];

  const sharedStudentIds = Array.isArray(material.sharedStudentIds)
    ? material.sharedStudentIds.filter(Boolean)
    : [];

  const shares = Array.isArray(material.shares) ? material.shares : [];

  let scope = material.shareScope;
  if (!scope) {
    if (material.visibility === 'TEACHERS_ONLY') {
      scope = SHARE_SCOPES.STAFF_ONLY.key;
    } else if (sharedClassIds.length > 0 || sharedStudentIds.length > 0 || (sharedCourseIds.length > 0 && material.courseId !== 'ALL')) {
      scope = SHARE_SCOPES.CUSTOM.key;
    } else {
      scope = SHARE_SCOPES.ALL.key;
    }
  }

  return {
    ...material,
    shareScope: scope,
    sharedCourseIds,
    sharedClassIds,
    sharedStudentIds,
    shares,
  };
};
