# Rule 01: Feature-Based Clean Modular Architecture, Sub-Feature Classes & Common Base Layer

## 1. Nguyên Tắc Thiết Kế Cốt Lõi (Scalable Enterprise Architecture)
1. **Tách biệt Tầng Dùng Chung (`Common Base Classes & Shared Utilities`):**
   - Mọi logic kiểm tra quyền 6 Roles, lọc dữ liệu theo phạm vi (`Data Scoping`), tìm kiếm, phân trang và xử lý CRUD cơ bản phải được đặt ở **Base Class dùng chung** (`src/shared/services/BaseModuleService.js` và `src/core/services/PermissionService.js`).
   - Các Class nghiệp vụ trong từng phân hệ **kế thừa (`extends BaseModuleService`)** để tái sử dụng code và dễ dàng mở rộng khi dự án phình to.
2. **Mỗi Tính Năng Con Trong Phân Hệ = 1 Class Nghiệp Vụ & Component Riêng Biệt (1 Sub-Feature = 1 Dedicated Class):**
   - Trong một phân hệ (`src/modules/<module_name>/`) có nhiều tính năng con (ví dụ phân hệ `attendance` có: *Quản lý Lớp*, *Hồ sơ Học viên*, *Điểm danh & Nhận xét*, *Bài tập về nhà*), **BẮT BUỘC phải tách mỗi tính năng con thành 1 Class riêng trong `services/` và UI Component riêng trong `components/`**.
   - **TUYỆT ĐỐI CẤM** dồn tất cả tính năng con của một phân hệ vào chung 1 Class hay 1 file Component duy nhất.

---

## 2. Cấu Trúc Phân Tầng Toàn Dự Án (Common Base + Feature Modules)

```text
src/
├── core/                                      # [TẦNG LÕI HẠ TẦNG]
│   ├── context/AuthContext.jsx                # Quản lý phiên đăng nhập 6 Roles
│   ├── layout/AppLayout.jsx                   # Khung Layout chính
│   └── services/
│       ├── PermissionService.js               # [COMMON RBAC CLASS] Kiểm tra quyền 6 Roles toàn cục
│       └── firebase.js                        # Adapter kết nối Database
│
├── shared/                                    # [TẦNG COMMON DÙNG CHUNG TOÀN HỆ THỐNG]
│   ├── services/
│   │   └── BaseModuleService.js               # [COMMON BASE CLASS] Lớp cha chứa tìm kiếm, lọc, Data Scoping
│   ├── components/DataTable.jsx               # Bảng dữ liệu chuẩn hóa dùng chung
│   ├── utils/
│   │   ├── formatter.js                       # Format tiền tệ VNĐ, ngày tháng, phần trăm
│   │   └── slug.js                            # Chuẩn hóa URL Slug
│   └── data/mockData.js                       # Nguồn dữ liệu khởi tạo
│
└── modules/                                   # [TẦNG PHÂN HỆ NGHIỆP VỤ ĐỘC LẬP]
    └── <module_name>/
        ├── index.jsx                          # [1. Public Entry Point] Chỉ xuất <Module>Page
        ├── <Module>Page.jsx                   # [2. Module Layout] Khung bố cục ghép các Sub-features
        ├── models/<module>.model.js           # [3. Domain Model] Enum trạng thái, hằng số, schema
        ├── hooks/use<Module>Controller.js     # [4. Controller Hook] Điều phối State giữa UI & các Feature Classes
        ├── services/                          # [5. Dedicated Sub-Feature Classes] Mỗi tính năng 1 Class riêng!
        │   ├── <SubFeatureA>Service.js        #   - class <SubFeatureA>Service extends BaseModuleService
        │   ├── <SubFeatureB>Service.js        #   - class <SubFeatureB>Service extends BaseModuleService
        │   └── <SubFeatureC>Service.js        #   - class <SubFeatureC>Service extends BaseModuleService
        └── components/                        # [6. Dedicated Sub-Feature UI] Mỗi tính năng 1 Component riêng!
            ├── <SubFeatureA>Panel.jsx
            ├── <SubFeatureB>Table.jsx
            └── <SubFeatureC>Modal.jsx
```

---

## 3. Bản Đồ Định Vị Class Theo Từng Tính Năng (Class Lookup Map)

Khi dự án mở rộng, AI Agent hoặc Developer chỉ cần nhìn tên tính năng là biết chính xác **Class nào** xử lý nghiệp vụ:

