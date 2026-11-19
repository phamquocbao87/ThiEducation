# QUY TRÌNH BẮT BUỘC CỦA BỘ BA BA - QC - AUDIT GIÁM SÁT TOÀN DIỆN VÒNG ĐỜI PHÁT TRIỂN & FIX BUG (MANDATORY BA - DEV - QC/AUDIT TRIO PROTOCOL)

> **Kỷ Luật Tối Thượng Của Hệ Thống LAK EDUCATION (Chỉ Đạo Bất Biến Từ Sếp Bảo):**  
> 1. Mỗi chức năng mới (Function) và mỗi lỗi phát sinh (Bug) **BẮT BUỘC PHẢI GEN TÀI LIỆU ĐẶC TẢ BA & MA TRẬN TEST CASE THỰC TẾ** trước khi code.  
> 2. Nghiêm cấm tuyệt đối việc kiểm thử hời hợt hoặc chỉ test "nhánh dán link / nhánh text lý tưởng" bỏ sót nhánh tải tệp nhị phân thật hoặc lỗi CORS.  
> 3. **NGAY SAU KHI DEPLOY:** Bắt buộc chạy kiểm thử Playwright E2E thực tế trên **CẢ HAI MÔI TRƯỜNG DEV VÀ PROD** (đóng vai người dùng thật, thao tác tệp thật, đo đạc phản hồi mạng thật) và **XÓA SẠCH 100% DỮ LIỆU TEST (Zero Test-Data Residue Teardown)** ngay sau khi hoàn tất.  
> 4. Tuyệt đối **CẤM** báo cáo "Đã hoàn thành" hoặc "Đã sửa xong" cho Sếp Bảo nếu chưa có **Biên Bản Nghiệm Thu Kép (Dual-Environment Evidence Report)** đính kèm ảnh chụp màn hình từ cả DEV và PROD.

---

## 🏛️ 1. Quy Trình 3 Pha Bắt Buộc (BA Spec ──> DEV Execution ──> QC Dual-Env Audit)

```
[PHA 1: BA SPECIFICATION]      ──>      [PHA 2: DEV CLEAN CODE]      ──>      [PHA 3: QC DUAL-ENV AUDIT]
• Tóm tắt nghiệp vụ & User Story        • Clean Modular Code                   • Test E2E trên DEV (dev.lakeducation.edu.vn)
• Ma Trận Test Case 5 Trục Thực Tế      • Chốt chặn Guard 3 Lớp                 • Deploy & Test E2E trên PROD (bk.lakeducation.edu.vn)
• Gen file docs/specs/<id>.spec.md     • npm run build = 0 lỗi                • DỌN SẠCH 100% DỮ LIỆU TEST (Zero Residue)
```

### Pha 1: BA Specification & Ma Trận Kiểm Thử Thực Tế 5 Trục (Bắt Buộc Gen Tài Liệu)
Mỗi khi có task mới (Feature hoặc Bug), Agent đóng vai trò **BA (Business Analyst)** bắt buộc sinh tài liệu đặc tả tại `docs/specs/<feature_or_bug_id>.spec.md` với **Ma Trận Kiểm Thử Thực Tế 5 Trục (5-Axis Real-World Test Matrix)**:
1. **Trục 1 — Nhị Phân & Tệp Thật (Binary Payload Axis):**
   - Nếu tính năng có tải tệp (PDF, MP4, Audio, Avatar): Bắt buộc phải có kịch bản test kéo thả tệp nhị phân thật từ máy tính (dung lượng nhỏ 1MB, trung bình 10MB và lớn > 50MB/200MB).
   - Tuyệt đối **CẤM** chỉ test nhánh nhập chuỗi URL/dán link để tránh bỏ sót lỗi upload nhị phân!
2. **Trục 2 — Hạ Tầng Mạng & Cross-Origin (Network & CORS Axis):**
   - Bắt buộc kiểm tra quyền CORS từ chính các domain thật của trường: `*.lakeducation.edu.vn` (`bk.lakeducation.edu.vn`, `dev.lakeducation.edu.vn`, `erp.lakeducation.edu.vn`).
   - Kiểm tra mã trạng thái HTTP thực tế (`200 OK`, `206 Partial Content`), không bị chặn `403 Forbidden` hay `NetworkError`.
