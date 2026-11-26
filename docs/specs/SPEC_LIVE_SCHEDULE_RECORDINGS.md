# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & KỸ THUẬT (BA SPECIFICATION)
## Phân Hệ: Chuyển Quản Lý & Xem Lại Video Ghi Hình Buổi Học Sang Thời Khóa Biểu Trực Tuyến (`Live Class Schedules`)
**Mã tài liệu:** `SPEC-EDU-LIVE-SCHEDULE-RECORDING-015`  
**Nguồn yêu cầu:** [Bảng Giao Việc & Theo Dõi Tiến Độ Nhân Sự LAK.xlsx](file:///Volumes/DATA/projects/ThiEducation/docs/user-feedback/B%E1%BA%A3ng%20Giao%20Vi%E1%BB%87c%20%26%20Theo%20D%C3%B5i%20Ti%E1%BA%BFn%20%C4%90%E1%BB%99%20Nh%C3%A2n%20S%E1%BB%B1%20LAK.xlsx) — Sheet `Quốc IT`, Dòng 5 (kèm ảnh khoanh đỏ `Live Class Schedules`)  
**Phiên bản:** `v1.0` | **Trạng thái:** `APPROVED BY SẾP BẢO (A1..A4)`

---

### 1. CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ ĐƯỢC SẾP BẢO PHÊ DUYỆT

1. **Tách `Session Recording` khỏi thẻ `Class Learning Materials` ngoài Dashboard Học sinh (`A1`):**
   - Khối **`Class Learning Materials` (`Tài Liệu Theo Lớp Học`)** ngoài Dashboard Học sinh chỉ hiển thị **Sách giáo trình PDF, Audio MP3, Slide, Bài tập** (`!m.isSessionRecording`), không để video các buổi học làm trôi mất sách giáo trình gốc.
   - Toàn bộ `Session Recording` được chuyển về gắn trực tiếp theo **Lớp + Ngày buổi học** trên trang **`Live Class Schedules` (`/zoom-schedules`)** (đồng thời vẫn giữ nút xem video tiện lợi ở lịch sử Điểm danh / Đánh giá buổi học).
2. **Hiển thị trực tiếp tại ô khoanh đỏ trên từng thẻ buổi học ở `Live Class Schedules` (`A2` — cả Lịch Tuần & Bảng Danh Sách):**
   - Đồng bộ thanh điều hướng tuần (`< Tuần Trước | Tuần Hiện Tại | Tuần Kế Tiếp >`) cho **cả 2 chế độ** `Weekly Calendar` và `Table View` để người dùng tra cứu lại các buổi học tuần trước dễ dàng ở mọi chế độ xem.
   - **Khi buổi học ĐÃ CÓ Recording:** Hiển thị ngay nút nổi bật **`[🎬 Xem Recording]` / `[🎬 Watch Recording]`** ngay trên khu vực nút phòng học. Bấm vào mở trình phát **`MaterialPreviewModal` Full-Screen (`100vw × 100dvh`)** trực tiếp trong ứng dụng (tự động chuyển link Google Drive sang `/preview` để không dính lỗi quét virus với tệp > 100MB).
   - **Khi buổi học đã qua (`FINISHED` / `LIVE`) mà CHƯA CÓ Recording:**
     - Đối với Học sinh (`student`): Hiển thị nhãn trạng thái nhẹ nhàng `📹 Chưa có recording` / `📹 No recording yet`.
     - Đối với Cán bộ / Giáo viên có quyền: Hiển thị nút **`[+ Gắn Recording]` / `[+ Upload Recording]`** mở popup tải video đã điền sẵn đúng Lớp học và đúng Ngày học của thẻ đó.
3. **Phân quyền 6 Roles RBAC (`A3`):**
   - **Được phép Upload / Gắn link & Xoá Recording của buổi học:** Giáo vụ (`academic`), Giáo viên bản xứ phụ trách lớp đó (`teacher` có `cls.teacherId === currentUser.id`), Giám đốc (`director`) và Admin IT (`admin`).
   - **Học sinh (`student`):** Chỉ được Xem (`Watch Recording`) các buổi thuộc lớp mình đã ghi danh (`Student Class Scoping Invariant`), ẩn 100% nút Upload và Xoá.
4. **Phương thức tải lên chuẩn 2 chế độ tinh gọn (`A4`):**
   - Trong `SessionRecordingUploadModal`:
     1. **Tải tệp `.mp4` / `.mov` / `.webm` / `.mkv` trực tiếp từ máy tính** lên Google Drive trường (`06_CLASS_RECORDINGS_MATERIALS/2026`) với thanh tiến trình `0% -> 100%`.
     2. **Dán đường dẫn thông thường** (Google Drive / YouTube / Cloud Video URL) — **không thêm ô Passcode rườm rà**.
   - Hỗ trợ cập nhật giao diện **`0ms Optimistic State Update`** cả khi Thêm mới lẫn khi Xoá (`Popconfirm` xác nhận xoá, sau khi `F5` tải lại trang tuyệt đối không sống lại).

---

### 2. MA TRẬN KIỂM THỬ 5 TRỤC THỰC TẾ (5-AXIS REAL QC TEST MATRIX)

| Mã Case | Trục Kiểm Thử | Kịch Bản Thực Tế | Kỳ Vọng Nghiệm Thu (Assertions) |
| :--- | :--- | :--- | :--- |
| **TC-LSR-01** | **Trục 1: Tách khỏi Dashboard & Hiện trên Lịch Tuần** | Học sinh `HV235` mở `/dashboard` kiểm tra thẻ `Class Learning Materials`, sau đó sang `/zoom-schedules` bấm `Previous Week` (`16/11 – 22/11`) | 1) Thẻ `Class Learning Materials` ngoài Dashboard **0%** `Session Recording`, hiện đầy đủ sách giáo trình G5.<br>2) Trên Lịch Tuần tuần `16/11 – 22/11`, các buổi `19/11` và `21/11` của lớp `WP03` hiện nút `[🎬 Watch Recording]`, bấm mở Full-Screen `MaterialPreviewModal` mượt mà |
| **TC-LSR-02** | **Trục 1 & 2: Upload `.mp4` thật gắn đúng ngày học** | Giáo vụ (`ACA404`) tại `/zoom-schedules` bấm `[+ Upload Recording]` trên 1 ca học đã qua $\rightarrow$ chọn file `.mp4` nhị phân thật $\rightarrow$ bấm Upload | Ngày buổi học tự điền khớp đúng ô lịch; upload Google Drive đạt `100%`; nút `[🎬 Watch Recording]` + `[🗑️]` hiện ngay tức thì `0ms` trên cả `Weekly Calendar` lẫn `Table View` |
| **TC-LSR-03** | **Trục 1 & 5: Dán Link + Xoá `0ms` & `F5` Persistence** | Giáo viên `GV952` (Cô Maj) kiểm tra quyền gắn/xoá trên lớp mình dạy; xoá recording test vừa tạo $\rightarrow$ xác nhận Popconfirm $\rightarrow$ bấm `F5` | Bản ghi biến mất tức thì `0ms`; sau khi `F5` tải lại trang **tuyệt đối không sống lại** |
| **TC-LSR-04** | **Trục 3: Phân Quyền RBAC Cô Lập Lớp Học** | Học sinh `HV235` (`WP03`) và `HV768` (`WP02`) mở `/zoom-schedules` | Học sinh chỉ thấy lịch và recording của đúng lớp mình, **0%** nút Upload/Xoá; Giáo viên `GV952` thấy nút Upload/Xoá trên lớp mình phụ trách |
| **TC-LSR-05** | **Trục 4 & 5: Thiết Bị Kép (`1366×850` & `390×844`) + Teardown** | Kiểm tra Lịch Tuần, Bảng Danh Sách và Modal Upload Recording trên Mobile `390×844` + khối `finally` dọn rác | `Zero Overflow-X` (`scrollWidth <= innerWidth` trên cả 1366px và 390px), không cắt chữ `...` trên nút chuyển chế độ; khối `finally` xoá sạch 100% file test trên Google Drive & bản ghi test trên Firestore |
