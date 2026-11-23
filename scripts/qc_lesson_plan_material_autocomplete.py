#!/usr/bin/env python3
"""
qc_lesson_plan_material_autocomplete.py
Kiểm thử E2E Mô Hình 1 Tài Liệu = 1 Control Autocomplete + 1 Control Nhắc Trang/Vị Trí Trong "Soạn Giáo Án":
1. Giáo viên GV952 mở /classroom/LH002 -> tab Soạn Giáo Án -> bấm Soạn Thêm Buổi Mới.
2. Dòng #1 (`select-lesson-material-row-0`):
   - Assert lọc sạch STAFF_ONLY (`Teacher’s Edition`) & `Session Recording`.
   - Gõ chọn `Literature Anthology G5U1` + nhập ô nhắc trang `Trang 10–25, phần Essential Question`.
3. Bấm `+ Thêm Tài Liệu` (`btn-add-lesson-material-row`) -> tạo Dòng #2:
   - Gõ chọn `Practice Book G5U1` + nhập ô nhắc trang `Trang 14–16, Bài tập 1 & 2`.
4. Lưu Giáo Án -> F5 reload -> Kiểm tra Classroom hiển thị đủ 2 tài liệu kèm đúng `📍 Trang ...`.
5. Học viên HV253 mở /dashboard & Book Reader -> kiểm tra hiển thị đủ 2 tài liệu kèm đúng trang/vị trí cần xem (Zero Overflow-X).
6. Zero-Residue Teardown: Xóa sạch giáo án test khỏi Dev Firestore.
"""
import os
import re
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"
TEST_TITLE = "QC_AUTOCOMPLETE_MATERIALS_PAGE_GUIDE_TEST"
NOTE_1 = "Trang 10–25, phần Essential Question"
NOTE_2 = "Trang 14–16, Bài tập 1 & 2"


def teardown_test_lesson_plan(session_index):
    if not session_index:
        return
    print(f"\n🧹 [TEARDOWN]: Xóa sạch giáo án test Session {session_index} trên classes/LH002...")
    node_code = f"""
import {{ initializeApp }} from 'firebase/app';
import {{ getFirestore, doc, updateDoc, deleteField, deleteDoc }} from 'firebase/firestore';
const app = initializeApp({{
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
}}, 'QC_LP_MAT_CLEANUP_V2');
const db = getFirestore(app, 'lakeducationdb');
await updateDoc(doc(db, 'classes', 'LH002'), {{
  ['lessonPlans.{session_index}']: deleteField(),
}}).catch((e) => console.warn('updateDoc warn:', e.message));
await deleteDoc(doc(db, 'classes', 'LH002', 'lesson_plans', 'SESSION_{session_index}')).catch(() => {{}});
console.log('✅ Zero-Residue Teardown hoàn tất cho LH002 Session {session_index}!');
process.exit(0);
"""
    res = subprocess.run(
        ["node", "--input-type=module", "-e", node_code],
        cwd="/Volumes/DATA/projects/ThiEducation",
        capture_output=True,
        text=True,
    )
    print("  ", res.stdout.strip() if res.returncode == 0 else f"⚠️ {res.stderr.strip()}")


