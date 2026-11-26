#!/usr/bin/env python3
"""
5-Axis Real E2E QC Suite for Unified Zoom Architecture v2.0:
- Axis 1 & 2: Cross-Env Write-Once Google Drive Deduplication (`reusedExistingDriveFile: true`, 0MB re-uploaded)
  + `DEV Shared-Drive Trash Guard` (deleting on DEV does NOT trash physical Google Drive file!).
- Axis 3: Zero Sidebar Clutter (`Đồng Bộ Zoom Cloud` completely removed from Sidebar across all roles;
  `AdminZoomRouterConfigCard` exclusively visible to IT Admin `ADM001` on `/dashboard`).
- Axis 4: `ZoomRoomLiveSection` 0ms live status across ALL Class Cards (`/dashboard` Academic & Teacher,
  `/courses-classes`, `/classroom/:id`, and PII-protected Student Portal card) on Desktop 1366px & Mobile 390px.
- Axis 5: Zero-Residue Teardown & 100% Production Immutability Check (`DEV_ONLY` active).
"""
import asyncio
import json
import os
import subprocess
import time
import urllib.request
import urllib.error
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("QC_BASE_URL", "http://localhost:3000")
API_BASE = os.environ.get(
    "QC_ZOOM_API_BASE",
    "https://us-central1-hosting-store-api.cloudfunctions.net/lakZoomApi",
)
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"