| Phân hệ (`Module`) | Tính năng con (`Sub-Feature`) | Class Xử Lý Nghiệp Vụ (`services/`) | Component Giao Diện (`components/`) |
| :--- | :--- | :--- | :--- |
| **`core` & `shared`** *(Common)* | • Kiểm tra quyền 6 Roles (RBAC)<br>• Tìm kiếm, Lọc, Cô lập dữ liệu GV/HV | • `PermissionService`<br>• `BaseModuleService` | • `AppLayout.jsx`<br>• `DataTable.jsx` |
| **1. `dashboard`** | • Sức khỏe hệ thống & Bảo mật (IT Admin)<br>• Thống kê điều hành & Giáo vụ (Director/Academic)<br>• Không gian làm việc GV & Portal Học viên | • `SystemHealthService`<br>• `ExecutiveAnalyticsService`<br>• `PersonalPortalService` | • `AdminSystemHealthPanel.jsx`<br>• `DirectorOverviewPanel.jsx`<br>• `TeacherStudentPortalPanel.jsx` |
| **2. `contracts`** | • Quản lý Hợp đồng Giáo viên<br>• Tính & Duyệt Lương Giáo viên<br>• Tính & Đối soát Lương Giáo vụ | • `TeacherContractService`<br>• `TeacherPayrollService`<br>• `StaffPayrollService` | • `ContractTable.jsx` + `ContractFormModal.jsx`<br>• `TeacherPayrollTable.jsx` + `PaySlipModal.jsx`<br>• `StaffPayrollTable.jsx` |
| **3. `courses`** *(Mới tách)* | • Danh mục Khóa học & Lớp học<br>• Trang Tạo Khóa học mới chuẩn ELA<br>• Điều phối lớp & sĩ số học viên | • `CourseCatalogService`<br>• `ClassManagementService` | • `CourseCatalogTab.jsx`<br>• `ClassManagementTab.jsx`<br>• `CourseCreationPage.jsx` |
| **4. `schedules`** | • Thời khóa biểu Live Zoom Calendar<br>• Xếp lịch lớp học & Lọc ca dạy theo thứ<br>• Giáo viên Check-in phòng học Zoom | • `TimetableSlotService`<br>• `TeacherCheckInService` | • `ScheduleWeeklyCalendar.jsx`<br>• `ScheduleFilterBar.jsx`<br>• `ScheduleFormModal.jsx` |
| **5. `attendance`** | • Vận hành Lớp học trực tuyến<br>• Quản lý Hồ sơ Học viên & Giáo viên<br>• Điểm danh & Nhận xét từng Học viên<br>• Quản lý Bài tập (Giao & Nộp bài) | • `ClassroomOperationService`<br>• `StudentProfileService`<br>• `SessionEvaluationService`<br>• `HomeworkAssignmentService` | • `ActiveClassCards.jsx`<br>• `StudentProfileDrawer.jsx`<br>• `SessionEvaluationModal.jsx` + `EvaluationTable.jsx`<br>• `HomeworkAssignmentPanel.jsx` |
| **6. `tuition`** | • Quản lý Công nợ & Thống kê Học phí<br>• Đối soát & Xác nhận Thu tiền<br>• Gửi thông báo Nhắc học phí | • `TuitionBillingService`<br>• `TuitionPaymentService`<br>• `TuitionReminderService` | • `TuitionStatsRow.jsx` + `TuitionFilterBar.jsx`<br>• `TuitionTable.jsx` + `PaymentConfirmModal.jsx`<br>• `TuitionReminderAction` |
| **7. `users`** *(Mới)* | • Quản trị Danh bạ Người dùng (Users)<br>• Trang Đăng ký Tài khoản mới<br>• Trang Chi tiết Hồ sơ & Đổi Avatar<br>• Nhật ký Kiểm toán (Audit Logs) | • `UserService`<br>• `UserAuditService` | • `UsersPage.jsx` + `UserTable.jsx`<br>• `UserRegistrationPage.jsx`<br>• `UserDetailPage.jsx`<br>• `UserAuditLogDrawer.jsx` |
| **8. `curriculum`** *(Mới)* | • Quản lý Cấp độ Giáo trình (Wonders GK-G6, Cambridge, IELTS)<br>• Cấu hình chuẩn đầu ra CEFR, độ tuổi, số unit, thời lượng<br>• Trình soạn thảo Rich Text mục tiêu đào tạo<br>• Đồng bộ cấp độ cho trang Tạo Khóa học mới | • `CurriculumLevelService` | • `CurriculumLevelsPage.jsx`<br>• `CurriculumLevelCardList.jsx`<br>• `CurriculumLevelTable.jsx`<br>• `CurriculumLevelModal.jsx`<br>• `CurriculumRichEditor.jsx` + `AgeRangePicker.jsx` |
