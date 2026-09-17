import asyncio
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, func
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress
from app.models.video import Video
from app.models.video_progress import VideoProgress
from app.models.enrollment import Enrollment
from app.models.mcq_bank import MCQQuestionBank
from app.models.assignment import Assignment
from app.models.assessment import Assessment
from app.services.assignment_unlock_service import is_assignment_unlocked

async def setup_tester():
    async with AsyncSessionLocal() as db:
        print("==================================================")
        print("   UNLOCKING ALL MODULES/DAYS FOR TESTER")
        print("==================================================")

        # 1. Fetch tester user
        res_t = await db.execute(select(User).where(User.email == "tester@example.com"))
        tester = res_t.scalars().first()
        if not tester:
            print("ERROR: tester@example.com not found!")
            return

        print(f"Found Tester: {tester.name} ({tester.email}, ID: {tester.id})")

        # 2. Enroll tester in all courses
        courses = (await db.execute(select(Course))).scalars().all()
        for course in courses:
            existing_enroll = await db.scalar(
                select(Enrollment).where(Enrollment.user_id == tester.id, Enrollment.course_id == course.id)
            )
            if not existing_enroll:
                db.add(Enrollment(user_id=tester.id, course_id=course.id, enrolled_at=datetime.utcnow() - timedelta(days=30)))
                print(f"  + Enrolled tester in Course {course.id}: '{course.title}'")

        await db.commit()

        # 3. Mark all LearningUnits as completed in Progress for tester
        units = (await db.execute(select(LearningUnit))).scalars().all()
        print(f"Total LearningUnits in system: {len(units)}")

        progress_added = 0
        progress_updated = 0

        for unit in units:
            prog = await db.scalar(
                select(Progress).where(Progress.user_id == tester.id, Progress.learning_unit_id == unit.id)
            )
            if prog:
                if not prog.is_completed:
                    prog.is_completed = True
                    prog.completed_at = datetime.utcnow() - timedelta(days=1)
                    progress_updated += 1
            else:
                db.add(Progress(
                    user_id=tester.id,
                    learning_unit_id=unit.id,
                    is_completed=True,
                    completed_at=datetime.utcnow() - timedelta(days=1)
                ))
                progress_added += 1

        print(f"Progress entries added: {progress_added}, updated: {progress_updated}")

        # 4. Mark all Videos as completed in VideoProgress for tester
        videos = (await db.execute(select(Video))).scalars().all()
        print(f"Total Videos in system: {len(videos)}")

        v_added = 0
        v_updated = 0
        for video in videos:
            vp = await db.scalar(
                select(VideoProgress).where(VideoProgress.user_id == tester.id, VideoProgress.video_id == video.id)
            )
            if vp:
                if not vp.is_completed:
                    vp.is_completed = True
                    vp.completed_at = datetime.utcnow() - timedelta(days=1)
                    v_updated += 1
            else:
                db.add(VideoProgress(
                    user_id=tester.id,
                    video_id=video.id,
                    is_completed=True,
                    completed_at=datetime.utcnow() - timedelta(days=1)
                ))
                v_added += 1

        print(f"VideoProgress entries added: {v_added}, updated: {v_updated}")

        await db.commit()

        # 5. Link MCQs to learning units where missing
        mcqs = (await db.execute(select(MCQQuestionBank))).scalars().all()
        print(f"Total MCQs in question bank: {len(mcqs)}")

        # Distribute / map learning_unit_id for MCQs so every learning unit has MCQs available
        unlinked_mcqs = [m for m in mcqs if m.learning_unit_id is None]
        if unlinked_mcqs and units:
            print(f"Linking {len(unlinked_mcqs)} unlinked MCQs across {len(units)} learning units...")
            for idx, mcq in enumerate(unlinked_mcqs):
                assigned_unit = units[idx % len(units)]
                mcq.learning_unit_id = assigned_unit.id
                if not mcq.topic or mcq.topic == "General":
                    mcq.topic = assigned_unit.title
            await db.commit()
            print("  + MCQ linking complete!")

        # 6. Verify Unlock Status for tester
        assignments = (await db.execute(select(Assignment))).scalars().all()
        unlocked_count = 0
        for a in assignments:
            unlocked = await is_assignment_unlocked(db, a, tester.id)
            if unlocked:
                unlocked_count += 1

        print(f"\nVerification: {unlocked_count} / {len(assignments)} assignments are UNLOCKED for tester@example.com!")

        # 7. Check Dashboard Service unlocked_day calculation
        from app.services.dashboard_service import get_dashboard
        dash = await get_dashboard(db, tester.id, selected_course_id=1)
        print(f"Dashboard response for Course 1: Current Day = {dash['course']['current_day']} / Total Days = {dash['course']['total_days']}")
        print(f"Completed percentage: {dash['course']['completed_percentage']}%")

        print("\n==================================================")
        print("   TESTER UNLOCK & PRACTICE MCQ SETUP COMPLETE!")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(setup_tester())
