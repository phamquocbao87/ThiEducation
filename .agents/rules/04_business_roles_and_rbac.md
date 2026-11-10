# Rule 04: Mô Hình Nghiệp Vụ 6 Roles & Phân Quyền Hệ Thống (Business Roles & RBAC Matrix)

Dự án **ThiEducation** vận hành theo mô hình **6 Vai Trò (Roles)** tách biệt rõ giữa Quản trị kỹ thuật (IT Admin), Điều hành cấp cao (Director), Vận hành đào tạo (Giáo vụ), Giảng dạy (Teacher), Tài chính (Kế toán) và Người học (Học viên).

---

## 👥 1. Định Nghĩa Chi Tiết 6 Roles Chuẩn

### 1.1. `admin` — Quản Trị Hệ Thống (IT / System Administrator)
- **Trách nhiệm cốt lõi:** Quản lý bảo mật, cấu hình hệ thống, xử lý sự cố kỹ thuật (fix lỗi), theo dõi sức khỏe hệ thống (System Health, Server/Firebase/API status, Audit Logs).
- **Phạm vi truy cập:**
  - Quản lý tài khoản người dùng (Users & Roles assignment), phân quyền truy cập, nhật ký bảo mật (Security & Audit Logs).
  - Cấu hình kết nối hạ tầng (Firebase, Zoom API, SMS/Zalo Gateway, Backup/Restore).
  - **Không** trực tiếp tham gia vào nghiệp vụ giảng dạy hay phê duyệt thu/chi tài chính kinh doanh.

### 1.2. `director` — Giám Đốc Điều Hành (CEO / Executive Director)
- **Trách nhiệm cốt lõi:** Điều hành và quản lý chung toàn bộ trung tâm; nắm bắt mọi số liệu tổng quan và chi tiết trên hệ thống.
- **Phạm vi truy cập:**
  - **Xem mọi thứ trên hệ thống (Full Visibility):** Tổng số học viên, tình hình thu/chi học phí, quỹ lương, thông tin toàn bộ các khóa học & lớp học.
  - **Giám sát vận hành Giáo vụ:** Xem hoạt động, tiến độ công việc và hiệu suất (KPI) của nhân viên Giáo vụ.
  - **Phê duyệt cấp cao:** Phê duyệt cuối cùng các bảng lương, hợp đồng và chính sách tài chính/đào tạo.

### 1.3. `academic` — Giáo Vụ (Academic Affairs / Operations Coordinator)
- **Trách nhiệm cốt lõi:** Trung tâm vận hành đào tạo hàng ngày của hệ thống.
- **Phạm vi truy cập:**
  - **Quản lý Khóa học & Lớp học:** Tạo khóa học mới, mở lớp học, xếp Thời khóa biểu (Schedules) và theo dõi tình trạng vận hành thực tế của từng lớp học & giáo viên.
  - **Quản lý Hồ sơ (Profiles):** Quản lý toàn bộ hồ sơ Giáo viên và hồ sơ Học viên.
  - **Quản lý Điểm danh & Chất lượng:** Theo dõi điểm danh các lớp, xem đánh giá của giáo viên dành cho học viên và đánh giá về giáo viên.
  - **Vận hành Học phí & Lương:** Quản lý tiến độ đóng học phí của học viên (nhắc phí, ghi nhận thu phí) và tổng hợp số ca dạy/chấm công để lập bảng tính lương giáo viên.

### 1.4. `teacher` — Giáo Viên (Foreign / Native Teacher)
- **Trách nhiệm cốt lõi:** Giảng dạy trực tuyến và đánh giá chất lượng từng học viên trong các lớp mình phụ trách.
- **Phạm vi truy cập (Cô lập theo phạm vi lớp mình dạy - Scoped Access):**
  - Xem **Thời khóa biểu của riêng mình** và **Danh sách các lớp mình dạy**.
  - **Check-in lớp học** trước/khi bắt đầu ca dạy.
  - Xem **Danh sách & Hồ sơ từng học viên** thuộc lớp mình dạy.
  - Thực hiện **Điểm danh** và **Đánh giá, nhận xét chi tiết cho từng học viên** sau mỗi buổi học; giao và chấm bài tập.
  - Tuyệt đối không xem được hợp đồng/mức lương của giáo viên khác hoặc dữ liệu học phí của trung tâm.

