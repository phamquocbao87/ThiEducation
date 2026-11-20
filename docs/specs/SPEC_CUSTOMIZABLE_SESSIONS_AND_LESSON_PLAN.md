# SPEC-08: DYNAMIC CLASS SESSIONS & LESSON PLAN TITLES
*(Đặc tả Kỹ thuật & Nghiệp vụ: Cấu hình Động Số Buổi Học (12 Buổi x 2 Giờ) & Tinh Gọn Dropdown Buổi Học Theo Lesson Title)*

- **Trạng thái:** APPROVED & VERIFIED (PASS 100% TRÊN PLAYWRIGHT E2E)
- **Phiên bản:** 1.0.0
- **Ngày phát hành:** 20/11/2026
- **Phân hệ chịu tác động:** `courses` (Quản lý Khóa & Lớp), `classroom` (Phòng học & Giáo án), `dashboard` (Cảnh báo 24h & Giám đốc).

---

## 4. KẾT QUẢ KIỂM THỬ PLAYWRIGHT E2E KÉP (DESKTOP & MOBILE)
- **Script kiểm thử:** `scripts/qc_test_dynamic_sessions_and_curriculum.py`
- **Kết quả thực thi:**
  - ✅ **Assert 1 (Dropdown sạch):** Bỏ hoàn toàn chuỗi máy móc `— Unit 1 Week 1 · Lesson 1`.
  - ✅ **Assert 2 (Trạng thái rõ):** Buổi chưa soạn hiển thị rõ `[Unplanned]` / `[Chưa soạn]`.
  - ✅ **Assert 3 (Tiêu đề sinh động):** Buổi đã soạn hiển thị `Session X • DD/MM/YYYY: [Lesson Title]`.
  - ✅ **Assert 4 (Form linh hoạt):** Ô `Unit / Week` và `Lesson Title` hiển thị trực tiếp cho GV/Giáo vụ tự nhập.
  - ✅ **Assert 5 (Mặc định 12 buổi):** `ClassFormDrawer` nhận mặc định `totalSessions = 12`, thời lượng 2 giờ (`19:00 - 21:00`).
  - ✅ **Assert 6 (Mobile-First):** Zero Overflow-X trên Mobile (`390px`, `scrollWidth == innerWidth == 390px`).
  - ✅ **Assert 7 (Touch Ergonomics):** Nút bấm $\ge 40\text{px}$, drawer co giãn 100% trên điện thoại.

---

## 1. BỐI CẢNH & VẤN ĐỀ NGHIỆP VỤ (BUSINESS CONTEXT)

1. **Vấn đề 1: Áp đặt công thức máy móc Unit/Week:**
   - Trước đây hệ thống tự động tính: `week = Math.ceil(session / 2)` và `unit = Math.ceil(session / 6)`.
   - Chuỗi này tự động ghép vào đuôi của dropdown chọn buổi học: `Session 1 • 17/11/2026 [Planned] — Unit 1 Week 1 · Lesson 1`.
   - Thực tế giảng dạy McGraw-Hill Wonders: Tiến độ từng lớp khác nhau (có lớp học nhanh, chậm, có buổi ôn tập Phonics, thi giữa kỳ), việc áp đặt cứng gây khó chịu và sai lệch bài giảng thực tế.
2. **Vấn đề 2: Ép cứng số lượng buổi học (60 buổi):**
   - Màn hình Classroom trước đây ép cứng `Math.max(Number(cls?.totalSessions) || 60, 60)`, dẫn đến mọi lớp dù hợp đồng ngắn hạn vẫn sinh ra 60 buổi học ảo.
   - User yêu cầu: Khóa học chuẩn thường có **12 sessions, mỗi session 2h**; cho phép người dùng tự nhập số buổi động khi tạo/sửa lớp.
3. **Vấn đề 3: Thiếu thông tin chủ đề bài học trên Dropdown:**
   - Dropdown chỉ hiện `[Planned]` chung chung vô nghĩa, không biết buổi đó dạy chủ đề gì nếu chưa bấm mở giáo án.

---

## 2. ĐẶC TẢ TÍNH NĂNG (FEATURE REQUIREMENTS)

