# Danh Bạ Tài Khoản & Mật Khẩu Kiểm Thử Localhost (`LAK EDUCATION`)

> **Môi trường:** Localhost (`http://localhost:3000` / `http://127.0.0.1:3000`)  
> **Cơ sở dữ liệu:** Cloud Firestore Development (`lakeducation-dev` — `lakeducationdb`)  
> **Cập nhật:** 14/11/2026 — Đồng bộ 100% tài khoản thực tế đang hoạt động trên hệ thống  
> **Tệp cấu hình máy đọc:** [`docs/local_dev_accounts.json`](file:///Volumes/DATA/projects/ThiEducation/docs/local_dev_accounts.json)

---

## 📌 Hướng Dẫn 2 Cách Đăng Nhập Nhanh

1. **Cách 1 (1-Click SSO URL — Không cần gõ mật khẩu):**
   - Mở trực tiếp link: `http://localhost:3000/?sso_uid=<MÃ_ID>` (Ví dụ: `http://localhost:3000/?sso_uid=ADM001` hoặc `http://localhost:3000/?sso_uid=GV952`).
   - Hệ thống tự động chuyển ngữ cảnh tài khoản ngay lập tức.
2. **Cách 2 (Đăng nhập qua Form Login chuẩn):**
   - Truy cập `http://localhost:3000/login`.
   - Nhập **Email** (hoặc **Số điện thoại**) và **Mật khẩu** tương ứng trong bảng bên dưới.

---

## 👑 1. Ban Quản Trị & Cán Bộ Vận Hành (5 Roles Cốt Lõi)

> **Mật khẩu chuẩn môi trường DEV:** `@Bcd1234` (áp dụng đồng bộ cho tất cả tài khoản DEV).

| Vai trò (Role) | Mã ID | Họ và tên | Định danh đăng nhập (Email / SĐT) | Mật khẩu (Password) | Link Đăng Nhập Nhanh 1-Click | Phạm vi kiểm thử chính |
| :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **🛠️ IT Admin** | `ADM001` | **Phạm Quốc Bảo** | `phamquocbao87@gmail.com`<br>*(hoặc SĐT `0898794116`)* | `@Bcd1234` | [Đăng nhập ADM001](http://localhost:3000/?sso_uid=ADM001) | Quản trị toàn hệ thống, cấu hình bảo mật, audit logs, phân quyền người dùng. |
| **👑 Giám Đốc** | `DIR505` | **Phạm Thị Hiếu Thi** | `lakvietnam@lakeducation.com`<br>*(hoặc SĐT `0961557696`)* | `@Bcd1234` | [Đăng nhập DIR505](http://localhost:3000/?sso_uid=DIR505) | Giám sát điều hành tổng, duyệt bảng lương, xem thu/chi học phí, báo cáo tài chính. |
| **🎓 Giáo Vụ** | `ACA404` | **Diễm Quỳnh** | `quynhdao0210@gmail.com`<br>*(hoặc SĐT `09878987`)* | `@Bcd1234` | [Đăng nhập ACA404](http://localhost:3000/?sso_uid=ACA404) | Tạo khóa học & lớp học, xếp thời khóa biểu, duyệt học viên vào lớp, theo dõi điểm danh live. |
| **🎓 Giáo Vụ** | `ACA545` | **Ngọc Nhi** | `nngoc.nhi0302@gmail.com`<br>*(hoặc SĐT `0904492894`)* | `@Bcd1234` | [Đăng nhập ACA545](http://localhost:3000/?sso_uid=ACA545) | Điều phối viên giáo vụ đào tạo, chấm công giáo viên, nhắc đóng học phí. |
| **🎓 Giáo Vụ (Test)** | `HV254` | **GV01** | `baolamstudio@gmail.com`<br>*(hoặc SĐT `098978971`)* | `@Bcd1234` | [Đăng nhập HV254](http://localhost:3000/?sso_uid=HV254) | Tài khoản Giáo vụ kiểm thử bổ trợ. |
| **💰 Kế Toán** | `ACC330` | **Lê Thị Mỹ Dung** | `lemydung49@gmail.com`<br>*(hoặc SĐT `0983548212`)* | `@Bcd1234` | [Đăng nhập ACC330](http://localhost:3000/?sso_uid=ACC330) | Đối soát thu học phí, xác nhận thanh toán, chi trả lương Giáo viên & Giáo vụ. |
| **👨‍🏫 Giáo Viên** | `GV952` | **Teacher Maj** | `paguntalan.marjorie05@gmail.com`<br>*(hoặc SĐT `090544134`)* | `@Bcd1234` | [Đăng nhập GV952](http://localhost:3000/?sso_uid=GV952) | Phụ trách lớp `LH005`, `LH002`, `LH004`. Thao tác Check-in, Điểm danh trực tiếp tại `/classroom/LH005`, chấm điểm & nhận xét. |

---

## 🎒 2. Danh Sách 15 Học Viên Thực Tế (`student`)

> **Quy ước đăng nhập Học viên trên môi trường DEV:**  
> - **Tên đăng nhập:** Số điện thoại phụ huynh đăng ký (Ví dụ: `0786436333`).  
> - **Mật khẩu chuẩn môi trường DEV:** **`@Bcd1234`** *(100% 55 tài khoản trên DEV đều dùng mật khẩu này)*  
> - **Mật khẩu môi trường Production thật:** `LakEducation@2026`  

| STT | Mã Học Viên | Họ và tên | Tên tiếng Anh | Số điện thoại đăng nhập | Mật khẩu DEV | Link Đăng Nhập 1-Click | Lớp học đang tham gia |
| :---: | :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 1 | `HV151` | **Bui Truong Tuong Vi** | Vivian | `0786436333` | `@Bcd1234` | [Đăng nhập HV151](http://localhost:3000/?sso_uid=HV151) | `LH005` |
| 2 | `HV235` | **Nguyen Le Khanh Trang** | Tracy | `0835556263` | `@Bcd1234` | [Đăng nhập HV235](http://localhost:3000/?sso_uid=HV235) | `LH005` |
| 3 | `HV253` | **Nguyen Dang Thanh Nha** | Melissa | `0909005750` | `@Bcd1234` | [Đăng nhập HV253](http://localhost:3000/?sso_uid=HV253) | `LH005`, `LH002` |
| 4 | `HV257` | **Nguyen Thao An** | Anna | `0904899867` | `@Bcd1234` | [Đăng nhập HV257](http://localhost:3000/?sso_uid=HV257) | Cổng học viên |
| 5 | `HV267` | **Nguyen Ngoc Thien An** | Sam | `0969839259` | `@Bcd1234` | [Đăng nhập HV267](http://localhost:3000/?sso_uid=HV267) | `LH005`, `LH002` |
| 6 | `HV344` | **Le Phat** | Sam | `0976857040` | `@Bcd1234` | [Đăng nhập HV344](http://localhost:3000/?sso_uid=HV344) | Cổng học viên |
| 7 | `HV361` | **Ta Dang Viet Hai** | Edison | `0987866303` | `@Bcd1234` | [Đăng nhập HV361](http://localhost:3000/?sso_uid=HV361) | `LH005`, `LH002` |
| 8 | `HV463` | **Trinh Binh Minh** | Minh | `0916856689` | `@Bcd1234` | [Đăng nhập HV463](http://localhost:3000/?sso_uid=HV463) | Cổng học viên |
| 9 | `HV479` | **Do Ngoc Thinh** | Watery | `0983107221` | `@Bcd1234` | [Đăng nhập HV479](http://localhost:3000/?sso_uid=HV479) | `LH002` |
| 10 | `HV482` | **Ha Thinh Gia Bao** | Subin | `0355500736` | `@Bcd1234` | [Đăng nhập HV482](http://localhost:3000/?sso_uid=HV482) | `LH002` |
| 11 | `HV739` | **Nguyen Đinh Vu** | Cody | `0983424411` | `@Bcd1234` | [Đăng nhập HV739](http://localhost:3000/?sso_uid=HV739) | Cổng học viên |
| 12 | `HV768` | **Nguyen Phu Quy** | Kenji | `0979264110` | `@Bcd1234` | [Đăng nhập HV768](http://localhost:3000/?sso_uid=HV768) | Cổng học viên |
| 13 | `HV801` | **Nguyen Minh Thu** | Haide | `0975566722` | `@Bcd1234` | [Đăng nhập HV801](http://localhost:3000/?sso_uid=HV801) | `LH002` |
| 14 | `HV905` | **Pham Nguyen Phuc Thanh** | Eric | `0374997977` | `@Bcd1234` | [Đăng nhập HV905](http://localhost:3000/?sso_uid=HV905) | Cổng học viên |
| 15 | `HV971` | **Tra Phan Hanh Nhi** | Lucky | `0945699966` | `@Bcd1234` | [Đăng nhập HV971](http://localhost:3000/?sso_uid=HV971) | Cổng học viên |

---

## 🎯 Ma Trận Kiểm Thử Phân Quyền Theo 6 Roles

| Chức năng kiểm thử | `admin` (ADM001) | `director` (DIR505) | `academic` (ACA404) | `teacher` (GV952) | `accountant` (ACC330) | `student` (HV151) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Xem Dashboard Tổng Quan** | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Nghiệp vụ ĐT | ✅ Chỉ lớp dạy | ❌ Chặn | ❌ Chặn |
| **Cổng Học Viên (`/student-portal`)** | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn | ✅ Chỉ hồ sơ mình |
| **Điểm Danh Lớp Trực Tiếp (`/classroom/LH005`)** | 👁️ Theo dõi | 👁️ Theo dõi | 👁️ Theo dõi | ✍️ **Điểm danh Live** | ❌ Chặn | ❌ Chặn |
| **Tạo / Sửa Khóa Học & Lớp Học** | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ❌ Chặn | ❌ Chặn | ❌ Chặn |
| **Check-in Ca Dạy Thời Khóa Biểu** | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Ca dạy mình | ❌ Chặn | ❌ Chặn |
| **Duyệt Bảng Lương Giáo Viên / Giáo Vụ** | ✅ Toàn quyền | ✍️ **Ký duyệt** | ❌ Chặn | ❌ Chặn | ✍️ **Chi trả** | ❌ Chặn |
| **Xác Nhận Đóng Học Phí** | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ❌ Chặn | ✍️ **Xác nhận thu** | ❌ Chặn |

