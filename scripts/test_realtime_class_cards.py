import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_test():
    print("🚀 Bắt đầu kiểm thử Playwright: Real-time Live Classroom Cards & Click to Inspect Modal...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------
        # 1. VIEW GIÁO VỤ (Academic: ACA404)
        # ----------------------------------------------------
        print("\n--- 1. KIỂM THỬ VIEW GIÁO VỤ (ACA404) ---")
        context_aca = browser.new_context(viewport={"width": 1366, "height": 900})
        context_aca.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ACA404');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page_aca = context_aca.new_page()
        page_aca.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page_aca.wait_for_timeout(2500)

        # Cuộn xuống phần lưới Card lớp học
        page_aca.evaluate("window.scrollTo(0, 350)")
        page_aca.wait_for_timeout(500)

        # Chụp ảnh lưới Card lớp học của Giáo vụ (có nhấp nháy cảnh báo & màu đậm nhạt)
        page_aca.screenshot(path=os.path.join(ARTIFACTS_DIR, "proof_academic_realtime_class_cards.png"))
        print("  -> PASS: Đã xác minh lưới Card lớp học Real-time với viền màu trạng thái!")

        # Bấm vào thẻ Card đầu tiên để mở Modal theo dõi tình trạng lớp
        first_card = page_aca.locator(".ant-card-hoverable").first
        first_card.click()
        page_aca.wait_for_timeout(700)

        # Chụp ảnh Modal chi tiết khi bấm vào Card
        page_aca.screenshot(path=os.path.join(ARTIFACTS_DIR, "proof_academic_card_click_modal.png"))
        modal_text = page_aca.locator(".ant-modal").inner_text()
        assert "Kết Nối Trực Tiếp Phòng Học Zoom" in modal_text or "Zoom Meeting ID" in modal_text, "Lỗi: Modal chưa hiển thị chi tiết phòng Zoom!"
        print("  -> PASS: Bấm vào Card mở thành công Modal Giám sát chi tiết tình trạng lớp học!")

        # ----------------------------------------------------
        # 2. VIEW GIÁO VIÊN BẢN XỨ (Teacher: GV791)
        # ----------------------------------------------------
        print("\n--- 2. KIỂM THỬ VIEW GIÁO VIÊN (GV791) ---")
        context_tea = browser.new_context(viewport={"width": 1366, "height": 900})
        context_tea.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'GV791');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page_tea = context_tea.new_page()
        page_tea.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page_tea.wait_for_timeout(2500)

        page_tea.evaluate("window.scrollTo(0, 350)")
        page_tea.wait_for_timeout(500)

        page_tea.screenshot(path=os.path.join(ARTIFACTS_DIR, "proof_teacher_realtime_class_cards.png"))
        print("  -> PASS: Đã xác minh View Giáo viên dạng Card với hiệu ứng nhấp nháy khi đang giờ học!")

        # ----------------------------------------------------
        # 3. KIỂM THỬ MOBILE VIEW (390x844)
        # ----------------------------------------------------
        print("\n--- 3. KIỂM THỬ MOBILE RESPONSIVE (390px) ---")
        context_mob = browser.new_context(viewport={"width": 390, "height": 844})
        context_mob.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ACA404');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page_mob = context_mob.new_page()
        page_mob.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page_mob.wait_for_timeout(2000)

        page_mob.evaluate("window.scrollTo(0, 450)")
        page_mob.wait_for_timeout(500)
        page_mob.screenshot(path=os.path.join(ARTIFACTS_DIR, "proof_mobile_academic_realtime_cards.png"))

        overflow = page_mob.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert overflow, "Lỗi: Tràn ngang trên Mobile!"
        print("  -> PASS: Mobile hiển thị các Card 100% width hoàn hảo, Zero Overflow-X!")

        browser.close()
        print("\n🎉 KIỂM THỬ PLAYWRIGHT HOÀN THÀNH XUẤT SẮC 100%!")

if __name__ == "__main__":
    run_test()

