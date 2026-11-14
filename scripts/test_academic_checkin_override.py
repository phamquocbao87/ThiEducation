import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS = Path('test-results/teacher-hybrid-checkin')
ARTIFACTS.mkdir(parents=True, exist_ok=True)

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

def test_academic_override():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        context = browser.new_context(viewport={'width': 1366, 'height': 800})
        page = context.new_page()

        # 1. Login as Academic Coordinator Diễm Quỳnh (ACA404)
        page.goto(f"{BASE_URL}/?sso_uid=ACA404", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        page.wait_for_selector('[data-testid="teacher-desk-card"]', timeout=15000)

        # 2. Reset teacherCheckIn to PENDING in Firestore to simulate teacher NOT yet checked in
        print("Resetting teacherCheckIn to PENDING to test Academic Override...")
        page.evaluate('''async () => {
            const { db } = await import('/src/core/services/firebase.js');
            const { doc, updateDoc } = await import('/node_modules/.vite/deps/firebase_firestore.js');
            await updateDoc(doc(db, 'classroom_live', 'LH005'), {
                teacherCheckIn: { status: 'PENDING', checkedInAt: null, method: null },
                checkInStatus: 'PENDING'
            });
        }''')
        page.wait_for_timeout(1500)

        # 3. Academic should now see the pending tag and the confirm button!
        pending_tag = page.locator('[data-testid="teacher-pending-tag"]')
        confirm_btn = page.locator('[data-testid="confirm-teacher-checkin-btn"]')

        expect(pending_tag).to_be_visible(timeout=10000)
        expect(confirm_btn).to_be_visible(timeout=10000)
        print("PASS: Academic sees 'Awaiting Teacher' pending tag and '[Confirm Teacher Present]' button!")

        page.screenshot(path=str(ARTIFACTS / 'academic_awaiting_teacher_btn.png'))

        # 4. Academic clicks the confirm button
        print("Academic clicking '[Confirm Teacher Present]' button...")
        confirm_btn.click()
        page.wait_for_timeout(2000)

        # 5. Verify teacher checkin tag is now green and visible!
        checkedin_tag = page.locator('[data-testid="teacher-checkedin-tag"]')
        expect(checkedin_tag).to_be_visible(timeout=10000)
        tag_text = checkedin_tag.inner_text()
        print(f"PASS: Academic Override Confirmed! Tag updated to: '{tag_text}'")

        # 6. Verify confirm button is now hidden
        expect(confirm_btn).to_have_count(0)

        page.screenshot(path=str(ARTIFACTS / 'academic_override_success.png'))
        print(f"Saved screenshots to {ARTIFACTS}")

        context.close()
        browser.close()
        print("\n🎉 ALL ACADEMIC OVERRIDE TESTS PASSED COMPLETELY!")

if __name__ == '__main__':
    test_academic_override()
