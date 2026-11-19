import asyncio
import os
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

ROLES_TO_SCAN = [
    {"role": "teacher", "uid": "TEA202", "name": "Giáo Viên Bản Xứ (Teacher Michael)"},
    {"role": "academic", "uid": "ACA101", "name": "Giáo Vụ Đào Tạo (Academic Coordinator)"},
    {"role": "director", "uid": "DIR505", "name": "Giám Đốc Điều Hành (Phạm Hiếu Thi)"},
    {"role": "student", "uid": "HV768", "name": "Học Viên Tiêu Biểu (HV768 Kenji)"},
    {"role": "admin", "uid": "ADM001", "name": "IT Quản Trị (Phạm Quốc Bảo)"},
    {"role": "accountant", "uid": "ACC330", "name": "Kế Toán Trưởng (Lê Thị Mỹ Dung)"},
]

async def scan_dashboards():
    print("=" * 80)
    print("🔍 PHÒNG QC & IT: SCAN TOÀN DIỆN DASHBOARD CÁC ROLES ĐỂ ĐÁNH GIÁ UI / UX")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        for item in ROLES_TO_SCAN:
            role = item["role"]
            uid = item["uid"]
            role_name = item["name"]
            print(f"\n--- Scanning Role: {role_name} (sso_uid={uid}) ---")

            # 1. Desktop 1366x768
            context = await browser.new_context(viewport={"width": 1366, "height": 800})
            page = await context.new_page()

            url = f"http://127.0.0.1:3000/dashboard?sso_uid={uid}"
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)

            # Check overflow-x
            scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
            inner_width = await page.evaluate("() => window.innerWidth")
            print(f"  [Desktop] scrollWidth: {scroll_width} vs innerWidth: {inner_width}")

            desktop_shot = os.path.join(ARTIFACTS_DIR, f"scan_dashboard_{role}_desktop.png")
            await page.screenshot(path=desktop_shot, full_page=True)
            print(f"  📸 Desktop Screenshot: {desktop_shot}")

            # 2. Mobile 390x844
            await page.set_viewport_size({"width": 390, "height": 844})
            await page.wait_for_timeout(1000)

            scroll_width_m = await page.evaluate("() => document.documentElement.scrollWidth")
            inner_width_m = await page.evaluate("() => window.innerWidth")
            print(f"  [Mobile 390] scrollWidth: {scroll_width_m} vs innerWidth: {inner_width_m}")

            mobile_shot = os.path.join(ARTIFACTS_DIR, f"scan_dashboard_{role}_mobile.png")
            await page.screenshot(path=mobile_shot, full_page=True)
            print(f"  📸 Mobile Screenshot: {mobile_shot}")

            await context.close()

        await browser.close()
    print("\n✅ Hoàn thành quét tất cả các vai trò!")

if __name__ == "__main__":
    asyncio.run(scan_dashboards())
