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
from app.services.notification_service import send_notification
from app.core.config import settings

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
            
            day1_email_html = f"""
            <html>
              <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
                  <h2 style="margin: 0 0 16px; color: #1e3a8a;">[Hexaware LMS] Attendance Reminder - Day 1</h2>
                  <p style="margin: 0 0 16px; font-size: 16px;">Dear {candidate.name or candidate.employee_id},</p>
                  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                    We noticed that you were marked <strong>ABSENT</strong> for Day 1 in <strong>{course_name}</strong> ({batch_name}) on {session_obj.start_time.strftime('%Y-%m-%d') if session_obj.start_time else 'today'}.
                  </p>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                    This is a reminder to attend all upcoming scheduled training sessions promptly to stay on track.
                  </p>
                  <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">Best regards,<br/>Hexaware Training Team</p>
                </div>
              </body>
            </html>
            """
            
            # Send Notification + Email to Candidate (Day 1)
            await send_notification(
                db=db,
                user_id=trainee_id,
                notification_type="ATTENDANCE_DAY1",
                title="[Hexaware LMS] Attendance Reminder - Day 1",
                message=f"You were marked absent for Day 1 training in {course_name} ({batch_name}). Please join upcoming sessions.",
                channel="ALL",
                priority="LOW",
                reference_type="ATTENDANCE",
                reference_id=followup.id,
                email_recipient=candidate.email,
                email_subject="[Hexaware LMS] Attendance Reminder - Day 1",
                email_body_html=day1_email_html,
            )

            # Send Notification to Batch Coordinator (Trainer/SPOC)
            if batch_obj.trainer_id:
                await send_notification(
                    db=db,
                    user_id=batch_obj.trainer_id,
                    notification_type="ATTENDANCE_DAY1",
                    title=f"Day 1 Absence Notice: {candidate.name or candidate.employee_id}",
                    message=f"Candidate {candidate.name or candidate.employee_id} ({candidate.employee_id}) was absent for Day 1 in batch '{batch_name}'.",
                    channel="IN_APP",
                    priority="LOW",
                    reference_type="ATTENDANCE",
                    reference_id=followup.id,
                )

            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="REMINDER_1_SENT",
                description="Day 1 Reminder email & notification sent to candidate and coordinator.",
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

    # STAGE 3: Day 3 (Absence count = 3) -> ESCALATED
    elif consecutive_absences == 3:
        if not followup.warning_sent_at:
            followup.current_stage = "ESCALATED"
            followup.warning_sent_at = datetime.utcnow()
            
            sub_link = f"{FRONTEND_BASE_URL}/#submit-absence-reason?followup_id={followup.id}"
            
            # Candidate Email & In-App Notification
            cand_email_html = f"""
            <html>
              <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #fca5a5; border-radius: 12px; padding: 32px;">
                  <h2 style="margin: 0 0 16px; color: #dc2626;">[Hexaware LMS] Attendance Escalation - Day 3</h2>
                  <p style="margin: 0 0 16px; font-size: 16px;">Dear {candidate.name or candidate.employee_id},</p>
                  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                    You have reached <strong>3 consecutive absences</strong> in <strong>{course_name}</strong> ({batch_name}). Your attendance status has been escalated to Administration.
                  </p>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #1e293b;">
                    Please submit a formal absence reason documentation through the portal immediately.
                  </p>
                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="{sub_link}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700;">Submit Absence Reason</a>
                  </div>
                </div>
              </body>
            </html>
            """
            
            await send_notification(
                db=db,
                user_id=trainee_id,
                notification_type="ATTENDANCE_DAY3_ESCALATION",
                title="[Hexaware LMS] Attendance Escalation - Day 3",
                message=f"You have 3 consecutive absences in {course_name} ({batch_name}). Case escalated to Admin.",
                channel="ALL",
                priority="HIGH",
                reference_type="ATTENDANCE",
                reference_id=followup.id,
                email_recipient=candidate.email,
                email_subject=f"[Hexaware LMS] Attendance Escalation - Day 3",
                email_body_html=cand_email_html,
            )

            # Admin Email & In-App Notification (Day 3 Escalation)
            admin_email = settings.ADMIN_EMAIL or "admin@company.com"
            admin_stmt = select(User).where(User.role == "ADMIN")
            admin_res = await db.execute(admin_stmt)
            admin_users = admin_res.scalars().all()
            admin_user_ids = [u.id for u in admin_users] if admin_users else [1]

            absence_dates_str = ", ".join([d.strftime("%Y-%m-%d") for d in absence_dates])
            last_date_str = absence_dates[-1].strftime("%Y-%m-%d") if absence_dates else "N/A"

            admin_email_html = f"""
            <html>
              <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
                <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #fca5a5; border-radius: 12px; padding: 32px;">
                  <h2 style="margin: 0 0 16px; color: #dc2626;">[Hexaware LMS] Attendance Escalation - {candidate.name or candidate.employee_id}</h2>
                  <p style="margin: 0 0 16px; font-size: 15px;">The following candidate has accumulated <strong>3 consecutive absences</strong> and requires administrative oversight:</p>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%;">Candidate Name</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{candidate.name or candidate.employee_id}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Employee ID</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{candidate.employee_id}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Batch</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{batch_name}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Training Program</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{course_name}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Day 1 Attendance</td><td style="padding: 8px; border: 1px solid #e2e8f0; color: #dc2626;">ABSENT</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Day 2 Attendance</td><td style="padding: 8px; border: 1px solid #e2e8f0; color: #dc2626;">ABSENT</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Day 3 Attendance</td><td style="padding: 8px; border: 1px solid #e2e8f0; color: #dc2626;">ABSENT</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Total Absence Count</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">{consecutive_absences} Consecutive Sessions</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Last Absence Date</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{last_date_str}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Current Status</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">ESCALATED</td></tr>
                  </table>
                </div>
              </body>
            </html>
            """

            for idx, a_id in enumerate(admin_user_ids):
                send_channel = "ALL" if idx == 0 else "IN_APP"
                await send_notification(
                    db=db,
                    user_id=a_id,
                    notification_type="ATTENDANCE_DAY3_ESCALATION",
                    title=f"Attendance Escalation: {candidate.name or candidate.employee_id}",
                    message=f"Candidate {candidate.name or candidate.employee_id} ({candidate.employee_id}) has reached 3 consecutive absences in batch '{batch_name}'. Status: ESCALATED.",
                    channel=send_channel,
                    priority="HIGH",
                    reference_type="ATTENDANCE",
                    reference_id=followup.id,
                    email_recipient=admin_email if send_channel == "ALL" else None,
                    email_subject=f"[Hexaware LMS] Attendance Escalation - {candidate.name or candidate.employee_id}" if send_channel == "ALL" else None,
                    email_body_html=admin_email_html if send_channel == "ALL" else None,
                )

            # Coordinator In-App Notification
            if batch_obj.trainer_id:
                await send_notification(
                    db=db,
                    user_id=batch_obj.trainer_id,
                    notification_type="ATTENDANCE_DAY3_ESCALATION",
                    title=f"Attendance Escalated: {candidate.name or candidate.employee_id}",
                    message=f"Candidate {candidate.name or candidate.employee_id} reached Day 3 absence in batch '{batch_name}'. Case escalated to Admin.",
                    channel="IN_APP",
                    priority="HIGH",
                    reference_type="ATTENDANCE",
                    reference_id=followup.id,
                )

            await log_audit_event(
                db, followup.id, trainee_id,
                event_type="DAY3_ESCALATED",
                description="Day 3 Escalation triggered. Email and notification dispatched to Admin & Coordinator.",
                actor_id=actor_id, actor_role="SYSTEM"
            )

    # STAGE 4: POST DAY 3 (Absence count > 3) -> High Priority Admin Action Required
    elif consecutive_absences > 3:
        followup.current_stage = "ESCALATED"
        
        admin_stmt = select(User).where(User.role == "ADMIN")
        admin_res = await db.execute(admin_stmt)
        admin_users = admin_res.scalars().all()
        admin_user_ids = [u.id for u in admin_users] if admin_users else [1]

        for a_id in admin_user_ids:
            await send_notification(
                db=db,
                user_id=a_id,
                notification_type="ATTENDANCE_ADMIN_ACTION_REQUIRED",
                title=f"Admin Action Required: {candidate.name or candidate.employee_id}",
                message=f"Candidate requires administrative action due to continued absence ({consecutive_absences} consecutive absences in '{batch_name}').",
                channel="IN_APP",
                priority="HIGH",
                reference_type="ATTENDANCE",
                reference_id=followup.id,
            )


        await log_audit_event(
            db, followup.id, trainee_id,
            event_type="ADMIN_ACTION_REQUIRED",
            description=f"Continued absence (count: {consecutive_absences}). High priority notification generated for Admin.",
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


# --------------------------------------------------
# Admin Action Post Day 3 Handler (Requirements 6 & 17)
# --------------------------------------------------

async def handle_admin_candidate_action(
    db: AsyncSession,
    admin_user: User,
    candidate_id: int,
    batch_id: int,
    action_type: str,  # KEEP_ACTIVE, CONTACT, REMOVE_FROM_BATCH, DEACTIVATE
    comments: str | None = None,
) -> dict:
    """
    Executes manual administrative action on escalated candidates after Day 3 absence.
    Actions supported:
    - KEEP_ACTIVE: Keep candidate active in batch.
    - CONTACT: Log contact action.
    - REMOVE_FROM_BATCH: Remove candidate from batch membership.
    - DEACTIVATE: Deactivate user account & batch membership.
    """
    action_upper = action_type.upper()
    valid_actions = ["KEEP_ACTIVE", "CONTACT", "REMOVE_FROM_BATCH", "DEACTIVATE"]
    if action_upper not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action type. Must be one of {valid_actions}")

    # Fetch User & BatchTrainee
    user_stmt = select(User).where(User.id == candidate_id)
    user_res = await db.execute(user_stmt)
    candidate = user_res.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    bt_stmt = select(BatchTrainee).where(
        BatchTrainee.trainee_id == candidate_id,
        BatchTrainee.batch_id == batch_id
    )
    bt_res = await db.execute(bt_stmt)
    bt_record = bt_res.scalar_one_or_none()

    # Find followup record if existing
    followup_stmt = select(AttendanceFollowupRecord).where(
        AttendanceFollowupRecord.candidate_id == candidate_id,
        AttendanceFollowupRecord.batch_id == batch_id
    ).order_by(AttendanceFollowupRecord.id.desc())
    f_res = await db.execute(followup_stmt)
    followup = f_res.scalars().first()

    followup_id = followup.id if followup else 0

    result_msg = ""
    if action_upper == "KEEP_ACTIVE":
        if followup:
            followup.current_stage = FollowupStage.ACTIVE.value
            followup.spoc_comments = comments
        result_msg = f"Candidate {candidate.name or candidate.employee_id} retained as ACTIVE."
        if followup_id:
            await log_audit_event(
                db, followup_id, candidate_id,
                event_type="ADMIN_ACTION_KEEP_ACTIVE",
                description=f"Admin retained candidate as ACTIVE. Comments: {comments or 'None'}",
                actor_id=admin_user.id, actor_role="ADMIN"
            )

    elif action_upper == "CONTACT":
        result_msg = f"Contact action logged for candidate {candidate.name or candidate.employee_id}."
        if followup_id:
            await log_audit_event(
                db, followup_id, candidate_id,
                event_type="ADMIN_ACTION_CONTACT",
                description=f"Admin recorded candidate contact attempt. Comments: {comments or 'None'}",
                actor_id=admin_user.id, actor_role="ADMIN"
            )

    elif action_upper == "REMOVE_FROM_BATCH":
        if bt_record:
            bt_record.status = "REMOVED"
        if followup:
            followup.current_stage = "REMOVED"
        
        result_msg = f"Candidate {candidate.name or candidate.employee_id} removed from batch."
        
        # Send Candidate Notification & Email
        await send_notification(
            db=db,
            user_id=candidate_id,
            notification_type="CANDIDATE_REMOVED",
            title="Training Program Status Update",
            message=f"You have been removed from your assigned training batch by Administration.",
            channel="ALL",
            priority="HIGH",
            email_recipient=candidate.email,
            email_subject="[Hexaware LMS] Training Program Status Update",
            email_body_html=f"<p>Hi {candidate.name or candidate.employee_id},</p><p>You have been removed from your training batch due to attendance policy enforcement.</p>"
        )

        if followup_id:
            await log_audit_event(
                db, followup_id, candidate_id,
                event_type="ADMIN_ACTION_REMOVE_BATCH",
                description=f"Admin removed candidate from batch. Comments: {comments or 'None'}",
                actor_id=admin_user.id, actor_role="ADMIN"
            )

    elif action_upper == "DEACTIVATE":
        candidate.is_active = False
        if bt_record:
            bt_record.status = "DEACTIVATED"
        if followup:
            followup.current_stage = "DEACTIVATED"

        result_msg = f"Candidate account {candidate.name or candidate.employee_id} deactivated."

        await send_notification(
            db=db,
            user_id=candidate_id,
            notification_type="CANDIDATE_REMOVED",
            title="Account Status Deactivated",
            message=f"Your candidate account has been deactivated by Administration.",
            channel="ALL",
            priority="HIGH",
            email_recipient=candidate.email,
            email_subject="[Hexaware LMS] Account Deactivation Notice",
            email_body_html=f"<p>Hi {candidate.name or candidate.employee_id},</p><p>Your Hexaware LMS account has been deactivated.</p>"
        )

        if followup_id:
            await log_audit_event(
                db, followup_id, candidate_id,
                event_type="ADMIN_ACTION_DEACTIVATE",
                description=f"Admin deactivated candidate account. Comments: {comments or 'None'}",
                actor_id=admin_user.id, actor_role="ADMIN"
            )

    await db.commit()

    return {
        "status": "success",
        "action": action_upper,
        "message": result_msg,
        "candidate_id": candidate_id,
        "batch_id": batch_id,
    }