### 1.5. `accountant` — Kế Toán (Finance & Accounting)
- **Trách nhiệm cốt lõi:** Kiểm soát, đối soát và thực hiện quy trình thu - chi tài chính minh bạch.
- **Phạm vi truy cập:**
  - Xem và kiểm soát toàn bộ quá trình **trả lương Giáo viên**, **trả lương Giáo vụ**, và **thu học phí Học viên**.
  - Đối soát công nợ học phí, xác nhận tiền vào tài khoản, xuất phiếu lương / hóa đơn và báo cáo tài chính cho `director`.

### 1.6. `student` — Học Viên (Student / Learner)
- **Trách nhiệm cốt lõi:** Tham gia học tập, làm bài tập và theo dõi tiến độ cá nhân.
- **Phạm vi truy cập (Cô lập dữ liệu cá nhân 100% - Personal Scoped Access):**
  - Xem **Profile cá nhân** của mình.
  - Xem **Các lớp đang tham gia** và lịch học cá nhân (vào phòng học trực tuyến, xem lại video bài giảng).
  - Xem và nộp **Bài tập (Homework / Assignments)** của mình.
  - Xem **Đánh giá & Nhận xét của giáo viên** dành riêng cho mình.
  - Nhận **Thông tin đóng học phí** và lịch sử thanh toán của riêng mình (tuyệt đối không thấy học phí của học viên khác).

---

## 🔒 2. Quy Tắc Kiểm Soát Phân Quyền Trong Code (`useAuth()`)

1. Mọi màn hình và thao tác dữ liệu phải kiểm tra đúng một trong 6 mã role chuẩn:
   - `'admin'` (Quản trị hệ thống IT)
   - `'director'` (Giám đốc điều hành)
   - `'academic'` (Giáo vụ)
   - `'teacher'` (Giáo viên)
   - `'accountant'` (Kế toán)
   - `'student'` (Học viên)
2. **Data Scoping (Cô lập dữ liệu theo Role):**
   - Với `teacher`: Phải filter dữ liệu theo `teacherId` của giáo viên đang đăng nhập.
   - Với `student`: Phải filter dữ liệu theo `studentId` của học viên đang đăng nhập.
3. **Vận Hành 100% Dữ Liệu Thực Tế & Gỡ Bỏ Cơ Chế Giả Lập (Pure Real Data & Zero Impersonation Invariant):**
   - Theo chỉ đạo của Sếp Bảo, hệ thống vận hành hoàn toàn trên dữ liệu người dùng thực tế từ Cloud Firestore `lakeducationdb`.
   - Cơ chế giả lập / Impersonation (*"Admin Xem Dưới Tên User"*) và modal danh bạ giả lập đã được **gỡ bỏ hoàn toàn**.
   - Mỗi người dùng đăng nhập bằng chính tài khoản thật của mình qua Google OAuth hoặc Email/Mật khẩu.
   - Tài khoản nhân sự cốt lõi thật gồm: `ADM001` (Phạm Quốc Bảo), `DIR505` (Phạm Hiếu Thi), `ACC330` (Lê Thị Mỹ Dung). Toàn bộ mock data đã được loại bỏ.

---

## 🛡️ 3. Cơ Chế Bảo Mật Tuyệt Đối 2 Tầng (Universal Route Guard & Zero-Implicit-Admin)

1. **Tuyệt đối không tự gán ngầm quyền Admin:** Khi người dùng chưa đăng nhập, `authenticatedUser` bắt buộc là `null`, `isAuthenticated === false`. Tuyệt đối cấm fallback ngầm về `ADM001` khi chưa có session đăng nhập hợp lệ.
2. **Tầng 1 (Authentication Guard):** Mọi URL nội bộ ERP (`/dashboard`, `/contracts-payroll`, `/user-management`, `/zoom-schedules`...) nếu người dùng chưa đăng nhập phải bị chặn ngay lập tức qua `ProtectedRoute` và tự động chuyển hướng về Landing Page `/?require_login=true`, bật modal đăng nhập.
3. **Tầng 2 (RBAC Authorization Guard):** Khi đã đăng nhập, nếu vai trò không có quyền truy cập module (`!PermissionService.canAccessModule(role, moduleKey)`):
   - Hiển thị màn hình chuẩn **`403 - Không Có Quyền Truy Cập`** (`Result status="403"`).
   - Cung cấp nút điều hướng quay về Dashboard mặc định của vai trò đó (`ROLE_DEFAULT_ERP_ROUTE`).

---

## 👥 4. Phân Cấp Quản Trị Người Dùng & Bắt Buộc Ghi Vết Kiểm Toán (Audit Logging)

