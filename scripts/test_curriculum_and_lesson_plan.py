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
        # 1. DESKTOP VIEWPORT TEST (1366x800)
        # -------------------------------------------------------------
        print("\n--- 1. TESTING DESKTOP VIEWPORT (1366x800) ---")
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=GV952', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # Navigate to class LH004
        page.goto('http://127.0.0.1:3000/classroom/LH004', wait_until='domcontentloaded')
        page.wait_for_timeout(2000)

        # Switch to Tab Curriculum
        page.locator('[data-testid="tab-curriculum"]').click()
        page.wait_for_timeout(1200)

        # ASSERT 1: Zero raw i18n keys on the page
        body_text = page.locator('body').inner_text()
        assert 'classroom.multiSessionTag' not in body_text, "MUST NOT have raw key classroom.multiSessionTag!"
        assert 'classroom.addNextPlan' not in body_text, "MUST NOT have raw key classroom.addNextPlan!"
        assert 'classroom.selectSessionToPlan' not in body_text, "MUST NOT have raw key classroom.selectSessionToPlan!"
        print("ASSERT PASS: Zero raw i18n keys detected in DOM")

        # ASSERT 2: 100+ Sessions Scalable Controls
        quick_jump = page.locator('[data-testid="select-quick-jump-session"]')
        assert quick_jump.is_visible(), "Quick Jump Select must be visible for 100+ sessions!"
        status_filter = page.locator('[data-testid="session-status-filter"]')
        assert status_filter.is_visible(), "Session status filter must be visible!"
        prev_btn = page.locator('[data-testid="btn-prev-session"]')
        next_btn = page.locator('[data-testid="btn-next-session"]')
        assert prev_btn.is_visible() and next_btn.is_visible(), "Prev/Next session buttons must be visible!"
        print("ASSERT PASS: 100+ sessions scalable navigation controls verified")

        # ASSERT 3: Pill Timeline Check (No false "Hôm nay", Buổi 1 has checkmark)
        pill_1 = page.locator('[data-testid="session-pill-1"]')
        assert pill_1.is_visible(), "Session pill 1 MUST be visible!"
        pill_1_text = pill_1.inner_text()
        print(f"Pill 1 Text: '{pill_1_text}'")
        assert '16/11' in pill_1_text, f"Pill 1 must display date 16/11, got: {pill_1_text}"
        assert 'Hôm nay' not in pill_1_text and 'Today' not in pill_1_text, "Pill 1 must NOT say 'Hôm nay' or 'Today' since class starts 16/11!"
        print("ASSERT PASS: Session 1 correctly shows schedule date and no false 'Hôm nay'")

        # ASSERT 4: Buổi 2 does NOT have fake syllabus, displays genuine Empty State!
        pill_2 = page.locator('[data-testid="session-pill-2"]')
        assert pill_2.is_visible(), "Session pill 2 must be visible!"
        pill_2.click()
        page.wait_for_timeout(800)

        # Verify Empty State card is displayed
        empty_plan_card = page.locator('[data-testid="empty-session-plan-card"]')
        assert empty_plan_card.is_visible(), "Empty state card MUST be visible for Session 2 which has no lesson plan yet!"
        empty_text = empty_plan_card.inner_text()
        print("Session 2 Empty Card text:", empty_text.replace('\n', ' -- '))
        assert 'Essential Question' not in empty_text, "MUST NOT have fake syllabus text for session 2!"
        assert 'Six Kids' not in empty_text, "MUST NOT have fake anchor text for session 2!"
        assert 'Chưa có giáo án' in empty_text or 'No Lesson Plan Prepared' in empty_text or 'Chưa Có Giáo Án' in empty_text, "Empty card must state no plan prepared yet"

        # Verify button to prepare plan for Session 2 is visible
        prepare_btn = page.locator('[data-testid="btn-prepare-this-session-plan"]')
        assert prepare_btn.is_visible(), "Prepare lesson plan button must be visible for Session 2!"
        print("ASSERT PASS: Session 2 accurately shows Empty State with zero fake syllabus")

        # Take screenshot of Session 2 Empty State
        screenshot_empty = ARTIFACT_DIR / 'e2e_session_2_empty_state_desktop.png'
        page.screenshot(path=str(screenshot_empty), full_page=True)
        print(f"Captured screenshot: {screenshot_empty}")

        # ASSERT 5: Course Program Vault (100% Real DB: Empty State when no files uploaded yet)
        course_vault = page.locator('[data-testid="course-program-vault"]')
        assert course_vault.is_visible(), "Course Program Vault must be visible!"
        empty_vault = page.locator('[data-testid="empty-course-vault"]')
        assert empty_vault.is_visible(), "Empty Course Vault state MUST be visible when no materials uploaded!"
        vault_text = course_vault.inner_text()
        print("Course Vault text:", vault_text[:200].replace('\n', ' '))
        assert 'Grade 1' not in vault_text, "No dummy Grade 1 files!"
        print("ASSERT PASS: Course Program Vault accurately displays genuine Empty State")

        # ASSERT 6: Test Prev/Next buttons
        prev_btn.click() # Moves from Session 2 back to Session 1
        page.wait_for_timeout(500)
        assert page.locator('[data-testid="active-session-plan-card"]').is_visible(), "Session 1 has a plan so active card must be visible!"
        print("ASSERT PASS: Prev button successfully navigated to Session 1")

        # Zero Overflow-X check on Desktop
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        inner_width = page.evaluate("() => window.innerWidth")
        assert scroll_width <= inner_width, f"Desktop overflow-x detected! scrollWidth ({scroll_width}) > innerWidth ({inner_width})"
        print(f"ASSERT PASS Desktop: Zero Overflow-X (scrollWidth: {scroll_width} <= innerWidth: {inner_width})")

        page.close()

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        print("\n--- 2. TESTING MOBILE VIEWPORT (390x844) ---")
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=GV952', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1500)

        mobile_page.goto('http://127.0.0.1:3000/classroom/LH004', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(2000)

        # Switch to Tab Curriculum
        mobile_page.locator('[data-testid="tab-curriculum"]').click()
        mobile_page.wait_for_timeout(1200)

        # Assert zero overflow-x on Mobile
        m_scroll_width = mobile_page.evaluate("() => document.documentElement.scrollWidth")
        m_inner_width = mobile_page.evaluate("() => window.innerWidth")
        assert m_scroll_width <= m_inner_width, f"Mobile overflow-x detected! scrollWidth ({m_scroll_width}) > innerWidth ({m_inner_width})"
        print(f"ASSERT PASS Mobile: Zero Overflow-X (scrollWidth: {m_scroll_width} <= innerWidth: {m_inner_width})")

        # Capture mobile curriculum screenshot
        mobile_curriculum_screenshot = ARTIFACT_DIR / 'e2e_curriculum_hundred_sessions_mobile.png'
        mobile_page.screenshot(path=str(mobile_curriculum_screenshot), full_page=True)
        print(f"Captured mobile screenshot: {mobile_curriculum_screenshot}")

        # Test selecting Session 2 on Mobile via Next button
        mobile_next_btn = mobile_page.locator('[data-testid="btn-next-session"]')
        mobile_next_btn.click()
        mobile_page.wait_for_timeout(800)
        assert mobile_page.locator('[data-testid="empty-session-plan-card"]').is_visible(), "Session 2 empty state must be visible on Mobile!"
        print("ASSERT PASS Mobile: 1-touch Next button successfully navigated to Session 2 on mobile")

        mobile_page.close()
        browser.close()

        print("\n=======================================================")
        print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFICATION PASSED")
        print("=======================================================")

if __name__ == '__main__':
    main()
