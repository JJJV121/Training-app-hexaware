import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password


async def reset_passwords():
    print("==========================================")
    print("   SETTING SPECIFIC TRAINEE PASSWORDS")
    print("==========================================")

    async with AsyncSessionLocal() as db:
        # Update eighteen@example.com and twentyone@example.com
        res = await db.execute(select(User).where(User.email.in_(["eighteen@example.com", "twentyone@example.com"])))
        users = res.scalars().all()

        for u in users:
            prefix = u.email.split("@")[0]
            desired_pwd = f"{prefix}@1234"
            u.password_hash = hash_password(desired_pwd)
            u.is_active = True
            print(f"[OK] Set password for {u.email} to '{desired_pwd}' (Hash: {u.password_hash[:20]}...)")

        await db.commit()
        print("\n[OK] Passwords updated successfully in PostgreSQL database!")


if __name__ == "__main__":
    asyncio.run(reset_passwords())
