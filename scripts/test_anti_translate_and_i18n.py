import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def test_anti_translate_and_i18n():
    print("🚀 Bắt đầu kiểm thử: Chống Google Translate tự động & Kiểm thử chuyển đổi ngôn ngữ EN / VI")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 850},
            ignore_https_errors=True
        )
        context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'en');
        """)
        
        page = context.new_page()

        # 1. Truy cập Dashboard
        print("1. Điều hướng tới Dashboard (mặc định EN)...")
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # 2. Kiểm tra các thẻ Meta và Attributes chống Auto-Translate
        print("2. Kiểm tra thuộc tính W3C HTML5 translate='no' & class='notranslate' & Meta tags...")
        html_lang = page.evaluate("() => document.documentElement.lang")
        html_translate = page.evaluate("() => document.documentElement.getAttribute('translate')")
        html_class = page.evaluate("() => document.documentElement.className")
        body_translate = page.evaluate("() => document.body.getAttribute('translate')")
        body_class = page.evaluate("() => document.body.className")
        root_translate = page.evaluate("() => document.getElementById('root')?.getAttribute('translate')")
        root_class = page.evaluate("() => document.getElementById('root')?.className")

        google_meta = page.locator("meta[name='google'][content='notranslate']")
        googlebot_meta = page.locator("meta[name='googlebot'][content='notranslate']")

        print(f"  -> html.lang: '{html_lang}'")
        print(f"  -> html.translate: '{html_translate}' (class: '{html_class}')")
        print(f"  -> body.translate: '{body_translate}' (class: '{body_class}')")
        print(f"  -> #root.translate: '{root_translate}' (class: '{root_class}')")
        print(f"  -> meta[google]: count = {google_meta.count()}")
        print(f"  -> meta[googlebot]: count = {googlebot_meta.count()}")

        assert html_translate == "no", "Lỗi: html thiếu translate='no'"
        assert "notranslate" in html_class, "Lỗi: html thiếu class 'notranslate'"
        assert body_translate == "no", "Lỗi: body thiếu translate='no'"
        assert "notranslate" in body_class, "Lỗi: body thiếu class 'notranslate'"
        assert root_translate == "no", "Lỗi: #root thiếu translate='no'"
        assert "notranslate" in (root_class or ""), "Lỗi: #root thiếu class 'notranslate'"
        assert google_meta.count() >= 1, "Lỗi: Thiếu thẻ meta[google='notranslate']"
        assert googlebot_meta.count() >= 1, "Lỗi: Thiếu thẻ meta[googlebot='notranslate']"

        # 3. Kiểm tra hiển thị Tiếng Anh chuẩn (Zero Auto-Translate)
        print("3. Kiểm tra giao diện Tiếng Anh (EN)...")
        landing_btn = page.locator("button:has-text('Landing Page')")
        print(f"  -> Nút Landing Page hiển thị: {landing_btn.is_visible()}")
        assert landing_btn.is_visible(), "Lỗi: Nút Landing Page không hiển thị"

        # Kiểm tra các menu Sidebar ở chế độ English
        menu_dashboard = page.locator(".ant-menu-title-content:has-text('Dashboard Overview')")
        menu_courses = page.locator(".ant-menu-title-content:has-text('Courses & Classes')")
        menu_curriculum = page.locator(".ant-menu-title-content:has-text('Curriculum Levels')")
        menu_schedules = page.locator(".ant-menu-title-content:has-text('Live Zoom Schedules')")
        menu_attendance = page.locator(".ant-menu-title-content:has-text('Attendance & Evaluation')")
        menu_contracts = page.locator(".ant-menu-title-content:has-text('Contracts & Payroll')")
        menu_tuition = page.locator(".ant-menu-title-content:has-text('Tuition & Billing')")
        menu_users = page.locator(".ant-menu-title-content:has-text('User Management')")
        menu_profile = page.locator(".ant-menu-title-content:has-text('My Profile')")

        print("  -> Kiểm tra text Sidebar Tiếng Anh:")
        print(f"     * Dashboard Overview: {menu_dashboard.is_visible()}")
        print(f"     * Courses & Classes: {menu_courses.is_visible()}")
        print(f"     * User Management: {menu_users.is_visible()}")
        assert menu_dashboard.is_visible()
        assert menu_courses.is_visible()
        assert menu_users.is_visible()

        proof_en_path = os.path.join(ARTIFACTS_DIR, "proof_anti_translate_en.png")
        page.screenshot(path=proof_en_path)
        print(f"  -> Đã chụp ảnh Tiếng Anh: {proof_en_path}")

        # 4. Bấm chuyển sang Tiếng Việt (VI)
        print("4. Bấm nút chuyển sang Tiếng Việt (VI)...")
        vi_btn = page.locator(".ant-segmented-item:has-text('VI')")
        vi_btn.click()
        page.wait_for_timeout(1000)

        # Kiểm tra document lang đổi thành 'vi'
        html_lang_vi = page.evaluate("() => document.documentElement.lang")
        print(f"  -> html.lang sau khi chuyển: '{html_lang_vi}'")
        assert html_lang_vi == "vi", f"Lỗi: html.lang không chuyển thành 'vi' (nhận: {html_lang_vi})"

        # Kiểm tra các thuộc tính chống dịch vẫn còn nguyên
        assert page.evaluate("() => document.documentElement.getAttribute('translate')") == "no"
        assert "notranslate" in page.evaluate("() => document.documentElement.className")

        # Kiểm tra các menu Sidebar đã chuyển sang Tiếng Việt
        menu_dashboard_vi = page.locator(".ant-menu-title-content:has-text('Tổng Quan (Dashboard)')")
        menu_courses_vi = page.locator(".ant-menu-title-content:has-text('Khóa Học & Lớp Học')")
        menu_users_vi = page.locator(".ant-menu-title-content:has-text('Quản Trị Người Dùng')")
        trangchu_btn = page.locator("button:has-text('Trang Chủ')")

        print("  -> Kiểm tra text Sidebar Tiếng Việt:")
        print(f"     * Tổng Quan (Dashboard): {menu_dashboard_vi.is_visible()}")
        print(f"     * Khóa Học & Lớp Học: {menu_courses_vi.is_visible()}")
        print(f"     * Quản Trị Người Dùng: {menu_users_vi.is_visible()}")
        print(f"     * Nút Trang Chủ: {trangchu_btn.is_visible()}")

        assert menu_dashboard_vi.is_visible()
        assert menu_courses_vi.is_visible()
        assert menu_users_vi.is_visible()
        assert trangchu_btn.is_visible()

        proof_vi_path = os.path.join(ARTIFACTS_DIR, "proof_anti_translate_vi.png")
        page.screenshot(path=proof_vi_path)
        print(f"  -> Đã chụp ảnh Tiếng Việt: {proof_vi_path}")

        # 5. Bấm chuyển ngược lại Tiếng Anh (EN)
        print("5. Bấm chuyển ngược lại Tiếng Anh (EN)...")
        en_btn = page.locator(".ant-segmented-item:has-text('EN')")
        en_btn.click()
        page.wait_for_timeout(1000)

        html_lang_en_again = page.evaluate("() => document.documentElement.lang")
        print(f"  -> html.lang sau khi chuyển lại: '{html_lang_en_again}'")
        assert html_lang_en_again == "en"
        assert page.locator("button:has-text('Landing Page')").is_visible()
        assert page.locator(".ant-menu-title-content:has-text('Dashboard Overview')").is_visible()

        print("🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐỀU ĐẠT CHUẨN 100%!")
        browser.close()

if __name__ == "__main__":
    test_anti_translate_and_i18n()

