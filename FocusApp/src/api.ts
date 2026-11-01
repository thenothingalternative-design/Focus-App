import {API_URL} from './config';

export type Session = {id: string; start_time: string; end_time: string; status: string};

async function post<T>(path: string, body: object): Promise<T> {
  const r = await fetch(API_URL + path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
  return r.json();
}

export const register = (pairing_code: string, device_name: string, platform: string) =>
  post<{user_id: string; device_id: string}>('/register', {pairing_code, device_name, platform});

export const startSession = (user_id: string, device_id: string, minutes = 25) =>
  post<Session>('/sessions/start', {user_id, device_id, minutes});

export const stopSession = (user_id: string) =>
  post<{ended: boolean}>('/sessions/stop', {user_id});
