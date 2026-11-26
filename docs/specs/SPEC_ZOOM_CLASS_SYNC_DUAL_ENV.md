# ĐẶC TẢ NGHIỆP VỤ & KIẾN TRÚC KỸ THUẬT (`BA - DEV - QC SPEC`): PHÂN HỆ LIÊN KẾT LỚP HỌC & ĐỒNG BỘ ZOOM ĐỘC LẬP (`zoom-sync` + `zoom-sync-service`) VỚI CÔNG TẮC ĐIỀU HƯỚNG `DEV <-> PROD`

- **Mã tài liệu:** `SPEC_ZOOM_CLASS_SYNC_DUAL_ENV`
- **Ngày phát hành:** `2026-11-26`
- **Phạm vi:** Phân hệ Frontend độc lập `src/modules/zoom-sync/` (`/zoom-sync`), dịch vụ Backend độc lập `zoom-sync-service/` (`codebase: "lak-zoom-sync"`), cùng các nhãn hiển thị không xâm lấn trên `SessionSlotRecordingBox`, `ClassRecordingsDirectoryCard` và `ClassFormDrawer`.

---

## 1. Giải Pháp Trọng Tâm: Công Tắc Điều Hướng Môi Trường `DEV <-> PROD` Trên Duy Nhất 1 Tài Khoản Zoom (`Dual-Environment Target Router`)

### 1.1. Bài toán thực tế
LAK Education vận hành **1 tài khoản Zoom doanh nghiệp duy nhất** (`lakvietnam@lakeducation.com` — `Zoom Workplace Business`, `Account ID: 6yRErH6ARVeVvbWVqX6-6Q`), và trên Zoom Marketplace mỗi ứng dụng chỉ khai báo được **1 Production Webhook URL**. Tuy nhiên hệ thống ERP có 2 môi trường tách biệt:
- **Môi trường Kiểm thử (`DEV`):** Firebase `lakeducation-dev` / database `lakeducationdb` (`http://localhost:3000`, `https://dev.lakeducation.edu.vn`).
- **Môi trường Vận hành thật (`PROD`):** Firebase `lakeducation` / database `lakeducationdb` (`https://bk.lakeducation.edu.vn`, `https://lakeducation.edu.vn`).

### 1.2. Cơ chế Bộ Định Tuyến Đích (`ZoomTargetEnvRouter`) trong `zoom-sync-service/`
Lưu cấu hình điều hướng tập trung tại document `zoom_sync_config/router` (mặc định khởi tạo cứng ở chế độ **`DEV_ONLY`**):

| Chế độ (`routingMode`) | `writeToDev` | `writeToProd` | Hành vi đối với Webhook từ Zoom | Hành vi đối với API chủ động từ UI (`x-lak-target-env`) |
| :--- | :---: | :---: | :--- | :--- |
| **`DEV_ONLY`** *(Mặc định)* | `true` | **`false` 🔒** | **100% chỉ ghi vào `lakeducation-dev`**. Chặn cứng mọi ghi chép sang `PROD` để kiểm thử an toàn tuyệt đối. | Cho phép thao tác trên `DEV`; từ chối (`403 PROD_WRITE_LOCKED`) nếu có request đòi ghi `PROD`. |
| **`DUAL_MIRROR`** | `true` | `true` | Đẩy đồng thời sự kiện & bản ghi video sang cả `DEV` và `PROD` (dùng chung 1 `driveFileId` trên Google Drive 2TB nên **không tốn gấp đôi dung lượng hay thời gian tải!**). | Ghi đúng vào môi trường gọi (`dev` hoặc `prod`). |
| **`PROD_ONLY`** *(Vận hành chính thức)* | `false` | `true` | Đẩy sự kiện thật từ lớp học Zoom thẳng vào `lakeducation` (`PROD`). | Trình duyệt ở `localhost`/`dev` gửi `x-lak-target-env: dev` vẫn chỉ tác động `DEV`, không làm bẩn `PROD`! |

---

