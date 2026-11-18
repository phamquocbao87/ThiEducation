import asyncio
import os
import sys
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

async def run_qc_lesson_plan_test():
    print("=" * 75)
    print("🚀 PHÒNG QC BẮT ĐẦU KIỂM THỬ: BẢO TOÀN DỮ LIỆU STUDENT PREP & HOMEWORK")
    print("   VÀ TÍNH NĂNG MỚI MCGRAW-HILL WONDERS SUGGESTED DAILY TIME (DESKTOP & MOBILE)")
    print("=" * 75)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 850})
        page = await context.new_page()

        # -------------------------------------------------------------
        # 1. TRUY CẬP LỚP HỌC LH002 VỚI ROLE GIÁO VIÊN / GIÁO VỤ
        # -------------------------------------------------------------
        url = "http://127.0.0.1:3000/classroom/LH002?sso_uid=GV952"
        print(f"\n[BƯỚC 1] Truy cập lớp học: {url}")
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        print("[BƯỚC 2] Chuyển sang Tab 2: Soạn Giáo Án & Học Liệu (Curriculum)...")
        tab_curriculum = page.locator('[data-testid="tab-curriculum"]')
        await tab_curriculum.click()
        await page.wait_for_timeout(1200)

        # -------------------------------------------------------------
        # 2. MỞ MODAL SOẠN GIÁO ÁN
        # -------------------------------------------------------------
        print("[BƯỚC 3] Mở Modal Soạn Giáo Án...")
        btn_open = page.locator('[data-testid="btn-open-lesson-editor"]')
        await btn_open.click()
        await page.wait_for_timeout(1200)

        # Định vị các Form Items
        input_title = page.locator('#lessonTitle')
        textarea_prep = page.locator('#studentPrep')
        textarea_hw = page.locator('#homework')
        input_reading_time = page.locator('#readingDailyTime')
        input_writing_time = page.locator('#writingDailyTime')

        assert await textarea_prep.is_visible(), "FAIL: Ô textarea studentPrep không hiển thị!"
        assert await textarea_hw.is_visible(), "FAIL: Ô textarea homework không hiển thị!"
        assert await input_reading_time.is_visible(), "FAIL: Ô input readingDailyTime không hiển thị!"
        assert await input_writing_time.is_visible(), "FAIL: Ô input writingDailyTime không hiển thị!"
        print("   ✅ Đã định vị thành công 4 trường: Student Prep, Homework, Reading Time, Writing Time.")

        # -------------------------------------------------------------
        # 3. NHẬP DỮ LIỆU ĐA DÒNG VÀ THỜI LƯỢNG WONDERS
        # -------------------------------------------------------------
        print("[BƯỚC 4] Nhập dữ liệu đa dòng cho Student Prep & Homework và chọn thời lượng...")
        await input_title.fill("Essential Question: How can experiencing nature change the way you think about it?")

        test_prep_content = "Reread and practice Reading Writing Companion pp. 12 - 23\nDecodable #4: Practice phonics short vowels"
        test_hw_content = "Practice Book pp. 2, 7, 11\nComplete Writing Activity 1 in Notebook"

        await textarea_prep.fill(test_prep_content)
        await textarea_hw.fill(test_hw_content)
        await input_reading_time.fill("60+ mins")
        await input_writing_time.fill("30+ mins")

        reading_val = await input_reading_time.input_value()
        writing_val = await input_writing_time.input_value()
        print(f"   ✅ Giá trị nhận trên form: Reading='{reading_val}', Writing='{writing_val}'")

        # -------------------------------------------------------------
        # 4. BẤM LƯU GIÁO ÁN (0MS) VÀ KIỂM TRA HIỂN THỊ TRÊN GIAO DIỆN
        # -------------------------------------------------------------
        print("[BƯỚC 5] Bấm Lưu Giáo Án (0ms)...")
        btn_save = page.locator('[data-testid="btn-save-lesson-plan"]')
        await btn_save.click()
        await page.wait_for_timeout(2500)

        # Kiểm tra 2 huy hiệu tròn xanh Wonders trên Curriculum Panel
        wonders_badges = page.locator('[data-testid="wonders-daily-time-badges"]')
        assert await wonders_badges.is_visible(), "FAIL: Không tìm thấy 2 huy hiệu Wonders Daily Time trên Panel!"
        badges_text = await wonders_badges.inner_text()
        print(f"   ✅ Huy hiệu Wonders xuất hiện: {badges_text.replace(chr(10), ' ')}")
        assert "60+ mins" in badges_text, "FAIL: Thiếu badge 60+ mins"
        assert "30+ mins" in badges_text, "FAIL: Thiếu badge 30+ mins"

        # Chụp ảnh màn hình bằng chứng huy hiệu
        screenshot_badges_path = os.path.join(ARTIFACTS_DIR, "qc_curriculum_wonders_badges.png")
        await page.screenshot(path=screenshot_badges_path)
        print(f"   📸 Đã chụp ảnh minh chứng: {screenshot_badges_path}")

        # -------------------------------------------------------------
        # 5. MỞ LẠI MODAL ĐỂ KIỂM TOÁN TÍNH NĂNG BẢO TOÀN DỮ LIỆU (ZERO DATA LOSS)
        # -------------------------------------------------------------
        print("\n[BƯỚC 6] MỞ LẠI MODAL ĐỂ KIỂM TOÁN TÍNH NĂNG BẢO TOÀN DỮ LIỆU...")
        await btn_open.click()
        await page.wait_for_timeout(1500)

        reloaded_prep = await textarea_prep.input_value()
        reloaded_hw = await textarea_hw.input_value()
        reloaded_reading = await input_reading_time.input_value()
        reloaded_writing = await input_writing_time.input_value()

        print(f"   - Student Prep nạp lại: {repr(reloaded_prep)}")
        print(f"   - Homework nạp lại: {repr(reloaded_hw)}")
        print(f"   - Reading Time: {repr(reloaded_reading)}")
        print(f"   - Writing Time: {repr(reloaded_writing)}")

        assert "Reread and practice" in reloaded_prep, f"FAIL: Student Prep bị mất dữ liệu! Nhận: {reloaded_prep}"
        assert "Decodable #4" in reloaded_prep, "FAIL: Student Prep bị mất dòng 2!"
        assert "Practice Book pp. 2, 7, 11" in reloaded_hw, f"FAIL: Homework bị mất dữ liệu! Nhận: {reloaded_hw}"
        assert "60+ mins" in reloaded_reading, "FAIL: readingDailyTime không giữ 60+ mins"
        assert "30+ mins" in reloaded_writing, "FAIL: writingDailyTime không giữ 30+ mins"
        print("   🎉 TUYỆT VỜI: DỮ LIỆU ĐƯỢC BẢO TOÀN 100% NGUYÊN VẸN, KHÔNG HỀ BỊ MẤT CHỮ NÀO!")

        # Chụp ảnh modal khi nạp lại thành công
        screenshot_modal_path = os.path.join(ARTIFACTS_DIR, "qc_modal_persisted_data.png")
        await page.screenshot(path=screenshot_modal_path)
        print(f"   📸 Đã chụp ảnh modal bảo toàn: {screenshot_modal_path}")

        # Đóng modal
        btn_close = page.locator('.ant-modal-close, .ant-modal-footer button').first
        await btn_close.click()
        await page.wait_for_timeout(1200)

        # -------------------------------------------------------------
        # 6. KIỂM TOÁN MOBILE VIEWPORT (390x844) ZERO OVERFLOW-X
        # -------------------------------------------------------------
        print("\n[BƯỚC 7] KIỂM TOÁN GIAO DIỆN DI ĐỘNG (MOBILE 390x844)...")
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(1500)

        overflow_x_check = await page.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                hasOverflow: document.documentElement.scrollWidth > window.innerWidth
            };
        }""")
        print(f"   - Mobile Viewport Check: scrollWidth={overflow_x_check['scrollWidth']}px, innerWidth={overflow_x_check['innerWidth']}px")
        assert not overflow_x_check['hasOverflow'], f"FAIL: Mobile bị tràn ngang! {overflow_x_check}"
        print("   ✅ ASSERT Zero Overflow-X PASS trên Mobile 390px!")

        screenshot_mobile_path = os.path.join(ARTIFACTS_DIR, "qc_mobile_390_wonders.png")
        await page.screenshot(path=screenshot_mobile_path)
        print(f"   📸 Đã chụp ảnh mobile audit: {screenshot_mobile_path}")

        await browser.close()
        print("\n" + "=" * 75)
        print("🎉 PHÒNG QC BÁO CÁO: 100% KỊCH BẢN KIỂM THỬ ĐÃ ĐẠT TIÊU CHUẨN XUẤT SẮC!")
        print("=" * 75)

if __name__ == "__main__":
    asyncio.run(run_qc_lesson_plan_test())