def run_qc():
    print("==================================================================")
    print("🚀 PLAYWRIGHT QC E2E — 1 MATERIAL = 1 AUTOCOMPLETE + 1 PAGE/LOCATION NOTE")
    print("==================================================================")
    created_session_index = None
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ==============================================================
            # 1. GIÁO VIÊN GV952 — THÊM 2 DÒNG TÀI LIỆU + GHI CHÚ TRANG/VỊ TRÍ
            # ==============================================================
            print("\n👨‍🏫 [1/3] GIÁO VIÊN GV952 — CHỌN 2 DÒNG TÀI LIỆU & NHẬP TRANG/VỊ TRÍ CẦN XEM")
            ctx_gv = browser.new_context(viewport={"width": 1366, "height": 880})
            ctx_gv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pgv = ctx_gv.new_page()
            pgv.on("pageerror", lambda err: page_errors.append(f"GV952: {err}"))

            pgv.goto(f"{BASE_URL}/classroom/LH002", wait_until="domcontentloaded")
            pgv.wait_for_selector("[data-testid='tab-curriculum']", timeout=18000)
            pgv.locator("[data-testid='tab-curriculum']").click()
            pgv.wait_for_selector("[data-testid='btn-add-session-plan']", timeout=15000)
            pgv.wait_for_timeout(1200)

            pgv.locator("[data-testid='btn-add-session-plan']").click()
            pgv.wait_for_selector("[data-testid='lesson-plan-modal-title']", timeout=10000)
            pgv.wait_for_timeout(1400)

            title_txt = pgv.locator("[data-testid='lesson-plan-modal-title']").inner_text()
            m = re.search(r"Buổi\s+(\d+)|Session\s+(\d+)", title_txt)
            created_session_index = int(m.group(1) or m.group(2)) if m else 13
            print(f"   ℹ️ Đang soạn giáo án test cho Buổi {created_session_index}")

            pgv.locator("[data-testid='input-lesson-plan-title']").fill(TEST_TITLE)

            # Dòng #1: Chọn Literature Anthology G5U1 + nhập vị trí trang
            row0_sel = pgv.locator("[data-testid='select-lesson-material-row-0']")
            row0_sel.scroll_into_view_if_needed()
            row0_sel.click()
            pgv.wait_for_timeout(500)

            dd_txt = pgv.locator(".ant-select-dropdown:visible").inner_text()
            assert "Teacher’s Edition" not in dd_txt and "Teacher's Edition" not in dd_txt, "CẤM hiện tài liệu STAFF_ONLY!"
            assert "Session Recording" not in dd_txt, "CẤM hiện video buổi học cũ!"

            row0_sel.locator("input").fill("Anthology G5U1")
            pgv.wait_for_timeout(350)
            pgv.locator(".ant-select-item-option:visible", has_text="Literature Anthology G5U1").first.click()
            pgv.wait_for_timeout(300)
            pgv.locator("[data-testid='input-lesson-material-note-row-0']").fill(NOTE_1)

            # Thêm Dòng #2: Chọn Practice Book G5U1 + nhập vị trí trang
            pgv.locator("[data-testid='btn-add-lesson-material-row']").click()
            pgv.wait_for_selector("[data-testid='select-lesson-material-row-1']", timeout=6000)
            row1_sel = pgv.locator("[data-testid='select-lesson-material-row-1']")
            row1_sel.scroll_into_view_if_needed()
            row1_sel.click()
            pgv.wait_for_timeout(350)
            row1_sel.locator("input").fill("Practice Book G5U1")
            pgv.wait_for_timeout(350)
            pgv.locator(".ant-select-item-option:visible", has_text="Practice Book G5U1").first.click()
            pgv.wait_for_timeout(300)
            pgv.locator("[data-testid='input-lesson-material-note-row-1']").fill(NOTE_2)
            pgv.wait_for_timeout(300)

            shot_modal = os.path.join(ARTIFACT_DIR, "qc_lesson_plan_autocomplete_modal.png")
            pgv.screenshot(path=shot_modal)
            print(f"   ✅ [PASS] Đã tạo 2 dòng tài liệu riêng biệt kèm 2 ô ghi chú trang/vị trí ({shot_modal})")

            # Lưu Giáo Án
            pgv.locator("[data-testid='btn-save-lesson-plan']").click()
            pgv.wait_for_timeout(2000)

            # ==============================================================
            # 2. F5 RELOAD — XÁC NHẬN HIỂN THỊ TÀI LIỆU + TRANG/VỊ TRÍ TRÊN CLASSROOM
            # ==============================================================
            print("\n🔄 [2/3] F5 RELOAD — XÁC NHẬN PERSISTENCE TÀI LIỆU & GHI CHÚ TRANG TRÊN CLASSROOM")
            pgv.reload(wait_until="domcontentloaded")
            pgv.wait_for_selector("[data-testid='tab-curriculum']", timeout=18000)
            pgv.locator("[data-testid='tab-curriculum']").click()
            pgv.wait_for_selector(f"[data-testid='session-pill-{created_session_index}']", timeout=15000)
            pgv.locator(f"[data-testid='session-pill-{created_session_index}']").click()
            pgv.wait_for_selector("[data-testid='lesson-plan-attached-materials']", timeout=10000)
            pgv.wait_for_timeout(500)

            saved_txt = pgv.locator("[data-testid='lesson-plan-attached-materials']").inner_text()
            assert "Literature Anthology G5U1" in saved_txt and NOTE_1 in saved_txt
            assert "Practice Book G5U1" in saved_txt and NOTE_2 in saved_txt

            pgv.locator("[data-testid='active-session-plan-card']").scroll_into_view_if_needed()
            shot_saved = os.path.join(ARTIFACT_DIR, "qc_lesson_plan_attached_saved.png")
            pgv.screenshot(path=shot_saved)
            print(f"   ✅ [PASS] Sau F5 Classroom hiển thị đủ 2 tài liệu kèm đúng trang/vị trí ({shot_saved})")

            # Kiểm tra bấm nút Xem trước (Preview) trực tiếp ngay tại Classroom
            pgv.locator("[data-testid^='btn-classroom-preview-btn-']").first.click()
            pgv.wait_for_selector("[data-testid='material-preview-modal-title']", timeout=10000)
            pgv.wait_for_selector("[data-testid='preview-page-location-banner']", timeout=10000)
            pgv.wait_for_timeout(700)
            banner_txt = pgv.locator("[data-testid='preview-page-location-banner']").inner_text()
            assert NOTE_1 in banner_txt, f"Banner Preview phải hiện vị trí dặn xem '{NOTE_1}', thực tế: {banner_txt}"
            shot_preview_cls = os.path.join(ARTIFACT_DIR, "qc_lesson_plan_preview_modal.png")
            pgv.screenshot(path=shot_preview_cls)
            pgv.locator("[data-testid='btn-preview-close']").click()
            pgv.wait_for_timeout(300)
            print(f"   ✅ [PASS] Bấm Xem Trước trên Classroom mở MaterialPreviewModal + banner vị trí trang ({shot_preview_cls})")
            ctx_gv.close()

            # ==============================================================
            # 3. HỌC VIÊN HV253 — THẤY ĐỦ TÀI LIỆU + TRANG/VỊ TRÍ TRÊN DASHBOARD & BOOK READER
            # ==============================================================
            print("\n🎓 [3/3] HỌC VIÊN (HV253) — XÁC NHẬN DASHBOARD & BOOK READER + MOBILE ZERO OVERFLOW")
            ctx_hv = browser.new_context(viewport={"width": 1280, "height": 820})
            ctx_hv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            phv = ctx_hv.new_page()
            phv.on("pageerror", lambda err: page_errors.append(f"HV253: {err}"))

            phv.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            phv.wait_for_selector("[data-testid='lesson-overview-attached-materials']", timeout=18000)
            phv.wait_for_timeout(800)

            ov_txt = phv.locator("[data-testid='lesson-overview-attached-materials']").inner_text()
            assert "Literature Anthology G5U1" in ov_txt and NOTE_1 in ov_txt
            assert "Practice Book G5U1" in ov_txt and NOTE_2 in ov_txt
            print("   ✅ [PASS] Dashboard Học viên HV253 hiện rõ tên tài liệu + trang/vị trí cần xem")

            phv.locator("[data-testid='lesson-overview-compact-trigger']").click()
            phv.wait_for_selector("[data-testid='reader-attached-materials-section']", timeout=12000)
            phv.wait_for_timeout(500)
            reader_txt = phv.locator("[data-testid='reader-attached-materials-section']").inner_text()
            assert "Literature Anthology G5U1" in reader_txt and NOTE_1 in reader_txt
            assert "Practice Book G5U1" in reader_txt and NOTE_2 in reader_txt

            phv.locator("[data-testid='reader-attached-materials-section']").scroll_into_view_if_needed()
            shot_reader = os.path.join(ARTIFACT_DIR, "qc_lesson_plan_reader_materials.png")
            phv.screenshot(path=shot_reader)
            print(f"   ✅ [PASS] Book Reader Học viên hiển thị thẻ tài liệu + dòng nhắc `📍 Xem tại vị trí` ({shot_reader})")

            # Bấm Xem Trước Tài Liệu từ bên trong Book Reader (nổi trên Book Reader zIndex=1250)
            phv.locator("[data-testid^='btn-reader-preview-material-']").first.click()
            phv.wait_for_selector("[data-testid='material-preview-modal-title']", timeout=10000)
            phv.wait_for_selector("[data-testid='preview-page-location-banner']", timeout=10000)
            phv.wait_for_timeout(700)
            shot_reader_preview = os.path.join(ARTIFACT_DIR, "qc_lesson_plan_reader_preview_modal.png")
            phv.screenshot(path=shot_reader_preview)
            phv.locator("[data-testid='btn-preview-close']").click()
            phv.wait_for_timeout(300)
            # Xác nhận sau khi đóng Preview Modal, Book Reader vẫn còn mở
            assert phv.locator("[data-testid='reader-attached-materials-section']").is_visible()
            print(f"   ✅ [PASS] Mở & đóng Preview Modal ngay trong Book Reader thành công ({shot_reader_preview})")

            assert not phv.evaluate("() => document.documentElement.scrollWidth > window.innerWidth + 1")
            ctx_hv.close()

            assert len(page_errors) == 0, f"Phát hiện lỗi JS runtime: {page_errors}"
            print("\n🎉 TOÀN BỘ 3/3 BỘ KIỂM THỬ 1 MATERIAL = 1 AUTOCOMPLETE + PAGE LOCATION PASS 100%!")

        finally:
            browser.close()
            teardown_test_lesson_plan(created_session_index)


if __name__ == "__main__":
    run_qc()
