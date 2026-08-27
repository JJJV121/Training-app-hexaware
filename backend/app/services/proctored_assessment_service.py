from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course_day import CourseDay
from app.models.course import Course
from app.models.learning_unit import LearningUnit
from app.models.assessment import (
    Assessment,
    AssessmentQuestion,
    AssessmentOption,
    AssessmentAttempt,
    AssessmentAnswer,
    ProctoringEvent,
    AssessmentType,
    QuestionType,
    AttemptStatus,
)
from app.services.code_execution_service import execute_code_against_testcases
from app.database.seed_data.training_plan_questions import TRAINING_PLAN_QUESTIONS


def sanitize_name(name: str) -> str:
    """Format string cleanly for test_name e.g. Python_Day_3_Palindromes"""
    if not name:
        return "Assessment"
    cleaned = name.strip().replace(" ", "_")
    # Clean special characters
    cleaned = "".join([c if (c.isalnum() or c == "_") else "" for c in cleaned])
    return cleaned


def get_default_coding_questions_for_day(day_number: int, topic_title: str) -> list[dict]:
    """Generates standard coding questions with problem statement, constraints, sample inputs, starter code & test cases."""
    # Check if pre-configured in training plan seed data
    if day_number in TRAINING_PLAN_QUESTIONS:
        seed_questions = TRAINING_PLAN_QUESTIONS[day_number]
        formatted = []
        for q in seed_questions:
            formatted.append({
                "title": q.get("title", f"{topic_title} Challenge"),
                "question_text": q.get("problem_statement", ""),
                "input_format": q.get("input_format", "Standard Input"),
                "output_format": q.get("output_format", "Standard Output"),
                "constraints": q.get("constraints", "1 <= N <= 1000"),
                "sample_input": q.get("sample_input", "10"),
                "sample_output": q.get("sample_output", "55"),
                "explanation": q.get("explanation", ""),
                "allowed_language": q.get("language", "python"),
                "starter_code": q.get("starter_code", "def solution():\n    # Write your code here\n    pass"),
                "test_cases": q.get("test_cases", []),
                "points": 33
            })
        return formatted

    # Default Coding Question Set (Python / DSA / General Coding)
    return [
        {
            "title": f"{topic_title} - Palindrome & String Processing",
            "question_text": (
                "In the magical kingdom of Numaria, two friends Lara and Kian are practicing for the annual Numbers Festival.\n"
                "They count numbers from 1 up to a given number N and say special words based on the divisibility of those numbers:\n\n"
                "• If the number is divisible by 3 only, they say 'Fizz'.\n"
                "• If the number is divisible by 5 only, they say 'Buzz'.\n"
                "• If divisible by both 3 and 5, they say 'FizzBuzz'.\n\n"
                "However, if the number is prime (e.g. 2, 3, 5, 7), they say the number itself, regardless of the divisibility rule.\n"
                "Your task is to help them list out what they should say for all numbers from 1 to N."
            ),
            "input_format": "The first line contains an integer N, representing the count of numbers to be processed.",
            "output_format": "Print all required words/numbers from 1 to N, separated by a comma and a space (', ').",
            "constraints": "1 <= N <= 1600\nChecking for primes should be efficient.",
            "sample_input": "10",
            "sample_output": "1, 2, 3, 4, 5, Fizz, 7, 8, Fizz, Buzz",
            "explanation": "2, 3, 5, 7 are primes -> printed as is. 6 and 9 are multiples of 3 only -> 'Fizz'. 10 is divisible by 5 only -> 'Buzz'.",
            "allowed_language": "python",
            "starter_code": "def solution(n):\n    # Write your Python code here\n    pass\n\nif __name__ == '__main__':\n    n = int(input().strip())\n    print(solution(n))",
            "test_cases": [
                {"id": 1, "input": "10", "expected_output": "1, 2, 3, 4, 5, Fizz, 7, 8, Fizz, Buzz", "is_hidden": False},
                {"id": 2, "input": "5", "expected_output": "1, 2, 3, 4, 5", "is_hidden": False},
                {"id": 3, "input": "15", "expected_output": "1, 2, 3, 4, 5, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz", "is_hidden": True},
                {"id": 4, "input": "1", "expected_output": "1", "is_hidden": True},
                {"id": 5, "input": "20", "expected_output": "1, 2, 3, 4, 5, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz, 16, 17, Fizz, 19, Buzz", "is_hidden": True}
            ],
            "points": 35
        },
        {
            "title": f"{topic_title} - Two Sum & Target Search",
            "question_text": (
                "Given an array of integers nums and an integer target, find two numbers such that they add up to target.\n"
                "Return the 0-based indices of the two numbers in ascending order."
            ),
            "input_format": "First line contains array nums separated by spaces. Second line contains target.",
            "output_format": "Print the two indices separated by space.",
            "constraints": "2 <= nums.length <= 10^4\n-10^9 <= target <= 10^9",
            "sample_input": "2 7 11 15\n9",
            "sample_output": "0 1",
            "explanation": "nums[0] + nums[1] = 2 + 7 = 9. Thus output is 0 1.",
            "allowed_language": "python",
            "starter_code": "def two_sum(nums, target):\n    # Write code here\n    pass",
            "test_cases": [
                {"id": 1, "input": "2 7 11 15\n9", "expected_output": "0 1", "is_hidden": False},
                {"id": 2, "input": "3 2 4\n6", "expected_output": "1 2", "is_hidden": False},
                {"id": 3, "input": "3 3\n6", "expected_output": "0 1", "is_hidden": True},
                {"id": 4, "input": "-1 -2 -3 -4 -5\n-8", "expected_output": "2 4", "is_hidden": True}
            ],
            "points": 35
        },
        {
            "title": f"{topic_title} - Valid Parentheses Validation",
            "question_text": (
                "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n"
                "An input string is valid if open brackets are closed by the same type of brackets in the correct order."
            ),
            "input_format": "A single string s containing parentheses.",
            "output_format": "Print True if valid, False otherwise.",
            "constraints": "1 <= s.length <= 10^4",
            "sample_input": "()[]{}",
            "sample_output": "True",
            "explanation": "All opened brackets are closed in proper order.",
            "allowed_language": "python",
            "starter_code": "def isValid(s):\n    # Write your code here\n    pass",
            "test_cases": [
                {"id": 1, "input": "()[]{}", "expected_output": "True", "is_hidden": False},
                {"id": 2, "input": "(]", "expected_output": "False", "is_hidden": False},
                {"id": 3, "input": "{[]}", "expected_output": "True", "is_hidden": True},
                {"id": 4, "input": "([)]", "expected_output": "False", "is_hidden": True}
            ],
            "points": 30
        }
    ]


