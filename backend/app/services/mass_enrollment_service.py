import csv
import io
import re
from datetime import datetime, date, time
from typing import Any

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.content import Content
from app.models.mcq_bank import MCQQuestionBank
from app.models.batch_models import Batch
from app.models.enrollment import Enrollment
from app.core.security import hash_password
from app.core.password_validation import validate_password_syntax
from app.services.batch_service import calculate_batch_status
from app.services.auth_service import generate_activation_token, build_activation_link
from app.services.email_service import send_activation_email


EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def get_csv_template(enrollment_type: str) -> str:
    """Generates sample CSV template content with headers and an example row."""
    enrollment_type = enrollment_type.lower().replace("-", "_")

    if enrollment_type == "trainees":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["employee_id", "name", "email", "college_name", "password", "course_id_or_title"])
        writer.writerow(["EMP1001", "Jane Trainee", "jane.trainee@hexaware.com", "Hexaware Academy", "Pass@12345678", "1"])
        return output.getvalue()

    elif enrollment_type == "trainers":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["employee_id", "name", "email", "password", "course_id_or_title"])
        writer.writerow(["TRN1001", "John Trainer", "john.trainer@hexaware.com", "SecurePass@123", "1"])
        return output.getvalue()

    elif enrollment_type == "batches":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["name", "course_id_or_title", "trainer_id_or_email", "college_name", "start_date", "end_date", "start_time", "end_time", "max_strength"])
        writer.writerow(["Batch Alpha 2026", "1", "john.trainer@hexaware.com", "Hexaware Academy", "2026-10-01", "2026-11-15", "09:00:00", "17:00:00", "30"])
        return output.getvalue()

    elif enrollment_type in {"question_bank", "questionbank", "mcq_bank", "mcqbank"}:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["question", "ans1", "ans2", "ans3", "ans4", "answer", "explanation", "difficulty", "subject_name", "topic_name", "sub_topic_name"])
        writer.writerow([
            "What is the time complexity of binary search on a sorted array?",
            "O(n)",
            "O(log n)",
            "O(n log n)",
            "O(1)",
            "B",
            "Binary search halves the search space each step, so the time complexity is logarithmic.",
            "MEDIUM",
            "Data Structures",
            "Searching",
            "Array Search"
        ])
        return output.getvalue()

    elif enrollment_type in {"training_plan", "trainingplan"}:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["S.No", "Skills", "Duration (in days)", "Topics", "Detailed Coverage", "Duration in Hours"])
        writer.writerow(["1", "Java Fundamentals", "1", "Syntax and Data Types", "Variables, primitive types, operators, and expressions.", "2"])
        writer.writerow(["2", "", "", "Object-Oriented Programming", "Classes, objects, inheritance, polymorphism, and encapsulation.", "3"])
        writer.writerow(["3", "Collections and Exceptions", "2", "Collections Framework", "Lists, sets, maps, iterators, and common collection patterns.", "2.5"])
        return output.getvalue()

    else:
        raise ValueError("Invalid enrollment type specified")


def _normalize_mcq_answer_values(raw_answer: str) -> tuple[set[str], str | None]:
    """Normalizes valid MCQ answer inputs to option letters.

    Accepts both letter values (A, B, C, D) and numeric values (1, 2, 3, 4),
    including multiple correct options like A,D or 1,2,4.
    """
    if not raw_answer:
        return set(), None

    pattern = r"[;,|/\\]+|\s+"
    parts = [token.strip().upper() for token in re.split(pattern, raw_answer.replace("&", ",")) if token.strip()]
    if not parts:
        return set(), None

    letter_map = {"1": "A", "2": "B", "3": "C", "4": "D"}
    normalized: set[str] = set()
    for part in parts:
        if part in {"A", "B", "C", "D"}:
            normalized.add(part)
        elif part in letter_map:
            normalized.add(letter_map[part])
        else:
            return set(), f"Answer must contain only A/B/C/D or 1/2/3/4 values. Received '{raw_answer}'."

    return normalized, None


def _parse_training_day_number(raw_day: str) -> int | None:
    """Extracts a day number from values like 'Day 2' or '2'. Returns None for shared sections."""
    if raw_day is None:
        return None
    value = str(raw_day).strip()
    if not value:
        return None

    match = re.search(r"(?i)\bday\s*(\d+)\b", value)
    if match:
        return int(match.group(1))

    if re.fullmatch(r"\d+", value):
        return int(value)

    return None


