"""
Comprehensive E2E Verification Suite for Bcrypt Password Authentication
Tests real login across roles, phone logins, family clusters, and wrong password rejection.
"""
from playwright.sync_api import sync_playwright
import time
import json
import subprocess

BASE = 'http://127.0.0.1:3000'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

TEST_CASES = [
    {
        'name': '1. IT Admin (ADM001)',
        'identifier': 'phamquocbao87@gmail.com',
        'password': '@Bcd1234',
        'expected_role': 'admin',
        'expected_name': 'Phạm Quốc Bảo'
    },
    {
        'name': '2. Giám Đốc (DIR505)',
        'identifier': 'lakvietnam@lakeducation.com',
        'password': '@Bcd1234',
        'expected_role': 'director',
        'expected_name': 'Phạm Thị Hiếu Thi'
    },
    {
        'name': '3. Giáo Viên (GV952)',
        'identifier': 'paguntalan.marjorie05@gmail.com',
        'password': '@Bcd1234',
        'expected_role': 'teacher',
        'expected_name': 'Teacher Maj'
    },
    {
        'name': '4. Học Viên Đơn Lẻ (HV151)',
        'identifier': '0786436333',
        'password': '@Bcd1234',
        'expected_role': 'student',
        'expected_name': 'Bui Truong Tuong Vi'
    }
]

def test_single_login(page, tc):
    print(f"\n🔑 TESTING {tc['name']} with real password...")
    page.goto(f'{BASE}/?require_login=true', wait_until='domcontentloaded')
    page.wait_for_selector('#identifier', state='visible', timeout=10000)

    # Fill credentials
    page.fill('#identifier', tc['identifier'])
    page.fill('#password', tc['password'])
    page.click('button[type="submit"]')

    # Wait for navigation / modal close
    page.wait_for_timeout(3500)

    # Check that we are logged in (dashboard or protected route)
    current_url = page.url
    print(f"   Current URL: {current_url}")

    body_text = page.locator('body').inner_text()
    is_success = tc['expected_name'] in body_text or tc['expected_role'] in current_url or '/dashboard' in current_url or '/contracts' in current_url
    print(f"   User Name Found ({tc['expected_name']}): {tc['expected_name'] in body_text}")
    print(f"   Status: {'✅ PASS' if is_success else '❌ FAIL'}")
    assert is_success, f"Failed login for {tc['name']}"


def test_family_cluster(page):
    print("\n👨‍👩‍👧‍👦 TESTING 5. Family Cluster Login (0909005750 - Multiple Students)...")
    page.goto(f'{BASE}/?require_login=true', wait_until='domcontentloaded')
    page.wait_for_selector('#identifier', state='visible', timeout=10000)

    page.fill('#identifier', '0909005750')
    page.fill('#password', '@Bcd1234')
    page.click('button[type="submit"]')

    page.wait_for_timeout(2500)

    # Check if candidate profiles modal/list is shown
    body_text = page.locator('body').inner_text()
    has_profiles = 'Thanh Nha' in body_text or 'HV253' in body_text or 'HV361' in body_text or 'Chọn hồ sơ' in body_text or 'Select Profile' in body_text or 'Melissa' in body_text or 'Edison' in body_text
    print(f"   Family Cluster Selection Displayed: {has_profiles}")
    print(f"   Status: {'✅ PASS' if has_profiles else '❌ FAIL'}")
    assert has_profiles, "Family cluster profile selection was not triggered!"


def test_wrong_password(page):
    print("\n🚫 TESTING 6. Wrong Password Rejection...")
    page.goto(f'{BASE}/?require_login=true', wait_until='domcontentloaded')
    page.wait_for_selector('#identifier', state='visible', timeout=10000)

    page.fill('#identifier', 'phamquocbao87@gmail.com')
    page.fill('#password', 'ThisIsAWrongPassword999')
    page.click('button[type="submit"]')

    page.wait_for_timeout(2000)

    body_text = page.locator('body').inner_text()
    rejected = 'Tài khoản hoặc mật khẩu không đúng' in body_text or 'Incorrect email or password' in body_text
    print(f"   Error Message Displayed: {rejected}")
    print(f"   Status: {'✅ PASS' if rejected else '❌ FAIL'}")
    assert rejected, "Wrong password was not rejected properly!"


def run_all_tests():
    print("==================================================================")
    print("🛡️ KIỂM THỬ TỰ ĐỘNG BROWSER E2E: XÁC THỰC MẬT KHẨU BCRYPT HASHING")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        try:
            for tc in TEST_CASES:
                ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
                page = ctx.new_page()
                test_single_login(page, tc)
                ctx.close()

            # Test Family Cluster
            ctx_fam = browser.new_context(viewport={'width': 1280, 'height': 800})
            page_fam = ctx_fam.new_page()
            test_family_cluster(page_fam)
            ctx_fam.close()

            # Test Wrong Password
            ctx_wrong = browser.new_context(viewport={'width': 1280, 'height': 800})
            page_wrong = ctx_wrong.new_page()
            test_wrong_password(page_wrong)
            ctx_wrong.close()

            print("\n==================================================================")
            print("🎉 TẤT CẢ 6 KỊCH BẢN KIỂM THỬ XÁC THỰC BCRYPT ĐỀU ĐẠT CHUẨN 100% (PERFECT PASS)!")
            print("==================================================================")
        finally:
            browser.close()


if __name__ == '__main__':
    run_all_tests()
