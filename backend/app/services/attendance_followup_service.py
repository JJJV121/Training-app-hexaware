from datetime import datetime
import json
from fastapi import HTTPException
from sqlalchemy import select, func, text, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course
from app.models.live_session import LiveSession
from app.models.attendance_record import AttendanceRecord, AttendanceStatus
from app.models.attendance_followup import (
    AttendanceFollowupRecord,
    AttendanceFollowupAuditLog,
    SystemSetting,
    FollowupStage,
)
from app.services.email_service import (
    send_attendance_reminder_1_email,
    send_attendance_reminder_2_email,
    send_attendance_warning_email,
    send_discontinuation_email,
    send_cr_notification_email,
)

CR_TEAM_EMAIL = "cr_team@hexaware.com"
FRONTEND_BASE_URL = "http://localhost:5173"


# --------------------------------------------------
# Global Settings Helpers
# --------------------------------------------------

async def is_global_automation_enabled(db: AsyncSession) -> bool:
    stmt = select(SystemSetting).where(SystemSetting.key == "global_automation_enabled")
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()
    if not setting:
        return True  # Default enabled globally
    return setting.value.lower() == "true"


async def set_global_automation(db: AsyncSession, enabled: bool) -> bool:
    stmt = select(SystemSetting).where(SystemSetting.key == "global_automation_enabled")
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()
    val_str = "true" if enabled else "false"
    if setting:
        setting.value = val_str
        setting.updated_at = datetime.utcnow()
    else:
        setting = SystemSetting(key="global_automation_enabled", value=val_str)
        db.add(setting)
    await db.commit()
    return enabled


# --------------------------------------------------
# Candidate Eligibility
# --------------------------------------------------

async def toggle_candidate_eligibility(db: AsyncSession, candidate_id: int, enabled: bool) -> User:
    stmt = select(User).where(User.id == candidate_id)
    res = await db.execute(stmt)
    candidate = res.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    candidate.attendance_followup_enabled = enabled
    await db.commit()
    await db.refresh(candidate)
    return candidate


# --------------------------------------------------
# Consecutive Absence Calculator
# --------------------------------------------------

async def calculate_consecutive_absences(db: AsyncSession, candidate_id: int, batch_id: int) -> tuple[int, list[datetime]]:
    """
    Calculates consecutive training-session absences for candidate in batch.
    Does NOT count calendar days - only actual scheduled LiveSessions in DB.
    Returns (consecutive_absence_count, list_of_absence_dates).
    """
    # Fetch all live sessions for this batch ordered by date/time ascending
    sessions_stmt = select(LiveSession).where(
        LiveSession.batch_id == batch_id
    ).order_by(LiveSession.start_time.asc(), LiveSession.created_at.asc())
    
    sessions_res = await db.execute(sessions_stmt)
    sessions = sessions_res.scalars().all()

    if not sessions:
        return 0, []

    session_ids = [s.id for s in sessions]
    session_map = {s.id: s for s in sessions}

    # Fetch attendance records for this candidate in those sessions
    att_stmt = select(AttendanceRecord).where(
        AttendanceRecord.trainee_id == candidate_id,
        AttendanceRecord.session_id.in_(session_ids)
    )
    att_res = await db.execute(att_stmt)
    records = att_res.scalars().all()

    # Map session_id to attendance status & date
    record_map = {r.session_id: r for r in records}

    consecutive_count = 0
    absence_dates = []

    # Iterate through sessions backwards (most recent session first)
    for session in reversed(sessions):
        rec = record_map.get(session.id)
        if not rec:
            # Session exists but trainer has not marked attendance for candidate yet
            continue
        
        status_val = rec.status.value if hasattr(rec.status, 'value') else str(rec.status)
        if status_val in ["PRESENT", "LATE"]:
            # Candidate attended! Consecutive sequence breaks immediately.
            break
        elif status_val == "ABSENT":
            consecutive_count += 1
            absence_dates.append(rec.marked_at or session.start_time)

    absence_dates.reverse()  # Chronological order
    return consecutive_count, absence_dates


# --------------------------------------------------
# Audit Logger Helper
# --------------------------------------------------

async def log_audit_event(
    db: AsyncSession,
    followup_id: int,
    candidate_id: int,
    event_type: str,
    description: str,
    actor_id: int | None = None,
    actor_role: str | None = None,
    metadata_dict: dict | None = None,
):
    audit = AttendanceFollowupAuditLog(
        followup_record_id=followup_id,
        candidate_id=candidate_id,
        event_type=event_type,
        description=description,
        actor_id=actor_id,
        actor_role=actor_role,
        metadata_json=json.dumps(metadata_dict) if metadata_dict else None,
        created_at=datetime.utcnow(),
    )
    db.add(audit)