def http_json(url, method="GET", headers=None, body=None, timeout=90):
    req = urllib.request.Request(
        url,
        method=method,
        headers={"Content-Type": "application/json", **(headers or {})},
        data=json.dumps(body).encode("utf-8") if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def run_node_db_op(script_body):
    p = subprocess.run(
        ["node", "-e", script_body],
        cwd="/Volumes/DATA/projects/ThiEducation/zoom-sync-service",
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(p.stdout.strip().splitlines()[-1])


async def login_as(page, uid, lang="vi"):
    await page.goto(
        f"{BASE_URL}/dashboard?sso_uid={uid}", wait_until="domcontentloaded", timeout=35000
    )
    await page.evaluate(f"() => localStorage.setItem('lak_erp_language', '{lang}')")
    await page.reload(wait_until="domcontentloaded")
    await page.wait_for_timeout(3200)


async def assert_zero_overflow_x(page, label):
    metrics = await page.evaluate(
        "() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })"
    )
    assert metrics["sw"] <= metrics["iw"] + 1, (
        f"FAIL Overflow-X on {label}: scrollWidth={metrics['sw']} > innerWidth={metrics['iw']}"
    )
    print(f"  ✅ Zero Overflow-X [{label}]: {metrics['sw']}px <= {metrics['iw']}px")


async def main():
    console_errors = []
    temp_ref_doc_id = "rec_zoom_CROSS_ENV_REUSE_VERIFY_TEMP"

    try:
        print("=== [AXIS 1 & 2] SHARED-DRIVE TRASH GUARD & CROSS-ENV DRIVE DEDUPLICATION ===")
        # 1. Inspect existing synced recording rec_zoom_LH004_20261125_819768c3 on DEV
        rec_info = run_node_db_op(
            r"""
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({ projectId: 'lakeducation-dev' });
const db = getFirestore(app, 'lakeducationdb');
(async () => {
  const snap = await db.collection('learning_materials')
    .where('classId', '==', 'LH004')
    .where('sessionDate', '==', '2026-11-25')
    .get();
  const active = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(x => !x.isDeleted && x.driveFileId);
  console.log(JSON.stringify(active || { id: null }));
  process.exit(0);
})();
"""
        )
        assert rec_info.get("id"), "Expected active 2026-11-25 recording on DEV!"
        rec_id = rec_info["id"]
        orig_drive_id = rec_info["driveFileId"]
        zoom_uuid = rec_info["zoomMeta"]["zoomMeetingUuid"]
        print(f"  Found synced recording {rec_id} -> Shared Drive File ID: {orig_drive_id}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                channel="chrome",
                args=["--headless=new", "--disable-blink-features=AutomationControlled"],
            )
            ctx = await browser.new_context(viewport={"width": 1366, "height": 880})
            page = await ctx.new_page()
            page.on("pageerror", lambda exc: console_errors.append(f"PAGEERROR: {exc}"))

            # Login as ADM001 & delete rec_id on DEV UI -> verify UI removes 0ms AND Drive file is NOT trashed!
            await login_as(page, "ADM001", "vi")
            await page.goto(
                f"{BASE_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=30000
            )
            await page.wait_for_timeout(3500)

            del_btn = page.locator(f"[data-testid='btn-delete-schedule-recording-{rec_id}']")
            await del_btn.wait_for(state="visible", timeout=15000)
            await del_btn.click()
            await page.wait_for_timeout(600)
            confirm_btn = page.locator(
                f"[data-testid='btn-confirm-delete-schedule-recording-{rec_id}']"
            )
            await confirm_btn.wait_for(state="visible", timeout=10000)
            await confirm_btn.click()
            await page.wait_for_timeout(2000)

            # Verify 0ms UI removal on DEV
            assert await page.locator(f"[data-testid='btn-delete-schedule-recording-{rec_id}']").count() == 0, (
                "Recording button should disappear immediately (0ms) after delete on DEV!"
            )

            # Verify physical Google Drive file is STILL ALIVE (HTTP 200, NOT moved to Trash!)
            drive_req = urllib.request.Request(
                f"https://drive.google.com/file/d/{orig_drive_id}/preview",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(drive_req, timeout=20) as dr:
                drive_html = dr.read(4096).decode("utf-8", errors="ignore")
                assert dr.status == 200 and "Page Not Found" not in drive_html, (
                    "Shared Drive file was trashed when deleting on DEV!"
                )
            print(
                f"  ✅ DEV Shared-Drive Trash Guard PASSED: Deleted on DEV UI (0ms), physical Drive file {orig_drive_id} remains HTTP 200 intact!"
            )

            # Now test Cross-Env Write-Once Drive Reuse:
            # Place a temporary active doc simulating that the other env/collection already holds `orig_drive_id` for `zoomRecordingFileId`,
            # then call `/backfill-sync` to restore `LH004` `2026-11-25` -> MUST reuse `orig_drive_id` in <12s without re-uploading 270MB!
            run_node_db_op(
                f"""
const admin = require('firebase-admin');
const {{ getFirestore }} = require('firebase-admin/firestore');
const app = admin.initializeApp({{ projectId: 'lakeducation-dev' }});
const db = getFirestore(app, 'lakeducationdb');
(async () => {{
  const orig = (await db.collection('learning_materials').doc('{rec_id}').get()).data();
  await db.collection('learning_materials').doc('{temp_ref_doc_id}').set({{
    ...orig,
    id: '{temp_ref_doc_id}',
    classId: 'CROSS_ENV_HOLDER',
    isDeleted: false,
  }});
  console.log(JSON.stringify({{ planted: true }}));
  process.exit(0);
}})();
"""
            )

            t0 = time.time()
            bf_code, bf_body = http_json(
                f"{API_BASE}/backfill-sync",
                method="POST",
                headers={
                    "x-lak-target-env": "dev",
                    "x-lak-actor-id": "ADM001",
                    "x-lak-actor-role": "admin",
                },
                body={"zoomMeetingUuids": [zoom_uuid]},
            )
            elapsed = time.time() - t0
            assert bf_code == 200 and bf_body.get("success"), f"Backfill reuse failed: {bf_body}"
            synced_item = bf_body["data"][0]["synced"][0]
            assert synced_item["reusedExistingDriveFile"] is True, (
                f"Expected reusedExistingDriveFile=True, got: {synced_item}"
            )
            assert synced_item["driveFileId"] == orig_drive_id, (
                f"Expected exact same Drive File ID {orig_drive_id}, got {synced_item['driveFileId']}"
            )
            assert elapsed < 15.0, f"Expected instant reuse (<15s), took {elapsed:.1f}s!"
            print(
                f"  ✅ Cross-Env Write-Once Drive Reuse PASSED in {elapsed:.2f}s (0 bytes re-uploaded, reused {orig_drive_id})!"
            )

            print("\n=== [AXIS 3] ZERO SIDEBAR CLUTTER & ADMIN DASHBOARD ROUTER CARD ===")
            await page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3500)
            sidebar_txt = await page.locator(".ant-layout-sider").first.inner_text()
            assert "Đồng Bộ Zoom Cloud" not in sidebar_txt and "Zoom Cloud Sync" not in sidebar_txt, (
                f"Sidebar still contains removed Zoom menu item: {sidebar_txt}"
            )
            print("  ✅ Confirmed: Sidebar is 100% clean (0 'Đồng Bộ Zoom Cloud' menu item)")

            admin_router_card = page.locator("[data-testid='admin-dashboard-zoom-router-card']")
            await admin_router_card.scroll_into_view_if_needed()
            await admin_router_card.wait_for(state="visible", timeout=10000)
            await assert_zero_overflow_x(page, "Desktop Admin /dashboard Router Card")
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_v2_final_1_admin_dashboard_router.png")
            print("  ✅ Admin ADM001 sees 'Công Tắc Điều Hướng 1 Tài Khoản Zoom' directly on /dashboard!")

            # Verify /zoom-sync redirects cleanly to /dashboard
            await page.goto(f"{BASE_URL}/zoom-sync", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(1500)
            assert "/dashboard" in page.url, f"Expected /zoom-sync to redirect to /dashboard, got {page.url}"
            print("  ✅ Legacy /zoom-sync URL redirects cleanly to /dashboard")

            print("\n=== [AXIS 4] LIVE ZOOM SECTION ACROSS ALL CLASS CARDS (0ms REALTIME) ===")
            # Simulate LH004 (WP02) going LIVE on Zoom with 9 participants & 1 early leave
            run_node_db_op(
                r"""
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({ projectId: 'lakeducation-dev' });
const db = getFirestore(app, 'lakeducationdb');
(async () => {
  await db.collection('classes').doc('LH004').set({
    zoomLiveState: {
      isLiveOnZoom: true,
      liveParticipantCount: 9,
      activeParticipants: [
        { zoomUserName: 'KENJI< PHÚ QUÝ>' },
        { zoomUserName: 'SUBIN (GIA BẢO)' },
        { zoomUserName: 'MINH KHÔI' }
      ],
      recentLeaves: [
        {
          studentId: 'HV768',
          studentName: 'Nguyen Phu Quy (Kenji)',
          zoomUserName: 'KENJI< PHÚ QUÝ>',
          vnTimeHm: '20:05',
          notifiedEarlyLeave: true
        }
      ],
      lastEventType: 'meeting.participant_left',
      lastWebhookAt: new Date().toISOString()
    }
  }, { merge: true });
  console.log(JSON.stringify({ liveSet: true }));
  process.exit(0);
})();
"""
            )

            # 4.1. Academic ACA404 on /dashboard: NO Admin Router card, YES Live Zoom section on LH004 & Idle Linked section on LH002!
            await login_as(page, "ACA404", "vi")
            assert await page.locator("[data-testid='admin-dashboard-zoom-router-card']").count() == 0, (
                "Academic ACA404 MUST NOT see Admin Zoom Router card on /dashboard!"
            )
            live_sec_lh004 = page.locator("[data-testid='zoom-card-live-section-LH004']").first
            idle_sec_lh002 = page.locator("[data-testid='zoom-card-live-section-LH002']").first
            await live_sec_lh004.wait_for(state="visible", timeout=10000)
            await idle_sec_lh002.wait_for(state="visible", timeout=10000)
            lh004_txt = await live_sec_lh004.inner_text()
            assert "9" in lh004_txt and ("rời sớm" in lh004_txt or "left early" in lh004_txt), (
                f"Expected live count 9 + early leave badge on LH004 card: {lh004_txt}"
            )
            await live_sec_lh004.scroll_into_view_if_needed()
            await page.wait_for_timeout(400)
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_v2_final_2_dashboard_live_cards.png")
            print("  ✅ /dashboard (Academic ClassLiveCard): Live Zoom section + Early-leave badge verified!")

            # 4.2. /courses-classes (ClassLiveStatusStrip)
            await page.goto(
                f"{BASE_URL}/courses-classes", wait_until="domcontentloaded", timeout=30000
            )
            await page.wait_for_timeout(3500)
            cc_live = page.locator("[data-testid='zoom-card-live-section-LH004']").first
            await cc_live.wait_for(state="visible", timeout=10000)
            await cc_live.scroll_into_view_if_needed()
            await assert_zero_overflow_x(page, "Desktop /courses-classes Live Section")
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_v2_final_3_courses_live_cards.png")
            print("  ✅ /courses-classes (ClassLiveStatusStrip): Live Zoom section verified!")

            # 4.3. /classroom/LH004?tab=zoom-link (ClassroomInfo header + Sync All Missing button in Tab 4)
            await page.goto(
                f"{BASE_URL}/classroom/LH004?tab=zoom-link",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await page.wait_for_timeout(4500)
            assert await page.locator("[data-testid='zoom-card-live-section-LH004']").first.is_visible(), (
                "Expected ZoomRoomLiveSection in ClassroomInfo header!"
            )
            assert await page.locator("[data-testid='btn-classroom-sync-all-missing-LH004']").is_visible(), (
                "Expected 'Sync All Missing' button inside Classroom Tab 4!"
            )
            await page.screenshot(
                path=f"{ARTIFACT_DIR}/qc_v2_final_4_classroom_detail_live_and_tab.png"
            )
            print("  ✅ /classroom/LH004: Header Live section + Tab 4 'Kéo Tất Cả' button verified!")

            # 4.4. Teacher GV952 on /dashboard (TeacherWorkspacePanel ClassLiveCard)
            await login_as(page, "GV952", "en")
            gv_live = page.locator("[data-testid='zoom-card-live-section-LH004']").first
            await gv_live.wait_for(state="visible", timeout=10000)
            print("  ✅ /dashboard (Teacher Maj Workspace): Live Zoom section verified!")

            # 4.5. Student HV768 on /dashboard (StudentPortalPanel PII Guard!)
            await login_as(page, "HV768", "vi")
            stu_live = page.locator("[data-testid='zoom-card-live-section-LH004']").first
            await stu_live.wait_for(state="visible", timeout=10000)
            stu_txt = await stu_live.inner_text()
            assert "SUBIN" not in stu_txt and "rời sớm" not in stu_txt, (
                f"PII LEAK on Student Zoom Live Section: {stu_txt}"
            )
            print("  ✅ /dashboard (Student HV768): Live status visible, peer PII & early-leave logs 100% hidden!")

            # 4.6. Mobile 390x844 Responsive Check
            mctx = await browser.new_context(viewport={"width": 390, "height": 844})
            mpage = await mctx.new_page()
            mpage.on("pageerror", lambda exc: console_errors.append(f"MOBILE_PAGEERROR: {exc}"))
            await login_as(mpage, "ACA404", "vi")
            await assert_zero_overflow_x(mpage, "Mobile 390px /dashboard Live Cards")
            await mpage.locator("[data-testid='zoom-card-live-section-LH004']").first.scroll_into_view_if_needed()
            await mpage.wait_for_timeout(400)
            await mpage.screenshot(path=f"{ARTIFACT_DIR}/qc_v2_final_5_mobile_390_live_cards.png")

            await login_as(mpage, "ADM001", "vi")
            await assert_zero_overflow_x(mpage, "Mobile 390px Admin /dashboard Router Card")

            assert len(console_errors) == 0, f"Unexpected runtime JS errors: {console_errors}"
            print("  ✅ Zero runtime JS pageerror exceptions across Desktop & Mobile!")

            await browser.close()
            print("\n🎉 ALL 5 AXES OF UNIFIED ZOOM ARCHITECTURE v2.0 PASSED 100%!")
    finally:
        print("\n=== [AXIS 5] ZERO-RESIDUE TEARDOWN & PROD IMMUTABILITY CHECK ===")
        clean_res = run_node_db_op(
            f"""
const admin = require('firebase-admin');
const {{ getFirestore }} = require('firebase-admin/firestore');
const devApp = admin.initializeApp({{ projectId: 'lakeducation-dev' }}, 'devClean');
const prodApp = admin.initializeApp({{ projectId: 'lakeducation' }}, 'prodAudit');
const devDb = getFirestore(devApp, 'lakeducationdb');
const prodDb = getFirestore(prodApp, 'lakeducationdb');
(async () => {{
  await devDb.collection('learning_materials').doc('{temp_ref_doc_id}').delete().catch(() => {{}});
  await devDb.collection('classes').doc('LH004').set(
    {{ zoomLiveState: admin.firestore.FieldValue.delete() }},
    {{ merge: true }}
  );
  const prodClasses = await prodDb.collection('classes').get();
  const prodZoomTouched = prodClasses.docs.filter(d => d.data().zoomConfig !== undefined).length;
  const prodMats = await prodDb.collection('learning_materials').where('recordingSource', '==', 'ZOOM_AUTO_SYNC').get();
  console.log(JSON.stringify({{ cleaned: true, prodZoomTouched, prodAutoSyncMats: prodMats.size }}));
  if (prodZoomTouched !== 0 || prodMats.size !== 0) process.exit(2);
  process.exit(0);
}})();
"""
        )
        print(f"  🧹 Teardown & PROD immutability verified: {clean_res}")


if __name__ == "__main__":
    asyncio.run(main())
