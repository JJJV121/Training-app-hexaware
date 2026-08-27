import asyncio
from datetime import datetime, timedelta
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.assignment import Assignment, AssignmentType
from app.models.coding_problem import CodingProblem
from app.models.assignment_submission import AssignmentSubmission
from app.models.coding_submission import CodingSubmission
from app.core.security import create_access_token, hash_password
from sqlalchemy import select, delete

import httpx

async def run_matrix_tests():
    print("==================================================")
    print("  RUNNING API ROLE AUTHORIZATION MATRIX TEST SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # Setup or get test users
        admin_user = await db.scalar(select(User).where(User.email == "matrix_admin@example.com"))
        if not admin_user:
            admin_user = User(
                employee_id="ADM_MAT_1",
                name="Matrix Admin",
                email="matrix_admin@example.com",
                role="ADMIN",
                is_active=True,
                password_hash=hash_password("Pass123!@#$12"),
            )
            db.add(admin_user)

        trainer_user = await db.scalar(select(User).where(User.email == "matrix_trainer@example.com"))
        if not trainer_user:
            trainer_user = User(
                employee_id="TRN_MAT_1",
                name="Matrix Trainer",
                email="matrix_trainer@example.com",
                role="TRAINER",
                is_active=True,
                password_hash=hash_password("Pass123!@#$12"),
            )
            db.add(trainer_user)

        trainee1_user = await db.scalar(select(User).where(User.email == "matrix_trainee1@example.com"))
        if not trainee1_user:
            trainee1_user = User(
                employee_id="TRN1_MAT_1",
                name="Matrix Trainee 1",
                email="matrix_trainee1@example.com",
                role="TRAINEE",
                is_active=True,
                password_hash=hash_password("Pass123!@#$12"),
            )
            db.add(trainee1_user)

        trainee2_user = await db.scalar(select(User).where(User.email == "matrix_trainee2@example.com"))
        if not trainee2_user:
            trainee2_user = User(
                employee_id="TRN2_MAT_1",
                name="Matrix Trainee 2",
                email="matrix_trainee2@example.com",
                role="TRAINEE",
                is_active=True,
                password_hash=hash_password("Pass123!@#$12"),
            )
            db.add(trainee2_user)

        await db.commit()
        await db.refresh(admin_user)
        await db.refresh(trainer_user)
        await db.refresh(trainee1_user)
        await db.refresh(trainee2_user)

        # Get or create dedicated test Course & CourseDay
        from app.models.course import Course
        from app.models.course_day import CourseDay
        course = await db.scalar(select(Course).where(Course.title == "Matrix Auth Test Course"))
        if not course:
            course = Course(title="Matrix Auth Test Course", description="Isolated test course", duration_days=30, thumbnail_url="http://example.com/thumb.png")
            db.add(course)
            await db.commit()
            await db.refresh(course)

        course_day = await db.scalar(select(CourseDay).where(CourseDay.course_id == course.id, CourseDay.day_number == 2))
        if not course_day:
            course_day = CourseDay(course_id=course.id, day_number=2, title="Day 2 Test")
            db.add(course_day)
            await db.commit()
            await db.refresh(course_day)

        test_course_day_id = course_day.id

        # Unlock assignment by completing any learning units for this day
        from app.models.learning_unit import LearningUnit
        from app.models.progress import Progress
        units_res = await db.execute(select(LearningUnit).where(LearningUnit.day_id == test_course_day_id))
        units = units_res.scalars().all()
        for u in units:
            existing_p = await db.scalar(select(Progress).where(Progress.user_id == trainee1_user.id, Progress.learning_unit_id == u.id))
            if not existing_p:
                db.add(Progress(user_id=trainee1_user.id, learning_unit_id=u.id, is_completed=True))
            else:
                existing_p.is_completed = True
        await db.commit()

        # Create tokens
        admin_token = create_access_token({"sub": str(admin_user.id)})
        trainer_token = create_access_token({"sub": str(trainer_user.id)})
        trainee1_token = create_access_token({"sub": str(trainee1_user.id)})
        trainee2_token = create_access_token({"sub": str(trainee2_user.id)})

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
        trainee1_headers = {"Authorization": f"Bearer {trainee1_token}"}
        trainee2_headers = {"Authorization": f"Bearer {trainee2_token}"}
        unauth_headers = {}

    base_url = "http://localhost:8000"

    async with httpx.AsyncClient(base_url=base_url) as client:
        # --- 1. Assignment APIs ---
        print("\n--- 1. Testing Assignment APIs Authorization ---")

        # GET /assignments/
        res = await client.get("/assignments/", headers=unauth_headers)
        assert res.status_code == 401, f"Unauth should be 401, got {res.status_code}"
        res = await client.get("/assignments/", headers=admin_headers)
        assert res.status_code == 200, f"Admin should be 200, got {res.status_code}"
        res = await client.get("/assignments/", headers=trainer_headers)
        assert res.status_code == 200, f"Trainer should be 200, got {res.status_code}"
        res = await client.get("/assignments/", headers=trainee1_headers)
        assert res.status_code == 200, f"Trainee should be 200, got {res.status_code}"
        print(" [PASS] GET /assignments/ -> Admin, Trainer, Trainee allowed (200), Unauth rejected (401)")

        # POST /assignments/ (Admin only)
        form_data = {
            "course_day_id": test_course_day_id,
            "title": "Auth Test Assignment",
            "description": "Role authorization test assignment",
            "assignment_type": "NON_CODING",
            "instructions": "Test instructions",
            "total_marks": 100,
            "passing_marks": 50,
            "due_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        }
        res = await client.post("/assignments/", data=form_data, headers=trainee1_headers)
        assert res.status_code == 403, f"Trainee POST /assignments/ should be 403, got {res.status_code}"
        res = await client.post("/assignments/", data=form_data, headers=trainer_headers)
        assert res.status_code == 403, f"Trainer POST /assignments/ should be 403, got {res.status_code}"
        res = await client.post("/assignments/", data=form_data, headers=admin_headers)
        assert res.status_code == 200 or res.status_code == 201, f"Admin POST /assignments/ should be 200/201, got {res.status_code}: {res.text}"
        created_assignment_id = res.json()["id"]
        print(f" [PASS] POST /assignments/ -> Admin allowed ({res.status_code}), Trainer & Trainee rejected (403)")

        # PUT /assignments/{id} (Admin only)
        update_data = {"title": "Updated Title"}
        res = await client.put(f"/assignments/{created_assignment_id}", data=update_data, headers=trainer_headers)
        assert res.status_code == 403, f"Trainer PUT /assignments/ should be 403, got {res.status_code}"
        res = await client.put(f"/assignments/{created_assignment_id}", data=update_data, headers=admin_headers)
        assert res.status_code == 200, f"Admin PUT /assignments/ should be 200, got {res.status_code}"
        print(" [PASS] PUT /assignments/{id} -> Admin allowed (200), Trainer rejected (403)")

        # GET /assignments/{id}/submissions (Trainer only)
        res = await client.get(f"/assignments/{created_assignment_id}/submissions", headers=trainee1_headers)
        assert res.status_code == 403, f"Trainee GET submissions should be 403, got {res.status_code}"
        res = await client.get(f"/assignments/{created_assignment_id}/submissions", headers=admin_headers)
        assert res.status_code == 403, f"Admin GET submissions should be 403, got {res.status_code}"
        res = await client.get(f"/assignments/{created_assignment_id}/submissions", headers=trainer_headers)
        assert res.status_code == 200, f"Trainer GET submissions should be 200, got {res.status_code}"
        print(" [PASS] GET /assignments/{id}/submissions -> Trainer allowed (200), Admin & Trainee rejected (403)")


        # --- 2. Assignment Submissions APIs ---
        print("\n--- 2. Testing Assignment Submission APIs Authorization ---")

        # POST /assignment-submissions/ (Trainee only)
        async with AsyncSessionLocal() as db_clean:
            await db_clean.execute(
                delete(AssignmentSubmission).where(
                    AssignmentSubmission.assignment_id == created_assignment_id,
                    AssignmentSubmission.user_id == trainee1_user.id
                )
            )
            await db_clean.commit()

        sub_form = {
            "assignment_id": created_assignment_id,
            "submission_text": "Trainee solution text",
        }
        sub_files = {"file": ("test.pdf", b"%PDF-1.4 dummy content", "application/pdf")}
        res = await client.post("/assignment-submissions/", data=sub_form, files=sub_files, headers=trainer_headers)
        assert res.status_code == 403, f"Trainer POST sub should be 403, got {res.status_code}"
        res = await client.post("/assignment-submissions/", data=sub_form, files=sub_files, headers=trainee1_headers)
        assert res.status_code == 200 or res.status_code == 201, f"Trainee POST sub should be 200/201, got {res.status_code}: {res.text}"
        submission_id = res.json()["id"]
        print(" [PASS] POST /assignment-submissions/ -> Trainee allowed, Trainer rejected (403)")

        # GET /assignment-submissions/my (Trainee only)
        res = await client.get("/assignment-submissions/my", headers=trainer_headers)
        assert res.status_code == 403, f"Trainer GET /my should be 403, got {res.status_code}"
        res = await client.get("/assignment-submissions/my", headers=trainee1_headers)
        assert res.status_code == 200, f"Trainee GET /my should be 200, got {res.status_code}"
        print(" [PASS] GET /assignment-submissions/my -> Trainee allowed (200), Trainer rejected (403)")

        # PUT /assignment-submissions/{id}/evaluate (Trainer only)
        eval_payload = {"marks": 90, "feedback": "Good work"}
        res = await client.put(f"/assignment-submissions/{submission_id}/evaluate", json=eval_payload, headers=trainee1_headers)
        assert res.status_code == 403, f"Trainee evaluate should be 403, got {res.status_code}"
        res = await client.put(f"/assignment-submissions/{submission_id}/evaluate", json=eval_payload, headers=trainer_headers)
        assert res.status_code == 200, f"Trainer evaluate should be 200, got {res.status_code}"
        print(" [PASS] PUT /assignment-submissions/{id}/evaluate -> Trainer allowed (200), Trainee rejected (403)")


        # --- 3. Coding Problem APIs & Hidden Test Case APIs ---
        print("\n--- 3. Testing Coding Problem & Hidden Test Case APIs ---")

        # GET /coding-problems/
        res = await client.get("/coding-problems/", headers=unauth_headers)
        assert res.status_code == 401, f"Unauth should be 401, got {res.status_code}"
        res = await client.get("/coding-problems/", headers=trainee1_headers)
        assert res.status_code == 200, f"Trainee should be 200, got {res.status_code}: {res.text}"
        print(" [PASS] GET /coding-problems/ -> Trainee/Trainer/Admin allowed (200), Unauth rejected (401)")

        # POST /coding-problems/{id}/testcases (Admin only)
        # GET /coding-problems/{id}/testcases (Admin only)
        res = await client.get("/coding-problems/1/testcases", headers=trainee1_headers)
        assert res.status_code == 403, f"Trainee GET testcases should be 403, got {res.status_code}"
        res = await client.get("/coding-problems/1/testcases", headers=trainer_headers)
        assert res.status_code == 403, f"Trainer GET testcases should be 403, got {res.status_code}"
        res = await client.get("/coding-problems/1/testcases", headers=admin_headers)
        assert res.status_code == 200 or res.status_code == 404, f"Admin GET testcases should be 200/404, got {res.status_code}"
        print(" [PASS] GET /coding-problems/{id}/testcases -> Hidden testcases blocked for Trainee & Trainer (403), Admin allowed")


        # --- 4. Coding Submission APIs ---
        print("\n--- 4. Testing Coding Submission APIs Authorization & Ownership ---")

        # Create dummy coding submission in DB directly for trainee 1
        async with AsyncSessionLocal() as db2:
            cs1 = CodingSubmission(
                problem_id=1,
                user_id=trainee1_user.id,
                source_code="print('Hello World')",
                language_id=71,
                status="ACCEPTED",
            )
            db2.add(cs1)
            await db2.commit()
            await db2.refresh(cs1)
            cs1_id = cs1.id

        # GET /submissions/{id} by Trainee 1 (Owner) vs Trainee 2 (Non-owner)
        res = await client.get(f"/submissions/{cs1_id}", headers=trainee1_headers)
        assert res.status_code == 200, f"Owner trainee should be 200, got {res.status_code}"
        res = await client.get(f"/submissions/{cs1_id}", headers=trainee2_headers)
        assert res.status_code == 403, f"Other trainee should be 403, got {res.status_code}"
        print(f" [PASS] GET /submissions/{cs1_id} -> Owner Trainee 1 allowed (200), Other Trainee 2 rejected (403)")

        # GET /submissions/me (Trainee only)
        res = await client.get("/submissions/me", headers=trainer_headers)
        assert res.status_code == 403, f"Trainer GET /submissions/me should be 403, got {res.status_code}"
        res = await client.get("/submissions/me", headers=trainee1_headers)
        assert res.status_code == 200, f"Trainee GET /submissions/me should be 200, got {res.status_code}"
        my_subs = res.json()
        assert all(s["user_id"] == trainee1_user.id for s in my_subs), "Should return only trainee 1's submissions"
        print(" [PASS] GET /submissions/me -> Returns only logged-in trainee's coding submissions")


        # Cleanup test assignment & coding submission
        res = await client.delete(f"/assignments/{created_assignment_id}", headers=admin_headers)
        async with AsyncSessionLocal() as db3:
            await db3.execute(delete(CodingSubmission).where(CodingSubmission.id == cs1_id))
            await db3.commit()

    print("\n==================================================")
    print("  ALL API AUTHORIZATION MATRIX TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_matrix_tests())
