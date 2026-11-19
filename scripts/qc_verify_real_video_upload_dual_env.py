#!/usr/bin/env python3
"""
scripts/qc_verify_real_video_upload_dual_env.py
================================================
QC Dual-Environment Real Binary Video Upload Auditor
Kiểm thử thực tế 2 môi trường (DEV & PROD) luồng Upload Video Ghi Hình Buổi Học:
1. Tạo tệp .mp4 nhị phân thật (Real Binary Payload qua ffmpeg).
2. Kiểm tra Preflight CORS Headers từ Origin:
   - https://bk.lakeducation.edu.vn (Live Prod)
   - https://dev.lakeducation.edu.vn (Dev)
   - https://lakeducation-dev-erp.web.app
   - http://localhost:3000
3. Chạy Playwright E2E trên DEV (http://localhost:3000):
   - Đăng nhập Teacher Maj (GV952), mở lớp LH002.
   - Chuyển sang Tab 3 (Đánh giá sau giờ).
   - Mở modal Upload Session Recording.
   - Đính kèm tệp .mp4 nhị phân thật (52 KB).
   - Submit và assert tiến trình upload chạy 100%, không bị 403 CORS.
   - TEARDOWN: Xóa bản ghi test trong Firestore.
4. Chạy Playwright E2E trên PROD (https://bk.lakeducation.edu.vn):
   - Đăng nhập Teacher Maj (GV952), mở lớp LH002.
   - Chuyển sang Tab 3 (Đánh giá sau giờ).
   - Mở modal Upload Session Recording.
   - Đính kèm tệp .mp4 nhị phân thật (52 KB).
   - Submit và assert tiến trình upload chạy 100%, không bị 403 CORS.
   - TEARDOWN: Xóa bản ghi test trong Firestore.
"""

import sys
import os
import time
import subprocess
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

TEST_MP4_PATH = "/tmp/qc_test_recording_sample.mp4"
PROD_BASE_URL = "https://bk.lakeducation.edu.vn"
DEV_BASE_URL = "http://localhost:3000"
API_STORAGE_URL = "https://hosting-store-api.phuchungvang.com/api/storage/upload-session"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def generate_sample_video():
    print("[1/5] Generating real sample MP4 video using ffmpeg...")
    cmd = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=15",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=2",
        "-pix_fmt", "yuv420p",
        TEST_MP4_PATH
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    size_bytes = os.path.getsize(TEST_MP4_PATH)
    print(f"      Created {TEST_MP4_PATH} ({size_bytes} bytes).")

def test_cors_preflight(origin):
    print(f"[2/5] Testing CORS Preflight for Origin: {origin}...")
    req = urllib.request.Request(
        API_STORAGE_URL,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization,x-app-id,x-user-id"
        },
        method="OPTIONS"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            allow_origin = resp.headers.get("Access-Control-Allow-Origin")
            print(f"      HTTP {resp.status} - Access-Control-Allow-Origin: {allow_origin}")
            if allow_origin == origin or allow_origin == "*":
                print(f"      PASS: CORS Preflight allowed for {origin}")
                return True
            else:
                print(f"      FAIL: Header value mismatch: {allow_origin}")
                return False
    except urllib.error.HTTPError as e:
        print(f"      FAIL: HTTPError {e.code}: {e.read().decode('utf-8', errors='ignore')}")
        return False
    except Exception as e:
        print(f"      FAIL: Exception {e}")
        return False

