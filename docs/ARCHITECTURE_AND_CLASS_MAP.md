# Sổ Tay Kiến Trúc & Bản Đồ Định Vị Class - Method - Layout (`LAK EDUCATION ERP`)

> **Tài liệu chuẩn hóa dành cho Developer & AI Agent (`Agent Note`)**  
> - Dự án **LAK EDUCATION (`lakeducation.com`)** vận hành theo kiến trúc **Clean Modular 5 Lớp + Common Base Classes + Tách Class Riêng Cho Từng Tính Năng Con (`1 Sub-Feature = 1 Class`)** kết hợp **6 Roles RBAC**.
> - **Tài khoản Google lưu trữ Firebase / Cloud Firestore / Storage / Hosting:** **`vnthietbigarage@gmail.com`** (xem [`src/core/services/firebase.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/firebase.js)).
> - **Tên miền chính thức:** **`lakeducation.com`** (Quản lý trên Squarespace Domains / Google Cloud DNS).

---

## 1. Hệ Thống 6 Vai Trò Nghiệp Vụ Chuẩn (`6 Business Roles`)

| Mã Role | Tên Vai Trò | Người Dùng Mẫu (`AuthContext`) | Phạm Vi Quyền Hạn Cốt Lõi |
| :--- | :--- | :--- | :--- |
| **`admin`** | Quản trị hệ thống IT | Phạm Quốc Bảo (`ADM001`) | Quản lý bảo mật, cấu hình hệ thống, theo dõi sức khỏe máy chủ (`SystemHealthService`), Audit Logs. |
| **`director`** | Giám đốc điều hành | Nguyễn Minh Tuấn (`DIR001`) | Xem mọi thứ trên hệ thống, giám sát hoạt động & lương Giáo vụ, thông tin các khóa học, tổng học viên, thu/chi học phí & duyệt lương. |
| **`academic`** | Giáo vụ đào tạo | Trần Thu Hà (`ACA001`) | Quản lý giáo viên, hồ sơ học viên, thời khóa biểu, tạo khóa học/lớp học, điểm danh, đánh giá, nhắc đóng học phí & chấm công lương GV. |
| **`teacher`** | Giáo viên bản xứ | Mr. David Smith (`GV001`) | Check-in lớp học, xem thời khóa biểu & danh sách lớp mình dạy, xem hồ sơ học viên, điểm danh & nhận xét từng học viên, quản lý bài tập. |
| **`accountant`** | Kế toán tài chính | Lê Hoàng Mai (`ACC001`) | Xem & đối soát quá trình trả lương Giáo viên, trả lương Giáo vụ và xác nhận đóng học phí Học viên. |
| **`student`** | Học viên | Lê Anh Khoa (`HV001`) | Xem profile cá nhân, bài tập của mình, đánh giá của mình từ GV, các lớp đang tham gia & thông tin đóng học phí cá nhân. |

---

## 2. Tầng Class Cơ Sở Dùng Chung (`Common Base Layer`)

Mọi Class tính năng con trong các phân hệ đều kế thừa từ `BaseModuleService` và sử dụng `PermissionService`:

| Tên Class | Đường Dẫn File | Các Hàm / Method Dùng Chung |
| :--- | :--- | :--- |
| **`PermissionService`** | [`src/core/services/PermissionService.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/PermissionService.js) | • `canAccessModule(role, moduleKey)`<br>• `canManageContracts(role)`<br>• `canApprovePayroll(role)`<br>• `canDisbursePayroll(role)`<br>• `canViewStaffPayroll(role)`<br>• `canManageCoursesAndSchedules(role)`<br>• `canCheckInClass(role)`<br>• `canEvaluateStudents(role)`<br>• `canConfirmTuitionPayment(role)`<br>• `canSendTuitionReminder(role)` |
| **`DriveStorageService`** | [`src/core/services/DriveStorageService.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/DriveStorageService.js) | • `uploadFile(file, options)`: Upload trực tiếp PDF/Image/Media lên Google Drive (`Zero-Egress`) qua `hosting-store` (`appId: lakeducation_com`)<br>• `listFiles(filters)`<br>• `getImageCdnUrl(fileId, width)`<br>• `getDirectDownloadUrl(fileId)` |
| **`BaseModuleService`** | [`src/shared/services/BaseModuleService.js`](file:///Volumes/DATA/projects/ThiEducation/src/shared/services/BaseModuleService.js) | • `scopeByRole(records, currentUser, options)`: Tự động cô lập dữ liệu riêng cho `teacher` và `student`<br>• `searchByKeyword(records, keyword, fields)`: Tìm kiếm đa trường<br>• `filterByField(records, filterValue, fieldName)`: Lọc theo trạng thái/trường<br>• `generateId(prefix, currentList)`: Sinh mã tự động chuẩn ERP |

---

## 3. Bản Đồ Tra Cứu Từng Phân Hệ: Function Nằm Ở Class Nào? Layout Nằm Ở File Nào?

### 📦 Phân Hệ 1: `dashboard` (`src/modules/dashboard/`)
* **Entry & Layout:** [`index.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/index.jsx) $\rightarrow$ [`DashboardPage.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/DashboardPage.jsx)
* **Controller Hook:** [`hooks/useDashboardController.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/hooks/useDashboardController.js)
* **Domain Model:** [`models/dashboard.model.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/models/dashboard.model.js)

| Tính năng con (`Sub-Feature`) | Class Xử Lý Nghiệp Vụ (`services/`) | Các Method Nghiệp Vụ Trong Class | File Giao Diện (`components/`) |
| :--- | :--- | :--- | :--- |
| **1. Sức khỏe hệ thống & Bảo mật (IT Admin)** | [`SystemHealthService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/services/SystemHealthService.js) | • `getSystemHealthOverview()`<br>• `runHealthDiagnostic(services)` | [`AdminSystemHealthPanel.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/components/AdminSystemHealthPanel.jsx) |
| **2. Điều hành, Khóa học & Hoạt động Giáo vụ** | [`ExecutiveAnalyticsService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/services/ExecutiveAnalyticsService.js) | • `getExecutiveSummary()` | [`ExecutiveOverviewPanel.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/components/ExecutiveOverviewPanel.jsx) |
| **3. Không gian làm việc GV & Cổng Học viên** | [`PersonalPortalService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/services/PersonalPortalService.js) | • `getTeacherWorkspaceData(currentUser)`<br>• `getStudentPortalData(currentUser)` | • [`TeacherWorkspacePanel.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/components/TeacherWorkspacePanel.jsx)<br>• [`StudentPortalPanel.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/components/StudentPortalPanel.jsx) |

---

### 📦 Phân Hệ 2: `contracts` — Hợp Đồng, Lương Giáo Viên & Lương Giáo Vụ (`src/modules/contracts/`)
* **Entry & Layout:** [`index.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/index.jsx) $\rightarrow$ [`ContractPayrollPage.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/ContractPayrollPage.jsx)
* **Controller Hook:** [`hooks/useContractPayrollController.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/hooks/useContractPayrollController.js)
* **Domain Model:** [`models/contracts.model.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/models/contracts.model.js)

| Tính năng con (`Sub-Feature`) | Class Xử Lý Nghiệp Vụ (`services/`) | Các Method Nghiệp Vụ Trong Class | File Giao Diện (`components/`) |
| :--- | :--- | :--- | :--- |
| **1. Quản lý Hợp đồng Giáo viên** | [`TeacherContractService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/services/TeacherContractService.js) | • `getScopedContracts(contracts, currentUser)`<br>• `createContract(contracts, formValues)` | • [`TeacherContractTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/components/TeacherContractTable.jsx)<br>• [`ContractFormModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/components/ContractFormModal.jsx) |
| **2. Tính, Duyệt & Chi Lương Giáo viên** | [`TeacherPayrollService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/services/TeacherPayrollService.js) | • `getScopedPayrolls(payrolls, currentUser)`<br>• `calculateSessionSalary(...)`<br>• `approvePayroll(payrolls, payrollId)`<br>• `disbursePayroll(payrolls, payrollId)`<br>• `calculateTotalBudget(payrolls)` | • [`ContractStatsRow.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/components/ContractStatsRow.jsx)<br>• [`TeacherPayrollTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/components/TeacherPayrollTable.jsx)<br>• [`PaySlipModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/components/PaySlipModal.jsx) |
| **3. Đối soát & Chi Lương Giáo vụ** | [`StaffPayrollService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/services/StaffPayrollService.js) | • `approveStaffPayroll(staffList, staffId)`<br>• `disburseStaffPayroll(staffList, staffId)`<br>• `calculateStaffPayrollTotal(staffList)` | [`StaffPayrollTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/components/StaffPayrollTable.jsx) |

---

### 📦 Phân Hệ 3: `schedules` — Khóa Học, Thời Khóa Biểu & Check-in (`src/modules/schedules/`)
* **Entry & Layout:** [`index.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/index.jsx) $\rightarrow$ [`SchedulePage.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/SchedulePage.jsx)
* **Controller Hook:** [`hooks/useScheduleController.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/hooks/useScheduleController.js)
* **Domain Model:** [`models/schedules.model.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/models/schedules.model.js)

| Tính năng con (`Sub-Feature`) | Class Xử Lý Nghiệp Vụ (`services/`) | Các Method Nghiệp Vụ Trong Class | File Giao Diện (`components/`) |
| :--- | :--- | :--- | :--- |
| **1. Quản lý Danh mục Khóa học** | [`CourseCatalogService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/services/CourseCatalogService.js) | • `createCourse(courses, values)` | • [`CourseCatalogSection.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/components/CourseCatalogSection.jsx)<br>• [`CourseFormModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/components/CourseFormModal.jsx) |
| **2. Xếp & Lọc Thời khóa biểu** | [`TimetableSlotService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/services/TimetableSlotService.js) | • `getScopedTimetable(timetable, currentUser, dayFilter)`<br>• `createScheduleSlot(timetable, values, teachers)` | • [`ScheduleFilterBar.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/components/ScheduleFilterBar.jsx)<br>• [`ScheduleTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/components/ScheduleTable.jsx)<br>• [`ScheduleFormModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/components/ScheduleFormModal.jsx) |
| **3. Giáo viên Check-in Ca dạy** | [`TeacherCheckInService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/services/TeacherCheckInService.js) | • `checkInSession(timetable, slotId)` | Nút Check-in tích hợp trong [`ScheduleTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/schedules/components/ScheduleTable.jsx) |

---

### 📦 Phân Hệ 4: `attendance` — Vận Hành Lớp, Hồ Sơ HV, Điểm Danh & Bài Tập (`src/modules/attendance/`)
* **Entry & Layout:** [`index.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/index.jsx) $\rightarrow$ [`AttendancePage.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/AttendancePage.jsx)
* **Controller Hook:** [`hooks/useAttendanceController.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/hooks/useAttendanceController.js)
* **Domain Model:** [`models/attendance.model.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/models/attendance.model.js)

| Tính năng con (`Sub-Feature`) | Class Xử Lý Nghiệp Vụ (`services/`) | Các Method Nghiệp Vụ Trong Class | File Giao Diện (`components/`) |
| :--- | :--- | :--- | :--- |
| **1. Vận hành Lớp học & Check-in Phòng** | [`ClassroomOperationService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/services/ClassroomOperationService.js) | • `getScopedClasses(classes, currentUser)`<br>• `checkInClassroom(classes, classId)` | [`ActiveClassCards.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/components/ActiveClassCards.jsx) |
| **2. Hồ sơ Học viên & Nhận xét riêng từng HV** | [`StudentProfileService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/services/StudentProfileService.js) | • `getStudentsByClass(students, classId, currentUser)`<br>• `updateStudentIndividualNote(students, studentId, note, scores)` | [`StudentProfileDrawer.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/components/StudentProfileDrawer.jsx) |
| **3. Điểm danh & Chấm 4 Kỹ năng Buổi học** | [`SessionEvaluationService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/services/SessionEvaluationService.js) | • `getScopedAttendances(attendances, currentUser)`<br>• `createSessionEvaluation(...)` | • [`SessionEvaluationTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/components/SessionEvaluationTable.jsx)<br>• [`SessionEvaluationModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/components/SessionEvaluationModal.jsx) |
| **4. Quản lý & Nộp Bài tập về nhà** | [`HomeworkAssignmentService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/services/HomeworkAssignmentService.js) | • `getScopedHomeworks(homeworks, currentUser)`<br>• `submitHomework(homeworks, homeworkId)` | [`HomeworkAssignmentPanel.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/attendance/components/HomeworkAssignmentPanel.jsx) |

---

### 📦 Phân Hệ 5: `tuition` — Quản Lý Công Nợ, Đối Soát & Nhắc Học Phí (`src/modules/tuition/`)
* **Entry & Layout:** [`index.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/index.jsx) $\rightarrow$ [`TuitionPage.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/TuitionPage.jsx)
* **Controller Hook:** [`hooks/useTuitionController.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/hooks/useTuitionController.js)
* **Domain Model:** [`models/tuition.model.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/models/tuition.model.js)

| Tính năng con (`Sub-Feature`) | Class Xử Lý Nghiệp Vụ (`services/`) | Các Method Nghiệp Vụ Trong Class | File Giao Diện (`components/`) |
| :--- | :--- | :--- | :--- |
| **1. Lọc Công nợ & Thống kê Học phí** | [`TuitionBillingService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/services/TuitionBillingService.js) | • `getScopedTuitionRecords(students, currentUser, filters)`<br>• `getTuitionSummary()` | • [`TuitionStatsRow.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/components/TuitionStatsRow.jsx)<br>• [`TuitionFilterBar.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/components/TuitionFilterBar.jsx)<br>• [`TuitionTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/components/TuitionTable.jsx) |
| **2. Đối soát & Xác nhận Đã thu tiền** | [`TuitionPaymentService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/services/TuitionPaymentService.js) | • `confirmPayment(students, studentId)` | [`PaymentConfirmModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/components/PaymentConfirmModal.jsx) |
| **3. Gửi thông báo Nhắc học phí** | [`TuitionReminderService`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/services/TuitionReminderService.js) | • `buildReminderMessage(student)` | Nút Nhắc Học Phí trong [`TuitionTable.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/tuition/components/TuitionTable.jsx) |

---

## 4. Hướng Dẫn Mở Rộng Khi Dự Án Phình To (`How to Add a New Feature`)

Khi muốn thêm một tính năng con mới vào bất kỳ phân hệ nào (ví dụ thêm tính năng *"Thi Thử Định Kỳ - Mock Test"* vào phân hệ `attendance`):
1. **Tạo Class Nghiệp vụ riêng:** Tạo `src/modules/attendance/services/MockTestService.js` kế thừa `extends BaseModuleService`.
2. **Tạo UI Component riêng:** Tạo `src/modules/attendance/components/MockTestPanel.jsx`.
3. **Kết nối vào Hook & Page:** Gọi `MockTestService` trong `useAttendanceController.js` và thêm 1 Tab vào `AttendancePage.jsx`.
4. **Cam kết Zero Side-Effects:** Không phải sửa bất kỳ dòng code nào trong `SessionEvaluationService` hay `HomeworkAssignmentService`.

