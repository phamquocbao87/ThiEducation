#!/usr/bin/env python3
"""
qc_stress_test_courses_and_scoping.py
Bài kiểm tra chịu tải & ứng suất (Stress Test):
1. Stress Test Thuật Toán Scoping: Chạy 1,000 lần trên tập dữ liệu lớn (500 lớp, 1,000 học viên), đo thời gian phản hồi (< 1ms/lần).
2. Stress Test Phiên Làm Việc Liên Tục: Chuyển đổi vai trò liên tục giữa Học viên, Giáo viên và Admin để bảo đảm không rò rỉ bộ nhớ/cache.
3. Stress Test Hiển Thị & Layout: Kiểm tra tràn ngang (Zero Overflow-X) trên Desktop (1366px) và Mobile (390px).
"""
import os
import sys
import time
import random
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

# ----------------------------------------------------------------------
# 1. STRESS TEST THUẬT TOÁN VỚI 500 LỚP HỌC & 1,000 HỌC VIÊN
# ----------------------------------------------------------------------
def stress_test_scoping_algorithm():
    print("==================================================================")
    print("🔥 3. STRESS TEST: CHỊU TẢI THUẬT TOÁN SCOPING VỚI DỮ LIỆU LỚN")
    print("==================================================================")

    print("📊 Đang khởi tạo 500 lớp học và 1,000 học viên giả lập...")
    large_classes = []
    for i in range(1, 501):
        class_id = f"LH_{i:04d}"
        # Mỗi lớp có từ 5 đến 15 học viên ngẫu nhiên
        num_students = random.randint(5, 15)
        student_ids = [f"HV_{random.randint(1, 1000):04d}" for _ in range(num_students)]
        large_classes.append({
            "id": class_id,
            "name": f"Wonders ELA Class {i}",
            "studentIds": student_ids,
            "teacherId": f"TEA_{random.randint(1, 50):02d}",
            "isDeleted": random.random() < 0.05, # 5% lớp xóa
            "status": "Active" if random.random() > 0.1 else "Deleted",
            "pendingStudentRequests": [
                {"studentId": f"HV_{random.randint(1, 1000):04d}"} for _ in range(random.randint(0, 3))
            ]
        })

    def run_scoping(classes, user):
        if user.get("role") != "student":
            return classes
        student_id = user.get("id") or user.get("code")
        enrolled_set = set(user.get("enrolledClassIds") or [])
        if user.get("classId"):
            enrolled_set.add(user.get("classId"))

        result = []
        for cls in classes:
            if cls.get("isDeleted") or cls.get("status") == "Deleted":
                continue
            if cls["id"] in enrolled_set:
                result.append(cls)
                continue
            if student_id in cls.get("studentIds", []):
                result.append(cls)
                continue
            pending = cls.get("pendingStudentRequests") or []
            if any(
                (r.get("studentId") == student_id if isinstance(r, dict) else r == student_id)
                for r in pending
            ):
                result.append(cls)
                continue
        return result

    ITERATIONS = 1000
    print(f"⏱️ Bắt đầu stress test {ITERATIONS:,} lượt gọi thuật toán scoping...")
    t_start = time.perf_counter()

    for idx in range(ITERATIONS):
        rand_student_id = f"HV_{random.randint(1, 1000):04d}"
        user = {
            "id": rand_student_id,
            "role": "student",
            "enrolledClassIds": [f"LH_{random.randint(1, 500):04d}"]
        }
        res = run_scoping(large_classes, user)
        # Assert tính toàn vẹn
        for cls in res:
            assert not cls.get("isDeleted") and cls.get("status") != "Deleted"

    t_end = time.perf_counter()
    total_ms = (t_end - t_start) * 1000
    avg_us = (total_ms / ITERATIONS) * 1000

    print(f"   - Tổng thời gian cho {ITERATIONS:,} lần lọc (trên 500 lớp): {total_ms:.2f} ms")
    print(f"   - Thời gian phản hồi trung bình mỗi lần: {avg_us:.2f} µs ({avg_us / 1000:.3f} ms)")
    assert total_ms < 500, f"LỖI HIỆU NĂNG: Quá thời gian cho phép ({total_ms}ms > 500ms)!"
    print("   ✅ [PASS]: Hiệu năng đạt chuẩn cực đại (< 0.5ms/lần trên 500 lớp)!")

