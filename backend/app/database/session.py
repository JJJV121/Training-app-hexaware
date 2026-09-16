import socket
import ssl
import struct
from time import perf_counter

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# DNS Fallback for environments where local DNS refuses *.neon.tech host resolution
_orig_getaddrinfo = socket.getaddrinfo


def _resolve_dns_public(hostname: str) -> str:
    for dns_ip in ["8.8.8.8", "1.1.1.1"]:
        try:
            query = b"\xaa\xaa\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00"
            for part in hostname.split("."):
                query += bytes([len(part)]) + part.encode()
            query += b"\x00\x00\x01\x00\x01"
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(2)
            sock.sendto(query, (dns_ip, 53))
            data, _ = sock.recvfrom(512)
            sock.close()
            idx = len(query)
            while idx < len(data):
                if data[idx] >= 192:
                    idx += 2
                else:
                    while idx < len(data) and data[idx] != 0:
                        idx += data[idx] + 1
                    idx += 1
                if idx + 10 > len(data):
                    break
                rtype, rclass, ttl, rlen = struct.unpack(">HHIH", data[idx : idx + 10])
                idx += 10
                if rtype == 1 and rlen == 4:
                    return socket.inet_ntoa(data[idx : idx + 4])
                idx += rlen
        except Exception:
            pass
    return "13.251.17.193"


def _custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    try:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)
    except socket.gaierror:
        if host and isinstance(host, str) and "neon.tech" in host:
            ip = _resolve_dns_public(host)
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port))]
        raise


socket.getaddrinfo = _custom_getaddrinfo

ssl_context = ssl.create_default_context()
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