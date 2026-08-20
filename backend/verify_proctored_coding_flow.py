import asyncio
import sys
from app.database.session import AsyncSessionLocal
from app.services.proctored_assessment_service import (
    get_or_create_day_assessment,
    get_proctored_assessment_trainee_view,
    create_or_get_active_attempt,
    save_answer,
    submit_attempt
)
from app.services.code_execution_service import execute_code_against_testcases


async def test_proctored_coding_flow():
    print("==================================================")
    print("Testing Proctored Coding Flow Backend Logic...")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # 1. Get or Create Day Assessment for Course Day 3
        course_day_id = 3
        print(f"\n[1] Initializing assessment for CourseDay {course_day_id}...")
        assessment = await get_or_create_day_assessment(db, course_day_id)
        print(f"-> Assessment Created/Retrieved: ID={assessment.id}, Title='{assessment.title}'")

        # 2. Fetch Trainee View (Zero solution leakage check)
        print(f"\n[2] Fetching Trainee View for Assessment {assessment.id}...")
        trainee_view = await get_proctored_assessment_trainee_view(db, assessment.id, user_id=1)
        print(f"-> Test Name: '{trainee_view['test_name']}'")
        print(f"-> Question Count: {len(trainee_view['questions'])}")
        first_q = trainee_view['questions'][0]
        print(f"-> First Question: Title='{first_q['title']}', Type='{first_q['question_type']}'")
        print(f"-> Sample Input: '{first_q['sample_input']}'")
        print(f"-> Test cases count in trainee view: {len(first_q['test_cases'])}")
        for tc in first_q['test_cases']:
            if tc.get('is_hidden'):
                assert tc.get('expected_output') is None, "HIDDEN TEST CASE EXPECTED OUTPUT LEAKED!"
        print("-> Verification Passed: Zero hidden test case expected output leakage!")

        # 3. Create or Get Active Attempt
        print(f"\n[3] Starting Attempt for User ID 3...")
        attempt_data = await create_or_get_active_attempt(db, assessment.id, user_id=3)
        attempt_id = attempt_data["attempt_id"]
        print(f"-> Active Attempt ID: {attempt_id}, Remaining Sec: {attempt_data.get('remaining_seconds', 0)}")

        # 4. Save Candidate Code Answer
        print(f"\n[4] Saving Candidate Code for Question ID {first_q['question_id']}...")
        test_code = (
            "def solution(n):\n"
            "    res = []\n"
            "    for i in range(1, n + 1):\n"
            "        if i in [2, 3, 5, 7, 11, 13, 17, 19]:\n"
            "            res.append(str(i))\n"
            "        elif i % 15 == 0:\n"
            "            res.append('FizzBuzz')\n"
            "        elif i % 3 == 0:\n"
            "            res.append('Fizz')\n"
            "        elif i % 5 == 0:\n"
            "            res.append('Buzz')\n"
            "        else:\n"
            "            res.append(str(i))\n"
            "    return ', '.join(res)\n\n"
            "if __name__ == '__main__':\n"
            "    n = int(input().strip())\n"
            "    print(solution(n))\n"
        )
        save_res = await save_answer(
            db=db,
            attempt_id=attempt_id,
            question_id=first_q['question_id'],
            user_id=3,
            code=test_code,
            language="python"
        )
        print(f"-> Save Result: {save_res}")

        # 5. Run Code Execution Service
        print(f"\n[5] Executing Code via Safe Execution Sandbox...")
        eval_res = await execute_code_against_testcases(
            code=test_code,
            language="python",
            test_cases=[
                {"input": "10", "expected_output": "1, 2, 3, 4, 5, Fizz, 7, 8, Fizz, Buzz", "is_hidden": False},
                {"input": "5", "expected_output": "1, 2, 3, 4, 5", "is_hidden": False}
            ]
        )
        print(f"-> Execution Status: {eval_res['status']}, Passed: {eval_res['passed_tests']}/{eval_res['total_tests']}")

        # 6. Submit Attempt & Calculate Marks
        print(f"\n[6] Submitting Assessment Attempt {attempt_id}...")
        sub_res = await submit_attempt(db, attempt_id, user_id=3)
        print(f"-> Submission Result: Test='{sub_res['test_name']}', Score={sub_res['score']}/{sub_res['total_marks']}, Percentage={sub_res['percentage']}%, Passed={sub_res['passed']}")

    print("\n==================================================")
    print("SUCCESS: Proctored Coding Flow Verification Complete!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_proctored_coding_flow())
