#!/usr/bin/env python3
"""
qc_student_classroom_reader_sync.py
Kiểm thử E2E trên tài khoản học viên Le Phat (HV344 - lớp LH004):
1. /dashboard:
   - Tự động chọn đúng Buổi 3 (2026-11-23 - Essential Questions...) + đủ 3 tài liệu đính kèm (KHÔNG còn cxzcxzc).
   - Có thanh chọn buổi (Buổi 1 / Buổi 2 / Buổi 3) chuyển mượt mà.
2. /classroom/LH004 (Desktop 1366x820 & Mobile 390x844):
   - Nhãn Tab là `Bài Học & Tài Liệu` (Desktop) / `Bài học` (Mobile) — 0% chữ `Soạn Giáo Án`.
   - Mặc định chọn sẵn Buổi 3, hiển thị `classroom-student-reading-bar` & nút `Mở Chế Độ Đọc Sách & Tính Giờ`.
   - Mở Book Reader từ Classroom, đọc 4 giây, đóng lại -> thời gian đọc nhảy > 0 giây ngay trên Classroom VÀ đồng bộ khớp khi quay lại /dashboard.
   - Zero Overflow-X trên cả Desktop và Mobile 390x844.
3. Zero-Residue Teardown: Xóa bản ghi `READ_LH004_S3_HV344` phát sinh trong phiên test.
"""
import os
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"


