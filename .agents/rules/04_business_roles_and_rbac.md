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
  - **Quy định Ngưỡng Mở Phòng Học Trực Tuyến & Meet/Check-in (`Schedule Lead Window`):** Phòng học trực tuyến (Meet / Zoom / Teams) và nút Vào Lớp chỉ mở khóa **trước giờ học 10 phút (`leadMinutes = 10`, 600s)** để tránh học viên vào quá sớm khi giáo viên chưa chuẩn bị xong phòng. Nhãn hiển thị: `Meet & Check-in opens 10m before class` (VI: `Mở Meet & Điểm danh trước giờ học 10p`) và `Opens 10m Before` (VI: `Phòng Mở Trước 10 Phút`). (Trong khi đó, Giáo viên và Cán bộ quản lý vẫn mở trước **15 phút** để chuẩn bị giáo án).
  - Truy cập **Phòng học trực quan (`/classroom/:classId`)** của lớp mình theo học ở chế độ Read-only: Xem vị trí bàn ngồi của mình (`[Ghế của con]`), bài đọc chuẩn bị trước (`studentPrep`), bài tập về nhà (`homework`), kho học liệu khóa học và **Phiếu Nhận Xét Buổi Học Dành Cho Con** (Student Report Card). Tuyệt đối không thấy các ghi chú nội bộ (`teacherNotes`) hay các buổi học nháp (`DRAFT`).
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

## 🔑 5. Danh Bạ Tài Khoản & Mật Khẩu Kiểm Thử 6 Roles Trên Localhost / Dev DB

