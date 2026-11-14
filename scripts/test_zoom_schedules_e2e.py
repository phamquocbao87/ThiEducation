import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')
CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

def test_schedules():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        print("\n=== STEP 1: Teacher Maj (GV952) Desktop Inspection (1366x850) ===")
        context = browser.new_context(viewport={'width': 1366, 'height': 850})
        page = context.new_page()

        # Login as Teacher Maj
        page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)

        # Switch to Vietnamese language if currently English, or test Vietnamese
        lang_vi = page.locator("button:has-text('🇻🇳 VI')")
        if lang_vi.is_visible():
            lang_vi.click()
            page.wait_for_timeout(500)

        # Navigate to zoom-schedules
        page.goto(f"{BASE_URL}/zoom-schedules", wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # 1. Assert Week Navigator and Range
        week_banner = page.locator("text=/2026/").first.inner_text()
        print(f"Week Range Banner: {week_banner}")
        assert '2026' in week_banner, f"Expected 2026 in week text, got: {week_banner}"

        # 2. Assert Day Column Headers have dates
        column_headers = page.locator(".ant-col > div > div:first-child").all_text_contents()
        print("\nColumn Headers:")
        for ch in column_headers:
            clean_ch = ch.replace('\n', ' ')
            print(f"  - {clean_ch}")
            assert '📅' in ch or '/' in ch, f"Expected date in column header: {clean_ch}"

        # 3. Assert Cards have Date tags (màn hình Lịch tuần card lớp học nên để ngày)
        cards = page.locator(".ant-col .ant-card").all_text_contents()
        print(f"\nTotal Cards in Weekly Calendar: {len(cards)}")
        assert len(cards) > 0, "No cards found in calendar"

        has_card_date_count = 0
        live_card_count = 0
        locked_card_count = 0

        for i, card_text in enumerate(cards):
            first_line = card_text.split('\n')[0].strip()
            print(f"Card {i} summary: {first_line}")
            if '📅' in card_text or '/11/2026' in card_text:
                has_card_date_count += 1
            if 'ĐANG HỌC' in card_text or 'LIVE NOW' in card_text:
                live_card_count += 1
                print(f"  -> Found LIVE card {i}: {card_text[:120]}...")
            if 'Khóa' in card_text or 'Locked' in card_text:
                locked_card_count += 1

        print(f"\nCards with explicit date: {has_card_date_count}/{len(cards)}")
        print(f"Live cards (unlocked & active): {live_card_count}")
        print(f"Locked cards (enforcing 15-min rule): {locked_card_count}")
        assert has_card_date_count == len(cards), "All cards MUST display explicit date tag"
        assert locked_card_count > 0, "At least some future cards must enforce the 15-min lock"

        # Check overflow-x on Desktop
        overflow_desktop = page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Desktop Overflow-X: {overflow_desktop}")
        assert not overflow_desktop, "Desktop horizontal overflow detected"

        page.screenshot(path=str(ARTIFACTS / 'schedule_weekly_calendar_desktop.png'))
        print(f"Saved screenshot to schedule_weekly_calendar_desktop.png")

        # 4. Switch to Table View
        print("\n=== STEP 2: Table View Inspection ===")
        table_btn = page.locator(".ant-segmented-item:has-text('Bảng Danh Sách'), .ant-segmented-item:has-text('Table View')")
        table_btn.click()
        page.wait_for_timeout(1000)

        # Check Table headers
        table_headers = page.locator(".ant-table-thead th").all_text_contents()
        print(f"Table Headers: {table_headers}")
        assert any('Ngày' in h or 'Date' in h for h in table_headers), "Table view must include Session Date column"

        page.screenshot(path=str(ARTIFACTS / 'schedule_table_view_desktop.png'))
        print(f"Saved screenshot to schedule_table_view_desktop.png")

        context.close()

        # 5. Mobile Inspection (390x844)
        print("\n=== STEP 3: Mobile Viewport Inspection (390x844) ===")
        m_context = browser.new_context(viewport={'width': 390, 'height': 844})
        m_page = m_context.new_page()

        m_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        m_page.wait_for_timeout(1000)
        m_page.goto(f"{BASE_URL}/zoom-schedules", wait_until='domcontentloaded')
        m_page.wait_for_timeout(1500)

        overflow_mobile = m_page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Mobile Overflow-X: {overflow_mobile}")
        assert not overflow_mobile, "Mobile horizontal overflow detected on 390px"

        m_page.screenshot(path=str(ARTIFACTS / 'schedule_weekly_calendar_mobile.png'))
        print(f"Saved screenshot to schedule_weekly_calendar_mobile.png")
        m_context.close()

        browser.close()
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_schedules()
