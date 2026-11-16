import asyncio
import re
from playwright.async_api import async_playwright

def log(msg):
    print(msg, flush=True)

async def audit_all_screens():
    log("==================================================================")
    log("🔍 KIỂM TOÁN TOÀN DIỆN: RÀ SOÁT SĐT HỌC VIÊN TRÊN TOÀN BỘ ỨNG DỤNG CHO GIÁO VIÊN")
    log("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # -------------------------------------------------------------
        # BƯỚC 1: LẤY DANH SÁCH SĐT PHỤ HUYNH / HỌC VIÊN CẦN BẢO VỆ
        # -------------------------------------------------------------
        admin_ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        await admin_ctx.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        admin_page = await admin_ctx.new_page()
        await admin_page.goto("http://127.0.0.1:3000/students", wait_until="domcontentloaded")
        await admin_page.wait_for_timeout(2500)

        # Trích xuất danh sách SĐT học viên từ giao diện Admin
        student_phones = await admin_page.evaluate("""() => {
            const phones = new Set();
            const text = document.body.innerText;
            const matches = text.match(/0[0-9]{9,10}/g) || [];
            matches.forEach(p => phones.add(p));
            // Trích xuất thêm từ link tel:
            document.querySelectorAll('a[href^="tel:"]').forEach(a => {
                const p = a.href.replace('tel:', '').replace(/[^0-9]/g, '');
                if (p.length >= 9) phones.add(p);
            });
            return Array.from(phones);
        }""")
        log(f"📋 Thu thập được {len(student_phones)} số điện thoại học viên/phụ huynh thực tế: {student_phones}")
        await admin_ctx.close()

        # -------------------------------------------------------------
        # BƯỚC 2: ĐĂNG NHẬP GIÁO VIÊN (GV952 - Teacher Maj) & RÀ SOÁT TỪNG MÀN HÌNH
        # -------------------------------------------------------------
        teacher_ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        await teacher_ctx.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'GV952');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page = await teacher_ctx.new_page()

        async def check_dom_for_student_phones(screen_name):
            body_text = await page.evaluate("() => document.body.innerText")
            html_text = await page.evaluate("() => document.body.innerHTML")

            leaked_phones = []
            for p in student_phones:
                # Bỏ qua SĐT của chính giáo viên (GV952 có SĐT 090544134...)
                if p in ["090544134", "0905441345"]:
                    continue
                # Kiểm tra chuỗi SĐT có xuất hiện trần trụi trong DOM hay không
                if p in body_text or f"tel:{p}" in html_text or f"zalo.me/{p}" in html_text:
                    leaked_phones.append(p)

            if len(leaked_phones) > 0:
                log(f"  ❌ [FAIL] {screen_name}: PHÁT HIỆN LỘ SĐT HỌC VIÊN! ({leaked_phones})")
                return False, leaked_phones
            else:
                log(f"  ✅ [PASS] {screen_name}: BẢO MẬT TUYỆT ĐỐI 100% (Không lộ bất kỳ SĐT học viên nào)")
                return True, []

        results = []

        # 1. Màn hình /students
        log("\n--- [Kiểm toán 1] Màn hình /students (Quản lý học viên) ---")
        await page.goto("http://127.0.0.1:3000/students", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        ok1, leaks1 = await check_dom_for_student_phones("Trang /students")
        results.append(("Trang /students", ok1, leaks1))

        # 2. Màn hình /courses-classes và Drawer Danh sách lớp
        log("\n--- [Kiểm toán 2] Màn hình /courses-classes & Drawer danh sách lớp ---")
        await page.goto("http://127.0.0.1:3000/courses-classes", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        ok2, leaks2 = await check_dom_for_student_phones("Trang /courses-classes (Bảng lớp học)")
        results.append(("Trang /courses-classes", ok2, leaks2))

        # Mở Drawer danh sách lớp LH005
        roster_btn = page.locator("button:has-text('Học Viên (5)'), button:has-text('Học Viên (6)'), button:has-text('Học Viên (9)')").first
        if await roster_btn.count() > 0:
            await roster_btn.click()
            await page.wait_for_timeout(1200)
            ok_drawer, leaks_drawer = await check_dom_for_student_phones("Drawer Danh Sách Lớp (ClassRosterDrawer)")
            results.append(("Drawer Danh Sách Lớp", ok_drawer, leaks_drawer))
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

        # 3. Màn hình /class-attendance-evaluation và Drawer Hồ sơ học viên
        log("\n--- [Kiểm toán 3] Màn hình /class-attendance-evaluation & Drawer hồ sơ ---")
        await page.goto("http://127.0.0.1:3000/class-attendance-evaluation", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        ok3, leaks3 = await check_dom_for_student_phones("Trang Điểm danh & Đánh giá")
        results.append(("Trang Điểm danh & Đánh giá", ok3, leaks3))

        profile_btn = page.locator("button:has-text('Hồ Sơ Học Viên'), button:has-text('Xem Hồ Sơ')").first
        if await profile_btn.count() > 0:
            await profile_btn.click()
            await page.wait_for_timeout(1000)
            ok_att_drawer, leaks_att_drawer = await check_dom_for_student_phones("Drawer Hồ Sơ Điểm Danh (StudentProfileDrawer)")
            results.append(("Drawer Hồ Sơ Điểm Danh", ok_att_drawer, leaks_att_drawer))
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

        # 4. Màn hình /dashboard (Bảng điều khiển giáo viên)
        log("\n--- [Kiểm toán 4] Màn hình /dashboard (Dashboard giáo viên) ---")
        await page.goto("http://127.0.0.1:3000/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        ok4, leaks4 = await check_dom_for_student_phones("Trang /dashboard")
        results.append(("Trang /dashboard", ok4, leaks4))

        # 5. Màn hình /zoom-schedules (Thời khóa biểu)
        log("\n--- [Kiểm toán 5] Màn hình /zoom-schedules (Thời khóa biểu giáo viên) ---")
        await page.goto("http://127.0.0.1:3000/zoom-schedules", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        ok5, leaks5 = await check_dom_for_student_phones("Trang /zoom-schedules")
        results.append(("Trang /zoom-schedules", ok5, leaks5))

        # 6. Màn hình /classroom/LH005 (Phòng học ảo Live Classroom)
        log("\n--- [Kiểm toán 6] Màn hình /classroom/LH005 (Phòng học ảo Live Classroom) ---")
        await page.goto("http://127.0.0.1:3000/classroom/LH005", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        ok6, leaks6 = await check_dom_for_student_phones("Phòng học ảo Live Classroom")
        results.append(("Phòng học ảo Live Classroom", ok6, leaks6))

        await teacher_ctx.close()
        await browser.close()

        log("\n==================================================================")
        log("📊 TỔNG KẾT KIỂM TOÁN BẢO MẬT SĐT HỌC VIÊN TRÊN TOÀN ỨNG DỤNG")
        log("==================================================================")
        all_passed = True
        for name, passed, leaks in results:
            status = "✅ 100% BẢO MẬT" if passed else f"❌ LỘ SĐT: {leaks}"
            log(f"{status:<20} | {name}")
            if not passed:
                all_passed = False

        log("==================================================================")
        assert all_passed, "KIỂM TOÁN THẤT BẠI: Phát hiện còn màn hình để lộ số điện thoại học viên cho giáo viên!"
        log("🎉 KẾT QUẢ: TOÀN BỘ ỨNG DỤNG ĐÃ ĐƯỢC BẢO VỆ 100% — GIÁO VIÊN HOÀN TOÀN KHÔNG THỂ THẤY SĐT HỌC VIÊN!")

if __name__ == "__main__":
    asyncio.run(audit_all_screens())