3. **Trục 3 — Phân Quyền 6 Roles RBAC (Role Scoping Axis):**
   - Kiểm tra chuẩn xác theo ma trận quyền hạn: Học viên (`student`), Giáo viên bản xứ (`teacher`), Giáo vụ (`academic`), Giám đốc (`director`), Kế toán (`accountant`), IT Admin (`admin`).
   - Đảm bảo tính bảo mật PII, ẩn học phí với GV bản xứ, ẩn link Zalo với GV bản xứ, cô lập lớp học của học viên.
4. **Trục 4 — Thiết Bị Kép Responsive (Desktop & Mobile-First Axis):**
   - Đo đạc tự động trên cả Desktop (`1366x850`) và Mobile (`390x844`). Assert nghiêm ngặt `Zero Overflow-X`.
5. **Trục 5 — Bền Vững Trạng Thái (Zero-Refresh & Persistence Axis):**
   - Thao tác Thêm/Sửa/Xóa cập nhật tức thì trên giao diện (0ms Optimistic UI). Tải lại trang (F5) bảo toàn 100% trạng thái.

---

### Pha 2: DEV Implementation & Kỷ Luật Phòng Vệ 3 Lớp
- Lập trình viên triển khai mã nguồn bám sát tài liệu đặc tả của BA.
- Áp dụng **Kỷ Luật Phòng Vệ 3 Lớp (Three-Tier Defensive Architecture)**:
  1. *Lớp Giao diện (UI Layer):* Form validation, thông báo trạng thái tải lên (`uploadStageText`, tiến trình %), hiển thị lỗi `message.error` rõ ràng, cấm âm thầm giấu lỗi.
  2. *Lớp Dịch vụ (Service Layer):* Tuyệt đối không fallback ngầm ra các dữ liệu rác/tạm thời (như `blob:` URL, text giả định static). Nếu có lỗi API hoặc timeout, throw Error có chủ đích.
  3. *Lớp Cơ sở dữ liệu (Database Guard):* Chốt chặn kiểm tra hợp lệ trước khi ghi Firestore (`setDoc`/`updateDoc`). Từ chối ghi các URL tạm thời hoặc payload không hợp lệ.
- Chạy `npm run build`: Phải đạt **100% PASS** với 0 lỗi cảnh báo cú pháp trước khi bàn giao sang Pha 3.

---

### Pha 3: QC Dual-Environment Post-Deploy Verification & Zero-Residue Teardown
Ngay sau khi mã nguồn được deploy, Phòng QC bắt buộc thực thi quy trình kiểm thử thực tế **SONG SONG TRÊN CẢ 2 MÔI TRƯỜNG**:

1. **Kiểm thử trên Môi trường DEV (`https://dev.lakeducation.edu.vn` & `http://localhost:3000`):**
   - Chạy script Playwright E2E đóng vai người dùng thực hiện trọn vẹn luồng thao tác.
   - Chụp ảnh màn hình bằng chứng lưu vào `test-results/dev/`.
2. **Kiểm thử trên Môi trường PROD (`https://bk.lakeducation.edu.vn` & `https://erp.lakeducation.edu.vn`):**
   - Chạy kịch bản Playwright E2E tương ứng trên Production thật với tài khoản thật (hoặc SSO).
   - Bắt buộc kiểm tra từ đầu đến cuối luồng dữ liệu (End-to-End Live Verification).
   - Chụp ảnh màn hình bằng chứng lưu vào `test-results/prod/`.
3. **Kỷ Luật Dọn Rác Test 100% (Strict Zero Test-Data Residue Teardown):**
   - Mọi tệp video, file PDF, hoặc bản ghi document do script test tạo ra trên cả DEV và PROD **BẮT BUỘC PHẢI ĐƯỢC XÓA SẠCH HOÀN TOÀN (Hard-Delete trên cả Google Drive lẫn Cloud Firestore)** ngay trong khối `finally` của script.
   - Assert xác nhận số lượng bản ghi test còn lại bằng `0` (`remainingTestDocs === 0`).
4. **Xuất Trình Biên Bản Nghiệm Thu Kép:**
   - Trình bày Biên Bản Nghiệm Thu Kép (Dual-Environment Evidence Report) đính kèm đầy đủ ảnh chụp minh chứng cả 2 môi trường cho Sếp Bảo.

