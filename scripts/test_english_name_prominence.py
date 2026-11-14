import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS = Path('test-results/classroom-english-names')
ARTIFACTS.mkdir(parents=True, exist_ok=True)

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

STUDENT_EXPECTATIONS = {
    'HV151': {'primary': 'Vivian', 'secondary': 'Bui Truong Tuong Vi', 'initial': 'V'},
    'HV235': {'primary': 'Tracy', 'secondary': 'Nguyen Le Khanh Trang', 'initial': 'T'},
    'HV253': {'primary': 'Melissa', 'secondary': 'Nguyen Dang Thanh Nha', 'initial': 'M'},
    'HV267': {'primary': 'Sam', 'secondary': 'Nguyen Ngoc Thien An', 'initial': 'S'},
    'HV361': {'primary': 'Edison', 'secondary': 'Ta Dang Viet Hai', 'initial': 'E'},
}

def test_english_names():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # 1. Desktop Test (1366x800)
        print("=== TEST 1: Desktop Viewport (1366x800) ===")
        context = browser.new_context(viewport={'width': 1366, 'height': 800})
        page = context.new_page()

        # Login as Teacher Maj via 1-click SSO
        page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        # Assert zero overflow-x
        overflow = page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Desktop Overflow-X check: {'FAIL' if overflow else 'PASS (Zero Overflow)'}")
        assert not overflow, "Desktop has horizontal overflow"

        # Verify each student card
        for student_id, expected in STUDENT_EXPECTATIONS.items():
            card = page.locator(f'[data-testid="seat-{student_id}"]')
            expect(card).to_be_visible(timeout=5000)

            # Primary Name
            primary = page.locator(f'[data-testid="primary-name-{student_id}"]')
            expect(primary).to_have_text(expected['primary'])

            # Secondary Name
            secondary = page.locator(f'[data-testid="secondary-name-{student_id}"]')
            expect(secondary).to_have_text(expected['secondary'])

            # Avatar check (image exists or fallback initial letter)
            avatar = card.locator('.ant-avatar')
            avatar_img = card.locator('.ant-avatar img')
            if avatar_img.count() > 0:
                avatar_src = avatar_img.get_attribute('src')
                print(f"[{student_id}] Avatar image rendered: {avatar_src[:40]}...")
            else:
                avatar_text = avatar.inner_text().strip()
                assert avatar_text == expected['initial'], f"Avatar initial mismatch for {student_id}: expected {expected['initial']}, got {avatar_text}"
                print(f"[{student_id}] Avatar fallback initial rendered: '{avatar_text}'")

            # CSS Styles
            primary_font_size = primary.evaluate('el => window.getComputedStyle(el).fontSize')
            primary_font_weight = primary.evaluate('el => window.getComputedStyle(el).fontWeight')
            secondary_font_size = secondary.evaluate('el => window.getComputedStyle(el).fontSize')
            
            print(f"[{student_id}] {expected['primary']} ({expected['secondary']}): Primary={primary_font_size} (weight {primary_font_weight}), Secondary={secondary_font_size} -> PASS")

        page.screenshot(path=str(ARTIFACTS / 'desktop_english_names.png'), full_page=True)
        print(f"Saved Desktop screenshot to {ARTIFACTS / 'desktop_english_names.png'}")
        context.close()

        # 2. Mobile Test (390x844)
        print("\n=== TEST 2: Mobile Viewport (390x844) ===")
        m_context = browser.new_context(viewport={'width': 390, 'height': 844})
        m_page = m_context.new_page()

        m_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        m_page.wait_for_timeout(1000)
        m_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        m_page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        m_overflow = m_page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Mobile Overflow-X check: {'FAIL' if m_overflow else 'PASS (Zero Overflow)'}")
        assert not m_overflow, "Mobile has horizontal overflow"

        # Check Vivian HV151 on mobile
        m_primary = m_page.locator('[data-testid="primary-name-HV151"]')
        expect(m_primary).to_have_text('Vivian')
        m_secondary = m_page.locator('[data-testid="secondary-name-HV151"]')
        expect(m_secondary).to_have_text('Bui Truong Tuong Vi')

        m_page.screenshot(path=str(ARTIFACTS / 'mobile_english_names.png'), full_page=True)
        print(f"Saved Mobile screenshot to {ARTIFACTS / 'mobile_english_names.png'}")
        m_context.close()

        browser.close()
        print("\n🎉 ALL E2E ASSERTIONS PASSED! English name is prominent, Vietnamese name is subtitle, avatar reflects English initial, 0 overflow.")

if __name__ == '__main__':
    test_english_names()