## 2. Đặc Tả 10 Yêu Cầu Nghiệp Vụ & Cấu Trúc Dữ Liệu Song Song (`Non-Destructive Schema`)

1. **Yêu cầu #1 (Tự tạo phòng Zoom định kỳ khi tạo lớp mới):**
   - `ClassFormDrawer` có Switch `⚡ Tự động khởi tạo phòng học định kỳ trên Zoom Cloud` (`autoCreateZoomMeeting`).
   - Gọi `POST /lakZoomApi/meetings/provision` $\rightarrow$ gọi Zoom `POST /v2/users/me/meetings` (`type: 8`, `weekly_days` quy đổi `jsDay + 1`, `settings.auto_recording = "cloud"`, `join_before_host: true`, `mute_upon_entry: true`) $\rightarrow$ điền tự động `meetingId`, `zoomStudentLink`, `zoomHostLink`, `passcode` và `zoomConfig`.
2. **Yêu cầu #2 (Smart Mapping & Gợi ý tự động cho các lớp có sẵn):**
   - `ZoomClassMappingPanel.jsx` tính điểm gợi ý `0–100%` (trùng `Meeting ID` `+60%`, trùng mã lớp/GV trong `topic` `+20%`, trùng thứ dạy `+10%`, trùng giờ học `+10%`), loại trừ 100% các lớp `status === 'Deleted'`. Hỗ trợ nút bật nhanh `auto_recording: "cloud"` nếu phòng Zoom đang để `local`/`none`.
3. **Yêu cầu #3 & #7 (Trường dữ liệu song song trên Firestore — Cấm xóa/sửa trường cũ):**
   - Giữ nguyên 100% `meetingId`, `meetingLink`, `zoomStudentLink`, `zoomHostLink`, `passcode`, `recordingUrl` trên `classes/{classId}`.
   - Thêm song song `zoomConfig` (`isLinked`, `zoomMeetingId`, `hostEmail`, `autoRecording`, `weeklyDaysZoom`, `linkedAt`, `linkedBy`, `matchScore`) và `zoomLiveState` (`isLiveOnZoom`, `currentMeetingUuid`, `startedAt`, `endedAt`, `liveParticipantCount`, `activeParticipants`, `recentLeaves`, `lastWebhookAt`).
   - Trên `learning_materials/{id}`: giữ nguyên toàn bộ trường hiện tại, thêm song song `recordingSource: 'ZOOM_AUTO_SYNC' | 'MANUAL_UPLOAD'` và `zoomMeta` (`zoomMeetingId`, `zoomMeetingUuid`, `zoomRecordingFileId`, `partNumber`, `durationSeconds`, `fileSizeBytes`, `aiSummaryOverview`, `aiNextStepsHomework`, `syncedAt`).
4. **Yêu cầu #4 (Tự động lưu video & Huy hiệu phân biệt nguồn):**
   - Lớp đã liên kết Zoom không cần user upload tay.
   - Huy hiệu rõ ràng trên `SessionSlotRecordingBox` & `ClassRecordingsDirectoryCard`: **`[☁️ Auto Zoom]`** (`ZOOM_AUTO_SYNC`, kèm Popover xem nhanh `✨ AI Summary` nếu có) vs **`[📤 Thủ công]`** (`MANUAL_UPLOAD` hoặc các bản ghi cũ trước đây).
5. **Yêu cầu #5 & #6 (Đồng bộ Realtime lớp Zoom & Cảnh báo Học sinh rời lớp giữa giờ):**
   - `lakZoomWebhook` xác thực `HMAC-SHA256` (`x-zm-signature`) và `endpoint.url_validation`.
   - Bắt `meeting.started`, `meeting.ended`, `meeting.participant_joined`, `meeting.participant_left`.
   - **Bộ lọc thông minh `Early-Leave Alert`:** Khi nhận `meeting.participant_left` trong lúc lớp đang học và còn cách giờ tan học `>= 10 phút` (mặc định `earlyLeaveThresholdMinutes = 10`, loại trừ chính Host/Staff), hệ thống ghi nhận vào `zoomLiveState.recentLeaves` và bắn thông báo realtime vào `notifications` (`NOTIFICATION_TYPES.ZOOM_STUDENT_LEFT_EARLY`) tới `USER:{teacherId}`, `ROLE:academic`, `ROLE:director`, `ROLE:admin`.
