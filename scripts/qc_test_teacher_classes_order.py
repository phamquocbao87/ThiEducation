import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_tests():
    print("🚀 Bắt đầu kiểm thử E2E: Sắp xếp thông minh thẻ lớp học Teacher Maj (WP01 246 sang trái)")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # -------------------------------------------------------------
        # 1. Desktop Test (1366 x 800)
        # -------------------------------------------------------------
        print("\n--- 1. DESKTOP VIEWPORT (1366x800) ---")
        context_dt = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_dt = context_dt.new_page()

        # Login as Teacher Maj
        page_dt.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page_dt.wait_for_timeout(1000)
        page_dt.goto(f"{BASE_URL}/dashboard", wait_until='domcontentloaded')
        page_dt.wait_for_selector('.ant-card-hoverable', timeout=15000)
        page_dt.wait_for_timeout(1500)

        # Assert Zero Overflow-X
        overflow_dt = page_dt.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Desktop Overflow-X detected: {overflow_dt}")
        assert not overflow_dt, "FAIL: Desktop has horizontal scrollbar / overflow-x!"

        # Locate class cards in TeacherWorkspacePanel
        # Look for cards containing WP01, WP02, WP03
        card_titles = page_dt.locator('.ant-card-hoverable .ant-typography strong, .ant-card-hoverable .ant-tag-blue').all_text_contents()
        print("Raw text in cards:", card_titles)

        # Find all class cards within the classes section
        class_cards = page_dt.locator('.ant-card-hoverable').all()
        print(f"Found {len(class_cards)} hoverable cards on Teacher Dashboard.")

        card_texts = []
        for i, card in enumerate(class_cards):
            txt = card.inner_text()
            lines = [l.strip() for l in txt.split('\n') if l.strip()]
            print(f"Card {i} summary: {lines[:3]}")
            card_texts.append(txt)

        assert len(card_texts) >= 3, f"Expected at least 3 class cards, got {len(card_texts)}"

        # Assert order: Card 0 must be WP01 (246), Card 1 must be WP02 (357), Card 2 must be WP03 (Daily)
        assert "WP01" in card_texts[0], f"Card 0 should be WP01, but got: {card_texts[0][:60]}"
        assert "246" in card_texts[0] or "Mon" in card_texts[0], f"Card 0 should be 246 schedule"

        assert "WP02" in card_texts[1], f"Card 1 should be WP02, but got: {card_texts[1][:60]}"
        assert "357" in card_texts[1] or "Tue" in card_texts[1], f"Card 1 should be 357 schedule"

        assert "WP03" in card_texts[2], f"Card 2 should be WP03, but got: {card_texts[2][:60]}"
        assert "Daily" in card_texts[2] or "Hàng ngày" in card_texts[2] or "Daily" in card_texts[2], f"Card 2 should be Daily schedule"

        print("✅ [PASS DESKTOP] Thứ tự thẻ lớp học chính xác tuyệt đối: WP01 (246) -> WP02 (357) -> WP03 (Daily)!")

        # Chụp ảnh Desktop nghiệm thu
        dt_screenshot = os.path.join(OUTPUT_DIR, 'teacher_classes_reordered_desktop.png')
        page_dt.screenshot(path=dt_screenshot, full_page=False)
        print(f"Saved Desktop screenshot: {dt_screenshot}")

        # -------------------------------------------------------------
        # 2. Mobile Test (390 x 844)
        # -------------------------------------------------------------
        print("\n--- 2. MOBILE VIEWPORT (390x844) ---")
        context_mb = browser.new_context(viewport={'width': 390, 'height': 844})
        page_mb = context_mb.new_page()

        page_mb.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page_mb.wait_for_timeout(1000)
        page_mb.goto(f"{BASE_URL}/dashboard", wait_until='domcontentloaded')
        page_mb.wait_for_selector('.ant-card-hoverable', timeout=15000)
        page_mb.wait_for_timeout(1500)

        # Assert Zero Overflow-X
        overflow_mb = page_mb.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Mobile Overflow-X detected: {overflow_mb}")
        assert not overflow_mb, "FAIL: Mobile has horizontal scrollbar / overflow-x!"

        mb_cards = page_mb.locator('.ant-card-hoverable').all()
        mb_card_texts = [c.inner_text() for c in mb_cards]
        assert "WP01" in mb_card_texts[0], f"Mobile Card 0 should be WP01, got: {mb_card_texts[0][:60]}"
        assert "WP02" in mb_card_texts[1], f"Mobile Card 1 should be WP02, got: {mb_card_texts[1][:60]}"
        assert "WP03" in mb_card_texts[2], f"Mobile Card 2 should be WP03, got: {mb_card_texts[2][:60]}"

        print("✅ [PASS MOBILE] Thứ tự thẻ trên di động chính xác và Zero Overflow-X!")

        mb_screenshot = os.path.join(OUTPUT_DIR, 'teacher_classes_reordered_mobile.png')
        page_mb.screenshot(path=mb_screenshot, full_page=False)
        print(f"Saved Mobile screenshot: {mb_screenshot}")

        browser.close()
        print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ PLAYWRIGHT E2E ĐỀU ĐẠT TIÊU CHUẨN 100%!")

if __name__ == '__main__':
    run_tests()
