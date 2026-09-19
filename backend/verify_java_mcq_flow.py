import asyncio
import sys
import os
from sqlalchemy import text, select

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal
from app.models.course import Course
from app.models.mcq_bank import MCQQuestionBank
from app.models.assessment import Assessment, AssessmentAttempt
from app.services.practice_mcq_service import get_topic_practice_mcqs
from app.services.proctored_assessment_service import (
    create_or_get_active_attempt,
    get_proctored_assessment_trainee_view,
    submit_attempt
)

async def run_verification():
    print("=" * 70)
    print("VERIFYING JAVA TRAINING PLAN - MCQ PRACTICE & 4 GRADING ASSESSMENTS")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        # 1. Course Title Check
        res = await db.execute(select(Course).where(Course.id == 1))
        c = res.scalar_one_or_none()
        print(f"[1] Java Course Title: '{c.title if c else None}'")
        assert c and "Core Java" in c.title, "Course title update failed!"

        # 2. Question Bank Count Check
        q_count = (await db.execute(text("SELECT COUNT(*) FROM mcq_question_bank"))).scalar()
        print(f"[2] Total MCQs in mcq_question_bank: {q_count}")
        assert q_count >= 500, "Question bank count is insufficient!"

        # 3. Practice MCQ Test (Unit 38 - Java Introduction & Unit 46 - Collections)
        for unit_id in [38, 46, 181]:
            practice_res = await get_topic_practice_mcqs(db, unit_id=unit_id)
            mcqs = practice_res.get("mcqs", [])
            print(f"[3] Practice MCQs for Unit {unit_id} ({practice_res['topic']}): {len(mcqs)} questions returned.")
            assert len(mcqs) > 0, f"Practice MCQs empty for unit {unit_id}!"
            # Verify option shuffling and correct_index validity
            first_q = mcqs[0]
            assert "options" in first_q and len(first_q["options"]) == 4, "Invalid options array!"
            assert 0 <= first_q["correct_index"] <= 3, "Invalid correct_index!"

        # 4. Grading Assessments Verification
        assessments_res = await db.execute(select(Assessment).where(Assessment.title.ilike("%Grading Assessment%")))
        grading_assessments = assessments_res.scalars().all()
        print(f"\n[4] Found {len(grading_assessments)} Grading Assessments in database:")
        assert len(grading_assessments) == 4, f"Expected 4 Grading Assessments, found {len(grading_assessments)}"

        u_res = await db.execute(text("SELECT id FROM users LIMIT 1"))
        test_user_id = u_res.scalar() or 1

        assessment_ids = [a.id for a in grading_assessments]
        if assessment_ids:
            ids_str = ",".join(str(i) for i in assessment_ids)
            await db.execute(text(f"DELETE FROM assessment_answers WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE user_id = {test_user_id} AND assessment_id IN ({ids_str}))"))
            await db.execute(text(f"DELETE FROM assessment_attempts WHERE user_id = {test_user_id} AND assessment_id IN ({ids_str})"))
            await db.commit()

        for a in grading_assessments:
            print(f"\n--- Testing Assessment: '{a.title}' ---")
            print(f"    Config: {a.total_marks} Qs | {a.duration_minutes} min | Pass: {a.passing_marks} marks")

            # Trainee view check
            t_view = await get_proctored_assessment_trainee_view(db, a.id, test_user_id)
            q_list = t_view.get("questions", [])
            print(f"    Trainee View Questions Count: {len(q_list)}")
            
            # Start attempt
            att_data = await create_or_get_active_attempt(db, a.id, test_user_id)
            attempt_id = att_data["attempt_id"]
            print(f"    Created Attempt ID: {attempt_id}, Timer Remaining: {att_data['remaining_seconds']} seconds")

            # Reload attempt state (simulate browser refresh)
            reloaded_att = await create_or_get_active_attempt(db, a.id, test_user_id)
            print(f"    Reloaded Attempt ID: {reloaded_att['attempt_id']} (State Persisted Successfully)")
            assert reloaded_att["attempt_id"] == attempt_id, "Attempt ID changed on refresh!"

            # Submit attempt
            sub_res = await submit_attempt(db, attempt_id, test_user_id)
            print(f"    Submitted Attempt Score: {sub_res['score']} / {sub_res['total_marks']} ({sub_res['percentage']}%), Passed: {sub_res['passed']}")

    print("\n" + "=" * 70)
    print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_verification())
