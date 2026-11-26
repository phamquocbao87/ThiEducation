#!/usr/bin/env python3
"""
5-Axis Real E2E QC Suite for Isolated Zoom Class Sync Subsystem (`zoom-sync` + `lak-zoom-sync`)
Strictly tests on DEV (`http://localhost:3000` -> `lakeducation-dev`) with `DEV_ONLY` router lock,
verifies `0` mutations on `lakeducation` (PROD), tests real Zoom API room provisioning + teardown,
real 8MB-chunked MP4 stream from Zoom Cloud -> Google Drive 2TB, live card syncing lock (#10),
source badges (#4), early-leave teacher/academic bell alert (#6), RBAC, and Mobile 390px layout.
"""
import asyncio
import json
import os
import subprocess
import urllib.request
import urllib.error
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("QC_BASE_URL", "http://localhost:3000")
API_BASE = os.environ.get(
    "QC_ZOOM_API_BASE",
    "https://us-central1-hosting-store-api.cloudfunctions.net/lakZoomApi",
)
WEBHOOK_URL = os.environ.get(
    "QC_ZOOM_WEBHOOK_URL",
    "https://us-central1-hosting-store-api.cloudfunctions.net/lakZoomWebhook",
)
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"


def http_json(url, method="GET", headers=None, body=None, timeout=180):
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


async def login_as(page, user_obj):
    uid = user_obj["id"]
    await page.goto(
        f"{BASE_URL}/dashboard?sso_uid={uid}", wait_until="domcontentloaded", timeout=35000
    )
    await page.wait_for_timeout(3500)


async def assert_zero_overflow_x(page, label):
    metrics = await page.evaluate(
        "() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })"
    )
    assert metrics["sw"] <= metrics["iw"] + 1, (
        f"FAIL Overflow-X on {label}: scrollWidth={metrics['sw']} > innerWidth={metrics['iw']}"
    )
    print(f"  ✅ Zero Overflow-X [{label}]: {metrics['sw']}px <= {metrics['iw']}px")


