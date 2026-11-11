import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_test():
    print("🚀 Bắt đầu kiểm thử Playwright: Xác minh danh sách lớp học thật từ Cloud Firestore...")

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
        # Gắn quyền IT Admin ADM001
        context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)

        page = context.new_page()

        # 1. Mở trang /courses-classes kiểm tra số lượng lớp học thật
        print("1. Kiểm tra /courses-classes...")
        page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Chụp ảnh tổng quan courses-classes
        page.screenshot(path=f"{ARTIFACTS_DIR}/proof_courses_classes_real_db.png", full_page=True)

        # Chuyển sang Tab Class Management & Roster
        class_tab = page.locator(".ant-tabs-tab").filter(has_text="Lớp Học").first
        if not class_tab.is_visible():
            class_tab = page.locator(".ant-tabs-tab").filter(has_text="Class Management").first
        if class_tab.is_visible():
            class_tab.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{ARTIFACTS_DIR}/proof_classes_roster_tab.png", full_page=True)
            print("  -> Đã chụp ảnh Tab Danh sách Lớp học thật")

        # 2. Mở trang /user-management/HV214/edit
        print("2. Mở /user-management/HV214/edit để kiểm tra ô Lớp Học Online Ghi Danh...")
        page.goto(f"{BASE_URL}/user-management/HV214/edit", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Click Tab 2: Nghiệp Vụ & Phân Quyền
        tab2 = page.locator(".ant-tabs-tab").filter(has_text="Nghiệp Vụ").first
        assert tab2.is_visible(), "Lỗi: Không tìm thấy Tab Nghiệp Vụ & Phân Quyền!"
        tab2.click()
        page.wait_for_timeout(800)

        # Mở dropdown enrolledClassIds
        print("  -> Click mở dropdown enrolledClassIds trong UserDetailPage...")
        select_input = page.locator("#enrolledClassIds")
        assert select_input.is_visible(), "Lỗi: Không tìm thấy ô enrolledClassIds!"
        select_input.click()
        page.wait_for_timeout(800)

        # Chụp ảnh dropdown đang mở
        dropdown_screenshot = f"{ARTIFACTS_DIR}/proof_user_edit_real_classes_dropdown.png"
        page.screenshot(path=dropdown_screenshot, full_page=True)
        print(f"  -> Đã chụp ảnh dropdown: {dropdown_screenshot}")

        # Kiểm tra các lớp xuất hiện trong dropdown
        dropdown_content = page.locator(".ant-select-dropdown").inner_text()
        print(f"  -> Nội dung dropdown hiển thị:\n{dropdown_content}")

        # ASSERT: Phải có LH001 và LH002 với GV791 Hellen
        assert "LH001" in dropdown_content, "Lỗi: Không tìm thấy LH001 trong dropdown!"
        assert "LH002" in dropdown_content, "Lỗi: Không tìm thấy LH002 trong dropdown!"
        assert "Hellen" in dropdown_content, "Lỗi: Giáo viên thật Hellen không xuất hiện trong dropdown!"

        # ASSERT FALSE: Tuyệt đối không còn bất kỳ giáo viên mock nào
        mock_teachers = ["David Smith", "Sarah Connor", "John Williams", "Emma Watson", "Robert Brown"]
        for mock_t in mock_teachers:
            assert mock_t not in dropdown_content, f"Lỗi: Vẫn còn giáo viên mock '{mock_t}' trong dropdown!"

        print("  -> PASS UserDetailPage: 100% dữ liệu lớp học thật từ Cloud Firestore!")

        # 3. Mở trang /user-management/new để kiểm tra UserRegistrationPage
        print("3. Mở /user-management/new kiểm tra trang Đăng Ký Người Dùng...")
        page.goto(f"{BASE_URL}/user-management/new", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Role mặc định đã là student, mở dropdown enrolledClassIds
        reg_select = page.locator("#enrolledClassIds")
        assert reg_select.is_visible(), "Lỗi: Không tìm thấy ô enrolledClassIds trên trang đăng ký!"
        reg_select.click()
        page.wait_for_timeout(800)

        reg_dropdown_screenshot = f"{ARTIFACTS_DIR}/proof_user_new_real_classes_dropdown.png"
        page.screenshot(path=reg_dropdown_screenshot, full_page=True)
        print(f"  -> Đã chụp ảnh dropdown đăng ký: {reg_dropdown_screenshot}")

        reg_dropdown_content = page.locator(".ant-select-dropdown").inner_text()
        assert "LH001" in reg_dropdown_content, "Lỗi: Không tìm thấy LH001 trong dropdown đăng ký!"
        assert "LH002" in reg_dropdown_content, "Lỗi: Không tìm thấy LH002 trong dropdown đăng ký!"
        assert "Hellen" in reg_dropdown_content, "Lỗi: Giáo viên thật Hellen không xuất hiện trong dropdown đăng ký!"

        for mock_t in mock_teachers:
            assert mock_t not in reg_dropdown_content, f"Lỗi: Vẫn còn giáo viên mock '{mock_t}' trong dropdown đăng ký!"

        print("  -> PASS UserRegistrationPage: 100% dữ liệu lớp học thật từ Cloud Firestore!")

        browser.close()
        print("\n🎉 Toàn bộ kiểm thử nghiệm thu hoàn tất thành công 100%!")

if __name__ == "__main__":
    run_test()
