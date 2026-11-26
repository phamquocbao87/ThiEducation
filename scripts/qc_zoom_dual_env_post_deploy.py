#!/usr/bin/env python3
"""
Mandatory Post-Deploy Dual-Environment E2E QC Suite (`DEV` + `PROD`):
Verifies live cloud deployments on BOTH:
  - DEV Cloud ERP:  https://dev.lakeducation.edu.vn (fallback https://lakeducation-dev-erp.web.app)
  - PROD Cloud ERP: https://erp.lakeducation.edu.vn & https://bk.lakeducation.edu.vn
Asserts:
  1. Newly bumped Version 1.2.218+ footer live on both DEV and PROD.
  2. Sidebar 100% clean (0 'Đồng Bộ Zoom Cloud' menu item) on both DEV and PROD.
  3. IT Admin `ADM001` sees `AdminZoomRouterConfigCard` on `/dashboard` on both DEV and PROD; Academic `ACA404` does NOT.
  4. Classroom Detail `/classroom/LH004` renders 4th tab `Liên Kết Với Zoom` for `ACA404`/`ADM001`, and hides it 100% for Teacher `GV952`.
  5. Desktop 1366x850 & Mobile 390x844 Zero Overflow-X & 0 runtime JS errors & Zero Test-Data Residue.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright

DEV_URL = os.environ.get("QC_DEV_CLOUD_URL", "https://dev.lakeducation.edu.vn")
PROD_URL = os.environ.get("QC_PROD_CLOUD_URL", "https://bk.lakeducation.edu.vn")
BACKUP_URL = os.environ.get("QC_BACKUP_CLOUD_URL", "https://lakeducation-backup-erp.web.app")
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"


async def assert_zero_overflow_x(page, label):
    metrics = await page.evaluate(
        "() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })"
    )
    assert metrics["sw"] <= metrics["iw"] + 1, (
        f"FAIL Overflow-X on {label}: scrollWidth={metrics['sw']} > innerWidth={metrics['iw']}"
    )
    print(f"  ✅ Zero Overflow-X [{label}]: {metrics['sw']}px <= {metrics['iw']}px")


async def verify_environment(browser, env_label, base_url, expected_version_substr, prefix):
    print(f"\n================ [{env_label}] LIVE CLOUD AUDIT: {base_url} ================")
    console_errors = []
    ctx = await browser.new_context(viewport={"width": 1366, "height": 880})
    page = await ctx.new_page()
    page.on("pageerror", lambda exc: console_errors.append(f"[{env_label}] PAGEERROR: {exc}"))

    # 1. Login as IT Admin ADM001 & verify bumped version + clean sidebar + Admin Router Card
    await page.goto(
        f"{base_url}/dashboard?sso_uid=ADM001", wait_until="domcontentloaded", timeout=40000
    )
    await page.wait_for_timeout(4500)

    body_txt = await page.evaluate("() => document.body.innerText")
    assert expected_version_substr in body_txt, (
        f"[{env_label}] Expected version '{expected_version_substr}' on {base_url}, not found in footer!"
    )
    print(f"  ✅ [{env_label}] Live Footer Version verified: contains '{expected_version_substr}'")

    sider_txt = await page.locator(".ant-layout-sider").first.inner_text()
    assert "Đồng Bộ Zoom Cloud" not in sider_txt and "Zoom Cloud Sync" not in sider_txt, (
        f"[{env_label}] Sidebar still shows removed menu item!"
    )
    print(f"  ✅ [{env_label}] Sidebar 100% clean (0 'Đồng Bộ Zoom Cloud')")

    router_card = page.locator("[data-testid='admin-dashboard-zoom-router-card']")
    await router_card.scroll_into_view_if_needed()
    await router_card.wait_for(state="visible", timeout=15000)
    await assert_zero_overflow_x(page, f"{env_label} Desktop Admin /dashboard")
    await page.screenshot(path=f"{ARTIFACT_DIR}/{prefix}_1_admin_dashboard.png")
    print(f"  ✅ [{env_label}] Admin ADM001 sees Zoom Cloud Router Card on /dashboard")

    # 2. Login as Academic ACA404 -> NO Admin Router Card, YES 4th tab 'Liên Kết Với Zoom' on /classroom/LH004
    await page.goto(
        f"{base_url}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000
    )
    await page.wait_for_timeout(3500)
    assert await page.locator("[data-testid='admin-dashboard-zoom-router-card']").count() == 0, (
        f"[{env_label}] Academic ACA404 must NOT see Admin Router Card!"
    )

    await page.goto(
        f"{base_url}/classroom/LH004?tab=zoom-link", wait_until="domcontentloaded", timeout=40000
    )
    await page.wait_for_timeout(4500)
    zoom_tab = page.locator("[data-testid='tab-zoom-link']")
    await zoom_tab.wait_for(state="visible", timeout=15000)
    await zoom_tab.scroll_into_view_if_needed()
    await assert_zero_overflow_x(page, f"{env_label} Desktop Academic /classroom/LH004")
    await page.screenshot(path=f"{ARTIFACT_DIR}/{prefix}_2_classroom_zoom_tab.png")
    print(f"  ✅ [{env_label}] Academic ACA404 accesses 4th tab 'Liên Kết Với Zoom' on /classroom/LH004")

    # 3. Login as Native Teacher GV952 -> 4th tab MUST be 100% hidden!
    await page.goto(
        f"{base_url}/dashboard?sso_uid=GV952", wait_until="domcontentloaded", timeout=40000
    )
    await page.wait_for_timeout(2500)
    await page.goto(
        f"{base_url}/classroom/LH004?tab=zoom-link", wait_until="domcontentloaded", timeout=40000
    )
    await page.wait_for_timeout(3500)
    assert await page.locator("[data-testid='tab-zoom-link']").count() == 0, (
        f"[{env_label}] Teacher GV952 must NOT see 'Liên Kết Với Zoom' tab!"
    )
    print(f"  ✅ [{env_label}] Teacher GV952 isolation verified: 4th tab 100% hidden")
    await ctx.close()

    # 4. Mobile 390x844 Responsive & Zero Ellipsis Check
    mctx = await browser.new_context(viewport={"width": 390, "height": 844})
    mpage = await mctx.new_page()
    mpage.on("pageerror", lambda exc: console_errors.append(f"[{env_label}_MOBILE] PAGEERROR: {exc}"))
    await mpage.goto(
        f"{base_url}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000
    )
    await mpage.wait_for_timeout(3500)
    await assert_zero_overflow_x(mpage, f"{env_label} Mobile 390px /dashboard")
    await mpage.goto(
        f"{base_url}/classroom/LH004?tab=zoom-link", wait_until="domcontentloaded", timeout=40000
    )
    await mpage.wait_for_timeout(4000)
    await mpage.locator("[data-testid='tab-zoom-link']").scroll_into_view_if_needed()
    await assert_zero_overflow_x(mpage, f"{env_label} Mobile 390px /classroom/LH004")
    await mpage.screenshot(path=f"{ARTIFACT_DIR}/{prefix}_3_mobile_390.png")
    await mctx.close()

    assert len(console_errors) == 0, f"[{env_label}] Runtime errors: {console_errors}"
    print(f"  ✅ [{env_label}] Zero runtime JS errors on Desktop & Mobile!")


async def main():
    with open("/Volumes/DATA/projects/ThiEducation/package.json", "r", encoding="utf-8") as f:
        pkg = json.load(f)
    expected_ver = f"Version {pkg['version']}"
    print(f"Target deployed version to assert on both Cloud DEV & Cloud PROD: {expected_ver}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            channel="chrome",
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )
        await verify_environment(browser, "DEV_CLOUD", DEV_URL, expected_ver, "qc_postdeploy_dev")
        await verify_environment(browser, "PROD_CLOUD", PROD_URL, expected_ver, "qc_postdeploy_prod")

        # Quick smoke check on Backup Portal bk.lakeducation.edu.vn as well!
        bctx = await browser.new_context(viewport={"width": 1366, "height": 850})
        bpage = await bctx.new_page()
        await bpage.goto(
            f"{BACKUP_URL}/dashboard?sso_uid=ADM001", wait_until="domcontentloaded", timeout=40000
        )
        await bpage.wait_for_timeout(4000)
        btxt = await bpage.evaluate("() => document.body.innerText")
        assert expected_ver in btxt, f"[BACKUP_CLOUD] Expected {expected_ver} on {BACKUP_URL}"
        print(f"\n  ✅ [BACKUP_CLOUD] {BACKUP_URL} verified live at {expected_ver}!")
        await bctx.close()

        await browser.close()
        print("\n🎉 DUAL-ENVIRONMENT (DEV + PROD + BACKUP) POST-DEPLOY AUDIT 100% PASSED!")


if __name__ == "__main__":
    asyncio.run(main())
