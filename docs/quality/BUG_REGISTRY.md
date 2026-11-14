# Bug Prevention Registry

> Danh mục ngắn các lỗi có thể tái phát trong LAK EDUCATION. Mục đích là giúp Agent tìm thấy pattern cũ trước khi code/fix và liên kết mỗi lỗi với guardrail cùng regression test. Không lưu PII, token, dữ liệu Firestore thật, ảnh chứa thông tin nhạy cảm hoặc raw stack trace.

## Cách dùng

1. Trước khi sửa bug hoặc phát triển trong một module, tìm theo tên module, chức năng và từ khóa nghiệp vụ: `rg -n "courses|enrollment" docs/quality/BUG_REGISTRY.md`.
2. Với bug mức L2+ hoặc bug đã lặp lại, thêm/cập nhật một dòng dưới đây trong cùng thay đổi đã fix.
3. Một dòng chỉ hợp lệ khi có guardrail và regression test/ca test lặp lại được. Nếu chưa thể tự động hóa, ghi ID manual test và lý do ở cột Regression.
4. Với lỗi L3/L4 hoặc lỗi cần điều tra dài, tạo `docs/quality/bugs/<bug-id>.md`; bảng này vẫn là chỉ mục chính.

## Registry

| ID | Module / phạm vi | Triệu chứng & pattern | Nguyên nhân gốc | Guardrail phòng ngừa | Regression | Xác minh tại | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-20261114-001 | `dashboard` / `StudentPortalPanel` | Nút ca học hiển thị cứng chữ "Zoom" trong khi link thực tế là Google Meet; nút vẫn mở cho bấm vào dù ca học còn 2 ngày nữa mới diễn ra | Hardcode chuỗi `'🎥 Vào Lớp Học Zoom Ngay'` thay vì dùng `detectMeetingPlatform`; thiếu kiểm tra `getSessionTimer` khóa phòng trước 15 phút | Bắt buộc dùng `detectMeetingPlatform` + `MeetingPlatformBadge` và khóa nút (`disabled`, `Opens 15m Before`) khi `startsIn > 900` | `scripts/test_student_dashboard_redesign.py` — PASS 100% | Version 1.2.88 • build 2026111439v | Closed |

## Mẫu một bản ghi

| ID | Module / phạm vi | Triệu chứng & pattern | Nguyên nhân gốc | Guardrail phòng ngừa | Regression | Xác minh tại | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-20261112-001 | `courses` / đổi lịch | Lịch cũ biến mất khi cập nhật lịch mới | Ghi đè lịch thay vì tạo giai đoạn mới | Luôn dùng `buildUpdatedScheduleHistory`; không ghi đè lịch sử | `schedule-history.spec` — PASS | Version/build đã bàn giao | Closed |
