import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS = Path('test-results/monitoring-english-names')
ARTIFACTS.mkdir(parents=True, exist_ok=True)

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

def test_monitoring_english_names():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # -------------------------------------------------------------
        # STEP 1: Teacher Maj (GV952) sets up attendance & attention
        # -------------------------------------------------------------
        print("\n=== STEP 1: Teacher Maj (GV952) sets HV151 to ONLINE + DISTRACTED, HV361 to OFFLINE ===")
        teacher_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
        t_page = teacher_ctx.new_page()

        t_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        t_page.wait_for_timeout(1000)
        t_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        t_page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        # Ensure HV151 is ONLINE
        online_btn = t_page.locator('[data-testid="online-HV151"]')
        is_online = online_btn.get_attribute('aria-pressed') == 'true'
        if not is_online:
            online_btn.click()
            t_page.wait_for_timeout(1000)

        # Ensure HV151 is DISTRACTED
        att_btn = t_page.locator('[data-testid="attention-HV151"]')
        att_state = att_btn.get_attribute('data-attention-state')
        if att_state != 'distracted':
            att_btn.click()
            t_page.wait_for_timeout(1000)

        # Ensure HV361 (Edison) is OFFLINE
        offline_btn = t_page.locator('[data-testid="offline-HV361"]')
        is_offline = offline_btn.get_attribute('aria-pressed') == 'true'
        if not is_offline:
            offline_btn.click()
            t_page.wait_for_timeout(1000)

        print("Teacher actions completed. Teacher page shows attendance.")
        teacher_ctx.close()

        # -------------------------------------------------------------
        # STEP 2: Academic Coordinator (ACA404 - Diễm Quỳnh) Monitoring
        # -------------------------------------------------------------
        print("\n=== STEP 2: Academic Coordinator (ACA404) Monitoring View on Classroom LH005 ===")
        academic_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
        a_page = academic_ctx.new_page()

        # 2A. Login as Academic via 1-click SSO
        a_page.goto(f"{BASE_URL}/?sso_uid=ACA404", wait_until='domcontentloaded')
        a_page.wait_for_timeout(1000)

        # 2B. Check Dashboard Live Monitoring Card
        a_page.goto(f"{BASE_URL}/dashboard", wait_until='domcontentloaded')
        a_page.wait_for_selector('[data-testid="attendance-summary-LH005"]', timeout=15000)

        summary_card = a_page.locator('[data-testid="attendance-summary-LH005"]')
        summary_text = summary_card.inner_text()
        print(f"Dashboard LH005 Summary Text:\n{summary_text}")

        # Verify English name appears in absent / distracted list on Dashboard
        assert 'Vivian (Bui Truong Tuong Vi)' in summary_text, f"Dashboard summary missing 'Vivian (Bui Truong Tuong Vi)'! Found: {summary_text}"
        assert 'Edison (Ta Dang Viet Hai)' in summary_text, f"Dashboard summary missing 'Edison (Ta Dang Viet Hai)'! Found: {summary_text}"
        print("✅ Dashboard Live Monitoring Card: English names correctly displayed for absent & distracted students!")

        a_page.screenshot(path=str(ARTIFACTS / 'dashboard_academic_monitoring.png'))

        # 2C. Navigate to Classroom LH005 in Monitoring Mode
        a_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        a_page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        # Verify Read-Only Hint Banner is present
        read_only_alert = a_page.locator('.ant-alert-info')
        expect(read_only_alert).to_be_visible()

        # Check distracted banner on classroom page
        distracted_banner = a_page.locator('[data-testid="distracted-students-banner"]')
        expect(distracted_banner).to_be_visible()
        distracted_banner_text = distracted_banner.inner_text()
        print(f"Classroom Distracted Banner: {distracted_banner_text}")
        assert 'Vivian (Bui Truong Tuong Vi)' in distracted_banner_text, f"Classroom distracted banner missing 'Vivian (Bui Truong Tuong Vi)'! Got: {distracted_banner_text}"

        # Check absent banner on classroom page
        absent_banner = a_page.locator('[data-testid="absent-students-banner"]')
        expect(absent_banner).to_be_visible()
        absent_banner_text = absent_banner.inner_text()
        print(f"Classroom Absent Banner: {absent_banner_text}")
        assert 'Edison (Ta Dang Viet Hai)' in absent_banner_text, f"Classroom absent banner missing 'Edison (Ta Dang Viet Hai)'! Got: {absent_banner_text}"

        # Check HV151 card in monitoring mode:
        # 1. Primary Name: Vivian
        primary_name = a_page.locator('[data-testid="primary-name-HV151"]').inner_text().strip()
        assert primary_name == 'Vivian', f"Expected Vivian, got {primary_name}"
        # 2. Secondary Name: Bui Truong Tuong Vi
        sec_name = a_page.locator('[data-testid="secondary-name-HV151"]').inner_text().strip()
        assert sec_name == 'Bui Truong Tuong Vi', f"Expected Bui Truong Tuong Vi, got {sec_name}"
        # 3. Zalo button present with clean phone
        zalo_btn = a_page.locator('[data-testid="zalo-HV151"]')
        expect(zalo_btn).to_be_visible()
        zalo_href = zalo_btn.get_attribute('href')
        print(f"HV151 Zalo link: {zalo_href}")
        assert '0786436333' in zalo_href, f"Expected 0786436333 in Zalo link, got {zalo_href}"

        # Assert zero overflow-x
        overflow = a_page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Desktop Monitoring Zero Overflow-X: {'FAIL' if overflow else 'PASS'}")
        assert not overflow, "Desktop horizontal overflow in monitoring view"

        a_page.screenshot(path=str(ARTIFACTS / 'classroom_academic_monitoring_desktop.png'), full_page=True)

        # -------------------------------------------------------------
        # STEP 3: Mobile Academic Monitoring (390x844)
        # -------------------------------------------------------------
        print("\n=== STEP 3: Mobile Academic Monitoring View (390x844) ===")
        m_ctx = browser.new_context(viewport={'width': 390, 'height': 844})
        m_page = m_ctx.new_page()

        m_page.goto(f"{BASE_URL}/?sso_uid=ACA404", wait_until='domcontentloaded')
        m_page.wait_for_timeout(1000)
        m_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        m_page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        m_overflow = m_page.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Mobile Monitoring Zero Overflow-X: {'FAIL' if m_overflow else 'PASS'}")
        assert not m_overflow, "Mobile horizontal overflow in monitoring view"

        m_distracted = m_page.locator('[data-testid="distracted-students-banner"]').inner_text()
        assert 'Vivian' in m_distracted, f"Mobile banner missing Vivian! Got: {m_distracted}"

        m_page.screenshot(path=str(ARTIFACTS / 'classroom_academic_monitoring_mobile.png'), full_page=True)
        m_ctx.close()
        academic_ctx.close()

        # -------------------------------------------------------------
        # CLEANUP: Restore HV151 to focused, HV361 to online
        # -------------------------------------------------------------
        clean_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
        c_page = clean_ctx.new_page()
        c_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        c_page.wait_for_timeout(1000)
        c_page.goto(f"{BASE_URL}/classroom/LH005", wait_until='domcontentloaded')
        c_page.wait_for_selector('[data-testid="seat-HV151"]', timeout=15000)

        # Toggle HV151 back to focused
        c_att = c_page.locator('[data-testid="attention-HV151"]')
        if c_att.get_attribute('data-attention-state') == 'distracted':
            c_att.click()
            c_page.wait_for_timeout(800)

        # Toggle HV361 back to online
        c_online = c_page.locator('[data-testid="online-HV361"]')
        c_online.click()
        c_page.wait_for_timeout(800)

        clean_ctx.close()
        browser.close()

        print("\n🎉 ALL MONITORING ENGLISH NAME TESTS PASSED COMPLETELY!")

if __name__ == '__main__':
    test_monitoring_english_names()

