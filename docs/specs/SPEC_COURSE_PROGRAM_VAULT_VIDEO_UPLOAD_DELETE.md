# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & KỸ THUẬT (BA SPECIFICATION)
## Phân Hệ: Quản Lý Tải Lên & Xoá Video / Giáo Trình Tại Kho Khóa Học Gốc (`Course Program Vault`)
**Mã tài liệu:** `SPEC-EDU-COURSE-VAULT-VIDEO-014`  
**Nguồn yêu cầu:** [Bảng Giao Việc & Theo Dõi Tiến Độ Nhân Sự LAK.xlsx](file:///Volumes/DATA/projects/ThiEducation/docs/user-feedback/B%E1%BA%A3ng%20Giao%20Vi%E1%BB%87c%20%26%20Theo%20D%C3%B5i%20Ti%E1%BA%BFn%20%C4%90%E1%BB%99%20Nh%C3%A2n%20S%E1%BB%B1%20LAK.xlsx) — Sheet `Quốc IT`, Dòng 3 (*Ưu tiên: Cao*)  
**Phiên bản:** `v1.0` | **Trạng thái:** `APPROVED BY SẾP BẢO (A1..A4)`

---

### 1. BỐI CẢNH & CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ ĐƯỢC PHÊ DUYỆT

1. **Phạm vi dữ liệu chuẩn của `Course Program Vault` (`A1`):**
   - `Course Program Vault` (`courses/{courseId}.courseMaterials`) là **Kho Giáo Trình & Video Bài Giảng Chung của Khóa Học cha** (dùng chung cho mọi lớp thuộc khóa, ví dụ toàn bộ các lớp Wonders G5).
   - **Tách sạch 100% `Session Recording` (`isSessionRecording === true`) của từng lớp riêng lẻ ra khỏi `Course Program Vault`:**
     - Chặn tại tầng ghi (`MaterialService.saveMaterial`): Khi lưu tài liệu thuộc diện lớp riêng (`isSessionRecording: true` hoặc chỉ nhắm tới lớp cụ thể không chia sẻ cấp khóa học), **TUYỆT ĐỐI KHÔNG** đẩy vào mảng `courses/{courseId}.courseMaterials`.
     - Chặn tại tầng hiển thị & đọc (`ClassroomCurriculumPanel` & `MaterialService.getAllMaterials`): Tự động lọc bỏ mọi phần tử `isSessionRecording === true` hoặc `isDeleted === true` còn tồn đọng trong `courseMaterials` cũ để học viên lớp `WP02` không bao giờ nhìn thấy video buổi học của lớp `WP03`.
2. **Phân quyền 6 Roles RBAC (`A2` & Bảo mật Sách Giáo Viên):**
   - **Quyền Upload & Xoá tại `Course Program Vault`:** Chỉ dành cho **Giáo vụ (`academic`), Giám đốc (`director`) và Admin IT (`admin`)**.
   - **Giáo viên bản xứ (`teacher`):** Xem toàn bộ giáo trình, video bài giảng và sách hướng dẫn giáo viên (`TEACHER_GUIDE` / `TEACHER_ONLY` / `STAFF_ONLY`), **không có** nút Upload hoặc Xoá tại `Course Program Vault`.
   - **Học viên (`student`):** Chỉ xem các giáo trình & video bài giảng chung có phạm vi cho phép học viên; **ẩn 100%** các tài liệu gắn cờ nội bộ (`visibility === 'TEACHER_ONLY'`, `visibility === 'TEACHERS_ONLY'`, `shareScope === 'STAFF_ONLY'`, `type === 'TEACHER_GUIDE'`, `type === 'TEACHER'`), chặn đứng việc lộ sách đáp án `Teacher’s Edition`.
3. **Nâng cấp Popup `CourseMaterialUploadModal` — Hỗ trợ Kéo-thả File Nhị Phân Thật (`.mp4`, `.pdf`, `.mp3`...) & Dán Link (`A3`):**
   - Hỗ trợ **2 chế độ chuyển đổi mượt mà**:
     1. **Tải tệp từ máy tính (Direct Binary Upload to Google Drive):** Kéo-thả hoặc chọn tệp nhị phân thật (`.mp4`, `.mov`, `.webm`, `.pdf`, `.mp3`, `.pptx`...) đẩy trực tiếp lên Google Drive trường (`06_CLASS_RECORDINGS_MATERIALS/2026`) qua `MaterialService.uploadFileToFirebase` với thanh tiến trình thực tế `0% -> 100%`. Tự động nhận diện loại `VIDEO`, `PDF`, `AUDIO`, `SLIDES`, `PRACTICE`.
     2. **Dán đường dẫn (Google Drive / YouTube / Google Slides):** Bỏ hoàn toàn link mẫu hardcode cũ; bổ sung đầy đủ phân loại **`🎬 Video Bài Giảng & Minh Họa (VIDEO)`**, `📘 Sách Học Sinh (PDF)`, `🎧 Audio Luyện Nghe (AUDIO)`, `📝 Sách Bài Tập (PRACTICE)`, `🖥️ Slide Bài Giảng (SLIDES)`, `🧑‍🏫 Sách Hướng Dẫn Giáo Viên (TEACHER_GUIDE)`.
   - Đồng bộ 2 chiều (`0ms Optimistic State Update`): Khi lưu học liệu mới vào `Course Program Vault`, đồng bộ vào cả `courses/{courseId}.courseMaterials` lẫn `learning_materials` để ô Autocomplete Soạn Giáo Án và Kho Học Liệu nhận diện tức thì.
4. **Trải nghiệm Xem trực tiếp Toàn Màn Hình & Nút Xoá Đồng Bộ (`A4`):**
   - **Xem trực tiếp trong App (`MaterialPreviewModal`):** Bấm vào bất kỳ thẻ giáo trình / video nào trong `Course Program Vault` sẽ mở ngay `MaterialPreviewModal` (`100vw × 100dvh` Full-Screen hỗ trợ mượt cả file Google Drive > 100MB qua `/file/d/{id}/preview`, YouTube, MP4, PDF, Audio), kèm hiển thị đúng biểu tượng đặc trưng cho từng định dạng (`🎬 VIDEO`, `🎧 AUDIO`, `📘 PDF`, `🧑‍🏫 TEACHER_GUIDE`...).
   - **Xoá đồng bộ 0ms có xác nhận (`Popconfirm`):** Trên mỗi thẻ học liệu (khi đăng nhập `academic`, `director`, `admin`), hiển thị nút Xoá (`🗑️`) tinh gọn (touch target chuẩn trên Mobile). Khi xác nhận xoá:
     - Cập nhật giao diện **ngay lập tức `0ms`** (không cần F5).
     - Xoá khỏi `courses/{courseId}.courseMaterials` và đánh dấu `isDeleted: true` trên `learning_materials/{id}` để khi F5 tải lại trang, mục đã xoá **tuyệt đối không sống lại**.

---

### 2. MA TRẬN KIỂM THỬ 5 TRỤC THỰC TẾ (5-AXIS REAL QC TEST MATRIX)

| Mã Case | Trục Kiểm Thử | Kịch Bản Thực Tế | Kỳ Vọng Nghiệm Thu (Assertions) |
| :--- | :--- | :--- | :--- |
| **TC-CV-01** | **Trục 1: Nhị Phân Thật (`.mp4`)** | Giáo vụ (`ACA404`) mở `/classroom/LH002` $\rightarrow$ Tab 2 $\rightarrow$ `Upload to Course Vault` $\rightarrow$ chọn tệp video `.mp4` nhị phân thật sinh bằng FFmpeg/Python $\rightarrow$ bấm Upload | Thanh tiến trình chạy tới `100%`, lưu thành công lên Google Drive thật, thẻ Video mới xuất hiện ngay lập tức (`0ms`) với đúng icon Video, bấm vào mở `MaterialPreviewModal` phát mượt mà |
| **TC-CV-02** | **Trục 1 & 5: Xoá 0ms & F5 Persistence** | Giáo vụ (`ACA404`) bấm nút Xoá (`🗑️`) trên video vừa tải lên (và kiểm thử thêm 1 mục Link Video) $\rightarrow$ xác nhận Popconfirm $\rightarrow$ tải lại trang (`F5`) | Thẻ biến mất tức thì `0ms` khỏi `Course Program Vault`; sau khi `F5`, thẻ đã xoá **tuyệt đối không xuất hiện lại** |
| **TC-CV-03** | **Trục 2: Mạng & Proxy Upload** | Kiểm tra request upload nhị phân qua proxy `/google-upload` trên `localhost:3000` (DEV) | Không dính lỗi CORS, nhận về `driveFileId` và `downloadURL` thật từ `hosting-store-api` |
| **TC-CV-04** | **Trục 3: Phân Quyền 6 Roles & Cô Lập Recording** | Kiểm tra `Course Program Vault` dưới 3 vai trò: `ACA404` (Giáo vụ), `GV952` (Cô Maj), `HV235` (Học sinh) | 1) **0%** bản `Session Recording` của lớp lẻ lọt vào `Course Program Vault`.<br>2) `ACA404` thấy nút Upload & nút Xoá.<br>3) `GV952` thấy `Teacher’s Edition`, **không thấy** nút Upload/Xoá.<br>4) `HV235` **ẩn 100%** `Teacher’s Edition` và **ẩn 100%** nút Upload/Xoá |
| **TC-CV-05** | **Trục 4 & 5: Thiết Bị Kép (`1366×850` & `390×844`) + Teardown** | Chạy kiểm toán bố cục trên Desktop & Mobile + khối `finally` dọn dẹp dữ liệu test | `scrollWidth <= innerWidth` (`Zero Overflow-X` trên cả 1366px và 390px), Modal Upload vừa khít màn hình di động; khối `finally` dọn sạch 100% bản ghi test trên Firestore & Drive |
