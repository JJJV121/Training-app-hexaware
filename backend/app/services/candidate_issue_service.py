from datetime import datetime
import uuid
import logging
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile

from app.models.candidate_issue import CandidateIssue
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.core.config import settings
from app.utils.file_upload import save_uploaded_file
from app.services.notification_service import send_notification

logger = logging.getLogger(__name__)


async def generate_unique_issue_id(db: AsyncSession) -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"ISS-{today_str}-"
    
    # Count existing issues created today
    stmt = select(func.count(CandidateIssue.id)).where(CandidateIssue.issue_id.like(f"{prefix}%"))
    res = await db.execute(stmt)
    count = res.scalar() or 0
    seq = count + 1
    return f"{prefix}{seq:04d}"


async def get_candidate_batch(db: AsyncSession, candidate_id: int) -> tuple[int | None, str]:
    stmt = (
        select(Batch)
        .join(BatchTrainee, BatchTrainee.batch_id == Batch.id)
        .where(BatchTrainee.trainee_id == candidate_id)
        .order_by(Batch.id.desc())
    )
    res = await db.execute(stmt)
    batch = res.scalar_one_or_none()
    if batch:
        return batch.id, batch.name
    return None, "Unassigned"


async def create_candidate_issue(
    db: AsyncSession,
    candidate: User,
    issue_type: str,
    subject: str,
    description: str,
    priority: str = "MEDIUM",
    attachment_file: UploadFile | None = None,
) -> CandidateIssue:
    # 1. Generate unique Issue ID
    issue_id_code = await generate_unique_issue_id(db)

    # 2. Get batch info
    batch_id, batch_name = await get_candidate_batch(db, candidate.id)

    # 3. Handle File Attachment
    attachment_url = None
    if attachment_file and attachment_file.filename:
        try:
            attachment_url = await save_uploaded_file(attachment_file, folder="candidate_issues")
        except Exception as e:
            logger.warning(f"Failed to save issue attachment file: {e}")
            if hasattr(attachment_file, "file"):
                # Fallback simple write if MIME check restricts PDF only
                import os
                os.makedirs("assignment_files/candidate_issues", exist_ok=True)
                ext = attachment_file.filename.split(".")[-1]
                fn = f"{uuid.uuid4()}.{ext}"
                path = f"assignment_files/candidate_issues/{fn}"
                contents = await attachment_file.read()
                with open(path, "wb") as f:
                    f.write(contents)
                attachment_url = path

    # 4. Determine Issue Assignment (Account/Login -> Admin; Academic -> Batch Coordinator)
    assigned_user_id = None
    is_admin_issue = False
    
    issue_type_upper = issue_type.upper().strip()
    account_types = ["LOGIN ISSUE", "ACCOUNT SETUP ISSUE", "PASSWORD ISSUE", "MFA / AUTHENTICATION ISSUE", "LOGIN", "ACCOUNT", "ACTIVATION", "PASSWORD"]
    
    if any(at in issue_type_upper for at in account_types):
        is_admin_issue = True
    else:
        if batch_id:
            b_stmt = select(Batch).where(Batch.id == batch_id)
            b_res = await db.execute(b_stmt)
            batch_obj = b_res.scalar_one_or_none()
            if batch_obj:
                assigned_user_id = batch_obj.spoc_id or batch_obj.trainer_id

    if not assigned_user_id:
        is_admin_issue = True
        admin_stmt = select(User).where(User.role == "ADMIN")
        admin_res = await db.execute(admin_stmt)
        admin_user = admin_res.scalars().first()
        if admin_user:
            assigned_user_id = admin_user.id

    # 5. Create Issue Record
    issue = CandidateIssue(
        issue_id=issue_id_code,
        candidate_id=candidate.id,
        batch_id=batch_id,
        assigned_to_user_id=assigned_user_id,
        escalated_to_admin=is_admin_issue,
        issue_type=issue_type,
        subject=subject,
        description=description,
        priority=priority.upper() if priority else "MEDIUM",
        status="OPEN",
        attachment_url=attachment_url,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(issue)
    await db.commit()
    await db.refresh(issue)

    # 5. Admin Email Alert & Notification Setup
    admin_email = settings.ADMIN_EMAIL or "admin@company.com"

    # Find system Admin user IDs
    admin_stmt = select(User).where(User.role == "ADMIN")
    admin_res = await db.execute(admin_stmt)
    admin_users = admin_res.scalars().all()
    admin_user_ids = [u.id for u in admin_users] if admin_users else [1]

    raised_at_str = issue.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
    admin_view_link = f"http://localhost:5173/#admin-issues?issue_id={issue.issue_id}"

    email_body_html = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #1e3a8a;">[Hexaware LMS] Candidate Issue Raised</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%;">Issue ID</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">{issue.issue_id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Candidate Name</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{candidate.name or candidate.employee_id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Candidate Email</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{candidate.email}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Employee ID</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{candidate.employee_id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Batch</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{batch_name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Issue Type</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{issue.issue_type}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{issue.subject}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Priority</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{issue.priority}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Raised At</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{raised_at_str}</td></tr>
          </table>
          <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 24px;">
            <strong>Description:</strong><br/>
            <p style="margin: 8px 0 0 0; white-space: pre-wrap;">{issue.description}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="{admin_view_link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px;">View Issue</a>
          </div>
        </div>
      </body>
    </html>
    """

    # Dispatch Notification (Email sent once to admin_email, IN_APP for all admin users)
    for idx, a_id in enumerate(admin_user_ids):
        send_channel = "ALL" if idx == 0 else "IN_APP"
        await send_notification(
            db=db,
            user_id=a_id,
            notification_type="ISSUE_RAISED",
            title=f"New Candidate Issue: {issue.issue_id}",
            message=f"{candidate.name or candidate.employee_id} reported: '{issue.subject}' ({issue.issue_type})",
            channel=send_channel,
            priority=issue.priority,
            reference_type="ISSUE",
            reference_id=issue.id,
            email_recipient=admin_email if send_channel == "ALL" else None,
            email_subject=f"[Hexaware LMS] Candidate Issue Raised - {issue.issue_id}" if send_channel == "ALL" else None,
            email_body_html=email_body_html if send_channel == "ALL" else None,
        )


    return issue


async def get_candidate_issues(db: AsyncSession, candidate_id: int) -> list[CandidateIssue]:
    stmt = (
        select(CandidateIssue)
        .where(CandidateIssue.candidate_id == candidate_id)
        .order_by(CandidateIssue.created_at.desc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_issue_by_identifier(
    db: AsyncSession, identifier: str, candidate_id: int | None = None
) -> CandidateIssue:
    stmt = select(CandidateIssue)
    if identifier.isdigit():
        stmt = stmt.where(or_(CandidateIssue.id == int(identifier), CandidateIssue.issue_id == identifier))
    else:
        stmt = stmt.where(CandidateIssue.issue_id == identifier)

    if candidate_id is not None:
        stmt = stmt.where(CandidateIssue.candidate_id == candidate_id)

    res = await db.execute(stmt)
    issue = res.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    return issue


async def get_admin_issues(
    db: AsyncSession,
    status: str | None = None,
    issue_type: str | None = None,
    candidate_id: int | None = None,
    batch_id: int | None = None,
    search: str | None = None,
) -> list[dict]:
    stmt = (
        select(CandidateIssue, User, Batch)
        .join(User, User.id == CandidateIssue.candidate_id)
        .outerjoin(Batch, Batch.id == CandidateIssue.batch_id)
    )

    if status and status.upper() != "ALL":
        stmt = stmt.where(CandidateIssue.status == status.upper())

    if issue_type and issue_type.upper() != "ALL":
        stmt = stmt.where(CandidateIssue.issue_type == issue_type)

    if candidate_id:
        stmt = stmt.where(CandidateIssue.candidate_id == candidate_id)

    if batch_id:
        stmt = stmt.where(CandidateIssue.batch_id == batch_id)

    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                CandidateIssue.issue_id.ilike(search_pattern),
                CandidateIssue.subject.ilike(search_pattern),
                CandidateIssue.description.ilike(search_pattern),
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.employee_id.ilike(search_pattern),
            )
        )

    stmt = stmt.order_by(CandidateIssue.created_at.desc())
    res = await db.execute(stmt)
    results = res.all()

    formatted = []
    for issue, cand, batch in results:
        formatted.append({
            "id": issue.id,
            "issue_id": issue.issue_id,
            "candidate_id": issue.candidate_id,
            "candidate_name": cand.name or cand.employee_id,
            "candidate_email": cand.email,
            "employee_id": cand.employee_id,
            "batch_id": issue.batch_id,
            "batch_name": batch.name if batch else "Unassigned",
            "issue_type": issue.issue_type,
            "subject": issue.subject,
            "description": issue.description,
            "priority": issue.priority,
            "status": issue.status,
            "admin_response": issue.admin_response,
            "attachment_url": issue.attachment_url,
            "resolved_by": issue.resolved_by,
            "resolved_at": issue.resolved_at.isoformat() if issue.resolved_at else None,
            "created_at": issue.created_at.isoformat() if issue.created_at else None,
            "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
        })

    return formatted


async def update_issue_status(
    db: AsyncSession,
    identifier: str,
    admin_user: User,
    status: str,
    admin_response: str | None = None,
) -> CandidateIssue:
    issue = await get_issue_by_identifier(db, identifier)

    status_upper = status.upper()
    if status_upper not in ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    issue.status = status_upper
    issue.updated_at = datetime.utcnow()

    if admin_response:
        issue.admin_response = admin_response

    if status_upper in ["RESOLVED", "CLOSED"]:
        issue.resolved_by = admin_user.id
        issue.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(issue)

    # Candidate Email + In-App Notification
    cand_stmt = select(User).where(User.id == issue.candidate_id)
    cand_res = await db.execute(cand_stmt)
    candidate = cand_res.scalar_one_or_none()

    if candidate:
        notif_type = "ISSUE_RESOLVED" if status_upper == "RESOLVED" else "ISSUE_UPDATED"
        title_text = f"Issue {issue.issue_id} Status Updated: {status_upper}"
        msg_text = f"Your issue '{issue.subject}' has been updated to {status_upper}."
        if admin_response:
            msg_text += f"\nResponse: {admin_response}"

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e3a8a; margin-top: 0;">Update on Issue {issue.issue_id}</h3>
              <p>Hi {candidate.name or candidate.employee_id},</p>
              <p>The status of your issue <strong>'{issue.subject}'</strong> is now <span style="font-weight: bold; color: #2563eb;">{status_upper}</span>.</p>
              {f'<div style="padding: 16px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px; margin: 16px 0;"><strong>Admin Response:</strong><br/>{admin_response}</div>' if admin_response else ''}
              <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Log in to the LMS to view issue details.</p>
            </div>
          </body>
        </html>
        """

        await send_notification(
            db=db,
            user_id=candidate.id,
            notification_type=notif_type,
            title=title_text,
            message=msg_text,
            channel="ALL",
            priority="MEDIUM",
            reference_type="ISSUE",
            reference_id=issue.id,
            email_recipient=candidate.email,
            email_subject=f"[Hexaware LMS] Update on Issue - {issue.issue_id}",
            email_body_html=email_html,
        )

    return issue


async def get_coordinator_issues(
    db: AsyncSession,
    coordinator_id: int,
    status: str | None = None,
    issue_type: str | None = None,
) -> list[dict]:
    """
    Fetch issues belonging to batches assigned to the authenticated coordinator.
    Data isolation enforced.
    """
    batches_stmt = select(Batch.id).where(or_(Batch.spoc_id == coordinator_id, Batch.trainer_id == coordinator_id))
    b_res = await db.execute(batches_stmt)
    assigned_batch_ids = [b for b in b_res.scalars().all()]

    if not assigned_batch_ids:
        stmt = (
            select(CandidateIssue, User, Batch)
            .join(User, User.id == CandidateIssue.candidate_id)
            .outerjoin(Batch, Batch.id == CandidateIssue.batch_id)
            .where(CandidateIssue.assigned_to_user_id == coordinator_id)
        )
    else:
        stmt = (
            select(CandidateIssue, User, Batch)
            .join(User, User.id == CandidateIssue.candidate_id)
            .outerjoin(Batch, Batch.id == CandidateIssue.batch_id)
            .where(
                or_(
                    CandidateIssue.batch_id.in_(assigned_batch_ids),
                    CandidateIssue.assigned_to_user_id == coordinator_id
                )
            )
        )

    if status and status.upper() != "ALL":
        stmt = stmt.where(CandidateIssue.status == status.upper())

    if issue_type and issue_type.upper() != "ALL":
        stmt = stmt.where(CandidateIssue.issue_type == issue_type)

    stmt = stmt.order_by(CandidateIssue.created_at.desc())
    res = await db.execute(stmt)
    results = res.all()

    formatted = []
    for issue, cand, batch in results:
        formatted.append({
            "id": issue.id,
            "issue_id": issue.issue_id,
            "candidate_id": issue.candidate_id,
            "candidate_name": cand.name or cand.employee_id,
            "candidate_email": cand.email,
            "employee_id": cand.employee_id,
            "batch_id": issue.batch_id,
            "batch_name": batch.name if batch else "Unassigned",
            "issue_type": issue.issue_type,
            "subject": issue.subject,
            "description": issue.description,
            "priority": issue.priority,
            "status": issue.status,
            "admin_response": issue.admin_response,
            "attachment_url": issue.attachment_url,
            "assigned_to_user_id": issue.assigned_to_user_id,
            "escalated_to_admin": issue.escalated_to_admin,
            "resolved_by": issue.resolved_by,
            "resolved_at": issue.resolved_at.isoformat() if issue.resolved_at else None,
            "created_at": issue.created_at.isoformat() if issue.created_at else None,
            "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
        })

    return formatted


async def update_coordinator_issue(
    db: AsyncSession,
    identifier: str,
    coordinator_user: User,
    status: str,
    response_notes: str | None = None,
    escalate_to_admin: bool = False,
) -> CandidateIssue:
    """
    Coordinator updates issue status, response notes, or escalates issue to Admin.
    """
    issue = await get_issue_by_identifier(db, identifier)

    status_upper = status.upper()
    if status_upper not in ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    issue.status = status_upper
    issue.updated_at = datetime.utcnow()

    if response_notes:
        issue.admin_response = response_notes

    if escalate_to_admin:
        issue.escalated_to_admin = True

    if status_upper in ["RESOLVED", "CLOSED"]:
        issue.resolved_by = coordinator_user.id
        issue.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(issue)

    # Candidate Notification
    cand_stmt = select(User).where(User.id == issue.candidate_id)
    cand_res = await db.execute(cand_stmt)
    candidate = cand_res.scalar_one_or_none()

    if candidate:
        notif_type = "ISSUE_RESOLVED" if status_upper == "RESOLVED" else "ISSUE_UPDATED"
        title_text = f"Issue {issue.issue_id} Update from Batch Coordinator"
        msg_text = f"Your issue '{issue.subject}' has been updated to {status_upper} by Batch Coordinator."
        if response_notes:
            msg_text += f"\nResponse: {response_notes}"

        await send_notification(
            db=db,
            user_id=candidate.id,
            notification_type=notif_type,
            title=title_text,
            message=msg_text,
            channel="ALL",
            priority="MEDIUM",
            reference_type="ISSUE",
            reference_id=issue.id,
            email_recipient=candidate.email,
            email_subject=f"[Hexaware LMS] Batch Coordinator Update - {issue.issue_id}",
        )

    return issue