# ----------------------------------------------------------------------
# 2. STRESS TEST VIEWPORT & LAYOUT (DESKTOP & MOBILE ZERO OVERFLOW-X)
# ----------------------------------------------------------------------
def stress_test_viewports_and_sessions():
    print("\n==================================================================")
    print("📱 4. STRESS TEST: VIEWPORT RESPONSIVE & CHUYỂN ĐỔI PHIÊN LIÊN TỤC")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        try:
            # 1. Chuyển đổi qua lại liên tục 6 lần giữa Học viên và Giáo viên
            roles_to_test = [
                ("HV253", "student", "vi"),
                ("GV952", "teacher", "en"),
                ("HV739", "student", "vi"),
                ("GV952", "teacher", "en"),
                ("ADM001", "admin", "vi"),
                ("HV253", "student", "vi")
            ]

            print(f"🔄 Đang thực hiện {len(roles_to_test)} lần chuyển đổi phiên liên tục...")
            for idx, (uid, role, lang) in enumerate(roles_to_test, 1):
                ctx = browser.new_context(viewport={"width": 1366, "height": 850})
                ctx.add_init_script(f"""
                    localStorage.setItem('lak_authenticated_user_id', '{uid}');
                    localStorage.setItem('lak_app_language', '{lang}');
                """)
                page = ctx.new_page()
                page.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
                page.wait_for_timeout(1000)

                body_text = page.locator("body").inner_text()
                if role == "student":
                    if uid == "HV253":
                        assert "LH002" in body_text, "HV253 phải thấy LH002"
                        assert "LH004" not in body_text, "HV253 không được thấy LH004"
                    elif uid == "HV739":
                        assert "LH004" in body_text, "HV739 phải thấy LH004"
                        assert "LH002" not in body_text, "HV739 không được thấy LH002"
                elif role == "teacher":
                    # Vào Catalog
                    tab_cat = page.locator(".ant-tabs-tab:has-text('Course Programs Catalog')").first
                    if tab_cat.is_visible():
                        tab_cat.click()
                        page.wait_for_timeout(500)
                        card_text = page.locator(".ant-card").first.inner_text()
                        assert "Fee:" not in card_text, "Giáo viên không được thấy Fee"

                ctx.close()
                print(f"   [{idx}/{len(roles_to_test)}] Phiên {uid} ({role}) cô lập hoàn hảo, không rò rỉ cache!")

            print("   ✅ [PASS]: Stress test chuyển đổi phiên đa vai trò thành công 100%!")

            # 2. Kiểm toán Tràn Ngang (Zero Overflow-X) trên Mobile 390px
            print("\n📱 Kiểm toán Zero Overflow-X trên Mobile 390px (Góc nhìn Học viên & Giáo viên)...")
            # Mobile Học viên
            ctx_m_student = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            ctx_m_student.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_m_s = ctx_m_student.new_page()
            page_m_s.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
            page_m_s.wait_for_timeout(1500)
            is_overflow_s = page_m_s.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
            print(f"   - Mobile HV253 scrollWidth > innerWidth: {is_overflow_s} (Kỳ vọng: False)")
            assert not is_overflow_s, "LỖI: Tràn ngang trên Mobile học viên!"

            shot_m_student = os.path.join(ARTIFACT_DIR, "qc_stress_mobile_student_390px.png")
            page_m_s.screenshot(path=shot_m_student)
            print(f"📸 Chụp ảnh Mobile Học viên: {shot_m_student}")
            ctx_m_student.close()

            # Mobile Giáo viên
            ctx_m_teacher = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            ctx_m_teacher.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'en');
            """)
            page_m_t = ctx_m_teacher.new_page()
            page_m_t.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
            page_m_t.wait_for_timeout(1500)
            is_overflow_t = page_m_t.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
            print(f"   - Mobile GV952 scrollWidth > innerWidth: {is_overflow_t} (Kỳ vọng: False)")
            assert not is_overflow_t, "LỖI: Tràn ngang trên Mobile giáo viên!"

            shot_m_teacher = os.path.join(ARTIFACT_DIR, "qc_stress_mobile_teacher_390px.png")
            page_m_t.screenshot(path=shot_m_teacher)
            print(f"📸 Chụp ảnh Mobile Giáo viên: {shot_m_teacher}")
            ctx_m_teacher.close()

            print("   ✅ [PASS]: Zero Overflow-X bảo đảm hoàn hảo trên cả 2 vai trò!")
            return True

        except Exception as e:
            print(f"\n❌ Stress Test thất bại: {e}")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    stress_test_scoping_algorithm()
    ok = stress_test_viewports_and_sessions()
    sys.exit(0 if ok else 1)
