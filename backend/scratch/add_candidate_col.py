import asyncio
import sys

sys.path.insert(0, r"c:\Training-app-hexaware\backend")
from app.database.session import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        print("Ensuring candidate_id column exists on live_sessions table...")
        await db.execute(text("ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS candidate_id INTEGER REFERENCES users(id);"))
        await db.commit()
        print("Column candidate_id verified successfully!")

if __name__ == "__main__":
    asyncio.run(main())
