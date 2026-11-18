import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new"]
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 850})
        
        # 1. Thử mở không có sso_uid
        await page.goto("http://127.0.0.1:3000/class-attendance-evaluation", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        url1 = page.url
        title1 = await page.locator("h3").first.inner_text()
        rows1 = await page.locator(".ant-table-tbody tr").all_inner_texts()
        print("=== 1. DEFAULT USER ===")
        print("URL:", url1)
        print("Title:", title1)
        print("Rows count:", len(rows1))
        for r in rows1:
            print("  Row:", r.replace('\n', ' | '))

        # 2. Thử với HV001
        await page.goto("http://127.0.0.1:3000/class-attendance-evaluation?sso_uid=HV001", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        title2 = await page.locator("h3").first.inner_text()
        rows2 = await page.locator(".ant-table-tbody tr").all_inner_texts()
        print("\n=== 2. HV001 ===")
        print("Title:", title2)
        print("Rows count:", len(rows2))
        for r in rows2:
            print("  Row:", r.replace('\n', ' | '))

        # 3. Thử với HV768 (Kenji)
        await page.goto("http://127.0.0.1:3000/class-attendance-evaluation?sso_uid=HV768", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        title3 = await page.locator("h3").first.inner_text()
        rows3 = await page.locator(".ant-table-tbody tr").all_inner_texts()
        print("\n=== 3. HV768 (Kenji) ===")
        print("Title:", title3)
        print("Rows count:", len(rows3))
        for r in rows3:
            print("  Row:", r.replace('\n', ' | '))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(check())
