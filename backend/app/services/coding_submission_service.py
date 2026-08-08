from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coding_submission import CodingSubmission
from app.models.coding_test_case import CodingTestCase

from app.services.code_runner.runner import execute


async def evaluate_submission(
    source_code: str,
    language: str,
    testcases
):
    passed = 0
    total = len(testcases)

    execution_time = 0
    memory_used = 0

    error_message = ""
    verdict = "Accepted"

    for testcase in testcases:

        result = execute(
            language,
            source_code,
            testcase.input_data
        )

        # --------------------------------
        # EXECUTION SERVICE FAILURE
        # --------------------------------

        if result.get("service_error"):

            return {
                "passed_testcases": 0,
                "total_testcases": total,
                "score": 0,
                "verdict": "Execution Service Error",
                "execution_time_ms": 0,
                "memory_kb": 0,
                "stdout": "",
                "stderr": "",
                "error":
                    result.get(
                        "service_error_message",
                        "Code execution service is unavailable."
                    ),
                "service_error": True
            }

        stdout = (
            result.get("stdout") or ""
        ).strip()

        stderr = (
            result.get("stderr") or ""
        ).strip()

        execution_time += (
            result.get("time") or 0
        )

        memory = result.get("memory") or 0

        memory_used = max(
            memory_used,
            memory
        )

        expected = (
            testcase.expected_output or ""
        ).strip()

        # --------------------------------
        # TIME LIMIT
        # --------------------------------

        if result.get("timed_out"):

            verdict = "Time Limit Exceeded"
            error_message = "Time limit exceeded."
            break

        # --------------------------------
        # ERROR
        # --------------------------------

        if stderr:

            error_message = stderr

            # Syntax / compilation errors
            compilation_keywords = [
                "SyntaxError",
                "Compilation Error",
                "error:",
                "cannot find symbol"
            ]

            if any(
                keyword.lower() in stderr.lower()
                for keyword in compilation_keywords
            ):
                verdict = "Compilation Error"

            else:
                verdict = "Runtime Error"

            break

        # --------------------------------
        # TESTCASE
        # --------------------------------

        if stdout == expected:
            passed += 1

        else:
            verdict = "Wrong Answer"

    score = (
        round((passed / total) * 100)
        if total
        else 0
    )

    return {
        "passed_testcases": passed,
        "total_testcases": total,
        "score": score,
        "verdict": verdict,
        "execution_time_ms":
            round(execution_time * 1000),
        "memory_kb": memory_used,
        "stdout": "",
        "stderr": error_message,
        "error": error_message or None,
        "service_error": False
    }

async def create_submission(
    db: AsyncSession,
    data
):

    testcases = (
        await db.scalars(
            select(CodingTestCase)
            .where(
                CodingTestCase.problem_id
                == data.coding_problem_id
            )
        )
    ).all()

    if not testcases:
        raise ValueError("No test cases found")

    result = await evaluate_submission(
        data.source_code,
        data.language,
        testcases
    )

    submission = CodingSubmission(
        attempt_id=data.attempt_id,
        coding_problem_id=data.coding_problem_id,
        source_code=data.source_code,
        language=data.language,
        stdout=result["stdout"],
        stderr=result["stderr"],
        passed_testcases=result["passed_testcases"],
        total_testcases=result["total_testcases"],
        score=result["score"],
        ai_feedback=None
    )

    """db.add(submission)
    await db.commit()
    await db.refresh(submission)"""
    if result.get("service_error"):

        return {
            "submission_id": None,
            "status": "error",
            "verdict": result["verdict"],
            "passed_testcases": 0,
            "total_testcases": result["total_testcases"],
            "score": 0,
            "execution_time_ms": 0,
            "memory_kb": 0,
            "message":
                "Code execution service is currently unavailable.",
            "error": None
        }
    return {
        "submission_id": submission.id,
        "status": "success",
        "verdict": result["verdict"],
        "passed_testcases": result["passed_testcases"],
        "total_testcases": result["total_testcases"],
        "score": result["score"],
        "execution_time_ms": result["execution_time_ms"],
        "memory_kb": result["memory_kb"],
        "message": (
            "All test cases passed."
            if result["verdict"] == "Accepted"
            else "Submission evaluated."
        ),
        "error": result["stderr"] if result["stderr"] else None
    }


async def get_submission(
    db: AsyncSession,
    submission_id: int
):
    submission = await db.scalar(
        select(CodingSubmission)
        .where(CodingSubmission.id == submission_id)
    )

    if not submission:
        raise ValueError("Submission not found")

    return submission


async def get_attempt_submissions(
    db: AsyncSession,
    attempt_id: int
):
    result = await db.scalars(
        select(CodingSubmission)
        .where(CodingSubmission.attempt_id == attempt_id)
    )

    return result.all()