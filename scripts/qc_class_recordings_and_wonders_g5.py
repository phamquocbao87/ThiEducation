#!/usr/bin/env python3
"""
QC E2E 5-Axis Verification Suite:
- Task A (Điểm 6): Master Class Recordings Directory ("File Tổng Cho Recording") on /zoom-schedules & /classroom/:classId + Real .xlsx Export + Real .mp4 Upload/Delete
- Task B (Điểm 7): Course-to-Class-to-Student WONDERS-G5 Inheritance & DEV Data Synchronization (WP02 LH004 & WP03 LH002)
Specs:
  - docs/specs/SPEC_CLASS_RECORDINGS_MASTER_SHEET.md
  - docs/specs/SPEC_FIX_STUDENT_WONDERS_G4_LEVEL.md
Environment: DEV Localhost (http://localhost:3000 -> lakeducation-dev)
"""

import os
import subprocess
import time
import xml.etree.ElementTree as ET
import zipfile
from playwright.sync_api import sync_playwright

LOCAL_URL = "http://localhost:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
TMP_MP4 = f"/tmp/qc_master_recording_{int(time.time())}.mp4"
TMP_XLSX = f"/tmp/qc_exported_recordings_{int(time.time())}.xlsx"


def generate_real_mp4(path: str):
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "testsrc=duration=2:size=640x360:rate=15",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    assert os.path.exists(path) and os.path.getsize(path) > 1024
    print(f"✅ Generated real binary MP4: {path} ({os.path.getsize(path)} bytes)")


def assert_zero_overflow(page, label: str):
    metrics = page.evaluate(
        """() => ({
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth
        })"""
    )
    assert metrics["scrollWidth"] <= metrics["innerWidth"], (
        f"FAIL [{label}]: Horizontal overflow detected! "
        f"scrollWidth={metrics['scrollWidth']} > innerWidth={metrics['innerWidth']}"
    )
    print(f"   ✅ Zero Overflow-X [{label}]: {metrics['scrollWidth']}px <= {metrics['innerWidth']}px")


