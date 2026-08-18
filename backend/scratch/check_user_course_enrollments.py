import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment


async def check_user_enrollments():
    print("==================================================")
    print("   CHECKING USER ENROLLMENTS IN DATABASE")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        res_users = await db.execute(select(User).order_by(User.id.asc()))
        users = res_users.scalars().all()

        for u in users:
            res_e = await db.execute(select(Enrollment).where(Enrollment.user_id == u.id))
            enrollments = res_e.scalars().all()

            course_ids = [e.course_id for e in enrollments]
            print(f"User ID {u.id:<3} | Email: {u.email:<30} | Role: {u.role:<8} | Enrolled Course IDs: {course_ids}")

if __name__ == "__main__":
    asyncio.run(check_user_enrollments())
