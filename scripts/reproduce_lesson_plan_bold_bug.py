import asyncio
import sys
from playwright.async_api import async_playwright

LOCAL_URL = 'http://127.0.0.1:3000'
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def test_reproduce_bold_bug():
    print("=" * 80)
    print("🧪 REPRODUCE BUG: BẤM NÚT IN ĐẬM BỊ CHỒNG DẤU ** LIÊN TỤC TRÊN LESSON PLAN")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )
        ctx = await browser.new_context(viewport={'width': 1366, 'height': 850})
        page = await ctx.new_page()

        # 1. Mở trang lớp học LH002 với tài khoản Teacher Maj
        url = f"{LOCAL_URL}/classroom/LH002?sso_uid=GV952"
        print(f"1. Mở trang: {url}")
        await page.goto(url, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)

        # 2. Chuyển sang Tab Soạn Giáo Án & Học Liệu
        print("2. Chuyển sang Tab Soạn Giáo Án & Học Liệu...")
        tab_curriculum = page.locator('[data-testid="tab-curriculum"]')
        await tab_curriculum.click()
        await page.wait_for_timeout(2000)

        # 3. Bấm nút Mở Modal Soạn Giáo Án
        print("3. Bấm nút Mở Modal Soạn Giáo Án...")
        btn_open = page.locator('[data-testid="btn-open-lesson-editor"]')
        await btn_open.click()
        await page.wait_for_timeout(1500)

        # 4. Tìm textarea của SimpleObjectivesEditor
        textarea = page.locator('[data-testid="lesson-objectives-editor-textarea"]')
        assert await textarea.is_visible(), "FAIL: Không tìm thấy textarea soạn giáo án!"
        print("   ✅ Modal Soạn Giáo Án đã mở, tìm thấy textarea!")

        # 5. Điền văn bản mẫu: 'Shared Read, T8-T11'
        sample_text = "Shared Read, T8-T11"
        await textarea.fill(sample_text)
        print(f"4. Điền văn bản: '{sample_text}'")

        # 6. Chọn toàn bộ văn bản trong textarea
        btn_bold = page.locator('[data-testid="btn-toolbar-bold"]')
        assert await btn_bold.is_visible(), "FAIL: Không tìm thấy nút Bold!"

        # Lần 1: Chọn bôi đen và bấm Bold
        print("\n--- [LẦN 1] Bôi đen và bấm nút In Đậm (Bold) ---")
        await textarea.evaluate("el => el.setSelectionRange(0, el.value.length)")
        await btn_bold.click()
        await page.wait_for_timeout(500)
        val_1 = await textarea.input_value()
        print(f"   Giá trị sau lần bấm 1: '{val_1}'")

        # Lần 2: Chọn bôi đen lại và bấm Bold tiếp
        print("\n--- [LẦN 2] Bôi đen lại và bấm nút In Đậm lần 2 ---")
        await textarea.evaluate("el => el.setSelectionRange(0, el.value.length)")
        await btn_bold.click()
        await page.wait_for_timeout(500)
        val_2 = await textarea.input_value()
        print(f"   Giá trị sau lần bấm 2: '{val_2}'")

        # Lần 3: Chọn bôi đen lại và bấm Bold tiếp
        print("\n--- [LẦN 3] Bôi đen lại và bấm nút In Đậm lần 3 ---")
        await textarea.evaluate("el => el.setSelectionRange(0, el.value.length)")
        await btn_bold.click()
        await page.wait_for_timeout(500)
        val_3 = await textarea.input_value()
        print(f"   Giá trị sau lần bấm 3: '{val_3}'")

        # Chụp ảnh minh chứng
        screenshot_path = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/reproduce_lesson_plan_bold_bug.png"
        await page.screenshot(path=screenshot_path)
        print(f"\n📸 Đã chụp ảnh minh chứng lưu tại: {screenshot_path}")

        print("\n" + "=" * 80)
        if val_3.count("**") >= 3:
            print("🚨 TÁI HIỆN THÀNH CÔNG 100% BUG:")
            print(f"   Ban đầu : '{sample_text}'")
            print(f"   Lần 1   : '{val_1}'")
            print(f"   Lần 2   : '{val_2}'")
            print(f"   Lần 3   : '{val_3}'")
            print("   -> Bị chồng chất dấu ** liên tiếp (Markdown giả lập trong textarea thô)!")
            print("   -> Người dùng không thấy chữ in đậm trực tiếp (WYSIWYG) mà chỉ thấy các dấu sao rác!")
        print("=" * 80)

        await ctx.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_reproduce_bold_bug())
    sys.exit(0)