---

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
3. **Quy Trình 8 Bước Cưỡng Chế Khi Có Lệnh Deploy Từ Sếp Bảo (`Strict 8-Step Git-Diff Impact Analysis, Dual-Env E2E & Production Teardown Pipeline`):**
   - **Bước 1 (Git Diff Impact Analysis — So Sánh Code Cũ & Mới):**
     * Chạy `git diff HEAD` (hoặc commit gần nhất) để bóc tách: *Code thay đổi thuộc tính năng mới nào? Fix bug ở function nào?*
     * Xác định phạm vi ảnh hưởng (Impact Scope) và lập ma trận Test Case & Integration Test.
   - **Bước 2 (DEV E2E & Integration Test):** Chạy kiểm thử tự động toàn diện các Test Case đã lập trên `localhost:3000` (`lakeducation-dev`) trên cả Desktop (`1366x850`) và Mobile (`390x844`), bảo đảm zero regression.
   - **Bước 3 (DEV Zero Test-Data Residue):** Xóa sạch 100% dữ liệu tạm / dữ liệu thử nghiệm trên DEV sau khi test xong.
   - **Bước 4 (Pre-deploy Database Migration Check & Pre-backup):**
     * Rà soát: Tính năng mới / Bug fix có đòi hỏi các Document cũ trên PROD phải có thêm field mới nào không?
     * **Kỷ luật bất biến:** `firebase deploy` không bao giờ đẩy data document. Nếu cần bổ sung field cho document cũ trên PROD, phải dùng script migration tại `scripts/migrations/` chạy trực tiếp trên các document thật của PROD với cờ `{ merge: true }`, tuyệt đối **CẤM** export từ DEV rồi import vào PROD.
     * Nếu có migration làm thay đổi cấu trúc dữ liệu PROD: Bắt buộc tạo bản backup snapshot nhanh trước khi chạy.
   - **Bước 5 (Deploy Security Rules & Composite Indexes Lên PROD):**
     * Nếu có thêm Collection mới hoặc câu query phức tạp, phải deploy Rules và Indexes lên PROD trước khi đẩy code Web:
       `firebase deploy --only firestore:rules,firestore:indexes --project prod`
     * Đảm bảo Firestore PROD sẵn sàng mở quyền và index, chặn đứng 100% lỗi `Missing or insufficient permissions` hoặc `The query requires an index`.
   - **Bước 6 (Build Production):** Khi 100% bài test PASS và dữ liệu test đã được dọn sạch, chạy `npm run build` để nâng `Version 1.2.x • build YYYYMMDDNNv` và xuất `dist/landing` + `dist/erp`.
   - **Bước 7 (Git Commit + Tag + Push):** Thực hiện `git add`, `git commit -m "release: Version 1.2.x • build YYYYMMDDNNv"`, tạo tag `git tag v1.2.x-YYYYMMDDNNv` và `git push` lên Git.
   - **Bước 8 (Deploy Hosting & PROD E2E Evidence & Zero-Residue Teardown):**
     * Chạy `firebase deploy --only hosting` (tài khoản `vnthietbigarage@gmail.com`) lên `https://lakeducation.edu.vn` & `https://erp.lakeducation.edu.vn`.
     * **Kiểm thử trực tiếp trên Production thật:** Tạo dữ liệu test bắt buộc có tiền tố **`[TEST:DEPLOY:YYYYMMDD]`**, chạy Playwright E2E trên domain thật.
     * **Chụp ảnh màn hình lưu bằng chứng (Evidence Screenshots)** vào `test-results/`.
     * **DỌN SẠCH 100% DỮ LIỆU TEST TRÊN PROD:** Xóa sạch toàn bộ document vừa tạo trên PROD, xác nhận lại `0 test residue` và xuất trình báo cáo cho Sếp Bảo.



---

## 🛑 5. Kỷ Luật Thép: Nghiêm Cấm Tự Ý Tạo Dữ Liệu & Bắt Buộc Dọn Rác Test 100% (`Strict Zero Test-Data Residue & No Unsolicited Data Invariant`)