# --------------------------------------------------
# Core Attendance Follow-up Event Processor
# --------------------------------------------------

async def process_attendance_event(
    db: AsyncSession,
    trainee_id: int,
    session_id: int,
    marked_status: str,
    actor_id: int | None = None,
) -> AttendanceFollowupRecord | None:
    """
    Main workflow trigger called when attendance is marked or updated.
    Strictly checks candidate eligibility and global setting before taking ANY action.
    """

    # 1. Global Automation Check
    if not await is_global_automation_enabled(db):
        return None

    # 2. Candidate Eligibility Whitelist Check
    candidate_stmt = select(User).where(User.id == trainee_id)
    cand_res = await db.execute(candidate_stmt)
    candidate = cand_res.scalar_one_or_none()

    if not candidate or not candidate.attendance_followup_enabled:
        # Candidate is an existing student or NOT whitelisted -> DO NOTHING
        return None

    # 3. Get Session, Batch, Course Context
    sess_stmt = select(LiveSession).where(LiveSession.id == session_id)
    sess_res = await db.execute(sess_stmt)
    session_obj = sess_res.scalar_one_or_none()
    if not session_obj:
        return None

    batch_id = session_obj.batch_id
    batch_stmt = select(Batch).where(Batch.id == batch_id)
    batch_res = await db.execute(batch_stmt)
    batch_obj = batch_res.scalar_one_or_none()
    if not batch_obj:
        return None

    course_id = batch_obj.course_id
    course_stmt = select(Course).where(Course.id == course_id)
    course_res = await db.execute(course_stmt)
    course_obj = course_res.scalar_one_or_none()
    course_name = course_obj.title if course_obj else "Training Course"
    batch_name = batch_obj.name

    # 4. Fetch or Create Follow-up Record for Candidate
    followup_stmt = select(AttendanceFollowupRecord).where(
        AttendanceFollowupRecord.candidate_id == trainee_id,
        AttendanceFollowupRecord.batch_id == batch_id,
    ).order_by(AttendanceFollowupRecord.id.desc())
    
    followup_res = await db.execute(followup_stmt)
    followup = followup_res.scalars().first()

    if not followup:
        followup = AttendanceFollowupRecord(
            candidate_id=trainee_id,
            batch_id=batch_id,
            course_id=course_id,
            current_stage=FollowupStage.ACTIVE.value,
            consecutive_absence_count=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(followup)
        await db.flush()

    # 5. Calculate Consecutive Absences
    consecutive_absences, absence_dates = await calculate_consecutive_absences(db, trainee_id, batch_id)
    followup.consecutive_absence_count = consecutive_absences
    followup.updated_at = datetime.utcnow()

    # Normalize status string
    status_str = marked_status.value if hasattr(marked_status, 'value') else str(marked_status)

    # 6. Candidate PRESENT / LATE -> Reset/Close Cycle Immediately
    if status_str in ["PRESENT", "LATE"] or consecutive_absences == 0:
        if followup.current_stage not in [FollowupStage.CLOSED.value, FollowupStage.DISCONTINUED.value]:
            old_stage = followup.current_stage
            followup.current_stage = FollowupStage.CLOSED.value
            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="CYCLE_CLOSED",
                description=f"Candidate attended session (Status: {status_str}). Escalation cycle closed.",
                actor_id=actor_id, actor_role="TRAINER",
                metadata_dict={"previous_stage": old_stage, "consecutive_absences": 0}
            )
            await db.commit()
            await db.refresh(followup)
        return followup

    # 7. Candidate ABSENT -> Apply Workflow Escalation
    if absence_dates:
        followup.first_absence_date = absence_dates[0]
        followup.latest_absence_date = absence_dates[-1]

    # STAGE 1: Day 1 (Absence count = 1)
    if consecutive_absences == 1:
        if not followup.reminder_1_sent_at:
            followup.current_stage = FollowupStage.REMINDER_1_SENT.value
            followup.reminder_1_sent_at = datetime.utcnow()
            await send_attendance_reminder_1_email(
                email=candidate.email,
                name=candidate.name or candidate.employee_id,
                batch_name=batch_name,
                course_name=course_name,
            )
            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="REMINDER_1_SENT",
                description="Day 1 Reminder email sent to candidate.",
                actor_id=actor_id, actor_role="SYSTEM"
            )

    # STAGE 2: Day 2 (Absence count = 2)
    elif consecutive_absences == 2:
        if not followup.reminder_2_sent_at:
            followup.current_stage = FollowupStage.REMINDER_2_SENT.value
            followup.reminder_2_sent_at = datetime.utcnow()
            await send_attendance_reminder_2_email(
                email=candidate.email,
                name=candidate.name or candidate.employee_id,
                batch_name=batch_name,
                course_name=course_name,
            )
            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="REMINDER_2_SENT",
                description="Day 2 Second Reminder email sent to candidate.",
                actor_id=actor_id, actor_role="SYSTEM"
            )

    # STAGE 3: Day 3 (Absence count = 3)
    elif consecutive_absences == 3:
        if not followup.warning_sent_at:
            if followup.current_stage not in [FollowupStage.REASON_SUBMITTED.value, FollowupStage.REASON_APPROVED.value]:
                followup.current_stage = FollowupStage.WARNING_SENT.value
            followup.warning_sent_at = datetime.utcnow()
            sub_link = f"{FRONTEND_BASE_URL}/#submit-absence-reason?followup_id={followup.id}"
            await send_attendance_warning_email(
                email=candidate.email,
                name=candidate.name or candidate.employee_id,
                batch_name=batch_name,
                course_name=course_name,
                submission_link=sub_link,
            )
            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="WARNING_SENT",
                description="Day 3 Warning email sent with absence submission link.",
                actor_id=actor_id, actor_role="SYSTEM"
            )

    # STAGE 4: Day 4 (Absence count = 4)
    elif consecutive_absences == 4:
        # Keep candidate in warning/escalation state without sending duplicate emails
        if followup.current_stage not in [FollowupStage.REASON_SUBMITTED.value, FollowupStage.REASON_APPROVED.value, FollowupStage.REASON_REJECTED.value]:
            followup.current_stage = FollowupStage.WARNING_SENT.value
        await log_audit_event(
            db, followup.id, trainee_id,
            event_type="ABSENCE_RECORDED",
            description="Day 4 absence recorded. Candidate remains in warning/escalation state.",
            actor_id=actor_id, actor_role="SYSTEM"
        )

    # STAGE 5: Day 5 (Absence count >= 5) -> Discontinuation
    elif consecutive_absences >= 5:
        # Check if candidate reason is APPROVED -> Do not discontinue!
        if followup.current_stage == FollowupStage.REASON_APPROVED.value or followup.spoc_decision == "APPROVED":
            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="ABSENCE_RECORDED",
                description=f"Candidate absent for session (count: {consecutive_absences}), but absence reason is APPROVED. Discontinuation skipped.",
                actor_id=actor_id, actor_role="SYSTEM"
            )
        elif followup.current_stage != FollowupStage.DISCONTINUED.value:
            # Execute Discontinuation
            followup.current_stage = FollowupStage.DISCONTINUED.value
            followup.discontinued_at = datetime.utcnow()

            # Update BatchTrainee status
            bt_stmt = select(BatchTrainee).where(
                BatchTrainee.trainee_id == trainee_id,
                BatchTrainee.batch_id == batch_id
            )
            bt_res = await db.execute(bt_stmt)
            bt_obj = bt_res.scalar_one_or_none()
            if bt_obj:
                bt_obj.status = "DISCONTINUED"

            # Send Email 4: Discontinuation Email to candidate
            await send_discontinuation_email(
                email=candidate.email,
                name=candidate.name or candidate.employee_id,
                batch_name=batch_name,
                course_name=course_name,
                reason="5 consecutive session absences without approved reason"
            )

            # Send Email 5: CR Notification Email to Campus Recruitment Team
            if not followup.cr_notified_at:
                followup.cr_notified_at = datetime.utcnow()
                absence_str = ", ".join([d.strftime("%Y-%m-%d") for d in absence_dates])
                cr_info = {
                    "candidate_name": candidate.name or candidate.employee_id,
                    "employee_id": candidate.employee_id,
                    "candidate_email": candidate.email,
                    "batch_name": batch_name,
                    "course_name": course_name,
                    "absence_count": consecutive_absences,
                    "absence_dates": absence_str,
                    "discontinued_at": followup.discontinued_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "response_status": followup.spoc_decision or followup.current_stage,
                }
                await send_cr_notification_email(CR_TEAM_EMAIL, cr_info)
                await log_audit_event(
                    db, followup.id, trainee_id,
                    event_type="CR_NOTIFICATION_SENT",
                    description=f"Campus Recruitment notification sent to {CR_TEAM_EMAIL}.",
                    actor_id=actor_id, actor_role="SYSTEM"
                )

            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="DISCONTINUED",
                description="Candidate marked DISCONTINUED due to 5 consecutive session absences.",
                actor_id=actor_id, actor_role="SYSTEM"
            )

    await db.commit()
    await db.refresh(followup)
    return followup


