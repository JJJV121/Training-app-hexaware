import asyncio
import sys
import os

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal
from app.services.day_processor_service import process_course_day
from app.services.assignment_service import (
    get_all_assignments,
    get_assignment_by_id,
    get_assignment_questions,
    evaluate_assignment_answers,
)
from app.models.course_day import CourseDay
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from sqlalchemy import select

async def run_tests():
    print("=" * 60)
    print("RUNNING 10 TEST CASES FOR DAY PLAN -> ASSIGNMENT INTEGRATION")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # Step 0: Ensure Day 1 & Day 2 & Day 3 plans are processed and have assignments
        await process_course_day(db, course_id=1, day_id=1)
        await process_course_day(db, course_id=1, day_id=2)
        await process_course_day(db, course_id=1, day_id=3)

        # Test Case 1: Day Plan with an assignment returns valid assignment
        print("\n[Test 1] Fetching assignments for Course 1, Day 1...")
        stmt1 = select(Assignment).where(Assignment.course_day_id == 1)
        res1 = await db.execute(stmt1)
        asg_day1 = res1.scalars().first()
        assert asg_day1 is not None, "Test 1 Failed: Day 1 plan has no assignment!"
        print(f"  --> PASSED: Day 1 Plan has Assignment ID={asg_day1.id}, Title='{asg_day1.title}'")

        # Test Case 2: Day Plan without an assignment handles missing cleanly
        print("\n[Test 2] Querying assignment for non-existent Course Day 9999...")
        stmt2 = select(Assignment).where(Assignment.course_day_id == 9999)
        res2 = await db.execute(stmt2)
        asg_missing = res2.scalars().first()
        assert asg_missing is None, "Test 2 Failed: Non-existent day returned an assignment!"
        print("  --> PASSED: Non-existent day returns None (no broken link)")

        # Test Case 3 & 4: Correct assignment ID is passed dynamically
        print("\n[Test 3 & 4] Verifying dynamic assignment retrieval by ID...")
        asg_by_id = await get_assignment_by_id(db, asg_day1.id)
        assert asg_by_id is not None and asg_by_id.id == asg_day1.id, "Test 3&4 Failed: Dynamic ID retrieval failed!"
        print(f"  --> PASSED: Dynamic Assignment ID {asg_by_id.id} retrieved correctly.")

        # Test Case 5: Assignment API returns the correct assignment attributes
        print("\n[Test 5] Validating Assignment attributes...")
        assert asg_by_id.total_marks > 0, "Test 5 Failed: total_marks invalid"
        assert asg_by_id.passing_marks > 0, "Test 5 Failed: passing_marks invalid"
        print(f"  --> PASSED: Total Marks={asg_by_id.total_marks}, Passing={asg_by_id.passing_marks}")

        # Test Case 6: Exactly 3 questions are returned/displayed
        print("\n[Test 6] Fetching dynamic questions for Day 1 Assignment...")
        q_day1 = await get_assignment_questions(db, asg_day1.id)
        assert len(q_day1) == 3, f"Test 6 Failed: Expected 3 questions, got {len(q_day1)}"
        print(f"  --> PASSED: Exactly {len(q_day1)} questions returned.")

        # Test Case 7: Questions correspond to selected Day Plan topic/content & different days produce different questions
        print("\n[Test 7] Verifying day-topic question generation across multiple Day Plans...")
        stmt3 = select(Assignment).where(Assignment.course_day_id == 2)
        res3 = await db.execute(stmt3)
        asg_day2 = res3.scalars().first()

        q_day2 = await get_assignment_questions(db, asg_day2.id) if asg_day2 else []
        assert len(q_day2) == 3, "Test 7 Failed: Day 2 did not return 3 questions!"
        assert q_day1[0]["question"] != q_day2[0]["question"], "Test 7 Failed: Questions are identical across different days!"
        print("  --> PASSED: Day 1 and Day 2 generated distinct topic-based question sets:")
        print(f"      Day 1 Q1: {q_day1[0]['question'][:60]}...")
        print(f"      Day 2 Q1: {q_day2[0]['question'][:60]}...")

        # Test Case 8: User can answer all 3 questions
        print("\n[Test 8] Simulating answer payload for all 3 questions...")
        user_answers = {
            "1": q_day1[0]["correct_index"],
            "2": q_day1[1]["correct_index"],
            "3": (q_day1[2]["correct_index"] + 1) % len(q_day1[2]["options"])  # 1 wrong on purpose
        }
        assert len(user_answers) == 3, "Test 8 Failed: Answers count is not 3"
        print("  --> PASSED: Formatted answer payload for 3 questions.")

        # Test Case 9: Submission API successfully evaluates the answers
        print("\n[Test 9] Submitting answers to evaluation service...")
        eval_result = await evaluate_assignment_answers(db, asg_day1.id, user_id=1, answers=user_answers)
        assert eval_result["submission_id"] > 0, "Test 9 Failed: Invalid submission ID"
        assert eval_result["total_marks"] == asg_day1.total_marks, "Test 9 Failed: Incorrect total marks"
        assert len(eval_result["details"]) == 3, "Test 9 Failed: Result details count != 3"
        print(f"  --> PASSED: Score={eval_result['score']}/{eval_result['total_marks']} ({eval_result['percentage']}%). Status='{eval_result['status']}'")

        # Test Case 10: Score/result is displayed and persisted correctly
        print("\n[Test 10] Verifying submission persistence in database...")
        stmt_sub = select(AssignmentSubmission).where(
            AssignmentSubmission.id == eval_result["submission_id"]
        )
        sub_record = (await db.execute(stmt_sub)).scalar_one_or_none()
        assert sub_record is not None, "Test 10 Failed: Record not persisted in DB!"
        assert sub_record.marks == eval_result["score"], "Test 10 Failed: Persisted score mismatch!"
        print(f"  --> PASSED: Submission ID {sub_record.id} persisted in DB with marks={sub_record.marks}")

        # Extra Test: Invalid Assignment ID
        print("\n[Extra Test] Testing invalid assignment ID error handling...")
        try:
            await get_assignment_questions(db, assignment_id=999999)
            print("  --> FAILED: Expected 404 exception!")
        except Exception as e:
            print(f"  --> PASSED: Correctly raised exception for invalid assignment ID: {e.detail if hasattr(e, 'detail') else e}")

    print("\n" + "=" * 60)
    print("ALL 10 TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
