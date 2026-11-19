# AGENTS.md - Rule Guidelines for AI Agents & Developers in LAK EDUCATION

Chào mừng bạn đến với dự án **LAK EDUCATION** (`lakeducation.com` - Educational Management ERP System - Quy mô 520 Học viên & 68 Cán bộ/Giáo viên).

File này quy định **CẤU TRÚC VÀ QUY TẮC BẮT BUỘC** mà mọi AI Agent (Antigravity, Gemini, Copilot...) và Coder phải tuân thủ nghiêm ngặt khi đọc, sửa đổi hoặc thêm mới tính năng.

---

## 🏗️ 1. Cấu Trúc Dự Án & Design Pattern (Clean Modular Architecture)

Dự án được phân chia thành 3 tầng chính, trong đó **mỗi Phân hệ (`src/modules/<name>/`) bắt buộc tuân thủ cấu trúc 5 lớp tách biệt** (chi tiết tại [`.agents/rules/01_architecture_rules.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/01_architecture_rules.md)):

```
ThiEducation/
├── .agents/                    # Quy tắc nghiêm ngặt dành cho AI Agent
│   └── rules/                  # 01_architecture, 02_isolation, 03_coding_standards, 04_rbac
├── AGENTS.md                   # File hướng dẫn trung tâm
├── src/
│   ├── core/                   # Tầng lõi khung ứng dụng (Layout, Auth, Router, Firebase)
│   │   ├── context/            # AuthContext (6 Roles), ThemeContext
│   │   ├── layout/             # AppLayout (Header, Sidebar, Mobile Drawer)
│   │   └── services/           # PermissionService (Common RBAC Class) & Firebase Adapter
│   │
│   ├── modules/                # TẦNG PHÂN HỆ ĐỘC LẬP (Feature Modules)
│   │   └── <module_name>/      # (dashboard, contracts, schedules, attendance, tuition...)
│   │       ├── index.jsx                  # [1. Entry Point] Chỉ xuất <Module>Page
│   │       ├── <Module>Page.jsx           # [2. Layout] Khung bố cục màn hình của phân hệ
│   │       ├── components/                # [3. Sub-Feature UI] Mỗi tính năng con 1 Component riêng
│   │       ├── hooks/                     # [4. Controller Hook] Quản lý State & kết nối UI - Service
│   │       ├── services/                  # [5. Sub-Feature Classes] Mỗi tính năng con 1 Class riêng (extends BaseModuleService)
│   │       └── models/<module>.model.js   # [6. Domain Model] Enum trạng thái, hằng số, schema
│   │
│   └── shared/                 # Tầng dùng chung (Reusable Components & Helpers)
│       ├── services/           # BaseModuleService (Common Base Class: Search, Filter, Data Scoping)
│       ├── components/         # Antd DataTable Wrapper, Modals dùng chung
│       ├── utils/              # Formatters, Validation, Slug & Currency helpers
│       └── data/               # Centralized Mock Dataset
```

---

## 🚫 2. Quy Tắc Độc Lập Module & Tách Class Tính Năng Con (Zero Impact & 1 Sub-Feature = 1 Class)

1. **Không can thiệp chéo giữa các Module:**
   - Mỗi Module trong `src/modules/<module_name>/` phải có đầy đủ giao diện, logic, và trạng thái nội bộ.
   - Khi chỉnh sửa Module `contracts` (Hợp đồng & Lương), **CẤM** được thay đổi trực tiếp file hoặc logic thuộc Module `tuition` hoặc `schedules`.
2. **Mỗi Tính Năng Con Trong Phân Hệ = 1 Class & Component Riêng Biệt:**
   - Bên trong mỗi phân hệ, các tính năng con phải được tách thành các Class riêng trong `services/` (kế thừa từ `BaseModuleService`) và Component riêng trong `components/`. Tuyệt đối không gộp nhiều tính năng vào chung 1 file hay 1 Class.
3. **Xuất Module qua File Index:**
   - Mỗi Module phải có 1 file `index.jsx` duy nhất đóng vai trò **Public Entry Point** đại diện cho Module đó.
4. **Common Base & Shared Utility Layer (`src/shared/` & `src/core/services/`):**
   - Các hàm kiểm tra quyền 6 Roles đặt tại `PermissionService.js`; các hàm tìm kiếm, lọc, cô lập dữ liệu GV/HV đặt tại `BaseModuleService.js`. Nếu có hàm helper hoặc UI component được dùng ở từ 2 Module trở lên, phải đưa vào `src/shared/`, **KHÔNG** import trực tiếp file của Module này sang Module khác.
5. **Mô Hình Đào Tạo Chuẩn: 1 Khóa Học (Course) → Nhiều Lớp Học (Classes) → Mỗi Lớp Nhiều Học Viên & 1 Giáo Viên:**
   - **Khóa học (`Course`):** Khung chương trình đào tạo chung (Mục tiêu, chuẩn đầu ra, giáo trình chính McGraw-Hill Wonders, thời lượng tháng, sĩ số tối đa 1 lớp, học phí niêm yết).
   - **Lớp học (`Class`):** Đơn vị vận hành cụ thể trực thuộc một khóa học (`courseId`), có lịch học hàng tuần, có sĩ số tối đa theo chuẩn khóa học, có **1 Giáo viên bản xứ đảm nhiệm (`teacherId`)**, và danh sách nhiều học viên theo học (`studentIds`).
   - **Phân tách Module & Cấu trúc 3 Tab Quản lý Đào tạo Hợp nhất:**
     - Phân hệ Quản lý Đào tạo Hợp nhất (`src/modules/courses/` — `/courses-classes`): Gồm 3 Tab theo thứ tự ưu tiên vận hành:
       1. **Tab 1 (`classes` — Mặc định):** `Quản Lý Lớp Học & Phân Bổ` (Học viên chỉ đăng ký tham gia tại cấp Lớp học; tuyệt đối không đặt nút đăng ký ở cấp Khóa học).
       2. **Tab 2 (`courses`):** `Danh Mục Khóa Học` (Quản lý khung chương trình đào tạo).
       3. **Tab 3 (`curriculum`):** `Cấp Độ Giáo Trình` (Nhúng trực tiếp `CurriculumLevelsPage`, ẩn menu rời trên Sidebar để tinh gọn điều hướng).
     - **Quy chuẩn 3 Trạng thái Học viên Đăng ký Lớp học & Bảo mật Link Zoom:**
       1. *Chưa đăng ký:* Nút `Đăng Ký Tham Gia Lớp Học` mở, ẩn/khóa toàn bộ Link Zoom, ID & Mật khẩu phòng học.
       2. *Đang chờ duyệt (`pendingStudentRequests`):* Nút chuyển sang `Đã đăng ký — Chờ phê duyệt` (`disabled=true`, chặn đứng đăng ký trùng lặp), tiếp tục khóa thông tin Zoom.
       3. *Đã phê duyệt (`studentIds`):* Hiển thị `Đã duyệt đăng ký — Đã tham gia lớp học`, mở khóa toàn bộ Link Zoom & nhóm lớp cho học viên.
     - Phân hệ Thời Khóa Biểu Zoom (`src/modules/schedules/` — `/zoom-schedules`): Lịch học & thời khóa biểu phòng học trực tuyến Live Zoom Calendar View.
     - **Quy định Ngưỡng Mở Phòng Học Trực Tuyến & Meet/Check-in (`Schedule Lead Window`):**
       * **Học viên (`student`):** Phòng Meet/Zoom và nút Vào Lớp chỉ mở khóa **trước giờ học đúng 10 phút (`leadMinutes = 10`, 600s)** để tránh học viên vào quá sớm khi giáo viên chưa chuẩn bị xong phòng. Nhãn hiển thị song ngữ: `⏰ Meet & Check-in opens 10m before class` (VI: `⏰ Mở Meet & Điểm danh trước giờ học 10p`), nút khóa: `Opens 10m Before` (VI: `Phòng Mở Trước 10 Phút`).
       * **Giáo viên & Cán bộ (`teacher`, `academic`, `director`, `admin`):** Mở trước **15 phút (`leadMinutes = 15`, 900s)** để thầy cô chuẩn bị giáo án, tài liệu và điểm danh sớm.
     - **Quy tắc Cô Lập Lớp Học Theo Vai Trò Học Viên (Student Class Scoping Invariant):**
       * Trên `/courses-classes`, người dùng vai trò Học viên (`student`) **CHỈ ĐƯỢC THẤY LỚP MÌNH ĐÃ GHI DANH** (`enrolledClassIds`, `studentIds`) hoặc đang chờ duyệt (`pendingStudentRequests`).
       * Tuyệt đối ẩn 100% toàn bộ các lớp học khác của học viên khác để bảo vệ tính riêng tư.
       * Nhãn số đếm trên Tab lớp học bắt buộc phản ánh đúng số lớp học viên được phép xem (`visibleClasses.length`).
     - **Quy tắc Bảo Mật Học Phí Đối Với Giáo Viên Bản Xứ (Teacher Fee Privacy Guard):**
       * Trên Tab Danh mục Khóa học (`CourseCatalogTab`) và Drawer Chi tiết (`CourseDetailDrawer`), giáo viên (`teacher`) **TUYỆT ĐỐI KHÔNG NHÌN THẤY BẤT KỲ LOẠI HỌC PHÍ NÀO** (`feePerMonth`, `totalCourseFee`, Card tím `Monthly Fee`, dòng `Full Course Tuition`).
       * Khi ẩn học phí, 2 Card KPI còn lại (`Duration` và `Max Class Size`) tự động dàn đều 50/50 (`sm={12}`) và dòng `Study Frequency` trải dài `span={2}` để giao diện liền mạch thẩm mỹ, không để lại khoảng trống trơ trọi.
     - **Quy tắc Cách Ly Nền Tảng Zalo Đối Với Giáo Viên Bản Xứ (Native Teacher Zalo Isolation Guard):**
       * Giáo viên tại LAK Education là **Giáo viên bản xứ (Native English Teachers)**, không sử dụng nền tảng Zalo.
       * Nhóm Zalo lớp học (`zaloGroupLink`) và các nút/nhãn liên quan đến Zalo **CHỈ DÀNH RIÊNG** cho Giáo vụ (`academic`), Giám đốc (`director`), IT (`admin`) và Học viên/Phụ huynh (`student`).
       * BẮT BUỘC ẩn **100%** toàn bộ các nút bấm, nhãn và đường liên kết Zalo đối với vai trò Giáo viên (`role === 'teacher'`, `!isTeacherRole`) trên toàn bộ hệ thống (`ClassManagementTab`, `ClassRosterDrawer`, `ClassCardActions`, `ClassLiveStatusModal`, `StudentSeat`, `SessionEvaluationModal`).
     - **Quy tắc Sắp Xếp Lớp Học Thông Minh Theo Khung Lịch Vận Hành (Smart Class Timetable Sorting Invariant):**
       * Danh sách thẻ lớp học bắt buộc được sắp xếp thông minh qua `sortClassesSmartly(classList)` ([`scheduleUtils.js`](file:///Volumes/DATA/projects/ThiEducation/src/shared/utils/scheduleUtils.js)).
       * **Thứ tự ưu tiên:** Lớp 2-4-6 (`Mon, Wed, Fri` - Trọng số 10, bên trái ngoài cùng / trên cùng) $\rightarrow$ Lớp 3-5-7 (`Tue, Thu, Sat` - Trọng số 20, ở giữa) $\rightarrow$ Lớp Hàng ngày (`Daily` - Trọng số 30) $\rightarrow$ Lớp Cuối tuần (`Sat-Sun` - Trọng số 40).
       * Trong cùng nhóm lịch, tự động sắp xếp theo số thứ tự lớp (`WP01` < `WP02` < `WP03`... hoặc `LH001` < `LH002`...).
       * Áp dụng bắt buộc trong `ClassService` (`getAllClasses`, `filterClasses`), `DashboardDataService` (`getTeacherWorkspaceRealData`, `getStudentPortalRealData`), `ClassroomRealtimeService` (`subscribeClasses`) và `TeacherWorkspacePanel`.
     - **Quy tắc Vô Hiệu Hóa Ô Lớp Học Ghi Danh Đối Với Học Viên (Student Enrolled Classes Lock & Protection Guard):**
       * Trên trang chỉnh sửa hồ sơ cá nhân (`/my-profile/edit`), học viên (`currentUser?.role === 'student'`) **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** tự ý chọn, đổi hoặc gỡ bỏ các lớp học ghi danh (`enrolledClassIds`).
       * Ô `<Select name="enrolledClassIds">` bắt buộc gán `disabled={isStudentRole || !canEditSensitive}` và `allowClear={!isStudentRole && canEditSensitive}`.
       * Hiển thị ghi chú ổ khóa chuyên biệt: `🔒 Enrolled classes are assigned by the Academic department. Contact your Academic advisor to change classes.` (VI: `🔒 Lớp học ghi danh do Giáo vụ phân bổ. Vui lòng liên hệ Giáo vụ để thay đổi lớp học.`).
       * **Bảo mật tầng logic trong `handleSave`:** Nếu người lưu là học viên (`isStudentRole || !canEditSensitive`), payload lưu lên hệ thống cưỡng chế giữ nguyên `user.enrolledClassIds` gốc từ database.
       * Quyền phân bổ và điều chuyển lớp học thuộc quyền hạn độc quyền của Giáo vụ (`academic`), Giám đốc (`director`) và IT Admin (`admin`) tại `/user-management/:id/edit`.
     - **Quy tắc Tinh Gọn Giao Diện Đào Tạo & Ẩn Thẻ KPI Toàn Trường Cho Học Viên (Student Course Scoping & Clean UI Guard):**
       * Trên màn hình Khóa học & Lớp học (`/courses-classes`):
         - Ẩn hoàn toàn nút `[Student Management]` đối với Học viên (`{!isStudentRole && canManage && (...)}`).
         - Ẩn toàn bộ 4 Thẻ KPI thống kê quy mô toàn trường (`Course Programs`, `Active Online Classes`, `Native Teachers`, `Total Students`) đối với Học viên (`{!isStudentRole && (<Row gutter={[16, 16]}>...)}`).
         - Thẻ lớp học của học viên được đẩy ngay lên đầu màn hình không cần cuộn trang.
         - Cá nhân hóa tiêu đề trang: `My Classes & Courses` (VI: `Lớp Học & Khóa Học Của Con`), mô tả: `View your enrolled online classes, timetable, and McGraw-Hill Wonders curriculum.` (VI: `Theo dõi lớp học trực tuyến, thời khóa biểu và giáo trình McGraw-Hill Wonders của bạn.`).
     - **Quy chuẩn Video Recording Buổi Học Cho Giáo Viên & Cô Lập Theo Lớp Cho Học Viên (Session Recording & Class Scoped Video Isolation Invariant):**
       * Tùy chọn (Optional) dành cho Giáo viên bản xứ và Giáo vụ sau mỗi buổi học trực tuyến, không bắt buộc, không chặn luồng điểm danh hay đánh giá sư phạm nếu không có video.
       * Tải tệp trực tiếp lên Google Drive Zero-Egress vào thư mục `06_CLASS_RECORDINGS_MATERIALS/2026` (Folder ID: `1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS`) với tiến trình upload trực tiếp (0% - 100%).
       * Tự động đồng bộ vào Firestore `learning_materials` với `type: 'VIDEO'`, `classId: cls.id`, `sharedClassIds: [cls.id]`, `shareScope: 'CUSTOM'`, `isSessionRecording: true`.
       * **Kỷ luật chuẩn hóa quyền chia sẻ (`normalizeMaterialShares` & `getMaterialsForUser`):**
         - Khi tài liệu/video thuộc diện nhắm đến lớp cụ thể (`isClassTargeted`: có `isSessionRecording: true` hoặc `targetType === 'class'` hoặc `sharedClassIds.length > 0`), hàm `normalizeMaterialShares` **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ ĐỘNG GÁN** `courseId` vào `sharedCourseIds`.
         - Trong `MaterialService.getMaterialsForUser`, khi tài liệu bị giới hạn theo lớp (`isClassRestricted`), bắt buộc chỉ học viên/giáo viên được phân bổ đúng lớp trong `sharedClassIds` mới được xem, chặn đứng hoàn toàn việc rò rỉ chéo sang các lớp khác cùng khóa học!
       * Toàn bộ học viên ghi danh vào lớp lập tức thấy video trên `StudentClassMaterialsCard` và `StudentRecentEvaluationsCard`, bấm `[Preview / Xem]` xem trực tiếp qua `MaterialPreviewModal`. Học viên ngoài lớp tuyệt đối không nhìn thấy.
     - **Quy tắc Bảo Mật PII Phụ Huynh & Trạng Thái Học Phí Đối Với Học Viên & Giáo Viên (Student & Teacher PII Privacy Guard):**
       * Trên Danh sách Lớp (`ClassRosterDrawer`), Học viên (`student`) và Giáo viên bản xứ (`teacher`) **TUYỆT ĐỐI BỊ ẨN 100%** hai cột `Parent Contact` (Tên & SĐT phụ huynh) và `Tuition Status` (Tình trạng học phí) ở cả bảng học viên chính thức và bảng học viên học thử (`trialStudents`).
       * Tuyệt đối không cho phép học viên nhìn thấy số điện thoại của học viên khác hoặc phụ huynh khác ở bất kỳ giao diện nào (Roster, Live Classroom, User Management, Dashboard).
       * Nút liên hệ/gọi Zalo phụ huynh trong phòng học trực tuyến (`StudentSeat.jsx`) chỉ mở cho cán bộ quản lý (`admin`, `director`, `academic`), tuyệt đối ẩn đối với học viên.
       * Quyền xem đầy đủ 5 cột `Parent Contact` và `Tuition Status` thuộc độc quyền của 4 vai trò quản trị điều hành: `admin`, `director`, `academic`, `accountant` (`canViewParentContacts = canManage || ['admin', 'director', 'academic', 'accountant'].includes(userRole)`).
       * Giáo viên bản xứ (`teacher`) tuyệt đối không nhìn thấy học phí (tuân thủ nghiêm ngặt `Teacher Fee Privacy Guard`) và không thấy số điện thoại đầy đủ của phụ huynh (chỉ hỗ trợ nhắn tin nội bộ cho Giáo vụ).
     - **Quy tắc Ẩn Cấp Độ Giáo Trình & Bảo Vệ Deep-link Đối Với Học Viên (Student Curriculum Levels & Deep-Link Guard):**
       * Trên màn hình Quản lý Đào tạo Hợp nhất (`/courses-classes`), tài khoản Học viên (`role === 'student'`) **CHỈ ĐƯỢC PHÉP THẤY 2 TABS**:
         1. Tab 1: `Class Management & Roster` (Danh sách lớp học trực tuyến của con).
         2. Tab 2: `Course Programs Catalog` (Danh mục khóa học).
       * **TUYỆT ĐỐI ẨN 100% Tab 3 `Curriculum Levels`** (Cấp độ giáo trình) đối với Học viên. Cấp độ giáo trình, CEFR, số unit, thời lượng và các nút switch trạng thái là cấu hình học thuật nội bộ (dành riêng cho Admin, Director, Academic, Teacher).
       * **Bảo vệ Deep-link & URL Trực Tiếp:**
         - Nếu học viên mở link có `?tab=curriculum`, hệ thống cưỡng chế fallback `activeTab` về `'classes'`.
         - Trong `PermissionService.js`, loại bỏ hoàn toàn `'student'` khỏi module `curriculum` trong `accessMatrix`. Cấm học viên truy cập các route `/curriculum-levels/*`.
       * 4 vai trò quản trị & đào tạo (`Admin`, `Director`, `Academic`, `Teacher`) vẫn bảo toàn 100% quyền xem và quản lý đầy đủ 3 Tabs.
     - **Quy tắc Trình Diễn Lời Nhận Xét Sư Phạm & Trạng Thái Chờ Minh Bạch (Teacher Feedback Presentation & Pending Invariant):**
       * Lời nhận xét sư phạm của giáo viên bản xứ (Native Teacher Feedback) là tài sản giá trị nhất đối với học viên và phụ huynh.
       * **Kỷ luật CẤM:** TUYỆT ĐỐI CẤM dùng dòng text fallback xám mờ (như *"Học viên tham gia học đầy đủ hôm nay."* hoặc *"Actively participated in class today."*) khi trường `comment` bị rỗng. Điều này gây hiểu lầm nghiêm trọng là tính năng bị lỗi hoặc mất dữ liệu.
       * **Quy chuẩn hiển thị 3 trạng thái bắt buộc trên View Học Viên (`StudentAttendancePersonalView.jsx`):**
         1. *Có nhận xét:* Hiển thị **Khung Trích Dẫn Sư Phạm Nổi Bật (Teacher Feedback Callout Box)** (`backgroundColor: '#f6f9fe'`, viền `#d0e2ff`, icon 💬, huy hiệu tên GV `<Tag color="geekblue">Teacher Maj</Tag>`, format chữ in nghiêng thanh lịch kèm emoji 🌟 🌱, nút Popover xem toàn văn nếu dài $\ge 90$ ký tự).
         2. *Đang chờ chấm (buổi mới diễn ra):* Hiển thị Badge cam rõ ràng `<Tag color="orange" icon={<ClockCircleOutlined />}>Đang cập nhật nhận xét</Tag>` kèm chú thích minh bạch: *"Giáo viên bản xứ đang hoàn thiện nhận xét sau giờ học."*.
         3. *Vắng mặt:* Hiển thị `<Tag color="default">Vắng mặt buổi học</Tag>`.
       * **Kỷ luật Đồng Bộ Hiển Thị Trên View Giáo Viên & Admin (`SessionEvaluationTable.jsx`):**
         - Không để cột nhận xét hiển thị dấu `—` trơ trọi khi ca dạy có dữ liệu nhận xét trong `studentEvaluations`.
         - BẮT BUỘC hiển thị nút bấm tổng hợp `<Button size="small" type="dashed">💬 {X} Nhận xét chi tiết</Button>`, click mở Popover liệt kê danh sách nhận xét của từng học viên trong ca dạy đó.
       * **Kỷ luật Chọn Tài Khoản Tiêu Biểu Khi Đóng Vai (Impersonation Enrolled Student Invariant):**
         - Trong `AuthContext.jsx`, khi Admin chuyển vai trò sang `student` để kiểm thử, hệ thống BẮT BUỘC ưu tiên nạp học viên tiêu biểu đã có dữ liệu thực tế đầy đủ (như `HV768` Kenji có lớp `LH004`, 4 buổi học và đầy đủ nhận xét từ Teacher Maj).
         - TUYỆT ĐỐI KHÔNG bốc ngẫu nhiên học viên chưa được ghi danh lớp học (`enrolledClassIds: undefined`) gây ra hiện tượng màn hình rỗng trơ trọi (Empty State).
6. **Kỷ Luật Bất Biến Về Phạm Vi Task, Quy Trình 6 Bước Fix Bug Toàn Diện & Đánh Giá Tác Động (Strict 6-Step Bug-Fixing Protocol & Cross-Screen Audit Invariant):**
   - **🚨 QUY TRÌNH 6 BƯỚC BẮT BUỘC KHI SẾP BẢO NÊU BUG HOẶC YÊU CẦU FIX LỖI (SẾP BẢO DIRECTIVE):**
     * **Bước 1 — Tái hiện lỗi (Reproduce Bug):** Bắt buộc tái hiện chính xác lỗi trên môi trường thực tế (ghi nhận luồng thao tác, ảnh chụp màn hình, log lỗi hoặc viết script Playwright tái hiện), tuyệt đối không suy đoán mò mẫm.
     * **Bước 2 — Quét & Rà soát Lỗi Tương Tự Trên Toàn Bộ Màn Hình Còn Lại (Cross-Screen Pattern-Wide Scan & Report):**
       > **CHỈ ĐẠO CỐT LÕI CỦA SẾP BẢO:** Ngay sau khi tái hiện thành công lỗi tại màn hình A, Agent **BẮT BUỘC PHẢI QUÉT TOÀN DIỆN TẤT CẢ CÁC MÀN HÌNH, PHÂN HỆ VÀ 6 ROLES CÒN LẠI** (`Director`, `Academic`, `Teacher`, `Student`, `Accountant`, `Admin`) xem có xuất hiện pattern lỗi tương tự hay không (ví dụ: hardcode tiếng Việt khi ở giao diện tiếng Anh, lỗi ngữ pháp số nhiều `class/classes`, nút bấm thiếu `whiteSpace: nowrap`, layout flex bị co ép rớt chữ dọc...).
       > Agent phải tổng hợp thành Báo cáo Rà Soát Lỗi Tương Tự (Cross-Screen Audit Report) trình Sếp Bảo, tuyệt đối không fix chắp vá riêng lẻ từng chỗ.
     * **Bước 3 — Phân tích nguyên nhân gốc rễ (Root Cause Analysis):** Truy vết chính xác dòng code, component, state, service hoặc cấu trúc Firestore gây ra bug, chỉ rõ tại sao lỗi lại xảy ra trên toàn bộ các điểm tìm thấy.
     * **Bước 4 — Đề xuất phương án sửa chữa đồng bộ (Proposed Synchronous Fix Solution):** Trình bày chi tiết cách fix sạch sẽ, tận gốc cho cả điểm chính lẫn các điểm tương tự phát hiện ở Bước 2; nêu rõ giải pháp kiến trúc thay vì vá tạm bợ.
     * **Bước 5 — Đánh giá tác động theo Ma trận 4 Chiều & Rủi ro hồi quy (4-Dimensional Impact Assessment):**
       > **KỶ LUẬT ĐÁNH GIÁ IMPACT 4 CHIỀU (CHỐNG REOPEN BUG):** Bắt buộc trả lời 4 câu hỏi trước khi sửa code:
       > 1. *Data Inflow & Temporal Graph:* Dữ liệu component đến từ đâu? Có bị kích hoạt ngầm bởi Timer (`useClassroomClock`), Polling hay Realtime listeners không?
       > 2. *User Dirty State Protection:* Component có ô nhập liệu (Input/Textarea/Form) người dùng đang soạn thảo dở không? Phải đảm bảo Realtime Stream không ghi đè lên Local Buffer!
       > 3. *Chesterton's Fence Guard (Hàng Rào Phòng Thủ Cũ):* Tuyệt đối **CẤM XÓA HOẶC SIMPLIFY** bất kỳ đoạn code nào có chú thích hoặc bản chất là code phòng thủ (`// Bảo vệ...`, `// Guard...`, `// Tombstone...`, `if (localEditsRef.current[s.id])`).
       > 4. *Cross-Module Consumers:* Có bao nhiêu component, hook, service khác đang dùng chung dữ liệu này?
     * **Bước 6 — Trình duyệt & Chờ Sếp Bảo xác nhận trước khi sửa (Mandatory Confirmation Gate):**
       > **CẤM TỰ Ý SỬA CODE TRƯỚC KHI CÓ SỰ ĐỒNG Ý CỦA SẾP BẢO.**  
       > Agent phải dừng lại, xuất trình rõ 5 bước trên trong câu trả lời hoặc Artifact, xin ý kiến xác nhận của Sếp Bảo. **CHỈ KHI SẾP BẢO CONFIRM / XÁC NHẬN** thì mới bắt đầu tiến hành sửa đổi code!
   - **Kỷ Luật Khóa Chốt Hồi Quy & Thử Nghiệm Độ Trễ Gõ Phím Con Người (Temporal Typing Retention $\ge 3\text{s}$):**
     * Mọi form/input bắt buộc phải test qua kịch bản con người: Gõ phím $\rightarrow$ Dừng chờ 3.5 giây mô phỏng người dừng tay suy nghĩ $\rightarrow$ Assert nội dung không bị mất chữ do re-render ngầm.
     * Mọi bug sau khi sửa bắt buộc phải đưa vào bộ test tự động tích lũy (`scripts/qc_regression_typing_retention.py`). Nếu bất kỳ tính năng mới nào làm gãy test cũ $\rightarrow$ Tự động chặn đứng build và dừng deploy ngay lập tức!
   - **Tuyệt đối không tự ý thay đổi chức năng khác khi chưa có yêu cầu / thông báo:**
     * Đang thực hiện sửa chữa, tối ưu hoặc phát triển cho chức năng A thì **CHỈ ĐƯỢC PHÉP THAO TÁC TRONG PHẠM VI CHỨC NĂNG A**.
     * Tuyệt đối **CẤM** tiện tay sửa đổi, refactor, đổi logic, xóa hoặc làm mới bất kỳ chức năng B nào khác khi chưa có yêu cầu rõ ràng từ Sếp Bảo hoặc chưa thông báo xin phép trước.
   - **Kỷ luật Báo cáo Minh bạch Phạm vi (Scope Transparency):**
     * Sau khi hoàn thành, báo cáo phải nêu rõ danh sách file đã thay đổi, khẳng định các chức năng khác được bảo toàn nguyên vẹn 100% không bị ảnh hưởng.
   - **Quy Chuẩn Kiểm Thử 3 Tầng Bắt Buộc (Mandatory 3-Tier Testing Protocol: Unit • Integrated • Stress):**
     * Mọi tính năng phân quyền RBAC hoặc thay đổi logic cốt lõi bắt buộc phải trải qua 3 tầng kiểm thử trước khi báo cáo hoàn thành:
       1. **Tầng 1 — Unit Test:** Kiểm tra độc lập thuật toán lọc dữ liệu, xử lý điều kiện biên với tập dữ liệu mock đa dạng (`scripts/test_courses_unit_and_scoping.mjs`).
       2. **Tầng 2 — Integrated Test (Playwright E2E Headless):** Chạy kiểm thử đa vai trò (`student`, `teacher`, `admin`) trên trình duyệt Chromium thật kết nối database Cloud Firestore thật (`scripts/qc_integrated_test_courses_and_privacy.py`).
       3. **Tầng 3 — Stress Test:** Kiểm tra chịu tải thuật toán trên tập dữ liệu lớn (500+ items qua 1.000 lượt gọi, benchmark $< 0.5\text{ms}$/lượt); kiểm tra chuyển đổi phiên liên tục chống rò rỉ cache/bộ nhớ; và assert Zero Overflow-X trên Mobile 390px (`scrollWidth <= innerWidth` — `scripts/qc_stress_test_courses_and_scoping.py`).
    - **Quy Trình 12 Bước Xử Lý Bugs & Multi-Hosting Staging Release Protocol:**
      * Khi tiếp nhận danh mục bugs (`bugs-*.docx`, `.md`), toàn bộ quy trình thực hiện theo 12 bước nghiêm ngặt: (1) Quét danh mục -> (2) Reproduce -> (3) Cross-Screen Pattern Scan -> (4) Sửa chữa đồng bộ -> (5) 3-Tier Testing -> (6) Chụp ảnh screenshots -> (7) Pass checklist 100% -> (8) Deploy DEV -> (9) Test DEV E2E -> (10) Deploy Backup & Prod -> (11) Test Prod kèm Zero Test Residue -> (12) Báo cáo nghiệm thu & live links. Chi tiết tại [`.agents/rules/07_qc_and_it_audit_protocol.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/07_qc_and_it_audit_protocol.md).
7. **Kỷ Luật Bảo Mật Web, Chống Bot Phishing False-Positive & Ép Chuyển Hướng Canonical Domain (Anti-Phishing Hardening & Force Canonical Domain Invariant):**
   - **Tuyệt đối không để xảy ra hiểu lầm Phishing trên tên miền phụ:**
     * Subdomain `*.web.app` và `*.firebaseapp.com` bị các bot bảo mật (Google Safe Browsing) quét liên tục.
     * **BẮT BUỘC:** Đặt inline script chuyển hướng 0ms (`window.location.replace`) ngay tại thẻ `<head>` của `dist/erp/index.html` và `dist/landing/index.html` để chuyển toàn bộ lưu lượng về tên miền thương hiệu chính thức: `https://erp.lakeducation.edu.vn` và `https://lakeducation.edu.vn`.
   - **Quy chuẩn thiết kế Form Đăng nhập an toàn:**
     * **Tách biệt 2 Tab riêng biệt:** Tab 1 "Tài Khoản LAK" (thuần túy SĐT/Email + Mật khẩu LAK; cấm tuyệt đối chứa logo hoặc chữ Google); Tab 2 "Google Workspace SSO" (nút chuẩn SSO, chú thích an toàn, cấm tuyệt đối chứa ô password).
     * **CẤM TUYỆT ĐỐI:** Vẽ logo SVG 4 màu Google tự chế đặt trong cùng form hoặc nằm cạnh ô nhập Password nội bộ.
   - **Tín hiệu pháp lý doanh nghiệp bắt buộc:**
     * Bổ sung Schema.org JSON-LD `EducationalOrganization` và meta tác giả `CÔNG TY CỔ PHẦN LAK EDUCATION`.
8. **Kỷ Luật Bất Biến Về Phân Tách 3 Tầng Multi-Hosting & Database Mapping Tuyệt Đối Không Nhầm Lẫn (Strict 3-Tier Multi-Hosting & Database Isolation Invariant):**
   - **Bản Đồ Cố Định 3 Tầng Multi-Hosting:**
     | Hệ Thống | Project ID (Firebase/GCP) | Hosting Sites / Targets | Tên Miền Hoạt Động | Database Firestore | Firebase Auth | Mục Đích Sử Dụng |
     | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
     | **1. PRODUCTION (Chính thức)** | **`lakeducation`**<br>(`36575839783`, Blaze) | - `erp`: `lakeducation-erp-portal`<br>- `landing`: `lakeducation` | `https://erp.lakeducation.edu.vn`<br>`https://lakeducation.edu.vn`<br>*(Tạm chờ Google duyệt mở lại CDN)* | 🟢 **`lakeducationdb`**<br>(Database Thật 100%) | 🟢 `lakeducation`<br>(Gốc) | 520 học viên, 68 cán bộ/GV vận hành chính thức. |
     | **2. BACKUP PRODUCTION (Dự phòng)** | **`lakeducation-backup`**<br>(`621289402673`, Spark) | - `erp`: `lakeducation-backup-erp`<br>- `landing`: `lakeducation-backup` | `https://bk.lakeducation.edu.vn`<br>`https://lakeducation-backup-erp.web.app`<br>`https://lakeducation-backup.web.app` | 🟢 **`lakeducationdb`**<br>(Database Thật 100%) | 🟢 `lakeducation`<br>(Authorized Domains) | Dự phòng trực tiếp khi Production chính có sự cố. Toàn bộ dữ liệu ghi thẳng vào DB thật. |
     | **3. DEVELOPMENT (Môi trường Dev)** | **`lakeducation-dev`**<br>(`609742112072`, Spark) | - `erp`: `lakeducation-dev-erp`<br>- `landing`: `lakeducation-dev` | `https://dev.lakeducation.edu.vn`<br>`https://lakeducation-dev-erp.web.app`<br>`https://lakeducation-dev.web.app` | 🟡 **`lakeducation-dev`**<br>(DB Thử Nghiệm) | 🟡 `lakeducation-dev` | Môi trường Sandbox để IT kiểm thử tính năng mới mà không đụng dữ liệu thật. |
   - **Kỷ Luật Cưỡng Chế Lệnh Deploy (`package.json`) — Cấm Tuyệt Đối Dùng Lệnh Chung Chung:**
     * `npm run deploy:prod`: Chỉ đóng gói và deploy duy nhất lên Production `lakeducation`.
     * `npm run deploy:backup`: Chỉ đóng gói và deploy duy nhất lên Backup `lakeducation-backup`.
     * `npm run deploy:dev`: Chỉ đóng gói và deploy duy nhất lên Dev `lakeducation-dev`.
     * `npm run deploy:all`: Deploy đồng thời cả 3 môi trường khi cần phát hành toàn diện.
   - **Quy Tắc Quản Trị Authorized Domains Trên Firebase Auth:**
     * Mọi domain của Production (`*.lakeducation.edu.vn`) và Backup (`bk.lakeducation.edu.vn`, `lakeducation-backup-erp.web.app`, `lakeducation-backup.web.app`) BẮT BUỘC phải nằm trong danh sách `authorizedDomains` của Firebase Auth project gốc `lakeducation` để đăng nhập Google OAuth mượt mà không lỗi `auth/unauthorized-domain`.
   - **Quy Tắc Kết Nối Database & Cách Ly Tuyệt Đối (`src/core/services/firebase.js`):**
     * **Production & Backup:** Mặc định 100% (cả chạy Production và Backup) đều kết nối trực tiếp vào Database Thật `lakeducationdb` của project `lakeducation`. Mật khẩu học viên là `LakEducation@2026`.
     * **Localhost & Dev Sandbox:** Mặc định 100% chạy trên Localhost (`http://localhost:3000`) và Dev Domains (`lakeducation-dev-erp.web.app`, `dev.lakeducation.edu.vn`) **BẮT BUỘC kết nối vào Sandbox `lakeducation-dev`**, hiển thị banner xanh lá cây trên đỉnh màn hình, và 100% (55/55 tài khoản) đăng nhập bằng mật khẩu DEV chuẩn **`@Bcd1234`**. Tuyệt đối cấm để Localhost tự do chạm vào Database Thật.
   - **Chốt Chặn Kiểm Toán Tự Động Fail-Closed Trước Khi Đóng Gói (`scripts/verify_deployment_safety.mjs`):**
     * Tích hợp trực tiếp vào lệnh `npm run build`: Tự động kiểm tra 10 kịch bản giả lập runtime, assert mapping `.firebaserc` và scripts trong `package.json`. Nếu có bất kỳ sai lệch cấu hình nào giữa 3 môi trường, lệnh build lập tức FAIL ngay ở bước 1, ngăn chặn triệt để mọi rủi ro deploy nhầm.

---

## 📋 3. QuyChuẩn Code React & Ant Design

1. **Thư viện UI chuẩn:** Sử dụng **Ant Design (`antd`)** làm thư viện thiết kế UI chính.
2. **Responsive First:** Mọi màn hình mới thêm vào phải đảm bảo hiển thị hoàn hảo trên màn hình **Mobile (`< 768px`)** và **Desktop (`>= 768px`)**.
3. **Phân quyền Role-based (6 Roles Chuẩn):** Mọi tính năng nhạy cảm (Cấu hình hệ thống, điều hành chung, quản lý đào tạo, chấm điểm, đối soát lương/học phí) phải được bọc kiểm tra role từ `useAuth()` theo đúng 6 vai trò trong [`.agents/rules/04_business_roles_and_rbac.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/04_business_roles_and_rbac.md):
   - `admin`: Quản trị hệ thống IT (Bảo mật, cấu hình, fix lỗi, theo dõi sức khỏe hệ thống).
   - `director`: Giám đốc điều hành (Xem toàn bộ hệ thống, hoạt động giáo vụ, khóa học, tổng học viên, thu/chi học phí, lương...).
   - `academic`: Giáo vụ (Quản lý giáo viên, học viên, thời khóa biểu, tạo khóa học/lớp học, điểm danh, đánh giá, quản lý thu học phí & lương GV).
   - `teacher`: Giáo viên (Check-in lớp học, xem TKB & danh sách lớp mình dạy, xem hồ sơ học viên, điểm danh & nhận xét từng học viên).
   - `accountant`: Kế toán (Xem và đối soát quá trình trả lương giáo viên, lương giáo vụ, đóng học phí học viên).
   - `student`: Học viên (Xem profile cá nhân, bài tập của mình, đánh giá của mình, lớp đang tham gia & thông tin đóng học phí).
   - **Ma trận Quyền Kích hoạt / Tạm khóa Tài khoản (`Active / Deactive Switch`):**
     - 👑 **Giám đốc (`director`):** Có quyền Active / Deactive đối với Giáo vụ (`academic`), Giáo viên (`teacher`), Học viên (`student`).
     - 🎓 **Giáo vụ (`academic`):** Chỉ có quyền Active / Deactive đối với Giáo viên (`teacher`), Học viên (`student`). Tuyệt đối không can thiệp Admin, Giám đốc hoặc Giáo vụ khác.
     - 🛠️ **IT Admin (`admin`):** Toàn quyền đối với mọi tài khoản (trừ tài khoản của chính mình và Root Admin).
     - Nút Switch trên giao diện phải liên kết với `PermissionService.canChangeUserStatus`; khi không đủ quyền thì `disabled` kèm Tooltip song ngữ giải thích lý do.
   - **Quy Chuẩn Song Ngữ Sạch 100% Không Lẫn Lộn Anh/Việt (Clean Bilingual Harmonization Standard):**
     - Khi giao diện chuyển sang tiếng Anh (`isEnglish === true` hoặc `language === 'en'`), **100% nội dung hiển thị** (nhãn, thẻ tag `Multiple Classes` thay vì `Nhiều Lớp`, extra, placeholder, validation, và enum từ database) **BẮT BUỘC PHẢI LÀ TIẾNG ANH**.
     - Cấm tuyệt đối hardcode chuỗi tiếng Việt tĩnh trong JSX mà không bọc `{isEnglish ? ... : ...}` hoặc `t(...)`.
     - Các trường trạng thái lưu tiếng Việt trong Firestore (`tuitionStatus: 'Chờ đối soát' | 'Đã đóng đủ' | 'Chưa đóng'`) phải được xử lý qua hàm ánh xạ `formatTuitionStatus(status, isEnglish)`.
4. **Kỷ Luật Vận Hành 100% Dữ Liệu Thực Tế & Gỡ Bỏ Cơ Chế Giả Lập Tài Khoản (Pure Real Data & Zero Impersonation Simulation Invariant):**
   - Theo chỉ đạo trực tiếp của Sếp Bảo: Hệ thống **VẬN HÀNH 100% TRÊN DỮ LIỆU THỰC TẾ** từ Cloud Firestore (`lakeducationdb`), tuyệt đối **KHÔNG** dùng mock data hay trộn danh bạ giả lập.
   - Cơ chế giả lập / Impersonation (*"Admin Xem Dưới Tên User"*) và Modal chuyển đổi vai trò demo trên Header đã được **gỡ bỏ hoàn toàn**.
   - Mỗi người dùng đăng nhập và làm việc trực tiếp bằng tài khoản thật của mình (Google OAuth hoặc Email/Mật khẩu).
   - Toàn bộ các tài khoản mẫu (`ACA001..ACA003`, `ACC001`, `GV002..GV007`, `HV001..HV005`) đã được loại bỏ khỏi danh sách hoạt động; giao diện Quản trị người dùng (`/user-management`) và Hồ sơ cá nhân (`/my-profile`) chỉ hiển thị người dùng thực tế:
     * 🛠️ **`ADM001` — Phạm Quốc Bảo:** IT Quản Trị Hệ Thống (`phamquocbao87@gmail.com` / `0898794116` — Mật khẩu: `@Bcd123456`)
     * 👑 **`DIR505` — Phạm Thị Hiếu Thi:** Giám Đốc Điều Hành & Sáng Lập (`lakvietnam@lakeducation.com` / `0961557696` — Mật khẩu: `271025`)
     * 💰 **`ACC330` — Lê Thị Mỹ Dung:** Kế Toán Tài Chính (`lemydung49@gmail.com` / `0983548212` — Mật khẩu: `LakEducation@2026`)
     * 🎓 **`ACA404` — Diễm Quỳnh:** Điều Phối Viên Giáo Vụ (`quynhdao0210@gmail.com` / `09878987` — Mật khẩu: `LakEducation@2026`)
     * 🎓 **`ACA545` — Ngọc Nhi:** Điều Phối Viên Giáo Vụ (`nngoc.nhi0302@gmail.com` / `0904492894` — Mật khẩu: `LakEducation@2026`)
     * 👨‍🏫 **`GV952` — Teacher Maj:** Giáo Viên Bản Xứ Phụ Trách Lớp `LH005`, `LH002`, `LH004` (`paguntalan.marjorie05@gmail.com` / `090544134` — Mật khẩu: `@Bcd123456`)
     * 🎒 **15 Học viên thực tế (`HV151`..`HV971`):** Đăng nhập bằng SĐT Phụ huynh — Mật khẩu chung: `LakEducation@2026`
     * 📋 **Danh bạ đầy đủ & URL 1-Click SSO kiểm thử từng Role:** Xem tại [`docs/LOCAL_DEV_ACCOUNTS.md`](file:///Volumes/DATA/projects/ThiEducation/docs/LOCAL_DEV_ACCOUNTS.md) và JSON [`docs/local_dev_accounts.json`](file:///Volumes/DATA/projects/ThiEducation/docs/local_dev_accounts.json).
   - **Quy Chuẩn Kiến Trúc Sub-Feature Service Kết Nối 100% Cloud Firestore:**
     * **Khóa học (`courses`):** [`CourseService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/courses/services/CourseService.js) (`getAllCourses`, `saveCourse`, `deleteCourse` trên Firestore `courses`).
     * **Lớp học (`classes`):** [`ClassService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/courses/services/ClassService.js) (`getAllClasses`, `saveClass`, `deleteClass` trên Firestore `classes`).
     * **Hợp đồng Giáo viên (`contracts`):** [`TeacherContractService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/services/TeacherContractService.js) (`getAllContracts`, `saveContract`, `deleteContract` trên Firestore `contracts`).
     * **Bảng lương Giáo viên (`payrolls`):** [`TeacherPayrollService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/services/TeacherPayrollService.js) (`getAllPayrolls`, `savePayroll`, `approvePayroll`, `disbursePayroll` trên Firestore `payrolls`).
     * **Bảng lương Giáo vụ (`staffPayrolls`):** [`StaffPayrollService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/contracts/services/StaffPayrollService.js) trích xuất động từ Cán bộ Giáo vụ thật trong Firestore `users`.
     * **Thống kê Dashboard:** [`ExecutiveAnalyticsService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/dashboard/services/ExecutiveAnalyticsService.js) tính toán động từ tổng số học viên, giáo viên, lớp học thực tế trong Firestore thay vì đọc số tĩnh `INITIAL_STATS`.
     * **Dọn sạch rác `localStorage`:** Khi ứng dụng khởi chạy, tự động purge (`localStorage.removeItem`) các key rác cũ (`lak_erp_classes`, `lak_erp_timetable`, `lak_erp_courses`) để tránh tình trạng dữ liệu rác cũ (như *"Súng Bắn Ốc, Vặn Vít"*, *"erw"*, *"a223"*) bị sống lại.
     * **Dropdown Modal liên kết danh bạ thật:** Mọi ô chọn Giáo viên / Học viên khi tạo hợp đồng hoặc phân công giảng dạy bắt buộc trích xuất từ danh bạ Firestore `allSystemUsers` (`GV791`...), tuyệt đối cấm ô input nhập text tự do hoặc gán giáo viên demo cũ.
     * **Kiểm toán Tự Động Playwright E2E Khẳng Định Dữ Liệu Thật (`Automated Real-DB Assertion`):** Trước khi bàn giao nghiệm thu bất kỳ phân hệ nào, bắt buộc chạy kiểm thử Playwright tự động để kiểm tra: ASSERT TRUE (dữ liệu nhân sự thật hiển thị đầy đủ: `GV791 Hellen`, `ACA545 Ngọc Nhi`, `ACA404 Diễm Quỳnh`...) và ASSERT FALSE (hoàn toàn không còn xuất hiện bất kỳ nhân sự mock giả lập nào: `David Smith`, `Emma Watson`, `Trần Thu Hà`, `Nguyễn Phương Thảo`...).
     * **🚨 KỶ LUẬT THÉP BẤT BIẾN: NGHIÊM CẤM TUYỆT ĐỐI TỰ Ý TẠO DỮ LIỆU & BẮT BUỘC DỌN SẠCH 100% DỮ LIỆU TEST (STRICT ZERO TEST-DATA RESIDUE & NO UNSOLICITED DATA GENERATION):**
       - **TUYỆT ĐỐI CẤM** tự ý tạo, hardcode hoặc seed dữ liệu mẫu/dữ liệu giả mạo người dùng, giáo viên, học viên (như tự ý gõ nhận xét, tự tạo bản ghi đánh giá buổi học, tự tạo bài tập giả danh giáo viên) khi Sếp Bảo chưa có yêu cầu rõ ràng.
       - **BẮT BUỘC DỌN SẠCH 100% (Strict Teardown Invariant):** Mọi kịch bản kiểm thử E2E tự động (Playwright, Python, Node.js script) nếu có phát sinh dữ liệu tạm để kiểm thử giao diện/API thì **BẮT BUỘC phải dọn sạch hoàn toàn (hard-delete / teardown sạch sẽ 100%)** ngay trong khối `finally` của script. Tuyệt đối cấm để rò rỉ bất kỳ bản ghi test nào (`e2e_`, `test_`, `att_`, `LIVE_`) vào Cloud Firestore thật.
       - **BẢO TOÀN TRẠNG THÁI TRỐNG THỰC TẾ (Authentic Empty State):** Nếu thực tế học viên chưa có đánh giá nào từ giáo viên thật, giao diện BẮT BUỘC phải hiển thị trạng thái Trống (Empty State) *"Chưa có bản đánh giá nào từ giáo viên"* / *"No session evaluations yet"*, cấm tự vẽ hoặc giữ lại dữ liệu test để lấp chỗ trống.
     * **🚨 KỶ LUẬT THÉP BẢO MẬT SĐT HỌC VIÊN ĐỐI VỚI GIÁO VIÊN & CƠ CHẾ LIÊN HỆ QUA GIÁO VỤ (STRICT TEACHER STUDENT-PHONE PRIVACY & ACADEMIC RELAY PROTOCOL):**
       - **Mục tiêu cốt lõi:** Giáo viên (`role === 'teacher'`) tuyệt đối **KHÔNG ĐƯỢC THẤY** số điện thoại học viên hoặc phụ huynh ở bất kỳ đâu trên toàn bộ hệ thống (kể cả trong bảng học viên, drawer danh sách lớp, drawer điểm danh, phòng học ảo Live Classroom, chi tiết hồ sơ).
       - **Cơ chế Chuyển tiếp Tin nhắn qua Giáo vụ (`Academic Relay Protocol`):**
         * Trên thẻ học viên (`/students`), thay vì hiển thị SĐT, link Zalo và nút Gọi điện, giao diện của Giáo viên chỉ hiển thị nhãn `🔒 Academic Privacy` / `🔒 Bảo mật qua Giáo vụ` và nút bấm **`Nhắn Giáo Vụ` (`Message Academic`)**.
         * Bấm vào nút sẽ mở Modal [`TeacherContactAcademicModal.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/students/components/TeacherContactAcademicModal.jsx) cho phép Giáo viên chọn loại tin nhắn (Học tập, Chuyên cần, Thái độ, Góp ý khác), nội dung và độ ưu tiên. Tin nhắn được lưu vào collection `student_notes` qua [`StudentNoteService.js`](file:///Volumes/DATA/projects/ThiEducation/src/modules/students/services/StudentNoteService.js).
         * Các vai trò Cán bộ (`academic`, `director`, `admin`) được mở quyền xem mục `📬 Tin nhắn từ GV` trên thẻ học sinh, hiển thị badge số lượng tin mới (`pendingNotesCount`) và mở [`AcademicStudentNotesDrawer.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/modules/students/components/AcademicStudentNotesDrawer.jsx) để đọc, duyệt và liên hệ phụ huynh qua Zalo/Call để truyền đạt thông tin sư phạm.
       - **Che giấu Đa Lớp Chống Rò Rỉ Số Điện Thoại:**
         * *Mã Cụm Gia Đình (`familyId`):* Do hệ thống tự động sinh `familyId = FAM_<sđt_phụ_huynh>`, giao diện Giáo viên **BẮT BUỘC PHẢI CHE** mã này thành `🏡 Cụm Gia Đình: Có anh/chị em học cùng` (`Siblings Enrolled`).
         * *Thanh Tìm Kiếm:* Loại bỏ `s.phone`, `s.phone2`, `s.phoneNumber`, `s.parentPhone` khỏi danh sách `searchFields` khi `isTeacherRole === true` để ngăn giáo viên dò tìm học sinh bằng SĐT.
         * *Drawer Danh Sách Lớp (`ClassRosterDrawer`) & Điểm Danh (`StudentProfileDrawer`):* Thay thế toàn bộ số điện thoại bằng thẻ nhãn `🔒 Academic Privacy` / `🔒 Bảo mật qua Giáo vụ`.
         * *Phòng Học Trực Tuyến (`StudentSeat`, `SessionEvaluationModal`):* Khóa nút Zalo phụ huynh trên ghế học sinh; che 4 số cuối SĐT trong bảng đánh giá buổi học đối với Giáo viên.
       - **Kiểm toán Tự động:** Chạy `python3 scripts/audit_teacher_student_privacy.py` để quét tự động DOM toàn bộ màn hình với danh sách SĐT thật trong Firestore.
5. **Chuẩn Đa Ngôn Ngữ (`Localization / i18n` — Mặc định Tiếng Anh `en`, Thứ hai Tiếng Việt `vi`):**
   - **Tập trung hóa 100% UI Labels vào 2 File Từ Điển Độc Lập:**
     * 🇬🇧 **Tiếng Anh (Mặc định):** [`src/core/i18n/locales/en.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/i18n/locales/en.js)
     * 🇻🇳 **Tiếng Việt:** [`src/core/i18n/locales/vi.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/i18n/locales/vi.js)
     * Khi cần thêm mới hoặc thay đổi bất kỳ câu chữ, nhãn menu, tiêu đề cột, nút bấm nào trên toàn bộ hệ thống, **CHỈ CẦN VÀO CẬP NHẬT 2 FILE NÀY**.
   - Sử dụng `i18next` + `react-i18next` ([`src/core/i18n/i18n.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/i18n/i18n.js)) kết hợp Ant Design `ConfigProvider` (`enUS` / `viVN`) trong [`src/core/context/LanguageContext.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/core/context/LanguageContext.jsx).
   - **Chế độ mặc định (`DEFAULT_LANGUAGE = 'en'`):** Tiếng Anh (`🇬🇧 EN`), chế độ thứ 2 là Tiếng Việt (`🇻🇳 VI`), lưu tại `localStorage` (`lak_app_language`).
   - **Phạm vi dịch:** Chỉ dịch **Label hiển thị của ứng dụng (`UI Labels`)** (Menu, Tiêu đề trang, Cột bảng, Thẻ thống kê, Nút bấm, Nhãn trạng thái); **dữ liệu do người dùng nhập vào (`User Input Data`)** phải giữ nguyên vẹn 100%.
   - **Đồng bộ ngôn ngữ thông báo lỗi & Toasts:** Mọi thông báo lỗi (Error Alert, Toast `message.error`, `message.success`, Modal Warning, Auth Error) **BẮT BUỘC PHẢI HIỂN THỊ ĐÚNG NGÔN NGỮ ĐANG CHỌN (`language`)** thông qua `localizeSystemMessage(msg, language)` từ `src/core/i18n/i18n.js`. Tuyệt đối không để lọt chuỗi thông báo Tiếng Việt khi giao diện đang ở chế độ Tiếng Anh.
   - **Đồng bộ ngôn ngữ Form Placeholders & DatePicker:** Các ô nhập liệu (`placeholder`) và bộ chọn ngày (`DatePicker`) phải đồng bộ song ngữ qua `useLanguage()`. Khi Tiếng Anh (`EN`): DatePicker hiển thị định dạng chuẩn Mỹ `MM/DD/YYYY` (đồng bộ giáo trình McGraw-Hill Wonders) và placeholder `MM/DD/YYYY`; khi Tiếng Việt (`VI`): định dạng `DD/MM/YYYY`. Dữ liệu lưu trữ Firestore giữ nguyên cố định `DD/MM/YYYY`.
   - **Quy tắc `useMemo` tránh kẹt cache ngôn ngữ (Zero Mixed-Language):** Mọi danh sách Menu Sidebar (`allMenuDefinitions`), danh sách cột bảng (`columns`), hoặc các đối tượng nhãn giao diện phụ thuộc ngôn ngữ **BẮT BUỘC PHẢI KHAI BÁO `[isEnglish]` (hoặc `[language]`) trong Dependency Array của `useMemo`**. Tuyệt đối không chỉ khai báo `[t]` vì instance `t` của i18next không đổi tham chiếu khi chuyển đổi ngôn ngữ, dẫn đến menu bị kẹt nhãn tiếng Anh khi chọn tiếng Việt.
   - **An toàn Dữ liệu Firestore (Zero-Undefined):** Tuyệt đối không truyền giá trị `undefined` vào `setDoc` / `updateDoc`. Luôn bảo toàn trạng thái tài khoản `status` khi đổi mật khẩu hoặc cập nhật hồ sơ.
   - **Quy tắc chống đơ DOM (`No MutationObserver Loop`):** Tuyệt đối không dùng `MutationObserver` gán lại `textContent` và không khai báo key-value trùng nhau trong `VI_TO_EN_UI_LABELS`; luôn kiểm tra `targetText !== rawText` trước khi cập nhật.
7. **Quy Chuẩn Bất Biến Về Độ Sạch Giao Diện: Chỉ Hướng Dẫn Quy Trình Thao Tác Cho User & Tuyệt Đối Không Mô Tả Cơ Chế Hạ Tầng Kỹ Thuật Nội Bộ (Zero Technical Jargon & Pure User-Centric Workflow Invariant):**
   - **Chỉ Nói Quy Trình Thao Tác Cho Người Dùng (User-Centric Operational Workflow):**
     * Mọi văn bản hiển thị trên UI (nhãn form, gợi ý dropzone, placeholder, tooltip, modal title, helper text, banner subtitle) **CHỈ ĐƯỢC PHÉP HƯỚNG DẪN HÀNH ĐỘNG NGHIỆP VỤ CỦA NGƯỜI DÙNG** (Người dùng cần làm gì: *Kéo thả tài liệu, chọn khóa học, nhập thông tin, lưu trữ học liệu*).
     * **TUYỆT ĐỐI CẤM** mô tả cơ chế hạ tầng kỹ thuật bên trong hệ thống (như: *"hệ thống tự động tạo thư mục trên Firebase Storage và mở hộp thoại..."*, *"gọi API lưu dữ liệu..."*, *"chạy cronjob ngầm..."*). Người dùng không quan tâm và không bao giờ được phép thấy các chi tiết kỹ thuật này.
   - **Bảng Cấm & Thay Thế Từ Ngữ Hạ Tầng Trên Toàn Bộ Giao Diện:**
     * `Firebase / Firebase Storage / Firestore` $\rightarrow$ Thay bằng: *Hệ thống*, *Kho học liệu số*, *Thư mục lưu trữ*, *Tải lên*.
     * `API / Endpoint / JSON / Payload` $\rightarrow$ Thay bằng: *Dữ liệu*, *Thông tin chi tiết*, *Đồng bộ*.
     * `Rich Text Editor / TipTap / Antd / Regex` $\rightarrow$ Thay bằng: *Nội dung soạn thảo*, *Mục tiêu bài học*, *Định dạng chuẩn*.
   - **100% sử dụng ngôn ngữ nghiệp vụ sư phạm & quản trị giáo dục thuần túy.**
   - Chuẩn soạn thảo giáo trình dùng **`@tiptap/react`** (hỗ trợ chính thức React 19; không import riêng `extension-underline` vì StarterKit v3 đã tích hợp sẵn).
   - Khi hiển thị tóm tắt ngoài Card hoặc Table, **bắt buộc dùng hàm `stripHtml()`** để lọc sạch mã HTML.
   - **Kỷ Luật Bảo Mật Ngầm & Giao Diện Tự Nhiên (Silent & Seamless Security Invariant):**
     * **Cơ chế bảo mật phải diễn ra ngầm 100%:** Khi một vai trò không có quyền xem thông tin (ví dụ Giáo viên không được thấy SĐT phụ huynh) hoặc hành động được chuyển tiếp ngầm qua bộ phận khác (như Giáo vụ chuyển tin cho phụ huynh), giao diện **BẮT BUỘC PHẢI GIỮ TỰ NHIÊN VÀ TRỰC DIỆN**.
     * **TUYỆT ĐỐI CẤM:**
       1. Cấm hiển thị các nhãn/tag mang tính cấm đoán hoặc phân bua lý do kỹ thuật (như `🔒 Bảo mật qua Giáo vụ`, `🔒 Academic Privacy`, `🔒 Bị ẩn do phân quyền`).
       2. Cấm đưa các Alert banner mô tả quy trình trung chuyển nội bộ vào Form thao tác (như *"Giáo viên không liên hệ trực tiếp với phụ huynh...", "Quy trình Bảo mật & Cầu nối..."*).
       3. Cấm đặt tên nút mang tính phòng ban nội bộ (`Nhắn Giáo Vụ`); phải dùng từ ngữ giao tiếp tự nhiên: **`Nhắn Tin`** (`Message`), **`Gửi Tin Nhắn`** (`Send Message`).
     * **Nguyên tắc hiển thị chuẩn:**
       - Cột/Mục thông tin phụ huynh: Chỉ hiển thị `Phụ huynh: [Tên phụ huynh]`, ẩn SĐT thô một cách tự nhiên mà không cần dán nhãn bảo mật.
       - Modal gửi tin nhắn: Chỉ hiển thị biểu mẫu sạch sẽ (Tên học viên, Tên phụ huynh, Phân loại, Mức độ ưu tiên, Nội dung tin nhắn).
   - **Phòng Vệ Đa Ngôn Ngữ Chống Rò Rỉ Mã Khóa Kỹ Thuật (Defensive i18n Guardrail):**
     * Hàm bọc `t(key, fallback)` tại `LanguageContext.jsx` bắt buộc chặn đứng mọi trường hợp i18next trả về tên khóa thô (`res === key`), lập tức kích hoạt chuỗi fallback nghiệp vụ song ngữ an toàn.
     * Trước khi bàn giao bất kỳ tính năng nào có i18n, bắt buộc chạy script đối soát đảm bảo 100% khóa mới đã được định nghĩa đầy đủ ở cả 2 tệp `src/core/i18n/locales/vi.js` và `en.js`.
8. **Chuẩn Base Layout, Bộ 8 Base Controls Dùng Chung & Kỷ Luật Mobile First:**
   - Mọi form mới/sửa bắt buộc kế thừa từ `src/shared/components/layout/` (`BaseFormPageLayout`, `FormSectionCard`, `FormActionBar`) và `src/shared/components/controls/` (`BaseRichTextEditor`, `BaseDatePicker`, `BaseCurrencyInput`, `BaseRangeSelector`, `BaseSearchInput`, `BaseStatusTag`, `BaseUserSelect`, `BaseFileUpload`).
   - **Kỷ luật Mobile First:** Trên mobile (`< 768px`), nút Submit/Lưu bắt buộc nằm ở đáy trang hoặc trên thanh Sticky Action Bar (`FormActionBar`), tuyệt đối cấm đặt trước các trường cấu hình.
   - **Cơ chế Kiểm toán UI/UX 4 bước:** Bắt buộc kiểm tra Kế thừa Base Layout $\rightarrow$ Thử nghiệm Mobile $\rightarrow$ Công thái học $\rightarrow$ Độ sạch ngôn ngữ trước khi bàn giao.
   - **Chuẩn Đồng Nhất Trục Lưới Cột & Chiều Rộng Controls (Grid Harmonization & 100% Width Invariant):**
     - Mọi dòng 2 cột trong cùng một khối `FormSectionCard` **BẮT BUỘC dùng chung tỷ lệ `Col xs={24} sm={12}` (50% / 50%)**. Tuyệt đối cấm pha trộn `10 / 14` với `12 / 12` gây lệch trục dọc mép các ô nhập liệu.
     - Mọi dòng 3 cột dùng đều `Col xs={24} sm={8} md={8}` (33.3% / 33.3% / 33.3%).
     - Mọi control con (`Input`, `Select`, `DatePicker`, `InputNumber`) **BẮT BUỘC có `style={{ width: '100%', height: 40, borderRadius: 8 }}`** để lấp đầy 100% bề rộng cột, tạo các đường gióng dọc thẳng tắp, đạt chuẩn Enterprise quốc tế.
9. **Chuẩn Hiển Thị Footer & Tự Động Tăng Version Build (`scripts/bump_build_version.js`):**
   - Cố định dòng bản quyền ở cả 2 ngôn ngữ là: `LAK EDUCATION (lakeducation.com) ©2026`.
   - Ngay bên dưới dòng bản quyền bắt buộc hiển thị phiên bản theo đúng định dạng: **`Version 1.2.x • build YYYYMMDDNNv`** (ví dụ: `Version 1.2.1 • build 2026110801v`), trong đó:
     * Mỗi lần chạy `npm run build`, hệ thống tự động gọi `node scripts/bump_build_version.js` để tăng số hiệu `Version` lên `0.0.1` (`1.2.0` $\rightarrow$ `1.2.1` $\rightarrow$ `1.2.2`...).
     * Mã `build YYYYMMDDNNv` lấy ngày theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`) cộng với số thứ tự bản build trong ngày (`01`, `02`, `03`...) và hậu tố `v`.
10. **Quy Chuẩn Tự Động Quy Đổi Múi Giờ Ngầm & Bảo Toàn Lịch Sử Thời Khóa Biểu (`Silent Auto-Timezone Conversion & Schedule Version History`):**
    - **Tự động quy đổi múi giờ ngầm (`formatScheduleForViewer` trong `src/shared/utils/scheduleUtils.js`):** Hệ thống lưu giờ gốc theo múi giờ chuẩn Việt Nam (`GMT+7`) và tự động nhận diện múi giờ thiết bị/hồ sơ người xem (`getViewerUtcOffset`: Việt Nam `GMT+7`, Philippines `GMT+8`...) để quy đổi ngầm ngay tại mục `Lịch học:`. **TUYỆT ĐỐI CẤM** hiển thị các dòng chú thích múi giờ thừa (như `(Giờ VN GMT+7 — Gõ/chọn VD: 07:20)`) hoặc bảng quy đổi nhiều múi giờ rườm rà lên giao diện Form/Card/Drawer.
    - **Chọn giờ từng phút (`minuteStep={1}`):** Ô `Giờ vào lớp` và `Giờ tan lớp` bắt buộc dùng `<TimePicker format="HH:mm" minuteStep={1} />` cho phép gõ hoặc chọn chính xác từng phút (`07:20`, `10:30`, `19:10`).
    - **Bảo toàn Lịch sử Thời khóa biểu khi đổi lịch (`scheduleHistory`):** Khi lớp học đổi lịch từ một ngày áp dụng mới (`scheduleEffectiveFrom`), hệ thống tự động đóng giai đoạn cũ vào ngày liền trước (`effectiveFrom - 1 day`, trạng thái `ARCHIVED`) và mở giai đoạn mới (`ACTIVE`), giữ nguyên 100% lịch sử các giai đoạn thời khóa biểu trước đó.
11. **Quy Chuẩn Bất Biến Về Tìm Kiếm Tiếng Việt Có Dấu / Không Dấu 2 Chiều & Wildcard SQL `%like%` (`Universal Search Invariant`):**
    - Tất cả các ô tìm kiếm trên Header, Filter Bar, Bảng dữ liệu và Bộ chọn Autocomplete (`src/shared/components/controls/`) BẮT BUỘC hỗ trợ tìm kiếm tiếng Việt 2 chiều (gõ không dấu ra có dấu và ngược lại) cùng cú pháp đại diện SQL `%like%` (như `pham%bao`, `wonders%g1`, `giao%vien`) qua bộ tiện ích `src/shared/utils/searchUtils.js`.
    - **CẤM** sử dụng raw `.toLowerCase().includes(...)` gây lỗi tìm kiếm không ra kết quả tiếng Việt.
    - Mọi Service Module kế thừa `BaseModuleService` bắt buộc dùng `searchByKeyword` hoặc `searchByFields`.
12. **Quy Chuẩn 2 Số Điện Thoại, Cụm Gia Đình (`familyId`) & Bộ Chuyển Đổi Hồ Sơ Con 1 Chạm (`Family Switcher`):**
    - **Ràng buộc định danh:** Cán bộ/Giáo viên bắt buộc 100% có Email công vụ + 1 SĐT chính; Học viên cho phép để trống Email nếu đã cung cấp SĐT (tối thiểu 1 SĐT chính, tối đa 2 SĐT: SĐT 1 Chính & SĐT 2 Phụ). Cả 2 SĐT dùng chung 1 mật khẩu.
    - **Tên tiếng Anh bắt buộc (`englishName`):** Mọi tài khoản bắt buộc có `englishName`, tự động sinh bằng `toEnglishName(name)` lọc sạch dấu tiếng Việt.
    - **Cụm gia đình (`familyId` & `parentUserId`):** Anh chị em ruột dùng chung SĐT phụ huynh được gắn chung `familyId` (`FAM_<sđt_chính>`), cho phép chia sẻ SĐT mà không bị chặn trùng lặp. Con của Cán bộ/Giáo viên liên kết qua `parentUserId`.
    - **Chọn hồ sơ con khi login & Switcher 1 chạm:** Khi đăng nhập bằng SĐT chung, hệ thống hiển thị Modal chọn con (`Profile Candidate Selector Modal`). Trên thanh Header có nút **`Switch Child / Đổi Hồ Sơ`** cho phép chuyển đổi tức thì (0ms phản hồi).
13. **Quy Chuẩn Xác Thực Email Tùy Chọn & Bố Cục Form Thu Gọn (Safe Optional Email Validator & Compact Form Layout):**
    - **Safe Optional Email Validator:** Khi Email là tùy chọn (như Học viên), **TUYỆT ĐỐI CẤM** dùng `{ type: 'email' }` đơn thuần để tránh lỗi thư viện chặn chuỗi rỗng `""`. Bắt buộc dùng validator kiểm tra `if (!value || !value.trim()) return Promise.resolve()`.
    - **Compact Form Layout Invariant:** Khoảng cách dòng `Form.Item` dùng `marginBottom: 14px` (hoặc tối đa `16px`), chiều cao controls `38px - 40px`, chia đều cột 50/50 (`Col xs={24} sm={12}`).
14. **Quy Chuẩn Bảo Mật Định Tuyến Tập Trung (`ProtectedRoute` 2 Tầng) & Cấm Fallback Actor (`Zero Actor Fallback Invariant`):**
    - **Cấm tuyệt đối Fallback Actor:** Khi xử lý đăng ký lớp học (`handleRequestEnrollClass`) hoặc nhận lớp giảng dạy (`handleRequestTeachClass`), bắt buộc lấy đúng định danh `currentUser` đang đăng nhập, **TUYỆT ĐỐI CẤM** fallback sang `students[0]`, `teachers[0]` hoặc tự động gán `CORE_ROLE_USERS.admin` khi chưa đăng nhập.
    - **Bảo mật 2 tầng tại [`ProtectedRoute.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/core/router/ProtectedRoute.jsx) & [`PermissionService.canAccessRoutePath`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/PermissionService.js):**
      * *Tầng 1 (Chưa đăng nhập):* Chặn mọi truy cập URL trực tiếp (kể cả query `?tab=curriculum`), chuyển hướng về `/?require_login=true&redirect=...` và bật Modal Đăng nhập.
      * *Tầng 2 (Đã đăng nhập nhưng không đủ quyền Role):* Hiển thị màn hình **`403 Not Found`** tối giản kèm nút **`Quay Lại`**.
15. **Quy Chuẩn Hệ Thống Thông Báo Realtime Tối Ưu Chi Phí (`onSnapshot` + `targetKeys` + `limit(20)` + `Admin Audit Trail`):**
    - **Định tuyến chỉ mục `targetKeys` ([`NotificationService.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/NotificationService.js)):** Mỗi thông báo khi ghi vào Firestore `notifications` bắt buộc gắn mảng `targetKeys` (`["USER:<id>"]`, `["ROLE:academic", "ROLE:director", "ROLE:admin"]`, hoặc `["ALL"]`) và `auditTrail` đầy đủ (`action`, `actorId`, `actorName`, `actorRole`, `createdAt`).
    - **Lắng nghe Realtime bảo vệ chi phí ([`useNotifications.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/hooks/useNotifications.js)):** Dùng `onSnapshot` với truy vấn chỉ mục đơn `where('targetKeys', 'array-contains-any', userQueryKeys)` + `limit(20)` (tuyệt đối không quét toàn bộ collection và không ghép `orderBy` gây lỗi thiếu Composite Index; sắp xếp `createdAt` tại client).
    - **Tối ưu Lượt ghi & Vòng đời Tab:** Dùng `arrayUnion(currentUser.id)` khi đánh dấu đã đọc (bỏ qua nếu đã đọc để tốn `0 Write`), dùng `writeBatch` khi bấm *"Đã đọc tất cả"*, cô lập cache theo từng user (`lak_erp_notifications_cache_<userId>`), và tự động tạm ngắt listener khi tab ẩn quá 5 phút (`visibilitychange`).
    - **Hiển thị Audit cho IT Admin ([`NotificationBellPopover.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/core/layout/NotificationBellPopover.jsx)):** Khi `currentUser.role === 'admin'`, hiển thị thanh kiểm toán trên từng thông báo (`Khởi tạo: <actorName> (<actorId>) • Đã đọc: <count>`).
    - **Lưu ý Kiểm thử Playwright E2E với `onSnapshot`:** Khi dùng Playwright kiểm thử các trang có kết nối WebSocket/Firestore `onSnapshot`, luôn dùng `wait_until="domcontentloaded"` thay vì `wait_until="networkidle"`.
16. **Quy Chuẩn Chống Nhảy Layout Lưới Thẻ & Cô Lập Trạng Thái Pending (`Zero-Jitter Grid & Item-Level Pending Invariant`):**
    - Khi tương tác trên từng Card của danh sách (như điểm danh học viên tại `/classroom/:classId`), **BẮT BUỘC cô lập trạng thái Pending theo ID phần tử** (`pendingChanges = { [id]: status }`).
    - Nút bấm của các Card khác không bị ảnh hưởng, không bị disable tập thể.
    - Bọc `React.memo` cho Item Component và `useCallback` cho event handlers để chặn đứng re-render chéo.
    - Cố định chiều cao text 2 dòng (`min-height: 44px; max-height: 44px;`) và Flex Card (`justify-content: space-between; height: 100%;`) để các nút bấm đáy card gióng thẳng hàng 100% ($\Delta y = 0$), bảo đảm `Diff Before vs During = None`.
17. **Quy Chuẩn Soạn Thảo Nhận Xét Sư Phạm & Placeholder Thông Minh (`Clean Placeholder & SimpleEvaluationEditor Invariant`):**
    - **CẤM điền cứng text mẫu vào `value`:** Khi học viên chưa có ghi chú thực tế trong giờ, ô nhận xét bắt buộc là chuỗi rỗng `""` để Giáo viên gõ ngay không cần xóa (backspace).
    - **Gợi ý sư phạm nằm ở `placeholder` mờ:** Câu gợi ý chuẩn mực sư phạm (VI: `Tham gia học tích cực...` / EN: `Actively participated in class...`) hiển thị ở dạng placeholder mờ, biến mất ngay khi giáo viên gõ chữ.
    - **Trình soạn thảo chuyên dụng (`SimpleEvaluationEditor`):** Chiều cao $\ge 140 - 160\text{px}$ (cao gấp 5 lần ô input 32px), tích hợp Bold, Italic, Bullets, Ordered lists, Snippets 1 chạm (🌟 Lời khen, 🔤 Phonics, 🗣️ Tương tác, 📚 BTVN, Clear), và bọc `localEditsRef` chống mất chữ/reset do đồng hồ realtime nhảy giây.
18. **Quy Chuẩn Lịch Sử Đánh Giá 100% Real Database & Đồng Bộ Node Script Localhost (`Evaluation History & DB Parity Invariant`):**
    - **Lịch sử đánh giá thực tế (`EvaluationHistoryDrawer`):** Kết nối trực tiếp 100% Cloud Firestore `session_evaluations` qua `ClassroomRealtimeService.getEvaluationHistory(classId)`. Tuyệt đối cấm tạo hàm sinh dữ liệu mẫu (`buildHistoricalSessions`) giả lập Buổi 1, Buổi 2; lớp chưa có lịch sử bắt buộc hiển thị Empty State trang nhã.
    - **Bảo mật quyền riêng tư học viên (Zero Peer-Data Leakage):** Giáo viên & Giáo vụ được xem toàn bộ học viên cả lớp; Học viên chỉ xem duy nhất tiến trình và nhận xét của chính mình.
    - **Đồng bộ Cơ sở dữ liệu Node Script & Localhost:** Mọi script Node.js chạy trong môi trường phát triển cục bộ (`typeof window === 'undefined'`) tự động kết nối cơ sở dữ liệu `lakeducation-dev`, đồng bộ 100% với Vite trên `127.0.0.1:3000`, chống lỗi lệch database (split-brain).
19. **Quy Chuẩn Xem Trước Học Liệu Đa Định Dạng & Kỷ Luật Chặn Đứng URL Tạm Thời (`Multi-Format Learning Material Preview & Zero Dead Blob: URLs Protocol`):**
    - **Kỷ Luật Chặn Đứng URL Tạm Thời (`Zero Dead Blob: URLs Invariant`):**
      * **TUYỆT ĐỐI CẤM** lưu đường dẫn tạm thời `blob:...` vào cơ sở dữ liệu Firestore hoặc danh bạ khóa học.
      * Liên kết `blob:` chỉ tồn tại trong RAM của phiên trình duyệt hiện tại và sẽ chết (404 / `ERR_FILE_NOT_FOUND`) khi mở ở máy khác hoặc khi làm mới trang. Mọi tài liệu phải dùng link lưu trữ chính thức (Google Drive hoặc Cloud Storage).
      * **Phòng vệ giao diện (Defensive Guardrail):** Trong `MaterialPreviewModal.jsx`, nếu phát hiện tệp mang URL `blob:`, bắt buộc hiển thị thẻ cảnh báo hướng dẫn thay vì mở iframe trắng.
    - **Giao Thức Nhúng Google Drive An Toàn (`Drive Embed Protocol`):**
      * Mọi liên kết Google Drive (`/view`, `/edit`, `?usp=sharing`) bắt buộc chuyển đổi tự động sang `/preview` (`https://drive.google.com/file/d/{fileId}/preview`) để vượt qua rào cản `X-Frame-Options: SAMEORIGIN`.
    - **Tiêu Chuẩn Sư Phạm 4 Định Dạng Học Liệu:**
      * 🎧 **Audio (Nghe phát âm):** Trang bị bộ chọn tốc độ đọc sư phạm (`0.75x` nghe chậm, `1.0x` chuẩn, `1.25x` nhanh) phục vụ học viên ESL luyện nghe phát âm giáo viên bản ngữ; hiển thị sóng âm thanh khi phát.
      * 🖥️ **Slide (Trình chiếu):** Khung tỷ lệ chuẩn `16:9`, tích hợp nút mở rộng **Toàn màn hình** (*Fullscreen*) phục vụ giảng dạy trực tuyến và chiếu tại lớp.
      * 🎬 **Video (Bài học):** Khung 16:9 nhận diện đa nguồn: File MP4 trực tiếp (HTML5 video player), YouTube (`youtube-nocookie.com/embed/{id}`), và Google Drive Video.
      * 📑 **PDF (Giáo trình):** Khung đọc tương tác đầy đủ 220 trang, lật trang, phóng to, thu nhỏ và in ấn.
    - **Công Thái Học Di Động (Mobile Ergonomics):**
      * Tuyệt đối không tràn ngang (`scrollWidth <= innerWidth`).
      * Toàn bộ nút thao tác chân modal (`Mở Tab Mới`, `Tải Về`, `Đóng`) bắt buộc `whiteSpace: 'nowrap'`, chiều cao $\ge 38-40\text{px}$, không bao giờ rớt chữ.
   - **Kỷ Luật Bảo Mật Mật Khẩu Bcrypt Hashing & Di Trú Không Gián Đoạn (Zero-Downtime Bcrypt Invariant):**
     * **Tuyệt đối cấm** lưu mật khẩu dạng plaintext trong Cloud Firestore. Mọi tài khoản mới hoặc đổi mật khẩu phải được băm qua `PasswordHashService.hashPassword()` (`bcryptjs`, 10 salt rounds).
     * **Bảo toàn trải nghiệm người dùng cũ:** Cơ chế so sánh kép trong `PasswordHashService.comparePassword()` và tự động nâng cấp ngầm (`in-flight auto-upgrade`) bảo đảm 100% người dùng cũ đăng nhập bình thường bằng mật khẩu hiện tại mà không cần reset.
     * **Bảo toàn Cụm gia đình:** Khi phụ huynh đăng nhập bằng SĐT có nhiều con, hệ thống đối soát hash của từng con và mở Modal chọn hồ sơ chính xác.
     * **Kiểm toán di trú an toàn:** Mọi script di trú phải sao lưu snapshot kiểm toán (`docs/migration_audit_backup.json`) và vượt qua 6 kịch bản Playwright E2E (Admin, Director, Teacher, Single Student, Family Cluster, Wrong Password Rejection).

---

## ☁️ 4. Kiến Trúc Lưu Trữ Database, Backup, Cắt Dữ Liệu Năm & Hạ Tầng Cloud

- **Tên miền chính thức:** `lakeducation.edu.vn` (Đăng ký tại P.A Việt Nam — CÔNG TY CỔ PHẦN LAK EDUCATION, quản lý DNS qua Cloudflare) & `lakeducation.com` (Squarespace Domains).
- **Tài khoản Google chủ quản Firebase (Firestore + Cloud Functions + Firebase Hosting):** **`vnthietbigarage@gmail.com`** (Cấu hình tại [`src/core/services/firebase.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/firebase.js) — chi tiết chiến lược tại [`docs/DATABASE_AND_BACKEND_STRATEGY.md`](file:///Volumes/DATA/projects/ThiEducation/docs/DATABASE_AND_BACKEND_STRATEGY.md) và [`.agents/rules/06_cloud_and_storage_strategy.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/06_cloud_and_storage_strategy.md)).
  - **Dữ liệu Text & Nghiệp vụ (`Hot Data`):** Lưu trên **Cloud Firestore (`lakeducationdb`)** kết hợp **Firebase Authentication** thật 100% (Google OAuth + Email/Password). Cơ sở dữ liệu và bảng `users` / `user_audit_logs` đã được kết nối và xác thực trực tiếp.
  - **Web Hosting:** Dùng **Google Firebase Hosting** (Miễn phí 10 GB Storage + 360 MB/ngày Data Transfer + SSL tự động).
- **Lưu trữ PDF / Image / Media & Kho Lưu Trữ Lạnh (`Cold Archive`) trên Google Drive (`hosting-store` — Đã kết nối thật 100%):**
  - **Service Class:** [`src/core/services/DriveStorageService.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/DriveStorageService.js)
  - **API Endpoint:** `https://hosting-store-api.phuchungvang.com/api`
  - **App ID (`x-app-id`):** `lakeducation_com`
  - **App Token (`x-app-token`):** `app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe`
  - **Thư mục gốc dự án trên Google Drive (`driveFolderId`):** `1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn` (`https://drive.google.com/drive/folders/1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn`)
  - **Cây thư mục con 6 nhánh đã khởi tạo trên Drive (Tải 1 lần thư mục gốc là lấy trọn bộ):**
    1. `01_DATABASE_BACKUPS/2026` (`1umdw3PpK5js0ZHcYhqw88IZ64ODEmA5F`): Sao lưu toàn bộ Database Firestore (.json)
    2. `02_YEARLY_CUTOFF_ARCHIVES/2025` (`196qivwcZJ8LyMdS-59jSKySe7CrufYKU`): Gói dữ liệu các năm cũ đã cắt theo yêu cầu
    3. `03_TEACHER_CONTRACTS_PAYSLIPS/contracts_pdf` & `payslips_pdf`: File PDF Hợp đồng & Phiếu lương GV/Giáo vụ
    4. `04_STUDENT_HOMEWORKS_PROFILES/homeworks_2026` & `avatars`: File Bài tập học viên nộp & Ảnh đại diện
    5. `05_TUITION_BILLS_INVOICES/2026` (`1Z-yxE9LX4SKZghucVw-E2-cy_iwR1kdP`): Ảnh chụp Bill học phí & Chứng từ kế toán
    6. `06_CLASS_RECORDINGS_MATERIALS/2026` (`1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS`): Tài liệu giảng dạy & Video lớp Zoom
- **Quy tắc Cắt Dữ Liệu Năm Cũ Theo Yêu Cầu (`On-Demand Manual Year Cut-off`):**
  - Tuyệt đối **không** tự động xóa/cắt dữ liệu định kỳ. Chỉ cắt dữ liệu của năm được `admin`/`director` chọn chủ động (ví dụ năm 2027 chọn cắt dữ liệu năm 2025).
  - Khi cắt: Giữ lại Master Data (`users`, `courses`, `classes`, `students`, `contracts`), đóng gói dữ liệu giao dịch (`attendances`, `homeworks`, `payrolls`, `tuitions`) của năm đó thành file `.json` đẩy lên `02_YEARLY_CUTOFF_ARCHIVES/<year>` trên Google Drive (`SystemHealthService.cutOffYearDataToDrive`).

---

## ⚡ 5. Kiểm Tra Build, Quy Trình Deploy & Kỷ Luật Git (`No Unsolicited Git Commit / Push / Deploy`)

1. **Kiểm tra Build bắt buộc (`npm run build`):** Mọi thay đổi code bắt buộc phải chạy lệnh này để tự động tăng `Version 1.2.x • build YYYYMMDDNNv` và đảm bảo không bị gãy build (cả 2 site `landing` và `erp`):
   ```bash
   npm run build
   ```
2. **TUYỆT ĐỐI KHÔNG TỰ Ý COMMIT / PUSH LÊN GIT HOẶC DEPLOY LÊN FIREBASE KHI CHƯA CÓ LỆNH (`No Unsolicited Commit / Push / Deploy`):**
   - Agent **CẤM TUYỆT ĐỐI** tự động chạy `git add`, `git commit`, `git push`, hoặc `firebase deploy` sau khi sửa code nếu Sếp Bảo chưa ra lệnh rõ ràng.
   - Sau khi sửa code, chạy `npm run build` và kiểm thử Phòng QC trên local xong, giữ nguyên trạng thái ở máy local để Sếp Bảo nghiệm thu trước.
3. **QUY TRÌNH 8 BƯỚC BẮT BUỘC KHI CÓ LỆNH DEPLOY TỪ SẾP BẢO (`Strict 8-Step Git-Diff Impact Analysis, Dual-Env E2E & Production Teardown Pipeline`):**
   - Ngay khi Sếp Bảo ra lệnh **"deploy"** (hoặc *"deploy lên firebase"*, *"push và deploy"*), Agent **BẮT BUỘC thực thi tuần tự 8 bước không bỏ sót bước nào**:
     1. **Bước 1 — So Sánh Git Diff, Bóc Tách Tính Năng & Đánh Giá Tác Động (`Git Diff Impact Analysis`):**
        - Chạy lệnh `git diff HEAD` (hoặc so sánh commit gần nhất) để bóc tách chính xác:
          * *Code này đang làm tính năng mới nào? Fix bug ở function/module nào?*
          * *Các component, service hoặc model nào bị ảnh hưởng trực tiếp và gián tiếp?*
          * *Lập ma trận Test Case & Integration Test tương ứng cho chức năng thay đổi và các phân hệ liên đới.*
     2. **Bước 2 — Bật Phòng QC Test E2E & Integration Test Trên Môi Trường DEV (`DEV E2E & Integration Test`):**
        - Chạy kiểm thử tự động toàn diện các Test Case đã lập trên `localhost:3000` (môi trường `lakeducation-dev`) trên cả Desktop (`1366x850`) và Mobile (`390x844`).
        - Khẳng định 100% chức năng mới và bug fix hoạt động hoàn hảo, không có lỗi hồi quy (zero regression).
     3. **Bước 3 — Xóa Sạch Dữ Liệu Test Trên DEV (`DEV Zero Test-Data Residue Teardown`):**
        - Xóa sạch 100% dữ liệu thử nghiệm, cờ cache sinh ra trong quá trình test DEV, khôi phục trạng thái sạch.
     4. **Bước 4 — Kiểm Tra Đồng Bộ Schema Dữ Liệu Cũ & Bảo Vệ Database PROD (`Pre-deploy Database Migration Check`):**
        - Rà soát: Tính năng mới / Bug fix có đòi hỏi các Document cũ trên PROD phải có thêm field mới nào không?
        - **Kỷ luật cốt lõi (Không đưa dữ liệu DEV lên PROD):** `firebase deploy` tuyệt đối không đẩy document dữ liệu. Nếu cần bổ sung field cho document cũ trên PROD, phải dùng script migration tại `scripts/migrations/` chạy trực tiếp trên các document thật của PROD với cờ `{ merge: true }`, tuyệt đối **CẤM** export từ DEV rồi import vào PROD.
        - Nếu có migration làm thay đổi cấu trúc dữ liệu PROD: Bắt buộc tạo bản backup nhanh trước khi chạy.
     5. **Bước 5 — Deploy Firestore Security Rules & Composite Indexes Lên PROD (`Deploy Security & Indexes First`):**
        - Nếu tính năng mới có thêm Collection mới hoặc câu truy vấn lọc/sắp xếp phức tạp, phải deploy Rules và Indexes lên PROD trước khi đẩy code Web:
          ```bash
          firebase deploy --only firestore:rules,firestore:indexes --project prod
          ```
        - Bước này đảm bảo Firestore PROD sẵn sàng mở quyền và index, chặn đứng 100% lỗi `Missing or insufficient permissions` hoặc `The query requires an index`.
     6. **Bước 6 — Build Tăng Version & Mã Build Ngày (`npm run build`):** Tự động tăng `Version 1.2.x` và `build YYYYMMDDNNv` qua `scripts/bump_build_version.js`, đóng gói sạch `dist/landing` và `dist/erp`.
     7. **Bước 7 — Git Commit, Tag & Push (`git commit` + `git tag` + `git push`):** Commit toàn bộ code sạch kèm thông điệp chuẩn version (`release: Version 1.2.x • build YYYYMMDDNNv`), gắn thẻ Git Tag (`v1.2.x-YYYYMMDDNNv`) và đẩy (`git push origin main --tags`) lên kho lưu trữ Git.
     8. **Bước 8 — Deploy Hosting & Kiểm Thử E2E Trực Tiếp Trên PROD Có Tiền Tố, Chụp Ảnh Minh Chứng & Xóa Sạch 100% Dữ Liệu Test (`PROD E2E Evidence & Zero-Residue Teardown`):**
        - Chạy `firebase deploy --only hosting` lên `lakeducation.edu.vn` & `erp.lakeducation.edu.vn`.
        - **Kiểm thử trực tiếp trên Production thật:**
          * Tạo dữ liệu test bắt buộc có tiền tố chuẩn: **`[TEST:DEPLOY:YYYYMMDD]`** (ví dụ: `[TEST:DEPLOY:20261112] Lớp kiểm thử sau release`).
          * Chạy kiểm thử Playwright tự động thực tế trên domain PROD (`https://erp.lakeducation.edu.vn` và `https://lakeducation.edu.vn`).
          * **Chụp ảnh màn hình lưu bằng chứng (Evidence Screenshots)** vào `test-results/` xác nhận tính năng chạy mượt mà trên Production thật.
          * **DỌN SẠCH 100% DỮ LIỆU TEST TRÊN PROD NGAY LẬP TỨC:** Xóa sạch toàn bộ document/bản ghi có tiền tố `[TEST:...]` vừa tạo trên Firestore PROD, xác nhận lại `remainingTestDocs === 0`.
          * Xuất trình Báo cáo Release, Ảnh Evidence và Biên bản Nghiệm thu Phòng QC cho Sếp Bảo.

---

## 🧪 6. Kỷ Luật Bắt Buộc Của Phòng QC & IT Kiểm Thử Trước Khi Bàn Giao (Mandatory QC & IT Audit Protocol)

> **Quy định bất biến (Chi tiết tại [`.agents/rules/07_qc_and_it_audit_protocol.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/07_qc_and_it_audit_protocol.md)):**  
> Tuyệt đối **CẤM** báo cáo "Đã hoàn thành" hoặc "Đã sửa xong" cho Sếp Bảo nếu chưa qua **Quy trình Kiểm thử 4 Bước** của Phòng QC trên trình duyệt thật (Desktop & Mobile).

1. **Học Nghiệp Vụ Trước Khi Test:** Phải nắm vững luồng dữ liệu (State $\longleftrightarrow$ Service $\longleftrightarrow$ Storage/DB) và ma trận 6 Roles RBAC của tính năng trước khi kiểm thử.
2. **Kỷ Luật "Zero-Refresh & 0ms State Update":** Mọi thao tác Thêm, Sửa, Xóa, Bật/Tắt trạng thái **BẮT BUỘC cập nhật ngay tức thì trên giao diện (0ms)**. Tuyệt đối cấm lỗi sơ đẳng: Bấm Xóa / Bật trạng thái mà phải F5 trang mới thấy thay đổi.
3. **Bảo Toàn Trạng Thái Qua F5 (Persistence Integrity):** Tải lại trang (F5) dữ liệu vẫn phải được bảo toàn chuẩn xác; cấp độ hoặc dữ liệu đã xóa tuyệt đối không được tự ý "sống lại" ngầm.
4. **Kiểm Thử Trình Duyệt Thật Song Song Desktop & Mobile (Playwright E2E):**
   - **Mặc Định 100% Chạy Ngầm (`headless=True` + `--headless=new`):** Mọi thao tác kiểm thử, điền form, quét dữ liệu của Phòng QC đều chạy ngầm tuyệt đối dưới nền, tự động chụp ảnh màn hình lưu minh chứng mà không mở cửa sổ làm phiền Sếp Bảo.
   - **Chỉ Bật Hiển Thị Lên Màn Hình (`headless=False` tại `80, 60`):** Khi có lệnh yêu cầu rõ ràng của Sếp Bảo (ví dụ: *"bật trình duyệt lên"*) hoặc khi cần Sếp Bảo trực tiếp nhập liệu/xác thực bảo mật.
   - **Desktop (`1280x800`):** Kiểm tra trọn vẹn luồng tương tác thực tế, Form submit, Xóa tức thì, Grid 50/50 thẳng tắp, không có Card rỗng trơ trọi ở đáy trang (Orphaned Card).
   - **Mobile (`390x844`):** Đảm bảo Mobile-First, nút bấm $\ge 44\text{px}$, không bị tràn ngang (`zero overflow-x`), nút hành động ở đáy màn hình hoặc Sticky Action Bar.
5. **Biên Bản Nghiệm Thu Bắt Buộc:** Mọi câu trả lời báo cáo kết quả đều phải đính kèm bảng nghiệm thu kết quả kiểm thử của Phòng QC.
6. **Bộ Kiểm Toán Kỹ Thuật Tự Động 8 Chỉ Số (`scripts/qc_layout_auditor.py` — Đo đạc tự động bằng code, tuyệt đối cấm để Sếp Bảo tự đi tìm lỗi):**
   - `ASSERT Zero Overflow-X`: `scrollWidth <= innerWidth` trên cả Desktop (1366px) và Mobile (390px), tràn dù 1px cũng đánh trượt FAIL ngay lập tức.
   - `ASSERT No Broken Words`: Chuỗi tiền tệ/thời lượng (`2.500.000 đ/tháng`) bắt buộc `whiteSpace: 'nowrap'`, cấm rớt chữ (`đ/th` + `áng`).
   - `ASSERT Grid Breathing Room`: Desktop Card chia 3 cột (`Col lg={8}` $\ge 300\text{px}$), cấm chia 4 cột hẹp 231px gây ép nghẹt nội dung và để trống trơ trọi 50% màn hình.
   - `ASSERT Grid Harmonization 100% Width`: Trên Mobile, mọi filter (Input, Select) bắt buộc `width: '100%', height: 40, borderRadius: 8`, cấm hardcode `260px`, `220px`, `200px` tạo bậc thang so le.
   - `ASSERT Touch Target Ergonomics`: Nút chính di động có chiều cao $\ge 38-40\text{px}$; nút xóa icon $\ge 32\times 32\text{px}$.
   - `ASSERT Tabs Cleanliness`: Tinh gọn nhãn Tab trên Mobile để hiển thị đầy đủ, cấm bị Ant Design cắt thành dấu `...`.
   - `ASSERT Header Viewport Protection`: Header di động $\le 390\text{px}$, nhãn Admin rút gọn `ADM001`, cấm để tràn làm co rúm logo.
   - `ASSERT Full-Width Drawers`: Drawer trên di động tự động co giãn `width={isMobile ? '100%' : 640}`, các nút footer dàn đều để dễ bấm ngón tay cái.

---

## 🔄 7. Quy Trình Chuẩn Tiếp Nhận Bug & Phát Triển Tính Năng (Mandatory Change Lifecycle)

> **Nguyên tắc điều hành:** Mỗi yêu cầu được chia thành hai pha độc lập: **Phân tích/đề xuất** và **thực hiện thay đổi**. Agent được phép điều tra, tái hiện, đọc mã và chạy kiểm tra không làm thay đổi dữ liệu khi nhận yêu cầu. Chỉ được sửa mã, ghi dữ liệu, tạo dữ liệu thử hoặc thay đổi tài liệu nghiệp vụ sau khi Sếp Bảo nói rõ **“fix”**, **“thực hiện”**, **“làm tính năng”** hoặc một lệnh tương đương.

### 7.1. Quy Trình Xử Lý Lỗi (Bug Fix Lifecycle)

1. **Tiếp nhận & phân loại:** Ghi nhận chức năng, vai trò đăng nhập, môi trường, các bước tái hiện, kết quả thực tế, kết quả mong đợi và mức độ ảnh hưởng. Nếu thiếu dữ kiện, nêu chính xác dữ kiện cần bổ sung; không tự suy đoán hành vi nghiệp vụ.
2. **Tái hiện lỗi (Reproduce):** Tái hiện trên trình duyệt thật với đúng role và dữ liệu hợp lệ; lưu ảnh màn hình, log kiểm thử và điều kiện tái hiện. Nếu không tái hiện được, báo cáo rõ phạm vi đã thử, không tuyên bố nguyên nhân hay sửa phỏng đoán.
3. **Phân tích nguyên nhân gốc:** Lần theo đầy đủ luồng `UI → hook/controller → service → Firestore/storage → UI`; xác định file, điều kiện kích hoạt và nguyên nhân gốc, phân biệt triệu chứng với nguyên nhân.
4. **Đề xuất giải pháp:** Nêu giải pháp nhỏ nhất, an toàn nhất; phạm vi file dự kiến; phương án kiểm thử; và phương án khôi phục nếu thay đổi thất bại. Không tự ý sửa trong pha này.
5. **Đánh giá tác động bắt buộc:** Thực hiện đủ 3 bước tại Mục 2.6: xác định phạm vi ảnh hưởng, đánh giá hồi quy/breaking change, và xin ý kiến trước khi đụng vào `src/shared/`, `src/core/`, schema Firestore, route hoặc module khác.
6. **Chỉ khi được yêu cầu fix:** Thực hiện đúng giải pháp đã phê duyệt, giữ thay đổi ở mức tối thiểu và tuân thủ kiến trúc module, RBAC, i18n, mobile-first và dữ liệu thực.
7. **Kiểm thử lại & nghiệm thu:** Retest ca lỗi gốc, các ca biên và ca âm; chạy unit/component/layout/integration/E2E phù hợp; kiểm tra Desktop, Mobile, role liên quan, trạng thái sau F5 và các luồng bị tác động. Bắt buộc chạy `npm run build` khi có sửa mã.
8. **Báo cáo bàn giao:** Chỉ báo “đã sửa xong” khi toàn bộ kiểm thử đạt. Báo cáo phải gồm: nguyên nhân gốc, giải pháp, danh sách file thay đổi, ca kiểm thử/kết quả, ảnh minh chứng, dữ liệu thử đã xóa và xác nhận các chức năng ngoài phạm vi được bảo toàn.

### 7.2. Quy Trình Phát Triển Tính Năng (New Feature Lifecycle)

1. **Đánh giá toàn diện:** Làm rõ mục tiêu nghiệp vụ, người dùng/role, luồng chính, ngoại lệ, dữ liệu vào-ra, phân quyền, trạng thái, thông báo, yêu cầu i18n và tiêu chí chấp nhận. Không dùng thuật ngữ kỹ thuật trong UI người dùng.
2. **Đánh giá tác động:** Lập ma trận ảnh hưởng tới module hiện tại, routes, shared/core, Firestore, role, dữ liệu cũ và tích hợp. Áp dụng đầy đủ 3 bước impact assessment tại Mục 2.6 trước bất kỳ thay đổi liên mô-đun hoặc dùng chung nào.
3. **Quyết định kiến trúc:** Ưu tiên tái sử dụng component, utility và service dùng chung đã có. Nếu tính năng là một miền nghiệp vụ độc lập, có lifecycle/dữ liệu/quyền riêng, hoặc làm module hiện tại phình vượt trách nhiệm, phải đề xuất module mới theo cấu trúc 5 lớp trước khi code. Mỗi sub-feature vẫn phải có component và service riêng.
4. **Tài liệu nghiệp vụ sống:** Trước khi thực hiện, tạo hoặc cập nhật `docs/features/<feature-slug>.md`. Tài liệu phải có: mục tiêu và phạm vi; actor/RBAC; quy tắc nghiệp vụ; dữ liệu và trạng thái; luồng chính/ngoại lệ; tiêu chí chấp nhận; quyết định không thuộc phạm vi; liên kết test/evidence. Phải có sơ đồ Mermaid tối thiểu cho luồng nghiệp vụ; dùng thêm sơ đồ trạng thái hoặc dữ liệu khi cần. **Mọi yêu cầu thay đổi tính năng sau này bắt buộc cập nhật lại chính tài liệu này trong cùng lần bàn giao.**
5. **Thiết kế kiểm thử trước khi code:** Từ tiêu chí chấp nhận, viết danh sách test case có ID và điều kiện tiền đề. Bao phủ tối thiểu: unit/service, component/UI, validation và lỗi, RBAC, i18n, responsive/layout Desktop + Mobile, persistence/F5, integration với service/Firestore và E2E luồng chính. Ca không áp dụng phải ghi rõ lý do.
6. **Thực hiện khi đã được giao làm:** Phát triển đúng tài liệu/thiết kế được duyệt; giới hạn phạm vi thay đổi; không refactor hoặc sửa các chức năng khác ngoài yêu cầu nếu chưa có chấp thuận rõ ràng.
7. **Xác minh tích hợp & bàn giao:** Chạy đầy đủ bộ test đã thiết kế, `npm run build`, kiểm toán QC tại Mục 6 và kiểm tra các tích hợp/role bị ảnh hưởng. Cập nhật tài liệu nghiệp vụ để khớp chính xác hành vi cuối cùng; báo cáo tính năng, phạm vi file, kết quả test, ảnh minh chứng, rủi ro còn lại (nếu có) và xác nhận bảo toàn phần ngoài phạm vi.

### 7.3. Kỷ Luật Dữ Liệu Kiểm Thử, Ảnh Minh Chứng & Dọn Dẹp (Zero Test Residue)

1. **Định danh bắt buộc:** Mọi dữ liệu do Agent/QC tạo (tên, mã, ghi chú, email thử, tệp thử, bản ghi Firestore, local/session storage) phải bắt đầu bằng tiền tố dễ truy vết: **`[TEST:<ticket-or-feature>:<YYYYMMDD>]`**. Ví dụ: `[TEST:class-enrollment:20261112] Lớp kiểm thử`.
2. **Cấm dùng dữ liệu nghiệp vụ thật:** Không sửa, xóa hoặc tái sử dụng bản ghi của học viên/cán bộ/lớp học thật để kiểm thử. Dữ liệu test phải có quan hệ riêng, tối thiểu và có thể xóa an toàn.
3. **Minh chứng trước dọn dẹp:** Sau khi chạy test, chụp ảnh các điểm kiểm tra quan trọng (Desktop và Mobile khi có UI); lưu theo thư mục tác vụ trong `test-results/` hoặc vị trí test hiện hành, với tên gắn ticket/feature và thời gian. Không đưa dữ liệu nhạy cảm vào ảnh/báo cáo.
4. **Teardown bắt buộc:** Ngay sau khi đã lấy minh chứng, xóa toàn bộ dữ liệu có tiền tố `[TEST:...]`, tệp tải lên, các quan hệ phụ thuộc và cờ/cache được tạo trong lần test; sau đó truy vấn hoặc kiểm tra lại để xác nhận không còn dư liệu test. Không xóa bất kỳ dữ liệu thật nào.
5. **Bằng chứng trong báo cáo:** Mỗi báo cáo phải ghi: tiền tố đã dùng, danh sách loại dữ liệu đã tạo, đường dẫn ảnh minh chứng, cách/xác nhận dọn dẹp và kết quả cuối cùng là **“0 test residue”**. Nếu không thể dọn dẹp do giới hạn quyền hoặc lỗi hạ tầng, phải dừng bàn giao, báo rõ bản ghi còn lại và xin hướng dẫn.
6. **Môi trường local tự động cô lập:** Khi chạy trên `localhost`, hệ thống tự động kết nối vào project DEV (`lakeducation-dev`) hoặc Firebase Local Emulator (`demo-lakeducation`) theo [`docs/quality/LOCAL_TEST_ENVIRONMENT.md`](docs/quality/LOCAL_TEST_ENVIRONMENT.md), tuyệt đối không ghi dữ liệu test vào Production. Chỉ domain production (`lakeducation.edu.vn`, `erp.lakeducation.edu.vn`) mới kết nối dữ liệu thật; nhận diện môi trường DEV qua thanh banner màu xanh lá ở đỉnh trang.
7. **Clone Production sang Development có kiểm soát & Tối ưu chi phí (3 Phương án):** Khi cần tái hiện bug bằng snapshot dữ liệu thật, Agent bắt buộc tuân thủ [`docs/quality/PROD_TO_DEV_CLONE_RUNBOOK.md`](docs/quality/PROD_TO_DEV_CLONE_RUNBOOK.md). Luôn áp dụng thứ tự ưu tiên:
   - *Ưu tiên 1 (Targeted Scope - 0đ):* Chạy `node scripts/sync_target_doc.js --doc=<col>/<id>` hoặc `--col=<col>` để kéo đúng bản ghi bị lỗi về DEV trong 500ms, không tốn chi phí GCS.
   - *Ưu tiên 2 (Test phá hủy - 0đ):* Chạy Local Emulator (`npm run dev:emulator`).
   - *Ưu tiên 3 (Full Snapshot qua GCS):* Chỉ dùng khi release lớn, bắt buộc có manifest xác nhận và kiểm tra source/target rõ ràng; tuyệt đối không deploy hoặc đồng bộ dữ liệu DEV ngược về Production.

### 7.4. Mẫu Báo Cáo Bắt Buộc

| Giai đoạn | Nội dung tối thiểu phải báo cáo |
| --- | --- |
| Phân tích bug | Khả năng tái hiện, nguyên nhân gốc, giải pháp đề xuất, impact/rủi ro, phạm vi file dự kiến, chờ lệnh fix (nếu chưa có) |
| Hoàn thành bug | Ca lỗi gốc và regression đã PASS, file thay đổi, build/QC, ảnh, test data cleanup, phạm vi ngoài thay đổi được bảo toàn |
| Đề xuất feature | Mục tiêu/actor/acceptance criteria, kiến trúc/module, impact, tài liệu nghiệp vụ và sơ đồ, test plan, các điểm cần duyệt |
| Hoàn thành feature | Hành vi đã triển khai, file/tài liệu cập nhật, test matrix PASS/không áp dụng, build/QC, ảnh, cleanup và rủi ro còn lại |

### 7.5. Cơ Chế Ghi Nhớ Lỗi & Ngăn Tái Phát (Bug Prevention Memory)

> **Mục tiêu:** Agent không được chỉ ghi nhận một lỗi đã sửa trong hội thoại. Mọi lỗi có khả năng lặp lại phải được chuyển thành tri thức tồn tại trong repository và một kiểm thử tự động hoặc kiểm tra lặp lại được.

1. **Nguồn tri thức trung tâm:** Dùng [`docs/quality/BUG_REGISTRY.md`](docs/quality/BUG_REGISTRY.md) làm danh mục lỗi đã xử lý. Trước khi phân tích, code hoặc fix một tính năng, Agent phải tìm trong registry theo module, chức năng và từ khóa nghiệp vụ liên quan.
2. **Khi nào bắt buộc ghi nhận:** Với mọi bug mức L2 trở lên, hoặc bug L1 đã từng lặp lại, Agent bắt buộc bổ sung/cập nhật một dòng registry trong cùng thay đổi. Lỗi hiển thị thuần túy, một lần, không có pattern tái phát có thể chỉ ghi trong báo cáo bàn giao.
3. **Nội dung tối thiểu của một bản ghi:** ID (`BUG-YYYYMMDD-XXX`), module/phạm vi, triệu chứng ngắn, nguyên nhân gốc/pattern, guardrail phòng ngừa, đường dẫn test regression, trạng thái và version/build đã kiểm chứng. Không đưa PII, token, dữ liệu Firestore thật, lỗi raw hay thông tin bí mật vào registry.
4. **Regression là bắt buộc:** Một bug chỉ được coi là đã phòng ngừa tái phát khi có ít nhất một trong các biện pháp sau, ưu tiên theo thứ tự: (a) test tự động unit/service/component/E2E; (b) kiểm tra lặp lại được trong QC script; (c) trường hợp chưa tự động hóa được thì có test case manual định danh rõ, điều kiện tiền đề và bằng chứng. Registry không thay thế test.
5. **Guardrail trong code:** Nếu nguyên nhân có thể tái diễn ở từ hai nơi trở lên, Agent phải đề xuất đưa guardrail vào utility, base service, component chuẩn hoặc rule phù hợp. Nếu guardrail ảnh hưởng `src/shared/`, `src/core/`, RBAC, Firestore Rules hoặc nhiều module, phải dừng và xin duyệt theo Mục 2.6 trước khi thay đổi.
6. **Không làm phình quy trình:** Không tạo tài liệu dài cho từng bug. Registry giữ dạng bảng ngắn; chỉ tạo tài liệu chi tiết tại `docs/quality/bugs/<bug-id>.md` khi là lỗi L3/L4, có dữ liệu/migration/phân quyền nhạy cảm hoặc cần sơ đồ để tái hiện.
7. **Điều kiện đóng bug:** Báo cáo hoàn thành phải ghi ID registry (nếu áp dụng), guardrail đã thêm, lệnh/ca regression đã PASS và kết quả retest lỗi gốc. Nếu chưa thể tạo regression test, phải nêu lý do, ca manual thay thế và rủi ro còn lại; không được tuyên bố đã loại bỏ hoàn toàn nguy cơ tái phát.

---

## 🏫 11. Quy Chuẩn Vận Hành Lớp Học 3 Tab, Soạn Giáo Án Đa Buổi & Bảo Mật Ghi Chú Sư Phạm (AS05 G1 Standard)

Áp dụng chuẩn hóa theo phân hệ vận hành lớp học McGraw-Hill Wonders (`AS05 G1`):
1. **Kiến trúc 3 Tab Hợp nhất Tại `/classroom/:classId`**:
   - **Tab 1 (`seating`): Sơ đồ lớp & Note nhanh**:
     * Tích hợp nút `[📝 Note]` trực tiếp trên từng bàn học sinh: Giáo viên 1 chạm chọn các tag sư phạm (`🌟 Đọc to rõ`, `🗣️ Phát biểu tốt`, `🔤 Phát âm cần sửa`, `🧩 Đặt câu S-V-O`, `⚠️ Cần tập trung`) hoặc gõ nhận xét nhanh; tự động hiển thị huy hiệu `[Đã note]` và trích đoạn ghi chú.
     * Chấm sao tương tác trực tiếp (`⭐ 1–5 Stars`) ngay trên bàn học sinh.
   - **Tab 2 (`curriculum`): Soạn giáo án đa buổi & Kho học liệu**:
     * Thanh Timeline Pills các buổi học (*Buổi 1, 2, 3, 4, 5...*).
     * Nạp nhanh mẫu giáo trình Wonders G1 (`Essential Question`, `Anchor Text`, `Phonics`, `High-Frequency Words`), sao chép từ buổi trước, đính kèm link Google Slides và chọn trạng thái `🟢 Sẵn Sàng (Ready)` hoặc `✏️ Bản Nháp (Draft)`.
     * **Kỷ Luật Bảo Mật Sư Phạm Bất Biến (Strict Pedagogy Security Invariant)**:
       - Học viên được xem bài đọc cần chuẩn bị trước (`studentPrep`: trang sách *Reading/Writing Companion, Decodable*) và bài tập về nhà (`homework`).
       - **TUYỆT ĐỐI 100% STRIP KHỎI DOM & GIẤU TOÀN BỘ GHI CHÚ NỘI BỘ (`teacherNotes`) và các buổi học trạng thái `DRAFT` đối với tài khoản Học viên (`ASSERT FALSE: teacherNotes not in DOM`)**.
       - Học viên không thấy các nút chỉnh sửa/soạn giáo án.
     * **Kho Học Liệu Khóa Học Kế Thừa Tự Động (Course Vault Auto-Inheritance)**:
       - Khi Giáo vụ tải tài liệu/Google Drive lên Khóa học (`courses/{courseId}`), toàn bộ các lớp học, giáo viên và học viên trực thuộc đều **tự động kế thừa và tải được tài liệu (0ms đồng bộ)** mà không phải upload lặp lại ở từng lớp.
   - **Tab 3 (`evaluation`): Đánh giá sau buổi học & Chăm sóc PH**:
     * Tự động điền (Pre-fill) số sao và nhận xét từ các ghi chú nhanh trong giờ học. Nếu đã chấm sao trong giờ mà chưa gõ comment, hệ thống tự động fallback lấy nội dung ghi chú nhanh để không bao giờ bị rỗng.
     * Nút `[Zalo PH]` dành cho Giáo vụ: Mở pop-up mẫu tin nhắn đã định dạng chuẩn (Tên bé, ngày học, số sao ⭐⭐⭐⭐⭐, nhận xét giáo viên, bài tập về nhà) kèm nút mở thẳng liên kết `https://zalo.me/<SĐT_Phụ_Huynh>`.
     * Dành cho Học viên: Hiển thị duy nhất "Phiếu Nhận Xét Buổi Học Dành Cho Con" (Student Report Card) với số sao, lời khen và bài tập về nhà.
2. **Kỷ Luật Chống Re-render Làm Mất Dữ Liệu Gõ Do Timer Đồng Hồ (High-Frequency Clock Input Protection Invariant)**:
   - Trong các màn hình có bộ đếm thời gian thực (clock nhảy mỗi 1s như `useClassroomClock`):
     * Mọi form, bảng hoặc ô nhập liệu **BẮT BUỘC** phải có cơ chế bảo vệ văn bản người dùng đang gõ bằng `useRef` (ví dụ: `localEditsRef`).
     * Tuyệt đối không để `useEffect` gọi `setState` đè lên giá trị người dùng đang gõ khi timer nhảy chu kỳ.
     * Các ô nhận xét sư phạm phải sử dụng `<Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} maxLength={1000} />` thay vì thẻ `<Input>` đơn dòng gây hẹp tầm nhìn và tạo cảm giác kẹt chữ.
     * Bọc `useMemo` với dependency hạt nhân (`presence`, `quickNotes`, `studentEvaluations`) cho các props truyền vào modal để triệt tiêu re-render thừa.
3. **Kỷ Luật Kiểm Thử Lớp Học Có Lịch Học Cố Định (Session Test Fixture Discipline)**:
   - Khi kiểm thử tự động Playwright với các lớp học có lịch học cố định theo tuần, sử dụng script Node.js (`scripts/temp_enable_lh005_session.js` / `scripts/temp_restore_lh005_session.js`) để tạm mở phiên 24/7 và **bắt buộc phục hồi 100% lịch học ban đầu trong khối `finally:` (Zero Test Residue)**.
4. **Kỷ Luật Buổi Học Chưa Diễn Ra & Khóa Đánh Giá Sư Phạm (Upcoming Session Invariant)**:
   - Khi một lớp học hoặc buổi học chưa diễn ra (`now < session.start` hoặc trước ngày khai giảng `startDate`):
     * Tuyệt đối **CẤM** đặt fallback cứng số thứ tự buổi (như `|| 3`). Bắt buộc tính toán động thứ tự buổi dựa trên `generateClassSessionDates(cls)`.
     * Tuyệt đối **CẤM** hiển thị nhãn `(Hôm nay)` / `(Today)` trên timeline nếu ngày hiện tại không có lịch học. Khi chưa khai giảng, mặc định chọn Buổi 1 (ngày khai giảng) để chuẩn bị bài trước.
     * **Khóa toàn bộ tính năng đánh giá học viên sau giờ:** Các control đánh giá (chấm sao `Rate`, nhận xét học viên `textarea`, nút Lưu toàn bộ `btn-save-all-evaluations`) bắt buộc phải ở trạng thái `disabled=true`.
     * **Chuẩn hiển thị Banner thông báo:** Banner giải thích lý do khóa phải nêu rõ ngày, giờ bắt đầu dự kiến của buổi học và **TUYỆT ĐỐI KHÔNG CHỨA CỤM TỪ "Zalo phụ huynh"**.
5. **Kế Thừa 100% Kho Giáo Trình Gốc Của Khóa Học & Zero Dummy Links (Course Vault Inheritance Invariant)**:
   - Kho giáo trình trong lớp học (`curriculum-vault`) kế thừa động 100% từ Khóa học cấp cha (`courses/<courseId>`), gồm sách giáo khoa cốt lõi (`curriculumTextbooks`) và tài liệu số (`courseMaterials`).
   - Tuyệt đối **CẤM** khai báo mảng link tĩnh hoặc link mẫu dummy (như chèn link Grade 1 vào lớp Grade 5).
   - Dọn sạch 100% dữ liệu test residue trong Firestore sau khi kiểm thử tự động (`Zero Test-Data Residue`).
6. **Soạn Giáo Án Thông Minh Theo Thời Khóa Biểu & Simple Objectives Editor**:
   - Khi soạn/chỉnh sửa giáo án, hợp nhất "Khung Bài Học (Unit & Week)" và "Ngày Giảng Dạy Dự Kiến" thành **1 ô Dropdown TKB thông minh duy nhất** (`select-schedule-session`) sinh tự động từ thời khóa biểu của lớp. Khi chọn buổi, hệ thống tự động điền đồng bộ `sessionIndex`, `date`, `unitWeek`.
   - Trình soạn thảo mục tiêu bài học chuẩn sư phạm `SimpleObjectivesEditor.jsx` tích hợp các phím tắt 1-chạm nạp nhanh cấu trúc McGraw-Hill Wonders (`🎯 Question`, `📖 Reading`, `🔤 Phonics`, `💬 Words`, `🧩 Grammar`), bộ đếm số lượng mục tiêu/dòng thời gian thực và thanh công cụ Bold/Italic/Bullet trực quan.
7. **Quy Chuẩn Nhận Diện Phòng Học Trực Tuyến Động & Khóa Nút Truy Cập Theo Thời Gian Thực (Dynamic Meeting Platform & 15m Time-Locked Access Invariant)**:
   - **Triệt Tiêu Hardcode Thương Hiệu (Zero Hardcoded Platform Brand Invariant)**:
     * Tuyệt đối **CẤM** viết cứng tên nền tảng (như `"Zoom"`, `"Vào Zoom"`, `"🎥 Vào Lớp Học Zoom Ngay"`) trên bất kỳ nút bấm, tiêu đề hay nhãn phòng học nào.
     * Bắt buộc 100% sử dụng tiện ích nhận diện động `detectMeetingPlatform(url)` và huy hiệu `<MeetingPlatformBadge url={url} />` từ `src/shared/utils/meetingPlatformUtils.jsx` để tự động render đúng tên (`Google Meet`, `Zoom Meeting`, `Microsoft Teams`, `Phòng Trực Tuyến`), icon chính hãng và màu sắc thương hiệu.
   - **Kỷ Luật Khóa Phòng Học Theo Thời Gian Thực (15-Minute Threshold Time-Locked Access Invariant)**:
     * Trạng thái phòng học trực tuyến phải được kiểm soát chặt chẽ theo thời gian thực qua `findClassSession(cls, now)` và `getSessionTimer(session, now)`:
       - **Khi buổi học chưa đến giờ (còn > 15 phút):** Nút **BẮT BUỘC DISABLED** với nhãn `Phòng [Platform] Mở Trước 15 Phút` (`[Platform] Opens 15m Before`), kèm tooltip giải thích rõ ràng phòng sẽ tự động mở trước 15 phút.
       - **Khi trong vòng 15 phút trước giờ học:** Nút tự động chuyển trạng thái `primary` xanh sáng với nhãn `🎥 Vào Lớp Học [Platform] Ngay` (`🎥 Join [Platform] Now`).
       - **Khi buổi học đang diễn ra (`timer.state === 'live'`):** Nút hiển thị `🔴 Vào Lớp [Platform] (Đang Diễn Ra)` (`🔴 Join Live [Platform]`).
       - **Khi chưa cập nhật link:** Nút `disabled` với nhãn `Chưa Có Link Phòng Học` (`Meeting Link Not Available`).
   - **Ưu Tiên Ca Học Gần Nhất Trên Banner (Earliest Session Priority)**:
     * Mọi banner ca học tiếp theo phải lấy từ ca học diễn ra sớm nhất theo thời gian thực (`sortedClasses[0]` dựa trên `sA.start - sB.start`), tuyệt đối không đọc index `[0]` tĩnh của mảng lớp.
   - **Kỷ Luật Phòng Vệ Null-Safety Trong Utility Functions**:
     * Mọi hàm phân tích lớp học như `findClassSession(cls, now)` bắt buộc kiểm tra `if (!cls) return null;` ở dòng đầu tiên để tránh lỗi sập DOM runtime.


8. **Quy Chuẩn Cửa Sổ Hậu Buổi Học 12 Giờ, Bộ Chọn Đánh Giá Bù & Nhiệm Vụ Dashboard 1-Chạm (Post-Session Evaluation Window, Retroactive Selector & Dashboard Tasks Invariant)**:
   - **Cửa Sổ Hậu Buổi Học 12 Giờ (`12-Hour Grace Evaluation Window`):**
     * Sau khi buổi học trực tuyến kết thúc (ví dụ sau 21:10), hệ thống **TUYỆT ĐỐI KHÔNG KHÓA ĐÁNH GIÁ NGAY LẬP TỨC**. Cửa sổ chấm sao, nhập nhận xét sư phạm và upload video bài giảng tự động duy trì mở thêm **12 giờ (`12 * 3600 * 1000 ms`)** tính từ thời điểm tan lớp.
   - **Bộ Chọn Buổi Học & Đánh Giá Bù (Retroactive Session Selector):**
     * Dropdown bộ chọn buổi học thông minh tại đầu Tab 3 (`SessionEvaluationPanel`) phân loại rõ các trạng thái: `✅ Đã đánh giá (avg ⭐)`, `⚠️ Hôm nay (Chưa ĐG)`, `⚠️ Quên đánh giá (Đánh giá bù)`, `🔒 Chưa diễn ra`.
     * Cho phép giáo viên đánh giá bù bất kỳ buổi học nào trong quá khứ bị sót, lưu chuẩn xác vào Firestore `session_evaluations/LIVE_<classId>_<sessionStart>`.
   - **Giao Diện Adaptive Mobile-First:**
     * Desktop ($\ge 992\text{px}$) hiển thị Table kèm Quick Tags; Mobile (< 992px) tự động chuyển sang Danh sách thẻ học viên (Card List) kèm Sticky Bottom Action Bar với nút lớn `[💾 Lưu Buổi X]`, assert `Zero Overflow-X` (`scrollWidth <= innerWidth`).
   - **Hệ Thống Nhiệm Vụ Dashboard & Deep Navigation 1-Chạm:**
     * **Giáo viên (`TeacherEvaluationTasksCard`):** Danh sách buổi học chưa hoàn tất đánh giá kèm nút `[Evaluate Now ↗]` chuyển hướng trực tiếp vào URL `/classroom/<id>?tab=evaluation&sessionDateMs=<timestamp>`, tự động active Tab 3 và nạp buổi cần chấm điểm.
     * **Giáo vụ & Giám đốc (`PendingEvaluationTasksCard`):** Giám sát tỷ lệ đánh giá toàn trường, nút `[🔔 Nhắc Giáo Viên]` và `[📝 Xem & Đánh Giá Hộ ↗]`.
   - **Kiểm Toán Học Viên Vắng Hôm Nay (`AbsentStudentsAuditDrawer`):**
     * Thẻ KPI `🔴 Học Viên Vắng Hôm Nay: X em` trên Dashboard Giám đốc & Giáo vụ, click mở Drawer kiểm toán tổng hợp vắng học từ 3 nguồn: `session_evaluations`, `classroom_live` và `absence_requests`.
   - **Thanh Tiến Độ Số Buổi Đã Học & Lịch Sử 10 Buổi Đánh Giá:**
     * Thẻ lớp `ClassLiveCard` hiển thị: `Số buổi đã học: X/Y buổi (Z%)`.
     * Cổng học viên `StudentRecentEvaluationsCard` hiển thị tối đa 10 buổi đánh giá gần nhất (parse timestamp an toàn, loại trừ ngày tương lai, sắp xếp giảm dần).

9. **Quy Chuẩn Cảnh Báo Soạn Giáo Án Trước 24H & Báo Thiếu Giáo Trình (Lesson Plan 24h Alert & Curriculum Readiness Invariant)**:
   - **Cơ chế 2 Tầng Cảnh Báo Thông Minh (Two-Tier Alert Engine):**
     * **TẦNG 1 — Cảnh Báo Khẩn Cấp (Primary Urgent Alert - Mốc 24H):** Quét các ca học diễn ra trong vòng 24 giờ tới (now đến now + 24h) qua LessonPlanAlertService.getLessonPlanAlerts. Phát hiện ca dạy thiếu giáo án (lessonPlans[sessionIndex]) hoặc thiếu giáo trình Wonders (curriculumId, curriculumSeries, curriculumTextbooks, courseLevel).
     * **TẦNG 2 — Hồ Sơ Sót Quá Khứ (Archival Backlog):** Các buổi học cũ trong quá khứ (endMs <= now) chưa soạn bài được gom gọn thành 1 dòng lưu ý học thuật nhẹ nhàng, tránh gây bội thực cảnh báo đỏ (Alert Fatigue) làm lu mờ ca dạy ngày mai.
   - **Ma Trận Phân Quyền & Hành Vi Giao Diện Theo 4 Vai Trò:**
     * **Giáo viên bản xứ (teacher — TeacherLessonPlanAlertCard):** 100% Tiếng Anh; banner cam/đỏ mốc 24h kèm đồng hồ đếm ngược; nút bấm 1-Click [Plan Lesson Now] bật trực tiếp LessonPlanEditorModal ngay tại Dashboard, hỗ trợ chọn Wonders template và lưu 0ms.
     * **Giáo vụ đào tạo (academic — AcademicLessonPlanMonitorCard):** Giám sát toàn trường các ca dạy thiếu giáo án/giáo trình; nút [🔔 Nhắc Giáo Viên] gửi realtime notification chuông tới GV và chuyển nút sang tag Đã nhắc; nút [🔍 Kiểm Tra Ca Học] chuyển thẳng tới xem giáo trình.
     * **Giám đốc điều hành (director — DirectorCurriculumReadinessCard):** Thẻ KPI đo lường Tỷ lệ sẵn sàng bài học 24h toàn trường (complianceRate %); chạm vào mở Drawer đối soát vận hành chi tiết từng ca học.
     * **Học viên & Phụ huynh (student — Bảo Mật Uy Tín Sư Phạm):** Tuyệt đối KHÔNG hiển thị cảnh báo tiêu cực "Giáo viên chưa soạn giáo án". Thay vào đó hiển thị thông điệp tích cực, lịch sự: "📚 Bài học và tài liệu đọc trước cho buổi học đang được hoàn thiện trước giờ học. Chúc con có một buổi học thật vui và bổ ích!".
   - **Tích Hợp Chuông Header Toàn Diện (NotificationBellPopover):**
     * Hỗ trợ 2 mã thông báo mới: LESSON_PLAN_DUE_REMINDER (Icon sách 📖 cho Giáo viên) và LESSON_PLAN_MISSING_ALERT (Icon cảnh báo ⚠️ cho Giáo vụ/Giám đốc), click chuyển hướng trực tiếp tới lớp học.


10. **Quy Chuẩn Tính Năng Báo Nghỉ Phép Học Viên & Kiểm Toán Chuyên Cần Khép Kín 4 Bước (Student Absence Request & Attendance Audit Closed-Loop Invariant)**:
    - **Luồng 4 Bước Khép Kín (4-Step Closed Loop Architecture):**
      * **Bước 1 — Học viên / Phụ huynh (`student`):**
        - Nút `[Request Leave / Báo Nghỉ Phép]` hiển thị trực quan tại Banner ca học tiếp theo và trên từng thẻ lớp học đang tham gia (`StudentPortalPanel.jsx`).
        - Mở form `ClassAbsenceReportModal`: Chọn ngày vắng; trường **Lý do vắng mặt (`reason`) BẮT BUỘC là Tùy chọn (Optional)**; lời nhắn gửi giáo vụ (Optional). Gửi đơn tức thì 0ms.
        - Hệ thống tự động bắn Realtime Notification (`ABSENCE_REQUEST_SUBMITTED`) đến chuông Giáo vụ (`ROLE:academic` & `ROLE:director`).
      * **Bước 2 — Bàn tiếp nhận & Phê duyệt của Giáo vụ (`academic`):**
        - Tại Bàn Giáo Vụ (`AcademicOperationsPanel.jsx`), khối "Danh Sách Đơn Báo Vắng Mặt" hiển thị các đơn `PENDING` kèm thông tin lớp, ngày và lời nhắn.
        - Nút `[✅ Duyệt & Báo Giáo Viên]` (`Approve & Notify`) chuyển trạng thái sang `APPROVED`, đồng thời kích hoạt gửi thông báo chuông kép:
          1. Gửi thông báo đến Học viên (`ABSENCE_REQUEST_APPROVED`): Xác nhận đơn xin nghỉ buổi học đã được Giáo vụ phê duyệt.
          2. Gửi thông báo đến Giáo viên bản xứ (`STUDENT_ABSENCE_EXCUSED`): Báo đích danh tên học sinh và lớp xin nghỉ có phép.
      * **Bước 3 — Đồng bộ góc nhìn Giáo viên bản xứ (`teacher`):**
        - Nhận thông báo chuông đích danh kèm link mở lớp học.
        - Trên Dashboard Giáo Viên (`TeacherWorkspacePanel.jsx`), Thẻ ca dạy `ClassLiveCard` tự động hiển thị huy hiệu cam nổi bật: `<Tag color="orange" icon={<UserDeleteOutlined />}>1 Excused Leave: Kenji (HV768)</Tag>`.
        - Trong phòng học trực tuyến Live Classroom (`StudentSeat.jsx`) và Bàn chấm điểm danh sau giờ học (`SessionEvaluationModal.jsx`), học sinh có đơn được duyệt sẽ mang trạng thái `Excused Leave` (Vắng có phép), bảo vệ danh dự học sinh, chặn đứng việc bị đánh giá `OFFLINE` trốn học oan.
      * **Bước 4 — Kiểm toán chuyên cần & Tối ưu UI/UX Drawer (`AbsentStudentsAuditDrawer`):**
        - **Kỷ Luật Chống Báo Oan Tuyệt Đối (Anti-False-Positive Invariant):** Tuyệt đối KHÔNG quét doc `classroom_live` để đếm học sinh `OFFLINE` khi ca học hôm nay chưa đến giờ bắt đầu (`now < session.start`). Chỉ tính vắng hôm nay khi ca học đang diễn ra hoặc đã kết thúc hôm nay.
        - Lọc sạch 100% chỉ tài khoản Học viên (`role === 'student'`), loại bỏ triệt để cán bộ/giáo vụ và các bản ghi ngày `undefined`.
        - Drawer mở rộng `840px` trên Desktop, triệt tiêu hoàn toàn thanh cuộn ngang xám xịt (100% Zero Overflow-X).
        - Bộ lọc Segmented Tabs 4 nhóm: `[🔴 Hôm Nay]` | `[📅 Toàn Bộ Lịch Sử]` | `[📝 Có Đơn Xin Nghỉ]` | `[⚠️ Không Phép]`.
        - Số điện thoại phụ huynh hiển thị đầy đủ định dạng chuẩn (`0908 xxx 6333`) kèm nút Gọi và Zalo to rõ; trên Mobile ($\le 768\text{px}$) tự động chuyển sang Mobile-First Card View với các nút hành động đạt chuẩn công thái học $\ge 38\text{px}$.


11. **Quy Chuẩn Học Bạ Điện Tử & Mục Tiêu Học Tập Chinh Phục Đa Khóa Học (Cumulative Academic Transcript & Multi-Course Goal Engine Invariant)**:
    - **Kiến Trúc Học Bạ Toàn Diện (All-in-One Digital Academic Transcript):**
      * Tích hợp trực tiếp vào Tab `[Học Bạ Điện Tử & Mục Tiêu]` trên trang hồ sơ học viên (`/user-management/:id` và `/my-profile`).
      * Hỗ trợ thanh chuyển đổi linh hoạt theo Khóa học / Lớp học (`enrolledClasses`) khi học viên học đồng thời nhiều lớp (chính khóa Wonders + giao tiếp phản xạ + luyện thi Cambridge).
    - **Cơ Chế Khung Mục Tiêu Mẫu (Course-Level Goal Blueprint):**
      * Quản lý qua `StudentGoalService.js` (Firestore `student_goals`).
      * Tự động khởi tạo theo template chuẩn của khóa học: Wonders ELA (Mỹ), Cambridge Test Prep (Starters/Movers/Flyers), Spoken English Fluency.
      * Thuật toán phân tích tiến độ tự động thời gian thực:
        $$P_{\text{goal}} = 40\% \times S_{\text{eval}} + 25\% \times S_{\text{att}} + 20\% \times S_{\text{hw}} + 15\% \times S_{\text{unit}}$$
      * 3 Trạng thái tự động: 🟢 Ahead of Track ($\ge 110\%$) | 🟡 On Track ($85\% - 109\%$) | 🔴 At Risk ($< 85\%$).
    - **Ma Trận Phân Quyền Bảo Mật 3 Góc Nhìn (3-Party Privacy Matrix):**
      * **Học viên & Phụ huynh (`student`):** Thấy mục tiêu, tiến độ %, 4 trụ cột kỹ năng, danh sách cột mốc, lịch sử nhận xét sư phạm từng buổi từ GV bản xứ, nút đổi nguyện vọng gia đình. **TUYỆT ĐỐI ẨN 100%** Sổ ghi chú nghiệp vụ nội bộ (`student_notes`).
      * **Giáo viên bản xứ (`teacher`):** 100% Tiếng Anh, thấy nhận xét của mình và các GV trước đó, thấy sổ ghi chú trao đổi với Giáo vụ, có quyền cập nhật trạng thái Milestone. **TUYỆT ĐỐI ẨN 100%** Học phí & SĐT đầy đủ của phụ huynh (tuân thủ `Teacher Fee Privacy Guard` & `Native Teacher Zalo Isolation Guard`).
      * **Giáo vụ (`academic`) & Lãnh đạo (`director`/`admin`):** Toàn quyền xem & cập nhật đầy đủ cả 6 khối dữ liệu.