def _normalize_headers(raw_headers: list[str]) -> dict[str, str]:
    """Maps raw CSV header names to standard internal field keys."""
    header_map = {}
    for original in raw_headers:
        cleaned = re.sub(r"[^a-z0-9]+", "_", original.strip().lower()).strip("_")

        if cleaned in ["employee_id", "employeeid", "emp_id", "empid", "user_id", "student_id", "studentid", "trainee_id"]:
            header_map[original] = "employee_id"
        elif cleaned in ["name", "full_name", "fullname", "user_name"]:
            header_map[original] = "name"
        elif cleaned in ["email", "email_address", "mail"]:
            header_map[original] = "email"
        elif cleaned in ["college_name", "college", "institution", "university"]:
            header_map[original] = "college_name"
        elif cleaned in ["password", "pwd", "pass"]:
            header_map[original] = "password"
        elif cleaned in ["course_id_or_title", "course_id", "course_title", "course_name", "course"]:
            header_map[original] = "course"
        elif cleaned in ["batch_id_or_name", "batch_id", "batch_name", "batch"]:
            header_map[original] = "batch"
        elif cleaned in ["trainer_id_or_email", "trainer_id", "trainer_email", "trainer_employee_id", "trainer_name", "trainer"]:
            header_map[original] = "trainer"
        elif cleaned in ["start_date", "startdate"]:
            header_map[original] = "start_date"
        elif cleaned in ["end_date", "enddate"]:
            header_map[original] = "end_date"
        elif cleaned in ["start_time", "starttime"]:
            header_map[original] = "start_time"
        elif cleaned in ["end_time", "endtime"]:
            header_map[original] = "end_time"
        elif cleaned in ["max_strength", "max_capacity", "capacity", "strength"]:
            header_map[original] = "max_strength"
        elif cleaned in ["s_no", "serial_no", "serial_number"]:
            header_map[original] = "s_no"
        elif cleaned in ["skills", "skill"]:
            header_map[original] = "skills"
        elif cleaned in ["duration_in_days", "duration_days", "day_number"]:
            header_map[original] = "duration_in_days"
        elif cleaned in ["learning_unit_title", "unit_title", "learning_title"]:
            header_map[original] = "learning_unit_title"
        elif cleaned in ["topics", "topic"]:
            header_map[original] = "topics"
        elif cleaned in ["detailed_coverage", "coverage", "detailed_coverage_details"]:
            header_map[original] = "detailed_coverage"
        elif cleaned in ["duration_in_hours", "hours", "hours_duration"]:
            header_map[original] = "duration_in_hours"
        elif cleaned in ["duration_minutes", "minutes", "duration_mins"]:
            header_map[original] = "duration_minutes"
        elif cleaned in ["display_order", "order", "sequence", "sequence_number"]:
            header_map[original] = "display_order"
        elif cleaned in ["description", "unit_description"]:
            header_map[original] = "description"
        elif cleaned in ["question", "question_text"]:
            header_map[original] = "question"
        elif cleaned in ["ans1", "option_a", "answer_1"]:
            header_map[original] = "ans1"
        elif cleaned in ["ans2", "option_b", "answer_2"]:
            header_map[original] = "ans2"
        elif cleaned in ["ans3", "option_c", "answer_3"]:
            header_map[original] = "ans3"
        elif cleaned in ["ans4", "option_d", "answer_4"]:
            header_map[original] = "ans4"
        elif cleaned in ["answer", "correct_answer"]:
            header_map[original] = "answer"
        elif cleaned in ["explanation"]:
            header_map[original] = "explanation"
        elif cleaned in ["difficulty"]:
            header_map[original] = "difficulty"
        elif cleaned in ["subject_name", "subject"]:
            header_map[original] = "subject_name"
        elif cleaned in ["topic_name", "topic", "main_topic"]:
            header_map[original] = "topic_name"
        elif cleaned in ["sub_topic_name", "subtopic", "sub_topic"]:
            header_map[original] = "sub_topic_name"
        else:
            header_map[original] = cleaned

    return header_map


def _parse_csv_content(
    csv_file_bytes: bytes,
    enrollment_type: str,
) -> tuple[list[str], list[dict[str, str]]]:
    """Parses binary CSV content handling UTF-8/BOM, quotes, empty lines."""
    try:
        text = csv_file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = csv_file_bytes.decode("latin-1")

    # Standardize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    
    stream = io.StringIO(text)
    reader = csv.reader(stream)

    try:
        rows = [row for row in reader if any(cell.strip() for cell in row)]
    except csv.Error as exc:
        raise ValueError(f"Malformed CSV file: {exc}") from exc
    if not rows:
        raise ValueError("CSV file is empty")

    raw_headers = [h.strip() for h in rows[0]]
    while raw_headers and not raw_headers[-1]:
        raw_headers.pop()
    if not raw_headers or any(not header for header in raw_headers):
        raise ValueError("CSV header row contains an empty column name.")
    if len({header.lower() for header in raw_headers}) != len(raw_headers):
        raise ValueError("CSV header row contains duplicate column names.")
    header_mapping = _normalize_headers(raw_headers)
    
    data_rows = []
    for raw_row in rows[1:]:
        if len(raw_row) > len(raw_headers) and any(cell.strip() for cell in raw_row[len(raw_headers):]):
            raise ValueError("CSV contains data in a column without a header.")
        row_dict = {}
        for idx, header in enumerate(raw_headers):
            key = header_mapping[header]
            val = raw_row[idx].strip() if idx < len(raw_row) else ""
            row_dict[key] = val
        data_rows.append(row_dict)

    required_headers = {
        "trainees": {"employee_id", "name", "email"},
        "trainers": {"employee_id", "name", "email", "password"},
        "batches": {"name", "course", "start_date", "end_date"},
        "question_bank": {"question", "ans1", "ans2", "ans3", "ans4", "answer", "explanation", "difficulty", "subject_name", "topic_name", "sub_topic_name"},
        "training_plan": {"s_no", "skills", "duration_in_days", "topics", "detailed_coverage", "duration_in_hours"},
    }
    missing_headers = required_headers.get(enrollment_type, set()) - set(header_mapping.values())
    if missing_headers:
        raise ValueError(
            f"CSV is missing required column(s): {', '.join(sorted(missing_headers))}."
        )

    unsupported_headers = {
        "trainees": {"batch"},
        "trainers": {"college_name", "batch"},
    }
    unsupported = unsupported_headers.get(enrollment_type, set()) & set(header_mapping.values())
    if unsupported:
        raise ValueError(
            f"CSV contains unsupported column(s) for {enrollment_type}: {', '.join(sorted(unsupported))}."
        )

    return list(header_mapping.values()), data_rows


