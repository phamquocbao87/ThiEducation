# SPEC-09: 12 USER FEEDBACK OPTIMIZATIONS & FIXES
*(Đặc tả Kỹ thuật & Nghiệp vụ 12 Điểm Tinh Chỉnh Website Theo Phản Hồi User Từ File Word `Gợi ý điều chỉnh website.docx`)*

- **Trạng thái:** DRAFT -> IN REVIEW -> APPROVED
- **Phiên bản:** 1.0.0
- **Ngày phát hành:** 20/11/2026
- **Phân hệ chịu tác động:** `dashboard`, `classroom`, `attendance`, `materials`.

---

## 🏛️ I. PHÂN TÍCH YÊU CẦU & PHẠM VI 12 ĐIỂM FEEDBACK

### 🟢 NHÓM 1: GIAO DIỆN, NGÔN NGỮ & NHÃN TỪ (ITEMS 1, 2, 5, 6, 8)
1. **Item 1 (Mô tả Lịch học & Chuẩn bị bài học Học sinh):**
   - File: `src/modules/dashboard/components/StudentPortalPanel.jsx`.
   - Cập nhật text tiếng Anh: `"View your class schedule, lesson plans, and preparation tasks before each live Zoom session."`
2. **Item 2 (Đổi nhãn sang "Lesson Overview"):**
   - File: `src/modules/dashboard/components/StudentPortalPanel.jsx` & `src/modules/classroom/components/ClassroomCurriculumPanel.jsx`.
   - Đổi nhãn `Teacher Lesson Plan for this Session` / `Lesson Plan for This Session` sang `Lesson Overview`.
3. **Item 5 (Bỏ từ "Foreign" trong nhận xét):**
   - File: `src/modules/dashboard/components/StudentRecentEvaluationsCard.jsx`.
   - Đổi `Foreign Teacher Assessment Remarks` thành `Teacher Assessment Remarks` (hoặc `Native Teacher Assessment Remarks`).
4. **Item 6 (Thuần tiếng Anh khi `isEnglish = true`):**
   - File: `src/modules/dashboard/components/StudentRecentEvaluationsCard.jsx`.
   - Bỏ phần tiếng Việt mở ngoặc: `Listening`, `Speaking`, `Reading`, `Writing`, `On Time / Present`.
5. **Item 8 (Hỗ trợ xuống dòng cho Essential Questions):**
   - File: `src/modules/classroom/components/SimpleObjectivesEditor.jsx` & `ClassroomCurriculumPanel.jsx`.
   - Cho phép xuống dòng `\n` bên trong khối mục tiêu để hiển thị rõ 2 dòng (Tiêu đề Text Set và Câu hỏi Essential Question).

---

### 🟡 NHÓM 2: MỤC TIÊU BÀI HỌC, DỊCH THUẬT & VIDEO GOOGLE DRIVE (ITEMS 3, 4, 7, 9, 10)
6. **Items 3 & 4 (Tách Reading Lesson Goals & Writing Lesson Goals):**
   - File: `src/modules/classroom/components/LessonPlanEditorModal.jsx` & `StudentPortalPanel.jsx`.
   - Thay vì 1 ô chung, chia rõ 2 mục tiêu: `📖 Reading Lesson Goals` (từ vựng, bài đọc, câu hỏi) và `✍️ Writing Lesson Goals` (viết, ngữ pháp, bài tập).
7. **Item 7 (Tích hợp Dịch Lời Nhận Xét Sang Tiếng Việt Cho Bé):**
   - File: `src/modules/dashboard/components/StudentRecentEvaluationsCard.jsx` & `SessionEvaluationDetailModal.jsx`.
   - Bổ sung nút 1 chạm `🌐 Dịch sang Tiếng Việt (Translate)` ngay dưới lời nhận xét tiếng Anh của giáo viên bản xứ, hiển thị bản dịch mượt mà cho học sinh và phụ huynh.
8. **Item 9 (Cô lập Video Buổi Học Khỏi Thư Viện Sách Chung):**
   - File: `src/modules/materials/MaterialsPage.jsx`.
   - Lọc bỏ các video ghi hình buổi học lẻ (`!m.isSessionRecording`) khỏi trang Digital Curriculum & Learning Materials Hub.
9. **Item 10 (Sửa Lỗi Preview Video Google Drive > 100MB):**
   - File: `src/modules/materials/utils/materialPreviewUtils.js` & `MaterialPreviewModal.jsx`.
   - Sử dụng URL nhúng chuẩn `https://drive.google.com/file/d/{fileId}/preview` thay vì direct download link để loại bỏ cảnh báo virus scan `"Download anyway"` của Google Drive.

---

### 🔵 NHÓM 3: ĐỒNG BỘ ĐIỂM DANH & CHẤM ĐIỂM 4 KỸ NĂNG (ITEMS 11, 12)
10. **Item 11 (Bảo Toàn Trạng Thái Điểm Danh Buổi Cũ Của Giám Đốc / Giáo Viên):**
    - File: `src/modules/classroom/ClassroomPage.jsx` & `SessionEvaluationModal.jsx`.
    - Khi xem lại buổi học cũ, ưu tiên nạp trạng thái điểm danh từ `studentEvaluations[studentId].attendanceStatus` hoặc lịch sử điểm danh đã lưu, không fallback sai lệch về `Unmarked` khi `c.presence` realtime của ca hiện tại là undefined.
11. **Item 12 (Chia Rõ Đánh Giá 4 Kỹ Năng Riêng Biệt Trong Bảng Đánh Giá):**
    - File: `src/modules/classroom/components/SessionEvaluationModal.jsx`.
    - Bổ sung 4 cột/hàng đánh giá sao cho 4 kỹ năng: `Listening (1-5 ⭐)`, `Speaking (1-5 ⭐)`, `Reading (1-5 ⭐)`, `Writing (1-5 ⭐)`.

---

## 🧪 II. MA TRẬN TEST CASE 5 TRỤC (5-AXIS REAL TEST MATRIX)

| Mã Test | Trục Kiểm Thử | Hành Động & Assert Kỹ Thuật | Kết Quả Mong Đợi |
| :--- | :--- | :--- | :--- |
| **TC-01** | Trục 1: Nhãn & Ngôn ngữ | Kiểm tra Dashboard học sinh với `isEnglish = true` | Subtitle đúng câu yêu cầu, tiêu đề là `Lesson Overview`, không còn từ `Foreign`, không có tiếng Việt mở ngoặc |
| **TC-02** | Trục 2: Reading & Writing Goals | Mở Modal soạn giáo án & xem trên Dashboard | Form có 2 mục Reading & Writing riêng, hiển thị 2 khối rõ ràng |
| **TC-03** | Trục 3: Dịch Nhận Xét | Bấm nút dịch tiếng Việt tại thẻ nhận xét GV | Hiển thị bản dịch tiếng Việt rõ ràng, mượt mà |
| **TC-04** | Trục 4: Video Preview & Cô Lập | Bấm preview video 183MB và vào `/learning-materials` | Video phát trực tiếp trong iframe nhúng, không bị hiện trang `Download anyway`; trang thư viện sách không bị lẫn video lớp |
| **TC-05** | Trục 5: Điểm Danh & 4 Kỹ Năng | Mở Session 1 đã đánh giá và kiểm tra bảng chấm điểm | Điểm danh hiển thị đúng `Present/Online` (không bị `Unmarked`), bảng có đủ 4 thanh sao cho 4 kỹ năng |
