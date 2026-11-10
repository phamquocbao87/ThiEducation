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
   - **Phân tách 2 Module độc lập:**
     - Phân hệ Quản lý Khóa Học & Lớp Học (`src/modules/courses/` — `/courses-classes`): Quản lý danh mục khóa học, lớp học và trang tạo khóa học mới chuyên biệt `/courses-classes/new`.
     - Phân hệ Cấp Độ Giáo Trình (`src/modules/curriculum/` — `/curriculum-levels`): Khung chuẩn ELA & Wonders (GK - G6), CEFR, độ tuổi, liên kết trực tiếp khi tạo khóa học mới.
     - Phân hệ Thời Khóa Biểu Zoom (`src/modules/schedules/` — `/zoom-schedules`): Lịch học & thời khóa biểu phòng học trực tuyến Live Zoom Calendar View.
6. **Kỷ Luật Bất Biến Về Phạm Vi Task & Đánh Giá Tác Động Bắt Buộc (Strict Scope Integrity & Mandatory Impact Assessment Invariant):**
   - **Tuyệt đối không tự ý thay đổi chức năng khác khi chưa có yêu cầu / thông báo:**
     * Đang thực hiện sửa chữa, tối ưu hoặc phát triển cho chức năng A thì **CHỈ ĐƯỢC PHÉP THAO TÁC TRONG PHẠM VI CHỨC NĂNG A**.
     * Tuyệt đối **CẤM** tiện tay sửa đổi, refactor, đổi logic, xóa hoặc làm mới bất kỳ chức năng B nào khác khi chưa có yêu cầu rõ ràng từ Sếp Bảo hoặc chưa thông báo xin phép trước.
   - **Quy trình 3 bước Đánh giá Tác động (Mandatory 3-Step Impact Assessment Protocol) trước khi code:**
     * **Bước 1 — Xác định phạm vi ảnh hưởng (Impact Scope Analysis):** Phân tích rõ các file component, hook, service, model dữ liệu hoặc route nào sẽ bị tác động trực tiếp/gián tiếp.
     * **Bước 2 — Đánh giá rủi ro hồi quy (Regression Risk & Breaking Change Check):** Phân tích xem thay đổi ở chức năng A có nguy cơ làm gãy (break), lỗi ngầm hoặc thay đổi hành vi các chức năng khác (B, C...) đang dùng chung component/service/state hay không.
     * **Bước 3 — Báo cáo & Xin phép trước khi can thiệp (Notify & Approval Before Modifying Cross-cutting Code):** Nếu phát hiện chức năng B có lỗi hoặc việc sửa chức năng A buộc phải thay đổi component/service dùng chung (`src/shared/`, `src/core/`), Agent **BẮT BUỘC PHẢI DỪNG LẠI, BÁO CÁO RÕ VỀ IMPACT VÀ XIN Ý KIẾN SẾP BẢO**, chỉ khi Sếp đồng ý mới được đụng vào, tuyệt đối không được tự ý sửa ngầm.
   - **Kỷ luật Báo cáo Minh bạch Phạm vi (Scope Transparency):**
     * Sau khi hoàn thành, báo cáo phải nêu rõ danh sách file đã thay đổi, khẳng định các chức năng khác được bảo toàn nguyên vẹn 100% không bị ảnh hưởng.

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
4. **Kỷ Luật Vận Hành 100% Dữ Liệu Thực Tế & Gỡ Bỏ Cơ Chế Giả Lập Tài Khoản (Pure Real Data & Zero Impersonation Simulation Invariant):**
   - Theo chỉ đạo trực tiếp của Sếp Bảo: Hệ thống **VẬN HÀNH 100% TRÊN DỮ LIỆU THỰC TẾ** từ Cloud Firestore (`lakeducationdb`), tuyệt đối **KHÔNG** dùng mock data hay trộn danh bạ giả lập.
   - Cơ chế giả lập / Impersonation (*"Admin Xem Dưới Tên User"*) và Modal chuyển đổi vai trò demo trên Header đã được **gỡ bỏ hoàn toàn**.
   - Mỗi người dùng đăng nhập và làm việc trực tiếp bằng tài khoản thật của mình (Google OAuth hoặc Email/Mật khẩu).
   - Toàn bộ các tài khoản mẫu (`ACA001..ACA003`, `ACC001`, `GV002..GV007`, `HV001..HV005`) đã được loại bỏ khỏi danh sách hoạt động; giao diện Quản trị người dùng (`/user-management`) và Hồ sơ cá nhân (`/my-profile`) chỉ hiển thị người dùng thực tế:
     * 🛠️ **`ADM001` — Phạm Quốc Bảo:** IT Quản Trị Hệ Thống (`phamquocbao87@gmail.com` / `0898794116`)
     * 👑 **`DIR505` — Phạm Hiếu Thi:** Giám Đốc Điều Hành & Sáng Lập (`lakvietnam@lakeducation.com` / `0908794116`)
     * 💰 **`ACC330` — Lê Thị Mỹ Dung:** Kế Toán Tài Chính (`lemydung49@gmail.com` / `0983548212`)
     * Và các Cán bộ / Giáo viên / Học viên thực tế được đăng ký mới qua form.
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
7. **Quy Chuẩn Bất Biến Về Độ Sạch Giao Diện & Tuyệt Đối Không Hiển Thị Thông Tin Kỹ Thuật Cho Người Dùng (Zero Technical Jargon & Complete UI Information Purity Invariant):**
   - Mọi nhãn form (`Form.Item label`), tooltip, gợi ý (`extra`), placeholder, tiêu đề bảng, thông báo hệ thống (Toasts, Alert, Modal) **TUYỆT ĐỐI KHÔNG ĐƯỢC CHỨA CÁC THUẬT NGỮ KỸ THUẬT LẬP TRÌNH HOẶC TÊN THƯ VIỆN BÊN DƯỚI** (như `Rich Text Editor`, `TipTap`, `Antd`, `Regex`, `JSON`, `API`, `H1/H2/H3`, `student_id`...).
   - **100% sử dụng ngôn ngữ nghiệp vụ sư phạm & quản trị giáo dục thuần túy.**
   - Chuẩn soạn thảo giáo trình dùng **`@tiptap/react`** (hỗ trợ chính thức React 19; không import riêng `extension-underline` vì StarterKit v3 đã tích hợp sẵn).
   - Khi hiển thị tóm tắt ngoài Card hoặc Table, **bắt buộc dùng hàm `stripHtml()`** để lọc sạch mã HTML.
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
3. **QUY TRÌNH 5 BƯỚC BẮT BUỘC KHI CÓ LỆNH DEPLOY TỪ SẾP BẢO (`Strict 5-Step Production Release Pipeline`):**
   - Ngay khi Sếp Bảo ra lệnh **"deploy"** (hoặc *"deploy lên firebase"*, *"push và deploy"*), Agent **BẮT BUỘC thực thi tuần tự 5 bước không bỏ sót bước nào**:
     1. **Bước 1 — Bật Phòng QC Test Full Quy Trình Nghiệp Vụ (`python3 scripts/qc_layout_auditor.py`):** Chạy kiểm thử E2E toàn diện các tính năng trên cả Desktop (`1366x850`) và Mobile (`390x844`).
     2. **Bước 2 — Xóa Sạch 100% Dữ Liệu Test Do Phòng QC Tạo Ra (`Zero Test-Data Residue Teardown`):** Mọi dữ liệu thử nghiệm (khoá học test, lớp học nháp, lịch sử đổi lịch thử nghiệm, cờ `sessionStorage`/`localStorage` hoặc bản ghi `[QC-TEST]`) sinh ra trong quá trình Phòng QC kiểm thử **BẮT BUỘC PHẢI ĐƯỢC XÓA SẠCH VÀ KHÔI PHỤC VỀ TRẠNG THÁI GỐC** ngay khi kết thúc bài test, tuyệt đối không để lọt dữ liệu rác của QC lên bản build/production.
     3. **Bước 3 — Build Tăng Version & Mã Build Ngày (`npm run build`):** Tự động tăng `Version 1.2.x` và `build YYYYMMDDNNv` qua `scripts/bump_build_version.js`, đóng gói sạch `dist/landing` và `dist/erp`.
     4. **Bước 4 — Git Commit, Tag & Push (`git commit` + `git tag` + `git push`):** Commit toàn bộ code sạch kèm thông điệp chuẩn version (`release: Version 1.2.x • build YYYYMMDDNNv`), gắn thẻ Git Tag (`v1.2.x-YYYYMMDDNNv`) và đẩy (`git push origin main --tags`) lên kho lưu trữ Git.
     5. **Bước 5 — Deploy Lên Firebase Hosting & Báo Cáo Nghiệm Thu (`firebase deploy --only hosting`):** Đẩy đồng thời 2 site lên Firebase Hosting (`lakeducation.edu.vn` và `erp.lakeducation.edu.vn` bằng tài khoản `vnthietbigarage@gmail.com`), xác nhận `HTTP 200` và xuất trình Báo cáo Release & Nghiệm thu Phòng QC cho Sếp Bảo.

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