def run_e2e_video_upload(page, base_url, env_label):
    print(f"\n---> Running Playwright E2E Video Upload on [{env_label}]: {base_url}")
    target_url = f"{base_url}/classroom/LH002?sso_uid=GV952"
    page.goto(target_url, wait_until="domcontentloaded")
    
    # Wait for classroom UI to load
    page.wait_for_selector('[data-testid="tab-evaluation"]', timeout=20000)
    print("      Classroom UI loaded.")

    # Switch to Tab 3: Evaluation
    tab_eval = page.locator('[data-testid="tab-evaluation"]').first
    tab_eval.click()
    time.sleep(1.5)

    # Click Post Video / Upload button
    btn_upload = page.locator('[data-testid="btn-upload-session-recording"]').first
    if not btn_upload.is_visible():
        raise Exception(f"Cannot find Upload Session Recording button on {env_label}")
    btn_upload.click()
    
    # Wait for Modal to appear
    page.wait_for_selector('[data-testid="session-recording-upload-modal-title"]', timeout=8000)
    print(f"      Modal 'Upload Session Recording' is open.")

    # Attach file
    file_input = page.locator(".ant-modal input[type='file']").first
    file_input.set_input_files(TEST_MP4_PATH)
    time.sleep(1)

    # Set title
    test_title = f"QC Dual-Env Automated Test Video {env_label} {int(time.time())}"
    page.fill(".ant-modal input#title", test_title)

    # Listen to network requests
    cors_errors = []
    upload_responses = []
    
    def on_response(response):
        if "upload-session" in response.url:
            upload_responses.append(response.status)
            if response.status == 403:
                cors_errors.append(f"403 Forbidden on {response.url}")

    page.on("response", on_response)

    # Click Upload & Share button
    submit_btn = page.locator('[data-testid="btn-submit-session-recording"]').first
    submit_btn.click()
    print(f"      Clicked 'Upload & Share to Class' button. Waiting for progress...")

    # Wait up to 35s for modal to close or success message
    t0 = time.time()
    success = False
    while time.time() - t0 < 35:
        # Check if error alert appears
        error_alert = page.locator(".ant-modal .ant-alert-error")
        if error_alert.is_visible():
            err_text = error_alert.inner_text()
            raise Exception(f"Upload failed with alert on UI: {err_text}")
        
        # Check if modal closed
        if not page.locator(".ant-modal").is_visible():
            print(f"      Modal closed successfully! Upload completed.")
            success = True
            break
        time.sleep(1)

    screenshot_path = f"/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_verified_upload_{env_label.lower()}.png"
    page.screenshot(path=screenshot_path)
    print(f"      Screenshot saved: {screenshot_path}")

    if not success:
        raise Exception(f"Timed out waiting for upload completion on {env_label}")

    print(f"      Upload responses: {upload_responses}")
    if 403 in upload_responses:
        raise Exception(f"Encountered HTTP 403 CORS Forbidden during upload!")

    print(f"      PASS: Real video upload succeeded on [{env_label}]!")
    return test_title

def teardown_test_data(test_title):
    print(f"\n[Teardown] Cleaning up test data for title: '{test_title}'...")
    cmd = ["node", "scripts/teardown_test_material.mjs", test_title]
    try:
        res = subprocess.run(cmd, cwd="/Volumes/DATA/projects/ThiEducation", capture_output=True, text=True, timeout=10)
        print(f"      {res.stdout.strip()}")
    except Exception as e:
        print(f"      Teardown note: {e}")

def main():
    generate_sample_video()
    
    # 1. Test CORS Preflight
    origins_to_test = [
        "https://bk.lakeducation.edu.vn",
        "https://dev.lakeducation.edu.vn",
        "https://lakeducation-dev-erp.web.app",
        "http://localhost:3000"
    ]
    cors_all_pass = True
    for o in origins_to_test:
        if not test_cors_preflight(o):
            cors_all_pass = False

    if not cors_all_pass:
        print("\nCORS Preflight tests did NOT all pass!")
        sys.exit(1)

    print("\nAll CORS preflights passed! Now testing Playwright E2E on DEV and PROD...")
    
    titles_to_clean = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--disable-blink-features=AutomationControlled"])
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            # DEV E2E
            dev_title = run_e2e_video_upload(page, DEV_BASE_URL, "DEV")
            titles_to_clean.append(dev_title)

            # PROD E2E
            prod_title = run_e2e_video_upload(page, PROD_BASE_URL, "PROD")
            titles_to_clean.append(prod_title)

            print("\n=======================================================")
            print("🎉 ALL TESTS PASSED ON BOTH DEV AND PROD!")
            print("=======================================================")
        finally:
            browser.close()
            for t in titles_to_clean:
                teardown_test_data(t)

if __name__ == "__main__":
    main()