# --------------------------------------------------
# Candidate Reason Submission
# --------------------------------------------------

async def submit_absence_reason(
    db: AsyncSession,
    candidate_id: int,
    followup_id: int,
    reason_category: str,
    reason_description: str,
    reason_attachment_url: str | None = None,
) -> AttendanceFollowupRecord:
    stmt = select(AttendanceFollowupRecord).where(
        AttendanceFollowupRecord.id == followup_id,
        AttendanceFollowupRecord.candidate_id == candidate_id,
    )
    res = await db.execute(stmt)
    followup = res.scalar_one_or_none()

    if not followup:
        raise HTTPException(status_code=404, detail="Attendance follow-up record not found.")

    followup.reason_category = reason_category
    followup.reason_description = reason_description
    followup.reason_attachment_url = reason_attachment_url
    followup.reason_submitted_at = datetime.utcnow()
    followup.current_stage = FollowupStage.REASON_SUBMITTED.value
    followup.updated_at = datetime.utcnow()

    await log_audit_event(
        db, followup.id, candidate_id,
        event_type="REASON_SUBMITTED",
        description=f"Absence reason submitted ({reason_category}). Pending SPOC approval.",
        actor_id=candidate_id, actor_role="TRAINEE",
        metadata_dict={"category": reason_category, "has_attachment": bool(reason_attachment_url)}
    )

    await db.commit()
    await db.refresh(followup)
    return followup


