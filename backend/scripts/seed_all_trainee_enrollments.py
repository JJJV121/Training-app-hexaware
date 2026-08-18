import asyncio
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, and_
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment


async def seed_all_trainee_enrollments():
    print("==================================================")
    print("   SEEDING ALL TRAINEE COURSE ENROLLMENTS")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # Fetch all courses
        res_c = await db.execute(select(Course))
        courses = res_c.scalars().all()
        course_ids = [c.id for c in courses if c.id in [1, 2]]
        if not course_ids:
            course_ids = [1]

        # Fetch all trainee users
        res_u = await db.execute(select(User).where(User.role.ilike("%trainee%")))
        trainees = res_u.scalars().all()

        added_count = 0
        now = datetime.utcnow()

        for tr in trainees:
            for cid in course_ids:
                res_e = await db.execute(
                    select(Enrollment).where(
                        and_(Enrollment.user_id == tr.id, Enrollment.course_id == cid)
                    )
                )
                if not res_e.scalars().first():
                    db.add(Enrollment(user_id=tr.id, course_id=cid, enrolled_at=now))
                    added_count += 1

        await db.commit()
        print(f"[OK] Successfully created {added_count} enrollment records across {len(trainees)} trainees!")

if __name__ == "__main__":
    asyncio.run(seed_all_trainee_enrollments())
