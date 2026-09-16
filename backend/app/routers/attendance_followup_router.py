import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_trainee,
    get_current_trainer,
    get_current_admin,
    get_current_trainer_or_admin,
)
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course
from app.models.attendance_followup import (
    AttendanceFollowupRecord,
    AttendanceFollowupAuditLog,
    SystemSetting,
    FollowupStage,
)
from app.schemas.attendance_followup import (
    AbsenceReasonSubmit,
    SPOCReviewSubmit,
    CandidateEligibilityToggle,
    GlobalAutomationToggle,
)
from app.services.attendance_followup_service import (
    is_global_automation_enabled,
    set_global_automation,
    toggle_candidate_eligibility,
    submit_absence_reason,
    review_absence_reason,
    run_attendance_followup_automation,
)

router = APIRouter(
    prefix="/api/attendance-followup",
    tags=["Attendance Follow-up Automation"],
)

UPLOAD_DIR = "app/uploads/absence_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --------------------------------------------------
# Helper: Format Follow-up Response
# --------------------------------------------------

async def format_followup_response(db: AsyncSession, rec: AttendanceFollowupRecord) -> dict:
    # Get candidate info
    user_res = await db.execute(select(User).where(User.id == rec.candidate_id))
    cand = user_res.scalar_one_or_none()

    # Get batch info
    batch_res = await db.execute(select(Batch).where(Batch.id == rec.batch_id))
    batch = batch_res.scalar_one_or_none()

    # Get course info
    course_res = await db.execute(select(Course).where(Course.id == rec.course_id))
    course = course_res.scalar_one_or_none()

    return {
        "id": rec.id,
        "candidate_id": rec.candidate_id,
        "candidate_name": cand.name if cand else "Unknown",
        "candidate_email": cand.email if cand else "",
        "employee_id": cand.employee_id if cand else "",
        "attendance_followup_enabled": cand.attendance_followup_enabled if cand else False,
        "batch_id": rec.batch_id,
        "batch_name": batch.name if batch else "",
        "course_id": rec.course_id,
        "course_name": course.title if course else "",
        "current_stage": rec.current_stage,
        "consecutive_absence_count": rec.consecutive_absence_count,
        "first_absence_date": rec.first_absence_date.isoformat() if rec.first_absence_date else None,
        "latest_absence_date": rec.latest_absence_date.isoformat() if rec.latest_absence_date else None,
        "reminder_1_sent_at": rec.reminder_1_sent_at.isoformat() if rec.reminder_1_sent_at else None,
        "reminder_2_sent_at": rec.reminder_2_sent_at.isoformat() if rec.reminder_2_sent_at else None,
        "warning_sent_at": rec.warning_sent_at.isoformat() if rec.warning_sent_at else None,
        "reason_submitted_at": rec.reason_submitted_at.isoformat() if rec.reason_submitted_at else None,
        "reason_category": rec.reason_category,
        "reason_description": rec.reason_description,
        "reason_attachment_url": rec.reason_attachment_url,
        "spoc_reviewed_at": rec.spoc_reviewed_at.isoformat() if rec.spoc_reviewed_at else None,
        "spoc_id": rec.spoc_id,
        "spoc_decision": rec.spoc_decision,
        "spoc_comments": rec.spoc_comments,
        "discontinued_at": rec.discontinued_at.isoformat() if rec.discontinued_at else None,
        "cr_notified_at": rec.cr_notified_at.isoformat() if rec.cr_notified_at else None,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
        "updated_at": rec.updated_at.isoformat() if rec.updated_at else None,
    }


# --------------------------------------------------
# Candidate APIs
# --------------------------------------------------

@router.get("/candidate/status")
async def get_candidate_followup_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_trainee),
):
    """Fetch active attendance follow-up & warnings for logged-in candidate."""
    stmt = select(AttendanceFollowupRecord).where(
        AttendanceFollowupRecord.candidate_id == current_user.id
    ).order_by(AttendanceFollowupRecord.id.desc())
    
    res = await db.execute(stmt)
    records = res.scalars().all()

    formatted = []
    for r in records:
        formatted.append(await format_followup_response(db, r))
    return formatted


@router.post("/candidate/submit-reason")
async def submit_absence_reason_api(
    followup_id: int = Form(...),
    reason_category: str = Form(...),
    reason_description: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_trainee),
):
    """Candidate submits reason and optional attachment for an active warning."""
    attachment_url = None
    if file:
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        filename = f"absence_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        attachment_url = f"/uploads/absence_docs/{filename}"

    rec = await submit_absence_reason(
        db=db,
        candidate_id=current_user.id,
        followup_id=followup_id,
        reason_category=reason_category,
        reason_description=reason_description,
        reason_attachment_url=attachment_url,
    )
    return await format_followup_response(db, rec)


# --------------------------------------------------
# SPOC / Trainer APIs
# --------------------------------------------------

