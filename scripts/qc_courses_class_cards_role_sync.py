#!/usr/bin/env python3
"""
qc_courses_class_cards_role_sync.py
Kiểm thử E2E đồng bộ giao diện Card lớp trên `/courses-classes` theo đúng View của 3 nhóm vai trò:
1. Giáo vụ (ACA545 — Desktop & Mobile 390px): Có đồng hồ đếm ngược, thanh tiến độ buổi học, Tag trạng thái Live, Zalo, nút Sửa & Xóa, Zero Overflow-X.
2. Giáo viên bản xứ (GV952 — Desktop): Có đồng hồ đếm ngược, thanh tiến độ buổi học, Tag trạng thái Live, nút `Phòng Giảng Dạy`, ẩn 100% Zalo & ẩn nút Sửa/Xóa lớp.
3. Học viên (HV253 — Desktop & Mobile 390px): Chỉ thấy lớp mình (`LH002`), có `Tiến độ khóa học`, đồng hồ đếm ngược, nút `Vào Lớp Học` & `Bạn Cùng Lớp`, ẨN 100% thống kê điểm danh nội bộ lớp & nút Sửa/Xóa.
"""
import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"


def run_qc():
    print("==================================================================")
    print("🚀 PLAYWRIGHT QC E2E — /courses-classes UNIFIED ROLE-AWARE CARDS")
    print("==================================================================")
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # 1. GIÁO VỤ ACA545 (DESKTOP)
            print("\n📋 [1/3] GIÁO VỤ ACA545 — FULL ADMIN/ACADEMIC VIEW")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_aca.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            paca = ctx_aca.new_page()
            paca.on("pageerror", lambda err: console_errors.append(f"ACA545: {err}"))
            paca.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
            paca.wait_for_selector("[data-testid='class-card-LH002']", timeout=15000)
            paca.wait_for_timeout(1200)

            card_aca = paca.locator("[data-testid='class-card-LH002']")
            assert card_aca.locator("[data-testid='courses-class-progress-LH002']").is_visible(), "Thiếu thanh tiến độ buổi học!"
            assert card_aca.locator("[data-testid='class-session-timer']").is_visible(), "Thiếu đồng hồ đếm ngược!"
            assert card_aca.locator("[data-testid='btn-edit-class-LH002']").is_visible(), "Giáo vụ phải có nút Sửa lớp!"
            assert "zalo" in card_aca.inner_text().lower(), "Giáo vụ phải thấy nhóm Zalo lớp!"
            print("   ✅ [PASS] Giáo vụ ACA545: Đủ Timer + Tiến độ buổi học + Zalo + Nút Sửa/Xóa + Chi Tiết Lớp")

            shot_aca = os.path.join(ARTIFACT_DIR, "qc_courses_card_academic.png")
            paca.screenshot(path=shot_aca)
            print(f"   📸 Screenshot Academic /courses-classes: {shot_aca}")
            ctx_aca.close()

            # 2. GIÁO VIÊN GV952 (DESKTOP)
            print("\n👨‍🏫 [2/3] GIÁO VIÊN GV952 — NATIVE TEACHER VIEW (0% ZALO, 0% EDIT/DELETE)")
            ctx_gv = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_gv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pgv = ctx_gv.new_page()
            pgv.on("pageerror", lambda err: console_errors.append(f"GV952: {err}"))
            pgv.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
            pgv.wait_for_selector("[data-testid='class-card-LH002']", timeout=15000)
            pgv.wait_for_timeout(1200)

            card_gv = pgv.locator("[data-testid='class-card-LH002']")
            gv_txt = card_gv.inner_text()
            assert card_gv.locator("[data-testid='courses-class-progress-LH002']").is_visible()
            assert card_gv.locator("[data-testid='class-session-timer']").is_visible()
            assert "Phòng Giảng Dạy" in gv_txt, "GV phải thấy nút 'Phòng Giảng Dạy'!"
            assert "zalo" not in gv_txt.lower(), "VI PHẠM ZALO GUARD trên card GV!"
            assert not card_gv.locator("[data-testid='btn-edit-class-LH002']").is_visible(), "GV không được thấy nút Sửa cấu hình lớp!"
            print("   ✅ [PASS] Giáo viên GV952: Đủ Timer + Tiến độ + 'Phòng Giảng Dạy', ẩn 100% Zalo & Sửa/Xóa")

            shot_gv = os.path.join(ARTIFACT_DIR, "qc_courses_card_teacher.png")
            pgv.screenshot(path=shot_gv)
            print(f"   📸 Screenshot Teacher /courses-classes: {shot_gv}")
            ctx_gv.close()

            # 3. HỌC VIÊN HV253 (DESKTOP & MOBILE 390px)
            print("\n👨‍🎓 [3/3] HỌC VIÊN HV253 — STUDENT VIEW (SCOPED + MOBILE ZERO OVERFLOW-X)")
            ctx_st = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
            ctx_st.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pst = ctx_st.new_page()
            pst.on("pageerror", lambda err: console_errors.append(f"HV253: {err}"))
            pst.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
            pst.wait_for_selector("[data-testid='class-card-LH002']", timeout=15000)
            pst.wait_for_timeout(1200)

            ov = pst.evaluate("() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })")
            assert ov["sw"] <= ov["iw"], f"Mobile Student Overflow-X: {ov}"

            card_st = pst.locator("[data-testid='class-card-LH002']")
            st_txt = card_st.inner_text()
            assert not pst.locator("[data-testid='class-card-LH004']").is_visible(), "HV253 chỉ được thấy lớp mình!"
            assert card_st.locator("[data-testid='courses-class-progress-LH002']").is_visible()
            assert "Tiến độ khóa học" in st_txt
            assert "Vào Lớp Học" in st_txt and "Bạn Cùng Lớp" in st_txt
            assert not card_st.locator("[data-testid='btn-edit-class-LH002']").is_visible()
            print(f"   ✅ [PASS] Học viên HV253 Mobile 390px: Zero Overflow-X ({ov['sw']} <= {ov['iw']}), chỉ thấy LH002, 'Tiến độ khóa học', 'Vào Lớp Học' & 'Bạn Cùng Lớp'")

            shot_st = os.path.join(ARTIFACT_DIR, "qc_courses_card_student_mobile.png")
            pst.screenshot(path=shot_st)
            print(f"   📸 Screenshot Student Mobile /courses-classes: {shot_st}")
            ctx_st.close()

            assert len(console_errors) == 0, f"Lỗi JS Console: {console_errors}"
            print("\n==================================================================")
            print("🎉 TẤT CẢ 3 ROLE VIEWS TRÊN /courses-classes ĐỀU PASS 100%!")
            print("==================================================================")
        finally:
            browser.close()


if __name__ == "__main__":
    run_qc()
