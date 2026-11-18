import asyncio
import os
import sys
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def run_qc_wysiwyg_test():
    print("=" * 70)
    print("🚀 BẮT ĐẦU PHÒNG QC KIỂM THỬ E2E: TIPTAP WYSIWYG EDITORS & B-I-U TOOLBAR")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # -------------------------------------------------------------
        # TEST 1: KIỂM THỬ LESSON PLAN OBJECTIVES WYSIWYG (LH002)
        # -------------------------------------------------------------
        url = "http://127.0.0.1:3000/classroom/LH002?sso_uid=GV952"
        print(f"\n[TEST 1] 1. Truy cập lớp học: {url}")
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        print("[TEST 1] 2. Chuyển sang Tab 2: Soạn Giáo Án & Học Liệu...")
        tab_curriculum = page.locator('[data-testid="tab-curriculum"]')
        await tab_curriculum.click()
        await page.wait_for_timeout(1500)

        print("[TEST 1] 3. Mở Modal Soạn Giáo Án (Session 2)...")
        btn_open = page.locator('[data-testid="btn-open-lesson-editor"]')
        await btn_open.click()
        await page.wait_for_timeout(1500)

        # Định vị ô soạn thảo TipTap
        editor_locator = page.locator('[data-testid="lesson-objectives-editor-textarea"]')
        assert await editor_locator.is_visible(), "FAIL: Không tìm thấy ô soạn thảo Objectives TipTap!"
        print("   ✅ Tìm thấy ô soạn thảo TipTap Objectives thành công.")

        # Xóa nội dung cũ bằng nút Clear nếu có
        btn_clear = page.locator('[data-testid="btn-toolbar-clear"]')
        if await btn_clear.is_visible():
            await btn_clear.click()
            await page.wait_for_timeout(500)

        # Gõ văn bản test
        test_line = "Shared Read, T8-T11"
        print(f"[TEST 1] 4. Nhập văn bản: '{test_line}'")
        await editor_locator.click()
        await page.keyboard.type(test_line)
        await page.wait_for_timeout(500)

        # Bôi đen toàn bộ dòng vừa gõ
        print("[TEST 1] 5. Bôi đen toàn bộ văn bản (Meta+A / Ctrl+A)...")
        await page.keyboard.press("Meta+A" if sys.platform == "darwin" else "Control+A")
        await page.wait_for_timeout(300)

        # Bấm nút In Đậm [B] lần 1
        print("[TEST 1] 6. Bấm nút In Đậm [B] lần 1...")
        btn_bold = page.locator('[data-testid="btn-toolbar-bold"]')
        await btn_bold.click()
        await page.wait_for_timeout(500)

        # Lấy HTML bên trong editor
        html_val = await editor_locator.inner_html()
        print(f"   HTML sau khi bấm [B] lần 1: {html_val}")
        assert "<strong>" in html_val or "<b>" in html_val, f"FAIL: Không tìm thấy thẻ strong/b! HTML: {html_val}"
        assert "**" not in html_val, f"FAIL: Vẫn còn dấu sao ** trong HTML! HTML: {html_val}"
        print("   ✅ Đã in đậm trực tiếp (thẻ <strong>), TUYỆT ĐỐI KHÔNG CÓ DẤU **!")

        # Bấm nút Gạch Chân [U] (Sếp Bảo request!)
        print("[TEST 1] 7. Bấm nút Gạch Chân [U]...")
        btn_underline = page.locator('[data-testid="btn-toolbar-underline"]')
        assert await btn_underline.is_visible(), "FAIL: Không tìm thấy nút Underline [U]!"
        await btn_underline.click()
        await page.wait_for_timeout(500)

        html_val2 = await editor_locator.inner_html()
        print(f"   HTML sau khi bấm [U]: {html_val2}")
        assert "<u>" in html_val2, f"FAIL: Không tìm thấy thẻ u (Underline)! HTML: {html_val2}"
        print("   ✅ Đã gạch chân trực tiếp (thẻ <u>) thành công!")

        # Bấm nút In Đậm [B] lần 2 để Toggle tắt in đậm
        print("[TEST 1] 8. Bấm nút In Đậm [B] lần 2 (Toggle hủy in đậm)...")
        await btn_bold.click()
        await page.wait_for_timeout(500)
        html_val3 = await editor_locator.inner_html()
        print(f"   HTML sau khi bấm [B] lần 2: {html_val3}")
        assert "<strong>" not in html_val3, f"FAIL: Thẻ strong vẫn còn sau khi toggle! HTML: {html_val3}"
        print("   ✅ Toggle in đậm hoạt động chuẩn xác!")

        # Bấm nút snippet 🎯 Question
        print("[TEST 1] 9. Bấm chèn snippet 🎯 Question...")
        btn_snippet_q = page.locator('[data-testid="btn-snippet-0"]')
        await btn_snippet_q.click()
        await page.wait_for_timeout(500)
        html_val4 = await editor_locator.inner_html()
        print(f"   HTML sau khi chèn snippet: {html_val4}")
        assert "Essential Question" in html_val4, "FAIL: Snippet không được chèn vào editor!"
        print("   ✅ Nút phím tắt 1-chạm McGraw-Hill Wonders chèn thành công!")

        # Chụp ảnh minh chứng modal soạn giáo án
        screenshot_path1 = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_wysiwyg_lesson_plan_pass.png"
        await page.screenshot(path=screenshot_path1)
        print(f"   📸 Đã chụp ảnh minh chứng: {screenshot_path1}")

        # Đóng modal soạn giáo án
        btn_cancel_plan = page.locator('.ant-modal-footer button').filter(has_text='Hủy').or_(
            page.locator('.ant-modal-footer button').filter(has_text='Cancel')
        ).first
        await btn_cancel_plan.click()
        await page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # TEST 2: KIỂM THỬ SESSION EVALUATION EDITOR WYSIWYG
        # -------------------------------------------------------------
        print("\n[TEST 2] 1. Chuyển sang Tab 3: Đánh Giá Sau Giờ...")
        tab_eval = page.locator('[data-testid="tab-evaluation"]')
        await tab_eval.click()
        await page.wait_for_timeout(2000)

        # Chọn Buổi 1 (Quá khứ / Đánh giá bù) để mở khóa quyền đánh giá canEvaluate = True (đúng như Hình 1 của Sếp Bảo)
        select_session = page.locator('[data-testid="select-retroactive-session"]')
        if await select_session.is_visible():
            print("   Chọn Buổi 1 (Retroactive Session 1) để mở khóa form đánh giá...")
            await select_session.click()
            await page.wait_for_timeout(500)
            opt_past = page.locator('.ant-select-item-option').filter(has_text='Session 1').or_(
                page.locator('.ant-select-item-option').filter(has_text='Buổi 1')
            ).first
            if await opt_past.is_visible():
                await opt_past.click()
                await page.wait_for_timeout(2000)

        eval_editor = page.locator('[data-testid^="eval-comment-"]').first
        assert await eval_editor.is_visible(), "FAIL: Không tìm thấy ô nhận xét đánh giá TipTap!"
        print("   ✅ Tìm thấy ô nhận xét đánh giá TipTap.")

        print("[TEST 2] 2. Nhập nhận xét đánh giá...")
        eval_test_text = "Good pronunciation and active interaction."
        await eval_editor.click()
        # Xóa nếu có
        await page.keyboard.press("Meta+A" if sys.platform == "darwin" else "Control+A")
        await page.keyboard.type(eval_test_text)
        await page.wait_for_timeout(500)

        # Bôi đen và in đậm
        await page.keyboard.press("Meta+A" if sys.platform == "darwin" else "Control+A")
        await page.wait_for_timeout(300)

        btn_eval_bold = page.locator('[data-testid="btn-eval-bold"]').first
        await btn_eval_bold.click()
        await page.wait_for_timeout(500)

        eval_html = await eval_editor.inner_html()
        print(f"   HTML nhận xét sau khi bấm [B]: {eval_html}")
        assert "<strong>" in eval_html or "<b>" in eval_html, f"FAIL: Nhận xét không có strong! HTML: {eval_html}"
        assert "**" not in eval_html, f"FAIL: Vẫn còn dấu sao ** trong nhận xét! HTML: {eval_html}"
        print("   ✅ Nhận xét giáo viên đã in đậm trực tiếp (WYSIWYG) chuẩn 100%!")

        # Kiểm tra thử thách dừng tay gõ phím 4 giây chống mất chữ (Typing Retention Guard)
        print("[TEST 2] 3. Thử thách dừng gõ 4 giây (chống mất chữ qua 4 nhịp clock)...")
        for i in range(1, 5):
            await page.wait_for_timeout(1000)
            text_step = await eval_editor.inner_text()
            print(f"   ⏳ Sau {i}s: '{text_step}'")
            assert "Good pronunciation" in text_step, f"FAIL: Chữ bị mất sau {i}s!"
        print("   ✅ Khóa chốt hồi quy: Sau 4 giây dừng gõ, chữ được bảo toàn nguyên vẹn 100%!")

        screenshot_path2 = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_wysiwyg_evaluation_pass.png"
        await page.screenshot(path=screenshot_path2)
        print(f"   📸 Đã chụp ảnh minh chứng: {screenshot_path2}")

        # -------------------------------------------------------------
        # TEST 3: KIỂM THỬ RESPONSIVE MOBILE 390px (ZERO OVERFLOW-X)
        # -------------------------------------------------------------
        print("\n[TEST 3] 1. Chuyển sang Viewport Mobile (390 x 844)...")
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(1500)

        overflow_x = await page.evaluate("document.body.scrollWidth > window.innerWidth")
        scroll_width = await page.evaluate("document.body.scrollWidth")
        inner_width = await page.evaluate("window.innerWidth")
        print(f"   Mobile 390px Width Check: scrollWidth={scroll_width}px, innerWidth={inner_width}px")
        assert not overflow_x, f"FAIL: Bị tràn ngang trên Mobile 390px! ({scroll_width} > {inner_width})"
        print("   ✅ ASSERT Zero Overflow-X trên Mobile 390px PASS 100%!")

        screenshot_path3 = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_wysiwyg_mobile_390_pass.png"
        await page.screenshot(path=screenshot_path3)
        print(f"   📸 Đã chụp ảnh minh chứng Mobile 390px: {screenshot_path3}")

        await browser.close()

    print("\n" + "=" * 70)
    print("🎉 TẤT CẢ 3 BỘ KIỂM TOÁN QC PLAYWRIGHT E2E ĐỀU ĐẠT CHUẨN XUẤT SẮC (PASS 100%)!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_qc_wysiwyg_test())
