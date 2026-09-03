import csv
import io
import re
from datetime import datetime, date, time
from typing import Any

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.course import Course
from app.models.batch_models import Batch, BatchTrainee
from app.models.enrollment import Enrollment
from app.core.security import hash_password
from app.core.password_validation import validate_password_syntax
from app.services.batch_service import calculate_batch_status


EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def get_csv_template(enrollment_type: str) -> str:
    """Generates sample CSV template content with headers and an example row."""
    enrollment_type = enrollment_type.lower()
    
    if enrollment_type == "trainees":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["employee_id", "name", "email", "college_name", "password", "course_id_or_title", "batch_id_or_name"])
        writer.writerow(["EMP1001", "Jane Trainee", "jane.trainee@hexaware.com", "Hexaware Academy", "Pass@12345678", "1", "Batch Alpha 2026"])
        return output.getvalue()

    elif enrollment_type == "trainers":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["employee_id", "name", "email", "password", "college_name", "course_id_or_title"])
        writer.writerow(["TRN1001", "John Trainer", "john.trainer@hexaware.com", "SecurePass@123", "Hexaware Corp", "1"])
        return output.getvalue()

    elif enrollment_type == "batches":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["name", "course_id_or_title", "trainer_id_or_email", "college_name", "start_date", "end_date", "start_time", "end_time", "max_strength"])
        writer.writerow(["Batch Alpha 2026", "1", "john.trainer@hexaware.com", "Hexaware Academy", "2026-10-01", "2026-11-15", "09:00:00", "17:00:00", "30"])
        return output.getvalue()

    else:
        raise ValueError("Invalid enrollment type specified")


def _normalize_headers(raw_headers: list[str]) -> dict[str, str]:
    """Maps raw CSV header names to standard internal field keys."""
    header_map = {}
    for original in raw_headers:
        cleaned = original.strip().lower().replace(" ", "_").replace("-", "_")
        
        if cleaned in ["employee_id", "employeeid", "emp_id", "empid", "user_id"]:
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
        else:
            header_map[original] = cleaned
            
    return header_map


def _parse_csv_content(csv_file_bytes: bytes) -> tuple[list[str], list[dict[str, str]]]:
    """Parses binary CSV content handling UTF-8/BOM, quotes, empty lines."""
    try:
        text = csv_file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = csv_file_bytes.decode("latin-1")

    # Standardize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    
    stream = io.StringIO(text)
    reader = csv.reader(stream)
    
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    if not rows:
        raise ValueError("CSV file is empty")

    raw_headers = [h.strip() for h in rows[0]]
    header_mapping = _normalize_headers(raw_headers)
    
    data_rows = []
    for raw_row in rows[1:]:
        row_dict = {}
        for idx, header in enumerate(raw_headers):
            key = header_mapping[header]
            val = raw_row[idx].strip() if idx < len(raw_row) else ""
            row_dict[key] = val
        data_rows.append(row_dict)

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


async def _resolve_batch(db: AsyncSession, batch_ref: str) -> Batch | None:
    """Finds a batch by integer ID or name."""
    if not batch_ref:
        return None

    if batch_ref.isdigit():
        batch = await db.get(Batch, int(batch_ref))
        if batch:
            return batch

    result = await db.execute(
        select(Batch).where(func.lower(Batch.name) == batch_ref.lower())
    )
    return result.scalar_one_or_none()


async def validate_csv_upload(
    db: AsyncSession,
    enrollment_type: str,
    file_bytes: bytes,
) -> dict[str, Any]:
    """
    Parses and validates CSV content for Trainees, Trainers, or Batches.
    Returns preview data with status, error details, and summary statistics.
    """
    enrollment_type = enrollment_type.lower()
    if enrollment_type not in ["trainees", "trainers", "batches"]:
        raise ValueError("Invalid enrollment type. Must be 'trainees', 'trainers', or 'batches'.")

    headers, data_rows = _parse_csv_content(file_bytes)
    
    # Pre-fetch existing DB identifiers for fast lookup
    existing_emails = set()
    existing_employee_ids = set()
    existing_batch_names = set()

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

    seen_emails_in_file = set()
    seen_employee_ids_in_file = set()
    seen_batch_names_in_file = set()

    validated_rows = []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for idx, row in enumerate(data_rows, start=2): # Row 1 is header
        row_errors = []
        is_duplicate = False

        if enrollment_type == "trainees":
            emp_id = row.get("employee_id", "").strip()
            name = row.get("name", "").strip()
            email = row.get("email", "").strip()
            password = row.get("password", "").strip()
            course_ref = row.get("course", "").strip()
            batch_ref = row.get("batch", "").strip()

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

            if batch_ref:
                b_obj = await _resolve_batch(db, batch_ref)
                if not b_obj:
                    row_errors.append(f"Batch '{batch_ref}' does not exist.")
                else:
                    row["resolved_batch_id"] = str(b_obj.id)
                    row["resolved_batch_name"] = b_obj.name

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


async def process_mass_import(
    db: AsyncSession,
    enrollment_type: str,
    rows: list[dict[str, Any]],
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
            if enrollment_type == "trainees":
                emp_id = data.get("employee_id")
                name = data.get("name")
                email = data.get("email")
                college = data.get("college_name")
                password = data.get("password")
                course_id = data.get("resolved_course_id")
                batch_id = data.get("resolved_batch_id")

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

                if batch_id:
                    bt = BatchTrainee(batch_id=int(batch_id), trainee_id=user.id)
                    db.add(bt)

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
                college = data.get("college_name")
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
                    college_name=college,
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
