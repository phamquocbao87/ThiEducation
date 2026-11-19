import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def run_test():
    print("🚀 BẮT ĐẦU KIỂM THỬ PLAYWRIGHT E2E: HỌC BẠ ĐIỆN TỬ & MỤC TIÊU HỌC VIÊN (GOALS & MILESTONES)")
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------------------------
        # TEST CASE 1: HỌC VIÊN KENJI (HV768) XEM HỌC BẠ CỦA MÌNH TẠI /my-profile
        # ----------------------------------------------------------------------
        print("\n--- 1. TEST VIEW HỌC VIÊN (HV768) XEM HỌC BẠ & GOAL ---")
        context_student = browser.new_context(viewport={"width": 1280, "height": 800})
        page_student = context_student.new_page()
        page_student.on("pageerror", lambda err: errors.append(f"[STUDENT]: {err}"))

        page_student.goto(f"{BASE_URL}/my-profile?sso_uid=HV768", wait_until="domcontentloaded")
        time.sleep(2)

        # Bấm sang Tab "Học Bạ Điện Tử & Mục Tiêu"
        transcript_tab = page_student.locator('.ant-tabs-tab:has-text("Học Bạ Điện Tử")')
        if transcript_tab.count() == 0:
            transcript_tab = page_student.locator('.ant-tabs-tab:has-text("Academic Transcript")')

        assert transcript_tab.count() > 0, "Lỗi: Không tìm thấy Tab Học Bạ Điện Tử!"
        print("👉 Bấm chọn Tab Học Bạ Điện Tử & Mục Tiêu...")
        transcript_tab.first.click()
        time.sleep(1.5)

        # Kiểm tra hiển thị các khối mục tiêu
        has_goal_title = page_student.locator('text=Mục Tiêu Khóa Học').count() > 0 or page_student.locator('text=Chinh Phục').count() > 0
        print(f"✅ [PASS] Khối Mục Tiêu Khóa Học hiển thị: {has_goal_title}")
        assert has_goal_title, "Lỗi: Khối Mục Tiêu Khóa Học không hiển thị!"

        # Chụp ảnh Desktop Học Viên
        desktop_student_shot = os.path.join(ARTIFACTS_DIR, "qc_student_transcript_desktop.png")
        page_student.screenshot(path=desktop_student_shot, full_page=False)
        print(f"📸 Đã lưu ảnh Desktop Học Viên: {desktop_student_shot}")

        # Kiểm tra Bảo Mật: Học viên TUYỆT ĐỐI KHÔNG THẤY Ghi chú nội bộ bảo mật
        internal_notes = page_student.locator('text=Sổ Ghi Chú Nghiệp Vụ Nội Bộ (Bảo Mật)')
        assert internal_notes.count() == 0, "LỖI BẢO MẬT: Học viên nhìn thấy Ghi chú nội bộ bí mật!"
        print("🔒 [PASS BẢO MẬT]: Học viên hoàn toàn KHÔNG THẤY Ghi chú nội bộ bí mật.")

        # Kiểm tra Zero Overflow-X Desktop
        overflow_x = page_student.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_x, "Lỗi: Tràn ngang Desktop!"
        print("✅ [PASS] Zero Overflow-X Desktop.")

        context_student.close()

        # ----------------------------------------------------------------------
        # TEST CASE 2: KIỂM THỬ GIAO DIỆN MOBILE 390x844 (HỌC VIÊN)
        # ----------------------------------------------------------------------
        print("\n--- 2. TEST GIAO DIỆN MOBILE (390x844) HỌC BẠ & GOAL ---")
        context_mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        page_mobile = context_mobile.new_page()
        page_mobile.on("pageerror", lambda err: errors.append(f"[MOBILE]: {err}"))

        page_mobile.goto(f"{BASE_URL}/my-profile?sso_uid=HV768", wait_until="domcontentloaded")
        time.sleep(2)

        mobile_tab = page_mobile.locator('.ant-tabs-tab:has-text("Học Bạ")').first
        if mobile_tab.count() == 0:
            mobile_tab = page_mobile.locator('.ant-tabs-tab:has-text("Transcript")').first
        mobile_tab.click()
        time.sleep(1.5)

        # Chụp ảnh Mobile
        mobile_shot = os.path.join(ARTIFACTS_DIR, "qc_student_transcript_mobile.png")
        page_mobile.screenshot(path=mobile_shot, full_page=False)
        print(f"📸 Đã lưu ảnh Mobile: {mobile_shot}")

        overflow_x_mobile = page_mobile.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_x_mobile, "Lỗi: Tràn ngang Mobile!"
        print("✅ [PASS] Zero Overflow-X Mobile đạt chuẩn 390px.")

        context_mobile.close()

        # ----------------------------------------------------------------------
        # TEST CASE 3: GIÁO VỤ (ACA404) QUẢN TRỊ HỌC BẠ & CẬP NHẬT MILESTONE
        # ----------------------------------------------------------------------
        print("\n--- 3. TEST VIEW GIÁO VỤ (ACA404) TRUY CẬP HỌC BẠ & CẬP NHẬT MILESTONE ---")
        context_academic = browser.new_context(viewport={"width": 1280, "height": 800})
        page_academic = context_academic.new_page()
        page_academic.on("pageerror", lambda err: errors.append(f"[ACADEMIC]: {err}"))

        page_academic.goto(f"{BASE_URL}/user-management/HV768?sso_uid=ACA404", wait_until="domcontentloaded")
        time.sleep(2)

        academic_tab = page_academic.locator('.ant-tabs-tab:has-text("Học Bạ Điện Tử")')
        if academic_tab.count() == 0:
            academic_tab = page_academic.locator('.ant-tabs-tab:has-text("Academic Transcript")')
        academic_tab.first.click()
        time.sleep(1.5)

        # Giáo vụ CÓ QUYỀN THẤY Ghi chú nội bộ bí mật
        has_internal = page_academic.locator('text=Sổ Ghi Chú Nghiệp Vụ Nội Bộ').count() > 0 or page_academic.locator('text=Internal Teacher').count() > 0
        print(f"✅ [PASS] Giáo vụ nhìn thấy Sổ ghi chú nghiệp vụ nội bộ: {has_internal}")
        assert has_internal, "Lỗi: Giáo vụ không thấy sổ ghi chú nội bộ!"

        # Chụp ảnh View Giáo Vụ
        academic_shot = os.path.join(ARTIFACTS_DIR, "qc_academic_view_transcript.png")
        page_academic.screenshot(path=academic_shot, full_page=False)
        print(f"📸 Đã lưu ảnh View Giáo Vụ: {academic_shot}")

        context_academic.close()
        browser.close()

        # ----------------------------------------------------------------------
        # TỔNG KẾT
        # ----------------------------------------------------------------------
        print("\n--- 4. TỔNG KẾT KIỂM TOÁN RUNTIME ---")
        if errors:
            print(f"❌ CÓ {len(errors)} LỖI RUNTIME:")
            for e in errors:
                print(f"   {e}")
            assert False, "Có lỗi runtime trong quá trình kiểm thử!"
        else:
            print("🎉 TẤT CẢ 3 GÓC NHÌN ĐỀU ĐẠT 100% PASS KHÔNG MỘT LỖI!")

if __name__ == "__main__":
    run_test()