### 2.1. Cấu hình Số buổi học toàn khóa (`totalSessions`) & Thời lượng 2 giờ
- **Form Lớp học (`ClassFormDrawer`, `ClassFormModal`):**
  - Bổ sung ô nhập `totalSessions` (Số buổi học toàn khóa) kiểu số nguyên (`InputNumber`), min = 1, max = 100.
  - Giá trị mặc định khi chưa nhập: **`12` (12 sessions)**.
  - Khung giờ học mặc định khi tạo mới lớp: **2 giờ** (ví dụ `19:00 - 21:00`).
- **Lưu trữ dữ liệu:** Lưu trực tiếp trường `totalSessions` vào document lớp học trên Firestore.

### 2.2. Tinh gọn Dropdown Chọn Buổi Học & Hiển Thị Lesson Title
- **Vị trí:** Dropdown `Select session to view or plan ahead` tại `ClassroomCurriculumPanel.jsx`.
- **Quy tắc hiển thị mới:**
  - Bỏ 100% phần đuôi tự động `— Unit 1 Week X · Lesson Y`.
  - **Buổi đã soạn (`Planned`):**
    - Nếu có `lessonTitle`: `${statusIcon}Session ${idx} • ${date}: ${truncatedTitle}` (Cắt tối đa 35 ký tự nếu quá dài kèm `...`).
    - Nếu chưa có `lessonTitle` (chỉ bấm lưu rỗng): `${statusIcon}Session ${idx} • ${date} [Planned]`.
  - **Buổi chưa soạn (`Unplanned`):**
    - `${statusIcon}Session ${idx} • ${date} [Unplanned]` (Tiếng Việt: `[Chưa soạn]`).
- **Số lượng buổi sinh ra:** Đúng bằng `cls.totalSessions` (mặc định 12 buổi nếu lớp chưa cấu hình).

### 2.3. Tự chủ nhập Unit/Week và Chủ đề trong Form Soạn Giáo Án
- **Vị trí:** `LessonPlanEditorModal.jsx`.
- **Hành vi:**
  - Ô `Unit / Week` và `Lesson Title` để trống mặc định khi tạo mới giáo án.
  - Gợi ý placeholder: `e.g. Unit 1 Week 1 or Mid-term Review` / `VD: Unit 1 Week 1 hoặc Ôn tập giữa kỳ...`.
  - Cho phép Giáo viên và Giáo vụ tự gõ theo bài giảng thực tế.

### 2.4. Bảo toàn Cơ chế Cảnh báo Sẵn sàng 24H
- Tiếp tục duy trì `LessonPlanAlertService`: Nếu buổi học diễn ra trong 24h tới mà chưa soạn (`Unplanned`) $\rightarrow$ Báo động đỏ trên Dashboard Giám đốc & Giáo vụ.

---

## 3. MA TRẬN TEST CASE 5 TRỤC (5-AXIS TEST MATRIX)

| Mã Case | Trục Kiểm Thử | Hành Động & Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Assertion) |
| :--- | :--- | :--- | :--- |
| **TC-01** | Trục 1: Mặc định Lớp | Mở Drawer tạo lớp mới, để trống `totalSessions` | Lớp nhận `totalSessions = 12`, giờ học `19:00 - 21:00` (2h) |
| **TC-02** | Trục 2: Tùy biến Buổi | Nhập `totalSessions = 16`, đổi giờ `18:00 - 20:00` | Lớp nhận đúng 16 buổi, thời lượng 2h |
| **TC-03** | Trục 3: Dropdown Số Buổi | Truy cập Classroom lớp 12 buổi | Dropdown có đúng 12 sessions (từ 1 đến 12), không sinh ra 60 buổi |
| **TC-04** | Trục 4: Dropdown Định dạng | Quan sát các options trong dropdown | Không còn `— Unit 1 Week 1`, buổi 1 có tên bài học, buổi chưa soạn có `[Unplanned]` |
| **TC-05** | Trục 5: Soạn Giáo Án | Mở form soạn bài buổi 2, nhập `Unit 2 Phonics` & `Short Vowels` | Lưu thành công, dropdown cập nhật 0ms tiêu đề mới |
| **TC-06** | Trục 6: Responsive & Cleanup | Kiểm tra trên Mobile (390px) và Desktop (1366px), dọn sạch dữ liệu test | Zero Overflow-X, xóa sạch lớp test trong `finally` |