async def get_or_create_day_assessment(db: AsyncSession, course_day_id: int) -> Assessment:
    """
    Retrieves or generates a proctored coding assessment for a given course day.
    Name format: course_day_topic e.g. Python_Day_3_Palindromes
    """
    day_stmt = select(CourseDay).where(CourseDay.id == course_day_id)
    day_res = await db.execute(day_stmt)
    course_day = day_res.scalar_one_or_none()

    if not course_day:
        raise HTTPException(status_code=404, detail="Course day not found.")

    assessment_plan = {1: "MCQ", 2: "MCQ", 6: "CODING", 13: "MCQ", 14: "CODING", 16: "MCQ"}
    planned_type = assessment_plan.get(course_day.day_number, "CODING")

    course_stmt = select(Course).where(Course.id == course_day.course_id)
    course_res = await db.execute(course_stmt)
    course = course_res.scalar_one_or_none()
    course_name = course.title if course else "Course"

    unit_stmt = (
        select(LearningUnit)
        .where(LearningUnit.day_id == course_day_id)
        .order_by(LearningUnit.display_order)
    )
    unit_res = await db.execute(unit_stmt)
    units = unit_res.scalars().all()
    topic_title = units[0].title if units else course_day.title

    # Required Title Format: course_day_topic e.g. Python_Day_3_Palindromes
    day_num = course_day.day_number
    test_title = f"{sanitize_name(course_name)}_Day_{day_num}_{sanitize_name(topic_title)}"

    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.options)
        )
        .where(Assessment.course_day_id == course_day_id)
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()

    if not assessment:
        assessment = Assessment(
            course_day_id=course_day_id,
            title=test_title,
            description=f"Proctored coding skill assessment for {course_day.title}",
            instructions="Maintain full screen. Write working code for all questions.",
            created_by=1,
            assessment_type=planned_type,
            duration_minutes=60,
            total_marks=100,
            passing_marks=70,
        )
        db.add(assessment)
        await db.flush()
    else:
        if assessment.assessment_type != planned_type:
            assessment.assessment_type = planned_type
            await db.flush()
        # Update title if needed to enforce course_day_topic
        if assessment.title != test_title:
            assessment.title = test_title
            await db.flush()

    # Ensure coding questions exist
    q_check_stmt = select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == assessment.id)
    q_check_res = await db.execute(q_check_stmt)
    existing_questions = q_check_res.scalars().all()

    if not existing_questions:
        if assessment.assessment_type == "MCQ":
            from app.services.mcq_generator_service import generate_25_mcqs_for_day
            mcq_list = generate_25_mcqs_for_day(course_name, course_day.title, course_day.description or "")[:10]
            for i, q_data in enumerate(mcq_list, start=1):
                question_obj = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_number=i,
                    question_text=q_data["question"],
                    question_type="mcq",
                    points=1,
                    difficulty=q_data.get("difficulty", "Medium"),
                    explanation=q_data.get("explanation", "")
                )
                db.add(question_obj)
                await db.flush()
                for option_index, option_text in enumerate(q_data.get("options", [])):
                    db.add(AssessmentOption(
                        question_id=question_obj.id,
                        option_text=option_text,
                        is_correct=option_index == q_data.get("correct_index")
                    ))
        else:
            coding_q_list = get_default_coding_questions_for_day(course_day.day_number, topic_title)

            for i, q_data in enumerate(coding_q_list, start=1):
                db.add(AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_number=i,
                    question_text=q_data["question_text"],
                    question_type="coding",
                    points=q_data.get("points", 33),
                    title=q_data["title"],
                    input_format=q_data.get("input_format", ""),
                    output_format=q_data.get("output_format", ""),
                    constraints=q_data.get("constraints", ""),
                    sample_input=q_data.get("sample_input", ""),
                    sample_output=q_data.get("sample_output", ""),
                    difficulty="Medium",
                    allowed_language=q_data.get("allowed_language", "python"),
                    starter_code=q_data.get("starter_code", "def solution():\n    pass"),
                    test_cases=q_data.get("test_cases", []),
                    explanation=q_data.get("explanation", "")
                ))

        await db.commit()

        # Reload assessment with questions
        res = await db.execute(stmt)
        assessment = res.scalar_one_or_none()

    return assessment


