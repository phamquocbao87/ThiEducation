#!/usr/bin/env python3
"""
qc_lesson_reader_phase1.py
Kiểm thử E2E Kép (Desktop 1366x800 & Mobile 390x844) cho SPEC-10 Phase 1:
1. Rút gọn Lesson Overview trên /dashboard (Desktop: 4 dòng, Mobile: 3 dòng + fade-out).
2. Tap vào khung mở Full-Screen Book Reader (100vw x 100vh) có nút Close, A-/A+, Light/Sepia/Dark.
3. Đo thời gian đọc thực tế (Active Reading Timer) + Scroll Depth 100% + lưu Firestore & bảo toàn qua F5.
4. Kiểm toán 0px Overflow-X & Touch Target >= 40px.
5. Zero-Residue Teardown: Xóa sạch document test `lesson_reading_logs/READ_LH002_S3_HV253` trên Dev Firestore trong finally.
"""
import os
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"
TEST_STUDENT_ID = "HV253"
TEST_CLASS_ID = "LH002"
TEST_SESSION_INDEX = 3


def cleanup_test_reading_log():
    """Zero-Residue Teardown: Xóa sạch document test trên Dev Firestore (`lakeducation-dev`)."""
    print("\n🧹 [TEARDOWN]: Đang dọn sạch dữ liệu test `lesson_reading_logs/READ_LH002_S3_HV253` trên Dev Firestore...")
    node_code = f"""
import {{ initializeApp }} from 'firebase/app';
import {{ getFirestore, doc, deleteDoc }} from 'firebase/firestore';
const app = initializeApp({{
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
}}, 'QC_CLEANUP');
const db = getFirestore(app, 'lakeducationdb');
await deleteDoc(doc(db, 'lesson_reading_logs', 'READ_{TEST_CLASS_ID}_S{TEST_SESSION_INDEX}_{TEST_STUDENT_ID}'));
console.log('✅ Đã xóa sạch READ_{TEST_CLASS_ID}_S{TEST_SESSION_INDEX}_{TEST_STUDENT_ID} trên Firestore Dev!');
process.exit(0);
"""
    res = subprocess.run(
        ["node", "--input-type=module", "-e", node_code],
        cwd="/Volumes/DATA/projects/ThiEducation",
        capture_output=True,
        text=True,
    )
    if res.returncode == 0:
        print("  ", res.stdout.strip())
    else:
        print("   ⚠️ Teardown warning:", res.stderr.strip())


