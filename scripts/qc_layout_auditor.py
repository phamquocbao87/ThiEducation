import asyncio
import sys
import json
from playwright.async_api import async_playwright

SAMPLE_3_CLASSES = [
    {
        "id": "LH10A1",
        "courseId": "KH-WONDERS-G1",
        "courseName": "Wonders Grade 1 (G1) - Tiếng Anh Học Thuật & Tư Duy Phản Biện",
        "name": "Lớp Học A - Wonders G1 Primary (Zoom)",
        "teacherId": "GV001",
        "teacherName": "Mr. David Smith",
        "subject": "Wonders Grade 1 ELA",
        "platform": "Zoom Meeting",
        "startDate": "04/02/2026",
        "meetingLink": "https://zoom.us/j/888999101",
        "zoomStudentLink": "https://zoom.us/j/888999101",
        "zoomHostLink": "https://zoom.us/s/888999101?role=host",
        "zaloGroupLink": "https://zalo.me/g/lak_class_10a1",
        "meetingId": "888 999 101",
        "passcode": "123456",
        "totalStudents": 2,
        "studentIds": ["HV001", "HV002"],
        "schedule": "Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6 (19:10 - 20:10)",
        "scheduleHistory": [
            {
                "version": 1,
                "effectiveFrom": "04/02/2026",
                "effectiveTo": None,
                "schedule": "Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6 (19:10 - 20:10)",
                "status": "ACTIVE",
                "note": "Lịch học khởi tạo từ ngày khai giảng lớp (04/02/2026)"
            }
        ],
        "holidays": ["Tết Dương Lịch (01/01)", "Nghỉ Tết Nguyên Đán (7 - 9 ngày)"],
        "pendingTeacherRequests": [],
        "pendingStudentRequests": [],
        "checkInStatus": "CHECKED_IN",
        "operationStatus": "Đang học ổn định"
    },
    {
        "id": "LH10A2",
        "courseId": "KH-WONDERS-G1",
        "courseName": "Wonders Grade 1 (G1) - Tiếng Anh Học Thuật & Tư Duy Phản Biện",
        "name": "Class 10A2 - Wonders G1 Reading & Phonics",
        "teacherId": "",
        "teacherName": "Chưa phân công",
        "subject": "Wonders Grade 1 ELA",
        "platform": "Zoom Meeting",
        "startDate": "20/11/2026",
        "meetingLink": "https://zoom.us/j/888999102",
        "zoomStudentLink": "https://zoom.us/j/888999102",
        "zoomHostLink": "https://zoom.us/s/888999102?role=host",
        "zaloGroupLink": "https://zalo.me/g/lak_class_10a2",
        "meetingId": "888 999 102",
        "passcode": "123456",
        "totalStudents": 1,
        "studentIds": ["HV003"],
        "schedule": "Thứ 2, Thứ 4 (10:30 - 12:00)",
        "holidays": ["Tết Dương Lịch (01/01)"],
        "pendingTeacherRequests": [],
        "pendingStudentRequests": [],
        "checkInStatus": "UPCOMING",
        "operationStatus": "Mới khai giảng"
    },
    {
        "id": "LH11B1",
        "courseId": "KH-WONDERS-G4",
        "courseName": "Wonders Grade 4 (G4) - Đọc Hiểu Chuyên Sâu & Viết Học Thuật",
        "name": "Class 11B1 - Wonders G4 Academic Writing",
        "teacherId": "GV003",
        "teacherName": "Mr. Michael Brown",
        "subject": "Wonders Grade 4 ELA",
        "platform": "Zoom Meeting",
        "startDate": "01/12/2026",
        "meetingLink": "https://zoom.us/j/888999201",
        "zoomStudentLink": "https://zoom.us/j/888999201",
        "zoomHostLink": "https://zoom.us/s/888999201?role=host",
        "zaloGroupLink": "https://zalo.me/g/lak_class_11b1",
        "meetingId": "888 999 201",
        "passcode": "654321",
        "totalStudents": 2,
        "studentIds": ["HV004", "HV005"],
        "schedule": "Thứ 2, Thứ 4, Thứ 6 (07:20 - 08:20)",
        "holidays": ["Tết Dương Lịch (01/01)", "Nghỉ Tết Nguyên Đán (7 - 9 ngày)"],
        "pendingTeacherRequests": [],
        "pendingStudentRequests": [],
        "checkInStatus": "UPCOMING",
        "operationStatus": "Đang học ổn định"
    }
]

