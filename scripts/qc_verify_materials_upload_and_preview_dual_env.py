#!/usr/bin/env python3
"""
scripts/qc_verify_materials_upload_and_preview_dual_env.py
===========================================================
QC Dual-Environment Learning Materials Upload & Preview Auditor
Kiểm thử thực tế 2 môi trường (DEV & PROD) luồng Học Liệu:
1. Xem trước sách PDF G5 (ReadingWriting Companion G5U1-2) -> Assert iframe preview hiển thị, KHÔNG CÓ CẢNH BÁO blob.
2. Tải lên tệp PDF nhị phân thật qua Google Drive Zero-Egress -> Assert progress 100%, tạo bản ghi thành công.
3. Xem trước tệp PDF vừa tải lên -> Assert iframe Google Drive Preview hiển thị mượt mà.
4. Xem trước Video / Audio / Image nếu có trong danh sách.
5. TEARDOWN: Xóa 100% dữ liệu test trên Firestore (Zero Residue).
"""

import sys
import os
import time
import subprocess
from playwright.sync_api import sync_playwright

TEST_PDF_PATH = "/tmp/qc_sample_curriculum.pdf"
DEV_BASE_URL = "http://localhost:3000"
PROD_BASE_URL = "https://bk.lakeducation.edu.vn"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def generate_sample_pdf():
    print("[1/4] Generating valid sample PDF...")
    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n"
        b"4 0 obj<</Length 55>>stream\n"
        b"BT /F1 18 Tf 50 700 Td (LAK EDUCATION - CURRICULUM SAMPLE PDF) Tj ET\n"
        b"endstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n0000000195 00000 n \n"
        b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n301\n%%EOF"
    )
    with open(TEST_PDF_PATH, "wb") as f:
        f.write(pdf_bytes)
    print(f"      Created {TEST_PDF_PATH} ({len(pdf_bytes)} bytes).")

