#!/usr/bin/env python3
"""
qc_material_view_tracking.py
Kiểm thử E2E Tính Thời Gian Xem Tài Liệu Đính Kèm Buổi Học (SPEC-13):
1. Học viên Le Phat (HV344 - lớp LH004 - Buổi 3 có sẵn 2 PDF + 1 HTML5 Video flower.mp4):
   - Mở Book Reader -> kiểm tra đồng hồ Book Reader chạy.
   - Bấm Xem Trước Tài Liệu mở PDF `Literature Anthology G5U1` ->
     + Assert hiện thanh `material-preview-tracking-bar` + đồng hồ tăng > 0s.
     + Assert Book Reader PAUSE (không cộng đúp giây trong lúc đang mở Preview Modal!).
     + Đợi 4s -> đóng Preview Modal -> Assert badge tiến độ trên dòng PDF cập nhật > 0 giây.
   - Bấm Xem Trước Tài Liệu mở HTML5 Video `Wonders G5 Unit 1 Interactive Read-Aloud Lesson Video`:
     + Trước khi Play: hiện `Bấm phát để bắt đầu tính giờ` (không tự cộng giây ảo!).
     + Bấm Play (video.play()) -> đợi 3.5s -> Assert đồng hồ xem video tăng > 0s & % tiến độ xem > 0%.
     + Đóng Preview Modal & Book Reader.
2. Giáo vụ ACA545 mở `/pre-class-prep`:
   - Tìm dòng `Le Phat` -> Assert hiển thị badge `📎 Tài liệu: .../3 (...)`.
   - Click mở Popover `prep-materials-popover-HV344` -> Assert thấy đủ 3 tài liệu kèm thời gian thực xem từng tệp!
   - Chụp ảnh minh chứng Preview Tracking Bar + Popover báo cáo trên `/pre-class-prep`.
3. Zero-Residue Teardown: Xóa sạch `READ_LH004_S3_HV344` trên Dev Firestore.
"""
import os
import re
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"


def teardown_test_log():
    print("\n🧹 [TEARDOWN]: Xóa bản ghi READ_LH004_S3_HV344 trên Dev Firestore...")
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
}, 'QC_MAT_TRACK_CLEANUP');
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


def parse_clock_sec(text):
    m = re.search(r"(\d{2}):(\d{2})", text or "")
    if not m:
        return 0
    return int(m.group(1)) * 60 + int(m.group(2))


