import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.batch import Batch
from app.models.batch_trainee import BatchTrainee
from app.models.live_session import LiveSession
from app.models.attendance_record import AttendanceRecord, AttendanceStatus

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Starting Trainer Module V2 Seeding...")

        # 1. Ensure Trainer One exists (or create)
        trainer_one_email = "trainer@example.com"
        result = await db.execute(select(User).where(User.email == trainer_one_email))
        trainer_one = result.scalar_one_or_none()
        if not trainer_one:
            trainer_one = User(
                employee_id="EMP240",
                name="Trainer One",
                email=trainer_one_email,
                role="TRAINER",
                is_active=True,
                password_hash="mock_hash"
            )
            db.add(trainer_one)
            await db.flush()
            print(f"Created trainer: {trainer_one_email}")
        else:
            # Make sure role is set to TRAINER and active
            trainer_one.role = "TRAINER"
            trainer_one.is_active = True
            await db.flush()
            print(f"Verified trainer: {trainer_one_email} (ID={trainer_one.id})")

        # 2. Ensure Trainer Two exists
        trainer_two_email = "trainer2@example.com"
        result = await db.execute(select(User).where(User.email == trainer_two_email))
        trainer_two = result.scalar_one_or_none()
        if not trainer_two:
            trainer_two = User(
                employee_id="EMP241",
                name="Trainer Two",
                email=trainer_two_email,
                role="TRAINER",
                is_active=True,
                password_hash="mock_hash"
            )
            db.add(trainer_two)
            await db.flush()
            print(f"Created trainer: {trainer_two_email}")
        else:
            trainer_two.role = "TRAINER"
            trainer_two.is_active = True
            await db.flush()
            print(f"Verified trainer: {trainer_two_email} (ID={trainer_two.id})")

        # 3. Ensure Courses exist (using existing where possible)
        result = await db.execute(select(Course).where(Course.title == "Java Training"))
        java_course = result.scalar_one_or_none()
        if not java_course:
            java_course = Course(
                title="Java Training",
                description="Java Programming Course",
                duration_days=30,
                thumbnail_url="http://example.com/java.png",
                is_active=True
            )
            db.add(java_course)
            await db.flush()
            print("Created Course: Java Training")

        result = await db.execute(select(Course).where(Course.title == "C# Training"))
        csharp_course = result.scalar_one_or_none()
        if not csharp_course:
            csharp_course = Course(
                title="C# Training",
                description="C# Programming Course",
                duration_days=30,
                thumbnail_url="http://example.com/csharp.png",
                is_active=True
            )
            db.add(csharp_course)
            await db.flush()
            print("Created Course: C# Training")

        # 4. Create Batches
        # Batch 1: Active Java Batch assigned to Trainer One
        result = await db.execute(select(Batch).where(Batch.name == "Java Alpha Batch"))
        batch_alpha = result.scalar_one_or_none()
        if not batch_alpha:
            batch_alpha = Batch(
                name="Java Alpha Batch",
                course_id=java_course.id,
                trainer_id=trainer_one.id,
                start_date=date(2026, 8, 1),
                end_date=date(2026, 9, 1),
                is_active=True
            )
            db.add(batch_alpha)
            await db.flush()
            print("Created Batch: Java Alpha Batch")

        # Batch 2: Inactive Java Batch assigned to Trainer Two
        result = await db.execute(select(Batch).where(Batch.name == "Java Beta Batch"))
        batch_beta = result.scalar_one_or_none()
        if not batch_beta:
            batch_beta = Batch(
                name="Java Beta Batch",
                course_id=java_course.id,
                trainer_id=trainer_two.id,
                start_date=date(2026, 7, 1),
                end_date=date(2026, 8, 1),
                is_active=False
            )
            db.add(batch_beta)
            await db.flush()
            print("Created Batch: Java Beta Batch")

        # Batch 3: Active C# Batch assigned to Trainer One
        result = await db.execute(select(Batch).where(Batch.name == "C# Gamma Batch"))
        batch_gamma = result.scalar_one_or_none()
        if not batch_gamma:
            batch_gamma = Batch(
                name="C# Gamma Batch",
                course_id=csharp_course.id,
                trainer_id=trainer_one.id,
                start_date=date(2026, 8, 5),
                end_date=date(2026, 9, 5),
                is_active=True
            )
            db.add(batch_gamma)
            await db.flush()
            print("Created Batch: C# Gamma Batch")

        # 5. Fetch some existing trainees
        result = await db.execute(select(User).where(User.role == "TRAINEE"))
        trainees = result.scalars().all()
        if len(trainees) < 10:
            print("Warning: less than 10 trainees found in DB. Creating extra mock trainees.")
            for i in range(len(trainees), 12):
                email = f"mock_trainee{i}@example.com"
                new_t = User(
                    employee_id=f"EMP_TRAIN_{i}",
                    name=f"Mock Trainee {i}",
                    email=email,
                    role="TRAINEE",
                    is_active=True,
                    password_hash="mock_hash"
                )
                db.add(new_t)
            await db.flush()
            result = await db.execute(select(User).where(User.role == "TRAINEE"))
            trainees = result.scalars().all()

        # Map Trainees to Batches
        # Java Alpha Batch gets trainees 0-4
        for u in trainees[:5]:
            result = await db.execute(
                select(BatchTrainee).where(
                    BatchTrainee.batch_id == batch_alpha.id,
                    BatchTrainee.trainee_id == u.id
                )
            )
            if not result.scalar_one_or_none():
                db.add(BatchTrainee(batch_id=batch_alpha.id, trainee_id=u.id, joined_at=datetime.utcnow() - timedelta(days=12)))
        
        # Java Beta Batch gets trainees 5-8
        for u in trainees[5:9]:
            result = await db.execute(
                select(BatchTrainee).where(
                    BatchTrainee.batch_id == batch_beta.id,
                    BatchTrainee.trainee_id == u.id
                )
            )
            if not result.scalar_one_or_none():
                db.add(BatchTrainee(batch_id=batch_beta.id, trainee_id=u.id, joined_at=datetime.utcnow() - timedelta(days=40)))

        # C# Gamma Batch gets trainees 9-11 (or whatever is available)
        for u in trainees[9:12]:
            result = await db.execute(
                select(BatchTrainee).where(
                    BatchTrainee.batch_id == batch_gamma.id,
                    BatchTrainee.trainee_id == u.id
                )
            )
            if not result.scalar_one_or_none():
                db.add(BatchTrainee(batch_id=batch_gamma.id, trainee_id=u.id, joined_at=datetime.utcnow() - timedelta(days=8)))

        await db.flush()
        print("Mapped Trainees to Batches")

        # 6. Create Live Sessions
        # Session 1: Past Online Session (Java Alpha Batch)
        result = await db.execute(
            select(LiveSession).where(
                LiveSession.batch_id == batch_alpha.id,
                LiveSession.title == "Java Fundamentals"
            )
        )
        s1 = result.scalar_one_or_none()
        if not s1:
            s1 = LiveSession(
                title="Java Fundamentals",
                description="Introduction to Java basics and syntax",
                session_type="ONLINE",
                batch_id=batch_alpha.id,
                trainer_id=trainer_one.id,
                start_time=datetime.utcnow() - timedelta(days=3, hours=4),
                end_time=datetime.utcnow() - timedelta(days=3, hours=2),
                meeting_link="https://meet.google.com/abc-defg-hij"
            )
            db.add(s1)
            await db.flush()
            print("Created Session: Java Fundamentals (Past)")

        # Session 2: Current/Recent Offline Session (Java Alpha Batch)
        result = await db.execute(
            select(LiveSession).where(
                LiveSession.batch_id == batch_alpha.id,
                LiveSession.title == "OOP Concepts in Java"
            )
        )
        s2 = result.scalar_one_or_none()
        if not s2:
            s2 = LiveSession(
                title="OOP Concepts in Java",
                description="Classes, Objects, Inheritance, Polymorphism",
                session_type="OFFLINE",
                batch_id=batch_alpha.id,
                trainer_id=trainer_one.id,
                start_time=datetime.utcnow() - timedelta(hours=2),
                end_time=datetime.utcnow() + timedelta(hours=1),
                meeting_link=None
            )
            db.add(s2)
            await db.flush()
            print("Created Session: OOP Concepts in Java (Recent/Current)")

        # Session 3: Upcoming Online Session (Java Alpha Batch)
        result = await db.execute(
            select(LiveSession).where(
                LiveSession.batch_id == batch_alpha.id,
                LiveSession.title == "Collections Framework"
            )
        )
        s3 = result.scalar_one_or_none()
        if not s3:
            s3 = LiveSession(
                title="Collections Framework",
                description="List, Set, Map interfaces and classes",
                session_type="ONLINE",
                batch_id=batch_alpha.id,
                trainer_id=trainer_one.id,
                start_time=datetime.utcnow() + timedelta(days=2),
                end_time=datetime.utcnow() + timedelta(days=2, hours=2),
                meeting_link="https://meet.google.com/xyz-pdqr-lmn"
            )
            db.add(s3)
            await db.flush()
            print("Created Session: Collections Framework (Upcoming)")

        # Session 4: Past Online Session (Java Beta Batch - Inactive)
        result = await db.execute(
            select(LiveSession).where(
                LiveSession.batch_id == batch_beta.id,
                LiveSession.title == "Java Introduction Recap"
            )
        )
        s4 = result.scalar_one_or_none()
        if not s4:
            s4 = LiveSession(
                title="Java Introduction Recap",
                description="Basics wrap-up",
                session_type="ONLINE",
                batch_id=batch_beta.id,
                trainer_id=trainer_two.id,
                start_time=datetime.utcnow() - timedelta(days=20),
                end_time=datetime.utcnow() - timedelta(days=20, hours=2),
                meeting_link="https://meet.google.com/old-session"
            )
            db.add(s4)
            await db.flush()
            print("Created Session: Java Introduction Recap (Past)")

        # Session 5: Upcoming Offline Session (C# Gamma Batch)
        result = await db.execute(
            select(LiveSession).where(
                LiveSession.batch_id == batch_gamma.id,
                LiveSession.title == "C# Language Basics"
            )
        )
        s5 = result.scalar_one_or_none()
        if not s5:
            s5 = LiveSession(
                title="C# Language Basics",
                description="Variables, control structures, and loops",
                session_type="OFFLINE",
                batch_id=batch_gamma.id,
                trainer_id=trainer_one.id,
                start_time=datetime.utcnow() + timedelta(days=5),
                end_time=datetime.utcnow() + timedelta(days=5, hours=3),
                meeting_link=None
            )
            db.add(s5)
            await db.flush()
            print("Created Session: C# Language Basics (Upcoming)")

        # 7. Create Attendance Records
        # Attendance for Session 1 (Past)
        # Trainees 0, 1, 2 mapped to Java Alpha Batch
        alpha_trainee_ids = [u.id for u in trainees[:3]]
        statuses = ["PRESENT", "LATE", "ABSENT"]
        for idx, t_id in enumerate(alpha_trainee_ids):
            result = await db.execute(
                select(AttendanceRecord).where(
                    AttendanceRecord.session_id == s1.id,
                    AttendanceRecord.trainee_id == t_id
                )
            )
            if not result.scalar_one_or_none():
                db.add(AttendanceRecord(
                    session_id=s1.id,
                    trainee_id=t_id,
                    status=AttendanceStatus[statuses[idx]],
                    marked_at=s1.start_time + timedelta(minutes=15)
                ))

        # Attendance for Session 2 (Recent)
        for idx, t_id in enumerate(alpha_trainee_ids):
            result = await db.execute(
                select(AttendanceRecord).where(
                    AttendanceRecord.session_id == s2.id,
                    AttendanceRecord.trainee_id == t_id
                )
            )
            if not result.scalar_one_or_none():
                db.add(AttendanceRecord(
                    session_id=s2.id,
                    trainee_id=t_id,
                    status=AttendanceStatus.PRESENT,
                    marked_at=s2.start_time + timedelta(minutes=5)
                ))

        # Attendance for Session 4 (Past, Java Beta Batch)
        beta_trainee_ids = [u.id for u in trainees[5:7]]
        statuses_beta = ["PRESENT", "ABSENT"]
        for idx, t_id in enumerate(beta_trainee_ids):
            result = await db.execute(
                select(AttendanceRecord).where(
                    AttendanceRecord.session_id == s4.id,
                    AttendanceRecord.trainee_id == t_id
                )
            )
            if not result.scalar_one_or_none():
                db.add(AttendanceRecord(
                    session_id=s4.id,
                    trainee_id=t_id,
                    status=AttendanceStatus[statuses_beta[idx]],
                    marked_at=s4.start_time + timedelta(minutes=10)
                ))

        await db.commit()
        print("Trainer Module V2 Seeding completed successfully and is fully idempotent!")

if __name__ == "__main__":
    asyncio.run(seed_data())
