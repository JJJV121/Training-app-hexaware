import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select

from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
from app.models import (
    User,
    Batch,
    BatchTrainee,
    Course,
    LiveSession,
    AttendanceRecord,
    AttendanceStatus,
    CandidateIssue,
    Notification,
    AttendanceFollowupRecord,
)
from app.services.candidate_issue_service import (
    create_candidate_issue,
    get_admin_issues,
    update_issue_status,
)
from app.services.attendance_followup_service import (
    process_attendance_event,
    handle_admin_candidate_action,
)
from app.services.notification_service import get_user_notifications


async def run_verification():
    print("==================================================")
    print("STARTING CANDIDATE ISSUE & ATTENDANCE ESCALATION VERIFICATION")
    print("==================================================")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Setup Test Users (Admin, Batch Coordinator / Trainer, Candidate)
        timestamp = int(datetime.utcnow().timestamp())
        admin_email = f"admin_{timestamp}@company.com"
        trainer_email = f"trainer_{timestamp}@hexaware.com"
        cand_email = f"candidate_{timestamp}@hexaware.com"

        admin = User(
            employee_id=f"ADM_{timestamp}",
            name="Test Admin",
            email=admin_email,
            role="ADMIN",
            is_active=True,
        )
        trainer = User(
            employee_id=f"TRN_{timestamp}",
            name="Test Trainer Coordinator",
            email=trainer_email,
            role="TRAINER",
            is_active=True,
        )
        candidate = User(
            employee_id=f"CND_{timestamp}",
            name="Test Candidate",
            email=cand_email,
            role="STUDENT",
            is_active=True,
            attendance_followup_enabled=True,
        )
        db.add_all([admin, trainer, candidate])
        await db.commit()
        await db.refresh(admin)
        await db.refresh(trainer)
        await db.refresh(candidate)

        print(f"[OK] Created test users: Admin ({admin.id}), Trainer ({trainer.id}), Candidate ({candidate.id})")

        # 2. Setup Test Course & Batch
        course = Course(title="FullStack Java Training", description="Core Java & Spring", duration_days=30, thumbnail_url="http://example.com/java.png")
        db.add(course)
        await db.commit()
        await db.refresh(course)

        batch = Batch(
            name=f"Batch_Java_{timestamp}",
            course_id=course.id,
            trainer_id=trainer.id,
            created_by=admin.id,
            start_date=datetime.utcnow().date(),
            end_date=(datetime.utcnow() + timedelta(days=30)).date(),
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        bt = BatchTrainee(batch_id=batch.id, trainee_id=candidate.id, status="ACTIVE")
        db.add(bt)
        await db.commit()

        print(f"[OK] Created Course '{course.title}' & Batch '{batch.name}' with Trainer and Candidate enrolled.")

        # ==================================================
        # TEST 1: CANDIDATE RAISES ISSUE
        # ==================================================
        print("\n--- TEST 1: Candidate Raises Issue ---")
        issue = await create_candidate_issue(
            db=db,
            candidate=candidate,
            issue_type="Login Issue",
            subject="Unable to login to LMS",
            description="Getting 401 error when attempting to log into portal.",
            priority="HIGH",
        )
        print(f"[OK] Issue created with unique Issue ID: {issue.issue_id}, Status: {issue.status}")
        assert issue.status == "OPEN", "Issue status should be OPEN"

        # Check Admin Notifications
        admin_notifs = await get_user_notifications(db, user_id=admin.id)
        assert len(admin_notifs) > 0, "Admin should receive notification"
        latest_admin_notif = admin_notifs[0]
        assert latest_admin_notif.notification_type == "ISSUE_RAISED"
        print(f"[OK] Admin received in-app notification: '{latest_admin_notif.title}' ({latest_admin_notif.priority})")

        # Update Issue Status as Admin
        updated_issue = await update_issue_status(
            db=db,
            identifier=issue.issue_id,
            admin_user=admin,
            status="RESOLVED",
            admin_response="Password reset link generated and sent to candidate.",
        )
        assert updated_issue.status == "RESOLVED"
        cand_notifs = await get_user_notifications(db, user_id=candidate.id)
        assert any(n.notification_type == "ISSUE_RESOLVED" for n in cand_notifs)
        print(f"[OK] Admin resolved issue {issue.issue_id}. Candidate notified of resolution.")

        # ==================================================
        # TEST 2: CANDIDATE ABSENT DAY 1
        # ==================================================
        print("\n--- TEST 2: Candidate Absent Day 1 ---")
        sess1 = LiveSession(
            batch_id=batch.id,
            trainer_id=trainer.id,
            title="Day 1 Live Session",
            session_type="ONLINE",
            start_time=datetime.utcnow() - timedelta(days=3),
            end_time=datetime.utcnow() - timedelta(days=3) + timedelta(hours=2),
        )
        db.add(sess1)
        await db.commit()
        await db.refresh(sess1)

        att1 = AttendanceRecord(session_id=sess1.id, trainee_id=candidate.id, status=AttendanceStatus.ABSENT)
        db.add(att1)
        await db.commit()

        # Trigger attendance processing
        await process_attendance_event(db, trainee_id=candidate.id, session_id=sess1.id, marked_status="ABSENT", actor_id=trainer.id)

        # Verify Day 1 Notifications
        cand_notifs_day1 = await get_user_notifications(db, user_id=candidate.id)
        day1_cand_notif = next((n for n in cand_notifs_day1 if n.notification_type == "ATTENDANCE_DAY1"), None)
        assert day1_cand_notif is not None, "Candidate should receive Day 1 absence notification"
        print(f"[OK] Candidate received Day 1 notification: '{day1_cand_notif.title}'")

        trainer_notifs_day1 = await get_user_notifications(db, user_id=trainer.id)
        day1_trainer_notif = next((n for n in trainer_notifs_day1 if n.notification_type == "ATTENDANCE_DAY1"), None)
        assert day1_trainer_notif is not None, "Batch Coordinator should receive Day 1 notification"
        print(f"[OK] Batch Coordinator received Day 1 notification: '{day1_trainer_notif.title}'")

        # Verify NO Admin escalation email/notification on Day 1
        admin_notifs_day1 = await get_user_notifications(db, user_id=admin.id)
        day1_admin_escalation = next((n for n in admin_notifs_day1 if n.notification_type == "ATTENDANCE_DAY3_ESCALATION"), None)
        assert day1_admin_escalation is None, "Admin MUST NOT receive escalation on Day 1"
        print("[OK] Verified: Admin did NOT receive escalation on Day 1.")

        # ==================================================
        # TEST 3: CANDIDATE ABSENT DAY 2 & DAY 3
        # ==================================================
        print("\n--- TEST 3: Candidate Absent Day 3 (Escalation) ---")
        sess2 = LiveSession(
            batch_id=batch.id,
            trainer_id=trainer.id,
            title="Day 2 Live Session",
            session_type="ONLINE",
            start_time=datetime.utcnow() - timedelta(days=2),
            end_time=datetime.utcnow() - timedelta(days=2) + timedelta(hours=2),
        )
        sess3 = LiveSession(
            batch_id=batch.id,
            trainer_id=trainer.id,
            title="Day 3 Live Session",
            session_type="ONLINE",
            start_time=datetime.utcnow() - timedelta(days=1),
            end_time=datetime.utcnow() - timedelta(days=1) + timedelta(hours=2),
        )
        db.add_all([sess2, sess3])
        await db.commit()

        att2 = AttendanceRecord(session_id=sess2.id, trainee_id=candidate.id, status=AttendanceStatus.ABSENT)
        att3 = AttendanceRecord(session_id=sess3.id, trainee_id=candidate.id, status=AttendanceStatus.ABSENT)
        db.add_all([att2, att3])
        await db.commit()

        # Trigger attendance processing for Day 3
        followup = await process_attendance_event(db, trainee_id=candidate.id, session_id=sess3.id, marked_status="ABSENT", actor_id=trainer.id)

        assert followup.consecutive_absence_count == 3, f"Absence count should be 3, got {followup.consecutive_absence_count}"
        assert followup.current_stage == "ESCALATED", f"Stage should be ESCALATED, got {followup.current_stage}"
        print(f"[OK] Followup stage updated to: {followup.current_stage} (Absence count: {followup.consecutive_absence_count})")

        # Verify Day 3 Notifications for Candidate, Admin, and Coordinator
        admin_notifs_day3 = await get_user_notifications(db, user_id=admin.id)
        admin_esc_notif = next((n for n in admin_notifs_day3 if n.notification_type == "ATTENDANCE_DAY3_ESCALATION"), None)
        assert admin_esc_notif is not None, "Admin must receive Day 3 escalation notification"
        assert admin_esc_notif.priority == "HIGH", "Escalation notification must be HIGH priority"
        print(f"[OK] Admin received Day 3 HIGH priority escalation notification: '{admin_esc_notif.title}'")

        # ==================================================
        # TEST 4: CANDIDATE REMAINS ABSENT AFTER DAY 3 (POST DAY 3)
        # ==================================================
        print("\n--- TEST 4: Post Day 3 Absence (Admin Action Required) ---")
        sess4 = LiveSession(
            batch_id=batch.id,
            trainer_id=trainer.id,
            title="Day 4 Live Session",
            session_type="ONLINE",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(hours=2),
        )
        db.add(sess4)
        await db.commit()

        att4 = AttendanceRecord(session_id=sess4.id, trainee_id=candidate.id, status=AttendanceStatus.ABSENT)
        db.add(att4)
        await db.commit()

        # Process Day 4 absence
        await process_attendance_event(db, trainee_id=candidate.id, session_id=sess4.id, marked_status="ABSENT", actor_id=trainer.id)

        admin_notifs_day4 = await get_user_notifications(db, user_id=admin.id)
        admin_action_notif = next((n for n in admin_notifs_day4 if n.notification_type == "ATTENDANCE_ADMIN_ACTION_REQUIRED"), None)
        assert admin_action_notif is not None, "Admin must receive Action Required notification for post Day 3"
        print(f"[OK] Admin received Action Required notification: '{admin_action_notif.message}'")

        # Verify Candidate is NOT automatically removed
        bt_stmt = select(BatchTrainee).where(BatchTrainee.trainee_id == candidate.id, BatchTrainee.batch_id == batch.id)
        bt_res = await db.execute(bt_stmt)
        bt_record = bt_res.scalar_one_or_none()
        assert bt_record.status == "ACTIVE", "Candidate MUST NOT be automatically removed after Day 3!"
        print("[OK] Verified Business Rule: Candidate remains ACTIVE until explicit Admin action is taken.")

        # ==================================================
        # TEST 5: ADMIN MANUALLY REMOVES CANDIDATE FROM BATCH
        # ==================================================
        print("\n--- TEST 5: Admin Action Execution ---")
        action_res = await handle_admin_candidate_action(
            db=db,
            admin_user=admin,
            candidate_id=candidate.id,
            batch_id=batch.id,
            action_type="REMOVE_FROM_BATCH",
            comments="Removed due to 4 consecutive unexcused absences.",
        )
        assert action_res["status"] == "success"

        # Check BatchTrainee status
        bt_res_after = await db.execute(bt_stmt)
        bt_record_after = bt_res_after.scalar_one_or_none()
        assert bt_record_after.status == "REMOVED", f"Candidate status should be REMOVED, got {bt_record_after.status}"
        print(f"[OK] Admin successfully removed candidate from batch. Batch status: {bt_record_after.status}")

        cand_removed_notifs = await get_user_notifications(db, user_id=candidate.id)
        removed_notif = next((n for n in cand_removed_notifs if n.notification_type == "CANDIDATE_REMOVED"), None)
        assert removed_notif is not None, "Candidate must receive removal notification"
        print(f"[OK] Candidate received removal notification: '{removed_notif.title}'")

        # ==================================================
        # TEST 6: DUPLICATION PROTECTION
        # ==================================================
        print("\n--- TEST 6: Duplication Protection Check ---")
        before_count = len(await get_user_notifications(db, user_id=candidate.id))
        # Re-run attendance processing for Day 1
        await process_attendance_event(db, trainee_id=candidate.id, session_id=sess1.id, marked_status="ABSENT", actor_id=trainer.id)
        after_count = len(await get_user_notifications(db, user_id=candidate.id))
        assert before_count == after_count, "Duplicate notification must not be generated when reprocessed"
        print("[OK] Verified Duplication Protection: Re-processing event did NOT create duplicate notifications.")

        print("\n==================================================")
        print("ALL 6 TEST SCENARIOS PASSED SUCCESSFULLY!")
        print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_verification())
