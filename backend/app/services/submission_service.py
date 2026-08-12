from datetime import datetime
import asyncio
import json
import traceback
import httpx

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.assignment import Assignment
from app.models.coding_problem import CodingProblem
from app.models.hidden_test_case import HiddenTestCase
from app.models.coding_submission import CodingSubmission
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress


JUDGE0_URL = settings.JUDGE0_URL

# added 2 line
SUBMIT_URL = f"{JUDGE0_URL}/submissions?base64_encoded=false&wait=false"
RESULT_URL = f"{JUDGE0_URL}/submissions"

HEADERS = {
    "Content-Type": "application/json"
}


async def submit_to_judge0(
    source_code: str,
    language_id: int,
    stdin: str = None
):
    payload = {
        "source_code": source_code,
        "language_id": language_id,
    }

    if stdin is not None:
        payload["stdin"] = stdin

    async with httpx.AsyncClient(timeout=30) as client:
        print("Submitting to:", SUBMIT_URL)
        print("Payload:", payload)
        response = await client.post(
            SUBMIT_URL,  # changed from JUDGE0_URL to SUBMIT_URL
            json=payload,
            headers=HEADERS,
        )

        print("Status Code:", response.status_code)
        print("Response:", response.text)

    if response.status_code != 201:
        raise Exception(
            f"Judge0 submission failed: {response.text}"
        )

    return response.json()["token"]



async def get_judge0_result(token: str):
    url = f"{RESULT_URL}/{token}?base64_encoded=false" # JUDGE0_URL changed to RESULT_URL

    async with httpx.AsyncClient(timeout=30) as client:
        for _ in range(15):
            print("Fetching:", url)
            response = await client.get(
                url,
                headers=HEADERS,
            )

            print("GET Status:", response.status_code)
            print("GET Response:", response.text)

            if response.status_code != 200:
                await asyncio.sleep(1)
                continue

            result = response.json()

            status_id = result["status"]["id"]

            if status_id in [1, 2]:
                await asyncio.sleep(1)
                continue

            return result

    return None



async def is_learning_day_completed(
    db: AsyncSession,
    user_id: int,
    course_day_id: int
):
    total_units = await db.scalar(
        select(func.count(LearningUnit.id))
        .where(LearningUnit.day_id == course_day_id)
    )

    if total_units == 0:
        return False

    completed_units = await db.scalar(
        select(func.count(func.distinct(Progress.learning_unit_id)))
            .join(
                LearningUnit,
                LearningUnit.id == Progress.learning_unit_id
            )
            .where(
                LearningUnit.day_id == course_day_id,
                Progress.user_id == user_id,
                Progress.is_completed.is_(True)
            )
    )

    return total_units == completed_units



async def calculate_assignment_result(
    db: AsyncSession,
    assignment_id: int,
    passing_marks: int,
    user_id: int
):
    best_scores = (
        select(
            CodingSubmission.problem_id,
            func.max(CodingSubmission.score).label("best_score")
        )
        .join(
            CodingProblem,
            CodingSubmission.coding_problem_id == CodingProblem.id
        )
        .where(
            CodingProblem.assignment_id == assignment_id,
            CodingSubmission.user_id == user_id
        )
        .group_by(CodingSubmission.coding_problem_id)
    ).subquery()

    total_score = await db.scalar(
        select(func.sum(best_scores.c.best_score))
    )

    total_score = total_score or 0

    return {
        "total_score": total_score,
        "passing_marks": passing_marks,
        "status": (
            "PASS"
            if total_score >= passing_marks
            else "FAIL"
        )
    }



