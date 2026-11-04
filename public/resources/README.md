# Kho Tài Nguyên Hình Ảnh & Media Landing Page (`public/resources/`)

Thư mục này là nơi chứa toàn bộ hình ảnh, logo, banner và tài nguyên tĩnh phục vụ cho **Trang Chủ / Landing Page (`lakeducation.com`)**.
Vì nằm trong `public/resources/`, mọi file bạn chép vào đây có thể gọi trực tiếp trên giao diện qua đường dẫn `/resources/<thư_mục_con>/<tên_file>` mà không cần `import` thủ công trong code.

## 📁 Cấu Trúc Các Thư Mục Con Đã Tạo Sẵn

| Thư mục con | Đường dẫn đầy đủ trên máy | Gợi ý các file bạn có thể thả vào | Cách gọi trong Code React |
| :--- | :--- | :--- | :--- |
| **`1. logo/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/logo/` | Logo chính (`logo.png`, `logo-white.png`, `favicon.png`) | `<img src="/resources/logo/logo.png" />` |
| **`2. banners/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/banners/` | Ảnh Hero Banner đầu trang, ảnh nền phần giới thiệu (`hero-main.jpg`, `about-banner.png`) | `<img src="/resources/banners/hero-main.jpg" />` |
| **`3. courses/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/courses/` | Ảnh đại diện các khóa học (`kids-starters.jpg`, `ielts-intensive.jpg`, `business-english.jpg`) | `<img src="/resources/courses/ielts-intensive.jpg" />` |
| **`4. teachers/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/teachers/` | Ảnh chân dung Giáo viên bản xứ nổi bật trên Landing Page | `<img src="/resources/teachers/teacher-1.jpg" />` |
| **`5. testimonials/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/testimonials/` | Ảnh học viên đạt điểm cao, phản hồi phụ huynh, chứng chỉ IELTS | `<img src="/resources/testimonials/student-1.jpg" />` |
| **`6. gallery/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/gallery/` | Ảnh chụp màn hình lớp học Zoom thực tế, hoạt động trung tâm | `<img src="/resources/gallery/class-zoom-1.jpg" />` |
| **`7. icons/`** | `/Volumes/DATA/projects/ThiEducation/public/resources/icons/` | Các icon SVG/PNG trang trí cho ưu điểm vượt trội (USPs), huy hiệu | `<img src="/resources/icons/badge.svg" />` |

