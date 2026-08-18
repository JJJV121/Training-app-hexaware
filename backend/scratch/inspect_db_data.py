import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course


async def inspect_db():
    async with AsyncSessionLocal() as db:
        # 1. Fetch Users
        u_res = await db.execute(select(User).order_by(User.id.asc()))
        users = u_res.scalars().all()
        print("=== USERS IN DATABASE ===")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Name: {u.name} | Role: {u.role}")

        # 2. Fetch Batches
        b_res = await db.execute(select(Batch).order_by(Batch.id.asc()))
        batches = b_res.scalars().all()
        print("\n=== BATCHES IN DATABASE ===")
        for b in batches:
            print(f"Batch ID: {b.id} | Name: {b.name} | Trainer ID: {b.trainer_id} | Course ID: {b.course_id}")

        # 3. Fetch BatchTrainees
        bt_res = await db.execute(select(BatchTrainee))
        bts = bt_res.scalars().all()
        print("\n=== BATCH TRAINEES IN DATABASE ===")
        for bt in bts:
            print(f"Batch ID: {bt.batch_id} | Trainee ID: {bt.trainee_id}")

        # 4. Fetch Courses
        c_res = await db.execute(select(Course))
        courses = c_res.scalars().all()
        print("\n=== COURSES IN DATABASE ===")
        for c in courses:
            print(f"Course ID: {c.id} | Name: {c.title if hasattr(c, 'title') else getattr(c, 'name', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(inspect_db())
