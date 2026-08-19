import os
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.video import Video
from app.models.lesson_qa import LessonQA
from app.models.assignment import Assignment, AssignmentType
from app.models.case_study import CaseStudy
from app.routers.generator_router import get_templated_suggestions

async def process_course_day(db: AsyncSession, course_id: int, day_id: int, commit: bool = True):
    from app.utils.cache_utils import cache_get, cache_set
    
    # Check cache first
    cache_key = f"day_processed:{day_id}"
    if await cache_get(cache_key):
        return

    # 1. Fetch Course and Day in a single joined query
    stmt_day = (
        select(CourseDay, Course)
        .join(Course, Course.id == CourseDay.course_id)
        .where(CourseDay.id == day_id)
    )
    res_day = await db.execute(stmt_day)
    row = res_day.first()
    if not row:
        return
    day, course = row

    # Fetch all learning units for this day
    stmt_units = select(LearningUnit).where(LearningUnit.day_id == day_id)
    units_res = await db.execute(stmt_units)
    units = units_res.scalars().all()
    unit_ids = [u.id for u in units]
    unit_titles = [u.title for u in units]

    # 2. Check existing Videos & Video Q&As in bulk
    if unit_ids:
        stmt_videos = select(Video).where(Video.learning_unit_id.in_(unit_ids))
        videos_res = await db.execute(stmt_videos)
        videos = videos_res.scalars().all()

        # Bulk fetch existing Q&As for these learning units
        stmt_qa = select(LessonQA).where(LessonQA.learning_unit_id.in_(unit_ids))
        qa_res = await db.execute(stmt_qa)
        existing_qas = {qa.learning_unit_id: qa for qa in qa_res.scalars().all()}

        for video in videos:
            if video.learning_unit_id not in existing_qas:
                # Generate video-specific Q&A based on its title
                suggestions = get_templated_suggestions(course.title, video.title, "")
                new_qa = LessonQA(
                    learning_unit_id=video.learning_unit_id,
                    question=suggestions["qa"]["question"],
                    answer=suggestions["qa"]["answer"]
                )
                db.add(new_qa)

    # Analyze course plan requirements using title, description, and unit topics
    plan_text = (day.title + " " + (day.description or "") + " " + " ".join(unit_titles)).lower()
    
    # Strict Training Plan assignment detection: Days 1 & 2 have no assignments specified.
    # Assignments exist ONLY where the Training Plan specifies Assignment Q&A, Assessment, Case Study, or Project.
    if day.day_number in [1, 2]:
        req_assignment = False
        req_assessment = False
        req_case_study = False
        req_project = False
    else:
        req_assignment = any(w in plan_text for w in ["assignment q&a", "assignment", "coding assignment"])
        req_assessment = any(w in plan_text for w in ["assessment", "coding challenge assessment", "coding challenge"])
        req_case_study = any(w in plan_text for w in ["case study", "case study q&a"])
        req_project = any(w in plan_text for w in ["project development", "project review", "project case study"])

    # Load templates/suggestions for the day
    suggestions = get_templated_suggestions(course.title, day.title, day.description)

    # Bulk fetch all assignments for this day
    stmt_asg = select(Assignment).where(Assignment.course_day_id == day_id)
    asg_res = await db.execute(stmt_asg)
    all_assignments = asg_res.scalars().all()

    existing_asg = None
    existing_assess = None
    existing_proj = None

    for asg in all_assignments:
        if asg.assignment_type in [AssignmentType.CODING, AssignmentType.NON_CODING] and not asg.title.startswith("Assessment:"):
            existing_asg = asg
        elif asg.title.startswith("Assessment:"):
            existing_assess = asg
        elif asg.assignment_type == AssignmentType.PROJECT:
            existing_proj = asg

    if not existing_asg and req_assignment:
        asg_type = AssignmentType.CODING if any(w in plan_text for w in ["coding", "sql", "queries", "java", "oop", "arrays", "collections", "program"]) else AssignmentType.NON_CODING
        
        attachment_path = None
        if asg_type == AssignmentType.NON_CODING:
            attachment_path = "assignment_files/starter_package.pdf"
            os.makedirs("assignment_files", exist_ok=True)
            if not os.path.exists(attachment_path):
                with open(attachment_path, "wb") as f:
                    f.write(b"%PDF-1.4\n%Mock Starter Package PDF Content")

        new_asg = Assignment(
            course_day_id=day_id,
            title=suggestions["assignment"]["title"],
            description=suggestions["assignment"]["description"],
            assignment_type=asg_type,
            instructions=suggestions["assignment"]["instructions"],
            total_marks=suggestions["assignment"]["total_marks"],
            passing_marks=suggestions["assignment"]["passing_marks"],
            due_date=datetime.utcnow() + timedelta(days=7),
            attachment_path=attachment_path,
            created_by=1
        )
        db.add(new_asg)

    if not existing_assess and req_assessment:
        assess_type = AssignmentType.CODING if any(w in plan_text for w in ["coding", "sql", "java", "oop", "program"]) else AssignmentType.NON_CODING
        new_assess = Assignment(
            course_day_id=day_id,
            title=f"Assessment: {day.title}",
            description=f"Assessment challenge evaluating your comprehension of {day.title}.",
            assignment_type=assess_type,
            instructions="Complete all questions or tasks within the allocated time limit.",
            total_marks=50,
            passing_marks=35,
            due_date=datetime.utcnow() + timedelta(days=5),
            created_by=1
        )
        db.add(new_assess)

    # 6. Check existing Case Study
    stmt_cs = select(CaseStudy).where(CaseStudy.course_day_id == day_id)
    cs_res = await db.execute(stmt_cs)
    existing_cs = cs_res.scalars().first()

    if not existing_cs and req_case_study:
        new_cs = CaseStudy(
            course_day_id=day_id,
            title=suggestions["case_study"]["title"],
            scenario=suggestions["case_study"]["scenario"],
            requirements=suggestions["case_study"]["requirements"],
            total_marks=suggestions["case_study"]["total_marks"],
            due_date=datetime.utcnow() + timedelta(days=10),
            created_by=1
        )
        db.add(new_cs)

    if not existing_proj and req_project:
        new_proj = Assignment(
            course_day_id=day_id,
            title=f"Project Build: {day.title} Application",
            description=f"Capstone project exercise requiring you to design, build, and deploy an application using {day.title}.",
            assignment_type=AssignmentType.PROJECT,
            instructions="1. Initialize a git repository.\n2. Implement the requirements document.\n3. Submit your repository link.",
            total_marks=100,
            passing_marks=80,
            due_date=datetime.utcnow() + timedelta(days=14),
            created_by=1
        )
        db.add(new_proj)

    if commit:
        await db.commit()
        await cache_set(cache_key, True, expire=86400)

