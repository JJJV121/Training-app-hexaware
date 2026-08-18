import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.services import messaging_service


async def verify_tester_e2e():
    print("==================================================")
    print("   VERIFYING TESTER & TRAINER 3 END-TO-END")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # 1. Fetch tester@example.com (User ID 4)
        res_t = await db.execute(select(User).where(User.email == "tester@example.com"))
        tester = res_t.scalars().first()
        assert tester is not None, "tester@example.com missing!"

        # 2. Fetch trainer3@example.com (User ID 30)
        res_tr3 = await db.execute(select(User).where(User.email == "trainer3@example.com"))
        trainer3 = res_tr3.scalars().first()
        assert trainer3 is not None, "trainer3@example.com missing!"

        print(f"[OK] Tester: {tester.name} ({tester.email}, ID: {tester.id})")
        print(f"[OK] Trainer 3: {trainer3.name} ({trainer3.email}, ID: {trainer3.id})")

        # 3. Test Authorized Contacts for Tester
        contacts = await messaging_service.get_authorized_contacts_for_user(db, tester)
        contact_ids = [c["id"] for c in contacts]
        print(f"[OK] Authorized Mentor Contacts for Tester: {[c['name'] for c in contacts]}")
        assert trainer3.id in contact_ids, "Trainer 3 is NOT in tester's authorized contacts!"

        # 4. Test Direct Conversation
        convs = await messaging_service.get_user_conversations(db, tester)
        direct_convs = [c for c in convs if c["conversation_type"] == "DIRECT"]
        print(f"[OK] Direct conversations for Tester: {len(direct_convs)}")
        assert len(direct_convs) > 0, "No direct conversation found for tester!"

        # 5. Test Communities Membership
        communities = await messaging_service.get_all_communities(db, tester)
        member_comms = [c for c in communities if c["is_member"]]
        print(f"[OK] Tester is member of {len(member_comms)} / {len(communities)} communities:")
        for c in member_comms:
            print(f"  - {c['name']} (Conversation ID: {c['conversation_id']})")
        assert len(member_comms) == len(communities), "Tester should be member of all communities!"

        print("\n==================================================")
        print("   ALL END-TO-END VERIFICATIONS PASSED 100%!")
        print("==================================================")


if __name__ == "__main__":
    asyncio.run(verify_tester_e2e())
