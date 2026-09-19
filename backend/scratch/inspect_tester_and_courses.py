import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress
from app.models.assignment import Assignment
from app.models.assessment import Assessment
from app.models.mcq_bank import MCQQuestionBank
from app.models.enrollment import Enrollment
from app.models.course_day_qa import CourseDayQA

async def inspect():
    async with AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.email == "tester@example.com"))
        if not user:
            print("User tester@example.com not found!")
            return

        print(f"User: id={user.id}, name={user.name}, email={user.email}, role={user.role}")

        enrollments = (await db.execute(select(Enrollment).where(Enrollment.user_id == user.id))).scalars().all()
        print("Enrollments course IDs:", [e.course_id for e in enrollments])

        courses = (await db.execute(select(Course))).scalars().all()
        for c in courses:
            days = (await db.execute(select(CourseDay).where(CourseDay.course_id == c.id).order_by(CourseDay.day_number))).scalars().all()
            print(f"\nCourse {c.id}: {c.title} -> {len(days)} days")
            for d in days:
                units = (await db.execute(select(LearningUnit).where(LearningUnit.day_id == d.id))).scalars().all()
                print(f"  Day {d.day_number} (id={d.id}, title='{d.title}'): {len(units)} units")

        user_progress = (await db.execute(select(Progress).where(Progress.user_id == user.id, Progress.is_completed == True))).scalars().all()
        print(f"\nTester completed progress count: {len(user_progress)}")

        assignments = (await db.execute(select(Assignment))).scalars().all()
        print(f"\nTotal assignments in DB: {len(assignments)}")
        for a in assignments:
            day = await db.get(CourseDay, a.course_day_id)
            print(f"  Assignment {a.id}: '{a.title}', type={a.assignment_type}, course_day_id={a.course_day_id} (Day {day.day_number if day else None})")

        assessments = (await db.execute(select(Assessment))).scalars().all()
        print(f"\nTotal assessments in DB: {len(assessments)}")
        for ass in assessments:
            print(f"  Assessment {ass.id}: '{ass.title}', type={ass.assessment_type}, course_day_id={ass.course_day_id}")

        qas = (await db.execute(select(CourseDayQA))).scalars().all()
        print(f"\nTotal CourseDayQAs in DB: {len(qas)}")

        mcqs = (await db.execute(select(MCQQuestionBank))).scalars().all()
        print(f"\nTotal MCQs in MCQ Question Bank: {len(mcqs)}")

if __name__ == "__main__":
    asyncio.run(inspect())
