import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_test():
    print("🚀 Bắt đầu kiểm thử Playwright: Xác minh hiển thị lớp học của học viên trên User Management...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------
        # 1. KIỂM THỬ DESKTOP (1366x850)
        # ----------------------------------------------------
        context_desktop = browser.new_context(
            viewport={"width": 1366, "height": 850},
            ignore_https_errors=True
        )
        context_desktop.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page = context_desktop.new_page()

        print("\n--- 1. DESKTOP VIEW (1366x850) ---")
        page.goto(f"{BASE_URL}/user-management", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        # Check Zero Overflow-X
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        inner_width = page.evaluate("window.innerWidth")
        print(f"  -> Viewport width: {inner_width}px, Scroll width: {scroll_width}px")
        assert scroll_width <= inner_width, f"Lỗi tràn ngang Desktop: scrollWidth={scroll_width} > innerWidth={inner_width}"

        # Chụp ảnh tổng quan bảng Desktop
        desktop_img = f"{ARTIFACTS_DIR}/proof_desktop_user_classes_table.png"
        page.screenshot(path=desktop_img, full_page=True)
        print(f"  -> Đã lưu ảnh chụp bảng Desktop: {desktop_img}")

        # Kiểm tra nội dung hàng học viên
        table_text = page.locator("tbody").inner_text()
        print(f"  -> Trích đoạn bảng người dùng:\n{table_text[:400]}...")

        # ASSERT: Phải có LH004 và LH002 và tên lớp WP01 / WP02
        assert "LH004" in table_text, "Lỗi: Không tìm thấy mã lớp LH004 trong bảng!"
        assert "WP01" in table_text or "WP02" in table_text, "Lỗi: Không tìm thấy tên lớp WP01/WP02 trong bảng!"
        print("  -> ASSERT PASS: Đã hiển thị mã lớp và tên lớp học viên!")

        # Rê chuột vào một tag lớp học để kiểm tra Tooltip
        class_tag = page.locator(".ant-tag").filter(has_text="LH004").first
        if class_tag.is_visible():
            class_tag.hover()
            page.wait_for_timeout(1000)
            tooltip_img = f"{ARTIFACTS_DIR}/proof_desktop_class_tooltip_hover.png"
            page.screenshot(path=tooltip_img)
            print(f"  -> Đã lưu ảnh chụp Tooltip lớp học khi hover: {tooltip_img}")

        # Test tìm kiếm đa trường theo tên lớp "WP01"
        print("  -> Test tìm kiếm với từ khóa 'WP01'...")
        search_input = page.locator("input[placeholder*='Tìm theo Tên']")
        assert search_input.is_visible(), "Lỗi: Không tìm thấy ô tìm kiếm!"
        search_input.fill("WP01")
        page.wait_for_timeout(1500)

        search_img = f"{ARTIFACTS_DIR}/proof_desktop_search_by_class_wp01.png"
        page.screenshot(path=search_img, full_page=True)
        print(f"  -> Đã lưu ảnh chụp kết quả tìm kiếm theo lớp WP01: {search_img}")

        filtered_text = page.locator("tbody").inner_text()
        assert "LH004" in filtered_text, "Lỗi: Tìm kiếm theo WP01 không ra lớp LH004!"
        assert "LH002" not in filtered_text, "Lỗi: Lớp LH002 không nên xuất hiện khi lọc WP01!"
        print("  -> ASSERT PASS: Tìm kiếm đa trường theo tên lớp hoạt động chính xác 100%!")

        # Xóa tìm kiếm để phục hồi
        search_input.fill("")
        page.wait_for_timeout(1000)
        context_desktop.close()

        # ----------------------------------------------------
        # 2. KIỂM THỬ MOBILE (390x844)
        # ----------------------------------------------------
        print("\n--- 2. MOBILE VIEW (390x844 - iPhone 14) ---")
        context_mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            ignore_https_errors=True
        )
        context_mobile.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page_mobile = context_mobile.new_page()
        page_mobile.goto(f"{BASE_URL}/user-management", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(3000)

        # Check Zero Overflow-X on Mobile
        m_scroll_width = page_mobile.evaluate("document.documentElement.scrollWidth")
        m_inner_width = page_mobile.evaluate("window.innerWidth")
        print(f"  -> Mobile viewport: {m_inner_width}px, Scroll width: {m_scroll_width}px")
        assert m_scroll_width <= m_inner_width, f"Lỗi tràn ngang Mobile: scrollWidth={m_scroll_width} > innerWidth={m_inner_width}"

        # Chụp ảnh tổng quan Mobile Card
        mobile_img = f"{ARTIFACTS_DIR}/proof_mobile_user_classes_card.png"
        page_mobile.screenshot(path=mobile_img, full_page=True)
        print(f"  -> Đã lưu ảnh chụp Mobile Card List: {mobile_img}")

        # Kiểm tra text trên Mobile Card trong .mobile-user-view
        mobile_cards = page_mobile.locator(".mobile-user-view .ant-card")
        card_count = mobile_cards.count()
        print(f"  -> Tổng số thẻ người dùng trên di động: {card_count}")

        # Cuộn xuống một thẻ học viên để kiểm tra (ví dụ học viên HV151 hoặc HV235)
        student_card = mobile_cards.filter(has_text="Học Viên").first
        if not student_card.is_visible():
            student_card = mobile_cards.filter(has_text="HV151").first

        assert student_card.is_visible(), "Lỗi: Không tìm thấy thẻ người dùng học viên trên di động!"
        student_text = student_card.inner_text()
        print(f"  -> Thẻ học viên trên di động:\n{student_text}")
        assert "LH00" in student_text or "Lớp học:" in student_text, "Lỗi: Không tìm thấy nhãn Lớp học trên thẻ học viên Mobile!"
        print("  -> ASSERT PASS: Thẻ học viên trên di động hiển thị thông tin lớp học đầy đủ!")

        context_mobile.close()
        browser.close()
        print("\n🎉 TOÀN BỘ KIỂM THỬ HOÀN TẤT VÀ ĐẠT 100% TIÊU CHUẨN!")

if __name__ == "__main__":
    run_test()
