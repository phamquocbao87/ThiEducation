import os
import sys
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
        # 1. TEST VIETNAMESE LANGUAGE AS TEACHER MAJ
        # -------------------------------------------------------------
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        # Set localStorage language to vi
        page.goto('http://127.0.0.1:3000/?sso_uid=GV952', wait_until='domcontentloaded')
        page.evaluate("() => localStorage.setItem('lak_app_language', 'vi')")
        page.goto('http://127.0.0.1:3000/classroom/LH004', wait_until='domcontentloaded')
        page.wait_for_timeout(2000)

        # Switch to Tab Evaluation
        page.locator('[data-testid="tab-evaluation"]').click()
        page.wait_for_timeout(1000)

        banner = page.locator('[data-testid="upcoming-session-evaluation-banner"]')
        assert banner.is_visible(), "Upcoming banner must be visible in Vietnamese!"
        banner_vi_text = banner.inner_text()
        print('Vietnamese Banner text:', banner_vi_text)
        assert 'Buổi Học Chưa Diễn Ra' in banner_vi_text, "Vietnamese banner title must match!"
        assert ('16/11/2026' in banner_vi_text or '16 thg 11, 2026' in banner_vi_text), "Date must mention 16 and 2026!"
        print('ASSERT PASS: Vietnamese banner rendered cleanly')

        vi_shot = ARTIFACT_DIR / 'e2e_upcoming_session_vi_teacher.png'
        page.screenshot(path=str(vi_shot), full_page=True)
        print('Saved VI screenshot:', vi_shot)

        # -------------------------------------------------------------
        # 2. TEST STUDENT VIEW (HV235 in class LH004)
        # -------------------------------------------------------------
        student_page = browser.new_page(viewport={'width': 1366, 'height': 800})
        student_page.goto('http://127.0.0.1:3000/?sso_uid=HV235', wait_until='domcontentloaded')
        student_page.wait_for_timeout(1500)
        student_page.goto('http://127.0.0.1:3000/classroom/LH004', wait_until='domcontentloaded')
        student_page.wait_for_timeout(2000)

        # Switch to Tab Evaluation as Student
        student_page.locator('[data-testid="tab-evaluation"]').click()
        student_page.wait_for_timeout(1000)

        student_alert = student_page.locator('[data-testid="student-upcoming-session-alert"]')
        assert student_alert.is_visible(), "Student upcoming session alert MUST be visible!"
        print('Student upcoming alert text:', student_alert.inner_text())

        history_btn = student_page.locator('[data-testid="btn-student-view-history"]')
        assert history_btn.is_visible(), "Student history button MUST be visible!"
        print('ASSERT PASS: Student view displays upcoming notice and history button')

        student_shot = ARTIFACT_DIR / 'e2e_upcoming_session_student_view.png'
        student_page.screenshot(path=str(student_shot), full_page=True)
        print('Saved student screenshot:', student_shot)

        browser.close()
        print('ALL VI & STUDENT PLAYWRIGHT TESTS PASSED!')

if __name__ == '__main__':
    main()
