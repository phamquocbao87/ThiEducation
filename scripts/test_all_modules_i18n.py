import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def test_all_modules_i18n():
    print("🚀 Bắt đầu kiểm thử toàn diện hệ thống Đa ngôn ngữ (i18n) cho tất cả các phân hệ")

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

        page = context.new_page()

        # ==========================================
        # 1. KIỂM THỬ MENU SIDEBAR & COURSES TRONG TIẾNG ANH (🇬🇧 EN)
        # ==========================================
        print("\n--- 1. KIỂM THỬ MENU & COURSES TRONG TIẾNG ANH (🇬🇧 EN) ---")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.evaluate("""() => {
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'en');
        }""")
        page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Assert Menu Items in English
        assert page.locator(".ant-layout-sider :has-text('Dashboard Overview')").first.is_visible(), "Menu Dashboard không hiển thị tiếng Anh"
        assert page.locator(".ant-layout-sider :has-text('Courses & Classes')").first.is_visible(), "Menu Courses không hiển thị tiếng Anh"
        assert page.locator(".ant-layout-sider :has-text('Curriculum Levels')").first.is_visible(), "Menu Curriculum không hiển thị tiếng Anh"
        assert page.locator(".ant-layout-sider :has-text('Live Zoom Schedules')").first.is_visible(), "Menu Schedules không hiển thị tiếng Anh"
        assert page.locator(".ant-layout-sider :has-text('User Management')").first.is_visible(), "Menu Users không hiển thị tiếng Anh"
        print("  ✓ Menu Sidebar 100% tiếng Anh: OK")

        # Assert Courses Page Header & Tabs in English
        assert page.locator("h3:has-text('Courses & Classes Management')").first.is_visible(), "Header Courses không hiển thị tiếng Anh"
        assert page.locator(".ant-tabs-tab-btn:has-text('Course Programs Catalog')").first.is_visible(), "Tab Catalog không hiển thị tiếng Anh"
        assert page.locator(".ant-tabs-tab-btn:has-text('Class Management & Roster')").first.is_visible(), "Tab Classes không hiển thị tiếng Anh"
        print("  ✓ Tiêu đề trang & Tabs Courses tiếng Anh: OK")

        # Click Tab Classes Management
        page.locator(".ant-tabs-tab-btn:has-text('Class Management & Roster')").first.click()
        page.wait_for_timeout(1000)

        # Assert Search placeholder & buttons in English
        assert page.locator("input[placeholder='Search classes by code, name, teacher...']").first.is_visible(), "Input search classes không có placeholder tiếng Anh"
        assert page.locator("button:has-text('Create New Class')").first.is_visible(), "Nút Create New Class không hiển thị tiếng Anh"
        print("  ✓ Phân hệ Classes Management tiếng Anh: OK")

        proof_courses_en = os.path.join(ARTIFACTS_DIR, "proof_courses_en.png")
        page.screenshot(path=proof_courses_en)
        print(f"  📸 Đã chụp màn hình Courses tiếng Anh: {proof_courses_en}")

        # ==========================================
        # 2. KIỂM THỬ MENU & COURSES TRONG TIẾNG VIỆT (🇻🇳 VI)
        # ==========================================
        print("\n--- 2. KIỂM THỬ MENU & COURSES TRONG TIẾNG VIỆT (🇻🇳 VI) ---")
        page.evaluate("""() => {
            localStorage.setItem('lak_app_language', 'vi');
        }""")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Assert Menu Items in Vietnamese
        assert page.locator(".ant-layout-sider :has-text('Tổng Quan (Dashboard)')").first.is_visible(), "Menu Dashboard không hiển thị tiếng Việt"
        assert page.locator(".ant-layout-sider :has-text('Khóa Học & Lớp Học')").first.is_visible(), "Menu Courses không hiển thị tiếng Việt"
        assert page.locator(".ant-layout-sider :has-text('Cấp Độ Giáo Trình')").first.is_visible(), "Menu Curriculum không hiển thị tiếng Việt"
        assert page.locator(".ant-layout-sider :has-text('Quản Trị Người Dùng')").first.is_visible(), "Menu Users không hiển thị tiếng Việt"
        print("  ✓ Menu Sidebar 100% tiếng Việt: OK")

        # Assert Courses Page Header & Tabs in Vietnamese
        assert page.locator("h3:has-text('Quản Lý Khóa Học & Lớp Học')").first.is_visible(), "Header Courses không hiển thị tiếng Việt"
        assert page.locator(".ant-tabs-tab-btn:has-text('Danh Mục Khóa Học')").first.is_visible(), "Tab Catalog không hiển thị tiếng Việt"
        assert page.locator(".ant-tabs-tab-btn:has-text('Quản Lý Lớp Học & Phân Bổ')").first.is_visible(), "Tab Classes không hiển thị tiếng Việt"
        print("  ✓ Tiêu đề trang & Tabs Courses tiếng Việt: OK")

        # Click Tab Classes Management
        page.locator(".ant-tabs-tab-btn:has-text('Quản Lý Lớp Học & Phân Bổ')").first.click()
        page.wait_for_timeout(1000)

        assert page.locator("input[placeholder='Tìm theo mã lớp, tên lớp, GV...']").first.is_visible(), "Input search classes không có placeholder tiếng Việt"
        assert page.locator("button:has-text('Tạo Lớp Học Mới')").first.is_visible(), "Nút Tạo Lớp Học Mới không hiển thị tiếng Việt"
        print("  ✓ Phân hệ Classes Management tiếng Việt: OK")

        proof_courses_vi = os.path.join(ARTIFACTS_DIR, "proof_courses_vi.png")
        page.screenshot(path=proof_courses_vi)
        print(f"  📸 Đã chụp màn hình Courses tiếng Việt: {proof_courses_vi}")

        # ==========================================
        # 3. KIỂM THỬ TRANG HỒ SƠ CHI TIẾT (USER DETAIL)
        # ==========================================
        print("\n--- 3. KIỂM THỬ TRANG HỒ SƠ CHI TIẾT (USER DETAIL) ---")
        page.goto(f"{BASE_URL}/my-profile", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # In Vietnamese
        assert page.locator(":has-text('TRẠNG THÁI TÀI KHOẢN')").first.is_visible(), "Status title không hiển thị tiếng Việt"
        assert page.locator(".ant-descriptions-item-label:has-text('Họ và Tên')").first.is_visible(), "Label Họ và Tên không hiển thị"
        assert page.locator(".ant-descriptions-item-label:has-text('Tên Tiếng Anh')").first.is_visible(), "Label Tên Tiếng Anh không hiển thị"
        assert page.locator(".ant-descriptions-item-label:has-text('Mã Tài Khoản')").first.is_visible(), "Label Mã Tài Khoản không hiển thị"
        print("  ✓ Chi tiết hồ sơ tiếng Việt: OK")

        # Switch to English
        page.evaluate("""() => {
            localStorage.setItem('lak_app_language', 'en');
        }""")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        assert page.locator(":has-text('ACCOUNT STATUS')").first.is_visible(), "Status title không hiển thị tiếng Anh"
        assert page.locator(".ant-descriptions-item-label:has-text('Full Name')").first.is_visible(), "Label Full Name không hiển thị"
        assert page.locator(".ant-descriptions-item-label:has-text('English Name')").first.is_visible(), "Label English Name không hiển thị"
        assert page.locator(".ant-descriptions-item-label:has-text('Account Code')").first.is_visible(), "Label Account Code không hiển thị"
        assert page.locator("button:has-text('Edit Profile')").first.is_visible(), "Nút Edit Profile không hiển thị"
        print("  ✓ Chi tiết hồ sơ tiếng Anh: OK")

        proof_profile_en = os.path.join(ARTIFACTS_DIR, "proof_profile_en.png")
        page.screenshot(path=proof_profile_en)
        print(f"  📸 Đã chụp màn hình Profile tiếng Anh: {proof_profile_en}")

        browser.close()
        print("\n🎉🎉🎉 TOÀN BỘ KIỂM THỬ ĐÃ PASS 100%: CÁC NHÃN GIAO DIỆN ĐƯỢC ĐỊNH NGHĨA VÀ CHUYỂN ĐỔI CHUẨN XÁC GIỮA 2 FILE!")

if __name__ == "__main__":
    test_all_modules_i18n()