async def run_submission(
    db: AsyncSession,
    problem_id: int,
    user_id: int,
    source_code: str,
    language_id: int
):
    result = await db.execute(
        select(CodingProblem, Assignment)
        .join(
            Assignment,
            CodingProblem.assignment_id == Assignment.id
        )
        .where(CodingProblem.id == problem_id)
    )

    row = result.first()

    if row is None:
        raise Exception("Problem not found")

    problem, assignment = row

    if assignment is None:
        raise Exception("Assignment not found")
    

    # --------------------------------------------------
    # Completed check
    # --------------------------------------------------
    completed = await is_learning_day_completed(
        db,
        user_id,
        assignment.course_day_id
    )

    if not completed:
        raise Exception(
            "Complete all learning units before attempting this assignment."
        )

    # --------------------------------------------------
    # Deadline check
    # --------------------------------------------------

    current_time = datetime.utcnow()

    deadline = problem.deadline

    if deadline:
        if deadline.tzinfo is not None:
            deadline = deadline.replace(tzinfo=None)

        if deadline and current_time > deadline:
            raise Exception("Submission deadline has passed.")
    
    
    # --------------------------------------------------
    # Test cases
    # --------------------------------------------------
    result = await db.execute(
        select(HiddenTestCase).where(
            HiddenTestCase.coding_problem_id == problem_id,
            HiddenTestCase.is_hidden.is_(True)
        )
    )

    testcases = result.scalars().all()

    total_testcases = len(testcases)

    # --------------------------------------------------
    # Create submission
    # --------------------------------------------------
    submission = CodingSubmission(
        coding_problem_id=problem_id,
        user_id=user_id,
        source_code=source_code,
        language_id=language_id,
        status="RUNNING",
        score=0,
        passed_testcases=0,
        total_testcases=total_testcases,
        is_passed=False
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    # --------------------------------------------------
    # No test cases
    # --------------------------------------------------
    if total_testcases == 0:
        submission.status = "NO_TESTCASES"

        await db.commit()
        await db.refresh(submission)

        return submission

    passed = 0
    final_status = "ACCEPTED"
    last_token = None
    error_message = None

    # --------------------------------------------------
    # Execute each testcase
    # --------------------------------------------------
    for testcase in testcases:
        try:
            if language_id == 82:  # MySQL
                
                full_source = (
                    testcase.input_data
                    + "\n\n"
                    + source_code
                )

                token = await submit_to_judge0(
                    source_code=full_source,
                    language_id=language_id
                )

            else:  # Java, Python, C++, etc.

                token = await submit_to_judge0(
                    source_code=source_code,
                    language_id=language_id,
                    stdin=testcase.input_data
                )

            last_token = token

            result = await get_judge0_result(token)

            print(json.dumps(result, indent=4))

            if not result:
                final_status = "TIMEOUT"
                continue

            status = result["status"]["description"]

            if status != "Accepted":
                if final_status == "ACCEPTED":
                    final_status = status
                    error_message = (
                        result.get("stderr")
                        or result.get("compile_output")
                )

                continue

            output = (
                result.get("stdout") or ""
            ).strip()

            expected = (
                testcase.expected_output or ""
            ).strip()

            if output == expected:
                print("EXPECTED:")
                print(repr(expected))

                print("ACTUAL:")
                print(repr(output))

                passed += 1
                
            else:
                final_status = "WRONG_ANSWER"

        except Exception as e:
            traceback.print_exc()
            print(f"Judge0 Error: {e}")
            final_status = "ERROR"
            error_message = str(e)

    # --------------------------------------------------
    # Score
    # --------------------------------------------------
    score = (
        round(
            (passed / total_testcases) * problem.marks
        )
    if total_testcases > 0
    else 0
)

    submission.judge0_token = last_token
    submission.passed_testcases = passed
    submission.total_testcases = total_testcases
    submission.score = score
    submission.is_passed = (
        passed == total_testcases
    )
    submission.status = final_status
    submission.error_message = error_message

    await db.commit()
    await db.refresh(submission)

    assignment_result = await calculate_assignment_result(
        db=db,
        assignment_id=assignment.id,
        passing_marks=assignment.passing_marks,
        user_id=user_id
    )

    return {
        "submission": submission,
        "assignment_result": assignment_result
    }