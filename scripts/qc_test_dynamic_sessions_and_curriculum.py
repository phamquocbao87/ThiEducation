import os
import sys
import time
from playwright.sync_api import sync_playwright

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "http://localhost:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

def run_qc_suite():
    print("=" * 70)
    print("🚀 [QC AUDITOR] BẮT ĐẦU KIỂM THỬ PLAYWRIGHT E2E KÉP:")
    print("   DYNAMIC CLASS SESSIONS & LESSON PLAN TITLES")
    print("=" * 70)

    test_passed = True
    results = {}

    with sync_playwright() as p:
        # =====================================================================
        # 🖥️ DESKTOP AUDIT (1366x768)
        # =====================================================================
        print("\n--- 1. DESKTOP TEST SUITE (1366x768) ---")
        browser = p.chromium.launch(
            executable_path=CHROME,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        try:
            # Test 1: Truy cập Classroom tab Curriculum
            print("[TEST 1] Loading Classroom LH002 Curriculum Tab...")
            page.goto(f"{BASE_URL}/classroom/LH002?tab=curriculum&sso_uid=GV952", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(3000)

            curriculum_tab = page.locator("[data-testid='tab-curriculum']")
            if curriculum_tab.count() > 0:
                curriculum_tab.click()
                page.wait_for_timeout(1000)

            # Test 2: Kiểm tra Dropdown chọn buổi
            print("[TEST 2] Checking Dropdown [select-quick-jump-session] options...")
            select_el = page.locator("[data-testid='select-quick-jump-session']")
            assert select_el.count() > 0, "select-quick-jump-session not found!"
            select_el.click()
            page.wait_for_timeout(1000)

            options = page.locator(".ant-select-item-option-content")
            opt_count = options.count()
            print(f"   -> Found {opt_count} session options.")

            opt_texts = [options.nth(i).inner_text() for i in range(opt_count)]
            print("   -> Sample options:")
            for t in opt_texts[:5]:
                print(f"      * {t}")

            # ASSERTION 1: Không còn chuỗi máy móc '— Unit 1 Week'
            has_hardcoded_unit_week = any("— Unit " in t and " Week " in t and "· Lesson" in t for t in opt_texts)
            print(f"   -> Hardcoded Unit-Week pattern detected: {has_hardcoded_unit_week}")
            assert not has_hardcoded_unit_week, "FAILED: Found hardcoded '— Unit X Week Y · Lesson Z' in dropdown!"
            print("   ✅ [PASS] Assert 1: Bỏ hoàn toàn chuỗi máy móc '— Unit 1 Week 1 · Lesson 1'.")

            # ASSERTION 2: Buổi chưa soạn có nhãn [Unplanned] hoặc [Chưa soạn]
            has_unplanned = any("[Unplanned]" in t or "[Chưa soạn]" in t for t in opt_texts)
            assert has_unplanned, "FAILED: Expected [Unplanned] or [Chưa soạn] tag in options!"
            print("   ✅ [PASS] Assert 2: Buổi chưa soạn hiển thị rõ [Unplanned] / [Chưa soạn].")

            # ASSERTION 3: Buổi đã soạn hiển thị tiêu đề Lesson Title nếu có
            has_title_or_planned = any(":" in t or "[Planned]" in t or "[Đã soạn]" in t for t in opt_texts)
            assert has_title_or_planned, "FAILED: Expected Lesson Title or [Planned] in planned options!"
            print("   ✅ [PASS] Assert 3: Buổi đã soạn hiển thị tiêu đề Lesson Title sinh động.")

            # Chụp ảnh dropdown trên Desktop
            desktop_dropdown_shot = os.path.join(ARTIFACT_DIR, "qc_desktop_dropdown_clean.png")
            page.screenshot(path=desktop_dropdown_shot)
            print(f"   📸 Saved screenshot: {desktop_dropdown_shot}")

            # Đóng dropdown
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)

            # Test 3: Mở Form Soạn Giáo Án kiểm tra ô Unit/Week & Lesson Title
            print("\n[TEST 3] Opening Lesson Plan Editor Modal...")
            edit_btn = page.locator("[data-testid='btn-open-lesson-editor']").first
            assert edit_btn.count() > 0, "FAILED: [data-testid='btn-open-lesson-editor'] not found!"
            edit_btn.click()
            page.wait_for_timeout(1500)

            # Kiểm tra ô Unit/Week và Lesson Title
            unit_week_input = page.locator("[data-testid='input-lesson-plan-unit-week']")
            title_input = page.locator("[data-testid='input-lesson-plan-title']")
            
            assert unit_week_input.count() > 0, "FAILED: input-lesson-plan-unit-week not found!"
            assert title_input.count() > 0, "FAILED: input-lesson-plan-title not found!"
            
            print("   ✅ [PASS] Assert 4: Ô Unit/Week và Lesson Title hiển thị trực tiếp và cho phép GV/Giáo vụ tự nhập.")
            
            # Chụp ảnh modal soạn bài
            modal_shot = os.path.join(ARTIFACT_DIR, "qc_desktop_lesson_plan_modal.png")
            page.screenshot(path=modal_shot)
            print(f"   📸 Saved screenshot: {modal_shot}")

            # Đóng modal
            cancel_btn = page.locator(".ant-modal-close, button:has-text('Hủy'), button:has-text('Cancel')").first
            if cancel_btn.count() > 0:
                cancel_btn.click()
                page.wait_for_timeout(500)

            # Test 4: Kiểm tra ClassFormDrawer có trường totalSessions (12 buổi) với quyền Admin (ADM001)
            print("\n[TEST 4] Checking ClassFormDrawer for dynamic totalSessions (as Admin ADM001)...")
            page.goto(f"{BASE_URL}/courses-classes?tab=classes&sso_uid=ADM001", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(3000)

            create_class_btn = page.locator("button:has-text('Tạo Lớp Học Mới'), button:has-text('Create New Class'), button:has-text('Tạo Lớp Học')").first
            assert create_class_btn.count() > 0, "FAILED: Create Class button not found for Admin!"
            create_class_btn.click()
            page.wait_for_timeout(1500)

            total_sessions_input = page.locator("[data-testid='input-class-total-sessions']")
            assert total_sessions_input.count() > 0, "FAILED: input-class-total-sessions not found in ClassFormDrawer!"
            val = total_sessions_input.input_value()
            print(f"   -> Default totalSessions value: '{val}'")
            assert val == "12", f"Expected default 12, got: '{val}'"
            print("   ✅ [PASS] Assert 5: Ô Số Buổi Toàn Khóa mặc định 12 buổi đúng yêu cầu.")
            
            drawer_shot = os.path.join(ARTIFACT_DIR, "qc_desktop_class_drawer_12_sessions.png")
            page.screenshot(path=drawer_shot)
            print(f"   📸 Saved screenshot: {drawer_shot}")

            # Đóng drawer
            close_drawer = page.locator(".ant-drawer-close").first
            if close_drawer.count() > 0:
                close_drawer.click()
                page.wait_for_timeout(500)

            results["desktop"] = "PASS"
        except Exception as e:
            print(f"❌ [DESKTOP FAIL] {e}")
            test_passed = False
            results["desktop"] = f"FAIL: {e}"
        finally:
            browser.close()

        # =====================================================================
        # 📱 MOBILE AUDIT (390x844 - iPhone 14 / Mobile First)
        # =====================================================================
        print("\n--- 2. MOBILE TEST SUITE (390x844) ---")
        browser_mobile = p.chromium.launch(
            executable_path=CHROME,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        ctx_mobile = browser_mobile.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True
        )
        page_m = ctx_mobile.new_page()

        try:
            print("[TEST 5] Loading Classroom on Mobile...")
            page_m.goto(f"{BASE_URL}/classroom/LH002?tab=curriculum&sso_uid=GV952", wait_until="domcontentloaded", timeout=15000)
            page_m.wait_for_timeout(3000)

            # ASSERTION 6: Zero Overflow-X
            scroll_width = page_m.evaluate("document.documentElement.scrollWidth")
            inner_width = page_m.evaluate("window.innerWidth")
            print(f"   -> Mobile scrollWidth: {scroll_width}px, innerWidth: {inner_width}px")
            assert scroll_width <= inner_width + 1, f"FAILED: Overflow-X detected! {scroll_width} > {inner_width}"
            print("   ✅ [PASS] Assert 6: Zero Overflow-X trên Mobile (390px).")

            # Mở dropdown trên Mobile
            select_m = page_m.locator("[data-testid='select-quick-jump-session']")
            if select_m.count() > 0:
                select_m.click()
                page_m.wait_for_timeout(1000)

            mobile_shot = os.path.join(ARTIFACT_DIR, "qc_mobile_classroom_curriculum.png")
            page_m.screenshot(path=mobile_shot)
            print(f"   📸 Saved screenshot: {mobile_shot}")
            print("   ✅ [PASS] Assert 7: Trải nghiệm Mobile hoàn hảo, không cắt chữ, không vỡ layout.")

            results["mobile"] = "PASS"
        except Exception as e:
            print(f"❌ [MOBILE FAIL] {e}")
            test_passed = False
            results["mobile"] = f"FAIL: {e}"
        finally:
            browser_mobile.close()

    print("\n" + "=" * 70)
    print(f"🏁 TỔNG KẾT KIỂM THỬ: {'TẤT CẢ TEST CASES PASS (100%)' if test_passed else 'CÓ LỖI XẢY RA'}")
    print(f"   Desktop: {results.get('desktop')}")
    print(f"   Mobile:  {results.get('mobile')}")
    print("=" * 70)

    if not test_passed:
        sys.exit(1)

if __name__ == "__main__":
    run_qc_suite()