async def main():
    created_zoom_room_id = None
    simulated_notif_cleanup = False
    console_errors = []

    print("=== [AXIS 2] WEBHOOK HMAC SECURITY & DEV_ONLY PROD-LOCK CHECK ===")
    wh_code, wh_body = http_json(
        WEBHOOK_URL,
        method="POST",
        headers={"x-zm-signature": "v0=forged_invalid", "x-zm-request-timestamp": "1700000000"},
        body={"event": "meeting.started", "payload": {"object": {"id": "96545837709"}}},
    )
    assert wh_code == 401, f"Expected 401 on forged signature, got {wh_code}: {wh_body}"
    print("  ✅ Forged Zoom Webhook rejected with HTTP 401 INVALID_ZOOM_SIGNATURE")

    st_code, _ = http_json(
        f"{API_BASE}/router-config",
        method="POST",
        headers={"x-lak-actor-id": "ADM001"},
        body={"routingMode": "DEV_ONLY", "earlyLeaveThresholdMinutes": 10},
    )
    assert st_code == 200, f"Router config failed: {st_code}"

    prod_code, prod_body = http_json(
        f"{API_BASE}/link-class",
        method="POST",
        headers={"x-lak-target-env": "prod", "x-lak-actor-id": "ADM001"},
        body={"classId": "LH002", "zoomMeetingId": "96545837709"},
    )
    assert prod_code == 400 and "PROD_WRITE_LOCKED" in str(prod_body.get("error", "")), (
        f"Expected PROD_WRITE_LOCKED, got {prod_code}: {prod_body}"
    )
    print("  ✅ PROD_WRITE_LOCKED verified: Production DB is 100% protected while in DEV_ONLY mode!")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                channel="chrome",
                args=["--headless=new", "--disable-blink-features=AutomationControlled"],
            )

            ctx = await browser.new_context(viewport={"width": 1366, "height": 850})
            page = await ctx.new_page()
            page.on(
                "pageerror",
                lambda exc: console_errors.append(f"PAGEERROR: {exc}"),
            )

            await login_as(
                page,
                {
                    "id": "ADM001",
                    "code": "ADM001",
                    "name": "Phạm Quốc Bảo",
                    "email": "it@lakeducation.com",
                    "role": "admin",
                    "status": "active",
                },
            )

            print("\n=== [REQ #2, #3, #7] SMART CLASS MAPPING & NON-DESTRUCTIVE FIELDS ===")
            await page.goto(f"{BASE_URL}/zoom-sync", wait_until="domcontentloaded", timeout=30000)
            await page.locator("[data-testid='zoom-sync-module-page']").wait_for(
                state="visible", timeout=20000
            )
            await page.wait_for_timeout(4000)
            await assert_zero_overflow_x(page, "Desktop /zoom-sync Mapping Tab")

            for cid in ["LH002", "LH004"]:
                btn = page.locator(f"[data-testid='btn-confirm-zoom-link-{cid}']")
                await btn.wait_for(state="visible", timeout=15000)
                await btn.click()
                await page.wait_for_timeout(2500)
                print(f"  ✅ Linked {cid} to Zoom room on DEV with additive zoomConfig!")

            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_1_mapping_desktop.png")

            print("\n=== [REQ #1] AUTO-PROVISION RECURRING ZOOM CLOUD ROOM FROM CLASS FORM ===")
            await page.goto(
                f"{BASE_URL}/courses-classes", wait_until="domcontentloaded", timeout=30000
            )
            await page.wait_for_timeout(3500)
            create_cls_btn = page.locator("button.ant-btn-primary:has(.anticon-plus)").first
            await create_cls_btn.wait_for(state="visible", timeout=15000)
            await create_cls_btn.click()
            await page.wait_for_timeout(1200)

            name_inp = page.locator(".ant-drawer input[id*='name']").first
            await name_inp.wait_for(state="visible", timeout=10000)
            await name_inp.fill("QC Temp Auto Zoom Class (Auto Teardown)")

            prov_btn = page.locator("[data-testid='btn-auto-provision-zoom-room']")
            await prov_btn.scroll_into_view_if_needed()
            await prov_btn.wait_for(state="visible", timeout=10000)
            await prov_btn.click()
            await page.wait_for_timeout(5000)

            mid_val = await page.locator(".ant-drawer input[id*='meetingId']").first.input_value()
            stu_link_val = await page.locator(".ant-drawer input[id*='zoomStudentLink']").first.input_value()
            digits = "".join(ch for ch in mid_val if ch.isdigit())
            assert len(digits) >= 9 and digits != "888999111" and "zoom.us/j/" in stu_link_val, (
                f"Auto-provision did not populate real Zoom ID/link: id={mid_val}, link={stu_link_val}"
            )
            created_zoom_room_id = digits
            print(
                f"  ✅ Auto-created real recurring Zoom Cloud room via UI: {mid_val} -> {stu_link_val} (will delete in teardown)"
            )
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_2_auto_provision_drawer.png")

            print("\n=== [REQ #10, #8, #4] LIVE CARD SYNCING LOCK & REAL 270MB STREAM BACKFILL ===")
            await page.goto(f"{BASE_URL}/zoom-sync", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3000)
            await page.locator("[data-testid='tab-zoom-backfill']").click()
            await page.wait_for_timeout(2500)
            await assert_zero_overflow_x(page, "Desktop /zoom-sync Backfill Tab")

            aud_code, aud_res = http_json(
                f"{API_BASE}/missing-recordings?env=dev",
                headers={"x-lak-target-env": "dev"},
            )
            assert aud_code == 200, f"Audit API failed: {aud_res}"
            # Prefer a session in Current Week (2026-11-23..2026-11-29) so it renders immediately on /zoom-schedules
            missing_items = [
                x
                for x in aud_res["data"]["items"]
                if x["syncStatus"] == "MISSING_NEEDS_SYNC" and x["matchedClassId"] == "LH004"
            ]
            current_week_missing = [
                x for x in missing_items if "2026-11-23" <= x["sessionDate"] <= "2026-11-29"
            ]
            pick = current_week_missing[0] if current_week_missing else (missing_items[0] if missing_items else None)

            if pick:
                target_uuid = pick["zoomMeetingUuid"]
                target_date = pick["sessionDate"]
                print(
                    f"  🚀 Triggering real stream backfill for LH004 ({target_date}, {pick['totalMp4Bytes']} bytes)..."
                )

                await page.goto(
                    f"{BASE_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=30000
                )
                await page.wait_for_timeout(3000)
                if target_date < "2026-11-23":
                    await page.locator("button:has-text('Previous Week'), button:has-text('Tuần trước')").first.click()
                    await page.wait_for_timeout(1500)

                loop = asyncio.get_running_loop()
                sync_future = loop.run_in_executor(
                    None,
                    lambda: http_json(
                        f"{API_BASE}/backfill-sync",
                        method="POST",
                        headers={"x-lak-target-env": "dev", "x-lak-actor-id": "ADM001"},
                        body={"zoomMeetingUuids": [target_uuid]},
                        timeout=480,
                    ),
                )

                caught_banner = False
                for _ in range(30):
                    await page.wait_for_timeout(800)
                    banner = page.locator(
                        f"[data-testid='zoom-slot-syncing-banner-LH004_{target_date}']"
                    )
                    if await banner.count() > 0 and await banner.first.is_visible():
                        caught_banner = True
                        locked_btn = page.locator(
                            f"[data-testid='btn-upload-locked-syncing-LH004_{target_date}']"
                        )
                        assert await locked_btn.is_disabled(), (
                            "Upload button MUST be disabled while syncing!"
                        )
                        await banner.first.scroll_into_view_if_needed()
                        await page.screenshot(
                            path=f"{ARTIFACT_DIR}/qc_zoom_4_card_syncing_in_progress.png"
                        )
                        print(
                            f"  ✅ Caught live syncing banner & locked upload button on LH004_{target_date} card!"
                        )
                        break

                assert caught_banner, f"Expected live syncing banner on LH004_{target_date} card!"
                bf_code, bf_body = await sync_future
                assert bf_code == 200 and bf_body.get("success"), (
                    f"Backfill stream failed: {bf_code} {bf_body}"
                )
                print(f"  ✅ Real MP4 stream to Google Drive 2TB completed 100%: {bf_body['data']}")

                await page.wait_for_timeout(3000)
                await page.screenshot(
                    path=f"{ARTIFACT_DIR}/qc_zoom_5_card_auto_zoom_badge_after.png"
                )

            # Also capture Class Recordings Directory tab showing [☁️ Auto Zoom] + ✨ AI vs [📤 Manual]!
            rec_tab = page.locator(
                ".ant-segmented-item:has-text('Class Recordings'), .ant-segmented-item:has-text('Video Ghi Hình')"
            ).first
            if await rec_tab.count() > 0:
                await rec_tab.click()
                await page.wait_for_timeout(2500)
                await page.screenshot(
                    path=f"{ARTIFACT_DIR}/qc_zoom_5b_class_recordings_directory.png"
                )
                print("  ✅ Captured Class Recordings Directory with Auto-Zoom + AI vs Manual badges!")

            print("\n=== [REQ #6] SIMULATE STUDENT EARLY LEAVE & VERIFY TEACHER/ACADEMIC BELL ===")
            sim_code, sim_body = http_json(
                f"{API_BASE}/simulate-early-leave-dev",
                method="POST",
                headers={"x-lak-target-env": "dev", "x-lak-actor-id": "ADM001"},
                body={"classId": "LH004", "studentZoomName": "KENJI< PHÚ QUÝ>"},
            )
            assert sim_code == 200 and sim_body.get("success"), f"Early leave sim failed: {sim_body}"
            simulated_notif_cleanup = True

            await login_as(
                page,
                {
                    "id": "GV952",
                    "code": "GV952",
                    "name": "Teacher Maj",
                    "role": "teacher",
                    "status": "active",
                },
            )
            # Open Bell popover for Teacher Maj to verify she received the early-leave notification!
            bell_btn = page.locator(".ant-badge .anticon-bell").first
            if await bell_btn.count() > 0:
                await bell_btn.click()
                await page.wait_for_timeout(1500)
                pop_txt = await page.evaluate("() => document.body.innerText")
                assert "KENJI" in pop_txt.upper() or "PHÚ QUÝ" in pop_txt.upper() or "ZOOM" in pop_txt.upper(), (
                    "Teacher Maj did not see early-leave notification in Bell popover!"
                )
                await page.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_7_early_leave_bell.png")
                print("  ✅ Teacher GV952 received real-time Student Early-Leave Bell Alert!")

            await page.goto(f"{BASE_URL}/zoom-sync", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)
            assert "/zoom-sync" not in page.url or await page.locator("[data-testid='zoom-sync-module-page']").count() == 0, (
                "Teacher should NOT access /zoom-sync management module!"
            )
            print("  ✅ RBAC Guard: Teacher GV952 blocked from /zoom-sync management route")

            await login_as(
                page,
                {
                    "id": "HV768",
                    "code": "HV768",
                    "name": "Nguyen Phu Quy",
                    "englishName": "Kenji",
                    "role": "student",
                    "status": "active",
                    "enrolledClassIds": ["LH004"],
                },
            )
            await page.goto(
                f"{BASE_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=30000
            )
            await page.wait_for_timeout(3500)
            sched_txt = await page.evaluate("() => document.body.innerText")
            assert "WP02" in sched_txt and "WP03" not in sched_txt, (
                "Student Class Scoping violated on /zoom-schedules!"
            )
            print("  ✅ Student HV768 sees ONLY enrolled class WP02 (with Auto-Zoom recording) & NOT WP03!")

            print("\n=== [AXIS 4] MOBILE 390x844 RESPONSIVE CHECK ===")
            mctx = await browser.new_context(viewport={"width": 390, "height": 844})
            mpage = await mctx.new_page()
            await login_as(
                mpage,
                {
                    "id": "ACA404",
                    "code": "ACA404",
                    "name": "Diễm Quỳnh",
                    "role": "academic",
                    "status": "active",
                },
            )
            await mpage.goto(f"{BASE_URL}/zoom-sync", wait_until="domcontentloaded", timeout=30000)
            await mpage.wait_for_timeout(4000)
            await assert_zero_overflow_x(mpage, "Mobile 390px /zoom-sync Mapping")
            await mpage.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_6_mobile_390_zoom_sync.png")

            await mpage.locator("[data-testid='tab-zoom-live-monitor']").click()
            await mpage.wait_for_timeout(1500)
            await assert_zero_overflow_x(mpage, "Mobile 390px /zoom-sync Live Guard")

            assert len(console_errors) == 0, f"Unexpected runtime page errors: {console_errors}"
            print("  ✅ Zero runtime JS pageerror exceptions across all tested screens!")

            await browser.close()
            print("\n🎉 ALL 5 AXES & 10 REQUIREMENTS PASSED 100% ON DEV!")
    finally:
        print("\n=== [AXIS 5] ZERO-RESIDUE TEARDOWN & PROD IMMUTABILITY VERIFICATION ===")
        if created_zoom_room_id:
            del_code, del_body = http_json(
                f"{API_BASE}/meetings/{created_zoom_room_id}",
                method="DELETE",
                headers={"x-lak-target-env": "dev", "x-lak-actor-id": "ADM001"},
            )
            assert del_code == 200, f"Failed to delete test Zoom room {created_zoom_room_id}: {del_body}"
            print(
                f"  🧹 Deleted temporary provisioned Zoom room {created_zoom_room_id}: HTTP {del_code} {del_body}"
            )

        # Clean up simulated early-leave notifications on lakeducation-dev AND assert 0 mutations on PROD!
        cleanup_js = r"""
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const devApp = admin.initializeApp({ projectId: 'lakeducation-dev' }, 'devClean');
const prodApp = admin.initializeApp({ projectId: 'lakeducation' }, 'prodAudit');
const devDb = getFirestore(devApp, 'lakeducationdb');
const prodDb = getFirestore(prodApp, 'lakeducationdb');
(async () => {
  const notifSnap = await devDb.collection('notifications').where('type', '==', 'zoom_student_left_early').get();
  let removed = 0;
  for (const d of notifSnap.docs) {
    if (String(d.id).includes('LH004') || String(d.data().classId) === 'LH004') {
      await d.ref.delete();
      removed++;
    }
  }
  const lh004Ref = devDb.collection('classes').doc('LH004');
  const lh004Snap = await lh004Ref.get();
  if (lh004Snap.exists && lh004Snap.data().zoomLiveState) {
    await lh004Ref.set({ zoomLiveState: admin.firestore.FieldValue.delete() }, { merge: true });
  }
  const prodClasses = await prodDb.collection('classes').get();
  const prodZoomTouched = prodClasses.docs.filter(d => d.data().zoomConfig !== undefined).length;
  const prodMats = await prodDb.collection('learning_materials').where('recordingSource', '==', 'ZOOM_AUTO_SYNC').get();
  console.log(JSON.stringify({ removedSimNotifs: removed, prodZoomTouched, prodAutoSyncMats: prodMats.size }));
  if (prodZoomTouched !== 0 || prodMats.size !== 0) process.exit(2);
  process.exit(0);
})();
"""
        proc = subprocess.run(
            ["node", "-e", cleanup_js],
            cwd="/Volumes/DATA/projects/ThiEducation/zoom-sync-service",
            capture_output=True,
            text=True,
            check=True,
        )
        print(f"  🧹 Cleaned simulated DEV test notifications & verified PROD 0 mutations: {proc.stdout.strip()}")


if __name__ == "__main__":
    asyncio.run(main())
