# AGENTS.md - Rule Guidelines for AI Agents & Developers in ThiEducation

Chào mừng bạn đến với dự án **ThiEducation** (Educational Management ERP System - Quy mô 520 Học viên & 68 Cán bộ/Giáo viên).

File này quy định **CẤU TRÚC VÀ QUY TẮC BẮT BUỘC** mà mọi AI Agent (Antigravity, Gemini, Copilot...) và Coder phải tuân thủ nghiêm ngặt khi đọc, sửa đổi hoặc thêm mới tính năng.

---

## 🏗️ 1. Cấu Trúc Dự Án (Feature-Based Modular Architecture)

Dự án được phân chia thành 3 tầng chính:

```
ThiEducation/
├── .agents/                    # Quy tắc nghiêm ngặt dành cho AI Agent
│   └── rules/                  # Các tập tin quy tắc chi tiết
├── AGENTS.md                   # File hướng dẫn trung tâm
├── src/
│   ├── core/                   # Tầng lõi khung ứng dụng (Layout, Auth, Router, Firebase)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── layout/             # AppLayout (Header, Sidebar, Mobile Drawer)
│   │   └── services/           # Firebase SDK Client & Core API Adapters
│   │
│   ├── modules/                # TẦNG PHÂN HỆ ĐỘC LẬP (Feature Modules)
│   │   ├── dashboard/          # Phân hệ Dashboard Tổng quan
│   │   ├── contracts/          # Phân hệ Quản lý Hợp đồng & Bảng Lương GV
│   │   ├── schedules/          # Phân hệ Quản lý Thời khóa biểu
│   │   ├── attendance/         # Phân hệ Quản lý Lớp học, Điểm danh & Chất lượng
│   │   └── tuition/            # Phân hệ Quản lý Học phí 520 Học viên
│   │
│   └── shared/                 # Tầng dùng chung (Reusable Components & Helpers)
│       ├── components/         # Antd DataTable Wrapper, Modals dùng chung
│       ├── utils/              # Formatters, Validation, Currency helpers
│       └── data/               # Centralized Mock Dataset
```

---

## 🚫 2. Quy Tắc Độc Lập Module (Zero Impact Cross-Module Mutation)

1. **Không can thiệp chéo giữa các Module:**
   - Mỗi Module trong `src/modules/<module_name>/` phải có đầy đủ giao diện, logic, và trạng thái nội bộ.
   - Khi chỉnh sửa Module `contracts` (Hợp đồng & Lương), **CẤM** được thay đổi trực tiếp file hoặc logic thuộc Module `tuition` hoặc `schedules`.
2. **Xuất Module qua File Index:**
   - Mỗi Module phải có 1 file `index.jsx` duy nhất đóng vai trò **Public Entry Point** đại diện cho Module đó.
3. **Shared Utility Layer (`src/shared/`):**
   - Nếu có hàm helper hoặc UI component được dùng ở từ 2 Module trở lên, phải đưa vào `src/shared/`, **KHÔNG** import trực tiếp file của Module này sang Module khác.

---

## 📋 3. QuyChuẩn Code React & Ant Design

1. **Thư viện UI chuẩn:** Sử dụng **Ant Design (`antd`)** làm thư viện thiết kế UI chính.
2. **Responsive First:** Mọi màn hình mới thêm vào phải đảm bảo hiển thị hoàn hảo trên màn hình **Mobile (`< 768px`)** và **Desktop (`>= 768px`)**.
3. **Phân quyền Role-based:** Mọi tính năng nhạy cảm (Tạo hợp đồng, duyệt lương, xóa dữ liệu) phải được bọc kiểm tra role từ `useAuth()` (`admin`, `teacher`, `student`).

---

## ⚡ 4. Kiểm Trả Trước Khi Commit Code

Mọi thay đổi code bắt buộc phải chạy lệnh này để đảm bảo không bị gãy build:
```bash
npm run build
```
