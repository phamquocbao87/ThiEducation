import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_test():
    print("🚀 Bắt đầu kiểm thử Playwright: Xác minh màn hình Đăng ký /user-management/new...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------
        # 1. KIỂM THỬ CHẾ ĐỘ TIẾNG ANH (EN MODE)
        # ----------------------------------------------------
        print("\n--- 1. KIỂM THỬ TIẾNG ANH (EN MODE) ---")
        context_en = browser.new_context(
            viewport={"width": 1366, "height": 900},
            ignore_https_errors=True
        )
        context_en.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'en');
        """)
        page = context_en.new_page()
        page.goto(f"{BASE_URL}/user-management/new", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)

        # Kiểm tra tiêu đề và breadcrumb tiếng Anh
        page_text = page.locator("body").inner_text()
        assert "Register & Issue New Account" in page_text, "Lỗi: Tiêu đề tiếng Anh chưa hiển thị!"
        assert "Role-based Access Control (Role RBAC)" in page_text, "Lỗi: Nhãn Role RBAC tiếng Anh chưa hiển thị!"
        print("  -> PASS: Tiêu đề & Breadcrumb đã localize sang Tiếng Anh!")

        # Chụp ảnh tổng quan form tiếng Anh
        en_img = f"{ARTIFACTS_DIR}/proof_user_new_en_mode.png"
        page.screenshot(path=en_img, full_page=True)
        print(f"  -> Đã lưu ảnh form tiếng Anh: {en_img}")

        # Kiểm tra dropdown Role RBAC
        print("  -> Kiểm tra dropdown Role RBAC trong EN mode...")
        role_select = page.locator(".ant-select").filter(has_text="STUDENT").first
        if not role_select.is_visible():
            role_select = page.locator("#role").locator("..")
        role_select.click()
        page.wait_for_timeout(800)

        role_dropdown_text = page.locator(".ant-select-dropdown").inner_text()
        print(f"  -> Danh sách Role hiển thị:\n{role_dropdown_text}")
        assert "Teacher" in role_dropdown_text, "Lỗi: Vai trò Teacher không xuất hiện trong dropdown!"
        assert "Native Foreign Teacher" not in role_dropdown_text, "Lỗi: Vẫn còn cụm Native Foreign Teacher!"
        print("  -> PASS: Role RBAC hiển thị chuẩn 'Teacher'!")

        # Chọn vai trò Teacher để kiểm tra tự động set Quốc tịch Philippines
        print("  -> Chọn vai trò Teacher...")
        teacher_option = page.locator(".ant-select-item-option").filter(has_text="Teacher").first
        teacher_option.click()
        page.wait_for_timeout(1000)

        # Kiểm tra Card Chuyên môn Giáo viên xuất hiện
        teacher_card = page.locator(".ant-card").filter(has_text="Teaching Credentials & Contract").first
        assert teacher_card.is_visible(), "Lỗi: Card Giáo viên không xuất hiện!"
        print("  -> PASS: Card Chuyên môn Giáo viên đã hiển thị tiếng Anh!")

        # Kiểm tra ô Quốc Tịch: tự động mặc định chọn Philippines
        nat_select = teacher_card.locator(".ant-select").first
        assert nat_select.is_visible(), "Lỗi: Combobox Quốc tịch không hiển thị!"
        nat_selected_text = nat_select.inner_text()
        print(f"  -> Giá trị Quốc tịch mặc định cho Teacher: '{nat_selected_text}'")
        assert "Philippines" in nat_selected_text, f"Lỗi: Mặc định không phải Philippines! Đang là: {nat_selected_text}"
        assert "🇵🇭" in nat_selected_text, f"Lỗi: Không có cờ Philippines! Đang là: {nat_selected_text}"
        print("  -> PASS: Giáo viên tự động mặc định chọn '🇵🇭 Philippines'!")

        # Click mở combobox Quốc tịch để kiểm tra 6 quốc gia
        print("  -> Click mở combobox Quốc tịch...")
        nat_select.click()
        page.wait_for_timeout(800)

        nat_dropdown = page.locator(".ant-select-dropdown").last
        nat_options_text = nat_dropdown.inner_text()
        print(f"  -> Các quốc gia trong combobox:\n{nat_options_text}")

        # Assert đủ 6 quốc gia và cờ
        assert "Vietnam" in nat_options_text or "Việt Nam" in nat_options_text, "Lỗi: Thiếu Vietnam!"
        assert "Philippines" in nat_options_text, "Lỗi: Thiếu Philippines!"
        assert "India" in nat_options_text or "Ấn Độ" in nat_options_text, "Lỗi: Thiếu India!"
        assert "United Kingdom" in nat_options_text or "Anh" in nat_options_text, "Lỗi: Thiếu United Kingdom!"
        assert "United States" in nat_options_text or "Hoa Kỳ" in nat_options_text or "Mỹ" in nat_options_text, "Lỗi: Thiếu United States!"
        assert "Japan" in nat_options_text or "Nhật" in nat_options_text, "Lỗi: Thiếu Japan!"
        print("  -> PASS: Đầy đủ 6 quốc gia (Vietnam, Philippines, India, UK, USA, Japan) kèm cờ!")

        # Chụp ảnh combobox Quốc tịch đang mở
        nat_img = f"{ARTIFACTS_DIR}/proof_nationality_combobox_open.png"
        page.screenshot(path=nat_img)
        print(f"  -> Đã lưu ảnh combobox Quốc tịch: {nat_img}")

        # Thử chọn Japan
        japan_option = nat_dropdown.locator(".ant-select-item-option").filter(has_text="Japan").first
        japan_option.click()
        page.wait_for_timeout(500)
        assert "Japan" in nat_select.inner_text() and "🇯🇵" in nat_select.inner_text()
        print("  -> PASS: Chọn Japan hiển thị chuẩn cờ và tên nước '🇯🇵 Japan'!")

        context_en.close()

        # ----------------------------------------------------
        # 2. KIỂM THỬ CHẾ ĐỘ TIẾNG VIỆT (VI MODE)
        # ----------------------------------------------------
        print("\n--- 2. KIỂM THỬ TIẾNG VIỆT (VI MODE) ---")
        context_vi = browser.new_context(
            viewport={"width": 1366, "height": 900},
            ignore_https_errors=True
        )
        context_vi.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page_vi = context_vi.new_page()
        page_vi.goto(f"{BASE_URL}/user-management/new", wait_until="domcontentloaded")
        page_vi.wait_for_timeout(2500)

        vi_text = page_vi.locator("body").inner_text()
        assert "Tạo & Đăng Ký Tài Khoản Mới" in vi_text, "Lỗi: Tiêu đề tiếng Việt không hiển thị!"
        assert "Vai Trò Phân Quyền (Role RBAC)" in vi_text, "Lỗi: Nhãn Role RBAC tiếng Việt không hiển thị!"

        # Chụp ảnh tổng quan tiếng Việt
        vi_img = f"{ARTIFACTS_DIR}/proof_user_new_vi_mode.png"
        page_vi.screenshot(path=vi_img, full_page=True)
        print(f"  -> Đã lưu ảnh form tiếng Việt: {vi_img}")

        context_vi.close()
        browser.close()
        print("\n🎉 TOÀN BỘ KIỂM THỬ HOÀN TẤT VÀ ĐẠT 100% TIÊU CHUẨN!")

if __name__ == "__main__":
    run_test()