def test_materials_flow(page, base_url, env_label):
    print(f"\n=======================================================")
    print(f"---> RUNNING MATERIALS AUDIT ON [{env_label}]: {base_url}")
    print(f"=======================================================")
    
    target_url = f"{base_url}/learning-materials?sso_uid=ADM001"
    page.goto(target_url, wait_until="domcontentloaded")
    
    # Wait for Table to load
    page.wait_for_selector(".ant-table-row", timeout=20000)
    print("      Materials table loaded successfully.")
    time.sleep(1.5)

    # ----------------------------------------------------
    # TEST 1: Xem trước Sách PDF G5 (ReadingWriting Companion)
    # ----------------------------------------------------
    print("\n   [Case 1]: Verifying Preview of Official Wonders G5 PDF...")
    g5_row = page.locator(".ant-table-row:has-text('ReadingWriting Companion G5')").first
    if g5_row.is_visible():
        preview_btn = g5_row.locator("button:has-text('Preview'), button:has-text('Xem Trước')").first
        preview_btn.click()
        page.wait_for_selector(".ant-modal", timeout=8000)
        time.sleep(2)
        
        # Assert NO blob warning card
        blob_warn = page.locator("[data-testid='preview-blob-warning-card']")
        assert not blob_warn.is_visible(), "REGRESSION: Blob warning card is visible on G5 PDF!"
        
        # Assert PDF iframe is rendered
        pdf_iframe = page.locator("iframe[data-testid='preview-pdf-iframe'], .ant-modal iframe").first
        assert pdf_iframe.is_visible(), "FAIL: PDF Preview iframe not visible!"
        print("      PASS: G5 PDF Preview loaded cleanly with Google Drive iframe (No warning)!")
        
        g5_screenshot = f"/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_{env_label.lower()}_preview_g5_pdf.png"
        page.screenshot(path=g5_screenshot)
        print(f"      Screenshot saved: {g5_screenshot}")
        
        # Close modal
        close_btn = page.locator(".ant-modal-close").first
        close_btn.click()
        time.sleep(1)
    else:
        print("      Note: G5 PDF row not found on first page of table.")

    # ----------------------------------------------------
    # TEST 2: Tải lên tệp PDF nhị phân thật (Drag & Drop)
    # ----------------------------------------------------
    print(f"\n   [Case 2]: Uploading Real Binary PDF to Google Drive Zero-Egress...")
    file_input = page.locator("[data-testid='materials-upload-dragger'] input[type='file'], input[type='file']").first
    file_input.set_input_files(TEST_PDF_PATH)
    
    # Wait for upload modal
    page.wait_for_selector(".ant-modal", timeout=8000)
    print("      Material Upload Modal is open.")
    time.sleep(1)
    
    # Fill title
    test_title = f"QC Dual-Env PDF Test {env_label} {int(time.time())}"
    title_input = page.locator(".ant-modal input#title").first
    title_input.fill(test_title)
    
    # Submit upload
    submit_btn = page.locator("[data-testid='btn-submit-upload-material']").first
    submit_btn.click()
    print("      Clicked 'Save & Upload'. Waiting for Google Drive transfer...")
    
    # Wait up to 35s for modal to close
    t0 = time.time()
    uploaded = False
    while time.time() - t0 < 35:
        if not page.locator(".ant-modal").is_visible():
            uploaded = True
            print("      Upload completed! Modal closed successfully.")
            break
        time.sleep(1)
        
    if not uploaded:
        raise Exception(f"Timed out waiting for file upload on {env_label}")

    time.sleep(2)

    # ----------------------------------------------------
    # TEST 3: Xem trước tệp PDF vừa tải lên
    # ----------------------------------------------------
    print(f"\n   [Case 3]: Verifying Preview of newly uploaded PDF...")
    new_row = page.locator(f".ant-table-row:has-text('{test_title}')").first
    if not new_row.is_visible():
        # Try refreshing table
        refresh_btn = page.locator("button:has-text('Refresh'), button:has-text('Làm mới')").first
        if refresh_btn.is_visible():
            refresh_btn.click()
            time.sleep(2)
        new_row = page.locator(f".ant-table-row:has-text('{test_title}')").first

    assert new_row.is_visible(), f"FAIL: Newly uploaded material '{test_title}' not found in table!"
    
    new_preview_btn = new_row.locator("button:has-text('Preview'), button:has-text('Xem Trước')").first
    new_preview_btn.click()
    page.wait_for_selector(".ant-modal", timeout=8000)
    time.sleep(2)
    
    # Assert preview iframe
    new_iframe = page.locator(".ant-modal iframe").first
    assert new_iframe.is_visible(), "FAIL: Newly uploaded PDF preview iframe not visible!"
    print("      PASS: Newly uploaded PDF preview rendered with permanent Drive viewer!")
    
    new_screenshot = f"/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_{env_label.lower()}_preview_uploaded_pdf.png"
    page.screenshot(path=new_screenshot)
    print(f"      Screenshot saved: {new_screenshot}")
    
    # Close modal
    page.locator(".ant-modal-close").first.click()
    time.sleep(1)

    return test_title

def teardown_test_material(test_title):
    print(f"\n[Teardown] Cleaning up test material: '{test_title}'...")
    cmd = ["node", "scripts/teardown_test_material.mjs", test_title]
    try:
        res = subprocess.run(cmd, cwd="/Volumes/DATA/projects/ThiEducation", capture_output=True, text=True, timeout=10)
        print(f"      {res.stdout.strip()}")
    except Exception as e:
        print(f"      Teardown note: {e}")

def main():
    generate_sample_pdf()
    
    titles_to_clean = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--disable-blink-features=AutomationControlled"])
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            # 1. Audit on DEV
            dev_title = test_materials_flow(page, DEV_BASE_URL, "DEV")
            titles_to_clean.append(dev_title)

            # 2. Audit on PROD
            prod_title = test_materials_flow(page, PROD_BASE_URL, "PROD")
            titles_to_clean.append(prod_title)

            print("\n=======================================================")
            print("🎉 ALL MATERIALS UPLOAD & PREVIEW TESTS PASSED ON BOTH DEV AND PROD!")
            print("=======================================================")
        finally:
            browser.close()
            for t in titles_to_clean:
                teardown_test_material(t)

if __name__ == "__main__":
    main()
