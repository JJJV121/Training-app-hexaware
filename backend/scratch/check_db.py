import asyncio
import sys

sys.path.insert(0, r"c:\Training-app-hexaware\backend")
from app.database.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'live_sessions'"))
        cols = [r[0] for r in res.fetchall()]
        print('live_sessions columns:', cols)

if __name__ == "__main__":
    asyncio.run(check())
