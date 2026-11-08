# QUY TRÌNH BẮT BUỘC CỦA PHÒNG QC & IT KIỂM THỬ TRƯỚC KHI BÀN GIAO (MANDATORY QC & IT AUDIT PROTOCOL)

> **Kỷ Luật Tối Thượng Của Phòng QC & IT LAK EDUCATION:**  
> Tuyệt đối **CẤM** báo cáo "Đã hoàn thành" hoặc "Đã sửa xong" cho Sếp Bảo nếu chưa qua **Quy trình Kiểm thử 4 Bước** của Phòng QC trên trình duyệt thật (Desktop & Mobile).  
> Mọi chức năng mới (function/module) hoặc bản vá lỗi (bugfix) đều phải vượt qua 100% các tiêu chí nghiệm thu dưới đây.

---

## 🏛️ 1. Tôn Chỉ & Phạm Vi Trách Nhiệm Của Phòng QC & IT

1. **Hiểu Sâu Nghiệp Vụ Ứng Dụng Trước Khi Test:**
   - Phòng QC không được kiểm thử hời hợt bề mặt. Phải học và hiểu rõ toàn bộ luồng nghiệp vụ:
     - Vai trò người dùng (6 Roles RBAC: `admin`, `director`, `academic`, `teacher`, `accountant`, `student`).
     - Luồng dữ liệu: React State $\longleftrightarrow$ Module Service $\longleftrightarrow$ LocalStorage / Firestore DB.
     - Mô hình vận hành: Khóa học $\rightarrow$ Lớp học $\rightarrow$ Học viên & Giáo viên $\rightarrow$ TKB & Điểm danh $\rightarrow$ Học phí & Lương.
2. **Nguyên Tắc "Zero-Refresh & Zero-Lag" (Phản Hồi Tức Thì 0ms):**
   - Mọi thao tác: **Thêm mới**, **Chỉnh sửa**, **Xóa bỏ**, **Bật/Tắt trạng thái (Switch)** đều phải cập nhật trực quan trên giao diện ngay lập tức (**0ms Optimistic State Update**).
   - **TUYỆT ĐỐI CẤM** lỗi sơ đẳng: Bấm Xóa / Bấm Đổi trạng thái mà dữ liệu vẫn trơ trơ trên màn hình, phải F5 (refresh) trang mới mất hoặc hiện.
3. **Bảo Toàn Trạng Thái Qua Reload (Persistence Integrity):**
   - Sau khi thao tác thành công, bấm F5 (Reload trang) dữ liệu vẫn phải được bảo toàn chính xác:
     - Dữ liệu vừa xóa: Tuyệt đối không được "sống lại" ngầm do cơ chế cache hay auto-sync mặc định.
     - Dữ liệu vừa thêm: Phải hiển thị đúng vị trí trong danh sách.
     - Dữ liệu vừa cập nhật: Giữ nguyên các trường đã sửa.

---

## 📋 2. Quy Trình Kiểm Thử 4 Bước Bắt Buộc (4-Step QC Verification Gate)

```
[BƯỚC 1: HỌC NGHIỆP VỤ] ──> [BƯỚC 2: BUILD CLEAN] ──> [BƯỚC 3: E2E DUAL BROWSER] ──> [BƯỚC 4: UI/UX AUDIT]
(Role, Data Flow, UX)       (npm run build = 0 err)     (Desktop 1280 + Mobile 390)   (Grid 50/50, No Orphan Card)
```

### Bước 1: Học & Phân Tích Nghiệp Vụ (Business Logic Deep-Dive)
- Trước khi code hoặc test, QC xác định rõ:
  - Form này dành cho ai? Quyền hạn tương ứng là gì?
  - Các trường bắt buộc (`required`), định dạng hợp lệ (chuẩn Mỹ `MM/DD/YYYY` khi EN, `DD/MM/YYYY` khi VI).
  - Vị trí lưu trữ dữ liệu và cách State đồng bộ với Service.

### Bước 2: Kiểm Tra Biên Dịch & Build Sạch (Clean Build Gate)
- Chạy lệnh build kiểm tra toàn bộ 2 site (`landing` và `erp`):
  ```bash
  npm run build
  ```
- **Điều kiện PASS:** Exit code = 0, không có lỗi cú pháp JSX, không có lỗi thiếu import, không có parse error từ bundler.

### Bước 3: Chạy Kiểm Thử Tự Động Kép Trên Trình Duyệt Thật (Dual Desktop & Mobile E2E)
- **Mặc định 100% Chạy Ngầm Dưới Nền (`headless=True` + `--headless=new`):**
  - Mọi thao tác kiểm thử, điền form, kiểm tra giao diện đều diễn ra ngầm dưới nền.
  - Tự động chụp ảnh màn hình lưu vào `scratch/` làm bằng chứng nghiệm thu, tuyệt đối không tự ý bật cửa sổ làm gián đoạn màn hình của Sếp Bảo.