6. **Yêu cầu #8, #9, #10 (Migration tải bù buổi thiếu + Webhook `recording.completed` + Trạng thái đang tải trên từng Card buổi học):**
   - Collection `zoom_sync_jobs/{jobId}` lưu tiến trình thực tế (`ENCODING_ON_ZOOM` $\rightarrow$ `DOWNLOADING_TO_DRIVE` `0%..100%` $\rightarrow$ `COMPLETED`).
   - Lọc bỏ 100% clip mở nhầm phòng (`duration < 10 phút` VÀ `file_size < 25 MB`).
   - Stream trực tiếp `Zoom CDN -> Google Drive Resumable Upload` theo từng chunk `8 MB` (Zero-RAM), kiểm tra khớp byte `driveSize === zoomSize`, giữ nguyên bản `MANUAL_UPLOAD` không ghi đè bừa bãi.
   - Trong khi job đang chạy (`QUEUED | ENCODING_ON_ZOOM | DOWNLOADING_TO_DRIVE`), `SessionSlotRecordingBox` & `ClassRecordingsDirectoryCard` hiển thị **`🔄 Đang lấy dữ liệu video recording từ Zoom về LAK Education... (XX%)`** và khóa nút Upload tay trên đúng buổi học đó.

---

## 3. Ma Trận Kiểm Thử Thực Tế 5 Trục (`5-Axis Real Test Matrix`)

1. **Trục 1 — Nhị Phân & Luồng Tải Thật (`Binary Payload Axis`):**
   - Gọi Migration (`#8`) kéo thật bản ghi `.MP4` đang thiếu của lớp `LH004` (`WP02`, ~`270–310 MB`) từ Zoom Cloud sang Google Drive `06_CLASS_RECORDINGS_MATERIALS/2026`, kiểm tra tiến trình nhảy `%` realtime trên `zoom_sync_jobs` và khớp `driveFile.size === zoomFile.file_size` 100%.
   - Gọi thử tạo phòng Zoom mới (`#1`) cho 1 lớp test trên `DEV`, xác nhận phòng sinh thật trên Zoom với `auto_recording === "cloud"`, sau đó dọn sạch phòng test trên Zoom & lớp test trên `DEV`.
2. **Trục 2 — Mạng, Bảo Mật Webhook & Công Tắc `DEV <-> PROD` (`Network & Routing Axis`):**
   - Kiểm tra `endpoint.url_validation` trả đúng `encryptedToken` (`HMAC-SHA256`), từ chối `401` với chữ ký giả.
   - Kiểm chứng khi `routingMode === "DEV_ONLY"`, mọi sự kiện chỉ ghi vào `lakeducation-dev` và `0` thay đổi trên `lakeducation` (`PROD`).
3. **Trục 3 — Phân Quyền 6 Roles RBAC (`Role Scoping Axis`):**
   - Route `/zoom-sync` chỉ mở cho `admin`, `director`, `academic` (chặn `student`, `teacher`, `accountant`).
   - Trên `/zoom-schedules`: Học viên (`HV768`, `HV235`) chỉ thấy lớp mình theo học, thấy tiến trình đang đồng bộ / nút xem video `[☁️ Auto Zoom]`, tuyệt đối không thấy nút quản trị hay lớp khác. Giáo viên bản xứ không thấy học phí hay Zalo.
4. **Trục 4 — Thiết Bị Kép Responsive (`Desktop 1366x850 & Mobile 390x844`):**
   - Assert `scrollWidth <= innerWidth` (`Zero Overflow-X`) trên `/zoom-sync`, `/zoom-schedules`, `/courses-classes` ở cả Desktop và Mobile (`390px`), chiều cao nút bấm chính `>= 40px`.
