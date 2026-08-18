import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password


async def check_pw():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).order_by(User.id.asc()))
        users = res.scalars().all()
        print("=== USER PASSWORDS IN DATABASE ===")
        for u in users:
            pw_sample = u.password_hash[:25] + "..." if u.password_hash else "None"
            print(f"ID: {u.id:<3} | Email: {u.email:<30} | Role: {u.role:<8} | PW Hash: {pw_sample}")

if __name__ == "__main__":
    asyncio.run(check_pw())
