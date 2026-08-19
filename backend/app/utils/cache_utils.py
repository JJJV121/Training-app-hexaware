import redis.asyncio as redis
import os
import json
from typing import Any, Optional

# Singleton Redis client and fallback memory cache
_redis_client: Optional[redis.Redis] = None
_redis_disabled: bool = False
_memory_cache: dict[str, Any] = {}

def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client, _redis_disabled
    if _redis_disabled:
        return None
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        _redis_client = redis.from_url(redis_url, socket_connect_timeout=1.0, socket_timeout=1.0)
        return _redis_client
    except Exception as e:
        # Redis not available; graceful fallback
        print(f"[Cache Utils] Redis connection failed: {e}")
        _redis_disabled = True
        _redis_client = None
        return None

async def cache_get(key: str) -> Any:
    global _redis_disabled, _memory_cache
    if _redis_disabled:
        return _memory_cache.get(key)
    client = get_redis_client()
    if client is None:
        return _memory_cache.get(key)
    try:
        raw = await client.get(key)
        if raw is None:
            return _memory_cache.get(key)
        try:
            val = json.loads(raw)
            _memory_cache[key] = val
            return val
        except Exception:
            _memory_cache[key] = raw
            return raw
    except Exception as e:
        # Graceful fallback: disable Redis permanently for this run if connection fails
        print(f"[Cache Utils] Disabling Redis caching due to connection failure: {e}")
        _redis_disabled = True
        return _memory_cache.get(key)

async def cache_set(key: str, value: Any, expire: int = 300) -> None:
    global _redis_disabled, _memory_cache
    _memory_cache[key] = value
    if _redis_disabled:
        return
    client = get_redis_client()
    if client is None:
        return
    try:
        if not isinstance(value, str):
            value = json.dumps(value)
        await client.set(key, value, ex=expire)
    except Exception as e:
        # Graceful fallback: disable Redis permanently for this run if connection fails
        print(f"[Cache Utils] Disabling Redis caching due to connection failure: {e}")
        _redis_disabled = True

async def clear_course_cache(course_id: int) -> None:
    global _redis_disabled, _memory_cache
    # Clear from in-memory cache
    keys_to_clear = [key for key in _memory_cache if f"course_content:{course_id}" in key or f"course_processed:{course_id}" in key]
    for key in keys_to_clear:
        _memory_cache.pop(key, None)

    if _redis_disabled:
        return
    client = get_redis_client()
    if client is None:
        return
    try:
        await client.delete(f"course_content:{course_id}")
        await client.delete(f"course_processed:{course_id}")
    except Exception as e:
        # Graceful fallback: disable Redis permanently for this run if connection fails
        print(f"[Cache Utils] Disabling Redis caching due to connection failure: {e}")
        _redis_disabled = True


async def clear_admin_courses_cache() -> None:
    global _redis_disabled, _memory_cache
    keys_to_clear = [key for key in _memory_cache if key.startswith("admin_courses:")]
    for key in keys_to_clear:
        _memory_cache.pop(key, None)

    if _redis_disabled:
        return
    client = get_redis_client()
    if client is None:
        return
    try:
        keys = []
        async for key in client.scan_iter(match="admin_courses:*"):
            keys.append(key)
        if keys:
            await client.delete(*keys)
    except Exception as e:
        print(f"[Cache Utils] Disabling Redis caching due to connection failure: {e}")
        _redis_disabled = True