1. **Tuyệt Đối Không Tự Ý Tạo Dữ Liệu Khi Chưa Có Lệnh:**
   - **NGHIÊM CẤM TUYỆT ĐỐI** tự ý tạo, hardcode hoặc seed dữ liệu mẫu / dữ liệu giả mạo người dùng, giáo viên, học viên (như tự ý gõ nhận xét, tự tạo bản ghi đánh giá buổi học, tự tạo bài tập giả danh giáo viên) khi Sếp Bảo chưa yêu cầu rõ ràng bằng lời.
   - Tuyệt đối không suy đoán chủ quan hoặc nhầm lẫn dữ liệu test do script sinh ra là dữ liệu thật do người dùng nhập.

2. **Kỷ Luật Dọn Sạch Dữ Liệu Test 100% (Strict Teardown Invariant):**
   - Mọi kịch bản kiểm thử E2E tự động (Playwright, Python, Node.js script) nếu có phát sinh dữ liệu tạm để kiểm thử giao diện/API thì **BẮT BUỘC phải dọn sạch hoàn toàn (hard-delete / teardown sạch sẽ 100%)** ngay trong khối `finally` của script.
   - Tuyệt đối cấm để rò rỉ bất kỳ bản ghi test nào (`e2e_`, `test_`, `att_`, `asg_`, `LIVE_`) vào Cloud Firestore thật.
   - Khi hoàn thành bài test, phải assert xác nhận số lượng bản ghi test tồn lưu trong database bằng `0` (`remainingTestDocs === 0`).

3. **Bảo Toàn Trạng Thái Trống Thực Tế (Authentic Empty State):**
   - Nếu thực tế học viên chưa có đánh giá nào từ giáo viên thật, giao diện **BẮT BUỘC phải hiển thị trạng thái Trống (Empty State)**:
     * 🇻🇳 Tiếng Việt: *"Chưa có bản đánh giá nào từ giáo viên"*
     * 🇬🇧 Tiếng Anh: *"No session evaluations yet"*
   - Tuyệt đối cấm tự vẽ ra nhận xét mẫu hoặc giữ lại dữ liệu test để lấp chỗ trống.

4. **Bộ Lọc Bảo Vệ Chống Đánh Giá Ngày Tương Lai (Future Session Protection):**
   - Trong mọi service đọc lịch sử đánh giá buổi học (`StudentDashboardService`), bắt buộc áp dụng điều kiện chặn:
     ```javascript
     const todayStr = new Date().toISOString().split('T')[0];
     if (docData.date && docData.date > todayStr) return;
     ```
   - Tuyệt đối không để buổi học ngày tương lai chưa diễn ra hiển thị như một buổi học đã hoàn thành.

---

## 🚀 6. Quy Trình 12 Bước Xử Lý Bugs & Multi-Hosting Staging Release Protocol

Khi tiếp nhận tài liệu báo cáo bugs hoặc yêu cầu nâng cấp hệ thống (`docs/bugs-*.docx`, `.md`), toàn bộ AI Agent và Coder **BẮT BUỘC tuân thủ nghiêm ngặt quy trình khép kín 12 bước sau**:

1. **Bước 1 (Quét & Phân Loại Toàn Bộ Bugs):** Đọc kỹ tài liệu bugs, trích xuất danh sách tất cả các điểm cần xử lý, phân loại theo màn hình và phân hệ chức năng.
2. **Bước 2 (Tái Hiện Lỗi — Reproduce):** Tái hiện chính xác từng lỗi trên môi trường thực tế (Localhost / Sandbox) bằng script kiểm thử hoặc browser thật.
3. **Bước 3 (Rà Soát Mẫu Lỗi Tương Tự — Cross-Screen Audit):** Quét toàn bộ các màn hình, phân hệ và 6 Roles còn lại xem có xuất hiện pattern lỗi tương tự hay không (ngữ pháp số nhiều, nút bấm rớt chữ, tràn ngang mobile, hardcode i18n...).
4. **Bước 4 (Sửa Chữa Kiến Trúc Đồng Bộ):** Áp dụng giải pháp kỹ thuật sạch sẽ, xử lý tận gốc cả điểm chính và các điểm tương tự phát hiện ở Bước 3.
5. **Bước 5 (Kiểm Thử 3 Tầng Bắt Buộc):**
   - *Tầng 1 (Unit Test):* Chạy độc lập thuật toán logic, scoping, filters với tập dataset mock (`scripts/test_courses_unit_and_scoping.mjs`).
   - *Tầng 2 (Integrated E2E Multi-Role):* Kiểm thử trên trình duyệt Chromium thật qua các vai trò (`student`, `teacher`, `admin`, `academic`, `director`, `accountant`).
   - *Tầng 3 (Stress Test & Viewport Assertions):* Benchmark tốc độ lọc ($< 0.5\text{ms}$), chống rò rỉ bộ nhớ, và đo đạc `ASSERT Zero Overflow-X` trên Mobile 390px (`scrollWidth <= innerWidth`).