async def _resolve_course(db: AsyncSession, course_ref: str) -> Course | None:
    """Finds a course by integer ID or title."""
    if not course_ref:
        return None
        
    if course_ref.isdigit():
        course = await db.get(Course, int(course_ref))
        if course:
            return course

    result = await db.execute(
        select(Course).where(func.lower(Course.title) == course_ref.lower())
    )
    return result.scalar_one_or_none()


async def _resolve_trainer(db: AsyncSession, trainer_ref: str) -> User | None:
    """Finds a trainer user by integer ID, email, employee_id, or name."""
    if not trainer_ref:
        return None

    if trainer_ref.isdigit():
        trainer = await db.scalar(
            select(User).where(User.id == int(trainer_ref), func.lower(User.role) == "trainer")
        )
        if trainer:
            return trainer

    result = await db.execute(
        select(User).where(
            func.lower(User.role) == "trainer",
            or_(
                func.lower(User.email) == trainer_ref.lower(),
                func.lower(User.employee_id) == trainer_ref.lower(),
                func.lower(User.name) == trainer_ref.lower(),
            )
        )
    )
    return result.scalar_one_or_none()


async def _resolve_mcq_learning_unit(
    db: AsyncSession,
    course_id: int,
    subject_name: str,
    topic_name: str,
) -> tuple[CourseDay | None, LearningUnit | None, str | None]:
    """Resolve a curriculum unit using exact normalized day and unit titles."""
    normalized_subject = " ".join(subject_name.split()).casefold()
    normalized_topic = " ".join(topic_name.split()).casefold()
    result = await db.execute(
        select(CourseDay, LearningUnit)
        .join(LearningUnit, LearningUnit.day_id == CourseDay.id)
        .where(CourseDay.course_id == int(course_id))
    )
    matches = [
        (day, unit)
        for day, unit in result.all()
        if " ".join((day.title or "").split()).casefold() == normalized_subject
        and " ".join((unit.title or "").split()).casefold() == normalized_topic
    ]
    if len(matches) == 1:
        day, unit = matches[0]
        return day, unit, None
    if not matches:
        return None, None, "No CourseDay/LearningUnit matched subject_name and topic_name exactly."
    return None, None, "Subject and topic matched more than one learning unit; mapping is ambiguous."


