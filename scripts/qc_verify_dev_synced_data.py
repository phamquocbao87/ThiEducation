import os
import sys
import time
from playwright.sync_api import sync_playwright

DEV_URL = 'https://lakeducation-dev-erp.web.app'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def verify_dev():
    print("=" * 80)
    print("🔍 PHÒNG QC & IT: KIỂM THỬ DỮ LIỆU ĐỒNG BỘ TRÊN MÔI TRƯỜNG DEV (lakeducation-dev)")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # ---------------------------------------------------------------------
        # 1. KIỂM THỬ TEACHER MAJ (GV952)
        # ---------------------------------------------------------------------
        print("\n--- 1. KIỂM THỬ GIÁO VIÊN BẢN XỨ TEACHER MAJ (GV952) TRÊN DEV ---")
        ctx_t = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_t = ctx_t.new_page()

        target_teacher_url = f"{DEV_URL}/courses-classes?sso_uid=GV952"
        print(f"Navigating to: {target_teacher_url}")
        page_t.goto(target_teacher_url, wait_until='domcontentloaded', timeout=40000)
        page_t.wait_for_timeout(3500)

        # Chờ cards lớp học xuất hiện
        page_t.wait_for_selector('.ant-card', timeout=20000)
        print("Classes rendered on Dev for Teacher Maj!")

        page_text_t = page_t.content()
        has_lh004 = 'WP01 G5' in page_text_t or 'LH004' in page_text_t
        print(f"   Teacher Maj sees LH004 (WP01 G5): {has_lh004}")
        assert has_lh004, "FAIL: Teacher Maj cannot see LH004 on Dev!"

        shot_teacher = f"{OUTPUT_DIR}/dev_verified_teacher_maj_lh004.png"
        page_t.screenshot(path=shot_teacher)
        print(f"   📸 Teacher Maj Screenshot saved: {shot_teacher}")

        # Mở Roster LH004 của Teacher Maj
        btn_roster = page_t.locator('button').filter(has_text='Roster').or_(page_t.locator('button').filter(has_text='Danh sách')).first
        if btn_roster.count() > 0:
            btn_roster.click()
            page_t.wait_for_timeout(2000)
            shot_t_roster = f"{OUTPUT_DIR}/dev_verified_teacher_roster_lh004.png"
            page_t.screenshot(path=shot_t_roster)
            print(f"   📸 Teacher Maj Roster Screenshot saved: {shot_t_roster}")

        ctx_t.close()

        # ---------------------------------------------------------------------
        # 2. KIỂM THỬ HỌC VIÊN KENJI (HV768)
        # ---------------------------------------------------------------------
        print("\n--- 2. KIỂM THỬ HỌC VIÊN KENJI (HV768) TRÊN DEV ---")
        ctx_k = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_k = ctx_k.new_page()

        target_k_url = f"{DEV_URL}/dashboard?sso_uid=HV768"
        print(f"Navigating to Dashboard: {target_k_url}")
        page_k.goto(target_k_url, wait_until='domcontentloaded', timeout=40000)
        page_k.wait_for_timeout(3500)

        shot_k_dash = f"{OUTPUT_DIR}/dev_verified_student_kenji_dashboard.png"
        page_k.screenshot(path=shot_k_dash)
        print(f"   📸 Kenji Dashboard Screenshot saved: {shot_k_dash}")

        # Vào trang courses-classes của Kenji
        page_k.goto(f"{DEV_URL}/courses-classes", wait_until='domcontentloaded')
        page_k.wait_for_timeout(3000)
        page_k.wait_for_selector('.ant-card', timeout=20000)

        page_text_k = page_k.content()
        has_lh004_k = 'WP01 G5' in page_text_k or 'LH004' in page_text_k
        print(f"   Student Kenji sees LH004 (WP01 G5): {has_lh004_k}")
        assert has_lh004_k, "FAIL: Kenji cannot see LH004 on Dev!"

        shot_k_courses = f"{OUTPUT_DIR}/dev_verified_student_kenji_courses.png"
        page_k.screenshot(path=shot_k_courses)
        print(f"   📸 Kenji Courses Screenshot saved: {shot_k_courses}")

        ctx_k.close()

        # ---------------------------------------------------------------------
        # 3. KIỂM THỬ HỌC VIÊN SUBIN (HV610 - TÀI KHOẢN MỚI TẠO)
        # ---------------------------------------------------------------------
        print("\n--- 3. KIỂM THỬ HỌC VIÊN SUBIN (HV610 - NEW ACCOUNT) TRÊN DEV ---")
        ctx_s = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_s = ctx_s.new_page()

        target_s_url = f"{DEV_URL}/courses-classes?sso_uid=HV610"
        print(f"Navigating to: {target_s_url}")
        page_s.goto(target_s_url, wait_until='domcontentloaded', timeout=40000)
        page_s.wait_for_timeout(3500)
        page_s.wait_for_selector('.ant-card', timeout=20000)

        page_text_s = page_s.content()
        has_lh004_s = 'WP01 G5' in page_text_s or 'LH004' in page_text_s
        print(f"   Student Subin (HV610) sees LH004: {has_lh004_s}")
        assert has_lh004_s, "FAIL: Subin cannot see LH004 on Dev!"

        shot_subin = f"{OUTPUT_DIR}/dev_verified_student_subin_courses.png"
        page_s.screenshot(path=shot_subin)
        print(f"   📸 Subin Courses Screenshot saved: {shot_subin}")

        ctx_s.close()
        browser.close()

    print("\n" + "=" * 80)
    print("🎉 KIỂM THỬ TRÊN MÔI TRƯỜNG DEV HOÀN TOÀN ĐẠT CHUẨN 100% PASS!")
    print("=" * 80)

if __name__ == '__main__':
    verify_dev()
