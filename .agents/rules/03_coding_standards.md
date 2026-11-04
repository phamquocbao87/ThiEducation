# Rule 03: Coding Standards, Common Base OOP & Sub-Feature Extensibility

## 1. Quy Chuẩn Lớp Cơ Sở Dùng Chung (`BaseModuleService` & `PermissionService`)

Để tránh lặp lại code (DRY) khi dự án mở rộng lên hàng chục phân hệ, toàn bộ hàm dùng chung phải đặt trong 2 Class nền tảng:

1. **`src/core/services/PermissionService.js` (`class PermissionService`)**:
   - Chứa toàn bộ hàm kiểm tra quyền của 6 Roles (`admin`, `director`, `academic`, `teacher`, `accountant`, `student`).
   - Các phân hệ gọi `PermissionService.canApprovePayroll(role)` hoặc `PermissionService.canManageCourses(role)` thay vì tự viết `if (role === ...)` rải rác.
2. **`src/shared/services/BaseModuleService.js` (`class BaseModuleService`)**:
   - Cung cấp các hàm static/instance chuẩn:
     - `scopeByRole(records, user, { teacherKey, studentKey })`: Tự động lọc dữ liệu riêng khi user là `teacher` hoặc `student`.
     - `searchByFields(records, keyword, fields)`: Tìm kiếm đa trường không phân biệt hoa thường.
     - `generateCode(prefix, count)`: Sinh mã tự động chuẩn ERP (`HD-2026-05`, `AT-008`, `KH-004`).

---

## 2. Quy Tắc Tách Class Riêng Cho Từng Tính Năng Con (Sub-Feature Class Rule)

1. **Nguyên tắc 1 Tính năng = 1 Class (`Single Responsibility Principle`):**
   - Mỗi tính năng con trong một phân hệ phải được viết thành một Class độc lập kế thừa từ `BaseModuleService`.
   - Ví dụ trong phân hệ `attendance`:
     - Logic **Điểm danh & Chấm điểm** nằm ở `SessionEvaluationService.js`.
     - Logic **Hồ sơ học viên** nằm ở `StudentProfileService.js`.
     - Logic **Bài tập về nhà** nằm ở `HomeworkAssignmentService.js`.
2. **Cách mở rộng tính năng mới khi dự án phình to (Open/Closed Principle):**
   - Khi cần thêm một tính năng mới vào phân hệ (ví dụ thêm tính năng *"Thi thử / Kiểm tra định kỳ"* vào `attendance`), Developer/AI Agent **chỉ cần tạo thêm 1 file `ExamAssessmentService.js` trong `services/` và `ExamAssessmentPanel.jsx` trong `components/`**, sau đó gắn vào `<Module>Page.jsx` mà **không cần sửa vào các Class tính năng cũ**.

---

## 3. Quy Chuẩn Giao Diện (`<Module>Page.jsx` & `components/*.jsx`)

1. **Giới hạn độ dài File:** Mỗi file `.jsx` hoặc `.js` không vượt quá **180 dòng**.
2. **Thư viện UI Ant Design (`antd`):** Đồng bộ hệ màu `#1890ff` (Blue), `#722ed1` (Purple), `#52c41a` (Green), `#fa8c16` (Orange).
3. **Responsive Standards:** Mọi bảng dữ liệu có `scroll={{ x: 800 }}`, mọi lưới dùng `xs={24} sm={12} lg={6/8}`.
4. **Zero JSX trong `services/` và `models/`:** Các Class trong `services/` chỉ xử lý dữ liệu thuần (Pure JS OOP), trả về dữ liệu hoặc kết quả kiểm tra cho Hook/UI.

---

## 4. Quy Chuẩn Đa Ngôn Ngữ (`i18n` — English Default & Vietnamese Secondary)

1. **Ngôn ngữ mặc định:** Luôn để Tiếng Anh (`en`) làm mặc định (`DEFAULT_LANGUAGE = 'en'`), Tiếng Việt (`vi`) là tùy chọn thứ 2.
2. **Bảo toàn dữ liệu người dùng:** Chỉ dịch các `UI Labels` thông qua `useLanguage()` (`t`, `translateLabel`). Dữ liệu nghiệp vụ người dùng nhập vào (tên học viên, tên giáo viên, tên khóa học, mã lớp, email, SĐT, ghi chú, nhận xét...) giữ nguyên 100%.
3. **Chống vòng lặp render (`Anti-Infinite-Loop`):** Không dùng `MutationObserver` để sửa DOM trực tiếp và không đặt các cặp chuỗi giống hệt nhau trong từ điển `VI_TO_EN_UI_LABELS`.
4. **Footer chuẩn:** `LAK EDUCATION (lakeducation.com) ©2026`.
