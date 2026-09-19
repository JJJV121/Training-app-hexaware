from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.attendance_record import AttendanceRecord
from app.models.assignment_submission import AssignmentSubmission
from app.models.candidate_issue import CandidateIssue


async def get_coordinator_assigned_batches(db: AsyncSession, coordinator_id: int) -> list[Batch]:
    """
    Fetch all active batches assigned to this Batch Coordinator.
    Enforces strict DB-level data isolation.
    """
    stmt = select(Batch).where(
        or_(Batch.spoc_id == coordinator_id, Batch.trainer_id == coordinator_id)
    ).order_by(Batch.id.desc())
    
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def verify_coordinator_batch_access(db: AsyncSession, coordinator_id: int, batch_id: int) -> Batch:
    """
    Validates that the authenticated coordinator actually manages the target batch.
    Throws 403 if unauthorized.
    """
    stmt = select(Batch).where(
        Batch.id == batch_id,
        or_(Batch.spoc_id == coordinator_id, Batch.trainer_id == coordinator_id)
    )
    res = await db.execute(stmt)
    batch = res.scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=403,
            detail="Access denied. You do not manage this batch."
        )
    return batch


async def get_coordinator_dashboard_metrics(db: AsyncSession, coordinator_id: int) -> dict:
    """
    Calculates real DB-driven metrics for the Batch Coordinator dashboard.
    """
    batches = await get_coordinator_assigned_batches(db, coordinator_id)
    batch_ids = [b.id for b in batches]

    if not batch_ids:
        return {
            "assigned_batches_count": 0,
            "total_trainees_count": 0,
            "active_trainees_count": 0,
            "attendance_rate": 0,
            "pending_issues_count": 0,
            "batches": [],
        }

    # Count total & active trainees in assigned batches
    trainees_stmt = select(func.count(BatchTrainee.id), BatchTrainee.status).where(
        BatchTrainee.batch_id.in_(batch_ids)
    ).group_by(BatchTrainee.status)
    
    t_res = await db.execute(trainees_stmt)
    t_rows = t_res.all()
    
    total_trainees = sum(count for count, _ in t_rows)
    active_trainees = sum(count for count, status in t_rows if status == "ACTIVE")

    # Count pending issues for these batches
    issues_stmt = select(func.count(CandidateIssue.id)).where(
        CandidateIssue.batch_id.in_(batch_ids),
        CandidateIssue.status.in_(["OPEN", "IN_PROGRESS"])
    )
    i_res = await db.execute(issues_stmt)
    pending_issues = i_res.scalar() or 0

    formatted_batches = []
    for b in batches:
        # Trainee count for this batch
        count_stmt = select(func.count(BatchTrainee.id)).where(
            BatchTrainee.batch_id == b.id,
            BatchTrainee.status == "ACTIVE"
        )
        c_res = await db.execute(count_stmt)
        t_count = c_res.scalar() or 0

        formatted_batches.append({
            "id": b.id,
            "name": b.name,
            "course_id": b.course_id,
            "start_date": b.start_date.isoformat() if b.start_date else None,
            "end_date": b.end_date.isoformat() if b.end_date else None,
            "max_strength": b.max_strength,
            "active_trainees": t_count,
            "status": b.status,
        })

    return {
        "assigned_batches_count": len(batches),
        "total_trainees_count": total_trainees,
        "active_trainees_count": active_trainees,
        "pending_issues_count": pending_issues,
        "batches": formatted_batches,
    }


async def get_coordinator_batch_detail(db: AsyncSession, coordinator_id: int, batch_id: int) -> dict:
    """
    Get detailed breakdown for a specific batch managed by the coordinator.
    """
    batch = await verify_coordinator_batch_access(db, coordinator_id, batch_id)

    # Fetch trainees in batch
    bt_stmt = (
        select(BatchTrainee, User)
        .join(User, User.id == BatchTrainee.trainee_id)
        .where(BatchTrainee.batch_id == batch_id)
    )
    bt_res = await db.execute(bt_stmt)
    trainee_rows = bt_res.all()

    trainees = [
        {
            "id": user.id,
            "name": user.name or user.employee_id,
            "email": user.email,
            "employee_id": user.employee_id,
            "joined_at": bt.joined_at.isoformat() if bt.joined_at else None,
            "status": bt.status,
        }
        for bt, user in trainee_rows
    ]

    return {
        "batch_id": batch.id,
        "name": batch.name,
        "course_id": batch.course_id,
        "start_date": batch.start_date.isoformat() if batch.start_date else None,
        "end_date": batch.end_date.isoformat() if batch.end_date else None,
        "status": batch.status,
        "trainees_count": len(trainees),
        "trainees": trainees,
    }
