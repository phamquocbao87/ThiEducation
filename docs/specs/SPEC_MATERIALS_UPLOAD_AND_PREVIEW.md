# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ (BA SPECIFICATION)
## Phân Hệ: Tải Lên & Xem Trước Tài Liệu Học Tập (Materials Upload & Multi-Format Preview)
**Mã tài liệu:** `SPEC-EDU-MATERIALS-PREVIEW-001`  
**Bộ phận chủ trì:** Ban Nghiệp Vụ (BA) & Kiểm Định Độc Lập (QC)  
**Phiên bản:** `v1.0` | **Trạng thái:** `APPROVED FOR DUAL-ENV QC EXECUTION`

---

### 1. BỐI CẢNH & YÊU CẦU NGHIỆP VỤ (BUSINESS CONTEXT)
- **Người dùng chính:** Cán bộ Giáo vụ (`academic`), IT Admin (`admin`), Giáo viên bản xứ (`teacher`), Học viên/Phụ huynh (`student`).
- **Mục tiêu:**
  1. Quản lý, lưu trữ và phân bổ học liệu số (Sách giáo trình McGraw-Hill Wonders, file nghe MP3, slide bài giảng, phiếu bài tập PDF) cho các khóa học và lớp học.
  2. Tải tệp tài liệu trực tiếp từ máy tính lên Google Drive của trường (`06_CLASS_RECORDINGS_MATERIALS/2026`) với tiến trình rõ ràng (0% -> 100%).
  3. Xem trước trực tiếp đa định dạng trong ứng dụng (In-app Multi-format Preview Modal):
     - **PDF:** Nhúng qua Iframe Google Drive Preview hoặc viewer trực tiếp, bảo đảm **KHÔNG ĐƯỢC XUẤT HIỆN CẢNH BÁO TẠM THỜI (Temporary Session File / blob warning)**.
     - **Audio:** Trình phát MP3 sư phạm với bộ điều chỉnh tốc độ nghe (0.75x, 1.0x, 1.25x, 1.5x).
     - **Video:** Trình phát HTML5 MP4 / WebM hoặc Google Drive / YouTube embed.
     - **Slide:** Trình chiếu 16:9 với nút phóng to toàn màn hình (Fullscreen).
     - **Image:** Khung ảnh trực quan.

---

### 2. MA TRẬN TEST CASE 5 TRỤC PHÒNG QC BẮT BUỘC THỰC THI (5-AXIS QC TEST MATRIX)

| Mã Case | Môi trường | Kịch bản kiểm thử | Hành động & Dữ liệu đầu vào | Kỳ vọng (Expected Result) |
| :---: | :---: | :--- | :--- | :--- |
| **TC-MAT-01** | **DEV & PROD** | Xem trước Sách PDF G5 chính thức | Mở Preview `ReadingWriting Companion G5U1-2 (SE)` | Modal mở, Iframe PDF hiển thị mượt mà, **ASSERT FALSE** cảnh báo `Temporary Session File` |
| **TC-MAT-02** | **DEV & PROD** | Tải lên tệp PDF nhị phân thật (`.pdf`) | Chọn tệp `/tmp/qc_sample_curriculum.pdf`, điền thông tin và bấm `Save & Upload` | Tiến trình 0% -> 100%, Modal đóng, API trả về HTTP 200, lưu Firestore thành công |
| **TC-MAT-03** | **DEV & PROD** | Xem trước tệp PDF vừa tải lên | Bấm nút `Preview` trên bản ghi vừa tạo | Modal mở, Iframe Google Drive Preview hiển thị thành công |
| **TC-MAT-04** | **DEV & PROD** | Xem trước Video bài giảng | Mở Preview tài liệu dạng VIDEO | Trình phát video hoặc Iframe Google Drive Video hiển thị thành công |
| **TC-MAT-05** | **DEV & PROD** | Dọn sạch dữ liệu test (Teardown) | Khối `finally` của script QC thực thi | Tự động xóa sạch 100% tài liệu test vừa tạo trên Firestore, bảo đảm 0 rác test trên PROD |
