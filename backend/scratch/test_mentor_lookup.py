import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.services import messaging_service


async def test_lookup():
    async with AsyncSessionLocal() as db:
        # Test for User 4 (Tester Student)
        u_res = await db.execute(select(User).where(User.id == 4))
        u4 = u_res.scalars().first()
        if u4:
            contacts = await messaging_service.get_authorized_contacts_for_user(db, u4)
            print(f"Contacts for User 4 ({u4.name}): {contacts}")
        else:
            print("User 4 not found")

        # Test for Trainer 3 (User 30)
        t_res = await db.execute(select(User).where(User.id == 30))
        t3 = t_res.scalars().first()
        if t3:
            t_contacts = await messaging_service.get_authorized_contacts_for_user(db, t3)
            print(f"\nAssigned Trainees for Trainer 3 ({t3.name}): {len(t_contacts)} trainees")
            for c in t_contacts[:5]:
                print(f" - {c['name']} (ID: {c['id']}, Email: {c['email']})")

if __name__ == "__main__":
    asyncio.run(test_lookup())
