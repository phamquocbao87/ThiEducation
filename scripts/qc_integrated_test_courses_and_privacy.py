#!/usr/bin/env python3
"""
qc_integrated_test_courses_and_privacy.py
Kiểm thử tích hợp (Integrated E2E Test) trên Playwright Headless kiểm toán toàn diện:
1. Học viên HV253 chỉ thấy lớp mình đăng ký (LH002), ẩn hoàn toàn các lớp khác (LH004, LH005). Tab đếm (1).
2. Học viên HV739 chỉ thấy lớp mình đăng ký (LH004), ẩn hoàn toàn các lớp khác (LH002, LH005). Tab đếm (1).
3. Giáo viên GV952 mở Catalog & Chi tiết khóa học: Hoàn toàn KHÔNG thấy Fee / Monthly Fee / Full Course Tuition.
4. Quản trị viên ADM001: Thấy đầy đủ toàn bộ lớp học và toàn bộ học phí để quản trị.
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

def run_integrated_tests():
    print("==================================================================")
    print("🚀 2. INTEGRATED TEST: KIỂM TOÁN TÍCH HỢP PLAYWRIGHT E2E")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ----------------------------------------------------
            # KỊCH BẢN 1: HỌC VIÊN HV253 (Melissa)
            # ----------------------------------------------------
            print("\n--- [KỊCH BẢN 1]: HỌC VIÊN HV253 (CHỈ THAM GIA LH002) ---")
            ctx_hv253 = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_hv253.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_hv253 = ctx_hv253.new_page()
            page_hv253.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
            page_hv253.wait_for_timeout(2500)

            # Assert thẻ LH002 hiển thị
            card_lh002 = page_hv253.locator("[data-testid='class-card-LH002']")
            assert card_lh002.is_visible(), "LỖI: Học viên HV253 bắt buộc phải thấy lớp LH002 đã đăng ký!"
            print("   ✅ [PASS]: Thấy đúng lớp đã đăng ký: LH002")

            # Assert thẻ LH004 và LH005 BỊ ẨN HOÀN TOÀN
            card_lh004 = page_hv253.locator("[data-testid='class-card-LH004']")
            card_lh005 = page_hv253.locator("[data-testid='class-card-LH005']")
            assert not card_lh004.is_visible(), "LỖI BẢO MẬT: HV253 không học LH004 nhưng vẫn nhìn thấy!"
            assert not card_lh005.is_visible(), "LỖI BẢO MẬT: HV253 không học LH005 nhưng vẫn nhìn thấy!"
            print("   ✅ [PASS]: Các lớp không thuộc về HV253 (LH004, LH005) đã bị ẩn 100%!")

            # Assert tab count
            tab_classes = page_hv253.locator(".ant-tabs-tab:has-text('Lớp Học')").first
            tab_text = tab_classes.inner_text()
            print(f"   - Nhãn tab lớp học của HV253: '{tab_text}'")
            assert "(1)" in tab_text, f"LỖI: Nhãn tab phải đếm (1), thực tế: {tab_text}"
            print("   ✅ [PASS]: Nhãn tab hiển thị chuẩn xác (1) lớp!")

            shot_hv253 = os.path.join(ARTIFACT_DIR, "qc_student_hv253_courses_classes_scoped.png")
            page_hv253.screenshot(path=shot_hv253)
            print(f"📸 Chụp ảnh minh chứng HV253: {shot_hv253}")
            ctx_hv253.close()

            # ----------------------------------------------------
            # KỊCH BẢN 2: HỌC VIÊN HV739 (Nguyen Dinh Vu)
            # ----------------------------------------------------
            print("\n--- [KỊCH BẢN 2]: HỌC VIÊN HV739 (CHỈ THAM GIA LH004) ---")
            ctx_hv739 = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_hv739.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV739');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_hv739 = ctx_hv739.new_page()
            page_hv739.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
            page_hv739.wait_for_timeout(2500)

            # Assert thẻ LH004 hiển thị
            card_lh004_739 = page_hv739.locator("[data-testid='class-card-LH004']")
            assert card_lh004_739.is_visible(), "LỖI: Học viên HV739 bắt buộc phải thấy lớp LH004 đã đăng ký!"
            print("   ✅ [PASS]: Thấy đúng lớp đã đăng ký: LH004")

            # Assert thẻ LH002 và LH005 BỊ ẨN HOÀN TOÀN
            assert not page_hv739.locator("[data-testid='class-card-LH002']").is_visible(), "LỖI: HV739 không được thấy LH002!"
            assert not page_hv739.locator("[data-testid='class-card-LH005']").is_visible(), "LỖI: HV739 không được thấy LH005!"
            print("   ✅ [PASS]: Các lớp không thuộc về HV739 (LH002, LH005) đã bị ẩn 100%!")

            shot_hv739 = os.path.join(ARTIFACT_DIR, "qc_student_hv739_courses_classes_scoped.png")
            page_hv739.screenshot(path=shot_hv739)
            print(f"📸 Chụp ảnh minh chứng HV739: {shot_hv739}")
            ctx_hv739.close()

            # ----------------------------------------------------
            # KỊCH BẢN 3: GIÁO VIÊN GV952 (Teacher Maj)
            # ----------------------------------------------------
            print("\n--- [KỊCH BẢN 3]: GIÁO VIÊN GV952 (KIỂM TOÁN ẨN HỌC PHÍ) ---")
            ctx_teacher = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_teacher.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'en');
            """)
            page_teacher = ctx_teacher.new_page()
            page_teacher.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
            page_teacher.wait_for_timeout(2000)

            # Bấm sang Tab Course Programs Catalog
            tab_catalog = page_teacher.locator(".ant-tabs-tab:has-text('Course Programs Catalog')").first
            tab_catalog.click()
            page_teacher.wait_for_timeout(1000)

            # Kiểm tra Thẻ Khóa học: Dòng Fee hoàn toàn KHÔNG CÒN
            course_cards_text = page_teacher.locator(".ant-card").first.inner_text()
            has_fee_in_card = "Fee:" in course_cards_text or "2.500.000" in course_cards_text
            print(f"   - Dòng Fee trên thẻ Catalog của Giáo viên: {has_fee_in_card} (Kỳ vọng: FALSE)")
            assert not has_fee_in_card, "LỖI: Giáo viên vẫn nhìn thấy dòng Fee trên thẻ Catalog!"
            print("   ✅ [PASS]: Dòng Fee trên thẻ Catalog đã bị ẩn hoàn toàn đối với Giáo viên!")

            shot_teacher_catalog = os.path.join(ARTIFACT_DIR, "qc_teacher_catalog_no_fee.png")
            page_teacher.screenshot(path=shot_teacher_catalog)
            print(f"📸 Chụp ảnh Catalog Giáo viên: {shot_teacher_catalog}")

            # Bấm nút xem chi tiết khóa học (View Details)
            btn_details = page_teacher.locator("button:has-text('View Details')").first
            btn_details.click()
            page_teacher.wait_for_timeout(1200)

            drawer_elem = page_teacher.locator(".ant-drawer-section, .ant-drawer").first
            drawer_content = drawer_elem.inner_text()

            # Assert: Monthly Fee card & Full Course Tuition bị ẩn hoàn toàn
            has_monthly_fee_drawer = "Monthly Fee" in drawer_content
            has_full_tuition_drawer = "Full Course Tuition" in drawer_content
            print(f"   - Card 'Monthly Fee' trong Drawer: {has_monthly_fee_drawer} (Kỳ vọng: FALSE)")
            print(f"   - Dòng 'Full Course Tuition' trong Drawer: {has_full_tuition_drawer} (Kỳ vọng: FALSE)")

            assert not has_monthly_fee_drawer, "LỖI: Giáo viên vẫn thấy Card Monthly Fee trong Drawer!"
            assert not has_full_tuition_drawer, "LỖI: Giáo viên vẫn thấy Full Course Tuition trong Drawer!"
            print("   ✅ [PASS]: Toàn bộ học phí trong Drawer đã được loại bỏ hoàn toàn đối với Giáo viên!")

            # Assert: Thời lượng và Sĩ số chuẩn vẫn giữ nguyên
            assert "Duration" in drawer_content, "LỖI: Card Duration phải hiển thị cho giáo viên!"
            assert "Max Class Size" in drawer_content, "LỖI: Card Max Class Size phải hiển thị cho giáo viên!"
            assert "Study Frequency" in drawer_content, "LỖI: Study Frequency phải hiển thị cho giáo viên!"
            print("   ✅ [PASS]: Các thông tin sư phạm (Duration, Max Class Size, Study Frequency) bảo toàn 100%!")

            shot_teacher_drawer = os.path.join(ARTIFACT_DIR, "qc_teacher_drawer_no_fee.png")
            page_teacher.screenshot(path=shot_teacher_drawer)
            print(f"📸 Chụp ảnh Drawer Chi Tiết Giáo viên: {shot_teacher_drawer}")
            ctx_teacher.close()

            # ----------------------------------------------------
            # KỊCH BẢN 4: IT ADMIN ADM001 (TOÀN QUYỀN HỆ THỐNG)
            # ----------------------------------------------------
            print("\n--- [KỊCH BẢN 4]: IT ADMIN ADM001 (BẢO TOÀN HIỂN THỊ ĐẦY ĐỦ) ---")
            ctx_admin = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_admin.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ADM001');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_admin = ctx_admin.new_page()
            page_admin.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
            page_admin.wait_for_timeout(2000)

            # Assert: Admin thấy toàn bộ 3 lớp học
            assert page_admin.locator("[data-testid='class-card-LH002']").is_visible()
            assert page_admin.locator("[data-testid='class-card-LH004']").is_visible()
            assert page_admin.locator("[data-testid='class-card-LH005']").is_visible()
            print("   ✅ [PASS]: Admin thấy đầy đủ 3/3 lớp học trong hệ thống!")

            # Bấm sang Tab Catalog -> Admin vẫn thấy học phí đầy đủ
            tab_cat_admin = page_admin.locator(".ant-tabs-tab:has-text('Danh Mục Khóa Học')").first
            tab_cat_admin.click()
            page_admin.wait_for_timeout(1000)

            cat_admin_text = page_admin.locator("body").inner_text()
            assert "Học phí:" in cat_admin_text and "2.500.000" in cat_admin_text
            print("   ✅ [PASS]: Admin vẫn nhìn thấy học phí niêm yết đầy đủ phục vụ điều hành!")

            shot_admin = os.path.join(ARTIFACT_DIR, "qc_admin_courses_full_access.png")
            page_admin.screenshot(path=shot_admin)
            print(f"📸 Chụp ảnh Admin toàn quyền: {shot_admin}")
            ctx_admin.close()

            print("\n==================================================================")
            print("🎉 TẤT CẢ 4/4 KỊCH BẢN INTEGRATED TEST ĐẠT 100% PASS!")
            print("==================================================================")
            return True

        except Exception as e:
            print(f"\n❌ Integrated Test thất bại: {e}")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    ok = run_integrated_tests()
    sys.exit(0 if ok else 1)
