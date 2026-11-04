# Rule 05: Agent Note — Bản Đồ Tra Cứu Nhanh Class, Method & Layout (`Quick Reference`)

> **Ghi chú bắt buộc cho AI Agent:** Khi người dùng yêu cầu kiểm tra, sửa đổi hoặc mở rộng một chức năng, hãy tra cứu trực tiếp Class và File tương ứng dưới đây (chi tiết đầy đủ tại [`docs/ARCHITECTURE_AND_CLASS_MAP.md`](file:///Volumes/DATA/projects/ThiEducation/docs/ARCHITECTURE_AND_CLASS_MAP.md)):

## 1. Hạ Tầng Cloud & Common Base Classes (`src/core/` & `src/shared/`)
- **Tài khoản Google lưu trữ Firebase / Firestore / Hosting:** `vnthietbigarage@gmail.com` (`src/core/services/firebase.js`)
- **Lưu trữ PDF / Image / Media trên Google Drive (`hosting-store` Zero-Egress):** `src/core/services/DriveStorageService.js` (`class DriveStorageService` — `appId: "lakeducation_com"`, `driveFolderId: "1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn"`)
- **Tên miền chính thức:** `lakeducation.com` (Squarespace Domains)
- **Kiểm tra quyền 6 Roles (`admin`, `director`, `academic`, `teacher`, `accountant`, `student`):** `src/core/services/PermissionService.js` (`class PermissionService`)
- **Cô lập dữ liệu (`scopeByRole`), tìm kiếm (`searchByKeyword`), bộ lọc (`filterByField`), sinh mã (`generateId`):** `src/shared/services/BaseModuleService.js` (`class BaseModuleService`)

## 2. Danh Sách 16 Sub-Feature Business Classes Trong 5 Phân Hệ
1. **`dashboard` (`src/modules/dashboard/services/`):**
   - `SystemHealthService.js`: Sức khỏe hệ thống, CPU/RAM/Storage, Audit Logs cho `admin` IT.
   - `ExecutiveAnalyticsService.js`: Tổng hợp doanh thu, lương, khóa học, hoạt động Giáo vụ cho `director`, `academic`, `accountant`.
   - `PersonalPortalService.js`: Workspace giảng dạy của `teacher` & Portal học tập cá nhân của `student`.
2. **`contracts` (`src/modules/contracts/services/`):**
   - `TeacherContractService.js`: Danh sách & tạo mới hợp đồng giáo viên.
   - `TeacherPayrollService.js`: Tính lương giáo viên, duyệt lương (`director`), chi lương (`accountant`).
   - `StaffPayrollService.js`: Đối soát KPI & chi lương nhân viên Giáo vụ (`director`, `accountant`).
3. **`schedules` (`src/modules/schedules/services/`):**
   - `CourseCatalogService.js`: Quản lý danh mục khóa học & tạo khóa học mới.
   - `TimetableSlotService.js`: Lọc thời khóa biểu theo Role & xếp lịch học mới.
   - `TeacherCheckInService.js`: Nghiệp vụ giáo viên Check-in phòng học.
4. **`attendance` (`src/modules/attendance/services/`):**
   - `ClassroomOperationService.js`: Tình trạng vận hành lớp học & Check-in.
   - `StudentProfileService.js`: Hồ sơ học viên & lưu nhận xét riêng cho từng học viên.
   - `SessionEvaluationService.js`: Điểm danh phòng Zoom & chấm điểm 4 kỹ năng tiếng Anh.
   - `HomeworkAssignmentService.js`: Quản lý giao bài tập & học viên nộp bài tập.
5. **`tuition` (`src/modules/tuition/services/`):**
   - `TuitionBillingService.js`: Cô lập học phí theo Role, tìm kiếm, lọc công nợ & thống kê.
   - `TuitionPaymentService.js`: Xác nhận hoàn tất thu học phí.
   - `TuitionReminderService.js`: Gửi thông báo nhắc đóng học phí Zalo/SMS.

