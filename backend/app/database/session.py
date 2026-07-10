import ssl
from time import perf_counter

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

# Remove URL query parameters since SSL is handled separately
if "?" in db_url:
    db_url = db_url.split("?", 1)[0]

engine = create_async_engine(
    db_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={
        "ssl": ssl_context,
        "server_settings": {
            "search_path": "public",
        },
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def test_connection():
    print("Testing Neon DB connection...")

    start = perf_counter()

    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))

    elapsed = perf_counter() - start
    print(f"DB Connection Time: {elapsed:.3f} seconds")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session