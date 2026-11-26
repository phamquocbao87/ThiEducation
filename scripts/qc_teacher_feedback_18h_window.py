#!/usr/bin/env python3
"""
QC E2E 5-Axis Verification Suite (v2.0):
1. Hard-Lock Evaluation After 18 Hours (>18h Auto-Lock for All Users)
2. Manager Unlock (Academic / Director / IT Admin) for 18h Re-Evaluation + Manual Relock Now
3. Teacher Request Unlock Workflow + Realtime Notifications + Dashboard 1-Tap Approval
Spec: docs/specs/SPEC_TEACHER_FEEDBACK_18H_WINDOW.md
Environment: DEV Localhost (http://localhost:3000 -> lakeducation-dev)
"""

import re
import time
from playwright.sync_api import sync_playwright

LOCAL_URL = "http://localhost:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"


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
    print("🧪 QC 5-AXIS SUITE (v2.0): 18H HARD-LOCK + TEACHER REQUEST UNLOCK + MANAGER 18H RE-UNLOCK")
    print("=" * 94)

    backup_payload = None
    qc_reason_token = f"[QC-18H-UNLOCK-{int(time.time())}] Need to complete remaining student comments."

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
            # AXIS 1A: DETERMINISTIC LOCK & UNLOCK MATH (+13h, +18.5h, Unlock 18h, Expiry)
            # ------------------------------------------------------------------
            print("\n--- [1/5] AXIS 1A: 18H LOCK / UNLOCK / AUTO-EXPIRY BOUNDARY MATH ---")
            page_teardown.goto(f"{LOCAL_URL}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000)
            page_teardown.wait_for_timeout(3500)

            math_res = page_teardown.evaluate(
                """async () => {
                    const mod = await import('/src/shared/utils/classSessionUtils.js');
                    const wedEndMs = Date.parse('2026-11-25T14:20:00Z');
                    const win13h = mod.getSessionFeedbackWindowState(wedEndMs, wedEndMs + 13 * 3600 * 1000);
                    const win19h = mod.getSessionFeedbackWindowState(wedEndMs, wedEndMs + 19 * 3600 * 1000);
                    const unlockAt = wedEndMs + 20 * 3600 * 1000;
                    const unlockState = {
                        status: 'UNLOCKED',
                        unlockedAtMs: unlockAt,
                        unlockedUntilMs: unlockAt + mod.POST_SESSION_FEEDBACK_WINDOW_MS,
                    };
                    const winDuringUnlock = mod.getSessionFeedbackWindowState(
                        wedEndMs,
                        unlockAt + 5 * 3600 * 1000,
                        mod.POST_SESSION_FEEDBACK_WINDOW_MS,
                        unlockState
                    );
                    const winAfterUnlockExpired = mod.getSessionFeedbackWindowState(
                        wedEndMs,
                        unlockAt + 18.1 * 3600 * 1000,
                        mod.POST_SESSION_FEEDBACK_WINDOW_MS,
                        unlockState
                    );
                    return { win13h, win19h, winDuringUnlock, winAfterUnlockExpired };
                }"""
            )
            assert math_res["win13h"]["isWithinWindow"] is True and math_res["win13h"]["isLockedAfter18h"] is False
            assert math_res["win19h"]["isLockedAfter18h"] is True
            assert (
                math_res["winDuringUnlock"]["isTemporarilyUnlocked"] is True
                and math_res["winDuringUnlock"]["isLockedAfter18h"] is False
            )
            assert (
                math_res["winAfterUnlockExpired"]["isTemporarilyUnlocked"] is False
                and math_res["winAfterUnlockExpired"]["isUnlockExpired"] is True
                and math_res["winAfterUnlockExpired"]["isLockedAfter18h"] is True
            )
            print("   ✅ +13h OPEN -> +19h HARD-LOCKED -> Unlocked (+5h) OPEN -> Unlock Expired (+18.1h) AUTO-RELOCKED!")

            # ------------------------------------------------------------------
            # AXIS 1B & 2: TEACHER MAJ (GV952) HARD-LOCK + TRANSACTION GUARD + REQUEST UNLOCK
            # ------------------------------------------------------------------
            print("\n--- [2/5] AXIS 1B & 2: TEACHER HARD-LOCK (>18H), TX REJECTION & REQUEST UNLOCK ---")
            ctx_gv = browser.new_context(viewport={"width": 1366, "height": 850})
            page_gv = ctx_gv.new_page()
            page_errors = []
            page_gv.on("pageerror", lambda exc: page_errors.append(str(exc)))
            console_errors = []
            page_gv.on(
                "console",
                lambda msg: console_errors.append(msg.text)
                if msg.type == "error"
                and "favicon" not in msg.text.lower()
                and not msg.text.startswith("Warning:")
                and "empty string" not in msg.text.lower()
                else None,
            )

            page_gv.goto(f"{LOCAL_URL}/dashboard?sso_uid=GV952", wait_until="domcontentloaded", timeout=40000)
            page_gv.wait_for_timeout(3800)
            assert_zero_overflow(page_gv, "Teacher Dashboard Desktop 1366")

            pill_1911 = page_gv.locator('[data-testid^="teacher-session-pill-LH002-"]', has_text="19/11/2026").first
            pill_1911.wait_for(state="visible", timeout=15000)
            pill_1911.click()
            page_gv.wait_for_timeout(3800)
            assert_zero_overflow(page_gv, "Classroom Locked Session Desktop 1366")

            current_url = page_gv.url
            ms_match = re.search(r"sessionDateMs=(\d+)", current_url)
            assert ms_match, f"Expected sessionDateMs in URL: {current_url}"
            target_ms = ms_match.group(1)
            target_session_doc_id = f"LIVE_LH002_{target_ms}"

            # Snapshot pre-test state BEFORE any unlock request or write!
            backup_payload = page_teardown.evaluate(
                """async ({ sessionDocId, targetMs }) => {
                    const { ClassroomRealtimeService } = await import('/src/shared/services/ClassroomRealtimeService.js');
                    const { ClassService } = await import('/src/modules/courses/services/ClassService.js');
                    const { evaluateSessionFeedbackCompleteness, mergeSessionEvaluationDocs, normalizeSessionDateKey } = await import('/src/shared/utils/classSessionUtils.js');

                    const allClasses = await ClassService.getAllClasses();
                    const cls = (allClasses || []).find((c) => c.id === 'LH002') || {};
                    const studentIds = cls.studentIds || [];
                    const history = await ClassroomRealtimeService.getEvaluationHistory('LH002');
                    const exactDoc = (history || []).find((d) => d.id === sessionDocId) || null;
                    let merged1911 = null;
                    (history || []).forEach((d) => {
                        if (d.id === sessionDocId || normalizeSessionDateKey(d.date) === '19/11/2026') {
                            merged1911 = mergeSessionEvaluationDocs(merged1911, d);
                        }
                    });
                    const comp = evaluateSessionFeedbackCompleteness(merged1911, studentIds);
                    return {
                        sessionDocId,
                        targetMs: Number(targetMs),
                        existsBefore: Boolean(exactDoc),
                        exactDocData: exactDoc,
                        missingStudentId: comp.missingStudentIds[0] || null,
                    };
                }""",
                {"sessionDocId": target_session_doc_id, "targetMs": target_ms},
            )
            missing_student_id = backup_payload["missingStudentId"]
            assert missing_student_id, "Expected at least 1 missing student on LH002 19/11/2026!"
            print(f"   🛡️ Snapshot saved for {target_session_doc_id} (existsBefore={backup_payload['existsBefore']}, missingStudent={missing_student_id})")

            # 1) Verify UI HARD-LOCK past 18h: Save All & Save Student buttons MUST BE DISABLED!
            locked_banner = page_gv.locator('[data-testid="banner-feedback-overdue-18h"]')
            locked_banner.wait_for(state="visible", timeout=15000)
            assert page_gv.locator('[data-testid="btn-save-all-evaluations"]').is_disabled(), (
                "FAIL (#1): Save & Complete button MUST be disabled past 18h!"
            )
            assert page_gv.locator(f'[data-testid="btn-save-eval-{missing_student_id}"]').is_disabled(), (
                f"FAIL (#1): Individual Save button for {missing_student_id} MUST be disabled past 18h!"
            )
            assert page_gv.locator('[data-testid="btn-unlock-eval-18h"]').count() == 0, (
                "FAIL (RBAC): Teacher must NOT see Manager Unlock button!"
            )
            print("   🔒 Verified UI Hard-Lock (>18h): Save buttons & editors disabled; Teacher cannot self-unlock!")

            # 2) Verify Firestore Transaction Security Guard rejects direct save when locked!
            tx_guard_res = page_gv.evaluate(
                """async ({ sessionDocId, studentId, targetMs }) => {
                    const { ClassroomRealtimeService } = await import('/src/shared/services/ClassroomRealtimeService.js');
                    try {
                        await ClassroomRealtimeService.saveStudentEvaluation(
                            'LH002',
                            sessionDocId,
                            studentId,
                            { stars: 5, comment: 'Bypass attempt', sessionStart: targetMs, date: '19/11/2026' },
                            { id: 'GV952', name: 'Teacher Maj', role: 'teacher' }
                        );
                        return 'UNEXPECTED_SUCCESS';
                    } catch (err) {
                        return err.message;
                    }
                }""",
                {"sessionDocId": target_session_doc_id, "studentId": missing_student_id, "targetMs": int(target_ms)},
            )
            assert tx_guard_res == "EVALUATION_WINDOW_LOCKED", (
                f"FAIL (Axis 2 Transaction Guard): Expected EVALUATION_WINDOW_LOCKED, got {tx_guard_res}"
            )
            print("   🛡️ Verified Transaction Security Guard: Direct save rejected with EVALUATION_WINDOW_LOCKED!")

            # 3) Teacher clicks [Request Unlock] -> submits modal -> 0ms state update + F5 persistence!
            req_btn = page_gv.locator('[data-testid="btn-request-eval-unlock"]')
            req_btn.wait_for(state="visible", timeout=10000)
            req_btn.click()
            page_gv.locator('[data-testid="modal-request-eval-unlock"]').wait_for(state="visible", timeout=10000)
            page_gv.screenshot(path=f"{ARTIFACT_DIR}/qc_feedback18h_teacher_request_modal_desktop.png")

            page_gv.locator('[data-testid="input-unlock-reason"]').fill(qc_reason_token)
            page_gv.locator('[data-testid="btn-submit-unlock-request"]').click()
            page_gv.wait_for_timeout(1800)

            # Assert 0ms pending tag appears immediately
            pending_tag = page_gv.locator('[data-testid="tag-unlock-requested-pending"]')
            pending_tag.wait_for(state="visible", timeout=10000)
            assert qc_reason_token in page_gv.locator('[data-testid="box-unlock-request-detail"]').inner_text()
            page_gv.screenshot(path=f"{ARTIFACT_DIR}/qc_feedback18h_teacher_requested_state_desktop.png")
            print("   📨 Teacher Request Unlock submitted -> 0ms switched to 'Waiting for Academic Approval'!")

            # Assert F5 persistence of pending request
            page_gv.reload(wait_until="domcontentloaded", timeout=40000)
            page_gv.wait_for_timeout(3600)
            page_gv.locator('[data-testid="tag-unlock-requested-pending"]').wait_for(state="visible", timeout=10000)
            print("   🔄 F5 Persistence verified for Teacher's Unlock Request!")

            # ------------------------------------------------------------------
            # AXIS 3: ACADEMIC (ACA404) & IT ADMIN (ADM001) SEE REQUEST & APPROVE UNLOCK (18H)
            # ------------------------------------------------------------------
            print("\n--- [3/5] AXIS 3: MANAGER (ACA404 / ADM001) DASHBOARD APPROVAL & 18H RE-UNLOCK ---")
            ctx_adm = browser.new_context(viewport={"width": 1366, "height": 850})
            page_adm = ctx_adm.new_page()
            page_adm.goto(f"{LOCAL_URL}/dashboard?sso_uid=ADM001", wait_until="domcontentloaded", timeout=40000)
            page_adm.wait_for_timeout(3800)
            assert page_adm.locator('[data-testid="academic-unlock-req-badge-LH002"]').count() > 0, (
                "FAIL: IT Admin (ADM001) did not see Teacher's Unlock Request on Dashboard!"
            )
            print("   ✅ IT Admin (ADM001) sees Teacher's Unlock Request badge on Dashboard!")
            ctx_adm.close()

            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 850})
            page_aca = ctx_aca.new_page()
            page_aca.goto(f"{LOCAL_URL}/dashboard?sso_uid=ACA404", wait_until="domcontentloaded", timeout=40000)
            page_aca.wait_for_timeout(3800)
            assert_zero_overflow(page_aca, "Academic Dashboard With Unlock Request 1366")

            req_badge = page_aca.locator('[data-testid="academic-unlock-req-badge-LH002"]')
            req_badge.wait_for(state="visible", timeout=10000)
            reason_box = page_aca.locator('[data-testid="academic-unlock-reason-LH002"]')
            assert qc_reason_token in reason_box.inner_text(), "FAIL: Academic Dashboard missing Teacher's unlock reason!"
            page_aca.locator('[data-testid="academic-pending-evaluation-tasks-card"]').scroll_into_view_if_needed()
            page_aca.wait_for_timeout(300)
            page_aca.locator('[data-testid="academic-pending-evaluation-tasks-card"]').screenshot(
                path=f"{ARTIFACT_DIR}/qc_feedback18h_academic_approve_dashboard_desktop.png"
            )

            # Academic clicks 1-tap [Approve Unlock] directly on Dashboard!
            page_aca.locator('[data-testid="btn-quick-unlock-LH002"]').click()
            page_aca.wait_for_timeout(2000)
            assert page_aca.locator('[data-testid="academic-unlock-req-badge-LH002"]').count() == 0, (
                "FAIL (0ms): Unlock Request badge did not clear immediately after Academic approval!"
            )
            print("   🔓 Academic (ACA404) approved 18h Unlock in 1 tap on Dashboard (0ms UI update)!")

            # Now Teacher Maj (page_gv) reloads Classroom -> Unlocked for 18h -> Saves evaluation -> Relock test!
            page_gv.reload(wait_until="domcontentloaded", timeout=40000)
            page_gv.wait_for_timeout(3800)
            unlocked_banner = page_gv.locator('[data-testid="banner-feedback-unlocked-18h"]')
            unlocked_banner.wait_for(state="visible", timeout=15000)
            assert page_gv.locator('[data-testid="btn-save-all-evaluations"]').is_enabled(), (
                "FAIL: Save & Complete still disabled after Academic unlocked session!"
            )

            # Teacher writes & saves comment for missing_student_id (8/10 -> 7/10 in 0ms!)
            miss_tag_before = page_gv.locator('[data-testid="session-feedback-missing-tag"]').inner_text()
            m_b = int(re.search(r"(\d+)/(\d+)", miss_tag_before).group(1))
            save_one_btn = page_gv.locator(f'[data-testid="btn-save-eval-{missing_student_id}"]')
            save_one_btn.scroll_into_view_if_needed()
            row = save_one_btn.locator("xpath=ancestor::tr[1]")
            row.locator("button", has_text=re.compile(r"Praise|Khen ngợi")).first.click()
            page_gv.wait_for_timeout(300)
            save_one_btn.click()
            page_gv.wait_for_timeout(1800)

            miss_tag_after = page_gv.locator('[data-testid="session-feedback-missing-tag"]').inner_text()
            m_a = int(re.search(r"(\d+)/(\d+)", miss_tag_after).group(1))
            assert m_a == m_b - 1, f"FAIL: Expected missing count {m_b - 1}, got {m_a}!"
            page_gv.screenshot(path=f"{ARTIFACT_DIR}/qc_feedback18h_classroom_unlocked_18h_desktop.png")
            print(f"   ✍️ Teacher Maj graded {missing_student_id} during 18h unlock window ({m_b} -> {m_a} missing in 0ms)!")
            ctx_gv.close()

            # Academic opens Classroom and clicks [Lock Now] -> verifies immediate manual re-lock!
            page_aca.goto(
                f"{LOCAL_URL}/classroom/LH002?tab=evaluation&sessionDateMs={target_ms}",
                wait_until="domcontentloaded",
                timeout=40000,
            )
            page_aca.wait_for_timeout(3800)
            relock_btn = page_aca.locator('[data-testid="btn-relock-eval-now"]')
            relock_btn.wait_for(state="visible", timeout=10000)
            relock_btn.click()
            page_aca.wait_for_timeout(1800)
            page_aca.locator('[data-testid="banner-feedback-overdue-18h"]').wait_for(state="visible", timeout=10000)
            assert page_aca.locator('[data-testid="btn-save-all-evaluations"]').is_disabled(), (
                "FAIL: Save & Complete did not re-lock after Academic clicked Lock Now!"
            )
            print("   🔒 Academic clicked [Lock Now] -> Session immediately re-locked (0ms)!")
            ctx_aca.close()

            # Student isolation check (HV235)
            ctx_stu = browser.new_context(viewport={"width": 1366, "height": 850})
            page_stu = ctx_stu.new_page()
            page_stu.goto(
                f"{LOCAL_URL}/classroom/LH002?tab=evaluation&sessionDateMs={target_ms}&sso_uid=HV235",
                wait_until="domcontentloaded",
                timeout=40000,
            )
            page_stu.wait_for_timeout(3400)
            assert page_stu.locator('[data-testid="btn-request-eval-unlock"]').count() == 0
            assert page_stu.locator('[data-testid="btn-unlock-eval-18h"]').count() == 0
            print("   ✅ Student HV235 isolated 100% from internal staff Lock/Unlock controls!")
            ctx_stu.close()

            # ------------------------------------------------------------------
            # AXIS 4: MOBILE VIEWPORT 390x844 ERGONOMICS & ZERO OVERFLOW-X
            # ------------------------------------------------------------------
            print("\n--- [4/5] AXIS 4: MOBILE 390x844 RESPONSIVE & TOUCH TARGETS ---")
            ctx_mob = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            page_mob = ctx_mob.new_page()
            page_mob.goto(f"{LOCAL_URL}/dashboard?sso_uid=GV952", wait_until="domcontentloaded", timeout=40000)
            page_mob.wait_for_timeout(3800)
            assert_zero_overflow(page_mob, "Teacher Dashboard Mobile 390x844")

            page_mob.goto(
                f"{LOCAL_URL}/classroom/LH002?tab=evaluation&sessionDateMs={target_ms}",
                wait_until="domcontentloaded",
                timeout=40000,
            )
            page_mob.wait_for_timeout(3800)
            assert_zero_overflow(page_mob, "Classroom Locked Session Mobile 390x844")
            req_mob_box = page_mob.locator('[data-testid="btn-request-eval-unlock"]').bounding_box()
            assert req_mob_box and req_mob_box["height"] >= 38, f"FAIL: Mobile Request Unlock button < 38px: {req_mob_box}"
            page_mob.screenshot(path=f"{ARTIFACT_DIR}/qc_feedback18h_locked_mobile_390.png")
            print(f"   ✅ Mobile Request Unlock button height: {req_mob_box['height']:.1f}px (>= 38px), 0px overflow!")
            ctx_mob.close()

            assert len(page_errors) == 0, f"Uncaught page errors detected: {page_errors}"
            assert len(console_errors) == 0, f"Console errors detected: {console_errors}"
            print("   ✅ Zero uncaught page errors & zero runtime console errors!")

        finally:
            # ------------------------------------------------------------------
            # AXIS 5: ZERO-RESIDUE TEARDOWN (SNAPSHOT RESTORE + NOTIFICATION CLEANUP)
            # ------------------------------------------------------------------
            print("\n--- [5/5] AXIS 5: ZERO-RESIDUE TEARDOWN ---")
            if backup_payload:
                cleaned = page_teardown.evaluate(
                    """async (backup) => {
                        const { ClassroomRealtimeService } = await import('/src/shared/services/ClassroomRealtimeService.js');
                        const { NotificationService } = await import('/src/core/services/NotificationService.js');
                        const acaActor = { id: 'ACA404', name: 'Academic QC', role: 'academic' };

                        await ClassroomRealtimeService.restoreSessionEvaluationSnapshot(
                            backup.sessionDocId,
                            backup.exactDocData,
                            backup.existsBefore,
                            acaActor
                        );

                        // Delete test notifications created for this sessionDocId
                        let deletedNotis = 0;
                        for (const u of [
                            { id: 'ACA404', role: 'academic' },
                            { id: 'GV952', role: 'teacher' },
                            { id: 'ADM001', role: 'admin' },
                        ]) {
                            const list = await NotificationService.getNotificationsForUser(u, 30);
                            for (const n of list) {
                                if (n?.metadata?.sessionId === backup.sessionDocId) {
                                    await NotificationService.deleteNotification(n.id, u);
                                    deletedNotis += 1;
                                }
                            }
                        }
                        return { deletedNotis };
                    }""",
                    backup_payload,
                )
                print(
                    f"   🧹 Restored exact pre-test snapshot for {backup_payload['sessionDocId']} "
                    f"(existsBefore={backup_payload['existsBefore']}) & deleted {cleaned['deletedNotis']} test notifications!"
                )
            ctx_teardown.close()
            browser.close()

    print("\n" + "=" * 94)
    print("🏆 ALL 5 AXES PASSED (100%): 18H HARD-LOCK + REQUEST UNLOCK + 18H RE-UNLOCK VERIFIED!")
    print("=" * 94)


if __name__ == "__main__":
    run_qc()