@router.get("/spoc/requests")
async def get_spoc_pending_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_trainer_or_admin),
):
    """Fetch all attendance approval requests for SPOC/Trainer's assigned batches or all if admin."""
    if current_user.role and current_user.role.upper() == "ADMIN":
        stmt = select(AttendanceFollowupRecord).where(
            AttendanceFollowupRecord.current_stage.in_([
                FollowupStage.REASON_SUBMITTED.value,
                FollowupStage.WARNING_SENT.value,
                FollowupStage.REASON_APPROVED.value,
                FollowupStage.REASON_REJECTED.value,
            ])
        ).order_by(AttendanceFollowupRecord.updated_at.desc())
    else:
        # Get batches trainer is assigned to or SPOC of
        b_stmt = select(Batch.id).where(
            (Batch.trainer_id == current_user.id) | (Batch.spoc_id == current_user.id)
        )
        b_res = await db.execute(b_stmt)
        batch_ids = b_res.scalars().all()

        stmt = select(AttendanceFollowupRecord).where(
            AttendanceFollowupRecord.batch_id.in_(batch_ids)
        ).order_by(AttendanceFollowupRecord.updated_at.desc())

    res = await db.execute(stmt)
    records = res.scalars().all()

    formatted = []
    for r in records:
        formatted.append(await format_followup_response(db, r))
    return formatted


@router.post("/spoc/requests/review")
async def review_absence_reason_api(
    data: SPOCReviewSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_trainer_or_admin),
):
    """Batch SPOC approves or rejects submitted absence reason."""
    rec = await review_absence_reason(
        db=db,
        spoc_user_id=current_user.id,
        followup_id=data.followup_id,
        decision=data.decision,
        spoc_comments=data.spoc_comments,
    )
    return await format_followup_response(db, rec)


# --------------------------------------------------
# Admin Management & Monitoring APIs
# --------------------------------------------------

@router.get("/admin/cases")
async def get_admin_cases_api(
    batch_id: Optional[int] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin view: List all attendance follow-up cases, metrics counters, and filters."""
    global_enabled = await is_global_automation_enabled(db)

    stmt = select(AttendanceFollowupRecord).order_by(AttendanceFollowupRecord.updated_at.desc())
    if batch_id:
        stmt = stmt.where(AttendanceFollowupRecord.batch_id == batch_id)
    if stage:
        stmt = stmt.where(AttendanceFollowupRecord.current_stage == stage)

    res = await db.execute(stmt)
    records = res.scalars().all()

    formatted_cases = []
    stage_counts = {
        "ACTIVE": 0,
        "REMINDER_1_SENT": 0,
        "REMINDER_2_SENT": 0,
        "WARNING_SENT": 0,
        "REASON_SUBMITTED": 0,
        "REASON_APPROVED": 0,
        "REASON_REJECTED": 0,
        "DISCONTINUED": 0,
        "CLOSED": 0,
    }

    for r in records:
        f = await format_followup_response(db, r)
        st = r.current_stage
        if st in stage_counts:
            stage_counts[st] += 1

        if search:
            s_lower = search.lower()
            if (s_lower in f["candidate_name"].lower() or 
                s_lower in f["candidate_email"].lower() or 
                s_lower in f["employee_id"].lower()):
                formatted_cases.append(f)
        else:
            formatted_cases.append(f)

    # Get candidate whitelist list (showing E_034, E_035, and others)
    cand_stmt = select(User).where(User.role.ilike("trainee")).order_by(User.id.asc())
    cand_res = await db.execute(cand_stmt)
    all_candidates = cand_res.scalars().all()

    candidate_list = [
        {
            "id": c.id,
            "name": c.name or c.employee_id,
            "email": c.email,
            "employee_id": c.employee_id,
            "attendance_followup_enabled": c.attendance_followup_enabled,
        }
        for c in all_candidates
    ]

    return {
        "global_automation_enabled": global_enabled,
        "stage_counts": stage_counts,
        "cases": formatted_cases,
        "candidates": candidate_list,
    }


@router.put("/admin/global-toggle")
async def toggle_global_automation_api(
    data: GlobalAutomationToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin toggles global attendance follow-up automation ON/OFF."""
    enabled = await set_global_automation(db, data.enabled)
    return {"global_automation_enabled": enabled, "message": f"Global automation set to {enabled}"}


@router.put("/admin/candidate-eligibility/{candidate_id}")
async def toggle_candidate_eligibility_api(
    candidate_id: int,
    data: GlobalAutomationToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin toggles per-candidate attendance_followup_enabled flag."""
    cand = await toggle_candidate_eligibility(db, candidate_id, data.enabled)
    return {
        "candidate_id": cand.id,
        "employee_id": cand.employee_id,
        "attendance_followup_enabled": cand.attendance_followup_enabled,
    }


@router.post("/admin/trigger-scheduler")
async def trigger_scheduler_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Manually trigger periodic background scheduler run."""
    count = await run_attendance_followup_automation(db)
    return {"message": "Scheduler execution completed", "processed_candidates": count}
