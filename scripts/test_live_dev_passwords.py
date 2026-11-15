"""
Verify live authentication on https://lakeducation-dev.web.app with default password @Bcd1234
"""
from playwright.sync_api import sync_playwright

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
DEV_LANDING = 'https://lakeducation-dev.web.app'

def run_live_dev_test():
    print("==================================================================")
    print("🌐 KIỂM THỬ ĐĂNG NHẬP LIVE TRÊN MÔI TRƯỜNG DEV (lakeducation-dev.web.app)")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        try:
            # Test Admin
            print("\n1. Testing Admin (ADM001) login with @Bcd1234...")
            ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
            page = ctx.new_page()
            page.goto(f'{DEV_LANDING}/?require_login=true', wait_until='domcontentloaded')
            page.wait_for_selector('#identifier', state='visible', timeout=15000)
            page.fill('#identifier', 'phamquocbao87@gmail.com')
            page.fill('#password', '@Bcd1234')
            page.click('button[type="submit"]')
            page.wait_for_timeout(4000)

            curr_url = page.url
            body = page.locator('body').inner_text()
            print(f"   Current URL: {curr_url}")
            assert 'lakeducation-dev-erp' in curr_url or '/dashboard' in curr_url
            assert 'Phạm Quốc Bảo' in body or 'ADM001' in body
            print("   ✅ PASS: Admin logged in successfully to Live Dev ERP!")
            ctx.close()

            # Test Student Vivian
            print("\n2. Testing Student Vivian (HV151) with phone 0786436333 and @Bcd1234...")
            ctx2 = browser.new_context(viewport={'width': 1280, 'height': 800})
            page2 = ctx2.new_page()
            page2.goto(f'{DEV_LANDING}/?require_login=true', wait_until='domcontentloaded')
            page2.wait_for_selector('#identifier', state='visible', timeout=15000)
            page2.fill('#identifier', '0786436333')
            page2.fill('#password', '@Bcd1234')
            page2.click('button[type="submit"]')
            page2.wait_for_timeout(4000)

            curr_url2 = page2.url
            body2 = page2.locator('body').inner_text()
            print(f"   Current URL: {curr_url2}")
            assert 'lakeducation-dev-erp' in curr_url2 or '/dashboard' in curr_url2
            assert 'Vivian' in body2 or 'HV151' in body2 or 'Tường Vi' in body2
            print("   ✅ PASS: Student logged in successfully to Live Dev ERP!")
            ctx2.close()

            print("\n==================================================================")
            print("🎉 XÁC NHẬN 100%: MẬT KHẨU MẶC ĐỊNH @Bcd1234 HOẠT ĐỘNG HOÀN HẢO TRÊN LIVE DEV!")
            print("==================================================================")
        finally:
            browser.close()

if __name__ == '__main__':
    run_live_dev_test()
