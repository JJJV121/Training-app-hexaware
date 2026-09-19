import asyncio
from datetime import datetime, date
from sqlalchemy import select, text
from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course
from app.core.security import hash_password


async def seed_coordinator_and_test_data():
    print("==================================================")
    print("SEEDING BATCH COORDINATOR & TEST DATA")
    print("==================================================")

    # 1. Apply schema changes if missing
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add missing columns safely if not present
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidate_issues' AND column_name='assigned_to_user_id') THEN
                    ALTER TABLE candidate_issues ADD COLUMN assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidate_issues' AND column_name='escalated_to_admin') THEN
                    ALTER TABLE candidate_issues ADD COLUMN escalated_to_admin BOOLEAN NOT NULL DEFAULT false;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batches' AND column_name='spoc_id') THEN
                    ALTER TABLE batches ADD COLUMN spoc_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
                END IF;
            END $$;
        """))

    async with AsyncSessionLocal() as db:
        # 2. Seed / Verify Batch Coordinator user coordinator@hexaware.com
        coord_email = "coordinator@hexaware.com"
        stmt = select(User).where(User.email == coord_email)
        res = await db.execute(stmt)
        coordinator = res.scalar_one_or_none()

        if not coordinator:
            coordinator = User(
                employee_id="BC_9001",
                name="Hexaware Batch Coordinator",
                email=coord_email,
                role="BATCH_COORDINATOR",
                password_hash=hash_password("Coordinator@123"),
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(coordinator)
            await db.commit()
            await db.refresh(coordinator)
            print(f"[OK] Created Batch Coordinator: {coordinator.email} (ID: {coordinator.id})")
        else:
            coordinator.role = "BATCH_COORDINATOR"
            coordinator.is_active = True
            coordinator.password_hash = hash_password("Coordinator@123")
            await db.commit()
            await db.refresh(coordinator)
            print(f"[OK] Updated existing Batch Coordinator: {coordinator.email} (ID: {coordinator.id}, Role: {coordinator.role}, Password reset to Coordinator@123)")

        # 3. Seed / Verify Admin user
        admin_email = "admin@hexaware.com"
        admin_stmt = select(User).where(User.email == admin_email)
        admin_res = await db.execute(admin_stmt)
        admin = admin_res.scalar_one_or_none()
        if not admin:
            admin = User(
                employee_id="ADM_0001",
                name="System Admin",
                email=admin_email,
                role="ADMIN",
                password_hash=hash_password("Admin@12345678"),
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)

        # 4. Create / Verify Course
        course_stmt = select(Course).limit(1)
        c_res = await db.execute(course_stmt)
        course = c_res.scalar_one_or_none()
        if not course:
            course = Course(
                title="FullStack Java & Cloud Engineering",
                description="Comprehensive Java, Microservices & Cloud Development",
                duration_days=30,
            )
            db.add(course)
            await db.commit()
            await db.refresh(course)

        # 5. Create / Assign Batch JAVA-SEP-2026 to coordinator
        batch_stmt = select(Batch).where(Batch.name == "JAVA-SEP-2026")
        b_res = await db.execute(batch_stmt)
        batch = b_res.scalar_one_or_none()

        if not batch:
            batch = Batch(
                name="JAVA-SEP-2026",
                course_id=course.id,
                trainer_id=coordinator.id,
                spoc_id=coordinator.id,
                created_by=admin.id,
                start_date=date.today(),
                end_date=date.today(),
                status="ACTIVE",
                is_active=True,
            )
            db.add(batch)
            await db.commit()
            await db.refresh(batch)
            print(f"[OK] Created Batch 'JAVA-SEP-2026' assigned to coordinator ID {coordinator.id}")
        else:
            batch.spoc_id = coordinator.id
            batch.trainer_id = coordinator.id
            await db.commit()
            print(f"[OK] Updated Batch 'JAVA-SEP-2026' assignment to coordinator ID {coordinator.id}")

        print("==================================================")
        print("SEEDING COMPLETE SUCCESS")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(seed_coordinator_and_test_data())
