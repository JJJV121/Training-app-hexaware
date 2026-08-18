import asyncio
import sys
import os
import bcrypt

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User


async def test_pw_candidates():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email.in_(["eighteen@example.com", "twentyone@example.com", "tester@example.com", "trainer3@example.com"])))
        users = res.scalars().all()

        for u in users:
            prefix = u.email.split("@")[0]
            candidates = [
                f"{prefix}123",
                f"{prefix}@123",
                f"{prefix}@1234",
                f"{prefix}1234",
                f"{prefix}#123",
                "Password@123",
                "password123",
                "Admin@123",
                "Trainer@123",
                "Trainee@123",
                "123456",
                "password"
            ]

            matched = None
            if u.password_hash:
                for cand in candidates:
                    try:
                        if bcrypt.checkpw(cand.encode("utf-8"), u.password_hash.encode("utf-8")):
                            matched = cand
                            break
                    except Exception:
                        pass

            print(f"User: {u.email:<25} | Role: {u.role:<8} | Correct Plaintext Password: {matched or 'UNKNOWN'}")

if __name__ == "__main__":
    asyncio.run(test_pw_candidates())