async def validate_csv_upload(
    db: AsyncSession,
    enrollment_type: str,
    file_bytes: bytes,
    course_id: int | None = None,
) -> dict[str, Any]:
    """
    Parses and validates CSV content for Trainees, Trainers, Batches, Question Bank,
    and Training Plan rows. For training-plan uploads, course_id is supplied separately
    through the UI and not expected in the CSV file itself.
    """
    enrollment_type = enrollment_type.lower()
    if enrollment_type not in ["trainees", "trainers", "batches", "question_bank", "training_plan"]:
        raise ValueError("Invalid enrollment type. Must be 'trainees', 'trainers', 'batches', 'question_bank', or 'training_plan'.")

    if enrollment_type in {"training_plan", "question_bank"} and not course_id:
        raise ValueError("A course must be selected before validating this upload.")

    if enrollment_type in {"training_plan", "question_bank"}:
        selected_course = await db.get(Course, int(course_id))
        if not selected_course:
            raise ValueError(f"Course with id {course_id} does not exist.")

    headers, data_rows = _parse_csv_content(file_bytes, enrollment_type)
    
    # Pre-fetch existing DB identifiers for fast lookup
    existing_emails = set()
    existing_employee_ids = set()
    existing_batch_names = set()

    existing_mcq_questions = set()
    seen_mcq_questions = set()

    if enrollment_type in ["trainees", "trainers"]:
        user_res = await db.execute(select(User.email, User.employee_id))
        for em, emp in user_res.all():
            if em:
                existing_emails.add(em.lower())
            if emp:
                existing_employee_ids.add(emp.lower())
    elif enrollment_type == "batches":
        batch_res = await db.execute(select(Batch.name))
        for (bname,) in batch_res.all():
            if bname:
                existing_batch_names.add(bname.lower())
    elif enrollment_type == "question_bank":
        existing_question_rows = await db.execute(
            select(MCQQuestionBank.question_text).where(MCQQuestionBank.course_id == int(course_id))
        )
        existing_mcq_questions = {value.strip().casefold() for (value,) in existing_question_rows.all() if value}

    seen_emails_in_file = set()
    seen_employee_ids_in_file = set()
    seen_batch_names_in_file = set()
    seen_training_units_in_file = set()
    seen_training_serials_in_file = set()
    validated_rows = []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for idx, row in enumerate(data_rows, start=2): # Row 1 is header
        row_errors = []
        is_duplicate = False

        if enrollment_type == "question_bank":
            question = row.get("question", "").strip()
            ans1 = row.get("ans1", "").strip()
            ans2 = row.get("ans2", "").strip()
            ans3 = row.get("ans3", "").strip()
            ans4 = row.get("ans4", "").strip()
            answer = row.get("answer", "").strip().upper()
            explanation = row.get("explanation", "").strip()
            difficulty = row.get("difficulty", "").strip().upper()
            subject_name = row.get("subject_name", "").strip()
            topic_name = row.get("topic_name", "").strip()
            sub_topic_name = row.get("sub_topic_name", "").strip()

            for field_name, field_value in {
                "question": question,
                "ans1": ans1,
                "ans2": ans2,
                "ans3": ans3,
                "ans4": ans4,
                "answer": answer,
                "explanation": explanation,
                "difficulty": difficulty,
                "subject_name": subject_name,
                "topic_name": topic_name,
                "sub_topic_name": sub_topic_name,
            }.items():
                if not field_value:
                    row_errors.append(f"Required field '{field_name}' is missing.")

            normalized_answers, answer_error = _normalize_mcq_answer_values(answer)
            if answer_error:
                row_errors.append(answer_error)
            else:
                row["resolved_normalized_answer"] = ",".join(sorted(normalized_answers))
                row["resolved_question_type"] = "Multiple" if len(normalized_answers) > 1 else "Single"

            valid_options = {"A": ans1, "B": ans2, "C": ans3, "D": ans4}
            if normalized_answers:
                missing_selected_options = [
                    option for option in sorted(normalized_answers)
                    if not valid_options.get(option, "")
                ]
                if missing_selected_options:
                    row_errors.append(
                        "Selected correct answer option(s) are missing from the uploaded choices: "
                        + ", ".join(missing_selected_options)
                        + "."
                    )

            if difficulty and difficulty not in {"EASY", "MEDIUM", "HARD"}:
                row_errors.append(f"Difficulty must be one of EASY, MEDIUM, or HARD. Received '{difficulty}'.")

            if question and question.casefold() in existing_mcq_questions:
                is_duplicate = True
                row_errors.append("Question already exists for the selected course.")
            if question:
                question_key = question.casefold()
                if question_key in seen_mcq_questions:
                    is_duplicate = True
                    row_errors.append("Duplicate question within CSV file.")
                seen_mcq_questions.add(question_key)

            if question and subject_name and topic_name:
                day, unit, mapping_error = await _resolve_mcq_learning_unit(
                    db, int(course_id), subject_name, topic_name
                )
                if mapping_error:
                    row_errors.append(mapping_error)
                else:
                    row["resolved_course_id"] = str(course_id)
                    row["resolved_course_day_id"] = str(day.id)
                    row["resolved_learning_unit_id"] = str(unit.id)
                    row["resolved_course_day_number"] = day.day_number
                    row["resolved_course_day_title"] = day.title
                    row["resolved_learning_unit_title"] = unit.title

        elif enrollment_type == "training_plan":
            serial_value = row.get("s_no", "").strip()
            skill = row.get("skills", "").strip()
            day_value = row.get("duration_in_days", "").strip()
            title = row.get("topics", "").strip()
            coverage = row.get("detailed_coverage", "").strip()
            hours_value = row.get("duration_in_hours", "").strip()

            if not serial_value:
                row_errors.append("Required field 'S.No' is missing.")
                serial_number = None
            else:
                try:
                    serial_number = int(serial_value)
                    if serial_number <= 0:
                        row_errors.append("S.No must be a positive integer.")
                except ValueError:
                    serial_number = None
                    row_errors.append(f"S.No '{serial_value}' must be a positive integer.")

            if serial_number is not None:
                if serial_number in seen_training_serials_in_file:
                    row_errors.append(f"Duplicate S.No '{serial_value}' within CSV file.")
                seen_training_serials_in_file.add(serial_number)

            # The organization file uses blank cells for continuation rows.
            previous_row = validated_rows[-1]["data"] if validated_rows else {}
            if not skill:
                skill = previous_row.get("resolved_skill", "").strip()
            if not day_value:
                day_value = previous_row.get("resolved_day_value", "").strip()

            day_number = _parse_training_day_number(day_value)
            if not skill:
                row_errors.append("Required field 'Skills' is missing (and no previous skill is available for this continuation row).")
            if not day_value:
                row_errors.append("Required field 'Duration (in days)' is missing (and no previous day is available for this continuation row).")
            elif day_number is None or day_number <= 0:
                row_errors.append(f"Duration (in days) '{day_value}' must be a positive number.")

            if not title:
                row_errors.append("Required field 'Topics' is missing.")
            if title and not coverage:
                row_errors.append("Required field 'Detailed Coverage' is missing for this topic.")

            duration_minutes = None
            if not hours_value:
                row_errors.append("Required field 'Duration in Hours' is missing.")
            else:
                try:
                    hours = float(hours_value)
                    if hours <= 0:
                        row_errors.append("Duration in Hours must be positive.")
                    else:
                        duration_minutes = int(hours * 60)
                        if duration_minutes <= 0:
                            row_errors.append("Duration in Hours must convert to at least one minute.")
                except ValueError:
                    row_errors.append(f"Duration in Hours '{hours_value}' must be numeric.")

            display_order = None
            if day_number and title:
                display_order = sum(
                    1 for prior in validated_rows
                    if prior["data"].get("resolved_day_number") == day_number
                    and prior["data"].get("topics", "").strip()
                ) + 1
                unit_key = (day_number, title.lower())
                if unit_key in seen_training_units_in_file:
                    is_duplicate = True
                    row_errors.append(f"Duplicate topic '{title}' for day {day_number} within CSV file.")
                seen_training_units_in_file.add(unit_key)

            row["resolved_course_id"] = str(course_id)
            row["resolved_skill"] = skill
            row["resolved_day_value"] = day_value
            row["resolved_day_number"] = day_number
            row["resolved_display_order"] = display_order
            row["resolved_duration_minutes"] = duration_minutes

        elif enrollment_type == "trainees":
            emp_id = row.get("employee_id", "").strip()
            name = row.get("name", "").strip()
            email = row.get("email", "").strip()
            password = row.get("password", "").strip()
            course_ref = row.get("course", "").strip()

            # Required field checks
            if not emp_id:
                row_errors.append("Required field 'employee_id' is missing.")
            if not name:
                row_errors.append("Required field 'name' is missing.")
            if not email:
                row_errors.append("Required field 'email' is missing.")

            # Email format check
            if email and not EMAIL_REGEX.match(email):
                row_errors.append(f"Invalid email format '{email}'.")

            # Password policy check if password provided
            if password:
                try:
                    validate_password_syntax(password)
                except ValueError as ve:
                    row_errors.append(str(ve))

            # Duplicate checks (in-file & DB)
            if emp_id:
                emp_lower = emp_id.lower()
                if emp_lower in seen_employee_ids_in_file:
                    is_duplicate = True
                    row_errors.append(f"Duplicate Employee ID '{emp_id}' within CSV file.")
                elif emp_lower in existing_employee_ids:
                    is_duplicate = True
                    row_errors.append(f"Employee ID '{emp_id}' already exists in database.")
                seen_employee_ids_in_file.add(emp_lower)

            if email:
                email_lower = email.lower()
                if email_lower in seen_emails_in_file:
                    is_duplicate = True
                    row_errors.append(f"Duplicate Email '{email}' within CSV file.")
                elif email_lower in existing_emails:
                    is_duplicate = True
                    row_errors.append(f"Email '{email}' already exists in database.")
                seen_emails_in_file.add(email_lower)

            # Foreign key resolutions
            if course_ref:
                c_obj = await _resolve_course(db, course_ref)
                if not c_obj:
                    row_errors.append(f"Course '{course_ref}' does not exist.")
                else:
                    row["resolved_course_id"] = str(c_obj.id)
                    row["resolved_course_title"] = c_obj.title

        elif enrollment_type == "trainers":
            emp_id = row.get("employee_id", "").strip()
            name = row.get("name", "").strip()
            email = row.get("email", "").strip()
            password = row.get("password", "").strip()
            course_ref = row.get("course", "").strip()

            if not emp_id:
                row_errors.append("Required field 'employee_id' is missing.")
            if not name:
                row_errors.append("Required field 'name' is missing.")
            if not email:
                row_errors.append("Required field 'email' is missing.")

            # Trainers require a valid password per system policy
            if not password:
                row_errors.append("Required field 'password' is missing for trainer.")
            else:
                try:
                    validate_password_syntax(password)
                except ValueError as ve:
                    row_errors.append(str(ve))

            if email and not EMAIL_REGEX.match(email):
                row_errors.append(f"Invalid email format '{email}'.")

            if emp_id:
                emp_lower = emp_id.lower()
                if emp_lower in seen_employee_ids_in_file:
                    is_duplicate = True
                    row_errors.append(f"Duplicate Employee ID '{emp_id}' within CSV file.")
                elif emp_lower in existing_employee_ids:
                    is_duplicate = True
                    row_errors.append(f"Employee ID '{emp_id}' already exists in database.")
                seen_employee_ids_in_file.add(emp_lower)

            if email:
                email_lower = email.lower()
                if email_lower in seen_emails_in_file:
                    is_duplicate = True
                    row_errors.append(f"Duplicate Email '{email}' within CSV file.")
                elif email_lower in existing_emails:
                    is_duplicate = True
                    row_errors.append(f"Email '{email}' already exists in database.")
                seen_emails_in_file.add(email_lower)

            if course_ref:
                c_obj = await _resolve_course(db, course_ref)
                if not c_obj:
                    row_errors.append(f"Course '{course_ref}' does not exist.")
                else:
                    row["resolved_course_id"] = str(c_obj.id)
                    row["resolved_course_title"] = c_obj.title

        elif enrollment_type == "batches":
            bname = row.get("name", "").strip()
            course_ref = row.get("course", "").strip()
            trainer_ref = row.get("trainer", "").strip()
            s_date_str = row.get("start_date", "").strip()
            e_date_str = row.get("end_date", "").strip()

            if not bname:
                row_errors.append("Required field 'name' (batch_name) is missing.")
            if not course_ref:
                row_errors.append("Required field 'course' (course_id/title) is missing.")
            if not s_date_str:
                row_errors.append("Required field 'start_date' is missing.")
            if not e_date_str:
                row_errors.append("Required field 'end_date' is missing.")

            # Date validations
            parsed_s_date = None
            parsed_e_date = None
            if s_date_str:
                try:
                    parsed_s_date = datetime.strptime(s_date_str, "%Y-%m-%d").date()
                except ValueError:
                    row_errors.append(f"Invalid start_date format '{s_date_str}'. Expected YYYY-MM-DD.")
            
            if e_date_str:
                try:
                    parsed_e_date = datetime.strptime(e_date_str, "%Y-%m-%d").date()
                except ValueError:
                    row_errors.append(f"Invalid end_date format '{e_date_str}'. Expected YYYY-MM-DD.")

            if parsed_s_date and parsed_e_date and parsed_s_date > parsed_e_date:
                row_errors.append("Start date cannot be greater than end date.")

            # Duplicate check
            if bname:
                b_lower = bname.lower()
                if b_lower in seen_batch_names_in_file:
                    is_duplicate = True
                    row_errors.append(f"Duplicate Batch Name '{bname}' within CSV file.")
                elif b_lower in existing_batch_names:
                    is_duplicate = True
                    row_errors.append(f"Batch Name '{bname}' already exists in database.")
                seen_batch_names_in_file.add(b_lower)

            # Foreign keys validation
            if course_ref:
                c_obj = await _resolve_course(db, course_ref)
                if not c_obj:
                    row_errors.append(f"Course '{course_ref}' does not exist.")
                else:
                    row["resolved_course_id"] = str(c_obj.id)
                    row["resolved_course_title"] = c_obj.title

            if trainer_ref:
                t_obj = await _resolve_trainer(db, trainer_ref)
                if not t_obj:
                    row_errors.append(f"Trainer '{trainer_ref}' does not exist.")
                else:
                    row["resolved_trainer_id"] = str(t_obj.id)
                    row["resolved_trainer_name"] = t_obj.name or t_obj.email

        # Determine status
        if is_duplicate:
            row_status = "duplicate"
            duplicate_count += 1
        elif row_errors:
            row_status = "invalid"
            invalid_count += 1
        else:
            row_status = "valid"
            valid_count += 1

        validated_rows.append({
            "row_index": idx,
            "data": row,
            "status": row_status,
            "errors": row_errors,
        })

    return {
        "enrollment_type": enrollment_type,
        "total_rows": len(data_rows),
        "valid_count": valid_count,
        "invalid_count": invalid_count,
        "duplicate_count": duplicate_count,
        "rows": validated_rows,
    }


