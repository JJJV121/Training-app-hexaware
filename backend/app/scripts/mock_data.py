from datetime import date
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.course import Course
from app.models.user import User
from app.models.batch import Batch


async def create_mock_data():
    async with AsyncSessionLocal() as db:

        # Create mock course
        result = await db.execute(
            select(Course).where(
                Course.title == "Mock Python Course"
            )
        )

        course = result.scalar_one_or_none()

        if course is None:
            course = Course(
                title="Mock Python Course",
                description="Mock course for Trainer Live Session testing",
                duration_days=30,
                thumbnail_url="https://example.com/python.png",
                is_active=True
            )

            db.add(course)
            await db.flush()

        # Get existing trainer with ID 1
        result = await db.execute(
            select(User).where(User.id == 1)
        )

        trainer = result.scalar_one_or_none()

        if trainer is None:
            print("ERROR: User with ID 1 does not exist.")
            print("A trainer with ID 1 is required.")
            return

        # Create mock batch
        result = await db.execute(
            select(Batch).where(
                Batch.name == "Mock Python Batch"
            )
        )

        batch = result.scalar_one_or_none()

        if batch is None:
            batch = Batch(
                name="Mock Python Batch",
                course_id=course.id,
                trainer_id=trainer.id,
                start_date=date(2026, 8, 9),
                end_date=date(2026, 9, 8),
                is_active=True
            )

            db.add(batch)
            await db.flush()

        await db.commit()

        print("===================================")
        print("Mock data created successfully!")
        print("===================================")
        print("Course ID:", course.id)
        print("Trainer ID:", trainer.id)
        print("Batch ID:", batch.id)
        print("===================================")


if __name__ == "__main__":
    import asyncio

    asyncio.run(create_mock_data())