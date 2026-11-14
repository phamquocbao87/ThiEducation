import os
import sys
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )

        # -------------------------------------------------------------
        # 1. DESKTOP VIEWPORT TEST (1366x800)
        # -------------------------------------------------------------
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=GV952', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # Navigate to class LH004 (starts on 16/11/2026)
        page.goto('http://127.0.0.1:3000/classroom/LH004', wait_until='domcontentloaded')
        page.wait_for_timeout(2000)

        # Verify Tab Seating: Attendance is locked for upcoming session
        seating_alert = page.locator('.ant-alert').first
        print('Seating alert text:', seating_alert.inner_text())

        # Switch to Tab Evaluation
        page.locator('[data-testid="tab-evaluation"]').click()
        page.wait_for_timeout(1200)

        # ASSERT 1: Upcoming session alert banner is visible
        upcoming_banner = page.locator('[data-testid="upcoming-session-evaluation-banner"]')
        assert upcoming_banner.is_visible(), "Upcoming session evaluation banner MUST be visible!"
        banner_text = upcoming_banner.inner_text()
        print('Banner text:', banner_text)
        assert ('16/11/2026' in banner_text or 'Nov 16, 2026' in banner_text), "Banner must mention 16/11/2026 or Nov 16, 2026!"
        assert '19:00' in banner_text, "Banner must mention start time 19:00!"
        print('ASSERT PASS: Upcoming session banner correctly displays schedule date and time')

        # ASSERT 2: Save All Evaluations button is DISABLED
        save_all_btn = page.locator('[data-testid="btn-save-all-evaluations"]')
        assert save_all_btn.is_visible(), "Save all button should be present"
        assert save_all_btn.is_disabled(), "Save all button MUST be disabled for upcoming session!"
        print('ASSERT PASS: Save All button is disabled')

        # ASSERT 3: Rate component is DISABLED
        rate_comp = page.locator('.ant-rate').first
        assert 'ant-rate-disabled' in rate_comp.get_attribute('class'), "Rate stars must be disabled!"
        print('ASSERT PASS: Star ratings are disabled')

        # ASSERT 4: Evaluation editor is DISABLED
        editor = page.locator('textarea').first
        assert editor.is_disabled(), "SimpleEvaluationEditor textarea must be disabled!"
        print('ASSERT PASS: SimpleEvaluationEditor textarea is disabled')

        # ASSERT 5: Individual save button is DISABLED
        individual_save_btn = page.locator('button[data-testid^="btn-save-eval-"]').first
        assert individual_save_btn.is_disabled(), "Individual save button must be disabled!"
        print('ASSERT PASS: Individual student save button is disabled')

        # ASSERT 6: Zero horizontal overflow on Desktop
        desktop_overflow = page.evaluate('() => document.body.scrollWidth > window.innerWidth')
        assert not desktop_overflow, "Desktop MUST have zero horizontal overflow!"
        print('ASSERT PASS: Zero overflow on Desktop')

        # Take desktop screenshot
        desktop_shot = ARTIFACT_DIR / 'e2e_upcoming_session_evaluation_locked_desktop.png'
        page.screenshot(path=str(desktop_shot), full_page=True)
        print('Saved desktop screenshot:', desktop_shot)

        # ASSERT 7: History drawer works and can be opened
        page.locator('[data-testid="btn-open-evaluation-history"]').click()
        page.wait_for_timeout(1500)
        drawer_title = page.locator('.ant-drawer-title')
        assert drawer_title.is_visible(), "History drawer title should be visible!"
        print('Drawer title:', drawer_title.inner_text())
        print('ASSERT PASS: History drawer opens successfully for upcoming class')

        history_shot = ARTIFACT_DIR / 'e2e_upcoming_session_history_drawer.png'
        page.screenshot(path=str(history_shot))
        print('Saved history screenshot:', history_shot)

        # Close drawer
        page.locator('.ant-drawer-close').click()
        page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=GV952', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1500)

        mobile_page.goto('http://127.0.0.1:3000/classroom/LH004', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(2000)

        # Switch to Tab Evaluation on Mobile
        mobile_page.locator('[data-testid="tab-evaluation"]').click()
        mobile_page.wait_for_timeout(1200)

        # Check Mobile Overflow
        mobile_overflow = mobile_page.evaluate('() => document.body.scrollWidth > window.innerWidth')
        scroll_w = mobile_page.evaluate('() => document.body.scrollWidth')
        inner_w = mobile_page.evaluate('() => window.innerWidth')
        print(f'Mobile width check: scrollWidth={scroll_w}, innerWidth={inner_w}')
        assert not mobile_overflow, f"Mobile has horizontal overflow: {scroll_w} > {inner_w}"
        print('ASSERT PASS: Zero overflow on Mobile (390px)')

        # Take mobile screenshot
        mobile_shot = ARTIFACT_DIR / 'e2e_upcoming_session_evaluation_locked_mobile.png'
        mobile_page.screenshot(path=str(mobile_shot), full_page=True)
        print('Saved mobile screenshot:', mobile_shot)

        browser.close()
        print('ALL PLAYWRIGHT TESTS PASSED SUCCESSFULLY!')

if __name__ == '__main__':
    main()
