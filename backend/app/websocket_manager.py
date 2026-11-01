from fastapi import WebSocket

class Manager:
    def __init__(self):
        self.conns: dict[str, set[WebSocket]] = {}

    async def connect(self, uid: str, ws: WebSocket):
        await ws.accept()
        self.conns.setdefault(uid, set()).add(ws)

    def disconnect(self, uid: str, ws: WebSocket):
        self.conns.get(uid, set()).discard(ws)

    async def broadcast(self, uid: str, msg: dict):
        for ws in list(self.conns.get(uid, ())):
            try:
                await ws.send_json(msg)
            except Exception:
                self.disconnect(uid, ws)

manager = Manager()
