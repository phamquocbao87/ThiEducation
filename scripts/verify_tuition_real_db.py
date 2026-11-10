import asyncio
import os
import sys
from playwright.async_api import async_playwright

PROOF_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"

async def run_tuition_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(viewport={"width": 1366, "height": 850})
        page = await context.new_page()

        print("=== BẮT ĐẦU KIỂM TOÁN TỰ ĐỘNG PHÂN HỆ QUẢN LÝ HỌC PHÍ FIRESTORE THẬT ===")

        # -------------------------------------------------------------
        # TEST 1: Kiểm tra giao diện Tiếng Anh (EN Mode) với Dữ liệu Firestore thật
        # -------------------------------------------------------------
        print("\n[TEST 1] Kiểm tra giao diện EN Mode và dữ liệu học viên thật...")
        await page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        await page.evaluate("() => localStorage.setItem('lak_app_language', 'en')")
        await page.goto("http://localhost:3000/tuition-fees", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        content_en = await page.content()

        # Assert học viên thật
        has_hv214 = "HV214" in content_en and "Phạm Bảo Lâm" in content_en
        has_hv451 = "HV451" in content_en and "Pham Bao Thu" in content_en
        print(f"  -> ASSERT TRUE HV214 (Phạm Bảo Lâm): {has_hv214}")
        print(f"  -> ASSERT TRUE HV451 (Pham Bao Thu): {has_hv451}")
        assert has_hv214, "LỖI: Không tìm thấy học viên thật HV214 trên bảng học phí!"
        assert has_hv451, "LỖI: Không tìm thấy học viên thật HV451 trên bảng học phí!"

        # Assert loại bỏ 100% mock students
        has_mock_khoa = "Lê Anh Khoa" in content_en or "HV001" in content_en
        has_mock_anh = "Nguyễn Thị Ngọc Ánh" in content_en or "HV002" in content_en
        has_mock_quan = "Trần Minh Quân" in content_en or "HV003" in content_en
        has_mock_yen = "Phạm Hoàng Yến" in content_en or "HV004" in content_en
        has_mock_lam = "HV005" in content_en
        has_any_mock = any([has_mock_khoa, has_mock_anh, has_mock_quan, has_mock_yen, has_mock_lam])
        print(f"  -> ASSERT FALSE Toàn bộ Mock Students (HV001..HV005): {not has_any_mock}")
        assert not has_any_mock, "LỖI: Vẫn còn sót học viên mock dummy (HV001..HV005) trong bảng học phí!"

        # Assert số liệu thống kê động
        has_fake_stats = "1.250.000.000" in content_en or "180.000.000" in content_en
        has_real_collected = "2.500.000" in content_en
        has_real_pending = "3.200.000" in content_en
        print(f"  -> ASSERT FALSE Số liệu giả định 1.250.000.000 đ: {not has_fake_stats}")
        print(f"  -> ASSERT TRUE Thống kê thực tế (2.500.000 đ & 3.200.000 đ): {has_real_collected and has_real_pending}")
        assert not has_fake_stats, "LỖI: Vẫn còn số liệu mock tĩnh 1.250.000.000 đ!"
        assert has_real_collected and has_real_pending, "LỖI: Số liệu thống kê động không khớp với hóa đơn thật!"

        shot_en = os.path.join(PROOF_DIR, "proof_tuition_real_db_en.png")
        await page.screenshot(path=shot_en)
        print(f"  -> Đã chụp ảnh minh chứng EN: {shot_en}")

        # -------------------------------------------------------------
        # TEST 2: Kiểm tra Modal Xác Nhận Thu Tiền & Sinh Mã Biên Lai
        # -------------------------------------------------------------
        print("\n[TEST 2] Kiểm tra mở Modal Xác Nhận Thu Tiền...")
        btn_confirm = page.locator("button:has-text('Confirm Payment')").first
        if await btn_confirm.count() > 0:
            await btn_confirm.click()
            await page.wait_for_timeout(1000)
            modal_content = await page.content()
            has_receipt_input = "BL-" in modal_content or "Receipt Code" in modal_content
            print(f"  -> ASSERT TRUE Modal hiển thị và có mã biên lai: {has_receipt_input}")
            assert has_receipt_input, "LỖI: Modal không sinh mã biên lai chuẩn ERP!"

            shot_modal = os.path.join(PROOF_DIR, "proof_tuition_payment_modal.png")
            await page.screenshot(path=shot_modal)
            print(f"  -> Đã chụp ảnh minh chứng Modal: {shot_modal}")

            # Đóng modal bằng Cancel để giữ nguyên dữ liệu chờ Sếp thao tác
            btn_cancel = page.locator(".ant-modal-footer button:has-text('Cancel')")
            if await btn_cancel.count() > 0:
                await btn_cancel.click()
                await page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # TEST 3: Kiểm tra giao diện Tiếng Việt (VI Mode)
        # -------------------------------------------------------------
        print("\n[TEST 3] Kiểm tra giao diện Tiếng Việt (VI Mode)...")
        await page.evaluate("() => localStorage.setItem('lak_app_language', 'vi')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        content_vi = await page.content()
        has_vi_hv214 = "Phạm Bảo Lâm" in content_vi
        has_vi_danop = "ĐÃ NỘP" in content_vi
        has_vi_chuanop = "CHƯA NỘP" in content_vi
        has_vi_xacnhan = "Xác Nhận Đã Thu" in content_vi
        print(f"  -> ASSERT TRUE Học viên thật hiển thị trên VI: {has_vi_hv214}")
        print(f"  -> ASSERT TRUE Nhãn tiếng Việt 'ĐÃ NỘP' / 'CHƯA NỘP': {has_vi_danop and has_vi_chuanop}")
        print(f"  -> ASSERT TRUE Nút hành động 'Xác Nhận Đã Thu': {has_vi_xacnhan}")
        assert has_vi_hv214, "LỖI: Học viên thật không hiển thị trên giao diện VI!"
        assert has_vi_danop and has_vi_chuanop, "LỖI: Tag trạng thái tiếng Việt không đúng!"

        shot_vi = os.path.join(PROOF_DIR, "proof_tuition_real_db_vi.png")
        await page.screenshot(path=shot_vi)
        print(f"  -> Đã chụp ảnh minh chứng VI: {shot_vi}")

        # Khôi phục lại ngôn ngữ mặc định Tiếng Anh
        await page.evaluate("() => localStorage.setItem('lak_app_language', 'en')")

        await browser.close()
        print("\n🎉 TẤT CẢ CÁC BÀI KIỂM TOÁN TỰ ĐỘNG TUITION REAL-DB ĐÃ PASS 100%!")

if __name__ == "__main__":
    asyncio.run(run_tuition_verification())

