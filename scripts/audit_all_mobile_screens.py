import os
import sys
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/mobile_audit')
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

ROUTES_TO_AUDIT = [
    {"name": "Landing Page", "path": "/", "role": None},
    {"name": "Dashboard (Admin)", "path": "/dashboard", "role": "ADM001"},
    {"name": "Dashboard (Teacher)", "path": "/dashboard", "role": "GV952"},
    {"name": "Dashboard (Student)", "path": "/dashboard", "role": "HV151"},
    {"name": "Courses & Classes (Tab 1 Classes)", "path": "/courses-classes", "role": "ADM001"},
    {"name": "Courses & Classes (Tab 2 Courses)", "path": "/courses-classes?tab=courses", "role": "ADM001"},
    {"name": "Courses & Classes (Tab 3 Curriculum)", "path": "/courses-classes?tab=curriculum", "role": "ADM001"},
    {"name": "Students Management", "path": "/students", "role": "ADM001"},
    {"name": "Learning Materials Digital Vault", "path": "/learning-materials", "role": "ADM001"},
    {"name": "English Exercises & Authoring", "path": "/english-exercises", "role": "ADM001"},
    {"name": "Live Zoom Schedules (Weekly Calendar)", "path": "/zoom-schedules", "role": "ADM001"},
    {"name": "Class Attendance & Evaluations", "path": "/class-attendance-evaluation", "role": "ADM001"},
    {"name": "Contracts & Payroll", "path": "/contracts-payroll", "role": "ADM001"},
    {"name": "Tuition Fees & Invoices", "path": "/tuition-fees", "role": "ADM001"},
    {"name": "User Management & RBAC", "path": "/user-management", "role": "ADM001"},
    {"name": "User Registration Form", "path": "/user-management/register", "role": "ADM001"},
    {"name": "My Profile & Security", "path": "/my-profile", "role": "ADM001"},
    {"name": "Virtual Classroom (LH005 Live Session)", "path": "/classroom/LH005", "role": "GV952"},
]

VIEWPORTS = [
    {"name": "iPhone 12/13/14 (390x844)", "width": 390, "height": 844},
    {"name": "Android Standard (360x800)", "width": 360, "height": 800},
]

def run_mobile_audit():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        for vp in VIEWPORTS:
            vp_name = vp["name"]
            width = vp["width"]
            height = vp["height"]
            print(f"\n=======================================================")
            print(f"📱 KIỂM TOÁN VIEWPORT: {vp_name}")
            print(f"=======================================================")

            for r in ROUTES_TO_AUDIT:
                route_name = r["name"]
                path = r["path"]
                role = r["role"]

                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    is_mobile=True,
                    has_touch=True,
                    device_scale_factor=2,
                )

                page = context.new_page()

                # Setup auth if required
                if role:
                    page.goto(f"{BASE_URL}/?sso_uid={role}", wait_until='domcontentloaded')
                    page.wait_for_timeout(400)
                
                # Navigate to target path
                target_url = f"{BASE_URL}{path}"
                page.goto(target_url, wait_until='domcontentloaded')
                page.wait_for_timeout(1000)

                # Measure dimensions and find any overflowing elements
                audit_data = page.evaluate("""() => {
                    const vw = window.innerWidth;
                    const sw = Math.max(
                        document.documentElement.scrollWidth,
                        document.body.scrollWidth
                    );
                    const isOverflow = sw > vw + 1;
                    
                    // Find overflowing elements if any
                    const overflowingEls = [];
                    if (isOverflow) {
                        const allEls = document.querySelectorAll('*');
                        for (const el of allEls) {
                            const rect = el.getBoundingClientRect();
                            if (rect.right > vw + 2) {
                                overflowingEls.push({
                                    tag: el.tagName,
                                    className: (el.className || '').toString().substring(0, 50),
                                    right: Math.round(rect.right),
                                    width: Math.round(rect.width)
                                });
                                if (overflowingEls.length >= 3) break;
                            }
                        }
                    }

                    // Check Header dimensions
                    const header = document.querySelector('header');
                    const headerRect = header ? header.getBoundingClientRect() : null;

                    // Check Footer
                    const footer = document.querySelector('footer');
                    const hasFooter = Boolean(footer);

                    return {
                        innerWidth: vw,
                        scrollWidth: sw,
                        isOverflow: isOverflow,
                        overflowingEls: overflowingEls,
                        headerWidth: headerRect ? Math.round(headerRect.width) : null,
                        hasFooter: hasFooter
                    };
                }""")

                is_pass = not audit_data["isOverflow"]
                status = "PASS" if is_pass else "FAIL"

                slug_name = route_name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("&", "and").replace("/", "_")
                screenshot_filename = f"{width}px_{slug_name}.png"
                screenshot_path = ARTIFACTS_DIR / screenshot_filename
                page.screenshot(path=str(screenshot_path))

                result_entry = {
                    "viewport": vp_name,
                    "width": width,
                    "routeName": route_name,
                    "path": path,
                    "role": role,
                    "passed": is_pass,
                    "innerWidth": audit_data["innerWidth"],
                    "scrollWidth": audit_data["scrollWidth"],
                    "overflowingEls": audit_data["overflowingEls"],
                    "screenshot": str(screenshot_path)
                }
                results.append(result_entry)

                print(f"  [{status}] {route_name:<42} | scrollWidth: {audit_data['scrollWidth']}px / {width}px | Screenshot: {screenshot_filename}")
                if not is_pass:
                    print(f"      🚨 Overflow elements: {audit_data['overflowingEls']}")

                context.close()

        browser.close()

    # Summary
    print("\n=======================================================")
    print("📊 TỔNG HỢP KẾT QUẢ KIỂM TOÁN MOBILE TOÀN BỘ MÀN HÌNH")
    print("=======================================================")
    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = total - passed_count
    print(f"Tổng số lượt kiểm tra: {total}")
    print(f"Đạt chuẩn (PASS): {passed_count}")
    print(f"Vi phạm (FAIL): {failed_count}")

    # Save JSON summary
    summary_path = ARTIFACTS_DIR / "mobile_audit_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Summary JSON saved to {summary_path}")

    return failed_count == 0

if __name__ == '__main__':
    success = run_mobile_audit()
    sys.exit(0 if success else 1)

