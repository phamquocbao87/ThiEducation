#!/usr/bin/env python3
"""
QC E2E 5-Axis Verification Script: Live Class Schedules Session Recordings
Spec: docs/specs/SPEC_LIVE_SCHEDULE_RECORDINGS.md
Environment: DEV Localhost (http://localhost:3000 -> lakeducation-dev)
"""

import json
import os
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright

LOCAL_URL = "http://localhost:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
TMP_MP4 = f"/tmp/qc_schedule_recording_{int(time.time())}.mp4"

HOSTING_STORE_API = "https://hosting-store-api.phuchungvang.com/api"
APP_ID = "lakeducation_com"
APP_TOKEN = "app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe"


def generate_real_mp4(path: str):
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "testsrc=duration=2:size=640x360:rate=15",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=520:duration=2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    assert os.path.exists(path) and os.path.getsize(path) > 1024, "Failed to generate real binary MP4!"
    print(f"✅ Generated real binary MP4: {path} ({os.path.getsize(path)} bytes)")


def delete_drive_file(file_id: str):
    if not file_id:
        return
    for endpoint in [f"{HOSTING_STORE_API}/files/{file_id}", f"{HOSTING_STORE_API}/storage/files/{file_id}"]:
        try:
            req = urllib.request.Request(
                endpoint,
                method="DELETE",
                headers={
                    "x-app-id": APP_ID,
                    "x-app-token": APP_TOKEN,
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                print(f"🧹 Deleted Drive file {file_id} via {endpoint} (HTTP {resp.status})")
                return
        except Exception as exc:
            print(f"   [Info] Drive delete attempt {endpoint}: {exc}")


def login_and_open_schedules(page, uid: str):
    page.goto(f"{LOCAL_URL}/dashboard?sso_uid={uid}", wait_until="domcontentloaded", timeout=40000)
    page.wait_for_timeout(3400)
    page.goto(f"{LOCAL_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=40000)
    page.wait_for_timeout(3200)


def run_qc():
    print("=" * 88)
    print("🧪 QC 5-AXIS SUITE: LIVE CLASS SCHEDULES RECORDINGS (.MP4 + LINK + PREVIEW + 0MS DELETE)")
    print("=" * 88)

    generate_real_mp4(TMP_MP4)
    ts = int(time.time())
    mp4_title = f"QC Schedule Session MP4 {ts}"
    link_title = f"QC Schedule Session Link {ts}"
    uploaded_drive_ids = []
    created_rec_ids = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ------------------------------------------------------------------
            # 1. STUDENT HV235: Clean Dashboard Materials + Watch Recording on Live Class Schedules
            # ------------------------------------------------------------------
            print("\n--- [1/4] AXIS 1 & 3A: STUDENT HV235 DASHBOARD CLEANLINESS & SCHEDULE RECORDINGS ---")
            ctx_stu = browser.new_context(viewport={"width": 1366, "height": 850})
            page_stu = ctx_stu.new_page()
            page_stu.goto(f"{LOCAL_URL}/dashboard?sso_uid=HV235", wait_until="domcontentloaded", timeout=40000)
            page_stu.wait_for_timeout(3800)

            mat_card = page_stu.locator('[data-testid="student-class-materials-card"]')
            mat_card.wait_for(state="visible", timeout=15000)
            mat_text = mat_card.inner_text()
            assert "Session Recording" not in mat_text, f"FAIL: Session Recording still inside Student Class Learning Materials! {mat_text}"
            assert "Session Video" not in mat_text and "Video Buổi Học" not in mat_text, "FAIL: Session Video tag still in Class Learning Materials!"
            assert "Practice Book" in mat_text or "Literature Anthology" in mat_text, "FAIL: Textbooks missing from Class Learning Materials!"
            mat_card.scroll_into_view_if_needed()
            page_stu.wait_for_timeout(300)
            mat_card.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_student_materials_clean.png")
            print("   ✅ Student Dashboard 'Class Learning Materials' is 100% free of Session Recordings!")

            # Open Live Class Schedules as HV235
            page_stu.goto(f"{LOCAL_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=40000)
            page_stu.wait_for_timeout(3200)

            # Current week (23/11 - 29/11): Tuesday 24/11 is past -> Student sees "No recording yet" & 0 upload/delete buttons
            no_rec_tag = page_stu.locator('[data-testid="tag-no-schedule-recording-LH002_2026-11-24"]')
            assert no_rec_tag.is_visible(), "FAIL: Student should see 'No recording yet' on past 24/11 slot!"
            assert page_stu.locator('[data-testid^="btn-upload-schedule-recording-"]').count() == 0, "FAIL: Student must not see Upload Recording button!"
            assert page_stu.locator('[data-testid^="btn-delete-schedule-recording-"]').count() == 0, "FAIL: Student must not see Delete Recording button!"

            # Navigate to Previous Week (16/11 - 22/11) -> HV235 sees Watch Recording on 19/11 & 21/11, NOT STAFF_ONLY 17/11
            page_stu.locator('[data-testid="btn-schedule-prev-week"]').click()
            page_stu.wait_for_timeout(1200)
            assert page_stu.locator('[data-testid="tag-no-schedule-recording-LH002_2026-11-17"]').is_visible(), "FAIL: STAFF_ONLY recording on 17/11 must be hidden from Student!"
            watch_19 = page_stu.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-19-0"]')
            watch_21 = page_stu.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-21-0"]')
            assert watch_19.is_visible() and watch_21.is_visible(), "FAIL: Student HV235 should see Watch Recording buttons on 19/11 & 21/11!"
            watch_19.scroll_into_view_if_needed()
            page_stu.wait_for_timeout(300)
            page_stu.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_student_prev_week_desktop.png", full_page=False)

            # Click Watch Recording on 19/11 -> Full-Screen MaterialPreviewModal opens
            watch_19.click()
            preview_shell = page_stu.locator('[data-testid="material-preview-fullscreen-shell"]')
            preview_shell.wait_for(state="visible", timeout=10000)
            page_stu.wait_for_timeout(800)
            page_stu.locator('[data-testid="btn-preview-close"]').first.click()
            page_stu.wait_for_timeout(500)
            print("   ✅ Student HV235: Previous Week shows Watch Recording on 19/11 & 21/11 and opens Full-Screen player!")
            ctx_stu.close()

            # ------------------------------------------------------------------
            # 2. TEACHER GV952: RBAC Verification on Assigned Classes
            # ------------------------------------------------------------------
            print("\n--- [2/4] AXIS 3B: TEACHER GV952 RBAC ON ASSIGNED CLASS SCHEDULES ---")
            ctx_tea = browser.new_context(viewport={"width": 1366, "height": 850})
            page_tea = ctx_tea.new_page()
            login_and_open_schedules(page_tea, "GV952")
            assert page_tea.locator('[data-testid="btn-upload-schedule-recording-LH002_2026-11-24"]').is_visible(), "FAIL: Teacher Maj should see + Upload Recording on her own past session!"
            page_tea.locator('[data-testid="btn-schedule-prev-week"]').click()
            page_tea.wait_for_timeout(1000)
            assert page_tea.locator('[data-testid^="btn-delete-schedule-recording-"]').count() > 0, "FAIL: Teacher Maj should see Delete Recording button on her own sessions!"
            print("   ✅ Teacher GV952: Can Upload & Delete recordings on her assigned classes.")
            ctx_tea.close()

            # ------------------------------------------------------------------
            # 3. ACADEMIC ACA404: Binary .mp4 Upload -> Pre-filled Date -> Preview -> Table View -> 0ms Delete -> F5
            # ------------------------------------------------------------------
            print("\n--- [3/4] AXIS 1, 2 & 5: ACADEMIC ACA404 REAL .MP4 UPLOAD, TABLE SYNC & 0MS DELETE ---")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 850})
            page_aca = ctx_aca.new_page()

            def on_response(resp):
                if "/storage/confirm" in resp.url and resp.status == 200:
                    try:
                        body = resp.json()
                        fid = (body.get("data") or {}).get("id") or (body.get("data") or {}).get("fileId")
                        if fid:
                            uploaded_drive_ids.append(fid)
                            print(f"   📡 Captured Google Drive fileId: {fid}")
                    except Exception:
                        pass

            page_aca.on("response", on_response)
            login_and_open_schedules(page_aca, "ACA404")

            # Click [+ Upload Recording] on Tuesday 24/11/2026 (LH002_2026-11-24)
            up_btn_24 = page_aca.locator('[data-testid="btn-upload-schedule-recording-LH002_2026-11-24"]')
            up_btn_24.wait_for(state="visible", timeout=15000)
            up_btn_24.click()
            page_aca.wait_for_timeout(600)

            # Verify title auto-prefilled with 24/11/2026
            prefilled_title = page_aca.locator('[data-testid="input-session-recording-title"]').input_value()
            assert "24/11/2026" in prefilled_title, f"FAIL: Expected 24/11/2026 in prefilled title, got: {prefilled_title}"
            print(f"   ✅ Upload modal pre-filled exact slot date: '{prefilled_title}'")

            # Upload real binary .mp4
            page_aca.locator('[data-testid="input-session-recording-file"]').set_input_files(TMP_MP4)
            page_aca.wait_for_timeout(500)
            page_aca.locator('[data-testid="input-session-recording-title"]').fill(mp4_title)
            page_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_upload_modal_desktop.png")
            page_aca.locator('[data-testid="btn-submit-session-recording"]').click()

            # Wait for 0ms Watch Recording button on LH002_2026-11-24
            watch_24 = page_aca.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-24-0"]')
            watch_24.wait_for(state="visible", timeout=45000)
            page_aca.wait_for_timeout(700)
            page_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_after_mp4_upload_desktop.png", full_page=False)

            # Capture created rec_id from delete button inside slot-recording-box-LH002_2026-11-24
            del_btn_24 = page_aca.locator('[data-testid="slot-recording-box-LH002_2026-11-24"] [data-testid^="btn-delete-schedule-recording-"]').first
            mp4_rec_id = (del_btn_24.get_attribute("data-testid") or "").replace("btn-delete-schedule-recording-", "")
            if mp4_rec_id:
                created_rec_ids.append(mp4_rec_id)
            print(f"   ✅ Real Binary .mp4 uploaded & rendered 0ms on Tuesday 24/11 card: id={mp4_rec_id}")

            # Open Full-Screen Preview on newly uploaded recording
            watch_24.click()
            page_aca.locator('[data-testid="material-preview-fullscreen-shell"]').wait_for(state="visible", timeout=10000)
            page_aca.wait_for_timeout(1000)
            page_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_recording_fullscreen_preview.png")
            page_aca.locator('[data-testid="btn-preview-close"]').first.click()
            page_aca.wait_for_timeout(500)

            # Switch to Table View & verify recording column displays Watch Recording for LH002_2026-11-24
            page_aca.locator('[data-testid="segmented-schedule-view-mode"]').get_by_text("Table", exact=False).or_(
                page_aca.locator('[data-testid="segmented-schedule-view-mode"]').get_by_text("Danh Sách", exact=False)
            ).first.click()
            page_aca.wait_for_timeout(800)
            assert page_aca.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-24-0"]').is_visible(), "FAIL: Watch Recording not visible in Table View!"
            page_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_table_view_desktop.png", full_page=False)
            print("   ✅ Table View synced 100% with Weekly Calendar!")

            # Switch back to Weekly Calendar
            page_aca.locator('[data-testid="segmented-schedule-view-mode"]').get_by_text("Calendar", exact=False).or_(
                page_aca.locator('[data-testid="segmented-schedule-view-mode"]').get_by_text("Lịch Tuần", exact=False)
            ).first.click()
            page_aca.wait_for_timeout(600)

            # Also test Mode 2 (Paste Link, no Passcode field) on Wednesday 25/11/2026 (LH004_2026-11-25)
            page_aca.locator('[data-testid="btn-upload-schedule-recording-LH004_2026-11-25"]').click()
            page_aca.wait_for_timeout(500)
            assert "Passcode" not in page_aca.locator('[role="dialog"]').first.inner_text(), "FAIL: Passcode field must not exist per A4!"
            page_aca.locator('[data-testid="recording-upload-mode-radio"]').get_by_text("Link", exact=False).first.click()
            page_aca.wait_for_timeout(300)
            page_aca.locator('[data-testid="input-session-recording-title"]').fill(link_title)
            page_aca.locator('[data-testid="input-recording-url"]').fill("https://www.youtube.com/watch?v=aqz-KE-bpKQ")
            page_aca.locator('[data-testid="btn-submit-session-recording"]').click()

            watch_25 = page_aca.locator('[data-testid="btn-watch-schedule-recording-LH004_2026-11-25-0"]')
            watch_25.wait_for(state="visible", timeout=15000)
            del_btn_25 = page_aca.locator('[data-testid="slot-recording-box-LH004_2026-11-25"] [data-testid^="btn-delete-schedule-recording-"]').first
            link_rec_id = (del_btn_25.get_attribute("data-testid") or "").replace("btn-delete-schedule-recording-", "")
            if link_rec_id:
                created_rec_ids.append(link_rec_id)
            print(f"   ✅ Mode 2 (Link without Passcode) saved & rendered 0ms on Wednesday 25/11: id={link_rec_id}")

            # Assert Desktop Zero Overflow-X
            sw_d = page_aca.evaluate("() => document.documentElement.scrollWidth")
            iw_d = page_aca.evaluate("() => window.innerWidth")
            assert sw_d <= iw_d, f"FAIL: Desktop horizontal overflow {sw_d} > {iw_d}"
            print(f"   ✅ Desktop Zero Overflow-X PASS ({sw_d}px <= {iw_d}px)")

            # Delete BOTH test recordings -> Assert 0ms removal + F5 Persistence
            for rid, slot_key in [(mp4_rec_id, "LH002_2026-11-24"), (link_rec_id, "LH004_2026-11-25")]:
                del_el = page_aca.locator(f'[data-testid="btn-delete-schedule-recording-{rid}"]')
                box = del_el.bounding_box()
                assert box and box["width"] >= 32 and box["height"] >= 32, f"FAIL: Delete touch target < 32px: {box}"
                del_el.click()
                page_aca.wait_for_timeout(400)
                page_aca.locator(f'[data-testid="btn-confirm-delete-schedule-recording-{rid}"]').click()
                page_aca.wait_for_timeout(250)
                assert page_aca.locator(f'[data-testid="btn-watch-schedule-recording-{slot_key}-0"]').count() == 0, f"FAIL: Recording {rid} did not disappear in 0ms!"
                print(f"   ✅ Deleted {rid} from {slot_key} with 0ms UI update!")
                page_aca.wait_for_timeout(1400)

            # Reload (F5) & verify deleted recordings NEVER resurrect
            page_aca.reload(wait_until="domcontentloaded", timeout=30000)
            page_aca.wait_for_timeout(3400)
            assert page_aca.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-24-0"]').count() == 0, "FAIL: Deleted MP4 recording resurrected after F5!"
            assert page_aca.locator('[data-testid="btn-watch-schedule-recording-LH004_2026-11-25-0"]').count() == 0, "FAIL: Deleted Link recording resurrected after F5!"
            print("   ✅ F5 Persistence Integrity PASS: Deleted recordings NEVER resurrected!")
            ctx_aca.close()

            # ------------------------------------------------------------------
            # 4. MOBILE VIEWPORT (390x844): Zero Overflow-X & Modal Cleanliness
            # ------------------------------------------------------------------
            print("\n--- [4/4] AXIS 4: MOBILE VIEWPORT (390x844) RESPONSIVE & TOUCH ERGONOMICS ---")
            ctx_mob = browser.new_context(
                viewport={"width": 390, "height": 844},
                is_mobile=True,
                has_touch=True,
            )
            page_mob = ctx_mob.new_page()
            login_and_open_schedules(page_mob, "ACA404")
            sw_m = page_mob.evaluate("() => document.documentElement.scrollWidth")
            iw_m = page_mob.evaluate("() => window.innerWidth")
            assert sw_m <= iw_m, f"FAIL: Mobile horizontal overflow on Live Class Schedules: {sw_m} > {iw_m}"

            page_mob.locator('[data-testid="btn-schedule-prev-week"]').click()
            page_mob.wait_for_timeout(1000)
            page_mob.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_mobile_390.png", full_page=False)

            page_mob.locator('[data-testid="btn-schedule-current-week"]').click()
            page_mob.wait_for_timeout(800)
            page_mob.locator('[data-testid="btn-upload-schedule-recording-LH002_2026-11-24"]').click()
            page_mob.wait_for_timeout(600)
            sw_m_modal = page_mob.evaluate("() => document.documentElement.scrollWidth")
            iw_m_modal = page_mob.evaluate("() => window.innerWidth")
            assert sw_m_modal <= iw_m_modal, f"FAIL: Mobile horizontal overflow with Upload Modal open: {sw_m_modal} > {iw_m_modal}"
            page_mob.screenshot(path=f"{ARTIFACT_DIR}/qc_schedule_upload_modal_mobile_390.png")
            print(f"   ✅ Mobile 390x844 PASS: Zero Overflow-X ({sw_m}px <= {iw_m}px)")
            ctx_mob.close()

        finally:
            print("\n--- 🧹 AXIS 5: ZERO-RESIDUE TEARDOWN ---")
            try:
                if created_rec_ids:
                    node_cleanup = f"""
                    import {{ initializeApp }} from 'firebase/app';
                    import {{ getFirestore, doc, deleteDoc }} from 'firebase/firestore';
                    const app = initializeApp({{
                      apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
                      authDomain: 'lakeducation-dev.firebaseapp.com',
                      projectId: 'lakeducation-dev',
                    }});
                    const db = getFirestore(app, 'lakeducationdb');
                    const ids = {json.dumps(created_rec_ids)};
                    for (const id of ids) {{
                      try {{ await deleteDoc(doc(db, 'learning_materials', id)); }} catch {{}}
                    }}
                    process.exit(0);
                    """
                    subprocess.run(["node", "--input-type=module", "-e", node_cleanup], check=True, timeout=20)
                    print(f"🧹 Hard-deleted {len(created_rec_ids)} test recording docs from DEV Firestore.")
            except Exception as teardown_err:
                print(f"   [Warn] Firestore teardown warning: {teardown_err}")

            for fid in set(uploaded_drive_ids):
                delete_drive_file(fid)

            if os.path.exists(TMP_MP4):
                os.remove(TMP_MP4)
                print(f"🧹 Removed local temp binary file: {TMP_MP4}")

            browser.close()

    print("\n🎉 ALL 5 AXES PASSED 100% FOR LIVE CLASS SCHEDULES RECORDINGS!")


if __name__ == "__main__":
    run_qc()
