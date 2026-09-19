import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.services.dashboard_service import get_dashboard
from app.services.progress_service import get_course_progress
from app.services.practice_mcq_service import get_topic_practice_mcqs

async def verify():
    async with AsyncSessionLocal() as db:
        tester = await db.scalar(select(User).where(User.email == "tester@example.com"))
        assert tester is not None, "tester user missing!"

        # 1. Verify Dashboard for tester
        dash = await get_dashboard(db, tester.id, selected_course_id=1)
        print("[VERIFIED] Dashboard for tester:", dash["course"]["name"])
        print(f"            Completion: {dash['course']['completed_percentage']}%, Current Day: {dash['course']['current_day']}/{dash['course']['total_days']}")
        assert dash["course"]["completed_percentage"] == 100.0, "Course progress percentage should be 100%"

        # 2. Verify Course Progress for Course 1
        prog = await get_course_progress(db, course_id=1, user_id=tester.id)
        print(f"[VERIFIED] Course progress: {prog['completed_units']} / {prog['total_units']} learning units completed ({prog['progress_percentage']}%)")
        assert prog["completed_units"] == prog["total_units"], "All learning units should be completed"

        # 3. Verify Practice MCQs endpoint output
        mcq_res = await get_topic_practice_mcqs(db, unit_id=1)
        print(f"[VERIFIED] Practice MCQs generated for Unit 1: {mcq_res['total_mcqs']} questions")
        assert mcq_res["total_mcqs"] > 0, "Should generate practice MCQs"

        print("\nAll verifications passed 100% cleanly!")

if __name__ == "__main__":
    asyncio.run(verify())