# --------------------------------------------------
# SPOC Approval / Rejection Action
# --------------------------------------------------

async def review_absence_reason(
    db: AsyncSession,
    spoc_user_id: int,
    followup_id: int,
    decision: str,
    spoc_comments: str | None = None,
) -> AttendanceFollowupRecord:
    stmt = select(AttendanceFollowupRecord).where(
        AttendanceFollowupRecord.id == followup_id
    )
    res = await db.execute(stmt)
    followup = res.scalar_one_or_none()

    if not followup:
        raise HTTPException(status_code=404, detail="Attendance follow-up record not found.")

    decision_upper = decision.upper()
    if decision_upper not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVE or REJECT.")

    followup.spoc_id = spoc_user_id
    followup.spoc_decision = "APPROVED" if decision_upper == "APPROVE" else "REJECTED"
    followup.spoc_comments = spoc_comments
    followup.spoc_reviewed_at = datetime.utcnow()
    followup.updated_at = datetime.utcnow()

    if decision_upper == "APPROVE":
        followup.current_stage = FollowupStage.REASON_APPROVED.value
        await log_audit_event(
            db, followup.id, followup.candidate_id,
            event_type="SPOC_APPROVED",
            description="Absence reason APPROVED by SPOC. Discontinuation escalation stopped.",
            actor_id=spoc_user_id, actor_role="SPOC",
            metadata_dict={"comments": spoc_comments}
        )
    else:
        followup.current_stage = FollowupStage.REASON_REJECTED.value
        await log_audit_event(
            db, followup.id, followup.candidate_id,
            event_type="SPOC_REJECTED",
            description="Absence reason REJECTED by SPOC. Escalation workflow continues.",
            actor_id=spoc_user_id, actor_role="SPOC",
            metadata_dict={"comments": spoc_comments}
        )

    await db.commit()
    await db.refresh(followup)
    return followup


# --------------------------------------------------
# Background Scheduler Processor
# --------------------------------------------------

async def run_attendance_followup_automation(db: AsyncSession) -> int:
    """
    Periodic worker function that scans all whitelisted candidates and syncs their follow-up stage.
    Guaranteed IDEMPOTENT.
    """
    if not await is_global_automation_enabled(db):
        return 0

    # Get all whitelisted candidates
    stmt = select(User).where(User.attendance_followup_enabled == True)
    res = await db.execute(stmt)
    candidates = res.scalars().all()

    processed_count = 0
    for cand in candidates:
        # Get active batches for candidate
        bt_stmt = select(BatchTrainee).where(BatchTrainee.trainee_id == cand.id)
        bt_res = await db.execute(bt_stmt)
        mappings = bt_res.scalars().all()

        for mapping in mappings:
            # Find latest session in batch
            sess_stmt = select(LiveSession).where(
                LiveSession.batch_id == mapping.batch_id
            ).order_by(LiveSession.id.desc()).limit(1)
            
            sess_res = await db.execute(sess_stmt)
            latest_sess = sess_res.scalar_one_or_none()

            if latest_sess:
                # Get candidate marked status in latest session
                att_stmt = select(AttendanceRecord).where(
                    AttendanceRecord.session_id == latest_sess.id,
                    AttendanceRecord.trainee_id == cand.id
                )
                att_res = await db.execute(att_stmt)
                att_rec = att_res.scalar_one_or_none()

                status_val = att_rec.status.value if att_rec and hasattr(att_rec.status, 'value') else (att_rec.status if att_rec else "ABSENT")
                await process_attendance_event(db, cand.id, latest_sess.id, status_val)
                processed_count += 1

    return processed_count
