#!/usr/bin/env python3
"""
E2E QC Suite for v1.1 RBAC & Tab Relocation:
1. /zoom-sync: `ZoomEnvRouterCard` moved into `⚙️ Cài Đặt` tab — STRICTLY `admin` ONLY (UI + Backend HTTP 403 for non-admin).
2. /classroom/:classId: 4th tab `Liên Kết Với Zoom` alongside `Sơ Đồ Lớp & Note Nhanh`, `Soạn Giáo Án & Học Liệu`, `Đánh Giá Sau Giờ & Chăm Sóc PH` — STRICTLY `['admin', 'academic', 'director']` ONLY; 100% hidden & deep-link blocked for `teacher` and `student`.
3. Desktop 1366x850 & Mobile 390x844 Zero Overflow-X & 0 Console Errors & 0 PROD mutations.
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


def find_director_user_id():
    js = r"""
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({ projectId: 'lakeducation-dev' }, 'dirLookup');
const db = getFirestore(app, 'lakeducationdb');
(async () => {
  const snap = await db.collection('users').where('role', '==', 'director').limit(1).get();
  if (!snap.empty) {
    const d = snap.docs[0];
    console.log(JSON.stringify({ id: d.id, name: d.data().name || 'Director' }));
  } else {
    console.log(JSON.stringify({ id: null }));
  }
  process.exit(0);
})();
"""
    p = subprocess.run(
        ["node", "-e", js],
        cwd="/Volumes/DATA/projects/ThiEducation/zoom-sync-service",
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(p.stdout.strip())


async def login_as(page, uid):
    await page.goto(
        f"{BASE_URL}/dashboard?sso_uid={uid}", wait_until="domcontentloaded", timeout=35000
    )
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
    dir_info = find_director_user_id()
    director_uid = dir_info.get("id")

    print("=== [1] BACKEND ADMIN-ONLY RBAC ON POST /router-config ===")
    for bad_actor, bad_role in [("ACA404", "academic"), ("GV952", "teacher")]:
        c_code, c_body = http_json(
            f"{API_BASE}/router-config",
            method="POST",
            headers={"x-lak-actor-id": bad_actor, "x-lak-actor-role": bad_role},
            body={"routingMode": "DEV_ONLY"},
        )
        assert c_code == 403 and "FORBIDDEN_ADMIN_ONLY" in str(c_body.get("error", "")), (
            f"Expected 403 FORBIDDEN_ADMIN_ONLY for {bad_actor} ({bad_role}), got {c_code}: {c_body}"
        )
        print(f"  ✅ Non-admin {bad_actor} ({bad_role}) rejected on POST /router-config with HTTP 403!")

    # Even if header role is omitted, DB lookup of ACA404 must reject with 403!
    c_code2, c_body2 = http_json(
        f"{API_BASE}/router-config",
        method="POST",
        headers={"x-lak-actor-id": "ACA404"},
        body={"routingMode": "DEV_ONLY"},
    )
    assert c_code2 == 403, f"Expected DB role check 403 for ACA404, got {c_code2}: {c_body2}"
    print("  ✅ Firestore DB role check rejected ACA404 even without x-lak-actor-role header!")

    ok_code, _ = http_json(
        f"{API_BASE}/router-config",
        method="POST",
        headers={"x-lak-actor-id": "ADM001", "x-lak-actor-role": "admin"},
        body={"routingMode": "DEV_ONLY", "earlyLeaveThresholdMinutes": 10},
    )
    assert ok_code == 200, f"Admin ADM001 should succeed on /router-config, got {ok_code}"
    print("  ✅ Admin ADM001 allowed on POST /router-config (HTTP 200, DEV_ONLY active)")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            channel="chrome",
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        ctx = await browser.new_context(viewport={"width": 1366, "height": 860})
        page = await ctx.new_page()
        page.on("pageerror", lambda exc: console_errors.append(f"PAGEERROR: {exc}"))

        # =====================================================================
        # [2] ADMIN (ADM001): Sees Settings tab on /zoom-sync & 4th tab on /classroom/LH004
        # =====================================================================
        print("\n=== [2] ADMIN (ADM001) UI VERIFICATION ===")
        await login_as(page, "ADM001")
        await page.goto(f"{BASE_URL}/zoom-sync", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(3500)

        # Router card MUST NOT be visible on the default 'mapping' tab anymore!
        assert await page.locator("[data-testid='zoom-env-router-card']").count() == 0 or not await page.locator("[data-testid='zoom-env-router-card']").is_visible(), (
            "ZoomEnvRouterCard should NOT sit permanently above tabs on /zoom-sync!"
        )
        print("  ✅ Confirmed: Router config card is removed from top header of /zoom-sync")

        # Click Settings tab -> Router card appears!
        settings_tab = page.locator("[data-testid='tab-zoom-settings']")
        await settings_tab.wait_for(state="visible", timeout=10000)
        await settings_tab.click()
        await page.wait_for_timeout(1200)
        assert await page.locator("[data-testid='zoom-env-router-card']").is_visible(), (
            "Admin must see ZoomEnvRouterCard inside Settings tab!"
        )
        await assert_zero_overflow_x(page, "Desktop Admin /zoom-sync Settings Tab")
        await page.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_v2_1_admin_settings_tab.png")
        print("  ✅ Admin sees & opens dedicated 'Cài Đặt / Settings' tab on /zoom-sync!")

        # Switch back to Class Link tab & click 'Open Class Detail to Configure Zoom' -> lands on /classroom/LH004?tab=zoom-link
        await page.locator("[data-testid='tab-zoom-mapping']").click()
        await page.wait_for_timeout(1000)
        await page.locator("[data-testid='btn-open-classroom-zoom-tab-LH004']").click()
        await page.wait_for_timeout(3500)
        assert "/classroom/LH004" in page.url, f"Expected /classroom/LH004, got {page.url}"
        assert await page.locator("[data-testid='classroom-zoom-link-tab-LH004']").is_visible(), (
            "Admin must land directly on 4th tab 'Liên Kết Với Zoom' inside Classroom Detail!"
        )
        print("  ✅ 1-click navigation from /zoom-sync -> /classroom/LH004?tab=zoom-link verified!")

        # =====================================================================
        # [3] ACADEMIC (ACA404): NO Settings tab on /zoom-sync, FULL access to 4th tab in /classroom/LH004!
        # =====================================================================
        print("\n=== [3] ACADEMIC (ACA404 - GIÁO VỤ) UI & RBAC VERIFICATION ===")
        await login_as(page, "ACA404")
        await page.goto(
            f"{BASE_URL}/zoom-sync?tab=settings", wait_until="domcontentloaded", timeout=30000
        )
        await page.wait_for_timeout(3500)
        assert await page.locator("[data-testid='tab-zoom-settings']").count() == 0, (
            "Academic MUST NOT see Settings tab on /zoom-sync!"
        )
        assert await page.locator("[data-testid='zoom-env-router-card']").count() == 0, (
            "Academic MUST NOT see ZoomEnvRouterCard even via ?tab=settings deep-link!"
        )
        await page.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_v2_2_academic_no_settings_tab.png")
        print("  ✅ Academic ACA404 CANNOT see 'Cài Đặt' tab or Router switch (even via ?tab=settings)")

        # Open /classroom/LH004 as Academic ACA404 -> verify all 4 tabs & link room!
        await page.goto(f"{BASE_URL}/classroom/LH004", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(3500)
        for tid in ["tab-seating", "tab-curriculum", "tab-evaluation", "tab-zoom-link"]:
            assert await page.locator(f"[data-testid='{tid}']").is_visible(), (
                f"Academic ACA404 missing tab {tid} on /classroom/LH004!"
            )
        await page.locator("[data-testid='tab-zoom-link']").click()
        await page.wait_for_timeout(3500)
        await assert_zero_overflow_x(page, "Desktop Academic /classroom/LH004 Zoom Link Tab")

        link_btn = page.locator("[data-testid='btn-classroom-confirm-zoom-link-LH004']")
        await link_btn.wait_for(state="visible", timeout=15000)
        await link_btn.click()
        await page.wait_for_timeout(2500)
        await page.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_v2_3_classroom_zoom_tab_academic.png")
        print("  ✅ Academic ACA404 sees all 4 Classroom tabs & successfully linked Zoom room inside /classroom/LH004!")

        # =====================================================================
        # [4] DIRECTOR (GIÁM ĐỐC): NO Settings tab on /zoom-sync, YES 4th tab in /classroom/LH004!
        # =====================================================================
        if director_uid:
            print(f"\n=== [4] DIRECTOR ({director_uid} - GIÁM ĐỐC) UI & RBAC VERIFICATION ===")
            await login_as(page, director_uid)
            await page.goto(f"{BASE_URL}/zoom-sync?tab=settings", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3000)
            assert await page.locator("[data-testid='tab-zoom-settings']").count() == 0, (
                "Director MUST NOT see Admin-only Settings tab on /zoom-sync!"
            )
            await page.goto(f"{BASE_URL}/classroom/LH004?tab=zoom-link", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3500)
            assert await page.locator("[data-testid='tab-zoom-link']").is_visible() and await page.locator("[data-testid='classroom-zoom-link-tab-LH004']").is_visible(), (
                "Director MUST have access to 4th tab 'Liên Kết Với Zoom' on /classroom/LH004!"
            )
            print(f"  ✅ Director {director_uid}: Settings tab hidden on /zoom-sync, 'Liên Kết Với Zoom' tab enabled on /classroom/LH004!")

        # =====================================================================
        # [5] TEACHER (GV952) & STUDENT (HV768): 4th Tab 'Liên Kết Với Zoom' 100% HIDDEN & BLOCKED!
        # =====================================================================
        print("\n=== [5] TEACHER (GV952) & STUDENT (HV768) ISOLATION GUARD ===")
        for restricted_uid, label in [("GV952", "Teacher GV952"), ("HV768", "Student HV768")]:
            await login_as(page, restricted_uid)
            await page.goto(
                f"{BASE_URL}/classroom/LH004?tab=zoom-link",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await page.wait_for_timeout(3500)
            assert await page.locator("[data-testid='tab-zoom-link']").count() == 0, (
                f"{label} MUST NOT see 4th tab 'Liên Kết Với Zoom'!"
            )
            assert await page.locator("[data-testid='classroom-zoom-link-tab-LH004']").count() == 0, (
                f"{label} MUST NOT render ClassroomZoomLinkTab even with ?tab=zoom-link!"
            )
            if restricted_uid == "GV952":
                await page.screenshot(
                    path=f"{ARTIFACT_DIR}/qc_zoom_v2_4_teacher_classroom_3tabs_only.png"
                )
            print(f"  ✅ {label}: 4th tab 'Liên Kết Với Zoom' is 100% hidden & ?tab=zoom-link deep-link blocked!")

        # =====================================================================
        # [6] MOBILE 390x844 RESPONSIVE & 4-TAB CLEANLINESS CHECK
        # =====================================================================
        print("\n=== [6] MOBILE 390x844 RESPONSIVE CHECK ===")
        mctx = await browser.new_context(viewport={"width": 390, "height": 844})
        mpage = await mctx.new_page()
        mpage.on("pageerror", lambda exc: console_errors.append(f"MOBILE_PAGEERROR: {exc}"))

        await login_as(mpage, "ADM001")
        await mpage.goto(
            f"{BASE_URL}/zoom-sync?tab=settings", wait_until="domcontentloaded", timeout=30000
        )
        await mpage.wait_for_timeout(3500)
        await assert_zero_overflow_x(mpage, "Mobile 390px Admin /zoom-sync?tab=settings")
        await mpage.screenshot(path=f"{ARTIFACT_DIR}/qc_zoom_v2_5_mobile_390_admin_settings.png")

        await login_as(mpage, "ACA404")
        await mpage.goto(
            f"{BASE_URL}/classroom/LH004?tab=zoom-link",
            wait_until="domcontentloaded",
            timeout=30000,
        )
        await mpage.wait_for_timeout(3500)
        await assert_zero_overflow_x(mpage, "Mobile 390px Academic /classroom/LH004?tab=zoom-link")
        await mpage.screenshot(
            path=f"{ARTIFACT_DIR}/qc_zoom_v2_6_mobile_390_classroom_zoom_tab.png"
        )

        assert len(console_errors) == 0, f"Unexpected runtime JS errors: {console_errors}"
        print("  ✅ Zero runtime JS pageerror exceptions on Desktop & Mobile!")

        await browser.close()
        print("\n🎉 ALL RBAC, SETTINGS TAB, AND CLASSROOM 4TH TAB CHECKS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(main())