5. **Trục 5 — Dọn Rác 100% (`Zero-Residue Teardown`):**
   - Mọi phòng Zoom test tạo thử ở mục `#1`, mọi job giả lập `participant_left` test ở mục `#6` đều được xóa sạch khỏi Zoom API và Firestore trong khối `finally`.


---

## 4. Đặc Tả Tinh Chỉnh UX & Phân Quyền Chuyên Biệt v1.1 (Chỉ Đạo Bổ Sung Của Sếp Bảo)

### 4.1. Đưa `Công Tắc Điều Hướng 1 Tài Khoản Zoom (DEV ↔ PROD)` vào Tab `⚙️ Cài Đặt` — Độc Quyền `Admin`
- **Vị trí mới:** Gỡ bỏ thẻ `ZoomEnvRouterCard` khỏi phần đầu trang `/zoom-sync`, đưa toàn bộ cấu hình điều hướng môi trường (`DEV_ONLY` / `DUAL_MIRROR` / `PROD_ONLY`) và ngưỡng `Báo chuông rời lớp trước giờ tan (phút)` vào Tab riêng **`⚙️ Cài Đặt` (`key: 'settings'`)**.
- **Phân quyền nghiêm ngặt (2 lớp Frontend + Backend):**
  - **Frontend (`PermissionService.canManageZoomRouterSettings`):** Chỉ `role === 'admin'` mới nhìn thấy Tab `⚙️ Cài Đặt`. Các vai trò `director`, `academic` vào `/zoom-sync` chỉ thấy 3 Tab vận hành (`Liên Kết Lớp`, `Kéo Bù Video`, `Giám Sát Live`); nếu mở trực tiếp URL `/zoom-sync?tab=settings` tự động chuyển về `'mapping'`.
  - **Backend (`POST /lakZoomApi/router-config`):** Đối chiếu trực tiếp `users/{actorId}.role === 'admin'` trên Firestore và header `x-lak-actor-role`; từ chối mọi vai trò không phải `admin` bằng `HTTP 403 FORBIDDEN_ADMIN_ONLY`.

### 4.2. Đưa `Chọn Phòng Zoom Để Liên Kết` Vào Màn Hình Chi Tiết Lớp Học (`/classroom/:classId`) — Quyền `Admin`, `Giáo Vụ`, `Giám Đốc`
- **Vị trí mới:** Ngay trong màn hình Chi Tiết Lớp Học (`ClassroomPage.jsx`), bên cạnh 3 Tab hiện hữu:
  1. `Sơ Đồ Lớp & Note Nhanh` (`seating`)
  2. `Soạn Giáo Án & Học Liệu` (`curriculum`)
  3. `Đánh Giá Sau Giờ & Chăm Sóc PH` (`evaluation`)
  4. **Tab mới: `Liên Kết Với Zoom` (`zoom-link`, trên Mobile 390px hiển thị tinh gọn `Zoom` chống tràn ngang & không cắt dấu `...`)**.
- ** Kiến trúc Module Sạch (`Zero Cross-Module Import`):** Xây dựng tại `src/shared/components/ClassroomZoomLinkTab.jsx`, kết nối trực tiếp qua `ZoomBackendGateway` & `useZoomSyncJobs`. Hỗ trợ trọn gói cho đúng lớp học đang mở: gợi ý khớp AI `0–100%`, dropdown `Chọn Phòng Zoom để liên kết`, tự tạo phòng Zoom định kỳ mới nếu chưa có, và kéo bù ngay các buổi video còn thiếu của riêng lớp đó.
- **Trên `/zoom-sync` (Tab `Liên Kết Lớp`):** Chuyển thành bảng tổng quan trạng thái liên kết của toàn bộ các lớp kèm nút điều hướng 1 chạm `[⚙️ Mở Chi Tiết Lớp Để Liên Kết Zoom →]` dẫn thẳng sang `/classroom/:classId?tab=zoom-link`.
- **Ma trận phân quyền Tab 4 `Liên Kết Với Zoom` tại `/classroom/:classId`:**
  - `admin`, `academic`, `director`: **CHO PHÉP** xem và thao tác đầy đủ.
  - `teacher`, `student`, `accountant`: **ẨN TUYỆT ĐỐI 100%** Tab `Liên Kết Với Zoom` và chặn deep-link `?tab=zoom-link` (tự động fallback về `'seating'`).


