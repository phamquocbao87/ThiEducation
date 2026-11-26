export const ZOOM_ROUTING_MODES = {
  DEV_ONLY: 'DEV_ONLY',
  DUAL_MIRROR: 'DUAL_MIRROR',
  PROD_ONLY: 'PROD_ONLY',
};

export const ZOOM_ROUTING_MODE_META = {
  DEV_ONLY: {
    color: 'green',
    labelVi: '🧪 Chỉ Ghi DEV (Kiểm thử An toàn 100%)',
    labelEn: '🧪 DEV Only (100% Safe Sandbox)',
    descVi:
      'Mọi Webhook từ Zoom và thao tác đồng bộ chỉ đổ vào database lakeducation-dev. Database Production được khóa bảo vệ tuyệt đối.',
    descEn:
      'All Zoom webhooks and sync actions write strictly to lakeducation-dev. Production database is locked.',
  },
  DUAL_MIRROR: {
    color: 'purple',
    labelVi: '🔁 Song Song Cả DEV & PROD (1 lần tải Google Drive)',
    labelEn: '🔁 Dual Mirror (Both DEV & PROD)',
    descVi:
      'Tải video lên Google Drive 1 lần duy nhất rồi gắn đồng thời vào cả DEV và PROD để vừa vận hành thật vừa theo dõi kiểm thử.',
    descEn:
      'Streams video once to Google Drive and mirrors metadata to both DEV and PROD.',
  },
  PROD_ONLY: {
    color: 'blue',
    labelVi: '🚀 Vận Hành Chính Thức PROD',
    labelEn: '🚀 Production Live Mode',
    descVi:
      'Đẩy trực tiếp sự kiện lớp học & video Zoom về hệ thống Production (lakeducation).',
    descEn:
      'Routes live Zoom class webhooks and recordings directly to Production (lakeducation).',
  },
};

export const ZOOM_AUDIT_STATUS_META = {
  MISSING_NEEDS_SYNC: {
    color: 'warning',
    labelVi: '⚠️ Đang thiếu trên LAK — Cần kéo về',
    labelEn: '⚠️ Missing on LAK — Ready to Sync',
  },
  ALREADY_SYNCED_AUTO: {
    color: 'success',
    labelVi: '✅ Đã tự đồng bộ từ Zoom',
    labelEn: '✅ Already Auto-Synced',
  },
  HAS_MANUAL_UPLOAD: {
    color: 'purple',
    labelVi: '📤 Đã có bản Upload thủ công',
    labelEn: '📤 Manual Upload Exists',
  },
  SKIPPED_SHORT_FRAGMENT: {
    color: 'default',
    labelVi: '⏭️ Bỏ qua clip nháp (< 10 phút)',
    labelEn: '⏭️ Skipped Short Fragment (< 10m)',
  },
  UNASSIGNED_CLASS: {
    color: 'error',
    labelVi: '❓ Phòng lạ chưa gán lớp',
    labelEn: '❓ Unlinked Room — Assign Class',
  },
};
