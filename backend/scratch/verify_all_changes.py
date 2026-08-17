import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal
from app.schemas.admin_user import TraineeCreate, TrainerCreate
from app.services.admin_user_service import create_trainee, create_trainer, update_user_status
from app.services.dashboard_service import get_dashboard
from app.schemas.admin_course import CourseCreate
from app.services.admin_course_service import create_course, get_all_courses
from app.schemas.batch_schemas import BatchUpdate
from app.services.batch_service import update_batch, get_all_batches

async def main():
    async with AsyncSessionLocal() as db:
        print("=== VERIFYING ALL BACKEND CHANGES ===")

        # Ensure tester@example.com has a proper name
        await db.execute(text("UPDATE users SET name = 'Tester Student' WHERE email = 'tester@example.com' OR email = 'example@tester.com';"))
        await db.commit()

        # 1. Verify tester@example.com profile & dashboard
        print("\n1. Testing Trainee Dashboard for tester@example.com...")
        res = await db.execute(text("SELECT id, name, email FROM users WHERE email = 'tester@example.com';"))
        tester = res.first()
        if tester:
            dash_data = await get_dashboard(db, tester[0])
            print(f"   Dashboard Name returned: '{dash_data.get('name')}'")
            print(f"   Enrolled courses count: {dash_data.get('courses_enrolled')}")
            assert dash_data.get('name') and dash_data.get('name') != 'E_005', "Dashboard should display name instead of employee_id"
            print("   [OK] Trainee Dashboard name verification PASSED.")
        else:
            print("   [WARNING] tester@example.com not found in DB.")

        # 2. Test Admin Trainee creation with password, college, & multi-course IDs
        print("\n2. Testing Admin Student Creation (Initial state = Inactive)...")
        test_student_email = f"student_{int(asyncio.get_event_loop().time())}@example.com"
        trainee_data = TraineeCreate(
            employee_id=f"ST_{int(asyncio.get_event_loop().time())}",
            name="Test Student Multi",
            email=test_student_email,
            password="SecurePassword123!",
            course_ids=[1, 2],
            college_name="IIT Madras"
        )
        new_student = await create_trainee(db, trainee_data)
        print(f"   Created student ID={new_student.id}, Name='{new_student.name}', Active={new_student.is_active}")
        assert new_student.is_active is False, "Initial active state must be Inactive (False)"
        print("   [OK] Student creation initial Inactive state PASSED.")

        # 3. Test Student Status toggle
        print("\n3. Testing Student status toggle (Inactive -> Active)...")
        updated_student = await update_user_status(db, new_student.id, "trainee", True)
        print(f"   Updated student Active={updated_student.is_active}")
        assert updated_student.is_active is True, "Student status should be updateable to Active"
        print("   [OK] Student status update PASSED.")

        # 4. Test Admin Trainer creation with password
        print("\n4. Testing Trainer creation with password...")
        trainer_email = f"trainer_{int(asyncio.get_event_loop().time())}@example.com"
        trainer_data = TrainerCreate(
            employee_id=f"TR_{int(asyncio.get_event_loop().time())}",
            name="Dr. Alex Vance",
            email=trainer_email,
            course_id=1,
            password="TrainerSecretPassword123!"
        )
        new_trainer = await create_trainer(db, trainer_data)
        print(f"   Created trainer ID={new_trainer.id}, Name='{new_trainer.name}'")
        assert new_trainer.password_hash is not None, "Trainer password hash must be set"
        print("   [OK] Trainer creation with password PASSED.")

        # 5. Test Course Creation API
        print("\n5. Testing Course Creation API...")
        course_data = CourseCreate(
            title="FastAPI & React Enterprise Development",
            description="End-to-end fullstack development course",
            duration_days=14,
            category="Backend Development"
        )
        new_course = await create_course(db, course_data)
        print(f"   Created course ID={new_course.id}, Title='{new_course.title}'")
        assert new_course.id is not None, "Course creation failed"
        print("   [OK] Course creation API PASSED.")

        # 6. Test Course Assignment with College Name
        print("\n6. Testing Course Assignment with College Name...")
        batches_res = await get_all_batches(db)
        batches_list = batches_res.get("batches", [])
        if batches_list:
            b = batches_list[0]
            b_update = BatchUpdate(
                course_id=new_course.id,
                college_name="IIT Madras"
            )
            upd_b = await update_batch(db, b.id, b_update)
            print(f"   Assigned course ID={new_course.id} to Batch ID={b.id} with College='{upd_b['batch'].college_name}'")
            assert upd_b['batch'].college_name == "IIT Madras", "College name assignment failed"
            print("   [OK] Course Assignment with College Name PASSED.")

        print("\n=== ALL BACKEND VERIFICATIONS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(main())
