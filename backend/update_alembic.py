import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        try:
            res = await session.execute(text("SELECT version_num FROM alembic_version"))
            version = res.scalar()
            print(f"Current version in DB: {version}")
            
            await session.execute(text("UPDATE alembic_version SET version_num = '24dbd16240b3'"))
            await session.commit()
            print("Successfully updated alembic_version to '24dbd16240b3'")
            
            res = await session.execute(text("SELECT version_num FROM alembic_version"))
            version = res.scalar()
            print(f"New version in DB: {version}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