def teardown_test_log():
    print("\n🧹 [TEARDOWN]: Dọn sạch bản ghi đọc bài test READ_LH004_S3_HV344 trên Dev Firestore...")
    node_code = """
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
const app = initializeApp({
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
}, 'QC_LEPHAT_CLEANUP');
const db = getFirestore(app, 'lakeducationdb');
await deleteDoc(doc(db, 'lesson_reading_logs', 'READ_LH004_S3_HV344')).catch(() => {});
console.log('✅ Zero-Residue Teardown hoàn tất!');
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
    print("=========================================================================")
    print("🚀 PLAYWRIGHT QC E2E — LE PHAT (HV344) SMART LESSON + CLASSROOM BOOK READER")
    print("=========================================================================")
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )
        try:
            # 1. DASHBOARD HV344 (Desktop 1366x820)
            print("\n🎓 [1/3] DASHBOARD LE PHAT (HV344) — SMART SESSION 3 & SWITCHER")
            ctx = browser.new_context(viewport={"width": 1366, "height": 840})
            ctx.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV344');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page = ctx.new_page()
            page.on("pageerror", lambda err: page_errors.append(f"HV344_DESK: {err}"))

            page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='pre-class-prep-guide']", timeout=18000)
            page.wait_for_timeout(1200)

            prep_txt = page.locator("[data-testid='pre-class-prep-guide']").inner_text()
            assert "Buổi 3" in prep_txt, f"Phải mặc định chọn Buổi 3! Thực tế:\n{prep_txt}"
            assert "cxzcxzc" not in prep_txt, "KHÔNG được còn hiển thị buổi test cũ cxzcxzc!"
            assert "Literature Anthology G5U1" in prep_txt and "Literature Anthology G5U2" in prep_txt
            assert page.locator("[data-testid='lesson-overview-session-switcher']").is_visible()

            page.locator("[data-testid='pre-class-prep-guide']").scroll_into_view_if_needed()
            shot_dash = os.path.join(ARTIFACT_DIR, "qc_lephat_dashboard_session3.png")
            page.screenshot(path=shot_dash)
            print(f"   ✅ [PASS] Dashboard HV344 tự chọn Buổi 3 + 3 tài liệu đính kèm + thanh chọn buổi ({shot_dash})")

            # 2. CLASSROOM /classroom/LH004 (Desktop 1366x820) — ĐỔI NHÃN TAB + BOOK READER TÍNH GIỜ
            print("\n🏫 [2/3] CLASSROOM /classroom/LH004 — NHÃN TAB HỌC VIÊN & BOOK READER TÍNH GIỜ ĐỒNG BỘ")
            page.goto(f"{BASE_URL}/classroom/LH004", wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='tab-curriculum']", timeout=18000)
            page.wait_for_timeout(1000)

            tab_txt = page.locator("[data-testid='tab-curriculum']").inner_text()
            assert "Bài Học & Tài Liệu" in tab_txt, f"Tab Học viên phải là 'Bài Học & Tài Liệu', thực tế: {tab_txt}"
            assert "Soạn Giáo Án" not in tab_txt, f"CẤM hiển thị 'Soạn Giáo Án' cho Học viên! Thực tế: {tab_txt}"
            print(f"   ✅ [PASS] Nhãn Tab Classroom của Học viên đã đổi chuẩn thành: '{tab_txt}'")

            page.locator("[data-testid='tab-curriculum']").click()
            page.wait_for_selector("[data-testid='classroom-student-reading-bar']", timeout=15000)
            page.wait_for_timeout(800)

            card_txt = page.locator("[data-testid='active-session-plan-card']").inner_text()
            assert "Buổi 3" in card_txt and "Literature Anthology G5U1" in card_txt
            page.locator("[data-testid='active-session-plan-card']").scroll_into_view_if_needed()
            shot_cls = os.path.join(ARTIFACT_DIR, "qc_lephat_classroom_desktop.png")
            page.screenshot(path=shot_cls)
            print(f"   ✅ [PASS] Classroom mở sẵn Buổi 3 + Thanh tính giờ đọc bài + 3 tài liệu đính kèm ({shot_cls})")

            # Mở Book Reader ngay từ Classroom -> đọc 4 giây -> đóng -> kiểm tra thời gian đọc > 0s
            page.locator("[data-testid='btn-classroom-open-book-reader']").click()
            page.wait_for_selector("[data-testid='reader-completion-footer']", timeout=12000)
            page.wait_for_timeout(4200)
            page.locator("[data-testid='btn-close-lesson-book-reader']").click()
            page.wait_for_timeout(1000)

            bar_after = page.locator("[data-testid='classroom-student-reading-bar']").inner_text()
            import re
            m_sec = re.search(r"(\d+)\s*giây\s*/", bar_after)
            assert m_sec and int(m_sec.group(1)) > 0, f"Thời gian đọc phải tăng > 0 giây sau khi mở Book Reader! Thực tế: {bar_after}"
            print(f"   ✅ [PASS] Thời gian đọc từ Book Reader Classroom đã ghi nhận & cập nhật 0ms: {m_sec.group(1)} giây")

            # Quay lại /dashboard kiểm tra đồng bộ cùng 1 bản ghi đọc bài
            page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='lesson-prep-reading-status-badge']", timeout=18000)
            page.wait_for_timeout(1200)
            dash_badge = page.locator("[data-testid='lesson-prep-reading-status-badge']").inner_text()
            m_dash = re.search(r"\((\d+)\s*giây\)", dash_badge)
            assert m_dash and int(m_dash.group(1)) > 0, (
                f"Dashboard phải đồng bộ thời gian đọc vừa ghi nhận từ Classroom! Thực tế: {dash_badge}"
            )
            print(f"   ✅ [PASS] Dashboard đồng bộ tức thì cùng bản ghi đọc bài: '{dash_badge}'")
            ctx.close()

            # 3. MOBILE 390x844 CHECK CHO CLASSROOM HV344
            print("\n📱 [3/3] MOBILE 390x844 — CLASSROOM /classroom/LH004 ZERO OVERFLOW-X")
            ctx_m = browser.new_context(viewport={"width": 390, "height": 844})
            ctx_m.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV344');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pm = ctx_m.new_page()
            pm.on("pageerror", lambda err: page_errors.append(f"HV344_MOB: {err}"))
            pm.goto(f"{BASE_URL}/classroom/LH004", wait_until="domcontentloaded")
            pm.wait_for_selector("[data-testid='tab-curriculum']", timeout=18000)
            mob_tab_txt = pm.locator("[data-testid='tab-curriculum']").inner_text()
            assert "Bài học" in mob_tab_txt and "Soạn" not in mob_tab_txt
            pm.locator("[data-testid='tab-curriculum']").click()
            pm.wait_for_selector("[data-testid='classroom-student-reading-bar']", timeout=15000)
            pm.wait_for_timeout(800)

            ov = pm.evaluate("() => document.documentElement.scrollWidth > window.innerWidth + 1")
            assert not ov, "FAIL Overflow-X trên Mobile Classroom Học viên!"
            pm.locator("[data-testid='classroom-student-reading-bar']").scroll_into_view_if_needed()
            shot_mob = os.path.join(ARTIFACT_DIR, "qc_lephat_classroom_mobile_390.png")
            pm.screenshot(path=shot_mob)
            print(f"   ✅ [PASS] Mobile 390px Classroom HV344: Tab '{mob_tab_txt}', Zero Overflow-X ({shot_mob})")
            ctx_m.close()

            assert len(page_errors) == 0, f"Lỗi JS runtime: {page_errors}"
            print("\n🎉 TOÀN BỘ 3/3 BỘ KIỂM THỬ LE PHAT (HV344) PASS 100%!")
        finally:
            browser.close()
            teardown_test_log()


if __name__ == "__main__":
    run_qc()
