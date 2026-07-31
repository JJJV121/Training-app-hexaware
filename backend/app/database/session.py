import ssl

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings


ssl_context = ssl.create_default_context()

print("=" * 80)
print("DATABASE_URL:", settings.DATABASE_URL)
print("=" * 80)

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if "?" in db_url:
    db_url = db_url.split("?", 1)[0]

engine = create_async_engine(
    db_url,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "ssl": ssl_context,
        "server_settings": {
            "search_path": "public"
        },
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def test_connection():
    async with engine.begin() as conn:
        result = await conn.execute(
            text("""
                SELECT
                    current_database(),
                    current_schema(),
                    current_setting('search_path')
            """)
        )
        print("DB INFO:", result.fetchone())

        result = await conn.execute(
            text("""
                SELECT table_schema, table_name
                FROM information_schema.tables
                WHERE table_name = 'users'
            """)
        )
        print("USERS:", result.fetchall())


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session