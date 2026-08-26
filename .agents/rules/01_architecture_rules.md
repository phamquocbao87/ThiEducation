# Rule 01: Feature-Based Modular Architecture & Phân Tầng Hệ Thống

## Nguyên tắc thiết kế
1. Dự án `ThiEducation` sử dụng kiến trúc **Feature-Based Modular Architecture**.
2. Thư mục `src/modules/` là nơi chứa các phân hệ độc lập.
3. Mỗi phân hệ (ví dụ: `contracts`, `schedules`, `attendance`, `tuition`, `dashboard`) là một đơn vị kinh doanh khép kín.

## Cấu trúc chuẩn của một Module (`src/modules/<name>/`):
```
src/modules/<name>/
├── components/          # (Tùy chọn) Các component nhỏ nội bộ của module
├── services/            # (Tùy chọn) API calls/Firebase calls riêng của module
├── <Name>Manager.jsx    # View chính đại diện cho Module
└── index.jsx            # Public Entry Point xuất duy nhất View đại diện
```

## Phân tầng trách nhiệm:
- **`src/core/`**: Chứa hạ tầng dùng chung (AppLayout, Auth Context, Firebase setup).
- **`src/modules/`**: Chứa toàn bộ nghiệp vụ ứng dụng phân theo từng phân hệ.
- **`src/shared/`**: Chứa tiện ích dùng chung (Formatters, Shared UI, Mock Data).