---

## 5. Đặc Tả Hợp Nhất v2.0: Live Zoom Trên Mọi Card Lớp Học • Bỏ Menu Sidebar • Dùng Chung 1 File Google Drive (`PROD` + `DEV`)

### 5.1. Section Thông Tin Live Từ Phòng Zoom Ngay Trên Mọi Card Lớp Học (`ZoomRoomLiveSection`)
- **Điều kiện hiển thị:** Tự động hiển thị trên mọi Card Lớp Học có `zoomConfig.isLinked === true` (các lớp chưa liên kết giữ nguyên giao diện cũ).
- **Phạm vi phủ 100% Card Lớp Học toàn hệ thống:**
  1. `ClassLiveCard.jsx` (`/dashboard` của Giám đốc, Giáo vụ, IT Admin & `TeacherWorkspacePanel` của Giáo viên bản xứ).
  2. `ClassLiveStatusStrip.jsx` (`/courses-classes` — Tab Quản lý lớp học).
  3. `StudentPortalPanel.jsx` (`/dashboard` — Thẻ lớp đang tham gia của Học viên, bật cờ bảo mật PII ẩn danh sách tên bạn học khác).
  4. `ScheduleWeeklyCalendar.jsx` (`/zoom-schedules` — Thẻ buổi học hôm nay / đang diễn ra).
  5. `ClassroomInfo.jsx` (`/classroom/:classId` — Đầu trang Chi tiết lớp học).
- **Cập nhật tức thì `0ms`:** Sử dụng listener dùng chung `useZoomClassesLiveMap` theo dõi trực tiếp `classes` trên Firestore.

### 5.2. Gỡ Bỏ Menu `Đồng Bộ Zoom Cloud` Khỏi Sidebar & Đưa Cài Đặt `DEV ↔ PROD` Về Dashboard `IT Admin`
- Xóa mục `zoomSync` khỏi `AppLayout.jsx` để thanh Sidebar trái tinh gọn tuyệt đối.
- Nhúng `AdminZoomRouterConfigCard.jsx` trực tiếp vào `AdminSystemHealthPanel.jsx` trên `/dashboard` (chỉ hiển thị duy nhất khi `role === 'admin'`).
- Bổ sung nút `[⚡ Kéo Tất Cả Buổi Thiếu]` ngay trong Tab thứ 4 `Liên Kết Với Zoom` tại Chi Tiết Lớp Học (`ClassroomZoomLinkTab.jsx`).

### 5.3. Ghi Kép Firestore `PROD + DEV` Nhưng Chỉ Lưu 1 File Video Duy Nhất Trên Google Drive (`Write-Once Drive`)
- **Cross-Env Drive Reuse:** Trước khi tải `.mp4` từ Zoom CDN, `zoomRecordingStreamService.ts` quét chéo cả `dbDev` và `dbProd` theo `zoomMeta.zoomRecordingFileId`. Nếu bất kỳ môi trường nào đã tải file lên Google Drive (`driveFileId` hợp lệ), tái sử dụng ngay đường dẫn `previewUrl` đó cho môi trường còn lại mà không tải lại file nhị phân.
- **Shared-Drive Trash Guard:** Tại `MaterialService.deleteMaterial()`, khi `IS_DEVELOPMENT_FIREBASE === true`, chỉ xóa mềm bản ghi trên `lakeducation-dev` (`isDeleted: true`), tuyệt đối không gọi `DriveStorageService.moveFileToTrash()` để bảo vệ an toàn 100% file vật lý đang dùng chung với `PROD`.
