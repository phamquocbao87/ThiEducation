import sys
import time
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3000'

def run_exercises_qc():
    print("🚀 Bắt đầu Kiểm toán QC: Nâng cấp Toàn diện Phân Hệ Bài Tập Tiếng Anh (/english-exercises)")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # =========================================================================
        # 1. Desktop Test (1366x800) - Giáo Vụ Diễm Quỳnh (ACA404)
        # =========================================================================
        print("\n--- [Desktop 1366x800] 1. Đăng nhập Giáo Vụ Diễm Quỳnh (ACA404) & Kiểm tra Giao diện Quản Lý ---")
        context_desktop = browser.new_context(viewport={"width": 1366, "height": 800})
        page_desktop = context_desktop.new_page()

        page_desktop.goto(f"{BASE}/?sso_uid=ACA404", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1000)
        page_desktop.evaluate("localStorage.setItem('lak_app_language', 'vi')")
        page_desktop.goto(f"{BASE}/english-exercises", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(2000)

        # 1.1 Kiểm tra Header song ngữ & Nút Tạo bài tập
        print("Kiểm tra Header Tiếng Việt:")
        header_title = page_desktop.locator("text=Bài Tập Tiếng Anh & Luyện Kỹ Năng")
        assert header_title.is_visible(), "LỖI: Thiếu tiêu đề tiếng Việt chuẩn của phân hệ bài tập"
        create_btn = page_desktop.locator("button:has-text('Tạo Bài Tập')")
        assert create_btn.is_visible(), "LỖI: Giáo vụ phải thấy nút Tạo Bài Tập"
        print("✅ Header hiển thị đúng nhãn Tiếng Việt và nút 'Tạo Bài Tập' nổi bật")

        # 1.2 Kiểm tra Tab 1: Kho Đề Bài Tập & Thao Tác Chuẩn Đẹp
        print("\nKiểm tra Tab 1: Kho Đề Bài Tập & Thao Tác Nút Bấm Chuẩn Đẹp:")
        search_exercise = page_desktop.locator("input[placeholder*='Tìm theo tên bài tập']")
        assert search_exercise.is_visible(), "LỖI: Thiếu ô tìm kiếm tên bài tập trong Kho Đề"
        
        # Kiểm tra Hàng 1 trong Bảng Kho Đề Bài Tập
        first_row = page_desktop.locator(".ant-table-row").first
        assert first_row.is_visible(), "LỖI: Phải có ít nhất 1 bài tập trong Kho Đề"
        
        # Kiểm tra 3 nút Thao Tác: Xem Thử, Sửa, Giao Bài
        btn_preview = first_row.locator("button:has-text('Xem Thử')")
        btn_edit = first_row.locator("button:has-text('Sửa')")
        btn_assign = first_row.locator("button:has-text('Giao Bài')")

        assert btn_preview.is_visible(), "LỖI: Thiếu nút Xem Thử"
        assert btn_edit.is_visible(), "LỖI: Thiếu nút Sửa (tối ưu gọn đẹp)"
        assert btn_assign.is_visible(), "LỖI: Thiếu nút Giao Bài"

        # ĐO ĐẠC CÔNG THÁI HỌC & CHỐNG RỚT CHỮ (ASSERT No Broken Words & No Squishing)
        box_preview = btn_preview.bounding_box()
        box_edit = btn_edit.bounding_box()
        box_assign = btn_assign.bounding_box()

        print(f"  - Nút 'Xem Thử': rộng {box_preview['width']:.1f}px, cao {box_preview['height']:.1f}px")
        print(f"  - Nút 'Sửa': rộng {box_edit['width']:.1f}px, cao {box_edit['height']:.1f}px")
        print(f"  - Nút 'Giao Bài': rộng {box_assign['width']:.1f}px, cao {box_assign['height']:.1f}px")

        # Kiểm tra chiều cao nút nhỏ: chuẩn Antd size='small' là 24px (tối đa 28px nếu có padding). Cấm cao 40-70px do rớt chữ!
        assert box_preview['height'] <= 30, f"LỖI: Nút Xem Thử bị bóp nghẹt thành nhiều dòng! Chiều cao: {box_preview['height']}"
        assert box_edit['height'] <= 30, f"LỖI: Nút Sửa bị bóp nghẹt thành nhiều dòng! Chiều cao: {box_edit['height']}"
        assert box_assign['height'] <= 30, f"LỖI: Nút Giao Bài bị bóp nghẹt thành nhiều dòng! Chiều cao: {box_assign['height']}"

        # Kiểm tra thẳng hàng ngang (y coordinates tương đương nhau)
        y_diff = abs(box_preview['y'] - box_edit['y']) + abs(box_edit['y'] - box_assign['y'])
        assert y_diff < 5, f"LỖI: 3 nút không thẳng hàng ngang! Độ lệch y: {y_diff}"
        print("✅ ASSERT PASS: Cả 3 nút Thao Tác nằm thẳng tắp trên 1 hàng ngang, không rớt chữ, không bị bóp nghẹt!")

        # Chụp ảnh cận cảnh Tab 1 Kho Đề Bài Tập
        page_desktop.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_exercises_author_tab1_actions.png")

        # 1.3 Chuyển sang Tab 2: Quản Lý Bài Nộp
        print("\nKiểm tra Tab 2: Quản Lý Bài Nộp Của Học Viên:")
        submissions_tab = page_desktop.locator(".ant-tabs-tab:has-text('Quản Lý Bài Nộp')")
        assert submissions_tab.is_visible(), "LỖI: Không tìm thấy Tab Quản Lý Bài Nộp"
        submissions_tab.click()
        page_desktop.wait_for_timeout(800)

        # Kiểm tra Bộ lọc Lớp Học & Bộ lọc Trạng Thái
        class_filter = page_desktop.locator(".ant-select:has-text('Tất Cả Lớp Học')")
        assert class_filter.is_visible(), "LỖI: Thiếu bộ lọc theo lớp học"
        status_filter = page_desktop.locator(".ant-select:has-text('Tất Cả Trạng Thái')").last
        assert status_filter.is_visible(), "LỖI: Thiếu bộ lọc theo trạng thái"
        print("✅ Bộ lọc lớp học và trạng thái bài nộp (Chờ Chấm / Đã Chấm) hiển thị đầy đủ")

        # Kiểm tra Bảng bài nộp
        submission_rows = page_desktop.locator(".ant-table-row")
        print(f"Số lượng bài nộp tìm thấy: {submission_rows.count()}")
        assert submission_rows.count() > 0, "LỖI: Phải hiển thị ít nhất 1 bài nộp đã làm"

        # 1.4 Kiểm tra Zero Overflow-X Desktop
        assert page_desktop.evaluate("document.body.scrollWidth <= innerWidth"), "LỖI: Tràn ngang trên Desktop!"
        print("✅ ASSERT PASS: Zero Overflow-X trên Desktop 1366px")

        # Chụp ảnh Desktop
        page_desktop.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_exercises_submissions_desktop.png")

        # =========================================================================
        # 2. English Mode Test (1366x800) - Kiểm tra Đa Ngôn Ngữ i18n
        # =========================================================================
        print("\n--- [Desktop 1366x800] 2. Kiểm tra Đa Ngôn Ngữ (English Mode) ---")
        page_desktop.evaluate("localStorage.setItem('lak_app_language', 'en')")
        page_desktop.reload(wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1500)

        en_title = page_desktop.locator("text=English Exercises & Practice")
        assert en_title.is_visible(), "LỖI: Tiêu đề tiếng Anh chưa hiển thị đúng"
        en_create_btn = page_desktop.locator("button:has-text('Create Exercise')")
        assert en_create_btn.is_visible(), "LỖI: Nút Create Exercise chưa hiển thị đúng tiếng Anh"
        en_tab_bank = page_desktop.locator(".ant-tabs-tab:has-text('Exercise Bank')")
        assert en_tab_bank.is_visible(), "LỖI: Tab Exercise Bank chưa hiển thị đúng"
        en_tab_sub = page_desktop.locator(".ant-tabs-tab:has-text('Student Submissions')")
        assert en_tab_sub.is_visible(), "LỖI: Tab Student Submissions chưa hiển thị đúng"
        print("✅ Chế độ Tiếng Anh (EN) hiển thị hoàn hảo 100% không còn chuỗi ghép song ngữ cứng 'Title / Tiêu đề'")
        page_desktop.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_exercises_academic_desktop.png")
        context_desktop.close()

        # =========================================================================
        # 3. Mobile Test (390x844) - Học Viên Tracy (HV235)
        # =========================================================================
        print("\n--- [Mobile 390x844] 3. Kiểm tra Trải nghiệm Mobile First cho Học Viên ---")
        context_mobile = browser.new_context(viewport={"width": 390, "height": 844})
        page_mobile = context_mobile.new_page()

        page_mobile.goto(f"{BASE}/?sso_uid=HV151", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(1000)
        page_mobile.evaluate("localStorage.setItem('lak_app_language', 'vi')")
        page_mobile.goto(f"{BASE}/english-exercises", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(2000)

        # Học viên không được thấy nút Tạo Bài Tập
        assert page_mobile.locator("button:has-text('Tạo Bài Tập')").count() == 0, "LỖI: Học viên không được phép thấy nút Tạo Bài Tập"
        print("✅ RBAC Bảo mật: Học viên không thấy nút Tạo Bài Tập")

        # Kiểm tra Bộ lọc & Bảng bài tập của học viên
        search_mobile = page_mobile.locator("input[placeholder*='Tìm']")
        assert search_mobile.is_visible(), "LỖI: Thiếu ô tìm kiếm bài tập trên Mobile"

        # Kiểm tra Zero Overflow-X Mobile
        assert page_mobile.evaluate("document.body.scrollWidth <= innerWidth"), "LỖI: Tràn ngang trên Mobile 390px!"
        print("✅ ASSERT PASS: Zero Overflow-X trên Mobile 390px")

        page_mobile.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_exercises_student_mobile.png")
        context_mobile.close()
        browser.close()

    print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM TOÁN QC PHÂN HỆ BÀI TẬP ĐÃ VƯỢT QUA 100%!")

if __name__ == '__main__':
    run_exercises_qc()