- **Cơ Chế Bật Cửa Sổ Hiển Thị (`Foreground Interactive Mode — headless=False` tại `80, 60`):**
  - **CHỈ BẬT LÊN MÀN HÌNH KHI:**
    1. Sếp Bảo ra lệnh yêu cầu xem trực tiếp (ví dụ: *"bật trình duyệt lên"*, *"hiển thị để tôi xem"*).
    2. Cần Sếp Bảo trực tiếp nhập liệu hoặc xác thực tài khoản (nhập OTP, mật khẩu cá nhân, CAPTCHA hoặc nghiệm thu trực quan).
  - Khi bật: Đặt cửa sổ tại toạ độ `window-position=80,60`, kích thước `1350x900` và thông báo rõ cho Sếp thao tác.
  - Sau khi Sếp nhập xong: Agent ẩn hoặc chuyển về chế độ chạy ngầm để tiếp tục audit.
- **Phạm vi kiểm tra song song:**
  1. **Trên Desktop (`1280x800` hoặc `1366x768`):**
     - Đăng nhập đúng Role qua `localStorage.setItem('lak_authenticated_user_id', ...)`.
     - Thực hiện trọn vẹn luồng tương tác thật: Điền form, bấm nút Save/Submit.
     - Kiểm tra kết quả chuyển trang (Routing), hiển thị Toast thông báo.
     - Thử nghiệm chức năng Xóa: Bấm Xóa $\rightarrow$ Xác nhận $\rightarrow$ Đo đạc DOM: phần tử phải biến mất ngay lập tức (0ms).
     - Thử nghiệm Reload (F5): Tải lại trang $\rightarrow$ Xác minh phần tử đã xóa không bị xuất hiện lại.
  2. **Trên Mobile (`390x844` Viewport):**
     - Kiểm tra tính tương thích Responsive: Không tràn màn hình ngang (`zero overflow-x`).
     - Touch targets: Tất cả các nút bấm và action bar đạt chiều cao $\ge 44\text{px}$.
     - Vị trí nút bấm: Nút Lưu/Hành động phải nằm ở cuối màn hình hoặc trên thanh Sticky Action Bar nổi ở đáy viewport, không che khuất nội dung.

### Bước 4: Kiểm Toán Tiêu Chuẩn Thiết Kế UI/UX Bằng Script Tự Động (`scripts/qc_layout_auditor.py`)

> **Kỷ luật kiểm toán tự động cưỡng chế (Automated QC Assertions):**  
> Phòng QC không chỉ kiểm tra "luồng nghiệp vụ chạy được" mà **BẮT BUỘC 100% PHẢI CHẠY BỘ ASSERT TỰ ĐỘNG ĐO ĐẠC THÔNG SỐ GIAO DIỆN**. Tuyệt đối không để Sếp Bảo phải đi tìm lỗi layout.

**Bảng 8 Tiêu Chí Kỹ Thuật Bắt Buộc Phòng QC Phải Assert Tự Động:**
1. **Zero Horizontal Overflow (`scrollWidth <= innerWidth`):** Đo đạc trên cả Desktop (`1366px`) và Mobile (`390px`). Nếu `document.body.scrollWidth > window.innerWidth` (dù chỉ 1px) $\rightarrow$ **FAIL NGAY LẬP TỨC**, in danh sách thẻ phần tử vi phạm và sửa triệt để.
2. **Ngữ Nghĩa Chữ Liền Mạch (No Broken Words):** Nghiêm cấm các trường hợp vỡ chữ như `2.500.000 đ/th` rớt chữ `áng` xuống dòng. Các cụm học phí, tiền tệ bắt buộc có `whiteSpace: 'nowrap'`.
3. **Độ Thoáng Lưới Desktop (Grid Breathing Room):** Các thẻ Khóa học / Danh mục đào tạo phải dùng lưới 3 cột (`Col lg={8}` — chiều rộng $\ge 300\text{px}$) thay vì 4 cột (`Col lg={6}` hẹp 231px) để đảm bảo mỹ quan và không để trống trơ trọi 50% màn hình khi ít dữ liệu.
4. **Chuẩn 100% Width Trục Lọc Mobile (Grid Harmonization Invariant):** Mọi ô tìm kiếm, dropdown Select lọc trên di động bắt buộc có `width: '100%', height: 40, borderRadius: 8`, cấm tuyệt đối hardcode các kích thước `260px`, `220px`, `200px` tạo bậc thang so le thụt thò.
5. **Công Thái Học Vùng Chạm (Touch Target Ergonomics):** Tất cả các nút bấm chính (Primary Action) trên Mobile phải có chiều cao $\ge 38-40\text{px}$. Nút xóa icon phải có diện tích tối thiểu $32\times 32\text{px}$ để tránh bấm trượt.
6. **Bảo Toàn Hiển Thị Tabs (No Tabs Truncation):** Tiêu đề Tab trên Mobile phải tinh gọn (ví dụ: *"Khóa Học (N)"*, *"Lớp Học (N)"*) để 100% các tab đều hiển thị rõ ràng, không bị Ant Design thu gọn thành dấu `...`.
7. **Bảo Vệ Header Mobile:** Thanh Header trên di động phải gọn gàng $\le 390\text{px}$, các nhãn Admin rút gọn thành `ADM001`, tuyệt đối không để tràn làm co rúm logo hoặc rớt chữ *"LAK EDUCATION"*.
8. **Drawer Toàn Màn Hình Mobile:** Drawer mở trên màn hình nhỏ phải tự động co dãn `width={isMobile ? '100%' : 640}`, các nút bấm footer dàn đều 50/50 hoặc full-width để ngón tay cái dễ bấm.

