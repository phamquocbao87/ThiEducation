# Rule 02: Zero Impact Cross-Module Isolation & Mandatory Impact Assessment (Quy tắc Độc lập Module & Đánh giá Tác động)

## 1. Mục Tiêu Cốt Lõi
Đảm bảo khi chỉnh sửa, refactor, hoặc thêm tính năng vào một phân hệ (Module A / Chức năng A), các phân hệ và chức năng khác (Module B, Module C...) **100% không bị tác động tiêu cực, không bị thay đổi ngầm hay phát sinh lỗi (Zero Unsolicited Side-effects & No Regression)**.

---

## 2. Kỷ Luật Bất Biến Về Phạm Vi Task (Strict Scope Integrity)
1. **Tuyệt đối không tự ý thay đổi chức năng khác khi chưa có yêu cầu / thông báo:**
   - Khi nhận nhiệm vụ sửa chữa, tối ưu hoặc làm mới chức năng A: AI Agent & Developer **CHỈ ĐƯỢC PHÉP THAO TÁC TRONG PHẠM VI CHỨC NĂNG A**.
   - Tuyệt đối **CẤM** tiện tay sửa đổi, refactor lại mã nguồn, đổi logic nghiệp vụ, xóa bỏ hoặc làm mới bất kỳ chức năng B nào khác nếu chưa có yêu cầu rõ ràng từ Sếp Bảo hoặc chưa thông báo xin phép trước.
2. **Quy tắc dừng lại khi phát hiện lỗi ngoài phạm vi:**
   - Nếu trong quá trình làm việc với chức năng A mà phát hiện chức năng B đang có lỗi hoặc thiếu sót: **BẮT BUỘC DỪNG LẠI, BÁO CÁO RÕ CHO SẾP BẢO VÀ XIN Ý KIẾN**, chỉ khi Sếp đồng ý mới được đụng vào, tuyệt đối không được tự ý "tiện tay sửa luôn".

---

## 3. Quy Trình 3 Bước Đánh Giá Tác Động Bắt Buộc (Mandatory Impact Assessment Protocol)
Trước khi bắt tay vào chỉnh sửa code hoặc làm tính năng mới, Agent bắt buộc phải thực hiện đánh giá tác động:

### Bước 1: Phân Tích Phạm Vi Ảnh Hưởng (Impact Scope Analysis)
- Liệt kê cụ thể:
  * Những file Component, Hook, Service, Model dữ liệu nào trực tiếp thay đổi?
  * Những Module, Route hoặc Shared Layer nào có liên kết với file sắp sửa?
  * Cơ sở dữ liệu (Firestore / Local Storage) có bị thay đổi cấu trúc schema không?

### Bước 2: Đánh Giá Rủi Ro Hồi Quy & Phá Vỡ (Regression Risk & Breaking Change Check)
- Phân tích rủi ro:
  * Việc sửa chức năng A có làm thay đổi input/output của một hàm dùng chung không?
  * Các Module khác (B, C...) đang gọi hàm/component đó có nguy cơ bị gãy (crash / runtime error / style break) không?
  * Trải nghiệm người dùng trên Mobile và Desktop ở các trang khác có bị ảnh hưởng không?

### Bước 3: Thông Báo & Xin Phép Trước Khi Can Thiệp (Notify & Approval Before Modifying)
- Nếu việc sửa chức năng A bắt buộc phải thay đổi một file dùng chung (`src/shared/`, `src/core/`, `BaseModuleService`, `PermissionService`, `LanguageContext`...) hoặc ảnh hưởng tới chức năng B:
  * Agent **BẮT BUỘC PHẢI BÁO CÁO RÕ CHO SẾP BẢO**: Lý do cần thay đổi, phạm vi ảnh hưởng tới các chức năng khác, và đề xuất giải pháp an toàn nhất.
  * Chỉ tiến hành sau khi nhận được sự đồng thuận từ Sếp Bảo.

---

## 4. Các Quy Định Kỹ Thuật Bắt Buộc Về Cách Ly Module
1. **Không Import chéo từ Module này sang Module khác:**
   - BAD: `import { ContractTable } from '../contracts/components/ContractTable'` bên trong Module `tuition`.
   - GOOD: Đưa component dùng chung đó vào `src/shared/components/` trước khi sử dụng ở cả 2 nơi (sau khi đã đánh giá tác động).
2. **State Isolation:**
   - Mỗi Module tự quản lý React state hoặc Local Storage của chính mình.
   - Không được biến đổi trực tiếp State hoặc Data của Module khác.
3. **Chỉ xuất qua Entry Point (`index.jsx`):**
   - Mọi truy xuất ngoài Module chỉ được phép thông qua file `src/modules/<module_name>/index.jsx`.
4. **Báo cáo Minh bạch sau khi hoàn thành:**
   - Khi báo cáo kết quả, Agent phải liệt kê danh sách các file đã thay đổi, cam kết và chứng minh các chức năng khác vẫn hoạt động ổn định 100%.
