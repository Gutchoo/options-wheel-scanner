from typing import Optional, Any
from datetime import datetime, timedelta
import threading


class CacheService:
    """Simple in-memory cache with TTL support."""

    def __init__(self):
        self._cache: dict[str, tuple[Any, datetime]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None

            value, expires_at = self._cache[key]
            if datetime.now() > expires_at:
                del self._cache[key]
                return None

            return value

    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value with TTL in seconds."""
        with self._lock:
            expires_at = datetime.now() + timedelta(seconds=ttl)
            self._cache[key] = (value, expires_at)

    def clear(self):
        with self._lock:
            self._cache.clear()


# Global cache instance
cache_service = CacheService()