---

## 🛡️ 3. Biên Bản Nghiệm Thu QC (Bắt Buộc Trình Bày Trước Khi Bàn Giao)

Mỗi khi báo cáo hoàn thành cho Sếp Bảo, Agent bắt buộc phải đính kèm **Biên Bản Nghiệm Thu QC** theo mẫu:

```markdown
### 🛡️ BIÊN BẢN NGHIỆM THU PHÒNG QC & IT SƯ PHẠM
- **Tính năng / Bugfix:** <Tên chức năng hoặc lỗi vừa xử lý>
- **Phiên bản Build:** `Version 1.2.x • build YYYYMMDDNNv`
- **Quy trình nghiệp vụ đã học & đối chiếu:** <Mô tả ngắn luồng nghiệp vụ>
- **Kết quả Kiểm thử Playwright Trình duyệt thật:**
  - ✅ Desktop (1280x800): Thao tác thành công, State cập nhật 0ms (không cần reload).
  - ✅ Persistence (F5 Reload): Dữ liệu được bảo toàn chuẩn xác, không bị sống lại/mất ngầm.
  - ✅ Mobile (390x844): Giao diện chuẩn mobile-first, nút bấm >= 44px, không tràn ngang.
  - ✅ QC Test-Data Teardown: Đã xóa sạch 100% dữ liệu test do Phòng QC tạo ra trong quá trình kiểm thử.
  - ✅ Clean Build: `npm run build` đạt 100% (0 errors).
```

---

## 🚀 4. Quy Trình Build, Xóa Dữ Liệu Test QC, Git Tag & Deploy Production (`Strict Release & Deploy Gate`)

1. **Nguyên tắc Bất Biến — Không Tự Ý Deploy Khi Chưa Có Lệnh (`No Unsolicited Deploy`):**
   - Tuyệt đối **CẤM** tự ý chạy `firebase deploy`, `npm run deploy`, `git commit`, hoặc `git push` khi Sếp Bảo chưa ra lệnh deploy.
2. **Quy Chuẩn Định Dạng Version & Build ID Ở Chân Trang (`Footer Build Version Standard`):**
   - Dưới dòng `LAK EDUCATION (lakeducation.com) ©2026` luôn hiển thị: **`Version 1.2.x • build YYYYMMDDNNv`** (ví dụ: `Version 1.2.1 • build 2026110801v`).
   - Mỗi lần chạy `npm run build`, script `scripts/bump_build_version.js` tự động tăng `Version` lên 1 bậc (`1.2.0` $\rightarrow$ `1.2.1` $\rightarrow$ `1.2.2`) và tăng số thứ tự bản build trong ngày (`01`, `02`, `03`...) theo múi giờ Việt Nam.
3. **Quy Trình 5 Bước Cưỡng Chế Khi Có Lệnh Deploy Từ Sếp Bảo:**
   - **Bước 1 (Full E2E QC Audit):** Bật Phòng QC chạy kiểm thử toàn bộ luồng nghiệp vụ (`python3 scripts/qc_layout_auditor.py`) trên Desktop & Mobile.
   - **Bước 2 (Zero Test-Data Residue — Xóa Sạch Dữ Liệu Test QC):** Sau khi kết thúc kiểm thử, Phòng QC **BẮT BUỘC xóa sạch 100% dữ liệu tạm / dữ liệu thử nghiệm** được tạo ra trong quá trình test và khôi phục trạng thái sạch ban đầu.
   - **Bước 3 (Build Production):** Khi 100% bài test PASS và dữ liệu test đã được dọn sạch, chạy `npm run build` để nâng `Version 1.2.x • build YYYYMMDDNNv` và xuất `dist/landing` + `dist/erp`.
   - **Bước 4 (Git Commit + Tag + Push):** Thực hiện `git add`, `git commit -m "release: Version 1.2.x • build YYYYMMDDNNv"`, tạo tag `git tag v1.2.x-YYYYMMDDNNv` và `git push` lên Git.
   - **Bước 5 (Firebase Hosting Deploy & Report):** Chạy `firebase deploy --only hosting` (tài khoản `vnthietbigarage@gmail.com`) lên `https://lakeducation.edu.vn` & `https://erp.lakeducation.edu.vn`, kiểm tra `HTTP 200` và báo cáo kết quả cho Sếp Bảo.

