import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'bom_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8시간

// 환경 변수에서 시크릿 키 가져오기
const SECRET_KEY = process.env.SESSION_SECRET || 'bom-production-system-secret-key-2024';

// 간단한 해시 함수 (Edge Runtime 호환)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // SECRET_KEY를 포함하여 더 안전하게
  const combined = str + SECRET_KEY;
  let hash2 = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash2 = ((hash2 << 5) + hash2) + combined.charCodeAt(i);
  }
  return Math.abs(hash).toString(16) + Math.abs(hash2).toString(16);
}

// 세션 토큰 생성
function createSessionToken(expiresAt: number): string {
  const payload = `authenticated:${expiresAt}`;
  const sig = simpleHash(payload);
  return `${payload}:${sig}`;
}

// 세션 토큰 검증
function verifySessionToken(token: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const [status, expiresAtStr, signature] = parts;
    const payload = `${status}:${expiresAtStr}`;

    // 서명 검증
    const expectedSig = simpleHash(payload);
    if (signature !== expectedSig) return false;

    // 만료 시간 확인
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || expiresAt < Date.now()) return false;

    return status === 'authenticated';
  } catch {
    return false;
  }
}

export async function createSession(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const token = createSessionToken(expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return token;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return verifySessionToken(token);
}

export function validateSessionFromRequest(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return verifySessionToken(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