6. **Bước 6 (Thu Thập Minh Chứng Bằng Ảnh Chụp — Screenshots):** Chụp ảnh màn hình toàn bộ các ca kiểm thử lưu vào thư mục báo cáo.
7. **Bước 7 (Thẩm Định Checklist Nghiệm Thu):** Đảm bảo 100% test cases đạt PASS trước khi tiến hành đóng gói.
8. **Bước 8 (Triển Khai Môi Trường DEV):** Chạy `npm run deploy:dev` lên môi trường Sandbox (`lakeducation-dev`).
9. **Bước 9 (Kiểm Thử E2E Trên Môi Trường DEV):** Chạy lại trọn vẹn bộ test trên live URL của DEV (`https://lakeducation-dev-erp.web.app`), chụp ảnh minh chứng DEV.
10. **Bước 10 (Triển Khai Backup Production & Production):** Chạy `npm run deploy:backup` và `npm run deploy:prod` sau khi DEV pass 100%.
11. **Bước 11 (Kiểm Thử Production & Kỷ Luật Zero Test Residue):**
    - Chạy kiểm thử E2E trên Production URL (`https://bk.lakeducation.edu.vn` / `https://erp.lakeducation.edu.vn`).
    - **Cưỡng chế:** Tuyệt đối không tạo hoặc để lại bất kỳ dữ liệu test rác nào trên Firestore thật `lakeducationdb`.
12. **Bước 12 (Báo Cáo & Bàn Giao Đầy Đủ):** Xuất bản Biên bản nghiệm thu tổng hợp kèm live links của cả 3 môi trường và thư mục ảnh minh chứng.

---

## ⚡ 7. Chuẩn Playwright E2E Tối Ưu Cho Ứng Dụng Firebase/Firestore SPA (Tránh Timeout 30s)

- **Vấn đề cốt lõi:** Các ứng dụng React Single Page Application (SPA) tích hợp Cloud Firestore và Firebase Analytics liên tục duy trì các kết nối ngầm (WebSocket streaming, long-polling listeners). Do đó, việc sử dụng `wait_until='networkidle'` sẽ khiến Playwright bị **Timeout 30.000ms** vì kết nối mạng không bao giờ hoàn toàn idle.
- **Quy tắc bất biến:**
  ```python
  # ✅ ĐÚNG: Nạp DOM nhanh và chờ render ổn định
  page.goto(f'{URL}/path', wait_until='domcontentloaded')
  page.wait_for_timeout(3000)  # Hoặc page.wait_for_selector('[data-testid="..."]')
  
  # ❌ CẤM: Gây timeout do Firebase listeners ngầm
  page.goto(f'{URL}/path', wait_until='networkidle')
  ```
- Áp dụng thống nhất cho toàn bộ các script kiểm thử tự động trên Localhost, Dev và Production.

---

## 🛡️ 8. Ma Trận Đánh Giá Tác Động 4 Chiều (4-Dimensional Impact Assessment Matrix - Chống Bỏ Sót Bug)

