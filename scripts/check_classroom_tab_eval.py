import os
from playwright.sync_api import sync_playwright

def inspect_classroom():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )
        ctx = browser.new_context(viewport={'width': 1366, 'height': 850})
        page = ctx.new_page()

        print("Navigating to http://localhost:3000/classroom/LH004?sso_uid=GV952...")
        page.goto('http://localhost:3000/classroom/LH004?sso_uid=GV952', wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(3000)

        tabs = page.locator('.ant-tabs-tab').all_text_contents()
        print("Classroom Tabs:", tabs)

        tab_eval = page.locator('.ant-tabs-tab').filter(has_text='Đánh Giá').or_(page.locator('.ant-tabs-tab').filter(has_text='Evaluation')).first
        if tab_eval.count() > 0:
            print("Clicking Evaluation tab...")
            tab_eval.click()
            page.wait_for_timeout(2000)

            shot_path = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/teacher_maj_classroom_tab_eval.png'
            page.screenshot(path=shot_path)
            print(f"Screenshot saved: {shot_path}")

            text = page.locator('.classroom-page').inner_text()
            print("Preview:\n", text[:500])

        browser.close()

if __name__ == '__main__':
    inspect_classroom()