async def _process_training_plan_import(
    db: AsyncSession,
    rows: list[dict[str, Any]],
    course_id: int,
) -> dict[str, Any]:
    """Import a complete training plan atomically for one existing course."""
    await db.rollback()
    successful_count = 0
    duplicate_count = 0
    results = []

    try:
        course = await db.get(Course, int(course_id))
        if not course:
            raise ValueError(f"Course with id {course_id} does not exist.")

        invalid_rows = [
            row for row in rows
            if row.get("status") == "invalid"
        ]
        if invalid_rows:
            details = " | ".join(
                f"row {row.get('row_index')}: {', '.join(row.get('errors', []))}"
                for row in invalid_rows
            )
            raise ValueError(f"Training plan validation failed: {details}")

        for row_item in rows:
            row_idx = row_item.get("row_index", 0)
            if row_item.get("status") == "duplicate":
                duplicate_count += 1
                results.append({
                    "row_index": row_idx,
                    "status": "Skipped",
                    "reason": "Duplicate training-plan row was skipped.",
                })
                continue

            data = row_item.get("data", {})
            day_number = data.get("resolved_day_number")
            skill = str(data.get("resolved_skill", "")).strip()
            title = str(data.get("topics", "")).strip()
            description = str(data.get("detailed_coverage", "")).strip()
            display_order = int(data.get("resolved_display_order"))
            duration_minutes = int(data.get("resolved_duration_minutes"))

            day_record = await db.scalar(
                select(CourseDay).where(
                    CourseDay.course_id == course.id,
                    CourseDay.day_number == day_number,
                )
            )
            if day_record is None:
                day_record = CourseDay(
                    course_id=course.id,
                    day_number=day_number,
                    title=skill,
                    description=skill,
                )
                db.add(day_record)
                await db.flush()
            else:
                day_record.title = skill
                day_record.description = skill

            existing_unit = await db.scalar(
                select(LearningUnit).where(
                    LearningUnit.day_id == day_record.id,
                    LearningUnit.display_order == display_order,
                )
            )
            if existing_unit is None:
                existing_unit = await db.scalar(
                    select(LearningUnit).where(
                        LearningUnit.day_id == day_record.id,
                        func.lower(LearningUnit.title) == title.lower(),
                    )
                )
            if existing_unit is not None:
                existing_unit.title = title
                existing_unit.description = description
                existing_unit.display_order = display_order
                existing_unit.duration_minutes = duration_minutes
                content = await db.scalar(
                    select(Content).where(Content.learning_unit_id == existing_unit.id)
                )
                if content is None:
                    db.add(Content(learning_unit_id=existing_unit.id, content_text=description))
                else:
                    content.content_text = description
                successful_count += 1
                results.append({
                    "row_index": row_idx,
                    "status": "Success",
                    "reason": f"Training plan row updated in course '{course.title}' on day {day_number}.",
                })
                continue

            learning_unit = LearningUnit(
                day_id=day_record.id,
                title=title,
                description=description,
                display_order=display_order,
                duration_minutes=duration_minutes,
            )
            db.add(learning_unit)
            await db.flush()
            db.add(Content(
                learning_unit_id=learning_unit.id,
                content_text=description,
            ))
            successful_count += 1
            results.append({
                "row_index": row_idx,
                "status": "Success",
                "reason": f"Training plan row assigned to course '{course.title}' on day {day_number}.",
            })

        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return {
        "enrollment_type": "training_plan",
        "total_records": len(rows),
        "successful_count": successful_count,
        "failed_count": 0,
        "duplicate_count": duplicate_count,
        "results": results,
    }