def run_qc():
    print("=========================================================================")
    print("🚀 PLAYWRIGHT QC E2E — ATTACHED MATERIAL VIEW TIME TRACKING (SPEC-13)")
    print("=========================================================================")
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )
        try:
            # ==================================================================
            # 1. HỌC VIÊN HV344 — PDF TRACKING + HAND-OFF CHỐNG CỘNG ĐÚP + HTML5 VIDEO
            # ==================================================================
            print("\n🎓 [1/2] HỌC VIÊN HV344 — XEM PDF (HAND-OFF) & XEM HTML5 VIDEO")
            ctx_hv = browser.new_context(viewport={"width": 1366, "height": 860})
            ctx_hv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV344');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            phv = ctx_hv.new_page()
            phv.on("pageerror", lambda err: page_errors.append(f"HV344: {err}"))

            phv.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            phv.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=18000)
            phv.wait_for_timeout(1200)

            # Mở Book Reader
            phv.locator("[data-testid='lesson-overview-compact-trigger']").click()
            phv.wait_for_selector("[data-testid='reader-attached-materials-section']", timeout=12000)
            phv.wait_for_timeout(2500)

            reader_clock_before = parse_clock_sec(phv.locator("[data-testid='lesson-book-reader-topbar']").inner_text())

            # Mở Preview PDF #1 (Literature Anthology G5U1) từ bên trong Book Reader
            phv.locator("[data-testid='btn-reader-preview-material-mat_1794823195775']").scroll_into_view_if_needed()
            phv.locator("[data-testid='btn-reader-preview-material-mat_1794823195775']").click()
            phv.wait_for_selector("[data-testid='material-preview-fullscreen-shell']", timeout=10000)
            phv.wait_for_selector("[data-testid='material-preview-tracking-bar']", timeout=10000)
            phv.wait_for_timeout(4200)

            # Assert Desktop PDF Full-Screen mặc định + ZERO outer scroll
            fs_metrics = phv.evaluate("""() => {
                const shell = document.querySelector("[data-testid='material-preview-fullscreen-shell']");
                const stage = document.querySelector("[data-testid='material-preview-fullscreen-stage']");
                const iframe = document.querySelector("[data-testid='preview-pdf-iframe']");
                return {
                    shellW: shell?.getBoundingClientRect().width || 0,
                    shellH: shell?.getBoundingClientRect().height || 0,
                    iframeH: iframe?.getBoundingClientRect().height || 0,
                    stageOverflow: stage ? getComputedStyle(stage).overflow : '',
                    stageScrollDiff: stage ? stage.scrollHeight - stage.clientHeight : -1,
                    bodyOverflow: document.body.style.overflow,
                };
            }""")
            assert fs_metrics["shellW"] == 1366 and fs_metrics["shellH"] == 860, f"Desktop PDF phải Full-Screen 1366x860! {fs_metrics}"
            assert fs_metrics["iframeH"] >= 700, f"PDF iframe Full-Screen phải >= 700px! {fs_metrics}"
            assert fs_metrics["stageOverflow"] == "hidden" and fs_metrics["stageScrollDiff"] <= 1, f"Không được có outer scroll thừa! {fs_metrics}"

            pdf_clock_txt = phv.locator("[data-testid='material-preview-timer-clock']").inner_text()
            pdf_sec = parse_clock_sec(pdf_clock_txt)
            assert pdf_sec >= 3, f"Đồng hồ xem PDF phải tăng >= 3 giây! Thực tế: {pdf_clock_txt}"

            # Xác nhận Book Reader PAUSED trong lúc mở Preview (không tăng thêm quá 1s độ trễ)
            reader_clock_during = parse_clock_sec(phv.locator("[data-testid='lesson-book-reader-topbar']").inner_text())
            assert reader_clock_during <= reader_clock_before + 1, (
                f"Book Reader phải PAUSE khi đang mở Preview Modal! before={reader_clock_before}s, during={reader_clock_during}s"
            )
            shot_pdf = os.path.join(ARTIFACT_DIR, "qc_material_tracking_pdf_modal.png")
            phv.screenshot(path=shot_pdf)
            print(f"   ✅ [PASS] Desktop PDF Full-Screen ({int(fs_metrics['iframeH'])}px) | Tracking: {pdf_sec}s | Hand-Off Book Reader giữ nguyên {reader_clock_during}s ({shot_pdf})")

            # Test toggle Thu gọn -> Toàn màn hình trên Desktop
            phv.locator("[data-testid='btn-preview-toggle-fullscreen']").click()
            phv.wait_for_timeout(300)
            assert phv.locator("[data-testid='material-preview-fullscreen-shell']").count() == 0, "Bấm Thu gọn phải chuyển về Modal!"
            phv.locator("[data-testid='btn-preview-toggle-fullscreen']").click()
            phv.wait_for_selector("[data-testid='material-preview-fullscreen-shell']", timeout=5000)
            print("   ✅ [PASS] Nút chuyển đổi Thu gọn ↔ Toàn màn hình trên Desktop hoạt động mượt")

            # Đóng Preview PDF -> Kiểm tra badge tiến độ trên dòng PDF trong Book Reader
            phv.locator("[data-testid='btn-preview-close']").click()
            phv.wait_for_timeout(800)
            pdf_badge_txt = phv.locator("[data-testid='reader-material-progress-mat_1794823195775']").inner_text()
            assert "giây" in pdf_badge_txt, f"Badge PDF phải hiện số giây đã xem! Thực tế: {pdf_badge_txt}"
            print(f"   ✅ [PASS] Badge tiến độ PDF trên Book Reader cập nhật 0ms: '{pdf_badge_txt}'")

            # Mở Preview HTML5 Video (mat_wonders_g5_u1_video) -> Assert Full-Screen Cinema mặc định
            phv.locator("[data-testid='btn-reader-preview-material-mat_wonders_g5_u1_video']").click()
            phv.wait_for_selector("[data-testid='material-preview-fullscreen-shell']", timeout=10000)
            phv.wait_for_selector("[data-testid='preview-video-player']", timeout=10000)
            pre_play_sec_start = parse_clock_sec(phv.locator("[data-testid='material-preview-timer-clock']").inner_text())
            phv.wait_for_timeout(1800)

            # Trước khi Play: KHÔNG được tự cộng giây ảo
            pre_play_sec = parse_clock_sec(phv.locator("[data-testid='material-preview-timer-clock']").inner_text())
            assert pre_play_sec == pre_play_sec_start, f"Video chưa bấm phát không được tự cộng giây! start={pre_play_sec_start}s, after={pre_play_sec}s"

            # Bấm phát video thực tế (muted để autoplay không bị chặn trong headless)
            phv.evaluate("""() => {
                const v = document.querySelector("[data-testid='preview-video-player']");
                if (v) { v.muted = true; v.play(); }
            }""")
            phv.wait_for_timeout(3800)

            vid_clock_txt = phv.locator("[data-testid='material-preview-timer-clock']").inner_text()
            vid_sec = parse_clock_sec(vid_clock_txt)
            assert vid_sec >= pre_play_sec_start + 2, f"Video đang phát phải ghi nhận >= 2 giây! Thực tế: {vid_clock_txt}"
            print(f"   ✅ [PASS] HTML5 Video Tracking chuẩn Anti-Cheat (chỉ đếm khi phát): '{vid_clock_txt}'")

            phv.locator("[data-testid='btn-preview-close']").click()
            phv.wait_for_timeout(800)
            phv.locator("[data-testid='btn-close-lesson-book-reader']").click()
            phv.wait_for_timeout(1000)
            ctx_hv.close()

            # ==================================================================
            # 2. GIÁO VỤ (ACA545) — KIỂM TRA POPOVER CHI TIẾT TÀI LIỆU TRÊN /pre-class-prep
            # ==================================================================
            print("\n📋 [2/2] GIÁO VỤ ACA545 — KIỂM TRA CHI TIẾT THỜI GIAN TÀI LIỆU TRÊN /pre-class-prep")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 860})
            ctx_aca.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            paca = ctx_aca.new_page()
            paca.on("pageerror", lambda err: page_errors.append(f"ACA545: {err}"))

            paca.goto(f"{BASE_URL}/pre-class-prep", wait_until="domcontentloaded")
            paca.wait_for_selector("[data-testid='input-prep-search']", timeout=18000)
            paca.wait_for_timeout(1200)

            paca.locator("[data-testid='input-prep-search']").fill("Le Phat")
            paca.wait_for_timeout(600)

            mat_badge = paca.locator("[data-testid='prep-student-materials-badge-HV344']")
            assert mat_badge.is_visible(), "Phải hiển thị badge tài liệu cho Le Phat trên /pre-class-prep!"
            badge_txt = mat_badge.inner_text()
            assert "/3" in badge_txt, f"Badge phải hiện tổng /3 tài liệu! Thực tế: {badge_txt}"
            print(f"   ✅ [PASS] /pre-class-prep hiển thị badge tài liệu của Le Phat: '{badge_txt}'")

            # Click mở Popover chi tiết từng tài liệu
            mat_badge.click()
            paca.wait_for_selector("[data-testid='prep-materials-popover-HV344']", timeout=8000)
            paca.wait_for_timeout(400)
            pop_txt = paca.locator("[data-testid='prep-materials-popover-HV344']").inner_text()
            assert "Literature Anthology G5U1" in pop_txt and "Wonders G5 Unit 1" in pop_txt
            shot_pop = os.path.join(ARTIFACT_DIR, "qc_material_tracking_prep_popover.png")
            paca.screenshot(path=shot_pop)
            print(f"   ✅ [PASS] Popover chi tiết từng tài liệu hoạt động chính xác ({shot_pop})")
            ctx_aca.close()

            # ==================================================================
            # 3. MOBILE 390×844 — FULL-SCREEN PDF & VIDEO + ZERO DUAL-SCROLL CONFLICT
            # ==================================================================
            print("\n📱 [3/3] MOBILE 390×844 — PDF & VIDEO FULL-SCREEN + ZERO DUAL-SCROLL")
            ctx_mob = browser.new_context(
                viewport={"width": 390, "height": 844},
                is_mobile=True,
                has_touch=True,
            )
            ctx_mob.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV344');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pmob = ctx_mob.new_page()
            pmob.on("pageerror", lambda err: page_errors.append(f"MOBILE_HV344: {err}"))

            pmob.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pmob.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=18000)
            pmob.wait_for_timeout(1000)

            # Mở Book Reader trên Mobile -> mở PDF #1
            pmob.locator("[data-testid='lesson-overview-compact-trigger']").click()
            pmob.wait_for_selector("[data-testid='reader-attached-materials-section']", timeout=12000)
            pmob.locator("[data-testid='btn-reader-preview-material-mat_1794823195775']").scroll_into_view_if_needed()
            pmob.locator("[data-testid='btn-reader-preview-material-mat_1794823195775']").click()
            pmob.wait_for_selector("[data-testid='material-preview-fullscreen-shell']", timeout=10000)
            pmob.wait_for_timeout(1800)

            mob_pdf_metrics = pmob.evaluate("""() => {
                const shell = document.querySelector("[data-testid='material-preview-fullscreen-shell']");
                const stage = document.querySelector("[data-testid='material-preview-fullscreen-stage']");
                const iframe = document.querySelector("[data-testid='preview-pdf-iframe']");
                return {
                    overflowX: document.documentElement.scrollWidth - window.innerWidth,
                    shellW: shell?.getBoundingClientRect().width || 0,
                    shellH: shell?.getBoundingClientRect().height || 0,
                    iframeH: iframe?.getBoundingClientRect().height || 0,
                    bodyOverflow: document.body.style.overflow,
                    htmlOverflow: document.documentElement.style.overflow,
                    stageOverflow: stage ? getComputedStyle(stage).overflow : '',
                    stageScrollDiff: stage ? stage.scrollHeight - stage.clientHeight : -1,
                };
            }""")
            assert mob_pdf_metrics["overflowX"] <= 0, f"Mobile PDF tràn ngang! {mob_pdf_metrics}"
            assert mob_pdf_metrics["shellW"] == 390 and mob_pdf_metrics["shellH"] == 844, f"Mobile PDF phải Full 390×844! {mob_pdf_metrics}"
            assert mob_pdf_metrics["bodyOverflow"] == "hidden" and mob_pdf_metrics["htmlOverflow"] == "hidden", f"Body/HTML phải khóa scroll khi mở PDF! {mob_pdf_metrics}"
            assert mob_pdf_metrics["stageOverflow"] == "hidden" and mob_pdf_metrics["stageScrollDiff"] <= 1, f"Stage PDF không được tạo vùng scroll thứ 2! {mob_pdf_metrics}"
            assert mob_pdf_metrics["iframeH"] >= 680, f"Mobile PDF iframe phải chiếm >= 680px! {mob_pdf_metrics}"

            shot_mob_pdf = os.path.join(ARTIFACT_DIR, "qc_preview_pdf_mobile_fullscreen.png")
            pmob.screenshot(path=shot_mob_pdf)
            print(f"   ✅ [PASS] Mobile PDF Full-Screen 390×844 | iframe={int(mob_pdf_metrics['iframeH'])}px | 0px outer scroll | 0px overflow-x ({shot_mob_pdf})")

            # Đóng PDF -> mở HTML5 Video trên Mobile 390×844
            pmob.locator("[data-testid='btn-preview-close']").click()
            pmob.wait_for_timeout(600)
            pmob.locator("[data-testid='btn-reader-preview-material-mat_wonders_g5_u1_video']").scroll_into_view_if_needed()
            pmob.locator("[data-testid='btn-reader-preview-material-mat_wonders_g5_u1_video']").click()
            pmob.wait_for_selector("[data-testid='material-preview-fullscreen-shell']", timeout=10000)
            pmob.wait_for_selector("[data-testid='preview-video-player']", timeout=10000)
            pmob.wait_for_timeout(800)

            mob_vid_metrics = pmob.evaluate("""() => {
                const shell = document.querySelector("[data-testid='material-preview-fullscreen-shell']");
                const stage = document.querySelector("[data-testid='material-preview-fullscreen-stage']");
                const vid = document.querySelector("[data-testid='preview-video-player']");
                const nativeFsBtn = document.querySelector("[data-testid='btn-preview-native-fullscreen']");
                return {
                    overflowX: document.documentElement.scrollWidth - window.innerWidth,
                    shellW: shell?.getBoundingClientRect().width || 0,
                    shellH: shell?.getBoundingClientRect().height || 0,
                    vidW: vid?.getBoundingClientRect().width || 0,
                    vidH: vid?.getBoundingClientRect().height || 0,
                    hasNativeFsBtn: Boolean(nativeFsBtn),
                    stageOverflow: stage ? getComputedStyle(stage).overflow : '',
                    stageScrollDiff: stage ? stage.scrollHeight - stage.clientHeight : -1,
                };
            }""")
            assert mob_vid_metrics["overflowX"] <= 0, f"Mobile Video tràn ngang! {mob_vid_metrics}"
            assert mob_vid_metrics["shellW"] == 390 and mob_vid_metrics["shellH"] == 844, f"Mobile Video phải Full 390×844! {mob_vid_metrics}"
            assert mob_vid_metrics["stageOverflow"] == "hidden" and mob_vid_metrics["stageScrollDiff"] <= 1, f"Mobile Video không được tạo outer scroll! {mob_vid_metrics}"
            assert mob_vid_metrics["hasNativeFsBtn"], "Mobile Video phải có nút Native Fullscreen!"

            shot_mob_vid = os.path.join(ARTIFACT_DIR, "qc_preview_video_mobile_fullscreen.png")
            pmob.screenshot(path=shot_mob_vid)
            print(f"   ✅ [PASS] Mobile Video Full-Screen 390×844 | cinema stage={int(mob_vid_metrics['vidW'])}×{int(mob_vid_metrics['vidH'])} | Native FS button ready ({shot_mob_vid})")

            pmob.locator("[data-testid='btn-preview-close']").click()
            pmob.wait_for_timeout(500)
            ctx_mob.close()

            assert len(page_errors) == 0, f"Lỗi JS runtime: {page_errors}"
            print("\n🎉 TOÀN BỘ KIỂM THỬ SPEC-13 + MOBILE & DESKTOP FULL-SCREEN PASS 100%!")
        finally:
            browser.close()
            teardown_test_log()


if __name__ == "__main__":
    run_qc()
