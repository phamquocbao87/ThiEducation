import asyncio
import sys
import json
from playwright.async_api import async_playwright


async def run_qc_audit():
    print("==================================================================")
    print("🔍 PHÒNG QC & IT: KIỂM TOÁN TOÀN DIỆN E2E DESKTOP & MOBILE (REAL FIRESTORE)")
    print("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        test_results = []

        # ================================================================
        # 1. AUDIT DESKTOP (1366 x 850) — VERSION, 3-TAB HIERARCHY, REALTIME BELL & RBAC
        # ================================================================
        print("\n--- [1] KIỂM TOÁN DESKTOP (1366 x 850) ---")
        ctx_d = await browser.new_context(viewport={"width": 1366, "height": 850})
        await ctx_d.add_init_script(
            """
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """
        )
        page_d = await ctx_d.new_page()
        await page_d.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
        await page_d.wait_for_selector(".ant-tabs")
        await page_d.wait_for_timeout(1800)

        # [1.0] Kiểm tra hiển thị Footer Version & Build ID chuẩn 'Version 1.2.x • build YYYYMMDDNNv'
        version_footer_check = await page_d.evaluate(
            """() => {
            const text = document.body.innerText;
            const hasCopyright = text.includes('LAK EDUCATION (lakeducation.com) ©2026');
            const match = text.match(/Version\\s+\\d+\\.\\d+\\.\\d+\\s+•\\s+build\\s+\\d{8}\\d{2}v/);
            return {
                hasCopyright,
                hasBuildVersionFormat: Boolean(match),
                matchedLabel: match ? match[0] : null
            };
        }"""
        )
        vf_ok = version_footer_check["hasCopyright"] and version_footer_check["hasBuildVersionFormat"]
        test_results.append(
            (
                "Footer Version & Build Format (Version 1.2.x • build YYYYMMDDNNv)",
                vf_ok,
                json.dumps(version_footer_check, ensure_ascii=False),
            )
        )
        print(f"  [1.0] Footer Version & Build Format: {'PASS' if vf_ok else 'FAIL'} ({version_footer_check})")

        # [1.1] Kiểm tra Cấu trúc 3 Tab chuẩn tại /courses-classes & Dữ liệu thật Firestore (LH001, GV791 Hellen)
        tab_order_check = await page_d.evaluate(
            """() => {
            const tabs = Array.from(document.querySelectorAll('.ant-tabs-tab')).map(t => t.innerText.trim());
            const bodyText = document.body.innerText;
            return {
                tabCount: tabs.length,
                tab1IsClasses: Boolean(tabs[0] && tabs[0].includes('Quản Lý Lớp Học')),
                tab2IsCourses: Boolean(tabs[1] && tabs[1].includes('Danh Mục Khóa Học')),
                tab3IsCurriculum: Boolean(tabs[2] && tabs[2].includes('Cấp Độ Giáo Trình')),
                hasRealClassLH001: bodyText.includes('LH001'),
                noMockTeachers: !bodyText.includes('David Smith') && !bodyText.includes('Emma Watson')
            };
        }"""
        )
        tabs_ok = (
            tab_order_check["tabCount"] >= 3
            and tab_order_check["tab1IsClasses"]
            and tab_order_check["tab2IsCourses"]
            and tab_order_check["tab3IsCurriculum"]
            and tab_order_check["hasRealClassLH001"]
            and tab_order_check["noMockTeachers"]
        )
        test_results.append(
            (
                "3-Tab Unified Training Layout & Real Firestore Data (Zero Mock)",
                tabs_ok,
                json.dumps(tab_order_check, ensure_ascii=False),
            )
        )
        print(f"  [1.1] 3-Tab Layout & Real Firestore Data: {'PASS' if tabs_ok else 'FAIL'} ({tab_order_check})")

        # [1.2] Kiểm tra Chuông Thông Báo Realtime & Admin Audit Trail
        bell_btn = page_d.get_by_test_id("notification-bell-trigger")
        await bell_btn.click()
        await page_d.wait_for_timeout(800)
        bell_check = await page_d.evaluate(
            """() => {
            const pop = document.querySelector('[data-testid="notification-popover-list"]');
            if (!pop) return { opened: false };
            const txt = pop.innerText;
            return {
                opened: true,
                hasTitle: txt.includes('Thông Báo') || txt.includes('Notifications'),
                hasAuditOrEmpty: txt.includes('Khởi tạo:') || txt.includes('Chưa có thông báo')
            };
        }"""
        )
        bell_ok = bell_check.get("opened") and bell_check.get("hasTitle") and bell_check.get("hasAuditOrEmpty")
        test_results.append(
            (
                "Realtime Notification Bell Popover & Admin Audit Trail",
                bell_ok,
                json.dumps(bell_check, ensure_ascii=False),
            )
        )
        print(f"  [1.2] Realtime Notification Bell & Audit Trail: {'PASS' if bell_ok else 'FAIL'} ({bell_check})")

        await ctx_d.close()

        # ================================================================
        # 2. AUDIT MOBILE DEVICE THẬT (is_mobile=True, has_touch=True: 360x800 & 390x844)
        # ================================================================
        print("\n--- [2] KIỂM TOÁN MOBILE DEVICE THẬT (is_mobile=True: 360x800 & 390x844) ---")

        # [2.0] Kiểm tra Landing Page & Login Modal trên màn hình điện thoại thật 360x800
        ctx_m360 = await browser.new_context(
            viewport={"width": 360, "height": 800},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=3,
        )
        page_m360 = await ctx_m360.new_page()
        await page_m360.goto("http://localhost:3000/", wait_until="domcontentloaded")
        await page_m360.wait_for_timeout(800)
        await page_m360.locator('button:has-text("Login"), button:has-text("Đăng nhập")').first.click()
        await page_m360.wait_for_timeout(500)

        landing_360_check = await page_m360.evaluate(
            """() => {
            const innerW = window.innerWidth;
            const scrollW = document.documentElement.scrollWidth;
            const modal = document.querySelector('.ant-modal');
            const mRect = modal ? modal.getBoundingClientRect() : null;
            return {
                innerWidth: innerW,
                scrollWidth: scrollW,
                noViewportExpansion: innerW === 360 && scrollW <= 360,
                modalFitsScreen: Boolean(mRect && mRect.left >= 8 && mRect.right <= 352)
            };
        }"""
        )
        l360_ok = landing_360_check["noViewportExpansion"] and landing_360_check["modalFitsScreen"]
        test_results.append(
            (
                "Real Mobile 360px Landing & Login Modal Centered (is_mobile=True)",
                l360_ok,
                json.dumps(landing_360_check),
            )
        )
        print(f"  [2.0] Real Mobile 360px Landing & Login Modal: {'PASS' if l360_ok else 'FAIL'} ({landing_360_check})")
        await ctx_m360.close()

        # [2.1] Kiểm tra Mobile 390x844 Zero Overflow-X & Slide Menu Logout Button
        ctx_m = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=3,
        )
        await ctx_m.add_init_script(
            """
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """
        )
        page_m = await ctx_m.new_page()
        await page_m.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
        await page_m.wait_for_selector(".ant-tabs")
        await page_m.wait_for_timeout(1200)

        body_scroll_m2 = await page_m.evaluate("() => document.documentElement.scrollWidth")
        m2_no_overflow = body_scroll_m2 <= 390
        test_results.append(
            (
                "Mobile 390px Class Management Zero Overflow-X",
                m2_no_overflow,
                f"{body_scroll_m2}px <= 390px",
            )
        )
        print(f"  [2.1] Zero Overflow Mobile 390px: {'PASS' if m2_no_overflow else 'FAIL'} ({body_scroll_m2}px)")

        # [2.2] Kiểm tra Slide Menu trên Mobile có nút Đăng Xuất Tài Khoản (height >= 40px)
        await page_m.locator("header button:has(.anticon-menu)").first.click()
        await page_m.wait_for_timeout(500)
        mobile_logout_check = await page_m.evaluate(
            """() => {
            const btn = document.querySelector('.lak-mobile-drawer-logout-btn');
            if (!btn) return { exists: false };
            const rect = btn.getBoundingClientRect();
            return {
                exists: true,
                text: btn.innerText.trim(),
                height: Math.round(rect.height),
                width: Math.round(rect.width)
            };
        }"""
        )
        m_logout_ok = (
            mobile_logout_check.get("exists")
            and mobile_logout_check.get("height", 0) >= 40
            and "Đăng Xuất Tài Khoản" in mobile_logout_check.get("text", "")
        )
        test_results.append(
            (
                "Mobile Slide Menu Logout Account Button (height >= 40px)",
                m_logout_ok,
                json.dumps(mobile_logout_check, ensure_ascii=False),
            )
        )
        print(f"  [2.2] Mobile Slide Menu Logout Button: {'PASS' if m_logout_ok else 'FAIL'} ({mobile_logout_check})")
        await ctx_m.close()

        # [2.3] Kiểm toán Kéo Giãn Chiều Rộng Màn Hình & Chống Tràn Ngang (360px -> 1280px)
        resize_routes = [
            "/",
            "/dashboard",
            "/courses-classes",
            "/courses-classes?tab=curriculum",
            "/zoom-schedules",
            "/user-management",
            "/user-management/register",
        ]
        resize_widths = [(360, True), (520, False), (768, False), (1280, False)]
        control_overflow_issues = []

        for rw, r_mob in resize_widths:
            ctx_r = await browser.new_context(
                viewport={"width": rw, "height": 850}, is_mobile=r_mob, has_touch=r_mob
            )
            await ctx_r.add_init_script(
                """
                localStorage.setItem('lak_authenticated_user_id', 'ADM001');
                localStorage.setItem('lak_app_language', 'vi');
            """
            )
            page_r = await ctx_r.new_page()
            for r_path in resize_routes:
                await page_r.goto(f"http://localhost:3000{r_path}", wait_until="domcontentloaded")
                await page_r.wait_for_timeout(400)
                found_r = await page_r.evaluate(
                    """() => {
                    const errs = [];
                    const vw = window.innerWidth;
                    if (document.documentElement.scrollWidth > vw + 1) {
                        errs.push(`PAGE_OVERFLOW:${document.documentElement.scrollWidth}>${vw}`);
                    }
                    return errs;
                }"""
                )
                if found_r:
                    control_overflow_issues.append(f"{rw}px@{r_path}:{found_r[0]}")
            await ctx_r.close()

        resize_ok = len(control_overflow_issues) == 0
        test_results.append(
            (
                "Multi-Width Resize (360-1280px) Zero Overflow-X Across All Routes",
                resize_ok,
                f"Issues={len(control_overflow_issues)}",
            )
        )
        print(
            f"  [2.3] Multi-Width Resize Zero Overflow-X: {'PASS' if resize_ok else 'FAIL'} (Issues={len(control_overflow_issues)})"
        )

        await browser.close()

        print("\n==================================================================")
        print("📊 TỔNG HỢP KẾT QUẢ KIỂM TOÁN TỰ ĐỘNG PHÒNG QC & IT")
        print("==================================================================")
        failed_count = 0
        for name, passed, detail in test_results:
            status_str = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status_str} | {name:<68} | {detail}")
            if not passed:
                failed_count += 1

        print("==================================================================")
        if failed_count > 0:
            print(f"🚨 PHÁT HIỆN {failed_count} LỖI KỸ THUẬT! BẮT BUỘC SỬA TRƯỚC KHI BÁO CÁO!")
            sys.exit(1)
        else:
            print("🎉 TẤT CẢ CHỈ SỐ KIỂM TOÁN ĐỀU ĐẠT CHUẨN 100% (PERFECT PASS)")
            sys.exit(0)


if __name__ == "__main__":
    asyncio.run(run_qc_audit())
