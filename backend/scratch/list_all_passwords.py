import asyncio
import sys
import os
import bcrypt

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User


async def list_all_passwords():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).order_by(User.id.asc()))
        users = res.scalars().all()

        passwords_to_try = [
            "password123",
            "password",
            "tester@1234",
            "trainer3@1234",
            "trainer123",
            "admin123",
            "Password@123",
            "Admin@123"
        ]

        print("=== USER CREDENTIALS SUMMARY ===")
        for u in users:
            prefix = u.email.split("@")[0]
            candidates = [f"{prefix}@1234", f"{prefix}1234", f"{prefix}123"] + passwords_to_try
            
            matched = "UNKNOWN / CUSTOM"
            if u.password_hash:
                for cand in candidates:
                    try:
                        if bcrypt.checkpw(cand.encode("utf-8"), u.password_hash.encode("utf-8")):
                            matched = cand
                            break
                    except Exception:
                        pass
            else:
                matched = "NO PASSWORD SET"

            print(f"ID: {u.id:<3} | Email: {u.email:<30} | Role: {u.role:<8} | Password: {matched}")

if __name__ == "__main__":
    asyncio.run(list_all_passwords())