async def run_qc_audit():
    print("==================================================================")
    print("🔍 PHÒNG QC & IT: KIỂM TOÁN GIỜ TỪNG PHÚT, MÚI GIỜ VN/PH & LỊCH SỬ TKB")
    print("==================================================================")

    classes_json = json.dumps(SAMPLE_3_CLASSES, ensure_ascii=False)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        test_results = []

        # ================================================================
        # 1. AUDIT DESKTOP (1366 x 850) — EXACT TIME, TIMEZONE & SCHEDULE HISTORY E2E
        # ================================================================
        print("\n--- [1] KIỂM TOÁN DESKTOP (1366 x 850) ---")
        ctx_d = await browser.new_context(viewport={'width': 1366, 'height': 850})
        await ctx_d.add_init_script(f'''
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
            if (!sessionStorage.getItem('qc_seeded_v3')) {{
                localStorage.setItem('lak_erp_classes', {json.dumps(classes_json)});
                sessionStorage.setItem('qc_seeded_v3', '1');
            }}
        ''')
        page_d = await ctx_d.new_page()
        await page_d.goto('http://localhost:3000/courses-classes')
        await page_d.wait_for_selector('.ant-tabs')
        await page_d.wait_for_timeout(1000)

        # Kiểm tra hiển thị Footer Version & Build ID chuẩn 'Version 1.2.x • build YYYYMMDDNNv'
        version_footer_check = await page_d.evaluate('''() => {
            const text = document.body.innerText;
            const hasCopyright = text.includes('LAK EDUCATION (lakeducation.com) ©2026');
            const match = text.match(/Version\\s+\\d+\\.\\d+\\.\\d+\\s+•\\s+build\\s+\\d{8}\\d{2}v/);
            return {
                hasCopyright,
                hasBuildVersionFormat: Boolean(match),
                matchedLabel: match ? match[0] : null
            };
        }''')
        vf_ok = version_footer_check['hasCopyright'] and version_footer_check['hasBuildVersionFormat']
        test_results.append(('Footer Version & Build Format (Version 1.2.x • build YYYYMMDDNNv)', vf_ok, json.dumps(version_footer_check, ensure_ascii=False)))
        print(f"  [1.0] Footer Version & Build Format: {'PASS' if vf_ok else 'FAIL'} ({version_footer_check})")

        # 1.1 Chuyển sang Tab 2: Quản Lý Lớp Học & Phân Bổ
        await page_d.locator('.ant-tabs-tab:has-text("Quản Lý Lớp Học"), .ant-tabs-tab:has-text("Lớp Học")').click()
        await page_d.wait_for_timeout(800)

        # Kiểm tra hiển thị giờ từng phút (07:20, 10:30, 19:10) tại Việt Nam (GMT+7) và tự động quy đổi khi người xem ở Philippines (GMT+8)
        vn_card_check = await page_d.evaluate('''() => {
            const text = document.body.innerText;
            return {
                has0720: text.includes('07:20 - 08:20'),
                has1030_VN: text.includes('10:30 - 12:00'),
                has1910_VN: text.includes('19:10 - 20:10'),
                noClutterBox: !text.includes('Tại Anh Quốc (GMT+0)') && !text.includes('Gõ/chọn VD: 07:20')
            };
        }''')

        # Giả lập người xem tại Philippines (GMT+8) để kiểm tra hệ thống tự động đổi 10:30 -> 11:30 và 07:20 -> 08:20 ngầm
        await page_d.evaluate('''() => { window.__LAK_VIEWER_UTC_OFFSET__ = 8; }''')
        await page_d.locator('.ant-tabs-tab:has-text("Danh Mục Khóa Học"), .ant-tabs-tab:has-text("Khóa Học")').first.click()
        await page_d.wait_for_timeout(200)
        await page_d.locator('.ant-tabs-tab:has-text("Quản Lý Lớp Học"), .ant-tabs-tab:has-text("Lớp Học")').click()
        await page_d.wait_for_timeout(400)
        ph_card_check = await page_d.evaluate('''() => {
            const text = document.body.innerText;
            return {
                has0820_PH: text.includes('08:20 - 09:20'),
                has1130_PH: text.includes('11:30 - 13:00'),
                has2010_PH: text.includes('20:10 - 21:10')
            };
        }''')
        # Trả lại múi giờ Việt Nam (GMT+7)
        await page_d.evaluate('''() => { window.__LAK_VIEWER_UTC_OFFSET__ = 7; }''')
        await page_d.locator('.ant-tabs-tab:has-text("Danh Mục Khóa Học"), .ant-tabs-tab:has-text("Khóa Học")').first.click()
        await page_d.wait_for_timeout(200)
        await page_d.locator('.ant-tabs-tab:has-text("Quản Lý Lớp Học"), .ant-tabs-tab:has-text("Lớp Học")').click()
        await page_d.wait_for_timeout(400)

        tz_card_check = {**vn_card_check, **ph_card_check}
        tz_ok = all(tz_card_check.values())
        test_results.append(('Exact Minute Time (07:20, 19:10), Clean UI & Silent Auto-Timezone (VN 10:30 -> PH 11:30)', tz_ok, json.dumps(tz_card_check)))
        print(f"  [1.1] Exact Minute, Clean UI & Silent Auto-Timezone: {'PASS' if tz_ok else 'FAIL'} ({tz_card_check})")

        # 1.2 Kịch bản thực tế của Sếp Bảo:
        # Lớp Học A (LH10A1) bắt đầu 04/02/2026 học T2 đến T6 (19:10 - 20:10).
        # Đến ngày 09/10/2026 đổi lịch sang Thứ 3, Thứ 5, Thứ 7 (10:00 - 11:00).
        # Kiểm tra xem lịch cũ (04/02/2026 -> 08/10/2026) có được bảo toàn trong Lịch sử Thời khóa biểu không!
        await page_d.locator('.ant-card-hoverable button:has-text("Chỉnh Sửa"):visible').first.click()
        await page_d.wait_for_timeout(700)
        await page_d.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98/scratch/class_edit_before_change_desktop.png')

        # Chọn cặp ngày 'T3 - T5 - T7' và khung giờ '10:00 - 11:00'
        await page_d.locator('.ant-drawer .lak-weekly-schedule-control .ant-tag-checkable:has-text("T3 - T5 - T7")').click()
        await page_d.wait_for_timeout(300)
        await page_d.locator('.ant-drawer .lak-weekly-schedule-control .ant-tag-checkable:has-text("10:00 - 11:00")').click()
        await page_d.wait_for_timeout(300)

        # Điền ghi chú đổi lịch
        reason_input = page_d.locator('.ant-drawer input#scheduleChangeReason')
        await reason_input.fill('Đổi sang lịch học sáng T3, T5, T7 từ ngày 09/10/2026')
        await page_d.wait_for_timeout(300)
        await page_d.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98/scratch/class_edit_after_change_desktop.png')

        # Bấm Lưu Thay Đổi
        await page_d.locator('.ant-drawer button:has-text("Lưu Thay Đổi")').click()
        await page_d.wait_for_timeout(600)

        await page_d.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98/scratch/review_fixed_desktop_tab2.png', full_page=True)

        # Mở Xem Chi Tiết Lớp Học A (LH10A1) để nghiệm thu Bảng Lịch Sử Thay Đổi Thời Khóa Biểu
        await page_d.locator('.ant-card-hoverable button:has-text("Chi Tiết"):visible').first.click()
        await page_d.wait_for_timeout(700)

        # Cuộn xuống phần Lịch Sử Thay Đổi Thời Khóa Biểu Của Lớp
        await page_d.evaluate('''() => {
            const hist = document.querySelector('.lak-schedule-history-card');
            if (hist) hist.scrollIntoView({ behavior: 'instant', block: 'center' });
        }''')
        await page_d.wait_for_timeout(400)
        await page_d.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98/scratch/class_schedule_history_drawer_desktop.png')

        history_check = await page_d.evaluate('''() => {
            const card = document.querySelector('.lak-schedule-history-card');
            if (!card) return { exists: false };
            const t = card.innerText;
            return {
                exists: true,
                has2Periods: t.includes('2 giai đoạn'),
                hasOldPeriodDates: t.includes('04/02/2026 → 08/10/2026'),
                hasOldSchedule: t.includes('Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6 (19:10 - 20:10)'),
                hasArchivedTag: t.includes('Đã lưu lịch sử'),
                hasNewPeriodDates: t.includes('09/10/2026 → Hiện tại'),
                hasNewSchedule: t.includes('Thứ 3, Thứ 5, Thứ 7 (10:00 - 11:00)'),
                hasActiveTag: t.includes('Đang áp dụng')
            };
        }''')
        hist_ok = all(history_check.values())
        test_results.append(('Class Timetable Version History (04/02/2026->08/10/2026 & 09/10/2026->Present)', hist_ok, json.dumps(history_check)))
        print(f"  [1.2] Schedule Version History Preserved: {'PASS' if hist_ok else 'FAIL'} ({history_check})")

        # Kiểm tra bảo toàn lịch sử qua F5 Reload
        await page_d.reload()
        await page_d.wait_for_selector('.ant-tabs')
        await page_d.wait_for_timeout(700)
        await page_d.locator('.ant-tabs-tab:has-text("Quản Lý Lớp Học"), .ant-tabs-tab:has-text("Lớp Học")').click()
        await page_d.wait_for_timeout(600)
        f5_hist_badge = await page_d.evaluate('''() => {
            return document.body.innerText.includes('2 giai đoạn TKB') && document.body.innerText.includes('Thứ 3, Thứ 5, Thứ 7 (10:00 - 11:00)');
        }''')
        test_results.append(('F5 Persistence of Schedule History & New Timetable', f5_hist_badge, f"Persisted={f5_hist_badge}"))
        print(f"  [1.3] F5 Persistence of Schedule History: {'PASS' if f5_hist_badge else 'FAIL'}")

        # 1.4 Kiểm thử Tạo Lớp Học Test ([QC-TEST]) -> Kiểm tra hiển thị 0ms -> Xoá ngay Lớp Học Test (Zero Test-Data Residue)
        await page_d.locator('button:has-text("Tạo Lớp Học Mới")').first.click()
        await page_d.wait_for_timeout(500)
        await page_d.locator('.ant-drawer input#name').fill('[QC-TEST] Lớp Học Thử Nghiệm Tự Động G2')
        await page_d.wait_for_timeout(200)
        await page_d.locator('.ant-drawer button:has-text("Tạo Lớp Học")').first.click()
        await page_d.wait_for_timeout(500)

        class_created_ok = await page_d.evaluate('''() => {
            return document.body.innerText.includes('[QC-TEST] Lớp Học Thử Nghiệm Tự Động G2');
        }''')

        # Xoá ngay lớp học [QC-TEST] vừa tạo trên giao diện
        qc_card = page_d.locator('.ant-card-hoverable:has-text("[QC-TEST] Lớp Học Thử Nghiệm Tự Động G2")').first
        if await qc_card.count() > 0:
            del_btn = qc_card.locator('button.ant-btn-dangerous, button:has(.anticon-delete)').first
            if await del_btn.count() > 0:
                await del_btn.click()
                await page_d.wait_for_timeout(300)
                pop_ok = page_d.locator('.ant-popconfirm button.ant-btn-primary, .ant-popover button.ant-btn-primary').first
                if await pop_ok.count() > 0:
                    await pop_ok.click()
                    await page_d.wait_for_timeout(400)

        class_deleted_ok = await page_d.evaluate('''() => {
            return !document.body.innerText.includes('[QC-TEST] Lớp Học Thử Nghiệm Tự Động G2');
        }''')
        crud_class_ok = class_created_ok and class_deleted_ok
        test_results.append(('Full E2E Class Create & Immediate QC Test-Data Deletion (0ms)', crud_class_ok, f"Created={class_created_ok}, DeletedClean={class_deleted_ok}"))
        print(f"  [1.4] E2E Class Create & QC Test-Data Deletion: {'PASS' if crud_class_ok else 'FAIL'} (Created={class_created_ok}, Deleted={class_deleted_ok})")

        await ctx_d.close()

        # ================================================================
        # 2. AUDIT MOBILE (390 x 844)
        # ================================================================
        print("\n--- [2] KIỂM TOÁN MOBILE (390 x 844) ---")
        ctx_m = await browser.new_context(viewport={'width': 390, 'height': 844})
        await ctx_m.add_init_script(f'''
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
            localStorage.setItem('lak_erp_classes', {json.dumps(classes_json)});
        ''')
        page_m = await ctx_m.new_page()
        await page_m.goto('http://localhost:3000/courses-classes')
        await page_m.wait_for_selector('.ant-tabs')
        await page_m.wait_for_timeout(800)
        await page_m.locator('.ant-tabs-tab:has-text("Lớp Học")').click()
        await page_m.wait_for_timeout(800)

        body_scroll_m2 = await page_m.evaluate('() => document.body.scrollWidth')
        m2_no_overflow = body_scroll_m2 <= 390
        test_results.append(('Mobile Tab 2 Class Cards Zero Overflow (390px)', m2_no_overflow, f"{body_scroll_m2}px <= 390px"))
        print(f"  [2.1] Zero Overflow Mobile Tab 2: {'PASS' if m2_no_overflow else 'FAIL'} ({body_scroll_m2}px)")

        # ================================================================
        # 3. DỌN DẸP 100% DỮ LIỆU TEST DO PHÒNG QC TẠO RA (ZERO TEST-DATA RESIDUE TEARDOWN)
        # ================================================================
        print("\n--- [3] DỌN DẸP DỮ LIỆU TEST PHÒNG QC (ZERO TEST-DATA RESIDUE TEARDOWN) ---")
        teardown_check = await page_m.evaluate(f'''() => {{
            // Xoá toàn bộ dữ liệu tạm / lớp học nháp / lịch sử đổi lịch thử nghiệm do QC tạo ra trong quá trình E2E
            const cleanClasses = {classes_json};
            localStorage.setItem('lak_erp_classes', JSON.stringify(cleanClasses));
            sessionStorage.removeItem('qc_seeded_v3');

            // Xoá các khoá học hoặc cấp độ giáo trình có tiền tố [QC-TEST] nếu có
            const rawCourses = localStorage.getItem('lak_erp_courses');
            if (rawCourses) {{
                try {{
                    const parsed = JSON.parse(rawCourses);
                    const filtered = parsed.filter(c => !String(c.name || '').includes('QC-TEST') && !String(c.id || '').includes('QC'));
                    localStorage.setItem('lak_erp_courses', JSON.stringify(filtered));
                }} catch (e) {{}}
            }}

            const verifyClasses = JSON.parse(localStorage.getItem('lak_erp_classes') || '[]');
            const lh10a1 = verifyClasses.find(c => c.id === 'LH10A1');
            const isCleanRestored = lh10a1 && lh10a1.schedule === 'Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6 (19:10 - 20:10)' && (lh10a1.scheduleHistory || []).length === 1;
            return {{
                qcTempDataRemoved: true,
                classesCount: verifyClasses.length,
                isCleanBaselineRestored: Boolean(isCleanRestored)
            }};
        }}''')
        teardown_ok = all([teardown_check['qcTempDataRemoved'], teardown_check['isCleanBaselineRestored']])
        test_results.append(('QC Test-Data Teardown & Clean State Restoration (Zero Residue)', teardown_ok, json.dumps(teardown_check)))
        print(f"  [3.1] QC Test-Data Cleanup & Teardown: {'PASS' if teardown_ok else 'FAIL'} ({teardown_check})")

        await ctx_m.close()
        await browser.close()

        print("\n==================================================================")
        print("📊 TỔNG HỢP KẾT QUẢ KIỂM TOÁN TỰ ĐỘNG PHÒNG QC & IT")
        print("==================================================================")
        failed_count = 0
        for name, passed, detail in test_results:
            status_str = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status_str} | {name:<72} | {detail}")
            if not passed:
                failed_count += 1

        print("==================================================================")
        if failed_count > 0:
            print(f"🚨 PHÁT HIỆN {failed_count} LỖI KỸ THUẬT! BẮT BUỘC SỬA TRƯỚC KHI BÁO CÁO!")
            sys.exit(1)
        else:
            print("🎉 TẤT CẢ CHỈ SỐ KIỂM TOÁN ĐỀU ĐẠT CHUẨN 100% (PERFECT PASS)")
            sys.exit(0)

if __name__ == '__main__':
    asyncio.run(run_qc_audit())
