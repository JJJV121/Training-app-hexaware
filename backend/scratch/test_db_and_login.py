import asyncio
import sys
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import login_user

class DummyClient:
    host = "127.0.0.1"

class DummyRequest:
    client = DummyClient()
    headers = {"user-agent": "test-agent"}

async def test_users():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        print(f"Total users found in DB: {len(users)}")
        
        # Test login with admin or student or test user if we know password or if we check hash
        # Let's see if we can log in with student@example.com / Password123! or similar
        req = DummyRequest()
        for test_email in ["student@example.com", "admin@hexaware.com", "user@example.com"]:
            try:
                # Let's test with password 'Password123!' or 'password' or whatever hash is set
                # First let's inspect password_hash algorithm
                user = await db.scalar(select(User).where(User.email == test_email))
                if user:
                    print(f"User {test_email} found. Role: {user.role}, Name: {user.name}")
            except Exception as e:
                print(f"Error checking {test_email}: {e}")

if __name__ == "__main__":
    asyncio.run(test_users())
