from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from . import database
from .websocket_manager import manager

@asynccontextmanager
async def lifespan(app):
    await database.init()
    yield
    await database.close()

app = FastAPI(lifespan=lifespan)

class RegisterIn(BaseModel):
    pairing_code: str
    device_name: str
    platform: str  # "android" | "ios"

class StartIn(BaseModel):
    user_id: UUID
    device_id: UUID
    minutes: int = 25

class StopIn(BaseModel):
    user_id: UUID

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/register")
async def register(b: RegisterIn):
    async with database.pool.acquire() as c:
        uid = await c.fetchval("SELECT id FROM users WHERE pairing_code=$1", b.pairing_code)
        if not uid:
            uid = await c.fetchval(
                "INSERT INTO users(pairing_code) VALUES($1) RETURNING id", b.pairing_code)
        did = await c.fetchval(
            "INSERT INTO devices(user_id,name,platform) VALUES($1,$2,$3) RETURNING id",
            uid, b.device_name, b.platform)
    return {"user_id": str(uid), "device_id": str(did)}

@app.post("/sessions/start")
async def start(b: StartIn):
    existing = await database.active_session(b.user_id)
    if existing:
        return existing
    end = datetime.now(timezone.utc) + timedelta(minutes=b.minutes)
    async with database.pool.acquire() as c:
        r = await c.fetchrow(
            "INSERT INTO sessions(user_id,started_by,end_time) VALUES($1,$2,$3) RETURNING *",
            b.user_id, b.device_id, end)
    s = database.session_dict(r)
    await manager.broadcast(str(b.user_id), {"type": "session_started", "session": s})
    return s

@app.post("/sessions/stop")
async def stop(b: StopIn):
    async with database.pool.acquire() as c:
        n = await c.execute(
            "UPDATE sessions SET status='ended' WHERE user_id=$1 AND status='active'", b.user_id)
    await manager.broadcast(str(b.user_id), {"type": "session_ended"})
    return {"ended": n != "UPDATE 0"}

@app.websocket("/ws/{user_id}")
async def ws_endpoint(ws: WebSocket, user_id: UUID):
    uid = str(user_id)
    await manager.connect(uid, ws)
    # Restore state on (re)connect
    s = await database.active_session(user_id)
    await ws.send_json({"type": "state", "session": s})
    try:
        while True:
            await ws.receive_text()  # keepalive pings from client
    except WebSocketDisconnect:
        manager.disconnect(uid, ws)
