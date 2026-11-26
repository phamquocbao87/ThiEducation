# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & KỸ THUẬT (BA SPECIFICATION)
## Phân Hệ: Đồng Bộ Đưa Tệp Đã Tải Lên Vào Thùng Rác Google Drive (`trashed: true` — Tự Xoá Sau 30 Ngày) Khi Bấm Xoá Trên Ứng Dụng
**Mã tài liệu:** `SPEC-EDU-DRIVE-TRASH-30D-016`  
**Chỉ đạo trực tiếp từ:** Sếp Bảo (*"nếu drive có cơ chế xoá sau 30 ngày sau khi bỏ vào thùng rác thì không cần làm [job 7 ngày] ... hiện tại nếu user xoá file đã upload lên drive thông qua dự án này thì thực hiện giúp tôi theo quy trình"*)  
**Phiên bản:** `v1.0` | **Trạng thái:** `APPROVED BY SẾP BẢO`

---

### 1. BỐI CẢNH & NGUYÊN TẮC BẢO VỆ AN TOÀN TUYỆT ĐỐI

1. **Thực trạng trước khi nâng cấp:**
   - Khi người dùng bấm nút **Xoá (`🗑️`)** tại Kho Học Liệu (`/learning-materials`), Kho Khóa Học (`Course Program Vault`) hoặc Lịch Học Trực Tuyến (`Live Class Schedules`), hệ thống chỉ đánh dấu `isDeleted: true` trên Firestore nhưng **bỏ mặc tệp vật lý (`.mp4` 400 MB, `.pdf`...) nằm mãi trong thư mục chính của Google Drive**, không bao giờ kích hoạt đồng hồ 30 ngày của Thùng rác Google Drive.
   - Ngược lại, hàm `drive.files.delete` sẵn có trên `hosting-store` lại xoá trắng vĩnh viễn ngay lập tức (bỏ qua Thùng rác, không thể khôi phục nếu nhân sự lỡ tay bấm nhầm).
2. **Thiết kế chuẩn mới (`Google Drive 30-Day Trash Lifecycle`):**
   - Khi người dùng bấm Xoá một học liệu / video trên `ThiEducation`:
     1. **Giao diện cập nhật tức thì `0ms`** (`Optimistic UI Update`), đồng bộ xoá khỏi `courses.courseMaterials` và đánh dấu `isDeleted: true` trên `learning_materials`.
     2. **Kiểm tra quyền sở hữu dự án (`Project Ownership Guard`):** Chỉ chuyển vào Thùng rác những tệp được tải lên thông qua chính dự án `lakeducation_com` (xác minh `file.project === 'lakeducation_com'` trên `hosting-store`), **tuyệt đối không can thiệp** vào các link ngoài (YouTube, link Drive của bên thứ ba do nhân sự dán thủ công).
     3. **Kiểm tra tham chiếu chéo (`Multi-Reference Guard`):** Nếu cùng một `driveFileId` đang được dùng chung bởi một bản ghi học liệu khác chưa xoá (`!isDeleted`), hệ thống giữ nguyên tệp trên Google Drive; chỉ khi không còn bản ghi hoạt động nào tham chiếu tới `driveFileId` đó nữa mới chuyển tệp vào Thùng rác.
     4. **Đưa vào Thùng rác Google Drive (`trashed: true`):** Gọi API đặt cờ `trashed: true` trên Google Drive v3 (`POST /api/storage/files/:id/trash` kèm cơ chế fallback Zero-Egress trực tiếp qua Google Drive REST API v3 `PATCH /drive/v3/files/:id`). Từ thời điểm này:
        - Trong vòng **30 ngày**, Admin vẫn có thể vào Thùng rác Google Drive khôi phục nếu nhân sự xoá nhầm.
        - Sau **30 ngày**, Google Drive tự động xoá vĩnh viễn và giải phóng 100% dung lượng lưu trữ.

---

### 2. MA TRẬN KIỂM THỬ 5 TRỤC THỰC TẾ (5-AXIS REAL QC TEST MATRIX)

| Mã Case | Trục Kiểm Thử | Kịch Bản Thực Tế | Kỳ Vọng Nghiệm Thu (Assertions) |
| :--- | :--- | :--- | :--- |
| **TC-DTR-01** | **Trục 1: Tải tệp `.mp4` nhị phân thật** | Giáo vụ (`ACA404`) tải tệp video `.mp4` thật lên `Live Class Schedules` trên `localhost:3000` | Nhận `driveFileId` thật; truy vấn trực tiếp Google Drive v3 API xác nhận `trashed === false` |
| **TC-DTR-02** | **Trục 1 & 2: Bấm Xoá trên UI $\rightarrow$ Vào Thùng Rác Drive** | Giáo vụ (`ACA404`) bấm nút Xoá (`🗑️`) trên giao diện $\rightarrow$ xác nhận Popconfirm | 1) Giao diện biến mất ngay `0ms`, `F5` không sống lại.<br>2) Truy vấn trực tiếp Google Drive v3 API của `driveFileId` xác nhận **`trashed === true` (`explicitlyTrashed === true`)** — tệp vẫn còn cứu được trong Thùng rác 30 ngày, không bị xoá trắng ngay! |
| **TC-DTR-03** | **Trục 2 & 3: Cũng hoạt động tại `Course Program Vault` & Kho Học Liệu** | Giáo vụ tải tệp lên `Course Program Vault` rồi bấm Xoá (`🗑️`) | Cả 3 điểm xoá (`Live Class Schedules`, `Course Program Vault`, `/learning-materials`) đều dùng chung `MaterialService.deleteMaterial` và chuyển tệp sang `trashed === true` |
| **TC-DTR-04** | **Trục 3: Bảo vệ Link Ngoài (External URL Guard)** | Dán 1 đường link video ngoài (không upload qua `lakeducation_com`) rồi bấm Xoá | Xoá sạch trên UI/Firestore `0ms`, không bắn lỗi API, không can thiệp trái phép tài nguyên ngoài |
| **TC-DTR-05** | **Trục 4 & 5: Responsive + Dọn Rác Vĩnh Viễn Sau Test** | Kiểm tra Desktop & Mobile `390×844` + khối `finally` dọn dẹp | Khối `finally` gọi xoá vĩnh viễn tệp test khỏi cả Thùng rác Google Drive và hard-delete bản ghi Firestore, bảo đảm 0 byte rác sau kiểm thử |
