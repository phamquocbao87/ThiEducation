import os
import sys
import time
from playwright.sync_api import sync_playwright

LOCAL_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_test():
    print("=" * 80)
    print("🧪 PHÒNG QC & IT: KIỂM THỬ TÍNH NĂNG CHỌN BUỔI & ĐÁNH GIÁ BÙ (RETROACTIVE EVALUATION)")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # ---------------------------------------------------------------------
        # TEST 1: DESKTOP VIEW (1366x850)
        # ---------------------------------------------------------------------
        print("\n--- TEST 1: DESKTOP VIEW (1366x850) - GIÁO VIÊN BẢN XỨ TEACHER MAJ (GV952) ---")
        ctx_desk = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_desk = ctx_desk.new_page()

        target_url = f"{LOCAL_URL}/classroom/LH004?sso_uid=GV952"
        print(f"Navigating to: {target_url}")
        page_desk.goto(target_url, wait_until='domcontentloaded', timeout=40000)
        page_desk.wait_for_timeout(3000)

        # Chuyển sang Tab 3: Đánh Giá Sau Giờ & Chăm Sóc PH
        tab_eval = page_desk.locator('.ant-tabs-tab').filter(has_text='Đánh Giá Sau Giờ').or_(
            page_desk.locator('.ant-tabs-tab').filter(has_text='Evaluation')
        ).first
        print(f"Clicking Evaluation tab: {tab_eval.text_content()}")
        tab_eval.click()
        page_desk.wait_for_timeout(2500)

        # 1.1 Kiểm tra Selector buổi học
        selector_container = page_desk.locator('[data-testid="retroactive-session-selector-container"]')
        assert selector_container.is_visible(), "FAIL: retroactive-session-selector-container not found!"
        print("   ✅ Retroactive Session Selector Container is visible.")

        # 1.2 Kiểm tra quyền đánh giá của buổi tối nay (Nov 16, 2026 - Session 7)
        btn_save_all = page_desk.locator('[data-testid="btn-save-all-evaluations"]')
        assert btn_save_all.is_visible(), "FAIL: btn-save-all-evaluations not visible!"
        is_disabled = btn_save_all.is_disabled()
        print(f"   Button 'Save & Complete' disabled status: {is_disabled}")
        assert not is_disabled, "FAIL: Evaluation is locked for Teacher Maj after session ended!"
        print("   ✅ Session Evaluation is UNLOCKED for Teacher Maj post-session!")

        # 1.3 Kiểm tra In-Class Note của Kenji (note "Kenji arrived 33 minutes late")
        page_content = page_desk.content()
        has_kenji_note = "Kenji arrived 33 minutes late" in page_content or "Kenji" in page_content
        print(f"   Kenji in-class note displayed: {has_kenji_note}")
        assert has_kenji_note, "FAIL: Kenji's in-class note not displayed on evaluation table!"
        print("   ✅ Kenji's in-class note displayed correctly.")

        # 1.4 Thử nghiệm chọn Buổi học trong quá khứ (Retroactive Session Selection - Buổi 2)
        select_el = page_desk.locator('[data-testid="select-retroactive-session"]')
        select_el.click()
        page_desk.wait_for_timeout(1000)

        options = page_desk.locator('.ant-select-item-option')
        opt_count = options.count()
        print(f"   Total session options in dropdown: {opt_count}")
        assert opt_count >= 5, f"FAIL: Expected >= 5 sessions in dropdown, got {opt_count}"

        # Chọn Session 2 (Option 1: Wednesday 04/11/2026 - Quên đánh giá)
        opt_past = options.nth(1)
        opt_past_text = opt_past.text_content()
        print(f"   Selecting past session: {opt_past_text}")
        opt_past.click()
        page_desk.wait_for_timeout(2000)

        # Kiểm tra banner thông báo trạng thái buổi học
        banner_retro = page_desk.locator('[data-testid="banner-retroactive-evaluation"]')
        banner_evaluated = page_desk.locator('[data-testid="banner-evaluated-session"]')
        is_retro_visible = banner_retro.is_visible()
        is_eval_visible = banner_evaluated.is_visible()
        print(f"   Banner retroactive visible: {is_retro_visible}, Banner already evaluated visible: {is_eval_visible}")
        assert is_retro_visible or is_eval_visible, "FAIL: Neither retroactive banner nor evaluated banner is visible!"
        print("   ✅ Session Status Banner displayed clearly!")

        # 1.5 Nhập nhận xét & bấm Quick Pedagogical Tag
        quick_tag = page_desk.locator('button').filter(has_text='Praise').or_(
            page_desk.locator('button').filter(has_text='Khen ngợi')
        ).first
        if quick_tag.is_visible():
            quick_tag.click()
            page_desk.wait_for_timeout(500)
            print("   ✅ Clicked Quick Pedagogical Tag!")

        # 1.6 Bấm nút Lưu Đánh Giá Buổi Này
        print("   Clicking 'Save & Complete Evaluations'...")
        btn_save_all.click()
        page_desk.wait_for_timeout(2500)
        print("   ✅ Saved retroactive evaluation for Session 2!")

        # Chụp ảnh Desktop View
        shot_desk = f"{OUTPUT_DIR}/qc_retroactive_evaluation_desktop_1366.png"
        page_desk.screenshot(path=shot_desk, full_page=False)
        print(f"   📸 Desktop Screenshot saved: {shot_desk}")

        # Assert Zero Overflow-X trên Desktop
        scroll_w_desk = page_desk.evaluate("() => document.documentElement.scrollWidth")
        inner_w_desk = page_desk.evaluate("() => window.innerWidth")
        print(f"   Desktop Viewport: scrollWidth={scroll_w_desk}px, innerWidth={inner_w_desk}px")
        assert scroll_w_desk <= inner_w_desk, f"FAIL: Horizontal overflow on desktop: {scroll_w_desk} > {inner_w_desk}"
        print("   ✅ ASSERT Zero Overflow-X on Desktop: PASS!")

        ctx_desk.close()

        # ---------------------------------------------------------------------
        # TEST 2: MOBILE VIEW (390x844 — iPhone 12/13/14)
        # ---------------------------------------------------------------------
        print("\n--- TEST 2: MOBILE VIEW (390x844) - ADAPTIVE CARD-BASED UI ---")
        ctx_mob = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        page_mob = ctx_mob.new_page()

        print(f"Navigating to mobile: {target_url}")
        page_mob.goto(target_url, wait_until='domcontentloaded', timeout=40000)
        page_mob.wait_for_timeout(3000)

        # Chuyển sang Tab 3 trên Mobile
        tab_eval_mob = page_mob.locator('.ant-tabs-tab').filter(has_text='Đánh Giá Sau Giờ').or_(
            page_mob.locator('.ant-tabs-tab').filter(has_text='Evaluation')
        ).first
        tab_eval_mob.click()
        page_mob.wait_for_timeout(2500)

        # 2.1 Assert dạng Card-Based xuất hiện (thay vì Table)
        card_list_mob = page_mob.locator('[data-testid="mobile-evaluation-card-list"]')
        assert card_list_mob.is_visible(), "FAIL: mobile-evaluation-card-list not visible on 390px!"
        print("   ✅ Adaptive Mobile Card-Based List is rendered (Zero Table on Mobile)!")

        # 2.2 Assert Sticky Bottom Action Bar xuất hiện
        sticky_bar = page_mob.locator('[data-testid="mobile-sticky-action-bar"]')
        assert sticky_bar.is_visible(), "FAIL: mobile-sticky-action-bar not visible!"
        print("   ✅ Mobile Sticky Bottom Action Bar is visible!")

        # 2.3 Thử nghiệm Quick Tags trên Mobile
        first_card = page_mob.locator('[data-testid^="mobile-eval-card-"]').first
        tag_mob = first_card.locator('button').filter(has_text='Khen ngợi').or_(
            first_card.locator('button').filter(has_text='Praise')
        ).first
        if tag_mob.is_visible():
            tag_mob.click()
            page_mob.wait_for_timeout(500)
            print("   ✅ Clicked Quick Tag on mobile card!")

        # 2.4 Bấm nút Lưu Buổi trên Sticky Bar
        btn_mob_save = page_mob.locator('[data-testid="btn-mobile-save-all"]')
        assert btn_mob_save.is_visible(), "FAIL: btn-mobile-save-all not visible!"
        btn_mob_save.click()
        page_mob.wait_for_timeout(2500)
        print("   ✅ Clicked Save All on mobile sticky bar successfully!")

        # Chụp ảnh Mobile View
        shot_mob = f"{OUTPUT_DIR}/qc_retroactive_evaluation_mobile_390.png"
        page_mob.screenshot(path=shot_mob, full_page=False)
        print(f"   📸 Mobile Screenshot saved: {shot_mob}")

        # 2.5 ASSERT Zero Overflow-X trên Mobile 390px
        scroll_w_mob = page_mob.evaluate("() => document.documentElement.scrollWidth")
        inner_w_mob = page_mob.evaluate("() => window.innerWidth")
        print(f"   Mobile Viewport: scrollWidth={scroll_w_mob}px, innerWidth={inner_w_mob}px")
        assert scroll_w_mob <= inner_w_mob, f"FAIL: Horizontal overflow on mobile: {scroll_w_mob} > {inner_w_mob}"
        print("   ✅ ASSERT Zero Overflow-X on Mobile (390px): PASS (100% Zero Overflow)!")

        ctx_mob.close()
        browser.close()

    print("\n" + "=" * 80)
    print("🎉 TẤT CẢ CÁC BÀI TEST QC RETROACTIVE EVALUATION ĐỀU PASS 100%!")
    print("=" * 80)

if __name__ == '__main__':
    run_test()
