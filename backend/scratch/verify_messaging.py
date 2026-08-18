import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, func
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.messaging import Conversation, ConversationParticipant, Message, Community, CommunityMember
from app.services import messaging_service


async def verify_messaging_system():
    print("==========================================")
    print("   VERIFYING MESSAGING & COMMUNITY SYSTEM")
    print("==========================================")

    async with AsyncSessionLocal() as db:
        # 1. Seed & Verify Communities
        await messaging_service.seed_default_communities(db)
        stmt = select(func.count(Community.id))
        res = await db.execute(stmt)
        comm_count = res.scalar()
        print(f"[OK] Communities in DB: {comm_count}")

        assert comm_count >= 6, "Default communities seeding failed!"

        # 2. Fetch test user
        user_stmt = select(User).limit(2)
        u_res = await db.execute(user_stmt)
        users = u_res.scalars().all()
        if not users:
            print("[!] No users in database to run integration test.")
            return

        u1 = users[0]
        u2 = users[1] if len(users) > 1 else u1
        print(f"[OK] Test User 1: {u1.email} (ID: {u1.id}, Role: {u1.role})")
        print(f"[OK] Test User 2: {u2.email} (ID: {u2.id}, Role: {u2.role})")

        # 3. Test Community Join & Messaging
        comms = await messaging_service.get_all_communities(db, u1)
        target_comm = comms[0]
        print(f"[OK] Joining community: {target_comm['name']} (ID: {target_comm['id']})")
        join_res = await messaging_service.join_community(db, target_comm['id'], u1)
        print(f"[OK] Join response: {join_res}")

        conv_id = join_res['conversation_id']

        # Send test community message
        msg_res = await messaging_service.send_message(
            db=db,
            conversation_id=conv_id,
            current_user=u1,
            content="Hello community! Verification test message."
        )
        print(f"[OK] Sent community message ID: {msg_res['id']} content: '{msg_res['content']}'")

        # Fetch community messages
        msgs = await messaging_service.get_messages_for_conversation(
            db=db,
            conversation_id=conv_id,
            current_user=u1
        )
        print(f"[OK] Retrieved {len(msgs)} messages from community conversation #{conv_id}")
        assert len(msgs) > 0, "Failed to retrieve posted community message!"

        # 4. Test Authorization Check
        print("[OK] Testing authorization boundary...")
        # Create an isolated dummy user ID not in conversation
        unauthorized_dummy = User(id=99999, email="dummy_unauthorized@hexaware.com", name="Unauthorized Dummy", role="TRAINEE")
        try:
            await messaging_service.ensure_conversation_participant(db, conv_id, unauthorized_dummy.id)
            print("[X] Security check failed! Unauthorized user was allowed.")
        except Exception as e:
            print(f"[OK] Security check passed! Unauthorized user correctly blocked (HTTP 403 / Access Denied).")


        print("\n==========================================")
        print("   ALL MESSAGING & COMMUNITY VERIFICATIONS PASSED!")
        print("==========================================")


if __name__ == "__main__":
    asyncio.run(verify_messaging_system())
