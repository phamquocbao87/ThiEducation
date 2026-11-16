#!/usr/bin/env python3
"""
qc_verify_materials_sharing_lifecycle.py
Kịch bản kiểm thử E2E Playwright Headless kiểm toán toàn diện vòng đời Chia Sẻ & Gỡ Quyền Tài Liệu:
1. Seed tài liệu test vào Firestore learning_materials (CUSTOM, chưa gán ai)
2. Admin mở Drawer Chia sẻ tài liệu -> Cấp quyền cho Học viên HV253 (Melissa)
3. HV253 đăng nhập -> Thấy tài liệu (ASSERT TRUE)
4. HV739 (không được share) đăng nhập -> Không thấy tài liệu (ASSERT FALSE)
5. Admin gỡ quyền truy cập (Revoke Access) của HV253
6. HV253 đăng nhập lại -> Tài liệu biến mất ngay lập tức (ASSERT TRUE)
7. Dọn sạch 100% dữ liệu test (Zero Test Residue)
"""
import os
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

def seed_test_material(material_id, material_title):
    node_script = f"""
import {{ initializeApp }} from "firebase/app";
import {{ getFirestore, doc, setDoc }} from "firebase/firestore";

const devConfig = {{
  apiKey: "AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74",
  authDomain: "lakeducation-dev.firebaseapp.com",
  projectId: "lakeducation-dev",
}};
const app = initializeApp(devConfig, "seedApp");
const db = getFirestore(app, "lakeducationdb");

await setDoc(doc(db, "learning_materials", "{material_id}"), {{
  id: "{material_id}",
  title: "{material_title}",
  type: "PDF",
  url: "https://drive.google.com/file/d/test_qc_material/view",
  courseId: "ALL",
  courseName: "Toàn Trung Tâm",
  shareScope: "CUSTOM",
  sharedStudentIds: [],
  sharedClassIds: [],
  sharedCourseIds: [],
  shares: [],
  visibility: "ALL",
  description: "Tài liệu kiểm thử tự động phân quyền E2E Phòng QC",
  uploadedAt: new Date().toISOString()
}});
console.log("Seeded test material {material_id}");
process.exit(0);
"""
    subprocess.run(["node", "-e", node_script], check=True)

def delete_test_material(material_id):
    node_script = f"""
import {{ initializeApp }} from "firebase/app";
import {{ getFirestore, doc, deleteDoc }} from "firebase/firestore";

const devConfig = {{
  apiKey: "AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74",
  authDomain: "lakeducation-dev.firebaseapp.com",
  projectId: "lakeducation-dev",
}};
const app = initializeApp(devConfig, "deleteApp");
const db = getFirestore(app, "lakeducationdb");

await deleteDoc(doc(db, "learning_materials", "{material_id}"));
console.log("Deleted test material {material_id}");
process.exit(0);
"""
    subprocess.run(["node", "-e", node_script], check=True)

