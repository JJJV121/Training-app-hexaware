import asyncio
import httpx
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.assignment import Assignment, AssignmentType
from app.models.coding_problem import CodingProblem
from app.models.hidden_test_case import HiddenTestCase
from app.models.assessment import Assessment
from app.models.course_day import CourseDay
from app.core.security import create_access_token, hash_password

async def run_workflow_tests():
    print("==================================================")
    print("  TESTING ASSIGNMENT & ASSESSMENT WORKFLOW END-TO-END")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        trainee = await db.scalar(select(User).where(User.role == "TRAINEE"))
        if not trainee:
            trainee = User(
                employee_id="TRN_WF_1",
                name="Workflow Trainee",
                email="workflow_trainee@example.com",
                role="TRAINEE",
                is_active=True,
                password_hash=hash_password("Pass123!@#$12"),
            )
            db.add(trainee)
            await db.commit()
            await db.refresh(trainee)

        trainee_token = create_access_token({"sub": str(trainee.id)})
        headers = {"Authorization": f"Bearer {trainee_token}"}

    base_url = "http://localhost:8000"

    async with httpx.AsyncClient(base_url=base_url) as client:
        # 1. Test GET /assignments/
        print("\n--- 1. Testing Assignments Listing & Question Retrieval ---")
        res = await client.get("/assignments/", headers=headers)
        assert res.status_code == 200, f"GET /assignments/ failed: {res.status_code}"
        assignments = res.json()
        print(f" [PASS] Fetched {len(assignments)} assignments total from DB.")

        # Test GET questions for a coding assignment
        coding_assignments = [a for a in assignments if a.get("assignment_type") == "CODING"]
        if coding_assignments:
            test_assignment = coding_assignments[0]
            res_q = await client.get(f"/assignments/{test_assignment['id']}/questions", headers=headers)
            assert res_q.status_code == 200, f"GET assignment questions failed: {res_q.status_code}: {res_q.text}"
            questions = res_q.json()
            print(f" [PASS] Coding Assignment #{test_assignment['id']} loaded {len(questions)} questions.")

            # Check that starter_code does NOT contain complete solution implementation
            for q in questions:
                starter = q.get("starter_code") or ""
                assert "distance * 15.0" not in starter, f"Starter code should not contain solution answer! Got: {starter}"
                assert "return list.stream()" not in starter, f"Starter code should not contain solution answer! Got: {starter}"
            print(" [PASS] Verified starter_code contains no answer/solution pre-filling.")

        # 2. Test Assessment Listing & Duration Minutes
        print("\n--- 2. Testing Assessment Listing & Timer Enforcement ---")
        res_ass = await client.get("/assessments/by-day/1", headers=headers)
        assert res_ass.status_code == 200, f"GET assessments by day failed: {res_ass.status_code}"
        assessments_list = res_ass.json()
        assert len(assessments_list) > 0, "Should return assessments for day 1"
        ass = assessments_list[0]
        assert "duration_minutes" in ass, "Assessment summary must include duration_minutes"
        print(f" [PASS] Assessment #{ass['assessment_id']} '{ass['title']}' has duration_minutes = {ass['duration_minutes']} min.")

        # Test Start Attempt for Assessment
        res_att = await client.post(f"/assessments/{ass['assessment_id']}/attempts", headers=headers)
        assert res_att.status_code == 200, f"Start attempt failed: {res_att.status_code}"
        attempt = res_att.json()
        assert "remaining_seconds" in attempt, "Attempt must include remaining_seconds derived from duration_minutes"
        print(f" [PASS] Assessment attempt #{attempt['attempt_id']} initialized with {attempt['remaining_seconds']} remaining seconds.")

    print("\n==================================================")
    print("  ALL ASSIGNMENT & ASSESSMENT WORKFLOW TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_workflow_tests())
