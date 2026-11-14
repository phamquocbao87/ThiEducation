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

        # Simulate 120 historical sessions directly in React component by calling setFirestoreSessions if exposed,
        # or simulate by injecting 120 options into the DOM to verify visual layout
        page.evaluate('''() => {
            // Find quick jump select and test options count
            const selectEl = document.querySelector('.ant-drawer-body .ant-select');
            console.log('Select found:', Boolean(selectEl));
        }''')

        # Check search input interaction
        search_box = page.locator('.ant-drawer-body input').first
        search_box.fill('Session 1')
        page.wait_for_timeout(600)

        shot_search = ARTIFACT_DIR / 'e2e_evaluation_history_search_test.png'
        page.screenshot(path=str(shot_search))
        print(f"Screenshot search saved: {shot_search}")

        # Clear search
        search_box.fill('')
        page.wait_for_timeout(600)

        browser.close()

if __name__ == '__main__':
    main()