> **Kỷ luật cưỡng chế trước khi code:** Khi sửa bất kỳ component hay logic nào, Agent **TUYỆT ĐỐI CẤM** chỉ nhìn nhận scope bề mặt chức năng. Bắt buộc phải rà soát qua 4 chiều:
> 1. **Chiều 1 — Data Inflow & Temporal Graph (Đồ thị thời gian ngầm):**
>    - Dữ liệu đầu vào của component đến từ đâu? Có bị kích hoạt ngầm bởi Timer đếm ngược (`useClassroomClock`), Polling hay Realtime WebSocket/Firestore listeners không?
>    - Nếu controller có timer tick 1s, bắt buộc phải memoize tham chiếu object (`useMemo`), triệt tiêu việc sinh object reference mới mỗi giây làm re-render toàn bộ cây component con.
> 2. **Chiều 2 — User Dirty State Protection (Bảo vệ dữ liệu đang soạn thảo):**
>    - Component có ô nhập liệu (Input, Textarea, Form, Checkbox) người dùng đang gõ dở không?
>    - Nếu có event ngầm (như timer, realtime update của học sinh khác), dữ liệu gõ dở có bị ghi đè không? Nếu có nguy cơ, bắt buộc dùng Local Buffer State / Ref.
> 3. **Chiều 3 — Hàng Rào Phòng Thủ Cũ (Chesterton's Fence Guard):**
>    - Tuyệt đối **CẤM XÓA HOẶC SIMPLIFY** bất kỳ đoạn code nào có chú thích hoặc bản chất là code phòng thủ (`// Bảo vệ...`, `// Guard...`, `// Tombstone...`, `if (localEditsRef.current[s.id])`).
>    - Nếu muốn tái cấu trúc, bắt buộc phải chứng minh đoạn code mới vẫn bảo toàn 100% tính năng phòng thủ đó.
> 4. **Chiều 4 — Cross-Module Consumers:**
>    - Component, Hook hoặc Service này có bao nhiêu trang và vai trò khác đang dùng chung?

---

## 🔒 9. Nguyên Tắc Kiến Trúc "Cách Ly Buffer Realtime Form" (Local Buffer Invariant)

> **Quy chuẩn kiến trúc React Realtime bắt buộc:**
> 1. Khi một component cho phép người dùng nhập liệu (Input, Textarea, Form):
>    - Toàn bộ dữ liệu người dùng đang soạn thảo (**Dirty State**) bắt buộc phải được lưu giữ độc lập trong **Local State / Local Ref** làm bộ đệm (Buffer).
>    - Realtime stream (Firestore `onSnapshot`, Polling, WebSocket, Clock Timer) **CHỈ ĐƯỢC PHÉP CẬP NHẬT DỮ LIỆU NỀN**, tuyệt đối không được ghi đè (`overwrite`) lên ô nhập liệu mà người dùng đang gõ hoặc chưa lưu.
> 2. Khi nạp dữ liệu mới từ server, bắt buộc thực hiện **Merge thông minh**:
>    `merged = { ...serverData, ...userLocalEdits }` (Ưu tiên tuyệt đối nội dung người dùng đang gõ trong `localEditsRef`).
> 3. Chỉ reset `localEditsRef` khi người dùng chủ động chuyển hẳn sang một bản ghi hoặc buổi học khác (`record.id` / `sessionIndex` thay đổi).

---

## 🧪 10. Kiểm Thử Độ Trễ Gõ Phím Con Người & Bộ Khóa Chốt Hồi Quy Trước Deploy (Zero-Reopen Gatekeeper)

> **Kỷ luật cưỡng chế trong mọi kịch bản kiểm thử E2E Playwright:**
> 1. **Thử nghiệm Độ trễ Con người (Temporal Typing Retention Test $\ge 3\text{s}$):**
>    - Tuyệt đối cấm kiểm thử bằng cách bấm nút tag/điền form rồi bấm Lưu ngay lập tức ($< 1\text{s}$).
>    - Mọi form/input bắt buộc phải test qua kịch bản con người:
>      ```python
>      await textarea.fill("Nội dung đánh giá kiểm thử...")
>      await page.wait_for_timeout(3500)  # ⏳ Bắt buộc dừng 3.5 giây mô phỏng con người dừng tay suy nghĩ
>      val_after = await textarea.input_value()
>      assert val_after == "Nội dung đánh giá kiểm thử...", "FAIL: Chữ bị xóa hoặc reset do re-render ngầm!"
>      ```
> 2. **Cổng Khóa Chốt Hồi Quy Trước Deploy (Cumulative Regression Lock Gate):**
>    - Mọi bug sau khi sửa bắt buộc phải được đưa vào bộ test tự động tích lũy (`scripts/qc_regression_typing_retention.py`).
>    - Trước khi chạy lệnh Deploy (`deploy:dev`, `deploy:backup`, `deploy:prod`), hệ thống bắt buộc chạy lại toàn bộ test suite hồi quy.
>    - **Nếu một tính năng mới làm gãy bất kỳ test cũ nào $\rightarrow$ LẬP TỨC CHẶN ĐỨNG BUILD VÀ DỪNG DEPLOY!**

