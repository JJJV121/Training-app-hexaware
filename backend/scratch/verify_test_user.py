import asyncio
import sys
import os
import bcrypt

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password


async def test_accounts():
    async with AsyncSessionLocal() as db:
        test_cases = [
            ("eighteen@example.com", "eighteen@1234"),
            ("twentyone@example.com", "twentyone@1234"),
            ("tester@example.com", "tester@1234"),
            ("trainer3@example.com", "trainer3@1234"),
        ]

        print("=== VERIFYING PASSWORD MATCHES ===")
        for email, plain_pw in test_cases:
            u_res = await db.execute(select(User).where(User.email == email))
            u = u_res.scalars().first()

            if u:
                match = verify_password(plain_pw, u.password_hash)
                print(f"Email: {u.email:<25} | Password Tried: {plain_pw:<15} | Active: {u.is_active} | Role: {u.role} | PASSWORD MATCH: {match}")
            else:
                print(f"Email: {email:<25} | USER NOT FOUND")

if __name__ == "__main__":
    asyncio.run(test_accounts())
