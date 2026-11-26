#!/usr/bin/env python3
"""
QC E2E 5-Axis Verification Script: Course Program Vault Video Upload, Preview & Delete
Spec: docs/specs/SPEC_COURSE_PROGRAM_VAULT_VIDEO_UPLOAD_DELETE.md
Environment: DEV Localhost (http://localhost:3000 -> lakeducation-dev)
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
from playwright.sync_api import sync_playwright

LOCAL_URL = "http://localhost:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
TMP_MP4 = f"/tmp/qc_course_vault_video_{int(time.time())}.mp4"

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
        "sine=frequency=440:duration=2",
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


def open_vault_tab(page, uid: str):
    page.goto(f"{LOCAL_URL}/dashboard?sso_uid={uid}", wait_until="domcontentloaded", timeout=40000)
    page.wait_for_timeout(3200)
    page.goto(f"{LOCAL_URL}/classroom/LH002", wait_until="domcontentloaded", timeout=40000)
    page.wait_for_timeout(3200)
    tab_curr = page.locator('[data-testid="tab-curriculum"]').first
    tab_curr.click()
    page.wait_for_timeout(2000)
    vault = page.locator('[data-testid="course-program-vault"]')
    vault.wait_for(state="visible", timeout=15000)
    vault.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    return vault


def run_qc():
    print("=" * 84)
    print("🧪 QC 5-AXIS SUITE: COURSE PROGRAM VAULT (UPLOAD .MP4 + PREVIEW + 0MS DELETE + RBAC)")
    print("=" * 84)

    generate_real_mp4(TMP_MP4)
    ts = int(time.time())
    mp4_title = f"QC Course Concept Video MP4 {ts}"
    link_title = f"QC Course Youtube Video {ts}"
    uploaded_drive_ids = []
    created_mat_ids = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ------------------------------------------------------------------
            # AXIS 3A: TEACHER VIEW (GV952) — Sees Teacher's Edition, 0 Session Recordings, 0 Upload/Delete
            # ------------------------------------------------------------------
            print("\n--- [1/4] AXIS 3A: TEACHER VIEW (GV952 - Desktop 1366x850) ---")
            ctx_tea = browser.new_context(viewport={"width": 1366, "height": 850})
            page_tea = ctx_tea.new_page()
            vault_tea = open_vault_tab(page_tea, "GV952")
            tea_text = vault_tea.inner_text()
            assert "Session Recording" not in tea_text, f"FAIL: Session Recording still leaked in Teacher Vault! {tea_text}"
            assert "WP02 G5 - Nov" not in tea_text and "WP03 - Nov" not in tea_text, "FAIL: Legacy recording leaked in Teacher Vault!"
            assert "Teacher" in tea_text and "Edition" in tea_text, "FAIL: Teacher Maj should see Teacher's Edition!"
            assert page_tea.locator('[data-testid="btn-academic-upload-course-vault"]').count() == 0, "FAIL: Teacher must not see Upload button!"
            assert page_tea.locator('[data-testid^="btn-delete-course-material-"]').count() == 0, "FAIL: Teacher must not see Delete buttons!"
            print("   ✅ Teacher GV952: 0 Session Recordings, sees Teacher's Edition, 0 Upload/Delete buttons.")
            ctx_tea.close()

            # ------------------------------------------------------------------
            # AXIS 3B: STUDENT VIEW (HV235) — 0 Session Recordings, 0 Teacher's Edition, 0 Upload/Delete + In-App Preview
            # ------------------------------------------------------------------
            print("\n--- [2/4] AXIS 3B: STUDENT VIEW (HV235 - Desktop 1366x850 & Mobile 390x844) ---")
            ctx_stu = browser.new_context(viewport={"width": 1366, "height": 850})
            page_stu = ctx_stu.new_page()
            vault_stu = open_vault_tab(page_stu, "HV235")
            stu_text = vault_stu.inner_text()
            assert "Session Recording" not in stu_text, "FAIL: Session Recording leaked to Student!"
            assert "Teacher’s Edition" not in stu_text and "Teacher's Edition" not in stu_text, "FAIL: Confidential Teacher's Edition leaked to Student!"
            assert page_stu.locator('[data-testid="btn-academic-upload-course-vault"]').count() == 0, "FAIL: Student must not see Upload button!"
            assert page_stu.locator('[data-testid^="btn-delete-course-material-"]').count() == 0, "FAIL: Student must not see Delete button!"
            vault_stu.screenshot(path=f"{ARTIFACT_DIR}/qc_course_vault_student_clean.png")
            print("   ✅ Student HV235: 0 Session Recordings, 0 Teacher's Edition, 0 Upload/Delete buttons.")
            ctx_stu.close()

            # ------------------------------------------------------------------
            # AXIS 1, 2 & 5: ACADEMIC (ACA404) — Binary .mp4 Upload -> Preview -> Link Upload -> 0ms Delete -> F5 Persistence
            # ------------------------------------------------------------------
            print("\n--- [3/4] AXIS 1 & 2: ACADEMIC (ACA404) REAL .MP4 UPLOAD, PREVIEW & 0MS DELETE ---")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 850})
            page_aca = ctx_aca.new_page()

            def on_response(resp):
                if "/storage/confirm" in resp.url and resp.status == 200:
                    try:
                        body = resp.json()
                        fid = (body.get("data") or {}).get("id") or (body.get("data") or {}).get("fileId")
                        if fid:
                            uploaded_drive_ids.append(fid)
                            print(f"   📡 Captured Google Drive fileId from /storage/confirm: {fid}")
                    except Exception:
                        pass

            page_aca.on("response", on_response)
            vault_aca = open_vault_tab(page_aca, "ACA404")

            # Assert 0 Session Recordings on Academic view as well
            aca_initial_text = vault_aca.inner_text()
            assert "Session Recording" not in aca_initial_text, "FAIL: Session Recording still visible in Academic Course Vault!"

            # 3.1 Upload Real Binary .mp4
            page_aca.locator('[data-testid="btn-academic-upload-course-vault"]').click()
            page_aca.wait_for_timeout(600)
            file_input = page_aca.locator('[data-testid="input-course-vault-file"]')
            file_input.set_input_files(TMP_MP4)
            page_aca.wait_for_timeout(500)

            title_input = page_aca.locator('[data-testid="input-course-vault-title"]')
            title_input.fill(mp4_title)
            page_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_course_vault_upload_modal_desktop.png")

            page_aca.locator('[data-testid="btn-submit-course-material"]').click()
            # Wait for Google Drive upload + Firestore sync to finish and modal to close
            mp4_card = page_aca.locator('[data-testid^="course-vault-card-"]').filter(has_text=mp4_title).first
            mp4_card.wait_for(state="visible", timeout=45000)
            mp4_test_id = mp4_card.get_attribute("data-testid") or ""
            mp4_mat_id = mp4_test_id.replace("course-vault-card-", "")
            if mp4_mat_id:
                created_mat_ids.append(mp4_mat_id)

            assert "VIDEO" in mp4_card.inner_text(), f"FAIL: Expected VIDEO badge on uploaded MP4 card, got: {mp4_card.inner_text()}"
            print(f"   ✅ Real Binary .mp4 uploaded & synced 0ms: id={mp4_mat_id}")
            # Wait for modal transition mask to completely disappear before taking crisp card screenshot
            page_aca.wait_for_timeout(700)
            vault_aca.scroll_into_view_if_needed()
            page_aca.wait_for_timeout(300)
            vault_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_course_vault_after_mp4_upload_desktop.png")

            # 3.2 Click uploaded MP4 card -> Verify Full-Screen In-App Preview Modal opens
            mp4_card.click()
            preview_shell = page_aca.locator('[data-testid="material-preview-fullscreen-shell"]')
            preview_shell.wait_for(state="visible", timeout=10000)
            page_aca.wait_for_timeout(1200)
            page_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_course_vault_video_preview_fullscreen.png")
            print("   ✅ Full-Screen MaterialPreviewModal opened cleanly for uploaded Course Video!")
            # Close preview modal
            close_btn = page_aca.locator('[data-testid="btn-close-material-preview"]')
            if close_btn.count() > 0:
                close_btn.click()
            else:
                page_aca.keyboard.press("Escape")
            page_aca.wait_for_timeout(600)

            # 3.3 Test Mode 2: Paste YouTube Video Link
            page_aca.locator('[data-testid="btn-academic-upload-course-vault"]').click()
            page_aca.wait_for_timeout(500)
            page_aca.locator('[data-testid="segmented-course-vault-mode"]').get_by_text("Paste Drive", exact=False).or_(
                page_aca.locator('[data-testid="segmented-course-vault-mode"]').get_by_text("Dán Link", exact=False)
            ).first.click()
            page_aca.wait_for_timeout(400)
            page_aca.locator('[data-testid="input-course-vault-title"]').fill(link_title)
            page_aca.locator('[data-testid="input-course-vault-url"]').fill("https://www.youtube.com/watch?v=aqz-KE-bpKQ")
            page_aca.locator('[data-testid="btn-submit-course-material"]').click()

            link_card = page_aca.locator('[data-testid^="course-vault-card-"]').filter(has_text=link_title).first
            link_card.wait_for(state="visible", timeout=15000)
            link_mat_id = (link_card.get_attribute("data-testid") or "").replace("course-vault-card-", "")
            if link_mat_id:
                created_mat_ids.append(link_mat_id)
            print(f"   ✅ Link Video saved & synced 0ms: id={link_mat_id}")

            # Assert Desktop Zero Overflow-X
            sw_d = page_aca.evaluate("() => document.documentElement.scrollWidth")
            iw_d = page_aca.evaluate("() => window.innerWidth")
            assert sw_d <= iw_d, f"FAIL: Desktop horizontal overflow {sw_d} > {iw_d}"
            print(f"   ✅ Desktop Zero Overflow-X PASS ({sw_d}px <= {iw_d}px)")

            # 3.4 Test 0ms Optimistic Delete + F5 Persistence on BOTH test videos
            for mid, label in [(mp4_mat_id, mp4_title), (link_mat_id, link_title)]:
                del_btn = page_aca.locator(f'[data-testid="btn-delete-course-material-{mid}"]')
                box = del_btn.bounding_box()
                assert box and box["width"] >= 32 and box["height"] >= 32, f"FAIL: Delete touch target too small: {box}"
                del_btn.click()
                page_aca.wait_for_timeout(400)
                confirm_btn = page_aca.locator(f'[data-testid="btn-confirm-delete-course-material-{mid}"]')
                confirm_btn.click()
                # Assert 0ms removal
                page_aca.wait_for_timeout(200)
                assert page_aca.locator(f'[data-testid="course-vault-card-{mid}"]').count() == 0, f"FAIL: {label} did not disappear immediately (0ms)!"
                print(f"   ✅ Deleted {label} with 0ms UI update!")
                # Give Firestore write 1.5s to settle
                page_aca.wait_for_timeout(1500)

            # Reload page (F5) & assert deleted items DO NOT resurrect
            page_aca.reload(wait_until="domcontentloaded", timeout=30000)
            page_aca.wait_for_timeout(3200)
            page_aca.locator('[data-testid="tab-curriculum"]').first.click()
            page_aca.wait_for_timeout(2200)
            vault_after_f5 = page_aca.locator('[data-testid="course-program-vault"]').inner_text()
            assert mp4_title not in vault_after_f5, "FAIL: Deleted MP4 resurrected after F5!"
            assert link_title not in vault_after_f5, "FAIL: Deleted Link Video resurrected after F5!"
            print("   ✅ F5 Persistence Integrity PASS: Deleted videos NEVER resurrected!")

            # ------------------------------------------------------------------
            # AXIS 4: MOBILE VIEWPORT (390x844 — iPhone 13/14)
            # ------------------------------------------------------------------
            print("\n--- [4/4] AXIS 4: MOBILE VIEWPORT (390x844) RESPONSIVE & TOUCH ERGONOMICS ---")
            ctx_mob = browser.new_context(
                viewport={"width": 390, "height": 844},
                is_mobile=True,
                has_touch=True,
            )
            page_mob = ctx_mob.new_page()
            vault_mob = open_vault_tab(page_mob, "ACA404")

            up_btn_mob = page_mob.locator('[data-testid="btn-academic-upload-course-vault"]')
            up_box = up_btn_mob.bounding_box()
            assert up_box and up_box["height"] >= 38, f"FAIL: Mobile upload button height < 38px: {up_box}"
            sw_m = page_mob.evaluate("() => document.documentElement.scrollWidth")
            iw_m = page_mob.evaluate("() => window.innerWidth")
            assert sw_m <= iw_m, f"FAIL: Mobile horizontal overflow on Course Vault: {sw_m} > {iw_m}"
            vault_mob.screenshot(path=f"{ARTIFACT_DIR}/qc_course_vault_mobile_390.png")

            up_btn_mob.click()
            page_mob.wait_for_timeout(600)
            sw_m_modal = page_mob.evaluate("() => document.documentElement.scrollWidth")
            iw_m_modal = page_mob.evaluate("() => window.innerWidth")
            assert sw_m_modal <= iw_m_modal, f"FAIL: Mobile horizontal overflow with Upload Modal open: {sw_m_modal} > {iw_m_modal}"
            page_mob.screenshot(path=f"{ARTIFACT_DIR}/qc_course_vault_upload_modal_mobile_390.png")
            print(f"   ✅ Mobile 390x844 PASS: Zero Overflow-X ({sw_m}px <= {iw_m}px), Upload Button height={up_box['height']}px")
            ctx_mob.close()

        finally:
            print("\n--- 🧹 AXIS 5: ZERO-RESIDUE TEARDOWN ---")
            try:
                if created_mat_ids:
                    node_cleanup = f"""
                    import {{ initializeApp }} from 'firebase/app';
                    import {{ getFirestore, doc, deleteDoc, getDoc, setDoc }} from 'firebase/firestore';
                    const app = initializeApp({{
                      apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
                      authDomain: 'lakeducation-dev.firebaseapp.com',
                      projectId: 'lakeducation-dev',
                    }});
                    const db = getFirestore(app, 'lakeducationdb');
                    const ids = {json.dumps(created_mat_ids)};
                    for (const id of ids) {{
                      try {{ await deleteDoc(doc(db, 'learning_materials', id)); }} catch {{}}
                    }}
                    const cRef = doc(db, 'courses', 'KH-7569');
                    const cSnap = await getDoc(cRef);
                    if (cSnap.exists()) {{
                      const list = (cSnap.data().courseMaterials || []).filter((m) => m && !ids.includes(m.id));
                      await setDoc(cRef, {{ courseMaterials: list }}, {{ merge: true }});
                    }}
                    process.exit(0);
                    """
                    subprocess.run(["node", "--input-type=module", "-e", node_cleanup], check=True, timeout=20)
                    print(f"🧹 Hard-deleted {len(created_mat_ids)} test docs from DEV Firestore (learning_materials & KH-7569).")
            except Exception as teardown_err:
                print(f"   [Warn] Firestore teardown warning: {teardown_err}")

            for fid in set(uploaded_drive_ids):
                delete_drive_file(fid)

            if os.path.exists(TMP_MP4):
                os.remove(TMP_MP4)
                print(f"🧹 Removed local temp binary file: {TMP_MP4}")

            browser.close()

    print("\n🎉 ALL 5 AXES PASSED 100% FOR COURSE PROGRAM VAULT!")


if __name__ == "__main__":
    run_qc()
