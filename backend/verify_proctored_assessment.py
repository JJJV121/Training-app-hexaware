import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal
from app.services.proctored_assessment_service import (
    get_or_create_day_assessment,
    get_proctored_assessment_trainee_view,
    create_or_get_active_attempt,
    save_answer,
    record_proctoring_event,
    submit_attempt,
)
from app.models.user import User
from sqlalchemy import select


async def test_proctored_assessment_flow():
    print("=" * 70)
    print("TESTING PROCTORED ASSESSMENT BACKEND FLOW")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        # Get test user (id=1)
        user_res = await db.execute(select(User).where(User.id == 1))
        user = user_res.scalar_one_or_none()
        if not user:
            print("❌ Test user with ID 1 not found!")
            return
        user_id = user.id
        print(f"--> Authenticated User: {user.email} (ID: {user_id})")

        # 1. Initialize or fetch proctored assessment for Day 1
        course_day_id = 1
        assessment = await get_or_create_day_assessment(db, course_day_id)
        print(f"--> Initialized Assessment ID: {assessment.id}")
        print(f"--> Test Name Format: '{assessment.title}'")

        # 2. Check trainee view security (NO correct answers)
        trainee_view = await get_proctored_assessment_trainee_view(db, assessment.id, user_id)
        print(f"--> Questions Loaded: {len(trainee_view['questions'])}")
        
        # Verify no correct answer leakage
        has_leakage = False
        for q in trainee_view['questions']:
            if 'correct_answer' in q or 'is_correct' in q or 'explanation' in q:
                has_leakage = True
            for opt in q.get('options', []):
                if 'is_correct' in opt:
                    has_leakage = True
        
        if has_leakage:
            print("[X] SECURITY FAILURE: Trainee API response exposes answer keys!")
            return
        else:
            print("[OK] SECURITY PASSED: Zero answer key/correct option leakage in trainee response.")

        # 3. Create or resume test attempt
        attempt_info = await create_or_get_active_attempt(db, assessment.id, user_id)
        attempt_id = attempt_info["attempt_id"]
        print(f"--> Active Attempt ID: {attempt_id}, Status: {attempt_info['status']}")
        print(f"--> Remaining Time: {attempt_info['remaining_seconds']}s")

        # 4. Auto-save answers for first 3 questions
        q1 = trainee_view['questions'][0]
        q1_opts = q1['options']
        opt_id = q1_opts[0]['id'] if q1_opts else 1
        save_res = await save_answer(
            db, attempt_id=attempt_id, question_id=q1['question_id'],
            user_id=user_id, selected_option_ids=[opt_id], current_question_index=0
        )
        print(f"--> Auto-Save Question 1 Answer: {save_res}")

        # 5. Log Proctoring Event
        p_res = await record_proctoring_event(
            db, attempt_id=attempt_id, user_id=user_id,
            event_type="TAB_SWITCH", metadata_json={"reason": "User switched tabs"}
        )
        print(f"--> Recorded Proctoring Event: {p_res}")

        # 6. Submit Attempt & Server Evaluation
        sub_res = await submit_attempt(db, attempt_id=attempt_id, user_id=user_id)
        print("--> Submission Result:")
        print(f"    Test Name: {sub_res['test_name']}")
        print(f"    Score: {sub_res['score']} / {sub_res['total_marks']}")
        print(f"    Percentage: {sub_res['percentage']}%")
        print(f"    Answered: {sub_res['answered_count']}, Unanswered: {sub_res['unanswered_count']}")
        print(f"    Status: {sub_res['status']}, Passed: {sub_res['passed']}")

        print("\n" + "=" * 70)
        print("[OK] END-TO-END BACKEND PROCTORED ASSESSMENT VERIFICATION PASSED!")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_proctored_assessment_flow())