async def _process_mcq_import(
    db: AsyncSession,
    rows: list[dict[str, Any]],
    course_id: int,
) -> dict[str, Any]:
    """Insert validated, curriculum-mapped MCQs atomically."""
    results = []
    inserted_ids: list[int] = []
    valid_rows: list[dict[str, Any]] = []
    try:
        course = await db.get(Course, int(course_id))
        if not course:
            raise ValueError(f"Course with id {course_id} does not exist.")
        invalid_rows = [row for row in rows if row.get("status") in {"invalid", "duplicate"}]
        if invalid_rows:
            details = " | ".join(
                f"row {row.get('row_index')}: {', '.join(row.get('errors', []))}"
                for row in invalid_rows
            )
            raise ValueError(f"MCQ validation failed: {details}")

        valid_rows = [row for row in rows if row.get("status", "valid") == "valid"]
        if not valid_rows:
            raise ValueError("No validated MCQ rows were provided for import.")

        for row_item in valid_rows:
            row_idx = row_item.get("row_index", 0)
            data = row_item.get("data") or {}
            normalized_answers, answer_error = _normalize_mcq_answer_values(
                str(data.get("resolved_normalized_answer") or data.get("answer") or "").strip()
            )
            if answer_error or not normalized_answers:
                raise ValueError(f"Row {row_idx}: {answer_error or 'Answer is missing.'}")

            unit_id_raw = data.get("resolved_learning_unit_id") or data.get("learning_unit_id")
            unit_title = data.get("resolved_learning_unit_title")
            if not unit_id_raw:
                _day, unit, mapping_error = await _resolve_mcq_learning_unit(
                    db,
                    int(course_id),
                    str(data.get("subject_name", "")).strip(),
                    str(data.get("topic_name", "")).strip(),
                )
                if mapping_error or not unit:
                    raise ValueError(f"Row {row_idx}: {mapping_error or 'Learning unit could not be resolved.'}")
                unit_id_raw = unit.id
                unit_title = unit.title

            options = {
                "A": str(data.get("ans1", "")).strip(),
                "B": str(data.get("ans2", "")).strip(),
                "C": str(data.get("ans3", "")).strip(),
                "D": str(data.get("ans4", "")).strip(),
            }
            correct_answer = ",".join(sorted(normalized_answers))
            correct_answer_text = ", ".join(
                options[letter] for letter in sorted(normalized_answers) if options.get(letter)
            )
            question_row = MCQQuestionBank(
                course_id=int(data.get("resolved_course_id") or course_id),
                learning_unit_id=int(unit_id_raw),
                category=str(data.get("subject_name", "")).strip(),
                topic=str(data.get("topic_name", "")).strip(),
                subtopic=str(data.get("sub_topic_name", "")).strip() or None,
                question_text=str(data.get("question", "")).strip(),
                option_a=options["A"],
                option_b=options["B"],
                option_c=options["C"],
                option_d=options["D"],
                correct_answer=correct_answer,
                correct_answer_text=correct_answer_text,
                explanation=str(data.get("explanation", "")).strip(),
                difficulty=str(data.get("difficulty", "MEDIUM")).strip().upper(),
                question_type="MSQ" if len(normalized_answers) > 1 else "MCQ",
                is_active=True,
            )
            db.add(question_row)
            await db.flush()
            inserted_ids.append(question_row.id)
            results.append({
                "row_index": row_idx,
                "status": "Success",
                "reason": f"MCQ imported into course '{course.title}' and learning unit '{unit_title}'.",
                "mcq_id": question_row.id,
            })

        await db.commit()
    except Exception:
        await db.rollback()
        raise

    persisted_ids = (
        await db.execute(select(MCQQuestionBank.id).where(MCQQuestionBank.id.in_(inserted_ids)))
    ).scalars().all() if inserted_ids else []
    successful_count = len(persisted_ids)
    if successful_count != len(inserted_ids):
        raise ValueError(
            f"MCQ import did not persist all rows. Inserted {successful_count} of {len(inserted_ids)}."
        )

    return {
        "enrollment_type": "question_bank",
        "total_records": len(valid_rows),
        "successful_count": successful_count,
        "failed_count": 0,
        "duplicate_count": 0,
        "inserted_ids": persisted_ids,
        "results": results,
    }