> **Chi tiết đầy đủ:** Xem tại [`docs/LOCAL_DEV_ACCOUNTS.md`](file:///Volumes/DATA/projects/ThiEducation/docs/LOCAL_DEV_ACCOUNTS.md) và JSON [`docs/local_dev_accounts.json`](file:///Volumes/DATA/projects/ThiEducation/docs/local_dev_accounts.json).  
> **Cơ chế chuyển đổi 1-Click SSO:** Truy cập `http://localhost:3000/?sso_uid=<MÃ_ID>` để chuyển ngữ cảnh tài khoản ngay lập tức.

| Role | Mã ID | Tên Người Dùng | Đăng Nhập (Email / SĐT) | Mật Khẩu | Link SSO 1-Click | Quyền Hạn Kiểm Thử Chính |
| :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **`admin`** | `ADM001` | Phạm Quốc Bảo | `phamquocbao87@gmail.com`<br>*(SĐT: `0898794116`)* | `@Bcd123456` | [SSO ADM001](http://localhost:3000/?sso_uid=ADM001) | Full IT admin, cấu hình hạ tầng, audit logs, phân quyền. |
| **`director`** | `DIR505` | Phạm Thị Hiếu Thi | `lakvietnam@lakeducation.com`<br>*(SĐT: `0961557696`)* | `271025` | [SSO DIR505](http://localhost:3000/?sso_uid=DIR505) | Giám đốc điều hành, ký duyệt bảng lương, xem tổng quan tài chính & đào tạo. |
| **`academic`** | `ACA404` | Diễm Quỳnh | `quynhdao0210@gmail.com`<br>*(SĐT: `09878987`)* | `LakEducation@2026` | [SSO ACA404](http://localhost:3000/?sso_uid=ACA404) | Giáo vụ điều phối, tạo khóa/lớp học, xếp TKB, theo dõi phòng học live. |
| **`academic`** | `ACA545` | Ngọc Nhi | `nngoc.nhi0302@gmail.com`<br>*(SĐT: `0904492894`)* | `LakEducation@2026` | [SSO ACA545](http://localhost:3000/?sso_uid=ACA545) | Điều phối viên giáo vụ đào tạo, chấm công giáo viên, nhắc học phí. |
| **`teacher`** | `GV952` | Teacher Maj | `paguntalan.marjorie05@gmail.com`<br>*(SĐT: `090544134`)* | `@Bcd123456` | [SSO GV952](http://localhost:3000/?sso_uid=GV952) | Giáo viên bản xứ phụ trách `LH005`, `LH002`, `LH004`. Điểm danh trực tiếp tại `/classroom/LH005`. |
| **`accountant`** | `ACC330` | Lê Thị Mỹ Dung | `lemydung49@gmail.com`<br>*(SĐT: `0983548212`)* | `LakEducation@2026` | [SSO ACC330](http://localhost:3000/?sso_uid=ACC330) | Kế toán tài chính, đối soát thu học phí, chi trả lương GV & Giáo vụ. |
| **`student`** | `HV151` | Bui Truong Tuong Vi | `0786436333` *(SĐT phụ huynh)* | `LakEducation@2026` | [SSO HV151](http://localhost:3000/?sso_uid=HV151) | Học viên lớp `LH005`, xem bài tập, nộp bài, xem nhận xét và học phí cá nhân. |
| **`student`** | `HV361` | Ta Dang Viet Hai | `0987866303` *(SĐT phụ huynh)* | `LakEducation@2026` | [SSO HV361](http://localhost:3000/?sso_uid=HV361) | Học viên lớp `LH005` & `LH002`. |


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
7. **Bảo Mật Định Tuyến Tập Trung 2 Tầng (`ProtectedRoute` & `PermissionService.canAccessRoutePath`):**
   - **Tầng 1 (Chưa đăng nhập):** Chặn toàn bộ truy cập trực tiếp qua URL vào các trang nội bộ (bao gồm cả query như `/courses-classes?tab=curriculum`), chuyển hướng về `/?require_login=true&redirect=...` kèm mở Modal Đăng nhập. Tuyệt đối cấm tự động fallback sang tài khoản Admin khi chưa đăng nhập.
   - **Tầng 2 (Sai quyền RBAC):** Hiển thị màn hình **`403 Not Found`** gọn nhẹ kèm nút **`Quay Lại`**.
8. **Hệ Thống Thông Báo Realtime Theo Vai Trò & Cá Nhân (`NotificationService` + `targetKeys`):**
   - Mọi thông báo nghiệp vụ (đăng ký lớp, nhận dạy lớp, phê duyệt/từ chối) bắt buộc định danh chính xác `currentUser` đang đăng nhập (tuyệt đối cấm fallback `students[0]` / `teachers[0]`), gắn mảng `targetKeys` (`USER:<id>`, `ROLE:academic`, `ROLE:director`, `ROLE:admin`, `ALL`) và lắng nghe qua `onSnapshot` với `where('targetKeys', 'array-contains-any', queryKeys)` + `limit(20)`.
   - Riêng vai trò `admin` (`ADM001`) được hiển thị thanh kiểm toán (`Audit Trail`) trên từng thẻ thông báo trong `NotificationBellPopover`.

---

## 🎓 9. Quy Chuẩn Phân Quyền Xem Lịch Sử Đánh Giá Buổi Học & Khai Tử 100% Mock Data (`Class Evaluation History RBAC Matrix`)

1. **Kết Nối 100% Cơ Sở Dữ Liệu Thực Tế Firestore (`session_evaluations`):**
   - Toàn bộ dữ liệu hiển thị trong `EvaluationHistoryDrawer` bắt buộc đọc từ Cloud Firestore `session_evaluations` qua `ClassroomRealtimeService.getEvaluationHistory(classId)`.
   - **TUYỆT ĐỐI CẤM** tạo hàm sinh dữ liệu mẫu (`buildHistoricalSessions`) giả lập Buổi 1, Buổi 2 để làm màu giao diện. Nếu lớp chưa có dữ liệu lịch sử, bắt buộc hiển thị `Empty State` chuẩn mực sư phạm.
2. **Giáo Viên Bản Xứ (`teacher`) & Điều Phối Giáo Vụ (`academic`):**
   - Được toàn quyền xem danh sách lịch sử tất cả các buổi học trước đó của lớp học (`EvaluationHistoryDrawer`).
   - Được xem bảng tổng hợp tỷ lệ chuyên cần, mức sao đánh giá trung bình và toàn bộ nhận xét chi tiết của tất cả học viên trong lớp theo từng buổi học.
3. **Học Viên & Phụ Huynh (`student`):**
   - Được quyền xem dòng thời gian lịch sử đánh giá cá nhân qua các buổi học (`Personal Evaluation History`) để theo dõi sự tiến bộ.
   - **NGHIÊM NGẶT BẢO MẬT QUYỀN RIÊNG TƯ (Zero Peer-Data Leakage):**
     * Trong giao diện của Học viên, Drawer lịch sử **CHỈ ĐƯỢC PHÉP** hiển thị mức độ chuyên cần, số sao và lời nhận xét của Thầy/Cô dành riêng cho chính học viên đó (`record.studentId === currentStudentId`).
     * Tuyệt đối ẩn toàn bộ danh sách, điểm số và nhận xét của các học viên khác trong cùng lớp học.

---

## 🔒 10. Kỷ Luật Thép Bảo Mật SĐT Học Viên Đối Với Giáo Viên & Cơ Chế Chuyển Tiếp Tin Nhắn Qua Giáo Vụ (Strict Teacher Student-Phone Privacy & Academic Relay Protocol)

1. **Mục Tiêu & Nguyên Tắc Cốt Lõi:**
   - Trong mô hình giáo dục trực tuyến LAK EDUCATION, **Giáo viên bản xứ (`teacher`)** chỉ tập trung vào công tác chuyên môn giảng dạy, đánh giá và nhận xét học sinh.
   - Toàn bộ kênh liên lạc trực tiếp với Phụ huynh (qua Số điện thoại, Cuộc gọi thoại, Zalo) thuộc quyền quản lý và điều phối độc quyền của **Bộ phận Giáo Vụ (`academic`)** và **Ban Lãnh Đạo (`director`, `admin`)**.
   - **QUY TẮC BẤT BIẾN:** Giáo viên tuyệt đối **KHÔNG ĐƯỢC THẤY** bất kỳ số điện thoại nào của học viên hay phụ huynh trên toàn bộ giao diện web của hệ thống.

2. **Cơ Chế Chuyển Tiếp Tin Nhắn Sư Phạm Qua Giáo Vụ (`Academic Relay Protocol` & Silent Security):**
   - **Giao diện Giáo viên (`/students`):**
     * Ẩn toàn bộ SĐT phụ huynh, link mở chat Zalo và nút gọi điện thoại một cách tự nhiên (không dán nhãn bảo mật hay tag cấm đoán).
     * Hiển thị nút bấm thân thiện **`Nhắn Tin`** (Tiếng Anh: **`Message`**).
     * Khi nhấn nút, mở Modal `TeacherContactAcademicModal` trực diện, trang nhã: hiển thị Tên học viên, Tên phụ huynh, chọn danh mục phản ánh (Học tập, Chuyên cần, Kỷ luật, Đề xuất sư phạm), mức độ ưu tiên và nội dung nhắn gửi.
     * **TUYỆT ĐỐI CẤM:** Không chèn Alert banner giải thích quy trình bảo mật hay phân bua lý do cấm giáo viên liên hệ phụ huynh.
     * Dữ liệu được lưu trữ chuẩn mực vào Firestore collection `student_notes` qua `StudentNoteService`.
   - **Giao diện Giáo Vụ & Ban Lãnh Đạo (`academic`, `director`, `admin`):**
     * Hiển thị mục `📬 Tin nhắn từ GV` (`Teacher Notes`) trên từng thẻ học sinh với huy hiệu đếm số tin mới chưa xử lý (`pendingNotesCount`).
     * Mở Drawer `AcademicStudentNotesDrawer` để xem toàn bộ lịch sử tin nhắn của Giáo viên theo thời gian thực, đánh dấu trạng thái xử lý (`PENDING` $\rightarrow$ `RELAYED_TO_PARENT`), sao chép nội dung và chủ động liên hệ phụ huynh qua Zalo/Call.

3. **Chốt Chặn Đa Lớp Chống Rò Rỉ Số Điện Thoại Học Viên & Triệt Tiêu Nhãn Cảnh Báo:**
   - **Che Mã Cụm Gia Đình (`student.familyId` / `user.familyId`):** Hệ thống tự động sinh `familyId = FAM_<sđt_phụ_huynh>`. Vì vậy, trên giao diện của Giáo viên, mã này bắt buộc được che hoàn toàn thành `🏡 Cụm Gia Đình: Có anh/chị em học cùng` (`Siblings Enrolled`).
   - **Lọc Thanh Tìm Kiếm:** Loại bỏ các trường SĐT (`s.phone`, `s.phone2`, `s.phoneNumber`, `s.parentPhone`) khỏi danh sách `searchFields` khi `isTeacherRole === true`.
   - **Ẩn Nút Hồ Sơ (`/user-management`):** Giáo viên không được cấp quyền xem trang hồ sơ quản trị người dùng.
   - **Thời Khóa Biểu & Lớp Học (`ClassRosterDrawer`):** Cột liên hệ phụ huynh chỉ hiển thị tên phụ huynh, ẩn SĐT thô tự nhiên, không hiển thị tag bảo mật.
   - **Điểm Danh & Đánh Giá (`StudentProfileDrawer`):** Chỉ hiển thị tên phụ huynh, ẩn SĐT thô tự nhiên, không hiển thị tag bảo mật.
   - **Phòng Học Trực Tuyến Live Classroom (`StudentSeat`, `SessionEvaluationModal`):** Nút Zalo phụ huynh khi học sinh mất tập trung bị khóa đối với Giáo viên; 4 số cuối điện thoại trong bảng đánh giá sau giờ học được ẩn hoàn toàn đối với Giáo viên.

4. **Kịch Bản Kiểm Toán Tự Động Định Kỳ (`scripts/audit_teacher_student_privacy.py`):**
   - Trước khi release bất kỳ phiên bản nào, bắt buộc chạy kịch bản Playwright E2E tự động quét DOM toàn bộ các màn hình dưới quyền Giáo viên (`GV952`), đối chiếu trực tiếp với toàn bộ danh sách SĐT học viên thật trong Firestore để khẳng định 100% không rò rỉ dữ liệu.

---

## 🏫 11. Quy Chuẩn Cô Lập Lớp Học Theo Vai Trò Học Viên & Bảo Mật Học Phí Giáo Viên Trên Phân Hệ Khóa Học (`/courses-classes`)

1. **Cô Lập Lớp Học Theo Vai Trò Học Viên (Student Class Scoping Invariant):**
   - Trên `/courses-classes`, người dùng vai trò Học viên (`student`) **CHỈ ĐƯỢC PHÉP THẤY LỚP MÌNH ĐÃ GHI DANH** (`enrolledClassIds`, `studentIds`) hoặc lớp đang chờ phê duyệt đăng ký (`pendingStudentRequests`).
   - Tuyệt đối ẩn 100% toàn bộ các lớp học khác của học viên khác để bảo vệ tính riêng tư và chống gây hoang mang cho người dùng.
   - Nhãn số đếm trên Tab lớp học bắt buộc phản ánh chuẩn xác số lớp mà học viên được phép xem (`visibleClasses.length`), không lấy tổng `allClasses.length` của toàn trường.

2. **Bảo Mật Học Phí Đối Với Giáo Viên Bản Xứ (Teacher Fee Privacy Guard):**
   - Trên Tab Danh mục Khóa học (`CourseCatalogTab`) và Drawer Chi tiết khóa học (`CourseDetailDrawer`), giáo viên (`teacher`) **TUYỆT ĐỐI KHÔNG NHÌN THẤY BẤT KỲ LOẠI HỌC PHÍ NÀO** (`feePerMonth`, `totalCourseFee`, Card tím `Monthly Fee`, dòng `Full Course Tuition`).
   - Khi ẩn học phí, 2 Card KPI còn lại (`Duration` và `Max Class Size`) tự động dàn đều 50/50 (`sm={12}`) và dòng `Study Frequency` trải dài `span={2}` để giao diện liền mạch thẩm mỹ, không để lại khoảng trống trơ trọi.
   - Ban giám đốc (`director`), Giáo vụ (`academic`), IT Admin (`admin`), và Học viên (`student`) vẫn nhìn thấy đầy đủ học phí bình thường.

---

## 🚫 12. Kỷ Luật Cách Ly Nền Tảng Zalo Đối Với Giáo Viên Bản Xứ (Native Teacher Zalo Isolation Guard)

1. **Bối Cảnh & Nguyên Tắc Sư Phạm:**
   - Trong mô hình giáo dục trực tuyến LAK EDUCATION, **Giáo viên bản xứ (`teacher`)** là người nước ngoài (Native English Speakers), không sử dụng nền tảng nhắn tin Zalo (vốn là ứng dụng nội địa Việt Nam).
   - Nhóm Zalo lớp học (`zaloGroupLink`) và các nút bấm liên quan đến Zalo **CHỈ DÀNH RIÊNG** cho bộ phận Giáo Vụ (`academic`), Ban Lãnh Đạo (`director`, `admin`) và Học viên / Phụ huynh Việt Nam (`student`) để hỗ trợ học tập và gửi tài liệu.
   - Việc hiển thị nút hay link Zalo cho Giáo viên bản xứ gây dư thừa giao diện, tạo sự bối rối và tiềm ẩn rủi ro giao tiếp ngoài luồng sư phạm chuẩn.

2. **Quy Tắc Bất Biến (Strict 100% Zalo Suppression for Teachers):**
   - Ẩn **100%** toàn bộ các nút bấm, nhãn và đường liên kết Zalo đối với tài khoản vai trò Giáo viên (`role === 'teacher'`, `!isTeacherRole`) trên tất cả các màn hình:
     * **Card lớp học tại `/courses-classes` (`ClassManagementTab.jsx`):** Ẩn dòng `💬 Zalo Chat: [Join Zalo Group]`.
     * **Drawer Chi tiết lớp học & Danh sách học viên (`ClassRosterDrawer.jsx`):** Ẩn nút `Zalo Group` trên Header và ẩn mục `Class Zalo Group Chat` trong bảng Descriptions chi tiết lớp.
     * **Thanh thao tác đáy thẻ lớp trên Dashboard (`ClassCardActions.jsx`):** Ẩn nút `Zalo` ở chân card lớp học trên Workspace của Giáo viên.
     * **Popup trạng thái ca học trực tuyến (`ClassLiveStatusModal.jsx`):** Ẩn nút `Zalo Group` trong popup chi tiết ca học trực tuyến.
     * **Phòng học trực tuyến Live Classroom (`StudentSeat.jsx`, `SessionEvaluationModal.jsx`, `StudentCardGrid.jsx`):** Duy trì triệt để điều kiện `!isTeacherRole` (không hiển thị link Zalo phụ huynh cho giáo viên).
   - **Bảo Toàn Tính Năng (Zero Regression):** Tài khoản Giáo vụ (`academic`), Giám đốc (`director`), IT (`admin`) và Học viên (`student`) vẫn truy cập và mở nhóm Zalo lớp học bình thường.

---

## 📅 13. Quy Tắc Sắp Xếp Lớp Học Thông Minh Theo Khung Lịch Vận Hành (Smart Class Timetable Sorting Invariant)

1. **Bối Cảnh Vận Hành Trung Tâm Đào Tạo:**
   - Giáo viên bản xứ và học viên theo dõi thời khóa biểu hàng tuần. Việc hiển thị thẻ lớp học lộn xộn hoặc ngẫu nhiên theo thứ tự thêm vào database sẽ gây khó khăn cho việc nắm bắt lịch giảng dạy.
   - Chuẩn sắp xếp thời khóa biểu trực quan trong giáo dục: Các ca học đầu tuần (2-4-6) xếp trước $\rightarrow$ các ca học giữa tuần (3-5-7) xếp tiếp theo $\rightarrow$ các ca học Hàng ngày (Daily) $\rightarrow$ các ca học Cuối tuần (Sat-Sun).

2. **Bảng Trọng Số Lịch Học Bắt Buộc (`scheduleUtils.getScheduleDaysWeight`):**
   - **Trọng số 10:** Thứ 2 - 4 - 6 (`Mon, Wed, Fri` / `246` / `2-4-6` / `T2-T4-T6`) $\rightarrow$ Xếp **đầu tiên** (bên trái ngoài cùng trên Desktop, trên cùng danh sách trên Mobile).
   - **Trọng số 20:** Thứ 3 - 5 - 7 (`Tue, Thu, Sat` / `357` / `3-5-7` / `T3-T5-T7`) $\rightarrow$ Xếp **tiếp theo** (ở giữa).
   - **Trọng số 30:** Hàng ngày (`Daily` / `Hàng ngày` / `All week`) $\rightarrow$ Xếp **tiếp theo**.
   - **Trọng số 40:** Cuối tuần (`Weekend` / `Sat-Sun` / `T7-CN` / `Cuối tuần`) $\rightarrow$ Xếp **sau cùng**.
   - **Trọng số 50:** Các lịch học đặc thù khác.
   - **Sắp xếp thứ cấp (Secondary Sort):** Trong cùng nhóm lịch, tự động sắp xếp tăng dần theo số thứ tự định danh lớp trích xuất từ tên hoặc mã lớp (`WP01` < `WP02` < `WP03`... hoặc `LH001` < `LH002`...).

3. **Chốt Chặn Kiến Trúc Bắt Buộc (Centralized Smart Sorter):**
   - Thuật toán trung tâm `sortClassesSmartly(classList)` được export tại [`src/shared/utils/scheduleUtils.js`](file:///Volumes/DATA/projects/ThiEducation/src/shared/utils/scheduleUtils.js).
   - Toàn bộ các Service đọc dữ liệu lớp học:
     * `ClassService.getAllClasses()`
     * `ClassService.filterClasses()`
     * `DashboardDataService.getTeacherWorkspaceRealData()`
     * `DashboardDataService.getStudentPortalRealData()`
     * `ClassroomRealtimeService.subscribeClasses()`
     * `TeacherWorkspacePanel.jsx` (`useMemo(() => sortClassesSmartly(myClasses))`)
     **BẮT BUỘC** gọi `sortClassesSmartly` trước khi trả về dữ liệu hoặc render ra DOM, đảm bảo trải nghiệm nhất quán 100% trên toàn bộ các phân hệ của hệ thống.

---

## 🔒 14. Quy Tắc Vô Hiệu Hóa Ô Lớp Học Ghi Danh Đối Với Học Viên (Student Enrolled Classes Lock & Protection Guard)

1. **Bối Cảnh Nghiệp Vụ & Quyền Hạn:**
   - Tại LAK Education, việc ghi danh học viên vào lớp học (`enrolledClassIds`) thuộc thẩm quyền độc quyền của Giáo vụ (`academic`), Giám đốc (`director`) hoặc IT Admin (`admin`) dựa trên đánh giá trình độ và sĩ số tối đa của lớp (tối đa 10 học viên).
   - Học viên/Phụ huynh **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý** thêm, đổi hoặc gỡ bỏ các lớp học ghi danh khi chỉnh sửa hồ sơ cá nhân tại `/my-profile/edit`.
2. **Quy Chuẩn Kỹ Thuật Bắt Buộc (UI + Logic Protection):**
   - **Giao diện UI (`src/modules/users/UserDetailPage.jsx`):**
     * Biến nhận diện vai trò: `const isStudentRole = (currentUser?.role || '').toLowerCase() === 'student';`
     * Ô `<Select name="enrolledClassIds">` bắt buộc gán `disabled={isStudentRole || !canEditSensitive}` và `allowClear={!isStudentRole && canEditSensitive}`.
     * Thẻ nhãn lớp: `<Tag color="blue">{isEnglish ? 'Multiple Classes' : 'Nhiều Lớp'}</Tag>`.
     * Ghi chú hướng dẫn hiển thị biểu tượng ổ khóa:
       * *Tiếng Anh:* `🔒 Enrolled classes are assigned by the Academic department. Contact your Academic advisor to change classes.`
       * *Tiếng Việt:* `🔒 Lớp học ghi danh do Giáo vụ phân bổ. Vui lòng liên hệ Giáo vụ để thay đổi lớp học.`
   - **Bảo mật Tầng Logic Backend-Client (`handleSave`):**
     * Trong hàm `handleSave`, nếu `isStudentRole || !canEditSensitive`, payload cập nhật gửi lên database **BẮT BUỘC giữ nguyên `user?.enrolledClassIds` gốc từ database**, ngăn chặn triệt để mọi hành vi sửa đổi dữ liệu trái phép qua DevTools hoặc REST API client.
   - **Bảo Toàn Quyền Quản Trị (Zero Regression):**
     * Khi Giáo vụ, Giám đốc hoặc Admin vào chỉnh sửa học viên tại `/user-management/:id/edit`, `canEditSensitive === true`, ô Select vẫn mở bình thường để cán bộ quản trị toàn quyền gán lớp.

---

## 🎨 15. Kỷ Luật Tinh Gọn Giao Diện Đào Tạo & Ẩn Thẻ KPI Toàn Trường Cho Học Viên (Student Course Scoping & Clean UI Guard)

1. **Bối Cảnh Vận Hành:**
   - Học viên đăng nhập vào hệ thống để theo dõi lớp học, giáo trình và vào phòng học trực tuyến Zoom.
   - Các thẻ thống kê quy mô toàn trường (Course Programs, Active Online Classes, Native Teachers, Total Students) và nút quản lý học viên là thông tin quản trị nội bộ của trung tâm, gây rối mắt và làm lộ dữ liệu vận hành nếu hiển thị cho học viên.
2. **Quy Tắc Bất Biến Trên `/courses-classes` (`CoursesPage.jsx`):**
   - **Ẩn nút `[Student Management]`:** Chỉ hiển thị cho cán bộ quản lý có thẩm quyền (`{!isStudentRole && canManage && (...)}`).
   - **Ẩn toàn bộ 4 Thẻ KPI Quy Mô Toàn Trường:** Bọc điều kiện `{!isStudentRole && (<Row gutter={[16, 16]}>...)}`.
   - **Đưa Thẻ Lớp Học Lên Đầu Trang:** Thẻ lớp học của học viên lập tức hiển thị ngay đầu màn hình mà không cần cuộn trang.
   - **Cá nhân hóa Tiêu đề & Mô tả Trang Thân Thiện:**
     * *Tiêu đề:* `My Classes & Courses` (Tiếng Việt: `Lớp Học & Khóa Học Của Con`).
     * *Mô tả:* `View your enrolled online classes, timetable, and McGraw-Hill Wonders curriculum.` (Tiếng Việt: `Theo dõi lớp học trực tuyến, thời khóa biểu và giáo trình McGraw-Hill Wonders của bạn.`).

---

## 📹 16. Quy Chuẩn Video Recording Buổi Học Cho Giáo Viên & Cô Lập Theo Lớp Cho Học Viên (Session Recording & Class Scoped Video Isolation Invariant)

1. **Bối Cảnh Vận Hành & Tính Chất Tính Năng:**
   - Sau mỗi buổi học trực tuyến Zoom/Meet, video ghi hình giúp học viên ôn tập bài giảng, phát âm chuẩn giáo trình McGraw-Hill Wonders.
   - **TÍNH CHẤT TÙY CHỌN (OPTIONAL):** Tính năng này là lựa chọn của Giáo viên bản xứ và Giáo vụ, **HOÀN TOÀN KHÔNG BẮT BUỘC**. Giáo viên có thể tải lên tệp video, dán liên kết hoặc bỏ trống mà không ảnh hưởng hay chặn bất kỳ luồng điểm danh/đánh giá nào.
2. **Cơ Chế Lưu Trữ Google Drive Zero-Egress (Hosting-Store API):**
   - Tệp video (`.mp4`, `.mov`, `.webm`, `.mkv`) được tải trực tiếp từ trình duyệt lên Google Drive qua `DriveStorageService.uploadFile` vào thư mục:
     `06_CLASS_RECORDINGS_MATERIALS/2026` (Folder ID: `1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS`).
   - Hỗ trợ thanh tiến trình upload trực tiếp (`0% -> 100%`) qua `XMLHttpRequest` và proxy `/google-upload` khi chạy Localhost để chống lỗi CORS.
   - Hỗ trợ dán link Google Drive / Cloud URL nếu giáo viên đã tải lên trước đó.
3. **Phân Quyền & Cô Lập Lớp Học Tuyệt Đối (Class Scoped Video Isolation):**
   - Video bài giảng được lưu vào collection `learning_materials` với:
     `type: 'VIDEO'`, `classId: cls.id`, `sharedClassIds: [cls.id]`, `shareScope: 'CUSTOM'`, `isSessionRecording: true`.
   - **Toàn bộ học viên của lớp này sẽ thấy** trên Cổng Học Viên (`StudentClassMaterialsCard` và `StudentRecentEvaluationsCard`).
   - **Tuyệt đối ẩn 100%** đối với học viên không thuộc lớp này để đảm bảo tính riêng tư.
4. **Trải Nghiệm Xem Trực Tiếp (In-App Video Preview):**
   - Học viên bấm `[Preview / Xem]` hoặc `[Watch Video / Xem Video]` sẽ mở `MaterialPreviewModal` phát video trực tiếp (Iframe Google Drive hoặc HTML5 Video Player) với đầy đủ thanh điều khiển.