async def get_assessments_by_day(db: AsyncSession, course_day_id: int) -> list[dict]:
    day = await db.get(CourseDay, course_day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Course day not found.")

    await get_or_create_day_assessment(db, course_day_id)
    stmt = select(Assessment).where(Assessment.course_day_id == course_day_id).order_by(Assessment.id)
    result = await db.execute(stmt)
    assessments = result.scalars().all()

    if day.day_number == 6 and not any(item.assessment_type == "MCQ" for item in assessments):
        course = await db.get(Course, day.course_id)
        course_name = course.title if course else "Course"
        mcq_assessment = Assessment(
            course_day_id=course_day_id,
            title=f"{sanitize_name(course_name)}_Day_6_MySQL_MCQ",
            description="MySQL, Agile, and Problem Solving MCQ assessment.",
            instructions="Answer all multiple-choice questions before the assessment timer expires.",
            created_by=1,
            assessment_type="MCQ",
            duration_minutes=30,
            total_marks=100,
            passing_marks=70,
        )
        db.add(mcq_assessment)
        await db.flush()
        from app.services.mcq_generator_service import generate_25_mcqs_for_day
        mcq_list = generate_25_mcqs_for_day(course_name, day.title, day.description or "")[:10]
        for index, q_data in enumerate(mcq_list, start=1):
            question = AssessmentQuestion(
                assessment_id=mcq_assessment.id,
                question_number=index,
                question_text=q_data["question"],
                question_type="mcq",
                points=1,
                difficulty=q_data.get("difficulty", "Medium"),
                explanation=q_data.get("explanation", ""),
            )
            db.add(question)
            await db.flush()
            for option_index, option_text in enumerate(q_data.get("options", [])):
                db.add(AssessmentOption(
                    question_id=question.id,
                    option_text=option_text,
                    is_correct=option_index == q_data.get("correct_index"),
                ))
        await db.commit()
        result = await db.execute(stmt)
        assessments = result.scalars().all()

    return [{
        "assessment_id": item.id,
        "title": item.title,
        "assessment_type": item.assessment_type,
        "day": day.day_number,
        "duration_minutes": item.duration_minutes,
        "total_marks": item.total_marks,
        "passing_marks": item.passing_marks,
    } for item in assessments]


def detect_assessment_language(title: str = "", text: str = "", topic: str = "", existing: str = "") -> str:
    text_combined = f"{title} {text} {topic}".lower()
    sql_keywords = ["mysql", "sql", "queries", "query", "database", "dml", "joins", "join", "subquery", "subqueries", "employee", "employees", "salary", "department", "customer", "order", "purchase", "summary", "table", "select", "update", "delete", "insert", "where", "group by"]

    if any(k in text_combined for k in sql_keywords):
        return "mysql"

    if (existing or "").lower() in ["mysql", "sql"] and not any(k in text_combined for k in ["java", "string", "array", "list", "sort", "oop", "vehicle", "stream", "class"]):
        return "mysql"

    return "java"


async def get_proctored_assessment_trainee_view(
    db: AsyncSession, assessment_id: int, user_id: int
) -> dict:
    """
    Returns trainee-safe assessment details.
    STRIPS ALL correct solution answers and hidden test case outputs.
    """
    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.options)
        )
        .where(Assessment.id == assessment_id)
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    course_name = "Course"
    day_number = 1
    topic_name = "Topic"

    if assessment.course_day_id:
        day_stmt = select(CourseDay).where(CourseDay.id == assessment.course_day_id)
        day_res = await db.execute(day_stmt)
        day = day_res.scalar_one_or_none()
        if day:
            day_number = day.day_number
            topic_name = day.title
            course_stmt = select(Course).where(Course.id == day.course_id)
            c_res = await db.execute(course_stmt)
            c_obj = c_res.scalar_one_or_none()
            if c_obj:
                course_name = c_obj.title

    test_name = assessment.title

    # Build trainee-safe questions (no solution leak, non-hidden test cases only)
    questions_list = []
    for q in assessment.questions:
        options_list = [
            {"id": opt.id, "text": opt.option_text}
            for opt in q.options
        ]

        # Strip expected output for hidden test cases
        trainee_test_cases = []
        raw_test_cases = q.test_cases or []
        for tc in raw_test_cases:
            if isinstance(tc, dict):
                is_hidden = tc.get("is_hidden", False)
                trainee_test_cases.append({
                    "id": tc.get("id"),
                    "input": tc.get("input") or tc.get("input_data"),
                    "expected_output": tc.get("expected_output") if not is_hidden else None,
                    "is_hidden": is_hidden
                })

        lang = detect_assessment_language(q.title or "", q.question_text or "", test_name, q.allowed_language or "")
        starter = "-- Write your SQL query here\n" if lang == "mysql" else "public class Solution {\n    // Write your solution here\n}"

        questions_list.append({
            "question_id": q.id,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "question_type": q.question_type or "coding",
            "points": q.points,
            "title": q.title or f"Question {q.question_number}",
            "input_format": q.input_format or "",
            "output_format": q.output_format or "",
            "constraints": q.constraints or "",
            "sample_input": q.sample_input or "",
            "sample_output": q.sample_output or "",
            "difficulty": q.difficulty or "Medium",
            "allowed_language": lang,
            "language": lang,
            "starter_code": starter,
            "test_cases": trainee_test_cases,
            "options": options_list
        })

    # Check active attempt
    attempt_stmt = (
        select(AssessmentAttempt)
        .where(
            and_(
                AssessmentAttempt.assessment_id == assessment_id,
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == AttemptStatus.IN_PROGRESS.value
            )
        )
    )
    att_res = await db.execute(attempt_stmt)
    active_attempt = att_res.scalar_one_or_none()

    return {
        "assessment_id": assessment.id,
        "assessment_type": assessment.assessment_type,
        "attempt_id": active_attempt.id if active_attempt else None,
        "test_name": test_name,
        "course": course_name,
        "day": day_number,
        "topic": topic_name,
        "duration_minutes": assessment.duration_minutes,
        "total_marks": assessment.total_marks,
        "passing_marks": assessment.passing_marks,
        "questions": questions_list
    }