1. **Admin (IT Root — Mặc định `phamquocbao87@gmail.com` / `ADM001`):**
   - Toàn quyền tạo và kích hoạt/khóa tài khoản cho mọi vai trò: Giám đốc (`director`), Admin (`admin`), Giáo vụ (`academic`), Giáo viên (`teacher`), Kế toán (`accountant`), Học viên (`student`).
   - Tài khoản Root Admin không thể bị vô hiệu hóa hoặc xóa bởi bất kỳ ai.
2. **Giám Đốc (Director):**
   - Có toàn quyền kích hoạt / khóa (`active / deactive`), chỉnh sửa hồ sơ và tạo mới 3 vai trò: Giáo vụ (`academic`), Giáo viên (`teacher`), Học viên (`student`).
   - Không được phép can thiệp vào tài khoản IT Admin hoặc tài khoản của chính mình.
3. **Giáo Vụ (Academic):**
   - Chỉ được phép kích hoạt / khóa (`active / deactive`), chỉnh sửa hồ sơ và tạo mới 2 vai trò: Giáo viên (`teacher`), Học viên (`student`).
   - **TUYỆT ĐỐI CẤM:** Không được phép active/deactive hay tạo tài khoản Admin, Giám đốc hoặc các tài khoản Giáo vụ khác.
4. **Bắt buộc Ghi vết Kiểm toán (Audit Logging):**
   - Mọi thao tác Tạo mới, Kích hoạt, Vô hiệu hóa tài khoản BẮT BUỘC ghi vào Collection **`user_audit_logs`** trên Cloud Firestore `lakeducationdb` (`actor`, `action`, `target`, `description`, `changes`, `createdAt`).

---

## 🏛️ 5. Mô Hình Đào Tạo Nghiệp Vụ Chuẩn (Courses & Classes Hierarchy)

1. **Cấu trúc Khóa học & Lớp học:**
   - **1 Khóa Học (`Course`):** Khung chương trình đào tạo chung theo tiêu chuẩn giáo trình McGraw-Hill Wonders (Mục tiêu, chuẩn đầu ra, thời lượng tháng, sĩ số tối đa 1 lớp, học phí niêm yết).
   - **Nhiều Lớp Học (`Classes`):** Mỗi khóa học mở ra nhiều lớp học vận hành cụ thể (`courseId`). Mỗi lớp học có lịch học hàng tuần, sĩ số tối đa theo chuẩn khóa học, có **1 Giáo viên bản xứ phụ trách (`teacherId`)**, và danh sách nhiều học viên theo học (`studentIds`).
2. **Tách biệt 2 Module Vận hành:**
   - `src/modules/courses/` (`/courses-classes`): Quản lý danh mục Khóa học & Lớp học, tạo khóa học mới qua trang chuyên biệt `/courses-classes/new`.
   - `src/modules/schedules/` (`/zoom-schedules`): Thời khóa biểu phòng học trực tuyến Live Zoom Calendar View.

---

## 👨‍👩‍👧‍👦 6. Quy Chuẩn Số Điện Thoại Chính/Phụ, Cụm Gia Đình (`familyId`) & Chốt Chặn Bảo Mật 3 Tầng Chống Leo Thang Đặc Quyền

1. **Ràng buộc Định danh & 2 Hình Thức Đăng Nhập:**
   - **Hai hình thức đăng nhập chuẩn:** Đăng nhập bằng Email (nếu tài khoản có Email) hoặc Đăng nhập bằng Số điện thoại 1 (Chính).
   - **Số điện thoại 1 (Chính - Bắt buộc):** Dùng để định danh, nhận thông báo và làm giá trị đăng nhập duy nhất bằng số điện thoại.
   - **Số điện thoại 2 (Phụ - Tùy chọn):** Dành cho phụ huynh thứ 2 (Bố/Mẹ cùng theo dõi con). **TUYỆT ĐỐI KHÔNG dùng SĐT phụ để đăng nhập** và không bắt buộc định dạng nghiêm ngặt (`rules={[]}`), không chặn trùng lặp giữa các tài khoản.
   - **Cán bộ / Giáo viên:** Bắt buộc 100% có Email công vụ + 1 SĐT chính riêng biệt (duy nhất trên toàn hệ thống).
   - **Học viên:** Cho phép để trống Email nếu đã có SĐT chính.