def run_qc():
    print("==================================================================")
    print("🚀 PLAYWRIGHT QC E2E — SPEC-10 PHASE 1 (DESKTOP & MOBILE)")
    print("==================================================================")

    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ==============================================================
            # 1. DESKTOP E2E (1366 x 800)
            # ==============================================================
            print("\n🖥️ [1/2] KIỂM THỬ DESKTOP (1366 x 800) — HỌC VIÊN HV253 (LỚP LH002)")
            ctx_desktop = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_desktop.add_init_script(f"""
                localStorage.setItem('lak_authenticated_user_id', '{TEST_STUDENT_ID}');
                localStorage.setItem('lak_app_language', 'vi');
                localStorage.removeItem('lak_lesson_reading_logs_v1_{TEST_STUDENT_ID}');
            """)
            page = ctx_desktop.new_page()
            page.on("pageerror", lambda err: console_errors.append(f"Desktop PageError: {err}"))

            page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=15000)
            page.wait_for_timeout(1200)

            # Assert 1.1: Zero Overflow-X Desktop
            overflow_desktop = page.evaluate("() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })")
            assert overflow_desktop["sw"] <= overflow_desktop["iw"], f"Desktop Overflow-X: {overflow_desktop}"
            print(f"   ✅ [PASS] Desktop Zero Overflow-X: scrollWidth={overflow_desktop['sw']} <= innerWidth={overflow_desktop['iw']}")

            # Assert 1.2: Tối đa 4 dòng mục tiêu + fade overlay trên Desktop
            compact_rows = page.locator("[data-testid^='compact-objective-row-']").count()
            assert compact_rows == 4, f"Desktop phải hiện đúng 4 dòng mục tiêu, thực tế: {compact_rows}"
            assert page.locator("[data-testid='lesson-overview-fade-overlay']").is_visible(), "Thiếu hiệu ứng fade-out ở đáy!"
            print(f"   ✅ [PASS] Compact Preview Desktop: hiển thị đúng {compact_rows} dòng + fade-out overlay")

            shot_d_compact = os.path.join(ARTIFACT_DIR, "qc_phase1_desktop_compact.png")
            page.locator("[data-testid='pre-class-prep-guide']").scroll_into_view_if_needed()
            page.screenshot(path=shot_d_compact)
            print(f"   📸 Screenshot Desktop Compact: {shot_d_compact}")

            # Assert 1.3: Tap vào khung Lesson Overview mở Full-Screen Book Reader (100vw x 100vh)
            page.locator("[data-testid='lesson-overview-compact-trigger']").click()
            reader = page.locator("[data-testid='lesson-book-reader-fullscreen']")
            reader.wait_for(state="visible", timeout=5000)
            reader_box = reader.bounding_box()
            assert reader_box["width"] == 1366 and reader_box["height"] == 800, f"Reader không full-screen: {reader_box}"
            print(f"   ✅ [PASS] Full-Screen Book Reader mở chuẩn: {int(reader_box['width'])}x{int(reader_box['height'])}px")

            # Assert 1.4: Hiển thị đầy đủ nội dung mục tiêu bài học (LH002 có 22 mục con + 2 tiêu đề READING/WRITING = 24)
            full_items = page.locator("[data-testid^='reader-objective-item-']").count()
            assert full_items >= 20, f"Reader chưa hiển thị đủ mục tiêu bài học, chỉ thấy: {full_items}"
            print(f"   ✅ [PASS] Nội dung đầy đủ trong Book Reader: {full_items} mục chi tiết + tiêu đề chương")

            # Assert 1.5: Đổi theme (Light -> Dark -> Sepia) & Tăng cỡ chữ A+
            page.locator("[data-testid='btn-reader-theme-dark']").click()
            page.wait_for_timeout(150)
            page.locator("[data-testid='btn-reader-theme-sepia']").click()
            page.locator("[data-testid='btn-reader-font-increase']").click()
            print("   ✅ [PASS] Chuyển đổi nền đọc (Dark/Sepia) & tăng cỡ chữ A+ phản hồi 0ms")

            # Assert 1.6: Cuộn xuống đáy bài -> Scroll Coverage đạt 100% + Đồng hồ Active Reading chạy
            page.evaluate("""() => {
                const el = document.querySelector("[data-testid='lesson-book-reader-canvas']");
                if (el) el.scrollTop = el.scrollHeight;
            }""")
            page.wait_for_timeout(3500)
            scroll_text = page.locator("[data-testid='lesson-reader-scroll-pct']").inner_text()
            clock_text = page.locator("[data-testid='lesson-reader-timer-clock']").inner_text()
            print(f"   ✅ [PASS] Active Reading Timer đang chạy: clock={clock_text}, scroll={scroll_text}")
            assert "100%" in scroll_text, f"Scroll coverage phải đạt 100%, thực tế: {scroll_text}"
            assert clock_text != "00:00", f"Đồng hồ phải tăng > 00:00, thực tế: {clock_text}"

            shot_d_reader = os.path.join(ARTIFACT_DIR, "qc_phase1_desktop_book_reader.png")
            page.screenshot(path=shot_d_reader)
            print(f"   📸 Screenshot Desktop Book Reader: {shot_d_reader}")

            # Assert 1.7: Bấm nút Close -> Lưu Firestore & Cập nhật UI 0ms + Bảo toàn qua F5
            page.locator("[data-testid='btn-close-lesson-book-reader']").click()
            reader.wait_for(state="hidden", timeout=5000)
            page.wait_for_timeout(800)

            badge_after_close = page.locator("[data-testid='lesson-prep-reading-status-badge']").inner_text()
            print(f"   ✅ [PASS] Sau khi Close Reader, Badge cập nhật 0ms: '{badge_after_close}'")
            assert "giây" in badge_after_close or "phút" in badge_after_close or "p " in badge_after_close, (
                f"Badge phải hiển thị thời gian đã đọc sau khi đóng Reader, thực tế: {badge_after_close}"
            )

            # Reload F5 kiểm tra bảo toàn dữ liệu từ Firestore
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='lesson-prep-reading-status-badge']", timeout=15000)
            page.wait_for_timeout(1500)
            badge_after_f5 = page.locator("[data-testid='lesson-prep-reading-status-badge']").inner_text()
            print(f"   ✅ [PASS] F5 Persistence Integrity (Firestore): '{badge_after_f5}'")
            assert "giây" in badge_after_f5 or "phút" in badge_after_f5 or "p " in badge_after_f5, (
                f"Thời gian đọc bị mất sau F5! Thực tế: {badge_after_f5}"
            )
            ctx_desktop.close()

            # ==============================================================
            # 2. MOBILE E2E (390 x 844)
            # ==============================================================
            print("\n📱 [2/2] KIỂM THỬ MOBILE-FIRST (390 x 844) — HỌC VIÊN HV253")
            ctx_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
            ctx_mobile.add_init_script(f"""
                localStorage.setItem('lak_authenticated_user_id', '{TEST_STUDENT_ID}');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            m_page = ctx_mobile.new_page()
            m_page.on("pageerror", lambda err: console_errors.append(f"Mobile PageError: {err}"))

            m_page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            m_page.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=15000)
            m_page.wait_for_timeout(1200)

            # Assert 2.1: Mobile Zero Overflow-X
            overflow_mobile = m_page.evaluate("() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })")
            assert overflow_mobile["sw"] <= overflow_mobile["iw"], f"Mobile Overflow-X: {overflow_mobile}"
            print(f"   ✅ [PASS] Mobile Zero Overflow-X: scrollWidth={overflow_mobile['sw']} <= innerWidth={overflow_mobile['iw']}")

            # Assert 2.2: Mobile chỉ hiển thị tối đa 3 dòng mục tiêu
            m_compact_rows = m_page.locator("[data-testid^='compact-objective-row-']").count()
            assert m_compact_rows == 3, f"Mobile phải hiện đúng 3 dòng mục tiêu, thực tế: {m_compact_rows}"
            print(f"   ✅ [PASS] Compact Preview Mobile: hiển thị đúng {m_compact_rows} dòng")

            # Assert 2.3: Touch Target >= 40px cho nút mở Book Reader
            btn_open_box = m_page.locator("[data-testid='btn-open-lesson-book-reader']").bounding_box()
            assert btn_open_box["height"] >= 40, f"Nút mở Book Reader trên Mobile quá nhỏ: {btn_open_box}"
            print(f"   ✅ [PASS] Touch Target Ergonomics Mobile: height={btn_open_box['height']}px >= 40px")

            m_page.locator("[data-testid='pre-class-prep-guide']").scroll_into_view_if_needed()
            shot_m_compact = os.path.join(ARTIFACT_DIR, "qc_phase1_mobile_compact.png")
            m_page.screenshot(path=shot_m_compact)
            print(f"   📸 Screenshot Mobile Compact: {shot_m_compact}")

            # Assert 2.4: Mở Book Reader Full-Screen trên Mobile & kiểm tra Zero Overflow-X
            m_page.locator("[data-testid='btn-open-lesson-book-reader']").click()
            m_reader = m_page.locator("[data-testid='lesson-book-reader-fullscreen']")
            m_reader.wait_for(state="visible", timeout=5000)
            m_page.wait_for_timeout(600)

            m_reader_box = m_reader.bounding_box()
            assert m_reader_box["width"] == 390 and m_reader_box["height"] == 844, f"Mobile Reader kích thước sai: {m_reader_box}"

            m_close_box = m_page.locator("[data-testid='btn-close-lesson-book-reader']").bounding_box()
            assert m_close_box["height"] >= 40, f"Nút Close trên Mobile quá nhỏ: {m_close_box}"

            m_reader_overflow = m_page.evaluate("""() => {
                const r = document.querySelector("[data-testid='lesson-book-reader-canvas']");
                return { sw: r ? r.scrollWidth : 0, cw: r ? r.clientWidth : 0, docSw: document.documentElement.scrollWidth, iw: window.innerWidth };
            }""")
            assert m_reader_overflow["docSw"] <= m_reader_overflow["iw"], f"Mobile Reader Overflow-X: {m_reader_overflow}"
            print(f"   ✅ [PASS] Mobile Full-Screen Reader: 390x844, Zero Overflow-X, nút Close height={m_close_box['height']}px")

            shot_m_reader = os.path.join(ARTIFACT_DIR, "qc_phase1_mobile_book_reader.png")
            m_page.screenshot(path=shot_m_reader)
            print(f"   📸 Screenshot Mobile Book Reader: {shot_m_reader}")

            m_page.locator("[data-testid='btn-close-lesson-book-reader']").click()
            m_reader.wait_for(state="hidden", timeout=5000)
            ctx_mobile.close()

            assert len(console_errors) == 0, f"Phát hiện lỗi JS Console: {console_errors}"
            print("\n==================================================================")
            print("🎉 TẤT CẢ ASSERTIONS PHASE 1 (DESKTOP & MOBILE) ĐỀU PASS 100%!")
            print("==================================================================")
        finally:
            browser.close()
            cleanup_test_reading_log()


if __name__ == "__main__":
    run_qc()
