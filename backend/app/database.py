import os
import asyncpg

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  started_by UUID REFERENCES devices(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON sessions(user_id, status);
"""

pool: asyncpg.Pool | None = None

async def init():
    global pool
    pool = await asyncpg.create_pool(os.environ["DATABASE_URL"])
    async with pool.acquire() as c:
        await c.execute(SCHEMA)

async def close():
    if pool:
        await pool.close()

def session_dict(r):
    if not r:
        return None
    return {
        "id": str(r["id"]),
        "start_time": r["start_time"].isoformat(),
        "end_time": r["end_time"].isoformat(),
        "status": r["status"],
    }

async def active_session(user_id):
    async with pool.acquire() as c:
        r = await c.fetchrow(
            "SELECT * FROM sessions WHERE user_id=$1 AND status='active' "
            "AND end_time>now() ORDER BY start_time DESC LIMIT 1", user_id)
    return session_dict(r)
