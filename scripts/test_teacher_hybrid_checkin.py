import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS = Path('test-results/teacher-hybrid-checkin')
ARTIFACTS.mkdir(parents=True, exist_ok=True)

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

def test_teacher_hybrid_checkin():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # -------------------------------------------------------------
        # STEP 1: Teacher Maj (GV952) checks in via teaching actions
        # -------------------------------------------------------------
        print("\n=== STEP 1: Teacher Maj (GV952) enters LH005 & takes attendance ===")
        t_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
        t_page = t_ctx.new_page()

        t_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        t_page.wait_for_timeout(1000)
        t_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        t_page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        # Teacher marks Vivian Online
        online_btn = t_page.locator('[data-testid="online-HV151"]')
        online_btn.click()
        t_page.wait_for_timeout(1500)

        # Verify Teacher Desk Card reflects check-in status
        desk_card = t_page.locator('[data-testid="teacher-desk-card"]')
        expect(desk_card).to_be_visible()

        checkedin_tag = t_page.locator('[data-testid="teacher-checkedin-tag"]')
        expect(checkedin_tag).to_be_visible(timeout=5000)
        tag_text = checkedin_tag.inner_text()
        print(f"Teacher Desk Check-in Tag: '{tag_text}' -> PASS")
        assert 'Đã vào lớp' in tag_text or 'In Class' in tag_text, f"Unexpected checkin tag text: {tag_text}"

        # Assert zero overflow-x
        overflow = t_page.evaluate('document.body.scrollWidth > window.innerWidth')
        assert not overflow, "Desktop horizontal overflow on teacher view"

        t_page.screenshot(path=str(ARTIFACTS / 'teacher_desk_checkedin_desktop.png'))
        print(f"Saved teacher screenshot to {ARTIFACTS / 'teacher_desk_checkedin_desktop.png'}")
        t_ctx.close()

        # -------------------------------------------------------------
        # STEP 2: Academic Coordinator (ACA404) verifies Teacher Check-In
        # -------------------------------------------------------------
        print("\n=== STEP 2: Academic Coordinator (ACA404) verifies Teacher Check-In ===")
        a_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
        a_page = a_ctx.new_page()

        a_page.goto(f"{BASE_URL}/?sso_uid=ACA404", wait_until='domcontentloaded')
        a_page.wait_for_timeout(1000)
        a_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        a_page.wait_for_selector('[data-testid="teacher-desk-card"]', timeout=15000)

        # Academic also sees teacher checked-in tag
        a_checkedin_tag = a_page.locator('[data-testid="teacher-checkedin-tag"]')
        expect(a_checkedin_tag).to_be_visible()
        a_tag_text = a_checkedin_tag.inner_text()
        print(f"Academic View - Teacher Status: '{a_tag_text}' -> PASS")

        # Academic should NOT see the manual confirm button since teacher is already checked in
        confirm_btn = a_page.locator('[data-testid="confirm-teacher-checkin-btn"]')
        assert confirm_btn.count() == 0, "Confirm button should be hidden when teacher is already checked in"

        a_page.screenshot(path=str(ARTIFACTS / 'academic_view_teacher_status.png'))
        a_ctx.close()

        # -------------------------------------------------------------
        # STEP 3: Mobile Verification (390x844)
        # -------------------------------------------------------------
        print("\n=== STEP 3: Mobile Viewport Verification (390x844) ===")
        m_ctx = browser.new_context(viewport={'width': 390, 'height': 844})
        m_page = m_ctx.new_page()

        m_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        m_page.wait_for_timeout(1000)
        m_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        m_page.wait_for_selector('[data-testid="teacher-desk-card"]', timeout=15000)

        m_overflow = m_page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Mobile Overflow-X: {'FAIL' if m_overflow else 'PASS'}")
        assert not m_overflow, "Mobile horizontal overflow"

        m_tag = m_page.locator('[data-testid="teacher-checkedin-tag"]')
        expect(m_tag).to_be_visible()

        m_page.screenshot(path=str(ARTIFACTS / 'mobile_teacher_checkedin.png'), full_page=True)
        m_ctx.close()

        browser.close()
        print("\n🎉 ALL HYBRID TEACHER CHECK-IN E2E TESTS PASSED COMPLETELY!")

if __name__ == '__main__':
    test_teacher_hybrid_checkin()