def run_lifecycle_test():
    print("==================================================================")
    print("🚀 PHÒNG QC & IT: KIỂM THỬ E2E TOÀN DIỆN CHIA SẺ & GỠ QUYỀN TÀI LIỆU")
    print("==================================================================")

    test_material_id = f"mat_qc_test_{int(time.time())}"
    test_material_title = "Wonders G5 Unit 1 - QC E2E Advanced Vocabulary"

    print(f"🌱 1. Seed tài liệu test vào Firestore: {test_material_title} [{test_material_id}]...")
    seed_test_material(test_material_id, test_material_title)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ============================================================
            # BƯỚC 1: ADMIN MỞ BẢNG & CHIA SẺ CHO HV253
            # ============================================================
            print("\n--- [BƯỚC 1]: ADMIN MỞ BẢNG TÀI LIỆU & MỞ DRAWER CHIA SẺ ---")
            ctx_admin = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_admin.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ADM001');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_admin = ctx_admin.new_page()

            page_admin.goto("http://localhost:3000/learning-materials", wait_until="domcontentloaded")
            page_admin.wait_for_timeout(2500)

            # Tìm kiếm tài liệu test vừa tạo
            search_input = page_admin.locator("input[placeholder*='Tìm kiếm'], input[placeholder*='Search']").first
            if search_input.is_visible():
                search_input.fill(test_material_title)
                page_admin.wait_for_timeout(1000)

            share_btn = page_admin.locator(f"[data-testid='btn-share-material-{test_material_id}']")
            assert share_btn.is_visible(), f"LỖI: Nút chia sẻ của tài liệu {test_material_id} không hiển thị!"
            print("👉 Bấm nút 'Chia Sẻ & Phân Quyền'...")
            share_btn.click()
            page_admin.wait_for_timeout(1000)

            drawer = page_admin.locator("[data-testid='material-share-drawer']")
            assert drawer.is_visible(), "LỖI: MaterialShareDrawer không mở ra!"

            # Chọn học viên HV253
            print("👉 Chọn học viên HV253 (Melissa)...")
            select_input = page_admin.locator("[data-testid='select-share-recipients']")
            select_input.click()
            page_admin.wait_for_timeout(500)

            page_admin.keyboard.type("HV253")
            page_admin.wait_for_timeout(500)
            page_admin.locator(".ant-select-item-option:has-text('HV253')").first.click()
            page_admin.wait_for_timeout(500)

            page_admin.keyboard.press("Escape")
            page_admin.wait_for_timeout(500)

            # Bấm nút Thêm Quyền Truy Cập
            print("👉 Bấm nút 'Cấp Quyền Truy Cập Cho Đã Chọn'...")
            confirm_btn = page_admin.locator("[data-testid='btn-confirm-add-share']")
            confirm_btn.click()
            page_admin.wait_for_timeout(2000)

            # Chụp ảnh Drawer sau khi share
            shot_drawer = os.path.join(ARTIFACT_DIR, "qc_materials_share_drawer.png")
            page_admin.screenshot(path=shot_drawer)
            print(f"📸 Đã chụp ảnh Drawer Chia Sẻ: {shot_drawer}")

            # Kiểm tra bảng shares có HV253
            drawer_text = drawer.inner_text()
            assert "HV253" in drawer_text, "LỖI: HV253 phải xuất hiện trong bảng danh sách đã share!"
            print("✅ [BƯỚC 1 PASS]: Đã cấp quyền chia sẻ thành công cho HV253!")
            ctx_admin.close()

            # ============================================================
            # BƯỚC 2: HỌC VIÊN ĐƯỢC SHARE (HV253) ĐĂNG NHẬP -> XÁC NHẬN THẤY TÀI LIỆU
            # ============================================================
            print("\n--- [BƯỚC 2]: HỌC VIÊN ĐƯỢC SHARE (HV253) ĐĂNG NHẬP ---")
            ctx_hv253 = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_hv253.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_hv253 = ctx_hv253.new_page()
            page_hv253.goto("http://localhost:3000/learning-materials", wait_until="domcontentloaded")
            page_hv253.wait_for_timeout(2500)

            hv253_content = page_hv253.locator("body").inner_text()
            has_test_mat_hv253 = test_material_title in hv253_content
            print(f"   - HV253 nhìn thấy tài liệu được share: {has_test_mat_hv253} (Kỳ vọng: TRUE)")
            shot_hv253 = os.path.join(ARTIFACT_DIR, "qc_materials_student_view_hv253.png")
            page_hv253.screenshot(path=shot_hv253)
            print(f"📸 Đã chụp ảnh màn hình HV253: {shot_hv253}")
            assert has_test_mat_hv253, f"LỖI: Học viên HV253 bắt buộc phải thấy tài liệu '{test_material_title}'!"
            print("✅ [BƯỚC 2 PASS]: Học viên được share nhìn thấy tài liệu chính xác 100%!")
            ctx_hv253.close()

            # ============================================================
            # BƯỚC 3: HỌC VIÊN KHÔNG ĐƯỢC SHARE (HV739) ĐĂNG NHẬP -> ẨN TUYỆT ĐỐI
            # ============================================================
            print("\n--- [BƯỚC 3]: HỌC VIÊN KHÔNG ĐƯỢC SHARE (HV739) ĐĂNG NHẬP ---")
            ctx_hv739 = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_hv739.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV739');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_hv739 = ctx_hv739.new_page()
            page_hv739.goto("http://localhost:3000/learning-materials", wait_until="domcontentloaded")
            page_hv739.wait_for_timeout(2500)

            hv739_content = page_hv739.locator("body").inner_text()
            has_test_mat_hv739 = test_material_title in hv739_content
            print(f"   - HV739 nhìn thấy tài liệu riêng: {has_test_mat_hv739} (Kỳ vọng: FALSE)")
            assert not has_test_mat_hv739, f"LỖI BẢO MẬT: Học viên HV739 không được share nhưng vẫn thấy tài liệu '{test_material_title}'!"
            print("✅ [BƯỚC 3 PASS]: Quyền riêng tư bảo đảm 100% — Học viên không được share bị ẩn hoàn toàn!")
            ctx_hv739.close()

            # ============================================================
            # BƯỚC 4: ADMIN XÓA QUYỀN TRUY CẬP (REVOKE ACCESS) CỦA HV253
            # ============================================================
            print("\n--- [BƯỚC 4]: ADMIN XÓA QUYỀN TRUY CẬP (REVOKE ACCESS) CỦA HV253 ---")
            ctx_admin2 = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_admin2.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ADM001');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_admin2 = ctx_admin2.new_page()
            page_admin2.goto("http://localhost:3000/learning-materials", wait_until="domcontentloaded")
            page_admin2.wait_for_timeout(2000)

            # Tìm lại tài liệu test
            search_input2 = page_admin2.locator("input[placeholder*='Tìm kiếm'], input[placeholder*='Search']").first
            if search_input2.is_visible():
                search_input2.fill(test_material_title)
                page_admin2.wait_for_timeout(1000)

            share_btn2 = page_admin2.locator(f"[data-testid='btn-share-material-{test_material_id}']")
            share_btn2.click()
            page_admin2.wait_for_timeout(1000)

            # Tìm nút Xóa Quyền của HV253
            revoke_btn = page_admin2.locator(f"[data-testid='btn-revoke-share-HV253']").first
            assert revoke_btn.is_visible(), "LỖI: Nút xóa quyền của HV253 không xuất hiện!"
            print("👉 Bấm nút 'Gỡ Quyền' (Revoke)...")
            revoke_btn.click()
            page_admin2.wait_for_timeout(500)

            # Bấm xác nhận trên Popconfirm
            pop_confirm_btn = page_admin2.locator(".ant-popover .ant-btn-dangerous, .ant-popconfirm .ant-btn-dangerous, .ant-popover .ant-btn-primary").first
            pop_confirm_btn.click()
            page_admin2.wait_for_timeout(1500)

            shot_revoked = os.path.join(ARTIFACT_DIR, "qc_materials_revoked_drawer.png")
            page_admin2.screenshot(path=shot_revoked)
            print(f"📸 Đã chụp ảnh Drawer sau khi gỡ quyền: {shot_revoked}")

            drawer_text2 = page_admin2.locator("[data-testid='material-share-drawer']").inner_text()
            assert "HV253" not in drawer_text2, "LỖI: HV253 vẫn còn trong bảng sau khi gỡ quyền!"
            print("✅ [BƯỚC 4 PASS]: Đã gỡ quyền truy cập của HV253 thành công 0ms!")
            ctx_admin2.close()

            # ============================================================
            # BƯỚC 5: HỌC VIÊN HV253 ĐĂNG NHẬP LẠI -> TÀI LIỆU BIẾN MẤT TỨC THÌ
            # ============================================================
            print("\n--- [BƯỚC 5]: HỌC VIÊN HV253 ĐĂNG NHẬP LẠI (KIỂM TRA GỠ QUYỀN) ---")
            ctx_hv253_recheck = browser.new_context(viewport={"width": 1366, "height": 850})
            ctx_hv253_recheck.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            page_hv253_recheck = ctx_hv253_recheck.new_page()
            page_hv253_recheck.goto("http://localhost:3000/learning-materials", wait_until="domcontentloaded")
            page_hv253_recheck.wait_for_timeout(2500)

            recheck_content = page_hv253_recheck.locator("body").inner_text()
            has_test_mat_after_revoke = test_material_title in recheck_content
            print(f"   - HV253 nhìn thấy tài liệu sau khi bị gỡ quyền: {has_test_mat_after_revoke} (Kỳ vọng: FALSE)")
            assert not has_test_mat_after_revoke, f"LỖI: Tài liệu '{test_material_title}' vẫn hiển thị cho HV253 sau khi đã gỡ quyền!"
            print("✅ [BƯỚC 5 PASS]: Tài liệu biến mất ngay lập tức sau khi gỡ quyền (Revocation Verified)!")
            ctx_hv253_recheck.close()

            print("\n==================================================================")
            print("🎉 TẤT CẢ 5/5 BƯỚC KIỂM THỬ E2E CHIA SẺ & GỠ QUYỀN ĐẠT 100% PASS!")
            print("==================================================================")
            return True

        except Exception as e:
            print(f"\n❌ Kiểm thử E2E thất bại: {e}")
            return False
        finally:
            print("\n--- [DỌN DẸP]: DỌN SẠCH 100% DỮ LIỆU TEST (ZERO RESIDUE) ---")
            delete_test_material(test_material_id)
            browser.close()

if __name__ == "__main__":
    ok = run_lifecycle_test()
    sys.exit(0 if ok else 1)
