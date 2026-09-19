import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
import app.models  # Registers all models

from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.services.report_service import (
    get_trainee_report_card,
    get_batch_report_cards,
    update_report_override,
)
from app.services.trainer_ranking_service import get_batch_candidate_rankings
from app.utils.excel_generator import generate_single_trainee_excel, generate_batch_excel
from app.utils.pdf_generator import generate_single_trainee_pdf, generate_batch_pdf_zip
from app.models.course_trainee_feedback import CourseTraineeFeedback
from app.models.trainer_evaluation import TrainerEvaluation
from sqlalchemy import select


async def run_verification():
    print("=" * 60)
    print("STARTING COMPLETE FEEDBACK & REPORT CARD MODULE INTEGRATION TEST")
    print("=" * 60)

    # 1. Sync Database Schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database schema synchronized with new feedback and report override tables.")

    async with AsyncSessionLocal() as db:
        # 2. Fetch a Trainee and Batch
        bt_stmt = select(BatchTrainee).limit(1)
        bt = await db.scalar(bt_stmt)

        if not bt:
            print("[WARN] No batch trainee found in DB to test report card.")
            return

        trainee_id = bt.trainee_id
        batch_id = bt.batch_id

        trainee = await db.get(User, trainee_id)
        batch = await db.get(Batch, batch_id)

        print(f"[OK] Found Test Trainee: '{trainee.name}' (ID: {trainee.id}) in Batch: '{batch.name}' (ID: {batch.id})")

        # 3. Test Trainee Feedback Creation
        existing_tfb = await db.scalar(select(CourseTraineeFeedback).where(
            CourseTraineeFeedback.trainee_id == trainee_id,
            CourseTraineeFeedback.batch_id == batch_id
        ))

        if not existing_tfb:
            tfb = CourseTraineeFeedback(
                trainee_id=trainee_id,
                batch_id=batch_id,
                course_id=batch.course_id or 1,
                trainer_id=batch.trainer_id,
                video_rating=5,
                video_comment="Excellent video quality and pacing.",
                practice_rating=4,
                practice_comment="Good practice MCQs.",
                coding_rating=5,
                coding_comment="Challenging real-world coding problems.",
                trainer_support_rating=5,
                trainer_support_comment="Trainer clarifies all doubts quickly.",
                overall_rating=5,
                liked_comment="Hands-on coding labs and live problem solving.",
                improvement_comment="More mock assessments.",
                overall_comment="Great overall foundation course.",
            )
            db.add(tfb)
            await db.commit()
            print("[OK] Trainee Feedback submitted and persisted to DB.")

        # 4. Test Trainer Evaluation Creation
        existing_trev = await db.scalar(select(TrainerEvaluation).where(
            TrainerEvaluation.trainee_id == trainee_id,
            TrainerEvaluation.batch_id == batch_id
        ))

        if not existing_trev:
            trev = TrainerEvaluation(
                trainer_id=batch.trainer_id or 1,
                trainee_id=trainee_id,
                batch_id=batch_id,
                course_id=batch.course_id,
                technical_skills_rating=5,
                problem_solving_rating=5,
                communication_rating=4,
                learning_attitude_rating=5,
                participation_rating=5,
                overall_rating=5,
                strengths="Strong logic and consistent submission discipline.",
                areas_for_improvement="Practice edge-case error handling.",
                comments="Top performer in daily assignments.",
            )
            db.add(trev)
            await db.commit()
            print("[OK] Trainer Evaluation submitted and persisted to DB.")

        # 5. Test Performance Report Card Generator
        card = await get_trainee_report_card(db, trainee_id, batch_id)
        assert "personal_info" in card
        assert "performance_metrics" in card
        assert "attendance" in card
        assert "trainer_feedback" in card
        assert "trainee_feedback" in card

        print(f"[OK] Trainee Performance Report Card generated successfully.")
        print(f"     - Superset ID: {card['personal_info']['superset_id']}")
        print(f"     - Foundation Language: {card['personal_info']['foundation_language']}")
        print(f"     - Attendance %: {card['attendance']['percentage']}")
        print(f"     - Ranking: {card['performance_metrics']['ranking_details']}")
        print(f"     - Training Status: {card['personal_info']['training_status']}")

        # 6. Test Batch Report Cards Generator
        batch_cards = await get_batch_report_cards(db, batch_id)
        print(f"[OK] Generated {len(batch_cards)} report cards for batch '{batch.name}'.")

        # 7. Test Excel & PDF Generators
        excel_bytes = generate_single_trainee_excel(card)
        assert len(excel_bytes) > 0
        print(f"[OK] Single Trainee Excel workbook generated ({len(excel_bytes)} bytes).")

        pdf_bytes = generate_single_trainee_pdf(card)
        assert len(pdf_bytes) > 0
        print(f"[OK] Printable HTML/PDF report card generated ({len(pdf_bytes)} bytes).")

        batch_excel_bytes = generate_batch_excel(batch_cards, batch_name=batch.name)
        assert len(batch_excel_bytes) > 0
        print(f"[OK] Batch Excel multi-tab workbook generated ({len(batch_excel_bytes)} bytes).")

        zip_bytes = generate_batch_pdf_zip(batch_cards, excel_bytes=batch_excel_bytes)
        assert len(zip_bytes) > 0
        print(f"[OK] Bulk ZIP Archive generated ({len(zip_bytes)} bytes).")

        # 8. Test Custom Comment Override Update
        override = await update_report_override(
            db,
            trainee_id=trainee_id,
            batch_id=batch_id,
            comment_reason="Consistently excellent performance and 100% attendance record",
            final_status_override="COMPLETED",
            current_user_id=1,
        )
        print(f"[OK] Report Override updated successfully. ID: {override.id}, Status: {override.final_status_override}")

    print("=" * 60)
    print("ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_verification())
