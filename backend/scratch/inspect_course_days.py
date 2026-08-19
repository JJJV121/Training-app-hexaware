import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import AsyncSessionLocal
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.assignment import Assignment
from app.models.course import Course
from sqlalchemy import select

async def inspect():
    async with AsyncSessionLocal() as db:
        courses = (await db.execute(select(Course))).scalars().all()
        print(f"=== COURSES ({len(courses)}) ===")
        for c in courses:
            print(f"Course ID={c.id}, Title='{c.title}'")

        days = (await db.execute(select(CourseDay).order_by(CourseDay.day_number))).scalars().all()
        print(f"\n=== COURSE DAYS ({len(days)}) ===")
        for d in days:
            units = (await db.execute(select(LearningUnit).where(LearningUnit.day_id == d.id))).scalars().all()
            assignments = (await db.execute(select(Assignment).where(Assignment.course_day_id == d.id))).scalars().all()
            unit_titles = [u.title for u in units]
            asg_titles = [f"{a.id}:{a.title} ({a.assignment_type.value if hasattr(a.assignment_type, 'value') else a.assignment_type})" for a in assignments]
            print(f"Day {d.day_number} (ID={d.id}): {d.title}")
            print(f"  Units ({len(units)}): {unit_titles}")
            print(f"  Assignments ({len(assignments)}): {asg_titles}")

if __name__ == "__main__":
    asyncio.run(inspect())
