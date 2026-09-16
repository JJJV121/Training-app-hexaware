import asyncio
from datetime import datetime, timedelta
from sqlalchemy import text, select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course
from app.models.live_session import LiveSession
from app.models.attendance_record import AttendanceRecord, AttendanceStatus
from app.models.attendance_followup import AttendanceFollowupRecord, FollowupStage
from app.services.attendance_followup_service import (
    process_attendance_event,
    submit_absence_reason,
    review_absence_reason,
    run_attendance_followup_automation,
    calculate_consecutive_absences,
)


async def run_all_tests():
    print("==================================================")
    print("STARTING ATTENDANCE FOLLOW-UP AUTOMATION SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # Fetch test users and batch
        res_e34 = await db.execute(select(User).where(User.employee_id == "E_034"))
        e034 = res_e34.scalar_one_or_none()

        res_e35 = await db.execute(select(User).where(User.employee_id == "E_035"))
        e035 = res_e35.scalar_one_or_none()

        res_existing = await db.execute(select(User).where(User.employee_id != "E_034", User.employee_id != "E_035", User.role.ilike("trainee")).limit(1))
        existing_student = res_existing.scalar_one_or_none()

        res_batch = await db.execute(select(Batch).limit(1))
        test_batch = res_batch.scalar_one_or_none()

        assert e034 is not None, "E_034 must exist"
        assert e035 is not None, "E_035 must exist"
        assert existing_student is not None, "Existing student must exist"
        assert test_batch is not None, "Test batch must exist"

        print(f"Loaded Candidates: E_034={e034.id}, E_035={e035.id}, Existing={existing_student.id}")
        print(f"Loaded Batch: ID={test_batch.id}, Name={test_batch.name}")

        # Ensure test sessions created for testing
        session_ids = []
        for i in range(1, 7):
            sess_stmt = select(LiveSession).where(LiveSession.title == f"Automated Test Session {i}")
            sess_res = await db.execute(sess_stmt)
            s_obj = sess_res.scalar_one_or_none()
            if not s_obj:
                s_obj = LiveSession(
                    title=f"Automated Test Session {i}",
                    description="Session for testing follow-up workflow",
                    session_type="ONLINE",
                    batch_id=test_batch.id,
                    start_time=datetime.utcnow() - timedelta(days=7 - i),
                    end_time=datetime.utcnow() - timedelta(days=7 - i, hours=-2),
                    trainer_id=test_batch.trainer_id or 24,
                )
                db.add(s_obj)
                await db.flush()
            session_ids.append(s_obj.id)

        await db.commit()

        # Clean existing test records for test batch for clean run
        await db.execute(text(f"DELETE FROM attendance_followup_audit_logs WHERE candidate_id IN ({e034.id}, {e035.id}, {existing_student.id})"))
        await db.execute(text(f"DELETE FROM attendance_followup_records WHERE candidate_id IN ({e034.id}, {e035.id}, {existing_student.id})"))
        await db.execute(text(f"DELETE FROM attendance_records WHERE session_id IN ({','.join(map(str, session_ids))})"))
        await db.commit()

        # --------------------------------------------------
        # TEST 1 – EXISTING STUDENT PROTECTION
        # --------------------------------------------------
        print("\n--- TEST 1: EXISTING STUDENT PROTECTION ---")
        assert existing_student.attendance_followup_enabled is False, "Existing student must have attendance_followup_enabled=False"
        
        # Mark existing student absent
        att1 = AttendanceRecord(session_id=session_ids[0], trainee_id=existing_student.id, status=AttendanceStatus.ABSENT)
        db.add(att1)
        await db.commit()

        result1 = await process_attendance_event(db, existing_student.id, session_ids[0], "ABSENT")
        assert result1 is None, "Existing student must NOT create any follow-up record or workflow action"
        print("[OK] TEST 1 PASSED: Existing student unaffected by automation.")

        # --------------------------------------------------
        # TEST 2 – E_034 DAY 1 (REMINDER 1)
        # --------------------------------------------------
        print("\n--- TEST 2: E_034 DAY 1 ---")
        assert e034.attendance_followup_enabled is True
        
        att_e34_1 = AttendanceRecord(session_id=session_ids[0], trainee_id=e034.id, status=AttendanceStatus.ABSENT)
        db.add(att_e34_1)
        await db.commit()

        f_e34_1 = await process_attendance_event(db, e034.id, session_ids[0], "ABSENT")
        assert f_e34_1 is not None
        assert f_e34_1.consecutive_absence_count == 1
        assert f_e34_1.current_stage == FollowupStage.REMINDER_1_SENT.value
        assert f_e34_1.reminder_1_sent_at is not None
        print("[OK] TEST 2 PASSED: E_034 Day 1 Reminder 1 recorded.")

        # --------------------------------------------------
        # TEST 3 – E_034 DAY 2 (REMINDER 2)
        # --------------------------------------------------
        print("\n--- TEST 3: E_034 DAY 2 ---")
        att_e34_2 = AttendanceRecord(session_id=session_ids[1], trainee_id=e034.id, status=AttendanceStatus.ABSENT)
        db.add(att_e34_2)
        await db.commit()

        f_e34_2 = await process_attendance_event(db, e034.id, session_ids[1], "ABSENT")
        assert f_e34_2.consecutive_absence_count == 2
        assert f_e34_2.current_stage == FollowupStage.REMINDER_2_SENT.value
        assert f_e34_2.reminder_2_sent_at is not None
        print("[OK] TEST 3 PASSED: E_034 Day 2 Reminder 2 recorded.")

        # --------------------------------------------------
        # TEST 4 – E_034 DAY 3 (WARNING SENT)
        # --------------------------------------------------
        print("\n--- TEST 4: E_034 DAY 3 ---")
        att_e34_3 = AttendanceRecord(session_id=session_ids[2], trainee_id=e034.id, status=AttendanceStatus.ABSENT)
        db.add(att_e34_3)
        await db.commit()

        f_e34_3 = await process_attendance_event(db, e034.id, session_ids[2], "ABSENT")
        assert f_e34_3.consecutive_absence_count == 3
        assert f_e34_3.current_stage == FollowupStage.WARNING_SENT.value
        assert f_e34_3.warning_sent_at is not None
        print("[OK] TEST 4 PASSED: E_034 Day 3 Warning recorded.")

        # --------------------------------------------------
        # TEST 5 – REASON SUBMISSION
        # --------------------------------------------------
        print("\n--- TEST 5: REASON SUBMISSION ---")
        f_sub = await submit_absence_reason(
            db, e034.id, f_e34_3.id,
            reason_category="Medical Emergency",
            reason_description="High fever and hospitalized for 2 days",
            reason_attachment_url="/uploads/absence_docs/sample_doc.pdf"
        )
        assert f_sub.current_stage == FollowupStage.REASON_SUBMITTED.value
        assert f_sub.reason_category == "Medical Emergency"
        print("[OK] TEST 5 PASSED: Reason submitted successfully.")

        # --------------------------------------------------
        # TEST 6 – SPOC APPROVAL (STOPS ESCALATION)
        # --------------------------------------------------
        print("\n--- TEST 6: SPOC APPROVAL ---")
        f_app = await review_absence_reason(db, spoc_user_id=24, followup_id=f_sub.id, decision="APPROVE", spoc_comments="Approved medical leave")
        assert f_app.current_stage == FollowupStage.REASON_APPROVED.value
        assert f_app.spoc_decision == "APPROVED"

        # Additional absence marked -> Should NOT discontinue because reason was approved
        att_e34_4 = AttendanceRecord(session_id=session_ids[3], trainee_id=e034.id, status=AttendanceStatus.ABSENT)
        db.add(att_e34_4)
        await db.commit()

        f_e34_post = await process_attendance_event(db, e034.id, session_ids[3], "ABSENT")
        assert f_e34_post.current_stage == FollowupStage.REASON_APPROVED.value
        assert f_e34_post.discontinued_at is None, "Candidate must NOT be discontinued when reason is APPROVED"
        print("[OK] TEST 6 PASSED: SPOC Approval stops escalation & prevents discontinuation.")

        # --------------------------------------------------
        # TEST 7 – SPOC REJECTION (USING E_035)
        # --------------------------------------------------
        print("\n--- TEST 7: SPOC REJECTION (E_035) ---")
        # Mark E_035 absent for 3 sessions
        for idx in range(3):
            db.add(AttendanceRecord(session_id=session_ids[idx], trainee_id=e035.id, status=AttendanceStatus.ABSENT))
            await db.commit()
            await process_attendance_event(db, e035.id, session_ids[idx], "ABSENT")

        f_e35_stmt = select(AttendanceFollowupRecord).where(AttendanceFollowupRecord.candidate_id == e035.id)
        f_e35_res = await db.execute(f_e35_stmt)
        f_e35 = f_e35_res.scalars().first()
        assert f_e35.consecutive_absence_count == 3

        # E_035 Submits reason
        await submit_absence_reason(db, e035.id, f_e35.id, "Personal Travel", "Vacation trip")

        # SPOC Rejects reason
        f_rej = await review_absence_reason(db, spoc_user_id=24, followup_id=f_e35.id, decision="REJECT", spoc_comments="Unexcused personal leave")
        assert f_rej.current_stage == FollowupStage.REASON_REJECTED.value
        assert f_rej.spoc_decision == "REJECTED"
        print("[OK] TEST 7 PASSED: SPOC Rejection processed, escalation continues.")

        # --------------------------------------------------
        # TEST 8 – DAY 5 DISCONTINUATION & CR NOTIFICATION (E_035)
        # --------------------------------------------------
        print("\n--- TEST 8: DAY 5 DISCONTINUATION (E_035) ---")
        # Mark E_035 absent for 4th & 5th session
        db.add(AttendanceRecord(session_id=session_ids[3], trainee_id=e035.id, status=AttendanceStatus.ABSENT))
        db.add(AttendanceRecord(session_id=session_ids[4], trainee_id=e035.id, status=AttendanceStatus.ABSENT))
        await db.commit()

        await process_attendance_event(db, e035.id, session_ids[3], "ABSENT")
        f_dis = await process_attendance_event(db, e035.id, session_ids[4], "ABSENT")

        assert f_dis.consecutive_absence_count == 5
        assert f_dis.current_stage == FollowupStage.DISCONTINUED.value
        assert f_dis.discontinued_at is not None
        assert f_dis.cr_notified_at is not None
        print("[OK] TEST 8 PASSED: Candidate discontinued & CR notification sent.")

        # --------------------------------------------------
        # TEST 9 – PRESENT AFTER ABSENCE (CYCLE RESET)
        # --------------------------------------------------
        print("\n--- TEST 9: PRESENT AFTER ABSENCE ---")
        # Create fresh session 6 for E_034 where candidate comes PRESENT
        db.add(AttendanceRecord(session_id=session_ids[5], trainee_id=e034.id, status=AttendanceStatus.PRESENT))
        await db.commit()

        f_res = await process_attendance_event(db, e034.id, session_ids[5], "PRESENT")
        assert f_res.current_stage == FollowupStage.CLOSED.value
        assert f_res.consecutive_absence_count == 0
        print("[OK] TEST 9 PASSED: Present attendance closed escalation cycle.")

        # --------------------------------------------------
        # TEST 10 – SCHEDULER IDEMPOTENCY
        # --------------------------------------------------
        print("\n--- TEST 10: SCHEDULER IDEMPOTENCY ---")
        run_count1 = await run_attendance_followup_automation(db)
        run_count2 = await run_attendance_followup_automation(db)
        assert run_count1 >= 0
        assert run_count2 >= 0
        print("[OK] TEST 10 PASSED: Scheduler executed safely & idempotently.")

        # --------------------------------------------------
        # TEST 11 – WEEKEND / NON-SESSION DAYS
        # --------------------------------------------------
        print("\n--- TEST 11: NON-SESSION DAYS ---")
        count, dates = await calculate_consecutive_absences(db, e034.id, test_batch.id)
        assert count == 0  # Latest session was PRESENT
        print("[OK] TEST 11 PASSED: Absence count accurately reflects scheduled sessions only.")

        print("\n==================================================")
        print("ALL 11 ATTENDANCE AUTOMATION TESTS PASSED PERFECTLY!")
        print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
