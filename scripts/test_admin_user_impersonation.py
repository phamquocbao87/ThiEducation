import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_test():
    print("🚀 Bắt đầu kiểm thử Playwright: Tapping 'Switch Role' hiển thị trực tiếp Full Search & Filter Dialog (Không hiển thị dropdown menu)")

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

        # 1. Điều hướng thẳng vào dashboard với tài khoản Quản trị IT Admin ADM001 (Phạm Quốc Bảo)
        print("1. Đăng nhập vào hệ thống với tài khoản IT Admin: Phạm Quốc Bảo (ADM001)...")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.evaluate("""() => {
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        }""")
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # 2. Click nút "Switch Role / Đổi Vai Trò"
        print("2. Click vào nút 'Đổi Vai Trò' trên Header...")
        switch_role_btn = page.locator("button:has-text('Đổi Vai Trò'), button:has-text('Switch Role')").first
        assert switch_role_btn.is_visible(), "Lỗi: Nút 'Đổi Vai Trò' không hiển thị trên Header"
        switch_role_btn.click()
        page.wait_for_timeout(600)

        # 3. Kiểm tra xem Dropdown menu có bị triệt tiêu không và Modal Full Search có mở trực tiếp không
        print("3. Kiểm tra Modal Full Search & Filter Dialog mở trực tiếp:")
        modal = page.locator(".ant-modal:has-text('Tìm Kiếm & Đóng Vai Người Dùng'), .ant-modal:has-text('Search & Switch User View')")
        assert modal.is_visible(), "Lỗi: Modal Full Search & Filter Dialog không mở trực tiếp khi bấm nút!"
        print("  -> XÁC NHẬN: Full Search & Filter Dialog đã hiển thị TRỰC TIẾP!")

        # Kiểm tra hoàn toàn không có dropdown menu sổ dài
        dropdown_menu = page.locator(".ant-dropdown-menu")
        is_dropdown_present = dropdown_menu.is_visible()
        print(f"  -> Kiểm tra dropdown menu sổ dài: {'ĐÃ BỎ HOÀN TOÀN (False)' if not is_dropdown_present else 'Vẫn còn (True)'}")
        assert not is_dropdown_present, "Lỗi: Vẫn còn dropdown menu xuất hiện!"

        # Chụp ảnh minh chứng Modal Full Search & Filter Dialog mở trực tiếp
        proof_direct_modal_path = os.path.join(ARTIFACTS_DIR, "proof_direct_open_search_filter_modal.png")
        page.screenshot(path=proof_direct_modal_path)
        print(f"  -> Đã chụp ảnh Full Search & Filter Dialog mở trực tiếp: {proof_direct_modal_path}")

        # 4. Kiểm tra các chức năng tìm kiếm & lọc trên Dialog
        print("4. Kiểm tra tìm kiếm và bộ lọc Role trong Dialog:")
        search_input = modal.locator("input.ant-input").first
        assert search_input.is_visible(), "Lỗi: Không tìm thấy ô tìm kiếm trong dialog"

        search_input.fill("Hiếu Thi")
        page.wait_for_timeout(500)

        user_thi_item = modal.locator(".ant-list-item:has-text('Phạm Hiếu Thi')").first
        assert user_thi_item.is_visible(), "Lỗi: Lọc tìm kiếm 'Hiếu Thi' không ra kết quả"
        print("  -> Tìm kiếm 'Hiếu Thi' thành công!")

        # Chụp ảnh sau khi tìm kiếm
        proof_search_dialog_path = os.path.join(ARTIFACTS_DIR, "proof_dialog_search_results.png")
        page.screenshot(path=proof_search_dialog_path)
        print(f"  -> Đã chụp ảnh kết quả tìm kiếm trong Dialog: {proof_search_dialog_path}")

        # 5. Click chọn đóng vai Phạm Hiếu Thi
        print("5. Click chọn tài khoản Giám Đốc 'Phạm Hiếu Thi'...")
        select_btn = user_thi_item.locator("button:has-text('Đóng Vai'), button:has-text('Impersonate')").first
        select_btn.click()
        page.wait_for_timeout(1500)

        # Kiểm tra banner cảnh báo
        banner_thi = page.locator(":has-text('Phạm Hiếu Thi')").first
        assert banner_thi.is_visible(), "Lỗi: Không chuyển sang góc nhìn Phạm Hiếu Thi"
        print("  -> Chuyển đổi thành công sang góc nhìn: Phạm Hiếu Thi!")
        proof_switched_path = os.path.join(ARTIFACTS_DIR, "proof_admin_role_switcher_switched_to_director.png")
        page.screenshot(path=proof_switched_path)
        print(f"  -> Đã chụp ảnh góc nhìn Giám Đốc: {proof_switched_path}")

        # 6. Thoát chế độ xem
        print("6. Bấm 'Thoát Chế Độ Xem' trên Banner...")
        exit_btn = page.locator("button:has-text('Thoát Chế Độ Xem'), button:has-text('Exit Test View')").first
        exit_btn.click()
        page.wait_for_timeout(1000)

        admin_restored = page.locator("text='Phạm Quốc Bảo'").first
        assert admin_restored.is_visible()
        print("  -> Đã khôi phục 100% tài khoản gốc IT Admin: Phạm Quốc Bảo!")

        proof_restored_path = os.path.join(ARTIFACTS_DIR, "proof_admin_role_switcher_exit_restored.png")
        page.screenshot(path=proof_restored_path)
        print(f"  -> Đã chụp ảnh khôi phục IT Admin: {proof_restored_path}")

        # 7. Kiểm tra chế độ Tiếng Anh (English Mode)
        print("7. Kiểm tra nút 'Switch Role' khi chuyển sang Tiếng Anh (EN)...")
        page.evaluate("""() => {
            localStorage.setItem('lak_app_language', 'en');
        }""")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(1500)

        en_switch_btn = page.locator("button:has-text('Switch Role')").first
        assert en_switch_btn.is_visible(), "Lỗi: Không tìm thấy nút 'Switch Role' ở chế độ tiếng Anh"
        en_switch_btn.click()
        page.wait_for_timeout(600)

        en_modal = page.locator(".ant-modal:has-text('Search & Switch User View')")
        assert en_modal.is_visible(), "Lỗi: Modal tiếng Anh không mở trực tiếp khi bấm 'Switch Role'"
        print("  -> XÁC NHẬN: Chế độ tiếng Anh mở modal trực tiếp hoàn hảo!")

        proof_en_modal_path = os.path.join(ARTIFACTS_DIR, "proof_direct_open_search_filter_modal_en.png")
        page.screenshot(path=proof_en_modal_path)
        print(f"  -> Đã chụp ảnh Modal Tiếng Anh: {proof_en_modal_path}")

        print("\n🎉🎉🎉 KIỂM THỬ THÀNH CÔNG: TAPPING 'SWITCH ROLE' MỞ TRỰC TIẾP FULL SEARCH & FILTER DIALOG, ĐÃ BỎ HOÀN TOÀN DROPDOWN SỔ DÀI!")
        browser.close()

if __name__ == "__main__":
    run_test()
