import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import select, or_

from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course
from app.models.candidate_issue import CandidateIssue
from app.core.security import hash_password, verify_password, create_access_token

from app.services.auth_service import login_user
from app.services.candidate_issue_service import (
    create_candidate_issue,
    get_coordinator_issues,
    update_coordinator_issue,
    get_candidate_issues,
    get_admin_issues,
)
from app.services.coordinator_service import (
    get_coordinator_dashboard_metrics,
    get_coordinator_batch_detail,
)

class MockClient:
    host = "127.0.0.1"

class MockRequest:
    def __init__(self):
        self.client = MockClient()
        self.headers = {"user-agent": "E2EIntegrationTest/1.0"}

async def run_e2e_verification():
    print("==================================================")
    print("STARTING END-TO-END ADMIN -> BATCH COORDINATOR -> TRAINEE INTEGRATION TEST")
    print("==================================================")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        timestamp = int(datetime.utcnow().timestamp())

        # --------------------------------------------------
        # STEP 1: ADMIN CREATION / VERIFICATION
        # --------------------------------------------------
        print("\n--- STEP 1: Admin Login & Verification ---")
        admin_email = f"admin_e2e_{timestamp}@hexaware.com"
        admin = User(
            employee_id=f"ADM_E2E_{timestamp}",
            name="E2E System Admin",
            email=admin_email,
            role="ADMIN",
            password_hash=hash_password("Admin@12345"),
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        # Login as Admin
        admin_login_res = await login_user(db, admin_email, "Admin@12345", MockRequest())
        assert admin_login_res["user"]["role"] == "ADMIN", "Admin role must be ADMIN"
        print(f"[OK] Admin logged in successfully. Role: {admin_login_res['user']['role']}")

        # --------------------------------------------------
        # STEP 2: CREATE BATCH & ASSIGN BATCH COORDINATOR
        # --------------------------------------------------
        print("\n--- STEP 2: Create Batch & Assign Coordinator ---")
        coord_email = "coordinator@hexaware.com"
        coord_stmt = select(User).where(User.email == coord_email)
        c_res = await db.execute(coord_stmt)
        coordinator = c_res.scalar_one_or_none()

        if not coordinator:
            coordinator = User(
                employee_id="BC_TEST_01",
                name="Hexaware Coordinator Test",
                email=coord_email,
                role="BATCH_COORDINATOR",
                password_hash=hash_password("Coordinator@123"),
                is_active=True,
            )
            db.add(coordinator)
            await db.commit()
            await db.refresh(coordinator)
        else:
            coordinator.role = "BATCH_COORDINATOR"
            coordinator.is_active = True
            coordinator.password_hash = hash_password("Coordinator@123")
            await db.commit()

        # Create Course
        course = Course(
            title="FullStack Software Engineering",
            description="Java & Cloud Architecture",
            duration_days=30,
            thumbnail_url="http://example.com/course.png"
        )
        db.add(course)
        await db.commit()
        await db.refresh(course)

        # Admin assigns JAVA-SEP-2026 to coordinator
        batch_name = f"JAVA-SEP-2026_{timestamp}"
        batch = Batch(
            name=batch_name,
            course_id=course.id,
            trainer_id=coordinator.id,
            spoc_id=coordinator.id,
            created_by=admin.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status="ACTIVE",
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        # Create Trainees T001 & T002 in this batch
        trainee = User(
            employee_id=f"T001_{timestamp}",
            name="John Doe Trainee",
            email=f"trainee_{timestamp}@hexaware.com",
            role="TRAINEE",
            password_hash=hash_password("Trainee@12345"),
            is_active=True,
        )
        db.add(trainee)
        await db.commit()
        await db.refresh(trainee)

        bt = BatchTrainee(batch_id=batch.id, trainee_id=trainee.id, status="ACTIVE")
        db.add(bt)
        await db.commit()

        print(f"[OK] Admin created Batch '{batch.name}' assigned to '{coord_email}' with trainee '{trainee.email}'.")

        # --------------------------------------------------
        # STEP 3 & 4: COORDINATOR LOGIN & BATCH VERIFICATION
        # --------------------------------------------------
        print("\n--- STEP 3 & 4: Coordinator Login & Batch Verification ---")
        coord_login_res = await login_user(db, coord_email, "Coordinator@123", MockRequest())
        assert coord_login_res["user"]["role"] == "BATCH_COORDINATOR", f"Expected BATCH_COORDINATOR, got {coord_login_res['user']['role']}"
        print(f"[OK] Coordinator '{coord_email}' logged in. Verified Role: {coord_login_res['user']['role']} (NOT redirected to Trainee)")

        metrics = await get_coordinator_dashboard_metrics(db, coordinator.id)
        assert metrics["assigned_batches_count"] >= 1, "Coordinator must see assigned batches"
        assert any(b["id"] == batch.id for b in metrics["batches"]), "Coordinator must see JAVA-SEP-2026 batch"
        print(f"[OK] Coordinator Dashboard telemetry verified: {metrics['assigned_batches_count']} assigned batch(es).")

        batch_detail = await get_coordinator_batch_detail(db, coordinator.id, batch.id)
        assert len(batch_detail["trainees"]) >= 1
        assert any(t["id"] == trainee.id for t in batch_detail["trainees"])
        print(f"[OK] Verified Coordinator Batch Detail: Trainee '{trainee.name}' visible in batch '{batch.name}'.")

        # --------------------------------------------------
        # STEP 5: TRAINEE RAISES ASSIGNMENT ISSUE
        # --------------------------------------------------
        print("\n--- STEP 5: Trainee Raises Assignment Issue ---")
        issue = await create_candidate_issue(
            db=db,
            candidate=trainee,
            issue_type="Assignment Issue",
            subject="Unable to submit Java assignment",
            description="Getting submission error on Day 4 Java assignment module.",
            priority="HIGH",
        )
        assert issue.status == "OPEN"
        assert issue.assigned_to_user_id == coordinator.id, f"Issue should be routed to Coordinator ID {coordinator.id}, got {issue.assigned_to_user_id}"
        print(f"[OK] Trainee raised issue '{issue.issue_id}'. Automatically routed to Batch Coordinator (ID: {issue.assigned_to_user_id}).")

        # --------------------------------------------------
        # STEP 6 & 7: COORDINATOR VERIFIES ISSUE & RESPONDS
        # --------------------------------------------------
        print("\n--- STEP 6 & 7: Coordinator Responds to Issue ---")
        coord_issues = await get_coordinator_issues(db, coordinator.id)
        target_issue = next((i for i in coord_issues if i["issue_id"] == issue.issue_id), None)
        assert target_issue is not None, "Issue must be visible in Coordinator Dashboard"
        assert target_issue["status"] == "OPEN"
        print(f"[OK] Coordinator found issue {issue.issue_id} in dashboard. Status: OPEN.")

        updated_issue_coord = await update_coordinator_issue(
            db=db,
            identifier=issue.issue_id,
            coordinator_user=coordinator,
            status="IN_PROGRESS",
            response_notes="Investigating the submission error with LMS technical team.",
        )
        assert updated_issue_coord.status == "IN_PROGRESS"
        print(f"[OK] Coordinator updated issue status to IN_PROGRESS with response notes.")

        # --------------------------------------------------
        # STEP 8: TRAINEE VERIFIES STATUS & RESPONSE
        # --------------------------------------------------
        print("\n--- STEP 8: Trainee Verifies Issue Status ---")
        trainee_issues = await get_candidate_issues(db, trainee.id)
        trainee_view_issue = next((i for i in trainee_issues if i.issue_id == issue.issue_id), None)
        assert trainee_view_issue is not None
        assert trainee_view_issue.status == "IN_PROGRESS"
        assert "Investigating" in trainee_view_issue.admin_response
        print(f"[OK] Trainee verified status is IN_PROGRESS with Coordinator response: '{trainee_view_issue.admin_response}'")

        # --------------------------------------------------
        # STEP 9: COORDINATOR RESOLVES ISSUE
        # --------------------------------------------------
        print("\n--- STEP 9: Coordinator Resolves Issue ---")
        resolved_issue = await update_coordinator_issue(
            db=db,
            identifier=issue.issue_id,
            coordinator_user=coordinator,
            status="RESOLVED",
            response_notes="Submission link refreshed. Trainee can now resubmit assignment.",
        )
        assert resolved_issue.status == "RESOLVED"
        assert resolved_issue.resolved_by == coordinator.id
        print(f"[OK] Coordinator marked issue RESOLVED. Resolved By User ID: {resolved_issue.resolved_by}")

        # --------------------------------------------------
        # STEP 10: ADMIN AUDIT VERIFICATION
        # --------------------------------------------------
        print("\n--- STEP 10: Admin Audit Verification ---")
        admin_all_issues = await get_admin_issues(db)
        admin_issue_audit = next((i for i in admin_all_issues if i["issue_id"] == issue.issue_id), None)
        assert admin_issue_audit is not None, "Admin must see complete issue"
        assert admin_issue_audit["status"] == "RESOLVED"
        assert admin_issue_audit["resolved_by"] == coordinator.id
        print(f"[OK] Admin audit verified: Issue {issue.issue_id} in batch '{admin_issue_audit['batch_name']}' resolved by Coordinator '{coordinator.name}'.")

        print("\n==================================================")
        print("END-TO-END E2E INTEGRATION TEST PASSED 100% SUCCESSFULLY!")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
