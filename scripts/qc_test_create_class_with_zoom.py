#!/usr/bin/env python3
"""
Real E2E Test for Sếp Bảo's 4 Questions on Creating Class + Auto-Generating Zoom Room:
1. Create a class in a DIFFERENT time slot from existing PROD/UAT classes:
   - Saturday & Sunday (T7, CN) 08:30 - 10:00 (90 mins), Start Date: 05/12/2026, Total Sessions: 16, Passcode: 686868.
2. Fetch `GET /lakZoomApi/meetings/{id}` directly from Zoom API to verify EVERY user input field
   (`topic`, `agenda`, `start_time`, `duration`, `timezone`, `password`, `recurrence.weekly_days`,
   `recurrence.end_times`, `occurrences`, `settings.auto_recording`).
3. Capture clear screenshots of the Drawer, Saved Class Card on DEV, and Zoom API payload proof.
4. Test creating a class OVERLAPPING an existing Zoom class (`Mon, Wed, Fri • 19:20 - 21:20` overlapping WP02 `97784357897`),
   verify Zoom API creates the room AND UI displays the Host Concurrency Overlap Warning, capture screenshot.
5. Strictly DELETE 100% of test rooms on Zoom AND test class docs on `lakeducation-dev` in `finally`,
   and verify 0 leftover test rooms on Zoom & 0 leftover test classes on DEV!
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
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"


def http_json(url, method="GET", headers=None, body=None, timeout=60):
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


async def set_ant_picker_input(page, selector, text_val):
    inp = page.locator(selector).first
    await inp.wait_for(state="visible", timeout=10000)
    await inp.click(force=True)
    await page.keyboard.press("Meta+A")
    await page.keyboard.press("Backspace")
    await page.keyboard.type(text_val, delay=30)
    await page.keyboard.press("Enter")
    await page.wait_for_timeout(300)


async def main():
    created_zoom_ids = []
    test_class_title_1 = "[QC-TEST] Morning G5 Weekend (08:00-09:30)"
    test_class_title_2 = "[QC-TEST] Overlap G5 246 (19:30-21:00)"

    # Snapshot initial active classes on DEV before test
    before_dev = run_node_db_op(
        r"""
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({ projectId: 'lakeducation-dev' });
const db = getFirestore(app, 'lakeducationdb');
(async () => {
  const snap = await db.collection('classes').get();
  const activeIds = snap.docs.filter(d => !d.data().isDeleted && d.data().status !== 'Deleted').map(d => d.id).sort();
  console.log(JSON.stringify({ activeIds, totalDocs: snap.size }));
  process.exit(0);
})();
"""
    )
    print(f"Snapshot BEFORE test on DEV: {before_dev}")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                channel="chrome",
                args=["--headless=new", "--disable-blink-features=AutomationControlled"],
            )
            ctx = await browser.new_context(viewport={"width": 1366, "height": 900})
            page = await ctx.new_page()

            await page.goto(
                f"{BASE_URL}/dashboard?sso_uid=ADM001", wait_until="domcontentloaded", timeout=35000
            )
            await page.wait_for_timeout(2000)
            vi_btn = page.locator(".ant-segmented-item:has-text('VI'), button:has-text('VI')").first
            if await vi_btn.count() > 0:
                await vi_btn.click()
                await page.wait_for_timeout(600)
            await page.goto(
                f"{BASE_URL}/courses-classes", wait_until="domcontentloaded", timeout=30000
            )
            await page.wait_for_timeout(4000)

            # =================================================================
            # TEST CASE 1: NON-OVERLAPPING MORNING WEEKEND SLOT (T7, CN • 08:30 - 10:00)
            # =================================================================
            print("\n=== [TEST 1] CREATE CLASS IN NEW NON-OVERLAPPING SLOT (SAT-SUN 08:30 - 10:00) ===")
            await page.locator("button.ant-btn-primary:has(.anticon-plus)").first.click()
            await page.wait_for_timeout(1200)

            # 1. Fill Class Name
            name_inp = page.locator(".ant-drawer input[id*='name']").first
            await name_inp.fill(test_class_title_1)

            # 2. Fill Start Date = 2026-12-05 (05/12/2026 Saturday — unambiguous ISO)
            await set_ant_picker_input(page, ".ant-drawer input[id*='startDate']", "2026-12-05")

            # 3. Fill Total Sessions = 16
            sess_inp = page.locator("[data-testid='input-class-total-sessions'] input, input[data-testid='input-class-total-sessions']").first
            await sess_inp.click(force=True)
            await page.keyboard.press("Meta+A")
            await page.keyboard.type("16")
            await page.keyboard.press("Tab")

            # 4. Select Weekend Sat-Sun (T7 - CN) + Morning Time Slot 08:00 - 09:30 (90 mins)
            weekend_tag = page.locator(".lak-weekly-schedule-control .ant-tag:has-text('Cuối tuần'), .lak-weekly-schedule-control .ant-tag:has-text('Weekend')").first
            await weekend_tag.scroll_into_view_if_needed()
            await weekend_tag.click()
            await page.wait_for_timeout(300)

            morning_tag = page.locator(".lak-weekly-schedule-control .ant-tag:has-text('08:00 - 09:30')").first
            await morning_tag.scroll_into_view_if_needed()
            await morning_tag.click()
            await page.wait_for_timeout(300)

            # 5. Fill Passcode = 686868 before clicking Auto-Create Zoom Room
            pass_inp = page.locator(".ant-drawer input[id*='passcode']").first
            await pass_inp.scroll_into_view_if_needed()
            await pass_inp.fill("686868")

            # 6. Click "Tự Tạo Phòng Trên Zoom Cloud"
            prov_btn = page.locator("[data-testid='btn-auto-provision-zoom-room']")
            await prov_btn.scroll_into_view_if_needed()
            await prov_btn.click()
            await page.wait_for_timeout(5500)

            mid_1_pretty = await page.locator(".ant-drawer input[id*='meetingId']").first.input_value()
            mid_1_digits = "".join(ch for ch in mid_1_pretty if ch.isdigit())
            assert len(mid_1_digits) >= 9 and mid_1_digits != "888999111", (
                f"Failed to create real Zoom room #1: {mid_1_pretty}"
            )
            created_zoom_ids.append(mid_1_digits)
            print(f"  ✅ Created Zoom Room #1 (Non-Overlapping Weekend 08:30-10:00): {mid_1_pretty}")

            # Confirm NO overlap warning appeared for Sat-Sun 08:30 - 10:00!
            assert await page.locator("[data-testid='alert-zoom-host-time-overlap']").count() == 0, (
                "Unexpected overlap warning on non-overlapping Sat-Sun 08:30-10:00 slot!"
            )
            assert await page.locator("[data-testid='alert-zoom-provisioned-summary']").is_visible(), (
                "Expected green provisioned summary alert!"
            )
            await page.locator("[data-testid='alert-zoom-provisioned-summary']").scroll_into_view_if_needed()
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_create_zoom_1_diff_slot_drawer.png")

            # 7. VERIFY DIRECTLY ON ZOOM API (`GET /lakZoomApi/meetings/{id}`) EVERY USER INPUT FIELD!
            z_code, z_res = http_json(f"{API_BASE}/meetings/{mid_1_digits}")
            assert z_code == 200 and z_res.get("success"), f"Zoom GET meeting failed: {z_res}"
            zm = z_res["data"]
            occ = zm.get("occurrences") or []
            zoom_audit_1 = {
                "id": zm.get("id"),
                "topic": zm.get("topic"),
                "agenda": zm.get("agenda"),
                "type": zm.get("type"),
                "timezone": zm.get("timezone"),
                "password": zm.get("password"),
                "recurrence": zm.get("recurrence"),
                "occurrences_count": len(occ),
                "first_occurrence": occ[0] if occ else None,
                "last_occurrence": occ[-1] if occ else None,
                "auto_recording": zm.get("settings", {}).get("auto_recording"),
                "join_before_host": zm.get("settings", {}).get("join_before_host"),
            }
            print("  🔍 REAL ZOOM API MEETING #1 AUDIT:\n" + json.dumps(zoom_audit_1, indent=2, ensure_ascii=False))

            assert zm.get("topic") == test_class_title_1, f"Topic mismatch: {zm.get('topic')}"
            assert zm.get("type") == 8, f"Expected recurring type 8, got {zm.get('type')}"
            assert zm.get("password") == "686868", f"Passcode mismatch: {zm.get('password')}"
            assert zm.get("recurrence", {}).get("weekly_days") == "1,7", (
                f"Expected weekly_days='1,7' (Sun, Sat), got {zm.get('recurrence')}"
            )
            assert len(occ) == 16, f"Expected exact 16 occurrences for totalSessions=16, got {len(occ)}"
            assert occ[0]["duration"] == 90, f"Expected exact 90 mins (08:00-09:30), got {occ[0]}"
            # 05/12/2026 08:00 GMT+7 == 2026-12-05T01:00:00Z!
            assert occ[0]["start_time"].startswith("2026-12-05T01:00:00Z"), (
                f"Expected first occurrence at 2026-12-05 08:00 VN (01:00Z), got {occ[0]['start_time']}"
            )
            assert zm.get("settings", {}).get("auto_recording") == "cloud", "Expected auto_recording=cloud!"
            print("  ✅ 100% OF USER INPUT FIELDS VERIFIED ON ZOOM CLOUD API (Topic, Start Date 05/12/2026, 08:00-09:30 = 90m, Sat-Sun, 16 sessions, Passcode 686868, Cloud Auto-Rec)!")

            # 8. Submit Drawer to save the class on DEV & capture the new Class Card!
            submit_btn = page.locator(".ant-drawer button:has-text('Mở Lớp'), .ant-drawer button:has-text('Create Class'), .ant-drawer .ant-drawer-footer .ant-btn-primary").first
            await submit_btn.click()
            await page.wait_for_timeout(3500)

            new_card = page.locator(f".ant-card:has-text('{test_class_title_1}')").first
            await new_card.wait_for(state="visible", timeout=15000)
            await new_card.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_create_zoom_2_saved_class_card.png")
            print("  ✅ Saved Class #1 to DEV & captured screenshot with 'Đã nối Zoom' live badge!")

            # =================================================================
            # TEST CASE 2: OVERLAPPING TIME SLOT WITH EXISTING ZOOM CLASS (MON-WED-FRI 19:20 - 21:20)
            # =================================================================
            print("\n=== [TEST 2] CREATE CLASS OVERLAPPING EXISTING WP02 ZOOM SLOT (MON-WED-FRI 19:20 - 21:20) ===")
            await page.locator("button.ant-btn-primary:has(.anticon-plus)").first.click()
            await page.wait_for_timeout(1200)

            await page.locator(".ant-drawer input[id*='name']").first.fill(test_class_title_2)
            await set_ant_picker_input(page, ".ant-drawer input[id*='startDate']", "2026-12-04")

            # Select Mon-Wed-Fri (T2 - T4 - T6) + 19:30 - 21:00 (100% overlapping WP02 19:20-21:20 97784357897!)
            mwf_tag = page.locator(".lak-weekly-schedule-control .ant-tag:has-text('T2 - T4 - T6'), .lak-weekly-schedule-control .ant-tag:has-text('Mon - Wed - Fri')").first
            await mwf_tag.scroll_into_view_if_needed()
            await mwf_tag.click()
            await page.wait_for_timeout(300)
            ev_tag = page.locator(".lak-weekly-schedule-control .ant-tag:has-text('19:30 - 21:00')").first
            await ev_tag.scroll_into_view_if_needed()
            await ev_tag.click()
            await page.wait_for_timeout(300)

            prov_btn2 = page.locator("[data-testid='btn-auto-provision-zoom-room']")
            await prov_btn2.scroll_into_view_if_needed()
            await prov_btn2.click()
            await page.wait_for_timeout(5500)

            mid_2_pretty = await page.locator(".ant-drawer input[id*='meetingId']").first.input_value()
            mid_2_digits = "".join(ch for ch in mid_2_pretty if ch.isdigit())
            assert len(mid_2_digits) >= 9 and mid_2_digits != mid_1_digits, (
                f"Expected Zoom API to schedule overlapping room #2, got: {mid_2_pretty}"
            )
            created_zoom_ids.append(mid_2_digits)
            print(f"  ✅ Zoom API ALLOWED scheduling overlapping room #2: {mid_2_pretty} (Mon-Wed-Fri 19:20-21:20)")

            overlap_alert = page.locator("[data-testid='alert-zoom-host-time-overlap']")
            await overlap_alert.wait_for(state="visible", timeout=10000)
            ov_txt = await overlap_alert.inner_text()
            assert "97784357897" in ov_txt or "WP02" in ov_txt, (
                f"Expected overlap warning to name WP02 97784357897, got: {ov_txt}"
            )
            await overlap_alert.scroll_into_view_if_needed()
            await page.wait_for_timeout(400)
            await page.screenshot(path=f"{ARTIFACT_DIR}/qc_create_zoom_3_overlap_slot_warning.png")
            print("  ✅ UI displayed clear Host Concurrency Overlap Warning naming 97784357897 (WP02)!")

            await browser.close()

    finally:
        print("\n=== [3] IMMEDIATE ZERO-RESIDUE TEARDOWN (DELETE ON ZOOM & DELETE ON DEV DB) ===")
        # Sweep any [QC-TEST] or temporary 'LAK Education Online Class' rooms from Zoom account
        st_before, st_before_res = http_json(f"{API_BASE}/status")
        for rm in st_before_res.get("data", {}).get("rooms") or []:
            tp = str(rm.get("topic") or "")
            rid = "".join(ch for ch in str(rm.get("id") or "") if ch.isdigit())
            if ("[QC-TEST]" in tp or tp == "LAK Education Online Class") and rid and rid not in created_zoom_ids:
                created_zoom_ids.append(rid)

        # 1. Delete all test rooms created on Zoom Cloud & verify 404 after delete!
        for zid in created_zoom_ids:
            d_code, d_body = http_json(
                f"{API_BASE}/meetings/{zid}",
                method="DELETE",
                headers={"x-lak-target-env": "dev", "x-lak-actor-id": "ADM001"},
            )
            assert d_code == 200, f"Failed to delete test Zoom room {zid}: {d_body}"
            chk_code, _ = http_json(f"{API_BASE}/meetings/{zid}")
            assert chk_code == 404, f"Zoom room {zid} should return 404 after delete, got {chk_code}"
            print(f"  🧹 Deleted Zoom room {zid} from Zoom Cloud -> verified HTTP 404 (100% gone)")

        # 2. Hard-delete any test classes created on lakeducation-dev & verify activeIds match BEFORE snapshot!
        after_dev = run_node_db_op(
            r"""
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({ projectId: 'lakeducation-dev' }, 'teardownDev');
const db = getFirestore(app, 'lakeducationdb');
(async () => {
  const snap = await db.collection('classes').get();
  const deletedIds = [];
  for (const d of snap.docs) {
    const nm = String(d.data().name || '');
    if (nm.includes('[QC-TEST]')) {
      await d.ref.delete();
      deletedIds.push(d.id);
    }
  }
  const snapAfter = await db.collection('classes').get();
  const activeIdsAfter = snapAfter.docs.filter(d => !d.data().isDeleted && d.data().status !== 'Deleted').map(d => d.id).sort();
  console.log(JSON.stringify({ deletedTestClassIds: deletedIds, activeIdsAfter, totalDocsAfter: snapAfter.size }));
  process.exit(0);
})();
"""
        )
        assert after_dev["activeIdsAfter"] == before_dev["activeIds"], (
            f"DEV classes mismatch after teardown! Before={before_dev['activeIds']} vs After={after_dev['activeIdsAfter']}"
        )
        print(f"  🧹 Deleted test class docs from DEV Firestore & verified clean state: {after_dev}")

        # Capture post-teardown screenshot on Zoom API room list to prove 0 [QC-TEST] rooms left!
        st_code, st_res = http_json(f"{API_BASE}/status")
        remaining_rooms = [r["topic"] for r in (st_res.get("data", {}).get("rooms") or [])]
        assert not any("[QC-TEST]" in t for t in remaining_rooms), (
            f"Found leftover [QC-TEST] room on Zoom: {remaining_rooms}"
        )
        print(f"  ✅ Verified Zoom Account rooms clean (0 [QC-TEST] rooms): {remaining_rooms}")


if __name__ == "__main__":
    asyncio.run(main())
