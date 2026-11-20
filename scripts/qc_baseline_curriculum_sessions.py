import sys
import time
from playwright.sync_api import sync_playwright

def run_baseline_audit():
    print("[BASELINE AUDIT] Inspecting current Classroom sessions and dropdown...")
    CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        page = browser.new_page(viewport={"width": 1366, "height": 768})
        try:
            page.goto("http://localhost:3000/classroom/LH002?tab=curriculum&sso_uid=GV952", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(3000)

            # Click tab-curriculum to be sure
            curriculum_tab = page.locator("[data-testid='tab-curriculum']")
            if curriculum_tab.count() > 0:
                curriculum_tab.click()
                page.wait_for_timeout(1000)
                print("[BASELINE AUDIT] Clicked [data-testid='tab-curriculum'].")
            
            # Locate dropdown
            select_el = page.locator("[data-testid='select-quick-jump-session']")
            if select_el.count() > 0:
                print("[BASELINE AUDIT] Found select-quick-jump-session.")
                select_el.click()
                page.wait_for_timeout(1000)
                
                # Check options in dropdown
                options = page.locator(".ant-select-item-option-content")
                opt_count = options.count()
                print(f"[BASELINE AUDIT] Current session options count: {opt_count}")
                first_3 = [options.nth(i).inner_text() for i in range(min(5, opt_count))]
                print("[BASELINE AUDIT] Sample options before fix:")
                for item in first_3:
                    print("   -", item)
            else:
                print("[BASELINE AUDIT] select-quick-jump-session not found directly, checking DOM.")
            
            # Screenshot baseline
            page.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_baseline_curriculum_sessions.png")
            print("[BASELINE AUDIT] Baseline screenshot saved.")
        except Exception as e:
            print(f"[BASELINE AUDIT] Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_baseline_audit()