2. **Quy chuẩn Tên Tiếng Anh Bắt Buộc (`English Name Invariant`):**
   - Mọi tài khoản người dùng trên hệ thống **bắt buộc phải có Tên Tiếng Anh (`englishName`)**.
   - Khi tạo mới hoặc chỉnh sửa Họ và Tên, hệ thống tự động sinh Tên tiếng Anh bằng hàm `toEnglishName(name)` (lọc bỏ toàn bộ dấu tiếng Việt). Người dùng có thể chỉnh sửa lại thành tên quốc tế (VD: *"Cowboy"*, *"NaNa"*).
3. **Mô hình Cụm Gia Đình Tự Động 100% (`Zero-Effort Auto-Clustering` — `familyId` & `parentUserId`):**
   - Khi tạo con thứ 2, 3 có cùng SĐT phụ huynh:
     * `UserService.checkDuplicateContact` tự động cho phép chia sẻ SĐT khi cả hai bên đều là `Học Viên (Student)`, tuyệt đối không quăng lỗi chặn người dùng.
     * `UserService.createUser` tự động gán mã `familyId` (`FAM_<sđt_chính>`) và **tự động cập nhật đồng bộ ngược lại cho con thứ nhất** để cả hai cùng thuộc chung một Cụm Gia Đình.
     * Giao diện `UserRegistrationPage` tự động hiển thị thẻ thông báo xanh lá cây phát hiện anh/chị/em ruột và mở nút tạo ngay tức thì.
4. **Chốt Chặn Bảo Mật 3 Tầng Chống Rò Rỉ & Leo Thang Đặc Quyền (Privilege Escalation Shield):**
   - **Tầng 1 (Khóa SĐT Cán Bộ Tại Form):** Giáo vụ (academic) hoặc người dùng khác tuyệt đối không được phép sử dụng SĐT của Cán bộ/Lãnh đạo (Giám đốc, Admin, Giáo vụ, Kế toán, Giáo viên) để tạo hoặc sửa tài khoản học viên. Nếu vi phạm, Form lập tức hiển thị cảnh báo an ninh màu đỏ, vô hiệu hóa nút Submit và ghi nhật ký cảnh báo an ninh.
   - **Tầng 2 (Tách Biệt Xác Thực Khi Đăng Nhập):**
     * **Đăng nhập bằng Email:** Hệ thống **KHÔNG BAO GIỜ mở rộng Cụm gia đình**. Chỉ tìm đúng 1 tài khoản có Email đó và kiểm tra đúng mật khẩu của Cán bộ đó. Nhập sai mật khẩu $\rightarrow$ Báo sai mật khẩu, tuyệt đối không rớt sang tài khoản con!
     * **Đăng nhập bằng SĐT chung:** Hệ thống lọc nghiêm ngặt các hồ sơ có mật khẩu khớp 100% với mật khẩu người dùng vừa nhập (`cleanPassword === p.password`). Dùng mật khẩu của con thì **chỉ hiển thị danh sách các con**, tài khoản Giám đốc/Admin được ẩn kín 100%!
   - **Tầng 3 (Chặn Leo Thang Tại Header):** Khi đang ở phiên đăng nhập của Học viên, bộ chuyển đổi trên Header (`FamilyProfileSwitcher`) chỉ cho phép chuyển đổi giữa các con anh/chị/em, cấm tuyệt đối chuyển đổi lên tài khoản Cán bộ/Giám đốc.
5. **Màn Hình Chọn Hồ Sơ Con Khi Đăng Nhập (`Profile Candidate Selector Modal`):**
   - Khi phụ huynh đăng nhập bằng SĐT chính dùng chung của các con, hệ thống hiển thị Dialog chọn con trực quan (`.lak-profile-candidate-card`). Bấm 1 chạm vào Card con nào là vào học ngay lập tức.
6. **Bộ Chuyển Đổi Hồ Sơ Con 1 Chạm Trên Header (`FamilyProfileSwitcher`):**
   - Nút **`Switch Child / Đổi Hồ Sơ`** trên Header và Mobile Drawer cho phép phụ huynh/học viên chuyển đổi giữa các anh chị em ruột tức thì (**0ms phản hồi**) mà không cần đăng xuất.
7. **Menu IT Admin Switch Role (Đổi Vai Trò Trực Tiếp):**
   - Riêng IT Admin (`ADM001`), hệ thống cung cấp Menu **`Switch Role / Đổi Vai Trò`** trên Header để kiểm thử và điều hành hệ thống dưới cả 6 vai trò (Giám đốc, Giáo vụ, Giáo viên, Kế toán, Học viên).
   - Khi đang xem thử, màn hình có **Banner Cảnh Báo Màu Cam** ở đỉnh trang và nút **"Thoát Chế Độ Xem"** để trở về IT Admin trong 0ms.



