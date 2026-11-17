import asyncio
import sys
from playwright.async_api import async_playwright

LOCAL_URL = 'http://127.0.0.1:3000'
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def test_reproduce():
    print("=" * 80)
    print("🧪 REPRODUCE BUG: GÕ FEEDBACK XONG MẤT CHỮ TRÊN EVALUATION EDITOR")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )
        ctx = await browser.new_context(viewport={'width': 1366, 'height': 850})
        page = await ctx.new_page()

        # Vào lớp LH002 của Teacher Maj (như trong ảnh Sếp Bảo gửi)
        url = f"{LOCAL_URL}/classroom/LH002?sso_uid=GV952"
        print(f"1. Mở trang: {url}")
        await page.goto(url, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)

        # Chuyển sang Tab Đánh Giá
        print("2. Chuyển sang Tab Đánh Giá Sau Giờ...")
        tab_eval = page.locator('.ant-tabs-tab').filter(has_text='Đánh Giá Sau Giờ').or_(
            page.locator('.ant-tabs-tab').filter(has_text='Evaluation')
        ).first
        await tab_eval.click()
        await page.wait_for_timeout(2000)

        # Tìm textarea đầu tiên trong bảng đánh giá
        textarea = page.locator('textarea[data-testid^="eval-comment-"]').first
        assert await textarea.is_visible(), "FAIL: Không tìm thấy textarea đánh giá!"

        # Chụp ảnh ban đầu
        await page.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/reproduce_01_initial.png")

        # Gõ văn bản vào textarea
        test_text = "Thầy Maj nhận xét: Em Tracy học rất tốt và phát âm rõ ràng!"
        print(f"3. Gõ văn bản: '{test_text}'")
        await textarea.click()
        await textarea.fill(test_text)

        # Lấy giá trị ngay lập tức sau khi gõ
        val_immediate = await textarea.input_value()
        print(f"   Giá trị ngay sau khi gõ (t=0s): '{val_immediate}'")

        # Chụp ảnh ngay sau khi gõ
        await page.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/reproduce_02_typed.png")

        # Chờ 3 giây xem đồng hồ tick và trigger re-render / mất chữ
        print("4. Chờ 3 giây để kiểm tra đồng hồ và re-render...")
        for i in range(1, 4):
            await page.wait_for_timeout(1000)
            val_current = await textarea.input_value()
            print(f"   Giá trị sau {i} giây: '{val_current}'")

        val_after_3s = await textarea.input_value()
        await page.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/reproduce_03_after_3s.png")

        print("=" * 80)
        if val_after_3s != test_text:
            print(f"🚨 TÁI HIỆN THÀNH CÔNG BUG (BUG CONFIRMED)!")
            print(f"   Văn bản gõ ban đầu: '{test_text}'")
            print(f"   Văn bản sau 3 giây : '{val_after_3s}'")
        else:
            print("Chưa thấy mất chữ trong 3 giây. Thử test sâu hơn...")
        print("=" * 80)

        await ctx.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_reproduce())
    sys.exit(0)
