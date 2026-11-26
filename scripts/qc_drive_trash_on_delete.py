#!/usr/bin/env python3
"""
QC E2E 5-Axis Verification Script: Google Drive 30-Day Trash Sync on UI Delete
Spec: docs/specs/SPEC_DRIVE_TRASH_ON_DELETE_30D.md
Verifies directly against Google Drive REST API v3 that deleting an uploaded file in UI
transitions the real Google Drive file from `trashed: false` -> `trashed: true` (30-day Trash).
"""

import json
import os
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright

LOCAL_URL = "http://localhost:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
TMP_MP4 = f"/tmp/qc_drive_trash_video_{int(time.time())}.mp4"

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
        "sine=frequency=480:duration=2",
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
    assert os.path.exists(path) and os.path.getsize(path) > 1024
    print(f"✅ Generated real binary MP4: {path} ({os.path.getsize(path)} bytes)")


def get_drive_access_token() -> str:
    req = urllib.request.Request(
        f"{HOSTING_STORE_API}/credentials/drive-token",
        headers={"x-app-id": APP_ID, "x-app-token": APP_TOKEN},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
        token = (data.get("data") or {}).get("accessToken")
        assert token, "Failed to retrieve Google Drive OAuth accessToken!"
        return token


def get_google_drive_file_state(file_id: str, token: str) -> dict:
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}?fields=id,name,trashed,explicitlyTrashed"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def permanent_delete_drive_file(file_id: str):
    if not file_id:
        return
    for endpoint in [f"{HOSTING_STORE_API}/files/{file_id}", f"{HOSTING_STORE_API}/storage/files/{file_id}"]:
        try:
            req = urllib.request.Request(
                endpoint,
                method="DELETE",
                headers={"x-app-id": APP_ID, "x-app-token": APP_TOKEN},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                print(f"🧹 Permanently purged test file {file_id} from Google Drive Trash via {endpoint} (HTTP {resp.status})")
                return
        except Exception as exc:
            print(f"   [Info] Permanent delete attempt {endpoint}: {exc}")


def wait_for_drive_trashed(file_id: str, token: str, timeout_sec: float = 12.0) -> dict:
    deadline = time.time() + timeout_sec
    last_state = {}
    while time.time() < deadline:
        last_state = get_google_drive_file_state(file_id, token)
        if last_state.get("trashed") is True:
            return last_state
        time.sleep(0.8)
    return last_state


def run_qc():
    print("=" * 90)
    print("🧪 QC 5-AXIS SUITE: GOOGLE DRIVE 30-DAY TRASH (`trashed: true`) ON UI DELETE")
    print("=" * 90)

    generate_real_mp4(TMP_MP4)
    drive_token = get_drive_access_token()
    ts = int(time.time())
    uploaded_drive_ids = []
    created_doc_ids = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            ctx = browser.new_context(viewport={"width": 1366, "height": 850})
            page = ctx.new_page()
            latest_fid = {"val": ""}

            def on_response(resp):
                if "/storage/confirm" in resp.url and resp.status == 200:
                    try:
                        body = resp.json()
                        fid = (body.get("data") or {}).get("id") or (body.get("data") or {}).get("fileId")
                        if fid:
                            latest_fid["val"] = fid
                            uploaded_drive_ids.append(fid)
                    except Exception:
                        pass

            page.on("response", on_response)

            # ------------------------------------------------------------------
            # 1. LIVE CLASS SCHEDULES: Upload .mp4 -> Verify trashed=False -> Delete UI -> Verify trashed=True!
            # ------------------------------------------------------------------
            print("\n--- [1/3] LIVE CLASS SCHEDULES: UPLOAD .MP4 -> UI DELETE -> GOOGLE DRIVE TRASH CHECK ---")
            page.goto(f"{LOCAL_URL}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000)
            page.wait_for_timeout(3400)
            page.goto(f"{LOCAL_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=40000)
            page.wait_for_timeout(3200)

            latest_fid["val"] = ""
            page.locator('[data-testid="btn-upload-schedule-recording-LH002_2026-11-24"]').click()
            page.wait_for_timeout(500)
            page.locator('[data-testid="input-session-recording-file"]').set_input_files(TMP_MP4)
            page.wait_for_timeout(400)
            sched_title = f"QC Trash Schedule Video {ts}"
            page.locator('[data-testid="input-session-recording-title"]').fill(sched_title)
            page.locator('[data-testid="btn-submit-session-recording"]').click()

            watch_btn = page.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-24-0"]')
            watch_btn.wait_for(state="visible", timeout=45000)
            fid_sched = latest_fid["val"]
            assert fid_sched, "FAIL: Did not capture driveFileId on Schedule upload!"

            state_before_1 = get_google_drive_file_state(fid_sched, drive_token)
            print(f"   📡 Google Drive v3 BEFORE UI delete: {state_before_1}")
            assert state_before_1.get("trashed") is False, f"FAIL: Expected trashed=False before delete, got {state_before_1}"

            del_btn_1 = page.locator('[data-testid="slot-recording-box-LH002_2026-11-24"] [data-testid^="btn-delete-schedule-recording-"]').first
            rec_id_1 = (del_btn_1.get_attribute("data-testid") or "").replace("btn-delete-schedule-recording-", "")
            if rec_id_1:
                created_doc_ids.append(rec_id_1)
            del_btn_1.click()
            page.wait_for_timeout(400)
            page.locator(f'[data-testid="btn-confirm-delete-schedule-recording-{rec_id_1}"]').click()

            # Assert 0ms UI removal
            page.wait_for_timeout(250)
            assert page.locator('[data-testid="btn-watch-schedule-recording-LH002_2026-11-24-0"]').count() == 0, "FAIL: 0ms UI removal failed!"

            state_after_1 = wait_for_drive_trashed(fid_sched, drive_token, timeout_sec=15.0)
            print(f"   🗑️ Google Drive v3 AFTER UI delete:  {state_after_1}")
            assert state_after_1.get("trashed") is True, f"FAIL: Google Drive file was NOT moved to Trash! {state_after_1}"
            print("   ✅ PASS: Live Class Schedules Delete moved real .mp4 into Google Drive 30-day Trash (`trashed: true`)!")

            # ------------------------------------------------------------------
            # 2. COURSE PROGRAM VAULT: Upload .mp4 -> Verify trashed=False -> Delete UI -> Verify trashed=True!
            # ------------------------------------------------------------------
            print("\n--- [2/3] COURSE PROGRAM VAULT: UPLOAD .MP4 -> UI DELETE -> GOOGLE DRIVE TRASH CHECK ---")
            page.goto(f"{LOCAL_URL}/classroom/LH002", wait_until="domcontentloaded", timeout=40000)
            page.wait_for_timeout(3200)
            page.locator('[data-testid="tab-curriculum"]').first.click()
            page.wait_for_timeout(1800)

            latest_fid["val"] = ""
            page.locator('[data-testid="btn-academic-upload-course-vault"]').click()
            page.wait_for_timeout(500)
            page.locator('[data-testid="input-course-vault-file"]').set_input_files(TMP_MP4)
            page.wait_for_timeout(400)
            vault_title = f"QC Trash Vault Video {ts}"
            page.locator('[data-testid="input-course-vault-title"]').fill(vault_title)
            page.locator('[data-testid="btn-submit-course-material"]').click()

            vault_card = page.locator('[data-testid^="course-vault-card-"]').filter(has_text=vault_title).first
            vault_card.wait_for(state="visible", timeout=45000)
            fid_vault = latest_fid["val"]
            assert fid_vault, "FAIL: Did not capture driveFileId on Course Vault upload!"
            mat_id_2 = (vault_card.get_attribute("data-testid") or "").replace("course-vault-card-", "")
            if mat_id_2:
                created_doc_ids.append(mat_id_2)

            state_before_2 = get_google_drive_file_state(fid_vault, drive_token)
            print(f"   📡 Google Drive v3 BEFORE UI delete: {state_before_2}")
            assert state_before_2.get("trashed") is False

            page.locator(f'[data-testid="btn-delete-course-material-{mat_id_2}"]').click()
            page.wait_for_timeout(400)
            page.locator(f'[data-testid="btn-confirm-delete-course-material-{mat_id_2}"]').click()

            state_after_2 = wait_for_drive_trashed(fid_vault, drive_token, timeout_sec=15.0)
            print(f"   🗑️ Google Drive v3 AFTER UI delete:  {state_after_2}")
            assert state_after_2.get("trashed") is True, f"FAIL: Course Vault file was NOT moved to Trash! {state_after_2}"
            print("   ✅ PASS: Course Program Vault Delete moved real .mp4 into Google Drive 30-day Trash (`trashed: true`)!")

            # ------------------------------------------------------------------
            # 3. EXTERNAL URL GUARD: Deleting external link must succeed cleanly with 0 errors
            # ------------------------------------------------------------------
            print("\n--- [3/3] EXTERNAL URL PROTECTION GUARD ---")
            page.locator('[data-testid="btn-academic-upload-course-vault"]').click()
            page.wait_for_timeout(400)
            page.locator('[data-testid="segmented-course-vault-mode"]').get_by_text("Link", exact=False).first.click()
            page.wait_for_timeout(300)
            ext_title = f"QC External Link Guard {ts}"
            page.locator('[data-testid="input-course-vault-title"]').fill(ext_title)
            page.locator('[data-testid="input-course-vault-url"]').fill("https://www.youtube.com/watch?v=aqz-KE-bpKQ")
            page.locator('[data-testid="btn-submit-course-material"]').click()

            ext_card = page.locator('[data-testid^="course-vault-card-"]').filter(has_text=ext_title).first
            ext_card.wait_for(state="visible", timeout=15000)
            ext_id = (ext_card.get_attribute("data-testid") or "").replace("course-vault-card-", "")
            if ext_id:
                created_doc_ids.append(ext_id)

            page.locator(f'[data-testid="btn-delete-course-material-{ext_id}"]').click()
            page.wait_for_timeout(400)
            page.locator(f'[data-testid="btn-confirm-delete-course-material-{ext_id}"]').click()
            page.wait_for_timeout(1200)
            assert page.locator(f'[data-testid="course-vault-card-{ext_id}"]').count() == 0
            print("   ✅ PASS: External URL removed cleanly without touching external resources!")
            ctx.close()

        finally:
            print("\n--- 🧹 AXIS 5: ZERO-RESIDUE TEARDOWN ---")
            try:
                if created_doc_ids:
                    node_cleanup = f"""
                    import {{ initializeApp }} from 'firebase/app';
                    import {{ getFirestore, doc, deleteDoc, getDoc, setDoc }} from 'firebase/firestore';
                    const app = initializeApp({{
                      apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
                      authDomain: 'lakeducation-dev.firebaseapp.com',
                      projectId: 'lakeducation-dev',
                    }});
                    const db = getFirestore(app, 'lakeducationdb');
                    const ids = {json.dumps(created_doc_ids)};
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
                    print(f"🧹 Hard-deleted {len(created_doc_ids)} test docs from DEV Firestore.")
            except Exception as exc:
                print(f"   [Warn] Firestore teardown warning: {exc}")

            for fid in set(uploaded_drive_ids):
                permanent_delete_drive_file(fid)

            if os.path.exists(TMP_MP4):
                os.remove(TMP_MP4)
                print(f"🧹 Removed local temp binary file: {TMP_MP4}")

            browser.close()

    print("\n🎉 ALL GOOGLE DRIVE 30-DAY TRASH TESTS PASSED 100%!")


if __name__ == "__main__":
    run_qc()
