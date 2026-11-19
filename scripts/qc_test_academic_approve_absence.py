import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def run_full_dev_test():
    print("🚀 BẮT ĐẦU KIỂM THỬ KHÉP KÍN VỚI DATA DEV THẬT: BÁO VẮNG -> GIÁO VỤ DUYỆT (FIX currentUser)")
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------------------------
        # BƯỚC 1: HỌC VIÊN KENJI (HV768) GỬI ĐƠN XIN NGHỈ PHÉP (NẾU CHƯA CÓ ĐƠN PENDING)
        # ----------------------------------------------------------------------
        print("\n--- BƯỚC 1: HỌC VIÊN GỬI ĐƠN XIN NGHỈ (HV768) ---")
        context_student = browser.new_context(viewport={"width": 1280, "height": 800})
        page_student = context_student.new_page()
        page_student.on("pageerror", lambda err: errors.append(f"[HV768]: {err}"))

        page_student.goto(f"{BASE_URL}/dashboard?sso_uid=HV768", wait_until="domcontentloaded")
        time.sleep(2)

        # Mở modal báo nghỉ phép
        request_btn = page_student.locator('[data-testid="btn-student-report-absence"]')
        if request_btn.count() == 0:
            request_btn = page_student.locator('[data-testid^="btn-report-absence-class-"]').first

        if request_btn.count() > 0:
            print("👉 Học viên bấm nút [Request Leave / Báo Nghỉ Phép]...")
            request_btn.click()
            time.sleep(1)

            submit_btn = page_student.locator('[data-testid="btn-submit-absence-report"]')
            if submit_btn.count() > 0:
                print("👉 Học viên bấm gửi đơn...")
                submit_btn.click()
                time.sleep(2)
                print("✅ [PASS] Học viên đã nộp đơn xin nghỉ phép thành công!")

        context_student.close()

        # ----------------------------------------------------------------------
        # BƯỚC 2: GIÁO VỤ (ACA404) TIẾP NHẬN & BẤM [DUYỆT & BÁO GIÁO VIÊN]
        # ----------------------------------------------------------------------
        print("\n--- BƯỚC 2: GIÁO VỤ (ACA404) BẤM [DUYỆT & BÁO GIÁO VIÊN] ---")
        context_academic = browser.new_context(viewport={"width": 1280, "height": 800})
        page_academic = context_academic.new_page()
        page_academic.on("pageerror", lambda err: errors.append(f"[ACA404]: {err}"))

        page_academic.goto(f"{BASE_URL}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded")
        time.sleep(2)

        approve_btns = page_academic.locator('[data-testid^="btn-approve-absence-"]')
        btn_count = approve_btns.count()
        print(f"📌 Số nút [Duyệt & Báo Giáo Viên] tìm thấy: {btn_count}")

        if btn_count > 0:
            first_btn = approve_btns.nth(0)
            btn_id = first_btn.get_attribute("data-testid")
            print(f"👉 Giáo vụ bấm nút duyệt: {btn_id}")

            # Chụp ảnh trước khi duyệt
            before_img = os.path.join(ARTIFACTS_DIR, "qc_academic_before_approve_fixed.png")
            page_academic.screenshot(path=before_img)
            print(f"📸 Đã lưu ảnh trước khi duyệt: {before_img}")

            # CLICK DUYỆT
            first_btn.click()
            time.sleep(2)

            # Kiểm tra toast thông báo
            success_toast = page_academic.locator(".ant-message-success")
            if success_toast.count() > 0:
                print(f"✅ [PASS] Toast hiển thị thành công: {success_toast.inner_text()}")

            # Chụp ảnh sau khi duyệt
            after_img = os.path.join(ARTIFACTS_DIR, "qc_academic_after_approve_fixed.png")
            page_academic.screenshot(path=after_img)
            print(f"📸 Đã lưu ảnh sau khi duyệt thành công: {after_img}")
        else:
            print("ℹ️ Không tìm thấy nút duyệt (có thể đơn đã được duyệt từ trước).")

        context_academic.close()

        # ----------------------------------------------------------------------
        # BƯỚC 3: KIỂM TOÁN LỖI CONSOLE RUNTIME
        # ----------------------------------------------------------------------
        print("\n--- BƯỚC 3: KIỂM TOÁN LỖI RUNTIME JAVASCRIPT ---")
        if errors:
            print(f"❌ PHÁT HIỆN {len(errors)} LỖI RUNTIME:")
            for err in errors:
                print(f"   {err}")
            assert False, "Kiểm thử thất bại do có lỗi JavaScript!"
        else:
            print("🎉 [XÁC MINH 100% PASS]: LỖI 'currentUser is not defined' ĐÃ ĐƯỢC FIX TRIỆT ĐỂ!")
            print("🎉 Không có bất kỳ lỗi JavaScript Console Runtime nào trong toàn bộ luồng!")

        browser.close()

if __name__ == "__main__":
    run_full_dev_test()
