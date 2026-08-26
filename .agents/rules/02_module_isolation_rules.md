# Rule 02: Zero Impact Cross-Module Isolation (Quy tắc Độc lập Module)

## Mục tiêu
Đảm bảo khi chỉnh sửa, refactor, hoặc thêm tính năng vào một phân hệ (Module A), các phân hệ khác (Module B, Module C) **100% không bị tác động tiêu cực hay phát sinh lỗi (Side-effects)**.

## Các quy định bắt buộc:
1. **Không Import chéo từ Module này sang Module khác:**
   - BAD: `import { ContractTable } from '../contracts/components/ContractTable'` bên trong Module `tuition`.
   - GOOD: Đưa component dùng chung đó vào `src/shared/components/` trước khi sử dụng ở cả 2 nơi.

2. **State Isolation:**
   - Mỗi Module tự quản lý React state hoặc Local Storage của chính mình.
   - Không được biến đổi trực tiếp State hoặc Data của Module khác.

3. **Chỉ xuất qua Entry Point (`index.jsx`):**
   - Mọi truy xuất ngoài Module chỉ được phép thông qua file `src/modules/<module_name>/index.jsx`.
