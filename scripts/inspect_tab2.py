import os
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def inspect_tab2():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )
        ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = ctx.new_page()

        page.goto(f"{BASE_URL}/?sso_uid=HV151", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)

        # Set English language
        page.evaluate("() => localStorage.setItem('lak_language', 'en')")
        page.goto(f"{BASE_URL}/my-profile/edit", wait_until='domcontentloaded')
        page.wait_for_selector('form', timeout=15000)
        page.wait_for_timeout(1000)

        # Click Tab 2
        tabs = page.locator('.ant-tabs-tab')
        count = tabs.count()
        print(f"Total tabs found: {count}")
        for i in range(count):
            print(f"Tab {i}: {tabs.nth(i).inner_text()}")

        if count >= 2:
            tabs.nth(1).click()
            page.wait_for_timeout(1000)

        page.screenshot(path=f"{OUTPUT_DIR}/student_edit_tab2_en.png", full_page=True)
        tab2_pane = page.locator('.ant-tabs-tabpane-active')
        print("--- ACTIVE TAB CONTENT (EN) ---")
        print(tab2_pane.inner_text())

        browser.close()

if __name__ == '__main__':
    inspect_tab2()
