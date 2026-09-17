import asyncio
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress
from app.models.video import Video
from app.models.video_progress import VideoProgress
from app.models.enrollment import Enrollment
from app.models.mcq_bank import MCQQuestionBank
from app.models.assignment import Assignment
from app.services.assignment_unlock_service import is_assignment_unlocked

async def setup_tester_fast():
    async with AsyncSessionLocal() as db:
        print("==================================================")
        print("   UNLOCKING ALL MODULES/DAYS FOR TESTER (FAST)")
        print("==================================================")

        res_t = await db.execute(select(User).where(User.email == "tester@example.com"))
        tester = res_t.scalars().first()
        if not tester:
            print("ERROR: tester@example.com not found!")
            return

        print(f"Found Tester: {tester.name} ({tester.email}, ID: {tester.id})")

        # 1. Enroll tester in all courses
        courses = (await db.execute(select(Course))).scalars().all()
        existing_enroll_course_ids = set(
            (await db.execute(select(Enrollment.course_id).where(Enrollment.user_id == tester.id))).scalars().all()
        )
        
        now = datetime.utcnow()
        for course in courses:
            if course.id not in existing_enroll_course_ids:
                db.add(Enrollment(user_id=tester.id, course_id=course.id, enrolled_at=now - timedelta(days=30)))
                print(f"  + Enrolled tester in Course {course.id}: '{course.title}'")

        await db.commit()

        # 2. Bulk Progress insertion for all LearningUnits
        all_unit_ids = set((await db.execute(select(LearningUnit.id))).scalars().all())
        existing_prog_unit_ids = set(
            (await db.execute(select(Progress.learning_unit_id).where(Progress.user_id == tester.id))).scalars().all()
        )

        missing_unit_ids = all_unit_ids - existing_prog_unit_ids
        print(f"Total Learning Units: {len(all_unit_ids)}. Missing progress records for tester: {len(missing_unit_ids)}")

        new_progress_objs = [
            Progress(user_id=tester.id, learning_unit_id=uid, is_completed=True, completed_at=now - timedelta(days=1))
            for uid in missing_unit_ids
        ]
        if new_progress_objs:
            db.add_all(new_progress_objs)

        existing_progs = (await db.execute(select(Progress).where(Progress.user_id == tester.id, Progress.is_completed == False))).scalars().all()
        for p in existing_progs:
            p.is_completed = True
            p.completed_at = now - timedelta(days=1)

        # 3. Bulk VideoProgress insertion for all Videos
        all_video_ids = set((await db.execute(select(Video.id))).scalars().all())
        existing_vprog_ids = set(
            (await db.execute(select(VideoProgress.video_id).where(VideoProgress.user_id == tester.id))).scalars().all()
        )
        missing_video_ids = all_video_ids - existing_vprog_ids
        print(f"Total Videos: {len(all_video_ids)}. Missing video progress for tester: {len(missing_video_ids)}")

        new_vprog_objs = [
            VideoProgress(user_id=tester.id, video_id=vid, is_completed=True, completed_at=now - timedelta(days=1))
            for vid in missing_video_ids
        ]
        if new_vprog_objs:
            db.add_all(new_vprog_objs)

        existing_vprogs = (await db.execute(select(VideoProgress).where(VideoProgress.user_id == tester.id, VideoProgress.is_completed == False))).scalars().all()
        for vp in existing_vprogs:
            vp.is_completed = True
            vp.completed_at = now - timedelta(days=1)

        await db.commit()

        # 4. Link MCQs to learning units
        mcqs_res = await db.execute(select(MCQQuestionBank))
        mcqs = mcqs_res.scalars().all()
        units_res = await db.execute(select(LearningUnit))
        units = units_res.scalars().all()

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

        # 5. Clear dashboard cache so changes reflect instantly
        from app.services.dashboard_service import _dashboard_cache
        _dashboard_cache.clear()

        # 6. Verification sample (first 10 assignments)
        assignments = (await db.execute(select(Assignment).limit(10))).scalars().all()
        unlocked_sample = 0
        for a in assignments:
            unlocked = await is_assignment_unlocked(db, a, tester.id)
            if unlocked:
                unlocked_sample += 1

        print(f"\nVerification: {unlocked_sample} / {len(assignments)} sample assignments are UNLOCKED for tester@example.com!")

        from app.services.dashboard_service import get_dashboard
        dash = await get_dashboard(db, tester.id, selected_course_id=1)
        print(f"Dashboard response for Course 1: Current Day = {dash['course']['current_day']} / Total Days = {dash['course']['total_days']}")
        print(f"Completed percentage: {dash['course']['completed_percentage']}%")

        print("\n==================================================")
        print("   SUCCESS! ALL MODULES & DAYS UNLOCKED FOR TESTER!")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(setup_tester_fast())
