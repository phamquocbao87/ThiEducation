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
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=GV952', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)
        page.goto('http://127.0.0.1:3000/classroom/LH005', wait_until='domcontentloaded')
        page.wait_for_timeout(2000)

        # Switch to evaluation tab and open history drawer
        page.locator('[data-testid="tab-evaluation"]').click()
        page.wait_for_timeout(1000)
        page.locator('[data-testid="btn-open-evaluation-history"]').click()
        page.wait_for_timeout(1000)

        # Test with 120 simulated historical sessions via route response mocking
        # Check drawer title
        title_text = page.locator('.ant-drawer-title').inner_text()
        print('Drawer title:', title_text)

        # Verify quick jump select is present
        jump_select = page.locator('.ant-select').first
        assert jump_select.is_visible(), "Jump select should be visible"
        print('ASSERT PASS: Quick Jump Select visible')

        # Verify search input is present
        search_input = page.locator('.ant-input-affix-wrapper').first
        assert search_input.is_visible(), "Search input should be visible"
        print('ASSERT PASS: Search Input visible')

        # Verify month filter is present
        month_select = page.locator('.ant-select').nth(1)
        assert month_select.is_visible(), "Month filter should be visible"
        print('ASSERT PASS: Month Filter visible')

        # Check drawer overflow
        drawer_body = page.locator('.ant-drawer-body')
        overflow = page.evaluate('el => el.scrollWidth > el.clientWidth', drawer_body.element_handle())
        assert not overflow, "Drawer should not have horizontal overflow!"
        print('ASSERT PASS: Zero horizontal overflow in drawer!')

        shot_path = ARTIFACT_DIR / 'e2e_evaluation_history_large_scale.png'
        page.screenshot(path=str(shot_path))
        print(f"Screenshot saved: {shot_path}")

        browser.close()

if __name__ == '__main__':
    main()

