import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'bom_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8시간

// 서버 메모리에 세션 저장 (프로덕션에서는 Redis 등 사용 권장)
const sessions = new Map<string, { createdAt: number; expiresAt: number }>();

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(id);
    }
  }
}

export async function createSession(): Promise<string> {
  cleanExpiredSessions();

  const sessionId = generateSessionId();
  const now = Date.now();

  sessions.set(sessionId, {
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE * 1000,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return false;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return false;
  }

  return true;
}

export function validateSessionFromRequest(request: NextRequest): boolean {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return false;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return false;
  }

  return true;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    sessions.delete(sessionId);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
