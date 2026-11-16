import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_tests():
    print("🚀 Bắt đầu kiểm thử E2E: Vô hiệu hóa Enrolled Classes & Song ngữ UserDetailPage")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # =========================================================================
        # 1. HỌC VIÊN (HV151): DESKTOP VIEWPORT (1366x800) - TIẾNG ANH
        # =========================================================================
        print("\n--- 1. STUDENT (HV151): DESKTOP VIEWPORT (1366x800) - ENGLISH ---")
        ctx_s = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_s = ctx_s.new_page()

        page_s.goto(f"{BASE_URL}/?sso_uid=HV151", wait_until='domcontentloaded')
        page_s.wait_for_timeout(1000)

        # Set English
        page_s.evaluate("() => localStorage.setItem('lak_app_language', 'en')")
        page_s.goto(f"{BASE_URL}/my-profile/edit", wait_until='domcontentloaded')
        page_s.wait_for_selector('form', timeout=15000)
        page_s.wait_for_timeout(1000)

        # Chuyển sang Tab 2
        tabs_s = page_s.locator('.ant-tabs-tab')
        if tabs_s.count() >= 2:
            tabs_s.nth(1).click()
            page_s.wait_for_timeout(800)

        # Assert Zero Overflow-X
        overflow_s_dt = page_s.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Student Desktop Overflow-X: {overflow_s_dt}")
        assert not overflow_s_dt, "FAIL: Student Desktop has overflow-x!"

        # Assert Enrolled Classes Select IS DISABLED
        select_disabled = page_s.evaluate('''() => {
            const selectEl = document.querySelector('.ant-select-multiple');
            if (!selectEl) return false;
            return selectEl.classList.contains('ant-select-disabled');
        }''')
        print(f"Student Enrolled Classes Select Disabled: {select_disabled}")
        assert select_disabled, "FAIL: Expected Enrolled Classes Select to be disabled for student!"

        # Assert Tag is 'Multiple Classes' (not 'Nhiều Lớp')
        tag_text = page_s.locator('.ant-form-item-label .ant-tag').first.inner_text().strip()
        print(f"Tag Text: {tag_text}")
        assert 'Multiple Classes' in tag_text, f"FAIL: Expected 'Multiple Classes', got '{tag_text}'"

        # Assert Extra Text contains '🔒 Enrolled classes are assigned by the Academic department'
        tab2_text = page_s.locator('form').inner_text()
        print("Asserting bilingual texts in English...")
        assert 'Enrolled classes are assigned by the Academic department' in tab2_text, "FAIL: Missing English lock notice for student!"
        assert 'Curriculum level is automatically linked to enrolled classes' in tab2_text, "FAIL: Missing English curriculum level extra!"
        assert 'Accounting system automatically reconciles tuition fees' in tab2_text, "FAIL: Missing English tuition status extra!"
        assert 'Nhiều Lớp' not in tab2_text, "FAIL: Found Vietnamese 'Nhiều Lớp' in English UI!"
        assert 'Chờ đối soát' not in tab2_text, "FAIL: Found untranslated 'Chờ đối soát' in English UI!"

        shot_dt = f"{OUTPUT_DIR}/student_profile_edit_en_desktop.png"
        page_s.screenshot(path=shot_dt, full_page=True)
        print(f"📸 Screenshot Desktop EN: {shot_dt}")

        # =========================================================================
        # 2. HỌC VIÊN (HV151): MOBILE VIEWPORT (390x844) - ENGLISH
        # =========================================================================
        print("\n--- 2. STUDENT (HV151): MOBILE VIEWPORT (390x844) - ENGLISH ---")
        ctx_m = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page_m = ctx_m.new_page()

        page_m.goto(f"{BASE_URL}/?sso_uid=HV151", wait_until='domcontentloaded')
        page_m.wait_for_timeout(1000)
        page_m.evaluate("() => localStorage.setItem('lak_app_language', 'en')")
        page_m.goto(f"{BASE_URL}/my-profile/edit", wait_until='domcontentloaded')
        page_m.wait_for_selector('form', timeout=15000)
        page_m.wait_for_timeout(1000)

        # Chuyển sang Tab 2
        tabs_m = page_m.locator('.ant-tabs-tab')
        if tabs_m.count() >= 2:
            tabs_m.nth(1).click()
            page_m.wait_for_timeout(800)

        # Assert Zero Overflow-X
        overflow_m = page_m.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Student Mobile Overflow-X: {overflow_m}")
        assert not overflow_m, "FAIL: Student Mobile has overflow-x!"

        select_disabled_m = page_m.evaluate('''() => {
            const selectEl = document.querySelector('.ant-select-multiple');
            if (!selectEl) return false;
            return selectEl.classList.contains('ant-select-disabled');
        }''')
        print(f"Student Mobile Enrolled Classes Select Disabled: {select_disabled_m}")
        assert select_disabled_m, "FAIL: Expected Enrolled Classes Select to be disabled on mobile!"

        shot_m = f"{OUTPUT_DIR}/student_profile_edit_en_mobile.png"
        page_m.screenshot(path=shot_m, full_page=True)
        print(f"📸 Screenshot Mobile EN: {shot_m}")

        # =========================================================================
        # 3. HỌC VIÊN (HV151): DESKTOP VIEWPORT (1366x800) - TIẾNG VIỆT
        # =========================================================================
        print("\n--- 3. STUDENT (HV151): DESKTOP VIEWPORT (1366x800) - VIETNAMESE ---")
        page_s.evaluate("() => localStorage.setItem('lak_app_language', 'vi')")
        page_s.goto(f"{BASE_URL}/my-profile/edit", wait_until='domcontentloaded')
        page_s.wait_for_selector('form', timeout=15000)
        page_s.wait_for_timeout(1000)

        tabs_vi = page_s.locator('.ant-tabs-tab')
        if tabs_vi.count() >= 2:
            tabs_vi.nth(1).click()
            page_s.wait_for_timeout(800)

        tab2_text_vi = page_s.locator('form').inner_text()
        print("Asserting Vietnamese texts...")
        assert 'Lớp học ghi danh do Giáo vụ phân bổ' in tab2_text_vi, "FAIL: Missing Vietnamese lock notice!"
        assert 'Nhiều Lớp' in tab2_text_vi, "FAIL: Missing Vietnamese tag 'Nhiều Lớp'!"

        shot_vi = f"{OUTPUT_DIR}/student_profile_edit_vi_desktop.png"
        page_s.screenshot(path=shot_vi, full_page=True)
        print(f"📸 Screenshot Desktop VI: {shot_vi}")

        # =========================================================================
        # 4. ADMIN (ADM001) REGRESSION CHECK: CAN STILL EDIT STUDENT CLASSES
        # =========================================================================
        print("\n--- 4. ADMIN (ADM001) REGRESSION: MANAGE STUDENT CLASSES ---")
        ctx_a = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_a = ctx_a.new_page()

        page_a.goto(f"{BASE_URL}/?sso_uid=ADM001", wait_until='domcontentloaded')
        page_a.wait_for_timeout(1000)
        page_a.goto(f"{BASE_URL}/user-management/HV151/edit", wait_until='domcontentloaded')
        page_a.wait_for_selector('form', timeout=15000)
        page_a.wait_for_timeout(1000)

        # Tab 2
        tabs_a = page_a.locator('.ant-tabs-tab')
        if tabs_a.count() >= 2:
            tabs_a.nth(1).click()
            page_a.wait_for_timeout(800)

        # Assert Enrolled Classes Select IS NOT DISABLED for Admin!
        admin_select_disabled = page_a.evaluate('''() => {
            const selectEl = document.querySelector('.ant-select-multiple');
            if (!selectEl) return null;
            return selectEl.classList.contains('ant-select-disabled');
        }''')
        print(f"Admin Enrolled Classes Select Disabled: {admin_select_disabled}")
        assert not admin_select_disabled, "FAIL: Admin should BE ABLE to edit student classes!"

        shot_adm = f"{OUTPUT_DIR}/admin_manage_student_classes_enabled.png"
        page_a.screenshot(path=shot_adm, full_page=True)
        print(f"📸 Screenshot Admin Regression: {shot_adm}")

        browser.close()
        print("\n🎉 TẤT CẢ 4/4 KỊCH BẢN KIỂM THỬ PLAYWRIGHT E2E ĐẠT 100% PASS!")

if __name__ == '__main__':
    run_tests()