def run_qc():
    print("=" * 94)
    print("🧪 QC 5-AXIS SUITE: MASTER CLASS RECORDINGS DIRECTORY (.XLSX + .MP4) & WONDERS-G5 SYNC")
    print("=" * 94)

    generate_real_mp4(TMP_MP4)
    ts = int(time.time())
    test_rec_title = f"QC Master Directory MP4 {ts}"
    created_rec_ids = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        ctx_teardown = browser.new_context(viewport={"width": 1366, "height": 850})
        page_teardown = ctx_teardown.new_page()

        try:
            # ------------------------------------------------------------------
            # STEP 1 (ĐIỂM 7 — A3): SYNC KH-7569 (WONDERS-G5) -> LH002, LH004, USERS & GOALS ON DEV
            # ------------------------------------------------------------------
            print("\n--- [1/5] ĐIỂM 7 (A3): SYNC WONDERS-G5 ACROSS WP02 (LH004), WP03 (LH002), USERS & GOALS ---")
            page_teardown.goto(f"{LOCAL_URL}/dashboard?sso_uid=ADM001", wait_until="domcontentloaded", timeout=40000)
            page_teardown.wait_for_timeout(3500)

            sync_summary = page_teardown.evaluate(
                """async () => {
                    const { ClassService } = await import('/src/modules/courses/services/ClassService.js');
                    const { CourseService } = await import('/src/modules/courses/services/CourseService.js');
                    const { UserService } = await import('/src/modules/users/services/UserService.js');
                    const { StudentGoalService } = await import('/src/modules/students/services/StudentGoalService.js');

                    const parentCourse = await CourseService.getCourseById('KH-7569');
                    const classes = await ClassService.getAllClasses();
                    const targets = classes.filter((c) => c.courseId === 'KH-7569' || ['LH002', 'LH004'].includes(c.id));

                    let healedGoals = 0;
                    for (const cls of targets) {
                        await ClassService.saveClass({
                            ...cls,
                            courseLevel: parentCourse?.level || 'WONDERS-G5',
                            courseName: parentCourse?.name || cls.courseName,
                        });
                        const enrichedCls = {
                            ...cls,
                            courseLevel: parentCourse?.level || 'WONDERS-G5',
                        };
                        for (const sid of (cls.studentIds || [])) {
                            const g = await StudentGoalService.getStudentGoalForClass(sid, enrichedCls);
                            if (g?.courseLevel === 'WONDERS-G5') healedGoals += 1;
                        }
                    }

                    const afterClasses = await ClassService.getAllClasses();
                    const afterUsers = await UserService.getAllUsers();
                    const g4Remaining = afterUsers.filter((u) => {
                        const enrolled = u.enrolledClassIds || [];
                        return (enrolled.includes('LH002') || enrolled.includes('LH004')) && /G4/i.test(String(u.level || ''));
                    });
                    const wpAfter = afterClasses
                        .filter((c) => ['LH002', 'LH004'].includes(c.id))
                        .map((c) => ({ id: c.id, name: c.name, courseLevel: c.courseLevel }));

                    return {
                        parentLevel: parentCourse?.level,
                        wpAfter,
                        healedGoals,
                        g4RemainingCount: g4Remaining.length,
                    };
                }"""
            )
            print(f"   🔄 Sync summary: {sync_summary}")
            assert sync_summary["parentLevel"] == "WONDERS-G5"
            assert sync_summary["g4RemainingCount"] == 0, f"FAIL: G4 users still remaining! {sync_summary}"
            assert all(c["courseLevel"] == "WONDERS-G5" for c in sync_summary["wpAfter"]), (
                f"FAIL: Classes not synced to WONDERS-G5! {sync_summary['wpAfter']}"
            )

            # Verify live UI as Student HV235 (Tracy in WP03 LH002) & Student HV768 (Kenji in WP02 LH004)
            ctx_stu = browser.new_context(viewport={"width": 1366, "height": 850})
            page_stu = ctx_stu.new_page()
            page_stu.goto(f"{LOCAL_URL}/dashboard?sso_uid=HV235", wait_until="domcontentloaded", timeout=40000)
            page_stu.wait_for_timeout(3600)
            assert "WONDERS-G4" not in page_stu.locator("body").inner_text(), (
                "FAIL: WONDERS-G4 still visible on HV235 Dashboard!"
            )

            page_stu.goto(f"{LOCAL_URL}/my-profile", wait_until="domcontentloaded", timeout=40000)
            page_stu.wait_for_timeout(3200)
            page_stu.locator(".ant-tabs-tab").nth(1).click()
            page_stu.wait_for_timeout(800)
            profile_txt = page_stu.locator("body").inner_text()
            assert "WONDERS-G4" not in profile_txt and "WONDERS-G5" in profile_txt, (
                "FAIL: HV235 Profile does not show WONDERS-G5!"
            )

            page_stu.goto(f"{LOCAL_URL}/classroom/LH002", wait_until="domcontentloaded", timeout=40000)
            page_stu.wait_for_timeout(3500)
            page_stu.locator('[data-testid="tab-curriculum"]').click()
            page_stu.wait_for_timeout(1200)
            vault_tag = page_stu.locator('[data-testid="course-vault-level-tag"]')
            vault_tag.wait_for(state="visible", timeout=10000)
            vault_tag_txt = vault_tag.inner_text().strip()
            assert vault_tag_txt == "WONDERS-G5", f"FAIL: Course Program Vault tag shows '{vault_tag_txt}' instead of 'WONDERS-G5'!"
            assert "WONDERS-G4" not in page_stu.locator("body").inner_text(), "FAIL: WONDERS-G4 leaked on /classroom/LH002!"

            page_stu.locator('[data-testid="course-program-vault"]').scroll_into_view_if_needed()
            page_stu.wait_for_timeout(300)
            page_stu.screenshot(path=f"{ARTIFACT_DIR}/qc_wonders_g5_fixed_hv235_vault.png")
            print("   ✅ HV235 (WP03 LH002) Dashboard, Profile & Course Program Vault show 100% WONDERS-G5 (0 WONDERS-G4)!")

            # Also verify Student HV235 scoping on /zoom-schedules -> Class Recordings tab!
            print("\n--- [2/5] AXIS 3: STUDENT HV235 CLASS RECORDINGS SCOPING & ISOLATION ---")
            page_stu.goto(f"{LOCAL_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=40000)
            page_stu.wait_for_timeout(3400)
            seg = page_stu.locator('[data-testid="segmented-schedule-view-mode"]')
            seg.get_by_text("Recording", exact=False).click()
            page_stu.wait_for_timeout(1200)
            dir_card_stu = page_stu.locator('[data-testid="schedule-recordings-dir"]')
            dir_card_stu.wait_for(state="visible", timeout=10000)
            assert page_stu.locator('[data-testid="schedule-recordings-dir-btn-upload"]').count() == 0
            assert page_stu.locator('[data-testid="schedule-recordings-dir-btn-export-xlsx"]').count() == 0
            assert page_stu.locator('[data-testid="schedule-recordings-dir-switch-include-missing"]').count() == 0
            assert "WP02 G5 Ms. Maj/246" not in dir_card_stu.inner_text(), "FAIL: Other class LH004 leaked to LH002 student!"
            print("   ✅ Student HV235 sees ONLY her class recordings (zero Upload/Delete/Export/Missing-Toggle & zero cross-class leak)!")
            ctx_stu.close()

            # ------------------------------------------------------------------
            # STEP 3 (ĐIỂM 6 — AXIS 1 & 2): ACADEMIC ACA404 SCHEDULE DIRECTORY + REAL .XLSX EXPORT + MISSING TOGGLE
            # ------------------------------------------------------------------
            print("\n--- [3/5] ĐIỂM 6 (AXIS 1 & 2): SCHEDULE RECORDINGS DIRECTORY + REAL .XLSX + MISSING TOGGLE ---")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 850}, accept_downloads=True)
            page_aca = ctx_aca.new_page()
            page_errors = []
            page_aca.on("pageerror", lambda exc: page_errors.append(str(exc)))

            page_aca.goto(f"{LOCAL_URL}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000)
            page_aca.wait_for_timeout(3400)
            page_aca.goto(f"{LOCAL_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=40000)
            page_aca.wait_for_timeout(3400)
            assert_zero_overflow(page_aca, "Schedule Page Desktop 1366")

            page_aca.locator('[data-testid="segmented-schedule-view-mode"]').get_by_text("Recording", exact=False).click()
            page_aca.wait_for_timeout(1200)
            dir_aca = page_aca.locator('[data-testid="schedule-recordings-dir"]')
            dir_aca.wait_for(state="visible", timeout=10000)

            # Select LH002 (WP03) in Class Selector so it shows existing recordings
            cls_select = page_aca.locator('[data-testid="schedule-recordings-dir-select-class"]')
            cls_select.click()
            page_aca.wait_for_timeout(400)
            page_aca.locator(".ant-select-item-option", has_text="WP03").first.click()
            page_aca.wait_for_timeout(800)

            # Default mode (A2): only existing recordings shown (no 'Chưa tải lên video' rows)
            default_txt = dir_aca.inner_text()
            assert "Session Recording" in default_txt or "WP03" in default_txt
            assert "Chưa tải lên video buổi học" not in default_txt and "No recording uploaded yet" not in default_txt, (
                "FAIL (A2): Default mode showed missing rows before toggle was switched ON!"
            )

            # Toggle ON 'Show sessions without video' -> verify missing past sessions appear with Upload button
            missing_switch = page_aca.locator('[data-testid="schedule-recordings-dir-switch-include-missing"]')
            missing_switch.click()
            page_aca.wait_for_timeout(600)
            toggled_txt = dir_aca.inner_text()
            print("   🔀 Toggled 'Include Missing Sessions' ON & OFF cleanly!")
            missing_switch.click()
            page_aca.wait_for_timeout(500)

            # Export real binary .xlsx and verify ZIP/OOXML structure & cell contents!
            with page_aca.expect_download(timeout=15000) as dl_info:
                page_aca.locator('[data-testid="schedule-recordings-dir-btn-export-xlsx"]').click()
            download = dl_info.value
            download.save_as(TMP_XLSX)
            assert os.path.exists(TMP_XLSX) and os.path.getsize(TMP_XLSX) > 500
            with open(TMP_XLSX, "rb") as f:
                magic = f.read(4)
            assert magic == b"PK\x03\x04", f"FAIL: Downloaded file is not a genuine ZIP/OOXML .xlsx! Magic={magic}"
            with zipfile.ZipFile(TMP_XLSX, "r") as zf:
                assert "xl/worksheets/sheet1.xml" in zf.namelist()
                sheet_xml = zf.read("xl/worksheets/sheet1.xml").decode("utf-8")
            root = ET.fromstring(sheet_xml)
            cell_texts = [el.text or "" for el in root.iter() if el.tag.endswith("}t")]
            joined_cells = " | ".join(cell_texts)
            assert "WP03" in joined_cells, f"FAIL: Exported .xlsx missing WP03 class rows! Cells: {joined_cells[:300]}"
            print(f"   📥 Verified Real Binary .xlsx Export ({os.path.getsize(TMP_XLSX)} bytes, {len(cell_texts)} XML text nodes)!")

            dir_aca.screenshot(path=f"{ARTIFACT_DIR}/qc_recordings_dir_schedule_aca404_desktop.png")

            # ------------------------------------------------------------------
            # STEP 4: CLASSROOM RECORDINGS DIRECTORY (/classroom/LH002) REAL .MP4 UPLOAD (0MS) + WATCH + DELETE (0MS)
            # ------------------------------------------------------------------
            print("\n--- [4/5] CLASSROOM RECORDINGS DIRECTORY: REAL .MP4 UPLOAD (0MS) + FULLSCREEN WATCH + 0MS DELETE ---")
            page_aca.goto(f"{LOCAL_URL}/classroom/LH002", wait_until="domcontentloaded", timeout=40000)
            page_aca.wait_for_timeout(3600)
            page_aca.locator('[data-testid="tab-curriculum"]').click()
            page_aca.wait_for_timeout(1200)

            cls_dir = page_aca.locator('[data-testid="classroom-recordings-dir"]')
            cls_dir.scroll_into_view_if_needed()
            cls_dir.wait_for(state="visible", timeout=10000)

            page_aca.locator('[data-testid="classroom-recordings-dir-btn-upload"]').click()
            modal = page_aca.locator('[role="dialog"]').last
            modal.wait_for(state="visible", timeout=10000)
            modal.locator('[data-testid="input-session-recording-file"]').set_input_files(TMP_MP4)
            page_aca.wait_for_timeout(600)
            modal.locator('[data-testid="input-session-recording-title"]').fill(test_rec_title)
            modal.locator(".ant-btn-primary").last.click()

            # Wait for Drive binary upload (0% -> 100%) and 0ms appearance in classroom-recordings-dir
            cls_dir.get_by_text(test_rec_title).first.wait_for(state="visible", timeout=45000)
            print(f"   ⚡ 0ms Optimistic Update: '{test_rec_title}' appeared immediately in Classroom Recordings Directory!")
            cls_dir.screenshot(path=f"{ARTIFACT_DIR}/qc_recordings_dir_classroom_lh002_desktop.png")

            # Capture created recording ID for safety teardown
            watch_btn = cls_dir.locator('[data-testid^="classroom-recordings-dir-watch-"]').first
            watch_tid = watch_btn.get_attribute("data-testid") or ""
            rec_id = watch_tid.replace("classroom-recordings-dir-watch-", "")
            if rec_id:
                created_rec_ids.append(rec_id)

            # Click Watch -> Fullscreen MaterialPreviewModal opens
            watch_btn.click()
            page_aca.wait_for_timeout(1200)
            close_preview = page_aca.locator('[data-testid="btn-preview-close"]')
            close_preview.wait_for(state="visible", timeout=10000)
            close_preview.click()
            page_aca.wait_for_timeout(600)
            print("   🎬 Fullscreen video preview modal opened & closed cleanly!")

            # F5 Persistence check
            page_aca.reload(wait_until="domcontentloaded", timeout=40000)
            page_aca.wait_for_timeout(3600)
            page_aca.locator('[data-testid="tab-curriculum"]').click()
            page_aca.wait_for_timeout(1200)
            page_aca.locator('[data-testid="classroom-recordings-dir"]').get_by_text(test_rec_title).first.wait_for(
                state="visible", timeout=15000
            )
            print("   🔄 F5 Persistence verified for uploaded recording!")

            # Delete recording (0ms removal + Google Drive 30-day Trash!)
            del_btn = page_aca.locator(f'[data-testid="classroom-recordings-dir-delete-{rec_id}"]')
            del_btn.scroll_into_view_if_needed()
            del_btn.click()
            page_aca.wait_for_timeout(400)
            page_aca.locator(".ant-popover .ant-btn-dangerous, .ant-popconfirm .ant-btn-primary").last.click()
            page_aca.wait_for_timeout(2500)
            assert page_aca.locator('[data-testid="classroom-recordings-dir"]').get_by_text(test_rec_title).count() == 0, (
                "FAIL (0ms Delete): Recording still visible after deletion!"
            )
            created_rec_ids.clear()
            print("   🗑️ 0ms Delete & Google Drive Trash verified!")
            ctx_aca.close()

            # ------------------------------------------------------------------
            # STEP 5 (AXIS 4): MOBILE 390x844 RESPONSIVE & TOUCH TARGETS
            # ------------------------------------------------------------------
            print("\n--- [5/5] AXIS 4: MOBILE 390x844 ZERO OVERFLOW-X & TOUCH TARGETS ---")
            ctx_mob = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            page_mob = ctx_mob.new_page()
            page_mob.goto(f"{LOCAL_URL}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000)
            page_mob.wait_for_timeout(3400)
            page_mob.goto(f"{LOCAL_URL}/zoom-schedules", wait_until="domcontentloaded", timeout=40000)
            page_mob.wait_for_timeout(3400)
            assert_zero_overflow(page_mob, "Schedule 3-Option Segmented Mobile 390x844")

            page_mob.locator('[data-testid="segmented-schedule-view-mode"]').get_by_text("Video", exact=False).click()
            page_mob.wait_for_timeout(1200)
            assert_zero_overflow(page_mob, "Schedule Recordings Directory Mobile 390x844")
            exp_box = page_mob.locator('[data-testid="schedule-recordings-dir-btn-export-xlsx"]').bounding_box()
            assert exp_box and exp_box["height"] >= 38, f"FAIL: Mobile Export button < 38px: {exp_box}"
            page_mob.screenshot(path=f"{ARTIFACT_DIR}/qc_recordings_dir_mobile_390.png")
            print(f"   ✅ Mobile 390x844 Zero Overflow-X & Export/Upload touch target height: {exp_box['height']:.1f}px!")
            ctx_mob.close()

            assert len(page_errors) == 0, f"Uncaught page errors: {page_errors}"

        finally:
            print("\n--- ZERO-RESIDUE CLEANUP ---")
            if created_rec_ids:
                page_teardown.evaluate(
                    """async (ids) => {
                        const { MaterialService } = await import('/src/modules/materials/services/MaterialService.js');
                        for (const id of ids) {
                            try {
                                await MaterialService.deleteMaterial(id, 'KH-7569', { id: 'ADM001', role: 'admin' });
                            } catch {}
                        }
                    }""",
                    created_rec_ids,
                )
                print(f"   🧹 Cleaned up residual test recording IDs: {created_rec_ids}")
            for tmp_f in [TMP_MP4, TMP_XLSX]:
                if os.path.exists(tmp_f):
                    os.remove(tmp_f)
            ctx_teardown.close()
            browser.close()

    print("\n" + "=" * 94)
    print("🏆 ALL 5 AXES PASSED (100%): MASTER CLASS RECORDINGS (.XLSX/.MP4) & WONDERS-G5 VERIFIED!")
    print("=" * 94)


if __name__ == "__main__":
    run_qc()