async def create_or_get_active_attempt(
    db: AsyncSession, assessment_id: int, user_id: int
) -> dict:
    """
    Creates or retrieves active assessment attempt for trainee.
    Enforces server-side timer calculations and state restoration on page refresh.
    """
    stmt = select(Assessment).where(Assessment.id == assessment_id)
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    att_stmt = (
        select(AssessmentAttempt)
        .options(selectinload(AssessmentAttempt.answers))
        .where(
            and_(
                AssessmentAttempt.assessment_id == assessment_id,
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == AttemptStatus.IN_PROGRESS.value
            )
        )
    )
    att_res = await db.execute(att_stmt)
    attempt = att_res.scalar_one_or_none()

    now = datetime.utcnow()

    if attempt:
        if now > attempt.expires_at:
            attempt.status = AttemptStatus.EXPIRED.value
            await db.commit()
            raise HTTPException(status_code=400, detail="Your assessment attempt has expired.")
    else:
        sub_stmt = (
            select(AssessmentAttempt)
            .options(selectinload(AssessmentAttempt.answers))
            .where(
                and_(
                    AssessmentAttempt.assessment_id == assessment_id,
                    AssessmentAttempt.user_id == user_id,
                    AssessmentAttempt.status == AttemptStatus.SUBMITTED.value
                )
            )
        )
        sub_res = await db.execute(sub_stmt)
        sub_attempt = sub_res.scalar_one_or_none()
        if sub_attempt:
            # Already submitted — return AttemptResponse-compatible dict
            trainee_view = await get_proctored_assessment_trainee_view(db, assessment_id, user_id)
            saved_answers_sub = {}
            for ans in (sub_attempt.answers or []):
                saved_answers_sub[ans.question_id] = {
                    "selected_option_ids": ans.selected_option_ids or [],
                    "answer_text": ans.answer_text or "",
                    "code": ans.code or "",
                    "language": ans.language or "python",
                    "status": ans.status or "Attempted"
                }
            return {
                "attempt_id": sub_attempt.id,
                "assessment_id": assessment_id,
                "test_name": trainee_view["test_name"],
                "course": trainee_view["course"],
                "day": trainee_view["day"],
                "topic": trainee_view["topic"],
                "duration_minutes": assessment.duration_minutes,
                "status": sub_attempt.status,
                "started_at": sub_attempt.started_at,
                "expires_at": sub_attempt.expires_at,
                "submitted_at": sub_attempt.submitted_at,
                "current_question": sub_attempt.current_question,
                "saved_answers": saved_answers_sub,
                "remaining_seconds": 0,
            }

        expires_at = now + timedelta(minutes=assessment.duration_minutes)
        attempt = AssessmentAttempt(
            user_id=user_id,
            assessment_id=assessment_id,
            status=AttemptStatus.IN_PROGRESS.value,
            current_question=0,
            started_at=now,
            expires_at=expires_at,
            total_marks=float(assessment.total_marks)
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

        # Reload attempt with answers relationship
        att_res2 = await db.execute(
            select(AssessmentAttempt)
            .options(selectinload(AssessmentAttempt.answers))
            .where(AssessmentAttempt.id == attempt.id)
        )
        attempt = att_res2.scalar_one_or_none()

    # Retrieve saved answers (MCQ & Coding)
    saved_answers = {}
    if attempt and attempt.answers:
        for ans in attempt.answers:
            saved_answers[ans.question_id] = {
                "selected_option_ids": ans.selected_option_ids or [],
                "answer_text": ans.answer_text or "",
                "code": ans.code or "",
                "language": ans.language or "python",
                "status": ans.status or "Attempted"
            }

    remaining_sec = max(0, int((attempt.expires_at - now).total_seconds()))
    trainee_view = await get_proctored_assessment_trainee_view(db, assessment_id, user_id)

    return {
        "attempt_id": attempt.id,
        "assessment_id": assessment.id,
        "test_name": trainee_view["test_name"],
        "course": trainee_view["course"],
        "day": trainee_view["day"],
        "topic": trainee_view["topic"],
        "duration_minutes": assessment.duration_minutes,
        "status": attempt.status,
        "started_at": attempt.started_at,
        "expires_at": attempt.expires_at,
        "submitted_at": attempt.submitted_at,
        "current_question": attempt.current_question,
        "saved_answers": saved_answers,
        "remaining_seconds": remaining_sec
    }


async def save_answer(
    db: AsyncSession,
    attempt_id: int,
    question_id: int,
    user_id: int,
    selected_option_ids: list[int] | None = None,
    answer_text: str | None = None,
    code: str | None = None,
    language: str | None = None,
    current_question_index: int | None = None
):
    """
    Dynamically auto-saves candidate answers (MCQ or Coding) for an active attempt.
    """
    stmt = (
        select(AssessmentAttempt)
        .where(
            and_(
                AssessmentAttempt.id == attempt_id,
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    if attempt.status != AttemptStatus.IN_PROGRESS.value:
        raise HTTPException(status_code=400, detail="Cannot update answers for a finished or expired attempt.")

    if datetime.utcnow() > attempt.expires_at:
        attempt.status = AttemptStatus.EXPIRED.value
        await db.commit()
        raise HTTPException(status_code=400, detail="Assessment time has expired.")

    if current_question_index is not None:
        attempt.current_question = current_question_index

    ans_stmt = (
        select(AssessmentAnswer)
        .where(
            and_(
                AssessmentAnswer.attempt_id == attempt_id,
                AssessmentAnswer.question_id == question_id
            )
        )
    )
    ans_res = await db.execute(ans_stmt)
    answer = ans_res.scalar_one_or_none()

    if not answer:
        answer = AssessmentAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option_ids=selected_option_ids or [],
            answer_text=answer_text or "",
            code=code or "",
            language=language or "python",
            status="Attempted" if (code or selected_option_ids or answer_text) else "Not Attempted",
            answered_at=datetime.utcnow()
        )
        db.add(answer)
    else:
        if selected_option_ids is not None:
            answer.selected_option_ids = selected_option_ids
        if answer_text is not None:
            answer.answer_text = answer_text
        if code is not None:
            answer.code = code
        if language is not None:
            answer.language = language
        answer.status = "Attempted" if (answer.code or answer.selected_option_ids or answer.answer_text) else "Not Attempted"
        answer.answered_at = datetime.utcnow()

    await db.commit()
    return {"status": "saved", "question_id": question_id}


async def record_proctoring_event(
    db: AsyncSession,
    attempt_id: int,
    user_id: int,
    event_type: str,
    timestamp: str | None = None,
    metadata_json: dict | None = None
):
    stmt = (
        select(AssessmentAttempt)
        .where(
            and_(
                AssessmentAttempt.id == attempt_id,
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    event = ProctoringEvent(
        attempt_id=attempt_id,
        event_type=event_type,
        timestamp=datetime.utcnow(),
        metadata_json=metadata_json or {}
    )
    db.add(event)
    await db.commit()
    return {"status": "recorded", "event_type": event_type}


async def submit_attempt(db: AsyncSession, attempt_id: int, user_id: int) -> dict:
    """
    Submits and evaluates all questions server-side.
    Executes code against hidden & sample test cases.
    Locks attempt against further answer updates.
    """
    stmt = (
        select(AssessmentAttempt)
        .options(
            selectinload(AssessmentAttempt.assessment)
            .selectinload(Assessment.questions)
            .selectinload(AssessmentQuestion.options),
            selectinload(AssessmentAttempt.answers)
        )
        .where(
            and_(
                AssessmentAttempt.id == attempt_id,
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Assessment attempt not found.")

    if attempt.status == AttemptStatus.SUBMITTED.value:
        trainee_view = await get_proctored_assessment_trainee_view(db, attempt.assessment_id, user_id)
        answered_cnt = len([a for a in attempt.answers if (a.selected_option_ids or a.answer_text or a.code)])
        total_q = len(attempt.assessment.questions)
        return {
            "attempt_id": attempt.id,
            "assessment_id": attempt.assessment_id,
            "test_name": trainee_view["test_name"],
            "course": trainee_view["course"],
            "day": trainee_view["day"],
            "topic": trainee_view["topic"],
            "score": attempt.score or 0.0,
            "total_marks": attempt.total_marks or 100.0,
            "percentage": round(((attempt.score or 0.0) / (attempt.total_marks or 100.0)) * 100, 2),
            "answered_count": answered_cnt,
            "unanswered_count": total_q - answered_cnt,
            "passed": bool(attempt.passed),
            "status": attempt.status,
            "submitted_at": attempt.submitted_at or datetime.utcnow()
        }

    # Evaluate answers server-side
    answers_map = {ans.question_id: ans for ans in attempt.answers}
    total_score = 0.0
    total_possible_marks = 0.0
    answered_count = 0

    for question in attempt.assessment.questions:
        q_points = float(question.points)
        total_possible_marks += q_points
        user_ans = answers_map.get(question.id)

        if not user_ans:
            continue

        if question.question_type == "coding":
            user_code = (user_ans.code or "").strip()
            lang = user_ans.language or question.allowed_language or "python"
            if user_code:
                answered_count += 1
                test_cases = question.test_cases or []
                eval_res = await execute_code_against_testcases(user_code, lang, test_cases)

                passed_cases = eval_res.get("passed_tests", 0)
                total_cases = eval_res.get("total_tests", 1)

                q_score = (passed_cases / total_cases * q_points) if total_cases > 0 else 0.0
                is_q_correct = (passed_cases == total_cases and total_cases > 0)

                user_ans.is_correct = is_q_correct
                user_ans.score_obtained = round(q_score, 2)
                user_ans.status = eval_res.get("status", "completed")
                user_ans.execution_time = eval_res.get("execution_time", 0.0)
                user_ans.passed_test_cases = passed_cases
                user_ans.total_test_cases = total_cases
                total_score += q_score
        else:
            # MCQ / MSQ / Text questions logic
            sel_opts = set(user_ans.selected_option_ids or [])
            ans_txt = (user_ans.answer_text or "").strip()
            if sel_opts or ans_txt:
                answered_count += 1
            correct_opts = {opt.id for opt in question.options if opt.is_correct}
            is_q_correct = False
            if sel_opts and correct_opts and sel_opts == correct_opts:
                is_q_correct = True
            elif question.question_type == QuestionType.TEXT.value and len(ans_txt) > 3:
                is_q_correct = True

            user_ans.is_correct = is_q_correct
            q_score = q_points if is_q_correct else 0.0
            user_ans.score_obtained = q_score
            if is_q_correct:
                total_score += q_score

    total_possible_marks = max(total_possible_marks, 1.0)
    total_score = round(total_score, 2)
    percentage = round((total_score / total_possible_marks * 100), 2)
    passing_perc = (attempt.assessment.passing_marks / attempt.assessment.total_marks * 100) if attempt.assessment.total_marks > 0 else 70.0
    is_passed = percentage >= passing_perc

    # Lock attempt
    now = datetime.utcnow()
    attempt.status = AttemptStatus.SUBMITTED.value
    attempt.submitted_at = now
    attempt.score = total_score
    attempt.total_marks = total_possible_marks
    attempt.passed = is_passed

    await db.commit()

    trainee_view = await get_proctored_assessment_trainee_view(db, attempt.assessment_id, user_id)
    total_q = len(attempt.assessment.questions)

    return {
        "attempt_id": attempt.id,
        "assessment_id": attempt.assessment_id,
        "test_name": trainee_view["test_name"],
        "course": trainee_view["course"],
        "day": trainee_view["day"],
        "topic": trainee_view["topic"],
        "score": total_score,
        "total_marks": total_possible_marks,
        "percentage": percentage,
        "answered_count": answered_count,
        "unanswered_count": total_q - answered_count,
        "passed": is_passed,
        "status": attempt.status,
        "remaining_seconds": 0,
        "submitted_at": now
    }
