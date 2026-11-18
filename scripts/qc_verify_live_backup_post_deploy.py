import asyncio
import sys
from playwright.async_api import async_playwright

BACKUP_URL = 'https://bk.lakeducation.edu.vn'
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def test_live_backup():
    print("=" * 80)
    print("🧪 KIỂM TOÁN HẬU DEPLOY TRÊN LIVE BACKUP: https://bk.lakeducation.edu.vn")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )
        ctx = await browser.new_context(viewport={'width': 1366, 'height': 850})
        page = await ctx.new_page()

        # 1. Kiểm tra Lớp học LH002 và Tab Đánh Giá trên live backup qua SSO
        target_url = f"{BACKUP_URL}/classroom/LH002?sso_uid=GV952"
        print(f"\n1. Mở trang: {target_url}")
        await page.goto(target_url, wait_until='domcontentloaded')
        await page.wait_for_timeout(3500)

        # Chuyển sang Tab 3: Đánh Giá
        print("2. Chuyển sang Tab Đánh Giá Sau Giờ...")
        tab_eval = page.locator('.ant-tabs-tab').filter(has_text='Đánh Giá Sau Giờ').or_(
            page.locator('.ant-tabs-tab').filter(has_text='Evaluation')
        ).first
        await tab_eval.click()
        await page.wait_for_timeout(2500)

        textarea = page.locator('textarea[data-testid^="eval-comment-"]').first
        assert await textarea.is_visible(), "FAIL: Không tìm thấy textarea đánh giá trên Live Backup!"

        live_text = "Thầy Maj nhận xét trên Live Backup: Em học rất tốt và phát âm chuẩn!"
        print(f"3. Gõ nhận xét: '{live_text}'")
        await textarea.click()
        await textarea.fill(live_text)

        # Kiểm tra sau 4 giây đồng hồ live
        print("4. Chờ 4 giây kiểm tra nhịp đập đồng hồ trên live backup...")
        for i in range(1, 5):
            await page.wait_for_timeout(1000)
            val = await textarea.input_value()
            print(f"   ⏳ Live {i}s: '{val}'")
            assert val == live_text, f"FAIL: Chữ bị mất trên Live tại giây {i}!"

        print("   ✅ [PASS] Chữ gõ phím được bảo toàn 100% trên Live Backup sau 4s!")
        await page.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/live_backup_typing_retention_pass.png")

        # 2. Kiểm tra phiên bản hiển thị dưới chân trang
        footer_el = page.locator("footer, .ant-layout-footer, div").filter(has_text="Version 1.2.").last
        if await footer_el.is_visible():
            footer_text = await footer_el.inner_text()
            print(f"5. Phiên bản chân trang: '{footer_text.strip()}'")

        await ctx.close()
        await browser.close()

    print("\n" + "=" * 80)
    print("🎉 KIỂM TOÁN HẬU DEPLOY TRÊN LIVE BACKUP ĐẠT 100% PERFECT PASS!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_live_backup())
    sys.exit(0)
