import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import date, datetime
from sqlalchemy import select, and_
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.course import Course
from app.models.messaging import Community, CommunityMember, Conversation, ConversationParticipant
from app.services import messaging_service


async def seed_full_batch_and_community():
    print("==================================================")
    print("   END-TO-END BATCH & COMMUNITY SEEDING PROCESS")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # 1. Fetch tester@example.com and trainer3@example.com
        res_tester = await db.execute(select(User).where(User.email == "tester@example.com"))
        tester_user = res_tester.scalars().first()

        res_trainer3 = await db.execute(select(User).where(User.email == "trainer3@example.com"))
        trainer3_user = res_trainer3.scalars().first()

        if not tester_user:
            tester_user = User(
                email="tester@example.com",
                name="Tester Student",
                employee_id="TESTER_001",
                role="TRAINEE",
                is_active=True
            )
            db.add(tester_user)
            await db.flush()

        if not trainer3_user:
            trainer3_user = User(
                email="trainer3@example.com",
                name="trainer 3",
                employee_id="TRAINER_003",
                role="TRAINER",
                is_active=True
            )
            db.add(trainer3_user)
            await db.flush()

        tester_user.role = "TRAINEE"
        tester_user.is_active = True
        trainer3_user.role = "TRAINER"
        trainer3_user.is_active = True
        await db.flush()

        print(f"[OK] Tester User: {tester_user.name} ({tester_user.email}, ID: {tester_user.id})")
        print(f"[OK] Trainer 3 User: {trainer3_user.name} ({trainer3_user.email}, ID: {trainer3_user.id})")

        # 2. Get Course ID 1 (Java Training)
        res_c = await db.execute(select(Course).where(Course.id == 1))
        course_1 = res_c.scalars().first()
        if not course_1:
            course_1 = Course(id=1, name="Java Training", is_active=True)
            db.add(course_1)
            await db.flush()

        # 3. Create Batch for Course ID 1 assigned to Trainer 3
        batch_name = "Java Training Batch 2026 (Trainer 3)"
        res_b = await db.execute(
            select(Batch).where(and_(Batch.course_id == 1, Batch.trainer_id == trainer3_user.id))
        )
        java_batch = res_b.scalars().first()

        if not java_batch:
            java_batch = Batch(
                name=batch_name,
                course_id=1,
                trainer_id=trainer3_user.id,
                created_by=trainer3_user.id,
                start_date=date(2026, 1, 1),
                end_date=date(2026, 12, 31),
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(java_batch)
            await db.flush()
            print(f"[OK] Created Batch for Course ID 1: '{java_batch.name}' (ID: {java_batch.id})")
        else:
            print(f"[OK] Found existing Batch ID {java_batch.id}: '{java_batch.name}'")

        # 4. Enroll ALL student/trainee users into Java Batch
        res_all_trainees = await db.execute(
            select(User).where(User.role.ilike("%trainee%"))
        )
        all_trainees = res_all_trainees.scalars().all()
        trainee_ids = [t.id for t in all_trainees]

        # Bulk fetch existing BatchTrainees for this batch
        res_existing_bt = await db.execute(
            select(BatchTrainee.trainee_id).where(BatchTrainee.batch_id == java_batch.id)
        )
        existing_bt_set = set(res_existing_bt.scalars().all())

        enrolled_count = 0
        for t_id in trainee_ids:
            if t_id not in existing_bt_set:
                bt = BatchTrainee(
                    batch_id=java_batch.id,
                    trainee_id=t_id,
                    joined_at=datetime.utcnow()
                )
                db.add(bt)
                enrolled_count += 1

        await db.commit()
        print(f"[OK] Enrolled {enrolled_count} trainees into Batch '{java_batch.name}' with Trainer 3!")

        # 5. Enable/Pre-create direct 1-to-1 conversation between tester@example.com and trainer3@example.com
        print(f"[OK] Pre-creating direct conversation between {tester_user.email} and {trainer3_user.email}...")
        conv = await messaging_service.get_or_create_direct_conversation(
            db=db,
            current_user=tester_user,
            target_user_id=trainer3_user.id
        )
        print(f"[OK] Direct conversation ready: ID {conv.id}")

        # Send welcome message from Trainer 3 if chat is empty
        msgs = await messaging_service.get_messages_for_conversation(db, conv.id, tester_user)
        if len(msgs) == 0:
            welcome_msg = await messaging_service.send_message(
                db=db,
                conversation_id=conv.id,
                current_user=trainer3_user,
                content="Hello! I am trainer 3, your assigned mentor for Java Training. Feel free to ask any questions here."
            )
            print(f"[OK] Welcome message sent: '{welcome_msg['content']}'")

        # 6. Enable Community Training for all trainees
        await messaging_service.seed_default_communities(db)
        res_comms = await db.execute(select(Community))
        communities = res_comms.scalars().all()

        # Bulk fetch community members and conversation participants
        res_all_cm = await db.execute(select(CommunityMember.community_id, CommunityMember.user_id))
        cm_set = set(res_all_cm.all())

        res_all_cp = await db.execute(select(ConversationParticipant.conversation_id, ConversationParticipant.user_id))
        cp_set = set(res_all_cp.all())

        res_convs = await db.execute(select(Conversation).where(Conversation.conversation_type == "COMMUNITY"))
        comm_conv_map = {c.community_id: c.id for c in res_convs.scalars().all()}

        joined_comm_count = 0
        now = datetime.utcnow()

        for comm in communities:
            conv_id = comm_conv_map.get(comm.id)
            for t_id in trainee_ids:
                if (comm.id, t_id) not in cm_set:
                    db.add(CommunityMember(community_id=comm.id, user_id=t_id, joined_at=now))
                    joined_comm_count += 1

                if conv_id and (conv_id, t_id) not in cp_set:
                    db.add(ConversationParticipant(conversation_id=conv_id, user_id=t_id, joined_at=now, last_read_at=now))

        await db.commit()
        print(f"[OK] Added trainees to all {len(communities)} communities ({joined_comm_count} community memberships created)!")

        print("\n==================================================")
        print("   SUCCESS! END-TO-END SEEDING COMPLETE!")
        print("==================================================")


if __name__ == "__main__":
    asyncio.run(seed_full_batch_and_community())