async def process_mass_import(
    db: AsyncSession,
    enrollment_type: str,
    rows: list[dict[str, Any]],
    course_id: int | None = None,
    created_by: int = 1,
) -> dict[str, Any]:
    """
    Executes database insertion for validated rows.
    Returns row-level results report.
    """
    enrollment_type = enrollment_type.lower()
    successful_count = 0
    failed_count = 0
    duplicate_count = 0
    results = []

    if enrollment_type == "training_plan" and not course_id:
        raise ValueError("A course must be selected before importing a training plan.")

    if enrollment_type == "training_plan":
        return await _process_training_plan_import(db, rows, int(course_id))

    if enrollment_type == "question_bank":
        if not course_id:
            raise ValueError("A course must be selected before importing MCQs.")
        return await _process_mcq_import(db, rows, int(course_id))

    for row_item in rows:
        row_idx = row_item.get("row_index", 0)
        data = row_item.get("data", {})
        status = row_item.get("status", "valid")

        if status in ["invalid", "duplicate"]:
            failed_count += 1
            if status == "duplicate":
                duplicate_count += 1
            results.append({
                "row_index": row_idx,
                "status": "Failed",
                "reason": " | ".join(row_item.get("errors", ["Validation failure"])),
            })
            continue

        try:
            if enrollment_type == "question_bank":
                normalized_answers, answer_error = _normalize_mcq_answer_values(str(data.get("answer", "")).strip())
                if answer_error:
                    raise ValueError(answer_error)

                selected_answers = sorted(normalized_answers)
                correct_answer_value = ",".join(selected_answers) if len(selected_answers) > 1 else (selected_answers[0] if selected_answers else "")
                if not correct_answer_value:
                    raise ValueError("No valid correct answer could be resolved from the uploaded answer field.")

                question_text = str(data.get("question", "")).strip()
                option_a = str(data.get("ans1", "")).strip()
                option_b = str(data.get("ans2", "")).strip()
                option_c = str(data.get("ans3", "")).strip()
                option_d = str(data.get("ans4", "")).strip()
                subject_name = str(data.get("subject_name", "")).strip() or "General"
                topic_name = str(data.get("topic_name", "")).strip() or subject_name
                sub_topic_name = str(data.get("sub_topic_name", "")).strip() or None
                difficulty = str(data.get("difficulty", "MEDIUM")).strip().upper() or "MEDIUM"
                explanation = str(data.get("explanation", "")).strip()

                question_row = MCQQuestionBank(
                    course_id=int(course_id) if course_id else 1,
                    category=subject_name,
                    topic=topic_name,
                    subtopic=sub_topic_name,
                    set_name=None,
                    question_no=None,
                    question_text=question_text,
                    option_a=option_a,
                    option_b=option_b,
                    option_c=option_c,
                    option_d=option_d,
                    correct_answer=correct_answer_value,
                    correct_answer_text=correct_answer_value,
                    explanation=explanation,
                    difficulty=difficulty,
                    question_type="Concept",
                    is_active=True,
                )
                db.add(question_row)
                await db.flush()

                successful_count += 1
                results.append({
                    "row_index": row_idx,
                    "status": "Success",
                    "reason": f"Question bank row imported into mcq_question_bank (ID: {question_row.id}).",
                })
                continue

            if enrollment_type == "trainees":
                emp_id = data.get("employee_id")
                name = data.get("name")
                email = data.get("email")
                college = data.get("college_name")
                password = data.get("password")
                course_id = data.get("resolved_course_id")

                # Double-check existing user in DB
                existing = await db.scalar(
                    select(User).where(or_(User.email == email, User.employee_id == emp_id))
                )
                if existing:
                    failed_count += 1
                    duplicate_count += 1
                    results.append({
                        "row_index": row_idx,
                        "status": "Failed",
                        "reason": f"User with email '{email}' or employee_id '{emp_id}' already exists.",
                    })
                    continue

                user = User(
                    employee_id=emp_id,
                    name=name,
                    email=email,
                    college_name=college,
                    role="trainee",
                    is_active=False,
                    password_hash=hash_password(password) if password else None,
                    password_changed_at=datetime.utcnow() if password else None,
                )
                db.add(user)
                await db.flush()

                if course_id:
                    enrollment = Enrollment(user_id=user.id, course_id=int(course_id))
                    db.add(enrollment)

                token_obj = await generate_activation_token(db, user.id)
                activation_link = build_activation_link(token_obj.token, user.email)
                await send_activation_email(user.email, activation_link, user.name)

                successful_count += 1
                results.append({
                    "row_index": row_idx,
                    "status": "Success",
                    "reason": f"Trainee '{name}' created successfully (ID: {user.id}).",
                })

            elif enrollment_type == "trainers":
                emp_id = data.get("employee_id")
                name = data.get("name")
                email = data.get("email")
                password = data.get("password")

                existing = await db.scalar(
                    select(User).where(or_(User.email == email, User.employee_id == emp_id))
                )
                if existing:
                    failed_count += 1
                    duplicate_count += 1
                    results.append({
                        "row_index": row_idx,
                        "status": "Failed",
                        "reason": f"User with email '{email}' or employee_id '{emp_id}' already exists.",
                    })
                    continue

                user = User(
                    employee_id=emp_id,
                    name=name,
                    email=email,
                    role="trainer",
                    is_active=True,
                    password_hash=hash_password(password),
                    password_changed_at=datetime.utcnow(),
                )
                db.add(user)
                await db.flush()

                successful_count += 1
                results.append({
                    "row_index": row_idx,
                    "status": "Success",
                    "reason": f"Trainer '{name}' created successfully (ID: {user.id}).",
                })

            elif enrollment_type == "batches":
                bname = data.get("name")
                course_id = data.get("resolved_course_id")
                trainer_id = data.get("resolved_trainer_id")
                college = data.get("college_name")
                s_date_str = data.get("start_date")
                e_date_str = data.get("end_date")
                s_time_str = data.get("start_time")
                e_time_str = data.get("end_time")
                max_str = data.get("max_strength")

                existing_b = await db.scalar(select(Batch).where(func.lower(Batch.name) == bname.lower()))
                if existing_b:
                    failed_count += 1
                    duplicate_count += 1
                    results.append({
                        "row_index": row_idx,
                        "status": "Failed",
                        "reason": f"Batch '{bname}' already exists.",
                    })
                    continue

                s_date = datetime.strptime(s_date_str, "%Y-%m-%d").date()
                e_date = datetime.strptime(e_date_str, "%Y-%m-%d").date()

                s_time = None
                if s_time_str:
                    try:
                        s_time = datetime.strptime(s_time_str, "%H:%M:%S").time()
                    except ValueError:
                        try:
                            s_time = datetime.strptime(s_time_str, "%H:%M").time()
                        except ValueError:
                            pass

                e_time = None
                if e_time_str:
                    try:
                        e_time = datetime.strptime(e_time_str, "%H:%M:%S").time()
                    except ValueError:
                        try:
                            e_time = datetime.strptime(e_time_str, "%H:%M").time()
                        except ValueError:
                            pass

                capacity = int(max_str) if max_str and max_str.isdigit() else 30

                batch = Batch(
                    name=bname,
                    course_id=int(course_id),
                    trainer_id=int(trainer_id) if trainer_id else None,
                    college_name=college,
                    start_date=s_date,
                    end_date=e_date,
                    start_time=s_time,
                    end_time=e_time,
                    max_strength=capacity,
                    status=calculate_batch_status(s_date, e_date),
                    created_by=created_by,
                )
                db.add(batch)
                await db.flush()

                successful_count += 1
                results.append({
                    "row_index": row_idx,
                    "status": "Success",
                    "reason": f"Batch '{bname}' created successfully (ID: {batch.id}).",
                })

        except Exception as exc:
            failed_count += 1
            results.append({
                "row_index": row_idx,
                "status": "Failed",
                "reason": f"Database error: {str(exc)}",
            })

    # Commit all successful inserts atomically
    await db.commit()

    return {
        "enrollment_type": enrollment_type,
        "total_records": len(rows),
        "successful_count": successful_count,
        "failed_count": failed_count,
        "duplicate_count": duplicate_count,
        "results": results,
    }
