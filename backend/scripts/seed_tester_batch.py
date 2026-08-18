import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import date, datetime
from sqlalchemy import select, and_
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course


async def seed_tester_batch():
    print("==========================================")
    print("   SEEDING BATCH FOR TRAINER 3 & TESTERS")
    print("==========================================")

    async with AsyncSessionLocal() as db:
        # 1. Get or verify Trainer 3 (User ID 30 or email trainer3@example.com)
        stmt = select(User).where(
            (User.id == 30) | (User.email == "trainer3@example.com") | (User.name.ilike("%trainer 3%"))
        )
        res = await db.execute(stmt)
        trainer3 = res.scalars().first()

        if not trainer3:
            # Create trainer 3 if not present
            trainer3 = User(
                name="trainer 3",
                email="trainer3@example.com",
                employee_id="EMP_TR3",
                role="TRAINER",
                is_active=True
            )
            db.add(trainer3)
            await db.flush()
            print(f"[OK] Created Trainer 3 (ID: {trainer3.id})")
        else:
            trainer3.role = "TRAINER"
            trainer3.is_active = True
            await db.flush()
            print(f"[OK] Found Trainer 3: {trainer3.name} (ID: {trainer3.id}, Email: {trainer3.email})")

        # 2. Get first available Course
        c_stmt = select(Course).limit(1)
        c_res = await db.execute(c_stmt)
        course = c_res.scalars().first()
        course_id = course.id if course else 1

        # 3. Create or update batch assigned to Trainer 3
        batch_name = "Hexaware Mentor Connect Batch (Trainer 3)"
        b_stmt = select(Batch).where(
            and_(Batch.name == batch_name, Batch.trainer_id == trainer3.id)
        )
        b_res = await db.execute(b_stmt)
        batch = b_res.scalars().first()

        if not batch:
            batch = Batch(
                name=batch_name,
                course_id=course_id,
                trainer_id=trainer3.id,
                created_by=trainer3.id,
                start_date=date(2026, 1, 1),
                end_date=date(2026, 12, 31),
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            db.add(batch)
            await db.flush()
            print(f"[OK] Created new Batch ID: {batch.id} '{batch.name}' with Trainer 3 (ID: {trainer3.id})")
        else:
            print(f"[OK] Batch already exists (ID: {batch.id})")

        # 4. Find key tester trainees (ID 1, 2, 3, 4, etc.)
        t_stmt = select(User).where(
            (User.role.ilike("%trainee%")) | (User.id.in_([1, 2, 3, 4]))
        )
        t_res = await db.execute(t_stmt)
        trainees = t_res.scalars().all()

        added_count = 0
        for t in trainees:
            # Check if mapping exists
            bt_stmt = select(BatchTrainee).where(
                and_(
                    BatchTrainee.batch_id == batch.id,
                    BatchTrainee.trainee_id == t.id
                )
            )
            bt_res = await db.execute(bt_stmt)
            bt_existing = bt_res.scalars().first()

            if not bt_existing:
                bt = BatchTrainee(
                    batch_id=batch.id,
                    trainee_id=t.id,
                    joined_at=datetime.utcnow()
                )
                db.add(bt)
                added_count += 1

        await db.commit()
        print(f"[OK] Assigned {added_count} trainees to Batch ID {batch.id} with Mentor/Trainer 3 ({trainer3.name})!")

        print("\n==========================================")
        print("   SEEDING COMPLETE - TRAINER 3 IS ASSIGNED!")
        print("==========================================")


if __name__ == "__main__":
    asyncio.run(seed_tester_batch())
