import {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {PAIRING_CODE, WS_URL} from './config';
import {Session, register, startSession, stopSession} from './api';
import {setBlocking} from './blocker';

type Ids = {userId: string; deviceId: string};

export function useSession() {
  const [ids, setIds] = useState<Ids | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  // 1. Register this device
  useEffect(() => {
    register(PAIRING_CODE, `${Platform.OS}-device`, Platform.OS)
      .then(r => setIds({userId: r.user_id, deviceId: r.device_id}))
      .catch(e => setError(String(e)));
  }, []);

  // 2. WebSocket with auto-reconnect (server sends current state on every connect)
  useEffect(() => {
    if (!ids) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    let ping: ReturnType<typeof setInterval>;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}/ws/${ids.userId}`);
      ws.onopen = () => {
        setConnected(true);
        ping = setInterval(() => ws?.send('ping'), 20000);
      };
      ws.onmessage = e => {
        const m = JSON.parse(e.data);
        if (m.type === 'state' || m.type === 'session_started') setSession(m.session);
        else if (m.type === 'session_ended') setSession(null);
      };
      ws.onclose = () => {
        setConnected(false);
        clearInterval(ping);
        if (!closed) retry = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      ws?.close();
    };
  }, [ids]);

  // 3. Countdown driven by server end_time
  useEffect(() => {
    if (!session) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session]);

  const remainingMs = session ? Math.max(0, Date.parse(session.end_time) - now) : 0;
  const active = remainingMs > 0;

  // 4. Blocking follows session state
  useEffect(() => {
    setBlocking(active);
  }, [active]);

  const start = useCallback(async () => {
    if (!ids) return;
    try {
      setSession(await startSession(ids.userId, ids.deviceId, 25));
    } catch (e) {
      setError(String(e));
    }
  }, [ids]);

  const stop = useCallback(async () => {
    if (!ids) return;
    try {
      await stopSession(ids.userId);
      setSession(null);
    } catch (e) {
      setError(String(e));
    }
  }, [ids]);

  return {connected, active, remainingMs, start, stop, error};
}
