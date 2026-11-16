import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = 'https://bk.lakeducation.edu.vn'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def verify_live():
    print("=" * 80)
    print("🔒 PHÒNG QC & IT: KIỂM THỬ TRỰC TIẾP LIVE PRODUCTION BACKUP (https://bk.lakeducation.edu.vn)")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # 1. Test HV739 (Học viên) on LIVE BACKUP
        print("\n--- 1. KIỂM THỬ TÀI KHOẢN HỌC VIÊN (HV739) TRÊN LIVE BACKUP ---")
        ctx = browser.new_context(viewport={'width': 1366, 'height': 850})
        page = ctx.new_page()

        # Login with SSO
        target_url = f"{BASE_URL}/courses-classes?sso_uid=HV739"
        print(f"Navigating to {target_url}...")
        page.goto(target_url, wait_until='domcontentloaded', timeout=40000)
        page.wait_for_timeout(3000)

        # Wait for cards
        page.wait_for_selector('.ant-card', timeout=20000)
        print("Classes rendered successfully on Live!")

        # Find Roster button
        btn_roster = page.locator('button').filter(has_text='Roster').or_(page.locator('button').filter(has_text='Danh sách')).first
        if btn_roster.count() == 0:
            print("Trying alternative roster button selector...")
            btn_roster = page.locator('.ant-card button:has-text("Roster")').first
        
        assert btn_roster.count() > 0, "FAIL: Roster button not found on student class card on Live!"
        btn_roster.click()
        page.wait_for_selector('.ant-drawer', timeout=10000)
        page.wait_for_timeout(2000)

        drawer_text = page.locator('.ant-drawer').inner_text()
        has_parent_header = 'Parent Contact' in drawer_text or 'Phụ Huynh & SĐT' in drawer_text
        has_tuition_header = 'Tuition Status' in drawer_text or 'Tình Trạng Học Phí' in drawer_text

        print(f"   Live Student Roster has 'Parent Contact': {has_parent_header} (Must be False)")
        print(f"   Live Student Roster has 'Tuition Status': {has_tuition_header} (Must be False)")

        shot_path = f"{OUTPUT_DIR}/live_backup_student_roster_verified.png"
        page.screenshot(path=shot_path)
        print(f"   📸 Live Screenshot saved: {shot_path}")

        assert not has_parent_header, "CRITICAL ERROR: Live site still shows Parent Contact to student!"
        assert not has_tuition_header, "CRITICAL ERROR: Live site still shows Tuition Status to student!"

        print("   🎉 100% PASS: Học viên trên Live hoàn toàn KHÔNG THẤY SĐT phụ huynh và học phí!")
        browser.close()

if __name__ == '__main__':
    verify_live()
